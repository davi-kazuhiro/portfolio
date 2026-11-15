// Tapete (`room-shell`, decoração). Kilim retangular, aprovado pelo Davi em 2026-11-14 (variação A da proposta do M6;
// a B, oval felpudo, foi descartada e saiu do gerador: prévias históricas em art-src/previews/rug-b*.png).
// Spec: docs/arte/specs/10-tapete.md. Planta: (2,3), 3×2 tiles (cols 2–4, rows 3–4 = x 16–40, y 24–40), no piso,
// entre a mesa e a cama. Assado no `room-shell` (sob o tint do entardecer/noite, como as sombras de contato).
//
// Retângulo de tecido fino (2 px de borda), campo creme, barra azul (rampa da coberta da cama), filete mostarda
// (cortina/manta) e losangos discretos em creme escuro com miolo azul.
//
// Sombra de contato da cadeira (regra 6) cai sobre a beira de trás: o tecido nessa área desce para o tom mais
// escuro do material. A cama fica na frente (y > 40) e cobre parte do tapete no próprio sprite dela.
// A mancha de sol (`light-window`, dia e entardecer) cruza o tapete: ver `rugLightAt` (usada por lights.mjs).
import { inside, PX, rgba } from '../lib.mjs'
import { P } from '../palette.mjs'
import { inShadow, LIGHT_PATCH, onPlaneZ, RW, RH, roomCanvas } from '../room.mjs'

const T = (t) => P[t]

export const RUG = { box: [17, 39, 25, 39.5, 0, 1] }

// Um tom acima (luz da janela) e o tom mais escuro do material (sombra), por cor do tapete.
const UP = {
  'cream-1': 'cream-2', 'cream-2': 'cream-3',
  'blue-0': 'blue-1', 'blue-1': 'sky-1', 'teal-1': 'blue-0', 'sky-1': 'sky-2',
  'gold-0': 'gold-1', 'gold-1': 'gold-3',
}
const DARK = {
  'cream-1': 'cream-0', 'cream-2': 'cream-0',
  'blue-0': 'teal-1', 'blue-1': 'teal-1', 'sky-1': 'blue-0', 'teal-1': 'teal-1',
  'gold-0': 'wood-3', 'gold-1': 'gold-0',
}

// ---------- kilim ----------
const BORDER = 1.6 // barra azul
const PIN = BORDER + PX * 1 // filete mostarda: começa 1 px dentro da barra (faixa creme entre os dois)
const PIN_W = PX * 1.5

/** Cor do topo do kilim no ponto (x, y) do chão (token). */
function kilimTop(x, y, [x0, x1, y0, y1]) {
  const d = Math.min(x - x0, x1 - x, y - y0, y1 - y)
  // Filete de luz (regra 3): bordas da frente (+x e +y) da barra.
  if (x > x1 - PX * 1.5 || y > y1 - PX * 1.5) return 'sky-1'
  if (d < BORDER) {
    // Franja de "dentes" na barra: pequenos degraus em blue-0 a cada 2 u, típicos de kilim.
    const along = x - x0 < BORDER || x1 - x < BORDER ? y : x
    return d > BORDER - PX * 1.2 && Math.floor(along / 1) % 2 === 0 ? 'blue-0' : 'blue-1'
  }
  if (d < PIN + PIN_W) return d >= PIN ? 'gold-1' : 'cream-2'
  // Campo: 3 × 2 losangos soltos (passo 5,5 × 4,6 u), centrados: anel cream-1 de 1 px e miolo blue-0.
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  const sx = 5.5, sy = 4.6
  const u = (x - cx) / sx, v = (y - cy) / sy
  if (Math.abs(u) < 1.5 && Math.abs(v) < 1) {
    const fu = u - Math.round(u), fv = v - Math.floor(v) - 0.5
    const r = Math.abs(fu) * sx / 1.9 + Math.abs(fv) * sy / 1.5
    if (r < 0.28) return 'blue-0'
    if (inside(r, 0.72, 0.98)) return 'cream-1'
  }
  return 'cream-2'
}

function drawKilim(c) {
  const bx = RUG.box
  c.object([c.box(bx, (f, p, q) => {
    if (f === 'top') return T(kilimTop(p, q, bx))
    if (f === 'y') return T('blue-0') // frente (+y): tom médio da barra
    return T('teal-1') // lado (+x): tom escuro
  })])
}

// ---------- API ----------
const TOKEN_OF = Object.fromEntries(Object.entries(P).map(([k, v]) => [v.toLowerCase(), k]))
const tokenAt = (px, i) => TOKEN_OF['#' + [0, 1, 2].map((k) => px[i * 4 + k].toString(16).padStart(2, '0')).join('')]

let cache = null
/**
 * Camada do tapete no canvas do quarto, já com a sombra de contato da cadeira (e de qualquer SHADOWS) por cima,
 * para assar no `room-shell` logo depois do piso. `top`: máscara dos pixels de topo (para a luz). Calculada uma vez.
 */
export function renderRug() {
  if (cache) return cache
  const c = roomCanvas()
  drawKilim(c)
  const px = c.pixels
  const top = new Uint8Array(RW * RH)
  const [x0, x1, y0, y1, , z1] = RUG.box
  for (let i = 0; i < RW * RH; i++) {
    if (!px[i * 4 + 3]) continue
    const tok = tokenAt(px, i)
    if (tok === 'outline') continue
    const [x, y] = onPlaneZ(i % RW, Math.floor(i / RW), z1)
    const onTop = inside(x, x0, x1) && inside(y, y0, y1)
    if (onTop) top[i] = 1
    // Sombra de contato: avaliada no chão (mesmo critério do piso), um só tom, borda dura.
    const [fx, fy] = onPlaneZ(i % RW, Math.floor(i / RW), 0)
    if (inShadow(fx, fy) || (onTop && inShadow(x, y))) px.set(rgba(T(DARK[tok] ?? tok)), i * 4)
  }
  cache = { px, top, z1 }
  return cache
}

/**
 * Mancha da janela sobre o tapete no pixel i da tela do quarto. `undefined`: o pixel não é do tapete (segue o piso).
 * `null`: é do tapete, sem luz. Senão, a cor (hex): o tecido um tom acima (creme → mais claro, azul → mais claro,
 * mostarda → gold-3), nunca a madeira iluminada. À noite o luar não alcança o tapete (y < 22).
 */
export function rugLightAt(period, i) {
  const rug = renderRug()
  if (!rug.px[i * 4 + 3]) return undefined
  if (!rug.top[i]) return null
  const [x, y] = onPlaneZ(i % RW, Math.floor(i / RW), rug.z1)
  if (!LIGHT_PATCH[period](x, y) || inShadow(x, y)) return null
  const tok = tokenAt(rug.px, i)
  if (!tok || tok === 'outline') return null
  return T(UP[tok] ?? tok)
}
