// Celular (`phone`, M3, interagível: Contato + currículo) deitado sobre a cama. Aprovado em 2026-11-08: grafite (A),
// exportado por build.mjs; a capinha vermelha (B) fica como histórico em build-m3.mjs bed.
// Spec: docs/arte/specs/6-cama-celular.md. Centro em (1,8; 5,8) tiles = (14,4; 46,4) u, sobre a coberta (z 10),
// sprite próprio desenhado por cima do `bed` (mount surface, surfaceOf bed, depthOffset 0,01).
//
// Tela sempre acesa (é o que faz ler "celular" a 1×): sky-0 com reflexo sky-2, uma notificação creme e a câmera.
// - A: aparelho grafite.
// - B: capinha vermelha (borda red-2 em volta da tela, laterais red-1 / red-0).
import { inside, PX } from '../lib.mjs'
import { P } from '../palette.mjs'
import { onPlaneZ, RH, RW, roomCanvas } from '../room.mjs'
import { BED } from './bed.mjs'

const T = (t) => P[t]

/** Caixa do aparelho (u): eixo longo ao longo de x (como a cama), 4 × 2,4 u, 2 px de espessura. */
export const PHONE = { box: [12.4, 16.4, 45.2, 47.6, 10, 11], center: [14.4, 46.4] }

export const PHONE_STYLES = {
  A: { name: 'A — grafite', rim: 'graphite-1', front: 'graphite-1', side: 'graphite-0', hi: 'graphite-3', lip: null },
  B: { name: 'B — capinha vermelha', rim: 'graphite-1', front: 'red-1', side: 'red-0', hi: 'red-3', lip: 'red-2' },
}

/** Pixel da tela (vista de cima, coordenadas do mundo): devolve token ou null fora da tela. */
function screenAt(x, y, [x0, x1, y0, y1]) {
  const sx0 = x0 + 0.55, sx1 = x1 - 0.45, sy0 = y0 + 0.45, sy1 = y1 - 0.45
  if (!(inside(x, sx0, sx1) && inside(y, sy0, sy1))) return null
  if (inside(x, sx1 - 0.55, sx1) && inside(y, (y0 + y1) / 2 - 0.3, (y0 + y1) / 2 + 0.3)) return 'teal-0' // câmera (topo do aparelho em +x)
  if (inside(x, sx0 + 0.9, sx1 - 0.9) && inside(y, sy0 + 0.25, sy0 + 0.25 + PX)) return 'cream-3' // notificação
  const d = (x - sx0) - (y - sy0) * 1.1
  if (inside(d, 1.2, 1.2 + PX * 1.5)) return 'sky-2' // reflexo diagonal
  return 'sky-0'
}

export function renderPhone(style = 'A') {
  const c = roomCanvas()
  const k = PHONE_STYLES[style]
  const bx = PHONE.box
  const [x0, x1, y0, y1] = bx
  c.object([c.box(bx, (f, p, q) => {
    if (f === 'top') {
      const s = screenAt(p, q, bx)
      if (s) return T(s)
      if (k.lip && (p < x0 + 0.3 || p > x1 - 0.3 || q < y0 + 0.3 || q > y1 - 0.3)) return T(k.lip)
      return T(k.rim)
    }
    if (f === 'y') return q > bx[5] - PX ? T(k.hi) : T(k.front)
    return T(k.side)
  })])
  return c
}

const SCREEN_TOKENS = new Set(['sky-0', 'sky-2', 'cream-3', 'teal-0'].map((t) => P[t].toLowerCase()))
const hexAt = (px, i) => '#' + [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')

/** Brilho da tela à noite: elipse no plano da coberta em volta do celular (raios em u). */
export const PHONE_GLOW = { rx: 3.4, ry: 2.7 }

/**
 * Camada `light-phone` (acima do tint): a tela (cores de dia) e um brilho leve na cama em volta do aparelho, que é
 * a própria cama nas cores de dia dentro de uma elipse de borda dura (como o brilho do monitor sobre o tampo).
 */
export function renderLightPhone(phone, bed) {
  const px = new Uint8Array(RW * RH * 4)
  const [cx, cy] = PHONE.center
  for (let sy = 0; sy < RH; sy++) for (let sx = 0; sx < RW; sx++) {
    const i = sy * RW + sx
    if (phone[i * 4 + 3]) {
      if (SCREEN_TOKENS.has(hexAt(phone, i))) px.set(phone.subarray(i * 4, i * 4 + 4), i * 4)
      continue
    }
    if (!bed[i * 4 + 3]) continue
    const [x, y] = onPlaneZ(sx, sy, BED.topZ)
    if (((x - cx) / PHONE_GLOW.rx) ** 2 + ((y - cy) / PHONE_GLOW.ry) ** 2 < 1) px.set(bed.subarray(i * 4, i * 4 + 4), i * 4)
  }
  return px
}
