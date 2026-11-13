// Exporta a visão de perto do caderno (`journal`, M3, versão A aprovada em 2026-11-08) para public/assets/ui/:
// closeup-journal.png (atlas) + closeup-journal.json (Hash do Aseprite, frames recortados com a posição na
// ilustração em spriteSourceSize, e meta.quartoPixel com todos os retângulos). Spec: docs/arte/specs.md §5.
// Chamado por build.mjs (pnpm art). As camadas vêm de scenes/closeup-journal.mjs (journalLayers); aqui o build
// confere que a composição das camadas na ordem do JSON é idêntica a renderJournalScene, de dia e de noite, com 1 a
// 6 experiências, em todas as páginas.
import { writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { rgba, writePng } from './lib.mjs'
import { P, UI_BG } from './palette.mjs'
import { toDusk } from './scenes/closeup-bleed.mjs'
import { blit, bounds, crop, lint } from './sheet.mjs'
import {
  BH, BLEED, BW, CH, CW, composeJournal, journalLayers, LAMP_CU, LINE, POOL, renderJournalScene, renderPageTurnHover,
  SMALL_ICONS, TAB_SLOTS, TAB_STATES, tabRect, tabState, TICK, TYPES,
} from './scenes/closeup-journal.mjs'

const ID = 'closeup-journal'
const STYLE = 'A'
const ATLAS_W = 1024
const GOLD2 = rgba(P['gold-2'])
const r4 = (r) => [r.x, r.y, r.w, r.h]

/** Contorno de hover: 1 px `gold-2` por fora da silhueta (bíblia, regra 13), numa tela BW×BH. */
function hoverOf(px) {
  const out = px.slice()
  const op = (x, y) => x >= 0 && y >= 0 && x < BW && y < BH && px[(y * BW + x) * 4 + 3]
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    if (op(x, y)) continue
    if (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1)) out.set(GOLD2, (y * BW + x) * 4)
  }
  return out
}

export function buildJournalCloseup(out) {
  const dir = dirname(out('public/assets/ui/x'))
  const L = journalLayers(STYLE)
  const types = Object.keys(TYPES)

  // ---------- conferência: camadas = cena aprovada (1 a 6 experiências, todas as páginas, dia e noite) ----------
  // A ordem real (2026-11-09) é research, work, education (formação sempre por último).
  const configs = [
    ['research', 'work', 'education'], ['research', 'work'], ['education'], ['research', 'research', 'work', 'education'],
    ['work', 'research', 'education', 'work', 'research', 'education'],
  ]
  for (const t of types) if (!configs.some((c) => c.includes(t))) throw new Error(`${ID}: confira o tipo ${t}`)
  if (Math.max(...configs.map((c) => c.length)) !== TAB_SLOTS) throw new Error(`${ID}: confira ${TAB_SLOTS} abas`)
  let states = 0
  for (const list of configs) for (let spread = 0; spread < list.length; spread++) for (const night of [false, true]) {
    const a = renderJournalScene({ style: STYLE, spread, types: list, night }).full
    const b = composeJournal(L, list, spread, night)
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) throw new Error(`${ID}: camadas ≠ renderJournalScene em [${list}] página ${spread}${night ? ' (noite)' : ''}, px ${i >> 2}`)
    states++
  }

  // ---------- frames (rect = posição na ilustração 320×180; x/y podem ser negativos, na sangria) ----------
  const frames = []
  const problems = []
  /** px numa tela BW×BH (origem em (−80, −64) da ilustração). */
  const add = (name, px, { palette = true, rect } = {}) => {
    const b = rect ? { x: rect.x + BLEED.left, y: rect.y + BLEED.top, w: rect.w, h: rect.h } : bounds([px], BW, BH)
    if (!b) throw new Error(`${ID}: frame vazio ${name}`)
    const c = crop(px, BW, BH, b)
    for (const e of lint(c, { palette })) problems.push(`${name}: ${e}`)
    const r = { x: b.x - BLEED.left, y: b.y - BLEED.top, w: b.w, h: b.h }
    frames.push({ name, px: c, rect: r, source: [CW, CH] })
    return r
  }
  /** Frame pequeno, sem posição (caixas do checklist, ícones). */
  const addIcon = (name, w, h, draw) => {
    const px = new Uint8Array(w * h * 4)
    draw((x, y, t) => px.set(rgba(P[t]), (y * w + x) * 4))
    for (const e of lint(px)) problems.push(`${name}: ${e}`)
    frames.push({ name, px, rect: { x: 0, y: 0, w, h }, source: [w, h], icon: true })
    return name
  }

  // Fundo. À noite é pré-tingido, menos a luz (lâmpada, aro da cúpula, poça no tampo com a caneta e as sombras).
  const lightOnly = new Uint8Array(BW * BH * 4)
  for (const i of L.light) lightOnly.set(L.bleed.night.subarray(i * 4, i * 4 + 4), i * 4)
  for (const e of lint(lightOnly)) problems.push(`bleed/night (luz): ${e}`)
  const bleedRect = add('bleed/day', L.bleed.day, { rect: { x: -BLEED.left, y: -BLEED.top, w: BW, h: BH } })
  add('bleed/night', L.bleed.night, { rect: bleedRect, palette: false })
  add('bg/day', L.bleed.day, { rect: { x: 0, y: 0, w: CW, h: CH } })
  add('bg/night', L.bleed.night, { rect: { x: 0, y: 0, w: CW, h: CH }, palette: false })
  // Entardecer (2026-11-13): dia × tint-dusk, sem as luzes da noite (como no quarto).
  const duskBleed = toDusk(L.bleed.day, { w: BW, h: BH, ox: BLEED.left, oy: BLEED.top })
  add('bleed/dusk', duskBleed, { rect: bleedRect, palette: false })
  add('bg/dusk', duskBleed, { rect: { x: 0, y: 0, w: CW, h: CH }, palette: false })

  const bookRect = add('book', L.book)

  const tabs = {}
  for (const state of Object.keys(TAB_STATES)) {
    const shadow = r4(add(`tab-shadow/${state}`, L.tabShadows[state]))
    const byType = {}
    for (const type of types) {
      const px = L.tabs[state][type]
      const name = `tab/${type}/${state}`
      const rect = r4(add(name, px))
      const hover = r4(add(`${name}/hover`, hoverOf(px)))
      byType[type] = { rect, frame: name, hover: { rect: hover, frame: `${name}/hover` } }
    }
    tabs[state] = { shadow: { rect: shadow, frame: `tab-shadow/${state}` }, types: byType }
  }

  const stamps = {}
  for (const type of types) stamps[type] = { rect: r4(add(`stamp/${type}`, L.stamps[type])), frame: `stamp/${type}` }

  const pageTurn = {}
  for (const which of ['prev', 'next']) {
    const [x, y, w, h] = L.L.pageTurn[which]
    const rect = { x, y, w, h }
    add(`page-turn/${which}`, L.book, { rect })
    add(`page-turn/${which}/hover`, renderPageTurnHover(L, which), { rect })
    pageTurn[which] = { rect: [x, y, w, h], normal: `page-turn/${which}`, hover: `page-turn/${which}/hover` }
  }

  // Checklist: caixa 7×7 (`graphite-2`) em (0, 1) de um frame 9×8; o visto (tinta do tipo) sai 2 px à direita e 1 acima.
  const box = (set) => SMALL_ICONS.box.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'x') set(i, j + 1, 'graphite-2') }))
  const done = {}
  for (const type of types) done[type] = addIcon(`check/done/${type}`, 9, 8, (set) => { box(set); for (const [i, j] of TICK) set(i, j, TYPES[type].ink) })
  const checklist = {
    size: [9, 8], box: [0, 1, 7, 7], empty: addIcon('check/empty', 9, 8, box), done,
    at: [0, -2], textX: 10, defaultDone: true,
  }

  const icons = {}
  for (const name of ['pin', 'calendar']) {
    icons[name] = {}
    for (const type of types) {
      icons[name][type] = addIcon(`icon/${name}/${type}`, 7, 7, (set) =>
        SMALL_ICONS[name].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'x') set(i, j, TYPES[type].ink) })))
    }
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

  const T = L.L.tabs
  const B = LAMP_CU.base
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
        drawOrder: ['background', 'tabs.states[estado].shadow (y + pitch·j)', 'book', 'tabs.states[estado].types[tipo] (y + pitch·j)', 'stamp.frames[tipo da aberta]', 'pageTurn (hover)', 'DOM: texto, ícones, checklist'],
        background: {
          rect: [0, 0, CW, CH], day: 'bg/day', night: 'bg/night', dusk: 'bg/dusk',
          bleed: { rect: r4(bleedRect), day: 'bleed/day', night: 'bleed/night', dusk: 'bleed/dusk' },
        },
        book: { rect: r4(bookRect), frame: 'book', cover: L.L.cover, pages: L.L.pages, marginX: L.L.margin },
        content: { left: L.L.content.left, right: L.L.content.right },
        ruling: { y0: LINE.first, pitch: LINE.pitch, lineBoxTop: LINE.first - LINE.pitch + 1, linesPerPage: Math.floor(L.L.content.left[3] / LINE.pitch) },
        stamp: { rect: L.L.stamp, frames: stamps },
        pageTurn,
        tabs: {
          slots: TAB_SLOTS, pitch: T.pitch, firstY: T.firstY, size: [T.w, T.h], activeOffset: T.active,
          sides: { right: { x: T.right, grows: 'right' }, left: { x: T.left, grows: 'left' } },
          rule: 'aba j: j < aberta → "left"; j = aberta → "right-active"; j > aberta → "right". Rects e frames no slot 0: somar pitch·j em y',
          slot0: Object.fromEntries(Object.entries(TAB_STATES).map(([s, [side, active]]) => [s, tabRect(L.L, side, 0, active)])),
          label: L.L.tabLabel,
          labelInk: P['graphite-1'],
          labelRule: 'nome do tipo (i18n), texto do DOM em uma linha, centrado em label[estado] (+ pitch·j em y); fonte da cena (sceneFontSize), sem quebra',
          states: tabs,
        },
        checklist,
        icons: { size: [7, 7], frames: icons },
        types: Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [k, { tab: P[v.tab], ink: P[v.ink], stampIcon: v.icon }])),
        textInk: { title: P['graphite-1'], body: P['teal-1'] },
        light: {
          pool: { cx: POOL.cx, cy: POOL.cy, rx: POOL.rx, ry: POOL.ry },
          lampBase: [LAMP_CU.cx - B.rx, B.cy - B.ry, 2 * B.rx + 1, 2 * B.ry + B.h + 1],
        },
        nightRule: 'bg/night e bleed/night são pré-tingidos (tint-night), menos a lâmpada e a poça da luminária no tampo; o caderno (book, tab, tab-shadow, stamp, page-turn, check, icon) fica nas cores de dia à noite e não tem variante',
      },
    },
  }
  writePng(`${dir}/${ID}.png`, atlas, ATLAS_W, AH)
  writeFileSync(`${dir}/${ID}.json`, JSON.stringify(json, null, 2) + '\n')
  console.log(`${ID.padEnd(24)} atlas ${ATLAS_W}×${AH}, ${frames.length} frames (camadas = renderJournalScene em ${states} estados)`)

  // ---------- prévia: composição pelo JSON (como o React faz), páginas 1 e 2, dia | noite, com hover ----------
  const byName = Object.fromEntries(frames.map((f) => [f.name, f]))
  const put = (dst, name, dy = 0) => { const f = byName[name]; blit(dst, BW, BH, f.px, f.rect.w, f.rect.h, f.rect.x + BLEED.left, f.rect.y + BLEED.top + dy) }
  const compose = (list, spread, night, hover) => {
    const c = new Uint8Array(BW * BH * 4)
    put(c, `bleed/${night ? 'night' : 'day'}`)
    list.forEach((_, j) => put(c, `tab-shadow/${tabState(j, spread)}`, T.pitch * j))
    put(c, 'book')
    list.forEach((t, j) => put(c, `tab/${t}/${tabState(j, spread)}${hover && j !== spread ? '/hover' : ''}`, T.pitch * j))
    put(c, `stamp/${list[spread]}`)
    if (hover) put(c, spread ? 'page-turn/prev/hover' : 'page-turn/next/hover')
    return crop(c, BW, BH, { x: BLEED.left, y: BLEED.top, w: CW, h: CH })
  }
  // Linhas 1–3: a ordem real [research, work, education], páginas 1 a 3, dia | noite, hover alternado.
  // Linha 4: à esquerda, a página 2 com os retângulos do nome das abas (pontilhado `pink`); à direita, 6 abas
  // abertas na página 4 (3 abas na esquerda, a caneta saiu de lá).
  const gap = 6, PW = CW * 2 + gap, PH = CH * 4 + gap * 3
  const prev = new Uint8Array(PW * PH * 4)
  for (let i = 0; i < PW * PH; i++) prev.set(rgba(UI_BG), i * 4)
  const cell = (px, col, row) => blit(prev, PW, PH, px, CW, CH, col * (CW + gap), row * (CH + gap))
  const list = ['research', 'work', 'education']
  list.forEach((_, s) => [false, true].forEach((night, col) => cell(compose(list, s, night, (s + col) % 2 === 0), col, s)))
  const rects = compose(list, 1, false, false)
  const dot = (x, y) => { if (x >= 0 && y >= 0 && x < CW && y < CH) rects.set(rgba(P.pink), (y * CW + x) * 4) }
  list.forEach((_, j) => {
    const [x, y, w, h] = L.L.tabLabel[tabState(j, 1)]
    const yy = y + T.pitch * j
    for (let i = 0; i < w; i += 2) { dot(x + i, yy); dot(x + i, yy + h - 1) }
    for (let k = 0; k < h; k += 2) { dot(x, yy + k); dot(x + w - 1, yy + k) }
  })
  cell(rects, 0, 3)
  cell(compose(['research', 'work', 'education', 'research', 'work', 'education'], 3, true, false), 1, 3)
  writePng(out('art-src/previews/closeup-journal.png'), prev, PW, PH, 2)
  console.log('art-src/previews/closeup-journal.png')
  return { bleed: { day: byName['bleed/day'].px, night: byName['bleed/night'].px } }
}
