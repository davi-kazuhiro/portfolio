// Modelos com volume dos objetos da prateleira (2026-11-13), usados por closeup-shelf4.mjs.
// Em vez de "frente chapada + extrusão", cada objeto ganha uma normal por pixel (elipsoides, almofada a partir
// da silhueta ou cilindro por linha) e o tom sai da luz, quantizado numa rampa curta da paleta (sem dithering).
// Luz de cima à esquerda e da frente, igual ao topo claro / lado escuro do resto da cena.
import { rgba } from '../lib.mjs'
import { P } from '../palette.mjs'
import { flat } from '../flat.mjs'
import { CW } from './closeup-bookshelf.mjs'
import { extrude } from './closeup-3d.mjs'
import { idx, okXY, place } from './closeup-shelf3.mjs'

const LIGHT = (() => { const v = [-0.55, -0.6, 0.7]; const n = Math.hypot(...v); return v.map((a) => a / n) })()
const norm = (v) => { const n = Math.hypot(...v) || 1; return v.map((a) => a / n) }
/** Tom da rampa (escuro → claro) para a normal `n`; `spec` = brilho especular opcional. */
export function tone(n, ramp, { spec = null, ambient = 0.2, specAt = 0.985 } = {}) {
  const d = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2])
  if (spec && d >= specAt) return spec
  const v = ambient + (1 - ambient) * d
  return ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))]
}

// ---------- pato de borracha ----------
const DUCK_YELLOW = ['gold-0', 'gold-1', 'gold-2', 'gold-3']
const DUCK_BEAK = ['wood-2', 'wood-5', 'wood-6', 'wood-7']
/**
 * Pato virado para a esquerda, em elipsoides: corpo, cabeça, rabo, asa (um pouco saltada do corpo) e bico.
 * Cada pixel pega o elipsoide mais alto (z); onde o vencedor muda com degrau de altura, um vinco escuro separa
 * as peças (pescoço, asa, bico). Brilho especular `cream-3` no alto da cabeça e do corpo.
 */
export function duck(l, w, h) {
  const big = h >= 40
  const E = (cx, cy, rx, ry, rz, ramp, z0 = 0, name) => ({ cx: cx * w, cy: cy * h, rx: rx * w, ry: ry * h, rz: rz * w, ramp, z0: z0 * w, name })
  const prims = [
    E(0.58, 0.7, 0.41, 0.27, 0.34, DUCK_YELLOW, 0, 'body'),
    E(0.87, 0.5, 0.12, 0.17, 0.13, DUCK_YELLOW, 0.06, 'tail'),
    E(0.37, 0.34, 0.26 * (h / w), 0.26, 0.24 * (h / w), DUCK_YELLOW, 0.04, 'head'),
    E(0.64, 0.66, 0.22, 0.13, 0.12, DUCK_YELLOW, 0.24, 'wing'),
    E(0.13, 0.42, 0.13, 0.075, 0.1, DUCK_BEAK, 0.2, 'beak'),
  ]
  const hit = (x, y) => {
    let best = null
    for (const p of prims) {
      const q = ((x - p.cx) / p.rx) ** 2 + ((y - p.cy) / p.ry) ** 2
      if (q >= 1) continue
      const zz = Math.sqrt(1 - q)
      const z = p.z0 + p.rz * zz
      if (!best || z > best.z) best = { p, z, n: norm([(x - p.cx) / p.rx ** 2, (y - p.cy) / p.ry ** 2, (p.rz * zz) / p.rz ** 2]) }
    }
    return best
  }
  const grid = []
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) grid.push(hit(i + 0.5, j + 0.5))
  const at = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? null : grid[j * w + i])
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const g = at(i, j)
    if (!g) continue
    let c = tone(g.n, g.p.ramp, { spec: g.p.ramp === DUCK_YELLOW && big ? 'cream-3' : null })
    // Vinco: vizinho de cima/esquerda/direita/baixo pertence a outra peça e está mais alto (esta fica atrás).
    const crease = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const o = at(i + a, j + b); return o && o.p !== g.p && o.z > g.z + (big ? 0.6 : 0.3) })
    if (crease) c = g.p.ramp[0]
    l.set(i, j, c)
  }
  // Olho com brilho e boca (linha entre as metades do bico).
  const head = prims[2], beak = prims[4]
  const e = Math.max(1, Math.round(h / 12)), ex = Math.round(head.cx - head.rx * 0.32), ey = Math.round(head.cy - head.ry * 0.25)
  l.rect(ex, ey, e, e + (big ? 1 : 0), 'graphite-0')
  if (big) l.set(ex, ey, 'cream-3')
  if (big) for (let x = Math.round(beak.cx - beak.rx * 0.8); x <= Math.round(beak.cx + beak.rx * 0.5); x++) l.set(x, Math.round(beak.cy + 0.5), 'wood-2')
}

// ---------- cavalo de xadrez ----------
const KNIGHT_RAMP = ['teal-0', 'teal-1', 'blue-0', 'blue-1', 'sky-1']
/**
 * Volume do cavalo a partir da silhueta já desenhada em `l` (qualquer cor): cabeça/pescoço em "almofada" (altura
 * cresce com a distância até a borda, raio `R`), base torneada (cilindro por linha, de `baseY` para baixo, com o
 * alto de cada degrau voltado para cima). Os detalhes (olho, crina, boca) são pintados depois por quem chama.
 */
export function knightVolume(l, W, H, { R, baseY, steps }) {
  const inside = (x, y) => l.opaque(x, y)
  const edge = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x, y) && (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1))) edge.push([x, y])
  const dist = new Float32Array(W * H)
  for (let y = 0; y < baseY; y++) for (let x = 0; x < W; x++) {
    if (!inside(x, y)) continue
    let m = Infinity
    for (const [ex, ey] of edge) { const d = (ex - x) ** 2 + (ey - y) ** 2; if (d < m) m = d }
    dist[y * W + x] = Math.sqrt(m) + 0.5
  }
  const hgt = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H || !inside(x, y)) return 0; const d = Math.min(dist[y * W + x], R) / R; return R * Math.sqrt(1 - (1 - d) ** 2) }
  const out = []
  for (let y = 0; y < H; y++) {
    const xs = []
    for (let x = 0; x < W; x++) if (inside(x, y)) xs.push(x)
    if (!xs.length) continue
    for (const x of xs) {
      let n
      if (y < baseY) n = norm([-(hgt(x + 1, y) - hgt(x - 1, y)) / 2, -(hgt(x, y + 1) - hgt(x, y - 1)) / 2, 1])
      else {
        const x0 = xs[0], x1 = xs[xs.length - 1], c = (x0 + x1 + 1) / 2, half = (x1 - x0 + 1) / 2
        const u = Math.max(-0.98, Math.min(0.98, (x + 0.5 - c) / half))
        const topOfStep = steps.includes(y)
        n = norm([u, topOfStep ? -0.9 : 0, Math.sqrt(1 - u * u)])
      }
      out.push([x, y, tone(n, KNIGHT_RAMP, { ambient: 0.15 })])
    }
  }
  for (const [x, y, c] of out) l.set(x, y, c)
}

// ---------- cubo mágico ----------
const CUBE = {
  top: ['cream-3', 'gold-3', 'red-3', 'leaf-2', 'cream-3', 'wood-7', 'red-3', 'sky-1', 'gold-3'],
  front: ['red-2', 'gold-1', 'leaf-1', 'blue-1', 'red-2', 'wood-6', 'leaf-1', 'cream-2', 'red-2'],
  side: ['blue-0', 'leaf-0', 'red-0', 'gold-0', 'blue-0', 'leaf-0', 'red-0', 'cream-1', 'blue-0'],
}
const SHINE = {
  'red-2': 'red-3', 'red-3': 'pink', 'gold-1': 'gold-3', 'gold-3': 'cream-3', 'leaf-1': 'leaf-2', 'leaf-2': 'cream-3', 'blue-1': 'sky-1',
  'wood-6': 'wood-7', 'wood-7': 'gold-3', 'cream-2': 'cream-3', 'cream-3': 'cream-3', 'sky-1': 'sky-2', 'red-0': 'red-1', 'leaf-0': 'leaf-1',
  'blue-0': 'blue-1', 'gold-0': 'gold-1', 'cream-1': 'cream-2',
}
/**
 * Ponto (u, v) de uma face (0–1) com `nu`×`nv` px → o que pintar: `null` fora do cubo (cantos externos
 * arredondados), `gap` no plástico entre os adesivos, `hi` na borda de luz do adesivo, `face` no resto.
 * Os adesivos têm cantos arredondados (raio `r`) e ficam recuados `g` px dentro de cada célula.
 */
function sticker(u, v, nu, nv, big, corners = [true, true, true, true]) {
  const x = u * nu, y = v * nv
  const R = big ? 3 : 1.5
  const cx = x < R ? R : x > nu - R ? nu - R : null, cy = y < R ? R : y > nv - R ? nv - R : null
  if (cx !== null && cy !== null) {
    const k = (x < R ? 0 : 1) + (y < R ? 0 : 2)
    if (corners[k] && (x - cx) ** 2 + (y - cy) ** 2 > R * R) return null
  }
  const cu = Math.min(2, Math.floor(u * 3)), cv = Math.min(2, Math.floor(v * 3))
  const su = nu / 3, sv = nv / 3, pu = x - cu * su, pv = y - cv * sv
  const g = big ? 1.3 : 0.55, r = big ? 3.2 : 1.3
  const res = { cu, cv }
  if (pu < g || pv < g || pu > su - g || pv > sv - g) return { ...res, s: 'gap' }
  const ix = Math.min(pu - g, su - g - pu), iy = Math.min(pv - g, sv - g - pv)
  if (ix < r && iy < r && (r - ix) ** 2 + (r - iy) ** 2 > r * r) return { ...res, s: 'gap' }
  if (big && (pu - g < 1.5 || pv - g < 1.5) && pu < su - g - 2 && pv < sv - g - 2) return { ...res, s: 'hi' }
  return { ...res, s: 'face' }
}
/** Cubo 3×3 de frente (W×W) com topo e lado direito de `D` px; adesivos arredondados e juntas de plástico. */
export function cubeSolid(x, y, W, D) {
  const big = W >= 30
  const out = [], front = []
  const put = (list, px, py, t) => { if (okXY(px, py)) list.push([idx(px, py), rgba(P[t])]) }
  const paint = (st, table, k, gap, shine) => (st.s === 'gap' ? gap : st.s === 'hi' && shine ? SHINE[table[k]] ?? table[k] : table[k])
  for (let k = 1; k <= D; k++) {
    const dv = (k - 0.5) / D // 0 = junto da frente
    for (let i = 0; i < W; i++) { // topo: v = profundidade; a fileira de trás é a linha 0 da tabela
      const st = sticker((i + 0.5) / W, 1 - dv, W, D * 1.0, big, [true, true, false, false])
      if (st) put(out, x + i + k, y - k, paint(st, CUBE.top, st.cu + 3 * st.cv, 'graphite-1', false))
    }
    for (let j = 0; j < W; j++) { // lado direito: u = profundidade, v = altura
      const st = sticker(dv, (j + 0.5) / W, D * 1.0, W, big, [false, true, false, true])
      if (st) put(out, x + W - 1 + k, y + j - k, paint(st, CUBE.side, st.cu + 3 * st.cv, 'graphite-0', false))
    }
  }
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const st = sticker((i + 0.5) / W, (j + 0.5) / W, W, W, big, [true, false, true, true])
    if (st) put(front, x + i, y + j, paint(st, CUBE.front, st.cu + 3 * st.cv, 'graphite-0', true))
  }
  return [...out, ...front]
}

// ---------- raquete ----------
const WOOD = ['wood-2', 'wood-4', 'wood-5', 'wood-6', 'wood-7']
/**
 * Raquete em pé (referência: lâmina quase redonda, um pouco mais alta que larga; fita preta na borda; borracha
 * vermelha com a marca embaixo; "ombro" de madeira onde a borracha termina sobre o pescoço; cabo *flared*, mais
 * largo na ponta, com a plaquinha da marca). Devolve pixels com volume na posição (x, y): a lâmina tem 3 px de
 * espessura (fita `graphite-*`) e o cabo é um cilindro de madeira com 4 px de fundo.
 */
export const PADDLE_BIG = { W: 50, H: 80 }
export function paddleSolid(x, y) {
  const { W, H } = PADDLE_BIG
  const cx = 25, cy = 25.5, rx = 23.5, ry = 25
  const blade = flat(W, H), handle = flat(W, H)
  const neckTop = cy + ry - 9 // onde a borracha acaba sobre o pescoço
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const X = i + 0.5, Y = j + 0.5
    const q = ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2
    if (q >= 1) continue
    if (q > 0.9) { blade.set(i, j, Y < cy ? 'graphite-2' : 'graphite-1'); continue } // fita da borda
    // ombro de madeira: abaixo de uma curva rasa, perto do pescoço, a borracha é recortada
    const shoulder = Y > neckTop + ((X - cx) / 10) ** 2 * 3
    if (shoulder) { blade.set(i, j, Math.abs(X - cx) < 1 ? 'wood-5' : X < cx ? 'wood-7' : 'wood-6'); continue }
    // borracha: levemente abaulada (só para a luz correr), faixa de brilho na diagonal
    const n = norm([((X - cx) / rx) * 0.35, ((Y - cy) / ry) * 0.35, 1])
    let c = tone(n, ['red-0', 'red-1', 'red-2', 'red-2', 'red-3'], { ambient: 0.35 })
    const diag = (X - cx) / rx + (Y - cy) / ry
    if (diag > -0.95 && diag < -0.75) c = 'red-3'
    if (q > 0.84) c = 'red-0' // espuma escura sob a borracha, na borda
    blade.set(i, j, c)
  }
  // Marca na borracha: retângulo creme com letras em `red-1`, logo acima do ombro.
  const ly = Math.round(neckTop - 6)
  blade.rect(cx - 6, ly, 12, 4, 'cream-3')
  for (const dx of [-4, -2, 0, 2, 4]) blade.set(Math.round(cx + dx - 0.5), ly + 1 + (dx % 4 === 0 ? 1 : 0), 'red-1')
  // Cabo flared: 8 px no pescoço, afina para 7 no meio e abre até 12 na ponta (arredondada).
  const hy0 = Math.round(cy + ry - 4), hy1 = H - 1
  for (let j = hy0; j <= hy1; j++) {
    const t = (j - hy0) / (hy1 - hy0)
    const half = 4 - Math.sin(t * Math.PI) * 0.5 + Math.max(0, t - 0.55) * 4.5 - (j >= hy1 - 1 ? (j - (hy1 - 2)) : 0)
    for (let i = 0; i < W; i++) {
      const u = (i + 0.5 - cx) / half
      if (Math.abs(u) >= 1) continue
      let c = tone(norm([u, 0, Math.sqrt(1 - u * u)]), WOOD, { ambient: 0.25 })
      if ((j - hy0) % 9 === 4 && Math.abs(u) < 0.7) c = 'wood-4' // veio da madeira
      handle.set(i, j, c)
    }
  }
  // Plaquinha da marca no cabo.
  const py = hy0 + 11
  handle.rect(cx - 3, py, 6, 7, 'red-1'); handle.rect(cx - 2, py + 1, 4, 1, 'red-2'); handle.set(cx - 1, py + 3, 'cream-3'); handle.set(cx, py + 4, 'cream-3')
  // Espessura: o cabo (madeira) primeiro, a lâmina (fita) por cima.
  const hs = extrude(place(handle, x, y), { depth: () => 4, top: 'wood-6', side: 'wood-2' })
  const bs = extrude(place(blade, x, y), { depth: () => 3, top: 'graphite-2', side: 'graphite-0' })
  const m = new Map(hs)
  for (const [i, p] of bs) m.set(i, p)
  return [...m.entries()]
}

/** Raquete deitada na tábua (vista de cima, elipse 2:1): fita preta embaixo, ombro de madeira, cabo flared. */
export function paddleFlat() {
  const rx = 12.5, ry = 5, hl = 12, W = hl + 2 * Math.ceil(rx) + 2, H = 2 * ry + 3
  const l = flat(W, H)
  const cx = hl + rx + 0.5, cy = ry + 0.5
  const inE = (x, y, dy = 0) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy - dy) / ry) ** 2 < 1
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (inE(x, y)) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry
      let c = u + v < -0.7 ? 'red-3' : u + 2 * v > 1.1 ? 'red-1' : 'red-2'
      if (u < -0.82 && Math.abs(v) < 0.45) c = 'wood-6' // ombro de madeira junto ao cabo
      l.set(x, y, c)
    } else if (inE(x, y, 1)) l.set(x, y, 'graphite-1') // fita da borda (espessura)
  }
  for (let x = 1; x <= hl + 2; x++) { // cabo: abre para a ponta (esquerda)
    const flare = x < 5 ? 1 : 0
    l.set(x, ry - flare, 'wood-7'); l.set(x, ry, 'wood-7'); l.set(x, ry + 1, 'wood-5'); l.set(x, ry + 2, 'wood-4')
    if (flare) l.set(x, ry + 3, 'wood-4')
  }
  l.set(7, ry + 1, 'red-1'); l.set(8, ry + 1, 'red-1') // plaquinha da marca
  const edge = []
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (l.opaque(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !l.opaque(x + a, y + b))) edge.push([x, y])
  for (const [x, y] of edge) l.set(x, y, 'outline')
  return l
}
export { CW }
