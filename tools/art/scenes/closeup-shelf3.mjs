// Visão de perto da prateleira, 3ª proposta (2026-11-07). A 2ª continua em closeup-shelf2.mjs, para comparação.
// Spec: docs/arte/specs.md §4. Só prévias (art-src/previews/), nada em public/assets/.
//
// Mudanças em relação à shelf2:
// - os 4 objetos (cubo mágico, tsuru, cavalo de xadrez, raquete) são hobbies, não soft skills: o escolhido aparece
//   centralizado, sem folha de texto, com uma seta de cada lado e uma plaquinha de legenda embaixo;
// - os objetos ampliados são desenhados no tamanho final (não são o desenho pequeno ×3), com mais detalhe;
// - cubo com adesivos 3×3 no topo e no lado, como na frente;
// - tsuru redesenhado em faces de papel (claras e escuras), silhueta legível nos dois tamanhos;
// - livro aberto mais curto, com capa dura sobrando, camadas de folhas nas bordas, lombada com sombra;
// - sai o livro deitado (o "negócio azul" da direita); entra o cavalo de xadrez.
import { rgba } from '../lib.mjs'
import { P, TINT, UI_BG } from '../palette.mjs'
import { flat } from '../flat.mjs'
import { blit, lint, multiply } from '../sheet.mjs'
import { SHELF2_COLORS } from './bookshelf.mjs'
import { bar, cartridge, CH, CW, drawCurtain, drawWalls, ICONS, loadSkills, spine, text, textW } from './closeup-bookshelf.mjs'
import { extrude, putObject, rectPixels, shadowOnWall } from './closeup-3d.mjs'
import { projectsUsing } from './closeup-shelf2.mjs'

// ---------- geometria (px da ilustração a 1×) ----------
export const BOARD = { x: 22, y: 58, w: 272, h: 8, depth: 14 } // igual à shelf2
export const SEAT = 4
export const BASE = BOARD.y - 1 - SEAT
export const ITEM_D = 8

// Livro aberto (layout "livro"): mais curto que na shelf2 (capa 272×100 → 240×94).
export const BOOK = {
  cover: [40, 76, 240, 94], // capa dura, 3 px de espessura (extrusão para cima/direita)
  pages: [[46, 79, 114, 84], [160, 79, 114, 84]], // página esquerda / direita (folha de cima)
  stack: 3, // camadas de folhas visíveis na borda de fora e embaixo
}
export const BOOK_CONTENT = { left: [52, 83, 102, 70], right: [166, 83, 102, 70] }
export const PAGE_TURN = { prev: [46, 153, 10, 10], next: [264, 153, 10, 10] }

// Layout "cartucho" (Ferramentas): igual à shelf2.
export const STAGE = [28, 78, 82, 84]
export const SHEET = [118, 76, 174, 98]
export const OBJECT_CONTENT = [126, 84, 158, 72]
export const ARROWS = { prev: [34, 162, 14, 12], next: [90, 162, 14, 12] }

// Layout "hobby": objeto centralizado, uma seta de cada lado, plaquinha de legenda embaixo.
export const HOBBY = {
  stage: [100, 72, 120, 82], // caixa onde o objeto ampliado é centralizado (base em y 150)
  arrows: { prev: [60, 104, 16, 14], next: [244, 104, 16, 14] },
  plate: [104, 157, 112, 18], // plaquinha de papel (2 px de espessura)
  caption: [108, 160, 104, 12], // retângulo de conteúdo: só a legenda curta (nome do hobby)
}

// ---------- utilidades ----------
export const idx = (x, y) => y * CW + x
export const okXY = (x, y) => x >= 0 && y >= 0 && x < CW && y < CH
/** Pixels de uma camada local (flat) colocada em (x, y) da ilustração: [[i, rgba]]. */
export function place(local, x, y) {
  const out = []
  for (let j = 0; j < local.H; j++) for (let i = 0; i < local.W; i++) {
    const p = local.get(i, j)
    if (p && p[3] && okXY(x + i, y + j)) out.push([idx(x + i, y + j), p.slice()])
  }
  return out
}
/** Pixels de frente com inclinação (raquete encostada). */
export function sheared(local, x, y, shear) {
  const out = []
  for (let j = 0; j < local.H; j++) {
    const off = -Math.round((local.H - 1 - j) * shear)
    for (let i = 0; i < local.W; i++) {
      const p = local.get(i, j)
      if (p && p[3] && okXY(x + i + off, y + j)) out.push([idx(x + i + off, y + j), p.slice()])
    }
  }
  return out
}
/** Polígono preenchido (centro do pixel dentro), em coordenadas normalizadas × escala. */
export function poly(l, pts, color, s, ox = 0, oy = 0) {
  const P2 = pts.map(([x, y]) => [x * s + ox, y * s + oy])
  const xs = P2.map((p) => p[0]), ys = P2.map((p) => p[1])
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const cx = x + 0.5, cy = y + 0.5
      let inside = false
      for (let a = 0, b = P2.length - 1; a < P2.length; b = a++) {
        const [xa, ya] = P2[a], [xb, yb] = P2[b]
        if ((ya > cy) !== (yb > cy) && cx < ((xb - xa) * (cy - ya)) / (yb - ya) + xa) inside = !inside
      }
      if (inside) l.set(x, y, color)
    }
  }
}

// ---------- hobbies: cada um tem a versão da tábua ('shelf') e a ampliada ('big'), desenhadas no tamanho final ----------

/** Cubo mágico oblíquo: frente W×W, topo e lado com profundidade D; adesivos 3×3 nas três faces, juntas de 1 px. */
const CUBE = {
  top: ['cream-3', 'gold-3', 'red-3', 'leaf-2', 'cream-3', 'wood-7', 'red-3', 'sky-1', 'gold-3'],
  front: ['red-2', 'gold-1', 'leaf-1', 'blue-1', 'red-2', 'wood-6', 'leaf-1', 'cream-2', 'red-2'],
  side: ['blue-0', 'leaf-0', 'red-0', 'gold-0', 'blue-0', 'leaf-0', 'red-0', 'cream-1', 'blue-0'],
}
export function cubeSolid(x, y, W, D) {
  const out = []
  const cell = (a) => Math.min(2, Math.floor(a * 3))
  const seam = (a, step) => a > 0 && cell(a) !== cell(a - step)
  const put = (px, py, t) => { if (okXY(px, py)) out.push([idx(px, py), rgba(P[t])]) }
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) { // frente
    const a = i / W, b = j / W
    put(x + i, y + j, seam(a, 1 / W) || seam(b, 1 / W) ? 'graphite-0' : CUBE.front[cell(a) + 3 * cell(b)])
  }
  for (let k = 1; k <= D; k++) {
    const dk = (k - 1) / D // 0 = junto da frente
    const dc = cell(dk) // célula na profundidade (0 = frente)
    const ds = seam(dk, 1 / D) || k === 1 // junta na profundidade (e aresta com a frente)
    for (let i = 0; i < W; i++) { // topo: a fileira de trás (dc 2) é a linha 0 da tabela
      const a = i / W
      put(x + i + k, y - k, ds || seam(a, 1 / W) ? 'graphite-0' : CUBE.top[cell(a) + 3 * (2 - dc)])
    }
    for (let j = 0; j < W; j++) { // lado direito: coluna = profundidade, linha = altura
      const bb = j / W
      put(x + W - 1 + k, y + j - k, ds || seam(bb, 1 / W) ? 'graphite-0' : CUBE.side[dc + 3 * cell(bb)])
    }
  }
  // a frente fica por cima (os pixels da frente vêm primeiro na lista; reordena para a frente ganhar)
  const front = out.slice(0, W * W)
  return [...out.slice(W * W), ...front]
}

/** Tsuru de perfil, bico para a direita, em faces de papel (de trás para a frente). Coordenadas 0–100 × 0–66. */
const CRANE_FACES = [
  [[[52, 46], [72, 48], [68, 6]], 'red-1'], // asa de trás
  [[[52, 46], [60, 47], [68, 6]], 'red-0'], // vinco da asa de trás
  [[[3, 14], [42, 45], [35, 50]], 'pink'], // cauda, face de cima
  [[[3, 14], [35, 50], [30, 52]], 'red-1'], // cauda, face de baixo
  [[[86, 12], [58, 45], [66, 46]], 'pink'], // pescoço, face da frente
  [[[86, 12], [66, 46], [71, 50]], 'red-3'], // pescoço, face de trás
  [[[82, 16], [87, 9], [91, 10], [97, 23]], 'pink'], // cabeça, dobrada para baixo
  [[[82, 16], [97, 23], [89, 16]], 'red-1'], // cabeça, face de baixo
  [[[28, 52], [50, 45], [74, 51], [52, 55]], 'red-3'], // dorso do corpo
  [[[28, 52], [52, 55], [74, 51], [54, 64]], 'red-1'], // barriga
  [[[52, 55], [74, 51], [54, 64]], 'red-0'], // barriga, metade na sombra
  [[[34, 49], [49, 47], [40, 0]], 'pink'], // asa da frente, face clara
  [[[49, 47], [63, 48], [40, 0]], 'red-3'], // asa da frente, depois do vinco
]
export function craneArt() {
  const s = 0.98
  const W = Math.ceil(100 * s) + 1, H = Math.ceil(66 * s) + 1
  const l = flat(W, H)
  for (const [pts, color] of CRANE_FACES) poly(l, pts, color, s)
  // Tapa os furos entre faces vizinhas (pixels transparentes sem caminho até a borda), senão o contorno
  // automático os marcaria por dentro. Cada furo herda a cor de um vizinho.
  const out = new Uint8Array(W * H), stack = []
  for (let x = 0; x < W; x++) stack.push([x, 0], [x, H - 1])
  for (let y = 0; y < H; y++) stack.push([0, y], [W - 1, y])
  while (stack.length) {
    const [x, y] = stack.pop()
    if (x < 0 || y < 0 || x >= W || y >= H || out[y * W + x] || l.opaque(x, y)) continue
    out[y * W + x] = 1
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  for (let pass = 0; pass < 4; pass++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (out[y * W + x] || l.opaque(x, y)) continue
    const n = [[x - 1, y], [x, y - 1], [x + 1, y], [x, y + 1]].find(([a, b]) => l.opaque(a, b))
    if (n) l.px.set(l.get(...n).slice(), (y * W + x) * 4)
  }
  return l
}
// Versão da tábua (26×15), à mão e com o contorno já desenhado ('o'), para o pescoço e a cauda não virarem só contorno.
const CRANE_SHELF = [
  '...........o..............',
  '..........opo.....o.......',
  '..........oppo...oro......',
  '.........opppo..orro......',
  'o........oppqqo.orRo...oo.',
  'oo......opppqqoorRo...opqo',
  'opo.....opppqqqorRo..opo.o',
  '.opo...oppppqqqoRo..opo...',
  '..opo..oppppqqqqoo.opo....',
  '...opooopppppqqqqoopo.....',
  '....oppppppqqqqqqqpo......',
  '.....orrrrrrrrrrrro.......',
  '......oorrrRRRRRoo........',
  '........ooRRRRoo..........',
  '..........oooo............',
]
export function craneShelf() {
  const map = { o: 'outline', p: 'pink', q: 'red-3', r: 'red-1', R: 'red-0' }
  const l = flat(CRANE_SHELF[0].length, CRANE_SHELF.length)
  CRANE_SHELF.forEach((row, j) => [...row].forEach((ch, i) => { if (map[ch]) l.set(i, j, map[ch]) }))
  return l
}

/** Cavalo de xadrez branco, virado para a esquerda. Coordenadas 0–64 × 0–100; base em discos empilhados. */
const KNIGHT_HEAD = [
  [30, 0], [37, 8], [42, 10], [52, 22], [57, 42], [55, 60], [51, 74], [15, 74], [19, 63], [23, 52], [17, 45],
  [9, 47], [2, 43], [0, 35], [5, 26], [14, 16], [24, 8],
]
function knightArt(variant) {
  const s = variant === 'big' ? 0.68 : 0.2
  const W = Math.ceil(64 * s) + 1, H = Math.ceil(100 * s) + 1
  const l = flat(W, H)
  poly(l, KNIGHT_HEAD, 'cream-2', s)
  // Base: colar, disco do meio e disco de baixo (retângulos de cantos cortados).
  const disc = (x0, x1, y0, y1) => poly(l, [[x0 + 2, y0], [x1 - 2, y0], [x1, y0 + 2], [x1, y1], [x0, y1], [x0, y0 + 2]], 'cream-2', s)
  disc(11, 55, 73, 80)
  disc(5, 61, 80, 89)
  disc(1, 64, 89, 100)
  // Luz à esquerda (25% de cada linha), sombra à direita (25%), como os redondos da bíblia.
  for (let y = 0; y < H; y++) {
    const xs = []
    for (let x = 0; x < W; x++) if (l.opaque(x, y)) xs.push(x)
    if (!xs.length) continue
    const x0 = xs[0], x1 = xs[xs.length - 1], w = x1 - x0 + 1
    for (const x of xs) {
      const t = (x - x0) / w
      if (t < 0.22) l.set(x, y, 'cream-3')
      else if (t > 0.78) l.set(x, y, 'cream-1')
    }
  }
  // Juntas entre as peças da base, crina, olho, narina e boca.
  const ln = (y, x0, x1, c) => { for (let x = Math.round(x0 * s); x <= Math.round(x1 * s); x++) if (l.opaque(x, Math.round(y * s))) l.set(x, Math.round(y * s), c) }
  ln(73.5, 11, 55, 'cream-0'); ln(80.5, 5, 61, 'cream-0'); ln(89.5, 1, 64, 'cream-0')
  if (variant === 'big') {
    for (let k = 0; k < 7; k++) { const y = 14 + k * 8; ln(y, 40 + k * 1.6, 52 + k * 0.7, 'cream-1') } // mechas da crina
    const e = [Math.round(18 * s), Math.round(22 * s)]
    l.rect(e[0], e[1], 3, 2, 'graphite-1'); l.set(e[0], e[1], 'cream-0')
    l.rect(Math.round(4 * s), Math.round(37 * s), 2, 2, 'cream-0') // narina
    ln(44.5, 4, 14, 'cream-0') // boca
  } else {
    l.set(Math.round(18 * s), Math.round(22 * s), 'graphite-1')
  }
  return l
}

/** Raquete de tênis de mesa: lâmina com borracha vermelha (luz em cima à esquerda), garganta e cabo de madeira. */
export function paddleArt(variant) {
  const big = variant === 'big'
  const bw = big ? 48 : 16, hh = big ? 26 : 10
  const W = bw, H = bw + hh
  const l = flat(W, H)
  const r = bw / 2, c = r - 0.5
  for (let y = 0; y < bw; y++) for (let x = 0; x < bw; x++) {
    const u = (x - c) / r, v = (y - c) / r, d = u * u + v * v
    if (d >= 1) continue
    let t = 'red-2'
    if (d > (big ? 0.93 : 0.75)) t = 'red-1' // borda da borracha
    else if (u + v < -0.9 && d > 0.35) t = 'red-3' // reflexo
    else if (u + v > 0.9) t = 'red-1'
    l.set(x, y, t)
  }
  const hw = big ? 10 : 4, hx = Math.floor((W - hw) / 2)
  // garganta (madeira em leque sob a borracha) e cabo
  if (big) for (let y = bw - 8; y < bw + 2; y++) { const w = Math.max(hw, Math.round(hw + (bw - y) * 1.2)); l.rect(Math.floor((W - w) / 2), y, w, 1, l.opaque(Math.floor(W / 2), y) && y < bw - 3 ? 'red-1' : 'wood-6') }
  l.rect(hx, bw - (big ? 1 : 1), hw, hh + 1, 'wood-5')
  l.rect(hx, bw, 1, hh, 'wood-7')
  l.rect(hx + hw - (big ? 3 : 1), bw, big ? 3 : 1, hh, 'wood-4')
  if (big) for (const y of [bw + 8, bw + 18]) l.rect(hx, y, hw, 1, 'wood-3') // camadas do cabo
  return l
}

/** Item → pixels já com volume, na posição (x, y) da frente. */
function hobbySolid(key, variant, x, y) {
  const big = variant === 'big'
  if (key === 'hobby.cubo') return big ? cubeSolid(x, y, 45, 18) : cubeSolid(x, y, 17, 7)
  if (key === 'hobby.origami') return place(big ? craneArt() : craneShelf(), x, y)
  if (key === 'hobby.xadrez') return extrude(place(knightArt(variant), x, y), { depth: () => (big ? 8 : 3), top: 'cream-3', side: 'cream-0' })
  if (key === 'hobby.raquete') {
    const art = paddleArt(variant)
    const f = big ? place(art, x, y) : sheared(art, x, y, -0.18)
    return extrude(f, { depth: () => (big ? 4 : 2), top: 'wood-6', side: 'wood-2' })
  }
  throw new Error(key)
}
/** Tamanho da frente (para layout). */
const hobbySize = (key, variant) => {
  if (key === 'hobby.cubo') return variant === 'big' ? [45, 45, 18] : [17, 17, 7]
  const art = key === 'hobby.origami' ? (variant === 'big' ? craneArt() : craneShelf()) : key === 'hobby.xadrez' ? knightArt(variant) : paddleArt(variant)
  const d = { 'hobby.origami': 0, 'hobby.xadrez': variant === 'big' ? 8 : 3, 'hobby.raquete': variant === 'big' ? 4 : 2 }[key]
  return [art.W, art.H, d]
}

// ---------- itens da tábua ----------
export const decorSpine = (l, w, h, [face, dark, hi, band]) => {
  l.rect(0, 0, w, h, face); l.rect(1, 1, 1, h - 2, hi); l.rect(w - 3, 1, 2, h - 2, dark)
  for (const r of [3, h - 5]) l.rect(1, r, w - 2, 1, band)
  for (let r = 8; r < h - 9; r += 3) l.rect(Math.floor(w / 2) - 1, r, 2, 2, band) // título em "letras" de 2 px
}
export const ICON_CODE = { map: { a: 'graphite-1', r: 'red-1' }, rows: ['........', '.a....a.', 'a..r...a', 'a..r...a', '.a.r..a.', '..r.....', '........', '........'] }
export const withIcon = (name, fn) => { const prev = ICONS[name]; if (name === 'code') ICONS.code = ICON_CODE; fn(); if (!prev) delete ICONS[name] }

export function shelfItems() {
  const C = SHELF2_COLORS
  const items = []
  let x = BOARD.x + 6
  const add = (it) => { items.push({ ...it, x, y: BASE - it.h + 1 }); x += it.w + (it.gap ?? 0) }
  add({ key: 'decor.0', kind: 'decor', w: 13, h: 34, draw: (l) => decorSpine(l, 13, 34, C.decor[4]), tones: ['cream-2', 'cream-0'] })
  add({ key: 'decor.1', kind: 'decor', w: 11, h: 30, draw: (l) => decorSpine(l, 11, 30, C.decor[1]), tones: ['cream-2', 'gold-0'] })
  add({ key: 'linguagens', kind: 'book', w: 26, h: 46, color: 'red-2', draw: (l) => withIcon('code', () => spine(l, 26, 46, C.linguagens, 'code')), tones: ['cream-2', 'red-0'] })
  add({ key: 'idiomas', kind: 'book', w: 22, h: 40, color: 'blue-1', draw: (l) => spine(l, 22, 40, C.idiomas, 'globe'), tones: ['cream-2', 'blue-0'] })
  add({ key: 'decor.2', kind: 'decor', w: 14, h: 36, draw: (l) => decorSpine(l, 14, 36, C.decor[2]), tones: ['cream-2', 'teal-2'] })
  add({ key: 'decor.3', kind: 'decor', w: 11, h: 31, draw: (l) => decorSpine(l, 11, 31, C.decor[3]), tones: ['cream-2', 'mauve-1'] })
  add({ key: 'decor.4', kind: 'decor', w: 15, h: 38, gap: 9, draw: (l) => decorSpine(l, 15, 38, C.decor[0]), tones: ['cream-2', 'leaf-0'] })
  add({ key: 'ferramentas', kind: 'cartridge', w: 22, h: 28, gap: 8, color: 'gold-2', draw: (l) => cartridge(l, 22, 28, 'gold-2', 'git'), tones: ['graphite-2', 'graphite-0'], d: 5 })
  for (const [key, gap] of [['hobby.cubo', 10], ['hobby.origami', 8], ['hobby.xadrez', 10], ['hobby.raquete', 0]]) {
    const [w, h, d] = hobbySize(key, 'shelf')
    add({ key, kind: 'hobby', w, h, d, gap })
  }
  if (x > BOARD.x + BOARD.w - 4) throw new Error(`itens passam da tábua (${x})`)
  return items
}

export function frontOf(draw, w, h, x, y, scale = 1) {
  const local = flat(w, h); draw(local)
  const out = []
  for (let j = 0; j < h * scale; j++) for (let i = 0; i < w * scale; i++) {
    const p = local.get(Math.floor(i / scale), Math.floor(j / scale))
    if (p && p[3] && okXY(x + i, y + j)) out.push([idx(x + i, y + j), p.slice()])
  }
  return out
}
const solidOf = (it, { x = it.x + SEAT, y = it.y - SEAT, scale = 1 } = {}) => {
  if (it.kind === 'hobby') return hobbySolid(it.key, 'shelf', x, y)
  return extrude(frontOf(it.draw, it.w, it.h, x, y, scale), { depth: () => (it.d ?? ITEM_D) * scale, top: it.tones[0], side: it.tones[1] })
}

// ---------- cena ----------
export function boardSolid() {
  const { x, y, w, h, depth } = BOARD
  const f = rectPixels(x, y, w, h, (i, j) => (j === y ? 'wood-7' : j >= y + h - 2 ? 'wood-4' : (i * 7 + j * 13) % 29 === 0 ? 'wood-4' : 'wood-5'))
  return extrude(f, { depth: () => depth, top: 'wood-6', side: 'wood-2' })
}
export function bracketSolid(bx) {
  const y0 = BOARD.y + BOARD.h, H = 10
  const f = rectPixels(bx, y0, 4, H, (i, j) => (j - y0 > 6 && i - bx > 3 - (H - 1 - (j - y0)) ? null : i === bx ? 'graphite-2' : 'graphite-1'))
  return extrude(f, { depth: (_, yy) => Math.max(1, Math.round(BOARD.depth * (1 - (yy - y0) / H))), top: 'graphite-2', side: 'graphite-0' })
}

/**
 * Livro aberto: capa dura (sobra 3 px além das folhas e 3 px de espessura), bloco de folhas em camadas nas bordas
 * de fora e embaixo (afinando perto da lombada), páginas com a curva da dobra, sombra da lombada e cabeceado.
 */
export function openBook(color) {
  const [cx, cy, cw, ch] = BOOK.cover
  const dark = { 'red-2': 'red-0', 'blue-1': 'blue-0' }[color]
  const lite = { 'red-2': 'red-3', 'blue-1': 'sky-1' }[color]
  const mid = cx + cw / 2 // x da lombada (entre 159 e 160)
  const cover = rectPixels(cx, cy, cw, ch, (i, j) => {
    const cornerCut = (i === cx || i === cx + cw - 1) && (j === cy || j === cy + ch - 1)
    if (cornerCut) return null // cantos arredondados em 1 px
    if (j >= cy + ch - 2) return dark // borda de baixo da capa
    if (j === cy) return lite // aresta de luz
    if (Math.abs(i + 0.5 - mid) < 3) return dark // lombada (pano mais escuro entre as capas)
    return color
  })
  const solid = extrude(cover, { depth: () => 3, top: lite, side: dark })

  const over = new Map() // overlay sem contorno próprio (fica dentro da silhueta da capa)
  const set = (x, y, t) => over.set(idx(x, y), rgba(P[t]))
  const n = BOOK.stack
  const [[lx, ly, lw, lh], [rx]] = BOOK.pages
  // Bloco de folhas: camadas de 1 px, alternando cream-2 / cream-1, com uma linha cream-0 no fim (sombra na capa).
  for (let k = n; k >= 1; k--) {
    const t = k === n ? 'cream-0' : k % 2 ? 'cream-1' : 'cream-2'
    for (let y = ly + k; y < ly + lh + k; y++) { set(lx - k, y, t); set(rx + lw - 1 + k, y, t) } // bordas de fora
    const shrink = (k * 6) // as camadas somem perto da lombada (as folhas se curvam para dentro)
    for (let x = lx - k; x <= mid - shrink; x++) set(x, ly + lh - 1 + k, t)
    for (let x = mid + shrink - 1; x <= rx + lw - 1 + k; x++) set(x, ly + lh - 1 + k, t)
  }
  const pages = new Set()
  for (const [px, py, pw, ph] of BOOK.pages) {
    const left = px < mid
    for (let y = py; y < py + ph; y++) for (let x = px; x < px + pw; x++) {
      const fromGutter = left ? px + pw - 1 - x : x - px
      const fromOuter = left ? x - px : px + pw - 1 - x
      const fromBottom = py + ph - 1 - y
      // curva da página: a borda de cima desce 1–2 px junto da lombada
      const dip = fromGutter < 3 ? 2 : fromGutter < 9 ? 1 : 0
      if (y < py + dip) continue
      let t = 'cream-3'
      const sum = fromOuter + fromBottom
      if (sum < 5) t = 'cream-1' // canto dobrado (botão de página): aparece a folha de baixo
      else if (fromOuter <= 5 && fromBottom <= 5) { // a ponta dobrada, deitada sobre a página (espelho do canto)
        t = sum === 5 || fromOuter === 5 || fromBottom === 5 ? 'cream-0' : 'cream-2'
      } else if (fromGutter < 1) t = 'cream-0' // vinco da dobra
      else if (fromGutter < 3) t = 'cream-1'
      else if (fromGutter < 7) t = 'cream-2'
      else if (y === py + dip && fromOuter > 0) t = 'cream-2' // borda de cima da folha
      set(x, y, t)
      pages.add(idx(x, y))
    }
  }
  // Cabeceado: pontinha da lombada aparecendo em cima e embaixo, entre as páginas.
  for (const y of [ly - 1, ly + lh + n]) for (const x of [Math.floor(mid) - 1, Math.floor(mid)]) set(x, y, dark)
  return { solid, overlay: [...over.entries()], pages }
}

export function drawTape(c, x, y, color, dir) {
  c.object((l) => {
    for (let j = 0; j < 7; j++) for (let i = 0; i < 18; i++) {
      if ((i === 0 || i === 17) && j % 2 === 1) continue
      l.set(x + i + Math.floor(j / 3) * dir, y + j, color)
    }
  })
}
export function arrowButton(c, [x, y, w, h], dir) {
  const f = rectPixels(x, y, w, h, () => 'gold-1')
  putObject(c, extrude(f, { depth: () => 2, top: 'gold-3', side: 'gold-0' }))
  const mx = x + Math.floor(w / 2), my = y + Math.floor(h / 2)
  for (let k = 0; k < 4; k++) for (let t = -k; t <= k; t++) c.set(mx + (dir < 0 ? -2 + k : 1 - k), my + t, 'graphite-1')
}

/**
 * open: 'linguagens' | 'idiomas' | 'ferramentas' | 'hobby.cubo' | 'hobby.origami' | 'hobby.xadrez' | 'hobby.raquete'.
 * Devolve { px, items, keep } (keep = pixels sem tint à noite: páginas, folha e plaquinha, iluminadas pela tela).
 */
export function renderShelf3({ open = 'linguagens', night = false } = {}) {
  const c = flat(CW, CH)
  drawWalls(c)
  drawCurtain(c)
  const items = shelfItems()
  const board = boardSolid()
  const brackets = [44, 264].map(bracketSolid)
  const onShelf = items.filter((it) => it.key !== open)
  const shelfKeys = onShelf.map((it) => it.key)
  const solids = onShelf.map((it) => solidOf(it))
  const openIt = items.find((it) => it.key === open)
  const kind = openIt.kind

  let lower = [], extra = null, paper = []
  if (kind === 'book') { extra = openBook(openIt.color); lower = extra.solid }
  else if (kind === 'cartridge') {
    const scale = openIt.h * 3 > STAGE[3] - 18 ? 2 : 3
    const ox = STAGE[0] + Math.floor((STAGE[2] - openIt.w * scale) / 2), oy = STAGE[1] + STAGE[3] - 20 - openIt.h * scale
    lower = solidOf(openIt, { x: ox, y: oy, scale })
    paper = extrude(rectPixels(...SHEET, (i, j) => (j === SHEET[1] + SHEET[3] - 1 ? 'cream-1' : 'cream-3')), { depth: () => 2, top: 'cream-2', side: 'cream-1' })
  } else {
    // Objeto centralizado no palco (frente + profundidade centradas em x = 160), base em y 150.
    const [w, h, d] = hobbySize(open, 'big')
    const [sx, sy, sw, sh] = HOBBY.stage
    const ox = sx + Math.floor((sw - (w + d)) / 2), oy = sy + sh - 4 - h
    lower = hobbySolid(open, 'big', ox, oy)
    const [px, py, pw, ph] = HOBBY.plate
    paper = extrude(rectPixels(px, py, pw, ph, (i, j) => (j === py + ph - 1 ? 'cream-1' : 'cream-3')), { depth: () => 2, top: 'cream-2', side: 'cream-1' })
  }

  shadowOnWall(c, [...board, ...brackets.flat(), ...solids.flat()].map(([i]) => i), [-4, 4])
  c.rect(BOARD.x + BOARD.depth, BOARD.y + BOARD.h, BOARD.w - 6, 2, 'wall-0') // oclusão sob a tábua
  shadowOnWall(c, [...lower, ...paper].map(([i]) => i), [-4, 4])

  for (const b of brackets) putObject(c, b)
  putObject(c, board)
  // O tsuru da tábua já traz o contorno desenhado à mão.
  solids.forEach((s, n) => (shelfKeys[n] === 'hobby.origami' ? c.object((l) => { for (const [i, p] of s) l.px.set(p, i * 4) }, { outline: false }) : putObject(c, s)))
  const keep = new Set()
  putObject(c, lower)
  if (kind === 'book') {
    c.object((l) => { for (const [i, p] of extra.overlay) l.px.set(p, i * 4) }, { outline: false })
    for (const i of extra.pages) keep.add(i)
  } else {
    putObject(c, paper)
    for (const [i] of paper) keep.add(i)
    if (kind === 'cartridge') {
      drawTape(c, SHEET[0] + 8, SHEET[1] - 4, 'pink', 1)
      drawTape(c, SHEET[0] + SHEET[2] - 26, SHEET[1] - 4, 'teal-3', -1)
      arrowButton(c, ARROWS.prev, -1)
      arrowButton(c, ARROWS.next, 1)
    } else {
      arrowButton(c, HOBBY.arrows.prev, -1)
      arrowButton(c, HOBBY.arrows.next, 1)
    }
  }
  let px = c.px
  if (night) {
    px = multiply(px, TINT.night, (i) => keep.has(i))
    for (let y = 0; y < CH; y++) for (const x of [310, 311]) px.set(rgba(P['teal-3']), (y * CW + x) * 4)
  }
  return { px, items, keep }
}

// ---------- mockups do DOM ----------
export const H2 = (c, x, y, s, color = 'graphite-1') => text(c, x, y, s, color, 2)
export const allIcons = () => ({ ...ICONS, code: ICON_CODE })
export function iconBig(c, x, y, name, s = 2) {
  const icon = allIcons()[name]; if (!icon) return
  icon.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (icon.map[ch]) c.rect(x + i * s, y + j * s, s, s, icon.map[ch]) }))
}
export function pageSumario(c, [x, y, w], skills) {
  H2(c, x, y, 'Linguagens')
  text(c, x, y + 13, 'Sumário', 'red-1')
  c.rect(x, y + 20, w, 1, 'red-3')
  skills.tecnicas.forEach((s, k) => {
    const yy = y + 24 + k * 6
    text(c, x, yy, s.nome, 'graphite-1')
    const lv = String(s.nivel)
    text(c, x + w - textW(lv), yy, lv, 'graphite-2')
    bar(c, x + 50, yy + 2, w - 60, s.nivel, 'red-2')
  })
}
export function pageLang(c, [x, y, w, h], s, n) {
  c.rect(x, y, 20, 20, 'cream-2'); c.border(x, y, 20, 20, 'red-1')
  iconBig(c, x + 2, y + 2, s.icon)
  H2(c, x + 24, y + 2, s.nome.length > 9 ? s.nome.split(' ')[0] : s.nome)
  text(c, x + 24, y + 15, `nível ${s.nivel}/100`, 'graphite-2')
  bar(c, x, y + 25, w, s.nivel, 'red-2')
  text(c, x, y + 32, 'Onde usei', 'red-1')
  const used = projectsUsing(s.nome)
  if (!used.length) text(c, x, y + 40, '(nenhum projeto ainda)', 'cream-0')
  used.forEach((t, k) => { c.rect(x, y + 41 + k * 7, 2, 2, 'red-2'); text(c, x + 4, y + 40 + k * 7, t.length > 24 ? t.slice(0, 23) + '.' : t, 'teal-2') })
  text(c, x + w - textW(String(n)), y + h - 5, String(n), 'cream-0')
}
export function pageIdioma(c, [x, y, w, h], lang, value, n) {
  iconBig(c, x, y, 'globe')
  H2(c, x + 22, y + 2, lang.nome)
  text(c, x, y + 22, lang.nivel, 'graphite-2')
  bar(c, x, y + 30, w, value, 'blue-1')
  text(c, x, y + 38, 'Certificados / uso', 'red-1')
  for (let r = 0; r < 2; r++) c.rect(x, y + 46 + r * 7, [80, 60][r], 4, 'cream-1')
  text(c, x + w - textW(String(n)), y + h - 5, String(n), 'cream-0')
}
function sheetText(c, [x, y, w], kicker, title, count) {
  text(c, x, y, kicker, 'red-1')
  H2(c, x, y + 8, title)
  c.rect(x, y + 21, w, 1, 'red-3')
  for (let r = 0; r < 4; r++) c.rect(x, y + 26 + r * 7, [150, 140, 152, 90][r], 4, 'cream-1')
  text(c, x, y + 58, 'texto a escrever (Davi)', 'cream-0')
  text(c, x + w - textW(count), y + 66, count, 'teal-2')
}
export const HOBBY_NAMES = { 'hobby.cubo': 'Cubo mágico', 'hobby.origami': 'Origami', 'hobby.xadrez': 'Xadrez', 'hobby.raquete': 'Tênis de mesa' }
function caption(c, key) {
  const [x, y, w] = HOBBY.caption
  const name = HOBBY_NAMES[key]
  H2(c, x + Math.floor((w - textW(name, 2)) / 2), y + 1, name)
}

function mock(c, open, mockOpen, skills) {
  switch (mockOpen) {
    case 'sumario': pageSumario(c, BOOK_CONTENT.left, skills); pageLang(c, BOOK_CONTENT.right, skills.tecnicas[0], 1); break
    case 'linguagens': pageLang(c, BOOK_CONTENT.left, skills.tecnicas[2], 4); pageLang(c, BOOK_CONTENT.right, skills.tecnicas[3], 5); break
    case 'idiomas': pageIdioma(c, BOOK_CONTENT.left, skills.idiomas[0], 100, 1); pageIdioma(c, BOOK_CONTENT.right, skills.idiomas[1], 75, 2); break
    case 'ferramentas': sheetText(c, OBJECT_CONTENT, 'Ferramentas', skills.ferramentas[0], `1/${skills.ferramentas.length}`); break
    default: if (open.startsWith('hobby.')) caption(c, open)
  }
}

export function dotted(c, [x, y, w, h], color) {
  for (let i = 0; i < w; i += 2) { c.set(x + i, y, color); c.set(x + i, y + h - 1, color) }
  for (let j = 0; j < h; j += 2) { c.set(x, y + j, color); c.set(x + w - 1, y + j, color) }
}

export function renderShelf3Previews() {
  const skills = loadSkills()
  const scene = (open, night = false, mockOpen = open) => {
    const r = renderShelf3({ open, night })
    for (const e of lint(r.px)) if (!night) throw new Error(`shelf3 ${open}: ${e}`)
    const c = flat(CW, CH); c.px.set(r.px)
    mock(c, open, mockOpen, skills)
    return { c, items: r.items }
  }
  const states = [
    scene('linguagens', false, 'sumario'), scene('linguagens'),
    scene('idiomas'), scene('ferramentas'),
    scene('hobby.cubo'), scene('hobby.origami'),
    scene('hobby.xadrez'), scene('hobby.raquete'),
    scene('linguagens', true, 'sumario'), scene('hobby.origami', true),
  ]
  const gap = 6, cols = 2, rows = Math.ceil(states.length / cols)
  const W = CW * cols + gap * (cols - 1), H = CH * rows + gap * (rows - 1)
  const sheet = new Uint8Array(W * H * 4)
  for (let i = 0; i < W * H; i++) sheet.set(rgba(UI_BG), i * 4)
  states.forEach((s, n) => blit(sheet, W, H, s.c.px, CW, CH, (n % cols) * (CW + gap), Math.floor(n / cols) * (CH + gap)))

  // Retângulos: livro (conteúdo, cantos), cartucho (conteúdo, setas), hobby (legenda, setas, palco); cliques.
  const base = renderShelf3({ open: 'linguagens' })
  const panels = [['linguagens'], ['ferramentas'], ['hobby.xadrez']].map(([open]) => { const c = flat(CW, CH); c.px.set(renderShelf3({ open }).px); return c })
  const [rb, rc, rh] = panels
  for (const r of [BOOK_CONTENT.left, BOOK_CONTENT.right]) dotted(rb, r, 'red-1')
  for (const r of Object.values(PAGE_TURN)) dotted(rb, r, 'leaf-0')
  dotted(rc, OBJECT_CONTENT, 'red-1')
  for (const r of Object.values(ARROWS)) dotted(rc, r, 'leaf-0')
  dotted(rh, HOBBY.caption, 'red-1')
  dotted(rh, HOBBY.stage, 'gold-0')
  for (const r of Object.values(HOBBY.arrows)) dotted(rh, r, 'leaf-0')
  for (const it of base.items.filter((i) => i.kind !== 'decor')) {
    const d = it.d ?? ITEM_D, sh = it.key === 'hobby.raquete' ? 5 : 0
    const r = [it.x + SEAT - sh, it.y - SEAT - d, it.w + d + sh, it.h + d]
    for (const p of panels) dotted(p, r, 'sky-0')
    console.log(`  ${it.key.padEnd(14)} clique ${r.join(', ')}`)
  }
  const RW3 = CW * 3 + gap * 2
  const rects = new Uint8Array(RW3 * CH * 4)
  for (let i = 0; i < RW3 * CH; i++) rects.set(rgba(UI_BG), i * 4)
  panels.forEach((p, n) => blit(rects, RW3, CH, p.px, CW, CH, n * (CW + gap), 0))
  return [
    { name: 'm3-shelf3-closeup-sheet', px: sheet, w: W, h: H },
    { name: 'm3-shelf3-closeup-rects', px: rects, w: RW3, h: CH },
  ]
}
