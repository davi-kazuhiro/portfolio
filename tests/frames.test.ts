import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getContent } from '@/content'
import {
  canStep,
  composeFrames,
  framesGeometry,
  parseFramesAtlas,
  stepAward,
  thumbArt,
  thumbCount,
  thumbSlotRect,
  thumbStyle,
} from '@/ui/closeup/framesAtlas'
import { HUD_BAND, pickCloseupLayout } from '@/ui/closeup/layout'
import { certificateHref } from '@/ui/panels/frames/awards'

const JSON_URL = 'assets/ui/closeup-frames.json'
const raw: unknown = JSON.parse(readFileSync('public/assets/ui/closeup-frames.json', 'utf8'))
const atlas = parseFramesAtlas(raw, JSON_URL)

describe('framesAtlas.parseFramesAtlas (specs/7-quadros.md, JSON real)', () => {
  it('lê tamanho, sangria, fundo, rects e cores', () => {
    expect(atlas.image).toBe('assets/ui/closeup-frames.png')
    expect(atlas.size).toEqual({ w: 320, h: 180 })
    expect(atlas.minScale).toBe(3)
    expect(atlas.bleed).toEqual({ left: 80, top: 64, right: 80, bottom: 64 })
    expect(atlas.panelBackground).toBe('#f6f2ec')
    expect(atlas.background).toEqual({ rect: { x: 0, y: 0, w: 320, h: 180 }, day: 'bg/day', night: 'bg/night' })
    expect(atlas.backgroundBleed).toEqual({ rect: { x: -80, y: -64, w: 480, h: 308 }, day: 'bleed/day', night: 'bleed/night' })
    expect(atlas.content).toEqual({ x: 38, y: 36, w: 156, h: 76 })
    expect(atlas.pdf).toEqual({ x: 38, y: 116, w: 72, h: 16 })
    expect(atlas.counter.text).toEqual({ x: 97, y: 162, w: 38, h: 8 })
    expect(atlas.arrows.prev.rect).toEqual({ x: 72, y: 158, w: 16, h: 16 })
    expect(atlas.arrows.next.hover).toEqual({ rect: { x: 142, y: 156, w: 20, h: 20 }, frame: 'arrow/next/hover' })
    expect(atlas.textInk).toEqual({ title: '#2f2c3a', body: '#1f4a5c', counter: '#2f2c3a' })
    expect(atlas.thumbs.slots).toBe(8)
    expect(atlas.thumbs.styles).toEqual(['wood', 'graphite', 'gold'])
    for (const f of ['bg/day', 'bg/night', 'bleed/day', 'bleed/night', 'arrow/prev/hover', 'thumb/wood', 'thumb/gold/hover', 'thumb/selected']) {
      expect(atlas.frames[f], f).toBeDefined()
    }
  })

  it('rects das vagas seguem a fórmula e os offsets batem com rects[j] − rects[0]', () => {
    for (let j = 0; j < 8; j++) {
      expect(atlas.thumbs.rects[j]).toEqual(thumbSlotRect(j))
      expect(atlas.thumbs.offsets[j]).toEqual({ x: atlas.thumbs.rects[j].x - 234, y: atlas.thumbs.rects[j].y - 18 })
    }
    expect(thumbSlotRect(5)).toEqual({ x: 274, y: 98, w: 32, h: 24 })
  })

  it('sem meta: usa os valores da spec', () => {
    const empty = parseFramesAtlas({ frames: {} }, JSON_URL)
    expect(empty.content).toEqual(atlas.content)
    expect(empty.thumbs.rects).toEqual(atlas.thumbs.rects)
    expect(empty.thumbs.offsets).toEqual(atlas.thumbs.offsets)
    expect(empty.arrows.prev.hover?.frame).toBe('arrow/prev/hover')
  })
})

describe('miniaturas', () => {
  it('estilo em ciclo madeira → grafite → dourada', () => {
    expect([0, 1, 2, 3, 4, 7].map((j) => thumbStyle(atlas, j))).toEqual(['wood', 'graphite', 'gold', 'wood', 'graphite', 'graphite'])
  })

  it('arte deslocada pelo offset da vaga; aberto = vaga vazia; hover = frame .hover', () => {
    const base = atlas.thumbs.frames.wood.rect
    const a3 = thumbArt(atlas, 3, 0, false)
    expect(a3.frame).toBe('thumb/wood')
    expect(a3.rect).toEqual({ ...base, x: base.x + 40, y: base.y + 40 })
    expect(thumbArt(atlas, 2, 0, true).frame).toBe('thumb/gold/hover')
    expect(thumbArt(atlas, 2, 2, true).frame).toBe('thumb/selected')
  })

  it('só as 8 primeiras vagas; vagas além da quantidade ficam vazias', () => {
    expect(thumbCount(atlas, 5)).toBe(5)
    expect(thumbCount(atlas, 12)).toBe(8)
    expect(thumbCount(atlas, 0)).toBe(0)
  })
})

describe('navegação', () => {
  it('presa nas pontas (não dá a volta)', () => {
    expect(stepAward(0, -1, 5)).toBe(0)
    expect(stepAward(0, 1, 5)).toBe(1)
    expect(stepAward(4, 1, 5)).toBe(4)
    expect(stepAward(3, -1, 5)).toBe(2)
    expect(stepAward(0, 1, 0)).toBe(0)
    expect(canStep(0, 'prev', 5)).toBe(false)
    expect(canStep(4, 'next', 5)).toBe(false)
    expect(canStep(2, 'next', 5)).toBe(true)
  })
})

describe('composeFrames', () => {
  it('fundo (sangria) → miniaturas deslocadas → anel das setas; só o fundo muda à noite', () => {
    const day = composeFrames(atlas, { count: 5, open: 1, night: false, hotThumb: 3, hotArrow: 'next' })
    expect(day[0]).toMatchObject({ role: 'background', frame: 'bleed/day' })
    const thumbs = day.filter((l) => l.role === 'thumb')
    // Sem frames dourados de hover: a miniatura em hover só acende o anel branco.
    expect(thumbs.map((l) => l.frame)).toEqual(['thumb/wood', 'thumb/selected', 'thumb/gold', 'thumb/wood', 'thumb/graphite'])
    expect(thumbs[3]).toMatchObject({ dx: 40, dy: 40, cue: true, hot: true })
    expect(thumbs[1]).toMatchObject({ cue: undefined })
    const arrows = day.filter((l) => l.role === 'arrow')
    expect(arrows).toEqual([
      { key: 'arrow:prev', role: 'arrow', frame: 'arrow/prev', dx: 0, dy: 0, cue: true, ringOnly: true, hot: undefined },
      { key: 'arrow:next', role: 'arrow', frame: 'arrow/next', dx: 0, dy: 0, cue: true, ringOnly: true, hot: true },
    ])

    const night = composeFrames(atlas, { count: 5, open: 1, night: true, hotThumb: 3, hotArrow: 'next' })
    expect(night[0].frame).toBe('bleed/night')
    expect(night.slice(1)).toEqual(day.slice(1))
  })

  it('seta sem destino não tem anel; mais de 8 certificados → 8 miniaturas', () => {
    const l = composeFrames(atlas, { count: 12, open: 0, night: false, hotArrow: 'prev' })
    expect(l.filter((x) => x.role === 'arrow').map((x) => x.key)).toEqual(['arrow:next'])
    expect(l.filter((x) => x.role === 'thumb')).toHaveLength(8)
  })
})

describe('geometria', () => {
  it('a 1366×768 cobre em escala ≥ 3; a 375×812 cai no modo texto', () => {
    const geo = framesGeometry(atlas)
    expect(pickCloseupLayout(1366, 768, geo, HUD_BAND).mode).toBe('cover')
    expect(pickCloseupLayout(1366, 768, geo, HUD_BAND).scale).toBeGreaterThanOrEqual(3)
    expect(pickCloseupLayout(375, 812, geo, HUD_BAND).mode).toBe('fallback')
  })
})

describe('conteúdo dos certificados (awards)', () => {
  const pt = getContent('pt').awards
  const en = getContent('en').awards

  it('PT e EN têm os mesmos ids, na mesma ordem (mais recente primeiro)', () => {
    expect(pt.length).toBeGreaterThan(0)
    expect(en.map((a) => a.id)).toEqual(pt.map((a) => a.id))
    const dates = pt.map((a) => a.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })

  it('file aponta para um arquivo que existe em public/certificates/', () => {
    for (const a of [...pt, ...en]) {
      if (!a.file) continue
      expect(a.file).toMatch(/^\/certificates\//)
      expect(certificateHref(a.file, './')).toBe(`.${a.file}`)
      expect(existsSync(`public${a.file}`), a.file).toBe(true)
    }
  })

  it('certificateHref: resolvido contra a base; URL absoluta e null ficam como estão', () => {
    expect(certificateHref('/certificates/x.pdf', '/portfolio/')).toBe('/portfolio/certificates/x.pdf')
    expect(certificateHref('https://exemplo.com/x.pdf')).toBe('https://exemplo.com/x.pdf')
    expect(certificateHref(null)).toBeNull()
  })
})
