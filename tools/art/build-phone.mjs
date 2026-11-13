// Exporta a visão de perto do celular (`phone`, M3, versão A aprovada em 2026-11-08) para public/assets/ui/:
// closeup-phone.png (atlas) + closeup-phone.json (Hash do Aseprite, frames recortados com a posição na ilustração em
// spriteSourceSize, e meta.quartoPixel com todos os retângulos). Spec: docs/arte/specs.md §6.
// Chamado por build.mjs (pnpm art). As camadas vêm de scenes/closeup-phone.mjs (phoneLayers); aqui o build confere que
// a composição das camadas na ordem do JSON é idêntica a renderPhoneScene, de dia e de noite, sem hover, com hover em
// cada botão e com o currículo desativado.
import { writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { rgba, writePng } from './lib.mjs'
import { P, UI_BG } from './palette.mjs'
import { toDusk } from './scenes/closeup-bleed.mjs'
import { blit, bounds, crop, lint } from './sheet.mjs'
import { flat } from './flat.mjs'
import { SMALL_ICONS } from './scenes/closeup-journal.mjs'
import {
  APP_COLORS, BH, BLEED, BW, CH, CV_COLORS, CV_DISABLED, CW, G, ICON_DOWNLOAD, mockScreen, phoneLayers, renderPhoneScene,
} from './scenes/closeup-phone.mjs'

const ID = 'closeup-phone'
const VARIANT = 'A'
const ATLAS_W = 1024
const PIN_INK = 'red-1'
const r4 = (r) => [r.x, r.y, r.w, r.h]

export function buildPhoneCloseup(out) {
  const dir = dirname(out('public/assets/ui/x'))
  const L = phoneLayers(VARIANT)
  const ids = G.apps.ids

  // ---------- frames (rect = posição na ilustração 320×180; x/y podem ser negativos, na sangria) ----------
  const frames = []
  const problems = []
  const add = (name, px, { palette = true, rect } = {}) => {
    const b = rect ? { x: rect.x + BLEED.left, y: rect.y + BLEED.top, w: rect.w, h: rect.h } : bounds([px], BW, BH)
    if (!b) throw new Error(`${ID}: frame vazio ${name}`)
    const c = crop(px, BW, BH, b)
    for (const e of lint(c, { palette })) problems.push(`${name}: ${e}`)
    const r = { x: b.x - BLEED.left, y: b.y - BLEED.top, w: b.w, h: b.h }
    frames.push({ name, px: c, rect: r, source: [CW, CH] })
    return r
  }
  const addIcon = (name, w, h, rows, ink) => {
    const px = new Uint8Array(w * h * 4)
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'x') px.set(rgba(P[ink]), (j * w + i) * 4) }))
    for (const e of lint(px)) problems.push(`${name}: ${e}`)
    frames.push({ name, px, rect: { x: 0, y: 0, w, h }, source: [w, h], icon: true })
    return name
  }

  // Fundo. À noite é pré-tingido, menos o halo da tela (na cama, nas cores de dia).
  const haloOnly = new Uint8Array(BW * BH * 4)
  for (const i of L.halo) haloOnly.set(L.bleed.night.subarray(i * 4, i * 4 + 4), i * 4)
  for (const e of lint(haloOnly)) problems.push(`bleed/night (halo): ${e}`)
  const bleedRect = add('bleed/day', L.bleed.day, { rect: { x: -BLEED.left, y: -BLEED.top, w: BW, h: BH } })
  add('bleed/night', L.bleed.night, { rect: bleedRect, palette: false })
  add('bg/day', L.bleed.day, { rect: { x: 0, y: 0, w: CW, h: CH } })
  add('bg/night', L.bleed.night, { rect: { x: 0, y: 0, w: CW, h: CH }, palette: false })
  // Entardecer (2026-11-13): dia × tint-dusk, sem as luzes da noite (como no quarto).
  const duskBleed = toDusk(L.bleed.day, { w: BW, h: BH, ox: BLEED.left, oy: BLEED.top })
  add('bleed/dusk', duskBleed, { rect: bleedRect, palette: false })
  add('bg/dusk', duskBleed, { rect: { x: 0, y: 0, w: CW, h: CH }, palette: false })

  const phoneRect = add('phone', L.phone)
  const statusRect = add('status', L.status)
  const avatarRect = add('avatar', L.avatar)
  const dividerRect = add('divider', L.divider)

  const apps = {}
  for (const id of ids) {
    const rect = r4(add(`app/${id}`, L.apps[id].normal))
    const hover = r4(add(`app/${id}/hover`, L.apps[id].hover))
    apps[id] = { rect, frame: `app/${id}`, hover: { rect: hover, frame: `app/${id}/hover` } }
  }
  const cv = {}
  for (const k of ['pt', 'en']) {
    const st = {}
    for (const s of ['normal', 'hover', 'disabled']) {
      const name = s === 'normal' ? `cv/${k}` : `cv/${k}/${s}`
      st[s] = { rect: r4(add(name, L.cv[k][s])), frame: name }
    }
    cv[k] = { rect: G.cv[k], frame: st.normal.frame, hover: st.hover, disabled: st.disabled }
  }

  const pin = addIcon('icon/pin', 7, 7, SMALL_ICONS.pin, PIN_INK)
  const download = addIcon('icon/download', 12, 12, ICON_DOWNLOAD, CV_COLORS.ink)
  const downloadOff = addIcon('icon/download/disabled', 12, 12, ICON_DOWNLOAD, CV_DISABLED.ink)
  if (problems.length) throw new Error(problems.slice(0, 10).join('\n'))

  // ---------- conferência: composição pelos frames (ordem do JSON) = cena aprovada ----------
  const byName = Object.fromEntries(frames.map((f) => [f.name, f]))
  const put = (dst, name) => { const f = byName[name]; blit(dst, BW, BH, f.px, f.rect.w, f.rect.h, f.rect.x + BLEED.left, f.rect.y + BLEED.top) }
  const compose = (night, hover = null, cvDisabled = false) => {
    const c = new Uint8Array(BW * BH * 4)
    put(c, `bleed/${night ? 'night' : 'day'}`)
    for (const n of ['phone', 'status', 'avatar', 'divider']) put(c, n)
    for (const id of ids) put(c, hover === id ? `app/${id}/hover` : `app/${id}`)
    for (const k of ['pt', 'en']) put(c, cvDisabled ? `cv/${k}/disabled` : hover === `cv-${k}` ? `cv/${k}/hover` : `cv/${k}`)
    return c
  }
  let states = 0
  for (const night of [false, true]) {
    for (const [hover, cvDisabled] of [[null, false], [null, true], ...ids.map((id) => [id, false]), ['cv-pt', false], ['cv-en', false], ['email', true]]) {
      const a = renderPhoneScene({ variant: VARIANT, night, hover, cvDisabled }).full
      const b = compose(night, hover, cvDisabled)
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) throw new Error(`${ID}: camadas ≠ renderPhoneScene (hover ${hover}, cv ${cvDisabled ? 'desativado' : 'ativo'}${night ? ', noite' : ''}), px ${i >> 2}`)
      states++
    }
  }

  // ---------- atlas (prateleiras por altura, 1 px entre frames) ----------
  const order = [...frames].sort((a, b) => b.rect.h - a.rect.h || b.rect.w - a.rect.w)
  let x = 0, y = 0, rowH = 0
  for (const f of order) {
    if (x + f.rect.w > ATLAS_W) { x = 0; y += rowH + 1; rowH = 0 }
    f.at = [x, y]
    x += f.rect.w + 1
    rowH = Math.max(rowH, f.rect.h)
  }
  const AH = y + rowH
  const atlas = new Uint8Array(ATLAS_W * AH * 4)
  for (const f of frames) blit(atlas, ATLAS_W, AH, f.px, f.rect.w, f.rect.h, f.at[0], f.at[1])

  const { labels } = G
  const json = {
    frames: Object.fromEntries(frames.map((f) => [f.name, {
      frame: { x: f.at[0], y: f.at[1], w: f.rect.w, h: f.rect.h },
      rotated: false,
      trimmed: !f.icon,
      spriteSourceSize: f.icon ? { x: 0, y: 0, w: f.rect.w, h: f.rect.h } : { x: f.rect.x, y: f.rect.y, w: f.rect.w, h: f.rect.h },
      sourceSize: { w: f.source[0], h: f.source[1] },
      duration: 1000,
    }])),
    meta: {
      app: 'quarto-pixel tools/art',
      version: '1.0',
      image: `${ID}.png`,
      format: 'RGBA8888',
      size: { w: ATLAS_W, h: AH },
      scale: '1',
      frameTags: [],
      layers: [],
      slices: [],
      quartoPixel: {
        anchor: [0, 0],
        size: [CW, CH],
        crops: { full: [0, 0, CW, CH] },
        minScale: 3,
        bleed: BLEED,
        panelBackground: P['cream-3'],
        drawOrder: ['background', 'phone', 'statusBar', 'avatar', 'divider', 'apps.items[id] (ou .hover)', 'cv.pt e cv.en (ou .hover / .disabled)', 'DOM: nome, cargos, cidade (icons.pin), rótulos, cvLabel, texto PT/EN'],
        background: {
          rect: [0, 0, CW, CH], day: 'bg/day', night: 'bg/night', dusk: 'bg/dusk',
          bleed: { rect: r4(bleedRect), day: 'bleed/day', night: 'bleed/night', dusk: 'bleed/dusk' },
        },
        phone: { rect: r4(phoneRect), frame: 'phone', body: G.body, bodyRadius: G.bodyR },
        screen: { rect: G.screen, radius: G.screenR, header: G.header, notch: G.notch, home: G.home },
        content: G.content,
        statusBar: { rect: r4(statusRect), frame: 'status' },
        avatar: { rect: r4(avatarRect), frame: 'avatar', center: [G.avatar.cx, G.avatar.cy], radius: G.avatar.r },
        divider: { rect: r4(dividerRect), frame: 'divider' },
        slots: {
          name: G.name,
          roles: G.roles, roleLines: 3, roleLineHeight: 8,
          city: G.city,
          labels: ids.map((_, n) => [labels.x0 + n * labels.w, labels.y, labels.w, labels.h]),
          cvLabel: G.cvLabel,
        },
        apps: {
          ids, size: G.apps.size, y: G.apps.y, xs: G.apps.xs,
          items: apps,
          colors: Object.fromEntries(ids.map((id) => [id, P[APP_COLORS[id].fill]])),
        },
        cv: { ...cv, iconRect: [...G.cv.icon, 12, 12], textRect: G.cv.text, disabledHasHover: false },
        icons: {
          pin: { size: [7, 7], frame: pin },
          download: { size: [12, 12], frame: download, disabled: downloadOff },
        },
        textInk: {
          name: P['graphite-1'], body: P['teal-1'], label: P['graphite-2'], cvLabel: P['graphite-1'],
          cv: P[CV_COLORS.ink], cvDisabled: P['graphite-2'],
        },
        halo: { rect: G.halo.rect, radius: G.halo.r },
        nightRule: 'bg/night e bleed/night são pré-tingidos (tint-night), menos o halo da tela na cama; o aparelho (phone, status, avatar, divider, app, cv, icon) fica nas cores de dia à noite e não tem variante',
      },
    },
  }
  writePng(`${dir}/${ID}.png`, atlas, ATLAS_W, AH)
  writeFileSync(`${dir}/${ID}.json`, JSON.stringify(json, null, 2) + '\n')
  console.log(`${ID.padEnd(24)} atlas ${ATLAS_W}×${AH}, ${frames.length} frames (camadas = renderPhoneScene em ${states} estados)`)

  // ---------- prévia: composição pelo JSON, com o mockup do DOM; dia | noite (hover no e-mail), currículo ativo | desativado ----------
  const inner = (c) => crop(c, BW, BH, { x: BLEED.left, y: BLEED.top, w: CW, h: CH })
  const withMock = (px, cvDisabled) => { const c = flat(CW, CH); c.px.set(inner(px)); mockScreen(c, { cvDisabled }); return c.px }
  const gap = 6, PW = CW * 2 + gap, PH = CH * 2 + gap
  const prev = new Uint8Array(PW * PH * 4)
  for (let i = 0; i < PW * PH; i++) prev.set(rgba(UI_BG), i * 4)
  ;[[false, null, false], [true, 'email', false], [false, 'cv-pt', true], [true, null, true]].forEach(([night, hover, off], n) =>
    blit(prev, PW, PH, withMock(compose(night, hover, off), off), CW, CH, (n % 2) * (CW + gap), Math.floor(n / 2) * (CH + gap)))
  writePng(out('art-src/previews/closeup-phone.png'), prev, PW, PH, 2)
  console.log('art-src/previews/closeup-phone.png')
  return { full: { day: compose(false), night: compose(true) } }
}
