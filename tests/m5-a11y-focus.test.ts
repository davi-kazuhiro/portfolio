import { describe, expect, it, vi } from 'vitest'
import {
  clearQuietFocus,
  isKeyboardFocus,
  pickReturnTarget,
  QUIET_FOCUS_ATTR,
  restoreFocus,
  type FocusCandidate,
} from '@/ui/a11y/focusReturn'
import { lastModality, noteInput, trackInputModality } from '@/ui/a11y/inputModality'
import { currentHudSlot, registerHudSlot, unregisterHudSlot } from '@/ui/hud/hudSlotStore'

// M5, ressalvas de acessibilidade herdadas: foco devolvido ao fechar (item 2), `inert` + HUD
// dentro do diálogo (item 1).

const candidate = (connected: boolean, insideInert = false): FocusCandidate & { name: string } => ({
  name: `${connected}-${insideInert}`,
  isConnected: connected,
  closest: (sel: string) => (sel === '[inert]' && insideInert ? {} : null),
})

/** Elemento falso com o mínimo que restoreFocus/clearQuietFocus/isKeyboardFocus usam. */
function fakeElement(focusVisible = true) {
  const attrs = new Map<string, string>()
  const listeners: Record<string, () => void> = {}
  return {
    attrs,
    listeners,
    focus: vi.fn(),
    setAttribute: (k: string, v: string) => attrs.set(k, v),
    removeAttribute: (k: string) => attrs.delete(k),
    hasAttribute: (k: string) => attrs.has(k),
    addEventListener: (type: string, fn: () => void) => {
      listeners[type] = fn
    },
    matches: (sel: string) => sel === ':focus-visible' && focusVisible,
  }
}

describe('para onde o foco volta ao fechar', () => {
  const menu = candidate(true)
  it('quem abriu (item do menu), se ainda está na página', () => {
    const opener = candidate(true)
    expect(pickReturnTarget(opener, menu)).toBe(opener)
  })
  it('aberto pelo canvas: o diálogo (já fora da página) ou nada → item do menu do objeto', () => {
    expect(pickReturnTarget(candidate(false), menu)).toBe(menu)
    expect(pickReturnTarget(null, menu)).toBe(menu)
  })
  it('nunca para dentro de um fundo inert', () => {
    expect(pickReturnTarget(candidate(true, true), menu)).toBe(menu)
  })
  it('sem menu (id fora do registro): nada', () => {
    expect(pickReturnTarget(null, null)).toBeNull()
  })
})

describe('teclado x ponteiro', () => {
  it('pointerdown marca ponteiro; tecla comum marca teclado; modificador sozinho não muda', () => {
    noteInput({ type: 'pointerdown' })
    expect(lastModality()).toBe('pointer')
    noteInput({ type: 'keydown', key: 'Shift' })
    expect(lastModality()).toBe('pointer')
    noteInput({ type: 'keydown', key: 'Escape' })
    expect(lastModality()).toBe('keyboard')
  })
  it('trackInputModality escuta em captura e para ao desligar', () => {
    const handlers = new Map<string, (e: Event) => void>()
    const target = {
      addEventListener: vi.fn((type: string, fn: (e: Event) => void, capture?: boolean) => {
        expect(capture).toBe(true)
        handlers.set(type, fn)
      }),
      removeEventListener: vi.fn((type: string) => handlers.delete(type)),
    }
    const onKeyboard = vi.fn()
    const off = trackInputModality(target as never, onKeyboard)
    handlers.get('pointerdown')?.({ type: 'pointerdown' } as Event)
    expect(lastModality()).toBe('pointer')
    handlers.get('keydown')?.({ type: 'keydown', key: 'Tab' } as KeyboardEvent)
    expect(lastModality()).toBe('keyboard')
    expect(onKeyboard).toHaveBeenCalledTimes(1)
    off()
    expect(handlers.size).toBe(0)
  })
})

describe('foco devolvido sem anel depois de clique/toque', () => {
  it('ponteiro: focusVisible false, sem rolar, marcado como quieto até o blur', () => {
    const el = fakeElement()
    restoreFocus(el as unknown as HTMLElement, 'pointer')
    expect(el.focus).toHaveBeenCalledWith({ preventScroll: true, focusVisible: false })
    expect(el.hasAttribute(QUIET_FOCUS_ATTR)).toBe(true)
    el.listeners.blur()
    expect(el.hasAttribute(QUIET_FOCUS_ATTR)).toBe(false)
  })
  it('teclado (Esc): anel visível, sem marca', () => {
    const el = fakeElement()
    restoreFocus(el as unknown as HTMLElement, 'keyboard')
    expect(el.focus).toHaveBeenCalledWith({ preventScroll: true, focusVisible: true })
    expect(el.hasAttribute(QUIET_FOCUS_ATTR)).toBe(false)
  })
  it('a próxima tecla tira a marca (o anel volta a valer)', () => {
    const el = fakeElement()
    el.setAttribute(QUIET_FOCUS_ATTR, '')
    clearQuietFocus({ querySelectorAll: () => [el] } as never)
    expect(el.hasAttribute(QUIET_FOCUS_ATTR)).toBe(false)
  })
  it('foco quieto ou sem :focus-visible não conta como foco de teclado', () => {
    expect(isKeyboardFocus(fakeElement(true) as never)).toBe(true)
    expect(isKeyboardFocus(fakeElement(false) as never)).toBe(false)
    const quiet = fakeElement(true)
    quiet.setAttribute(QUIET_FOCUS_ATTR, '')
    expect(isKeyboardFocus(quiet as never)).toBe(false)
  })
})

describe('HUD dentro do diálogo (slot)', () => {
  it('troca de diálogo: o slot antigo saindo depois não apaga o novo', () => {
    const a = {} as HTMLElement
    const b = {} as HTMLElement
    registerHudSlot(a)
    expect(currentHudSlot()).toBe(a)
    registerHudSlot(b)
    unregisterHudSlot(a)
    expect(currentHudSlot()).toBe(b)
    unregisterHudSlot(b)
    expect(currentHudSlot()).toBeNull()
  })
})
