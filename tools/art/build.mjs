// Gera a arte do quarto (ADR 0005).
// Uso: node tools/art/build.mjs              → assets do jogo (quarto, visões de perto do computador e da prateleira, porta)
//                                               em public/assets/ + prévias em art-src/previews/
//      node tools/art/build.mjs --reference  → prévia da cena de referência (art-src/previews/reference-desk.png)
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rgba, writePng } from './lib.mjs'
import { TINT, UI_BG } from './palette.mjs'
import { ANCHOR, anchorTile, KEYBOARD, MONITOR, OX, OY, RH, RW, toPx, TOWER, DESK } from './room.mjs'
import { blit, bounds, grow, multiply, writeSprite } from './sheet.mjs'
import { renderComputer, renderDeskLamp } from './scenes/computer.mjs'
import { renderDeskChair, renderPcTower } from './scenes/furniture.mjs'
import { renderLightComputer, renderLightWindow } from './scenes/lights.mjs'
import { renderReferenceDesk } from './scenes/reference-desk.mjs'
import { renderRoomShell } from './scenes/room-shell.mjs'
import { renderWindow } from './scenes/window.mjs'
import { renderBookshelf4, renderBookshelf4Shadow } from './scenes/bookshelf4.mjs'
import { buildFrontal } from './build-frontal.mjs'
import { buildBookshelfCloseup } from './build-bookshelf.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const out = (rel) => {
  const path = resolve(root, rel)
  mkdirSync(dirname(path), { recursive: true })
  return path
}

if (process.argv.includes('--reference')) {
  const canvas = renderReferenceDesk()
  canvas.writePng(out('art-src/previews/reference-desk.png'), 2)
  console.log('art-src/previews/reference-desk.png')
} else {
  buildRoom()
  buildFrontal(out)
  buildBookshelfCloseup(out)
}

function buildRoom() {
  const tiles = out('public/assets/tiles/x'), objects = out('public/assets/objects/x')
  const dirTiles = dirname(tiles), dirObjects = dirname(objects)
  const px = (c) => c.pixels
  const anchorPx = (id) => toPx(...ANCHOR[id], 0)
  const MARGIN = 2 // margem transparente para o outline de hover (regra 13)

  // ---------- render ----------
  const shell = px(renderRoomShell())
  // Sombra da prateleira na parede (plana, não muda): assada no room-shell, fora do sprite e do hover.
  blit(shell, RW, RH, renderBookshelf4Shadow().pixels, RW, RH, 0, 0)
  const shelf = px(renderBookshelf4())
  const computerFrames = [0, 1, 2, 3].map((frame) => px(renderComputer({ frame })))
  const computerOnFrames = [0, 1, 2, 3].map((frame) => px(renderComputer({ frame, lamp: 'on' })))
  const lampOff = px(renderDeskLamp(false)), lampOn = px(renderDeskLamp(true))
  const chair = px(renderDeskChair())
  const towerFrames = [0, 1].map((f) => px(renderPcTower(f)))
  const periods = ['day', 'dusk', 'night']
  const windowRaw = Object.fromEntries(periods.map((p) => [p, px(renderWindow(p))]))
  const glassMask = Object.fromEntries(periods.map((p) => [p, px(renderWindow(p, { mask: true }))]))
  const isGlass = (p) => (i) => glassMask[p][i * 4] === 255
  const windowFrames = {
    day: windowRaw.day,
    dusk: multiply(windowRaw.dusk, TINT.dusk, isGlass('dusk')),
    night: multiply(windowRaw.night, TINT.night, isGlass('night')),
  }
  // Luzes: recortadas pelo que fica na frente delas.
  const floorObjects = [computerOnFrames[0], chair, towerFrames[0], lampOn, shelf]
  const lightWindow = Object.fromEntries(periods.map((p) => [p, renderLightWindow(p, [...floorObjects, windowRaw.day])]))
  const lightComputer = computerOnFrames.map((c) => renderLightComputer(c, lampOn, [chair, towerFrames[0]]))

  // ---------- export ----------
  const results = {}
  const common = { W: RW, H: RH }
  results['room-shell'] = writeSprite({
    ...common, dir: dirTiles, id: 'room-shell',
    frames: [{ px: shell, duration: 1000 }], tags: [{ name: 'idle', from: 0, to: 0 }],
    rect: { x: 0, y: 0, w: RW, h: RH }, anchor: anchorPx('room-shell'),
    meta: { tile: anchorTile('room-shell'), mount: 'floor', footprint: [[0, 0, 7, 7]], hit: 'none' },
  })
  results['light-window'] = writeSprite({
    ...common, dir: dirObjects, id: 'light-window',
    frames: periods.map((p) => ({ px: lightWindow[p], duration: 1000 })),
    tags: periods.map((name, n) => ({ name, from: n, to: n })),
    rect: { x: 0, y: 0, w: RW, h: RH }, anchor: anchorPx('room-shell'),
    meta: { tile: anchorTile('room-shell'), layerOf: 'room-shell', light: true, hit: 'none' },
  })

  const wRect = grow(bounds(Object.values(windowRaw), RW, RH), MARGIN)
  results.window = writeSprite({
    ...common, dir: dirObjects, id: 'window',
    frames: periods.map((p) => ({ px: windowFrames[p], duration: 1000, palette: p === 'day' })),
    tags: periods.map((name, n) => ({ name, from: n, to: n })),
    rect: wRect, anchor: anchorPx('window'),
    meta: { tile: anchorTile('window'), mount: 'wall-back', hit: 'none', light: true, preTinted: ['dusk', 'night'] },
  })

  // Prateleira (M3, versão "shelf4" aprovada em 2026-11-07): objeto de parede, um interagível só no quarto.
  const sRect = grow(bounds([shelf], RW, RH), MARGIN)
  results.bookshelf = writeSprite({
    ...common, dir: dirObjects, id: 'bookshelf',
    frames: [{ px: shelf, duration: 1000 }], tags: [{ name: 'idle', from: 0, to: 0 }],
    rect: sRect, anchor: anchorPx('bookshelf'),
    meta: { tile: anchorTile('bookshelf'), mount: 'wall-back', hit: 'alpha', minHit: [24, 24], focus: [MARGIN, MARGIN, sRect.w - 2 * MARGIN, sRect.h - 2 * MARGIN] },
  })

  const cRect = grow(bounds([...computerOnFrames, ...lightComputer, lampOn], RW, RH), MARGIN)
  const cAnchor = anchorPx('computer')
  // Retângulo de foco do zoom: braço A + monitor + teclado + gabinete (sem o braço B).
  const focusBoxes = [[0, 32, 0, 14, 0, 16], MONITOR.screen, KEYBOARD, TOWER, DESK.leg]
  const pts = focusBoxes.flatMap(([x0, x1, y0, y1, z0, z1]) => [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [z0, z1].map((z) => toPx(x, y, z)))))
  const fx0 = Math.floor(Math.min(...pts.map((p) => p[0]))), fx1 = Math.ceil(Math.max(...pts.map((p) => p[0])))
  const fy0 = Math.floor(Math.min(...pts.map((p) => p[1]))), fy1 = Math.ceil(Math.max(...pts.map((p) => p[1])))
  const focus = [fx0 - cRect.x, fy0 - cRect.y, fx1 - fx0, fy1 - fy0]
  results.computer = writeSprite({
    ...common, dir: dirObjects, id: 'computer',
    frames: computerFrames.map((p) => ({ px: p, duration: 500 })), tags: [{ name: 'idle', from: 0, to: 3 }],
    rect: cRect, anchor: cAnchor,
    meta: { tile: anchorTile('computer'), mount: 'floor', footprint: [[0, 0, 4, 2], [0, 2, 2, 2]], hit: 'alpha', minHit: [24, 24], focus },
  })
  results['desk-lamp'] = writeSprite({
    ...common, dir: dirObjects, id: 'desk-lamp',
    frames: [{ px: lampOff, duration: 1000 }, { px: lampOn, duration: 1000 }],
    tags: [{ name: 'off', from: 0, to: 0 }, { name: 'on', from: 1, to: 1 }],
    rect: cRect, anchor: cAnchor,
    meta: { tile: anchorTile('computer'), layerOf: 'computer', hit: 'none' },
  })
  results['light-computer'] = writeSprite({
    ...common, dir: dirObjects, id: 'light-computer',
    frames: lightComputer.map((p) => ({ px: p, duration: 500 })), tags: [{ name: 'night', from: 0, to: 3 }],
    rect: cRect, anchor: cAnchor,
    meta: { tile: anchorTile('computer'), layerOf: 'computer', light: true, syncFramesWith: 'computer', hit: 'none' },
  })
  results['desk-chair'] = writeSprite({
    ...common, dir: dirObjects, id: 'desk-chair',
    frames: [{ px: chair, duration: 1000 }], tags: [{ name: 'idle', from: 0, to: 0 }],
    rect: grow(bounds([chair], RW, RH), MARGIN), anchor: anchorPx('desk-chair'),
    meta: { tile: anchorTile('desk-chair'), mount: 'floor', footprint: [[0, 0, 1, 1]], hit: 'none' },
  })
  results['pc-tower'] = writeSprite({
    ...common, dir: dirObjects, id: 'pc-tower',
    frames: towerFrames.map((p) => ({ px: p, duration: 800 })), tags: [{ name: 'idle', from: 0, to: 1 }],
    rect: grow(bounds(towerFrames, RW, RH), MARGIN), anchor: anchorPx('pc-tower'),
    meta: { tile: anchorTile('pc-tower'), mount: 'floor', footprint: [[0, 0, 1, 1]], hit: 'none' },
  })

  for (const r of Object.values(results)) {
    console.log(`${r.id.padEnd(15)} ${String(r.w).padStart(3)}×${String(r.h).padEnd(3)} ×${r.count}  âncora (${r.ax}, ${r.ay})  tile ${JSON.stringify(r.meta.quartoPixel.tile)}`)
  }

  // ---------- prévias: tudo posicionado como o jogo posiciona (ponto do Tiled − âncora do JSON) ----------
  const PAD = 24
  const PW = RW + 2 * PAD, PH = RH + 2 * PAD
  const corner = [OX + PAD, OY + PAD] // canto do fundo do quarto = tile (0, 0)
  const place = (canvas, r, frame = 0) => {
    const [c, row] = r.meta.quartoPixel.tile
    const x = corner[0] + (c - row) * 32 - r.ax, y = corner[1] + (c + row) * 16 - r.ay
    blit(canvas, PW, PH, r.frames[frame], r.w, r.h, x, y)
  }
  const bg = () => { const p = new Uint8Array(PW * PH * 4); for (let i = 0; i < PW * PH; i++) p.set(rgba(UI_BG), i * 4); return p }
  const byDepth = (ids) => ids.map((id) => results[id]) // já em ordem de profundidade

  const day = bg()
  place(day, results['room-shell'])
  place(day, results['light-window'], 0)
  place(day, results.window, 0)
  place(day, results.bookshelf)
  for (const r of byDepth(['computer', 'desk-lamp', 'desk-chair', 'pc-tower'])) place(day, r, 0)
  writePng(out('art-src/previews/room-m2.png'), day, PW, PH, 2)

  // Noite: quarto × tint-night; luzes por cima (janela pré-tingida, luar, luz do computador).
  const room = new Uint8Array(PW * PH * 4)
  place(room, results['room-shell'])
  place(room, results.bookshelf)
  place(room, results.computer, 0)
  place(room, results['desk-lamp'], 1)
  place(room, results['desk-chair'])
  place(room, results['pc-tower'], 0)
  const night = bg()
  blit(night, PW, PH, multiply(room, TINT.night), PW, PH, 0, 0)
  place(night, results.window, 2)
  place(night, results['light-window'], 2)
  place(night, results['light-computer'], 0)
  writePng(out('art-src/previews/room-m2-night.png'), night, PW, PH, 2)
  console.log('art-src/previews/room-m2.png, art-src/previews/room-m2-night.png')
}
