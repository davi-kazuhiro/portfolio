import { afterEach, describe, expect, it, vi } from 'vitest'
import { EventBus } from '@/game/EventBus'
import en from '@/i18n/locales/en.json'
import pt from '@/i18n/locales/pt.json'
import { useGameStore } from '@/store/useGameStore'
import { requestOpen } from '@/ui/hud/requestOpen'

vi.mock('@/game/EventBus', () => ({ EventBus: { emit: vi.fn(), on: vi.fn() } }))

const initial = useGameStore.getState()
afterEach(() => {
  useGameStore.setState(initial, true)
  vi.clearAllMocks()
})

describe('sem WebGL (renderer-unavailable, M6)', () => {
  it('começa com o renderer disponível', () => {
    expect(useGameStore.getState().rendererUnavailable).toBe(false)
  })

  it('marca a flag e zera cena e dicas que dependem dela', () => {
    useGameStore.setState({ sceneKey: 'Entrance', doorAnchor: { x: 1, y: 2 }, hoveredId: 'computer', hoverAnchor: { x: 3, y: 4 } })
    useGameStore.getState().setRendererUnavailable()
    const s = useGameStore.getState()
    expect(s.rendererUnavailable).toBe(true)
    expect(s.sceneKey).toBeNull()
    expect(s.doorAnchor).toBeNull()
    expect(s.hoveredId).toBeNull()
    expect(s.hoverAnchor).toBeNull()
  })

  it('o menu abre o painel na hora, sem pedir zoom à cena', () => {
    useGameStore.getState().setRendererUnavailable()
    requestOpen('computer')
    expect(useGameStore.getState().openId).toBe('computer')
    expect(EventBus.emit).not.toHaveBeenCalledWith('focus-object', 'computer')
    useGameStore.getState().close()
    expect(useGameStore.getState().openId).toBeNull()
  })

  it('aviso e texto alternativo da imagem existem em PT e EN', () => {
    for (const locale of [pt, en]) {
      expect(locale.fallback.notice.length).toBeGreaterThan(0)
      expect(locale.fallback.imageAlt.length).toBeGreaterThan(0)
    }
    expect(pt.fallback.notice).not.toBe(en.fallback.notice)
  })
})
