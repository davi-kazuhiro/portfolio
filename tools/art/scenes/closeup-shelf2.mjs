// Visão de perto da prateleira, 2ª proposta (2026-11-07) — estilo oblíquo "3/4 frontal" aprovado no teste.
// Spec: docs/arte/specs.md §4. Só prévias (art-src/previews/), nada em public/assets/.
//
// Em cima: tábua funda com os itens (livros "Linguagens" e "Idiomas", cartucho "Ferramentas", cubo mágico,
// tsuru, raquete; o resto é decoração). Embaixo, conforme o item escolhido:
//  - layout "livro": o livro aberto, duas páginas (retângulos de conteúdo à esquerda e à direita);
//  - layout "objeto": o objeto ampliado à esquerda e uma folha com o texto à direita, com setas.
// O item escolhido sai da prateleira (o lugar fica vazio). Todo texto é DOM; aqui só há mockup.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rgba } from '../lib.mjs'
import { P, TINT, UI_BG } from '../palette.mjs'
import { flat } from '../flat.mjs'
import { blit, lint, multiply } from '../sheet.mjs'
import { SHELF2_COLORS } from './bookshelf.mjs'
import { bar, cartridge, CH, CW, drawCurtain, drawWalls, ICONS, loadSkills, spine, text, textW } from './closeup-bookshelf.mjs'
import { extrude, putObject, rectPixels, shadowOnWall } from './closeup-3d.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const projects = JSON.parse(readFileSync(resolve(root, 'src/content/pt/projects.json'), 'utf8'))
/** Nome da skill → nomes que aparecem em projects.json `tecnologias` (mapa a validar com o content-curator). */
const ALIASES = { 'SQL / MySQL': ['MySQL', 'SQL'], 'Node.js': ['Node.js', 'Node'] }
export const projectsUsing = (name) => projects.filter((p) => (ALIASES[name] ?? [name]).some((n) => p.tecnologias.includes(n))).map((p) => p.titulo)

// ---------- geometria (px da ilustração a 1×) ----------
export const BOARD = { x: 22, y: 58, w: 272, h: 8, depth: 14 } // frente da tábua; topo visível = 14 px
const SEAT = 4 // itens apoiados 4 px para dentro do tampo
const BASE = BOARD.y - 1 - SEAT // última linha da frente dos itens
const ITEM_D = 8

export const BOOK = { cover: [24, 76, 272, 100], pages: [[30, 80, 128, 90], [162, 80, 128, 90]] }
export const BOOK_CONTENT = { left: [36, 84, 116, 76], right: [168, 84, 116, 76] }
export const PAGE_TURN = { prev: [30, 160, 10, 10], next: [280, 160, 10, 10] }
export const STAGE = [28, 78, 82, 84] // onde o objeto ampliado fica
export const SHEET = [118, 76, 174, 98] // folha do texto
export const OBJECT_CONTENT = [126, 84, 158, 72]
export const ARROWS = { prev: [34, 162, 14, 12], next: [90, 162, 14, 12] }

// ---------- desenhos locais dos itens (frente; a profundidade vem da extrusão) ----------
const decorSpine = (l, w, h, [face, dark, hi, band]) => {
  l.rect(0, 0, w, h, face); l.rect(1, 1, 1, h - 2, hi); l.rect(w - 3, 1, 2, h - 2, dark)
  for (const r of [3, h - 5]) l.rect(1, r, w - 2, 1, band)
}
const ICONS2 = {
  code: { map: { a: 'graphite-1', r: 'red-1' }, rows: ['........', '.a....a.', 'a..r...a', 'a..r...a', '.a.r..a.', '..r.....', '........', '........'] },
}
const allIcons = { ...ICONS, ...ICONS2 }
const withIcon = (name, fn) => { const prev = ICONS[name]; ICONS[name] = allIcons[name]; fn(); if (!prev) delete ICONS[name] }

function cube(l, s = 1) {
  const n = 3, cell = 5 * s, W = n * cell + 2 * s
  l.rect(0, 0, W, W, 'graphite-0')
  const cols = ['red-2', 'gold-1', 'leaf-1', 'gold-1', 'red-2', 'blue-1', 'leaf-1', 'cream-3', 'red-2']
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    l.rect(s + i * cell, s + j * cell, cell - s, cell - s, cols[i + 3 * j])
    l.rect(s + i * cell, s + j * cell, cell - s, s, 'cream-3') // brilho de cima de cada adesivo
  }
}
const CRANE = [
  '......a...........', '......aa..........', '......aaa.........', '......aaaa........', '.......aaaa.......',
  'b......aaaaa.....c', 'bb.....aaaaaa...cc', '.bb...dddddddd.cc.', '..bbbddddddddddc..', '...bddddddddddd...',
  '.....ddddddddd....', '.......ddddd......',
]
function crane(l) {
  const map = { a: 'pink', b: 'red-1', c: 'red-1', d: 'red-2' }
  CRANE.forEach((row, j) => [...row].forEach((ch, i) => { if (map[ch]) l.set(i, j, map[ch]) }))
  l.set(16, 5, 'graphite-1') // olho
}
function paddle(l, w = 16, h = 26) {
  const r = w / 2, cx = r - 0.5, cy = r - 0.5
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const d = ((x - cx) / r) ** 2 + ((y - cy) / r) ** 2
    if (d < 1) l.set(x, y, d > 0.72 ? 'wood-6' : x + y < w * 0.7 ? 'red-3' : 'red-2')
  }
  l.rect(Math.floor(w / 2) - 2, w - 1, 4, h - w + 1, 'wood-5')
  l.rect(Math.floor(w / 2) - 2, w - 1, 1, h - w + 1, 'wood-7')
}

/** Itens da tábua, da esquerda para a direita. kind: book | cartridge | soft | decor. */
export function shelfItems() {
  const C = SHELF2_COLORS
  const items = []
  let x = BOARD.x + 6
  const add = (it) => { items.push({ ...it, x, y: BASE - it.h + 1 }); x += it.w + (it.gap ?? 0) }
  add({ key: 'decor.0', kind: 'decor', w: 13, h: 34, draw: (l) => decorSpine(l, 13, 34, C.decor[0]), tones: ['cream-2', 'leaf-0'] })
  add({ key: 'decor.1', kind: 'decor', w: 11, h: 30, draw: (l) => decorSpine(l, 11, 30, C.decor[1]), tones: ['cream-2', 'gold-0'] })
  add({ key: 'linguagens', kind: 'book', w: 26, h: 46, color: 'red-2', draw: (l) => withIcon('code', () => spine(l, 26, 46, C.linguagens, 'code')), tones: ['cream-2', 'red-0'] })
  add({ key: 'idiomas', kind: 'book', w: 22, h: 40, color: 'blue-1', draw: (l) => withIcon('globe', () => spine(l, 22, 40, C.idiomas, 'globe')), tones: ['cream-2', 'blue-0'] })
  add({ key: 'decor.2', kind: 'decor', w: 14, h: 36, draw: (l) => decorSpine(l, 14, 36, C.decor[2]), tones: ['cream-2', 'teal-2'] })
  add({ key: 'decor.3', kind: 'decor', w: 11, h: 31, draw: (l) => decorSpine(l, 11, 31, C.decor[3]), tones: ['cream-2', 'mauve-1'] })
  add({ key: 'decor.4', kind: 'decor', w: 15, h: 38, gap: 10, draw: (l) => decorSpine(l, 15, 38, C.decor[4]), tones: ['cream-2', 'cream-0'] })
  add({ key: 'ferramentas', kind: 'cartridge', w: 22, h: 28, gap: 8, color: 'gold-2', draw: (l) => cartridge(l, 22, 28, 'gold-2', 'git'), tones: ['graphite-2', 'graphite-0'], d: 5 })
  add({ key: 'soft.cubo', kind: 'soft', w: 17, h: 17, gap: 8, color: 'red-2', draw: (l) => cube(l), tones: ['cream-3', 'blue-0'], d: 7 })
  add({ key: 'soft.origami', kind: 'soft', w: 18, h: 12, gap: 8, color: 'pink', draw: crane, tones: ['pink', 'red-0'], d: 2 })
  add({ key: 'soft.raquete', kind: 'soft', w: 16, h: 26, gap: 4, color: 'red-2', draw: (l) => paddle(l), tones: ['wood-6', 'wood-2'], d: 2, shear: -0.18 })
  add({ key: 'decor.5', kind: 'decor', w: 26, h: 6, draw: (l) => { l.rect(0, 0, 26, 6, 'teal-3'); l.rect(0, 4, 26, 2, 'teal-2'); l.rect(2, 0, 22, 1, 'cream-2') }, tones: ['teal-3', 'teal-2'], d: 12, lying: true })
  if (x > BOARD.x + BOARD.w) throw new Error(`itens passam da tábua (${x})`)
  return items
}

/** Pixels de frente de um desenho local, com posição, escala inteira e inclinação. */
function front(draw, w, h, x, y, { scale = 1, shear = 0 } = {}) {
  const local = flat(w, h); draw(local)
  const out = []
  for (let j = 0; j < h * scale; j++) {
    const off = shear ? -Math.round((h * scale - 1 - j) * shear) : 0
    for (let i = 0; i < w * scale; i++) {
      const p = local.get(Math.floor(i / scale), Math.floor(j / scale))
      if (!p || !p[3]) continue
      const sx = x + i + off, sy = y + j
      if (sx >= 0 && sy >= 0 && sx < CW && sy < CH) out.push([sy * CW + sx, p.slice()])
    }
  }
  return out
}

const solidOf = (it, { x = it.x + SEAT, y = it.y - SEAT, scale = 1 } = {}) => {
  // Os 2 livros deitados ficam na frente do tampo (sem recuo).
  const fx = it.lying ? it.x : x, fy = it.lying ? it.y + SEAT - 0 : y
  const f = front(it.draw, it.w, it.h, fx, fy, { scale, shear: it.shear ?? 0 })
  return extrude(f, { depth: () => (it.d ?? ITEM_D) * scale, top: it.tones[0], side: it.tones[1] })
}

// ---------- cena ----------
function boardSolid() {
  const { x, y, w, h, depth } = BOARD
  const f = rectPixels(x, y, w, h, (i, j) => (j === y ? 'wood-7' : j >= y + h - 2 ? 'wood-4' : (i * 7 + j * 13) % 29 === 0 ? 'wood-4' : 'wood-5'))
  return extrude(f, { depth: () => depth, top: 'wood-6', side: 'wood-2' })
}
function bracketSolid(bx) {
  const y0 = BOARD.y + BOARD.h, H = 10
  const f = rectPixels(bx, y0, 4, H, (i, j) => (j - y0 > 6 && i - bx > 3 - (H - 1 - (j - y0)) ? null : i === bx ? 'graphite-2' : 'graphite-1'))
  return extrude(f, { depth: (_, yy) => Math.max(1, Math.round(BOARD.depth * (1 - (yy - y0) / H))), top: 'graphite-2', side: 'graphite-0' })
}

function openBook(color) {
  const [cx, cy, cw, ch] = BOOK.cover
  const dark = { 'red-2': 'red-0', 'blue-1': 'blue-0' }[color]
  const cover = rectPixels(cx, cy, cw, ch, (i, j) => (j >= cy + ch - 2 ? dark : color))
  // Bloco de páginas visto de frente embaixo (borda de papel) e as duas páginas.
  const pagesFront = []
  for (const [px, py, pw, ph] of BOOK.pages) {
    const gutterLeft = px > cx + cw / 2
    pagesFront.push(...rectPixels(px, py, pw, ph, (i, j) => {
      const fromGutter = gutterLeft ? i - px : px + pw - 1 - i
      const fromOuter = gutterLeft ? px + pw - 1 - i : i - px
      const fromBottom = py + ph - 1 - j
      if (fromOuter + fromBottom < 7) return fromOuter + fromBottom === 6 ? 'cream-0' : fromOuter + fromBottom > 3 ? 'cream-2' : null // canto virado (botão de página)
      if (fromGutter < 2) return 'cream-1'
      if (fromGutter < 5) return 'cream-2'
      return 'cream-3'
    }))
  }
  const edges = rectPixels(cx + 6, cy + ch - 6, cw - 12, 3, (i, j) => (j % 2 ? 'cream-0' : 'cream-2')) // folhas
  const solid = extrude(cover, { depth: () => 5, top: 'cream-2', side: dark })
  return { solid, overlay: [...edges, ...pagesFront], pages: new Set(pagesFront.map(([i]) => i)) }
}

function drawTape(c, x, y, color, dir) {
  c.object((l) => {
    for (let j = 0; j < 7; j++) for (let i = 0; i < 18; i++) {
      if ((i === 0 || i === 17) && j % 2 === 1) continue
      l.set(x + i + Math.floor(j / 3) * dir, y + j, color)
    }
  })
}

function arrowButton(c, [x, y, w, h], dir) {
  const f = rectPixels(x, y, w, h, () => 'gold-1')
  putObject(c, extrude(f, { depth: () => 2, top: 'gold-3', side: 'gold-0' }))
  const mx = x + Math.floor(w / 2), my = y + Math.floor(h / 2)
  for (let k = 0; k < 4; k++) for (let t = -k; t <= k; t++) c.set(mx + (dir < 0 ? -2 + k : 1 - k), my + t, 'graphite-1')
}

/**
 * state: { open: 'linguagens' | 'idiomas' | 'ferramentas' | 'soft.cubo' | 'soft.origami' | 'soft.raquete' }, night.
 * Devolve { c, keep } (keep = pixels que não recebem o tint à noite: páginas/folha, iluminadas pela tela).
 */
export function renderShelf2({ open = 'linguagens', night = false } = {}) {
  const c = flat(CW, CH)
  drawWalls(c)
  drawCurtain(c)
  const items = shelfItems()
  const board = boardSolid()
  const brackets = [44, 264].map(bracketSolid)
  const solids = items.filter((it) => it.key !== open).map((it) => solidOf(it))
  const openIt = items.find((it) => it.key === open)
  const isBook = openIt.kind === 'book'

  let lower = [], extra = null
  if (isBook) { extra = openBook(openIt.color); lower = extra.solid }
  else {
    // Objeto ampliado 3× (2× se for alto) centrado no palco, e a folha do texto.
    const scale = openIt.h * 3 > STAGE[3] - 18 ? 2 : 3
    const ox = STAGE[0] + Math.floor((STAGE[2] - openIt.w * scale) / 2), oy = STAGE[1] + STAGE[3] - 20 - openIt.h * scale
    lower = solidOf({ ...openIt, shear: 0 }, { x: ox, y: oy, scale })
  }
  const sheet = isBook ? [] : extrude(rectPixels(...SHEET, (i, j) => (j === SHEET[1] + SHEET[3] - 1 ? 'cream-1' : 'cream-3')), { depth: () => 2, top: 'cream-2', side: 'cream-1' })

  shadowOnWall(c, [...board, ...brackets.flat(), ...solids.flat()].map(([i]) => i), [-4, 4])
  c.rect(BOARD.x + BOARD.depth, BOARD.y + BOARD.h, BOARD.w - 6, 2, 'wall-0') // oclusão sob a tábua
  shadowOnWall(c, [...lower, ...sheet].map(([i]) => i), [-4, 4])

  for (const b of brackets) putObject(c, b)
  putObject(c, board)
  for (const s of solids) putObject(c, s)
  const keep = new Set()
  if (isBook) {
    putObject(c, lower)
    c.object((l) => { for (const [i, p] of extra.overlay) l.px.set(p, i * 4) }, { outline: false })
    for (const i of extra.pages) keep.add(i)
  } else {
    putObject(c, lower)
    putObject(c, sheet)
    for (const [i] of sheet) keep.add(i)
    drawTape(c, SHEET[0] + 8, SHEET[1] - 4, 'pink', 1)
    drawTape(c, SHEET[0] + SHEET[2] - 26, SHEET[1] - 4, 'teal-3', -1)
    arrowButton(c, ARROWS.prev, -1)
    arrowButton(c, ARROWS.next, 1)
  }
  let px = c.px
  if (night) {
    px = multiply(px, TINT.night, (i) => keep.has(i))
    for (let y = 0; y < CH; y++) for (const x of [310, 311]) px.set(rgba(P['teal-3']), (y * CW + x) * 4)
  }
  return { px, items }
}

// ---------- mockups do DOM ----------
const H2 = (c, x, y, s, color = 'graphite-1') => text(c, x, y, s, color, 2)
function iconBig(c, x, y, name, s = 2) {
  const icon = allIcons[name]; if (!icon) return
  icon.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (icon.map[ch]) c.rect(x + i * s, y + j * s, s, s, icon.map[ch]) }))
}
function pageSumario(c, [x, y, w], skills) {
  H2(c, x, y, 'Linguagens')
  text(c, x, y + 13, 'Sumário', 'red-1')
  c.rect(x, y + 20, w, 1, 'red-3')
  skills.tecnicas.forEach((s, k) => {
    const yy = y + 24 + k * 7
    text(c, x, yy, s.nome, 'graphite-1')
    const lv = String(s.nivel)
    text(c, x + w - textW(lv), yy, lv, 'graphite-2')
    bar(c, x + 52, yy + 2, w - 64, s.nivel, 'red-2')
  })
}
function pageLang(c, [x, y, w, h], s, n) {
  c.rect(x, y, 20, 20, 'cream-2'); c.border(x, y, 20, 20, 'red-1')
  iconBig(c, x + 2, y + 2, s.icon)
  H2(c, x + 26, y + 2, s.nome)
  text(c, x + 26, y + 15, `nível ${s.nivel}/100`, 'graphite-2')
  bar(c, x, y + 25, w, s.nivel, 'red-2')
  text(c, x, y + 32, 'Onde usei', 'red-1')
  const used = projectsUsing(s.nome)
  if (!used.length) text(c, x, y + 40, '(nenhum projeto ainda)', 'cream-0')
  used.forEach((t, k) => { c.rect(x, y + 41 + k * 7, 2, 2, 'red-2'); text(c, x + 4, y + 40 + k * 7, t, 'teal-2') })
  text(c, x + w - textW(String(n)), y + h - 5, String(n), 'cream-0')
}
function pageIdioma(c, [x, y, w, h], lang, value, n) {
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

function mock(state, skills) {
  const { c } = state
  switch (state.open) {
    case 'sumario': pageSumario(c, BOOK_CONTENT.left, skills); pageLang(c, BOOK_CONTENT.right, skills.tecnicas[0], 1); break
    case 'linguagens': pageLang(c, BOOK_CONTENT.left, skills.tecnicas[2], 4); pageLang(c, BOOK_CONTENT.right, skills.tecnicas[3], 5); break
    case 'idiomas': pageIdioma(c, BOOK_CONTENT.left, skills.idiomas[0], 100, 1); pageIdioma(c, BOOK_CONTENT.right, skills.idiomas[1], 75, 2); break
    case 'ferramentas': sheetText(c, OBJECT_CONTENT, 'Ferramentas', skills.ferramentas[0], `1/${skills.ferramentas.length}`); break
    case 'soft.origami': sheetText(c, OBJECT_CONTENT, 'Atributos', 'Criatividade', '2/3'); break
  }
}

function dotted(c, [x, y, w, h], color) {
  for (let i = 0; i < w; i += 2) { c.set(x + i, y, color); c.set(x + i, y + h - 1, color) }
  for (let j = 0; j < h; j += 2) { c.set(x, y + j, color); c.set(x + w - 1, y + j, color) }
}

export function renderShelf2Previews() {
  const skills = loadSkills()
  const scene = (open, night = false, mockOpen = open) => {
    const r = renderShelf2({ open, night })
    const c = flat(CW, CH); c.px.set(r.px)
    mock({ c, open: mockOpen }, skills)
    return { c, items: r.items, raw: r.px }
  }
  const base = renderShelf2({ open: 'linguagens' })
  for (const e of lint(base.px)) throw new Error(`shelf2: ${e}`)
  const states = [
    scene('linguagens', false, 'sumario'), scene('linguagens'), scene('idiomas'),
    scene('ferramentas'), scene('soft.origami'), scene('linguagens', true, 'sumario'),
  ]
  for (const s of states.slice(2, 5)) for (const e of lint(s.raw)) throw new Error(`shelf2: ${e}`)
  const gap = 6, cols = 2, rows = 3
  const W = CW * cols + gap * (cols - 1), H = CH * rows + gap * (rows - 1)
  const sheet = new Uint8Array(W * H * 4)
  for (let i = 0; i < W * H; i++) sheet.set(rgba(UI_BG), i * 4)
  states.forEach((s, n) => blit(sheet, W, H, s.c.px, CW, CH, (n % cols) * (CW + gap), Math.floor(n / cols) * (CH + gap)))

  // Retângulos: livro (páginas, cantos) e objeto (conteúdo, setas); áreas de clique dos itens.
  const rectsBook = flat(CW, CH); rectsBook.px.set(renderShelf2({ open: 'linguagens' }).px)
  const rectsObj = flat(CW, CH); rectsObj.px.set(renderShelf2({ open: 'ferramentas' }).px)
  for (const r of [BOOK_CONTENT.left, BOOK_CONTENT.right]) dotted(rectsBook, r, 'red-1')
  for (const r of Object.values(PAGE_TURN)) dotted(rectsBook, r, 'leaf-0')
  dotted(rectsObj, OBJECT_CONTENT, 'red-1')
  for (const r of Object.values(ARROWS)) dotted(rectsObj, r, 'leaf-0')
  const clickable = base.items.filter((it) => it.kind !== 'decor')
  for (const it of clickable) {
    const r = [it.x + SEAT - (it.shear ? 5 : 0), it.y - SEAT - (it.d ?? ITEM_D), it.w + (it.d ?? ITEM_D) + (it.shear ? 5 : 0), it.h + (it.d ?? ITEM_D)]
    dotted(rectsBook, r, 'sky-0'); dotted(rectsObj, r, 'sky-0')
    console.log(`  ${it.key.padEnd(14)} clique ${r.join(', ')}`)
  }
  const RW2 = CW * 2 + gap
  const rects = new Uint8Array(RW2 * CH * 4)
  for (let i = 0; i < RW2 * CH; i++) rects.set(rgba(UI_BG), i * 4)
  blit(rects, RW2, CH, rectsBook.px, CW, CH, 0, 0)
  blit(rects, RW2, CH, rectsObj.px, CW, CH, CW + gap, 0)
  return [
    { name: 'm3-shelf2-closeup-sheet', px: sheet, w: W, h: H },
    { name: 'm3-shelf2-closeup-rects', px: rects, w: RW2, h: CH },
  ]
}
