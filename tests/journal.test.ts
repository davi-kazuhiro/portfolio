import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getContent } from '@/content'
import { HUD_BAND, pickCloseupLayout } from '@/ui/closeup/layout'
import { composeJournal, journalGeometry, parseJournalAtlas, tabArt, tabLabelRect, tabState } from '@/ui/closeup/journalAtlas'
import { buildPages, educationPlace, isCurrent, locationLine, monthIndex, tabKeyTarget, turnPage } from '@/ui/panels/journal/experience'

const JSON_URL = 'assets/ui/closeup-journal.json'
const raw: unknown = JSON.parse(readFileSync('public/assets/ui/closeup-journal.json', 'utf8'))
const atlas = parseJournalAtlas(raw, JSON_URL)

describe('journalAtlas.parseJournalAtlas (specs.md §5, JSON real)', () => {
  it('lê tamanho, sangria, caderno, pauta e frames', () => {
    expect(atlas.image).toBe('assets/ui/closeup-journal.png')
    expect(atlas.size).toEqual({ w: 320, h: 180 })
    expect(atlas.minScale).toBe(3)
    expect(atlas.bleed).toEqual({ left: 80, top: 64, right: 80, bottom: 64 })
    expect(atlas.backgroundBleed).toEqual({ rect: { x: -80, y: -64, w: 480, h: 308 }, day: 'bleed/day', night: 'bleed/night', dusk: 'bleed/dusk' })
    expect(atlas.book.rect).toEqual({ x: 27, y: 26, w: 262, h: 146 })
    expect(atlas.content.right).toEqual({ x: 170, y: 34, w: 104, h: 124 })
    expect(atlas.ruling).toEqual({ y0: 40, pitch: 7, lineBoxTop: 34, linesPerPage: 17 })
    expect(atlas.tabs.slots).toBe(6)
    expect(atlas.tabs.pitch).toBe(22)
    expect(atlas.checklist.defaultDone).toBe(true)
    expect(atlas.icons.pin.work).toBe('icon/pin/work')
    expect(atlas.types.research.tab).toBe('#5fae4e')
    for (const f of ['bg/day', 'bg/night', 'bleed/day', 'bleed/night', 'book', 'stamp/work', 'stamp/research', 'page-turn/next/hover']) {
      expect(atlas.frames[f], f).toBeDefined()
    }
  })

  it('cada estado de aba tem arte para os três tipos e área do nome dentro da aba', () => {
    for (const st of ['left', 'right', 'right-active'] as const) {
      expect(Object.keys(atlas.tabs.states[st].types).sort()).toEqual(['education', 'research', 'work'])
      const tab = atlas.tabs.states[st].types.work.rect
      const label = atlas.tabs.label[st]
      expect(label.x).toBeGreaterThanOrEqual(tab.x)
      expect(label.x + label.w).toBeLessThanOrEqual(tab.x + tab.w)
      expect(label.y + label.h).toBeLessThanOrEqual(tab.y + tab.h)
    }
    expect(atlas.tabs.labelInk).toBe('#2f2c3a')
    expect(atlas.frames['stamp/education']).toBeDefined()
    expect(atlas.icons.pin.education).toBe('icon/pin/education')
  })

  it('aba ativa da direita não passa da ilustração (x ≤ 320)', () => {
    const r = atlas.tabs.states['right-active'].types.education.rect
    expect(r.x + r.w).toBeLessThanOrEqual(atlas.size.w)
  })
})

describe('abas', () => {
  it('estado: j<a left, j=a right-active, j>a right', () => {
    expect(tabState(0, 2)).toBe('left')
    expect(tabState(2, 2)).toBe('right-active')
    expect(tabState(3, 2)).toBe('right')
  })

  it('rect desloca 22·j em y a partir do slot 0', () => {
    const a0 = tabArt(atlas, 0, 0, 'work')!
    const a2 = tabArt(atlas, 2, 0, 'work')!
    expect(a2.rect.y - a0.rect.y).toBe(44)
    expect(a2.rect.x).toBe(a0.rect.x)
    expect(tabArt(atlas, 0, 1, 'work')!.rect.x).toBeLessThan(atlas.book.rect.x)
    expect(tabLabelRect(atlas, 2, 0).y - tabLabelRect(atlas, 0, 0).y).toBe(44)
    expect(tabLabelRect(atlas, 0, 1)).toEqual(atlas.tabs.label.left)
  })
})

describe('composeJournal', () => {
  it('ordem: fundo → sombras → caderno → abas → carimbo → canto; só o fundo muda à noite', () => {
    const types = ['research', 'work', 'work']
    const turnable = { prev: true, next: true }
    const day = composeJournal(atlas, { types, open: 1, night: false, hotCorner: 'next', turnable })
    const roles = day.map((l) => l.role)
    const first = (r: string) => roles.indexOf(r as never)
    const last = (r: string) => roles.lastIndexOf(r as never)
    expect(roles[0]).toBe('background')
    expect(last('tab-shadow')).toBeLessThan(first('book'))
    expect(first('book')).toBeLessThan(first('tab'))
    expect(last('tab')).toBeLessThan(first('stamp'))
    expect(roles.at(-1)).toBe('corner')
    expect(day[0].frame).toBe('bleed/day')
    expect(day.find((l) => l.role === 'stamp')!.frame).toBe('stamp/work')
    expect(day.filter((l) => l.role === 'tab')).toHaveLength(3)
    // Cantos: só o anel (o desenho normal está no `book`), aceso no hover.
    expect(day.filter((l) => l.role === 'corner')).toMatchObject([
      { key: 'corner:prev', cue: true, ringOnly: true, hot: undefined },
      { key: 'corner:next', cue: true, ringOnly: true, hot: true },
    ])

    const night = composeJournal(atlas, { types, open: 1, night: true, hotCorner: 'next', turnable })
    expect(night[0].frame).toBe('bleed/night')
    expect(night.slice(1)).toEqual(day.slice(1))
  })

  it('abas fechadas com anel (aceso no hover, sem frame dourado); abas além dos slots não são desenhadas', () => {
    const types = Array.from({ length: 8 }, () => 'work')
    const base = composeJournal(atlas, { types, open: 0, night: false })
    const hot = composeJournal(atlas, { types, open: 0, night: false, hotTab: 2 })
    expect(base.filter((l) => l.role === 'tab')).toHaveLength(6)
    const tab = (ls: typeof base, j: number) => ls.find((l) => l.key === `tab:${j}`)!
    expect(tab(hot, 2).frame).toBe(tab(base, 2).frame)
    expect(tab(hot, 2)).toMatchObject({ cue: true, hot: true })
    expect(tab(base, 2)).toMatchObject({ cue: true, hot: undefined })
    expect(tab(base, 0)).toMatchObject({ cue: undefined })
    expect(base.some((l) => l.role === 'corner')).toBe(false)
  })
})

describe('experiências', () => {
  const exp = (start: string, end: string | null) => ({ start, end })
  const now = new Date(2026, 10, 8) // nov/2026

  it('monthIndex', () => {
    expect(monthIndex('2026-01')).toBe(2026 * 12)
    expect(monthIndex('jan')).toBeNaN()
  })

  it('"Atual": mês corrente entre start e end, end null = atual', () => {
    expect(isCurrent(exp('2025-07', null), now)).toBe(true)
    expect(isCurrent(exp('2026-11', '2026-11'), now)).toBe(true)
    expect(isCurrent(exp('2026-07', '2027-08'), now)).toBe(true)
    expect(isCurrent(exp('2024-01', '2026-10'), now)).toBe(false)
    expect(isCurrent(exp('2026-12', null), now)).toBe(false)
    expect(isCurrent(exp('x', null), now)).toBe(false)
  })

  it('linha de local com programa opcional', () => {
    expect(locationLine({ organization: 'PUCPR', program: 'PIBIC', city: 'Curitiba, PR' })).toBe('PUCPR · PIBIC, Curitiba, PR')
    expect(locationLine({ organization: 'Bradesco', program: null, city: 'Curitiba, PR' })).toBe('Bradesco, Curitiba, PR')
  })

  it('paginação presa nas pontas e teclado das abas com volta', () => {
    expect(turnPage(0, -1, 3)).toBe(0)
    expect(turnPage(1, 1, 3)).toBe(2)
    expect(turnPage(2, 1, 3)).toBe(2)
    expect(turnPage(0, 1, 0)).toBe(0)
    expect(tabKeyTarget('ArrowDown', 2, 3)).toBe(0)
    expect(tabKeyTarget('ArrowUp', 0, 3)).toBe(2)
    expect(tabKeyTarget('End', 0, 3)).toBe(2)
    expect(tabKeyTarget('Enter', 0, 3)).toBeNull()
  })

  it('conteúdo real PT/EN tem os mesmos ids e tipos com arte', () => {
    const pt = getContent('pt').experiences
    const en = getContent('en').experiences
    expect(pt.map((e) => e.id)).toEqual(en.map((e) => e.id))
    for (const e of pt) expect(atlas.tabs.states.right.types[e.type], e.type).toBeDefined()
  })
})

describe('páginas (experiências + formação)', () => {
  it('formação entra por último, com bacharelado e técnico, nos dois idiomas', () => {
    for (const locale of ['pt', 'en'] as const) {
      const c = getContent(locale)
      const pages = buildPages(c.experiences, c.education)
      expect(pages.map((p) => p.type)).toEqual(['research', 'work', 'education'])
      const last = pages.at(-1)!
      expect(last.kind).toBe('education')
      if (last.kind === 'education') expect(last.items.map((e) => e.id)).toEqual(['bcc-pucpr', 'high-school-technical'])
    }
  })

  it('sem formação, só as experiências', () => {
    expect(buildPages(getContent('pt').experiences, []).every((p) => p.kind === 'experience')).toBe(true)
  })

  it('linha de local da formação omite campos vazios', () => {
    expect(educationPlace({ institution: 'PUCPR', city: 'Curitiba, PR' })).toBe('PUCPR, Curitiba, PR')
    expect(educationPlace({ institution: null, city: 'Curitiba, PR' })).toBe('Curitiba, PR')
    expect(educationPlace({ institution: null, city: null })).toBeNull()
  })
})

describe('layout', () => {
  it('cover em 1920×1080 e 1366×768; texto em 375×812', () => {
    const g = journalGeometry(atlas)
    expect(pickCloseupLayout(1920, 1080, g, HUD_BAND).mode).toBe('cover')
    expect(pickCloseupLayout(1366, 768, g, HUD_BAND).mode).toBe('cover')
    expect(pickCloseupLayout(375, 812, g, HUD_BAND).mode).not.toBe('cover')
  })
})
