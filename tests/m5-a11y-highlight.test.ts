import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventBus } from '@/game/EventBus'
import en from '@/i18n/locales/en.json'
import pt from '@/i18n/locales/pt.json'
import { useGameStore } from '@/store/useGameStore'
import { highlightFromMenu } from '@/ui/hud/focusHighlight'
import { HINT_HALF_WIDTH, hintPosition } from '@/ui/hud/hintPosition'
import { tooltipTarget } from '@/ui/hud/tooltipTarget'

vi.mock('@/game/EventBus', () => ({ EventBus: { emit: vi.fn(), on: vi.fn() } }))

// M5: foco no menu de teclado destaca o objeto (item 4), contraste do anel de foco (item 5) e
// nome acessível do currículo (item 6).

describe('foco no menu → focus-highlight (proposto à cena)', () => {
  beforeEach(() => {
    highlightFromMenu(null)
    vi.mocked(EventBus.emit).mockClear()
  })
  it('emite o id no foco e null na saída, uma vez por mudança', () => {
    highlightFromMenu('bookshelf')
    highlightFromMenu('bookshelf')
    highlightFromMenu(null)
    expect(vi.mocked(EventBus.emit).mock.calls).toEqual([
      ['focus-highlight', 'bookshelf'],
      ['focus-highlight', null],
    ])
  })
  it('guarda o item com foco no store (dica com o nome)', () => {
    highlightFromMenu('phone')
    expect(useGameStore.getState().menuFocusId).toBe('phone')
    highlightFromMenu(null)
    expect(useGameStore.getState().menuFocusId).toBeNull()
  })
})

describe('dica do objeto', () => {
  const base = { hoveredId: null, hoverAnchor: null, menuFocusId: null, openId: null, sceneKey: 'Room' } as const
  it('foco de teclado no menu mostra o nome (rodapé, sem âncora)', () => {
    expect(tooltipTarget({ ...base, menuFocusId: 'journal' })).toEqual({ id: 'journal', anchor: null })
  })
  it('hover vence o foco; a âncora vem da cena (object-hover)', () => {
    const anchor = { x: 300, y: 200 }
    expect(tooltipTarget({ ...base, menuFocusId: 'journal', hoveredId: 'phone', hoverAnchor: anchor })).toEqual({ id: 'phone', anchor })
  })
  it('nada com painel aberto, e o foco no menu não mostra dica na porta', () => {
    expect(tooltipTarget({ ...base, hoveredId: 'phone', openId: 'phone' })).toBeNull()
    expect(tooltipTarget({ ...base, menuFocusId: 'phone', sceneKey: 'Entrance' })).toBeNull()
  })
  it('object-hover com âncora (2º argumento opcional) e sem âncora', () => {
    const { setHovered } = useGameStore.getState()
    setHovered('frames', { x: 10, y: 20 })
    expect(useGameStore.getState().hoverAnchor).toEqual({ x: 10, y: 20 })
    setHovered('frames')
    expect(useGameStore.getState().hoverAnchor).toBeNull()
    setHovered('frames', { x: 10, y: 20 })
    setHovered(null)
    expect(useGameStore.getState().hoverAnchor).toBeNull()
  })
  it('posição usa a meia largura medida (nome longo não sai da tela)', () => {
    const screen = { left: 0, top: 0, width: 1366, height: 768 }
    expect(hintPosition({ x: 5, y: 300 }, { left: 0, top: 0 }, screen).left).toBe(HINT_HALF_WIDTH + 8)
    expect(hintPosition({ x: 5, y: 300 }, { left: 0, top: 0 }, screen, 120).left).toBe(128)
    expect(hintPosition({ x: 1360, y: 300 }, { left: 0, top: 0 }, screen, 120).left).toBe(1366 - 128)
  })
})

// ---------- Contraste do anel de foco (WCAG 1.4.11 / 2.4.11) ----------
const css = readFileSync('src/app/global.css', 'utf8')
const vars = new Map<string, string>()
for (const m of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) if (!vars.has(m[1])) vars.set(m[1], m[2].trim())
const resolve = (v: string): string => {
  const ref = /^var\(--([\w-]+)\)$/.exec(v)
  return ref ? resolve(vars.get(ref[1]) ?? '') : v
}
const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => {
    const s = x / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

describe('anel de foco em dois tons (botão Fechar e X do computador)', () => {
  const light = resolve('var(--focus-light)')
  const dark = resolve('var(--focus-dark)')
  const buttonBorder = resolve('var(--border)')

  it('as duas regras usam o anel claro (contorno) + escuro (sombra de 6 px)', () => {
    for (const sel of ['.pixel-btn:focus-visible', '.retro-window__close:focus-visible']) {
      const rule = new RegExp(`${sel.replace(/[.:]/g, (c) => `\\${c}`)} \\{([^}]*)\\}`).exec(css)?.[1] ?? ''
      expect(rule, sel).toMatch(/outline: 3px solid var\(--focus-light\)/)
      expect(rule, sel).toMatch(/0 0 0 6px var\(--focus-dark\)/)
    }
  })
  it('o anel claro tem ≥ 3:1 contra os dois vizinhos (borda do botão e anel escuro)', () => {
    expect(contrast(light, buttonBorder)).toBeGreaterThanOrEqual(3)
    expect(contrast(light, dark)).toBeGreaterThanOrEqual(3)
  })
  it('em todo fundo de painel/barra da paleta, um dos dois anéis tem ≥ 3:1', () => {
    const backgrounds = ['--bg', '--panel', '--accent', '--teal-0', '--teal-1', '--teal-2', '--cream-1', '--cream-2', '--cream-3', '--cyan', '--gold-1']
    for (const bg of backgrounds) {
      const c = resolve(`var(${bg})`)
      expect(Math.max(contrast(dark, c), contrast(light, c)), bg).toBeGreaterThanOrEqual(3)
    }
  })
  it('o contorno antigo (border sobre teal-2, 2,77:1) não volta', () => {
    expect(css).not.toMatch(/\.retro-window__close:focus-visible\s*\{[^}]*outline: 3px solid var\(--border\)/)
  })
})

// ---------- WCAG 2.5.3: nome acessível começa pelo texto visível ----------
describe('currículo PT/EN no celular: nome acessível contém o texto visível', () => {
  for (const [locale, dict] of [
    ['pt', pt],
    ['en', en],
  ] as const) {
    it(locale, () => {
      expect(dict.phone.aria.resumePt.startsWith(dict.phone.resumePt)).toBe(true)
      expect(dict.phone.aria.resumeEn.startsWith(dict.phone.resumeEn)).toBe(true)
    })
  }
})
