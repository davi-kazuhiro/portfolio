// Visão de perto do celular (`phone`, M3: Contato + currículo). Aprovada em 2026-11-08: versão A (grafite apoiado no
// travesseiro, roupa de cama A). Spec: docs/arte/specs/6-cama-celular.md. Exportação: tools/art/build-phone.mjs (pnpm art),
// a partir de phoneLayers(). A variação B (na mão) fica só como histórico em node tools/art/build-m3.mjs bed.
//
// O visitante olha a cama do pé para a cabeceira: parede esquerda e cabeceira no alto (sangria), travesseiro,
// lençol dobrado e a coberta; o celular em primeiro plano, em retrato, com a TELA como área de conteúdo do DOM.
// Na arte: aparelho, notch com câmera, barra de status só com ícones, cabeçalho do "app de contato" com avatar
// genérico, botões-ícone (e-mail, maleta = LinkedIn, </> = GitHub, telefone) e os dois botões do currículo (PT/EN).
// Nome, cargos, cidade e rótulos são DOM (mockup 3×5 só na prévia).
// - A: aparelho grafite apoiado no travesseiro (afunda o travesseiro, sombra curta); roupa de cama A (azul).
// - B: mão segurando o celular com capinha vermelha (dedos atrás, polegar na lateral, sombra longa); roupa B.
// O aparelho e todos os rects da tela são IGUAIS nas duas: o DOM não depende da variação.
// Noite: tudo × tint-night, menos o aparelho, a tela e um halo da tela (retângulo arredondado, 10 px em volta) nas cores de dia.
import { rgba } from '../lib.mjs'
import { P, TINT, UI_BG } from '../palette.mjs'
import { flat } from '../flat.mjs'
import { blit, crop, lint, multiply } from '../sheet.mjs'
import { text, textW } from './closeup-bookshelf.mjs'
import { SMALL_ICONS, dotted } from './closeup-journal.mjs'
import { BEDDING } from './bed.mjs'

export const CW = 320
export const CH = 180
export const BLEED = { left: 80, top: 64, right: 80, bottom: 64 }
export const BW = BLEED.left + CW + BLEED.right
export const BH = BLEED.top + CH + BLEED.bottom
const X0 = -BLEED.left, Y0 = -BLEED.top

// ---------- geometria (px da ilustração a 1×) ----------
export const G = {
  wallBottom: -45, // parede esquerda até aqui (sangria de cima)
  head: { cap: -44, bottom: -6 }, // cabeceira: travessa em y −44…−39, painel até −6
  pillow: { cx: 140, cy: 46, a: 196, b: 62 }, // x −56…336, y −16…108
  fold: { top: 104, bottom: 124 }, // lençol dobrado sobre a coberta
  blanketEdge: 214, // aresta da frente da coberta (sangria de baixo); abaixo, a coberta caindo e o estrado
  body: [100, 3, 120, 175], // aparelho (frente), cantos r 12; espessura 3 px para (+1, −1)
  bodyR: 12,
  depth: 3,
  screen: [104, 7, 112, 166], // tela inteira (vidro aceso), cantos r 8
  screenR: 8,
  header: [104, 7, 112, 26], // faixa teal do app (y 7…32)
  notch: [150, 9, 20, 6],
  avatar: { cx: 160, cy: 33, r: 12 },
  content: [108, 20, 104, 146], // área do DOM (dentro da tela, abaixo da barra de status)
  name: [108, 48, 104, 9],
  roles: [108, 58, 104, 24], // 3 linhas de 8
  city: [108, 83, 104, 8],
  divider: [110, 91, 100, 1],
  apps: { y: 95, xs: [110, 136, 162, 188], size: 22, ids: ['email', 'linkedin', 'github', 'phone'] },
  labels: { y: 119, h: 7, w: 26, x0: 108 },
  cvLabel: [108, 128, 104, 7],
  cv: { pt: [110, 137, 48, 18], en: [162, 137, 48, 18], icon: [4, 3], text: [18, 0, 28, 18] },
  home: [145, 167, 30, 2],
  halo: { rect: [90, -8, 143, 195], r: 18 }, // brilho da tela à noite: 10 px em volta do aparelho
}

// Cores do botão-ícone de cada contato (fundo / luz / sombra). Glifo em cream-3.
export const APP_COLORS = {
  email: { fill: 'red-2', hi: 'red-3', dark: 'red-1' },
  linkedin: { fill: 'blue-1', hi: 'sky-1', dark: 'blue-0' },
  github: { fill: 'graphite-2', hi: 'graphite-3', dark: 'graphite-1' },
  phone: { fill: 'leaf-1', hi: 'leaf-2', dark: 'leaf-0' },
}
export const CV_COLORS = { fill: 'gold-1', hi: 'gold-3', dark: 'gold-0', ink: 'wood-0' }
// Currículo ainda sem PDF: botão desativado (papel apagado, seta grafite), sem hover.
export const CV_DISABLED = { fill: 'cream-1', hi: 'cream-2', dark: 'cream-0', ink: 'graphite-3' }

export const VARIANTS = {
  A: { name: 'A — apoiado no travesseiro, grafite', bedding: 'A', case: null, hand: false, shadow: [-5, 5] },
  B: { name: 'B — na mão, capinha vermelha', bedding: 'B', case: { lip: 'red-2', hi: 'red-3', top: 'red-1', side: 'red-0' }, hand: true, shadow: [-8, 9] },
}

// ---------- ícones (x = cor do glifo, o = tom escuro do botão, s = cream-1; '.' = transparente) ----------
export const ICONS16 = {
  email: [
    '................', '................', '................',
    'xxxxxxxxxxxxxxxx', 'oxxxxxxxxxxxxxxo', 'xoxxxxxxxxxxxxox', 'xxoxxxxxxxxxxoxx', 'xxxoxxxxxxxxoxxx',
    'xxxxoxxxxxxoxxxx', 'xxxxxooxxooxxxxx', 'xxxxxxxooxxxxxxx', 'xxxxxxxxxxxxxxxx', 'ssssssssssssssss',
    '................', '................', '................',
  ],
  linkedin: [ // maleta (rede profissional; sem o logotipo da marca)
    '................', '................', '.....xxxxxx.....', '.....x....x.....',
    '.xxxxxxxxxxxxxx.', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx',
    'ooooooossooooooo', 'xxxxxxxssxxxxxxx', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxx', '.ssssssssssssss.', '................', '................',
  ],
  github: [ // </> (código; sem o gato-polvo da marca)
    '................', '................', '........xx......', '........xx......',
    '...xx...xx.xx...', '..xx....xx..xx..', '.xx....xx....xx.', 'xx.....xx.....xx',
    'xx.....xx.....xx', '.xx....xx....xx.', '..xx..xx....xx..', '...xx.xx...xx...',
    '......xx........', '......xx........', '................', '................',
  ],
  phone: [ // fone de telefone (genérico; sem o balão da marca de mensagens)
    '................', '..xxx...........', '.xxxxx..........', '.xxxxxx.........',
    '.xxxxx..........', '..xxx...........', '..xxx...........', '..xxxx..........',
    '...xxxx.....xx..', '....xxxx..xxxxx.', '.....xxxxxxxxxx.', '......xxxxxxxxx.',
    '........xxxxxx..', '................', '................', '................',
  ],
}
export const ICON_DOWNLOAD = [
  '....xxxx....', '....xxxx....', '....xxxx....', '....xxxx....', '.xxxxxxxxxx.', '..xxxxxxxx..',
  '...xxxxxx...', '....xxxx....', '.....xx.....', 'x..........x', 'x..........x', 'xxxxxxxxxxxx',
]
export const STATUS = {
  signal: ['......x', '....x.x', '..x.x.x', 'x.x.x.x'],
  wifi: ['.xxxxx.', 'x.....x', '..xxx..', '...x...'],
  battery: ['xxxxxxxxxx.', 'x.xxxxxx.xx', 'x.xxxxxx.xx', 'xxxxxxxxxx.'],
}

// ---------- tela de tokens com origem lógica deslocada (px da ilustração podem ser negativos) ----------
function tc() {
  const t = new Array(BW * BH).fill(null)
  const idx = (x, y) => { const i = x - X0, j = y - Y0; return i < 0 || j < 0 || i >= BW || j >= BH ? -1 : j * BW + i }
  const set = (x, y, c) => { const i = idx(x, y); if (i >= 0 && c) t[i] = c }
  const get = (x, y) => { const i = idx(x, y); return i < 0 ? undefined : t[i] }
  const paint = (x, y, w, h, fn) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, fn(i, j)) }
  const rect = (x, y, w, h, c) => paint(x, y, w, h, () => c)
  const glyph = (x, y, rows, map) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (map[ch]) set(x + i, y + j, map[ch]) }))
  return { t, idx, set, get, paint, rect, glyph }
}
/** Desenha numa camada própria, contorna por dentro (fora da tela conta como cheio: sem contorno na borda externa). */
function object(dst, draw, { outline = true } = {}) {
  const l = tc()
  draw(l)
  if (outline) {
    const edge = []
    const full = (x, y) => { const v = l.get(x, y); return v === undefined || v !== null }
    for (let y = Y0; y < Y0 + BH; y++) for (let x = X0; x < X0 + BW; x++) {
      if (l.get(x, y) && (!full(x - 1, y) || !full(x + 1, y) || !full(x, y - 1) || !full(x, y + 1))) edge.push([x, y])
    }
    for (const [x, y] of edge) l.set(x, y, 'outline')
  }
  if (dst) for (let i = 0; i < BW * BH; i++) if (l.t[i]) dst.t[i] = l.t[i]
  return l
}
const toRgba = (c) => { const px = new Uint8Array(BW * BH * 4); for (let i = 0; i < BW * BH; i++) if (c.t[i]) px.set(rgba(P[c.t[i]]), i * 4); return px }
const xyOf = (i) => [(i % BW) + X0, Math.floor(i / BW) + Y0]
const mod = (v, n) => ((v % n) + n) % n
const inRR = (x, y, [rx, ry, w, h], r) => {
  const cx = x + 0.5, cy = y + 0.5
  if (cx < rx || cy < ry || cx > rx + w || cy > ry + h) return false
  const dx = Math.max(rx + r - cx, 0, cx - (rx + w - r)), dy = Math.max(ry + r - cy, 0, cy - (ry + h - r))
  return dx * dx + dy * dy <= r * r
}

// Sombra (um tom abaixo, no mesmo material).
const SHADE = {
  'cream-3': 'cream-1', 'cream-2': 'cream-1', 'cream-1': 'cream-0', 'cream-0': 'cream-0',
  'blue-1': 'blue-0', 'blue-0': 'teal-1', 'sky-1': 'blue-1', 'teal-1': 'teal-0',
  'gold-3': 'gold-1', 'gold-1': 'gold-0', 'gold-0': 'wood-3', 'wood-3': 'wood-2',
  'red-3': 'red-2', 'red-2': 'red-1', 'red-1': 'red-0',
}

// ---------- fundo: parede, cabeceira, lençol, travesseiro, lençol dobrado, coberta ----------
function drawBed(c, bedding) {
  const K = BEDDING[bedding]
  const surface = new Set() // onde cai sombra (cama)
  // Parede esquerda (listras verticais de 8 px) e oclusão sobre a cabeceira.
  c.paint(X0, Y0, BW, G.wallBottom - Y0 + 1, (x, y) => (y >= G.wallBottom - 1 ? 'wall-0' : mod(Math.floor(x / 8), 2) ? 'wall-3' : 'wall-4'))
  // Cabeceira: travessa (topo com aresta de luz) e painel com sulcos a cada 96 px.
  object(c, (l) => l.paint(X0, G.head.cap, BW, G.head.bottom - G.head.cap, (x, y) => {
    const k = y - G.head.cap
    if (k === 0) return 'wood-7'
    if (k <= 2) return 'wood-6'
    if (k <= 4) return 'wood-5'
    if (k === 5) return 'outline'
    if (k === 6) return 'wood-3'
    if (mod(x - 16, 96) < 2) return 'wood-1'
    return y > G.head.bottom - 12 ? 'wood-1' : 'wood-2'
  }))
  // Lençol esticado (colchão), do pé da cabeceira até a dobra.
  c.paint(X0, G.head.bottom, BW, G.fold.top - G.head.bottom + 4, (x, y) => { surface.add(c.idx(x, y)); return y === G.head.bottom ? 'cream-1' : 'cream-2' })
  // Coberta: topo com pesponto (matelassê de 28 px, tracejado 2/2) até a aresta; depois cai (frente) até o estrado.
  const k = K.blanket
  object(c, (l) => l.paint(X0, G.fold.bottom - 4, BW, BH + Y0 - G.fold.bottom + 4, (x, y) => {
    const e = G.blanketEdge
    if (y < e) {
      const qx = mod(x - 6, 28) === 0 && mod(y, 4) < 2, qy = mod(y - 130, 28) === 0 && mod(x, 4) < 2
      return qx || qy ? k.front : k.top
    }
    if (y === e) return k.hi
    if (y <= e + 9) return k.front
    if (y <= e + 13) return k.side
    if (y === e + 14) return 'outline'
    if (y <= e + 20) return y === e + 15 ? 'wood-5' : 'wood-4' // estrado
    if (y === e + 21) return 'outline'
    return 'mauve-0' // vão escuro debaixo da cama (aguenta esticar)
  }))
  for (let y = G.fold.bottom - 4; y < G.blanketEdge; y++) for (let x = X0; x < X0 + BW; x++) if (c.get(x, y) !== 'outline') surface.add(c.idx(x, y))
  // Lençol dobrado sobre a coberta: duas listras na cor da roupa de cama; borda de baixo com espessura.
  object(c, (l) => l.paint(X0, G.fold.top, BW, G.fold.bottom - G.fold.top, (x, y) => {
    const k2 = y - G.fold.top
    if (k2 === 0) return 'cream-2'
    if (k2 === 9 || k2 === 11) return K.foldStripe
    if (k2 >= G.fold.bottom - G.fold.top - 3) return 'cream-1'
    return 'cream-3'
  }))
  for (let y = G.fold.top; y < G.fold.bottom; y++) for (let x = X0; x < X0 + BW; x++) if (c.get(x, y) !== 'outline') surface.add(c.idx(x, y))
  // Travesseiro (superelipse), luz de cima à esquerda, costura 2 px para dentro da borda.
  const { cx, cy, a, b } = G.pillow
  object(c, (l) => l.paint(cx - a, cy - b, 2 * a, 2 * b, (x, y) => {
    const u = (x + 0.5 - cx) / a, v = (y + 0.5 - cy) / b
    const s = Math.abs(u) ** 3.2 + Math.abs(v) ** 3.2
    if (s >= 1) return null
    surface.add(c.idx(x, y))
    const su = Math.abs((x + 0.5 - cx) / (a - 4)) ** 3.2 + Math.abs((y + 0.5 - cy) / (b - 4)) ** 3.2
    if (su >= 1 && su < 1.12) return 'cream-1' // costura
    if (v > 0.62) return 'cream-2'
    if (v > 0.35 && u > 0.4) return 'cream-2'
    // vincos nas pontas
    const crease = (px, py, dx, dy, len) => { for (let t = 0; t < len; t++) if (Math.floor(px + dx * t) === x && Math.floor(py + dy * t) === y) return true; return false }
    if (crease(cx - a + 18, cy - b + 20, 1, 0.5, 16) || crease(cx + a - 18, cy - b + 20, -1, 0.5, 16) || crease(cx - a + 22, cy + b - 22, 1, -0.4, 14)) return 'cream-1'
    return 'cream-3'
  }))
  // Estojo de fone de ouvido na coberta, embaixo à esquerda.
  const ear = [30, 150, 26, 18]
  object(c, (l) => l.paint(ear[0], ear[1], ear[2], ear[3], (x, y) => {
    if (!inRR(x, y, ear, 7)) return null
    const j = y - ear[1]
    if (j === 7) return 'cream-0'
    if (j === 9 && x === ear[0] + 13) return 'leaf-2'
    return j < 3 ? 'cream-3' : j > 12 ? 'cream-1' : 'cream-2'
  }))
  for (let y = ear[1]; y < ear[1] + ear[3]; y++) for (let x = ear[0]; x < ear[0] + ear[2]; x++) surface.delete(c.idx(x, y))
  // sombra do estojo (−4, +4)
  for (let y = ear[1]; y < ear[1] + ear[3]; y++) for (let x = ear[0]; x < ear[0] + ear[2]; x++) {
    if (!inRR(x, y, ear, 7)) continue
    const tx = x - 4, ty = y + 4
    if (!inRR(tx, ty, ear, 7) && surface.has(c.idx(tx, ty))) c.set(tx, ty, SHADE[c.get(tx, ty)] ?? c.get(tx, ty))
  }
  return surface
}

// ---------- aparelho ----------
/** Corpo + espessura + vidro + interface fixa do app (cabeçalho, notch, status, avatar, divisória, home). */
function drawPhone(variant) {
  const out = drawDevice(variant)
  drawStatus(out); drawAvatar(out); drawDivider(out)
  return out
}
/** Aparelho sem o conteúdo da tela: corpo, espessura, vidro (cabeçalho teal + corpo creme do app), notch e indicador de início. */
function drawDevice(variant) {
  const V = VARIANTS[variant]
  const [bx, by, bw, bh] = G.body
  const out = tc()
  // Espessura (3 px para (+1, −1)): aresta de cima clara, lateral direita escura; botões na lateral direita.
  object(out, (l) => {
    for (let k = G.depth; k >= 1; k--) {
      l.paint(bx + k, by - k, bw, bh, (x, y) => {
        if (!inRR(x, y, [bx + k, by - k, bw, bh], G.bodyR)) return null
        const right = x >= bx + bw - G.bodyR + k - 1 && y > by - k + G.bodyR / 2
        if (V.case) return right ? V.case.side : V.case.top
        return right ? 'graphite-0' : k === G.depth ? 'graphite-3' : 'graphite-2'
      })
    }
    // botões (volume e power) saindo 1 px da lateral direita
    for (const [y0, h] of [[40, 16], [62, 10]]) l.rect(bx + bw + G.depth, y0, 1, h, V.case ? V.case.top : 'graphite-2')
    // frente
    l.paint(bx, by, bw, bh, (x, y) => {
      if (!inRR(x, y, G.body, G.bodyR)) return null
      if (V.case) {
        const inner = inRR(x, y, [bx + 3, by + 3, bw - 6, bh - 6], G.bodyR - 3)
        if (!inner) return x + y < bx + by + 40 ? V.case.hi : V.case.lip
      }
      if (!V.case && x === bx + 2 && y > by + 14 && y < by + 60) return 'graphite-2' // reflexo no aro
      return 'graphite-1'
    })
  })
  // Tela (sem contorno próprio: o aro é o contorno).
  const [sx, sy, sw, sh] = G.screen
  const [, hy, , hh] = G.header
  out.paint(sx, sy, sw, sh, (x, y) => {
    if (!inRR(x, y, G.screen, G.screenR)) return null
    if (y < hy + hh - 1) return 'teal-2'
    if (y === hy + hh - 1) return 'teal-1'
    return 'cream-3'
  })
  // notch com câmera
  const [nx, ny, nw, nh] = G.notch
  out.paint(nx, ny, nw, nh, (x, y) => (inRR(x, y, G.notch, 3) ? 'graphite-0' : null))
  out.rect(nx + nw - 6, ny + 2, 2, 2, 'teal-1'); out.set(nx + nw - 6, ny + 2, 'sky-2')
  const [mx, my, mw, mh] = G.home
  out.rect(mx, my, mw, mh, 'cream-0')
  return out
}
/** Barra de status: sinal + wi-fi à esquerda, bateria à direita (só os glifos). */
function drawStatus(out) {
  const [sx, , sw] = G.screen, ny = G.notch[1]
  out.glyph(sx + 6, ny + 1, STATUS.signal, { x: 'cream-3' })
  out.glyph(sx + 15, ny + 1, STATUS.wifi, { x: 'cream-3' })
  out.glyph(sx + sw - 18, ny + 1, STATUS.battery, { x: 'cream-3' })
}
/** Avatar genérico: anel creme, fundo sky-1, silhueta teal-2. */
function drawAvatar(out) {
  const { cx, cy, r } = G.avatar
  out.paint(cx - r, cy - r, 2 * r, 2 * r, (x, y) => {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
    if (d >= r) return null
    if (d >= r - 2) return 'cream-3'
    const head = Math.hypot(x + 0.5 - cx, y + 0.5 - (cy - 3)) < 4.6
    const body = ((x + 0.5 - cx) / 8) ** 2 + ((y + 0.5 - (cy + 9)) / 6.5) ** 2 < 1
    return head || body ? 'teal-2' : 'sky-1'
  })
}
function drawDivider(out) {
  const [dx, dy, dw] = G.divider
  out.rect(dx, dy, dw, 1, 'cream-1')
}

/** Botão-ícone 22×22 (hover: anel gold-2 + anel outline por fora, 2 px a mais de cada lado). */
function drawApp(dst, id, x, y, hover = false) {
  const C = APP_COLORS[id], s = G.apps.size
  object(dst, (l) => l.paint(x, y, s, s, (i, j) => {
    if (!inRR(i, j, [x, y, s, s], 4)) return null
    if (j === y + 1) return C.hi
    if (j >= y + s - 3) return C.dark
    return C.fill
  }))
  dst.glyph(x + 3, y + 3, ICONS16[id], { x: 'cream-3', o: C.dark, s: 'cream-1' })
  if (hover) ring(dst, [x, y, s, s], 4)
}
function drawCv(dst, rect, hover = false, disabled = false) {
  const [x, y, w, h] = rect, C = disabled ? CV_DISABLED : CV_COLORS
  object(dst, (l) => l.paint(x, y, w, h, (i, j) => {
    if (!inRR(i, j, rect, 3)) return null
    if (j === y + 1) return C.hi
    if (j >= y + h - 3) return C.dark
    return C.fill
  }))
  dst.glyph(x + G.cv.icon[0], y + G.cv.icon[1], ICON_DOWNLOAD, { x: C.ink })
  if (hover && !disabled) ring(dst, rect, 3)
}
function ring(dst, [x, y, w, h], r) {
  dst.paint(x - 2, y - 2, w + 4, h + 4, (i, j) => {
    if (inRR(i, j, [x, y, w, h], r)) return null
    if (inRR(i, j, [x - 1, y - 1, w + 2, h + 2], r + 1)) return 'gold-2'
    return inRR(i, j, [x - 2, y - 2, w + 4, h + 4], r + 2) ? 'outline' : null
  })
}

// ---------- mão (B) ----------
const SKIN = { main: 'wood-lit', hi: 'wood-7', shade: 'wood-4' }
function capsule(l, [x0, y0], [x1, y1], r) {
  const minX = Math.floor(Math.min(x0, x1) - r - 1), maxX = Math.ceil(Math.max(x0, x1) + r + 1)
  const minY = Math.floor(Math.min(y0, y1) - r - 1), maxY = Math.ceil(Math.max(y0, y1) + r + 1)
  const vx = x1 - x0, vy = y1 - y0, len2 = vx * vx + vy * vy
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const px = x + 0.5, py = y + 0.5
    const t = Math.max(0, Math.min(1, ((px - x0) * vx + (py - y0) * vy) / len2))
    const qx = px - (x0 + t * vx), qy = py - (y0 + t * vy)
    const d = Math.hypot(qx, qy)
    if (d >= r) continue
    const lit = d > 0 ? (-qx - qy) / (Math.SQRT2 * d) : 0
    l.set(x, y, d > r * 0.45 && lit > 0.35 ? SKIN.hi : d > r * 0.4 && lit < -0.25 ? SKIN.shade : SKIN.main)
  }
}
/** Partes da mão atrás do aparelho (palma, punho, dedos na lateral esquerda, mindinho embaixo) e o polegar na frente. */
function drawHand() {
  const back = tc(), front = tc()
  object(back, (l) => capsule(l, [224, 198], [300, 282], 38)) // palma e punho
  object(back, (l) => capsule(l, [200, 189], [114, 185], 7.5)) // mindinho sob o aparelho
  for (const y of [58, 77, 96, 115]) object(back, (l) => capsule(l, [122, y + 4], [92, y], 8.5)) // pontas dos dedos à esquerda
  object(front, (l) => capsule(l, [262, 196], [226, 126], 10.5)) // polegar na lateral (fora da área do DOM)
  return { back, front }
}

// ---------- cena ----------
/**
 * Cena completa com sangria (BW×BH). Devolve { full, inner, keep, layers }. `keep` = pixels que ficam nas cores de dia
 * à noite (aparelho, tela, botões e o halo da tela no fundo).
 */
export function renderPhoneScene({ variant = 'A', night = false, hover = null, cvDisabled = false }) {
  const { bg, phone, hand } = background(variant)
  // Composição: fundo, mão de trás, aparelho, polegar, botões.
  const scene = tc(); scene.t = bg.t.slice()
  if (hand) for (let i = 0; i < BW * BH; i++) if (hand.back.t[i]) scene.t[i] = hand.back.t[i]
  for (let i = 0; i < BW * BH; i++) if (phone.t[i]) scene.t[i] = phone.t[i]
  if (hand) for (let i = 0; i < BW * BH; i++) if (hand.front.t[i]) scene.t[i] = hand.front.t[i]
  const buttons = tc()
  G.apps.ids.forEach((id, n) => drawApp(buttons, id, G.apps.xs[n], G.apps.y, hover === id))
  drawCv(buttons, G.cv.pt, hover === 'cv-pt', cvDisabled); drawCv(buttons, G.cv.en, hover === 'cv-en', cvDisabled)
  for (let i = 0; i < BW * BH; i++) if (buttons.t[i]) scene.t[i] = buttons.t[i]

  const keep = keepSet([phone, buttons])
  let full = toRgba(scene)
  if (night) full = multiply(full, TINT.night, (i) => keep.has(i))
  const inner = crop(full, BW, BH, { x: BLEED.left, y: BLEED.top, w: CW, h: CH })
  return { full, inner, keep }
}

/** Pixels que ficam nas cores de dia à noite: as camadas dadas (aparelho, botões) e o halo da tela no fundo. */
function keepSet(layers) {
  const keep = new Set()
  for (let i = 0; i < BW * BH; i++) {
    if (layers.some((l) => l.t[i])) { keep.add(i); continue }
    const [x, y] = xyOf(i)
    if (inRR(x, y, G.halo.rect, G.halo.r) && y > G.head.bottom) keep.add(i)
  }
  return keep
}

/** Fundo (cama, afundado do travesseiro, sombra do aparelho), o aparelho completo e a mão (B). */
function background(variant) {
  const V = VARIANTS[variant]
  const bg = tc()
  const surface = drawBed(bg, V.bedding)
  const phone = drawPhone(variant)
  const hand = V.hand ? drawHand() : null
  // A: o travesseiro afunda em volta do aparelho (anel cream-1 de 3 px no travesseiro).
  if (!V.hand) {
    const [bx, by, bw, bh] = G.body
    bg.paint(bx - 4, by - 4, bw + 4 + G.depth + 4, bh + 8, (x, y) => {
      const t = bg.get(x, y)
      if (t !== 'cream-3' && t !== 'cream-2') return null
      return y < G.fold.top - 4 && inRR(x, y, [bx - 3, by - 3 - G.depth, bw + 6 + G.depth, bh + 6], G.bodyR + 3) ? 'cream-1' : null
    })
  }
  // Sombra do aparelho (e da mão) na cama: silhueta deslocada, um tom abaixo.
  const [ox, oy] = V.shadow
  const caster = new Set()
  for (const l of [phone, hand?.back, hand?.front].filter(Boolean)) for (let i = 0; i < BW * BH; i++) if (l.t[i]) caster.add(i)
  for (const i of caster) {
    const [x, y] = xyOf(i)
    const t = bg.idx(x + ox, y + oy)
    if (t < 0 || caster.has(t) || !surface.has(t)) continue
    bg.t[t] = SHADE[bg.t[t]] ?? bg.t[t]
  }
  return { bg, phone, hand }
}

/**
 * Camadas da versão aprovada (A) para a exportação (BW×BH, RGBA). O fundo à noite é pré-tingido, menos o halo; o resto
 * fica nas cores de dia. build-phone.mjs confere que a composição na ordem do JSON = renderPhoneScene.
 */
export function phoneLayers(variant = 'A') {
  if (VARIANTS[variant].hand) throw new Error('phoneLayers: só a variação sem mão (A) é exportada')
  const { bg } = background(variant)
  const keep = keepSet([drawPhone(variant)])
  const day = toRgba(bg)
  const night = multiply(day, TINT.night, (i) => keep.has(i))
  const halo = [...keep].filter((i) => bg.t[i])
  const layer = (draw) => { const t = tc(); draw(t); return toRgba(t) }
  const apps = {}
  G.apps.ids.forEach((id, n) => {
    apps[id] = {
      normal: layer((t) => drawApp(t, id, G.apps.xs[n], G.apps.y)),
      hover: layer((t) => drawApp(t, id, G.apps.xs[n], G.apps.y, true)),
    }
  })
  const cv = {}
  for (const k of ['pt', 'en']) {
    cv[k] = {
      normal: layer((t) => drawCv(t, G.cv[k])),
      hover: layer((t) => drawCv(t, G.cv[k], true)),
      disabled: layer((t) => drawCv(t, G.cv[k], false, true)),
    }
  }
  return {
    bleed: { day, night }, halo,
    phone: toRgba(drawDevice(variant)),
    status: layer(drawStatus), avatar: layer(drawAvatar), divider: layer(drawDivider),
    apps, cv,
  }
}

// ---------- mockup do DOM (só prévia) ----------
export const center = (c, [x, y, w], str, color) => text(c, x + Math.floor((w - textW(str)) / 2), y, str, color)
export function mockScreen(c, { cvDisabled = false } = {}) {
  center(c, G.name, 'DAVI KAZUHIRO NATUME', 'graphite-1')
  const roles = ['ESTAGIARIO DEV SOFTWARE', 'CIENCIA DA COMPUTACAO', 'PESQUISA EM FRAUDES']
  roles.forEach((r, k) => center(c, [G.roles[0], G.roles[1] + 1 + k * 8, G.roles[2]], r, 'teal-1'))
  const cityW = textW('CURITIBA, PARANA') + 10
  const cx = G.city[0] + Math.floor((G.city[2] - cityW) / 2)
  SMALL_ICONS.pin.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'x') c.set(cx + i, G.city[1] + j, 'red-1') }))
  text(c, cx + 10, G.city[1] + 1, 'CURITIBA, PARANA', 'teal-1')
  const labels = ['EMAIL', 'LINKED', 'GITHUB', 'FONE']
  labels.forEach((s, n) => center(c, [G.labels.x0 + n * G.labels.w, G.labels.y + 1, G.labels.w], s, 'graphite-2'))
  center(c, [G.cvLabel[0], G.cvLabel[1] + 1, G.cvLabel[2]], 'CURRICULO (PDF)', 'graphite-1')
  for (const [k, s] of [['pt', 'PT'], ['en', 'EN']]) {
    const [x, y] = G.cv[k]
    text(c, x + G.cv.text[0] + 6, y + 7, s, cvDisabled ? 'graphite-2' : CV_COLORS.ink)
  }
}

const sheetOf = (cells, cw, ch, cols, gap = 6) => {
  const rows = Math.ceil(cells.length / cols)
  const W = cw * cols + gap * (cols - 1), H = ch * rows + gap * (rows - 1)
  const px = new Uint8Array(W * H * 4)
  for (let i = 0; i < W * H; i++) px.set(rgba(UI_BG), i * 4)
  cells.forEach((p, n) => blit(px, W, H, p, cw, ch, (n % cols) * (cw + gap), Math.floor(n / cols) * (ch + gap)))
  return { px, w: W, h: H }
}

export function renderPhonePreviews() {
  const check = (r, label, night) => {
    const e1 = lint(r.full, { palette: false })
    if (e1.length) throw new Error(`phone ${label}: ${e1.join(', ')}`)
    const sub = new Uint8Array(BW * BH * 4)
    for (let i = 0; i < BW * BH; i++) if (!night || r.keep.has(i)) sub.set(r.full.subarray(i * 4, i * 4 + 4), i * 4)
    const e2 = lint(sub)
    if (e2.length) throw new Error(`phone ${label} (paleta): ${e2.join(', ')}`)
  }
  const scene = (variant, night, hover = null, mock = true) => {
    const r = renderPhoneScene({ variant, night, hover })
    check(r, `${variant}${night ? ' noite' : ''}`, night)
    const c = flat(CW, CH); c.px.set(r.inner)
    if (mock) mockScreen(c)
    return { r, c }
  }
  // Folha: A e B lado a lado; dia em cima, noite embaixo (na noite, hover no e-mail e no currículo PT).
  const cells = []
  for (const night of [false, true]) for (const v of ['A', 'B']) cells.push(scene(v, night, night ? (v === 'A' ? 'email' : 'cv-pt') : null).c.px)

  // Retângulos: tela (ciano), conteúdo DOM (vermelho), textos (dourado), botões (verde), avatar (rosa).
  const { c } = scene('A', false, null, false)
  dotted(c, G.screen, 'sky-0')
  dotted(c, G.content, 'red-1')
  for (const r of [G.name, G.roles, G.city, G.cvLabel]) dotted(c, r, 'gold-0')
  G.apps.xs.forEach((x, n) => { dotted(c, [x, G.apps.y, G.apps.size, G.apps.size], 'leaf-0'); dotted(c, [G.labels.x0 + n * G.labels.w, G.labels.y, G.labels.w, G.labels.h], 'gold-0') })
  for (const r of [G.cv.pt, G.cv.en]) dotted(c, r, 'leaf-0')
  const { cx, cy, r } = G.avatar
  dotted(c, [cx - r, cy - r, 2 * r, 2 * r], 'pink')
  const rects = c.px

  // Sangria (480×308): A e B, dia e noite, borda do 320×180 tracejada.
  const bleeds = []
  for (const night of [false, true]) for (const v of ['A', 'B']) {
    const rr = renderPhoneScene({ variant: v, night })
    check(rr, `${v} sangria${night ? ' noite' : ''}`, night)
    const b = flat(BW, BH); b.px.set(rr.full)
    for (let x = 0; x < CW; x += 4) { b.set(BLEED.left + x, BLEED.top - 1, 'pink'); b.set(BLEED.left + x, BLEED.top + CH, 'pink') }
    for (let y = 0; y < CH; y += 4) { b.set(BLEED.left - 1, BLEED.top + y, 'pink'); b.set(BLEED.left + CW, BLEED.top + y, 'pink') }
    bleeds.push(b.px)
  }
  // Ícones a 8× (16×16 e 12×12) para conferir o desenho.
  const icons = flat(4 * 26 + 2 * 26, 26)
  icons.rect(0, 0, icons.W, icons.H, 'cream-2')
  G.apps.ids.forEach((id, n) => { const t = tc(); drawApp(t, id, 0, 0); for (let j = 0; j < 22; j++) for (let i = 0; i < 22; i++) { const v = t.get(i, j); if (v) icons.set(2 + n * 26 + i, 2 + j, v) } })
  const t = tc(); drawCv(t, [0, 0, 48, 18])
  for (let j = 0; j < 18; j++) for (let i = 0; i < 48; i++) { const v = t.get(i, j); if (v) icons.set(2 + 4 * 26 + i, 4 + j, v) }
  return [
    { name: 'm3-phone-closeup-sheet', ...sheetOf(cells, CW, CH, 2) },
    { name: 'm3-phone-closeup-rects', px: rects, w: CW, h: CH, scale: 3 },
    { name: 'm3-phone-closeup-bleed', ...sheetOf(bleeds, BW, BH, 2) },
    { name: 'm3-phone-icons', px: icons.px, w: icons.W, h: icons.H, scale: 8 },
  ]
}
