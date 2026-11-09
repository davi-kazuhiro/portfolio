// Sangria real das visões de perto (2026-11-08): arte em volta da ilustração 320×180, para a regra "cover"
// (ADR 0006, revisão de 2026-11-08) cortar em escalas menores sem esticar a borda. Spec: docs/arte/specs.md §3.
//
// Coordenadas lógicas: a ilustração-base continua em (0, 0)–(320, 180); a sangria fica em x < 0, x ≥ 320,
// y < 0 e y ≥ 180. A cena dentro do 320×180 é colada por cima, sem nenhuma alteração (o build confere).
//
// O que há na sangria (dia; a noite é a mesma arte × tint-night):
// - esquerda: a parede esquerda continua (listras de 4 px), com a quina `wall-0` em x 30;
// - cima: parede (listras de 8 px), o varão da cortina (y −8…−3, argolas até a cortina) e o alto da janela;
// - direita: janela com batente `cream-2`, vidro `sky-0` com nuvens e reflexos, peitoril e parede embaixo;
// - baixo: computador → frente da mesa (até y 183), lado do braço B ao longo da diagonal e o vão escuro
//   debaixo da mesa; prateleira → parede.
// À noite, ficam nas cores de dia (luz): estrelas e lua no vidro, a poça da luminária no tampo e, com a tela
// acesa, o halo do monitor, que sobe 1 px inteiro (3 px de halo, como dos lados) e some em 2 linhas pontilhadas.
import { flat } from '../flat.mjs'
import { TINT } from '../palette.mjs'
import { crop, multiply } from '../sheet.mjs'
import { CH, CW, deskPixel, inPool, MONITOR_BOX, MONITOR_DEPTH } from './closeup.mjs'

/** Margem de arte real em volta do 320×180 (px da ilustração). Mínimo da spec: 48 por lado. */
export const BLEED = { left: 80, top: 64, right: 80, bottom: 64 }
export const BW = BLEED.left + CW + BLEED.right
export const BH = BLEED.top + CH + BLEED.bottom
const PAD = 2 // folga fora da tela final: nenhum contorno nasce na borda do recorte

const X0 = -BLEED.left - PAD, X1 = CW + BLEED.right + PAD
const Y0 = -BLEED.top - PAD, Y1 = CH + BLEED.bottom + PAD
const mod = (v, n) => ((v % n) + n) % n

/** Tela com origem lógica deslocada: as funções de desenho usam px da ilustração (podem ser negativos). */
function wrap(c, ox, oy) {
  return {
    set: (x, y, col) => c.set(x + ox, y + oy, col),
    rect: (x, y, w, h, col) => c.rect(x + ox, y + oy, w, h, col),
    paint: (x, y, w, h, fn) => c.paint(x + ox, y + oy, w, h, (i, j) => fn(i - ox, j - oy)),
    object: (draw, opts) => c.object((l) => draw(wrap(l, ox, oy)), opts),
  }
}
function canvas() {
  const base = flat(X1 - X0, Y1 - Y0)
  return { base, c: wrap(base, -X0, -Y0) }
}
const idxOf = (x, y) => (y - Y0) * (X1 - X0) + (x - X0)
const xyOf = (i) => [mod(i, X1 - X0) + X0, Math.floor(i / (X1 - X0)) + Y0]

// ---------- paredes ----------
function drawWalls(c, yEnd) {
  // Parede esquerda (encurtada pela perspectiva): listras de 4 px; quina de 1 px em x 30.
  c.paint(X0, Y0, 30 - X0, yEnd - Y0, (x) => (mod(Math.floor(x / 4), 2) ? 'wall-3' : 'wall-4'))
  // Parede do fundo: listras de 8 px; da coluna 222 em diante, na luz da janela.
  c.paint(31, Y0, X1 - 31, yEnd - Y0, (x, y) => {
    if (y === 157 && yEnd === 158) return 'wall-0' // linha de oclusão sobre o tampo (computador)
    const s = mod(Math.floor((x - 30) / 8), 2)
    if (x >= 222) return s ? 'wall-3' : 'wall-4'
    return s ? 'wall-1' : 'wall-2'
  })
  c.rect(30, Y0, 1, yEnd - Y0, 'wall-0')
}

// ---------- janela e varão (à direita da cortina, que termina com contorno em x 319) ----------
const WIN = { x: 320, mullion: 361, top: -1 }
const CLOUDS = [[350, 26, 15, 5], [340, 31, 9, 4], [388, 64, 13, 4], [378, 68, 7, 3], [336, 104, 10, 3]]
const STARS = [[331, 14], [347, 41], [372, 9], [395, 33], [338, 72], [389, 95], [356, 118], [328, 128], [397, 140], [369, 150]]
const MOON = { cx: 384, cy: 22, r: 5 }
const inMoon = (x, y) => (x + 0.5 - MOON.cx) ** 2 + (y + 0.5 - MOON.cy) ** 2 < MOON.r ** 2

function glassDay(x, y) {
  for (const [cx, cy, rx, ry] of CLOUDS) {
    const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry
    if (u * u + v * v < 1) return v > 0.45 ? 'sky-2' : 'cream-3'
  }
  const d = mod(x + y, 54)
  if (d < 3 || d === 5) return 'sky-1' // reflexo diagonal
  return 'sky-0'
}

/** Pontos que ficam nas cores de dia à noite: estrelas e lua (só sobre o vidro). */
function nightLights(sillY) {
  const glass = (x, y) => x >= 325 && x !== 361 && !(x >= 361 && x <= 365) && y >= 5 && y <= sillY - 2
  const out = new Map() // idx → token
  for (const [x, y] of STARS) if (glass(x, y)) out.set(idxOf(x, y), 'cream-3')
  for (let y = MOON.cy - MOON.r; y <= MOON.cy + MOON.r; y++) for (let x = MOON.cx - MOON.r; x <= MOON.cx + MOON.r; x++) {
    if (!glass(x, y) || !inMoon(x, y)) continue
    out.set(idxOf(x, y), x + 0.5 > MOON.cx + 1.5 ? 'cream-1' : 'cream-3')
  }
  return out
}

function drawWindow(c, sillY) {
  c.paint(WIN.x, WIN.top, X1 - WIN.x, sillY + 5 - WIN.top, (x, y) => {
    if (y === WIN.top || y === sillY + 4) return 'outline'
    if (y >= sillY) return y === sillY ? 'cream-3' : y === sillY + 1 ? 'cream-2' : 'cream-1' // peitoril
    if (x <= 323) return x === 323 ? 'cream-0' : 'cream-2' // batente esquerdo
    if (y <= 3) return y === 0 ? 'cream-3' : 'cream-2' // verga
    if (x === 324 || y === 4 || y === sillY - 1) return 'outline'
    if (x >= WIN.mullion && x <= WIN.mullion + 4) { // montante
      if (x === WIN.mullion || x === WIN.mullion + 4) return 'outline'
      return x === WIN.mullion + 3 ? 'cream-1' : 'cream-2'
    }
    return glassDay(x, y)
  })
}

function drawRod(c) {
  c.object((l) => {
    l.rect(298, -6, X1 - 298, 2, 'graphite-1')
    l.rect(298, -6, X1 - 298, 1, 'graphite-2')
    l.rect(294, -7, 4, 4, 'gold-1') // ponteira
    l.set(294, -7, 'gold-3')
    l.set(297, -4, 'gold-0')
  })
  for (const x of [311, 315, 318]) c.rect(x, -3, 1, 3, 'graphite-0') // argolas até a cortina
}

// ---------- montagem ----------
/** Recorta a tela com folga para BW×BH e cola a ilustração 320×180 em (left, top). */
function finish(px, inner) {
  const out = crop(px, X1 - X0, Y1 - Y0, { x: PAD, y: PAD, w: BW, h: BH })
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const s = (y * CW + x) * 4
    out.set(inner.subarray(s, s + 4), ((y + BLEED.top) * BW + x + BLEED.left) * 4)
  }
  return out
}

/**
 * Computador: frame BW×BH com a ilustração `inner` (saída de renderCloseup) no meio.
 * `lit` = tela acesa (boot/on): à noite, o halo do monitor continua acima do y 0.
 */
export function renderComputerBleed(inner, { night = false, lit = false } = {}) {
  const { base, c } = canvas()
  drawWalls(c, 158)
  drawWindow(c, 137)
  drawRod(c)
  c.paint(X0, 158, X1 - X0, Y1 - 158, (x, y) => deskPixel(x, y, night))
  if (!night) return finish(base.px, inner)

  // Continuação do halo acima do y 0: o topo do monitor (extrusão oblíqua) começa 1 + MONITOR_DEPTH px à direita.
  const [mx, , mw] = MONITOR_BOX
  const halo = (x, y) => {
    if (!lit || x < mx + MONITOR_DEPTH - 3 || x >= mx + mw + MONITOR_DEPTH + 3) return false
    if (y === -1) return true
    if (y === -2) return mod(x, 2) === 0
    if (y === -3) return mod(x, 4) === 1
    return false
  }
  const lights = nightLights(137)
  const keep = (i) => {
    const [x, y] = xyOf(i)
    return halo(x, y) || inPool(x, y)
  }
  const px = multiply(base.px, TINT.night, keep)
  for (const [i, token] of lights) { const t = flat(1, 1); t.set(0, 0, token); px.set(t.px, i * 4) }
  return finish(px, inner)
}

/** Prateleira: fundo BW×BH com o fundo `inner` (bg/day ou bg/night, 320×180) no meio. */
export function renderShelfBleed(inner, { night = false } = {}) {
  const { base, c } = canvas()
  drawWalls(c, Y1)
  drawWindow(c, 151)
  drawRod(c)
  if (!night) return finish(base.px, inner)
  const px = multiply(base.px, TINT.night)
  for (const [i, token] of nightLights(151)) { const t = flat(1, 1); t.set(0, 0, token); px.set(t.px, i * 4) }
  return finish(px, inner)
}
