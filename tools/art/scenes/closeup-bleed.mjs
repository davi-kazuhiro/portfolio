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
import { CH, CW, deskPixel, leftDeskObjects, MONITOR_BOX, MONITOR_DEPTH, onDeskTop, WALL_Y, WIDE_LEFT } from './closeup.mjs'

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
    if (y === WALL_Y - 1 && yEnd === WALL_Y) return 'wall-0' // linha de oclusão sobre o tampo (computador)
    const s = mod(Math.floor((x - 30) / 8), 2)
    if (x >= 222) return s ? 'wall-3' : 'wall-4'
    return s ? 'wall-1' : 'wall-2'
  })
  c.rect(30, Y0, 1, yEnd - Y0, 'wall-0')
}

// ---------- janela e varão (à direita da cortina, que termina com contorno em x 319) ----------
const WIN = { x: 320, mullion: 361, top: -1 }
// Peitoril da janela na visão do computador: acima da linha do tampo (WALL_Y), com a cortina descendo um pouco mais.
const COMPUTER_SILL = WALL_Y - 20
const CLOUDS = [[350, 26, 15, 5], [340, 31, 9, 4], [388, 64, 13, 4], [378, 68, 7, 3], [336, 104, 10, 3]]
const STARS = [[331, 14], [347, 62], [372, 9], [395, 33], [338, 84], [389, 95], [356, 118], [328, 128], [397, 140], [369, 150],
  [352, 12], [378, 52], [333, 46], [384, 122], [342, 104], [392, 72], [371, 30], [355, 138]]
/** Estrelas maiores, em cruz de 5 px (centro claro, braços `sky-1`). */
const BIG_STARS = [[353, 90], [386, 40], [335, 150]]
// Lua cheia no painel esquerdo, mais baixa que o topo da janela (o topo some em telas baixas); crateras `cream-1`.
const MOON = { cx: 343, cy: 34, r: 8 }
const CRATERS = [[340, 31, 1.6], [346, 37, 1.3], [341, 38, 0.9]]
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

/**
 * Vidro à noite (pedido de 2026-11-12): em vez do céu de dia tingido (com as nuvens), céu noturno próprio —
 * `teal-0` no alto, degradê pontilhado até `teal-1` perto do peitoril —, estrelas, estrelas em cruz e lua cheia.
 * Tudo isso fica fora do tint (são as cores finais da noite).
 */
function nightLights(sillY) {
  const glass = (x, y) => x >= 325 && !(x >= WIN.mullion && x <= WIN.mullion + 4) && y >= 5 && y <= sillY - 2
  const out = new Map() // idx → token
  const y0 = 5, y1 = sillY - 2, span = Math.max(1, y1 - y0)
  for (let y = y0; y <= y1; y++) for (let x = 325; x < X1; x++) {
    if (!glass(x, y)) continue
    const t = (y - y0) / span // 0 no alto, 1 no peitoril
    const dither = (x + y) % 2 === 0
    out.set(idxOf(x, y), t < 0.45 ? 'teal-0' : t < 0.75 ? (dither ? 'teal-1' : 'teal-0') : 'teal-1')
  }
  for (const [x, y] of STARS) if (glass(x, y)) out.set(idxOf(x, y), 'cream-3')
  for (const [x, y] of BIG_STARS) {
    if (!glass(x, y)) continue
    out.set(idxOf(x, y), 'cream-3')
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (glass(x + dx, y + dy)) out.set(idxOf(x + dx, y + dy), 'sky-1')
  }
  for (let y = MOON.cy - MOON.r; y <= MOON.cy + MOON.r; y++) for (let x = MOON.cx - MOON.r; x <= MOON.cx + MOON.r; x++) {
    if (!glass(x, y) || !inMoon(x, y)) continue
    const crater = CRATERS.some(([cx, cy, r]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 < r * r)
    const shade = (x + 0.5 - MOON.cx) + (y + 0.5 - MOON.cy) > MOON.r * 0.9
    out.set(idxOf(x, y), crater || shade ? 'cream-1' : 'cream-3')
  }
  // halo de 1 px em volta da lua
  for (let y = MOON.cy - MOON.r - 1; y <= MOON.cy + MOON.r + 1; y++) for (let x = MOON.cx - MOON.r - 1; x <= MOON.cx + MOON.r + 1; x++) {
    const d = Math.hypot(x + 0.5 - MOON.cx, y + 0.5 - MOON.cy)
    if (glass(x, y) && d >= MOON.r && d < MOON.r + 1.2) out.set(idxOf(x, y), 'teal-2')
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
  drawWalls(c, WALL_Y)
  drawWindow(c, COMPUTER_SILL)
  drawRod(c)
  c.paint(X0, WALL_Y, X1 - X0, Y1 - WALL_Y, (x, y) => deskPixel(x, y))
  drawLeftDeskObjects(c)
  if (!night) return finish(base.px, inner)

  // Continuação do halo acima do y 0: o topo do monitor chega a y = MONITOR_BOX.y − MONITOR_DEPTH, então só a linha
  // y −1 ainda está a 3 px dele (o halo dentro da ilustração é sólido até 3 px).
  const [mx, my, mw] = MONITOR_BOX
  const dx = Math.round(MONITOR_DEPTH / 2) // o topo anda meio px para a direita por unidade de profundidade
  const halo = (x, y) => lit && y === -1 && my - MONITOR_DEPTH + 1 - y <= 3 && x >= mx + dx - 3 && x < mx + mw + dx + 3
  const lights = nightLights(COMPUTER_SILL)
  const keep = (i) => {
    const [x, y] = xyOf(i)
    return halo(x, y)
  }
  const px = multiply(base.px, TINT.night, keep)
  for (const [i, token] of lights) { const t = flat(1, 1); t.set(0, 0, token); px.set(t.px, i * 4) }
  return finish(px, inner)
}

/**
 * Caneca e controle no canto da mesa à esquerda: a parte fora da ilustração (x < 0), com a sombra no tampo (−3, +2)
 * como em renderCloseup. Dentro da ilustração vale a de renderCloseup (finish cola por cima, idêntica).
 */
function drawLeftDeskObjects(c) {
  const objs = leftDeskObjects().map((o) => o.wide)
  const solid = (x, y) => objs.some((o) => o.opaque(x, y))
  for (let y = 0; y < CH; y++) for (let x = -WIDE_LEFT; x < 0; x++) {
    if (solid(x - -3, y - 2) && !solid(x, y) && onDeskTop(x, y)) c.set(x, y, 'wood-4')
  }
  for (const o of objs) for (let y = 0; y < CH; y++) for (let x = -WIDE_LEFT; x < 0; x++) {
    const p = o.get(x, y)
    if (p && p[3]) c.set(x, y, `#${[...p.subarray(0, 3)].map((v) => v.toString(16).padStart(2, '0')).join('')}`)
  }
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

// ---------- entardecer (2026-11-13) ----------
// A visão de perto no entardecer = o frame de dia × tint-dusk (o mesmo do quarto), sem luzes acesas (como no
// quarto, onde luminárias e halos só acendem à noite). O vidro da janela ganha o céu de pôr do sol da janela do
// quarto (window.mjs): `pink` no alto, `red-3` no meio, `gold-1` perto do peitoril, com as faixas pontilhadas, o
// sol `gold-3` baixo (miolo `cream-3`) e nuvens finas `pink`/`red-1`. Fora do tint.
/**
 * Janela de uma cena: `glass(x, y)` diz o que é vidro (px da ilustração); o degradê vai de `top` a `bottom`; o sol
 * fica em `sun` (centro), baixo, perto do peitoril.
 */
const sceneWindow = (sillY) => ({
  glass: (x, y) => x >= 325 && !(x >= WIN.mullion && x <= WIN.mullion + 4) && y >= 5 && y <= sillY - 2,
  top: 5, bottom: sillY - 2, sun: [384, sillY - 8],
})
/** Janelas das visões de perto com o vidro à direita da cortina (computador e prateleira). */
export const DUSK_WINDOW = { computer: sceneWindow(COMPUTER_SILL), shelf: sceneWindow(151) }
const DUSK_CLOUDS = [[340, 30, 12, 1.6], [384, 58, 10, 1.4], [334, 76, 8, 1.2]]
const SUN_R = 9
/** Token do céu de entardecer em (x, y) da ilustração (só vale dentro do vidro). */
function duskSkyAt(x, y, { top, bottom, sun: [sx, sy], clouds = DUSK_CLOUDS }) {
  const t = (y - top) / Math.max(1, bottom - top) // 0 no alto, 1 no peitoril
  const ds = Math.hypot(x + 0.5 - sx, y + 0.5 - sy)
  if (ds < SUN_R * 0.55) return 'cream-3'
  if (ds < SUN_R) return 'gold-3'
  if (ds < SUN_R + 1.2) return 'wood-7' // halo
  for (const [cx, cy, rx, ry] of clouds) {
    const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry
    if (u * u + v * v < 1) return v < 0 ? 'pink' : 'red-1'
  }
  const dither = (x + y) % 2 === 0
  if (t < 0.3) return 'pink'
  if (t < 0.38) return dither ? 'red-3' : 'pink'
  if (t < 0.62) return 'red-3'
  if (t < 0.7) return dither ? 'gold-1' : 'red-3'
  return 'gold-1'
}
const tokenRgba = (token) => { const t = flat(1, 1); t.set(0, 0, token); return t.px }
/**
 * Frame de entardecer a partir do de dia. `w`×`h` = tamanho do buffer; `ox`, `oy` = posição do (0, 0) da
 * ilustração no buffer (BLEED.left/top na sangria, 0 no 320×180). `keep(x, y)` (px da ilustração) = fica nas
 * cores de dia (tela acesa, LED). `window` = janela da cena (DUSK_WINDOW.* ou { glass, top, bottom, sun }).
 */
export function toDusk(px, { w, h, ox = 0, oy = 0, keep = null, window = null }) {
  const out = multiply(px, TINT.dusk, keep ? (i) => keep((i % w) - ox, Math.floor(i / w) - oy) : undefined)
  if (!window) return out
  for (let fy = 0; fy < h; fy++) for (let fx = 0; fx < w; fx++) {
    const x = fx - ox, y = fy - oy
    if (window.glass(x, y) && px[(fy * w + fx) * 4 + 3]) out.set(tokenRgba(duskSkyAt(x, y, window)), (fy * w + fx) * 4)
  }
  return out
}
