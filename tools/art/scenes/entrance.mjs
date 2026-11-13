// Porta do quarto (cena Entrance, M4; spec no M2). Ilustração frontal de 320×180. Spec: docs/arte/specs.md §2.
import { hash } from '../lib.mjs'
import { TINT } from '../palette.mjs'
import { flat, FONT_5x7, FONT_GLYPH } from '../flat.mjs'
import { multiply } from '../sheet.mjs'

export const EW = 320
export const EH = 180
export const COLUMN_W = 16
export const SAFE_ZONE = [104, 0, 112, 180]
export const DOOR_AT = [128, 22]
export const DOOR_SIZE = [64, 142]
export const LIGHT_AT = [120, 164]
export const LIGHT_SIZE = [80, 10]
export const KNOB_AT = [177, 91]
export const KNOB_SIZE = [12, 12]
/** Frames de abertura: largura da folha, recuo da borda livre (y), duração. */
export const OPEN_FRAMES = [
  { w: 50, inset: 1, ms: 70, knob: 5 },
  { w: 30, inset: 3, ms: 70, knob: 4 },
  { w: 12, inset: 5, ms: 80, knob: 0 },
  { w: 3, inset: 6, ms: 120, knob: 0 },
]

/** Período: 'day' | 'dusk' | 'night'. Aceita o booleano antigo (true = noite). */
const per = (p) => (p === true ? 'night' : p === false || p == null ? 'day' : p)
/** Corredor pré-tingido: dia sem tint; entardecer e noite × tint do período. */
const tinted = (px, p) => (p === 'day' ? px : multiply(px, TINT[p]))

// Corredor: tudo periódico em 16 px, para a coluna lateral (16×180) emendar sem costura.
function corridor(c, x0, w) {
  c.paint(x0, 0, w, 180, (x, y) => {
    if (y < 150) return Math.floor(x / 8) % 2 ? 'wall-3' : 'wall-4'
    if (y === 150) return 'mauve-2'
    if (y < 162) return 'mauve-1'
    if (y < 164) return 'mauve-0'
    const k = Math.floor((y - 164) / 4), r = (y - 164) % 4
    if (r === 3 || x % 16 === (k * 6 + 3) % 16) return 'wood-1'
    const a = k % 2 === 0
    const grain = hash(x % 16, y) > 0.85
    return a ? (grain ? 'wood-3' : 'wood-4') : (grain ? 'wood-2' : 'wood-3')
  })
}

/** Fundo do corredor com o batente. `dusk`/`night`: pré-multiplicado pelo tint do período. */
export function renderEntranceBg(period = 'day') {
  const c = flat(EW, EH)
  corridor(c, 0, EW)
  // Sombra do batente na parede e no rodapé (luz da esquerda) e da porta no piso, à direita.
  c.rect(200, 16, 2, 134, 'wall-0')
  c.rect(200, 150, 2, 14, 'mauve-0')
  for (let r = 0; r < 4; r++) c.rect(200, 164 + r, 12 - 3 * r, 1, 'wood-1')
  // Batente: laterais e travessa de 8 px; vão interno 128–191 × 22–163.
  c.object((l) => {
    l.rect(120, 14, 80, 8, 'cream-2')
    l.rect(120, 14, 8, 150, 'cream-2')
    l.rect(192, 14, 8, 150, 'cream-2')
    l.rect(121, 15, 78, 1, 'cream-3') // aresta de luz em cima
    l.rect(121, 15, 1, 149, 'cream-3') // e à esquerda
    l.rect(198, 15, 1, 149, 'cream-0') // sombra à direita
    l.rect(126, 20, 2, 144, 'cream-1') // lado interno
    l.rect(128, 20, 64, 2, 'cream-1')
    l.rect(192, 22, 1, 142, 'cream-0')
  })
  return tinted(c.px, per(period))
}

export function renderWallColumn(period = 'day') {
  const c = flat(COLUMN_W, EH)
  corridor(c, 0, COLUMN_W)
  return tinted(c.px, per(period))
}

/** O que se vê pelo vão: o quarto aceso. As 2 linhas de baixo (gold-3) aparecem como luz sob a porta. */
export function renderDoorInterior(period = 'day') {
  const p = per(period), night = p === 'night', dusk = p === 'dusk'
  const [w, h] = DOOR_SIZE
  const c = flat(w, h)
  // Entardecer: o sol baixo entra pela janela do quarto (à esquerda, fora da vista) e projeta duas vidraças
  // inclinadas na parede e uma mancha comprida no piso. u = posição ao longo da diagonal.
  const sunWall = (x, y) => {
    const u = x - (y - 20) * 0.45
    if (y < 14 || y > 84 || u < 4 || u > 40) return null
    if (u > 20 && u < 23) return null // travessa da janela
    return u < 6 || u > 38 || (u > 18 && u < 20) || (u > 23 && u < 25) ? 'gold-2' : 'gold-3'
  }
  const sunFloor = (x, y) => {
    const u = x - (140 - y) * 0.5
    return y >= 104 && u >= 6 && u <= 40 && !(u > 21 && u < 24)
  }
  c.paint(0, 0, w, h, (x, y) => {
    if (y >= 140) return night && x >= 24 && x < 40 ? 'sky-2' : dusk ? 'gold-2' : 'gold-3'
    if (y < 92) {
      if (dusk) {
        const sun = sunWall(x, y)
        if (sun) return sun
        if (x >= 57 && y >= 24) return x >= 62 ? 'sky-0' : 'sky-1' // reflexo do monitor, mais estreito
        return Math.floor(x / 8) % 2 ? 'wall-3' : 'wall-4'
      }
      if (night) {
        if (((x - 6) / 16) ** 2 + ((y - 70) / 22) ** 2 < 1) return 'gold-3' // poça da luminária
        if (x >= 50 && y >= 18) return x >= 58 ? 'sky-2' : 'sky-0' // luz da tela, que fica à direita, fora da vista
        return Math.floor(x / 8) % 2 ? 'wall-3' : 'wall-4'
      }
      if (x >= 56 && y >= 24) return x >= 61 ? 'sky-0' : 'sky-1' // reflexo do monitor (à direita, fora da vista)
      return Math.floor(x / 8) % 2 ? 'wall-4' : 'wall-5'
    }
    if (y < 95) return y === 92 ? 'mauve-2' : 'mauve-1'
    // Piso em perspectiva: juntas cada vez mais espaçadas para baixo.
    const seams = [98, 102, 107, 113, 120, 128, 137]
    if (seams.includes(y)) return night ? 'wood-3' : 'wood-4'
    if (dusk && sunFloor(x, y)) return 'wood-7'
    const k = seams.filter((s) => s < y).length
    return k % 2 ? 'wood-6' : 'wood-lit'
  })
  return c.px
}

/** Folha fechada (64×142; linhas 140–141 transparentes = fresta). `knob` = desenhar a maçaneta. */
function leafClosed({ knob = true } = {}) {
  const [w] = DOOR_SIZE
  const c = flat(w, 142)
  c.object((l) => {
    l.paint(0, 0, 64, 140, (x, y) => {
      const low = y >= 93
      const grain = hash(x, Math.floor(y / 6)) > 0.8
      if (x === 1) return 'wood-6'
      if (x === 62) return 'wood-3'
      if (low) return grain ? 'wood-3' : 'wood-4'
      return grain ? 'wood-4' : 'wood-5'
    })
    for (const [py0, py1] of [[10, 62], [84, 130]]) {
      l.rect(8, py0, 48, py1 - py0 + 1, 'wood-5')
      l.rect(8, py0, 48, 1, 'wood-6'); l.rect(8, py0, 1, py1 - py0 + 1, 'wood-6')
      l.rect(8, py1, 48, 1, 'wood-2'); l.rect(55, py0 + 1, 1, py1 - py0, 'wood-2')
    }
    // Plaquinha "DAVAS" (apelido; trocado de "DAVI" em 2026-11-13). 38×12 em x 13–50, para os
    // 29 px do texto não encostarem nos parafusos.
    l.rect(13, 34, 38, 12, 'cream-3')
    l.border(13, 34, 38, 12, 'gold-0')
    l.rect(14, 35, 36, 1, 'gold-1')
    for (const [sx, sy] of [[15, 37], [48, 37], [15, 43], [48, 43]]) l.set(sx, sy, 'gold-0')
    l.text(17, 37, 'DAVAS', FONT_5x7, 'graphite-1')
    // Adesivo "</>": borda branca de adesivo, cantos arredondados.
    l.paint(22, 96, 20, 12, (x, y) => ((x === 22 || x === 41) && (y === 96 || y === 107) ? null : 'cream-3'))
    l.paint(23, 97, 18, 10, (x, y) => ((x === 23 || x === 40) && (y === 97 || y === 106) ? 'cream-3' : 'graphite-1'))
    l.text(27, 99, '</>', FONT_GLYPH, 'sky-0')
  })
  if (knob) drawKnob(c, 52, 72, 6)
  // Dobradiças por cima do contorno.
  c.rect(0, 16, 2, 8, 'gold-0')
  c.rect(0, 112, 2, 8, 'gold-0')
  return c
}

function drawKnob(c, x, y, s) {
  c.object((l) => {
    l.paint(x, y, s, s, (i, j) => (s > 4 && (i === x || i === x + s - 1) && (j === y || j === y + s - 1) ? null : 'gold-1'))
    if (s >= 4) { l.set(x + 1, y + 1, 'gold-3'); l.set(x + 2, y + 1, 'gold-3') }
    l.set(x + s - 2, y + s - 2, 'gold-0')
  })
}

/** Frames da porta: 0 = fechada; 1–4 = abrindo (a borda livre se afasta, dobradiças à esquerda). */
export function renderDoorFrames(period = 'day') {
  const p = per(period)
  const [W, H] = DOOR_SIZE
  const closed = leafClosed()
  const bare = leafClosed({ knob: false })
  const frames = [closed.px]
  for (const f of OPEN_FRAMES) {
    const c = flat(W, H)
    c.object((l) => {
      for (let x = 0; x < f.w; x++) {
        const t = f.w > 1 ? x / (f.w - 1) : 0
        const yTop = Math.round(t * f.inset), yBot = 139 - Math.round(t * f.inset)
        for (let y = yTop; y <= yBot; y++) {
          if (x >= f.w - 2) { l.set(x, y, 'wood-1'); continue } // espessura da porta
          const u = Math.min(63, Math.floor((x * 64) / (f.w - 2)))
          const v = Math.round(((y - yTop) / (yBot - yTop)) * 139)
          const p = bare.get(u, v)
          if (p && p[3]) l.px.set(p, (y * W + x) * 4)
        }
      }
    })
    if (f.knob) drawKnob(c, Math.round((52 * (f.w - 2)) / 64), 74 - Math.floor(f.knob / 2), f.knob)
    c.rect(0, 16, 2, 8, 'gold-0')
    c.rect(0, 112, 2, 8, 'gold-0')
    frames.push(c.px)
  }
  if (p === 'day') return frames
  // Entardecer: tudo × tint-dusk, sem reflexo na placa (o corredor ainda tem luz).
  if (p === 'dusk') return frames.map((px) => multiply(px, TINT.dusk))
  // Noite: tudo × tint-night; a plaquinha recebe 1 px de reflexo gold-3 vindo da fresta (só na fechada).
  return frames.map((px, n) => {
    const out = multiply(px, TINT.night)
    if (n === 0) { const g = flat(W, H); g.rect(14, 44, 36, 1, 'gold-3'); for (let i = 0; i < W * H; i++) if (g.px[i * 4 + 3]) out.set(g.px.subarray(i * 4, i * 4 + 4), i * 4) }
    return out
  })
}

/** Luz que escapa para o piso do corredor (80×10). */
export function renderDoorLight(period = 'day') {
  const p = per(period)
  const [w, h] = LIGHT_SIZE
  const c = flat(w, h)
  if (p === 'dusk') {
    // Entre o dia (4 linhas) e a noite (8): 6 linhas, mais quente (gold-2), sem o azul da tela.
    c.rect(8, 0, 64, 1, 'gold-3')
    c.rect(7, 1, 66, 1, 'gold-2')
    c.rect(6, 2, 68, 2, 'wood-6')
    for (let r = 0; r < 2; r++) { const x0 = 4 - 2 * r; c.rect(x0, 4 + r, w - 2 * x0, 1, 'wood-lit') }
  } else if (p === 'day') {
    c.rect(8, 0, 64, 1, 'gold-3')
    c.rect(6, 1, 68, 1, 'wood-6')
    c.rect(4, 2, 72, 2, 'wood-lit')
  } else {
    c.rect(8, 0, 64, 2, 'gold-3')
    c.rect(32, 0, 16, 2, 'sky-2')
    c.rect(6, 2, 68, 2, 'wood-6')
    for (let r = 0; r < 4; r++) { const x0 = Math.max(0, 4 - 2 * r); c.rect(x0, 4 + r, w - 2 * x0, 1, 'wood-lit') }
  }
  return c.px
}

/** Brilho da maçaneta no hover (12×12, 2 frames). */
export function renderKnobGlow(frame) {
  const [w, h] = KNOB_SIZE
  const c = flat(w, h)
  c.paint(3, 3, 6, 6, (x, y) => ((x === 3 || x === 8) && (y === 3 || y === 8) ? null : 'gold-2'))
  c.rect(4, 4, 4, 4, 'gold-3')
  // Faíscas de 1 px em volta (leem como brilho sem alfa parcial).
  for (const [x, y] of [[1, 5], [10, 6], [5, 1], [6, 10]]) c.set(x, y, 'gold-2')
  if (frame === 1) { c.set(4, 4, 'cream-3'); c.set(5, 4, 'cream-3'); for (const [x, y] of [[0, 5], [11, 6], [5, 0], [6, 11]]) c.set(x, y, 'gold-3') }
  return c.px
}
