// Visões de perto do headset (`headset`) e do controle (`controller`) — PROPOSTA (M3, 2026-11-10), ainda não
// exportada para public/assets/. Spec: docs/arte/specs.md §8 e §9. Prévias: tools/art/build-desk-items.mjs.
//
// Revisão de 2026-11-10 (pedido do Davi): fundo simples (parede + mesa), o objeto grande e modelado em 3D no
// meio-esquerda e, no meio-direita, a capa do álbum / a caixa do jogo flutuando (mesmo efeito do hobby da
// prateleira: o item sobe e desce por CSS, a sombra no tampo fica parada), com setas ◀ ▶ dos lados. A legenda é
// DOM. As variações anteriores (discos na parede + aparelho de som; cartuchos + manual; menu na TV) foram
// descartadas.
//
// O objeto grande é renderizado por raymarching de SDF (formas arredondadas) com câmera ortográfica, luz de cima à
// esquerda e tons quantizados nas rampas da paleta (3 a 5 tons por material, sem alfa parcial), mais contorno de
// 1 px por fora e nas quebras de profundidade.
//
// Mesmo formato das outras visões de perto: ilustração 320×180 em (0, 0) lógico + sangria real de 80 px à esquerda
// e à direita e 64 px em cima e embaixo (specs §3, "Tela cheia"). As funções de desenho usam px da ilustração
// (negativos na sangria).
//
// Direitos: nenhuma capa de álbum nem arte de jogo real. Capas são geradas por código: cor de fundo + um motivo
// geométrico simples (MOTIFS) + o título em fonte de pixel 3×5.
import { hash } from '../lib.mjs'
import { readFileSync } from 'node:fs'
import { P, TINT } from '../palette.mjs'
import { flat } from '../flat.mjs'
import { multiply } from '../sheet.mjs'
import { plain, text, textW } from './closeup-bookshelf.mjs'

export const CW = 320, CH = 180
export const BLEED = { left: 80, top: 64, right: 80, bottom: 64 }
export const BW = BLEED.left + CW + BLEED.right, BH = BLEED.top + CH + BLEED.bottom
const X0 = -BLEED.left, Y0 = -BLEED.top, X1 = CW + BLEED.right, Y1 = CH + BLEED.bottom
const mod = (v, n) => ((v % n) + n) % n

// ---------- conteúdo ----------
// O atlas é gerado a partir de src/content/pt/albums.json e games.json (content-curator). ALBUMS/GAMES abaixo são
// só os placeholders das prévias da proposta.
const CONTENT = (name) => new URL(`../../../src/content/pt/${name}.json`, import.meta.url)
/** Lê e valida a lista (ids kebab-case únicos, tokens da paleta, motivo conhecido). */
export function loadDeskContent(name) {
  const list = JSON.parse(readFileSync(CONTENT(name), 'utf8'))
  const seen = new Set()
  for (const e of list) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id) || seen.has(e.id)) throw new Error(`${name}.json: id inválido ou repetido: ${e.id}`)
    seen.add(e.id)
    if (name === 'games') {
      // Desde 2026-11-12 o item do jogo é um ícone desenhado à mão (sem texto); `cover` não é usado.
      if (!iconOf(e.icon)) throw new Error(`games.json ${e.id}: ícone desconhecido (${e.icon}); aceitos: ${GAME_ICONS.join(', ')}`)
      continue
    }
    for (const k of ['bg', 'fg', 'dark', 'ink']) if (!P[e.cover?.[k]]) throw new Error(`${name}.json ${e.id}: cover.${k} não é token da paleta (${e.cover?.[k]})`)
    if (!MOTIFS.includes(e.cover.motif)) throw new Error(`${name}.json ${e.id}: motivo desconhecido (${e.cover.motif})`)
    // O texto da capa (64 px) precisa caber inteiro: até 2 linhas de 15 caracteres, sem cortar palavra.
    const t = plain(e.coverText ?? e.title)
    const lines = wrapTitle(t, 15)
    if (lines.join(' ') !== t.replace(/\s+/g, ' ').trim()) throw new Error(`albums.json ${e.id}: o texto da capa não cabe (2 × 15): "${t}"; use coverText`)
  }
  return list.map((e) => ({ ...e, coverTitle: e.coverText ?? e.title }))
}

/** Capa: fundo, motivo, cor escura do motivo e tinta do título. Tudo token da paleta. */
export const ALBUMS = [
  { id: 'album-1', title: 'MARE ALTA', artist: 'ARTISTA UM', year: '2019', cover: { bg: 'teal-2', fg: 'gold-3', dark: 'teal-1', ink: 'cream-3', motif: 'sun' } },
  { id: 'album-2', title: 'NEON 84', artist: 'ARTISTA DOIS', year: '2021', cover: { bg: 'pink', fg: 'cream-3', dark: 'red-1', ink: 'graphite-0', motif: 'rings' } },
  { id: 'album-3', title: 'CASA AZUL', artist: 'ARTISTA TRES', year: '2016', cover: { bg: 'blue-1', fg: 'sky-2', dark: 'blue-0', ink: 'cream-3', motif: 'waves' } },
  { id: 'album-4', title: 'VERAO', artist: 'ARTISTA QUATRO', year: '2023', cover: { bg: 'gold-1', fg: 'red-1', dark: 'gold-0', ink: 'graphite-0', motif: 'stripes' } },
  { id: 'album-5', title: 'SINAL', artist: 'ARTISTA CINCO', year: '2018', cover: { bg: 'graphite-1', fg: 'leaf-2', dark: 'graphite-2', ink: 'cream-3', motif: 'grid' } },
  { id: 'album-6', title: 'ESTATICA', artist: 'ARTISTA SEIS', year: '2022', cover: { bg: 'red-1', fg: 'gold-3', dark: 'red-0', ink: 'cream-3', motif: 'triangle' } },
]
export const GAMES = [
  { id: 'game-1', title: 'TORRE', genre: 'AVENTURA', hours: '120 H', cover: { bg: 'leaf-1', fg: 'cream-3', dark: 'leaf-0', ink: 'graphite-0', motif: 'triangle' } },
  { id: 'game-2', title: 'KART 3', genre: 'CORRIDA', hours: '45 H', cover: { bg: 'red-2', fg: 'gold-3', dark: 'red-0', ink: 'cream-3', motif: 'stripes' } },
  { id: 'game-3', title: 'ILHA', genre: 'EXPLORACAO', hours: '80 H', cover: { bg: 'sky-0', fg: 'gold-1', dark: 'blue-0', ink: 'graphite-0', motif: 'sun' } },
  { id: 'game-4', title: 'ORBITA', genre: 'ESTRATEGIA', hours: '200 H', cover: { bg: 'graphite-1', fg: 'sky-2', dark: 'teal-1', ink: 'cream-3', motif: 'rings' } },
  { id: 'game-5', title: 'RITMO', genre: 'MUSICA', hours: '30 H', cover: { bg: 'pink', fg: 'cream-3', dark: 'red-1', ink: 'graphite-0', motif: 'waves' } },
  { id: 'game-6', title: 'MASMORRA', genre: 'RPG', hours: '150 H', cover: { bg: 'gold-1', fg: 'wood-0', dark: 'gold-0', ink: 'graphite-0', motif: 'diamond' } },
]
export const MOTIFS = ['sun', 'rings', 'waves', 'stripes', 'grid', 'triangle', 'diamond']

// ---------- tela com origem lógica deslocada ----------
function wrap(c, ox, oy) {
  return {
    set: (x, y, col) => c.set(x + ox, y + oy, col),
    rect: (x, y, w, h, col) => c.rect(x + ox, y + oy, w, h, col),
    paint: (x, y, w, h, fn) => c.paint(x + ox, y + oy, w, h, (i, j) => fn(i - ox, j - oy)),
    object: (draw, opts) => c.object((l) => draw(wrap(l, ox, oy)), opts),
  }
}
function scene() {
  const base = flat(BW, BH)
  return { base, c: wrap(base, BLEED.left, BLEED.top) }
}
/** Elipse cheia; fn(u, v) com u, v em [−1, 1] devolve a cor. */
function ellipse(c, cx, cy, rx, ry, fn) {
  c.paint(Math.floor(cx - rx), Math.floor(cy - ry), Math.ceil(2 * rx) + 1, Math.ceil(2 * ry) + 1, (x, y) => {
    const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry
    return u * u + v * v <= 1 ? (typeof fn === 'function' ? fn(u, v) : fn) : null
  })
}
/** Anel de 1 px por fora de um retângulo (hover/seleção, regra 13). */
export function ring(c, [x, y, w, h], color = 'gold-2') {
  c.rect(x - 1, y - 1, w + 2, 1, color); c.rect(x - 1, y + h, w + 2, 1, color)
  c.rect(x - 1, y, 1, h, color); c.rect(x + w, y, 1, h, color)
}
const inRects = (rects) => (x, y) => rects.some(([rx, ry, rw, rh]) => x >= rx && y >= ry && x < rx + rw && y < ry + rh)

// ---------- cenário ----------
/** Parede do fundo: listras de 8 px; a partir de `lightFrom`, na luz da janela. */
function backWall(c, yEnd, lightFrom = Infinity, x0 = X0) {
  c.paint(x0, Y0, X1 - x0, yEnd - Y0, (x) => {
    const s = mod(Math.floor(x / 8), 2)
    return x >= lightFrom ? (s ? 'wall-3' : 'wall-4') : (s ? 'wall-1' : 'wall-2')
  })
  c.rect(x0, yEnd - 1, X1 - x0, 1, 'wall-0') // oclusão sobre o tampo
}
/** Parede esquerda encurtada (listras de 4 px) até a quina. */
function leftWall(c, corner, yEnd) {
  c.paint(X0, Y0, corner - X0, yEnd - Y0, (x) => (mod(Math.floor(x / 4), 2) ? 'wall-3' : 'wall-4'))
  c.rect(corner, Y0, 1, yEnd - Y0, 'wall-0')
}
const grain = (x, y) => mod(Math.floor(y / 2), 3) === 0 && hash(Math.floor(x / 7), Math.floor(y / 2)) > 0.55
/** Tampo visto de cima (`top` = linha do fundo), aresta da frente em `front`, frente de 11 px e o vão escuro. */
function desk(c, top, front) {
  c.paint(X0, top, X1 - X0, Y1 - top, (x, y) => {
    if (y === top) return 'wood-2'
    if (y < front) return grain(x, y) ? 'wood-5' : 'wood-6'
    const k = y - front
    if (k === 0) return 'wood-7'
    if (k <= 7) return 'wood-5'
    if (k <= 11) return 'wood-4'
    if (k === 12) return 'outline'
    return k < 15 ? 'wood-0' : 'mauve-0'
  })
}

/**
 * Vidro da janela do headset no entardecer (toDusk, closeup-bleed.mjs): cortina em x 302 (+22 de cortina, +4 de
 * batente), vidro até o peitoril (y 96). Mesmo céu de pôr do sol da prateleira e do computador.
 */
export const HEADSET_DUSK_WINDOW = {
  glass: (x, y) => x >= 328 && y <= 96,
  top: Y0, bottom: 96, sun: [372, 84],
  clouds: [[352, -24, 12, 1.6], [384, 26, 10, 1.4], [346, 58, 8, 1.2]],
}

/** Cortina (gold) + janela à direita (`x` = começo da cortina). `night` troca o vidro. */
function curtainAndWindow(c, x, yEnd, night) {
  const cw = 22
  c.object((l) => l.paint(x, Y0, cw, yEnd - Y0 - 1, (i) => {
    const f = mod(i - x, 7)
    return f === 0 ? 'gold-0' : f === 1 || f === 5 ? 'gold-3' : 'gold-1'
  }))
  const g0 = x + cw + 4
  c.paint(x + cw, Y0, X1 - x - cw, 104 - Y0, (i, j) => {
    if (i < g0 || j > 96) return i === g0 - 1 || j === 97 ? 'cream-0' : 'cream-2'
    if (night) return 'teal-0'
    return mod(i + j, 46) < 3 ? 'sky-1' : 'sky-0'
  })
  c.rect(x + cw - 1, 98, X1 - x - cw + 1, 4, 'cream-2') // peitoril
  c.rect(x + cw - 1, 102, X1 - x - cw + 1, 2, 'cream-1')
  const stars = [[g0 + 8, 10], [g0 + 30, 34], [g0 + 52, 16], [g0 + 18, 62], [g0 + 44, 80], [g0 + 66, -30], [g0 + 12, -50]]
  if (night) for (const [sx, sy] of stars) c.set(sx, sy, 'cream-3')
  return stars.map(([sx, sy]) => [sx, sy, 1, 1])
}

// ---------- capas geradas por código ----------
function wrapTitle(str, max) {
  const out = []
  let line = ''
  for (const w of str.split(' ')) {
    if (line && (line + ' ' + w).length > max) { out.push(line); line = w } else line = line ? line + ' ' + w : w
  }
  if (line) out.push(line)
  return out.map((l) => l.slice(0, max)).slice(0, 2)
}
/** Pixel do motivo numa capa s×s (u, v a partir do canto; `top` = linhas reservadas para o título). */
function motifPixel(m, u, v, s, top, k) {
  const cx = s / 2, cy = top + (s - top) / 2
  const d = Math.hypot(u + 0.5 - cx, v + 0.5 - cy)
  switch (m) {
    case 'sun': {
      if (v >= s - 7) return mod(u + v, 4) < 2 ? k.dark : k.bg
      return d < (s - top) * 0.32 ? k.fg : null
    }
    case 'rings': return v >= top && mod(Math.floor(d), 4) < 2 && d < (s - top) * 0.55 ? (d < 3 ? k.dark : k.fg) : null
    case 'waves': return v >= top + 2 && mod(v + Math.round(2 * Math.sin(u / 2.5)), 6) < 2 ? k.fg : null
    case 'stripes': return v >= top && mod(u + v, 8) < 3 ? k.fg : v >= top && mod(u + v, 8) === 3 ? k.dark : null
    case 'grid': return v >= top + 1 && mod(u, 4) === 1 && mod(v, 4) === 1 ? k.fg : v >= top && Math.abs(u + 0.5 - cx) < 5 && Math.abs(v + 0.5 - cy) < 5 ? k.dark : null
    case 'triangle': {
      const h = s - top - 4, w = (v - top - 2) * (s - 6) / h
      if (v >= top + 2 && v < s - 2 && Math.abs(u + 0.5 - cx) < w / 2) return v > s - 6 ? k.dark : k.fg
      return null
    }
    case 'diamond': return v >= top && Math.abs(u + 0.5 - cx) + Math.abs(v + 0.5 - cy) < (s - top) * 0.42 ? (mod(u + v, 3) ? k.fg : k.dark) : null
    default: return null
  }
}
/** Capa quadrada s×s em (x, y) com motivo e título (até 2 linhas de fonte 3×5). Sem contorno (quem chama contorna). */
export function coverArt(c, x, y, s, k, title) {
  const lines = wrapTitle(title, Math.floor((s - 3) / 4))
  const top = 3 + lines.length * 6
  c.paint(x, y, s, s, (i, j) => motifPixel(k.motif, i - x, j - y, s, top, k) ?? k.bg)
  lines.forEach((l, n) => text(c, x + 2, y + 2 + n * 6, l, k.ink))
}


// ---------- raymarching de SDF (objeto grande) ----------
const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z)
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25 }
function sdRoundBox(x, y, z, bx, by, bz, r) {
  const qx = Math.abs(x) - bx + r, qy = Math.abs(y) - by + r, qz = Math.abs(z) - bz + r
  return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r
}
/** Cilindro arredondado: eixo `a` ('x' | 'y'), raio r, meia-altura h, arredondamento k. */
function sdCyl(x, y, z, a, r, h, k = 0) {
  const [ax, rad] = a === 'x' ? [x, Math.hypot(y, z)] : [y, Math.hypot(x, z)]
  const dx = rad - r + k, dy = Math.abs(ax) - h + k
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - k
}
function sdEllipsoid(x, y, z, rx, ry, rz) {
  const k0 = len3(x / rx, y / ry, z / rz), k1 = len3(x / (rx * rx), y / (ry * ry), z / (rz * rz))
  return (k0 * (k0 - 1)) / k1
}
/** Vista → objeto: desfaz o roll (inclinação no plano da tela), o pitch (em x) e o yaw (em y). */
const rot = (x0, y0, z, pitch, yaw, roll = 0) => {
  const cr = Math.cos(roll), sr = Math.sin(roll)
  const x = x0 * cr + y0 * sr, y = -x0 * sr + y0 * cr
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  const y1 = y * cp - z * sp, z1 = y * sp + z * cp
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  return [x * cy + z1 * sy, y1, -x * sy + z1 * cy]
}
const unit = (v) => { const n = len3(...v); return v.map((a) => a / n) }
const LIGHT = unit([-0.55, 0.7, 0.45]) // de cima, à esquerda, um pouco de frente
const HALF = unit([LIGHT[0], LIGHT[1], LIGHT[2] + 1])

/**
 * Renderiza um SDF numa caixa w×h (px) e devolve { px: Map('x,y' → token) } com contorno por fora (1 px) e nas
 * quebras de profundidade (o pixel de trás vira `outline`). model = { sdf(x, y, z) → [d, mat],
 * color(mat, p, n, light) → token, pitch, yaw, scale }.
 */
function renderSdf(model, w, h) {
  const { sdf, color, pitch, yaw, roll = 0, scale = 1 } = model
  const field = (x, y, z) => { const [ox, oy, oz] = rot(x / scale, y / scale, z / scale, pitch, yaw, roll); return sdf(ox, oy, oz) }
  const T = new Float32Array(w * h).fill(Infinity)
  const tok = new Array(w * h).fill(null)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = i + 0.5 - w / 2, v = h / 2 - (j + 0.5)
    let t = 0, hit = null
    for (let s = 0; s < 200 && t < 600; s++) {
      const z = 300 - t
      const [d, m] = field(u, v, z)
      if (d * scale < 0.04) { hit = { z, m }; break }
      t += Math.max(d * scale * 0.9, 0.05)
    }
    if (!hit) continue
    const e = 0.15, z = hit.z
    const n = unit([
      field(u + e, v, z)[0] - field(u - e, v, z)[0],
      field(u, v + e, z)[0] - field(u, v - e, z)[0],
      field(u, v, z + e)[0] - field(u, v, z - e)[0],
    ])
    const ndl = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]
    const spec = Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]) ** 30
    const nObj = rot(n[0], n[1], n[2], pitch, yaw, roll)
    T[j * w + i] = t
    tok[j * w + i] = color(hit.m, rot(u / scale, v / scale, z / scale, pitch, yaw, roll), nObj, { ndl, spec })
  }
  const out = new Map()
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i
    if (!tok[k]) continue
    let edge = false
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj
      if (ni < 0 || nj < 0 || ni >= w || nj >= h || !tok[nj * w + ni]) { edge = true; break }
      if (T[nj * w + ni] < T[k] - 6) { edge = true; break }
    }
    out.set(`${i},${j}`, edge ? 'outline' : tok[k])
  }
  return { px: out }
}
/** Tom da rampa (escuro → claro) pela luz; brilho especular forte pega o último tom. */
function ramp(tones, { ndl, spec }, specMin = 0.5) {
  if (spec > specMin) return tones[tones.length - 1]
  const t = Math.min(0.999, Math.max(0, (ndl + 0.35) / 1.25))
  return tones[Math.min(tones.length - 2, Math.floor(t * (tones.length - 1)))]
}
const keyXY = (key) => key.split(',').map(Number)
function boxOf(map) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const key of map.keys()) { const [x, y] = keyXY(key); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1]
}
/** Desenha o sprite com centro em x `cx` e base em `base`. Devolve o rect ocupado na ilustração. */
function placeSprite(c, sprite, cx, base) {
  const [x0, y0, w, h] = boxOf(sprite.px)
  const ox = Math.round(cx - w / 2), oy = base - h
  c.object((o) => { for (const [key, tk] of sprite.px) { const [i, j] = keyXY(key); o.set(ox + i - x0, oy + j - y0, tk) } }, { outline: false })
  return [ox, oy, w, h]
}

// ---------- headset 3D (grafite, com anel de LED) ----------
// O redesenho laranja de 2026-11-10 foi revertido a pedido do Davi; ficou só a flutuação (camada `object/*`).
const HS_R = 34 // raio da haste
const HEADSET_MODEL = {
  pitch: 0.2, yaw: -0.62, scale: 1.45,
  sdf(x, y, z) {
    const R = HS_R
    const rr = Math.hypot(x, y)
    // haste: metade de cima de um toro de seção retangular arredondada + almofada por dentro
    let best = [Math.max(sdRoundBox(rr - R, 0, z, 3, 0.01, 7, 2.5) - 0.5, -(y + 1)), 'band']
    const cushion = Math.max(sdRoundBox(rr - (R - 4.5), 0, z, 2.2, 0.01, 5.5, 2), -(y - 6))
    if (cushion < best[0]) best = [cushion, 'cushion']
    for (const sx of [-1, 1]) {
      const cx = sx * (R + 0.5)
      const slider = sdRoundBox(x - cx, y + 9, z, 2, 10, 3, 1)
      if (slider < best[0]) best = [slider, 'metal']
      const yoke = sdRoundBox(x - cx, y + 20, z, 3.5, 3, 13, 2)
      if (yoke < best[0]) best = [yoke, 'shell']
      const ey = (y + 34) / 1.18 // concha oval
      const shell = sdCyl(x - sx * (R + 3), ey, z, 'x', 15, 5.5, 3.5)
      if (shell < best[0]) best = [shell, 'shell']
      const pad = sdCyl(x - sx * (R - 4.5), ey, z, 'x', 13.5, 3.2, 3)
      if (pad < best[0]) best = [pad, 'pad']
    }
    return best
  },
  color(m, [x, y, z], n, light) {
    const dark5 = ['outline', 'graphite-0', 'graphite-1', 'graphite-2', 'graphite-3']
    if (m === 'shell') {
      if (Math.abs(x) > HS_R + 7.8) {
        const d = Math.hypot((y + 34) / 1.18, z)
        if (d > 7.5 && d < 9.4) return d < 8.5 ? 'sky-0' : 'sky-2' // anel de LED (luz)
        if (d < 4) return ramp(['outline', 'graphite-0', 'graphite-1', 'graphite-2'], light)
      }
      return ramp(dark5, light)
    }
    if (m === 'band') return ramp(dark5, light)
    if (m === 'metal') return ramp(['graphite-2', 'cream-0', 'cream-1', 'cream-2', 'cream-3'], light, 0.35)
    return ramp(['outline', 'graphite-0', 'graphite-1', 'graphite-2'], light, 0.9) // almofadas: tecido fosco
  },
}

// ---------- controle 3D ----------
const BTN = { pink: ['red-1', 'pink', 'cream-3'], sky: ['blue-0', 'sky-0', 'sky-2'], red: ['red-0', 'red-2', 'red-3'], gold: ['gold-0', 'gold-1', 'gold-3'] }
const CTRL_BUTTONS = [[0, -7, 'pink'], [-7, 0, 'sky'], [7, 0, 'red'], [0, 7, 'gold']]
const CONTROLLER_MODEL = {
  pitch: -0.82, yaw: 0.22, scale: 1.25,
  sdf(x, y, z) {
    const grips = Math.min(sdEllipsoid(x + 38, y, z - 4, 23, 9, 22), sdEllipsoid(x - 38, y, z - 4, 23, 9, 22))
    let best = [smin(sdRoundBox(x, y, z + 2, 30, 7, 15, 6), grips, 10), 'body']
    const pad = Math.min(sdRoundBox(x + 38, y - 8, z - 3, 9, 2.5, 3, 1), sdRoundBox(x + 38, y - 8, z - 3, 3, 2.5, 9, 1))
    if (pad < best[0]) best = [pad, 'dpad']
    for (const [dx, dz, col] of CTRL_BUTTONS) {
      const b = sdCyl(x - 38 - dx, y - 8, z - 3 - dz, 'y', 3.6, 2.4, 1)
      if (b < best[0]) best = [b, col]
    }
    for (const sx of [-1, 1]) {
      const s = sdRoundBox(x - sx * 8, y - 6.5, z - 5, 3.5, 1.6, 1.6, 1.4)
      if (s < best[0]) best = [s, 'start']
      const sh = sdRoundBox(x - sx * 32, y - 1, z + 17, 12, 4.5, 4, 3.5)
      if (sh < best[0]) best = [sh, 'shoulder']
    }
    return best
  },
  color(m, [x, , z], n, light) {
    if (m === 'body') {
      for (const sx of [-1, 1]) {
        const d = Math.hypot(x - sx * 38, z - 3)
        if (n[1] > 0.55 && d > 15 && d < 17) return ramp(['graphite-3', 'wall-0', 'wall-1', 'wall-2'], light) // anel do punho
      }
      return ramp(['graphite-3', 'wall-0', 'wall-2', 'wall-4', 'wall-5'], light)
    }
    if (m === 'dpad') return ramp(['leaf-0', 'leaf-1', 'leaf-2'], light)
    if (m === 'shoulder') return ramp(['blue-0', 'blue-1', 'sky-1'], light)
    if (m === 'start') return ramp(['gold-0', 'gold-2', 'gold-3'], light)
    return ramp(BTN[m], light)
  },
}

// ---------- item flutuante (capa do álbum / caixa do jogo) ----------
/** Extrusão oblíqua (para cima e para a direita), como os objetos ampliados da prateleira. */
function extrudeMap(front, depth, top, side) {
  const out = new Map()
  for (let k = depth; k >= 1; k--) {
    for (const key of front.keys()) {
      const [x, y] = keyXY(key)
      out.set(`${x + k},${y - k}`, front.has(`${x},${y - 1}`) ? side : top)
    }
  }
  for (const [key, t] of front) out.set(key, t)
  return out
}
/** Desenha numa tela de captura e devolve o Map dos pixels pintados (px da ilustração). */
function capture(draw) {
  const px = new Map()
  const set = (x, y, t) => { if (t) px.set(`${x},${y}`, t) }
  draw({
    set,
    rect: (x, y, w, h, t) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, t) },
    paint: (x, y, w, h, fn) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, fn(i, j)) },
  })
  return px
}
const drawMap = (c, map) => c.object((o) => { for (const [key, t] of map) { const [x, y] = keyXY(key); o.set(x, y, t) } })

/** Layout comum às duas visões de perto (px da ilustração). */
export const STAGE = {
  item: [204, 40, 64, 64], // frente da capa (álbum); a caixa do jogo é 54×66 centrada nela
  shadow: [236, 148, 26, 4], // elipse no tampo: centro x, y, raios (fica parada enquanto o item flutua)
  caption: [176, 112, 120, 24], // legenda do DOM: título (linha 1) e artista / gênero (linha 2), centrada
  arrows: { prev: [178, 65, 16, 14], next: [282, 65, 16, 14] },
  float: 4, // amplitude da flutuação (px da arte), igual à da prateleira
}
export const DESK = { top: 132, front: 170 }
/** Objeto 3D: centro x e base y (px da ilustração); sombra parada no tampo: centro x, y e raios. */
export const OBJECT_AT = { headset: [92, 159], controller: [90, 103] }
export const OBJECT_SHADOW = { headset: [92, 163, 50, 5], controller: [90, 148, 58, 6] }
/** Flutuação do objeto 3D: mesma amplitude e período do item, defasada meio período para não subir junto. */
export const OBJECT_FLOAT = { amplitude: 4, periodMs: 1800, phaseMs: 1800 }

function arrowButton(c, [x, y, w, h], dir) {
  drawMap(c, extrudeMap(capture((m) => m.rect(x, y, w, h, 'gold-1')), 2, 'gold-3', 'gold-0'))
  const mx = x + Math.floor(w / 2), my = y + Math.floor(h / 2)
  for (let k = 0; k < 4; k++) for (let t = -k; t <= k; t++) c.set(mx + (dir < 0 ? -2 + k : 1 - k), my + t, 'graphite-1')
}
const contact = (c, cx, cy, rx, ry, inner = 0.55) => ellipse(c, cx, cy, rx, ry, (u, v) => (u * u + v * v > inner ? 'wood-5' : 'wood-4'))

function albumItem(a) {
  const [x, y, s] = STAGE.item
  const disc = capture((m) => {
    const cx = x + s / 2 + 10, cy = y + 2, r = 27
    m.paint(cx - r, cy - r, 2 * r + 1, 2 * r + 1, (i, j) => {
      const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy)
      if (d > r) return null
      if (d < 1.6) return 'wall-2'
      if (d < 9) return d < 8 ? a.cover.fg : a.cover.dark
      const ang = Math.atan2(j - cy, i - cx)
      if (d > 13 && d < 23 && ang > -2.7 && ang < -2.0) return 'graphite-2' // reflexo nos sulcos
      return Math.floor(d) % 3 === 0 ? 'graphite-1' : 'graphite-0'
    })
  })
  const sleeve = extrudeMap(capture((m) => coverArt(m, x, y, s, a.cover, a.coverTitle ?? a.title)), 3, 'cream-2', 'cream-0')
  return [disc, sleeve]
}
function gameItem(g) {
  const draw = ICON_DRAW[iconOf(g.icon)]
  if (!draw) throw new Error(`games.json ${g.id}: ícone desconhecido (${g.icon}); aceitos: ${GAME_ICONS.join(', ')}`)
  return draw()
}

// ---------- ícones dos jogos (item flutuante do controle, revisão de 2026-11-12) ----------
// Desenhos próprios, sem sprite oficial nem logo rasterizado. Bloco de grama e bola lembram o jogo pelo tema; o V do
// Valorant, a pokébola e o cogumelo com olhos são homenagens pedidas pelo Davi (2026-11-12, ver specs/9-controle.md).
// Luz de cima à esquerda, 3–4 tons por material, contorno `outline` (dado pelo drawMap).
/** Quadrado do ícone (px da ilustração): centrado no mesmo ponto da antiga caixa (frente 209, 38, 54, 66). */
export const ICON_BOX = [208, 43, 56, 56]
/** Ícones aceitos em games.json (`icon`). */
export const GAME_ICONS = ['valorant-v', 'grass-block', 'soccer-ball', 'pokeball', 'mushroom']
/** Apelido aceito em games.json (nome usado no briefing). */
export const ICON_ALIASES = { 'dirt-block': 'grass-block' }
export const iconOf = (icon) => (GAME_ICONS.includes(icon) ? icon : ICON_ALIASES[icon])

const SPHERE_L = unit([-0.55, 0.7, 0.45])
/** Tom de uma esfera no ponto (u, v) ∈ disco unitário (v para baixo), rampa escuro → claro. */
function sphereTone(u, v, tones) {
  const nz = Math.sqrt(Math.max(0, 1 - u * u - v * v))
  const d = u * SPHERE_L[0] + -v * SPHERE_L[1] + nz * SPHERE_L[2]
  const spec = d > 0.97
  if (spec) return tones[tones.length - 1]
  const t = Math.min(0.999, Math.max(0, (d + 0.2) / 1.15))
  return tones[Math.min(tones.length - 2, Math.floor(t * (tones.length - 1)))]
}
function disc(m, cx, cy, r, fn) {
  m.paint(Math.floor(cx - r) - 1, Math.floor(cy - r) - 1, Math.ceil(2 * r) + 3, Math.ceil(2 * r) + 3, (x, y) => {
    const u = (x + 0.5 - cx) / r, v = (y + 0.5 - cy) / r
    return u * u + v * v <= 1 ? fn(u, v, x, y) : null
  })
}
const inPoly = (x, y, pts) => {
  let ins = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins
  }
  return ins
}

function iconGrassBlock() {
  // Bloco isométrico: topo de grama, lados de terra com franja de grama; luz de cima à esquerda (lado esquerdo claro).
  const [x, y, s] = ICON_BOX
  const cx = x + s / 2, top = y + 3, half = 26, depth = 13, height = 27
  const map = capture((m) => {
    m.paint(x - 2, y, s + 4, s + 2, (i, j) => {
      const dx = i + 0.5 - cx, dy = j + 0.5 - top
      const g = hash(i, j)
      // topo (losango)
      if (Math.abs(dx) / half + Math.abs(dy - depth) / depth <= 1) {
        const edge = dx - (dy - depth) * 2 > half - 3 || -dx + (dy - depth) * 2 > half + 4
        return g > 0.82 ? 'leaf-0' : g < 0.18 || edge ? 'leaf-2' : 'leaf-1'
      }
      // lados: abaixo das arestas de baixo do losango
      const yEdge = depth + depth * (1 - Math.abs(dx) / half) // y da aresta de baixo naquele x
      if (Math.abs(dx) <= half && dy > yEdge && dy <= yEdge + height) {
        const k = dy - yEdge // linhas abaixo da aresta
        const left = dx < 0
        if (k < 4 || (k < 7 && g > 0.6)) return left ? 'leaf-1' : 'leaf-0' // franja de grama
        if (g > 0.86) return left ? 'wood-1' : 'wood-0'
        if (g < 0.12) return left ? 'wood-5' : 'wood-3'
        return left ? 'wood-4' : 'wood-2'
      }
      return null
    })
  })
  return [map]
}

function iconSoccerBall() {
  // Bola: esfera creme sombreada + pentágono central e cinco meio-pentágonos na borda (grafite).
  const [x, y, s] = ICON_BOX
  const cx = x + s / 2, cy = y + s / 2, r = 25
  const pent = (px, py, rr, rot) => Array.from({ length: 5 }, (_, k) => { const a = rot + (k * 2 * Math.PI) / 5; return [px + rr * Math.cos(a), py + rr * Math.sin(a)] })
  const center = pent(cx - 2, cy - 2, 8.5, -Math.PI / 2)
  const ring = Array.from({ length: 5 }, (_, k) => { const a = -Math.PI / 2 + Math.PI / 5 + (k * 2 * Math.PI) / 5; return pent(cx - 2 + 22 * Math.cos(a), cy - 2 + 22 * Math.sin(a), 8, a + Math.PI / 5) })
  const map = capture((m) => disc(m, cx, cy, r, (u, v, i, j) => {
    const px = i + 0.5, py = j + 0.5
    const patch = inPoly(px, py, center) || ring.some((p) => inPoly(px, py, p))
    return sphereTone(u, v, patch ? ['outline', 'graphite-0', 'graphite-1', 'graphite-2'] : ['cream-0', 'cream-1', 'cream-2', 'cream-3'])
  }))
  // costuras: linhas finas do pentágono central até os de fora
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5
    for (let t = 9; t < 15; t++) {
      const key = `${Math.round(cx - 2 + t * Math.cos(a))},${Math.round(cy - 2 + t * Math.sin(a))}`
      if (map.has(key)) map.set(key, 'cream-0')
    }
  }
  return [map]
}

// Símbolos dos jogos pedidos pelo Davi em 2026-11-12 (uso referencial em portfolio pessoal, decisão dele):
// desenhados à mão aqui, sem copiar sprite oficial nem rasterizar logo.
function iconValorantV() {
  // V anguloso: haste esquerda longa descendo até o centro de baixo + triângulo menor no alto à direita; extrudado 3 px.
  const [x, y] = ICON_BOX
  const L = [[3, 6], [36, 52], [20, 52], [3, 28]].map(([a, b]) => [x + a, y + b])
  const R = [[53, 6], [53, 24], [43, 38], [29, 38]].map(([a, b]) => [x + a, y + b])
  const front = capture((m) => m.paint(x, y, 58, 58, (i, j) => {
    const px = i + 0.5, py = j + 0.5
    if (!inPoly(px, py, L) && !inPoly(px, py, R)) return null
    const gx = px - x, gy = py - y
    return gx + gy * 0.5 < 18 ? 'red-3' : gx + gy * 0.5 > 46 ? 'red-1' : 'red-2'
  }))
  return [extrudeMap(front, 3, 'red-3', 'red-0')]
}

function iconPokeball() {
  // Esfera: metade de cima vermelha, de baixo creme, faixa escura no meio e botão central.
  const [x, y, s] = ICON_BOX
  const cx = x + s / 2, cy = y + s / 2, r = 25
  const map = capture((m) => disc(m, cx, cy, r, (u, v, i, j) => {
    const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy)
    if (d < 4.5) return d < 3 && (i - cx) + (j - cy) < 0 ? 'cream-3' : 'cream-2'
    if (d < 8) return 'outline'
    if (Math.abs(j + 0.5 - cy) < 2.6) return 'outline'
    return sphereTone(u, v, v < 0 ? ['red-0', 'red-1', 'red-2', 'red-3'] : ['cream-0', 'cream-1', 'cream-2', 'cream-3'])
  }))
  return [map]
}

function iconMushroomFace() {
  // Super Cogumelo (referência do Davi, 2026-11-12): silhueta quase circular, pinta branca grande no alto e meias
  // pintas nas laterais, rosto creme largo de base reta e dois olhos altos com brilho. Contorno interno `outline`
  // entre chapéu, pintas e rosto. Desenhado aqui na nossa escala e paleta, sem copiar a imagem pixel a pixel.
  const [x, y, s] = ICON_BOX
  const cx = x + s / 2, cy = y + 27, R = 27
  const faceCy = y + 44, faceRx = 18, faceRy = 12, faceBottom = y + 54
  const spots = [[cx, y + 17, 12.5], [cx - 29, y + 25, 11], [cx + 29, y + 25, 11]]
  const region = (px, py) => {
    const inFace = ((px - cx) / faceRx) ** 2 + ((py - faceCy) / faceRy) ** 2 <= 1 && py <= faceBottom
    if (inFace) return 'face'
    const capBottom = y + 50 - Math.max(0, Math.abs(px - cx) - 14) * 0.35
    if ((px - cx) ** 2 + (py - cy) ** 2 > R * R || py > capBottom) return null
    return spots.some(([sx, sy, sr]) => Math.hypot(px - sx, py - sy) < sr) ? 'spot' : 'cap'
  }
  const map = capture((m) => m.paint(x - 1, y - 1, s + 2, s + 2, (i, j) => {
    const px = i + 0.5, py = j + 0.5
    const r = region(px, py)
    if (!r) return null
    // contorno interno: borda de pinta e de rosto encostada no chapéu
    if (r !== 'cap' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => region(px + dx, py + dy) === 'cap')) return 'outline'
    if (r === 'face') {
      for (const ex of [cx - 7, cx + 7]) {
        if (Math.abs(px - ex) < 2.5 && py > faceCy - 6 && py < faceCy + 5) return px < ex && py < faceCy - 3 ? 'cream-3' : 'outline'
      }
      const u = (px - cx) / faceRx
      return u < -0.6 ? 'cream-3' : u > 0.55 || py > faceBottom - 2 ? 'cream-0' : 'cream-1'
    }
    const u = (px - cx) / R, v = (py - cy) / R
    if (r === 'spot') return u + v < -0.5 ? 'cream-3' : u + v > 0.6 ? 'cream-1' : 'cream-2'
    return sphereTone(u, v, ['red-0', 'red-1', 'red-2', 'red-3'])
  }))
  return [map]
}

const ICON_DRAW = { 'valorant-v': iconValorantV, 'grass-block': iconGrassBlock, 'soccer-ball': iconSoccerBall, pokeball: iconPokeball, mushroom: iconMushroomFace }

// ---------- cenas ----------
// `parts` separa as camadas do atlas: `bg` (fundo + as duas sombras paradas no tampo), `object` (o objeto 3D, que
// flutua), `arrows` (setas) e `item` (capa/caixa, que flutua). A cena inteira é a soma das quatro, nessa ordem; o
// build confere pixel a pixel.
const ALL = { bg: true, object: true, item: true, arrows: true }
function stage(c, maps, parts) {
  if (parts.bg) contact(c, ...STAGE.shadow)
  if (parts.arrows) { arrowButton(c, STAGE.arrows.prev, -1); arrowButton(c, STAGE.arrows.next, 1) }
  if (parts.item) for (const m of maps) drawMap(c, m)
  const all = new Map(); for (const m of maps) for (const [k, t] of m) all.set(k, t)
  const keys = parts.item ? new Set(all.keys()) : new Set() // o item (contorno por dentro) fica nas cores de dia à noite
  const [ix, iy, iw, ih] = boxOf(all)
  return { rect: [ix - 1, iy - 1, iw + 2, ih + 2], keys }
}
/** Noite: tudo × tint-night, menos `keys` (px lógicos) e `lightRects`. */
function finish(base, night, keys, lightRects) {
  if (!night) return base.px
  const inR = inRects(lightRects)
  return multiply(base.px, TINT.night, (i) => {
    const x = (i % BW) - BLEED.left, y = Math.floor(i / BW) - BLEED.top
    return keys.has(`${x},${y}`) || inR(x, y)
  })
}

/** Headset: px 480×308 + rects. À noite, o item flutuante fica nas cores de dia (como o destaque da prateleira). */
export function renderHeadsetScene({ night = false, album = ALBUMS[1], parts = ALL } = {}) {
  const { base, c } = scene()
  let object = null, stars = []
  if (parts.bg) {
    backWall(c, DESK.top, 196)
    stars = curtainAndWindow(c, 302, DESK.top, night)
    desk(c, DESK.top, DESK.front)
    contact(c, ...OBJECT_SHADOW.headset, 0.5) // parada; o headset flutua 5 px acima do tampo
  }
  if (parts.object) object = placeSprite(c, renderSdf(HEADSET_MODEL, 230, 210), ...OBJECT_AT.headset)
  const { rect: item, keys } = stage(c, albumItem(album), parts)
  return { px: finish(base, night, keys, night ? stars : []), rects: { object, item } }
}
/** Controle: mesmo layout; fundo equivalente no canto (parede esquerda + parede do fundo), sem janela. */
export function renderControllerScene({ night = false, game = GAMES[2], parts = ALL } = {}) {
  const { base, c } = scene()
  let object = null
  if (parts.bg) {
    leftWall(c, 26, DESK.top)
    backWall(c, DESK.top, 236, 27)
    desk(c, DESK.top, DESK.front)
    // Ajuste do Davi (2026-11-10): o controle fica suspenso, com o centro vertical alinhado ao da caixa do jogo
    // (y ≈ 71); a sombra no tampo fica na mesma linha da sombra do item (y 148), como a de um objeto flutuando.
    contact(c, ...OBJECT_SHADOW.controller, 0.6)
  }
  if (parts.object) object = placeSprite(c, renderSdf(CONTROLLER_MODEL, 200, 130), ...OBJECT_AT.controller)
  const { rect: item, keys } = stage(c, gameItem(game), parts)
  return { px: finish(base, night, keys, []), rects: { object, item } }
}

// ---------- mockup do DOM (só prévia: no jogo é texto VT323 com contorno, como a legenda da prateleira) ----------
function outlined(c, x, y, str, color, scale) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2]]) text(c, x + dx, y + dy, str, 'outline', scale)
  text(c, x, y, str, color, scale)
}
export function mockCaption(c, line1, line2) {
  const [x, y, w] = STAGE.caption
  const cx = x + w / 2
  outlined(c, Math.round(cx - textW(line1, 2) / 2), y + 1, line1, 'cream-3', 2)
  outlined(c, Math.round(cx - textW(line2) / 2), y + 15, line2, 'gold-3', 1)
}
export { wrap as wrapCanvas }
