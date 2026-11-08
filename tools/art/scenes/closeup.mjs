// Visão de perto do computador (M2), ilustração frontal de 320×180. Spec: docs/arte/specs.md §3.
// O painel React fica dentro do retângulo de conteúdo (a tela do monitor), que nenhum desenho invade.
import { hash } from '../lib.mjs'
import { TINT } from '../palette.mjs'
import { flat } from '../flat.mjs'
import { multiply } from '../sheet.mjs'

export const CW = 320
export const CH = 180
export const CONTENT = [48, 11, 224, 126] // x, y, w, h (= tela do monitor)
export const CROPS = { full: [0, 0, 320, 180], monitor: [36, 0, 248, 180] }
export const MONITOR_BOX = [40, 2, 240, 150]
export const STEAM_AT = [68, 134]
export const NINE = { size: [48, 48], slices: { left: 8, top: 9, right: 8, bottom: 15 } }
export const DESK_STRIP = [32, 24]

export const POOL = { cx: 14, cy: 168, rx: 40, ry: 12 }
export const inPool = (x, y) => y >= 158 && ((x - POOL.cx) / POOL.rx) ** 2 + ((y - POOL.cy) / POOL.ry) ** 2 < 1

/** Grão do tampo visto de cima: traços horizontais de 2–4 px em `wood-5`, periódico em 32 px (a faixa repete). */
const mod = (v, n) => ((v % n) + n) % n
const deskGrain = (x, y) => hash(Math.floor(mod(x, 32) / 4), y) > 0.82 && mod(x, 4) !== 3

function drawWalls(c, { night }) {
  // Parede do fundo: listras de 8 px; o terço direito está na luz da janela.
  c.paint(30, 0, 290, 158, (x, y) => {
    if (y === 157) return 'wall-0'
    const s = Math.floor((x - 30) / 8) % 2
    if (x >= 222) return s ? 'wall-3' : 'wall-4'
    return s ? 'wall-1' : 'wall-2'
  })
  // Parede esquerda (encurtada pela perspectiva): listras de 4 px, quina de 1 px.
  c.paint(0, 0, 30, 158, (x) => (Math.floor(x / 4) % 2 ? 'wall-3' : 'wall-4'))
  c.rect(30, 0, 1, 158, 'wall-0')
  // Sombra do monitor na parede (a luz vem da janela, à direita). À noite não há sol, não há sombra.
  if (!night) {
    c.rect(37, 6, 3, 149, 'wall-0')
    c.rect(37, 152, 240, 3, 'wall-0')
  }
}

function drawCurtain(c) {
  c.object((l) => {
    const folds = ['gold-3', 'gold-1', 'gold-1', 'gold-0', 'gold-1', 'gold-3', 'gold-1', 'gold-0', 'gold-1', 'gold-1']
    l.paint(309, 0, 11, 151, (x, y) => (y === 150 && x % 3 === 0 ? null : folds[x - 310] ?? 'gold-1'))
  })
}

function drawMonitor(c, screen) {
  const [mx, my, mw, mh] = MONITOR_BOX
  c.object((l) => {
    l.rect(mx, my, mw, mh, 'graphite-1')
    l.rect(mx + 1, my + 1, mw - 2, 1, 'graphite-2') // aresta de cima
    l.rect(mx + mw - 2, my + 1, 1, mh - 2, 'graphite-0') // lado direito
    const [sx, sy, sw, sh] = CONTENT
    if (screen === 'on') {
      l.rect(sx, sy, sw, sh, 'teal-0')
      l.rect(sx, sy, sw, 1, 'teal-1')
      l.rect(sx, sy, 1, sh, 'teal-1')
    } else if (screen === 'boot0') l.rect(sx, sy, sw, sh, 'teal-1')
    else if (screen === 'boot1') l.rect(sx, sy, sw, sh, 'teal-0')
    else {
      // Desligada: grafite com reflexo diagonal.
      l.paint(sx, sy, sw, sh, (x, y) => {
        const d = (x - sx) + (y - sy) * 1.4
        return (d > 120 && d < 132) || (d > 138 && d < 142) ? 'teal-1' : 'graphite-0'
      })
    }
    l.rect(266, 143, 2, 1, 'sky-0') // LED
  })
  // Haste e base.
  c.object((l) => {
    l.rect(150, 152, 20, 8, 'graphite-1')
    l.rect(167, 152, 2, 8, 'graphite-0')
    l.rect(132, 160, 56, 4, 'graphite-1')
    l.rect(133, 160, 54, 2, 'graphite-2')
  })
}

/**
 * Cor do tampo/frente da mesa em (x, y), em px da ilustração; vale também fora do 320×180 (sangria, §3).
 * Abaixo de y 179: a frente (e o lado do braço B, ao longo da diagonal) tem 12 px a partir da aresta `wood-7`,
 * depois contorno e o vão escuro debaixo da mesa (`mauve-0`).
 */
export function deskPixel(x, y, night) {
  // Tampo (vista de cima, em faixa) e frente. À esquerda de x 30 o braço B vem para a frente (trapézio).
  const armB = x < 30 - (y - 172)
  if (y >= 172 && !armB) {
    if (y >= CH) {
      const k = y - Math.max(172, 202 - x) // linhas abaixo da aresta
      if (k === 0) return 'wood-7'
      if (k <= 6) return 'wood-5'
      if (k <= 11) return 'wood-4'
      return k === 12 ? 'outline' : 'mauve-0'
    }
    if (x === 30 - (y - 172)) return 'wood-7'
    if (y === 172) return 'wood-7'
    return y === 179 ? 'wood-4' : 'wood-5'
  }
  if (y === 158) return 'wood-2'
  if (y >= 172 && x === 29 - (y - 172)) return 'wood-7' // aresta do braço B
  if (night && inPool(x, y)) {
    const k = ((x - POOL.cx) / POOL.rx) ** 2 + ((y - POOL.cy) / POOL.ry) ** 2
    if (k < 0.45) return deskGrain(x, y) ? 'wood-6' : 'wood-7'
  }
  return deskGrain(x, y) ? 'wood-5' : 'wood-6'
}

function drawDesk(c, { night }) {
  c.paint(0, 158, CW, 22, (x, y) => deskPixel(x, y, night))
}

function drawKeyboardMouse(c) {
  c.object((l) => {
    l.rect(108, 163, 104, 9, 'cream-2')
    l.rect(108, 169, 104, 3, 'cream-1')
    for (const ky of [164, 167]) {
      l.rect(110, ky, 100, 2, 'cream-0')
      for (let kx = 110; kx + 5 <= 210; kx += 6) l.rect(kx, ky, 5, 2, 'cream-3')
    }
    l.rect(140, 167, 40, 2, 'cream-3') // barra de espaço
  })
  c.object((l) => {
    l.paint(222, 164, 10, 7, (x, y) => {
      if ((y === 164 || y === 170) && (x === 222 || x === 231)) return null
      return x < 225 ? 'cream-3' : x > 228 ? 'cream-0' : 'cream-2'
    })
    l.rect(226, 165, 1, 2, 'cream-0') // divisão dos botões
  })
}

function drawMug(c) {
  c.object((l) => {
    // Alça (4 px à esquerda) com furo: o contorno do furo sai do próprio contorno do objeto.
    l.paint(64, 152, 5, 11, (x, y) => (x >= 66 && x <= 67 && y >= 155 && y <= 159 ? null : 'cream-2'))
    l.paint(68, 146, 16, 25, (x, y) => {
      if ((y === 146 || y === 170) && (x === 68 || x === 83)) return null
      if (y <= 148) {
        if (y === 148 && x > 69 && x < 82) return x < 73 ? 'wood-1' : 'wood-0' // café
        return 'cream-3' // borda
      }
      return x < 72 ? 'cream-3' : x > 78 ? 'cream-0' : 'cream-2'
    })
  })
}

function drawController(c) {
  c.object((l) => {
    l.paint(30, 161, 28, 9, (x, y) => {
      const corner = (y === 161 || y === 169) && (x <= 31 || x >= 56)
      if (corner) return null
      if (y >= 167 && x >= 38 && x <= 49) return null // vão entre os pegadores
      return y <= 164 ? 'graphite-2' : 'graphite-1'
    })
    // Direcional em cruz e 4 botões.
    l.rect(35, 163, 3, 1, 'graphite-0'); l.rect(36, 162, 1, 3, 'graphite-0')
    l.set(51, 162, 'pink'); l.set(49, 164, 'sky-0'); l.set(53, 164, 'leaf-2'); l.set(51, 166, 'gold-1')
  })
}

function drawLamp(c, on) {
  const layer = flat(CW, CH)
  layer.object((l) => {
    // Cúpula: trapézio de 12 px no alto a 26 px embaixo; três faixas (claro à esquerda).
    for (let y = 96; y <= 112; y++) {
      const half = 6 + Math.round(((y - 96) / 16) * 7)
      const x0 = 14 - half, x1 = 14 + half
      for (let x = x0; x <= x1; x++) {
        const t = (x - x0) / (x1 - x0)
        let col = t < 0.27 ? 'teal-3' : t > 0.73 ? 'teal-1' : 'teal-2'
        if (y === 112) col = on ? 'gold-1' : 'teal-1'
        l.set(x, y, col)
      }
    }
    l.rect(10, 113, 9, 2, on ? 'gold-3' : 'cream-2') // lâmpada
    // Haste com articulação e base sobre o tampo.
    l.rect(13, 115, 3, 45, 'teal-2'); l.rect(13, 115, 1, 45, 'teal-3'); l.rect(15, 115, 1, 45, 'teal-1')
    l.rect(11, 134, 7, 4, 'teal-2'); l.rect(11, 134, 2, 4, 'teal-3')
    l.paint(5, 159, 20, 7, (x, y) => {
      if ((y === 159 || y === 165) && (x <= 6 || x >= 23)) return null
      return y === 159 || y === 160 ? 'teal-3' : x > 19 ? 'teal-1' : 'teal-2'
    })
  })
  for (let i = 0; i < CW * CH; i++) if (layer.px[i * 4 + 3]) c.px.set(layer.px.subarray(i * 4, i * 4 + 4), i * 4)
  return layer
}

/**
 * screen: 'off' | 'boot0' | 'boot1' | 'on'. night: pré-renderiza com tint-night, mantendo nas cores de dia
 * as fontes de luz (tela, LED, halo de 3 px do monitor, luminária e sua poça).
 */
export function renderCloseup({ screen = 'on', night = false } = {}) {
  const c = flat(CW, CH)
  drawWalls(c, { night })
  drawCurtain(c)
  drawDesk(c, { night })
  drawMonitor(c, screen)
  drawController(c)
  drawKeyboardMouse(c)
  drawMug(c)
  const lamp = drawLamp(c, night)
  if (!night) return c.px

  const lit = screen !== 'off'
  const [mx, my, mw, mh] = MONITOR_BOX
  const [sx, sy, sw, sh] = CONTENT
  const inBox = (x, y, [bx, by, bw, bh]) => x >= bx && x < bx + bw && y >= by && y < by + bh
  const keep = (i) => {
    const x = i % CW, y = Math.floor(i / CW)
    if (lamp.px[i * 4 + 3] || inPool(x, y)) return true
    if (x >= 266 && x < 268 && y === 143) return true // LED
    if (!lit) return false
    if (inBox(x, y, [sx, sy, sw, sh])) return true
    return inBox(x, y, [mx - 3, my - 3, mw + 6, mh + 3]) && !inBox(x, y, MONITOR_BOX) && y < 157 && x < 309
  }
  const out = multiply(c.px, TINT.night, keep)
  // Luar na dobra esquerda da cortina (cor da paleta, por cima do tint).
  const moon = flat(CW, CH)
  moon.rect(310, 0, 2, 150, 'teal-3')
  for (let i = 0; i < CW * CH; i++) if (moon.px[i * 4 + 3]) out.set(moon.px.subarray(i * 4, i * 4 + 4), i * 4)
  return out
}

/** Vapor da caneca: 12×12, 3 frames. Só nas linhas ≥ 3 (sobre o queixo, fora do retângulo de conteúdo). */
export function renderSteam(frame) {
  const c = flat(12, 12)
  const wisps = [
    [[3, 11], [3, 10], [4, 9], [4, 8], [3, 7], [3, 6], [8, 11], [8, 10], [7, 9], [7, 8], [8, 7]],
    [[4, 11], [3, 10], [3, 9], [4, 8], [4, 7], [5, 5], [7, 11], [8, 10], [8, 9], [7, 8], [7, 6]],
    [[3, 11], [4, 10], [4, 9], [3, 8], [3, 7], [4, 4], [8, 11], [7, 10], [7, 9], [8, 8], [8, 7], [9, 5]],
  ][frame]
  for (const [x, y] of wisps) if (y >= 3) c.set(x, y, 'cream-3')
  return c.px
}

/** Moldura 9-slice (modo C): 48×48, fatias esquerda 8, topo 9, direita 8, base 15; centro `teal-0`. */
export function renderFrame9() {
  const [w, h] = NINE.size
  const c = flat(w, h)
  c.rect(0, 0, w, h, 'graphite-1')
  c.rect(1, 1, w - 2, 1, 'graphite-2')
  c.rect(w - 2, 1, 1, h - 2, 'graphite-0')
  c.border(0, 0, w, h, 'outline')
  const { left, top, right, bottom } = NINE.slices
  c.rect(left, top, w - left - right, h - top - bottom, 'teal-0')
  c.rect(w - 6, h - 8, 2, 1, 'sky-0') // LED no canto do queixo (não estica)
  return c.px
}

/** Faixa de mesa para telas altas (modo C): 32×24, repete na horizontal. */
export function renderDeskStrip() {
  const [w, h] = DESK_STRIP
  const c = flat(w, h)
  c.paint(0, 0, w, h, (x, y) => {
    if (y === 0) return 'wood-2'
    if (y < 14) return deskGrain(x, y + 158) ? 'wood-5' : 'wood-6'
    if (y === 14) return 'wood-7'
    return y === h - 1 ? 'wood-4' : 'wood-5'
  })
  return c.px
}
