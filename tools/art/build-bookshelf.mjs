// Exporta a visão de perto da prateleira (M3, versão aprovada "shelf4", 2026-11-07) para public/assets/ui/:
// closeup-bookshelf.png (atlas) + closeup-bookshelf.json (Hash do Aseprite, frames recortados com a posição na
// ilustração em spriteSourceSize, e meta.quartoPixel com todos os retângulos). Spec: docs/arte/specs.md §4.
// Chamado por build.mjs (pnpm art). As camadas vêm de scenes/closeup-shelf4.mjs; aqui o build confere que a
// composição das camadas é idêntica a renderShelf4 em todos os estados, dia e noite.
import { writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { rgba, writePng } from './lib.mjs'
import { P, UI_BG } from './palette.mjs'
import { blit, bounds, crop, lint } from './sheet.mjs'
import { CH, CW } from './scenes/closeup-bookshelf.mjs'
import { allIcons, BOOK, BOOK_CONTENT, PAGE_TURN } from './scenes/closeup-shelf3.mjs'
import { BH, BLEED, BW, renderShelfBleed, DUSK_WINDOW, toDusk } from './scenes/closeup-bleed.mjs'
import { composeShelf4, HOBBY4, renderShelf4, SHELF4_IDS, shelf4Layers, TOOLS } from './scenes/closeup-shelf4.mjs'

const ID = 'closeup-bookshelf'
const ATLAS_W = 640
const GOLD2 = rgba(P['gold-2'])

/** Contorno de hover: 1 px `gold-2` por fora da silhueta (bíblia, regra 13). */
function hoverOf(px) {
  const out = px.slice()
  const op = (x, y) => x >= 0 && y >= 0 && x < CW && y < CH && px[(y * CW + x) * 4 + 3]
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    if (op(x, y)) continue
    if (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1)) out.set(GOLD2, (y * CW + x) * 4)
  }
  return out
}
const r4 = (r) => [r.x, r.y, r.w, r.h]

export function buildBookshelfCloseup(out) {
  const dir = dirname(out(`public/assets/ui/x`))
  const L = shelf4Layers()

  // ---------- conferência: camadas = cena aprovada ----------
  for (const open of Object.keys(L.highlight)) for (const night of [false, true]) {
    const a = renderShelf4({ open, night }).px, b = composeShelf4(L, open, night)
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) throw new Error(`${ID}: camadas ≠ renderShelf4 em ${open}${night ? ' (noite)' : ''}, px ${i >> 2}`)
  }

  // ---------- frames ----------
  const frames = [] // { name, px (recortado), rect: {x,y,w,h} na ilustração, palette, source: [w,h] }
  const problems = []
  /** Recorta um par dia/noite pelo mesmo retângulo; devolve { rect, day, night } (nomes dos frames). */
  const add = (name, px, { palette = true, rect } = {}) => {
    const r = rect ?? bounds([px], CW, CH)
    if (!r) throw new Error(`${ID}: frame vazio ${name}`)
    const c = crop(px, CW, CH, r)
    for (const e of lint(c, { palette })) problems.push(`${name}: ${e}`)
    frames.push({ name, px: c, rect: r, source: [CW, CH] })
    return r
  }
  // `dusk`: também exporta `<base>/dusk` = dia × tint-dusk (fundo, sombras e setas; os itens da tábua ficam
  // sempre iluminados e não têm variante).
  const dusk = (px) => toDusk(px, { w: CW, h: CH })
  const pair = (base, layer, { hover = false, withDusk = false } = {}) => {
    const rect = bounds([layer.day], CW, CH)
    add(`${base}/day`, layer.day, { rect })
    add(`${base}/night`, layer.night, { rect, palette: false })
    const res = { rect: r4(rect), day: `${base}/day`, night: `${base}/night` }
    if (withDusk) { add(`${base}/dusk`, dusk(layer.day), { rect, palette: false }); res.dusk = `${base}/dusk` }
    if (hover) {
      const hd = hoverOf(layer.day), hn = hoverOf(layer.night)
      const hr = bounds([hd], CW, CH)
      add(`${base}/hover`, hd, { rect: hr })
      add(`${base}/hover-night`, hn, { rect: hr, palette: false })
      res.hover = { rect: r4(hr), day: `${base}/hover`, night: `${base}/hover-night` }
      if (withDusk) { add(`${base}/hover-dusk`, dusk(hd), { rect: hr, palette: false }); res.hover.dusk = `${base}/hover-dusk` }
    }
    return res
  }

  const full = { x: 0, y: 0, w: CW, h: CH }
  add('bg/day', L.bg.day, { rect: full })
  add('bg/night', L.bg.night, { rect: full, palette: false })
  add('bg/dusk', dusk(L.bg.day), { rect: full, palette: false })
  // Sangria real (specs §3/§4): fundo BW×BH com bg/day|night no meio, posição (−left, −top) na ilustração.
  const bleedRect = { x: -BLEED.left, y: -BLEED.top, w: BW, h: BH }
  for (const [v, inner, night] of [['day', L.bg.day, false], ['night', L.bg.night, true]]) {
    const px = renderShelfBleed(inner, { night })
    for (const e of lint(px, { palette: !night })) problems.push(`bleed/${v}: ${e}`)
    frames.push({ name: `bleed/${v}`, px, rect: bleedRect, source: [CW, CH] })
  }
  {
    const day = frames.find((f) => f.name === 'bleed/day').px
    frames.push({ name: 'bleed/dusk', px: toDusk(day, { w: BW, h: BH, ox: BLEED.left, oy: BLEED.top, window: DUSK_WINDOW.shelf }), rect: bleedRect, source: [CW, CH] })
  }

  const kindOf = { book: 'book', duck: 'duck', hobby: 'hobby', decor: 'decor' }
  const shelf = L.pieces.map((p) => {
    const id = SHELF4_IDS[p.key] ?? p.key
    const entry = { id, kind: kindOf[p.kind], ...pair(`shelf/${id}`, p, { hover: p.kind !== 'decor' }) }
    if (p.kind !== 'decor') {
      entry.hit = entry.rect // retângulo da silhueta; o clique fino pode usar o alfa do frame
      entry.shadow = bounds([p.shadow.day], CW, CH) ? pair(`shadow/${id}`, p.shadow, { withDusk: true }) : null
    }
    return entry
  })

  const highlights = {}
  for (const [key, parts] of Object.entries(L.highlight)) {
    const id = SHELF4_IDS[key]
    const layout = key.startsWith('hobby.') ? 'hobby' : key === 'ferramentas' ? 'tools' : 'book'
    highlights[id] = {
      layout,
      shadow: pair(`highlight-shadow/${id}`, L.hlShadow[key], { withDusk: true }),
      parts: parts.map(({ part, px }) => {
        const name = `highlight/${id}/${part}`
        return { part, rect: r4(add(name, px)), frame: name }
      }),
    }
  }

  const arrows = Object.fromEntries(['prev', 'next'].map((n) => [n, pair(`arrow/${n}`, L.arrows[n], { hover: true, withDusk: true })]))

  // Ícones 8×8 das páginas (nomes = campo `icon` de skills.json; `globe` = idiomas; `code` = símbolo do livro).
  const icons = {}
  for (const [name, icon] of Object.entries(allIcons())) {
    const px = new Uint8Array(8 * 8 * 4)
    icon.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (icon.map[ch]) px.set(rgba(P[icon.map[ch]]), (j * 8 + i) * 4) }))
    for (const e of lint(px)) problems.push(`icon/${name}: ${e}`)
    frames.push({ name: `icon/${name}`, px, rect: { x: 0, y: 0, w: 8, h: 8 }, source: [8, 8], icon: true })
    icons[name] = `icon/${name}`
  }
  if (problems.length) throw new Error(problems.slice(0, 10).join('\n'))

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

  const json = {
    frames: Object.fromEntries(frames.map((f) => [f.name, {
      frame: { x: f.at[0], y: f.at[1], w: f.rect.w, h: f.rect.h },
      rotated: false,
      trimmed: !f.icon,
      spriteSourceSize: f.icon ? { x: 0, y: 0, w: 8, h: 8 } : { x: f.rect.x, y: f.rect.y, w: f.rect.w, h: f.rect.h },
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
        panelBackground: P['cream-3'],
        defaultOpen: 'languages',
        drawOrder: ['background', 'highlight.shadow', 'shelf[].shadow', 'shelf[] (sem o aberto)', 'highlight.parts', 'layouts.hobby.arrows'],
        bleed: BLEED,
        background: {
          rect: [0, 0, CW, CH], day: 'bg/day', night: 'bg/night', dusk: 'bg/dusk',
          bleed: { rect: r4(bleedRect), day: 'bleed/day', night: 'bleed/night', dusk: 'bleed/dusk' },
        },
        shelf,
        highlights,
        layouts: {
          book: { cover: BOOK.cover, pages: BOOK.pages, content: { left: BOOK_CONTENT.left, right: BOOK_CONTENT.right }, pageTurn: PAGE_TURN },
          tools: { stage: TOOLS.stage, card: TOOLS.card, content: TOOLS.content, title: { h: 13, ruleY: 13 }, firstRowY: 18, rowPitch: TOOLS.rowPitch, rowIcon: [8, 8], rowTextX: 12, maxRows: 5 },
          hobby: { stage: HOBBY4.stage, arrows, cycle: ['rubiks-cube', 'origami', 'chess', 'table-tennis'] },
        },
        icons: { size: [8, 8], frames: icons },
        nightRule: 'frames */night são pré-tingidos (tint-night); highlight/* não tem variante: fica nas cores de dia à noite',
      },
    },
  }
  writePng(`${dir}/${ID}.png`, atlas, ATLAS_W, AH)
  writeFileSync(`${dir}/${ID}.json`, JSON.stringify(json, null, 2) + '\n')
  console.log(`${ID.padEnd(24)} atlas ${ATLAS_W}×${AH}, ${frames.length} frames (camadas = renderShelf4 em 14 estados)`)

  // ---------- prévia: composição pelo JSON (como o React faz), dia | noite, padrão e cavalo ----------
  const byName = Object.fromEntries(frames.map((f) => [f.name, f]))
  const put = (dst, name) => { const f = byName[name]; blit(dst, CW, CH, f.px, f.rect.w, f.rect.h, f.rect.x, f.rect.y) }
  const scene = (openId, night) => {
    const v = night ? 'night' : 'day'
    const c = new Uint8Array(CW * CH * 4)
    put(c, `bg/${v}`)
    const h = highlights[openId]
    put(c, h.shadow[v])
    for (const s of shelf) if (s.id !== openId && s.shadow) put(c, s.shadow[v])
    for (const s of shelf) if (s.id !== openId) put(c, s[v])
    for (const p of h.parts) put(c, p.frame)
    if (h.layout === 'hobby') for (const a of Object.values(arrows)) put(c, a[v])
    return c
  }
  const gap = 6, PW = CW * 2 + gap, PH = CH * 2 + gap
  const prev = new Uint8Array(PW * PH * 4)
  for (let i = 0; i < PW * PH; i++) prev.set(rgba(UI_BG), i * 4)
  ;[['languages', false], ['languages', true], ['chess', false], ['tools', true]].forEach(([id, night], n) =>
    blit(prev, PW, PH, scene(id, night), CW, CH, (n % 2) * (CW + gap), Math.floor(n / 2) * (CH + gap)))
  writePng(out('art-src/previews/closeup-bookshelf.png'), prev, PW, PH, 2)
  console.log('art-src/previews/closeup-bookshelf.png')
  // Para a prévia da sangria (build.mjs): cena composta 320×180 e o fundo com sangria.
  return { scene, bleed: { day: byName['bleed/day'].px, night: byName['bleed/night'].px } }
}
