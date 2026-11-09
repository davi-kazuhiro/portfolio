import { describe, expect, it } from 'vitest'
import { bleedStrips } from '@/ui/closeup/bleed'
import { HUD_BAND, pickCloseupLayout, screenFontSize, type CloseupGeometry, type CloseupLayout } from '@/ui/closeup/layout'
import { bootSequence, parseCloseupSheet, parseOverlay, resolveSibling, SPEC, toRect, type CloseupSheet } from '@/ui/closeup/sheet'
import computerJson from '../public/assets/ui/closeup-computer.json'
import steamJson from '../public/assets/ui/closeup-computer-steam.json'

// Os testes do algoritmo de layout usam uma geometria fixa (a do M2: tela de 224×126 na ilustração de 320×180),
// para os números não mudarem a cada redesenho da arte. A geometria atual do computador é testada à parte, abaixo.
const GEO: CloseupGeometry = {
  size: { w: 320, h: 180 },
  contentRect: { x: 48, y: 11, w: 224, h: 126 },
  crops: { full: { x: 0, y: 0, w: 320, h: 180 } },
}
const CURRENT: CloseupGeometry = { size: SPEC.size, contentRect: SPEC.contentRect, crops: SPEC.crops, bleed: { left: 80, top: 64, right: 80, bottom: 64 } }
const JSON_URL = 'assets/ui/closeup-computer.json'
const FRAME_URL = 'assets/ui/closeup-computer-frame.png'

const inside = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h

const REAL = { left: 80, top: 64, right: 80, bottom: 64 }
const GEO_REAL: CloseupGeometry = { ...GEO, bleed: REAL }

describe('closeup/layout com a geometria atual do computador (tela 204×92, vista de cima)', () => {
  const at = (w: number, h: number) => pickCloseupLayout(w, h, CURRENT, HUD_BAND)
  it.each([[1920, 1080, 4], [1536, 864, 4], [1440, 900, 4], [1366, 768, 4], [1280, 720, 4], [1024, 768, 4], [2560, 1440, 6]])(
    '%i×%i → %i×, painel com no mínimo 640×360 e abaixo do HUD',
    (w, h, s) => {
      const l = at(w, h)
      expect(l).toMatchObject({ mode: 'cover', scale: s })
      expect(l.content.w >= 640 && l.content.h >= 360).toBe(true)
      expect(l.content.y).toBeGreaterThanOrEqual(HUD_BAND)
    },
  )
  it('1280×720 e 1366×768: largura inteira da ilustração e o tampo inteiro (até a aresta da frente, y 172) visíveis', () => {
    for (const [w, h] of [[1280, 720], [1366, 768]]) {
      const l = at(w, h)
      const left = l.view.x + (0 - l.crop.x) * l.scale
      const top = l.view.y + (0 - l.crop.y) * l.scale
      expect(left >= 0 && left + 320 * l.scale <= w, `${w}×${h}`).toBe(true)
      expect(top + 172 * l.scale <= h, `${w}×${h}`).toBe(true)
    }
  })
})

describe('closeup/layout.pickCloseupLayout com sangria real (80/64, specs.md §3 "Tela cheia")', () => {
  const at = (w: number, h: number) => pickCloseupLayout(w, h, GEO_REAL, HUD_BAND)
  const scales: [number, number, number][] = [
    [1920, 1080, 4], [1536, 864, 4], [1440, 900, 3], [1366, 768, 3], [1280, 720, 3], [1024, 768, 3], [2560, 1440, 6], [768, 1024, 3],
  ]
  it.each(scales)('%i×%i → %i× (a menor escala que cobre com arte)', (w, h, s) => {
    expect(at(w, h)).toMatchObject({ mode: 'cover', scale: s })
  })
  it('1366×768 a 3×: ilustração centralizada, arte real cobre tudo, região desenhada = célula 480×308', () => {
    const l = at(1366, 768)
    expect(l.crop).toEqual({ x: -80, y: -64, w: 480, h: 308 })
    expect(l.view).toEqual({ x: 203 - 240, y: 114 - 192, w: 1440, h: 924 })
    expect(l.bleed).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
    expect(l.content).toEqual({ x: 203 + 144, y: 114 + 33, w: 672, h: 378 })
  })
  it('1920×1080 a 4×: a ilustração inteira no centro, sangria real dividida', () => {
    const l = at(1920, 1080)
    expect(l.view).toEqual({ x: 0, y: 180 - 256, w: 1920, h: 1232 })
    expect(l.content).toEqual({ x: 320 + 192, y: 180 + 44, w: 896, h: 504 })
  })
  it('768×1024 (retrato): 3× com 50 px de sangria sintética em cima e embaixo; celular → fallback', () => {
    expect(at(768, 1024).bleed).toEqual({ top: 50, right: 0, bottom: 50, left: 0 })
    for (const [w, h] of [[375, 812], [412, 915], [360, 740]]) expect(at(w, h).mode, String([w, h])).toBe('fallback')
  })
  it('invariantes: cobre, conteúdo visível abaixo do HUD; a escala é a menor que cobre só com arte', () => {
    for (let w = 640; w <= 3840; w += 53) {
      for (let h = 400; h <= 2160; h += 47) {
        const l = at(w, h)
        if (l.mode === 'fallback') continue
        const tag = String([w, h])
        const { view: v, bleed: b, content: c, scale: s } = l
        expect(b, tag).toEqual({ left: Math.max(0, v.x), top: Math.max(0, v.y), right: Math.max(0, w - v.x - v.w), bottom: Math.max(0, h - v.y - v.h) })
        expect(inside(c, { x: 0, y: HUD_BAND, w, h: h - HUD_BAND }), tag).toBe(true)
        expect(inside(c, v), tag).toBe(true)
        // Se a escolhida cobre só com arte, nenhuma escala menor também cobre.
        if (Object.values(b).every((n) => n === 0)) {
          for (let k = 3; k < s; k++) {
            const smaller = pickCloseupLayout(w, h, { ...GEO_REAL, minScale: k }, HUD_BAND)
            if (smaller.scale === k) expect(Object.values(smaller.bleed).some((n) => n > 0), tag + ' ' + k).toBe(true)
          }
        }
      }
    }
  })
})

describe('closeup/layout.pickCloseupLayout sem sangria real (JSON antigo, sangria sintética)', () => {
  const at = (w: number, h: number) => pickCloseupLayout(w, h, GEO, HUD_BAND)

  it('1920×1080 → 6×: a ilustração inteira é exatamente a janela, sem sangria', () => {
    const l = at(1920, 1080)
    expect([l.mode, l.scale]).toEqual(['cover', 6])
    expect(l.view).toEqual({ x: 0, y: 0, w: 1920, h: 1080 })
    expect(l.bleed).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
    expect(l.content).toEqual({ x: 48 * 6, y: 11 * 6, w: 224 * 6, h: 126 * 6 })
  })
  it('1366×768 → 5×: corta as laterais e desce 9 px (parede esticada) para a tela sair do HUD', () => {
    const l = at(1366, 768)
    expect([l.mode, l.scale]).toEqual(['cover', 5])
    expect(l.view).toEqual({ x: -117, y: 9, w: 1600, h: 900 })
    expect(l.bleed).toEqual({ top: 9, right: 0, bottom: 0, left: 0 })
    expect(l.content).toEqual({ x: -117 + 240, y: 64, w: 1120, h: 630 })
  })
  it('1280×720 → 4× com a cena inteira na largura (5 px de arte de parede no topo contam como cobertura)', () => {
    const l = at(1280, 720)
    expect([l.scale, l.view.x, l.view.w]).toEqual([4, 0, 1280])
    expect(l.bleed.top).toBe(20)
    expect(l.content.y).toBe(64)
  })
  it('1536×864 → 6× (cobre sem sangria nenhuma); 1180×820 (tablet deitado) → 5×, sem sangria lateral', () => {
    expect(at(1536, 864)).toMatchObject({ mode: 'cover', scale: 6 })
    const l = at(1180, 820)
    expect([l.mode, l.scale, l.bleed.left, l.bleed.right]).toEqual(['cover', 5, 0, 0])
  })
  it('retrato (768×1024, 820×1180) e celular → fallback (a sangria passaria de 32 px de arte por lado)', () => {
    for (const [w, h] of [[768, 1024], [820, 1180], [375, 812], [412, 915], [360, 740], [812, 375]]) {
      const l = at(w, h)
      expect(l.mode, `${w}×${h}`).toBe('fallback')
      expect(l.scale).toBe(0)
      expect(l.content).toEqual({ x: 0, y: 0, w, h })
    }
  })
  it('respeita minContent e minScale do JSON', () => {
    // 700×400 sem faixa do HUD: a tela a 3× (672×378) cabe e a arte (960×540) cobre.
    expect(pickCloseupLayout(700, 400, GEO)).toMatchObject({ mode: 'cover', scale: 3 })
    expect(pickCloseupLayout(600, 400, GEO).mode).toBe('fallback')
    const loose = { ...GEO, minScale: 2, minContent: { w: 400, h: 200 } }
    expect(pickCloseupLayout(600, 400, loose)).toMatchObject({ mode: 'cover', scale: 2 })
    const strict = { ...GEO, minContent: { w: 2000, h: 800 } }
    expect(pickCloseupLayout(1920, 1080, strict).mode).toBe('fallback')
  })
  it('invariantes: cobre a janela, conteúdo inteiro visível e abaixo do HUD, px inteiros, sangria ≤ 32 px de arte', () => {
    let covers = 0
    for (let w = 320; w <= 3840; w += 37) {
      for (let h = 320; h <= 2160; h += 41) {
        const l = at(w, h)
        if (l.mode === 'fallback') continue
        covers++
        const tag = `${w}×${h}`
        const { view: v, bleed: b, content: c, scale: s } = l
        expect(Number.isInteger(s) && s >= 3, tag).toBe(true)
        for (const n of [...Object.values(v), ...Object.values(c), ...Object.values(b)]) expect(Number.isInteger(n), tag).toBe(true)
        // Arte + sangria = janela inteira.
        expect(b.left, tag).toBe(Math.max(0, v.x))
        expect(b.top, tag).toBe(Math.max(0, v.y))
        expect(b.right, tag).toBe(Math.max(0, w - v.x - v.w))
        expect(b.bottom, tag).toBe(Math.max(0, h - v.y - v.h))
        for (const n of Object.values(b)) expect(n, tag).toBeLessThanOrEqual(32 * s)
        // Conteúdo inteiro visível, fora da faixa do HUD e dentro da arte.
        expect(inside(c, { x: 0, y: HUD_BAND, w, h: h - HUD_BAND }), tag).toBe(true)
        expect(inside(c, v), tag).toBe(true)
        expect(c.w, tag).toBeGreaterThanOrEqual(640)
      }
    }
    expect(covers).toBeGreaterThan(100)
  })
  it('entre escalas sem sangria, fica com a menor (mais contexto)', () => {
    // 2560×1440: 8× cobre exatamente; 9× também cobriria, mas corta mais.
    expect(at(2560, 1440)).toMatchObject({ scale: 8, bleed: { top: 0, right: 0, bottom: 0, left: 0 } })
  })
})

describe('closeup/bleed.bleedStrips', () => {
  const src = { image: 'a.png', sheet: { w: 640, h: 180 }, sx: 320, sy: 0, w: 320, h: 180 }
  it('sem sangria, nenhuma faixa', () => {
    expect(bleedStrips(src, 4, 0, 0, { top: 0, right: 0, bottom: 0, left: 0 })).toEqual([])
  })
  it('topo: a linha amostrada esticada pela altura da faixa, largura em escala inteira', () => {
    const [t] = bleedStrips(src, 5, -117, 9, { top: 9, right: 0, bottom: 0, left: 0 })
    expect(t.key).toBe('t')
    expect(t.style).toMatchObject({ left: -117, top: 0, width: 1600, height: 9 })
    // Cada linha do PNG vira 9 px; a linha 0 começa em 0.
    expect(t.style.backgroundSize).toBe(`${640 * 5}px ${180 * 9}px`)
    expect(t.style.backgroundPosition).toBe(`${-320 * 5}px 0px`)
  })
  it('lados e cantos: a coluna da borda esticada', () => {
    const strips = bleedStrips(src, 3, 20, 10, { top: 10, right: 6, bottom: 4, left: 20 })
    expect(strips.map((b) => b.key).sort()).toEqual(['b', 'bl', 'br', 'l', 'r', 't', 'tl', 'tr'])
    const r = strips.find((b) => b.key === 'r')!
    expect(r.style).toMatchObject({ left: 20 + 960, top: 10, width: 6, height: 540 })
    expect(r.style.backgroundPosition).toBe(`${-(320 + 319) * 6}px 0px`)
    const bl = strips.find((b) => b.key === 'bl')!
    expect(bl.style).toMatchObject({ left: 0, top: 550, width: 20, height: 4 })
    expect(bl.style.backgroundPosition).toBe(`${-320 * 20}px ${-179 * 4}px`)
  })
})

describe('closeup/layout.screenFontSize', () => {
  const at = (mode: CloseupLayout['mode'], scale: number) => ({ ...pickCloseupLayout(1920, 1080, GEO), mode, scale })
  it('fallback: 16 px', () => {
    expect(screenFontSize(pickCloseupLayout(375, 812, GEO))).toBe(16)
  })
  it('4 px de arte por letra, mínimo 14 px', () => {
    expect(screenFontSize(at('cover', 3))).toBe(14)
    expect(screenFontSize(at('cover', 4))).toBe(16)
    expect(screenFontSize(at('cover', 5))).toBe(20)
    expect(screenFontSize(at('cover', 6))).toBe(24)
  })
})

describe('closeup/sheet helpers', () => {
  it('toRect aceita array e objeto, com fallback', () => {
    const d = { x: 1, y: 2, w: 3, h: 4 }
    expect(toRect([5, 6, 7, 8], d)).toEqual({ x: 5, y: 6, w: 7, h: 8 })
    expect(toRect({ x: 5, w: 7 }, d)).toEqual({ x: 5, y: 2, w: 7, h: 4 })
    expect(toRect([1, 2, 3], d)).toEqual(d)
    expect(toRect(null, d)).toEqual(d)
  })
  it('resolveSibling resolve relativo ao JSON e mantém absolutos', () => {
    expect(resolveSibling('assets/ui/a.json', 'b.png')).toBe('assets/ui/b.png')
    expect(resolveSibling('a.json', 'b.png')).toBe('b.png')
    expect(resolveSibling('assets/ui/a.json', '/x/b.png')).toBe('/x/b.png')
    expect(resolveSibling('assets/ui/a.json', 'data:image/png;base64,AA')).toBe('data:image/png;base64,AA')
  })
})

describe('closeup/sheet.parseCloseupSheet', () => {
  const sheet = parseCloseupSheet(computerJson, JSON_URL, FRAME_URL)

  it('lê o JSON gerado (public/assets/ui/closeup-computer.json)', () => {
    expect(sheet.image).toBe('assets/ui/closeup-computer.png')
    expect(sheet.size).toEqual({ w: 320, h: 180 })
    // Células de 480×308 (ilustração 320×180 + sangria 80/64), frames apontando só para a ilustração.
    expect(sheet.sheet).toEqual({ w: 8 * 480, h: 308 })
    expect(sheet.bleed).toEqual({ left: 80, top: 64, right: 80, bottom: 64 })
    expect(sheet.contentRect).toEqual(SPEC.contentRect)
    expect(sheet.crops).toEqual(SPEC.crops)
    expect(sheet.minContent).toEqual(SPEC.minContent)
    expect(sheet.minScale).toBe(3)
  })
  it('tags na ordem do arquivo com frames lado a lado', () => {
    expect(Object.keys(sheet.tags).sort()).toEqual(['boot', 'boot-night', 'off', 'off-night', 'on', 'on-night'])
    expect(sheet.tags.off.map((f) => f.x)).toEqual([80])
    expect(sheet.tags.boot).toEqual([{ x: 560, y: 64, duration: 60 }, { x: 1040, y: 64, duration: 60 }])
    expect(sheet.tags.on.map((f) => f.x)).toEqual([1520])
    expect(sheet.tags['boot-night'].map((f) => f.x)).toEqual([2480, 2960])
    expect(sheet.tags['on-night'].map((f) => f.x)).toEqual([3440])
  })
  it('9-slice: aceita `slices` (objeto) e resolve a imagem ao lado do JSON', () => {
    expect(sheet.frame9.image).toBe('assets/ui/closeup-computer-frame.png')
    expect(sheet.frame9.size).toEqual({ w: 48, h: 48 })
    expect(sheet.frame9.slice).toEqual({ top: 9, right: 8, bottom: 15, left: 8 })
    expect(sheet.frame9.scale).toBe(2)
  })
  it('JSON vazio ou inválido cai nos valores da spec', () => {
    for (const bad of [null, 42, 'x', [], {}]) {
      const s = parseCloseupSheet(bad, JSON_URL, FRAME_URL)
      expect(s.size).toEqual(SPEC.size)
      expect(s.contentRect).toEqual(SPEC.contentRect)
      expect(s.crops.full).toEqual({ x: 0, y: 0, w: 320, h: 180 })
      expect(s.crops.monitor).toEqual(SPEC.crops.monitor)
      expect(s.tags).toEqual({})
      expect(s.frame9.image).toBe(FRAME_URL)
      expect(s.frame9.slice).toEqual(SPEC.frame9.slice)
    }
  })
  // BUG (relatório QA M2): sem `meta.image`, o fallback `jsonUrl.replace('.json', '.png')` passa por
  // resolveSibling e ganha o diretório duas vezes ("assets/ui/assets/ui/closeup-computer.png").
  it('sem meta.image, a imagem é o PNG com o mesmo nome do JSON', () => {
    expect(parseCloseupSheet({ meta: {} }, JSON_URL, FRAME_URL).image).toBe('assets/ui/closeup-computer.png')
  })
  it('formato Array do Aseprite, sem frameTags: o 1º frame vira `on`', () => {
    const s = parseCloseupSheet(
      {
        frames: [
          { frame: { x: 0, y: 0, w: 100, h: 50 }, sourceSize: { w: 100, h: 50 }, duration: 80 },
          { frame: { x: 100, y: 0, w: 100, h: 50 }, duration: 80 },
        ],
        meta: { image: 'other.png', quartoPixel: { contentRect: [1, 2, 3, 4], frame9: { slice: [1, 2, 3, 4], scale: 3 } } },
      },
      JSON_URL,
      FRAME_URL,
    )
    expect(s.image).toBe('assets/ui/other.png')
    expect(s.size).toEqual({ w: 100, h: 50 })
    expect(s.sheet).toEqual({ w: 200, h: 50 })
    expect(s.tags).toEqual({ on: [{ x: 0, y: 0, duration: 80 }] })
    expect(s.contentRect).toEqual({ x: 1, y: 2, w: 3, h: 4 })
    expect(s.crops.full).toEqual({ x: 0, y: 0, w: 100, h: 50 })
    expect(s.frame9.slice).toEqual({ top: 1, right: 2, bottom: 3, left: 4 })
    expect(s.frame9.scale).toBe(3)
  })
})

describe('closeup/sheet.parseOverlay', () => {
  it('vapor da caneca: 3 frames de 12×12 a 200 ms em (34, 89)', () => {
    const ref = (computerJson.meta.quartoPixel as { steam?: unknown }).steam
    const o = parseOverlay(ref, steamJson, 'assets/ui/closeup-computer-steam.json')
    expect(o).toEqual({
      image: 'assets/ui/closeup-computer-steam.png',
      at: { x: 34, y: 89 },
      frame: { w: 12, h: 12 },
      count: 3,
      duration: 200,
    })
  })
  it('sem referência válida: undefined', () => {
    expect(parseOverlay(undefined, steamJson, 'x.json')).toBeUndefined()
    expect(parseOverlay({ at: [0, 0] }, steamJson, 'x.json')).toBeUndefined()
  })
})

describe('closeup/sheet.bootSequence', () => {
  const tags = parseCloseupSheet(computerJson, JSON_URL, FRAME_URL).tags
  it('dia: boot (2 × 60 ms) e depois on', () => {
    const s = bootSequence(tags, false, false)
    expect(s.boot.map((f) => [f.x, f.duration])).toEqual([[560, 60], [1040, 60]])
    expect(s.on?.x).toBe(1520)
  })
  it('noite: variantes -night pré-tingidas', () => {
    const s = bootSequence(tags, true, false)
    expect(s.boot.map((f) => f.x)).toEqual([2480, 2960])
    expect(s.on?.x).toBe(3440)
  })
  it('reduced motion: sem boot, direto para on', () => {
    expect(bootSequence(tags, false, true)).toEqual({ boot: [], on: tags.on[0] })
    expect(bootSequence(tags, true, true)).toEqual({ boot: [], on: tags['on-night'][0] })
  })
  it('encurta na proporção para caber em maxMs', () => {
    const long: CloseupSheet['tags'] = {
      boot: [{ x: 1, y: 0, duration: 200 }, { x: 2, y: 0, duration: 400 }],
      on: [{ x: 3, y: 0, duration: 100 }],
    }
    const s = bootSequence(long, false, false)
    expect(s.boot.map((f) => f.duration)).toEqual([100, 200])
    expect(s.boot.reduce((n, f) => n + f.duration, 0)).toBeLessThanOrEqual(300)
    expect(bootSequence(long, false, false, 1000).boot.map((f) => f.duration)).toEqual([200, 400])
  })
  it('noite sem variantes usa as de dia; sem `on` usa `off`; sem tags nada', () => {
    const dayOnly: CloseupSheet['tags'] = { boot: [{ x: 1, y: 0, duration: 10 }], off: [{ x: 0, y: 0, duration: 10 }] }
    const s = bootSequence(dayOnly, true, false)
    expect(s.boot.map((f) => f.x)).toEqual([1])
    expect(s.on?.x).toBe(0)
    expect(bootSequence({}, false, false)).toEqual({ boot: [], on: undefined })
  })
})
