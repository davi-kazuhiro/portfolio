import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getContent } from '@/content'
import { HUD_BAND, pickCloseupLayout } from '@/ui/closeup/layout'
import { composeShelf, HIT_KEEP, parseShelfAtlas, SHELF_MAX_BLEED, shelfButtons, shelfContentRect, shelfGeometry } from '@/ui/closeup/shelfAtlas'
import {
  clampIndex,
  cycleStep,
  languagePageCount,
  languagePageOf,
  projectsUsing,
  spreadCount,
  spreadOf,
  type Skills,
} from '@/ui/panels/bookshelf/skills'

const JSON_URL = 'assets/ui/closeup-bookshelf.json'
const raw: unknown = JSON.parse(readFileSync('public/assets/ui/closeup-bookshelf.json', 'utf8'))
const atlas = parseShelfAtlas(raw, JSON_URL)

describe('shelfAtlas.parseShelfAtlas (specs.md §4)', () => {
  it('lê frames recortados com a posição na ilustração', () => {
    expect(atlas.image).toBe('assets/ui/closeup-bookshelf.png')
    expect(atlas.sheet).toEqual({ w: 640, h: 1538 })
    expect(atlas.bleed).toEqual({ left: 80, top: 64, right: 80, bottom: 64 })
    const b = atlas.frames['bleed/day']
    expect([b.x, b.y, b.w, b.h]).toEqual([-80, -64, 480, 308])
    expect(atlas.backgroundBleed).toEqual({ rect: { x: -80, y: -64, w: 480, h: 308 }, day: 'bleed/day', night: 'bleed/night' })
    expect(atlas.size).toEqual({ w: 320, h: 180 })
    expect(atlas.minScale).toBe(3)
    expect(atlas.defaultOpen).toBe('languages')
    const f = atlas.frames['shelf/languages/day']
    expect([f.x, f.y, f.w, f.h]).toEqual([56, 2, 34, 54])
    expect(Object.keys(atlas.frames)).toHaveLength(87) // 85 + bleed/day|night (o tsuru, rente à tábua, não projeta sombra na parede)
  })

  it('itens da tábua: decoração sem hit, clicáveis com hover e sombra', () => {
    expect(atlas.shelf.map((i) => i.id)).toEqual([
      'decor-a', 'languages', 'spoken-languages', 'decor-b', 'tools', 'rubiks-cube', 'origami', 'chess', 'table-tennis',
    ])
    const decor = atlas.shelf.find((i) => i.id === 'decor-a')!
    expect(decor.hit).toBeNull()
    const tt = atlas.shelf.find((i) => i.id === 'table-tennis')!
    expect(tt.shadow).toBeNull()
    expect(tt.hover?.night).toBe('shelf/table-tennis/hover-night')
    expect(shelfButtons(atlas, 'languages').map((i) => i.id)).toEqual([
      'spoken-languages', 'tools', 'rubiks-cube', 'origami', 'chess', 'table-tennis',
    ])
  })

  it('layouts e ícones', () => {
    expect(atlas.layouts.book.content.left).toEqual({ x: 52, y: 83, w: 102, h: 70 })
    expect(atlas.layouts.tools.rowPitch).toBe(12)
    expect(atlas.layouts.tools.ruleY).toBe(13)
    expect(atlas.layouts.hobby.cycle).toEqual(['rubiks-cube', 'origami', 'chess', 'table-tennis'])
    expect(atlas.layouts.hobby.arrows.next.hover?.day).toBe('arrow/next/hover')
    expect(atlas.icons.java).toBe('icon/java')
    // Todo ícone usado no conteúdo tem frame.
    const skills = getContent('pt').skills as Skills
    for (const icon of [...skills.languages.map((l) => l.icon), ...skills.tools.map((t) => t.icon), 'globe']) {
      expect(atlas.frames[atlas.icons[icon]], icon).toBeDefined()
    }
  })

  it('JSON vazio cai nos valores da spec', () => {
    const empty = parseShelfAtlas(null, 'a/b.json')
    expect(empty.image).toBe('a/b.png')
    expect(empty.shelf).toEqual([])
    expect(empty.layouts.book.pageTurn.next).toEqual({ x: 264, y: 153, w: 10, h: 10 })
    expect(empty.layouts.hobby.cycle).toHaveLength(4)
  })
})

describe('shelfAtlas.composeShelf (ordem de composição)', () => {
  it('livro aberto de dia: fundo, sombra do destaque, sombras, itens sem o aberto, partes', () => {
    const layers = composeShelf(atlas, { open: 'languages', night: false })
    const keys = layers.map((l) => l.key)
    expect(keys[0]).toBe('bg')
    expect(keys[1]).toBe('hl-shadow')
    expect(keys).not.toContain('shadow:languages')
    expect(keys).not.toContain('item:languages')
    expect(keys.at(-1)).toBe('part:book')
    const firstItem = keys.findIndex((k) => k.startsWith('item:'))
    const lastShadow = keys.length - 1 - [...keys].reverse().findIndex((k) => k.startsWith('shadow:'))
    expect(lastShadow).toBeLessThan(firstItem)
    expect(keys.filter((k) => k.startsWith('arrow:'))).toEqual([])
    expect(layers.every((l) => l.role === 'part' || !l.frame.endsWith('/night'))).toBe(true)
  })

  it('noite usa os frames pré-tingidos; o destaque é igual ao de dia', () => {
    const night = composeShelf(atlas, { open: 'chess', night: true })
    // Fundo com a sangria real (já contém bg/* no meio).
    expect(night[0].frame).toBe('bleed/night')
    expect(night.find((l) => l.key === 'part:big')?.frame).toBe('highlight/chess/big')
    expect(night.filter((l) => l.role === 'arrow').map((l) => l.frame)).toEqual(['arrow/prev/night', 'arrow/next/night'])
  })

  it('clicáveis sempre com contorno; hover/foco levanta o item; decoração nunca', () => {
    const layers = composeShelf(atlas, { open: 'tools', night: true, hot: ['origami', 'decor-a', 'arrow:prev'] })
    const origami = layers.find((l) => l.key === 'item:origami')!
    expect(origami.frame).toBe('shelf/origami/hover-night')
    expect(origami.lifted).toBe(true)
    expect(layers.find((l) => l.key === 'item:decor-a')?.lifted).toBeUndefined()
    const calm = composeShelf(atlas, { open: 'tools', night: false })
    expect(calm.find((l) => l.key === 'item:origami')).toMatchObject({ frame: 'shelf/origami/hover', lifted: undefined })
    expect(calm.find((l) => l.key === 'item:decor-a')?.frame).not.toMatch(/hover/)
    expect(layers.filter((l) => l.role === 'part').map((l) => l.key)).toEqual(['part:big', 'part:card'])
  })
})

describe('bookshelf/skills', () => {
  const projects = [
    { titulo: 'A', tecnologias: ['react', 'Node.js'] },
    { titulo: 'B', tecnologias: ['Python'] },
    { titulo: 'C', tecnologias: [] },
  ]
  it('"Onde usei" casa sem diferenciar maiúsculas', () => {
    expect(projectsUsing(['React'], projects)).toEqual(['A'])
    expect(projectsUsing(['node', 'NODE.JS'], projects)).toEqual(['A'])
    expect(projectsUsing(['Java'], projects)).toEqual([])
  })
  it('páginas: sumário + uma por linguagem, duas por página dupla', () => {
    const langs = getContent('pt').skills.languages
    expect(languagePageCount(langs)).toBe(langs.length + 1)
    expect(spreadCount(languagePageCount(langs))).toBe(4)
    expect(spreadOf(languagePageOf(0))).toBe(0) // 1ª linguagem ao lado do sumário
    expect(spreadOf(languagePageOf(1))).toBe(1)
    expect(clampIndex(9, 3)).toBe(2)
    expect(clampIndex(-1, 3)).toBe(0)
  })
  it('ciclo dos hobbies com volta', () => {
    const c = ['a', 'b', 'c']
    expect(cycleStep(c, 'c', 1)).toBe('a')
    expect(cycleStep(c, 'a', -1)).toBe('c')
    expect(cycleStep(c, 'x', 1)).toBe('a')
  })
})

describe('prateleira: regra cover (layout.ts) com a geometria da prateleira', () => {
  const geo = shelfGeometry(atlas)
  const at = (w: number, h: number) => pickCloseupLayout(w, h, geo, HUD_BAND)
  it('conteúdo = destaques + os 15 px de baixo de cada item clicável', () => {
    expect(HIT_KEEP).toBe(15)
    expect(shelfContentRect(atlas)).toEqual({ x: 28, y: 40, w: 266, h: 134 })
  })
  it('escalas por janela', () => {
    // Menor escala que cobre só com arte (ilustração + sangria real 80/64), ilustração centralizada.
    expect(at(1920, 1080)).toMatchObject({ mode: 'cover', scale: 4, view: { x: 0, y: 180 - 256, w: 1920, h: 1232 } })
    expect(at(1536, 864)).toMatchObject({ mode: 'cover', scale: 4 })
    expect(at(1366, 768)).toMatchObject({ mode: 'cover', scale: 3, view: { x: 203 - 240, y: 114 - 192 }, bleed: { top: 0, right: 0, bottom: 0, left: 0 } })
    expect(at(1280, 720)).toMatchObject({ mode: 'cover', scale: 3 })
    expect(at(2560, 1440)).toMatchObject({ mode: 'cover', scale: 6 })
    for (const [w, h] of [[768, 1024], [375, 812], [412, 915]]) expect(at(w, h).mode, `${w}×${h}`).toBe('fallback')
  })
  it('cobre a janela e mantém destaques e itens visíveis abaixo do HUD', () => {
    const c = shelfContentRect(atlas)
    for (const [w, h] of [[1920, 1080], [1366, 768], [1280, 720], [1536, 864], [1440, 900], [2560, 1440], [1024, 768]]) {
      const l = at(w, h)
      const tag = `${w}×${h}`
      expect(l.mode, tag).toBe('cover')
      const { view: v, bleed: b, scale: s } = l
      expect(v.x - b.left <= 0 && v.y - b.top <= 0 && v.x + v.w + b.right >= w && v.y + v.h + b.bottom >= h, tag).toBe(true)
      const top = v.y + (c.y - l.crop.y) * s
      const left = v.x + (c.x - l.crop.x) * s
      expect(top, tag).toBeGreaterThanOrEqual(HUD_BAND)
      expect(top + c.h * s, tag).toBeLessThanOrEqual(h)
      expect(left >= 0 && left + c.w * s <= w, tag).toBe(true)
      for (const n of Object.values(b)) expect(n, tag).toBeLessThanOrEqual(SHELF_MAX_BLEED * s)
    }
  })
  it('sangria real: o fundo com sangria substitui bg/*; a ilustração-base não muda', () => {
    const bg = atlas.frames['bg/day']
    expect([bg.x, bg.y, bg.w, bg.h]).toEqual([0, 0, 320, 180])
    expect(atlas.frames['shelf/languages/day'].y).toBe(2)
  })
})

// O EventBus importa o Phaser; aqui só interessa o fallback do teclado.
vi.mock('@/game/EventBus', () => ({ EventBus: { emit: vi.fn(), on: vi.fn() } }))

describe('requestOpen: Esc durante o zoom cancela o fallback', () => {
  afterEach(() => vi.useRealTimers())
  it('Esc com abertura pendente não deixa o painel abrir sozinho', async () => {
    vi.useFakeTimers()
    const { useGameStore } = await import('@/store/useGameStore')
    const { requestOpen, cancelPendingOnEscape, hasPendingOpen } = await import('@/ui/hud/requestOpen')
    useGameStore.setState({ sceneKey: 'Room', openId: null })
    requestOpen('bookshelf')
    expect(hasPendingOpen()).toBe(true)
    expect(cancelPendingOnEscape('Enter')).toBe(false)
    expect(cancelPendingOnEscape('Escape')).toBe(true)
    vi.advanceTimersByTime(2000)
    expect(useGameStore.getState().openId).toBeNull()
    expect(cancelPendingOnEscape('Escape')).toBe(false)
  })
  it('sem Esc, o fallback abre depois de 1,5 s', async () => {
    vi.useFakeTimers()
    const { useGameStore } = await import('@/store/useGameStore')
    const { requestOpen } = await import('@/ui/hud/requestOpen')
    useGameStore.setState({ sceneKey: 'Room', openId: null })
    requestOpen('bookshelf')
    vi.advanceTimersByTime(1600)
    expect(useGameStore.getState().openId).toBe('bookshelf')
  })
})

describe('i18n da prateleira', () => {
  it('rótulo do sumário inclui o número da página (PT e EN)', async () => {
    const pt = (await import('@/i18n/locales/pt.json')).default.bookshelf
    const en = (await import('@/i18n/locales/en.json')).default.bookshelf
    for (const b of [pt, en]) {
      expect(b.goToPage).toMatch(/\{\{page\}\}\s*$/)
      expect(b.pageOf).toContain('{{n}}')
    }
  })
})
