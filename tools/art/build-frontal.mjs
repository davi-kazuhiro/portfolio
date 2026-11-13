// Exporta as cenas frontais (M2): visão de perto do computador e porta da cena Entrance, mais as prévias.
// Âncora das cenas frontais: canto superior esquerdo (0, 0); posições em px da ilustração (specs §2 e §3).
import { dirname } from 'node:path'
import { rgba, writePng } from './lib.mjs'
import { UI_BG } from './palette.mjs'
import { blit, writeSprite } from './sheet.mjs'
import {
  CH, CONTENT, CROPS, CW, DESK_STRIP, LED, MONITOR_BOX, NINE, renderCloseup, renderDeskStrip, renderFrame9, renderSteam, STEAM_AT,
} from './scenes/closeup.mjs'
import { BH, BLEED, BW, renderComputerBleed, DUSK_WINDOW, toDusk } from './scenes/closeup-bleed.mjs'
import {
  COLUMN_W, DOOR_AT, DOOR_SIZE, EH, EW, KNOB_AT, KNOB_SIZE, LIGHT_AT, LIGHT_SIZE, OPEN_FRAMES, renderDoorFrames, renderDoorInterior,
  renderDoorLight, renderEntranceBg, renderKnobGlow, renderWallColumn, SAFE_ZONE,
} from './scenes/entrance.mjs'

const full = (w, h) => ({ x: 0, y: 0, w, h })
const one = (px, duration = 1000, palette = true) => ({ px, duration, palette })

export function buildFrontal(out) {
  const dir = (d) => dirname(out(`public/assets/${d}/x`))
  const dirUi = dir('ui'), dirTiles = dir('tiles'), dirObjects = dir('objects')
  const results = {}

  // ---------- visão de perto do computador ----------
  const states = [
    ['off', ['off']], ['boot', ['boot0', 'boot1']], ['on', ['on']],
  ]
  // Cada célula da tira tem BW×BH: a ilustração 320×180 em (BLEED.left, BLEED.top) e a sangria em volta (§3).
  // `frames[n].frame` aponta só para a ilustração; a sangria vai declarada em meta.quartoPixel.bleed.
  const frames = [], tags = [], bases = []
  for (const night of [false, true]) {
    for (const [name, screens] of states) {
      const from = frames.length
      for (const s of screens) {
        const base = renderCloseup({ screen: s, night })
        bases.push(base)
        frames.push(one(renderComputerBleed(base, { night, lit: s !== 'off' }), name === 'boot' ? 60 : 1000, !night))
      }
      tags.push({ name: night ? `${name}-night` : name, from, to: frames.length - 1 })
    }
  }
  // Entardecer (2026-11-13): o frame de dia × tint-dusk, com a tela acesa e o LED nas cores de dia e o céu de
  // pôr do sol na janela. Sem halo (a luz da tela só aparece à noite).
  const [sx, sy, sw, sh] = CONTENT
  const dayCells = frames.slice(0, frames.length / 2)
  let k = 0
  for (const [name, screens] of states) {
    const from = frames.length
    for (const s of screens) {
      const day = dayCells[k++]
      const lit = s !== 'off'
      const keep = (x, y) => (x >= LED[0] && x < LED[0] + 2 && y === LED[1]) || (lit && x >= sx && x < sx + sw && y >= sy && y < sy + sh)
      const px = toDusk(day.px, { w: BW, h: BH, ox: BLEED.left, oy: BLEED.top, keep, window: DUSK_WINDOW.computer })
      const inner = new Uint8Array(CW * CH * 4)
      for (let y = 0; y < CH; y++) inner.set(px.subarray(((y + BLEED.top) * BW + BLEED.left) * 4, ((y + BLEED.top) * BW + BLEED.left + CW) * 4), y * CW * 4)
      bases.push(inner)
      frames.push(one(px, name === 'boot' ? 60 : 1000, false))
    }
    tags.push({ name: `${name}-dusk`, from, to: frames.length - 1 })
  }
  results.closeup = writeSprite({
    dir: dirUi, id: 'closeup-computer', W: BW, H: BH, frames, tags, rect: full(BW, BH), anchor: [0, 0],
    inner: { x: BLEED.left, y: BLEED.top, w: CW, h: CH },
    meta: {
      size: [CW, CH],
      bleed: BLEED,
      contentRect: CONTENT,
      crops: CROPS,
      minContentCss: [640, 360],
      minScale: 3,
      monitorRect: MONITOR_BOX,
      panelBackground: '#132f3d',
      preTinted: ['off-night', 'boot-night', 'on-night', 'off-dusk', 'boot-dusk', 'on-dusk'],
      steam: { image: 'closeup-computer-steam.png', json: 'closeup-computer-steam.json', at: STEAM_AT },
      frame9: { image: 'closeup-computer-frame.png', size: NINE.size, slices: NINE.slices, center: '#132f3d' },
      deskStrip: { image: 'closeup-computer-desk.png', size: DESK_STRIP, repeat: 'x' },
    },
  })
  results.steam = writeSprite({
    dir: dirUi, id: 'closeup-computer-steam', W: 12, H: 12,
    frames: [0, 1, 2].map((f) => one(renderSteam(f), 200)), tags: [{ name: 'idle', from: 0, to: 2 }],
    rect: full(12, 12), anchor: [0, 0], meta: { at: STEAM_AT },
  })
  // Conferência: a ilustração dentro de cada célula é a de renderCloseup, byte a byte.
  results.closeup.frames.forEach((f, n) => {
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) for (let k = 0; k < 4; k++) {
      if (f[((y + BLEED.top) * BW + x + BLEED.left) * 4 + k] !== bases[n][(y * CW + x) * 4 + k]) throw new Error(`closeup-computer frame ${n}: ilustração mudou em (${x}, ${y})`)
    }
  })
  writePng(`${dirUi}/closeup-computer-frame.png`, renderFrame9(), ...NINE.size)
  writePng(`${dirUi}/closeup-computer-desk.png`, renderDeskStrip(), ...DESK_STRIP)

  // ---------- porta (cena Entrance) ----------
  // Frames por período: day (0), night (1), dusk (2; acrescentado no fim em 2026-11-13 para não mexer nos índices).
  const periodTags = [{ name: 'day', from: 0, to: 0 }, { name: 'night', from: 1, to: 1 }, { name: 'dusk', from: 2, to: 2 }]
  const dayNight = (render, extra = {}) => ({ frames: [one(render('day')), one(render('night'), 1000, false), one(render('dusk'), 1000, false)], tags: periodTags, ...extra })
  results.bg = writeSprite({ dir: dirTiles, id: 'entrance-bg', W: EW, H: EH, ...dayNight(renderEntranceBg), rect: full(EW, EH), anchor: [0, 0], meta: { at: [0, 0], safeZone: SAFE_ZONE, preTinted: ['night', 'dusk'] } })
  results.column = writeSprite({ dir: dirTiles, id: 'entrance-wall-column', W: COLUMN_W, H: EH, ...dayNight(renderWallColumn), rect: full(COLUMN_W, EH), anchor: [0, 0], meta: { repeat: 'x', preTinted: ['night', 'dusk'] } })
  // O interior e a luz são luz: a noite e o entardecer usam só cores da paleta.
  const lightPair = (render) => ({ frames: [one(render('day')), one(render('night')), one(render('dusk'))], tags: periodTags })
  results.interior = writeSprite({ dir: dirObjects, id: 'door-interior', W: DOOR_SIZE[0], H: DOOR_SIZE[1], ...lightPair(renderDoorInterior), rect: full(...DOOR_SIZE), anchor: [0, 0], meta: { at: DOOR_AT } })
  const day = renderDoorFrames('day'), night = renderDoorFrames('night'), dusk = renderDoorFrames('dusk')
  const doorFrames = [
    one(day[0]), ...OPEN_FRAMES.map((f, n) => one(day[n + 1], f.ms)),
    one(night[0], 1000, false), ...OPEN_FRAMES.map((f, n) => one(night[n + 1], f.ms, false)),
    one(dusk[0], 1000, false), ...OPEN_FRAMES.map((f, n) => one(dusk[n + 1], f.ms, false)),
  ]
  results.door = writeSprite({
    dir: dirObjects, id: 'door', W: DOOR_SIZE[0], H: DOOR_SIZE[1], frames: doorFrames,
    tags: [{ name: 'closed', from: 0, to: 0 }, { name: 'open', from: 1, to: 4 }, { name: 'closed-night', from: 5, to: 5 }, { name: 'open-night', from: 6, to: 9 }, { name: 'closed-dusk', from: 10, to: 10 }, { name: 'open-dusk', from: 11, to: 14 }],
    rect: full(...DOOR_SIZE), anchor: [0, 0], meta: { at: DOOR_AT, preTinted: ['closed-night', 'open-night', 'closed-dusk', 'open-dusk'] },
  })
  results.light = writeSprite({ dir: dirObjects, id: 'door-light', W: LIGHT_SIZE[0], H: LIGHT_SIZE[1], ...lightPair(renderDoorLight), rect: full(...LIGHT_SIZE), anchor: [0, 0], meta: { at: LIGHT_AT } })
  results.knob = writeSprite({
    dir: dirObjects, id: 'door-knob-glow', W: KNOB_SIZE[0], H: KNOB_SIZE[1],
    frames: [0, 1].map((f) => one(renderKnobGlow(f), 300)), tags: [{ name: 'hover', from: 0, to: 1 }],
    rect: full(...KNOB_SIZE), anchor: [0, 0], meta: { at: KNOB_AT },
  })
  for (const r of Object.values(results)) console.log(`${r.id.padEnd(24)} ${r.w}×${r.h} ×${r.count}  tags ${r.tags.map((t) => t.name).join(', ')}`)
  console.log('ui/closeup-computer-frame.png 48×48, ui/closeup-computer-desk.png 32×24')

  // ---------- prévias (2×) ----------
  const bg = (w, h) => { const p = new Uint8Array(w * h * 4); for (let i = 0; i < w * h; i++) p.set(rgba(UI_BG), i * 4); return p }
  const at = (dst, dw, dh, r, frame, [x, y], ox = 0) => blit(dst, dw, dh, r.frames[frame], r.w, r.h, x + ox, y)
  for (const [name, base] of [['closeup-day', 3], ['closeup-night', 7]]) { // tags on e on-night
    const p = bg(CW, CH)
    at(p, CW, CH, results.closeup, base, [-BLEED.left, -BLEED.top])
    at(p, CW, CH, results.steam, 0, STEAM_AT)
    writePng(out(`art-src/previews/${name}.png`), p, CW, CH, 2)
  }
  // Porta: fechada, hover, abrindo 1–4, lado a lado (cena completa de 320×180 cada).
  // [arquivo, frame do período em bg/interior/light, primeiro frame da porta]
  for (const [file, period, d0] of [['door', 0, 0], ['door-night', 1, 5], ['door-dusk', 2, 10]]) {
    const n = 6, PW = EW * n + 8 * (n - 1)
    const p = bg(PW, EH)
    const doorIdx = [d0, d0, d0 + 1, d0 + 2, d0 + 3, d0 + 4]
    doorIdx.forEach((di, k) => {
      const ox = k * (EW + 8)
      at(p, PW, EH, results.bg, period, [0, 0], ox)
      at(p, PW, EH, results.interior, period, DOOR_AT, ox)
      at(p, PW, EH, results.door, di, DOOR_AT, ox)
      at(p, PW, EH, results.light, period, LIGHT_AT, ox)
      if (k === 1) at(p, PW, EH, results.knob, 0, KNOB_AT, ox)
    })
    writePng(out(`art-src/previews/${file}.png`), p, PW, EH, 2)
  }
  console.log('art-src/previews/closeup-day.png, closeup-night.png, door.png, door-night.png, door-dusk.png')
  return { closeup: results.closeup, steam: results.steam }
}
