// Visão de perto da prateleira (`bookshelf`, M3) — PROPOSTA, ainda não exportada para public/assets/.
// Spec: docs/arte/specs.md §4 "Prateleira (M3) — proposta".
//
// Ilustração frontal de 320×180, mesmo enquadramento do closeup-computer olhando um pouco mais para cima:
// canto e parede esquerda (x 0–30), parede do fundo listrada, borda da cortina à direita (x 309–319).
// Em cima, a tábua com os itens (cada item é um botão no DOM); embaixo, a ficha de papel presa na parede,
// onde fica o painel React (retângulo de conteúdo).
//
// Os itens saem do conteúdo: um livro por skill técnica (cor pelo `icon`, altura pelo `nivel`), um dicionário
// inclinado (idiomas), um cartucho por ferramenta e um dado (atributos = skills profissionais).
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rgba } from '../lib.mjs'
import { P, TINT, UI_BG } from '../palette.mjs'
import { flat } from '../flat.mjs'
import { blit, lint, multiply } from '../sheet.mjs'
import { BOOK_COLORS, BOOK_FALLBACK, DICTIONARY_COLORS } from './bookshelf.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
/**
 * Lê src/content/<lang>/skills.json (formato de 2026-11-07: languages, spokenLanguages, tools, hobbies, softSkills)
 * e devolve no formato que as prévias usam (tecnicas, idiomas, ferramentas, profissionais). Só mockup de prévia:
 * os assets finais não têm texto.
 */
export const loadSkills = (lang = 'pt') => {
  const raw = JSON.parse(readFileSync(resolve(root, `src/content/${lang}/skills.json`), 'utf8'))
  if (raw.tecnicas) return raw // formato antigo
  return {
    tecnicas: (raw.languages ?? []).map((l) => ({ nome: l.name, nivel: l.level, icon: l.icon })),
    idiomas: (raw.spokenLanguages ?? []).map((l) => ({ nome: l.name, nivel: l.level })),
    ferramentas: (raw.tools ?? []).map((t) => t.name),
    profissionais: (raw.softSkills?.items ?? []).map((s) => ({ nome: s.name, nivel: s.level })),
    hobbies: raw.hobbies ?? [],
  }
}

export const CW = 320
export const CH = 180
export const PLANK = [36, 50, 248, 8] // x, y, w, h: frente da tábua (linha 50 = aresta de luz)
export const SHELF_LINE = 49 // última linha dos itens (apoiados na tábua)
export const BOOK_ZONE = [40, 190] // faixa horizontal dos livros técnicos
export const CARD = [40, 70, 240, 106] // ficha de papel presa na parede
export const CONTENT = [48, 78, 224, 92] // retângulo do painel React (dentro da ficha)
export const CROPS = { full: [0, 0, 320, 180], shelf: [32, 0, 256, 180] }
export const LIFT = 4 // px que o item sobe no hover/seleção

// ---------- ícones 8×8 (símbolos genéricos desenhados por nós, não os logotipos oficiais) ----------
export const ICONS = {
  java: { map: { a: 'graphite-1', r: 'red-1' }, rows: ['.r..r...', '..r..r..', '.r..r...', 'aaaaaa..', 'a....aaa', 'a....a.a', 'a....aaa', '.aaaa...'] },
  leaf: { map: { g: 'leaf-0' }, rows: ['......gg', '....gggg', '..gggggg', '.ggg.ggg', '.gg.ggg.', '.g.ggg..', '..ggg...', '.g......'] },
  python: { map: { b: 'blue-0', y: 'gold-0' }, rows: ['.bbbb...', '.b.bb...', '....b...', 'bbbbb.yy', 'bb.yyyyy', '...y....', '...yy.y.', '...yyyy.'] },
  database: { map: { a: 'graphite-1' }, rows: ['.aaaaaa.', 'a......a', 'aaaaaaaa', 'a......a', 'aaaaaaaa', 'a......a', '.aaaaaa.', '........'] },
  react: { map: { p: 'red-1', a: 'graphite-1' }, rows: ['..p..p..', '.pppppp.', 'p.p..p.p', 'p..aa..p', 'p..aa..p', 'p.p..p.p', '.pppppp.', '..p..p..'] },
  js: { map: { a: 'graphite-1' }, rows: ['........', '..a..aa.', '..a.a...', '..a..a..', 'a.a...a.', '.a..aa..', '........', '........'] },
  'node-js': { map: { g: 'leaf-0' }, rows: ['...gg...', '.gg..gg.', 'g......g', 'g..gg..g', 'g..gg..g', 'g......g', '.gg..gg.', '...gg...'] },
  globe: { map: { a: 'graphite-1' }, rows: ['..aaaa..', '.a..a.a.', 'a..a...a', 'aaaaaaaa', 'a...a..a', '.a..a.a.', '..aaaa..', '........'] },
  git: { map: { a: 'graphite-1', o: 'red-1' }, rows: ['.o...o..', '.a...a..', '.a..a...', '.aaa....', '.a......', '.a......', '.o......', '........'] },
  chart: { map: { a: 'graphite-1', t: 'teal-2' }, rows: ['........', '......t.', '......t.', '...t..t.', '...t.tt.', '.t.t.tt.', 'aaaaaaaa', '........'] },
  // Ferramentas de IA/ML e dados (2026-11-13): também símbolos nossos.
  tree: { map: { a: 'graphite-1', t: 'teal-2', r: 'red-1', g: 'leaf-0' }, rows: ['...tt...', '...tt...', '..a..a..', '.a....a.', '.a....a.', 'rr....gg', 'rr....gg', '........'] }, // árvore de decisão (scikit-learn)
  llama: { map: { a: 'graphite-1' }, rows: ['.a..a...', '.a..a...', '.aaaa...', 'a.aaa...', 'aaaaa...', '..aaa...', '..aaaa..', '..aaaaa.'] }, // cabeça de lhama (Ollama)
  terminal: { map: { a: 'graphite-1', o: 'wood-6' }, rows: ['aaaaaaaa', 'a......a', 'a.a....a', 'a..a...a', 'a.a.oo.a', 'a......a', 'aaaaaaaa', '........'] }, // prompt ">_" (Claude Code)
  table: { map: { a: 'graphite-1', t: 'blue-0' }, rows: ['tttttttt', 'a..a...a', 'aaaaaaaa', 'a..a...a', 'aaaaaaaa', 'a..a...a', 'aaaaaaaa', '........'] }, // tabela (pandas)
  array: { map: { b: 'blue-0' }, rows: ['...bbbbb', '..b...bb', '.bbbbb.b', '.b...b.b', '.b...b.b', '.b...bb.', '.bbbbb..', '........'] }, // cubo de dados (NumPy)
  plot: { map: { a: 'graphite-1', r: 'red-1' }, rows: ['a.......', 'a.....r.', 'a....r..', 'a.r.r...', 'a..r....', 'ar......', 'aaaaaaaa', '........'] }, // gráfico de linha (matplotlib)
  notebook: { map: { a: 'graphite-1', o: 'wood-6', w: 'graphite-3' }, rows: ['.aaaaaaa', 'oa.....a', '.a.ww..a', 'oa.....a', '.a.www.a', 'oa.....a', '.aaaaaaa', '........'] }, // caderno com células (Jupyter)
  duck: { map: { y: 'gold-1', d: 'gold-0', o: 'wood-6', e: 'graphite-1' }, rows: ['..yy....', '.yeyy...', 'ooyy..y.', '..yyyyy.', '.yyyyyy.', '.yddddy.', '..yyyy..', '........'] }, // pato de borracha (símbolo do item)
}
const drawIcon = (l, x, y, name) => {
  const icon = ICONS[name]
  if (!icon) { l.rect(x + 2, y + 2, 4, 4, 'graphite-1'); return } // ícone desconhecido: quadradinho (skill nova sem desenho)
  icon.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (icon.map[ch]) l.set(x + i, y + j, icon.map[ch]) }))
}

// ---------- itens (cada um desenhado numa tela local, sem contorno; o contorno é aplicado ao compor) ----------
const bookHeightPx = (level) => Math.round(22 + Math.max(0, level - 60) * 0.6) // 70 → 28 · 80 → 34 · 90 → 40

export function spine(l, w, h, [face, dark, hi, band], icon) {
  l.rect(0, 0, w, h, face)
  l.rect(1, 1, 1, h - 2, hi)
  l.rect(w - 3, 1, 2, h - 2, dark)
  for (const r of [3, 5, h - 6, h - 4]) l.rect(1, r, w - 2, 1, band)
  const lx = Math.floor((w - 12) / 2), ly = 8
  l.border(lx, ly, 12, 12, dark)
  l.rect(lx + 1, ly + 1, 10, 10, 'cream-3')
  drawIcon(l, lx + 2, ly + 2, icon)
}

export function cartridge(l, w, h, stripe, icon) {
  l.rect(0, 0, w, h, 'graphite-1')
  l.rect(1, 1, w - 2, 1, 'graphite-3') // aresta de luz
  l.rect(1, 1, 1, h - 2, 'graphite-2')
  l.rect(w - 2, 1, 1, h - 2, 'graphite-0')
  for (const r of [3, 5]) for (let i = 3; i < w - 3; i += 2) l.set(i, r, 'graphite-0') // ranhuras de pegada
  const lx = 3, ly = 8, lw = w - 6, lh = h - 11
  l.rect(lx, ly, lw, lh, 'cream-3')
  l.rect(lx, ly, lw, 3, stripe)
  drawIcon(l, lx + Math.floor((lw - 8) / 2), ly + 4, icon)
  for (const i of [0, w - 1, w - 6, w - 5, w - 4]) l.px.fill(0, i * 4, i * 4 + 4) // cantos chanfrados e entalhe
}

function die(l) {
  // d20 visto de frente: hexágono com a face central (triângulo) iluminada.
  const W = 13, H = 14
  for (let y = 0; y < H; y++) {
    const half = y < 3 ? 2 + 2 * y : y > H - 4 ? 2 + 2 * (H - 1 - y) : 6
    for (let x = 6 - half; x <= 6 + half; x++) {
      const tri = y >= 3 && y <= 10 && Math.abs(x - 6) <= Math.floor((y - 3) * 0.75)
      let c = x < 6 ? 'red-2' : 'red-1'
      if (y < 3) c = 'red-3'
      if (y > 10) c = 'red-0'
      if (tri) c = 'red-3'
      if (x >= 0 && x < W) l.set(x, y, c)
    }
  }
  l.set(6, 7, 'cream-3'); l.set(5, 9, 'cream-3'); l.set(7, 9, 'cream-3') // pontinhos no lugar do número
}

/** Layout dos itens a partir do conteúdo. Devolve [{ key, kind, label, x, y, w, h, shear, draw }]. */
export function layoutItems(skills) {
  const items = []
  const tech = skills.tecnicas
  const n = tech.length
  const pitch = Math.min(21, Math.floor((BOOK_ZONE[1] - BOOK_ZONE[0]) / n))
  if (pitch < 15) throw new Error(`${n} livros não cabem numa fileira (máx. 10): usar o layout de duas tábuas`)
  let x = BOOK_ZONE[0]
  tech.forEach((s, k) => {
    const h = bookHeightPx(s.nivel)
    const colors = BOOK_COLORS[s.icon] ?? BOOK_FALLBACK[k % BOOK_FALLBACK.length]
    items.push({ key: `tecnicas.${k}`, kind: 'book', label: s.nome, icon: s.icon, color: colors[0], x, y: SHELF_LINE - h + 1, w: pitch, h, draw: (l) => spine(l, pitch, h, colors, s.icon) })
    x += pitch
  })
  // Dicionário (idiomas): inclinado para a esquerda até encostar no topo do último livro.
  const last = items[items.length - 1]
  const dW = 24, dH = 40, gap = 6
  const dx = x + gap
  items.push({ key: 'idiomas', kind: 'dictionary', label: 'idiomas', color: DICTIONARY_COLORS[0], x: dx, y: SHELF_LINE - dH + 1, w: dW, h: dH, shear: gap / last.h, draw: (l) => spine(l, dW, dH, DICTIONARY_COLORS, 'globe') })
  x = dx + dW + 4
  // Cartuchos (ferramentas).
  const cartStyle = [['gold-2', 'git'], ['sky-0', 'chart'], ['pink', null], ['leaf-2', null]]
  skills.ferramentas.forEach((name, k) => {
    const [stripe, icon] = cartStyle[k % cartStyle.length]
    items.push({ key: `ferramentas.${k}`, kind: 'cartridge', label: name, color: stripe, x, y: SHELF_LINE - 26 + 1, w: 18, h: 26, draw: (l) => cartridge(l, 18, 26, stripe, icon) })
    x += 18 + 3
  })
  // Dado (atributos = profissionais).
  items.push({ key: 'profissionais', kind: 'die', label: 'atributos', color: 'red-2', x, y: SHELF_LINE - 14 + 1, w: 13, h: 14, draw: die })
  if (x + 13 > PLANK[0] + PLANK[2] - 2) throw new Error('itens passam do fim da tábua')
  return items
}

/** Pixels (índices) ocupados por um item na cena, com inclinação e elevação. */
export function itemPixels(item, lift = 0) {
  const local = flat(item.w, item.h)
  item.draw(local)
  const out = []
  for (let j = 0; j < item.h; j++) {
    const off = item.shear ? -Math.round((item.h - 1 - j) * item.shear) : 0
    for (let i = 0; i < item.w; i++) {
      const p = local.get(i, j)
      if (!p || !p[3]) continue
      const sx = item.x + i + off, sy = item.y + j - lift
      if (sx >= 0 && sy >= 0 && sx < CW && sy < CH) out.push([sy * CW + sx, p.slice()])
    }
  }
  return out
}

// ---------- cena ----------
export function drawWalls(c) {
  c.paint(30, 0, 290, CH, (x) => {
    const s = Math.floor((x - 30) / 8) % 2
    if (x >= 222) return s ? 'wall-3' : 'wall-4'
    return s ? 'wall-1' : 'wall-2'
  })
  c.paint(0, 0, 30, CH, (x) => (Math.floor(x / 4) % 2 ? 'wall-3' : 'wall-4'))
  c.rect(30, 0, 1, CH, 'wall-0')
}

export function drawCurtain(c) {
  c.object((l) => {
    const folds = ['gold-3', 'gold-1', 'gold-1', 'gold-0', 'gold-1', 'gold-3', 'gold-1', 'gold-0', 'gold-1', 'gold-1']
    l.paint(309, 0, 11, CH, (x) => folds[x - 310] ?? 'gold-1')
  })
}

function drawPlank(c) {
  const [x, y, w, h] = PLANK
  // Sombra na parede: luz da janela à direita → sombra para a esquerda e para baixo.
  c.rect(x - 2, y + h, w, 3, 'wall-0')
  c.object((l) => {
    l.rect(x, y, w, h, 'wood-5')
    l.rect(x, y + 1, w, 1, 'wood-7') // aresta de luz
    l.rect(x, y + h - 2, w, 1, 'wood-4')
    l.paint(x, y + 2, w, h - 4, (i, j) => ((i * 7 + j * 13) % 23 === 0 ? 'wood-4' : null)) // veio
    l.rect(x + w - 2, y, 1, h, 'wood-2') // ponta direita (lado escuro)
  })
  // Mãos-francesas em grafite.
  for (const bx of [60, 256]) {
    c.rect(bx - 2, y + h, 2, 12, 'wall-0')
    c.object((l) => {
      l.paint(bx, y + h, 4, 12, (i, j) => (j > 8 && i > 2 - (11 - j) ? null : i === 0 ? 'graphite-2' : i === 3 ? 'graphite-0' : 'graphite-1'))
    })
  }
}

function drawCard(c) {
  const [x, y, w, h] = CARD
  c.rect(x - 3, y + 3, 3, h, 'wall-0') // sombra à esquerda
  c.rect(x - 3, y + h, w, 3, 'wall-0') // e embaixo
  c.object((l) => {
    l.rect(x, y, w, h, 'cream-3')
    l.rect(x + w - 2, y + 1, 1, h - 2, 'cream-2')
    l.rect(x + 1, y + h - 2, w - 2, 1, 'cream-1')
    l.rect(x + 4, CONTENT[1] - 3, w - 8, 1, 'red-3') // linha vermelha de ficha pautada (fora do conteúdo)
  })
  // Fitas adesivas nos cantos de cima (tortas: degrau de 1 px).
  for (const [tx, color, dir] of [[x + 6, 'pink', 1], [x + w - 26, 'teal-3', -1]]) {
    c.object((l) => {
      for (let j = 0; j < 7; j++) {
        const off = Math.floor(j / 3) * dir
        for (let i = 0; i < 20; i++) {
          if ((i === 0 || i === 19) && j % 2 === 1) continue // borda serrilhada
          l.set(tx + i + off, y - 3 + j, color)
        }
      }
    })
  }
}

/**
 * Cena base sem painel. `selected` = key do item elevado com outline de hover; `night` pré-tinge tudo, menos a
 * ficha (iluminada pela tela do monitor, logo abaixo) e o outline.
 */
export function renderScene({ skills = loadSkills(), selected = null, night = false } = {}) {
  const c = flat(CW, CH)
  drawWalls(c)
  drawCurtain(c)
  drawPlank(c)
  const items = layoutItems(skills)

  // Sombras dos itens na parede: silhueta deslocada (−2, +1), só acima da tábua.
  const occupied = new Set(items.flatMap((it) => itemPixels(it).map(([i]) => i)))
  for (const i of occupied) {
    const x = (i % CW) - 2, y = Math.floor(i / CW) + 1
    if (y < PLANK[1] && !occupied.has(y * CW + x)) c.set(x, y, 'wall-0')
  }
  let hover = null
  for (const it of items) {
    const lift = it.key === selected ? LIFT : 0
    const pixels = itemPixels(it, lift)
    c.object((l) => { for (const [i, p] of pixels) l.px.set(p, i * 4) })
    if (lift) hover = pixels.map(([i]) => i)
  }
  drawCard(c)

  let px = c.px
  if (night) {
    const card = flat(CW, CH)
    drawCard(card)
    px = multiply(px, TINT.night, (i) => card.px[i * 4 + 3] > 0)
    for (let y = 0; y < CH; y++) for (const x of [310, 311]) px.set(rgba(P['teal-3']), (y * CW + x) * 4) // luar na cortina
  }
  if (hover) {
    const set = new Set(hover)
    for (const i of hover) {
      const x = i % CW, y = Math.floor(i / CW)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= CW || ny >= CH || set.has(ny * CW + nx)) continue
        px.set(rgba(P['gold-2']), (ny * CW + nx) * 4)
      }
    }
  }
  return { px, items }
}

// ---------- mockup do painel (só prévia: no jogo é DOM, com a fonte e o i18n da UI) ----------
const F35 = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', ' ': '000000000000000', '/': '001001010100100', '.': '000000000000010', '-': '000000111000000',
  ':': '000010000010000', '%': '101001010100101', '<': '001010100010001', '>': '100010001010100', '(': '010100100100010',
  ')': '010001001001010', ',': '000000000010100', '·': '000000010000000',
}
export const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
export function text(c, x, y, str, color, scale = 1) {
  let cx = x
  for (const ch of plain(str)) {
    const g = F35[ch] ?? F35[' ']
    for (let k = 0; k < 15; k++) if (g[k] === '1') c.rect(cx + (k % 3) * scale, y + Math.floor(k / 3) * scale, scale, scale, color)
    cx += 4 * scale
  }
  return cx
}
export const textW = (str, scale = 1) => plain(str).length * 4 * scale - scale

export function bar(c, x, y, w, value, color) {
  c.rect(x, y, w, 2, 'cream-1')
  c.rect(x, y, Math.round((w * value) / 100), 2, color)
}

/** Estado padrão: índice com tudo à vista (o recrutador não precisa clicar em nada). */
export function mockIndex(c, skills, items) {
  const [x0, y0, w] = CONTENT
  text(c, x0 + 4, y0 + 2, 'Habilidades', 'graphite-1', 2)
  const hint = 'clique num livro'
  text(c, x0 + w - 4 - textW(hint), y0 + 6, hint, 'teal-2')
  c.rect(x0 + 4, y0 + 13, w - 8, 1, 'red-3')
  const colX = [x0 + 4, x0 + 80, x0 + 150]
  const top = y0 + 17
  // Técnicas: nome, nível e barra na cor do livro.
  text(c, colX[0], top, 'Técnicas', 'red-1')
  skills.tecnicas.forEach((s, k) => {
    const y = top + 8 + k * 9
    c.rect(colX[0], y, 3, 5, items[k].color)
    text(c, colX[0] + 5, y, s.nome, 'graphite-1')
    const lvl = String(s.nivel)
    text(c, colX[0] + 70 - textW(lvl), y, lvl, 'graphite-2')
    bar(c, colX[0] + 5, y + 6, 65, s.nivel, items[k].color)
  })
  // Ferramentas e idiomas.
  text(c, colX[1], top, 'Ferramentas', 'red-1')
  const carts = items.filter((it) => it.kind === 'cartridge')
  skills.ferramentas.forEach((name, k) => {
    const y = top + 8 + k * 7
    c.rect(colX[1], y, 3, 5, carts[k].color)
    text(c, colX[1] + 5, y, name, 'graphite-1')
  })
  const iy = top + 26
  text(c, colX[1], iy, 'Idiomas', 'red-1')
  const levels = [['Nativo'], ['Intermediário-', 'avançado']]
  skills.idiomas.forEach((lang, k) => {
    const y = iy + 8 + k * 15
    c.rect(colX[1], y, 3, 5, 'wood-1')
    text(c, colX[1] + 5, y, lang.nome, 'graphite-1')
    levels[k].forEach((line, j) => text(c, colX[1] + 5, y + 6 + j * 6, line, 'graphite-2'))
  })
  // Atributos (profissionais): barras sem número.
  text(c, colX[2], top, 'Atributos', 'red-1')
  skills.profissionais.forEach((s, k) => {
    const y = top + 8 + k * 9
    c.rect(colX[2], y, 3, 5, 'red-2')
    text(c, colX[2] + 5, y, s.nome, 'graphite-1')
    bar(c, colX[2] + 5, y + 6, 62, s.perc, 'red-2')
  })
}

/** Estado "livro aberto": a ficha da skill escolhida. */
export function mockFicha(c, skills, items, k) {
  const [x0, y0, w, h] = CONTENT
  const s = skills.tecnicas[k], it = items[k]
  // Capa do livro em miniatura com o ícone ampliado 3×.
  c.rect(x0 + 4, y0 + 4, 32, 32, it.color)
  c.border(x0 + 4, y0 + 4, 32, 32, 'outline')
  c.rect(x0 + 8, y0 + 8, 24, 24, 'cream-3')
  const icon = ICONS[s.icon]
  icon.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (icon.map[ch]) c.rect(x0 + 8 + i * 3, y0 + 8 + j * 3, 3, 3, icon.map[ch]) }))
  const tx = x0 + 44
  text(c, tx, y0 + 4, s.nome, 'graphite-1', 3)
  text(c, tx, y0 + 22, `Técnica · nível ${s.nivel}/100`, 'graphite-2')
  bar(c, tx, y0 + 30, 120, s.nivel, it.color)
  c.rect(x0 + 4, y0 + 42, w - 8, 1, 'red-3')
  text(c, x0 + 4, y0 + 47, 'Onde usei', 'red-1')
  for (let r = 0; r < 3; r++) { // placeholders: conteúdo novo (projetos ligados à skill), a confirmar
    c.rect(x0 + 4, y0 + 56 + r * 8, 4, 4, it.color)
    c.rect(x0 + 12, y0 + 56 + r * 8, [90, 70, 110][r], 4, 'cream-1')
  }
  text(c, x0 + 4, y0 + h - 8, '< índice', 'teal-2')
  const nav = '< anterior   próximo >'
  text(c, x0 + w - 4 - textW(nav), y0 + h - 8, nav, 'teal-2')
}

/** Contorno pontilhado (anotação da prévia). */
function dotted(c, [x, y, w, h], color) {
  for (let i = 0; i < w; i += 2) { c.set(x + i, y, color); c.set(x + i, y + h - 1, color) }
  for (let j = 0; j < h; j += 2) { c.set(x, y + j, color); c.set(x + w - 1, y + j, color) }
}

const toFlat = (px) => { const c = flat(CW, CH); c.px.set(px); return c }

/** Prévias da proposta: [{ name, px, w, h, scale }]. */
export function renderBookshelfCloseupPreviews() {
  const skills = loadSkills()
  const base = renderScene({ skills })
  for (const e of lint(base.px)) throw new Error(`closeup-bookshelf: ${e}`)
  const { items } = base

  const index = toFlat(base.px); mockIndex(index, skills, items)
  const javaScene = renderScene({ skills, selected: 'tecnicas.0' })
  const ficha = toFlat(javaScene.px); mockFicha(ficha, skills, items, 0)
  const night = toFlat(renderScene({ skills, night: true }).px); mockIndex(night, skills, items)
  const nightJava = toFlat(renderScene({ skills, night: true, selected: 'tecnicas.0' }).px); mockFicha(nightJava, skills, items, 0)

  // Anotações: retângulo de conteúdo (vermelho) e área de clique de cada item (ciano).
  const rects = toFlat(base.px)
  dotted(rects, CONTENT, 'red-1')
  for (const it of items) {
    const left = it.shear ? it.x - Math.round((it.h - 1) * it.shear) : it.x
    dotted(rects, [left, it.y - LIFT, it.x + it.w - left, it.h + LIFT], 'sky-0')
  }

  const stack = (a, b) => {
    const W = CW, H = CH * 2 + 6
    const p = new Uint8Array(W * H * 4)
    for (let i = 0; i < W * H; i++) p.set(rgba(UI_BG), i * 4)
    blit(p, W, H, a.px, CW, CH, 0, 0)
    blit(p, W, H, b.px, CW, CH, 0, CH + 6)
    return { px: p, w: W, h: H }
  }
  const day = stack(index, ficha), dark = stack(night, nightJava)

  console.log('itens da prateleira (x, y, w, h; inclinação):')
  for (const it of items) console.log(`  ${it.key.padEnd(14)} ${it.kind.padEnd(10)} ${[it.x, it.y, it.w, it.h].join(', ')}${it.shear ? `  shear ${it.shear.toFixed(3)}` : ''}  ${it.label}`)

  return [
    { name: 'm3-bookshelf-closeup', ...day },
    { name: 'm3-bookshelf-closeup-night', ...dark },
    { name: 'm3-bookshelf-closeup-rects', px: rects.px, w: CW, h: CH },
  ]
}
