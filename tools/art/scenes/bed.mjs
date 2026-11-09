// Cama (`bed`, M3, decoração) no quarto. Aprovada em 2026-11-08 com a roupa de cama A (exportada por build.mjs;
// a B fica como histórico em node tools/art/build-m3.mjs bed).
// Spec: docs/arte/specs/6-cama-celular.md. Planta: (0,5), 4×2 tiles, cabeceira na parede esquerda (plano x = 0),
// frente aberta (sem peseira). Colchão a 20 px (z 10), cabeceira a 36 px (z 18). O retrato (`portrait`, futuro)
// fica na parede acima da cabeceira (rows 5,4–6,6, 70–100 px): nada da cama passa de 37 px.
//
// Duas roupas de cama (independentes da variação do celular):
// - A: coberta azul-marinho (rampa do cavalo/livro azul: blue-1 topo, blue-0 frente, teal-1 lado, aresta sky-1),
//   lençol creme dobrado sobre ela e manta mostarda dobrada no pé (conversa com a cortina).
// - B: coberta mostarda (gold-1 / gold-0 / wood-3, aresta gold-3) e manta vermelha no pé (cadeira e caderno).
import { inside, PX, shaded } from '../lib.mjs'
import { P } from '../palette.mjs'
import { onPlaneZ, RH, RW, roomCanvas } from '../room.mjs'
import { floorAt } from './room-shell.mjs'

const T = (t) => P[t]

/** Caixas em unidades (8 u = 1 tile). Âncora do objeto: centro do footprint no chão, (16, 48, 0) = tile (2, 6). */
export const BED = {
  anchor: [16, 48],
  legs: [[28.5, 30, 41.2, 42.7], [28.5, 30, 53.3, 54.8]],
  frame: [1.5, 30.5, 41, 55, 1.5, 5],
  mattress: [1.5, 30.5, 41, 55, 5, 9],
  // Cabeceira encostada no estrado (termina em x 1,5, onde ele começa), sem invadir o colchão.
  head: [0, 1.5, 40.75, 55.25, 0, 17],
  headCap: [0, 1.75, 40.5, 55.5, 17, 18],
  // Travesseiro apoiado na cabeceira.
  pillow: [[1.5, 7, 42.25, 53.75, 9, 11], [2, 6.5, 42.75, 53.25, 11, 12]],
  blanket: [9.5, 31, 40.75, 55.25, 4.5, 10],
  // Lençol dobrado sobre a coberta: faixa deitada por cima dela, um pouco mais larga, sem subir como parede.
  fold: [9.25, 12.5, 40.6, 55.4, 9.75, 10.75],
  // Manta dobrada deitada no pé, dentro das bordas da coberta.
  throw: [23.5, 29.5, 41.25, 54.75, 10, 11.5],
  shadow: [0, 32.5, 40.5, 57], // sombra de contato no piso: footprint + 1,5 u para +x e +y
  topZ: 10,
}

export const BEDDING = {
  A: {
    name: 'A — coberta azul, manta mostarda',
    blanket: { top: 'blue-1', front: 'blue-0', side: 'teal-1', hi: 'sky-1' },
    throw: { top: 'gold-1', front: 'gold-0', side: 'wood-3', hi: 'gold-3', stripe: 'red-1' },
    foldStripe: 'blue-1',
  },
  B: {
    name: 'B — coberta mostarda, manta vermelha',
    blanket: { top: 'gold-1', front: 'gold-0', side: 'wood-3', hi: 'gold-3' },
    throw: { top: 'red-2', front: 'red-1', side: 'red-0', hi: 'red-3', stripe: 'cream-3' },
    foldStripe: 'red-1',
  },
}

const wood = shaded({ top: T('wood-6'), front: T('wood-5'), front2: T('wood-4'), side: T('wood-2'), side2: T('wood-1'), hi: T('wood-7') })

/** Desenha a cama. bedding: 'A' | 'B'. */
export function renderBed(bedding = 'A') {
  const c = roomCanvas()
  const { box, object } = c
  const K = BEDDING[bedding]
  const [, , hy0, hy1] = BED.head

  // Estrutura: cabeceira (com almofadado em 3 painéis, sulcos wood-1) primeiro, porque fica atrás; depois pés,
  // estrado e colchão (lençol), que cobrem a base dela em vez de serem cobertos.
  object([
    box(BED.head, (f, p, q, bx) => {
      if (f === 'top') return T('wood-6')
      if (f === 'y') return q < bx[4] + (bx[5] - bx[4]) * 0.3 ? T('wood-4') : T('wood-5')
      // face +x (a que olha para o quarto): p = y, q = z
      const panel = (hy1 - hy0) / 3
      const inGroove = [1, 2].some((k) => inside(p, hy0 + panel * k - PX, hy0 + panel * k + PX))
      if (inGroove && q > 3) return T('wood-1')
      if (q > bx[5] - PX * 1.5) return T('wood-3') // luz sob a travessa
      return q < 5.5 ? T('wood-1') : T('wood-2')
    }),
    box(BED.headCap, wood),
    ...BED.legs.map(([x0, x1, y0, y1]) => box([x0, x1, y0, y1, 0, 1.5], wood)),
    box(BED.frame, wood),
    box(BED.mattress, shaded({ top: T('cream-3'), front: T('cream-2'), side: T('cream-1') })),
  ])

  // Travesseiro (creme, dois andares para parecer fofo).
  const pil = shaded({ top: T('cream-3'), front: T('cream-2'), side: T('cream-1') })
  object(BED.pillow.map((b) => box(b, pil)))

  // Coberta + lençol dobrado por cima da ponta da cabeceira (mesmo objeto: separam-se por tom).
  const k = K.blanket
  object([
    box(BED.blanket, (f, p, q, bx) => {
      if (f === 'top') return p > bx[1] - PX * 1.5 || q > bx[3] - PX * 1.5 ? T(k.hi) : T(k.top)
      if (f === 'y') return q > bx[5] - PX ? T(k.hi) : T(k.front)
      return T(k.side)
    }),
    box(BED.fold, (f, p, q, bx) => {
      if (f === 'top') return inside(p, bx[1] - 0.9, bx[1] - 0.9 + PX) ? T(K.foldStripe) : T('cream-3')
      if (f === 'y') return inside(p, bx[1] - 0.9, bx[1] - 0.9 + PX) ? T(K.foldStripe) : T('cream-2')
      return T('cream-1')
    }),
  ])

  // Manta dobrada no pé, com uma listra.
  const t = K.throw
  object([box(BED.throw, (f, p, q, bx) => {
    const stripe = (v) => inside(v, bx[0] + 1.2, bx[0] + 1.2 + PX * 2)
    if (f === 'top') return stripe(p) ? T(t.stripe) : p > bx[1] - PX * 1.5 || q > bx[3] - PX * 1.5 ? T(t.hi) : T(t.top)
    if (f === 'y') return stripe(p) ? T(t.stripe) : q > bx[5] - PX ? T(t.hi) : T(t.front)
    return T(t.side)
  })])
  return c
}

/**
 * Sombra de contato da cama no piso (regra 6): footprint + 1,5 u para +x e +y, um tom só (wood-1, juntas wood-0).
 * Camada plana no canvas do quarto, para assar no `room-shell` (fica sob o tint, abaixo dos objetos).
 */
export function renderBedShadow(shell) {
  const px = new Uint8Array(RW * RH * 4)
  const [x0, x1, y0, y1] = BED.shadow
  const outline = [42, 27, 42]
  for (let sy = 0; sy < RH; sy++) for (let sx = 0; sx < RW; sx++) {
    const i = sy * RW + sx
    if (!shell[i * 4 + 3]) continue
    if (shell[i * 4] === outline[0] && shell[i * 4 + 1] === outline[1] && shell[i * 4 + 2] === outline[2]) continue
    const [x, y] = onPlaneZ(sx, sy, 0)
    if (x < x0 || x >= x1 || y < y0 || y >= Math.min(y1, 56) || x >= 56) continue
    const f = floorAt(x, y)
    px.set([...hex(f.seam ? 'wood-0' : 'wood-1'), 255], i * 4)
  }
  return px
}
const hex = (t) => { const n = Number.parseInt(P[t].slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
