// Visão de perto da prateleira, 4ª proposta (2026-11-07). A 3ª continua em closeup-shelf3.mjs, para comparação.
// Spec: docs/arte/specs.md §4. APROVADA (2026-11-07): exportada por build-bookshelf.mjs (pnpm art) a partir de shelf4Layers.
//
// Mudanças em relação à shelf3:
// - hobbies sem plaquinha nem legenda: só o objeto centralizado e as duas setas;
// - cavalo de xadrez escuro (azul-marinho, realce frio), desenho original: pescoço em "S", crina marcada por um
//   sulco paralelo às costas, orelha pontuda, focinho com a boca, luz da esquerda em 4 tons, colar e pé em degraus;
// - raquete deitada na tábua (ampliada continua em pé, que lê melhor);
// - cartucho: cartucho ampliado + cartão com a lista de ferramentas (ícone + 1 linha cada, até 5), sem setas;
// - noite: o elemento em destaque (hobby, cartucho + cartão, livro aberto) fica com as cores de dia; só o fundo escurece.
import { rgba } from '../lib.mjs'
import { P, TINT, UI_BG } from '../palette.mjs'
import { flat } from '../flat.mjs'
import { blit, lint, multiply } from '../sheet.mjs'
import { SHELF2_COLORS } from './bookshelf.mjs'
import { cartridge, CH, CW, drawCurtain, drawWalls, loadSkills, spine, text, textW } from './closeup-bookshelf.mjs'
import { extrude, putObject, rectPixels, shadowOnWall } from './closeup-3d.mjs'
import {
  arrowButton, BASE, BOARD, BOOK_CONTENT, boardSolid, bracketSolid, craneArt, craneShelf, cubeSolid, decorSpine, dotted, drawTape,
  H2, HOBBY, iconBig, ITEM_D, openBook, PAGE_TURN, pageIdioma, pageLang, pageSumario, paddleArt, place, poly, SEAT, withIcon, frontOf,
} from './closeup-shelf3.mjs'

// ---------- layouts novos ----------
export const HOBBY4 = { stage: HOBBY.stage, arrows: HOBBY.arrows } // sem plaquinha nem legenda
export const TOOLS = {
  stage: [28, 76, 82, 96], // cartucho ×3 centrado
  card: [118, 76, 174, 98], // cartão de papel, 2 px de espessura, fitas pink / teal-3
  content: [126, 84, 158, 82], // título + até 5 linhas (ícone 8×8 + texto), passo de 12 px
  rowPitch: 12,
}

// ---------- cavalo escuro ----------
// Coordenadas 0–64 × 0–100, virado para a esquerda. Contorno de trás em "S" (crista convexa, cintura côncava,
// peito convexo); frente do pescoço côncava sob o queixo.
const KNIGHT4_HEAD = [
  [29, 0], [35, 7], [41, 11], [48, 18], [54, 29], [56, 41], [53, 52], [50, 60], [52, 68], [51, 75],
  [14, 75], [16, 67], [21, 58], [24, 51], [19, 47], [9, 47], [3, 44], [0, 37], [3, 29], [10, 20], [18, 12], [24, 7], [26, 2],
]
// Retoque aprovado (2026-11-07): no ampliado, as costas descem retas da cintura até o colar (x 50), em vez de
// 50 → 52 → 51. O degrau para fora virava, na extrusão, riscos de luz serrilhados onde o pescoço encontra o colar.
// A versão da tábua (×0,25) continua com o contorno original.
const KNIGHT4_HEAD_BIG = KNIGHT4_HEAD.map((p, k) => (k === 8 ? [50, 68] : k === 9 ? [50, 75] : p))
/** Linha (y) → x da borda de trás no contorno (interpolada), para o sulco da crina correr paralelo às costas. */
const backAt = (y, head = KNIGHT4_HEAD) => {
  const back = head.slice(0, 10)
  for (let k = 0; k < back.length - 1; k++) {
    const [x0, y0] = back[k], [x1, y1] = back[k + 1]
    if (y >= y0 && y <= y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0 || 1)
  }
  return back[back.length - 1][0]
}
export function knight4Art(variant) {
  const big = variant === 'big'
  const s = big ? 0.72 : 0.25
  const W = Math.ceil(66 * s) + 1, H = Math.ceil(100 * s) + 1
  const l = flat(W, H)
  const head = big ? KNIGHT4_HEAD_BIG : KNIGHT4_HEAD
  poly(l, head, 'blue-0', s)
  // Base: colar (anel), cintura, degrau e pé largo.
  const parts = [[10, 56, 74, 80], [15, 51, 80, 84], [6, 60, 84, 91], [1, 65, 91, 100]]
  const disc = ([x0, x1, y0, y1]) => poly(l, [[x0 + 1.5, y0], [x1 - 1.5, y0], [x1, y0 + 1.5], [x1, y1], [x0, y1], [x0, y0 + 1.5]], 'blue-0', s)
  parts.forEach(disc)
  const headEnd = Math.round(74 * s)
  // Luz da esquerda em 4 tons: fio teal-3 na frente (só na cabeça/pescoço), faixa blue-1, meio blue-0, sombra teal-1, fundo teal-0.
  for (let y = 0; y < H; y++) {
    const xs = []
    for (let x = 0; x < W; x++) if (l.opaque(x, y)) xs.push(x)
    if (!xs.length) continue
    const x0 = xs[0], x1 = xs[xs.length - 1], w = x1 - x0 + 1
    for (const x of xs) {
      const t = (x - x0) / w
      let c = 'blue-0'
      if (t < 0.24) c = 'blue-1'
      else if (t > 0.86) c = 'teal-0'
      else if (t > 0.68) c = 'teal-1'
      l.set(x, y, c)
    }
    if (y <= headEnd && big) l.set(x0, y, 'teal-3')
    if (y <= headEnd && big && w > 8) l.set(x0 + 1, y, 'teal-3')
  }
  // Degraus da base: aresta de cima clara, junta escura embaixo.
  for (const [x0, x1, y0, y1] of parts) {
    const ty = Math.round(y0 * s), by = Math.round(y1 * s) - 1
    for (let x = Math.round(x0 * s); x <= Math.round(x1 * s); x++) {
      if (l.opaque(x, ty) && x < Math.round((x0 + (x1 - x0) * 0.7) * s)) l.set(x, ty, 'sky-1')
      if (big && l.opaque(x, by)) l.set(x, by, 'teal-0')
    }
  }
  if (big) {
    // Crina: sulco graphite-0 paralelo às costas, com a aresta da crina (blue-1) logo à direita.
    for (let yy = 9; yy <= 70; yy += 0.5) {
      const bx = backAt(yy, head) - (yy < 16 ? 6 : 9)
      const x = Math.round(bx * s), y = Math.round(yy * s)
      if (l.opaque(x, y) && l.opaque(x + 2, y)) { l.set(x, y, 'graphite-0'); l.set(x + 1, y, 'blue-1') }
    }
    // Orelha: dobra interna escura.
    for (let yy = 3; yy < 12; yy++) { const x = Math.round((29 + (yy - 3) * 0.5) * s); l.set(x, Math.round(yy * s), 'teal-0') }
    // Olho (com brilho), narina e boca.
    const ex = Math.round(17 * s), ey = Math.round(22 * s)
    l.rect(ex, ey, 3, 2, 'graphite-0'); l.set(ex, ey, 'sky-1')
    l.rect(Math.round(4 * s), Math.round(35 * s), 2, 2, 'graphite-0')
    for (let x = Math.round(2 * s); x <= Math.round(13 * s); x++) l.set(x, Math.round(42.5 * s), 'graphite-0')
    // Bochecha (sombra sob o olho até a boca, separa o focinho do pescoço).
    for (let yy = 28; yy < 46; yy++) { const x = Math.round((20 - (yy - 28) * 0.15) * s); if (l.opaque(x, Math.round(yy * s))) l.set(x, Math.round(yy * s), 'teal-1') }
  } else {
    l.set(Math.round(17 * s), Math.round(22 * s), 'graphite-0')
    for (let yy = 12; yy <= 66; yy += 2) { const x = Math.round((backAt(yy) - 10) * s), y = Math.round(yy * s); if (l.opaque(x + 1, y)) l.set(x, y, 'graphite-0') }
  }
  return l
}

// ---------- raquete deitada na tábua (mapa à mão com contorno) ----------
function paddleFlat() {
  // Lâmina = elipse achatada (vista de cima, 13×5 de raio) com a aresta de madeira 1 px embaixo; cabo para a esquerda.
  const rx = 12.5, ry = 5, hl = 12, W = hl + 2 * Math.ceil(rx) + 2, H = 2 * ry + 3
  const l = flat(W, H)
  const cx = hl + rx + 0.5, cy = ry + 0.5
  const inE = (x, y, dy = 0) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy - dy) / ry) ** 2 < 1
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (inE(x, y)) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry
      l.set(x, y, u + v < -0.7 ? 'red-3' : u + 2 * v > 1.1 ? 'red-1' : 'red-2')
    } else if (inE(x, y, 1)) l.set(x, y, 'wood-2') // espessura da lâmina
  }
  for (let x = 1; x <= hl + 2; x++) { l.set(x, ry, 'wood-7'); l.set(x, ry + 1, 'wood-5'); l.set(x, ry + 2, 'wood-4') } // cabo
  for (let x = hl - 2; x <= hl + 2; x++) l.set(x, ry - 1, 'wood-6') // garganta
  // contorno de 1 px
  const edge = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (l.opaque(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !l.opaque(x + a, y + b))) edge.push([x, y])
  for (const [x, y] of edge) l.set(x, y, 'outline')
  return l
}

const HAND = new Set(['hobby.origami', 'hobby.raquete']) // mapas com contorno já desenhado (na tábua)
function hobbySolid(key, variant, x, y) {
  const big = variant === 'big'
  if (key === 'hobby.cubo') return big ? cubeSolid(x, y, 45, 18) : cubeSolid(x, y, 17, 7)
  if (key === 'hobby.origami') return place(big ? craneArt() : craneShelf(), x, y)
  if (key === 'hobby.xadrez') return extrude(place(knight4Art(variant), x, y), { depth: () => (big ? 8 : 3), top: 'blue-1', side: 'teal-0' })
  if (key === 'hobby.raquete') {
    if (!big) return place(paddleFlat(), x, y)
    return extrude(place(paddleArt('big'), x, y), { depth: () => 4, top: 'wood-6', side: 'wood-2' })
  }
  throw new Error(key)
}
const hobbySize = (key, variant) => {
  const big = variant === 'big'
  if (key === 'hobby.cubo') return big ? [45, 45, 18] : [17, 17, 7]
  if (key === 'hobby.origami') { const a = big ? craneArt() : craneShelf(); return [a.W, a.H, 0] }
  if (key === 'hobby.xadrez') { const a = knight4Art(variant); return [a.W, a.H, big ? 8 : 3] }
  if (big) { const a = paddleArt('big'); return [a.W, a.H, 4] }
  const a = paddleFlat(); return [a.W, a.H, 0]
}

// ---------- itens da tábua ----------
function shelfItems() {
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
  add({ key: 'decor.4', kind: 'decor', w: 15, h: 38, gap: 7, draw: (l) => decorSpine(l, 15, 38, C.decor[0]), tones: ['cream-2', 'leaf-0'] })
  add({ key: 'ferramentas', kind: 'cartridge', w: 22, h: 28, gap: 8, draw: (l) => cartridge(l, 22, 28, 'gold-2', 'git'), tones: ['graphite-2', 'graphite-0'], d: 5 })
  // Cavalo (escuro) longe do cartucho (grafite): o cubo e o tsuru ficam entre os dois.
  for (const [key, gap] of [['hobby.cubo', 9], ['hobby.origami', 4], ['hobby.xadrez', -2], ['hobby.raquete', 0]]) {
    const [w, h, d] = hobbySize(key, 'shelf')
    add({ key, kind: 'hobby', w, h, d, gap })
  }
  if (x > BOARD.x + BOARD.w) throw new Error(`itens passam da tábua (${x})`)
  return items
}
// Posição da frente dos itens na tábua: a base fica 3 px atrás da aresta da frente (linha 55), para
// o item mais fundo (8 px) terminar em 11 px e não passar do fundo da tábua (14 px).
const SIT_X = SEAT, SIT_Y = 2
const solidOf = (it, { x = it.x + SIT_X, y = it.y + SIT_Y, scale = 1 } = {}) => {
  if (it.kind === 'hobby') return hobbySolid(it.key, 'shelf', x - (it.key === 'hobby.raquete' ? 6 : 0), it.key === 'hobby.raquete' ? it.y + 2 : y)
  return extrude(frontOf(it.draw, it.w, it.h, x, y, scale), { depth: () => (it.d ?? ITEM_D) * scale, top: it.tones[0], side: it.tones[1] })
}

/** open: 'linguagens' | 'idiomas' | 'ferramentas' | 'hobby.*'. keep = pixels do destaque, sem tint à noite. */
export function renderShelf4({ open = 'linguagens', night = false } = {}) {
  const c = flat(CW, CH)
  drawWalls(c)
  drawCurtain(c)
  const items = shelfItems()
  const board = boardSolid()
  const brackets = [44, 264].map(bracketSolid)
  const onShelf = items.filter((it) => it.key !== open)
  const solids = onShelf.map((it) => solidOf(it))
  const openIt = items.find((it) => it.key === open)
  const kind = openIt.kind

  let lower = [], extra = null, paper = []
  if (kind === 'book') { extra = openBook(openIt.color); lower = extra.solid }
  else if (kind === 'cartridge') {
    const scale = 3, [sx, sy, sw, sh] = TOOLS.stage
    const ox = sx + Math.floor((sw - (openIt.w + openIt.d) * scale) / 2) + 2, oy = sy + Math.floor((sh - openIt.h * scale) / 2) + 4
    lower = solidOf(openIt, { x: ox, y: oy, scale })
    const K = TOOLS.card
    paper = extrude(rectPixels(...K, (i, j) => (j === K[1] + K[3] - 1 ? 'cream-1' : 'cream-3')), { depth: () => 2, top: 'cream-2', side: 'cream-1' })
  } else {
    const [w, h, d] = hobbySize(open, 'big')
    const [sx, sy, sw, sh] = HOBBY4.stage
    const ox = sx + Math.floor((sw - (w + d)) / 2), oy = sy + sh - 4 - h + 6 // sem plaquinha: o objeto desce 6 px
    lower = hobbySolid(open, 'big', ox, oy)
  }

  shadowOnWall(c, [...board, ...brackets.flat(), ...solids.flat()].map(([i]) => i), [-4, 4])
  c.rect(BOARD.x + BOARD.depth, BOARD.y + BOARD.h, BOARD.w - 6, 2, 'wall-0')
  shadowOnWall(c, [...lower, ...paper].map(([i]) => i), [-4, 4])

  for (const b of brackets) putObject(c, b)
  putObject(c, board)
  solids.forEach((s, n) => (HAND.has(onShelf[n].key) ? c.object((l) => { for (const [i, p] of s) l.px.set(p, i * 4) }, { outline: false }) : putObject(c, s)))

  // keep: tudo o que está em destaque (com o contorno) fica com as cores de dia à noite.
  const before = c.px.slice()
  putObject(c, lower)
  if (kind === 'book') c.object((l) => { for (const [i, p] of extra.overlay) l.px.set(p, i * 4) }, { outline: false })
  else if (kind === 'cartridge') {
    putObject(c, paper)
    drawTape(c, TOOLS.card[0] + 8, TOOLS.card[1] - 4, 'pink', 1)
    drawTape(c, TOOLS.card[0] + TOOLS.card[2] - 26, TOOLS.card[1] - 4, 'teal-3', -1)
  }
  const keep = new Set()
  for (let i = 0; i < CW * CH; i++) for (let k = 0; k < 4; k++) if (c.px[i * 4 + k] !== before[i * 4 + k]) { keep.add(i); break }
  if (kind === 'hobby') { arrowButton(c, HOBBY4.arrows.prev, -1); arrowButton(c, HOBBY4.arrows.next, 1) }

  let px = c.px
  if (night) {
    px = multiply(px, TINT.night, (i) => keep.has(i))
    for (let y = 0; y < CH; y++) for (const x of [310, 311]) px.set(rgba(P['teal-3']), (y * CW + x) * 4)
  }
  return { px, items, keep }
}

// ---------- mockups do DOM ----------
const MOA_ICON = 'chart' // placeholder até haver ícone próprio
function toolList(c, tools) {
  const [x, y, w] = TOOLS.content
  H2(c, x, y, 'Ferramentas')
  c.rect(x, y + 13, w, 1, 'red-3')
  tools.forEach((t, k) => {
    const yy = y + 18 + k * TOOLS.rowPitch
    iconBig(c, x, yy, t === 'Git' ? 'git' : MOA_ICON, 1)
    text(c, x + 12, yy + 1, t, 'graphite-1')
    text(c, x + 12 + textW(t) + 6, yy + 1, '- texto curto (Davi)', 'cream-0')
  })
  for (let k = tools.length; k < 5; k++) { const yy = y + 18 + k * TOOLS.rowPitch; c.rect(x, yy, 8, 8, 'cream-2'); c.rect(x + 12, yy + 2, 70, 4, 'cream-2') }
}
function mock(c, open, mockOpen, skills) {
  switch (mockOpen) {
    case 'sumario': pageSumario(c, BOOK_CONTENT.left, skills); pageLang(c, BOOK_CONTENT.right, skills.tecnicas[0], 1); break
    case 'linguagens': pageLang(c, BOOK_CONTENT.left, skills.tecnicas[2], 4); pageLang(c, BOOK_CONTENT.right, skills.tecnicas[3], 5); break
    case 'idiomas': pageIdioma(c, BOOK_CONTENT.left, skills.idiomas[0], 100, 1); pageIdioma(c, BOOK_CONTENT.right, skills.idiomas[1], 75, 2); break
    case 'ferramentas': toolList(c, skills.ferramentas); break
    default: // hobbies: sem texto
  }
}

export function renderShelf4Previews() {
  const skills = loadSkills()
  const scene = (open, night = false, mockOpen = open) => {
    const r = renderShelf4({ open, night })
    const errs = lint(r.px, { palette: !night })
    if (errs.length) throw new Error(`shelf4 ${open}: ${errs.join(', ')}`)
    if (night) { // o destaque, que fica sem tint, tem de estar na paleta
      const sub = new Uint8Array(CW * CH * 4)
      for (const i of r.keep) sub.set(r.px.subarray(i * 4, i * 4 + 4), i * 4)
      const e2 = lint(sub); if (e2.length) throw new Error(`shelf4 ${open} noite (destaque): ${e2.join(', ')}`)
    }
    const c = flat(CW, CH); c.px.set(r.px)
    mock(c, open, mockOpen, skills)
    return { c, items: r.items }
  }
  const states = [
    scene('linguagens', false, 'sumario'), scene('idiomas'),
    scene('ferramentas'), scene('hobby.cubo'),
    scene('hobby.origami'), scene('hobby.xadrez'),
    scene('hobby.raquete'), scene('hobby.xadrez', true),
    scene('ferramentas', true), scene('linguagens', true, 'sumario'),
  ]
  const gap = 6, cols = 2, rows = Math.ceil(states.length / cols)
  const W = CW * cols + gap * (cols - 1), H = CH * rows + gap * (rows - 1)
  const sheet = new Uint8Array(W * H * 4)
  for (let i = 0; i < W * H; i++) sheet.set(rgba(UI_BG), i * 4)
  states.forEach((s, n) => blit(sheet, W, H, s.c.px, CW, CH, (n % cols) * (CW + gap), Math.floor(n / cols) * (CH + gap)))

  const base = renderShelf4({ open: 'linguagens' })
  const panels = ['linguagens', 'ferramentas', 'hobby.xadrez'].map((open) => { const c = flat(CW, CH); c.px.set(renderShelf4({ open }).px); return c })
  const [rb, rc, rh] = panels
  for (const r of [BOOK_CONTENT.left, BOOK_CONTENT.right]) dotted(rb, r, 'red-1')
  for (const r of Object.values(PAGE_TURN)) dotted(rb, r, 'leaf-0')
  dotted(rc, TOOLS.content, 'red-1')
  dotted(rc, TOOLS.stage, 'gold-0')
  dotted(rh, HOBBY4.stage, 'gold-0')
  for (const r of Object.values(HOBBY4.arrows)) dotted(rh, r, 'leaf-0')
  for (const it of base.items.filter((i) => i.kind !== 'decor')) {
    const d = it.d ?? ITEM_D
    const r = it.key === 'hobby.raquete' || it.key === 'hobby.origami'
      ? (it.key === 'hobby.raquete' ? [it.x + SIT_X - 6, it.y + 2, it.w, it.h] : [it.x + SIT_X, it.y + SIT_Y, it.w, it.h])
      : [it.x + SIT_X, it.y + SIT_Y - d, it.w + d, it.h + d]
    for (const p of panels) dotted(p, r, 'sky-0')
    console.log(`  ${it.key.padEnd(14)} clique ${r.join(', ')}`)
  }
  const RW3 = CW * 3 + gap * 2
  const rects = new Uint8Array(RW3 * CH * 4)
  for (let i = 0; i < RW3 * CH; i++) rects.set(rgba(UI_BG), i * 4)
  panels.forEach((p, n) => blit(rects, RW3, CH, p.px, CW, CH, n * (CW + gap), 0))
  return [
    { name: 'm3-shelf4-closeup-sheet', px: sheet, w: W, h: H },
    { name: 'm3-shelf4-closeup-rects', px: rects, w: RW3, h: CH },
  ]
}

// ---------- camadas para exportação (pnpm art → public/assets/ui/closeup-bookshelf.*) ----------
// A cena é a mesma de renderShelf4, separada em camadas que o React compõe na ordem abaixo. `composeShelf4`
// refaz a cena a partir das camadas; o build confere que o resultado é idêntico a renderShelf4 em todos os
// estados (dia e noite), pixel a pixel.
//
// Ordem: fundo → sombra do destaque → sombras dos itens → peças da tábua (decoração e itens, na ordem da
// lista, pulando o item aberto) → destaque (cores de dia também à noite) → setas (só nos hobbies).

/** Chaves internas da cena → ids do export (os mesmos de src/content/<lang>/skills.json). */
export const SHELF4_IDS = {
  linguagens: 'languages', idiomas: 'spoken-languages', ferramentas: 'tools',
  'hobby.cubo': 'rubiks-cube', 'hobby.origami': 'origami', 'hobby.xadrez': 'chess', 'hobby.raquete': 'table-tennis',
}

const blank = () => flat(CW, CH)
const tint = (px) => multiply(px, TINT.night)
const dayNight = (px) => ({ day: px, night: tint(px) })

export function shelf4Layers() {
  const items = shelfItems()
  const board = boardSolid()
  const brackets = [44, 264].map(bracketSolid)
  const boardSet = new Set([...board, ...brackets.flat()].map(([i]) => i))
  const drawSolid = (c, it, s) => (HAND.has(it.key) ? c.object((l) => { for (const [i, p] of s) l.px.set(p, i * 4) }, { outline: false }) : putObject(c, s))
  /** Sombra na parede de um conjunto de pixels, sem os próprios pixels e sem o que a tábua/mãos-francesas cobrem. */
  const shadowOf = (ids) => {
    const own = new Set(ids), c = blank()
    for (const i of ids) {
      const x = (i % CW) - 4, y = Math.floor(i / CW) + 4, t = y * CW + x
      if (x >= 0 && y >= 0 && x < CW && y < CH && !own.has(t) && !boardSet.has(t)) c.set(x, y, 'wall-0')
    }
    return c.px
  }

  // Peças da tábua: decoração contígua vira um grupo só (decor-a, decor-b); cada item clicável é uma peça.
  const pieces = []
  for (const it of items) {
    const s = solidOf(it)
    const last = pieces[pieces.length - 1]
    if (it.kind === 'decor' && last?.kind === 'decor') { last.members.push([it, s]); continue }
    pieces.push({ key: it.kind === 'decor' ? `decor-${'ab'[pieces.filter((p) => p.kind === 'decor').length]}` : it.key, kind: it.kind, members: [[it, s]] })
  }
  for (const p of pieces) {
    const c = blank()
    for (const [it, s] of p.members) drawSolid(c, it, s)
    Object.assign(p, dayNight(c.px))
    p.ids = p.members.flatMap(([, s]) => s.map(([i]) => i))
    p.shadow = p.kind === 'decor' ? null : dayNight(shadowOf(p.ids))
  }

  // Fundo: parede, cortina, sombras da tábua e da decoração, oclusão, mãos-francesas e tábua.
  const bg = blank()
  drawWalls(bg)
  drawCurtain(bg)
  shadowOnWall(bg, [...board, ...brackets.flat(), ...pieces.filter((p) => p.kind === 'decor').flatMap((p) => p.ids.map((i) => [i]))].map(([i]) => i), [-4, 4])
  bg.rect(BOARD.x + BOARD.depth, BOARD.y + BOARD.h, BOARD.w - 6, 2, 'wall-0')
  for (const b of brackets) putObject(bg, b)
  putObject(bg, board)
  const bgNight = tint(bg.px)
  for (let y = 0; y < CH; y++) for (const x of [310, 311]) bgNight.set(rgba(P['teal-3']), (y * CW + x) * 4)

  // Destaques (o que aparece embaixo quando o item é aberto), nas cores de dia.
  const highlight = {}, hlShadow = {}
  for (const it of items.filter((i) => i.kind !== 'decor')) {
    const parts = []
    let ids = []
    if (it.kind === 'book') {
      const b = openBook(it.color), c = blank()
      putObject(c, b.solid)
      c.object((l) => { for (const [i, p] of b.overlay) l.px.set(p, i * 4) }, { outline: false })
      parts.push({ part: 'book', px: c.px })
      ids = b.solid.map(([i]) => i)
    } else if (it.kind === 'cartridge') {
      const scale = 3, [sx, sy, sw, sh] = TOOLS.stage
      const ox = sx + Math.floor((sw - (it.w + it.d) * scale) / 2) + 2, oy = sy + Math.floor((sh - it.h * scale) / 2) + 4
      const lower = solidOf(it, { x: ox, y: oy, scale })
      const K = TOOLS.card
      const paper = extrude(rectPixels(...K, (i, j) => (j === K[1] + K[3] - 1 ? 'cream-1' : 'cream-3')), { depth: () => 2, top: 'cream-2', side: 'cream-1' })
      const big = blank(); putObject(big, lower)
      const card = blank(); putObject(card, paper)
      drawTape(card, K[0] + 8, K[1] - 4, 'pink', 1)
      drawTape(card, K[0] + K[2] - 26, K[1] - 4, 'teal-3', -1)
      parts.push({ part: 'big', px: big.px }, { part: 'card', px: card.px })
      ids = [...lower, ...paper].map(([i]) => i)
    } else {
      const [w, h, d] = hobbySize(it.key, 'big')
      const [sx, sy, sw, sh] = HOBBY4.stage
      const lower = hobbySolid(it.key, 'big', sx + Math.floor((sw - (w + d)) / 2), sy + sh - 4 - h + 6)
      const c = blank(); putObject(c, lower)
      parts.push({ part: 'big', px: c.px })
      ids = lower.map(([i]) => i)
    }
    highlight[it.key] = parts
    hlShadow[it.key] = dayNight(shadowOf(ids))
  }

  const arrows = {}
  for (const [name, dir] of [['prev', -1], ['next', 1]]) { const c = blank(); arrowButton(c, HOBBY4.arrows[name], dir); arrows[name] = dayNight(c.px) }
  const L = { items, pieces, bg: { day: bg.px, night: bgNight }, highlight, hlShadow, arrows }
  // Como em renderShelf4, o destaque só "acende" os pixels que ele muda: onde o pixel do destaque é igual ao de
  // baixo (contorno sobre o contorno de uma mão-francesa), ele sai da camada e fica sob o tint à noite.
  for (const [open, parts] of Object.entries(highlight)) {
    const under = composeShelf4({ ...L, highlight: { [open]: [] }, arrows: null }, open, false)
    for (const { px } of parts) for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] && px[i] === under[i] && px[i + 1] === under[i + 1] && px[i + 2] === under[i + 2]) px.fill(0, i, i + 4)
    }
  }
  return L
}

/** Refaz a cena a partir das camadas (mesma ordem que o React usa). */
export function composeShelf4(L, open, night) {
  const out = new Uint8Array(CW * CH * 4)
  const draw = (px) => blit(out, CW, CH, px, CW, CH, 0, 0)
  const v = (layer) => (night ? layer.night : layer.day)
  draw(v(L.bg))
  draw(v(L.hlShadow[open]))
  for (const p of L.pieces) if (p.key !== open && p.shadow) draw(v(p.shadow))
  for (const p of L.pieces) if (p.key !== open) draw(v(p))
  for (const h of L.highlight[open]) draw(h.px)
  if (L.arrows && open.startsWith('hobby.')) { draw(v(L.arrows.prev)); draw(v(L.arrows.next)) }
  return out
}
