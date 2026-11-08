// Prateleira de parede (`bookshelf`, M3, interagível, wall-back), acima do monitor.
// Spec: docs/arte/specs.md §4 "Prateleira (M3) — proposta" (2ª versão, 2026-11-07).
//
// Itens (mesma ordem e cores da visão de perto, scenes/closeup-shelf2.mjs):
// livros de decoração, livro "Linguagens" (vermelho), livro "Idiomas" (azul), mais decoração,
// cartucho "Ferramentas", cubo mágico, tsuru de origami, raquete de pingue-pongue e 2 livros deitados.
import { inside, PX, shaded } from '../lib.mjs'
import { P } from '../palette.mjs'
import { roomCanvas } from '../room.mjs'

const T = (t) => P[t]

/** Cores [face, sombra, luz, faixa]. Também usadas pela 1ª proposta (closeup-bookshelf.mjs). */
export const BOOK_COLORS = {
  java: ['red-2', 'red-0', 'red-3', 'gold-1'],
  leaf: ['leaf-1', 'leaf-0', 'leaf-2', 'cream-3'],
  python: ['blue-1', 'blue-0', 'sky-1', 'gold-1'],
  database: ['teal-3', 'teal-2', 'sky-1', 'cream-3'],
  react: ['pink', 'red-1', 'pink', 'cream-3'],
  js: ['gold-1', 'gold-0', 'gold-3', 'wood-2'],
  'node-js': ['mauve-2', 'mauve-1', 'wall-0', 'leaf-2'],
}
export const BOOK_FALLBACK = [
  ['cream-1', 'cream-0', 'cream-2', 'red-1'],
  ['graphite-2', 'graphite-1', 'graphite-3', 'gold-1'],
  ['red-1', 'red-0', 'red-2', 'gold-3'],
]
export const DICTIONARY_COLORS = ['wood-1', 'wood-0', 'wood-2', 'gold-1']

/** Cores dos livros da 2ª proposta. */
export const SHELF2_COLORS = {
  linguagens: ['red-2', 'red-0', 'red-3', 'gold-1'],
  idiomas: ['blue-1', 'blue-0', 'sky-1', 'gold-1'],
  decor: [
    ['leaf-1', 'leaf-0', 'leaf-2', 'cream-3'],
    ['gold-1', 'gold-0', 'gold-3', 'wood-2'],
    ['teal-3', 'teal-2', 'sky-1', 'cream-3'],
    ['mauve-2', 'mauve-1', 'wall-0', 'gold-1'],
    ['cream-1', 'cream-0', 'cream-2', 'red-1'],
  ],
}

// Caixas em unidades do gerador ([x0, x1, y0, y1, z0, z1]). Base da parede = plano y = 0.
// Tábua mais funda (6,5 u, era 5) e mais grossa (2 u = 4 px), e 2 u mais alta, para manter a folga do monitor.
export const SHELF_Z = 48 // topo da tábua (96 px); base em 46 (92 px) para ficar 6 px acima do monitor na tela
export const SHELF = {
  plank: [9, 30, 0, 6.5, 46, SHELF_Z],
  depth: [0.6, 5.6], // fundo dos livros em pé (y)
  // [x0, x1, altura, cores]
  books: [
    [9.6, 10.9, 6.5, 'decor', 0],
    [10.9, 12, 5.5, 'decor', 1],
    [12, 14.2, 8, 'linguagens'],
    [14.2, 16, 7.2, 'idiomas'],
    [16, 17.2, 7, 'decor', 2],
    [17.2, 18.2, 6, 'decor', 3],
    [18.2, 19.5, 7.5, 'decor', 4],
  ],
  cart: [20.2, 22.2, 2.2, 3.2, SHELF_Z, SHELF_Z + 5], // cartucho em pé, fino em y
  cube: [23, 25, 2, 4, SHELF_Z, SHELF_Z + 2], // cubo mágico
  crane: [25.8, 27.6, 2.5, 4.5], // tsuru (x0, x1, y0, y1), até z + 2
  paddle: { x: 28.2, w: 1.6, y: [1.2, 1.8], h: 4.5 }, // raquete encostada na parede
  lying: [[22.6, 29.6, 4.4, 6.2, SHELF_Z, SHELF_Z + 0.9], [23, 29.2, 4.5, 6.1, SHELF_Z + 0.9, SHELF_Z + 1.7]], // 2 livros deitados na frente
}

const colorsOf = ([, , , kind, n]) => (kind === 'decor' ? SHELF2_COLORS.decor[n] : SHELF2_COLORS[kind])

/** Lombada (face +y): faixas perto do topo e da base, luz à esquerda, sombra à direita. Topo = miolo de papel. */
const bookPaint = ([face, dark, hi, band], { label = false } = {}) => (f, p, q, [x0, x1, , , z0, z1]) => {
  if (f === 'top') return p < x0 + PX || p > x1 - PX ? T(face) : T('cream-2')
  if (f === 'x') return q < z0 + (z1 - z0) * 0.3 ? T(dark) : T(dark)
  if (inside(q, z1 - 1.5, z1 - 1) || inside(q, z0 + 1, z0 + 1.5)) return T(band)
  if (label && inside(q, z1 - 4, z1 - 2.5) && inside(p, x0 + 0.5, x1 - 0.5)) return T('cream-3') // etiqueta
  if (p < x0 + PX) return T(hi)
  if (p > x1 - PX) return T(dark)
  return T(face)
}

export function renderBookshelf() {
  const c = roomCanvas()
  const { box, object } = c
  const [y0, y1] = SHELF.depth
  const draws = []

  draws.push(box(SHELF.plank, shaded({ top: T('wood-6'), front: T('wood-5'), front2: T('wood-4'), side: T('wood-2'), side2: T('wood-1'), hi: T('wood-7') })))
  for (const b of SHELF.books) {
    const [x0, x1, h, kind] = b
    draws.push(box([x0, x1, y0, y1, SHELF_Z, SHELF_Z + h], bookPaint(colorsOf(b), { label: kind !== 'decor' })))
  }
  // Cartucho "Ferramentas": grafite, etiqueta creme com faixa gold-2 virada para o quarto.
  draws.push(box(SHELF.cart, (f, p, q, [x0, x1, , , z0, z1]) => {
    if (f === 'top') return T('graphite-2')
    if (f === 'x') return T('graphite-0')
    if (q > z1 - PX) return T('graphite-3')
    if (inside(p, x0 + 0.4, x1 - 0.4) && inside(q, z0 + 0.8, z1 - 1.2)) return q > z1 - 2 ? T('gold-2') : T('cream-3')
    return T('graphite-1')
  }))
  // Cubo mágico: topo branco, frente com adesivos em grade, lado azul.
  draws.push(box(SHELF.cube, (f, p, q, [x0, x1, yy0, yy1, z0, z1]) => {
    const g = (a, a0, a1) => Math.floor(((a - a0) / (a1 - a0)) * 3)
    const seam = (a, a0, a1) => ((a - a0) / (a1 - a0)) * 3 % 1 < 0.22
    if (f === 'top') return seam(p, x0, x1) || seam(q, yy0, yy1) ? T('graphite-0') : T('cream-3')
    if (f === 'x') return seam(p, yy0, yy1) || seam(q, z0, z1) ? T('graphite-0') : T('blue-0')
    if (seam(p, x0, x1) || seam(q, z0, z1)) return T('graphite-0')
    return T(['red-2', 'gold-1', 'leaf-1', 'gold-1', 'red-2', 'leaf-1', 'leaf-1', 'red-2', 'gold-1'][g(p, x0, x1) + 3 * g(q, z0, z1)])
  }))
  // Tsuru: corpo baixo e asas em pé (duas caixinhas), papel rosa.
  const [cx0, cx1, cy0, cy1] = SHELF.crane
  const paper = shaded({ top: T('pink'), front: T('red-1'), side: T('red-0') })
  draws.push(box([cx0, cx1, cy0, cy1, SHELF_Z, SHELF_Z + 0.8], paper))
  draws.push(box([cx0 + 0.5, cx1 - 0.6, cy0 + 0.7, cy1 - 0.7, SHELF_Z + 0.8, SHELF_Z + 2.2], shaded({ top: T('pink'), front: T('pink'), side: T('red-1') })))
  draws.push(box([cx1 - 0.1, cx1 + 0.4, cy0 + 0.8, cy0 + 1.3, SHELF_Z + 0.4, SHELF_Z + 1.8], paper)) // pescoço
  // Raquete encostada na parede: lâmina vermelha (fatias, inclinada para a direita) e cabo de madeira.
  const pd = SHELF.paddle
  for (let z = 0; z < pd.h; z += 0.5) {
    const sx = pd.x + z * 0.12
    const blade = z >= 1.6
    const w = blade ? pd.w : 0.5
    const off = blade ? 0 : (pd.w - 0.5) / 2
    draws.push(box([sx + off, sx + off + w, pd.y[0], pd.y[1], SHELF_Z + z, SHELF_Z + z + 0.5],
      blade ? shaded({ top: T('wood-6'), front: T('red-2'), side: T('wood-2') }) : shaded({ top: T('wood-6'), front: T('wood-5'), side: T('wood-2') })))
  }
  // Dois livros deitados na frente, à direita (decoração).
  draws.push(box(SHELF.lying[0], shaded({ top: T('teal-3'), front: T('teal-2'), side: T('teal-2') })))
  draws.push(box(SHELF.lying[1], shaded({ top: T('gold-1'), front: T('cream-2'), side: T('gold-0') })))

  object(draws)
  return c
}
