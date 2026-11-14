import * as Phaser from 'phaser'
import { PALETTE } from '../assets'
import type { Rect } from '../systems/cameraMath'
import {
  buildAlphaMask,
  ensureOutlineTexture,
  maskAt,
  maskBounds,
  OUTLINE_PAD,
  type AlphaMask,
} from '../systems/outline'
import type { InteractableId } from './registry'
import { readQuartoPixel } from './spriteMeta'

// O outline fica logo acima do sprite e de TODAS as suas camadas (inclusive as de luz, que à noite
// cobririam o anel), abaixo do que está na frente (o próximo objeto está a +1 de profundidade).
const OUTLINE_DEPTH = 0.005

export interface InteractableHandlers {
  onHover: (id: InteractableId, over: boolean) => void
  // Soltou o dedo/botão sobre o objeto; quem decide se foi toque ou arrasto é a cena (gestures.isTap).
  onClick: (id: InteractableId, pointer: Phaser.Input.Pointer) => void
}

export interface InteractableParts {
  id: InteractableId
  // Sprite principal (textura = id) e camadas sólidas do mesmo canvas (ex.: `desk-lamp`).
  sprite: Phaser.GameObjects.Sprite
  solidLayers: Phaser.GameObjects.Sprite[]
  // Todas as camadas (sólidas e de luz): o outline vai acima da mais alta.
  layers?: Phaser.GameObjects.Sprite[]
  // Máscara de clique/hover do mesmo canvas (`meta.hitMaskOf`); substitui sprite + camadas sólidas.
  hitMask?: { key: string; frame?: string | number }
}

// Um objeto clicável do quarto: sprite gerado + anel branco de aviso (1 px por fora, piscando
// enquanto o quarto está livre; o tween é da cena, em `Room`) + outline de hover (1 px gold-2
// por fora + 1 px `outline` em volta dele, para contraste em fundo claro; no hover ele substitui
// o anel branco) + área
// de clique pela silhueta (specs.md, "Hover, clique e zoom"):
// - a silhueta é a união do sprite com as camadas sólidas, no frame inicial;
// - `minHit` (px do canvas) amplia o alvo de objetos pequenos em volta do centro da silhueta;
// - quem está por cima ganha o clique (`input.topOnly`, ligado na cena). Decoração não é
//   interativa, então o clique atravessa a cadeira até o computador.
export class Interactable {
  readonly id: InteractableId
  private readonly sprite: Phaser.GameObjects.Sprite
  private readonly outline: Phaser.GameObjects.Image
  // Anel branco de aviso: a cena anima o alfa; aqui só se liga/desliga.
  readonly cue: Phaser.GameObjects.Image
  private cueOn = true
  private highlighted = false
  private readonly focusRect: Rect
  // Lado mínimo (px do mundo) do alvo em dispositivos de toque; 0 = sem ampliação extra.
  private touchMin = 0

  constructor(scene: Phaser.Scene, parts: InteractableParts, handlers: InteractableHandlers) {
    this.id = parts.id
    this.sprite = parts.sprite
    const sprite = parts.sprite
    const meta = readQuartoPixel(sprite.texture)

    const mask = buildAlphaMask(
      scene,
      parts.hitMask
        ? [parts.hitMask]
        : [
            { key: sprite.texture.key, frame: sprite.frame.name },
            ...parts.solidLayers.map((l) => ({ key: l.texture.key, frame: l.frame.name })),
          ],
    )

    // Canto superior esquerdo do canvas no mundo (a origem vem do pivot).
    const left = sprite.x - sprite.displayOriginX
    const top = sprite.y - sprite.displayOriginY

    const outlineKey = ensureOutlineTexture(scene, `${sprite.texture.key}__outline`, mask, PALETTE.accent, PALETTE.outline)
    this.outline = scene.add
      .image(left - OUTLINE_PAD, top - OUTLINE_PAD, outlineKey)
      .setOrigin(0, 0)
      .setDepth(Math.max(sprite.depth, ...(parts.layers ?? []).map((l) => l.depth)) + OUTLINE_DEPTH)
      .setVisible(false)
    const cueKey = ensureOutlineTexture(scene, `${sprite.texture.key}__cue`, mask, PALETTE.cue, null)
    this.cue = scene.add
      .image(this.outline.x, this.outline.y, cueKey)
      .setOrigin(0, 0)
      .setDepth(this.outline.depth)

    const hit = hitTester(mask, meta.minHit, () => this.touchMin)
    sprite.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, mask.width, mask.height),
      hitAreaCallback: (_area: unknown, x: number, y: number) => hit(x, y),
      useHandCursor: true,
    })
    sprite.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => handlers.onHover(this.id, true))
    sprite.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => handlers.onHover(this.id, false))
    sprite.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      handlers.onClick(this.id, pointer)
    })

    // Foco da câmera: `meta.quartoPixel.focus` (px do canvas); sem ele, a caixa da silhueta.
    const local = meta.focus ?? maskBounds(mask) ?? { x: 0, y: 0, width: mask.width, height: mask.height }
    this.focusRect = { x: left + local.x, y: top + local.y, width: local.width, height: local.height }
  }

  setHighlighted(on: boolean) {
    this.highlighted = on
    this.outline.setVisible(on)
    this.cue.setVisible(this.cueOn && !on)
  }

  // Quarto livre: cursor de mão e anel de aviso. Com zoom/painel, nenhum dos dois.
  setInteractiveCue(enabled: boolean) {
    if (this.sprite.input) this.sprite.input.cursor = enabled ? 'pointer' : 'default'
    this.cueOn = enabled
    this.cue.setVisible(enabled && !this.highlighted)
  }

  // Toque (M5): amplia só a área de clique (nunca a arte) para pelo menos `side` px do mundo.
  setTouchMin(side: number) {
    this.touchMin = side
  }

  // Retângulo do mundo que a câmera enquadra no zoom.
  get focusBounds(): Rect {
    return this.focusRect
  }

  // Caixa do outline no mundo (para a câmera garantir que nenhum interagível seja cortado).
  get bounds(): Rect {
    return { x: this.outline.x, y: this.outline.y, width: this.outline.width, height: this.outline.height }
  }

  destroy() {
    // No shutdown do jogo (HMR, desmontagem) o sprite pode já ter sido destruído.
    if (this.sprite.scene) this.sprite.removeInteractive()
    this.sprite.off(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER)
    this.sprite.off(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT)
    this.sprite.off(Phaser.Input.Events.GAMEOBJECT_POINTER_UP)
    this.outline.destroy()
    this.cue.destroy()
  }
}

// Silhueta + alvo mínimo centrado na caixa da silhueta. O mínimo é o maior entre o `minHit` da
// arte e o lado de toque atual (`touchMin()`, só em dispositivos de toque).
function hitTester(mask: AlphaMask, minHit: [number, number] | undefined, touchMin: () => number) {
  const box = maskBounds(mask)
  if (!box) return (x: number, y: number) => maskAt(mask, x, y)
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  return (x: number, y: number) => {
    if (maskAt(mask, x, y)) return true
    const t = touchMin()
    const hw = Math.max(box.width, minHit?.[0] ?? 0, t) / 2
    const hh = Math.max(box.height, minHit?.[1] ?? 0, t) / 2
    return Math.abs(x - cx) <= hw && Math.abs(y - cy) <= hh && (hw > box.width / 2 || hh > box.height / 2)
  }
}
