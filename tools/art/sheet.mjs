// Exportação de sprites: recorte, spritesheet PNG em tira e JSON no formato Hash do Aseprite
// (o Phaser carrega com load.aseprite). Formato e âncoras: docs/arte/biblia-de-arte.md.
import { writeFileSync } from 'node:fs'
import { rgba, writePng } from './lib.mjs'
import { P } from './palette.mjs'

const PALETTE = new Set(Object.values(P).map((h) => h.toLowerCase()))
const hexOf = (px, i) => '#' + [px[i], px[i + 1], px[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')

/** Retângulo que envolve os pixels opacos de todas as telas (inclusivo → {x, y, w, h}). */
export function bounds(layers, W, H) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (const px of layers) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!px[(y * W + x) * 4 + 3]) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

export const grow = (r, m) => ({ x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m })

/** Recorta `rect` de uma tela W×H; o que cai fora fica transparente. */
export function crop(px, W, H, { x, y, w, h }) {
  const out = new Uint8Array(w * h * 4)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const sx = x + i, sy = y + j
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue
    out.set(px.subarray((sy * W + sx) * 4, (sy * W + sx) * 4 + 4), (j * w + i) * 4)
  }
  return out
}

/** Copia os pixels opacos de `src` (sw×sh) para `dst` (dw×dh) em (dx, dy). */
export function blit(dst, dw, dh, src, sw, sh, dx, dy) {
  for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
    const s = (j * sw + i) * 4
    if (!src[s + 3]) continue
    const x = dx + i, y = dy + j
    if (x < 0 || y < 0 || x >= dw || y >= dh) continue
    dst.set(src.subarray(s, s + 4), (y * dw + x) * 4)
  }
}

/** Multiplica a cor (blend MULTIPLY) dos pixels opacos; `keep(i)` = true preserva o pixel i. */
export function multiply(px, tint, keep = () => false) {
  const [tr, tg, tb] = rgba(tint)
  const out = px.slice()
  for (let i = 0; i < out.length / 4; i++) {
    if (!out[i * 4 + 3] || keep(i)) continue
    out[i * 4] = Math.round((out[i * 4] * tr) / 255)
    out[i * 4 + 1] = Math.round((out[i * 4 + 1] * tg) / 255)
    out[i * 4 + 2] = Math.round((out[i * 4 + 2] * tb) / 255)
  }
  return out
}

/** Confere as regras da bíblia: alfa 0 ou 255 e (se `palette`) só cores da paleta. Devolve a lista de erros. */
export function lint(px, { palette = true } = {}) {
  const errors = new Set()
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3]
    if (a !== 0 && a !== 255) errors.add(`alfa ${a}`)
    if (a === 255 && palette && !PALETTE.has(hexOf(px, i))) errors.add(`cor fora da paleta ${hexOf(px, i)}`)
  }
  return [...errors]
}

/**
 * Grava `<dir>/<id>.png` (frames lado a lado) e `<dir>/<id>.json` (Hash do Aseprite).
 * frames: [{ px (tela do quarto), duration, palette? }]; tags: [{ name, from, to }];
 * rect: recorte na tela do quarto; anchor: [x, y] em px da tela do quarto; meta: vai em meta.quartoPixel.
 * inner (opcional): {x, y, w, h} dentro de cada célula da tira. Com ele, `frames[n].frame` aponta só para essa
 * região (a ilustração-base) e o resto da célula é sangria declarada no meta (visões de perto, specs §3).
 */
export function writeSprite({ dir, id, W, H, frames, tags, rect, anchor, meta = {}, inner }) {
  const { w, h } = rect
  const sheetW = w * frames.length
  const sheet = new Uint8Array(sheetW * h * 4)
  const cropped = frames.map((f) => crop(f.px, W, H, rect))
  const problems = []
  cropped.forEach((c, n) => {
    blit(sheet, sheetW, h, c, w, h, n * w, 0)
    for (const e of lint(c, { palette: frames[n].palette !== false })) problems.push(`${id} frame ${n}: ${e}`)
  })
  if (problems.length) throw new Error(problems.slice(0, 10).join('\n'))

  const ax = anchor[0] - rect.x, ay = anchor[1] - rect.y
  const json = {
    frames: Object.fromEntries(frames.map((f, n) => [`${id} ${n}`, {
      frame: inner ? { x: n * w + inner.x, y: inner.y, w: inner.w, h: inner.h } : { x: n * w, y: 0, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: inner?.w ?? w, h: inner?.h ?? h },
      sourceSize: { w: inner?.w ?? w, h: inner?.h ?? h },
      duration: f.duration ?? 100,
      pivot: { x: ax / w, y: ay / h },
    }])),
    meta: {
      app: 'quarto-pixel tools/art',
      version: '1.0',
      image: `${id}.png`,
      format: 'RGBA8888',
      size: { w: sheetW, h },
      scale: '1',
      frameTags: tags.map((t) => ({ direction: 'forward', ...t })),
      layers: [],
      slices: [],
      quartoPixel: { anchor: [ax, ay], ...meta },
    },
  }
  writePng(`${dir}/${id}.png`, sheet, sheetW, h)
  writeFileSync(`${dir}/${id}.json`, JSON.stringify(json, null, 2) + '\n')
  return { id, w, h, ax, ay, frames: cropped, count: frames.length, tags, meta: json.meta }
}
