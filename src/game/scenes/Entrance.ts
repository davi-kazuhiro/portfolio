import * as Phaser from 'phaser'
import { PALETTE } from '../assets'
import { EventBus } from '../EventBus'
import type { InteractableId } from '../objects/registry'
import { createLocalAnims, frameNames, frameTags, tagFrames } from '../objects/spriteMeta'
import { GameAudio } from '../systems/Audio'
import { snapCenter } from '../systems/cameraMath'
import { availableTag, doorTag, ENTRANCE, entranceView, worldToScreen } from '../systems/entranceMath'
import { prefersReducedMotion } from '../systems/motion'
import { parsePeriod, periodAt, type Period } from '../systems/period'

// Dados passados ao Room na troca de cena.
export interface RoomStartData {
  // Pedido do menu acessível ('focus-object') feito na porta: o Room abre com o fluxo normal.
  focus?: InteractableId
  // Entrou pela animação da porta: o Room termina o clarão (fade-in).
  via?: 'door'
  // Período escolhido no HUD enquanto estava na porta.
  period?: Period
}

// "Atravessar" a porta: zoom rápido + clarão cream-3, e o Room desfaz o clarão.
const THROUGH_MS = 160
export const THROUGH_FADE_IN_MS = 250
const THROUGH_ZOOM = 1.5
export const FLASH_RGB = [(PALETTE.cream3 >> 16) & 0xff, (PALETTE.cream3 >> 8) & 0xff, PALETTE.cream3 & 0xff] as const

// Profundidades = ordem de desenho (spec 2-porta, "Camadas e arquivos"). As colunas laterais
// ficam com o fundo.
const DEPTH = { 'entrance-bg': 0, 'door-interior': 1, door: 2, 'door-light': 3, 'door-knob-glow': 4 } as const
// Camadas que só trocam de tag com o período (`day`/`dusk`/`night`).
const PERIOD_LAYERS = ['entrance-bg', 'door-interior', 'door-light'] as const

// Porta do quarto: tela de entrada (docs/arte/specs/2-porta.md).
// Clique/toque na folha, 'entrance-enter' ou Enter/Espaço com o foco no canvas/body → a porta
// abre (≈340 ms) → zoom + clarão → Room. Com reduced-motion, corte direto. 'focus-object' (menu
// acessível) entra direto e o Room abre o objeto pedido.
export class Entrance extends Phaser.Scene {
  private period: Period = 'day'
  private requestedPeriod?: Period
  private layers = new Map<string, Phaser.GameObjects.Sprite>()
  private door?: Phaser.GameObjects.Sprite
  private glow?: Phaser.GameObjects.Sprite
  private leaf?: Phaser.GameObjects.Zone
  private columns: Phaser.GameObjects.Sprite[] = []
  private zoom = 1
  private view = { x: 0, y: 0 }
  private hovered = false
  private opening = false
  private roomData?: RoomStartData
  private unsubscribers: Array<() => void> = []

  constructor() {
    super('Entrance')
  }

  create() {
    this.opening = false
    this.roomData = undefined
    this.hovered = false
    const forced = import.meta.env.DEV ? parsePeriod(new URLSearchParams(window.location.search).get('period')) : null
    this.requestedPeriod = forced ?? undefined
    this.period = forced ?? periodAt(new Date())

    for (const key of PERIOD_LAYERS) this.layers.set(key, this.addAt(key))
    this.door = this.addAt('door')
    this.glow = this.addAt('door-knob-glow').setVisible(false)
    createLocalAnims(this, this.door)
    createLocalAnims(this, this.glow)
    this.applyPeriod()

    const { leaf } = ENTRANCE
    this.leaf = this.add.zone(leaf.x, leaf.y, leaf.width, leaf.height).setOrigin(0, 0).setInteractive({ cursor: 'pointer' })
    this.leaf.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => this.setHover(true))
    this.leaf.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.setHover(false))
    this.leaf.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => this.enter())

    this.layout()
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this)
    // Enter/Espaço só com o foco no canvas ou no body: com o foco num controle do DOM (menu
    // acessível, HUD), a tecla é dele. Sem addKey/captura: Tab e o resto continuam no DOM.
    this.input.keyboard?.on('keydown', this.onKey, this)

    this.unsubscribers.push(
      EventBus.on('entrance-enter', () => this.enter()),
      EventBus.on('focus-object', (id) => this.enter(id)),
      EventBus.on('period-request', (period) => {
        this.requestedPeriod = period
        this.period = period
        this.applyPeriod()
        EventBus.emit('period-changed', period)
      }),
    )
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this)

    GameAudio.of(this.game).attach(this)
    EventBus.emit('scene-ready', this.scene.key)
    EventBus.emit('period-changed', this.period)
  }

  // Sprite na posição `meta.quartoPixel.at` da ilustração (origem = pivot (0, 0) do frame).
  private addAt(key: keyof typeof DEPTH) {
    const texture = this.textures.get(key)
    const sprite = this.add.sprite(0, 0, key, frameNames(texture)[0]).setOrigin(0, 0).setDepth(DEPTH[key])
    const at = atOf(texture)
    sprite.setPosition(at[0], at[1])
    return sprite
  }

  // Tags do período (pré-tingidas: sem tint). Sheet sem a tag pedida usa a de dia.
  private applyPeriod() {
    for (const sprite of [...this.layers.values(), ...this.columns]) showTag(sprite, this.period, 'day')
    if (this.door && !this.opening) showTag(this.door, doorTag('closed', this.period), 'closed')
  }

  // Câmera: zoom inteiro, ilustração centrada (alinhada ao pixel) e colunas laterais repetidas.
  private layout() {
    const { width, height } = this.scale
    const v = entranceView(width, height)
    const cam = this.cameras.main
    this.zoom = v.zoom
    const cx = snapCenter(ENTRANCE.width / 2, width, v.zoom)
    const cy = snapCenter(ENTRANCE.height / 2, height, v.zoom)
    this.view = { x: cx - width / 2 / v.zoom, y: cy - height / 2 / v.zoom }
    if (!this.opening) cam.setZoom(v.zoom)
    cam.centerOn(cx, cy)

    if (this.columns.length !== v.sideColumns * 2) {
      for (const c of this.columns) c.destroy()
      this.columns = []
      const key = 'entrance-wall-column'
      const frame = frameNames(this.textures.get(key))[0]
      for (let i = 0; i < v.sideColumns; i++) {
        for (const x of [-ENTRANCE.column * (i + 1), ENTRANCE.width + ENTRANCE.column * i]) {
          const col = this.add.sprite(x, 0, key, frame).setOrigin(0, 0).setDepth(DEPTH['entrance-bg'])
          showTag(col, this.period, 'day')
          this.columns.push(col)
        }
      }
    }
    if (this.hovered) this.emitHover()
  }

  private setHover(over: boolean) {
    if (this.opening && over) return
    if (over === this.hovered) return
    this.hovered = over
    if (this.glow) {
      this.glow.setVisible(over)
      if (over && !prefersReducedMotion() && this.glow.anims.exists('hover')) this.glow.play('hover')
      else this.glow.anims.stop()
    }
    if (over) this.emitHover()
    else EventBus.emit('door-hover', null)
  }

  private emitHover() {
    EventBus.emit('door-hover', worldToScreen(ENTRANCE.knob, this.view, this.zoom))
  }

  private onKey(event: KeyboardEvent) {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return
    const active = document.activeElement
    if (active && active !== document.body && active !== this.game.canvas) return
    this.enter()
  }

  // Entrada. Com `focus` (menu acessível) ou reduced-motion: direto, sem animação.
  private enter(focus?: InteractableId) {
    if (this.roomData) {
      // A troca já foi pedida: o pedido do menu vai junto (o objeto é lido no create do Room).
      if (focus) this.roomData.focus = focus
      return
    }
    if (!focus && this.opening) return
    if (!this.opening) GameAudio.of(this.game).play('sfx-door')
    this.setHover(false)
    this.leaf?.disableInteractive()
    if (focus || prefersReducedMotion()) {
      this.goToRoom({ focus })
      return
    }
    this.opening = true
    const door = this.door
    const open = door && availableTag(frameTags(door.texture).map((t) => t.name), doorTag('open', this.period), 'open')
    if (!door || !open || !door.anims.exists(open)) {
      this.through()
      return
    }
    door.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.through())
    door.play({ key: open, repeat: 0 })
  }

  // Zoom rápido na porta aberta + clarão cream-3; o Room desfaz o clarão.
  private through() {
    if (this.roomData) return
    const cam = this.cameras.main
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.goToRoom({ via: 'door' }))
    cam.zoomTo(this.zoom * THROUGH_ZOOM, THROUGH_MS, 'Quad.easeIn')
    cam.fadeOut(THROUGH_MS, FLASH_RGB[0], FLASH_RGB[1], FLASH_RGB[2])
  }

  private goToRoom(data: RoomStartData) {
    if (this.roomData) {
      if (data.focus) this.roomData.focus = data.focus
      return
    }
    this.roomData = { ...data, period: this.requestedPeriod }
    this.scene.start('Room', this.roomData)
  }

  private cleanup() {
    for (const off of this.unsubscribers) off()
    this.unsubscribers = []
    this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this)
    this.input.keyboard?.off('keydown', this.onKey, this)
    if (this.hovered) EventBus.emit('door-hover', null)
    this.hovered = false
    this.layers.clear()
    this.columns = []
    this.door = undefined
    this.glow = undefined
    this.leaf = undefined
  }
}

// `meta.quartoPixel.at` ([x, y] na ilustração); sem ele, (0, 0).
function atOf(texture: Phaser.Textures.Texture): [number, number] {
  const at = (texture.customData as { meta?: { quartoPixel?: { at?: unknown } } } | undefined)?.meta?.quartoPixel?.at
  return Array.isArray(at) && at.length === 2 && at.every((n) => typeof n === 'number') ? [at[0], at[1]] : [0, 0]
}

// Mostra o primeiro frame da tag (ou da tag de reserva).
function showTag(sprite: Phaser.GameObjects.Sprite, wanted: string, fallback: string) {
  const tags = frameTags(sprite.texture)
  const name = availableTag(
    tags.map((t) => t.name),
    wanted,
    fallback,
  )
  const tag = tags.find((t) => t.name === name)
  const frame = tag ? tagFrames(sprite.texture, tag)[0] : undefined
  if (frame) sprite.setFrame(frame)
}
