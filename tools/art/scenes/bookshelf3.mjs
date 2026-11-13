// Prateleira de parede (`bookshelf`, M3), 3ª proposta (2026-11-07). A 2ª continua em bookshelf.mjs, para comparação.
// Spec: docs/arte/specs.md §4 "Prateleira (M3) — proposta (3ª versão)".
//
// Mudanças pedidas pelo Davi em relação à shelf2:
// - saem os 2 livros deitados (teal + amarelo) que ficavam na frente dos objetos e não se liam como livros;
// - entra uma peça de xadrez (cavalo branco);
// - cubo mágico com adesivos 3×3 também no topo (desenhado em px de tela, ver isoCube);
// - lombadas com faixas e título em pixel; cartucho igual ao da visão de perto (grafite, ranhuras, etiqueta creme);
// - tábua 4,5 u mais longa à direita, para os 4 objetos não se sobreporem na tela;
// - mãos-francesas sob a tábua e sombra da tábua na parede (camada à parte, para assar no room-shell).
// Os objetos pequenos (tsuru, cavalo, raquete) são mapas de pixel à mão, ancorados num ponto do mundo:
// em 6–14 px, um desenho à mão lê muito melhor do que caixas isométricas.
import { inside, PX, shaded } from '../lib.mjs'
import { P } from '../palette.mjs'
import { roomCanvas, toPx } from '../room.mjs'
import { SHELF2_COLORS } from './bookshelf.mjs'

const T = (t) => P[t]

export const SHELF3_Z = 48
export const SHELF3 = {
  plank: [9, 34.5, 0, 6.5, 46, SHELF3_Z], // mesmo fundo e espessura da shelf2; 4,5 u mais longa à direita (lugar dos 4 objetos)
  depth: [0.6, 5.4],
  // [x0, x1, altura (u), tipo, índice da decoração]
  books: [
    [9.6, 10.8, 6.2, 'decor', 4], // creme
    [10.8, 11.8, 5.2, 'decor', 1], // amarelo
    [11.8, 14.0, 8, 'linguagens'],
    [14.0, 15.8, 7.2, 'idiomas'],
    [15.8, 16.9, 6.6, 'decor', 2], // petróleo
    [16.9, 17.8, 5.6, 'decor', 3], // malva
    [17.8, 19.0, 7.0, 'decor', 0], // verde: o último mostra a capa (face x)
  ],
  cart: [19.6, 22.0, 1.8, 2.7, SHELF3_Z, SHELF3_Z + 6], // cartucho em pé, perto da parede, etiqueta virada para o quarto
  cube: [24.6, 26.6, 2.4, 4.4, SHELF3_Z, SHELF3_Z + 4], // 2×2 u de base, 4 u (8 px) de altura: lê como cubo na projeção
  crane: [29.8, 3.6], // ponto de apoio (x, y) do tsuru (centro da base)
  knight: [32.4, 3.2], // ponto de apoio do cavalo
  paddle: [33.6, 1.0], // pé do cabo da raquete, encostada na parede
  brackets: [9.8, 32.6], // x das mãos-francesas
}

/** Espessura de 1 coluna de px, em u, ao longo de x na face frontal. */
const COL = 0.25

/** Lombada (face +y) da 3ª versão: aresta de luz, faixas de capa dura, título em pixel ou etiqueta. */
export const spine3 = ([face, dark, hi, band], kind) => (f, p, q, [x0, x1, , , z0, z1]) => {
  if (f === 'top') return p < x0 + PX || p > x1 - PX * 1.5 ? T(face) : T('cream-2') // miolo de papel com capa em volta
  if (f === 'x') {
    // Capa (só aparece no último livro e onde o vizinho é mais baixo): tom escuro, aresta de cima na cor da capa.
    return Math.floor((z1 - q) / PX) === 0 ? T(face) : T(dark)
  }
  const w = x1 - x0
  const col = Math.floor((p - x0) / COL) // coluna de px da lombada
  const cols = Math.round(w / COL)
  const row = Math.floor((z1 - q) / PX) // linha de px a partir do topo
  const rows = Math.round((z1 - z0) / PX)
  if (row === 0) return T(hi) // aresta de luz
  if (row === 2 || row === rows - 3) return T(band) // faixas da capa dura
  if (col === 0) return T(hi)
  if (col >= cols - 1) return T(dark)
  if (kind === 'linguagens' || kind === 'idiomas') {
    // Etiqueta creme com o símbolo (</> ou globo) reduzido a 3 px.
    if (inside(row, 4, 9) && inside(col, 2, cols - 2)) {
      if (row === 4 || row === 8) return T(dark)
      const mid = Math.floor(cols / 2)
      if (kind === 'linguagens' && row === 6 && (col === mid - 2 || col === mid + 1)) return T('red-1')
      if (kind === 'linguagens' && (row === 5 || row === 7) && col === mid - 1) return T('red-1')
      if (kind === 'idiomas' && inside(row, 5, 8) && inside(col, mid - 1, mid + 1)) return T('blue-0')
      return T('cream-3')
    }
    if (row === rows - 5 && inside(col, 2, cols - 2)) return T(band)
  } else if (inside(row, 5, rows - 6) && col === Math.floor(cols / 2) && row % 3 !== 0) {
    return T(band) // título vertical em "letras" de 2 px
  }
  return T(face)
}

/** Mapa de pixels à mão; (ax, ay) = canto esquerdo da última linha. `lean`: a cada `lean` linhas, 1 px para a direita no topo. */
export const sprite = (rows, map, [ax, ay], { lean = 0 } = {}) => (set) => {
  const h = rows.length
  rows.forEach((row, j) => {
    const dx = lean ? Math.floor((h - 1 - j) / lean) : 0
    ;[...row].forEach((ch, i) => { if (map[ch]) set(ax + i + dx, ay - h + 1 + j, map[ch]) })
  })
}

// Mapas à mão com o contorno já desenhado ('o'), para que pescoço, cauda e cabo (1 px de recheio) não virem
// só contorno. Ancorados pelo canto de baixo (linha de apoio) no ponto do mundo.

// Tsuru de perfil, bico para a direita: cauda fina subindo à esquerda, asa em pé com vinco (face clara `pink`,
// face da dobra `red-3`), corpo em losango com a barriga `red-1`, pescoço subindo à direita e cabeça dobrada.
export const CRANE_S = [
  '.........o..........',
  '........opo.........',
  '.......oppqo........',
  '.......oppqo.....oo.',
  'oo....opppqqo...opqo',
  'opo...opppqqo..opo.o',
  '.opo..oppppqqo.opo..',
  '..opooopppqqqoopo...',
  '...oprrppqqqqqpo....',
  '....orrrrrrrrro.....',
  '.....oorrrrroo......',
  '.......ooooo........',
]
export const CRANE_MAP = { o: 'outline', p: 'pink', q: 'red-3', r: 'red-1' }

// Cavalo de xadrez preto, virado para a esquerda: orelha, testa, focinho com o corte da boca, crina escura
// (`graphite-0`) à direita, colar e base larga. Aresta de luz `graphite-3` à esquerda.
const KNIGHT_S = [
  '.....oo....',
  '....ohbo...',
  '...ohbbdo..',
  '..ohbebdo..',
  '.ohbbbbbdo.',
  'ohbbbbbbdo.',
  'ohbboobbdo.',
  '.oo..obbdo.',
  '.....obbdo.',
  '....ohbbdo.',
  '...oooooooo',
  '...ohbbbbdo',
  '..ohbbbbbbdo',
  '..oooooooooo',
]
const KNIGHT_MAP = { o: 'outline', h: 'cream-3', b: 'cream-2', d: 'cream-0', e: 'graphite-1' }

// Raquete de tênis de mesa encostada na parede (topo 1 px para a direita): borda de madeira, borracha vermelha
// com sombra embaixo à esquerda, cabo de madeira com a junta.
const PADDLE_S = [
  '...ooooo...',
  '..owwwwwo..',
  '.owrrrrrwo.',
  'owrrrrrrrwo',
  'owrrrrrrrwo',
  'owRrrrrrrwo',
  'owRRrrrrrwo',
  '.owRRRrrwo.',
  '..owwwwwo..',
  '....oko....',
  '....oKo....',
  '....oKo....',
  '....ooo....',
]
const PADDLE_MAP = { o: 'outline', w: 'wood-6', r: 'red-2', R: 'red-1', k: 'wood-7', K: 'wood-4' }

/**
 * `smalls` (opcional): troca os objetos pequenos desenhados à mão (tsuru, cavalo, raquete). Cada um é
 * { rows, map, at: [x, y] (ponto do mundo no tampo), dx (px da âncora até o canto esquerdo), lean? }.
 * Sem `smalls`, a saída é a da 3ª versão (a 4ª, em bookshelf4.mjs, passa os seus).
 */
export function renderBookshelf3({ smalls, cart = true } = {}) {
  const c = roomCanvas()
  const { box, object } = c
  const [by0, by1] = SHELF3.depth
  const at = (x, y, z = SHELF3_Z) => toPx(x, y, z).map(Math.round)
  const dots = (rows, map, anchor, opts) => (layer) => {
    const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < c.width && y < c.height) layer.set(hex(t), (y * c.width + x) * 4) }
    sprite(rows, map, anchor, opts)(set)
  }

  // Mão-francesa de ferro: braço na parede, braço sob a tábua e escora diagonal (o miolo do triângulo é vazado).
  const iron = shaded({ top: T('graphite-2'), front: T('graphite-1'), side: T('graphite-0') })
  const bracket = (bx, zLow) => (layer) => {
    const reach = 4.5, H = 46 - zLow
    box([bx, bx + 0.5, 0, 0.5, zLow, 46], iron)(layer) // braço na parede
    for (let z = zLow + 0.5; z < 46; z += PX / 2) { // escora: de (y 0,5, zLow) a (y reach, 46)
      const y = 0.5 + ((z - zLow) / H) * (reach - 0.5)
      box([bx, bx + 0.5, y - 0.5, y, z, z + PX], iron)(layer)
    }
  }
  object([
    bracket(SHELF3.brackets[0], 41),
    bracket(SHELF3.brackets[1], 41),
    box(SHELF3.plank, (f, p, q, bx) => {
      if (f === 'top') {
        if (p > bx[1] - PX * 1.5 || q > bx[3] - PX * 1.5) return T('wood-7')
        return Math.floor(q * 2) % 5 === 2 && Math.floor(p * 1.3) % 4 !== 0 ? T('wood-5') : T('wood-6') // veio
      }
      if (f === 'y') return q > bx[5] - PX ? T('wood-7') : q < bx[4] + PX * 1.5 ? T('wood-4') : T('wood-5')
      return q < bx[4] + PX * 1.5 ? T('wood-1') : T('wood-2')
    }),
  ])

  // Livros em pé (um objeto só; separados por tom, como manda a regra 1).
  const colors = ([, , , kind, n]) => (kind === 'decor' ? SHELF2_COLORS.decor[n] : SHELF2_COLORS[kind])
  object(SHELF3.books.map((b) => box([b[0], b[1], by0, by1, SHELF3_Z, SHELF3_Z + b[2]], spine3(colors(b), b[3]))))

  // Cartucho em pé, igual ao da visão de perto: corpo grafite, ranhuras de pegada no alto (os chanfros do
  // desenho de perto não cabem em 10 px), etiqueta creme com a faixa `gold-2` e o ícone de branch (2 px) — lê como cartucho, não como caixa.
  if (cart) object([box(SHELF3.cart, (f, p, q, [x0, x1, , , z0, z1]) => {
    const col = Math.floor((p - x0) / COL), cols = Math.round((x1 - x0) / COL)
    const row = Math.floor((z1 - q) / PX), rows = Math.round((z1 - z0) / PX)
    if (f === 'top') return T('graphite-2')
    if (f === 'x') return T('graphite-0')
    if (row === 0) return T('graphite-3')
    if (col === 0) return T('graphite-2')
    if (col === cols - 1) return T('graphite-0')
    if ((row === 1 || row === 3) && col % 2 === 0) return T('graphite-0') // ranhuras de pegada
    if (inside(col, 1, cols - 1) && inside(row, 5, rows - 1)) {
      if (row === 5) return T('gold-2')
      const mid = Math.floor(cols / 2)
      if ((col === mid - 1 && inside(row, 6, rows - 2)) || (row === 7 && col === mid)) return T('graphite-1') // ícone
      return T('cream-3')
    }
    return T('graphite-1')
  })])

  // Cubo mágico em tela (isométrico 2:1, 16×16 px + contorno): adesivos 3×3 nas três faces, nos três tons
  // (topo claro, frente média, lado escuro), separados por juntas `graphite-0` de 1 px.
  const [cbx, cby] = at(SHELF3.cube[1], SHELF3.cube[3]) // canto da frente (x1, y1), no tampo
  object([(layer) => isoCube(layer, c.width, cbx, cby, 9, 9, { seams: true })], { outline: false })

  // Tsuru, cavalo e raquete: mapas à mão, cada um com o próprio contorno.
  const list = smalls ?? [
    { rows: CRANE_S, map: CRANE_MAP, at: SHELF3.crane, dx: 9 },
    { rows: KNIGHT_S, map: KNIGHT_MAP, at: SHELF3.knight, dx: 7 },
    { rows: PADDLE_S, map: PADDLE_MAP, at: SHELF3.paddle, dx: 5, lean: 6 },
  ]
  for (const s of list) {
    const [sx, sy] = at(...s.at)
    object([dots(s.rows, s.map, [sx - s.dx, sy + (s.dy ?? 0)], { lean: s.lean ?? 0 })], { outline: false })
  }
  return c
}

/**
 * Sombra da tábua na parede (camada plana, para assar no room-shell): faixa `wall-0` logo abaixo da aresta de
 * baixo da tábua, deslocada para a esquerda (luz da janela à direita). Só aparece na folga até o monitor.
 */
export function renderBookshelf3Shadow() {
  const c = roomCanvas()
  c.object([c.box([7.6, 33.1, -0.01, 0, 30.6, 33.2], (f) => (f === 'y' ? T('wall-0') : null))], { outline: false })
  return c
}

const CUBE_TONES = {
  top: ['cream-3', 'gold-3', 'red-3', 'leaf-2', 'cream-3', 'wood-7', 'red-3', 'sky-1', 'gold-3'],
  left: ['red-2', 'gold-1', 'leaf-1', 'blue-1', 'red-2', 'wood-6', 'leaf-1', 'cream-2', 'red-2'],
  right: ['blue-0', 'leaf-0', 'red-0', 'gold-0', 'blue-0', 'leaf-0', 'red-0', 'cream-1', 'blue-0'],
}
/**
 * Cubo isométrico em px de tela. (bx, by) = vértice de baixo (canto da frente no apoio); A = meia largura
 * (o topo tem A px de altura), H = altura das faces. Cada pixel acha a face e a célula 3×3; junta = pixel cuja
 * célula difere da do vizinho de cima ou da esquerda; contorno = borda da silhueta.
 */
export function isoCube(layer, W, bx, by, A, H, { tones = CUBE_TONES, seams = false } = {}) {
  const tx = bx, ty = by - H - A // vértice de cima do topo
  const cell = (x, y) => {
    const dx = x + 0.5 - tx, dy = y + 0.5 - ty
    const u = (dx / A + (2 * dy) / A) / 2, v = ((2 * dy) / A - dx / A) / 2 // topo: u ao longo de T→R, v ao longo de T→L
    if (u >= 0 && v >= 0 && u < 1 && v < 1) return ['top', Math.floor(u * 3) + 3 * Math.floor(v * 3)]
    const lx = x + 0.5 - (tx - A), ly = y + 0.5 - (ty + A / 2) // face da esquerda: origem no vértice L
    const a = lx / A, b = (ly - (a * A) / 2) / H
    if (a >= 0 && a < 1 && b >= 0 && b < 1) return ['left', Math.floor(a * 3) + 3 * Math.floor(b * 3)]
    const rx = x + 0.5 - tx, ry = y + 0.5 - (ty + A) // face da direita: origem no vértice B (de cima)
    const a2 = rx / A, b2 = (ry + (a2 * A) / 2) / H
    if (a2 >= 0 && a2 < 1 && b2 >= 0 && b2 < 1) return ['right', Math.floor(a2 * 3) + 3 * Math.floor(b2 * 3)]
    return null
  }
  // Junta: pixel no começo de uma célula (exceto a primeira), medido pela fração da coordenada da face.
  const seamAt = (x, y) => {
    const dx = x + 0.5 - tx, dy = y + 0.5 - ty
    const u = (dx / A + (2 * dy) / A) / 2, v = ((2 * dy) / A - dx / A) / 2
    const f = (w, t) => w * 3 >= 1 && (w * 3) % 1 < t
    if (u >= 0 && v >= 0 && u < 1 && v < 1) return f(u, 0.17) || f(v, 0.17)
    const a = (x + 0.5 - (tx - A)) / A, b = (y + 0.5 - (ty + A / 2) - (a * A) / 2) / H
    if (a >= 0 && a < 1 && b >= 0 && b < 1) return f(a, 0.3) || f(b, 0.3)
    const a2 = (x + 0.5 - tx) / A, b2 = (y + 0.5 - (ty + A) + (a2 * A) / 2) / H
    return f(a2, 0.3) || f(b2, 0.3)
  }
  for (let y = ty - 1; y <= by + 1; y++) for (let x = tx - A - 1; x <= tx + A + 1; x++) {
    const k = cell(x, y)
    if (!k) continue
    let t
    const n = [cell(x - 1, y), cell(x + 1, y), cell(x, y - 1), cell(x, y + 1)]
    if (n.some((m) => !m)) t = 'outline'
    else if (k[0] !== 'top' && (n[2][0] === 'top' || (k[0] === 'right' && n[0][0] === 'left'))) t = 'graphite-0' // aresta entre faces (1 px)
    else if (seams && seamAt(x, y)) t = 'graphite-0'
    else t = tones[k[0]][k[1]]
    if (x >= 0 && y >= 0 && x < W) layer.set(hex(t), (y * W + x) * 4)
  }
}

export function hex(t) {
  const n = Number.parseInt(P[t].slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]
}
