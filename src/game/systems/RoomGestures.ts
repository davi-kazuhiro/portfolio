import * as Phaser from 'phaser'
import type { FocusCamera } from './FocusCamera'
import { isTap, pinchGeometry, pinchZoom, stepZoom, TAP_SLOP } from './gestures'
import type { CameraView } from './cameraMath'

// Intervalo mínimo entre dois degraus pela roda do mouse (trackpads mandam rajadas de eventos).
const WHEEL_STEP_MS = 140

export interface RoomGestureHooks {
  // Um arrasto ou pinça começou: a cena tira o hover.
  onGestureStart: () => void
  // O último dedo saiu da tela (toque não tem "mouse fora"; a cena limpa o hover).
  onTouchEnd: () => void
}

// Gestos do quarto (M5, docs/design/game-design.md "Interação por dispositivo"):
// - um dedo ou mouse arrastando = pan (só acima do enquadramento ou com o quarto maior que a tela);
// - pinça = zoom em degraus inteiros em volta do ponto entre os dedos;
// - roda do mouse = um degrau por vez em volta do cursor;
// - toque = abrir só se foi curto e quase parado (`acceptsTap`); arrasto e pinça nunca abrem.
// As regras são de `gestures.ts`; aqui só a ligação com os ponteiros do Phaser.
export class RoomGestures {
  // O gesto atual (do primeiro dedo/botão para baixo até o último subir) teve arrasto ou pinça.
  private gestureMoved = false
  private gesturePinched = false
  private dragging = false
  private dragAnchor: { pointerId: number; x: number; y: number; view: CameraView } | null = null
  private pinchStart: { dist: number; zoom: number } | null = null
  private lastWheel = -Infinity

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly cam: FocusCamera,
    private readonly hooks: RoomGestureHooks,
  ) {
    // Por padrão o Phaser só tem 1 ponteiro de toque; a pinça precisa de 2.
    if (!scene.input.pointer2) scene.input.addPointer(1)
    const input = scene.input
    input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this)
    input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this)
    input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this)
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this)
    input.on(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this)
  }

  // Durante arrasto/pinça o hover é ignorado.
  get busy(): boolean {
    return this.dragging || this.pinchStart !== null || (this.gestureMoved && this.anyDown())
  }

  // O ponteiro que subiu sobre um objeto conta como toque/clique? Mouse não tem limite de tempo.
  acceptsTap(pointer: Phaser.Input.Pointer): boolean {
    if (this.gesturePinched || this.gestureMoved) return false
    return isTap(pointer.getDistance(), pointer.getDuration(), pointer.wasTouch ? undefined : Infinity)
  }

  destroy() {
    const input = this.scene.input
    input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this)
    input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this)
    input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this)
    input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this)
    input.off(Phaser.Input.Events.POINTER_WHEEL, this.onWheel, this)
  }

  private touchesDown(): Phaser.Input.Pointer[] {
    return this.scene.input.manager.pointers.filter((p) => p.isDown && p.id > 0)
  }

  private anyDown(): boolean {
    return this.scene.input.manager.pointers.some((p) => p.isDown)
  }

  private onDown(pointer: Phaser.Input.Pointer) {
    const touches = this.touchesDown()
    if (pointer.wasTouch && touches.length >= 2) {
      // Segundo dedo: começa a pinça; o arrasto do primeiro para.
      const g = pinchGeometry(touches[0], touches[1])
      this.pinchStart = { dist: g.dist, zoom: this.cam.view.zoom }
      this.gesturePinched = true
      this.dragging = false
      this.dragAnchor = null
      this.hooks.onGestureStart()
      return
    }
    const othersDown = this.scene.input.manager.pointers.some((p) => p !== pointer && p.isDown)
    if (othersDown) return
    // Gesto novo.
    this.gestureMoved = false
    this.gesturePinched = false
    this.dragging = false
    this.dragAnchor = null
    if (!pointer.wasTouch && !pointer.leftButtonDown()) return
    this.dragAnchor = { pointerId: pointer.id, x: pointer.x, y: pointer.y, view: this.cam.view }
  }

  private onMove(pointer: Phaser.Input.Pointer) {
    if (this.pinchStart) {
      const touches = this.touchesDown()
      if (touches.length < 2) return
      const g = pinchGeometry(touches[0], touches[1])
      const zoom = pinchZoom(this.pinchStart.zoom, this.pinchStart.dist, g.dist, this.cam.roomZoom)
      if (zoom !== this.cam.view.zoom) this.cam.zoomTo(zoom, g.mid)
      return
    }
    const anchor = this.dragAnchor
    if (!anchor || anchor.pointerId !== pointer.id || !pointer.isDown) return
    if (!this.dragging) {
      if (pointer.getDistance() < TAP_SLOP) return
      if (!this.gestureMoved) {
        this.gestureMoved = true
        this.hooks.onGestureStart()
      }
      if (!this.cam.canPan) return
      // O pan começa no ponto em que o arrasto foi reconhecido (sem salto de 8 px).
      this.dragging = true
      this.dragAnchor = { ...anchor, x: pointer.x, y: pointer.y, view: this.cam.view }
      return
    }
    // A roda pode mudar o degrau no meio de um arrasto com o mouse: reancora.
    if (this.cam.view.zoom !== anchor.view.zoom) {
      this.dragAnchor = { ...anchor, x: pointer.x, y: pointer.y, view: this.cam.view }
      return
    }
    this.cam.panFrom(anchor.view, pointer.x - anchor.x, pointer.y - anchor.y)
  }

  private onUp(pointer: Phaser.Input.Pointer) {
    if (this.pinchStart && this.touchesDown().length < 2) {
      // Fim da pinça; o dedo que sobrou não arrasta (evita salto).
      this.pinchStart = null
      this.dragAnchor = null
    }
    if (!this.anyDown()) {
      this.dragging = false
      this.dragAnchor = null
      if (pointer.wasTouch) this.hooks.onTouchEnd()
    }
  }

  private onWheel(pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) {
    // Com painel aberto ou durante o zoom de foco a roda não é do quarto.
    if (this.cam.state !== 'room' || dy === 0) return
    const now = this.scene.time.now
    if (now - this.lastWheel < WHEEL_STEP_MS) return
    const view = this.cam.view
    const zoom = stepZoom(view.zoom, -Math.sign(dy), this.cam.roomZoom)
    if (zoom === view.zoom) return
    this.lastWheel = now
    this.cam.zoomTo(zoom, { x: pointer.x, y: pointer.y })
  }
}
