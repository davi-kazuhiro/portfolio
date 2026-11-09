// Visão de perto do caderno (`journal`, M3) — APROVADA (versão A, 2026-11-08). Spec: docs/arte/specs.md §5.
// Exportação: tools/art/build-journal.mjs (pnpm art) usa `journalLayers` (só a A). A variação B continua aqui
// como histórico das prévias (node tools/art/build-m3.mjs journal).
//
// O visitante sentado no braço B, olhando para o tampo: caderno ABERTO deitado na mesa, parede esquerda no alto,
// luminária à direita (a cúpula fica na sangria de cima). Cada página dupla = uma experiência:
// esquerda = título, local, período e o carimbo do tipo; direita = os itens em checklist. Abas laterais (uma por
// experiência, cor por tipo) pulam direto; cantos dobrados viram a página. Texto é DOM (mockup só na prévia).
//
// Estilo oblíquo 3/4 da prateleira aprovada: capa com 3 px de espessura (+1, −1), camadas de folhas, vinco da
// lombada, sombra deslocada (−4, +4). Variações: A = capa dura vermelha, pautado; B = espiral azul, pontilhado.
// A cena é desenhada já com a sangria real (80/64, specs §3); a ilustração 320×180 é o recorte do meio.
import { readFileSync } from 'node:fs'
import { hash, rgba } from '../lib.mjs'
import { P, TINT, UI_BG } from '../palette.mjs'
import { flat } from '../flat.mjs'
import { blit, crop, lint, multiply } from '../sheet.mjs'
import { text } from './closeup-bookshelf.mjs'

export const CW = 320
export const CH = 180
export const BLEED = { left: 80, top: 64, right: 80, bottom: 64 }
export const BW = BLEED.left + CW + BLEED.right
export const BH = BLEED.top + CH + BLEED.bottom

// ---------- geometria (px da ilustração a 1×) ----------
export const WALL_Y = 20 // linha de trás do tampo (acima: parede esquerda)
export const DESK_FRONT = 214 // aresta da frente do tampo (na sangria de baixo)
export const POOL = { cx: 158, cy: 104, rx: 190, ry: 100 } // poça da luminária à noite (só no tampo)
export const inPool = (x, y) => ((x - POOL.cx) / POOL.rx) ** 2 + ((y - POOL.cy) / POOL.ry) ** 2 < 1
export const LINE = { pitch: 7, first: 40 } // pauta/pontos: linhas em y = 40 + 7k (caixa de linha 34+7k … 40+7k)

export const TYPES = {
  // Chaves = campo `type` de src/content/*/experiences.json.
  work: { tab: 'gold-1', tabDark: 'gold-0', tabHi: 'gold-3', ink: 'wood-2', icon: 'work' },
  research: { tab: 'leaf-1', tabDark: 'leaf-0', tabHi: 'leaf-2', ink: 'leaf-0', icon: 'research' },
}

export const LAYOUTS = {
  A: {
    name: 'A — capa dura, pautado',
    cover: [24, 24, 268, 150], depth: 3, color: 'red-2', lite: 'red-3', dark: 'red-0',
    pages: [[30, 27, 128, 141], [158, 27, 128, 141]], stack: 3,
    content: { left: [44, 34, 104, 124], right: [170, 34, 104, 124] },
    stamp: [116, 126, 30, 30],
    pageTurn: { prev: [30, 158, 10, 10], next: [276, 158, 10, 10] },
    tabs: { right: 286, left: 16, w: 18, h: 16, active: 3, firstY: 38, pitch: 22 },
    margin: [40, 166], // linha de margem vermelha de cada página
  },
  B: {
    name: 'B — espiral, pontilhado',
    cover: [24, 25, 268, 150], depth: 2, color: 'blue-1', lite: 'sky-1', dark: 'blue-0', side: 'teal-1',
    pages: [[28, 28, 124, 140], [164, 28, 124, 140]], stack: 2,
    content: { left: [40, 34, 104, 124], right: [176, 34, 104, 124] },
    stamp: [112, 126, 30, 30],
    pageTurn: { prev: [28, 158, 10, 10], next: [278, 158, 10, 10] },
    tabs: { right: 283, left: 13, w: 20, h: 14, active: 3, firstY: 38, pitch: 22 },
    coils: { x: 149, w: 18, firstY: 31, pitch: 6, lastY: 162 },
  },
}

// ---------- tela com origem lógica deslocada (px da ilustração podem ser negativos) ----------
const X0 = -BLEED.left, Y0 = -BLEED.top
function wrap(c) {
  const ox = -X0, oy = -Y0
  const w = {
    raw: c,
    set: (x, y, col) => c.set(x + ox, y + oy, col),
    rect: (x, y, ww, h, col) => c.rect(x + ox, y + oy, ww, h, col),
    paint: (x, y, ww, h, fn) => c.paint(x + ox, y + oy, ww, h, (i, j) => fn(i - ox, j - oy)),
    opaque: (x, y) => c.opaque(x + ox, y + oy),
    object: (draw, opts) => c.object((l) => draw(wrapLayer(l)), opts),
  }
  return w
}
const wrapLayer = (l) => ({
  set: (x, y, col) => l.set(x - X0, y - Y0, col),
  rect: (x, y, w, h, col) => l.rect(x - X0, y - Y0, w, h, col),
  paint: (x, y, w, h, fn) => l.paint(x - X0, y - Y0, w, h, (i, j) => fn(i + X0, j + Y0)),
  opaque: (x, y) => l.opaque(x - X0, y - Y0),
})
const big = () => wrap(flat(BW, BH))
export const idxOf = (x, y) => (y - Y0) * BW + (x - X0)
const xyOf = (i) => [(i % BW) + X0, Math.floor(i / BW) + Y0]
const mod = (v, n) => ((v % n) + n) % n

// ---------- fundo: parede, tampo, sombras, luminária, caneta, post-its ----------
const deskGrain = (x, y) => hash(Math.floor(mod(x, 32) / 4), y) > 0.82 && mod(x, 4) !== 3

/** Tampo (vista de cima) e a frente da mesa na sangria de baixo. */
function deskPixel(x, y) {
  if (y === WALL_Y) return 'wood-2'
  if (y < DESK_FRONT) return deskGrain(x, y) ? 'wood-5' : 'wood-6'
  const k = y - DESK_FRONT
  if (k === 0) return 'wood-7'
  if (k <= 6) return 'wood-5'
  if (k <= 11) return 'wood-4'
  return k === 12 ? 'outline' : 'mauve-0'
}

/** Parede esquerda (listras de 8 px, tons da parede esquerda), oclusão de 2 px e o tampo. Devolve a máscara do tampo. */
function drawRoom(c) {
  const desk = new Set()
  c.paint(X0, Y0, BW, WALL_Y - Y0, (x, y) => (y >= WALL_Y - 2 ? 'wall-0' : mod(Math.floor(x / 8), 2) ? 'wall-3' : 'wall-4'))
  c.paint(X0, WALL_Y, BW, BH + Y0 - WALL_Y, (x, y) => {
    if (y > WALL_Y && y < DESK_FRONT) desk.add(idxOf(x, y))
    return deskPixel(x, y)
  })
  return desk
}

/** Post-its: dois na parede (sangria de cima, à esquerda) e um no tampo (sangria da esquerda). */
function drawPostIts(c) {
  const note = (x, y, s, body, dark, lines) => {
    c.rect(x - 3, y + 3, s, s, lines ? 'wood-4' : 'wall-0') // sombra (−3, +3)
    c.object((l) => {
      l.paint(x, y, s, s, (i, j) => {
        const fx = x + s - 1 - i, fy = y + s - 1 - j
        if (fx + fy < 4) return fx + fy === 3 ? dark : null // canto levantado
        if (j === y + 1) return dark // faixa de cola
        if (lines && j > y + 4 && (j - y) % 4 === 1 && i > x + 2 && i < x + s - 3) return dark
        return body
      })
    })
  }
  note(-58, -44, 18, 'pink', 'red-1', false)
  note(-34, -30, 16, 'leaf-2', 'leaf-1', false)
  note(-62, 70, 22, 'gold-3', 'gold-1', true)
}

/**
 * Luminária à direita: o mesmo objeto do quarto (`desk-lamp`, `lampObject` em computer.mjs), no mesmo desenho e
 * cores: base redonda, haste reta, lâmpada sob a cúpula e cúpula cilíndrica (tambor). Cilindros como no gerador do
 * quarto: topo `teal-3`; lateral `teal-3` (luz, 27% da esquerda), `teal-2`, `teal-1` (27% da direita). À noite, a
 * borda de baixo da cúpula fica `gold-1` e a lâmpada `gold-3` (como `rimBottom`/`bulb` do quarto).
 * Base no tampo em x 297–327, y 22–36; haste x 308–315; cúpula x 293–331, y −42…−12 (na sangria de cima).
 */
export const LAMP_CU = { cx: 312, base: { cy: 27, rx: 15, ry: 5, h: 4 }, stem: [308, -12, 8, 39], shade: { top: -36, bottom: -18, rx: 19, ry: 6 }, bulb: { cy: -12, rx: 7, ry: 3 } }
function drawLamp(c, night) {
  const light = new Set()
  const { cx, base, stem, shade, bulb } = LAMP_CU
  const lamp = big()
  // Cilindro (centro dos topos em y0 e y1, y0 < y1): topo, lateral em 3 faixas, aro de baixo opcional.
  const cyl = (l, y0, y1, rx, ry, top, rim) => {
    for (let y = y0 - ry - 1; y <= y1 + ry + 1; y++) for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
      const u = (x + 0.5 - cx) / rx
      const e = 1 - u * u
      if (e < 0) continue
      const half = ry * Math.sqrt(e), dT = y + 0.5 - y0, dB = y + 0.5 - y1
      if (Math.abs(dT) <= half) l.set(x, y, top)
      else if (dT > 0 && dB <= half) {
        const t = rim && dB > half - 2 ? rim : u < -0.45 ? 'teal-3' : u > 0.45 ? 'teal-1' : 'teal-2'
        l.set(x, y, t)
        if (t === rim) light.add(idxOf(x, y))
      }
    }
  }
  lamp.object((l) => {
    cyl(l, base.cy, base.cy + base.h, base.rx, base.ry, 'teal-3')
    const [sx, sy, sw, sh] = stem
    l.paint(sx, sy, sw, sh, (x) => (x < cx ? 'teal-2' : 'teal-1'))
    l.paint(sx, sy, sw, 1, () => 'teal-3')
    const on = night ? 'gold-3' : 'cream-2'
    for (let y = bulb.cy - bulb.ry; y <= bulb.cy + bulb.ry; y++) for (let x = cx - bulb.rx; x <= cx + bulb.rx; x++) {
      if (((x + 0.5 - cx) / bulb.rx) ** 2 + ((y + 0.5 - bulb.cy) / bulb.ry) ** 2 < 1) { l.set(x, y, on); if (night) light.add(idxOf(x, y)) }
    }
    cyl(l, shade.top, shade.bottom, shade.rx, shade.ry, 'teal-3', night ? 'gold-1' : null)
  })
  // De dia, sombra da cúpula e da haste na parede: silhueta deslocada (−4, +4) em `wall-0`, só na parede.
  if (!night) {
    for (let i = 0; i < BW * BH; i++) {
      if (!lamp.raw.px[i * 4 + 3]) continue
      const [x, y] = xyOf(i)
      if (y + 4 < WALL_Y - 2 && !lamp.opaque(x - 4, y + 4)) c.set(x - 4, y + 4, 'wall-0')
    }
  }
  blit(c.raw.px, BW, BH, lamp.raw.px, BW, BH, 0, 0)
  // o contorno da lâmpada e do aro não é luz
  const ol = rgba(P.outline)
  for (const i of [...light]) if (lamp.raw.px[i * 4] === ol[0] && lamp.raw.px[i * 4 + 1] === ol[1] && lamp.raw.px[i * 4 + 2] === ol[2]) light.delete(i)
  return light
}

/** Caneta (A) ou lápis (B) deitado na margem esquerda do tampo, um pouco inclinado. */
function drawPen(c, style) {
  c.object((l) => {
    for (let y = 52; y <= 150; y++) {
      const x0 = 2 + Math.floor((y - 52) / 33) // inclina 1 px a cada 33
      for (let k = 0; k < 6; k++) {
        const x = x0 + k
        let t
        if (style === 'A') {
          t = k <= 1 ? 'graphite-2' : k >= 4 ? 'graphite-0' : 'graphite-1'
          if (y < 58) t = k <= 1 ? 'graphite-3' : 'graphite-2' // tampa
          if (k === 2 && y >= 60 && y <= 84) t = 'gold-1' // clipe
          if (y >= 140) { if (k === 0 || k === 5) continue; t = k <= 2 ? 'gold-3' : 'gold-1' } // ponteira
          if (y >= 146 && (k === 1 || k === 4)) continue
        } else {
          t = k <= 1 ? 'gold-3' : k >= 4 ? 'gold-0' : 'gold-1'
          if (y < 60) t = k <= 2 ? 'pink' : 'red-1' // borracha
          else if (y < 66) t = k <= 2 ? 'cream-2' : 'cream-0' // ponteira de metal
          if (y >= 136) { const w = Math.max(0, Math.floor((150 - y) / 5)); if (k < 3 - w || k > 2 + w) continue; t = y >= 146 ? 'graphite-1' : 'wood-7' }
        }
        l.set(x, y, t)
      }
    }
  })
}

// ---------- caderno aberto ----------
/** Capa: frente com cantos de 1 px cortados + espessura (+1, −1) por `depth` px; um objeto, contorno de 1 px. */
function drawCover(b, L, style) {
  const [cx, cy, cw, ch] = L.cover
  const mid = cx + cw / 2
  const side = L.side ?? L.dark
  b.object((l) => {
    for (let k = L.depth; k >= 1; k--) {
      l.rect(cx + k, cy - k, cw, 1, L.lite)
      l.rect(cx + cw - 1 + k, cy - k + 1, 1, ch - 1, side)
    }
    l.paint(cx, cy, cw, ch, (i, j) => {
      if ((i === cx || i === cx + cw - 1) && (j === cy || j === cy + ch - 1)) return null
      if (j >= cy + ch - 2) return L.dark
      if (j === cy) return L.lite
      if (style === 'A' && Math.abs(i + 0.5 - mid) < 3) return L.dark // lombada de pano
      return L.color
    })
  })
}

/**
 * Folhas (sem contorno próprio, dentro da silhueta da capa): camadas na borda de fora e embaixo, curva e vinco junto
 * da lombada, cantos dobrados (botões de página), pauta (A) ou pontos (B).
 */
function drawPages(b, L, style) {
  const n = L.stack
  const bound = style === 'A' // A: costurado, as camadas somem perto da lombada; B: folhas soltas na espiral
  const [[lx, ly, lw, lh], [rx]] = L.pages
  const mid = bound ? L.cover[0] + L.cover[2] / 2 : null
  b.object((l) => {
    for (let k = n; k >= 1; k--) {
      const t = k === n ? 'cream-0' : k % 2 ? 'cream-1' : 'cream-2'
      for (let y = ly + k; y < ly + lh + k; y++) { l.set(lx - k, y, t); l.set(rx + lw - 1 + k, y, t) }
      if (bound) {
        for (let x = lx - k; x <= mid - k * 6; x++) l.set(x, ly + lh - 1 + k, t)
        for (let x = mid + k * 6 - 1; x <= rx + lw - 1 + k; x++) l.set(x, ly + lh - 1 + k, t)
      } else {
        for (const [px, , pw] of L.pages) for (let x = px - (px === lx ? k : 0); x <= px + pw - 1 + (px === rx ? k : 0); x++) l.set(x, ly + lh - 1 + k, t)
      }
    }
    for (const [px, py, pw, ph] of L.pages) {
      const left = px === lx
      for (let y = py; y < py + ph; y++) for (let x = px; x < px + pw; x++) {
        const fromGutter = left ? px + pw - 1 - x : x - px
        const fromOuter = left ? x - px : px + pw - 1 - x
        const fromBottom = py + ph - 1 - y
        const dip = bound ? (fromGutter < 3 ? 2 : fromGutter < 9 ? 1 : 0) : 0
        if (y < py + dip) continue
        const sum = fromOuter + fromBottom
        let t = 'cream-3'
        if (sum < 5) t = 'cream-1' // canto dobrado: aparece a folha de baixo
        else if (fromOuter <= 5 && fromBottom <= 5) t = sum === 5 || fromOuter === 5 || fromBottom === 5 ? 'cream-0' : 'cream-2'
        else if (bound && fromGutter < 1) t = 'cream-0'
        else if (bound && fromGutter < 3) t = 'cream-1'
        else if (fromGutter < (bound ? 7 : 3)) t = 'cream-2'
        else if (y === py + dip && fromOuter > 0) t = 'cream-2'
        else if (style === 'A') {
          if (L.margin.includes(x) && y > py + 2 && fromBottom > 2) t = 'red-3'
          else if (y >= LINE.first && (y - LINE.first) % LINE.pitch === 0 && y <= 159 && fromOuter > 2) t = 'sky-1'
        } else if (y >= LINE.first && (y - LINE.first) % LINE.pitch === 0 && y <= 159 && mod(x - px - 5, LINE.pitch) === 0 && fromOuter > 2) t = 'cream-1'
        l.set(x, y, t)
      }
    }
    if (bound) for (const y of [ly - 1, ly + lh + n]) for (const x of [Math.floor(mid) - 1, Math.floor(mid)]) l.set(x, y, L.dark) // cabeceado
  }, { outline: false })
}

/** Espiral (B): argolas de 18×5 com contorno, a cada 6 px, atravessando o vão entre as folhas. */
function drawCoils(b, L) {
  const { x, w, firstY, pitch, lastY } = L.coils
  for (let y0 = firstY; y0 <= lastY; y0 += pitch) {
    b.object((l) => l.paint(x, y0, w, 5, (i, j) => {
      if ((i === x || i === x + w - 1) && (j === y0 || j === y0 + 4)) return null
      return j === y0 + 1 ? 'cream-3' : j === y0 + 2 ? 'cream-2' : 'cream-0'
    }))
  }
}

/** Retângulo da aba da experiência `slot` (lado 'right' | 'left'; a ativa sai `active` px a mais). */
export function tabRect(L, side, slot, active = false) {
  const { right, left, w, h, firstY, pitch } = L.tabs
  const extra = active ? L.tabs.active : 0
  const y = firstY + pitch * slot
  return side === 'right' ? [right, y, w + extra, h] : [left - extra, y, w + extra, h]
}

function drawTab(b, L, style, type, side, slot, active) {
  const C = TYPES[type]
  const [x, y, w, h] = tabRect(L, side, slot, active)
  const pageEdge = side === 'right' ? L.pages[1][0] + L.pages[1][2] : L.pages[0][0]
  b.object((l) => l.paint(x, y, w, h, (i, j) => {
    const outer = side === 'right' ? i === x + w - 1 : i === x
    if (outer && (j === y || j === y + h - 1)) return null // ponta arredondada
    if (style === 'B') { // bandeirinha adesiva: a parte sobre a folha é mais clara (translúcida)
      const onPage = side === 'right' ? i < pageEdge + 1 : i >= pageEdge - 1
      return onPage ? C.tabHi : j === y + h - 2 ? C.tabDark : C.tab
    }
    if (j === y + 1) return C.tabHi
    if (j >= y + h - 3) return C.tabDark
    return C.tab
  }))
}

// Carimbos do tipo (tinta de 1 cor sobre a folha): anel de 2 px + ícone 14×12 (maleta / erlenmeyer).
const STAMP_ICONS = {
  work: [
    '.....xxxx.....', '.....x..x.....', 'xxxxxxxxxxxxxx', 'x............x', 'x............x', 'xxxxxx..xxxxxx',
    'x....xxxx....x', 'x............x', 'x............x', 'x............x', 'xxxxxxxxxxxxxx', '..............',
  ],
  research: [
    '....xxxxxx....', '.....x..x.....', '.....x..x.....', '.....x..x.....', '....x....x....', '...x......x...',
    '..x..x.....x..', '.x.xxxxxxxx.x.', 'x.xxxxxxxxxx.x', 'x.xxxxxxxxxx.x', 'xxxxxxxxxxxxxx', '..............',
  ],
}
export function drawStamp(b, [x, y, w, h], type) {
  const C = TYPES[type]
  const cx = x + w / 2, cy = y + h / 2, r = w / 2 - 1
  b.object((l) => {
    l.paint(x, y, w, h, (i, j) => { const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy); return d < r && d >= r - 2 ? C.ink : null })
    STAMP_ICONS[C.icon].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'x') l.set(x + 8 + i, y + 9 + j, C.ink) }))
  }, { outline: false })
}

/** Só o caderno (capa, folhas, espiral, abas, carimbo), numa tela com sangria. `spread` = experiência aberta. */
export function renderBook(style, spread, types) {
  const L = LAYOUTS[style]
  const b = big()
  drawCover(b, L, style)
  drawPages(b, L, style)
  if (style === 'B') drawCoils(b, L)
  types.forEach((type, j) => drawTab(b, L, style, type, j < spread ? 'left' : 'right', j, j === spread))
  if (types[spread]) drawStamp(b, L.stamp, types[spread])
  return b
}

// ---------- cena ----------
/**
 * Cena completa com sangria (BW×BH). De noite: tudo × tint-night, menos o caderno (cores de dia, com o contorno), a
 * lâmpada e a poça da luminária no tampo (com a caneta e as sombras que caem nela).
 * Devolve { full, inner, keep } (inner = recorte 320×180 do meio).
 */
export function renderJournalScene({ style = 'A', spread = 0, types, night = false, book: given }) {
  const bg = big()
  const desk = drawRoom(bg)
  const before = bg.raw.px.slice()
  drawPostIts(bg)
  const light = drawLamp(bg, night)
  for (const i of [...desk]) for (let k = 0; k < 4; k++) if (bg.raw.px[i * 4 + k] !== before[i * 4 + k]) { desk.delete(i); break }

  const pen = big(); drawPen(pen, style)
  const book = given ?? renderBook(style, spread, types)
  // Sombras no tampo: silhueta deslocada (−4, +4), um tom só (wood-4), borda dura.
  const solid = (c, i) => c.raw.px[i * 4 + 3] > 0
  for (const c of [book, pen]) for (let i = 0; i < BW * BH; i++) {
    if (!solid(c, i)) continue
    const [x, y] = xyOf(i)
    if (x - 4 < X0 || y + 4 >= Y0 + BH) continue
    const t = idxOf(x - 4, y + 4)
    if (desk.has(t) && !solid(c, t)) bg.set(x - 4, y + 4, 'wood-4')
  }
  const penMask = new Set()
  for (let i = 0; i < BW * BH; i++) if (solid(pen, i)) penMask.add(i)
  blit(bg.raw.px, BW, BH, pen.raw.px, BW, BH, 0, 0)

  let px = bg.raw.px
  if (night) {
    px = multiply(px, TINT.night, (i) => {
      if (light.has(i)) return true
      const [x, y] = xyOf(i)
      return inPool(x, y) && (desk.has(i) || penMask.has(i))
    })
  }
  const full = px.slice()
  blit(full, BW, BH, book.raw.px, BW, BH, 0, 0)
  const keep = new Set(light)
  for (let i = 0; i < BW * BH; i++) {
    if (solid(book, i)) { keep.add(i); continue }
    const [x, y] = xyOf(i)
    if (inPool(x, y) && (desk.has(i) || penMask.has(i))) keep.add(i)
  }
  const inner = crop(full, BW, BH, { x: BLEED.left, y: BLEED.top, w: CW, h: CH })
  return { full, inner, keep, bg: px, desk, penMask }
}

// ---------- camadas para exportação (versão aprovada, A) ----------
/** Quantas abas cabem na borda da capa com o passo atual (a sombra da última ainda cai dentro da poça). */
export const TAB_SLOTS = 6
export const TAB_STATES = { right: ['right', false], 'right-active': ['right', true], left: ['left', false] }
/** Estado da aba da experiência j quando a aberta é `spread`. */
export const tabState = (j, spread) => (j < spread ? 'left' : j === spread ? 'right-active' : 'right')

/**
 * Camadas da visão de perto, todas em telas BW×BH (sangria incluída). Abas e sombras de aba ficam no slot 0; o DOM
 * soma `tabs.pitch · j` em y. As sombras de aba são iguais de dia e de noite (caem sempre na poça; o build confere).
 */
export function journalLayers(style = 'A') {
  const L = LAYOUTS[style]
  const bookOnly = renderBook(style, 0, [])
  const day = renderJournalScene({ style, types: [], book: bookOnly })
  const night = renderJournalScene({ style, types: [], book: bookOnly, night: true })
  const book = bookOnly.raw.px
  const op = (px, i) => px[i * 4 + 3] > 0
  const tabs = {}, tabShadows = {}, stamps = {}
  for (const [state, [side, active]] of Object.entries(TAB_STATES)) {
    tabs[state] = {}
    for (const type of Object.keys(TYPES)) { const b = big(); drawTab(b, L, style, type, side, 0, active); tabs[state][type] = b.raw.px }
    const tab = tabs[state].work
    const sh = new Uint8Array(BW * BH * 4)
    for (let i = 0; i < BW * BH; i++) {
      if (!op(tab, i)) continue
      const [x, y] = xyOf(i)
      if (x - 4 < X0 || y + 4 >= Y0 + BH) continue
      const t = idxOf(x - 4, y + 4)
      if (day.desk.has(t) && !op(book, t) && !op(tab, t) && !day.penMask.has(t)) sh.set(rgba(P['wood-4']), t * 4)
    }
    tabShadows[state] = sh
  }
  for (const type of Object.keys(TYPES)) { const b = big(); drawStamp(b, L.stamp, type); stamps[type] = b.raw.px }
  // Luz do fundo noturno (fica nas cores de dia): lâmpada, aro e poça; sem os pixels que o caderno cobre.
  const light = new Set([...night.keep].filter((i) => !op(book, i)))
  return { L, bleed: { day: day.bg, night: night.bg }, book, tabs, tabShadows, stamps, light }
}

/** Composição na ordem do JSON (o que o DOM faz): fundo, sombras das abas, caderno, abas, carimbo. */
export function composeJournal(layers, types, spread, night) {
  const out = (night ? layers.bleed.night : layers.bleed.day).slice()
  const pitch = layers.L.tabs.pitch
  types.forEach((_, j) => blit(out, BW, BH, layers.tabShadows[tabState(j, spread)], BW, BH, 0, pitch * j))
  blit(out, BW, BH, layers.book, BW, BH, 0, 0)
  types.forEach((type, j) => blit(out, BW, BH, layers.tabs[tabState(j, spread)][type], BW, BH, 0, pitch * j))
  blit(out, BW, BH, layers.stamps[types[spread]], BW, BH, 0, 0)
  return out
}

/**
 * Canto de virar página com hover (`prev` = canto de baixo da folha esquerda, `next` = da direita): a dobra cresce de
 * 5 para 7 px e as bordas da dobra ficam `gold-2` (cor de hover da bíblia). Devolve a tela BW×BH com só o retângulo.
 */
export function renderPageTurnHover(layers, which) {
  const L = layers.L
  const [rx, ry, rw, rh] = L.pageTurn[which]
  const [px, py, pw, ph] = L.pages[which === 'prev' ? 0 : 1]
  const out = new Uint8Array(BW * BH * 4)
  const c = big(); c.raw.px.set(out)
  for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) {
    const i = idxOf(x, y)
    const fromOuter = which === 'prev' ? x - px : px + pw - 1 - x
    const fromBottom = py + ph - 1 - y
    const sum = fromOuter + fromBottom
    if (fromOuter <= 7 && fromBottom <= 7) c.set(x, y, sum < 7 ? 'cream-1' : sum === 7 || fromOuter === 7 || fromBottom === 7 ? 'gold-2' : 'cream-2')
    else if (layers.book[i * 4 + 3]) c.raw.px.set(layers.book.subarray(i * 4, i * 4 + 4), i * 4)
  }
  return c.raw.px
}

// ---------- mockup do DOM (só prévia: no jogo o texto é DOM, com a fonte e o i18n da UI) ----------
// Chaves de experiences.json (2026-11-08): id, type, title, organization, program, city, period, items.
const loadExperiences = () => JSON.parse(readFileSync(new URL('../../../src/content/pt/experiences.json', import.meta.url), 'utf8'))
  .map((e) => ({ ...e, place: `${[e.program, e.organization].filter(Boolean).join(' ')}, ${e.city}` }))

function wrapText(str, max) {
  const out = []
  let line = ''
  for (const w of str.split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max) { out.push(line); line = w } else line = (line + ' ' + w).trim()
  }
  if (line) out.push(line)
  return out
}
// Ícones 7×7 (tinta): local, período, caixinha do checklist. Exportáveis como frames `icon/*` na aprovação.
export const SMALL_ICONS = {
  pin: ['..xxx..', '.x...x.', '.x.x.x.', '.x...x.', '..x.x..', '...x...', '...x...'],
  calendar: ['.x...x.', 'xxxxxxx', 'x.....x', 'xxxxxxx', 'x.x.x.x', 'x.....x', 'xxxxxxx'],
  box: ['xxxxxxx', 'x.....x', 'x.....x', 'x.....x', 'x.....x', 'x.....x', 'xxxxxxx'],
}
const icon = (c, x, y, name, color) => SMALL_ICONS[name].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'x') c.set(x + i, y + j, color) }))
export const TICK = [[1, 3], [2, 4], [3, 5], [4, 4], [5, 3], [6, 2], [7, 1], [8, 0], [2, 3], [3, 4], [4, 3], [5, 2], [6, 1], [7, 0]]
const tick = (c, x, y, color) => { for (const [i, j] of TICK) c.set(x + i, y + j, color) }

/** Linha k de um retângulo de conteúdo: topo da caixa de 7 px; o texto 3×5 fica em y+1…y+5, a pauta em y+6. */
const lineY = (rect, k) => rect[1] + k * LINE.pitch
function mockSpread(c, L, exp, done) {
  const { left, right } = L.content
  const maxL = Math.floor(left[2] / 4)
  let k = 0
  for (const t of wrapText(exp.title, maxL).slice(0, 4)) text(c, left[0], lineY(left, k++) + 1, t, 'graphite-1')
  k++
  icon(c, left[0], lineY(left, k) - 1, 'pin', TYPES[exp.type].ink)
  for (const t of wrapText(exp.place, maxL - 3)) text(c, left[0] + 10, lineY(left, k++) + 1, t, 'teal-1')
  icon(c, left[0], lineY(left, k) - 1, 'calendar', TYPES[exp.type].ink)
  text(c, left[0] + 10, lineY(left, k++) + 1, exp.period, 'teal-1')
  // direita: checklist; no mockup cada item tem até 3 linhas (o DOM, a 3×, cabe o texto inteiro)
  const maxR = Math.floor((right[2] - 10) / 4)
  k = 0
  for (const item of exp.items) {
    if ((k + 1) * LINE.pitch > right[3]) break
    icon(c, right[0], lineY(right, k) - 1, 'box', 'graphite-2')
    if (done) tick(c, right[0], lineY(right, k) - 2, TYPES[exp.type].ink)
    const lines = wrapText(item, maxR)
    const shown = lines.slice(0, 3)
    if (lines.length > 3) shown[2] = shown[2].slice(0, maxR - 3) + '...'
    for (const t of shown) text(c, right[0] + 10, lineY(right, k++) + 1, t, 'teal-1')
    k++
  }
}

export function dotted(c, [x, y, w, h], color) {
  for (let i = 0; i < w; i += 2) { c.set(x + i, y, color); c.set(x + i, y + h - 1, color) }
  for (let j = 0; j < h; j += 2) { c.set(x, y + j, color); c.set(x + w - 1, y + j, color) }
}

const sheetOf = (cells, cw, ch, cols, gap = 6) => {
  const rows = Math.ceil(cells.length / cols)
  const W = cw * cols + gap * (cols - 1), H = ch * rows + gap * (rows - 1)
  const px = new Uint8Array(W * H * 4)
  for (let i = 0; i < W * H; i++) px.set(rgba(UI_BG), i * 4)
  cells.forEach((p, n) => blit(px, W, H, p, cw, ch, (n % cols) * (cw + gap), Math.floor(n / cols) * (ch + gap)))
  return { px, w: W, h: H }
}

export function renderJournalPreviews() {
  const exps = loadExperiences()
  const types = exps.map((e) => e.type)
  // Paleta: de dia, tudo; de noite, o que fica nas cores de dia (caderno, lâmpada, poça). Alfa sempre 0/255.
  const check = (r, label, night) => {
    const e1 = lint(r.full, { palette: false })
    if (e1.length) throw new Error(`journal ${label}: ${e1.join(', ')}`)
    const sub = new Uint8Array(BW * BH * 4)
    for (let i = 0; i < BW * BH; i++) if (!night || r.keep.has(i)) sub.set(r.full.subarray(i * 4, i * 4 + 4), i * 4)
    const e2 = lint(sub)
    if (e2.length) throw new Error(`journal ${label} (paleta): ${e2.join(', ')}`)
  }
  const scene = (style, spread, night = false, mock = true) => {
    const r = renderJournalScene({ style, spread, types, night })
    check(r, `${style} ${spread}${night ? ' noite' : ''}`, night)
    const c = flat(CW, CH); c.px.set(r.inner)
    if (mock) mockSpread(c, LAYOUTS[style], exps[spread], true)
    return { r, c }
  }
  const cells = []
  for (const [spread, night] of [[0, false], [1, false], [1, true]]) for (const style of ['A', 'B']) cells.push(scene(style, spread, night).c.px)

  // Retângulos (na página 2): conteúdo (vermelho), carimbo (dourado), cantos de página (verde), abas (ciano).
  const rects = ['A', 'B'].map((style) => {
    const L = LAYOUTS[style]
    const { c } = scene(style, 1, false, false)
    for (const r of [L.content.left, L.content.right]) dotted(c, r, 'red-1')
    dotted(c, L.stamp, 'gold-0')
    for (const r of Object.values(L.pageTurn)) dotted(c, r, 'leaf-0')
    types.forEach((_, j) => dotted(c, tabRect(L, j < 1 ? 'left' : 'right', j, j === 1), 'sky-0'))
    return c.px
  })

  // Sangria (480×308): A e B, dia e noite, borda do 320×180 tracejada.
  const bleeds = []
  for (const style of ['A', 'B']) for (const night of [false, true]) {
    const r = renderJournalScene({ style, spread: 0, types, night })
    check(r, `${style} sangria${night ? ' noite' : ''}`, night)
    const c = flat(BW, BH); c.px.set(r.full)
    for (let x = 0; x < CW; x += 4) { c.set(BLEED.left + x, BLEED.top - 1, 'pink'); c.set(BLEED.left + x, BLEED.top + CH, 'pink') }
    for (let y = 0; y < CH; y += 4) { c.set(BLEED.left - 1, BLEED.top + y, 'pink'); c.set(BLEED.left + CW, BLEED.top + y, 'pink') }
    bleeds.push(c.px)
  }
  return [
    { name: 'm3-journal-closeup-sheet', ...sheetOf(cells, CW, CH, 2) },
    { name: 'm3-journal-closeup-rects', ...sheetOf(rects, CW, CH, 2) },
    { name: 'm3-journal-closeup-bleed', ...sheetOf(bleeds, BW, BH, 2) },
  ]
}
