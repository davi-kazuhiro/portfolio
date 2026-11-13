// Desenho frontal (cenas da porta e visões de perto): tela 2D simples em px, sem projeção.
// Mesmas regras da bíblia: paleta fechada, contorno de 1 px `outline`, sem alfa parcial.
import { rgba } from './lib.mjs'
import { P } from './palette.mjs'

export function flat(W, H) {
  const px = new Uint8Array(W * H * 4)
  const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H
  const color = (c) => rgba(P[c] ?? c) // aceita token ou hex
  const set = (x, y, c) => { if (ok(x, y)) px.set(color(c), (y * W + x) * 4) }
  const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, c) }
  /** Pinta pixel a pixel: fn(x, y) → token/hex ou null (não pinta). */
  const paint = (x, y, w, h, fn) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const c = fn(i, j); if (c) set(i, j, c) }
  }
  const border = (x, y, w, h, c) => { rect(x, y, w, 1, c); rect(x, y + h - 1, w, 1, c); rect(x, y, 1, h, c); rect(x + w - 1, y, 1, h, c) }
  const opaque = (x, y) => ok(x, y) && px[(y * W + x) * 4 + 3] > 0
  const get = (x, y) => (ok(x, y) ? px.subarray((y * W + x) * 4, (y * W + x) * 4 + 4) : null)
  /** Desenha uma "camada" separada e a contorna por dentro (regra 1), depois compõe por cima. */
  const object = (draw, { outline = true } = {}) => {
    const layer = flat(W, H)
    draw(layer)
    if (outline) {
      const edge = []
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (layer.opaque(x, y) && (!layer.opaque(x - 1, y) || !layer.opaque(x + 1, y) || !layer.opaque(x, y - 1) || !layer.opaque(x, y + 1))) edge.push([x, y])
      }
      for (const [x, y] of edge) layer.set(x, y, 'outline')
    }
    for (let i = 0; i < W * H; i++) if (layer.px[i * 4 + 3]) px.set(layer.px.subarray(i * 4, i * 4 + 4), i * 4)
  }
  /** Texto em fonte de pixel (glifos como linhas de '1'/'0'), espaço de 1 px. */
  const text = (x, y, str, font, c) => {
    let cx = x
    for (const ch of str) {
      const g = font[ch]
      g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') set(cx + i, y + j, c) }))
      cx += g[0].length + 1
    }
  }
  return { W, H, px, set, rect, paint, border, opaque, get, object, text }
}

/** Fonte 5×7 só com as letras usadas. */
export const FONT_5x7 = {
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
}
/** Glifos do adesivo "</>" (3×5). */
export const FONT_GLYPH = {
  '<': ['001', '010', '100', '010', '001'],
  '/': ['001', '001', '010', '100', '100'],
  '>': ['100', '010', '001', '010', '100'],
}
