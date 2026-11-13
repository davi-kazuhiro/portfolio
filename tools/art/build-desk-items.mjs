// Headset (`headset`) e controle (`controller`), M3, aprovados em 2026-11-10. Spec: docs/arte/specs.md §8 e §9.
//
// buildDeskItemsCloseups(out) — chamado por build.mjs (`pnpm art`): exporta as visões de perto para public/assets/ui/
//   closeup-headset.{png,json} e closeup-controller.{png,json} (atlas + Hash do Aseprite + meta.quartoPixel), com as
//   capas geradas de src/content/pt/albums.json e games.json, e as prévias art-src/previews/closeup-headset.png e
//   closeup-controller.png (compostas pelos frames do JSON, dia | noite, legenda simulada).
// Os sprites do quarto (headset, light-headset, controller) e o `computer` sem os dois saem do próprio build.mjs.
//
//   node tools/art/build-desk-items.mjs   → só a prévia da proposta do quarto (m3-desk-items-room.png)
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { rgba, writePng } from './lib.mjs'
import { P, UI_BG } from './palette.mjs'
import { ANCHOR, RH, RW, toPx } from './room.mjs'
import { toDusk } from './scenes/closeup-bleed.mjs'
import { blit, bounds, crop, grow, lint } from './sheet.mjs'
import { flat } from './flat.mjs'
import { renderComputer, renderComputerHit, renderDeskLamp } from './scenes/computer.mjs'
import { renderController, renderHeadset } from './scenes/desk-items.mjs'
import { renderDeskChair, renderPcTower } from './scenes/furniture.mjs'
import { renderLightWindow } from './scenes/lights.mjs'
import { renderRoomShell } from './scenes/room-shell.mjs'
import { renderWindow } from './scenes/window.mjs'
import { renderBookshelf4, renderBookshelf4Shadow } from './scenes/bookshelf4.mjs'
import { renderJournal } from './scenes/journal.mjs'
import { renderBed, renderBedShadow } from './scenes/bed.mjs'
import { renderPhone } from './scenes/phone.mjs'
import { renderFrames, renderFramesShadow } from './scenes/frames.mjs'
import {
  BH, BLEED, BW, CH, CW, HEADSET_DUSK_WINDOW, ICON_BOX, loadDeskContent, mockCaption, OBJECT_FLOAT, OBJECT_SHADOW, renderControllerScene, renderHeadsetScene, STAGE,
  wrapCanvas,
} from './scenes/closeup-desk-items.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const out = (p) => resolve(root, p)
const dir = out('art-src/previews')
mkdirSync(dir, { recursive: true })
const MARGIN = 2

const opaque = (px, i) => px[i * 4 + 3] > 0
const bgFill = (W, H) => { const p = new Uint8Array(W * H * 4); for (let i = 0; i < W * H; i++) p.set(rgba(UI_BG), i * 4); return p }
/** Amplia `src` (sw×sh) por `k` e copia em `dst` (dw×dh) em (dx, dy). */
function blitScaled(dst, dw, dh, src, sw, sh, k, dx, dy) {
  for (let y = 0; y < sh * k; y++) for (let x = 0; x < sw * k; x++) {
    const s = (Math.floor(y / k) * sw + Math.floor(x / k)) * 4
    if (!src[s + 3]) continue
    const X = dx + x, Y = dy + y
    if (X >= 0 && Y >= 0 && X < dw && Y < dh) dst.set(src.subarray(s, s + 4), (Y * dw + X) * 4)
  }
}
function dottedRect(px, W, [x, y, w, h], color) {
  const c = rgba(P[color])
  const put = (i, j) => { if (i >= 0 && j >= 0 && i < W && j < px.length / 4 / W) px.set(c, (j * W + i) * 4) }
  for (let i = 0; i < w; i += 2) { put(x + i, y); put(x + i, y + h - 1) }
  for (let j = 0; j < h; j += 2) { put(x, y + j); put(x + w - 1, y + j) }
}
/** Anéis de hover (regra 13): 1 px `gold-2` por fora da silhueta e, por fora dele, 1 px `outline`. */
function withHoverRings(layer) {
  const res = layer.slice()
  const ringOf = (src, color) => {
    const op = (x, y) => x >= 0 && y >= 0 && x < RW && y < RH && src[(y * RW + x) * 4 + 3] > 0
    const add = []
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
      if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) add.push((y * RW + x) * 4)
    }
    for (const i of add) res.set(rgba(color), i)
  }
  ringOf(res, P['gold-2'])
  ringOf(res, P.outline)
  return res
}

// ================= quarto =================
function buildRoom() {
  const px = (c) => c.pixels
  const shell = px(renderRoomShell())
  blit(shell, RW, RH, renderBookshelf4Shadow().pixels, RW, RH, 0, 0)
  blit(shell, RW, RH, renderBedShadow(shell), RW, RH, 0, 0)
  blit(shell, RW, RH, renderFramesShadow('A').pixels, RW, RH, 0, 0)
  const computerOld = px(renderComputer({ frame: 0 }))
  const computer = px(renderComputer({ frame: 0, items: false }))
  const headset = px(renderHeadset()), controller = px(renderController())
  const lampOff = px(renderDeskLamp(false))
  const journal = px(renderJournal('A'))
  const chair = px(renderDeskChair()), tower = px(renderPcTower(0))
  const bed = px(renderBed('A')), phone = px(renderPhone('A'))
  const shelf = px(renderBookshelf4()), frames = px(renderFrames('A'))
  const windowDay = px(renderWindow('day'))
  const floorObjects = [computerOld, chair, tower, lampOff, shelf, journal, bed, phone, frames]
  const lightWindow = renderLightWindow('day', [...floorObjects, windowDay])

  // 1) O `computer` regerado sem os dois + os dois por cima = o `computer` de hoje.
  const recomposed = computer.slice()
  blit(recomposed, RW, RH, controller, RW, RH, 0, 0)
  blit(recomposed, RW, RH, headset, RW, RH, 0, 0)
  for (let i = 0; i < recomposed.length; i++) if (recomposed[i] !== computerOld[i]) throw new Error('computer sem itens + headset + controle ≠ computer de hoje')
  for (const [id, l] of [['headset', headset], ['controller', controller]]) {
    const e = lint(l)
    if (e.length) throw new Error(`${id}: ${e.join(', ')}`)
  }

  // 2) Silhueta de clique do computador (monitor + mouse visíveis): nem o sprite nem o anel dos dois podem tocá-la.
  const hitRaw = px(renderComputerHit())
  const hit = hitRaw.slice()
  for (let i = 0; i < RW * RH; i++) {
    const k = i * 4
    if (hit[k + 3] && (hit[k] !== computer[k] || hit[k + 1] !== computer[k + 1] || hit[k + 2] !== computer[k + 2])) hit.fill(0, k, k + 4)
  }
  const report = {}
  const others = { 'computer-hit': hit, journal, lamp: lampOff, chair, tower, bookshelf: shelf, frames }
  for (const [id, l] of [['headset', headset], ['controller', controller]]) {
    const ringed = withHoverRings(l)
    const sil = bounds([l], RW, RH)
    const rect = grow(sil, MARGIN)
    const cAnchor = toPx(...ANCHOR.computer, 0)
    // minHit: 24×24 centrado na silhueta (como o jogo aplica hoje no journal/phone)
    const cx = sil.x + sil.w / 2, cy = sil.y + sil.h / 2
    const mh = { x: Math.round(cx - 12), y: Math.round(cy - 12), w: 24, h: 24 }
    const touches = {}
    for (const [oid, o] of Object.entries(others)) {
      let ringHits = 0, boxHits = 0
      for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
        const i = y * RW + x
        if (!opaque(o, i)) continue
        if (opaque(ringed, i)) ringHits++
        if (x >= mh.x && x < mh.x + mh.w && y >= mh.y && y < mh.y + mh.h) boxHits++
      }
      touches[oid] = { ringHits, boxHits }
    }
    report[id] = {
      silhouette: sil, frame: [rect.w, rect.h], anchor: [cAnchor[0] - rect.x, cAnchor[1] - rect.y],
      focus: [sil.x - rect.x, sil.y - rect.y, sil.w, sil.h], minHitRoom: mh, touches, ringed,
    }
  }
  // hit-mask do computer: não muda (monitor + mouse); o retângulo do computer também não.
  const cRectOld = bounds([computerOld, lampOff], RW, RH), cRectNew = bounds([computer, lampOff], RW, RH)
  report.computerRectSame = JSON.stringify(cRectOld) === JSON.stringify(cRectNew)
  report.computerRect = cRectNew
  if (report.headset.touches['computer-hit'].ringHits || report.controller.touches['computer-hit'].ringHits) {
    console.warn('AVISO: anel de hover encosta na silhueta do computer-hit')
  }

  // ---------- composição (todas as peças usam a mesma tela do quarto, então é só empilhar por profundidade) ----------
  const room = new Uint8Array(RW * RH * 4)
  for (const l of [shell, lightWindow, windowDay, shelf, frames, computer, lampOff, journal]) blit(room, RW, RH, l, RW, RH, 0, 0)
  blit(room, RW, RH, report.controller.ringed, RW, RH, 0, 0)
  blit(room, RW, RH, report.headset.ringed, RW, RH, 0, 0)
  for (const l of [chair, tower, bed, phone]) blit(room, RW, RH, l, RW, RH, 0, 0)

  // Detalhe da mesa a 5×: minHit (ciano) e focus (rosa).
  const detail = room.slice()
  for (const id of ['headset', 'controller']) {
    const r = report[id]
    dottedRect(detail, RW, [r.minHitRoom.x, r.minHitRoom.y, 24, 24], 'sky-0')
    dottedRect(detail, RW, [r.silhouette.x - 1, r.silhouette.y - 1, r.silhouette.w + 2, r.silhouette.h + 2], 'pink')
  }
  const D = { x: 196, y: 118, w: 164, h: 100 }
  const det = crop(detail, RW, RH, D)
  const PAD = 24, K1 = 2, K2 = 5
  const W1 = (RW + 2 * PAD) * K1, H1 = (RH + 2 * PAD) * K1
  const W = W1 + 16 + D.w * K2, H = Math.max(H1, D.h * K2)
  const img = bgFill(W, H)
  const roomBg = bgFill(RW, RH)
  blit(roomBg, RW, RH, room, RW, RH, 0, 0)
  blitScaled(img, W, H, roomBg, RW, RH, K1, PAD * K1, PAD * K1)
  dottedRect(img, W, [PAD * K1 + D.x * K1, PAD * K1 + D.y * K1, D.w * K1, D.h * K1], 'cream-3')
  const detBg = bgFill(D.w, D.h); blit(detBg, D.w, D.h, det, D.w, D.h, 0, 0)
  blitScaled(img, W, H, detBg, D.w, D.h, K2, W1 + 16, 0)
  writePng(`${dir}/m3-desk-items-room.png`, img, W, H)
  return report
}

// ================= visões de perto: exportação (aprovadas em 2026-11-10) =================
const ATLAS_W = 1024
const r4 = (r) => [r.x, r.y, r.w, r.h]
const ARROW_SPLIT = 240 // x (px da ilustração) que separa a seta ◀ da ▶ na camada de setas

/**
 * Exporta uma visão de perto (headset ou controle) como atlas + JSON Hash do Aseprite, no formato da prateleira e
 * dos quadros: frames recortados, com a posição na ilustração em spriteSourceSize. Confere que fundo + setas + item
 * (na ordem do JSON) = a cena aprovada, de dia e de noite, para todos os itens do conteúdo.
 */
function exportCloseup(out, { id, objectId, render, content, entryKey, front, caption, duskWindow = null }) {
  const dir = dirname(out('public/assets/ui/x'))
  const list = loadDeskContent(content)
  const at = (e, o) => render({ ...o, [entryKey]: e })
  const day = { bg: true }, arr = { arrows: true }, itm = { item: true }, obj = { object: true }
  const bleed = { day: at(list[0], { parts: day }), night: at(list[0], { parts: day, night: true }) }
  const object = { day: at(list[0], { parts: obj }), night: at(list[0], { parts: obj, night: true }) }
  const arrows = { day: at(list[0], { parts: arr }).px, night: at(list[0], { parts: arr, night: true }).px }
  const items = list.map((e) => ({ e, px: at(e, { parts: itm }).px }))

  // ---------- conferência ----------
  for (const { e, px: item } of items) for (const night of [false, true]) {
    const ref = at(e, { night }).px
    const c = (night ? bleed.night : bleed.day).px.slice()
    blit(c, BW, BH, (night ? object.night : object.day).px, BW, BH, 0, 0)
    blit(c, BW, BH, night ? arrows.night : arrows.day, BW, BH, 0, 0)
    blit(c, BW, BH, item, BW, BH, 0, 0)
    for (let i = 0; i < c.length; i++) if (c[i] !== ref[i]) throw new Error(`${id}: fundo + objeto + setas + item ≠ cena (${e.id}${night ? ', noite' : ''}), px ${i >> 2}`)
  }

  // ---------- frames ----------
  const frames = [], problems = []
  const add = (name, px, { palette = true, rect } = {}) => {
    const b = rect ? { x: rect.x + BLEED.left, y: rect.y + BLEED.top, w: rect.w, h: rect.h } : bounds([px], BW, BH)
    if (!b) throw new Error(`${id}: frame vazio ${name}`)
    const c = crop(px, BW, BH, b)
    for (const e of lint(c, { palette })) problems.push(`${name}: ${e}`)
    const r = { x: b.x - BLEED.left, y: b.y - BLEED.top, w: b.w, h: b.h }
    frames.push({ name, px: c, rect: r })
    return r
  }
  const full = { x: -BLEED.left, y: -BLEED.top, w: BW, h: BH }, inner = { x: 0, y: 0, w: CW, h: CH }
  add('bleed/day', bleed.day.px, { rect: full })
  add('bleed/night', bleed.night.px, { rect: full, palette: false })
  add('bg/day', bleed.day.px, { rect: inner })
  add('bg/night', bleed.night.px, { rect: inner, palette: false })
  // Entardecer (2026-11-13): dia × tint-dusk, sem as luzes da noite (como no quarto).
  const duskBleed = toDusk(bleed.day.px, { w: BW, h: BH, ox: BLEED.left, oy: BLEED.top, window: duskWindow })
  add('bleed/dusk', duskBleed, { rect: full, palette: false })
  add('bg/dusk', duskBleed, { rect: inner, palette: false })
  const objRect = r4(add('object/day', object.day.px))
  add('object/night', object.night.px, { palette: false })
  const half = (px, right) => {
    const o = new Uint8Array(BW * BH * 4)
    for (let i = 0; i < BW * BH; i++) if (((i % BW) - BLEED.left >= ARROW_SPLIT) === right && px[i * 4 + 3]) o.set(px.subarray(i * 4, i * 4 + 4), i * 4)
    return o
  }
  const arrowMeta = {}
  for (const [which, right] of [['prev', false], ['next', true]]) {
    const fr = add(`arrow/${which}`, half(arrows.day, right))
    add(`arrow/${which}/night`, half(arrows.night, right), { palette: false })
    add(`arrow/${which}/dusk`, toDusk(half(arrows.day, right), { w: BW, h: BH }), { palette: false })
    arrowMeta[which] = { rect: STAGE.arrows[which], frameRect: r4(fr), day: `arrow/${which}`, night: `arrow/${which}/night`, dusk: `arrow/${which}/dusk` }
  }
  const itemRects = {}
  for (const { e, px } of items) itemRects[e.id] = r4(add(`item/${e.id}`, px))
  if (problems.length) throw new Error(problems.slice(0, 10).join('\n'))

  // ---------- atlas (prateleiras por altura, 1 px entre frames) ----------
  const order = [...frames].sort((a, b) => b.rect.h - a.rect.h || b.rect.w - a.rect.w)
  let x = 0, y = 0, rowH = 0
  for (const f of order) {
    if (x + f.rect.w > ATLAS_W) { x = 0; y += rowH + 1; rowH = 0 }
    f.at = [x, y]; x += f.rect.w + 1; rowH = Math.max(rowH, f.rect.h)
  }
  const AH = y + rowH
  const atlas = new Uint8Array(ATLAS_W * AH * 4)
  for (const f of frames) blit(atlas, ATLAS_W, AH, f.px, f.rect.w, f.rect.h, f.at[0], f.at[1])
  const [sx, sy, srx, sry] = STAGE.shadow
  const json = {
    frames: Object.fromEntries(frames.map((f) => [f.name, {
      frame: { x: f.at[0], y: f.at[1], w: f.rect.w, h: f.rect.h },
      rotated: false, trimmed: true,
      spriteSourceSize: { x: f.rect.x, y: f.rect.y, w: f.rect.w, h: f.rect.h },
      sourceSize: { w: CW, h: CH },
      duration: 1000,
    }])),
    meta: {
      app: 'quarto-pixel tools/art', version: '1.0', image: `${id}.png`, format: 'RGBA8888',
      size: { w: ATLAS_W, h: AH }, scale: '1', frameTags: [], layers: [], slices: [],
      quartoPixel: {
        anchor: [0, 0],
        size: [CW, CH],
        crops: { full: [0, 0, CW, CH] },
        minScale: 3,
        bleed: BLEED,
        drawOrder: [
          'background (fundo + as duas sombras paradas no tampo; já pré-tingido à noite)',
          'object.frame.day ou .night, dentro de um wrapper que flutua (object.float, defasado do item)',
          'arrows.prev / arrows.next (frame day ou night)',
          'items.frame do item aberto, dentro de um wrapper que flutua (stage.float); sempre nas cores de dia',
          'DOM: legenda (stage.caption) e botões das setas (arrows.*.rect)',
        ],
        background: {
          rect: [0, 0, CW, CH], day: 'bg/day', night: 'bg/night', dusk: 'bg/dusk',
          bleed: { rect: r4(full), day: 'bleed/day', night: 'bleed/night', dusk: 'bleed/dusk' },
        },
        object: {
          id: objectId, rect: objRect, frame: { day: 'object/day', night: 'object/day' }, interactive: false,
          shadow: { center: OBJECT_SHADOW[objectId].slice(0, 2), radii: OBJECT_SHADOW[objectId].slice(2), inBackground: true, rule: 'parada: não acompanha a flutuação' },
          float: { amplitude: OBJECT_FLOAT.amplitude, periodMs: OBJECT_FLOAT.periodMs, phaseMs: OBJECT_FLOAT.phaseMs, rule: 'como stage.float, com animation-delay −phaseMs (meio ciclo: a animação é alternate, ciclo de 2×periodMs): sobe quando o item desce; parado com prefers-reduced-motion' },
        },
        stage: {
          front,
          shadow: { center: [sx, sy], radii: [srx, sry], inBackground: true, rule: 'parada: não acompanha a flutuação' },
          float: { amplitude: STAGE.float, periodMs: OBJECT_FLOAT.periodMs, phaseMs: 0, rule: 'como .shelf__float da prateleira: translateY 0 → −amplitude·s, 1,8 s ease-in-out alternate; parado com prefers-reduced-motion' },
          caption: { rect: STAGE.caption, ...caption, rule: 'DOM, centrado no rect, como .shelf__caption (VT323 cream-3 com contorno outline e sombra para baixo, sem fundo); linha 2 menor, gold-3' },
        },
        arrows: { ...arrowMeta, rule: 'botões do DOM nos rects (anel branco piscando, regra 14); ← → e swipe também trocam; a lista dá a volta' },
        items: {
          content: `src/content/{pt,en}/${content}.json`,
          order: list.map((e) => e.id),
          frame: 'item/<id>',
          rects: itemRects,
          rule: content === 'games'
        ? 'ícone desenhado à mão escolhido pelo campo `icon` (valorant-v, grass-block/dirt-block, soccer-ball, pokeball, mushroom), sem texto; cada um tem o seu rect; jogo novo pede `pnpm art`'
        : 'o mesmo rect para todos (a capa é gerada a partir de cover {bg, fg, dark, ink, motif} e coverText ?? title); conteúdo novo pede `pnpm art`',
        },
        nightRule: 'bg/bleed e setas pré-tingidos (tint-night); o objeto 3D e o item ficam sempre nas cores de dia (sempre iluminados, pedido de 2026-11-12). object/night continua exportado, fora de uso',
      },
    },
  }
  writePng(`${dir}/${id}.png`, atlas, ATLAS_W, AH)
  writeFileSync(`${dir}/${id}.json`, JSON.stringify(json, null, 2) + '\n')
  console.log(`${id.padEnd(24)} atlas ${ATLAS_W}×${AH}, ${frames.length} frames (camadas = cena para ${list.length} itens, dia e noite)`)

  // ---------- prévia pelo JSON (como o React faz) ----------
  const byName = Object.fromEntries(frames.map((f) => [f.name, f]))
  const put = (dst, name) => { const f = byName[name]; blit(dst, BW, BH, f.px, f.rect.w, f.rect.h, f.rect.x + BLEED.left, f.rect.y + BLEED.top) }
  const compose = (e, night) => {
    const c = new Uint8Array(BW * BH * 4)
    put(c, `bleed/${night ? 'night' : 'day'}`)
    put(c, `object/${night ? 'night' : 'day'}`)
    for (const w of ['prev', 'next']) put(c, night ? `arrow/${w}/night` : `arrow/${w}`)
    put(c, `item/${e.id}`)
    const ref = at(e, { night }).px
    for (let i = 0; i < c.length; i++) if (c[i] !== ref[i]) throw new Error(`${id}: prévia pelo JSON ≠ cena, px ${i >> 2}`)
    return c
  }
  return { list, compose }
}

export function buildDeskItemsCloseups(out) {
  const hs = exportCloseup(out, {
    id: 'closeup-headset', objectId: 'headset', content: 'albums', entryKey: 'album',
    render: (o) => renderHeadsetScene(o), front: STAGE.item,
    caption: { lines: ['title', 'artist'] }, duskWindow: HEADSET_DUSK_WINDOW,
  })
  const ct = exportCloseup(out, {
    id: 'closeup-controller', objectId: 'controller', content: 'games', entryKey: 'game',
    render: (o) => renderControllerScene(o), front: ICON_BOX,
    caption: { lines: ['title', 'genre'] },
  })
  // Prévias (2026-11-12): folha com todas as capas de álbum e folha com todos os ícones de jogo, de dia, recortadas
  // da cena composta pelos frames do JSON (palco + sombra), com a legenda simulada embaixo.
  const strip = (path, res, rect, line2) => {
    const [rx, ry, rw, rh] = rect, gap = 6, k = 3
    const W = (rw * res.list.length + gap * (res.list.length - 1)) * k, H = rh * k
    const img = bgFill(W, H)
    res.list.forEach((e, n) => {
      const c = flat(BW, BH); c.px.set(res.compose(e, false))
      mockCaption(wrapCanvas(c, BLEED.left, BLEED.top), e.title, e[line2] ?? '')
      blitScaled(img, W, H, crop(c.px, BW, BH, { x: rx + BLEED.left, y: ry + BLEED.top, w: rw, h: rh }), rw, rh, k, n * (rw + gap) * k, 0)
    })
    writePng(path, img, W, H)
  }
  strip(out('art-src/previews/closeup-headset-albums.png'), hs, [168, 8, 136, 146], 'artist')
  strip(out('art-src/previews/closeup-controller-games.png'), ct, [168, 30, 136, 124], 'genre')
  console.log('art-src/previews/closeup-headset-albums.png, art-src/previews/closeup-controller-games.png')
}

// Linha de comando: `node tools/art/build-desk-items.mjs --proposal` regera a prévia da proposta do quarto
// (m3-desk-items-room.png, com anéis, minHit e focus). A exportação de verdade é pelo `pnpm art` (build.mjs).
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const report = buildRoom()
  for (const id of ['headset', 'controller']) {
    const { ringed: _ringed, ...r } = report[id]
    console.log(id, JSON.stringify(r))
  }
  console.log('art-src/previews/m3-desk-items-room.png')
}
