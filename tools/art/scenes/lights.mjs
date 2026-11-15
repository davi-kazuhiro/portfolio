// Camadas de luz (ficam acima do tint de entardecer/noite no jogo). Cada uma já vem recortada pelos
// objetos que ficam na frente dela (`occluders`), para poder ser desenhada por cima de tudo sem cobrir nada.
import { rgba } from '../lib.mjs'
import { P } from '../palette.mjs'
import { LIGHT_PATCH, onPlaneY, onPlaneZ, RH, RW } from '../room.mjs'
import { floorAt } from './room-shell.mjs'
import { SCREEN_RECT } from './computer.mjs'
import { rugLightAt } from './rug.mjs'

const opaque = (px, i) => px[i * 4 + 3] > 0
const set = (px, i, hex) => px.set(rgba(hex), i * 4)
const sameColor = (px, i, hex) => { const [r, g, b] = rgba(hex); return px[i * 4] === r && px[i * 4 + 1] === g && px[i * 4 + 2] === b }

const PATCH_COLORS = {
  day: (grain) => (grain ? P['wood-4'] : P['wood-lit']),
  dusk: (grain) => (grain ? P['wood-5'] : P['wood-6']),
  night: () => P['teal-2'],
}

/** Mancha de sol/luar no piso (e no tapete) e, de dia, o brilho `wall-5` em volta da janela. Mesmo canvas do `room-shell`. */
export function renderLightWindow(period, occluders) {
  const px = new Uint8Array(RW * RH * 4)
  for (let sy = 0; sy < RH; sy++) for (let sx = 0; sx < RW; sx++) {
    const i = sy * RW + sx
    if (occluders.some((o) => opaque(o, i))) continue
    const [x, y] = onPlaneZ(sx, sy, 0)
    if (x >= 0 && x < 56 && y >= 0 && y < 56) {
      // Tapete (specs §10): a mancha usa o tecido um tom acima, não a madeira.
      const onRug = rugLightAt(period, i)
      if (onRug !== undefined) { if (onRug) set(px, i, onRug); continue }
      if (!LIGHT_PATCH[period](x, y)) continue
      const f = floorAt(x, y)
      if (f.seam || f.shade || f.ao) continue
      set(px, i, PATCH_COLORS[period](f.grain))
      continue
    }
    if (period !== 'day') continue
    const [wx, wz] = onPlaneY(sx, sy, 0)
    const underSill = wx >= 39 && wx < 53 && wz >= 21 && wz < 22.5
    const besideFrame = ((wx >= 39.5 && wx < 40) || (wx >= 52 && wx < 52.5)) && wz >= 24.5 && wz < 59
    if (underSill || besideFrame) set(px, i, P['wall-5'])
  }
  return px
}

const POOL = { x: 3, y: 26, r: 10 }
/**
 * Luz do grupo do computador à noite: tela do monitor, lâmpada acesa, poça da luminária no braço B e brilho
 * da tela sobre o tampo e o teclado. Os pixels são os do próprio `computer` (cores de dia) naquelas áreas.
 */
export function renderLightComputer(computerOn, lampOn, occluders) {
  const px = new Uint8Array(RW * RH * 4)
  const scr = SCREEN_RECT()
  for (let sy = 0; sy < RH; sy++) for (let sx = 0; sx < RW; sx++) {
    const i = sy * RW + sx
    if (!opaque(computerOn, i) || occluders.some((o) => opaque(o, i))) continue
    const [x, y] = onPlaneZ(sx, sy, 16)
    // A poça só pega o tampo do braço B (e o que está sobre ele); as faces verticais ficam no escuro.
    const pool = (x - POOL.x) ** 2 + (y - POOL.y) ** 2 < POOL.r ** 2 && x < 14 && y < 30
    const glow = ((x - 19.5) / 10) ** 2 + ((y - 7.5) / 6) ** 2 < 1 && y >= 4.8 // brilho da tela no tampo e no teclado
    const [fx, fz] = onPlaneY(sx, sy, 4.8)
    const screen = fx >= scr.x0 && fx < scr.x1 && fz >= scr.z0 && fz < scr.z1
    const bulb = opaque(lampOn, i) && (sameColor(lampOn, i, P['gold-3']) || sameColor(lampOn, i, P['gold-1']))
    if (pool || glow || screen || bulb) px.set(computerOn.subarray(i * 4, i * 4 + 4), i * 4)
  }
  return px
}
