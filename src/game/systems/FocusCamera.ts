import * as Phaser from 'phaser'
import { focusZoom, rectCenter, roomView, snapCenter, type CameraView, type Rect, type RoomFraming } from './cameraMath'
import { canPan, clampView, panBounds, STEP_DURATION, zoomAround, zoomRange, type Point } from './gestures'
import { prefersReducedMotion } from './motion'

export const FOCUS_DURATION = 400
const FOCUS_EASE = 'Cubic.easeOut'

export type FocusState = 'room' | 'zooming-in' | 'focused' | 'zooming-out'

// Controla a câmera principal do quarto:
// - 'room': quarto com o maior zoom inteiro em que a área segura cabe (o alto das paredes pode
//   ser cortado em telas baixas; ver cameraMath.roomView);
// - 'zooming-in' → 'focused': pan + zoomTo até o objeto (instantâneo com reduced-motion);
// - 'zooming-out' → 'room': volta à vista que o visitante tinha antes de abrir (M5).
// No estado 'room' o visitante pode mudar o zoom em degraus inteiros (pinça/roda, `zoomTo`) e
// arrastar (`panFrom`), sempre dentro de `panBounds` (gestures.ts). Resize volta ao enquadramento.
// O zoom final é sempre inteiro; só os quadros intermediários da animação são fracionários.
// Em resize a câmera é reenquadrada na hora (ou ao fim da animação em curso).
export class FocusCamera {
  private _state: FocusState = 'room'
  private target: Rect | null = null
  private pendingResize = false
  private afterRelease: Array<() => void> = []
  // Incrementa a cada animação; callbacks de animações canceladas são descartados.
  private generation = 0
  private readonly cam: Phaser.Cameras.Scene2D.Camera
  // Vista do visitante antes de abrir um objeto; o zoom-out volta para ela.
  private before: CameraView | null = null
  // Troca de degrau em curso (pinça/roda) e a vista final dela.
  private stepTween?: Phaser.Tweens.Tween
  private stepTarget: CameraView | null = null

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly framing: RoomFraming,
  ) {
    this.cam = scene.cameras.main
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this)
    this.snapToRoom()
  }

  get state(): FocusState {
    return this._state
  }

  get roomZoom(): number {
    return this.roomView().zoom
  }

  private roomView() {
    return roomView(this.cam.width, this.cam.height, this.framing)
  }

  private get screen() {
    return { width: this.cam.width, height: this.cam.height }
  }

  private get bounds() {
    return panBounds(this.framing.full)
  }

  // Vista atual do visitante (a final, se um degrau estiver animando).
  get view(): CameraView {
    return this.stepTarget ?? this.displayed()
  }

  private displayed(): CameraView {
    return { zoom: this.cam.zoom, x: this.cam.scrollX + this.cam.width / 2, y: this.cam.scrollY + this.cam.height / 2 }
  }

  // Arrastar move a câmera? (só no quarto, acima do enquadramento ou com o quarto maior que a tela)
  get canPan(): boolean {
    return this._state === 'room' && canPan(this.view.zoom, this.roomZoom, this.screen, this.framing.full)
  }

  // Muda para o degrau `zoom` (limitado à faixa) mantendo o ponto sob `anchor` (px de tela) no
  // lugar o melhor possível; tween curto, instantâneo com reduced-motion. Só no estado 'room'.
  zoomTo(zoom: number, anchor: Point): boolean {
    if (this._state !== 'room') return false
    const { min, max } = zoomRange(this.roomZoom)
    const z1 = Math.max(min, Math.min(max, Math.round(zoom)))
    if (z1 === this.view.zoom) return false
    const from = this.displayed()
    const free = zoomAround(from, this.screen, from.zoom, z1, anchor)
    const target = clampView({ zoom: z1, ...free }, this.screen, this.bounds)
    this.stopStep()
    if (prefersReducedMotion()) {
      this.apply(target)
      return true
    }
    // O centro segue o ponto fixo da âncora e, aos poucos, a correção do limite do pan.
    const fix = { x: target.x - free.x, y: target.y - free.y }
    this.stepTarget = target
    this.stepTween = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: STEP_DURATION,
      ease: 'Sine.easeOut',
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 1
        const z = from.zoom + (z1 - from.zoom) * t
        const c = zoomAround(from, this.screen, from.zoom, z, anchor)
        this.cam.setZoom(z).centerOn(c.x + fix.x * t, c.y + fix.y * t)
      },
      onComplete: () => this.stopStep(),
    })
    return true
  }

  // Pan a partir de `start` (vista no começo do arrasto) por `dx, dy` px de tela; sem inércia.
  panFrom(start: CameraView, dx: number, dy: number) {
    if (this._state !== 'room') return
    this.stopStep()
    this.apply(clampView({ zoom: start.zoom, x: start.x - dx / start.zoom, y: start.y - dy / start.zoom }, this.screen, this.bounds))
  }

  // Termina a troca de degrau em curso no estado final exato.
  private stopStep() {
    const target = this.stepTarget
    this.stepTween?.remove()
    this.stepTween = undefined
    this.stepTarget = null
    if (target) this.apply(target)
  }

  private apply(view: CameraView) {
    this.cam.setZoom(view.zoom).centerOn(view.x, view.y)
  }

  // Centro do foco, alinhado ao pixel da tela para o zoom final.
  private focusView(rect: Rect) {
    const zoom = focusZoom(this.cam.width, this.cam.height, rect, this.roomZoom)
    const c = rectCenter(rect)
    return { zoom, x: snapCenter(c.x, this.cam.width, zoom), y: snapCenter(c.y, this.cam.height, zoom) }
  }

  // Zoom até `rect` e chama `onDone` ao terminar. `rect = null` (objeto fora do mapa) não move a
  // câmera, mas passa pelo mesmo fluxo de estados. Retorna false se não estava livre.
  focus(rect: Rect | null, onDone: () => void): boolean {
    if (this._state !== 'room') return false
    this.stopStep()
    this.before = this.displayed()
    this.target = rect
    this._state = 'zooming-in'
    const done = () => {
      this._state = 'focused'
      this.flushResize()
      onDone()
    }
    if (!rect) {
      done()
      return true
    }
    const view = this.focusView(rect)
    this.animate(view.x, view.y, view.zoom, done)
    return true
  }

  // Volta para o quarto inteiro e chama `onDone` quando a cena estiver livre.
  // Idempotente: em 'room' chama `onDone` na hora; em 'zooming-out' só segue a animação em curso;
  // durante 'zooming-in' cancela o zoom (o `onDone` do foco não é chamado).
  release(onDone?: () => void) {
    if (this._state === 'room') {
      onDone?.()
      return
    }
    if (this._state === 'zooming-out') {
      if (onDone) this.afterRelease.push(onDone)
      return
    }
    if (onDone) this.afterRelease.push(onDone)
    const moved = this.target !== null
    this.target = null
    this._state = 'zooming-out'
    const finish = () => {
      this._state = 'room'
      this.flushResize()
      const callbacks = this.afterRelease
      this.afterRelease = []
      for (const fn of callbacks) fn()
    }
    if (!moved) {
      // Foco sem zoom (objeto fora do mapa): a câmera não saiu do lugar.
      this.generation++
      finish()
      return
    }
    const view = this.returnView()
    this.animate(view.x, view.y, view.zoom, finish)
  }

  // Vista para onde o zoom-out volta: a de antes do foco (reclampada) ou o enquadramento.
  private returnView(): CameraView {
    const before = this.before
    this.before = null
    if (!before) return this.roomView()
    const { min, max } = zoomRange(this.roomZoom)
    const zoom = Math.max(min, Math.min(max, before.zoom))
    return clampView({ ...before, zoom }, this.screen, this.bounds)
  }

  destroy() {
    this.stopStep()
    this.generation++
    this.afterRelease = []
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this)
  }

  private animate(x: number, y: number, zoom: number, onDone: () => void) {
    const gen = ++this.generation
    if (prefersReducedMotion()) {
      // Interrompe uma animação em curso (resetFX não cobre o zoom).
      this.cam.resetFX()
      this.cam.zoomEffect.reset()
      this.cam.setZoom(zoom).centerOn(x, y)
      onDone()
      return
    }
    let pending = 2
    const step = () => {
      if (gen !== this.generation) return
      pending--
      if (pending === 0) {
        // Garante o estado final exato (zoom inteiro, centro em pixel inteiro).
        this.cam.setZoom(zoom).centerOn(x, y)
        // `onDone` roda depois da pilha atual: este callback é chamado pelo `update` do efeito
        // antes do `effectComplete`, que zera `isRunning`. Se `onDone` começasse outra animação
        // aqui (fila de 'focus-object' no fim do zoom-out), o `effectComplete` do efeito antigo
        // desligaria o efeito novo e o estado ficaria preso em 'zooming-in'.
        queueMicrotask(() => {
          if (gen === this.generation) onDone()
        })
      }
    }
    this.cam.pan(x, y, FOCUS_DURATION, FOCUS_EASE, true, (_cam, progress) => {
      if (progress >= 1) step()
    })
    this.cam.zoomTo(zoom, FOCUS_DURATION, FOCUS_EASE, true, (_cam, progress) => {
      if (progress >= 1) step()
    })
  }

  private snapToRoom() {
    const view = this.roomView()
    this.cam.setZoom(view.zoom).centerOn(view.x, view.y)
  }

  private snapToTarget() {
    if (!this.target) return this.snapToRoom()
    const view = this.focusView(this.target)
    this.cam.setZoom(view.zoom).centerOn(view.x, view.y)
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    this.cam.setSize(gameSize.width, gameSize.height)
    // Resize/rotação: o visitante volta ao enquadramento padrão (zoom base).
    this.stepTween?.remove()
    this.stepTween = undefined
    this.stepTarget = null
    this.before = null
    if (this._state === 'zooming-in' || this._state === 'zooming-out') {
      this.pendingResize = true
      return
    }
    if (this._state === 'room') this.snapToRoom()
    else this.snapToTarget()
  }

  private flushResize() {
    if (!this.pendingResize) return
    this.pendingResize = false
    this.before = null
    if (this._state === 'room') this.snapToRoom()
    else this.snapToTarget()
  }
}
