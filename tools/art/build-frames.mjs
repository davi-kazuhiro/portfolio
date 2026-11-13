// Exporta a visão de perto dos quadros (`frames`, M3, variação A "galeria" aprovada em 2026-11-09) para
// public/assets/ui/: closeup-frames.png (atlas) + closeup-frames.json (Hash do Aseprite, frames recortados com a posição
// na ilustração em spriteSourceSize, e meta.quartoPixel com todos os retângulos). Spec: docs/arte/specs.md §7.
// Chamado por build.mjs (pnpm art). As camadas vêm de scenes/closeup-frames.mjs (framesLayers); aqui o build confere
// que a composição das camadas na ordem do JSON é idêntica a renderFramesScene, de dia e de noite, com 0 a 8
// certificados, cada um selecionado, hover em cada miniatura e nas duas setas.
import { writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { rgba, writePng } from './lib.mjs'
import { P, UI_BG } from './palette.mjs'
import { blit, bounds, crop, lint } from './sheet.mjs'
import { flat } from './flat.mjs'
import {
  BH, BLEED, BW, CH, CW, composeFrames, framesLayers, mockDom, PAPER_THEMES, paperTheme, renderFramesScene, slotOffset, THUMB_STYLES,
} from './scenes/closeup-frames.mjs'

const ID = 'closeup-frames'
const STYLE = 'A'
const ATLAS_W = 1024
const r4 = (r) => [r.x, r.y, r.w, r.h]

export function buildFramesCloseup(out) {
  const dir = dirname(out('public/assets/ui/x'))
  const layers = framesLayers(STYLE)
  const { L } = layers

  // ---------- conferência: camadas = cena aprovada ----------
  const hovers = [-1, 'prev', 'next', ...Array.from({ length: L.slots }, (_, j) => j)]
  let states = 0
  for (const night of [false, true]) for (let count = 0; count <= L.slots; count++) {
    for (let selected = count ? 0 : -1; selected < count; selected++) for (const hover of hovers) {
      if (typeof hover === 'number' && hover >= count) continue
      const a = renderFramesScene({ style: STYLE, night, count, selected, hover }).full
      const b = composeFrames(layers, { count, selected, hover, night })
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) throw new Error(`${ID}: camadas ≠ renderFramesScene (${count} certificados, selecionado ${selected}, hover ${hover}${night ? ', noite' : ''}), px ${i >> 2}`)
      states++
    }
  }

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

  // Fundo. À noite é pré-tingido, menos a poça da luminária de quadro (que cobre tudo o que é interativo).
  const lightOnly = new Uint8Array(BW * BH * 4)
  for (const i of layers.light) lightOnly.set(layers.bleed.night.subarray(i * 4, i * 4 + 4), i * 4)
  for (const e of lint(lightOnly)) problems.push(`bleed/night (luz): ${e}`)
  const bleedRect = add('bleed/day', layers.bleed.day, { rect: { x: -BLEED.left, y: -BLEED.top, w: BW, h: BH } })
  add('bleed/night', layers.bleed.night, { rect: bleedRect, palette: false })
  add('bg/day', layers.bleed.day, { rect: { x: 0, y: 0, w: CW, h: CH } })
  add('bg/night', layers.bleed.night, { rect: { x: 0, y: 0, w: CW, h: CH }, palette: false })

  // Papel do certificado aberto (v2): um frame por tema, em ciclo pelo índice do certificado (j mod 4); traz o selo.
  const paperFrames = {}
  for (const t of PAPER_THEMES) paperFrames[t.name] = { rect: r4(add(`paper/${t.name}`, layers.papers[t.name])), frame: `paper/${t.name}` }

  // Peças que já estão em outras camadas, exportadas à parte para quem quiser redesenhá-las (não precisa compor).
  const sealRect = add('seal', layers.seal)
  const plaqueRect = add('plaque', layers.plaque)

  const arrows = {}
  for (const which of ['prev', 'next']) {
    const rect = r4(add(`arrow/${which}`, layers.arrows[which].normal))
    const hover = r4(add(`arrow/${which}/hover`, layers.arrows[which].hover))
    arrows[which] = { rect: L[which], frame: `arrow/${which}`, frameRect: rect, hover: { rect: hover, frame: `arrow/${which}/hover` } }
  }

  const thumbFrames = {}
  for (const style of THUMB_STYLES) {
    const normal = r4(add(`thumb/${style}`, layers.thumbs[style].normal))
    const hover = r4(add(`thumb/${style}/hover`, layers.thumbs[style].hover))
    thumbFrames[style] = { rect: normal, frame: `thumb/${style}`, hover: { rect: hover, frame: `thumb/${style}/hover` } }
  }
  const selectedRect = r4(add('thumb/selected', layers.selected))
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

  const slots = Array.from({ length: L.slots }, (_, j) => L.thumb(j))
  const json = {
    frames: Object.fromEntries(frames.map((f) => [f.name, {
      frame: { x: f.at[0], y: f.at[1], w: f.rect.w, h: f.rect.h },
      rotated: false,
      trimmed: true,
      spriteSourceSize: { x: f.rect.x, y: f.rect.y, w: f.rect.w, h: f.rect.h },
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
        drawOrder: [
          'background (parede, luminária, moldura grande com o papel liso, plaquinha, setas normais)',
          'paper.frames[paper.themeOf(aberto)] (papel decorado com o selo; só se houver certificado)',
          'thumbs.slots[j]: thumbs.frames[thumbs.styleOf(j)] (ou .hover), ou thumbs.selected na vaga do certificado aberto; em (slot j − slot 0)',
          'arrows[prev|next].hover (só no hover/foco)',
          'DOM: texto do certificado (text.kicker, title, desc, issuer, date), botão "Abrir PDF" (pdf), contador (counter.text)',
        ],
        background: {
          rect: [0, 0, CW, CH], day: 'bg/day', night: 'bg/night',
          bleed: { rect: r4(bleedRect), day: 'bleed/day', night: 'bleed/night' },
        },
        lamp: { plate: L.lamp.plate, arm: L.lamp.arm, bar: L.lamp.bar },
        frame: { rect: L.frame, mouldWidth: 7 },
        paper: {
          rect: L.paper,
          themes: PAPER_THEMES.map((t) => t.name),
          themeOf: 'j mod 4 → themes (petróleo, vermelho, azul, verde), j = índice do certificado aberto',
          frames: paperFrames,
          ribbon: L.ribbon,
          rule: 'sem certificado, não desenhar papel (fica o papel liso do fundo)',
        },
        text: {
          kicker: L.text.kicker, title: L.text.title, desc: L.text.desc, issuer: L.text.issuer, date: L.text.date,
          rule: 'kicker "CERTIFICADO" (i18n) em creme na fita; título (até 2 linhas) e descrição (até 3) centrados, cortados com reticências; emissor e data centrados sobre as linhas de assinatura',
        },
        pdf: { rect: L.pdf, rule: 'botão "Abrir PDF" do DOM (<a href> para o PDF, target _blank); a arte deixa o papel livre ali' },
        seal: { rect: r4(sealRect), frame: 'seal', inPaper: true },
        counter: { plaque: { rect: r4(plaqueRect), frame: 'plaque', inBackground: true }, text: L.counter, rule: 'texto "1 / 5" (DOM) em uma linha, centrado em text' },
        arrows: { ...arrows, inBackground: true, rule: 'botões do DOM nos rects; o normal já está no fundo; no hover/foco, desenhar o frame .hover (placa + anel)' },
        thumbs: {
          slots: L.slots,
          size: [slots[0][2], slots[0][3]],
          rects: slots,
          formula: '[234 + 40·(j mod 2), 18 + 40·⌊j/2⌋, 32, 24], j = 0…7, ordem de leitura (2 colunas × 4 linhas)',
          styles: THUMB_STYLES,
          styleOf: 'j mod 3 → styles (madeira, grafite, dourada)',
          frames: thumbFrames,
          selected: { rect: selectedRect, frame: 'thumb/selected', rule: 'a vaga do certificado aberto fica vazia (marca wall-5, prego) com o anel gold-2; aria-current="true"' },
          offsetRule: 'frames e rects das miniaturas estão na vaga 0; para a vaga j, somar (rects[j].x − rects[0].x, rects[j].y − rects[0].y)',
          offsets: slots.map((_, j) => slotOffset(L, j)),
          emptyRule: 'vagas sem certificado (j ≥ quantidade): nada (parede do fundo, sem prego)',
        },
        textInk: { title: P['graphite-1'], body: P['teal-1'], counter: P['graphite-1'], kicker: P['cream-3'] },
        light: { pool: L.pool },
        nightRule: 'bg/night e bleed/night são pré-tingidos (tint-night), menos a poça da luminária de quadro (elipse, light.pool), onde a barra da luminária acende em gold-3; o papel, as miniaturas, a vaga vazia, as setas, o selo e a plaquinha ficam dentro da poça e não têm variante de noite',
      },
    },
  }
  writePng(`${dir}/${ID}.png`, atlas, ATLAS_W, AH)
  writeFileSync(`${dir}/${ID}.json`, JSON.stringify(json, null, 2) + '\n')
  console.log(`${ID.padEnd(24)} atlas ${ATLAS_W}×${AH}, ${frames.length} frames (camadas = renderFramesScene em ${states} estados)`)

  // ---------- prévia: composição pelos frames do JSON (como o React faz), com a simulação do DOM ----------
  // Linha 1: 5 certificados, o 1º aberto, dia (hover na 3ª miniatura) | noite (hover em ›).
  // Linha 2: 8 certificados, o 4º aberto, dia (hover em ‹) | noite (sem hover).
  const byName = Object.fromEntries(frames.map((f) => [f.name, f]))
  const put = (dst, name, dx = 0, dy = 0) => { const f = byName[name]; blit(dst, BW, BH, f.px, f.rect.w, f.rect.h, f.rect.x + BLEED.left + dx, f.rect.y + BLEED.top + dy) }
  const compose = ({ count, selected, hover = -1, night }) => {
    const c = new Uint8Array(BW * BH * 4)
    put(c, `bleed/${night ? 'night' : 'day'}`)
    if (count > 0 && selected >= 0) put(c, `paper/${paperTheme(selected).name}`)
    for (let j = 0; j < Math.min(count, L.slots); j++) {
      const [dx, dy] = slotOffset(L, j)
      const style = THUMB_STYLES[j % 3]
      put(c, j === selected ? 'thumb/selected' : j === hover ? `thumb/${style}/hover` : `thumb/${style}`, dx, dy)
    }
    if (hover === 'prev' || hover === 'next') put(c, `arrow/${hover}/hover`)
    const ref = composeFrames(layers, { count, selected, hover, night })
    for (let i = 0; i < c.length; i++) if (c[i] !== ref[i]) throw new Error(`${ID}: prévia pelo JSON ≠ camadas, px ${i >> 2}`)
    return c
  }
  const withMock = (px) => { const c = flat(CW, CH); c.px.set(crop(px, BW, BH, { x: BLEED.left, y: BLEED.top, w: CW, h: CH })); mockDom(c, L); return c.px }
  const gap = 6, PW = CW * 2 + gap, PH = CH * 2 + gap
  const prev = new Uint8Array(PW * PH * 4)
  for (let i = 0; i < PW * PH; i++) prev.set(rgba(UI_BG), i * 4)
  ;[
    { count: 5, selected: 0, hover: 2, night: false }, { count: 5, selected: 0, hover: 'next', night: true },
    { count: 8, selected: 3, hover: 'prev', night: false }, { count: 8, selected: 3, night: true },
  ].forEach((s, n) => blit(prev, PW, PH, withMock(compose(s)), CW, CH, (n % 2) * (CW + gap), Math.floor(n / 2) * (CH + gap)))
  writePng(out('art-src/previews/closeup-frames.png'), prev, PW, PH, 2)
  console.log('art-src/previews/closeup-frames.png')
  return { full: { day: compose({ count: 5, selected: 0, night: false }), night: compose({ count: 5, selected: 0, night: true }) } }
}
