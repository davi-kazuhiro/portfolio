import * as Phaser from 'phaser'
import { ROOM_SPRITES } from '../assets'
import { EventBus } from '../EventBus'
import { isoToScreen, tileRectCenter } from '../iso'
import { Interactable } from '../objects/Interactable'
import type { InteractableId } from '../objects/registry'
import { readQuartoPixel, SURFACE_DEPTH_OFFSET } from '../objects/spriteMeta'
import { padRect, type Rect, type RoomFraming } from '../systems/cameraMath'
import { FocusCamera } from '../systems/FocusCamera'
import { DayNight } from '../systems/DayNight'
import { parsePeriod, periodAt, type Period } from '../systems/period'
import { readRoomMap, type PlacedSpec } from '../systems/RoomMap'

// Profundidades (docs/arte/planta-do-quarto.md, "Leitura e oclusão"):
// casca do quarto < luz no piso < objetos de parede < objetos de chão (por col + row da âncora).
const DEPTH = {
  shell: 0,
  shellLayer: 1,
  wall: 5,
  floor: 10,
} as const
const LAYER_STEP = 0.01

// Margem em volta do quarto na visão geral (px do mundo).
const ROOM_PADDING = 8
// Linha de segurança das paredes (planta-do-quarto.md): nenhum interagível passa de 112 px de
// altura nem fica a menos de 1,5 tile do canto do fundo no alto da parede.
const WALL_SAFE_HEIGHT = 112
const WALL_SAFE_OFFSET_TILES = 1.5
// Folga em volta do interagível mais alto (a caixa dele já inclui os 2 px do outline).
const SAFE_MARGIN = 2
// O período é reavaliado a cada minuto (horário local do visitante).
const PERIOD_CHECK_MS = 60_000

// O quarto: room-shell + objetos do Tiled + câmera de foco.
//
// Fluxo de abertura (único para clique e para 'focus-object' vindo da UI):
//   zoom da câmera → 'object-open' (uma vez por foco) → painel abre na UI.
// 'panel-closed' → zoom-out → quarto livre de novo. É idempotente em qualquer estado.
export class Room extends Phaser.Scene {
  private focusCam?: FocusCamera
  private objects = new Map<InteractableId, Interactable>()
  private hoveredId: InteractableId | null = null
  private queuedFocus: InteractableId | null = null
  private unsubscribers: Array<() => void> = []
  private dayNight?: DayNight
  // Profundidade de cada sprite principal já posto (para objetos `surface` acharem o móvel).
  private placedDepth = new Map<string, number>()
  // Período forçado pela URL (só em dev): `?period=day|dusk|night`.
  private forcedPeriod: Period | null = null

  constructor() {
    super('Room')
  }

  create() {
    // Quem está por cima recebe o clique (o caderno sobre o computador).
    this.input.topOnly = true
    if (import.meta.env.DEV) this.forcedPeriod = parsePeriod(new URLSearchParams(window.location.search).get('period'))
    this.dayNight = new DayNight(this, this.currentPeriod())
    const room = readRoomMap(this)

    const shell = this.placeShell(room.shellTopLeft)

    for (const spec of room.decor) {
      if (!this.textures.exists(spec.name)) {
        console.warn(`room.tmj: sprite "${spec.name}" não carregado; ignorado`)
        continue
      }
      this.placeGroup(spec.name, spec)
    }

    // Objetos sobre móvel (`mount: "surface"`) vão depois, quando o móvel já tem profundidade.
    const isSurface = (id: string) =>
      this.textures.exists(id) && readQuartoPixel(this.textures.get(id)).mount === 'surface'
    const interactables = [
      ...room.interactables.filter((s) => !isSurface(s.id)),
      ...room.interactables.filter((s) => isSurface(s.id)),
    ]
    for (const spec of interactables) {
      // Interagível sem sprite (ids do M3 no mapa antes da arte) não fica clicável; o menu de
      // teclado ainda abre o painel dele, sem zoom.
      if (!this.textures.exists(spec.id)) continue
      const { main, layers } = this.placeGroup(spec.id, spec)
      const obj = new Interactable(
        this,
        { id: spec.id, sprite: main, solidLayers: layers.filter((l) => isSolidLayer(l)), layers },
        {
          onHover: (id, over) => this.handleHover(id, over),
          onClick: (id) => this.openObject(id),
        },
      )
      this.objects.set(spec.id, obj)
    }

    this.focusCam = new FocusCamera(this, this.framing(shell))

    // Dia/noite: reavaliado a cada minuto; a troca não mexe na câmera nem no EventBus.
    this.time.addEvent({
      delay: PERIOD_CHECK_MS,
      loop: true,
      callback: () => this.applyPeriod(),
    })

    this.unsubscribers.push(
      EventBus.on('focus-object', (id) => this.requestFocus(id)),
      EventBus.on('panel-closed', () => this.closeObject()),
    )
    // Esc durante o zoom de entrada cancela a abertura (sem 'object-open'). Com o painel aberto,
    // quem trata o Esc é a UI (ela emite 'panel-closed'); aqui só vale o estado 'zooming-in'.
    // Sem addKey/addCapture: o Esc continua chegando ao DOM.
    this.input.keyboard?.on('keydown-ESC', this.cancelOpening, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this)

    EventBus.emit('scene-ready', this.scene.key)
    EventBus.emit('period-changed', this.dayNight.period)
  }

  // A casca vai com o pivot (canto do fundo, no chão) na origem do mundo. Sem pivot, usa a
  // posição do image layer do Tiled.
  private placeShell(topLeft: { x: number; y: number } | null): Rect {
    const key = 'room-shell'
    if (!this.textures.exists(key)) throw new Error('room-shell não carregado')
    const sprite = this.addSprite(key, 0, 0, DEPTH.shell)
    if (!sprite.frame.customPivot && topLeft) sprite.setOrigin(0, 0).setPosition(topLeft.x, topLeft.y)
    else if (topLeft && import.meta.env.DEV) {
      const x = sprite.x - sprite.displayOriginX
      const y = sprite.y - sprite.displayOriginY
      if (x !== topLeft.x || y !== topLeft.y) {
        console.warn(`room.tmj: image layer room-shell em (${topLeft.x}, ${topLeft.y}), pivot do PNG dá (${x}, ${y})`)
      }
    }
    this.placeLayers(key, sprite)
    return {
      x: sprite.x - sprite.displayOriginX,
      y: sprite.y - sprite.displayOriginY,
      width: sprite.width,
      height: sprite.height,
    }
  }

  // Sprite principal na âncora da pegada + camadas no mesmo ponto.
  private placeGroup(key: string, spec: PlacedSpec) {
    const center = tileRectCenter(spec.footprint)
    const p = isoToScreen(center.col, center.row)
    const depth = this.depthOf(key, center.col + center.row)
    const main = this.addSprite(key, Math.round(p.x), Math.round(p.y), depth)
    this.placedDepth.set(key, depth)
    return { main, layers: this.placeLayers(key, main) }
  }

  // Parede: faixa fixa. Chão: col + row da âncora. Sobre móvel: profundidade do móvel +
  // `depthOffset` (acima da mesa e das camadas sólidas dela, abaixo da cadeira e do gabinete).
  private depthOf(key: string, isoDepth: number) {
    const meta = readQuartoPixel(this.textures.get(key))
    if (meta.mount === 'wall-back' || meta.mount === 'wall-left') return DEPTH.wall
    if (meta.mount === 'surface') {
      const base = meta.surfaceOf ? this.placedDepth.get(meta.surfaceOf) : undefined
      if (base !== undefined) return base + (meta.depthOffset ?? SURFACE_DEPTH_OFFSET)
      console.warn(`${key}: móvel "${String(meta.surfaceOf)}" não está no quarto; usando a profundidade do chão`)
    }
    return DEPTH.floor + isoDepth
  }

  // Camadas = sprites cujo JSON diz `layerOf: <key>`, na ordem de ROOM_SPRITES.
  private placeLayers(key: string, main: Phaser.GameObjects.Sprite) {
    const layers: Phaser.GameObjects.Sprite[] = []
    const base = main.depth === DEPTH.shell ? DEPTH.shellLayer : main.depth
    const keys = Object.keys(ROOM_SPRITES).filter(
      (k) => this.textures.exists(k) && readQuartoPixel(this.textures.get(k)).layerOf === key,
    )
    keys.forEach((layerKey, i) => {
      const sync = readQuartoPixel(this.textures.get(layerKey)).syncFramesWith === key ? main : undefined
      layers.push(this.addSprite(layerKey, main.x, main.y, base + LAYER_STEP * (i + 1), sync))
    })
    return layers
  }

  private addSprite(key: string, x: number, y: number, depth: number, syncWith?: Phaser.GameObjects.Sprite) {
    if (!this.dayNight) throw new Error('DayNight não iniciado')
    return this.dayNight.add(key, x, y, depth, syncWith)
  }

  private applyPeriod() {
    const period = this.currentPeriod()
    this.dayNight?.set(period)
    EventBus.emit('period-changed', period)
  }

  private currentPeriod(): Period {
    return this.forcedPeriod ?? periodAt(new Date())
  }

  // Área segura = largura do room-shell × (do topo do interagível mais alto, ou da linha de
  // segurança das paredes, até o fim do piso).
  private framing(shell: Rect): RoomFraming {
    const full = padRect(shell, ROOM_PADDING)
    let top = isoToScreen(WALL_SAFE_OFFSET_TILES, 0).y - WALL_SAFE_HEIGHT
    for (const obj of this.objects.values()) top = Math.min(top, obj.bounds.y)
    // A margem do quarto inteiro não entra na área segura: ela é só folga visual.
    top = Math.max(shell.y, top - SAFE_MARGIN)
    const bottom = shell.y + shell.height
    return { full, safe: { x: shell.x, y: top, width: shell.width, height: bottom - top } }
  }

  private get isFree() {
    return this.focusCam?.state === 'room'
  }

  private handleHover(id: InteractableId, over: boolean) {
    if (over) {
      if (!this.isFree) return
      this.setHovered(id)
    } else if (this.hoveredId === id) {
      this.setHovered(null)
    }
  }

  private setHovered(id: InteractableId | null) {
    if (this.hoveredId === id) return
    if (this.hoveredId) this.objects.get(this.hoveredId)?.setHighlighted(false)
    this.hoveredId = id
    if (id) this.objects.get(id)?.setHighlighted(true)
    EventBus.emit('object-hover', id)
  }

  // 'focus-object' vindo da UI. Se chegar durante o zoom-out (painel acabou de fechar e o
  // visitante já escolheu outro objeto no menu), fica guardado e roda quando a cena ficar livre;
  // só o último pedido vale. Em outros estados ocupados é ignorado, como o clique.
  private requestFocus(id: InteractableId) {
    if (this.focusCam?.state === 'zooming-out') {
      const queued = this.queuedFocus !== null
      this.queuedFocus = id
      if (!queued) {
        this.focusCam.release(() => {
          const next = this.queuedFocus
          this.queuedFocus = null
          if (next) this.openObject(next)
        })
      }
      return
    }
    this.openObject(id)
  }

  // Clique no canvas ou 'focus-object'. Ignorado durante o zoom ou com painel aberto.
  // Objeto que ainda não está no mapa abre sem zoom (a UI continua funcionando).
  private openObject(id: InteractableId) {
    if (!this.focusCam || !this.isFree) return
    const obj = this.objects.get(id)
    this.setHovered(null)
    this.setCursors(false)
    this.focusCam.focus(obj?.focusBounds ?? null, () => EventBus.emit('object-open', id))
  }

  private closeObject() {
    if (!this.focusCam) return
    this.focusCam.release()
    this.setCursors(true)
  }

  private cancelOpening() {
    if (this.focusCam?.state === 'zooming-in') this.closeObject()
  }

  private setCursors(enabled: boolean) {
    for (const obj of this.objects.values()) obj.setCursor(enabled)
  }

  private cleanup() {
    for (const off of this.unsubscribers) off()
    this.unsubscribers = []
    this.input.keyboard?.off('keydown-ESC', this.cancelOpening, this)
    this.focusCam?.destroy()
    this.focusCam = undefined
    this.dayNight?.destroy()
    this.dayNight = undefined
    for (const obj of this.objects.values()) obj.destroy()
    this.objects.clear()
    this.hoveredId = null
    this.queuedFocus = null
    this.placedDepth.clear()
  }
}

// Camada que entra no hover e no clique do principal: não é luz e não pede `hit: "none"`.
// (A `desk-lamp` final tem `hit: "none"`, porque a luminária já está desenhada no `computer`.)
function isSolidLayer(sprite: Phaser.GameObjects.Sprite) {
  const meta = readQuartoPixel(sprite.texture)
  return !meta.light && meta.hit !== 'none'
}
