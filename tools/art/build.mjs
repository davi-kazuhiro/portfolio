// Gera a arte do quarto (ADR 0005).
// Uso: node tools/art/build.mjs              → assets do jogo (quarto, visões de perto do computador, da prateleira, do caderno,
//                                               do celular e dos quadros, porta)
//                                               em public/assets/ + prévias em art-src/previews/
//      node tools/art/build.mjs --reference  → prévia da cena de referência (art-src/previews/reference-desk.png)
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rgba, writePng } from './lib.mjs'
import { P, TINT, UI_BG } from './palette.mjs'
import { ANCHOR, anchorTile, KEYBOARD, MONITOR, OX, OY, RH, RW, toPx, TOWER, DESK } from './room.mjs'
import { blit, bounds, grow, multiply, writeSprite } from './sheet.mjs'
import { renderComputer, renderComputerHit, renderDeskLamp } from './scenes/computer.mjs'
import { renderDeskChair, renderPcTower } from './scenes/furniture.mjs'
import { renderLightComputer, renderLightWindow } from './scenes/lights.mjs'
import { renderReferenceDesk } from './scenes/reference-desk.mjs'
import { renderRoomShell } from './scenes/room-shell.mjs'
import { renderWindow } from './scenes/window.mjs'
import { renderBookshelf4, renderBookshelf4Shadow } from './scenes/bookshelf4.mjs'
import { buildFrontal } from './build-frontal.mjs'
import { buildBookshelfCloseup } from './build-bookshelf.mjs'
import { buildJournalCloseup } from './build-journal.mjs'
import { renderJournal, renderLightJournal } from './scenes/journal.mjs'
import { renderController, renderHeadset } from './scenes/desk-items.mjs'
import { buildDeskItemsCloseups } from './build-desk-items.mjs'
import { buildPhoneCloseup } from './build-phone.mjs'
import { renderBed, renderBedShadow } from './scenes/bed.mjs'
import { renderLightPhone, renderPhone } from './scenes/phone.mjs'
import { buildFramesCloseup } from './build-frames.mjs'
import { FRAMES_ANCHOR_Y, renderFrames, renderFramesShadow, renderLightFrames } from './scenes/frames.mjs'
import { BH, BLEED, BW } from './scenes/closeup-bleed.mjs'
import { STEAM_AT } from './scenes/closeup.mjs'

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
  const frontal = buildFrontal(out)
  const shelf = buildBookshelfCloseup(out)
  const journal = buildJournalCloseup(out)
  const phone = buildPhoneCloseup(out)
  const frames = buildFramesCloseup(out)
  buildDeskItemsCloseups(out) // headset e controle (specs §8 e §9)
  bleedPreview(frontal, shelf, journal, phone, frames)
}

/** Prévia da sangria (specs §3): computador, prateleira, caderno, celular e quadros, dia | noite, com a borda do 320×180 tracejada em pink. */
function bleedPreview(frontal, shelf, journal, phone, frames) {
  const gap = 8, PW = BW * 2 + gap, PH = BH * 5 + 4 * gap
  const p = new Uint8Array(PW * PH * 4)
  for (let i = 0; i < PW * PH; i++) p.set(rgba(UI_BG), i * 4)
  const { closeup, steam } = frontal
  const cells = [
    [closeup.frames[3], true], [closeup.frames[7], true], // on, on-night
    [shelf.bleed.day, false, shelf.scene('languages', false)], [shelf.bleed.night, false, shelf.scene('languages', true)],
    [journal.bleed.day, false], [journal.bleed.night, false], // só o fundo (o caderno é camada à parte)
    [phone.full.day, false], [phone.full.night, false], // composto pelos frames exportados
    [frames.full.day, false], [frames.full.night, false], // 5 certificados, o 1º aberto (composto pelos frames exportados)
  ]
  const pink = rgba('#e3789a')
  cells.forEach(([full, isComputer, inner], n) => {
    const ox = (n % 2) * (BW + gap), oy = Math.floor(n / 2) * (BH + gap)
    blit(p, PW, PH, full, BW, BH, ox, oy)
    if (inner) blit(p, PW, PH, inner, 320, 180, ox + BLEED.left, oy + BLEED.top)
    if (isComputer) blit(p, PW, PH, steam.frames[0], 12, 12, ox + BLEED.left + STEAM_AT[0], oy + BLEED.top + STEAM_AT[1])
    // Borda do 320×180: tracejado de 1 px logo por fora da ilustração (só na prévia).
    const x0 = ox + BLEED.left - 1, y0 = oy + BLEED.top - 1, x1 = ox + BLEED.left + 320, y1 = oy + BLEED.top + 180
    for (let x = x0; x <= x1; x++) if ((x >> 2) % 2 === 0) { p.set(pink, (y0 * PW + x) * 4); p.set(pink, (y1 * PW + x) * 4) }
    for (let y = y0; y <= y1; y++) if ((y >> 2) % 2 === 0) { p.set(pink, (y * PW + x0) * 4); p.set(pink, (y * PW + x1) * 4) }
  })
  writePng(out('art-src/previews/closeup-bleed.png'), p, PW, PH, 2)
  console.log('art-src/previews/closeup-bleed.png')
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
  // Sombra de contato da cama (specs §6): assada no room-shell, como a da prateleira.
  blit(shell, RW, RH, renderBedShadow(shell), RW, RH, 0, 0)
  // Sombra dos quadros na parede esquerda (specs §7): plana, assada no room-shell como a da prateleira.
  blit(shell, RW, RH, renderFramesShadow('A').pixels, RW, RH, 0, 0)
  const shelf = px(renderBookshelf4())
  // Headset e controle (M3, aprovados em 2026-11-10, specs §8 e §9): saem do `computer` e viram sprites próprios
  // por cima da mesa. O build confere que computer + headset + controle = o computer de antes, em todos os frames.
  const computerFrames = [0, 1, 2, 3].map((frame) => px(renderComputer({ frame, items: false })))
  const computerOnFrames = [0, 1, 2, 3].map((frame) => px(renderComputer({ frame, lamp: 'on', items: false })))
  const headset = px(renderHeadset()), controller = px(renderController())
  const computerOld = (frame, lamp) => px(renderComputer({ frame, lamp }))
  for (const [frame, lamp] of [0, 1, 2, 3].flatMap((f) => [[f, 'off'], [f, 'on']])) {
    const re = (lamp === 'on' ? computerOnFrames : computerFrames)[frame].slice()
    blit(re, RW, RH, controller, RW, RH, 0, 0)
    blit(re, RW, RH, headset, RW, RH, 0, 0)
    const old = computerOld(frame, lamp)
    for (let i = 0; i < re.length; i++) if (re[i] !== old[i]) throw new Error(`computer: sem itens + headset + controle ≠ computer antigo (frame ${frame}, ${lamp})`)
  }
  const lampOff = px(renderDeskLamp(false)), lampOn = px(renderDeskLamp(true))
  const chair = px(renderDeskChair())
  // Caderno (M3, versão A aprovada em 2026-11-08): sobre o braço B da mesa, sprite próprio (specs §5).
  const journal = px(renderJournal('A'))
  // Cama (roupa A) e celular grafite (M3, aprovados em 2026-11-08, specs §6). O celular é sprite próprio sobre a coberta.
  const bed = px(renderBed('A'))
  const phone = px(renderPhone('A'))
  const lightPhone = renderLightPhone(phone, bed)
  const towerFrames = [0, 1].map((f) => px(renderPcTower(f)))
  // Quadros (M3, variação A "galeria" aprovada em 2026-11-09, specs §7): parede esquerda, acima do braço B da mesa.
  if (ANCHOR.frames[1] !== FRAMES_ANCHOR_Y) throw new Error('frames: ANCHOR.frames ≠ FRAMES_ANCHOR_Y')
  const frames = px(renderFrames('A'))
  const lightFrames = renderLightFrames('A', px(renderFrames('A', { lit: true })))
  for (const other of [computerOnFrames[0], chair, towerFrames[0], lampOn, journal]) {
    for (let i = 0; i < RW * RH; i++) if (bed[i * 4 + 3] && other[i * 4 + 3]) throw new Error('bed: pixel em comum com a mesa, a cadeira ou o gabinete')
  }
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
  const floorObjects = [computerOnFrames[0], chair, towerFrames[0], lampOn, shelf, journal, bed, phone, frames, headset, controller]
  const lightWindow = Object.fromEntries(periods.map((p) => [p, renderLightWindow(p, [...floorObjects, windowRaw.day])]))
  // O caderno fica sobre o tampo: recorta a poça do `light-computer` e ganha a própria luz (`light-journal`).
  const lightComputer = computerOnFrames.map((c) => renderLightComputer(c, lampOn, [chair, towerFrames[0], journal, headset, controller]))
  // Headset: a parte dele que cai no brilho do monitor (a mesma do light-computer antigo). Controle: fora das luzes.
  const lightOld = [0, 1, 2, 3].map((f) => renderLightComputer(computerOld(f, 'on'), lampOn, [chair, towerFrames[0], journal]))
  const lightHeadset = lightOld[0].map((v, k) => (headset[k - (k % 4) + 3] ? v : 0))
  for (let f = 0; f < 4; f++) {
    const re = lightComputer[f].slice()
    blit(re, RW, RH, lightHeadset, RW, RH, 0, 0)
    for (let i = 0; i < re.length; i += 4) {
      if (controller[i + 3] && lightOld[f][i + 3]) throw new Error('light-computer: o controle cai numa luz')
      if (re[i + 3] !== lightOld[f][i + 3] || (re[i + 3] && (re[i] !== lightOld[f][i] || re[i + 1] !== lightOld[f][i + 1] || re[i + 2] !== lightOld[f][i + 2]))) throw new Error(`light-computer + light-headset ≠ light-computer antigo (frame ${f})`)
    }
  }
  const lightJournal = renderLightJournal(journal)
  for (let i = 0; i < RW * RH; i++) if (chair[i * 4 + 3] || towerFrames[0][i * 4 + 3]) lightJournal.fill(0, i * 4, i * 4 + 4)
  // Quadros: nenhum pixel (nem o anel de hover) em comum com outro objeto ou luz.
  const framesHover = withHoverRings(frames)
  const others = { shelf, journal, bed, phone, chair, lampOn, computer: computerOnFrames[0], tower: towerFrames[0], headset, controller, lightHeadset, lightJournal, lightPhone, ...Object.fromEntries(lightComputer.map((l, n) => [`light-computer ${n}`, l])) }
  for (const [name, o] of Object.entries(others)) {
    for (let i = 0; i < RW * RH; i++) if (framesHover[i * 4 + 3] && o[i * 4 + 3]) throw new Error(`frames: pixel (ou anel de hover) em comum com ${name}`)
  }

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
  // `light: true`: sempre iluminada, fica fora do tint do entardecer e da noite (pedido de 2026-11-09).
  const sRect = grow(bounds([shelf], RW, RH), MARGIN)
  results.bookshelf = writeSprite({
    ...common, dir: dirObjects, id: 'bookshelf',
    frames: [{ px: shelf, duration: 1000 }], tags: [{ name: 'idle', from: 0, to: 0 }],
    rect: sRect, anchor: anchorPx('bookshelf'),
    meta: { tile: anchorTile('bookshelf'), mount: 'wall-back', light: true, hit: 'alpha', minHit: [24, 24], focus: [MARGIN, MARGIN, sRect.w - 2 * MARGIN, sRect.h - 2 * MARGIN] },
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
  // Só os pixels da peça que aparecem no grupo inteiro (a base do monitor atrás do teclado sai).
  const visibleOnly = (part, whole) => {
    const out = part.slice()
    for (let i = 0; i < out.length; i += 4) {
      if (out[i + 3] && (out[i] !== whole[i] || out[i + 1] !== whole[i + 1] || out[i + 2] !== whole[i + 2])) out.fill(0, i, i + 4)
    }
    return out
  }
  // Silhueta de clique/hover do computador: só monitor e mouse (a mesa não abre o computador).
  results['computer-hit'] = writeSprite({
    ...common, dir: dirObjects, id: 'computer-hit',
    frames: [{ px: visibleOnly(px(renderComputerHit()), computerOnFrames[0]), duration: 1000 }], tags: [{ name: 'hit', from: 0, to: 0 }],
    rect: cRect, anchor: cAnchor,
    meta: { tile: anchorTile('computer'), hitMaskOf: 'computer', hit: 'none' },
  })
  results['light-computer'] = writeSprite({
    ...common, dir: dirObjects, id: 'light-computer',
    frames: lightComputer.map((p) => ({ px: p, duration: 500 })), tags: [{ name: 'night', from: 0, to: 3 }],
    rect: cRect, anchor: cAnchor,
    meta: { tile: anchorTile('computer'), layerOf: 'computer', light: true, syncFramesWith: 'computer', hit: 'none' },
  })
  const jRect = grow(bounds([journal], RW, RH), MARGIN)
  results.journal = writeSprite({
    ...common, dir: dirObjects, id: 'journal',
    frames: [{ px: journal, duration: 1000 }], tags: [{ name: 'idle', from: 0, to: 0 }],
    rect: jRect, anchor: cAnchor,
    meta: {
      tile: anchorTile('computer'), mount: 'surface', surfaceOf: 'computer', depthOffset: 0.01,
      hit: 'alpha', minHit: [24, 24], focus: [MARGIN, MARGIN, jRect.w - 2 * MARGIN, jRect.h - 2 * MARGIN],
    },
  })
  results['light-journal'] = writeSprite({
    ...common, dir: dirObjects, id: 'light-journal',
    frames: [{ px: lightJournal, duration: 1000 }], tags: [{ name: 'night', from: 0, to: 0 }],
    rect: jRect, anchor: cAnchor,
    meta: { tile: anchorTile('computer'), layerOf: 'journal', light: true, hit: 'none' },
  })
  // Headset e controle (specs §8 e §9): sobre o tampo, mesmo canvas e âncora do `computer`, como o caderno.
  for (const [id, layer] of [['headset', headset], ['controller', controller]]) {
    const sil = bounds([layer], RW, RH)
    const rect = grow(sil, MARGIN)
    results[id] = writeSprite({
      ...common, dir: dirObjects, id,
      frames: [{ px: layer, duration: 1000 }], tags: [{ name: 'idle', from: 0, to: 0 }],
      rect, anchor: cAnchor,
      meta: {
        // `light: true`: sempre iluminados, fora do tint do entardecer e da noite (pedido de 2026-11-12).
        tile: anchorTile('computer'), mount: 'surface', surfaceOf: 'computer', depthOffset: 0.01, light: true,
        hit: 'alpha', minHit: [24, 24], focus: [sil.x - rect.x, sil.y - rect.y, sil.w, sil.h],
      },
    })
  }
  results['light-headset'] = writeSprite({
    ...common, dir: dirObjects, id: 'light-headset',
    frames: [{ px: lightHeadset, duration: 1000 }], tags: [{ name: 'night', from: 0, to: 0 }],
    rect: grow(bounds([headset], RW, RH), MARGIN), anchor: cAnchor,
    meta: { tile: anchorTile('computer'), layerOf: 'headset', light: true, hit: 'none' },
  })
  // Cama: decoração, sem hover (a margem fica por padrão). Celular: interagível sobre a cama, mesma âncora (specs §6).
  const bedAnchor = anchorPx('bed')
  results.bed = writeSprite({
    ...common, dir: dirObjects, id: 'bed',
    frames: [{ px: bed, duration: 1000 }], tags: [{ name: 'idle', from: 0, to: 0 }],
    rect: grow(bounds([bed], RW, RH), MARGIN), anchor: bedAnchor,
    meta: { tile: anchorTile('bed'), mount: 'floor', footprint: [[0, 0, 4, 2]], hit: 'none' },
  })
  const phSil = bounds([phone], RW, RH)
  const pRect = grow(bounds([phone, lightPhone], RW, RH), MARGIN)
  results.phone = writeSprite({
    ...common, dir: dirObjects, id: 'phone',
    frames: [{ px: phone, duration: 1000 }], tags: [{ name: 'idle', from: 0, to: 0 }],
    rect: pRect, anchor: bedAnchor,
    meta: {
      tile: anchorTile('bed'), mount: 'surface', surfaceOf: 'bed', depthOffset: 0.01,
      hit: 'alpha', minHit: [24, 24], focus: [phSil.x - pRect.x, phSil.y - pRect.y, phSil.w, phSil.h],
    },
  })
  results['light-phone'] = writeSprite({
    ...common, dir: dirObjects, id: 'light-phone',
    frames: [{ px: lightPhone, duration: 1000 }], tags: [{ name: 'night', from: 0, to: 0 }],
    rect: pRect, anchor: bedAnchor,
    meta: { tile: anchorTile('bed'), layerOf: 'phone', light: true, hit: 'none' },
  })
  // Quadros: frame 0 = idle; frame 1 = hover (o sprite com o anel da regra 13, igual ao que o código gera; referência).
  const frSil = bounds([frames], RW, RH)
  const fRect = grow(bounds([frames, lightFrames], RW, RH), MARGIN)
  const framesAnchor = anchorPx('frames')
  results.frames = writeSprite({
    ...common, dir: dirObjects, id: 'frames',
    frames: [{ px: frames, duration: 1000 }, { px: framesHover, duration: 1000 }],
    tags: [{ name: 'idle', from: 0, to: 0 }, { name: 'hover', from: 1, to: 1 }],
    rect: fRect, anchor: framesAnchor,
    meta: {
      tile: anchorTile('frames'), mount: 'wall-left', hit: 'alpha', minHit: [24, 24],
      focus: [frSil.x - fRect.x, frSil.y - fRect.y, frSil.w, frSil.h], hoverFrame: 'hover',
    },
  })
  results['light-frames'] = writeSprite({
    ...common, dir: dirObjects, id: 'light-frames',
    frames: [{ px: lightFrames, duration: 1000 }], tags: [{ name: 'night', from: 0, to: 0 }],
    rect: fRect, anchor: framesAnchor,
    meta: { tile: anchorTile('frames'), layerOf: 'frames', light: true, hit: 'none' },
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
  place(day, results.frames)
  for (const r of byDepth(['computer', 'desk-lamp', 'journal', 'controller', 'headset', 'desk-chair', 'pc-tower', 'bed', 'phone'])) place(day, r, 0)
  writePng(out('art-src/previews/room-m2.png'), day, PW, PH, 2)

  // Noite: quarto × tint-night; luzes por cima (janela pré-tingida, luar, luz do computador).
  const room = new Uint8Array(PW * PH * 4)
  place(room, results['room-shell'])
  place(room, results.frames)
  place(room, results.computer, 0)
  place(room, results['desk-lamp'], 1)
  place(room, results.journal)
  place(room, results['desk-chair'])
  place(room, results['pc-tower'], 0)
  place(room, results.bed)
  place(room, results.phone)
  const night = bg()
  blit(night, PW, PH, multiply(room, TINT.night), PW, PH, 0, 0)
  place(night, results.bookshelf) // sempre iluminada (fora do tint)
  place(night, results.controller) // sempre iluminados (fora do tint)
  place(night, results.headset)
  place(night, results.window, 2)
  place(night, results['light-window'], 2)
  place(night, results['light-computer'], 0)
  place(night, results['light-journal'])
  place(night, results['light-headset'])
  place(night, results['light-phone'])
  place(night, results['light-frames'])
  writePng(out('art-src/previews/room-m2-night.png'), night, PW, PH, 2)
  console.log('art-src/previews/room-m2.png, art-src/previews/room-m2-night.png')
}

/** Sprite + anéis de hover (regra 13): 1 px `gold-2` por fora da silhueta e, por fora dele, 1 px `outline` (4-vizinhança). */
function withHoverRings(layer) {
  const out = layer.slice()
  const ring = (src, color) => {
    const op = (x, y) => x >= 0 && y >= 0 && x < RW && y < RH && src[(y * RW + x) * 4 + 3] > 0
    const add = []
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
      if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) add.push((y * RW + x) * 4)
    }
    for (const i of add) out.set(rgba(color), i)
  }
  ring(out, P['gold-2'])
  ring(out, P.outline)
  return out
}
