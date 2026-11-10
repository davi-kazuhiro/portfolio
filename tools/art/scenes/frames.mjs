// Quadros (`frames`, M3, interagível) no quarto. Variação A (galeria) aprovada em 2026-11-09 e exportada pelo build.mjs
// (pnpm art); a variação B fica só como histórico (prévia em build-m3 frames).
// Spec: docs/arte/specs/7-quadros.md. Planta: parede esquerda (plano x = 0), acima do braço B da mesa. Com a saída
// do diploma, a faixa livre vai de row 1,6 a 3,9 (y 12,8–31,2 u) e de 76 a 112 px de altura (z 38–56 u).
//
// Coordenadas de desenho: "px da parede" (u, v), em px de tela a 1×, com u para a direita e v para baixo:
//   u = (31,5 − y) · 4   (1 u de mundo em y = 4 px na horizontal; +y anda para a esquerda na tela)
//   v = (56 − z) · 2     (1 u de z = 2 px; v = 0 é a altura de 112 px)
// Assim os retângulos dos quadros são dados em px, e cada um vira uma caixa fina presa à parede.
//
// Duas variações (A aprovada; B histórico):
// - A "galeria": cinco molduras separadas (uma por certificado), de tamanhos variados, agrupadas. A maior (a mais
//   recente) tem uma luminária de quadro de latão em cima, que acende à noite.
// - B "mural": um quadro de cortiça com moldura de madeira e os cinco certificados presos com tachinhas, mais um
//   varal de luzinhas no alto, que acende à noite.
import { P } from '../palette.mjs'
import { roomCanvas, RH, RW } from '../room.mjs'

const T = (t) => P[t]
const Y_REF = 31.5, Z_REF = 56
/** Retângulo em px da parede → [y0, y1, z0, z1] em unidades. */
const wallRect = ([u, v, w, h]) => [Y_REF - (u + w) / 4, Y_REF - u / 4, Z_REF - (v + h) / 2, Z_REF - v / 2]
/** Ponto do plano (p = y, q = z) → px da parede (inteiros). */
const toUV = (p, q) => [Math.floor((Y_REF - p) * 4), Math.floor((Z_REF - q) * 2)]

/** Molduras: cores de cada anel (lado claro = cima/esquerda, lado escuro = baixo/direita). */
const MOULD = {
  wood: { top: 'wood-6', hi: 'wood-7', lit: 'wood-5', dark: 'wood-2', edge: 'wood-1' },
  walnut: { top: 'wood-4', hi: 'wood-5', lit: 'wood-2', dark: 'wood-1', edge: 'wood-0' },
  graphite: { top: 'graphite-3', hi: 'graphite-3', lit: 'graphite-2', dark: 'graphite-1', edge: 'graphite-0' },
  gold: { top: 'gold-3', hi: 'gold-3', lit: 'gold-1', dark: 'gold-0', edge: 'wood-3' },
}

/** Âncora (objeto de parede): base da parede esquerda sob o centro do grupo, y 22 u (u 38 px da parede) = tile (0; 2,75). */
export const FRAMES_ANCHOR_Y = 22

export const FRAMES = {
  A: {
    name: 'A — galeria (5 molduras)',
    depth: 0.75,
    // [u, v, w, h] em px da parede; ordem = do mais recente ao mais antigo (só decorativo: o quarto não muda com o conteúdo).
    items: [
      { rect: [20, 5, 30, 24], mould: 'walnut', m: 3, mat: 2 }, // Maratona SBC 2026 (o maior)
      { rect: [4, 7, 12, 14], mould: 'wood', m: 2, mat: 1 }, // Galeria de Projetos
      { rect: [54, 7, 18, 12], mould: 'graphite', m: 2, mat: 1 }, // MIPE / IFTECH
      { rect: [4, 24, 12, 10], mould: 'gold', m: 2, mat: 0 }, // PIC Especial
      { rect: [56, 22, 14, 12], mould: 'wood', m: 2, mat: 1 }, // 15º PIC
    ],
    lamp: { rect: [28, 1, 14, 2], depth: 1.25, arm: [34, 0, 2, 1] }, // luminária de quadro sobre o maior
  },
  B: {
    name: 'B — mural de cortiça',
    depth: 0.75,
    board: [2, 3, 72, 32],
    // Papéis presos, relativos ao canto do quadro: [a, b, w, h] e cor da tachinha.
    papers: [
      { rect: [25, 11, 22, 15], pin: 'pink' },
      { rect: [5, 8, 15, 10], pin: 'sky-0' },
      { rect: [52, 9, 15, 11], pin: 'leaf-1' },
      { rect: [7, 21, 12, 8], pin: 'gold-1' },
      { rect: [52, 22, 13, 7], pin: 'red-2' },
    ],
    // Varal: fio de (3, 2) a (68, 2) com barriga de 3 px; lâmpadas a cada 9 px.
    cord: { a0: 3, a1: 68, b: 2, sag: 3 },
    bulbs: [8, 17, 26, 35, 44, 53, 62],
  },
}

const mod = (v, n) => ((v % n) + n) % n
const hash = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h) }

/** Anel da moldura: distância à borda e lado (cima/esquerda = claro). */
function ring(a, b, w, h) {
  const r = w - 1 - a, d = h - 1 - b
  const e = Math.min(a, b, r, d)
  const lit = e === b || e === a ? (e === d || e === r ? b <= d && a <= r : true) : false
  return { e, lit }
}

/** Certificado miniatura (sem texto: só linhas e selo), em px relativos ao papel de w×h. */
function paperPixel(a, b, w, h) {
  if (w >= 10 && h >= 8) {
    if (a >= 2 && a < w - 2 && b === 2) return 'cream-0' // título
    if (a >= 3 && a < w - 3 && (b === 4 || (h >= 10 && b === 6))) return 'cream-1' // linhas de texto
    if (a >= w - 4 && a < w - 2 && b >= h - 4 && b < h - 2) return (a + b) % 2 ? 'gold-0' : 'gold-1' // selo
  } else if (a >= 1 && a < w - 1 && b === 1) return 'cream-1'
  return 'cream-3'
}

/** Face da frente de um quadro da variação A (px da parede relativos ao quadro). */
function framePixel(item, a, b) {
  const [, , w, h] = item.rect
  const M = MOULD[item.mould]
  const { e, lit } = ring(a, b, w, h)
  if (e < item.m) return e === 0 ? M.hi : lit ? M.lit : M.dark
  if (e < item.m + item.mat) return lit ? 'cream-1' : 'cream-2' // passe-partout (o lado de cima fica na sombra)
  const k = item.m + item.mat
  return paperPixel(a - k, b - k, w - 2 * k, h - 2 * k)
}

/** Caixa fina presa à parede, pintada pelo px da parede. */
function wallBox(c, rect, depth, face, sides) {
  const [y0, y1, z0, z1] = wallRect(rect)
  return c.box([0, depth, y0, y1, z0, z1], (f, p, q) => {
    if (f === 'top') return T(sides.top)
    if (f === 'y') return T(sides.side)
    const [U, V] = toUV(p, q)
    const a = Math.min(rect[2] - 1, Math.max(0, U - rect[0])), b = Math.min(rect[3] - 1, Math.max(0, V - rect[1]))
    const col = face(a, b)
    return col ? T(col) : null
  })
}

/** Quadros da variação `style`. `lit` = luzes acesas (noite). */
export function renderFrames(style, { lit = false } = {}) {
  const c = roomCanvas()
  const F = FRAMES[style]
  if (style === 'A') {
    c.object(F.items.map((it) => wallBox(c, it.rect, F.depth, (a, b) => framePixel(it, a, b), { top: MOULD[it.mould].top, side: MOULD[it.mould].edge })))
    // Luminária de quadro: braço curto e barra de latão; a barra acende por baixo (gold-3) à noite.
    const L = F.lamp
    c.object([
      wallBox(c, L.arm, 1.25, () => 'gold-0', { top: 'gold-1', side: 'gold-0' }),
      wallBox(c, L.rect, L.depth, (a, b) => (b === L.rect[3] - 1 ? (lit ? 'gold-3' : 'gold-0') : a === 0 ? 'gold-3' : 'gold-1'), { top: 'gold-3', side: 'gold-0' }),
    ])
  } else {
    const [bu, bv, bw, bh] = F.board
    const { a0, a1, b: cb, sag } = F.cord
    const cordAt = (a) => cb + Math.round(sag * (1 - ((a - (a0 + a1) / 2) / ((a1 - a0) / 2)) ** 2))
    c.object([wallBox(c, F.board, F.depth, (a, b) => {
      const { e, lit: l } = ring(a, b, bw, bh)
      if (e === 0) return 'wood-7'
      if (e === 1) return l ? 'wood-5' : 'wood-2'
      // Varal (fio, soquete e lâmpada) por cima da cortiça e dos papéis.
      if (a >= a0 && a <= a1 && b === cordAt(a)) return 'graphite-1'
      for (const x of F.bulbs) {
        const cy = cordAt(x)
        if (a === x && b === cy + 1) return 'graphite-2'
        if ((a === x || a === x + 1) && b === cy + 2) return lit ? 'gold-3' : 'cream-2'
        if (a === x && b === cy + 3) return lit ? 'gold-3' : 'cream-1'
      }
      for (const p of F.papers) {
        const [pa, pb, pw, ph] = p.rect
        if (a === pa + (pw >> 1) && b === pb) return p.pin
        if (a >= pa && a < pa + pw && b >= pb && b < pb + ph) {
          const i = a - pa, j = b - pb
          if (i === 0 || j === 0 || i === pw - 1 || j === ph - 1) return 'cream-1' // borda do papel (o contorno é do quadro todo)
          return paperPixel(i - 1, j - 1, pw - 2, ph - 2)
        }
        // Sombra do papel na cortiça (−1, +1).
        if (a >= pa - 1 && a < pa + pw - 1 && b >= pb + 1 && b < pb + ph + 1) return 'wood-2'
      }
      if (e === 2) return l ? 'wood-2' : 'wood-4' // borda interna em sombra no alto e à esquerda
      const n = hash(a, b)
      return n > 0.9 ? 'wood-3' : n < 0.08 ? 'wood-5' : 'wood-4'
    }, { top: 'wood-6', side: 'wood-1' })])
    void bu; void bv
  }
  return c
}

/** Sombra na parede (plana, assada no room-shell como a da prateleira): deslocada 2 px para a esquerda e 2 para baixo. */
export function renderFramesShadow(style) {
  const c = roomCanvas()
  const F = FRAMES[style]
  const rects = style === 'A' ? F.items.map((it) => it.rect) : [F.board]
  c.object(rects.map(([u, v, w, h]) => {
    const [y0, y1, z0, z1] = wallRect([u - 2, v + 2, w, h])
    return c.box([-0.01, 0, y0, y1, z0, z1], (f) => (f === 'x' ? T('wall-0') : null))
  }), { outline: false })
  return c
}

/**
 * Camada de luz (acima do tint). A: a barra acesa e o maior quadro nas cores de dia (a luminária de quadro ilumina
 * só ele). B: as lâmpadas acesas e um raio de 2 px em volta de cada uma, nas cores de dia.
 * `day` = renderFrames(style, { lit: true }).pixels.
 */
export function renderLightFrames(style, day) {
  const px = new Uint8Array(RW * RH * 4)
  const F = FRAMES[style]
  const mask = roomCanvas()
  if (style === 'A') {
    mask.object([wallBox(mask, F.items[0].rect, F.depth, () => 'cream-3', { top: 'cream-3', side: 'cream-3' }),
      wallBox(mask, F.lamp.rect, F.lamp.depth, (a, b) => (b === F.lamp.rect[3] - 1 ? 'cream-3' : null), { top: null, side: null })], { outline: false })
  } else {
    const { a0, a1, b: cb, sag } = F.cord
    const cordAt = (a) => cb + Math.round(sag * (1 - ((a - (a0 + a1) / 2) / ((a1 - a0) / 2)) ** 2))
    mask.object([wallBox(mask, F.board, F.depth, (a, b) => (F.bulbs.some((x) => (a - x - 0.5) ** 2 + ((b - cordAt(x) - 2.5) * 1.2) ** 2 < 7) ? 'cream-3' : null), { top: null, side: null })], { outline: false })
  }
  for (let i = 0; i < RW * RH; i++) if (mask.pixels[i * 4 + 3] && day[i * 4 + 3]) px.set(day.subarray(i * 4, i * 4 + 4), i * 4)
  return px
}

void mod
