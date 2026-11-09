// Visão de perto do computador (M2), ilustração frontal de 320×180. Spec: docs/arte/specs.md §3.
// Vista de cima e de frente (3/4 alto): o tampo da mesa é fundo (de WALL_Y até a aresta da frente) e os objetos mostram
// o topo inteiro. Volume como na prateleira: frentes viradas para o visitante e a profundidade subindo 1 px por unidade,
// com metade disso para a direita (SHEAR) — topo claro, frente média, lado escuro.
// Sombras projetadas: na parede (−4, +4) e no tampo (−3, +2), luz da janela à direita.
// O painel React fica dentro do retângulo de conteúdo (a tela do monitor), que nenhum desenho invade.
import { hash } from '../lib.mjs'
import { TINT } from '../palette.mjs'
import { flat } from '../flat.mjs'
import { multiply } from '../sheet.mjs'

export const CW = 320
export const CH = 180
export const WALL_Y = 112 // linha do fundo do tampo (acima: parede)
export const CONTENT = [58, 13, 204, 92] // x, y, w, h (= tela do monitor)
export const CROPS = { full: [0, 0, 320, 180], monitor: [44, 0, 232, 180] }
export const MONITOR_BOX = [52, 8, 216, 104] // frente do monitor (largo e de moldura fina); topo e lateral ficam fora
export const MONITOR_DEPTH = 2 // monitor fino
const LED = [MONITOR_BOX[0] + MONITOR_BOX[2] - 12, MONITOR_BOX[1] + MONITOR_BOX[3] - 4]
export const STEAM_AT = [34, 89] // vapor: 12×12 sobre a boca da caneca
export const NINE = { size: [48, 48], slices: { left: 8, top: 9, right: 8, bottom: 15 } }
export const DESK_STRIP = [32, 24]
const SHEAR = 0.5
const off = (k, shear = SHEAR) => Math.round(k * shear)

/** Grão do tampo visto de cima: traços horizontais de 2–4 px em `wood-5`, periódico em 32 px (a faixa repete). */
const mod = (v, n) => ((v % n) + n) % n
const deskGrain = (x, y) => hash(Math.floor(mod(x, 32) / 4), y) > 0.82 && mod(x, 4) !== 3

function drawWalls(c) {
  // Parede do fundo: listras de 8 px; o terço direito está na luz da janela.
  c.paint(30, 0, 290, WALL_Y, (x, y) => {
    if (y === WALL_Y - 1) return 'wall-0'
    const s = Math.floor((x - 30) / 8) % 2
    if (x >= 222) return s ? 'wall-3' : 'wall-4'
    return s ? 'wall-1' : 'wall-2'
  })
  // Parede esquerda (encurtada pela perspectiva): listras de 4 px, quina de 1 px.
  c.paint(0, 0, 30, WALL_Y, (x) => (Math.floor(x / 4) % 2 ? 'wall-3' : 'wall-4'))
  c.rect(30, 0, 1, WALL_Y, 'wall-0')
}

function drawCurtain(c) {
  c.object((l) => {
    const folds = ['gold-3', 'gold-1', 'gold-1', 'gold-0', 'gold-1', 'gold-3', 'gold-1', 'gold-0', 'gold-1', 'gold-1']
    const h = WALL_Y - 7
    l.paint(309, 0, 11, h, (x, y) => (y === h - 1 && x % 3 === 0 ? null : folds[x - 310] ?? 'gold-1'))
  })
}

/**
 * Bloco: frente w×h em (x, y) e profundidade d (topo e lateral direita; cada unidade sobe 1 px e anda SHEAR px).
 * front(x, y), top(i, k), side(k, j) → token ou null; i = coluna ao longo da largura, j = linha da frente, k = 1..d.
 */
function block(l, x, y, w, h, d, { front, top, side }) {
  for (let k = d; k >= 1; k--) {
    for (let i = 0; i < w; i++) { const t = top(i, k); if (t) l.set(x + i + off(k), y - k, t) }
    for (let j = 0; j < h; j++) { const t = side(k, j); if (t) l.set(x + w - 1 + off(k), y + j - k, t) }
  }
  l.paint(x, y, w, h, front)
}

/**
 * Objeto deitado de forma qualquer: tampo shape(i, k) → token|null (i ao longo da largura, k = 1..d para o fundo)
 * a `h` px do chão, com a espessura descendo nas bordas da frente (frente) e da direita (lado).
 * (x, y) = canto da frente-esquerda no chão. edge(i, k, j, 'front'|'side') → token da espessura (j = 0 em cima).
 * shear = 0 para formas redondas (controle, mouse, headset), que inclinadas ficam tortas: o tampo sai visto de cima.
 */
function slab(l, x, y, w, d, h, shape, edge, shear = SHEAR) {
  const has = (i, k) => k >= 1 && k <= d && i >= 0 && i < w && shape(i, k) !== null
  for (let k = d; k >= 1; k--) {
    for (let i = 0; i < w; i++) {
      if (!has(i, k)) continue
      const sx = x + i + off(k, shear), sy = y - h - k
      const front = !has(i, k - 1), side = !has(i + 1, k)
      if (front || side) for (let j = 1; j <= h; j++) l.set(sx, sy + j, edge(i, k, j - 1, front ? 'front' : 'side'))
    }
    for (let i = 0; i < w; i++) if (has(i, k)) l.set(x + i + off(k, shear), y - h - k, shape(i, k))
  }
}
const inEllipse = (i, k, ci, ck, ri, rk) => ((i - ci) / ri) ** 2 + ((k - ck) / rk) ** 2 <= 1

/** Camada separada de um objeto (com o contorno da regra 1), para sombras e composição. */
function layerOf(draw) {
  const t = flat(CW, CH)
  t.object(draw)
  return t
}

/**
 * Camada larga: também cobre a sangria da esquerda (x de −WIDE_LEFT a 0, px da ilustração), onde a mesa continua.
 * Para objetos que atravessam a borda da ilustração (caneca e controle, no canto vazio da mesa à esquerda). Devolve
 * `opaque`/`px` recortados no 320×180 (como uma camada comum) e `wide` (opaque/pixel em px da ilustração) para a
 * sangria (closeup-bleed.mjs), que desenha a mesma coisa fora da ilustração.
 */
export const WIDE_LEFT = 80
function wideLayerOf(draw) {
  const W = WIDE_LEFT + CW
  const t = flat(W, CH)
  t.object((l) => draw({
    set: (x, y, c) => l.set(x + WIDE_LEFT, y, c),
    paint: (x, y, w, h, fn) => l.paint(x + WIDE_LEFT, y, w, h, (i, j) => fn(i - WIDE_LEFT, j)),
  }))
  const px = new Uint8Array(CW * CH * 4)
  for (let y = 0; y < CH; y++) px.set(t.px.subarray((y * W + WIDE_LEFT) * 4, (y * W + WIDE_LEFT + CW) * 4), y * CW * 4)
  const opaque = (x, y) => t.opaque(x + WIDE_LEFT, y)
  return {
    px, opaque,
    wide: { opaque, get: (x, y) => t.get(x + WIDE_LEFT, y) },
  }
}

function monitorLayer(screen) {
  const [mx, my, mw, mh] = MONITOR_BOX
  const [sx, sy, sw, sh] = CONTENT
  return layerOf((l) => {
    block(l, mx, my, mw, mh, MONITOR_DEPTH, {
      front: (x, y) => {
        if (y === my + 1) return 'graphite-2' // aresta de cima
        if (x === mx + mw - 2) return 'graphite-0'
        // Tela afundada na moldura: sombra em cima/esquerda, luz embaixo/direita.
        if ((y === sy - 1 && x >= sx - 1 && x <= sx + sw) || (x === sx - 1 && y >= sy - 1 && y <= sy + sh)) return 'graphite-0'
        if ((y === sy + sh && x >= sx - 1 && x <= sx + sw) || (x === sx + sw && y >= sy - 1 && y <= sy + sh)) return 'graphite-2'
        return 'graphite-1'
      },
      top: (i, k) => (k === MONITOR_DEPTH ? 'graphite-1' : 'graphite-2'),
      side: (k, j) => (j === 0 ? 'graphite-1' : 'graphite-0'),
    })
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
        return (d > 104 && d < 116) || (d > 122 && d < 126) ? 'teal-1' : 'graphite-0'
      })
    }
    l.rect(LED[0], LED[1], 2, 1, 'sky-0')
  })
}

/** Haste (atrás do monitor) e base deitada no fundo do tampo. */
function standLayers() {
  const base = layerOf((l) => block(l, 112, 127, 96, 3, 12, {
    front: (x) => (x >= 205 ? 'graphite-0' : 'graphite-1'),
    top: (i, k) => (k === 1 ? 'graphite-3' : 'graphite-2'),
    side: () => 'graphite-0',
  }))
  const neck = layerOf((l) => block(l, 152, 104, 16, 18, 2, {
    front: (x) => (x >= 165 ? 'graphite-0' : x === 152 ? 'graphite-2' : 'graphite-1'),
    top: () => 'graphite-2',
    side: () => 'graphite-0',
  }))
  return [base, neck]
}

/**
 * Teclado visto de cima: moldura cream-1 de 2 px, 5 fileiras de teclas de 8 px (face cream-3, borda da frente
 * cream-2, vãos cream-0), fileiras desencontradas, barra de espaço, Enter e Shift largos e luzes de status.
 */
function keyboardLayer() {
  const W = 140, D = 30, H = 3
  return layerOf((l) => slab(l, 88, 166, W, D, H, (i, k) => {
    if (k <= 2 || k >= D - 1 || i <= 1 || i >= W - 2) return k >= D - 1 ? 'cream-2' : 'cream-1' // moldura
    if (k === D - 2 && i >= W - 14 && i <= W - 4 && i % 4 !== 3) return i < W - 9 ? 'sky-0' : 'leaf-2' // luzes
    const r = Math.floor((k - 3) / 5), kk = (k - 3) % 5 // fileira 0 (frente) a 4; linha dentro da fileira
    if (r > 4 || kk === 4) return 'cream-0'
    const face = kk === 0 ? 'cream-2' : 'cream-3'
    const u = i - 3
    if (u < 0 || u > W - 7) return 'cream-0'
    if (r === 0 && u >= 36 && u < 92) return u === 91 ? 'cream-0' : face // barra de espaço
    if (r === 2 && u >= W - 25) return u === W - 7 ? 'cream-0' : face // Enter
    if (r === 1 && (u < 18 || u >= W - 27)) return u === 17 || u === W - 7 ? 'cream-0' : face // Shifts
    const stagger = [0, 0, 4, 2, 0][r]
    return mod(u + stagger, 9) === 8 ? 'cream-0' : face
  }, (i, k, j, f) => (f === 'side' ? 'cream-0' : j === 0 ? 'cream-2' : 'cream-1')))
}

/** Mousepad preto grande (pesponto grafite na borda) e mouse visto de cima, com botões, rodinha e sombreamento. */
function mouseLayers() {
  const PW = 56, PD = 34
  const pad = layerOf((l) => slab(l, 232, 170, PW, PD, 1, (i, k) => {
    if (i === 0 || i === PW - 1 || k === 1 || k === PD) return 'graphite-1' // borda
    if (((i === 2 || i === PW - 3) && k >= 3 && k <= PD - 2) || ((k === 3 || k === PD - 2) && i >= 2 && i <= PW - 3)) return mod(i + k, 3) === 0 ? null : 'graphite-1' // pesponto
    return 'graphite-0'
  }, () => 'outline'))
  const W = 19, D = 26
  const mouse = layerOf((l) => slab(l, 254, 166, W, D, 4, (i, k) => {
    // Corpo em gota: mais largo atrás (perto do visitante), mais estreito na frente (para o monitor).
    const ri = 9.4 * (1 - 0.1 * ((k - 13) / 13))
    if (!inEllipse(i, k, 9, 13, ri, 13.2)) return null
    if (k >= 16 && i === 9) return 'cream-0' // divisão entre os botões
    if (k >= 17 && k <= 21 && i >= 8 && i <= 10) return k % 2 ? 'graphite-2' : 'graphite-1' // rodinha
    if (k === 15 && Math.abs(i - 9) <= 7) return 'cream-1' // fim dos botões
    const e = ((i - 9) / ri) ** 2 + ((k - 13) / 13.2) ** 2
    if (i <= 5 && e < 0.75) return 'cream-3' // luz da esquerda
    if (e > 0.8 && i >= 11) return 'cream-1' // borda da direita
    return i >= 12 ? 'cream-2' : 'cream-3'
  }, (i, k, j, f) => (f === 'side' ? 'cream-0' : j === 0 ? 'cream-2' : 'cream-1'), 0))
  return [pad, mouse]
}

/**
 * Controle (desenho de controle clássico): corpo claro com dois punhos redondos (anel mais escuro na borda),
 * ombro azul atrás, direcional verde no punho esquerdo, 4 botões coloridos no direito e 2 laranja no meio.
 */
function controllerLayer() {
  const W = 46, D = 17, H = 4
  const L = [9, 8], R = [36, 8] // centros dos punhos (i, k)
  const grip = (i, k, [ci, ck], r = 1) => ((i - ci) / (9.2 * r)) ** 2 + ((k - ck) / (7.8 * r)) ** 2 <= 1
  const shape = (i, k) => {
    const g = grip(i, k, L) || grip(i, k, R)
    const bridge = i >= L[0] && i <= R[0] && k >= 3 && k <= 14
    const shoulder = i >= 17 && i <= 28 && k >= 14 && k <= 17
    if (!g && !bridge && !shoulder) return null
    if (shoulder && !g && !(bridge && k <= 14)) return k === 17 ? 'sky-1' : 'blue-1'
    // direcional: cruz de 3 px de largura e braços de 4, sombra embaixo/direita
    const [di, dk] = [i - L[0], k - L[1]]
    if ((Math.abs(di) <= 1 && Math.abs(dk) <= 4) || (Math.abs(dk) <= 1 && Math.abs(di) <= 4)) {
      if (di === 0 && dk === 0) return 'leaf-0'
      return di === 1 || dk === -1 || Math.abs(di) === 4 || Math.abs(dk) === 4 ? 'leaf-0' : 'leaf-1'
    }
    // 4 botões (3×2) em losango em volta do centro do punho direito
    const [bi, bk] = [i - R[0], k - R[1]]
    const btn = [[0, 4, 'pink'], [-5, 0, 'sky-0'], [5, 0, 'red-2'], [0, -4, 'gold-1']]
    for (const [oi, ok, color] of btn) if (Math.abs(bi - oi) <= 1 && (bk === ok || bk === ok - 1)) return color
    // dois botões laranja no meio e select/start
    if ((k === 10 || k === 11) && (i === 19 || i === 20 || i === 25 || i === 26)) return 'gold-2'
    if (k === 5 && (i === 20 || i === 21 || i === 24 || i === 25)) return 'wall-1'
    if (g && !(grip(i, k, L, 0.8) || grip(i, k, R, 0.8))) return 'wall-2' // anel do punho
    return k >= 14 ? 'wall-5' : 'wall-4'
  }
  return wideLayerOf((l) => slab(l, 8, 163, W, D, H, shape, (i, k, j, f) => {
    if (i >= 17 && i <= 28 && k >= 14) return 'blue-0'
    return f === 'side' ? 'wall-0' : j === 0 ? 'wall-2' : 'wall-1'
  }, 0))
}

/** Caneca (proporcional ao teclado): boca elíptica com café, corpo cilíndrico com faixa vermelha, alça à esquerda. */
function mugLayer() {
  const cx = 40, top = 103, bottom = 128, rx = 10, ry = 3 // rente ao lado esquerdo do monitor, no fundo da mesa
  return wideLayerOf((l) => {
    // Alça com furo.
    l.paint(cx - 15, top + 6, 7, 14, (x, y) => (x >= cx - 13 && x <= cx - 11 && y >= top + 9 && y <= top + 16 ? null : x === cx - 15 ? 'cream-2' : 'cream-1'))
    for (let y = top - ry - 1; y <= bottom + ry + 1; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      const u = (x + 0.5 - cx) / rx
      if (Math.abs(u) > 1) continue
      const half = ry * Math.sqrt(1 - u * u)
      const dT = y + 0.5 - top, dB = y + 0.5 - bottom
      if (Math.abs(dT) <= half) {
        // boca: aro creme e café (com reflexo) dentro
        const v = dT / ry, inner = (u / 0.8) ** 2 + (v / 0.66) ** 2 < 1
        l.set(x, y, inner ? (u < -0.3 && v < 0 ? 'wood-1' : 'wood-0') : 'cream-3')
      } else if (dT > 0 && dB <= half) {
        const band = y - top >= 10 && y - top <= 13 // faixa vermelha
        const t = u < -0.55 ? 0 : u < -0.1 ? 1 : u < 0.55 ? 2 : 3
        l.set(x, y, band ? ['red-3', 'red-2', 'red-2', 'red-1'][t] : ['cream-3', 'cream-3', 'cream-2', 'cream-1'][t])
      }
    }
  })
}

/**
 * Headset sem fio deitado no canto direito do fundo da mesa: duas conchas (almofada escura com o alto-falante no
 * meio e LED ciano na da direita) ligadas pela haste em arco, deitada no tampo para trás. Visto de cima (shear 0).
 */
function headsetLayers() {
  const W = 46, X = 256, Y = 132
  const cups = [[8, 6], [W - 9, 6]]
  const band = layerOf((l) => slab(l, X, Y, W, 17, 2, (i, k) => {
    const e = ((i - (W - 1) / 2) / ((W - 1) / 2 - 8)) ** 2 + ((k - 6) / 11) ** 2
    if (k < 6 || e > 1 || e < 0.66) return null
    return e > 0.83 ? 'graphite-3' : 'graphite-2'
  }, (i, k, j) => (j === 0 ? 'graphite-1' : 'graphite-0'), 0))
  const cup = layerOf((l) => slab(l, X, Y, W, 12, 5, (i, k) => {
    for (const [ci, ck] of cups) {
      const d = ((i - ci) / 7.6) ** 2 + ((k - ck) / 5.6) ** 2
      if (d > 1) continue
      if (ci > W / 2 && i === ci + 4 && k === ck - 3) return 'sky-0' // LED
      return d < 0.28 ? 'graphite-0' : d < 0.55 ? 'graphite-1' : i < ci - 3 ? 'graphite-3' : 'graphite-2'
    }
    return null
  }, (i, k, j, f) => (f === 'side' ? 'graphite-0' : j === 0 ? 'graphite-2' : 'graphite-1'), 0))
  return [band, cup]
}

/** Caneca e controle (camadas largas), também desenhados na sangria por closeup-bleed.mjs. */
export function leftDeskObjects() {
  return [mugLayer(), controllerLayer()]
}

/** Sombra projetada de `layers` deslocada (dx, dy), só onde `where(x, y)` e fora dos próprios objetos. */
function castShadow(c, layers, [dx, dy], where, color) {
  const solid = (x, y) => layers.some((t) => t.opaque(x, y))
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    if (!solid(x, y)) continue
    const tx = x + dx, ty = y + dy
    if (tx < 0 || ty < 0 || tx >= CW || ty >= CH) continue
    if (where(tx, ty) && !solid(tx, ty)) c.set(tx, ty, color)
  }
}

const putLayer = (c, t) => { for (let i = 0; i < CW * CH; i++) if (t.px[i * 4 + 3]) c.px.set(t.px.subarray(i * 4, i * 4 + 4), i * 4) }

/** Tampo (inclusive o braço B, que vem para a frente à esquerda da diagonal). Também usado pela sangria. */
export const onDeskTop = (x, y) => y > WALL_Y && (y < 172 || x < 30 - (y - 172))

/**
 * Cor do tampo/frente da mesa em (x, y), em px da ilustração; vale também fora do 320×180 (sangria, §3).
 * Abaixo de y 179: a frente (e o lado do braço B, ao longo da diagonal) tem 12 px a partir da aresta `wood-7`,
 * depois contorno e o vão escuro debaixo da mesa (`mauve-0`).
 */
export function deskPixel(x, y) {
  // Tampo (vista de cima) e frente. À esquerda de x 30 o braço B vem para a frente (trapézio).
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
  if (y === WALL_Y) return 'wood-2'
  if (y >= 172 && x === 29 - (y - 172)) return 'wood-7' // aresta do braço B
  return deskGrain(x, y) ? 'wood-5' : 'wood-6'
}

function drawDesk(c) {
  c.paint(0, WALL_Y, CW, CH - WALL_Y, (x, y) => deskPixel(x, y))
}

/**
 * screen: 'off' | 'boot0' | 'boot1' | 'on'. night: pré-renderiza com tint-night, mantendo nas cores de dia
 * as fontes de luz (tela, LED e o halo de 3 px do monitor na parede).
 */
export function renderCloseup({ screen = 'on', night = false } = {}) {
  const c = flat(CW, CH)
  drawWalls(c)
  drawCurtain(c)
  drawDesk(c)

  const monitor = monitorLayer(screen)
  const [base, neck] = standLayers()
  const [pad, mouse] = mouseLayers()
  const onDesk = [base, ...headsetLayers(), ...leftDeskObjects(), pad, keyboardLayer(), mouse]
  // Sombra na parede do fundo (só de dia: à noite não há sol) e no tampo (sempre: contato com a mesa).
  if (!night) castShadow(c, [monitor, neck], [-4, 4], (x, y) => x > 30 && y < WALL_Y, 'wall-0')
  castShadow(c, onDesk, [-3, 2], onDeskTop, 'wood-4')
  for (const t of [base, neck, monitor, ...onDesk.slice(1)]) putLayer(c, t)

  if (!night) return c.px

  const lit = screen !== 'off'
  const [sx, sy, sw, sh] = CONTENT
  const inBox = (x, y, [bx, by, bw, bh]) => x >= bx && x < bx + bw && y >= by && y < by + bh
  // Halo: parede a até 3 px (em quadrado) da silhueta do monitor, que inclui o topo e a lateral.
  const nearMonitor = (x, y) => {
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (monitor.opaque(x + dx, y + dy)) return true
    return false
  }
  const keep = (i) => {
    const x = i % CW, y = Math.floor(i / CW)
    if (x >= LED[0] && x < LED[0] + 2 && y === LED[1]) return true // LED
    if (!lit) return false
    if (inBox(x, y, [sx, sy, sw, sh])) return true
    // Só na parede: nada que esteja na mesa (caneca, headset...) pega o brilho da tela.
    if (monitor.opaque(x, y) || [base, neck, ...onDesk].some((t) => t.opaque(x, y))) return false
    return y < WALL_Y && x < 309 && x > 30 && nearMonitor(x, y)
  }
  const out = multiply(c.px, TINT.night, keep)
  // Luar na dobra esquerda da cortina (cor da paleta, por cima do tint).
  const moon = flat(CW, CH)
  moon.rect(310, 0, 2, WALL_Y - 8, 'teal-3')
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
    if (y < 14) return deskGrain(x, y + WALL_Y) ? 'wood-5' : 'wood-6'
    if (y === 14) return 'wood-7'
    return y === h - 1 ? 'wood-4' : 'wood-5'
  })
  return c.px
}
