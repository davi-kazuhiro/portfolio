// Prévias das propostas do M3 (um objeto por vez). NÃO grava em public/assets/: só em art-src/previews/.
// Quando o Davi aprovar, a exportação do objeto entra no build.mjs (pnpm art).
//
// Uso: node tools/art/build-m3.mjs bookshelf | shelf2 | shelf3 | shelf4 | 3d | journal
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rgba, writePng } from './lib.mjs'
import { TINT, UI_BG } from './palette.mjs'
import { OX, OY, RH, RW, toPx } from './room.mjs'
import { blit, bounds, crop, grow, lint, multiply } from './sheet.mjs'
import { renderComputer, renderDeskLamp } from './scenes/computer.mjs'
import { renderDeskChair, renderPcTower } from './scenes/furniture.mjs'
import { renderLightComputer, renderLightWindow } from './scenes/lights.mjs'
import { renderRoomShell } from './scenes/room-shell.mjs'
import { renderWindow } from './scenes/window.mjs'
import { renderBookshelf } from './scenes/bookshelf.mjs'
import { renderBookshelfCloseupPreviews } from './scenes/closeup-bookshelf.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const out = (rel) => {
  const path = resolve(root, rel)
  mkdirSync(dirname(path), { recursive: true })
  return path
}

const which = process.argv[2] ?? 'bookshelf'
if (which === 'bookshelf') bookshelf()
else if (which === 'shelf2') await shelf2()
else if (which === 'shelf3') await shelf3()
else if (which === 'shelf4') await shelf4()
else if (which === 'journal') await journal()
else if (which === '3d') {
  const { render3dPreviews } = await import('./scenes/closeup-3d.mjs')
  for (const f of render3dPreviews()) {
    writePng(out(`art-src/previews/${f.name}.png`), f.px, f.w, f.h, 2)
    console.log(`art-src/previews/${f.name}.png`)
  }
} else throw new Error(`objeto desconhecido: ${which}`)

function bookshelf() {
  const px = (c) => c.pixels
  const shell = px(renderRoomShell())
  const computer = px(renderComputer({ frame: 0 }))
  const computerOn = px(renderComputer({ frame: 0, lamp: 'on' }))
  const lampOff = px(renderDeskLamp(false)), lampOn = px(renderDeskLamp(true))
  const chair = px(renderDeskChair())
  const tower = px(renderPcTower(0))
  const shelf = px(renderBookshelf())
  const winDay = px(renderWindow('day'))
  const winNightRaw = px(renderWindow('night')), winNightMask = px(renderWindow('night', { mask: true }))
  const winNight = multiply(winNightRaw, TINT.night, (i) => winNightMask[i * 4] === 255)
  const lightDay = renderLightWindow('day', [computerOn, chair, tower, lampOn, winDay])
  const lightNight = renderLightWindow('night', [computerOn, chair, tower, lampOn, winDay])
  const lightComputer = renderLightComputer(computerOn, lampOn, [chair, tower])

  // Sprite proposto: recorte, margem de 2 px, âncora na base da parede sob o centro (19,5; 0; 0).
  const errors = lint(shelf)
  if (errors.length) throw new Error(`bookshelf: ${errors.join(', ')}`)
  const rect = grow(bounds([shelf], RW, RH), 2)
  const [ax, ay] = toPx(19.5, 0, 0)
  const sprite = { w: rect.w, h: rect.h, ax: ax - rect.x, ay: ay - rect.y }
  console.log(`bookshelf  ${rect.w}×${rect.h}  âncora (${sprite.ax}, ${sprite.ay})  pivot (${(sprite.ax / rect.w).toFixed(4)}, ${(sprite.ay / rect.h).toFixed(4)})  tile [2.4375, 0]`)
  // Distância vertical na tela entre a prateleira e o monitor (devem ficar separados para o hover).
  const shelfBottom = bounds([shelf], RW, RH)
  console.log(`  topo na tela y=${shelfBottom.y}, base y=${shelfBottom.y + shelfBottom.h - 1} (canvas do quarto, origem (${OX}, ${OY}))`)

  // Prévia do quarto: tudo em telas do tamanho do quarto, mesma origem; ordem = profundidade.
  const PAD = 24, PW = RW + 2 * PAD, PH = RH + 2 * PAD
  const bg = () => { const p = new Uint8Array(PW * PH * 4); for (let i = 0; i < PW * PH; i++) p.set(rgba(UI_BG), i * 4); return p }
  const put = (dst, layer) => blit(dst, PW, PH, layer, RW, RH, PAD, PAD)

  const day = bg()
  for (const l of [shell, lightDay, winDay, shelf, computer, lampOff, chair, tower]) put(day, l)
  writePng(out('art-src/previews/m3-bookshelf-room.png'), day, PW, PH, 2)

  const room = new Uint8Array(PW * PH * 4)
  for (const l of [shell, shelf, computer, lampOn, chair, tower]) put(room, l)
  const night = bg()
  blit(night, PW, PH, multiply(room, TINT.night), PW, PH, 0, 0)
  for (const l of [winNight, lightNight, lightComputer]) put(night, l)
  writePng(out('art-src/previews/m3-bookshelf-room-night.png'), night, PW, PH, 2)

  // Detalhe a 4×: prateleira + monitor (+ um pouco de mesa), dia à esquerda e noite à direita.
  const [mx0] = toPx(4, 0, 0), [mx1] = toPx(34, 0, 0)
  const top = toPx(9, 0, 58)[1], bottom = toPx(30, 12, 13)[1]
  const dr = { x: mx0 + PAD, y: top + PAD, w: mx1 - mx0, h: bottom - top }
  const gap = 4
  const DW = dr.w * 2 + gap, DH = dr.h
  const detail = new Uint8Array(DW * DH * 4)
  for (let i = 0; i < DW * DH; i++) detail.set(rgba(UI_BG), i * 4)
  blit(detail, DW, DH, crop(day, PW, PH, dr), dr.w, dr.h, 0, 0)
  blit(detail, DW, DH, crop(night, PW, PH, dr), dr.w, dr.h, dr.w + gap, 0)
  writePng(out('art-src/previews/m3-bookshelf-detail.png'), detail, DW, DH, 4)

  // Hover: mesma prévia de detalhe com o outline gold-2 por fora (como o jogo aplica).
  console.log('art-src/previews/m3-bookshelf-room.png, m3-bookshelf-room-night.png, m3-bookshelf-detail.png')

  for (const f of renderBookshelfCloseupPreviews()) {
    writePng(out(`art-src/previews/${f.name}.png`), f.px, f.w, f.h, f.scale ?? 2)
    console.log(`art-src/previews/${f.name}.png`)
  }
}

/** 2ª proposta da prateleira (2026-11-07): recorte do quarto (dia | noite) e folha de estados da visão de perto. */
async function shelf2() {
  shelfRoom(renderBookshelf().pixels, null, 'm3-shelf2-room-detail', 2, 19.5)
  const { renderShelf2Previews } = await import('./scenes/closeup-shelf2.mjs')
  for (const f of renderShelf2Previews()) {
    writePng(out(`art-src/previews/${f.name}.png`), f.px, f.w, f.h, 2)
    console.log(`art-src/previews/${f.name}.png`)
  }
}

/** 3ª proposta (2026-11-07): sem livros deitados, com cavalo de xadrez, hobbies centralizados, livro aberto menor. */
async function shelf3() {
  const { renderBookshelf3, renderBookshelf3Shadow } = await import('./scenes/bookshelf3.mjs')
  shelfRoom(renderBookshelf3().pixels, renderBookshelf3Shadow().pixels, 'm3-shelf3-room-detail', 3, 22)
  const { renderShelf3Previews } = await import('./scenes/closeup-shelf3.mjs')
  for (const f of renderShelf3Previews()) {
    writePng(out(`art-src/previews/${f.name}.png`), f.px, f.w, f.h, 2)
    console.log(`art-src/previews/${f.name}.png`)
  }
}

/**
 * 4ª proposta (2026-11-07): cavalo escuro, raquete deitada, hobbies sem legenda, cartucho com lista de ferramentas,
 * objeto em destaque com as cores de dia na visão de perto noturna.
 */
async function shelf4() {
  const { renderBookshelf4, renderBookshelf4Shadow } = await import('./scenes/bookshelf4.mjs')
  shelfRoom(renderBookshelf4().pixels, renderBookshelf4Shadow().pixels, 'm3-shelf4-room-detail', 3, 22)
  const { renderShelf4Previews } = await import('./scenes/closeup-shelf4.mjs')
  for (const f of renderShelf4Previews()) {
    writePng(out(`art-src/previews/${f.name}.png`), f.px, f.w, f.h, f.scale ?? 2)
    console.log(`art-src/previews/${f.name}.png`)
  }
}

/**
 * Recorte do quarto com a prateleira (dia | noite), mais as conferências: lint, âncora, folga até o monitor e altura.
 * `shadow` (opcional) = camada plana na parede, que vai assada no room-shell (fica sob o tint, abaixo dos objetos).
 */
function shelfRoom(shelf, shadow, name, scale, anchorX) {
  const px = (c) => c.pixels
  const shell = px(renderRoomShell())
  if (shadow) blit(shell, RW, RH, shadow, RW, RH, 0, 0)
  const computer = px(renderComputer({ frame: 0 }))
  const computerOn = px(renderComputer({ frame: 0, lamp: 'on' }))
  const lampOff = px(renderDeskLamp(false)), lampOn = px(renderDeskLamp(true))
  const chair = px(renderDeskChair()), tower = px(renderPcTower(0))
  const winDay = px(renderWindow('day'))
  const winNightRaw = px(renderWindow('night')), winNightMask = px(renderWindow('night', { mask: true }))
  const winNight = multiply(winNightRaw, TINT.night, (i) => winNightMask[i * 4] === 255)
  const occ = [computerOn, chair, tower, lampOn, winDay]
  const lightDay = renderLightWindow('day', occ), lightNight = renderLightWindow('night', occ)
  const lightComputer = renderLightComputer(computerOn, lampOn, [chair, tower])

  const errors = [...lint(shelf), ...(shadow ? lint(shadow) : [])]
  if (errors.length) throw new Error(`bookshelf: ${errors.join(', ')}`)
  const b = bounds([shelf], RW, RH), rect = grow(b, 2)
  const [ax, ay] = toPx(anchorX, 0, 0) // âncora: base da parede sob o centro da tábua
  console.log(`bookshelf  ${rect.w}×${rect.h}  âncora (${ax - rect.x}, ${ay - rect.y})  pivot (${((ax - rect.x) / rect.w).toFixed(4)}, ${((ay - rect.y) / rect.h).toFixed(4)})  tile [${anchorX / 8}, 0]`)
  // Folga até o monitor: menor distância vertical, coluna a coluna, entre o pixel mais baixo da prateleira e o mais alto do computador.
  let gap = Infinity
  for (let x = 0; x < RW; x++) {
    let low = -1, high = -1
    for (let y = 0; y < RH; y++) if (shelf[(y * RW + x) * 4 + 3]) low = y
    for (let y = 0; y < RH; y++) if (computer[(y * RW + x) * 4 + 3]) { high = y; break }
    if (low >= 0 && high >= 0) gap = Math.min(gap, high - low - 1)
  }
  // Altura máxima: topo da prateleira acima da base da parede (no ponto da âncora, px a 1×).
  console.log(`  folga até o computador: ${gap} px (1×), topo a ${ay - b.y} px acima da âncora`)

  const PAD = 24, PW = RW + 2 * PAD, PH = RH + 2 * PAD
  const bg = () => { const p = new Uint8Array(PW * PH * 4); for (let i = 0; i < PW * PH; i++) p.set(rgba(UI_BG), i * 4); return p }
  const put = (dst, layer) => blit(dst, PW, PH, layer, RW, RH, PAD, PAD)
  const day = bg()
  for (const l of [shell, lightDay, winDay, shelf, computer, lampOff, chair, tower]) put(day, l)
  const room = new Uint8Array(PW * PH * 4)
  for (const l of [shell, shelf, computer, lampOn, chair, tower]) put(room, l)
  const night = bg()
  blit(night, PW, PH, multiply(room, TINT.night), PW, PH, 0, 0)
  for (const l of [winNight, lightNight, lightComputer]) put(night, l)

  const [mx0] = toPx(4, 0, 0), [mx1] = toPx(34, 0, 0)
  const top = toPx(9, 0, 66)[1], bottom = toPx(30, 12, 13)[1]
  const dr = { x: mx0 + PAD, y: top + PAD, w: mx1 - mx0, h: bottom - top }
  const DW = dr.w * 2 + 4, DH = dr.h
  const detail = new Uint8Array(DW * DH * 4)
  for (let i = 0; i < DW * DH; i++) detail.set(rgba(UI_BG), i * 4)
  blit(detail, DW, DH, crop(day, PW, PH, dr), dr.w, dr.h, 0, 0)
  blit(detail, DW, DH, crop(night, PW, PH, dr), dr.w, dr.h, dr.w + 4, 0)
  writePng(out(`art-src/previews/${name}.png`), detail, DW, DH, scale)
  console.log(`art-src/previews/${name}.png`)
}

/**
 * Caderno (`journal`), proposta de 2026-11-08: braço B ampliado (dia | noite) para as variações A e B, e as folhas
 * da visão de perto. A prateleira aprovada (shelf4) entra no quarto, para o recorte mostrar o quarto atual.
 */
async function journal() {
  const { renderJournal, renderLightJournal } = await import('./scenes/journal.mjs')
  const { renderBookshelf4, renderBookshelf4Shadow } = await import('./scenes/bookshelf4.mjs')
  const px = (c) => c.pixels
  const shell = px(renderRoomShell())
  blit(shell, RW, RH, px(renderBookshelf4Shadow()), RW, RH, 0, 0)
  const shelf = px(renderBookshelf4())
  const computer = px(renderComputer({ frame: 0 }))
  const computerOn = px(renderComputer({ frame: 0, lamp: 'on' }))
  const lampOff = px(renderDeskLamp(false)), lampOn = px(renderDeskLamp(true))
  const chair = px(renderDeskChair()), tower = px(renderPcTower(0))
  const winDay = px(renderWindow('day'))
  const winNightRaw = px(renderWindow('night')), winNightMask = px(renderWindow('night', { mask: true }))
  const winNight = multiply(winNightRaw, TINT.night, (i) => winNightMask[i * 4] === 255)
  const occ = [computerOn, chair, tower, lampOn, winDay]
  const lightDay = renderLightWindow('day', occ), lightNight = renderLightWindow('night', occ)

  const PAD = 24, PW = RW + 2 * PAD, PH = RH + 2 * PAD
  const bg = () => { const p = new Uint8Array(PW * PH * 4); for (let i = 0; i < PW * PH; i++) p.set(rgba(UI_BG), i * 4); return p }
  const put = (dst, layer) => blit(dst, PW, PH, layer, RW, RH, PAD, PAD)
  // Recorte: braço B inteiro, a luminária e o começo do braço A (px do quarto a 1×).
  const [cx0] = toPx(0, 32, 0), [cx1] = toPx(18, 12, 0)
  const cy0 = toPx(2.5, 28, 32)[1], cy1 = toPx(14, 31, 0)[1] + 4
  const dr = { x: cx0 + PAD, y: cy0 + PAD, w: cx1 - cx0, h: cy1 - cy0 }
  const gap = 4
  const DW = dr.w * 2 + gap, DH = dr.h * 2 + gap
  const detail = new Uint8Array(DW * DH * 4)
  for (let i = 0; i < DW * DH; i++) detail.set(rgba(UI_BG), i * 4)

  for (const [row, style] of ['A', 'B'].entries()) {
    const jr = px(renderJournal(style))
    const errors = lint(jr)
    if (errors.length) throw new Error(`journal ${style}: ${errors.join(', ')}`)
    const rect = grow(bounds([jr], RW, RH), 2)
    const [ax, ay] = toPx(16, 16, 0) // objeto sobre móvel: âncora do móvel (o computer)
    console.log(`journal ${style}  ${rect.w}×${rect.h}  âncora (${ax - rect.x}, ${ay - rect.y})  pivot (${((ax - rect.x) / rect.w).toFixed(4)}, ${((ay - rect.y) / rect.h).toFixed(4)})  tile [2, 2]`)
    let touch = 0
    for (let i = 0; i < RW * RH; i++) if (jr[i * 4 + 3] && lampOn[i * 4 + 3]) touch++
    console.log(`  pixels em comum com a luminária: ${touch}`)

    const day = bg()
    for (const l of [shell, lightDay, winDay, shelf, computer, lampOff, jr, chair, tower]) put(day, l)
    const room = new Uint8Array(PW * PH * 4)
    for (const l of [shell, shelf, computer, lampOn, jr, chair, tower]) put(room, l)
    const night = bg()
    blit(night, PW, PH, multiply(room, TINT.night), PW, PH, 0, 0)
    const lightComputer = renderLightComputer(computerOn, lampOn, [chair, tower, jr])
    for (const l of [winNight, lightNight, lightComputer, renderLightJournal(jr)]) put(night, l)
    blit(detail, DW, DH, crop(day, PW, PH, dr), dr.w, dr.h, 0, row * (dr.h + gap))
    blit(detail, DW, DH, crop(night, PW, PH, dr), dr.w, dr.h, dr.w + gap, row * (dr.h + gap))
  }
  writePng(out('art-src/previews/m3-journal-room.png'), detail, DW, DH, 4)
  console.log('art-src/previews/m3-journal-room.png')

  if (process.argv[3] === 'room') return
  const { renderJournalPreviews } = await import('./scenes/closeup-journal.mjs')
  for (const f of renderJournalPreviews()) {
    writePng(out(`art-src/previews/${f.name}.png`), f.px, f.w, f.h, f.scale ?? 2)
    console.log(`art-src/previews/${f.name}.png`)
  }
}
