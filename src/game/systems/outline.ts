import type * as Phaser from 'phaser'

// Máscara de opacidade (1 = pixel opaco) de um ou mais frames do MESMO tamanho, sobrepostos.
// Serve para o hit test por silhueta e para o outline de hover de um grupo (ex.: `computer` +
// `desk-lamp`, que são camadas do mesmo canvas).
export interface AlphaMask {
  width: number
  height: number
  data: Uint8Array
}

export function buildAlphaMask(scene: Phaser.Scene, parts: Array<{ key: string; frame?: string | number }>): AlphaMask {
  const first = scene.textures.getFrame(parts[0].key, parts[0].frame)
  const width = first.cutWidth
  const height = first.cutHeight
  const data = new Uint8Array(width * height)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('outline: canvas 2D indisponível')

  for (const part of parts) {
    const frame = scene.textures.getFrame(part.key, part.frame)
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(
      frame.source.image as CanvasImageSource,
      frame.cutX,
      frame.cutY,
      frame.cutWidth,
      frame.cutHeight,
      0,
      0,
      frame.cutWidth,
      frame.cutHeight,
    )
    const px = ctx.getImageData(0, 0, width, height).data
    for (let i = 0; i < data.length; i++) if (px[i * 4 + 3] > 0) data[i] = 1
  }
  return { width, height, data }
}

export function maskAt(mask: AlphaMask, x: number, y: number): boolean {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  if (ix < 0 || iy < 0 || ix >= mask.width || iy >= mask.height) return false
  return mask.data[iy * mask.width + ix] === 1
}

// Caixa dos pixels opacos (px do canvas); `null` se a máscara estiver vazia.
export function maskBounds(mask: AlphaMask) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (!mask.data[y * mask.width + x]) continue
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x + 1)
      y1 = Math.max(y1, y + 1)
    }
  }
  return x0 === Infinity ? null : { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

// Espessura do anel de hover em volta da silhueta (dourado + escuro).
export const OUTLINE_PAD = 2

// Gera (uma vez por chave) a textura do outline de hover (bíblia, regra 13): anel de 1 px
// `color` (gold-2), 4-vizinhança, por fora dos pixels opacos da máscara, e em volta dele um
// segundo anel de 1 px `edge` (a cor `outline` da paleta). O anel escuro garante contraste sobre
// fundos claros (tampo `wood-6`, poça da luminária à noite), onde o dourado sozinho quase some;
// sobre fundos escuros quem aparece é o dourado. A textura sai com OUTLINE_PAD px de folga em
// cada lado (w+4 × h+4), então vai em (x-2, y-2) do canto do sprite.
// Com `edge = null` sai só o anel interno de `color` (o anel do aviso de interagível, branco),
// na mesma textura w+4 × h+4 para usar a mesma posição.
export function ensureOutlineTexture(
  scene: Phaser.Scene,
  outKey: string,
  mask: AlphaMask,
  color: number,
  edge: number | null,
): string {
  if (scene.textures.exists(outKey)) return outKey
  const { width: w, height: h } = mask
  const ow = w + OUTLINE_PAD * 2
  const oh = h + OUTLINE_PAD * 2
  // 0 = vazio, 1 = sprite, 2 = anel dourado, 3 = anel escuro (coordenadas da textura).
  const kind = new Uint8Array(ow * oh)
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= ow || y >= oh ? 0 : kind[y * ow + x])
  const near = (x: number, y: number, k: number) =>
    at(x - 1, y) === k || at(x + 1, y) === k || at(x, y - 1) === k || at(x, y + 1) === k
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) if (mask.data[y * w + x]) kind[(y + OUTLINE_PAD) * ow + x + OUTLINE_PAD] = 1
  }
  for (const k of [2, 3]) {
    const ring: number[] = []
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) if (!kind[y * ow + x] && near(x, y, k - 1)) ring.push(y * ow + x)
    for (const i of ring) kind[i] = k
  }

  const tex = scene.textures.createCanvas(outKey, ow, oh)
  if (!tex) throw new Error(`outline: não foi possível criar ${outKey}`)
  const ctx = tex.getContext()
  const out = ctx.createImageData(ow, oh)
  for (let i = 0; i < kind.length; i++) {
    if (kind[i] < 2 || (kind[i] === 3 && edge === null)) continue
    const c = kind[i] === 2 ? color : (edge ?? color)
    out.data[i * 4] = (c >> 16) & 255
    out.data[i * 4 + 1] = (c >> 8) & 255
    out.data[i * 4 + 2] = c & 255
    out.data[i * 4 + 3] = 255
  }
  ctx.putImageData(out, 0, 0)
  tex.refresh()
  return outKey
}
