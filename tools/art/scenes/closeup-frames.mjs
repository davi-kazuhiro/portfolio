// Visão de perto dos quadros (`frames`, M3). Variação A (galeria) aprovada em 2026-11-09; exportada por
// tools/art/build-frames.mjs (pnpm art) a partir de framesLayers. A variação B fica só como histórico (build-m3 frames).
// Spec: docs/arte/specs/7-quadros.md. Tela cheia 320×180 + sangria 80/64 (specs §3 "Tela cheia"), escala inteira, mínimo 3×.
//
// O visitante fica de frente para a parede esquerda (a direita da tela = +y, rumo à cama). Duas variações, cada uma
// casando com a variação do quarto:
// - A "galeria": a moldura ampliada (nogueira com filete dourado e passe-partout) com o certificado em destaque,
//   luminária de quadro de latão em cima, plaquinha de latão com o contador e as setas ‹ ›, e as miniaturas em
//   molduras pequenas penduradas à direita (2 colunas × 4 linhas = 8 vagas).
// - B "mural": o quadro de cortiça ocupa a tela; o certificado em destaque preso com duas tachinhas, etiquetas de
//   papel ‹ › nas laterais, as miniaturas presas numa fileira embaixo (8 vagas) e o varal de luzinhas no alto.
// Nada de texto na arte: título, emissor, data, descrição, botão "Abrir PDF" e contador são DOM.
// Selecionado = a vaga do certificado em destaque fica vazia (ele "saiu da parede" e está ampliado), com o anel dourado.
// Noite: tudo × tint-night, menos uma poça de luz (elipse de borda dura, como a do caderno) que cobre tudo o que é
// interativo; as luzes (barra da luminária, lâmpadas do varal) acendem em gold-3.
import { flat } from '../flat.mjs'
import { rgba } from '../lib.mjs'
import { TINT, UI_BG } from '../palette.mjs'
import { blit, lint } from '../sheet.mjs'

export const CW = 320, CH = 180
export const BLEED = { left: 80, top: 64, right: 80, bottom: 64 }
export const BW = BLEED.left + CW + BLEED.right, BH = BLEED.top + CH + BLEED.bottom
const X0 = -BLEED.left, Y0 = -BLEED.top
const mod = (v, n) => ((v % n) + n) % n
const hash = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h) }

export const LAYOUTS = {
  A: {
    name: 'A — galeria',
    frame: [14, 14, 204, 142], // moldura ampliada (caixa externa)
    paper: [30, 30, 172, 110], // certificado aberto (papel dentro do passe-partout)
    content: [38, 36, 156, 76], // texto do DOM: título, emissor, data, descrição
    pdf: [38, 116, 72, 16], // botão "Abrir PDF"
    seal: [170, 112, 22, 22],
    lamp: { plate: [112, 0, 8, 4], arm: [115, 4, 2, 4], bar: [78, 7, 76, 5] },
    plaque: [92, 160, 48, 12], counter: [97, 162, 38, 8],
    prev: [72, 158, 16, 16], next: [144, 158, 16, 16],
    slots: 8, thumb: (j) => [234 + 40 * (j % 2), 18 + 40 * Math.floor(j / 2), 32, 24],
    pool: { cx: 160, cy: 90, rx: 200, ry: 124 },
  },
  B: {
    name: 'B — mural de cortiça',
    board: [6, 4, 308, 172], cork: [12, 10, 296, 160],
    cord: { x0: 10, x1: 310, y: 6, sag: 6 }, bulbs: [25, 55, 85, 115, 145, 175, 205, 235, 265, 295],
    paper: [44, 22, 232, 114],
    content: [54, 32, 212, 74],
    pdf: [54, 112, 72, 16],
    seal: [242, 107, 22, 22],
    pins: [[52, 26, 'pink'], [267, 26, 'sky-0']],
    prev: [16, 64, 22, 28], next: [282, 64, 22, 28],
    slots: 8, thumb: (j) => [20 + 36 * j, 144, 30, 22],
    pool: { cx: 160, cy: 90, rx: 200, ry: 124 },
  },
}
const inPool = (P0, x, y) => ((x - P0.cx) / P0.rx) ** 2 + ((y - P0.cy) / P0.ry) ** 2 < 1

// ---------- tela com origem lógica deslocada ----------
const wrapLayer = (l) => ({
  set: (x, y, col) => l.set(x - X0, y - Y0, col),
  rect: (x, y, w, h, col) => l.rect(x - X0, y - Y0, w, h, col),
  paint: (x, y, w, h, fn) => l.paint(x - X0, y - Y0, w, h, (i, j) => fn(i + X0, j + Y0)),
})
function big() {
  const c = flat(BW, BH)
  return { raw: c, ...wrapLayer(c), object: (draw, opts) => c.object((l) => draw(wrapLayer(l)), opts) }
}

// ---------- peças ----------
/** Anel (distância à borda) e lado: cima/esquerda = claro (canto em meia-esquadria). */
function ringAt(a, b, w, h) {
  const r = w - 1 - a, d = h - 1 - b, e = Math.min(a, b, r, d)
  return { e, lit: (e === a || e === b) && !((e === r && a > r) || (e === d && b > d)) }
}
/** Caixa com anéis [claro, escuro] a partir de e = 1 (e = 0 vira contorno) e miolo `inner(x, y)`. */
function framed(c, [x, y, w, h], rings, inner) {
  c.object((l) => l.paint(x, y, w, h, (i, j) => {
    const { e, lit } = ringAt(i - x, j - y, w, h)
    if (e === 0) return 'outline'
    if (e <= rings.length) return rings[e - 1][lit ? 0 : 1]
    return inner(i, j)
  }))
}
const shadow = (c, [x, y, w, h], col, d = 3) => c.rect(x - d, y + d, w, h, col)
/** Papel de certificado: creme com fio duplo `cream-1` a 3 e 5 px da borda (sem texto). */
function certPixel([x, y, w, h], i, j) {
  const a = i - x, b = j - y, r = w - 1 - a, d = h - 1 - b, e = Math.min(a, b, r, d)
  return e === 3 || e === 5 ? 'cream-1' : 'cream-3'
}
/** Selo redondo de certificado (borda serrilhada, sem fita: nenhum é prêmio de colocação). */
function seal(c, [x, y, w]) {
  const cx = x + w / 2, cy = y + w / 2, R = w / 2
  c.object((l) => l.paint(x, y, w, w, (i, j) => {
    const dx = i + 0.5 - cx, dy = j + 0.5 - cy, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx)
    const edge = R - (mod(Math.round((ang / Math.PI) * 10), 2) ? 1 : 0)
    if (d >= edge) return null
    if (d > R - 3) return 'gold-0'
    if (d > R - 4) return dx + dy < 0 ? 'gold-3' : 'gold-1'
    if (Math.abs(d - R * 0.45) < 0.7) return 'gold-0'
    if ((Math.abs(dx) < 1 && Math.abs(dy) < 3) || (Math.abs(dy) < 1 && Math.abs(dx) < 3)) return 'gold-3'
    return 'gold-1'
  }))
}
/** Certificado em miniatura (linhas e selo) num retângulo de papel. */
function miniCert(c, [x, y, w, h]) {
  c.paint(x, y, w, h, (i, j) => {
    const a = i - x, b = j - y
    if (Math.min(a, b, w - 1 - a, h - 1 - b) === 1) return 'cream-1'
    if (b === 4 && a >= 4 && a < w - 4) return 'cream-0'
    if ((b === 7 || b === 9) && a >= 3 && a < w - (b === 9 ? 9 : 3)) return 'cream-1'
    if (a >= w - 7 && a < w - 3 && b >= h - 6 && b < h - 2) return (a + b) % 2 ? 'gold-0' : 'gold-1'
    return 'cream-3'
  })
}
/** Tachinha redonda 5×5 com brilho. */
function pin(c, x, y, col) {
  c.object((l) => l.paint(x - 2, y - 2, 5, 5, (i, j) => {
    const dx = i - x, dy = j - y
    if (Math.abs(dx) + Math.abs(dy) > 3) return null
    return dx === -1 && dy === -1 ? 'cream-3' : col
  }))
}
/** Seta (triângulo) dentro de um retângulo; `dir` = −1 (‹) ou 1 (›). */
function arrow(c, [x, y, w, h], dir, col) {
  const cy = y + h / 2, len = 5, x0 = x + Math.floor((w - len) / 2)
  c.paint(x0, y, len, h, (i, j) => {
    const k = dir < 0 ? i - x0 : x0 + len - 1 - i
    return Math.abs(j + 0.5 - cy) <= k * 0.8 + 0.5 ? col : null
  })
}
/** Anel de hover / selecionado (regra 13) em volta de um retângulo: `gold-2` e, por fora, `outline`. */
export function hoverRect(c, [x, y, w, h]) {
  const border = (rx, ry, rw, rh, col) => {
    for (let i = rx + 1; i < rx + rw - 1; i++) { c.set(i, ry, col); c.set(i, ry + rh - 1, col) }
    for (let j = ry + 1; j < ry + rh - 1; j++) { c.set(rx, j, col); c.set(rx + rw - 1, j, col) }
  }
  border(x - 2, y - 2, w + 4, h + 4, 'outline')
  for (const [i, j] of [[x - 1, y - 1], [x + w, y - 1], [x - 1, y + h], [x + w, y + h]]) c.set(i, j, 'outline')
  border(x - 1, y - 1, w + 2, h + 2, 'gold-2')
}

const THUMB_MOULD = [
  [['wood-7', 'wood-2'], ['wood-5', 'wood-2']],
  [['graphite-3', 'graphite-0'], ['graphite-2', 'graphite-1']],
  [['gold-3', 'gold-0'], ['gold-1', 'gold-0']],
]
const PIN_COLORS = ['pink', 'sky-0', 'leaf-1', 'gold-1']

/** Linha de 1 px (Bresenham). */
function line(c, x0, y0, x1, y1, col) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    c.set(x0, y0, col)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x0 += sx }
    if (e2 <= dx) { err += dx; y0 += sy }
  }
}

// ---------- cenas ----------
/** Fundo de A (sem as miniaturas): parede, luminária de quadro, moldura ampliada com o certificado, selo, plaquinha e setas. */
function drawABackground(c, L, lit) {
  // Parede esquerda (listras de 8 px), inclusive a sangria.
  c.paint(X0, Y0, BW, BH, (x) => (mod(Math.floor(x / 8), 2) ? 'wall-3' : 'wall-4'))
  // Luminária de quadro: espelho na parede, braço e barra de latão (acende por baixo à noite).
  const { plate, arm, bar } = L.lamp
  shadow(c, bar, 'wall-0'); shadow(c, plate, 'wall-0'); shadow(c, L.frame, 'wall-0')
  c.object((l) => {
    l.rect(...plate, 'gold-0'); l.rect(plate[0] + 1, plate[1], plate[2] - 2, 1, 'gold-1')
    l.rect(...arm, 'gold-0')
    l.paint(...bar, (i, j) => (j === bar[1] + 1 ? 'gold-3' : j === bar[1] + bar[3] - 2 ? (lit ? 'gold-3' : 'gold-0') : 'gold-1'))
  })
  // Moldura ampliada: nogueira com sulco, filete dourado, passe-partout com chanfro.
  const rings = [['wood-5', 'wood-1'], ['wood-4', 'wood-2'], ['wood-4', 'wood-2'], ['wood-2', 'wood-1'], ['wood-4', 'wood-2'],
    ['gold-3', 'gold-0'], ['wood-0', 'wood-0'], ...Array(7).fill(['cream-2', 'cream-2']), ['cream-1', 'cream-3']]
  framed(c, L.frame, rings, (i, j) => certPixel(L.paper, i, j))
  seal(c, L.seal)
  // Plaquinha (contador) e setas ‹ ›.
  for (const r of [L.plaque, L.prev, L.next]) shadow(c, r, 'wall-0', 2)
  framed(c, L.plaque, [['gold-3', 'gold-0']], (i, j) => ((i === L.plaque[0] + 3 || i === L.plaque[0] + L.plaque[2] - 4) && j === L.plaque[1] + 5 ? 'gold-0' : 'gold-1'))
  for (const [r, dir] of [[L.prev, -1], [L.next, 1]]) drawAArrowPlate(c, r, dir)
}
/** Placa de latão de uma seta (sem a sombra): anel `gold-3`/`gold-0`, miolo `gold-1`, seta `graphite-1`. */
function drawAArrowPlate(c, r, dir) {
  framed(c, r, [['gold-3', 'gold-0']], () => 'gold-1')
  arrow(c, r, dir, 'graphite-1')
}
/** Seta isolada (para o atlas): sombra 2 px + placa; com `hover`, o anel da regra 13. */
export function drawAArrow(c, L, which, hover = false) {
  const r = L[which]
  shadow(c, r, 'wall-0', 2)
  drawAArrowPlate(c, r, which === 'prev' ? -1 : 1)
  if (hover) hoverRect(c, r)
}
/** Estilos de moldura das miniaturas, na ordem da alternância (`j mod 3`). */
export const THUMB_STYLES = ['wood', 'graphite', 'gold']
/** Miniatura `j` pendurada (arame, sombra, moldura do estilo `j mod 3`, passe-partout e certificado em miniatura). */
export function drawAThumb(c, L, j, styleIndex = j % 3) {
  const [x, y, w, h] = L.thumb(j)
  line(c, x + 16, y - 6, x + 5, y, 'graphite-1'); line(c, x + 16, y - 6, x + 26, y, 'graphite-1')
  shadow(c, [x, y, w, h], 'wall-0', 2)
  const M = THUMB_MOULD[styleIndex]
  framed(c, [x, y, w, h], [...M, ['cream-2', 'cream-2']], () => 'cream-3')
  miniCert(c, [x + 4, y + 4, w - 8, h - 8])
}
/** Vaga do selecionado: a marca mais clara da tinta (`wall-5`), sem o quadro. */
export function drawAEmptySlot(c, L, j) {
  c.rect(...L.thumb(j), 'wall-5')
}
/** Prego da vaga `j` (2×2 `graphite-2`, cabeça `graphite-0`), 7 px acima da miniatura. */
export function drawANail(c, L, j) {
  const [x, y] = L.thumb(j)
  c.rect(x + 15, y - 7, 2, 2, 'graphite-2'); c.set(x + 16, y - 6, 'graphite-0')
}

function drawA(c, L, { count, selected, hover, lit }) {
  drawABackground(c, L, lit)
  // Miniaturas: molduras pequenas penduradas por prego e arame; a vaga do selecionado fica vazia (marca na parede).
  for (let j = 0; j < Math.min(count, L.slots); j++) {
    if (j === selected) drawAEmptySlot(c, L, j)
    else drawAThumb(c, L, j)
    drawANail(c, L, j)
    if (j === selected || j === hover) hoverRect(c, L.thumb(j))
  }
  if (hover === 'next' || hover === 'prev') hoverRect(c, L[hover])
}

function drawB(c, L, { count, selected, hover, lit }) {
  c.paint(X0, Y0, BW, BH, (x) => (mod(Math.floor(x / 8), 2) ? 'wall-3' : 'wall-4'))
  shadow(c, L.board, 'wall-0')
  // Cortiça (ruído determinístico) com a borda de dentro em sombra no alto e à esquerda.
  framed(c, L.board, [['wood-7', 'wood-2'], ['wood-5', 'wood-2'], ['wood-5', 'wood-2'], ['wood-4', 'wood-1'], ['wood-1', 'wood-3']], (i, j) => {
    const n = hash(i, j)
    if (j === L.cork[1] || i === L.cork[0]) return 'wood-3'
    return n > 0.88 ? 'wood-3' : n < 0.07 ? 'wood-5' : n < 0.1 ? 'wood-2' : 'wood-4'
  })
  // Certificado em destaque, preso com duas tachinhas.
  shadow(c, L.paper, 'wood-2')
  framed(c, L.paper, [], (i, j) => certPixel(L.paper, i, j))
  seal(c, L.seal)
  for (const [x, y, col] of L.pins) { c.set(x - 2, y + 3, 'cream-1'); c.set(x - 1, y + 3, 'cream-1'); pin(c, x, y, col) }
  // Etiquetas ‹ › de papel pardo.
  for (const [r, dir] of [[L.prev, -1], [L.next, 1]]) {
    shadow(c, r, 'wood-2', 2)
    framed(c, r, [['cream-2', 'cream-0']], () => 'cream-1')
    arrow(c, [r[0], r[1] + 4, r[2], r[3] - 4], dir, 'graphite-1')
    pin(c, r[0] + (r[2] >> 1), r[1] + 3, 'red-2')
  }
  // Miniaturas presas na fileira de baixo; a vaga do selecionado fica só com a tachinha.
  for (let j = 0; j < Math.min(count, L.slots); j++) {
    const [x, y, w, h] = L.thumb(j)
    if (j !== selected) {
      shadow(c, [x, y, w, h], 'wood-2', 2)
      framed(c, [x, y, w, h], [], () => 'cream-3')
      miniCert(c, [x + 1, y + 1, w - 2, h - 2])
    }
    pin(c, x + 15, y + 2, PIN_COLORS[j % 4])
    if (j === selected || j === hover) hoverRect(c, [x, y, w, h])
  }
  if (hover === 'next') hoverRect(c, L.next)
  // Varal de luzinhas por cima de tudo: fio com barriga, ganchos nas pontas e lâmpadas penduradas.
  const { x0, x1, y, sag } = L.cord
  const cy = (x) => y + Math.round(sag * (1 - ((x - (x0 + x1) / 2) / ((x1 - x0) / 2)) ** 2))
  for (let x = x0; x < x1; x++) line(c, x, cy(x), x + 1, cy(x + 1), 'graphite-1')
  for (const x of [x0, x1]) c.object((l) => l.rect(x - 1, y - 1, 3, 3, 'graphite-2'))
  for (const x of L.bulbs) {
    const top = cy(x)
    c.object((l) => {
      l.rect(x - 1, top + 1, 3, 2, 'graphite-2')
      l.paint(x - 2, top + 3, 5, 5, (i, j) => {
        const a = i - (x - 2), b = j - (top + 3)
        if ((a === 0 || a === 4) && (b === 0 || b === 4)) return null
        if (a === 1 && b === 1) return 'cream-3'
        return lit ? 'gold-3' : 'cream-2'
      })
    })
  }
}

/** Cena completa (480×308 com a sangria). Devolve { full, inner, keep } (keep = pixels nas cores de dia). */
export function renderFramesScene({ style, night = false, count = 5, selected = 0, hover = -1 }) {
  const L = LAYOUTS[style]
  const c = big()
  ;(style === 'A' ? drawA : drawB)(c, L, { count, selected, hover, lit: night })
  const { full, keep } = night ? tintNight(c.raw.px, L.pool) : { full: c.raw.px.slice(), keep: new Set() }
  const inner = new Uint8Array(CW * CH * 4)
  for (let j = 0; j < CH; j++) inner.set(full.subarray(((j + BLEED.top) * BW + BLEED.left) * 4, ((j + BLEED.top) * BW + BLEED.left + CW) * 4), j * CW * 4)
  return { full, inner, keep, L, c }
}

/** Noite: tudo × tint-night, menos a poça de luz (borda dura). Devolve { full, keep } (keep = índices nas cores de dia). */
function tintNight(px, pool) {
  const full = px.slice()
  const keep = new Set()
  const [tr, tg, tb] = rgba(TINT.night)
  for (let k = 0; k < BW * BH; k++) {
    const x = (k % BW) + X0, y = Math.floor(k / BW) + Y0
    if (inPool(pool, x, y)) { keep.add(k); continue }
    full[k * 4] = Math.round((full[k * 4] * tr) / 255)
    full[k * 4 + 1] = Math.round((full[k * 4 + 1] * tg) / 255)
    full[k * 4 + 2] = Math.round((full[k * 4 + 2] * tb) / 255)
  }
  return { full, keep }
}

// ---------- camadas para a exportação (variação A, aprovada em 2026-11-09) ----------
/**
 * Camadas BW×BH da variação A, cada uma na posição da ilustração. As miniaturas e a vaga vazia ficam na vaga 0;
 * a vaga j soma `thumb(j) − thumb(0)`. À noite as miniaturas e as setas ficam dentro da poça (cores de dia), por
 * isso não têm variante; o build confere isso compondo as camadas e comparando com renderFramesScene.
 */
export function framesLayers(style = 'A') {
  if (style !== 'A') throw new Error('framesLayers: só a variação A (aprovada) é exportada')
  const L = LAYOUTS.A
  const layer = (draw) => { const c = big(); draw(c); return c.raw.px }
  const bgDay = layer((c) => drawABackground(c, L, false))
  const { full: bgNight, keep } = tintNight(layer((c) => drawABackground(c, L, true)), L.pool)
  const thumbs = {}
  THUMB_STYLES.forEach((name, k) => {
    const draw = (c) => { drawAThumb(c, L, 0, k); drawANail(c, L, 0) }
    thumbs[name] = { normal: layer(draw), hover: layer((c) => { draw(c); hoverRect(c, L.thumb(0)) }) }
  })
  const selected = layer((c) => { drawAEmptySlot(c, L, 0); drawANail(c, L, 0); hoverRect(c, L.thumb(0)) })
  const arrows = {}
  for (const which of ['prev', 'next']) arrows[which] = { normal: layer((c) => drawAArrow(c, L, which)), hover: layer((c) => drawAArrow(c, L, which, true)) }
  const sealPx = layer((c) => seal(c, L.seal))
  const plaque = layer((c) => framed(c, L.plaque, [['gold-3', 'gold-0']], (i, j) => ((i === L.plaque[0] + 3 || i === L.plaque[0] + L.plaque[2] - 4) && j === L.plaque[1] + 5 ? 'gold-0' : 'gold-1')))
  // Luz da noite no fundo (fica nas cores de dia): a poça inteira.
  return { L, bleed: { day: bgDay, night: bgNight }, light: keep, thumbs, selected, arrows, seal: sealPx, plaque }
}

/** Deslocamento da vaga j em relação à vaga 0 (onde estão as camadas das miniaturas). */
export const slotOffset = (L, j) => [L.thumb(j)[0] - L.thumb(0)[0], L.thumb(j)[1] - L.thumb(0)[1]]

/** Composição na ordem do JSON (o que o DOM faz): fundo, miniaturas (ou vaga vazia), hover das setas. */
export function composeFrames(layers, { count, selected = 0, hover = -1, night = false }) {
  const { L } = layers
  const out = (night ? layers.bleed.night : layers.bleed.day).slice()
  for (let j = 0; j < Math.min(count, L.slots); j++) {
    const [dx, dy] = slotOffset(L, j)
    const t = layers.thumbs[THUMB_STYLES[j % 3]]
    const px = j === selected ? layers.selected : j === hover ? t.hover : t.normal
    blit(out, BW, BH, px, BW, BH, dx, dy)
  }
  if (hover === 'prev' || hover === 'next') blit(out, BW, BH, layers.arrows[hover].hover, BW, BH, 0, 0)
  return out
}

// ---------- prévias ----------
function dotted(c, [x, y, w, h], color) {
  for (let i = 0; i < w; i += 2) { c.set(x + i, y, color); c.set(x + i, y + h - 1, color) }
  for (let j = 0; j < h; j += 2) { c.set(x, y + j, color); c.set(x + w - 1, y + j, color) }
}
/** Simulação do DOM (só na prévia): barras no lugar do texto e o botão. Não é arte exportada. */
export function mockDom(c, L) {
  const [x, y, w] = L.content
  c.rect(x, y + 2, Math.round(w * 0.85), 3, 'graphite-1'); c.rect(x, y + 9, Math.round(w * 0.5), 3, 'graphite-1')
  c.rect(x, y + 18, 30, 2, 'teal-2'); c.rect(x, y + 24, 46, 2, 'teal-2')
  for (let k = 0; k < 3; k++) c.rect(x, y + 34 + 6 * k, k === 2 ? Math.round(w * 0.6) : w - 4, 2, 'teal-1')
  const [bx, by, bw, bh] = L.pdf
  c.rect(bx, by, bw, bh, 'graphite-1'); c.rect(bx + 1, by + 1, bw - 2, bh - 2, 'teal-2'); c.rect(bx + 8, by + 7, bw - 16, 2, 'cream-3')
  if (L.counter) c.rect(L.counter[0] + 10, L.counter[1] + 3, 18, 2, 'graphite-1')
}
const sheetOf = (cells, cw, ch, cols, gap = 6) => {
  const rows = Math.ceil(cells.length / cols)
  const W = cw * cols + gap * (cols - 1), H = ch * rows + gap * (rows - 1)
  const px = new Uint8Array(W * H * 4)
  for (let i = 0; i < W * H; i++) px.set(rgba(UI_BG), i * 4)
  cells.forEach((p, n) => blit(px, W, H, p, cw, ch, (n % cols) * (cw + gap), Math.floor(n / cols) * (ch + gap)))
  return { px, w: W, h: H }
}

export function renderFramesPreviews() {
  const check = (r, label, night) => {
    const e1 = lint(r.full, { palette: false })
    if (e1.length) throw new Error(`frames ${label}: ${e1.join(', ')}`)
    const sub = new Uint8Array(BW * BH * 4)
    for (let i = 0; i < BW * BH; i++) if (!night || r.keep.has(i)) sub.set(r.full.subarray(i * 4, i * 4 + 4), i * 4)
    const e2 = lint(sub)
    if (e2.length) throw new Error(`frames ${label} (paleta): ${e2.join(', ')}`)
  }
  const innerCanvas = (r) => { const c = flat(CW, CH); c.px.set(r.inner); return c }
  // Folha: A e B, dia | noite, com 5 certificados, o 1º selecionado, hover na 3ª miniatura e simulação do DOM.
  const cells = []
  for (const style of ['A', 'B']) for (const night of [false, true]) {
    const r = renderFramesScene({ style, night, count: 5, selected: 0, hover: 2 })
    check(r, `${style}${night ? ' noite' : ''}`, night)
    const c = innerCanvas(r)
    mockDom(c, r.L)
    cells.push(c.px)
  }
  // Retângulos: 8 certificados (capacidade), certificado (red-1), texto (blue-0), botão PDF e setas (leaf-0),
  // miniaturas (sky-0), contador (gold-0).
  const rects = ['A', 'B'].map((style) => {
    const r = renderFramesScene({ style, count: 8, selected: 0 })
    check(r, `${style} 8`, false)
    const c = innerCanvas(r), L = r.L
    dotted(c, L.paper, 'red-1')
    dotted(c, L.content, 'blue-0')
    for (const k of ['pdf', 'prev', 'next']) dotted(c, L[k], 'leaf-0')
    for (let j = 0; j < L.slots; j++) dotted(c, L.thumb(j), 'sky-0')
    if (L.counter) dotted(c, L.counter, 'gold-0')
    return c.px
  })
  const bleeds = []
  for (const style of ['A', 'B']) for (const night of [false, true]) {
    const r = renderFramesScene({ style, night })
    const c = flat(BW, BH); c.px.set(r.full)
    for (let x = 0; x < CW; x += 4) { c.set(BLEED.left + x, BLEED.top - 1, 'pink'); c.set(BLEED.left + x, BLEED.top + CH, 'pink') }
    for (let y = 0; y < CH; y += 4) { c.set(BLEED.left - 1, BLEED.top + y, 'pink'); c.set(BLEED.left + CW, BLEED.top + y, 'pink') }
    bleeds.push(c.px)
  }
  return [
    { name: 'm3-frames-closeup-sheet', ...sheetOf(cells, CW, CH, 2) },
    { name: 'm3-frames-closeup-rects', ...sheetOf(rects, CW, CH, 2), scale: 3 },
    { name: 'm3-frames-closeup-bleed', ...sheetOf(bleeds, BW, BH, 2) },
  ]
}
