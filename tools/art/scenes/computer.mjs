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

export const MUG = [5, 3.5, 1.15, 16, 19.6] // caneca: [cx, cy, r, z0, z1]

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

// Teclado: moldura cream-1, 4 fileiras desencontradas de teclas (face cream-3 com a borda da frente cream-2),
// vãos cream-0 e barra de espaço.
const keyboard = (f, x, y, bx) => {
  if (f === 'y') return T('cream-1')
  if (f === 'x') return T('cream-0')
  const kx = x - bx[0] - 0.45, ky = y - bx[2] - 0.4
  if (kx < 0 || ky < 0 || kx > 13.1 || ky > 3.15) return T('cream-1')
  const row = Math.floor(ky / 0.8), fy = ky - row * 0.8
  if (fy > 0.62) return T('cream-0')
  const u = kx + [0, 0.35, 0.6, 0][row]
  const front = fy > 0.42 ? T('cream-2') : T('cream-3')
  if (row === 3 && kx > 3.2 && kx < 9.6) return front // barra de espaço
  if (u % 1 > 0.8) return T('cream-0')
  return front
}

// Luminária: base redonda baixa, haste fina com articulação, cúpula cônica (fatias de raio decrescente) e lâmpada.
export const LAMP = {
  base: [2, 28, 1.5, 16, 16.8],
  stem: [1.75, 2.25, 27.75, 28.25, 16.8, 25.6],
  joint: [2, 28, 0.55, 20.6, 21.6],
  shade: { r0: 2.3, r1: 1.15, z0: 25, z1: 29.5, step: 0.5 }, // cone: raio embaixo/em cima
  bulb: [2, 28, 1.1, 24.6, 25.2],
}

const coneSlices = ({ r0, r1, z0, z1, step }) => {
  const n = Math.round((z1 - z0) / step)
  return Array.from({ length: n }, (_, i) => [r0 + ((r1 - r0) * i) / (n - 1), z0 + i * step, z0 + (i + 1) * step])
}

/** Luminária de mesa (`desk-lamp`), como objeto próprio (contorno próprio). */
export function lampObject(c, on) {
  const body = { top: T('teal-3'), side: T('teal-2'), lit: T('teal-3'), dark: T('teal-1') }
  const bulb = on ? T('gold-3') : T('cream-2')
  const [cx, cy] = [LAMP.base[0], LAMP.base[1]]
  return [
    c.cylinder(LAMP.base, { ...body, top: T('teal-3'), side: T('teal-1'), lit: T('teal-2'), dark: T('teal-0') }),
    c.box(LAMP.stem, shaded({ top: T('teal-3'), front: T('teal-2'), side: T('teal-1') })),
    c.cylinder(LAMP.joint, body),
    c.cylinder(LAMP.bulb, { top: bulb, side: bulb, lit: bulb, dark: bulb }),
    ...coneSlices(LAMP.shade).map(([r, z0, z1], i, all) => c.cylinder([cx, cy, r, z0, z1], {
      ...body,
      // Fatias de baixo: o anel que sobra fica com a cor da lateral naquele ângulo, então o cone sai liso.
      top: i === all.length - 1 ? T('teal-3') : (u) => (u < -0.45 ? T('teal-3') : u > 0.45 ? T('teal-1') : T('teal-2')),
      ...(i === 0 ? { rimBottom: on ? T('gold-1') : T('teal-1') } : {}),
    })),
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

  // Caneca no fundo do canto: menor (proporcional ao teclado), faixa vermelha e alça à direita.
  const [mx0, my0, mr, mz0, mz1] = MUG
  object([
    box([mx0 + 0.8, mx0 + 1.6, my0 - 0.22, my0 + 0.22, 16.7, 18.9], (f, p, q) => {
      if (f === 'y' && p < mx0 + 1.32 && q > 17.2 && q < 18.4) return null // furo da alça
      return f === 'top' ? T('cream-3') : f === 'y' ? T('cream-2') : T('cream-0')
    }),
    cylinder([mx0, my0, mr, mz0, mz1], {
      top: (u, v) => (u * u + v * v < 0.5 ? (u + v < -0.35 ? T('wood-1') : T('wood-0')) : T('cream-3')),
      side: T('cream-2'), lit: T('cream-3'), dark: T('cream-0'),
    }),
    cylinder([mx0, my0, mr, 17.5, 18.3], { top: null, side: T('red-2'), lit: T('red-3'), dark: T('red-1') }),
  ])

  // Controle deitado (desenho de controle clássico): corpo claro com dois punhos redondos, ombro azul atrás,
  // direcional verde no punho esquerdo, 4 botões coloridos no direito e 2 botões laranja no meio.
  // Punho: tampa clara com um anel mais escuro na borda (como os círculos do print).
  const padT = { top: (u, v) => (u * u + v * v > 0.62 ? T('wall-2') : T('wall-5')), side: T('wall-2'), lit: T('wall-3'), dark: T('wall-0') }
  const [gl, gr, gy, gz, gr0] = [4.4, 8.1, 9.5, 17.2, 1.35] // punhos: x esquerdo/direito, y, topo, raio
  const at = (x, y, z) => toPx(x, y, z).map(Math.round)
  const [dx, dy] = at(gl, gy, gz)
  const [bx, by] = at(gr, gy, gz)
  const [cx, cy] = at((gl + gr) / 2, gy - 0.7, 17.2)
  object([
    box([5.4, 7.2, 7.9, 8.7, 16.3, 17.6], shaded({ top: T('sky-1'), front: T('blue-1'), side: T('blue-0') })),
    box([gl, gr, 8.7, 10.3, 16, 17.0], shaded({ top: T('wall-4'), front: T('wall-2'), side: T('wall-0'), hi: T('wall-5') })),
    cylinder([gl, gy, gr0, 16, gz], padT),
    cylinder([gr, gy, gr0, 16, gz], padT),
    dots([
      // direcional em cruz (braços de 2 px)
      ...[[0, -1], [-1, 0], [1, 0], [0, 1]].map(([a, b]) => [dx + a, dy + b, T('leaf-1')]),
      [dx, dy, T('leaf-0')],
      // 4 botões de 2×1
      [bx, by - 1, T('pink')], [bx - 2, by, T('sky-0')], [bx + 2, by, T('red-2')], [bx, by + 1, T('gold-1')],
      [cx - 1, cy, T('gold-2')], [cx + 1, cy, T('gold-2')],
    ]),
  ])

  // Monitor de frente para o quarto.
  monitorObject(c, frame)
  object([box(KEYBOARD, keyboard)])
  mousePadObject(c)
  mouseObject(c)
  headsetObject(c)

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
// Headset sem fio deitado à direita, atrás do mouse: duas conchas (almofada grafite, LED ciano) ligadas pela
// haste em arco, para o lado da borda da mesa.
export const HEADSET = { cx: 29.3, cups: [4.5, 7.4], r: 1.05, bend: 1.6 }
function headsetObject(c) {
  const { cx, cups, r, bend } = HEADSET
  const half = (cups[1] - cups[0]) / 2, cy = (cups[0] + cups[1]) / 2
  const band = []
  for (let a = -90; a <= 90; a += 15) {
    const t = (a * Math.PI) / 180
    const x = cx + 0.2 + bend * Math.cos(t), y = cy + half * Math.sin(t)
    band.push(c.box([x - 0.3, x + 0.3, y - 0.3, y + 0.3, 16, 16.6], (f) => (f === 'top' ? T('graphite-3') : f === 'y' ? T('graphite-2') : T('graphite-1'))))
  }
  const cup = { top: (u, v) => (u * u + v * v < 0.35 ? T('graphite-0') : T('graphite-2')), side: T('graphite-1'), lit: T('graphite-2'), dark: T('graphite-0') }
  const [lx, ly] = toPx(cx + r * 0.7, cups[1] + r * 0.7, 16.5).map(Math.round)
  c.object([
    ...band,
    ...cups.map((y) => c.cylinder([cx, y, r, 16, 17.1], cup)),
    c.dots([[lx, ly, T('sky-0')]]),
  ])
}

// Mousepad fino (teal) sob o mouse; mouse oval (dois cilindros) com a divisão dos botões e a rodinha.
export const MOUSE_PAD = [27, 31.6, 8.6, 12, 16, 16.3]
function mousePadObject(c) {
  c.object([c.box(MOUSE_PAD, (f) => (f === 'top' ? T('teal-2') : f === 'y' ? T('teal-1') : T('teal-0')))])
}
function mouseObject(c) {
  const m = { top: T('cream-3'), side: T('cream-2'), lit: T('cream-3'), dark: T('cream-0') }
  const [wx, wy] = toPx(29.05, 10.15, 17).map(Math.round)
  c.object([
    c.cylinder([29.75, 10.3, 0.7, 16.3, 16.9], m),
    c.cylinder([29.05, 10.3, 0.8, 16.3, 17], m),
    c.dots([[wx, wy, T('graphite-2')], [wx + 1, wy, T('cream-0')]]),
  ])
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
