import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '@/store/useGameStore'
import { fallbackDelay, requestOpen } from '@/ui/hud/requestOpen'
import { HINT_GAP, HINT_HALF_WIDTH, HINT_HEIGHT, hintPosition } from '@/ui/hud/hintPosition'

vi.mock('@/game/EventBus', () => ({ EventBus: { emit: vi.fn(), on: vi.fn() } }))

const screen = { left: 0, top: 0, width: 1366, height: 768 }

describe('dica "Entrar" (door-hover)', () => {
  it('fica acima da maçaneta com o canvas na origem', () => {
    expect(hintPosition({ x: 700, y: 400 }, { left: 0, top: 0 }, screen)).toEqual({ left: 700, top: 400 - HINT_GAP })
  })
  it('soma o deslocamento do canvas dentro do contêiner', () => {
    const canvas = { left: 120, top: 30 }
    expect(hintPosition({ x: 300, y: 200 }, canvas, screen)).toEqual({ left: 420, top: 230 - HINT_GAP })
  })
  it('desconta a posição do contêiner na página', () => {
    const container = { ...screen, left: 50, top: 20 }
    expect(hintPosition({ x: 300, y: 200 }, { left: 50, top: 20 }, container)).toEqual({ left: 300, top: 200 - HINT_GAP })
  })
  it('arredonda para px inteiros', () => {
    expect(hintPosition({ x: 300.4, y: 200.6 }, { left: 0.3, top: 0 }, screen)).toEqual({ left: 301, top: 201 - HINT_GAP })
  })
  it('não sai da tela (bordas e topo)', () => {
    const left = hintPosition({ x: 2, y: 3 }, { left: 0, top: 0 }, screen)
    expect(left.left).toBeGreaterThanOrEqual(HINT_HALF_WIDTH)
    expect(left.top).toBeGreaterThanOrEqual(HINT_HEIGHT)
    const right = hintPosition({ x: 1366, y: 900 }, { left: 0, top: 0 }, screen)
    expect(right.left).toBeLessThanOrEqual(1366 - HINT_HALF_WIDTH)
    expect(right.top).toBeLessThanOrEqual(768)
  })
  it('celular de 360 px', () => {
    const phone = { left: 0, top: 0, width: 360, height: 740 }
    const p = hintPosition({ x: 340, y: 380 }, { left: 0, top: 0 }, phone)
    expect(p.left + HINT_HALF_WIDTH).toBeLessThanOrEqual(360)
  })
})

describe('fallback do menu na porta', () => {
  it('na porta espera a troca de cena; no quarto, 1,5 s', () => {
    expect(fallbackDelay('Room')).toBe(1500)
    expect(fallbackDelay(null)).toBe(1500)
    expect(fallbackDelay('Entrance')).toBeGreaterThan(1500)
  })
  afterEach(() => vi.useRealTimers())
  it('pedido na porta não abre o painel sozinho durante a troca de cena', () => {
    vi.useFakeTimers()
    useGameStore.setState({ sceneKey: 'Entrance', openId: null })
    requestOpen('computer')
    vi.advanceTimersByTime(1600)
    expect(useGameStore.getState().openId).toBeNull()
    vi.advanceTimersByTime(fallbackDelay('Entrance'))
    expect(useGameStore.getState().openId).toBe('computer')
  })
  it('sair da porta limpa a dica', () => {
    useGameStore.setState({ sceneKey: 'Entrance', doorAnchor: { x: 1, y: 2 } })
    useGameStore.getState().setSceneKey('Room')
    expect(useGameStore.getState().doorAnchor).toBeNull()
  })
})
