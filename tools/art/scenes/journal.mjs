// Caderno (`journal`, M3) no quarto. APROVADA a variação A (2026-11-08); exportada por build.mjs (pnpm art) como
// objects/journal + objects/light-journal. Spec: docs/arte/specs.md §5. Deitado no braço B da mesa, ao lado da
// luminária, desenhado por cima do `computer`.
//
// As duas variações da proposta (a B fica como histórico, só nas prévias de build-m3.mjs journal):
// - A: capa dura vermelha com elástico escuro (paralelo à lombada, perto da borda de abrir) e fita marcador dourada
//   saindo pela base; páginas aparecem entre as capas nas faces visíveis; caneta grafite ao lado.
// - B: caderno espiral azul (rampa fria do cavalo: blue-1 topo, blue-0 frente, teal-1 lado), espiral na borda +x
//   (a que olha para o quarto), capa fina; lápis amarelo com borracha rosa ao lado.
// A lombada fica na borda +x na B (a espiral precisa ser vista) e na borda −x (junto da parede) na A.
import { inside, PX } from '../lib.mjs'
import { P } from '../palette.mjs'
import { onPlaneZ, RH, RW, roomCanvas } from '../room.mjs'

const T = (t) => P[t]

/** Caixas em unidades do gerador. Centro (7, 22.5) ≈ planta (0,9; 2,8) tiles; tampo do braço B em z 16. */
export const JOURNAL = {
  A: { cover: [4, 9.5, 19, 26, 16, 18.5], band: [7.9, 8.5], pen: [10.8, 11.5, 19.6, 25.2, 16, 16.8] },
  B: { cover: [4, 9.5, 19, 26, 16, 17.5], pen: [10.8, 11.5, 19.6, 25.2, 16, 16.8] },
}

/** Ordem das cores por estilo (capa, páginas, detalhes). */
export const JOURNAL_COLORS = {
  A: { top: 'red-2', front: 'red-1', side: 'red-0', hi: 'red-3', band: 'graphite-1', bandHi: 'graphite-2', ribbon: 'gold-1', ribbonDark: 'gold-0' },
  B: { top: 'blue-1', front: 'blue-0', side: 'teal-1', hi: 'sky-1', coil: 'cream-2', coilDark: 'graphite-2' },
}

// Capa dura: topo com aresta de luz; nas faces, 1 px de capa em cima e embaixo e as folhas no meio
// (listras cream-3 / cream-1 na face +x, a borda de abrir). Elástico atravessa o topo e a face +y.
const hardcover = (k) => (f, p, q, bx) => {
  const [x0, x1, y0, y1, z0, z1] = bx
  const [b0, b1] = JOURNAL.A.band
  const onBand = inside(p, b0, b1)
  if (f === 'top') {
    if (onBand) return T(q > y1 - PX * 1.5 ? k.bandHi : k.band)
    if (p > x1 - PX * 1.5 || q > y1 - PX * 1.5) return T(k.hi)
    return T(k.top)
  }
  const capTop = q > z1 - PX, capBottom = q < z0 + PX
  if (f === 'y') {
    if (onBand) return T(k.band)
    if (capTop) return T(k.front)
    if (capBottom) return T(k.side)
    return T(q > z1 - PX * 3 ? 'cream-3' : 'cream-2')
  }
  if (capTop || capBottom) return T(k.side)
  // borda de abrir: folhas em listras finas (a cada ~1 u), a última fileira de baixo um tom abaixo
  return T(Math.floor(p * 1.5) % 2 ? 'cream-2' : 'cream-1')
}

// Espiral: capa fina (1 px em cima), folhas, capa de trás. A espiral fica na face +x.
const spiral = (k) => (f, p, q, bx) => {
  const [, x1, , y1, z0, z1] = bx
  if (f === 'top') return T(p > x1 - PX * 1.5 || q > y1 - PX * 1.5 ? k.hi : k.top)
  const capTop = q > z1 - PX, capBottom = q < z0 + PX
  if (f === 'y') return T(capTop ? k.front : capBottom ? k.side : 'cream-3')
  return T(capTop || capBottom ? k.side : 'cream-2')
}

/** Desenha o caderno (sprite `journal`) no canvas do quarto. style: 'A' | 'B'. */
export function renderJournal(style = 'A') {
  const c = roomCanvas()
  const { box, proj, dots, object } = c
  const J = JOURNAL[style], k = JOURNAL_COLORS[style]
  const round = (v) => v.map(Math.round)

  // Caneta / lápis ao lado (objeto próprio, contorno próprio).
  const [px0, px1, py0, py1, pz0, pz1] = J.pen
  const tipAt = py1 - 1.1 // caneta: ponta dourada; lápis: madeira apontada + grafite
  const pen = style === 'A'
    ? (f, p, q) => (f === 'top' ? T(q > tipAt ? 'gold-1' : 'graphite-2') : T(f === 'y' ? 'graphite-1' : 'graphite-0'))
    : (f, p, q) => {
      const y = f === 'top' ? q : f === 'y' ? py1 - 0.01 : p
      if (y > py1 - 0.35) return T('graphite-1') // grafite
      if (y > tipAt) return T('wood-7') // madeira apontada
      if (y < py0 + 0.9) return T('pink') // borracha
      if (y < py0 + 1.3) return T('cream-0') // ponteira de metal
      return T(f === 'top' ? 'gold-1' : 'gold-0')
    }
  object([box(J.pen, pen)])

  const [x0, x1, y0, y1, z0, z1] = J.cover
  if (style === 'A') {
    // Fita marcador saindo da base (+y) e deitada no tampo: objeto próprio de 4 px de largura (contorno + miolo
    // dourado de 2 px), com a ponta em "V". Fica embaixo do caderno.
    const [rx, ry] = round(proj(5.4, y1, z0))
    const tail = []
    // o = contorno, r = fita, d = fita na sombra; a linha 0 fica sob a base do caderno.
    const MAP = ['.oooo', '.orro', 'orrdo', 'ordo.', 'o.o..']
    MAP.forEach((row, dy) => [...row].forEach((ch, dx) => {
      if (ch !== '.') tail.push([rx + dx - 2, ry + dy, T(ch === 'o' ? 'outline' : ch === 'r' ? k.ribbon : k.ribbonDark)])
    }))
    object([dots(tail)], { outline: false })
  }
  const draws = [box(J.cover, style === 'A' ? hardcover(k) : spiral(k))]
  if (style === 'B') {
    // Espiral na face +x (a que olha para o quarto): argolas de 2 px a cada 1 u ao longo de y, saindo 1 px acima
    // do topo e 1 px abaixo da capa de trás; claro em cima (metal na luz), grafite embaixo.
    const list = []
    for (let y = y0 + 0.5; y < y1 - 0.4; y += 1) {
      const [sx, sy] = round(proj(x1, y, z1))
      for (const dx of [0, 1]) {
        list.push([sx + dx, sy - 1, T('cream-3')], [sx + dx, sy, T(k.coil)], [sx + dx, sy + 1, T(k.coil)], [sx + dx, sy + 2, T(k.coilDark)], [sx + dx, sy + 3, T(k.coilDark)])
      }
    }
    draws.push(dots(list))
  }
  object(draws)
  return c
}

/** Poça da luminária (mesma de lights.mjs: círculo r 10 u em (3, 26) no tampo do braço B). */
const POOL = { x: 3, y: 26, r: 10 }
/**
 * Luz do caderno à noite (camada `light-journal`, acima do tint): os pixels do próprio caderno (cores de dia)
 * que caem na poça da luminária. No jogo, o `light-computer` passa a ser recortado pelo caderno.
 */
export function renderLightJournal(journal) {
  const px = new Uint8Array(RW * RH * 4)
  for (let sy = 0; sy < RH; sy++) for (let sx = 0; sx < RW; sx++) {
    const i = sy * RW + sx
    if (!journal[i * 4 + 3]) continue
    const [x, y] = onPlaneZ(sx, sy, 17)
    if ((x - POOL.x) ** 2 + (y - POOL.y) ** 2 < POOL.r ** 2) px.set(journal.subarray(i * 4, i * 4 + 4), i * 4)
  }
  return px
}
