// Grupo do computador (M2): mesa em L no canto do fundo com monitor, teclado, mouse, caneca,
// controle de videogame e luminária. Posições: docs/arte/specs.md §1.
import { hash, inside, PX, shaded } from '../lib.mjs'
import { P } from '../palette.mjs'
import { DESK, KEYBOARD, MONITOR, roomCanvas, toPx } from '../room.mjs'

const T = (t) => P[t]

// Tampo da mesa em L: um tampo só, sem aresta de luz na emenda entre os braços.
// `along` = eixo do veio ('x' no braço A, 'y' no braço B); `hiY` = a borda +y recebe aresta a partir deste x.
const slab = ({ along, hiYFrom = -Infinity }) => (f, p, q, bx) => {
  if (f === 'top') {
    if (p > bx[1] - PX * 1.5 || (q > bx[3] - PX * 1.5 && p >= hiYFrom)) return T('wood-7')
    const [a, b] = along === 'x' ? [p, q] : [q, p]
    const g = hash(Math.floor(a * 1.5), Math.floor(b * 2))
    return Math.floor(b * 2) % 3 === 0 && g > 0.55 ? T('wood-5') : T('wood-6')
  }
  if (f === 'y') return q > bx[5] - PX * 1.5 ? T('wood-7') : q < bx[4] + PX * 2 ? T('wood-4') : T('wood-5')
  return q < bx[4] + PX * 2 ? T('wood-1') : T('wood-2')
}

// Gaveteiro: 2 gavetas na face +x (a que olha para o quarto).
const drawers = (f, p, q, bx) => {
  if (f === 'top') return T('wood-6')
  if (f === 'y') return q < bx[4] + (bx[5] - bx[4]) * 0.3 ? T('wood-4') : T('wood-5')
  const [, , y0, y1, z0, z1] = bx
  if (inside(q, 6.2, 6.2 + PX * 2) || p < y0 + PX * 2 || p > y1 - PX * 2 || q > z1 - PX * 2) return T('wood-0')
  const mid = (y0 + y1) / 2
  for (const hz of [9.4, 3.2]) {
    if (inside(p, mid - 1.6, mid + 1.6) && inside(q, hz, hz + 1)) return q > hz + 0.5 ? T('gold-3') : T('gold-1')
  }
  return q < z0 + (z1 - z0) * 0.3 ? T('wood-1') : T('wood-2')
}

// Código na tela: [início, fim, cor] em colunas de ≈4 px, por linha.
const CODE = [
  [[0, 3, 'pink'], [4, 6, 'sky-0']], [[2, 4, 'sky-0'], [5, 9, 'gold-2']], [[2, 7, 'leaf-2']], [[4, 6, 'sky-0'], [7, 10, 'teal-3']],
  [[4, 9, 'gold-2']], [[2, 3, 'sky-0']], [[0, 1, 'pink']], [[0, 4, 'sky-0'], [5, 8, 'leaf-2']], [[2, 6, 'teal-3']],
]
/** Frames da animação `idle` da tela: 0 = tela do teste; 1 = cursor; 2 = +2 px digitados e cursor; 3 = digitado, cursor apagado. */
const SCREEN_FRAMES = [
  { typed: false, cursor: false }, { typed: false, cursor: true }, { typed: true, cursor: true }, { typed: true, cursor: false },
]

export const SCREEN_RECT = (bx = MONITOR.screen) => ({ x0: bx[0] + 0.9, x1: bx[1] - 0.9, z0: bx[4] + 1.2, z1: bx[5] - 1 })

const monitorScreen = (frame) => (f, x, z, bx) => {
  if (f === 'top') return T('graphite-2')
  if (f === 'x') return T('graphite-0')
  const { x0: sx0, x1: sx1, z0: sz0, z1: sz1 } = SCREEN_RECT(bx)
  if (!(inside(x, sx0, sx1) && inside(z, sz0, sz1))) return z > bx[5] - PX ? T('graphite-2') : T('graphite-1')
  if (z > sz1 - 1.6) return inside(x, sx0 + 0.5, sx0 + 1.2) ? T('pink') : inside(x, sx0 + 1.6, sx0 + 2.3) ? T('gold-2') : T('teal-2')
  if (x < sx0 + 1.6) return T('teal-1')
  const { typed, cursor } = SCREEN_FRAMES[frame]
  const lines = CODE.map((l) => [...l])
  if (typed) lines[8] = [...lines[8], [6.6, 7.1, 'leaf-2']]
  const base = sz1 - 1.6 - z
  const row = Math.floor(base / 1.2)
  const within = base % 1.2 < 0.6
  const colX = (x - sx0 - 2.2) / 1.05
  if (within && lines[row]) for (const [a, b, color] of lines[row]) if (colX >= a && colX < b) return T(color)
  if (cursor) {
    const cx = typed ? 7.3 : 6.6
    if (colX >= cx && colX < cx + 0.26 && base >= 8 * 1.2 - 0.45 && base < 8 * 1.2 + 0.6) return T('gold-2')
  }
  const d = (x - sx0) - (z - sz0) * 1.3
  if (d > 9 && d < 10.5) return T('teal-1')
  return T('teal-0')
}

const keyboard = (f, x, y, bx) => {
  if (f === 'y') return T('cream-1')
  if (f === 'x') return T('cream-0')
  const kx = x - bx[0] - 0.6, ky = y - bx[2] - 0.5
  if (kx < 0 || ky < 0 || kx > 12.8 || ky > 3) return T('cream-2')
  const row = Math.floor(ky / 0.75)
  if (row === 3 && kx > 3 && kx < 9.5) return ky % 0.75 < 0.5 ? T('cream-3') : T('cream-0')
  if (kx % 1 < 0.72 && ky % 0.75 < 0.5) return T('cream-3')
  return T('cream-0')
}

export const LAMP = { base: [2, 28, 1.4, 16, 16.8], arm: [1.6, 2.4, 27.6, 28.4, 16.8, 26], shade: [2.5, 28, 1.8, 24, 27.5], bulb: [2.5, 28, 1.1, 23.6, 24] }

/** Luminária de mesa (`desk-lamp`), como objeto próprio (contorno próprio). */
export function lampObject(c, on) {
  const body = { top: T('teal-3'), side: T('teal-2'), lit: T('teal-3'), dark: T('teal-1') }
  const bulb = on ? T('gold-3') : T('cream-2')
  return [
    c.cylinder(LAMP.base, body),
    c.box(LAMP.arm, shaded({ top: T('teal-3'), front: T('teal-2'), side: T('teal-1') })),
    c.cylinder(LAMP.bulb, { top: bulb, side: bulb, lit: bulb, dark: bulb }),
    c.cylinder(LAMP.shade, on ? { ...body, rimBottom: T('gold-1') } : body),
  ]
}

/**
 * Desenha o grupo. `frame` = frame da tela (0–3). `lamp`: 'off' | 'on' | false (sem luminária).
 */
export function renderComputer({ frame = 0, lamp = 'off' } = {}) {
  const c = roomCanvas()
  const { box, cylinder, object, dots } = c
  const wood = shaded({ top: T('wood-6'), front: T('wood-5'), front2: T('wood-4'), side: T('wood-2'), side2: T('wood-1') })
  const dark = () => T('wood-0')

  // Estrutura da mesa: painéis do fundo, perna, gaveteiro e tampo (braço A antes do B, que cobre a emenda).
  object([
    box(DESK.panelA, dark),
    box(DESK.panelB, dark),
    box(DESK.leg, wood),
    box(DESK.drawers, drawers),
    box(DESK.topA, slab({ along: 'x', hiYFrom: 14 })),
    box(DESK.topB, slab({ along: 'y' })),
  ])

  // Caneca no fundo do canto.
  object([cylinder([5, 3.5, 1.6, 16, 21], {
    top: (u, v) => (u * u + v * v < 0.55 ? (u + v < -0.3 ? T('wood-1') : T('wood-0')) : T('cream-3')),
    side: T('cream-2'), lit: T('cream-3'), dark: T('cream-0'),
  })])

  // Controle de videogame deitado na frente da caneca.
  const pad = { top: T('graphite-2'), side: T('graphite-1'), lit: T('graphite-2'), dark: T('graphite-0') }
  const [dx, dy] = toPx(4.7, 8.7, 17.2).map(Math.round)
  const [bx, by] = toPx(7.6, 8.6, 17.2).map(Math.round)
  object([
    cylinder([3.6, 10.5, 1, 16, 17.2], pad),
    cylinder([8.4, 10.5, 1, 16, 17.2], pad),
    box([3, 9, 7, 10.5, 16, 17.2], shaded({ top: T('graphite-2'), front: T('graphite-1'), side: T('graphite-0'), hi: T('graphite-3') })),
    dots([
      [dx, dy - 1, T('graphite-0')], [dx - 1, dy, T('graphite-0')], [dx, dy, T('graphite-0')], [dx + 1, dy, T('graphite-0')], [dx, dy + 1, T('graphite-0')],
      [bx, by - 2, T('pink')], [bx - 2, by, T('sky-0')], [bx + 2, by, T('leaf-2')], [bx, by + 2, T('gold-1')],
    ]),
  ])

  // Monitor de frente para o quarto.
  monitorObject(c, frame)
  object([box(KEYBOARD, keyboard)])
  mouseObject(c)

  if (lamp) object(lampObject(c, lamp === 'on'))
  return c
}

const metalTones = () => ({ top: T('graphite-2'), front: T('graphite-1'), side: T('graphite-0') })
function monitorObject(c, frame) {
  const metal = metalTones()
  c.object([
    c.box(MONITOR.base, shaded({ ...metal, hi: T('graphite-2') })),
    c.box(MONITOR.neck, shaded(metal)),
    c.box(MONITOR.screen, monitorScreen(frame)),
  ])
}
function mouseObject(c) {
  c.object([c.cylinder([29.5, 10.2, 0.9, 16, 17], { top: T('cream-3'), side: T('cream-1'), lit: T('cream-2'), dark: T('cream-0') })])
}

/**
 * Silhueta clicável do computador (camada `computer-hit`, nunca desenhada): só o monitor e o mouse.
 * O resto da mesa é decoração; o clique e o contorno de hover ficam nessas duas peças.
 */
export function renderComputerHit() {
  const c = roomCanvas()
  monitorObject(c, 0)
  mouseObject(c)
  return c
}

/** Só a luminária, no mesmo canvas (camada `desk-lamp`). */
export function renderDeskLamp(on) {
  const c = roomCanvas()
  c.object(lampObject(c, on))
  return c
}
