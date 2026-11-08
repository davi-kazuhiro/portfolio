// TESTE (M3): visões de perto em projeção oblíqua "3/4 frontal" — mais volume, menos chapado.
// Frentes viradas para o visitante; a profundidade aparece como topo + lateral direita, deslocados
// (+1, −1) px por unidade de profundidade. Topo claro, frente média, lado escuro (como no quarto).
// Sombras projetadas na parede: silhueta deslocada para baixo e para a esquerda (luz da janela à direita).
// Só prévia: não exporta nada para public/assets/.
import { rgba } from '../lib.mjs'
import { P, UI_BG } from '../palette.mjs'
import { flat } from '../flat.mjs'
import { blit, lint } from '../sheet.mjs'
import {
  CARD, CH, CONTENT, CW, drawCurtain, drawWalls, itemPixels, layoutItems, LIFT, loadSkills, mockFicha, mockIndex, PLANK, renderScene,
} from './closeup-bookshelf.mjs'
import { renderCloseup } from './closeup.mjs'

const ITEM_OFF = 2 // itens apoiados 2 px para dentro do tampo da tábua
const ITEM_DEPTH = 6
const BOARD_DEPTH = 10

const idx = (x, y) => y * CW + x
const okXY = (x, y) => x >= 0 && y >= 0 && x < CW && y < CH

/**
 * Extrusão oblíqua de uma silhueta frontal. `front`: [[i, rgba]] (pixels da frente).
 * depth(x, y) → profundidade daquele pixel; top/side: tokens do topo e da lateral direita.
 * Devolve [[i, rgba]] (extrusão por baixo + frente por cima), pronto para virar objeto com contorno.
 */
export function extrude(front, { depth, top, side }) {
  const F = new Set(front.map(([i]) => i))
  const out = new Map()
  const T = rgba(P[top]), S = rgba(P[side])
  // Do fundo para a frente, para a camada mais próxima ficar por cima.
  const maxD = Math.max(...front.map(([i]) => depth(i % CW, Math.floor(i / CW))))
  for (let k = maxD; k >= 1; k--) {
    for (const [i] of front) {
      const x = i % CW, y = Math.floor(i / CW)
      if (depth(x, y) < k) continue
      const tx = x + k, ty = y - k
      if (!okXY(tx, ty)) continue
      const topEdge = !F.has(idx(x, y - 1))
      out.set(idx(tx, ty), topEdge ? T : S)
    }
  }
  for (const [i, p] of front) out.set(i, p)
  return [...out.entries()]
}

export const rectPixels = (x, y, w, h, fn) => {
  const out = []
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const c = fn(i, j); if (c) out.push([idx(i, j), rgba(P[c])]) }
  return out
}

export const putObject = (c, pixels) => c.object((l) => { for (const [i, p] of pixels) l.px.set(p, i * 4) })

export function shadowOnWall(c, solids, [dx, dy], color = 'wall-0') {
  const all = new Set(solids)
  for (const i of solids) {
    const x = (i % CW) + dx, y = Math.floor(i / CW) + dy
    if (okXY(x, y) && !all.has(idx(x, y))) c.set(x, y, color)
  }
}

// ---------- prateleira ----------
function boardPixels() {
  const [x, y, w, h] = PLANK
  const front = rectPixels(x, y, w, h, (i, j) => (j === y ? 'wood-7' : j >= y + h - 2 ? 'wood-4' : 'wood-5'))
  return extrude(front, { depth: () => BOARD_DEPTH, top: 'wood-6', side: 'wood-2' })
}

function bracketPixels(bx) {
  const y0 = PLANK[1] + PLANK[3], H = 12
  const front = rectPixels(bx, y0, 3, H, (i, j) => (j - y0 > 8 && i - bx > 2 - (H - 1 - (j - y0)) ? null : i === bx ? 'graphite-2' : 'graphite-1'))
  // Cunha: funda (= tábua) em cima, quase nada embaixo.
  return extrude(front, { depth: (_, y) => Math.max(1, Math.round(BOARD_DEPTH * (1 - (y - y0) / H))), top: 'graphite-2', side: 'graphite-0' })
}

const ITEM_TONES = {
  book: (it) => ({ top: 'cream-2', side: null }), // lado = sombra da própria capa
  dictionary: () => ({ top: 'cream-2', side: 'wood-0' }),
  cartridge: () => ({ top: 'graphite-2', side: 'graphite-0' }),
  die: () => ({ top: 'red-3', side: 'red-0' }),
}
const DARK = { 'red-2': 'red-0', 'leaf-1': 'leaf-0', 'blue-1': 'blue-0', 'teal-3': 'teal-2', pink: 'red-1', 'gold-1': 'gold-0', 'mauve-2': 'mauve-1' }

function itemSolid(it, lift) {
  const moved = { ...it, x: it.x + ITEM_OFF, y: it.y - ITEM_OFF }
  const front = itemPixels(moved, lift)
  const tones = ITEM_TONES[it.kind](it)
  const side = tones.side ?? DARK[it.color] ?? 'graphite-1'
  const d = it.kind === 'die' ? 4 : it.kind === 'cartridge' ? 4 : ITEM_DEPTH
  return extrude(front, { depth: () => d, top: tones.top, side })
}

function cardPixels() {
  const [x, y, w, h] = CARD
  const curl = 7 // canto de baixo à direita levantado
  const front = rectPixels(x, y, w, h, (i, j) => {
    if ((x + w - 1 - i) + (y + h - 1 - j) < curl) return null
    return j === y + h - 1 ? 'cream-1' : 'cream-3'
  })
  for (let j = 0; j < 1; j++) front.push(...rectPixels(x + 4, CONTENT[1] - 3, w - 8, 1, () => 'red-3'))
  return extrude(front, { depth: () => 2, top: 'cream-2', side: 'cream-1' })
}

function drawCurl(c) {
  const [x, y, w, h] = CARD, curl = 7
  const cx = x + w - 1, cy = y + h - 1
  // Dobra: triângulo virado para dentro, verso do papel em cream-2 com vinco cream-0.
  const bx = cx - curl + 1, by = cy - curl + 1
  c.rect(bx - 2, by + 2, curl, curl, 'wall-0') // sombra sob a ponta levantada
  c.object((l) => {
    for (let j = 0; j < curl; j++) for (let i = 0; i < curl - j; i++) l.set(bx + i, by + j, i + j === curl - 1 ? 'cream-0' : 'cream-2')
  })
}

function drawTapes(c) {
  const [x, y, w] = CARD
  for (const [tx, color, dir] of [[x + 6, 'pink', 1], [x + w - 26, 'teal-3', -1]]) {
    c.object((l) => {
      for (let j = 0; j < 7; j++) {
        const off = Math.floor(j / 3) * dir
        for (let i = 0; i < 20; i++) {
          if ((i === 0 || i === 19) && j % 2 === 1) continue
          l.set(tx + i + off, y - 4 + j, color)
        }
      }
    })
  }
}

/** Gradiente de luz na parede: 3 faixas, mais clara do lado da janela. */
function drawWalls3d(c) {
  drawWalls(c)
}

export function renderBookshelf3d({ skills = loadSkills(), selected = null } = {}) {
  const c = flat(CW, CH)
  drawWalls3d(c)
  drawCurtain(c)
  const items = layoutItems(skills)
  const board = boardPixels()
  const brackets = [60, 256].flatMap(bracketPixels)
  const solids = items.map((it) => [it, itemSolid(it, it.key === selected ? LIFT : 0)])
  const card = cardPixels()

  // Sombras: tábua e itens projetam 4 px para baixo-esquerda; a ficha, fina, 2 px. Oclusão sob a tábua.
  shadowOnWall(c, [...board, ...brackets, ...solids.flatMap(([, s]) => s)].map(([i]) => i), [-4, 4])
  c.rect(PLANK[0] + BOARD_DEPTH, PLANK[1] + PLANK[3], PLANK[2] - 4, 2, 'wall-0')
  shadowOnWall(c, card.map(([i]) => i), [-3, 3])

  putObject(c, board)
  for (let b = 0; b < 2; b++) putObject(c, brackets.slice(b * (brackets.length / 2), (b + 1) * (brackets.length / 2)))
  let hover = null
  for (const [it, s] of solids) { putObject(c, s); if (it.key === selected) hover = s.map(([i]) => i) }
  putObject(c, card)
  drawCurl(c)
  drawTapes(c)

  if (hover) {
    const set = new Set(hover)
    for (const i of hover) {
      const x = i % CW, y = Math.floor(i / CW)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (okXY(x + dx, y + dy) && !set.has(idx(x + dx, y + dy))) c.set(x + dx, y + dy, 'gold-2')
      }
    }
  }
  return { c, items }
}

// ---------- computador (teste rápido sobre a ilustração do M2) ----------
export function renderComputer3d() {
  const c = flat(CW, CH)
  c.px.set(renderCloseup({ screen: 'on' }))
  // Monitor como sólido: lateral direita e topo com 6 px de fundo (o topo é cortado pela borda do quadro).
  const D = 6, [mx, my, mw, mh] = [40, 2, 240, 150]
  c.rect(mx - 3, my + mh, mw, 3, 'wall-0') // sombra projetada (já existia; reforça embaixo)
  c.object((l) => {
    for (let k = 1; k <= D; k++) {
      l.rect(mx + mw - 1 + k, my - k, 1, mh, 'graphite-0') // lateral
      l.rect(mx + k, my - k, mw, 1, 'graphite-2') // topo
    }
  })
  // Redesenha a moldura por cima da extrusão (frente na frente).
  c.object((l) => {
    l.rect(mx, my, mw, mh, 'graphite-1')
    l.rect(mx + 1, my + 1, mw - 2, 1, 'graphite-3')
    l.rect(mx + mw - 2, my + 1, 1, mh - 2, 'graphite-0')
    l.rect(48, 11, 224, 126, 'teal-0'); l.rect(48, 11, 224, 1, 'teal-1'); l.rect(48, 11, 1, 126, 'teal-1')
    l.rect(266, 143, 2, 1, 'sky-0')
  })
  // Haste com lado e base com topo visível; sombras no tampo para a esquerda.
  c.rect(144, 160, 8, 3, 'wood-5'); c.rect(122, 164, 12, 2, 'wood-5')
  c.object((l) => {
    l.rect(150, 152, 20, 8, 'graphite-1'); l.rect(170, 150, 3, 10, 'graphite-0')
    l.rect(132, 161, 56, 4, 'graphite-1'); l.rect(134, 158, 56, 3, 'graphite-2'); l.rect(188, 158, 2, 7, 'graphite-0')
  })
  // Teclado: lateral direita e sombra à esquerda.
  c.rect(104, 165, 4, 7, 'wood-5')
  c.object((l) => {
    l.rect(212, 162, 3, 10, 'cream-0')
    l.rect(108, 160, 107, 3, 'cream-2')
    l.rect(108, 163, 104, 9, 'cream-2'); l.rect(108, 169, 104, 3, 'cream-1')
    for (const ky of [164, 167]) { l.rect(110, ky, 100, 2, 'cream-0'); for (let kx = 110; kx + 5 <= 210; kx += 6) l.rect(kx, ky, 5, 2, 'cream-3') }
    l.rect(140, 167, 40, 2, 'cream-3')
  })
  // Caneca: sombra no tampo à esquerda (ela já é cilindro em 3 faixas).
  const desk = new Set([P['wood-6'], P['wood-5']].map((h) => rgba(h).slice(0, 3).join()))
  c.paint(58, 165, 10, 7, (x, y) => (desk.has([...c.get(x, y).slice(0, 3)].join()) && (x < 64 || y > 170) ? 'wood-4' : null))
  return c
}

const bgCanvas = (w, h) => { const p = new Uint8Array(w * h * 4); for (let i = 0; i < w * h; i++) p.set(rgba(UI_BG), i * 4); return p }
const stack = (list, dir = 'v') => {
  const gap = 6
  const W = dir === 'v' ? CW : CW * list.length + gap * (list.length - 1)
  const H = dir === 'v' ? CH * list.length + gap * (list.length - 1) : CH
  const p = bgCanvas(W, H)
  list.forEach((px, n) => blit(p, W, H, px, CW, CH, dir === 'v' ? 0 : n * (CW + gap), dir === 'v' ? n * (CH + gap) : 0))
  return { px: p, w: W, h: H }
}

export function render3dPreviews() {
  const skills = loadSkills()
  const idxScene = renderBookshelf3d({ skills })
  for (const e of lint(idxScene.c.px)) throw new Error(`3d: ${e}`)
  const index3d = idxScene.c; mockIndex(index3d, skills, idxScene.items)
  const java = renderBookshelf3d({ skills, selected: 'tecnicas.0' }).c; mockFicha(java, skills, idxScene.items, 0)
  const flatScene = renderScene({ skills })
  const indexFlat = flat(CW, CH); indexFlat.px.set(flatScene.px); mockIndex(indexFlat, skills, flatScene.items)
  const computer = renderComputer3d()
  for (const e of lint(computer.px)) throw new Error(`computer 3d: ${e}`)
  return [
    { name: 'm3-bookshelf-closeup-3d', ...stack([index3d.px, java.px]) },
    { name: 'm3-bookshelf-closeup-compare', ...stack([indexFlat.px, index3d.px], 'h') },
    { name: 'm2-closeup-computer-3d', px: computer.px, w: CW, h: CH },
  ]
}
