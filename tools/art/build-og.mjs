// Imagem de compartilhamento (Open Graph) e ícones do site (M5). Doc: docs/arte/og-e-icones.md.
// Uso: node tools/art/build-og.mjs   (depois de `pnpm art`, porque lê os sprites exportados em public/assets/)
//
// O quarto é montado a partir dos mesmos PNG/JSON que o jogo carrega: cada sprite vai para o ponto do Tiled
// (meta.quartoPixel.tile) menos a âncora, com a tag do período escolhida pelas mesmas regras de
// src/game/systems/period.ts e o tint MULTIPLY do período em tudo que não é luz (DayNight.ts).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync, inflateSync } from 'node:zlib'
import { rgba } from './lib.mjs'
import { flat, FONT_5x7 } from './flat.mjs'
import { P, TINT, UI_BG } from './palette.mjs'
import { OX, OY, RH, RW } from './room.mjs'
import { blit, bounds, crop, multiply } from './sheet.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const at = (rel) => { const p = resolve(root, rel); mkdirSync(dirname(p), { recursive: true }); return p }

/** Período da imagem de compartilhamento: `dusk` (luminária e monitor acesos, tom quente). */
const PERIOD = process.argv.find((a) => a.startsWith('--period='))?.slice(9) ?? 'dusk'

// ---------- PNG (leitura dos sprites exportados; RGBA 8 bits, como o writePng do lib.mjs grava) ----------
function readPng(path) {
  const buf = readFileSync(path)
  let o = 8, W = 0, H = 0, type = 0
  const idat = []
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), kind = buf.toString('ascii', o + 4, o + 8), data = buf.subarray(o + 8, o + 8 + len)
    if (kind === 'IHDR') { W = data.readUInt32BE(0); H = data.readUInt32BE(4); type = data[9]; if (data[8] !== 8) throw new Error(`${path}: só 8 bits`) }
    if (kind === 'IDAT') idat.push(data)
    o += 12 + len
  }
  const bpp = type === 6 ? 4 : type === 2 ? 3 : 0
  if (!bpp) throw new Error(`${path}: tipo de cor ${type} não suportado`)
  const raw = inflateSync(Buffer.concat(idat)), stride = W * bpp
  const cur = Buffer.alloc(stride), prev = Buffer.alloc(stride)
  const px = new Uint8Array(W * H * 4)
  for (let y = 0; y < H; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0
      const pr = () => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
      cur[i] = (line[i] + [0, a, b, (a + b) >> 1, f === 4 ? pr() : 0][f]) & 255
    }
    for (let x = 0; x < W; x++) px.set(bpp === 4 ? cur.subarray(x * 4, x * 4 + 4) : [...cur.subarray(x * 3, x * 3 + 3), 255], (y * W + x) * 4)
    cur.copy(prev)
  }
  return { W, H, px }
}

// ---------- PNG otimizado (RGB opaco, filtro por linha escolhido pela menor soma, deflate nível 9) ----------
function writeOpaquePng(path, px, W, H, scale = 1) {
  const OW = W * scale, OH = H * scale, stride = OW * 3
  const lines = []
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < OH; y++) {
    const cur = Buffer.alloc(stride)
    for (let x = 0; x < OW; x++) {
      const s = (Math.floor(y / scale) * W + Math.floor(x / scale)) * 4
      if (px[s + 3] !== 255) throw new Error(`${path}: pixel transparente em (${x}, ${y})`)
      cur[x * 3] = px[s]; cur[x * 3 + 1] = px[s + 1]; cur[x * 3 + 2] = px[s + 2]
    }
    let best = null, bestSum = Infinity
    for (const f of [0, 1, 2]) {
      const out = Buffer.alloc(stride + 1)
      out[0] = f
      let sum = 0
      for (let i = 0; i < stride; i++) {
        const v = (cur[i] - (f === 1 ? (i >= 3 ? cur[i - 3] : 0) : f === 2 ? prev[i] : 0)) & 255
        out[i + 1] = v
        sum += v < 128 ? v : 256 - v
      }
      if (sum < bestSum) { best = out; bestSum = sum }
    }
    lines.push(best)
    prev = cur
  }
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data])
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body))
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(OW, 0); ihdr.writeUInt32BE(OH, 4); ihdr.set([8, 2, 0, 0, 0], 8)
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(lines), { level: 9, memLevel: 9 })), chunk('IEND', Buffer.alloc(0)),
  ])
  writeFileSync(path, png)
  return png.length
}
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c })
function crc32(buf) { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0 }

// ---------- quarto composto ----------
// Mesma ordem de profundidade da prévia do build.mjs (as luzes já vêm recortadas pelo que fica na frente).
const ORDER = [
  'tiles/room-shell', 'objects/light-window', 'objects/window', 'objects/bookshelf', 'objects/frames', 'objects/light-frames',
  'objects/computer', 'objects/desk-lamp', 'objects/light-computer', 'objects/journal', 'objects/light-journal',
  'objects/controller', 'objects/headset', 'objects/light-headset', 'objects/desk-chair', 'objects/pc-tower',
  'objects/bed', 'objects/phone', 'objects/light-phone',
]
// Cópia das regras de src/game/systems/period.ts (pickTag).
const PERIOD_TAGS = { day: ['day', 'off'], dusk: ['dusk', 'on', 'night'], night: ['night', 'on'] }
const PERIODIC = new Set(['day', 'dusk', 'night', 'on', 'off'])
function pickTag(tags, period) {
  if (!tags.length) return { visible: true }
  for (const name of PERIOD_TAGS[period]) { const t = tags.find((x) => x.name === name); if (t) return { tag: t, visible: true } }
  const neutral = tags.find((t) => !PERIODIC.has(t.name))
  return neutral ? { tag: neutral, visible: true } : { visible: false }
}

/** Quarto no período, numa tela RW×RH com o canto do fundo em (OX, OY), como a tela do gerador. Fundo transparente. */
export function composeRoom(period) {
  const out = new Uint8Array(RW * RH * 4)
  for (const rel of ORDER) {
    const json = JSON.parse(readFileSync(resolve(root, `public/assets/${rel}.json`), 'utf8'))
    const sheet = readPng(resolve(root, `public/assets/${rel}.png`))
    const { tag, visible } = pickTag(json.meta.frameTags, period)
    if (!visible) continue
    const frame = Object.values(json.frames)[tag ? tag.from : 0].frame
    let cell = crop(sheet.px, sheet.W, sheet.H, frame)
    const qp = json.meta.quartoPixel
    if (!qp.light && period !== 'day') cell = multiply(cell, TINT[period])
    const [c, r] = qp.tile
    blit(out, RW, RH, cell, frame.w, frame.h, OX + (c - r) * 32 - qp.anchor[0], OY + (c + r) * 16 - qp.anchor[1])
  }
  return out
}

// ---------- fonte: FONT_5x7 + letras do nome e de "PORTFOLIO" ----------
const FONT = {
  ...FONT_5x7,
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
}
const textW = (s) => [...s].reduce((w, ch) => w + FONT[ch][0].length + 1, -1)

/** Texto em escala inteira `k` (cada pixel da fonte = k×k), com sombra de 1 pixel-da-fonte para baixo/direita. */
function bigText(c, x, y, str, k, color, shadow) {
  const g = flat(textW(str), 7)
  g.text(0, 0, str, FONT, color)
  for (const [dx, dy, col] of shadow ? [[1, 1, shadow], [0, 0, null]] : [[0, 0, null]]) {
    for (let j = 0; j < 7; j++) for (let i = 0; i < g.W; i++) {
      if (!g.opaque(i, j)) continue
      c.rect(x + (i + dx) * k, y + (j + dy) * k, k, k, col ?? color)
    }
  }
}

// ---------- og-image.png: 1200×630 ----------
const OG_W = 1200, OG_H = 630
const room = composeRoom(PERIOD)
const rb = bounds([room], RW, RH)
const og = flat(OG_W, OG_H)
og.rect(0, 0, OG_W, OG_H, UI_BG)
// Quarto a 1× (o maior inteiro que cabe: a 2× ele teria ~770 px de altura), à direita, centralizado na vertical.
const ROOM_SCALE = 1
const rx = OG_W - 64 - rb.w * ROOM_SCALE, ry = Math.round((OG_H - rb.h * ROOM_SCALE) / 2)
const roomCrop = crop(room, RW, RH, rb)
blit(og.px, OG_W, OG_H, roomCrop, rb.w, rb.h, rx, ry)
// Nome à esquerda: "DAVI" / "NATUME" a 12× (fonte 5×7 → 60×84 px por letra), "PORTFOLIO" a 6×.
const K_NAME = 12, K_SUB = 6, LEFT = 80
const nameH = 7 * K_NAME, gapLines = 2 * K_NAME, subH = 7 * K_SUB, gapSub = 4 * K_SUB
const blockH = nameH * 2 + gapLines + gapSub + subH
let ty = Math.round((OG_H - blockH) / 2)
bigText(og, LEFT, ty, 'DAVI', K_NAME, P['cream-3'])
ty += nameH + gapLines
bigText(og, LEFT, ty, 'NATUME', K_NAME, P['cream-3'])
ty += nameH + gapSub
bigText(og, LEFT, ty, 'PORTFOLIO', K_SUB, P['gold-2'])
if (LEFT + textW('NATUME') * K_NAME + K_NAME > rx - 24) throw new Error('og: o nome encosta no quarto')

const ogKb = writeOpaquePng(at('public/og-image.png'), og.px, OG_W, OG_H) / 1024
if (ogKb > 300) throw new Error(`og-image.png com ${ogKb.toFixed(0)} KB (> 300)`)
// Prévia em miniatura (300 px de largura), só para conferir legibilidade: vizinho mais próximo, 1/4.
const thumb = flat(300, 158)
thumb.paint(0, 0, 300, 158, (x, y) => { const s = (Math.min(OG_H - 1, y * 4) * OG_W + x * 4) * 4; return '#' + [0, 1, 2].map((k) => og.px[s + k].toString(16).padStart(2, '0')).join('') })
writeOpaquePng(at('art-src/previews/og-thumb.png'), thumb.px, 300, 158)

// ---------- ícones: recorte do monitor, de dia (a tela teal com as barras é o que o favicon.svg já desenha) ----------
const dayRoom = composeRoom('day')
// Centro do monitor na tela do quarto: meio da tela [11, 28, 3.9, 4.8, 21, 36] → px (OX + 4(x − y), OY + 2(x + y) − 2z).
const MON = [OX + 4 * (19.5 - 4.35), OY + 2 * (19.5 + 4.35) - 2 * 28.5].map(Math.round)
function icon(path, size, scale) {
  const n = size / scale
  if (!Number.isInteger(n)) throw new Error(`${path}: ${size} não é múltiplo de ${scale}`)
  const c = flat(n, n)
  c.rect(0, 0, n, n, UI_BG) // fundo opaco onde o recorte for transparente
  blit(c.px, n, n, crop(dayRoom, RW, RH, { x: MON[0] - Math.floor(n / 2), y: MON[1] - Math.floor(n / 2), w: n, h: n }), n, n, 0, 0)
  return writeOpaquePng(at(path), c.px, n, n, scale) / 1024
}
const sizes = {
  'public/apple-touch-icon.png': icon('public/apple-touch-icon.png', 180, 2), // 90×90 a 2×
  'public/icon-192.png': icon('public/icon-192.png', 192, 2), // 96×96 a 2×
  'public/icon-512.png': icon('public/icon-512.png', 512, 4), // 128×128 a 4×
}
console.log(`public/og-image.png 1200×630 (${PERIOD}, quarto ${rb.w}×${rb.h} a ${ROOM_SCALE}×) ${ogKb.toFixed(1)} KB`)
for (const [p, kb] of Object.entries(sizes)) console.log(`${p} ${kb.toFixed(1)} KB`)
console.log('art-src/previews/og-thumb.png')
