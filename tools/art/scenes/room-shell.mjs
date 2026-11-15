// Casca do quarto (M2): piso 7×7 em tábuas, paredes de 144 px com papel listrado, rodapé, topo,
// oclusão ambiente, sombras de contato do grupo do computador e o tapete (kilim, M6, specs §10).
// A janela e a mancha de sol são sprites próprios (window, light-window), porque mudam à noite.
import { hash, PX } from '../lib.mjs'
import { P } from '../palette.mjs'
import { FLOOR_T, inShadow, roomCanvas, ROOM, WALL, WALL_T } from '../room.mjs'
import { renderRug } from './rug.mjs'

const AO_FLOOR = 1.2 // ≈3 px de piso escurecido junto às paredes
const BASE = 3 // rodapé: 6 px
const AO_WALL = 3 + 4.5 // faixa de 9 px de oclusão acima do rodapé
const AO_CORNER = 1.2

/** Tábua do piso em (x, y): devolve a cor do piso sem luz. Exportada para a light-window seguir as juntas. */
export function floorAt(x, y) {
  const plank = Math.floor(y / 4)
  const off = hash(plank, 3) * 21
  const seg = Math.floor((x + off) / 21)
  const seam = y % 4 < PX * 1.2 || (x + off) % 21 < PX * 2
  const shade = inShadow(x, y)
  const a = plank % 2 === 1
  const grain = hash(Math.floor(x * 2) + seg * 7, plank) > 0.86 && y % 4 > 1 && y % 4 < 3
  return { seam, shade, ao: x < AO_FLOOR || y < AO_FLOOR, a, grain }
}

function floorColor(x, y) {
  const f = floorAt(x, y)
  if (f.seam) return f.shade ? P['wood-0'] : P['wood-1']
  if (f.shade) return P['wood-1']
  if (f.ao) return P['wood-2']
  // Veio um tom abaixo da tábua: A (wood-4) → wood-3; B (wood-3) → wood-2.
  if (f.a) return f.grain ? P['wood-3'] : P['wood-4']
  return f.grain ? P['wood-2'] : P['wood-3']
}

const wallFace = (along, z, [even, odd]) => {
  if (z < BASE) return z > BASE - PX * 1.5 ? P['mauve-2'] : P['mauve-1']
  if (z < AO_WALL || along < AO_CORNER) return P['wall-0']
  return Math.floor(along / 4) % 2 ? even : odd
}

export function renderRoomShell() {
  const c = roomCanvas()
  const { box, object } = c
  const cap = (f, along, end) => (along > end - PX * 1.5 ? P['mauve-1'] : P['mauve-0'])

  // Paredes primeiro: o piso, desenhado depois, cobre a parte delas abaixo do chão.
  object([
    // Parede esquerda (plano x = 0): face visível = +x.
    box([-WALL_T, 0, 0, ROOM, -FLOOR_T, WALL], (f, p, q) => {
      if (f === 'top') return cap(f, q, ROOM)
      if (f === 'y') return P['mauve-1'] // ponta da parede na frente aberta
      return wallFace(p, q, [P['wall-4'], P['wall-3']])
    }),
    // Parede do fundo, à direita (plano y = 0): face visível = +y. O topo cobre o canto.
    box([-WALL_T, ROOM, -WALL_T, 0, -FLOOR_T, WALL], (f, p, q) => {
      if (f === 'top') return cap(f, p, ROOM)
      if (f === 'x') return P['mauve-1']
      if (p < 0) return null // dentro da parede esquerda
      return wallFace(p, q, [P['wall-2'], P['wall-1']])
    }),
  ])

  object([box([0, ROOM, 0, ROOM, -FLOOR_T, 0], (f, x, y) => {
    if (f === 'y') return P['mauve-1']
    if (f === 'x') return P['mauve-0']
    return floorColor(x, y)
  })])

  // Tapete por cima do piso (já contornado e com a sombra da cadeira); as sombras de parede e da cama vêm depois.
  const rug = renderRug().px
  object([(layer) => layer.set(rug)], { outline: false })

  return c
}
