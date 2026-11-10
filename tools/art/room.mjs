// Geometria compartilhada do quarto do M2 (planta: docs/arte/planta-do-quarto.md; specs: docs/arte/specs.md).
// Todas as peças são desenhadas numa tela do tamanho do quarto inteiro, com a mesma origem; o exportador
// recorta cada sprite e calcula a âncora. Assim a prévia composta e o jogo usam exatamente as mesmas contas.
//
// Unidades do gerador: 1 tile (losango 64×32) = 8 unidades; em z, 1 unidade = 2 px.
import { createCanvas } from './lib.mjs'
import { P } from './palette.mjs'

export const TILE_U = 8
export const ROOM = 56 // 7 tiles
export const WALL = 72 // 144 px
export const FLOOR_T = 3 // espessura do piso (6 px), visível nas bordas abertas
export const WALL_T = 3 // espessura da parede (12 px na tela)

// Tela do quarto: 472×386; a origem (canto do fundo, no chão) cai em (236, 156).
export const RW = 472
export const RH = 386
export const OX = 236
export const OY = 156

export const roomCanvas = (outlineColor = P.outline) => createCanvas({ width: RW, height: RH, ox: OX, oy: OY, outlineColor })

/** Mundo (unidades) → px da tela do quarto. */
export const toPx = (x, y, z = 0) => [OX + 4 * (x - y), OY + 2 * (x + y) - 2 * z]
/** Centro do pixel → ponto do mundo no plano horizontal de altura z. */
export const onPlaneZ = (sx, sy, z) => {
  const a = (sx + 0.5 - OX) / 2, s = (sy + 0.5 - OY) / 2 + z
  return [(a / 2 + s) / 2, (s - a / 2) / 2]
}
/** Centro do pixel → ponto (x, z) no plano vertical y (parede do fundo = plano y = 0). */
export const onPlaneY = (sx, sy, y) => {
  const a = (sx + 0.5 - OX) / 2, b = (sy + 0.5 - OY) / 2
  const x = a / 2 + y
  return [x, x + y - b]
}

/** Âncoras no mundo (unidades). Objeto de chão: centro do footprint no chão; de parede: base da parede. */
export const ANCHOR = {
  'room-shell': [0, 0],
  computer: [16, 16],
  'desk-chair': [20, 20],
  'pc-tower': [36, 4],
  window: [46, 0],
  bookshelf: [22, 0], // base da parede sob o centro da tábua (x 9–34,5)
  bed: [16, 48], // centro do footprint (0,5) 4×2 no chão; o `phone` usa o mesmo ponto (surfaceOf bed)
  frames: [0, 22], // parede esquerda (plano x = 0): base sob o centro do grupo de quadros (= FRAMES_ANCHOR_Y)
}
/** Ponto do Tiled em tiles (col, row) = âncora / 8. */
export const anchorTile = (id) => ANCHOR[id].map((u) => u / TILE_U)

// Peças (caixas [x0, x1, y0, y1, z0, z1]).
export const DESK = {
  topA: [0, 32, 0, 14, 13, 16],
  topB: [0, 14, 14, 30, 13, 16],
  leg: [29, 32, 1, 13, 0, 13],
  panelA: [1, 29, 1, 2, 3, 13],
  panelB: [1, 2, 2, 19, 3, 13],
  drawers: [1, 13, 19, 29, 0, 13],
}
// Monitor fino: tela com 0,9 u de espessura (antes 1,8); a haste fica atrás dela.
export const MONITOR = { base: [15, 24, 3, 7, 16, 16.8], neck: [18.5, 20.5, 3, 3.9, 16.8, 22], screen: [11, 28, 3.9, 4.8, 21, 36] }
export const KEYBOARD = [12.5, 26.5, 8, 12, 16, 17.2]
export const TOWER = [33, 38, 2, 10, 0, 20]
export const CHAIR_C = [19.5, 20] // centro da cadeira (o do teste deslocado −7 em x e +0,75 em y)

/** Sombras de contato (regra 6): footprint estendido 1,5 u para +x e +y, um tom só. */
export const SHADOWS = [
  [0, 33.5, 0, 15.5], // braço A
  [0, 15.5, 15.5, 31.5], // braço B
  [TOWER[0], TOWER[1] + 1.5, TOWER[2], TOWER[3] + 1.5],
  [CHAIR_C[0] - 4.5, CHAIR_C[0] + 5.5, CHAIR_C[1] - 4.25, CHAIR_C[1] + 5.75],
]
export const inShadow = (x, y) => SHADOWS.some(([x0, x1, y0, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1)

/** Janela (parede do fundo, plano y = 0). */
export const WINDOW = {
  frame: [40, 52, 0, 1.2, 24.5, 59],
  glass: [41.5, 50.5, 26.5, 57], // x0, x1, z0, z1 no plano da parede
  sill: [39.5, 52.5, 0, 3, 22.5, 24.5],
  curtains: [[36.5, 39.5], [52.5, 55.5]],
  curtainZ: [23, 60],
  rod: [35.5, 56.5, 0.4, 1.2, 60, 61],
}

/** Mancha de luz da janela no piso, por período. O sol desce a parede e se inclina para o centro do quarto. */
export const LIGHT_PATCH = {
  day: (x, y) => y >= 1.2 && y < 26 && x + 0.35 * y >= 41 && x + 0.35 * y < 53,
  dusk: (x, y) => y >= 1.2 && y < 36 && x + 0.6 * y >= 41 && x + 0.6 * y < 53,
  night: (x, y) => y >= 1.2 && y < 22 && x + 0.3 * y >= 41.5 && x + 0.3 * y < 51.5,
}
