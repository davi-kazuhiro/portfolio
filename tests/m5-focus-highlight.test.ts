import { describe, expect, it } from 'vitest'
import { litObject, topCenterOnScreen } from '@/game/systems/cameraMath'

describe('destaque pelo menu de teclado (focus-highlight)', () => {
  it('o hover do ponteiro vence o foco do menu', () => {
    expect(litObject('phone', 'computer')).toBe('phone')
    expect(litObject(null, 'computer')).toBe('computer')
    expect(litObject('phone', null)).toBe('phone')
    expect(litObject(null, null)).toBeNull()
  })

  it('âncora = meio do topo do objeto em px da tela', () => {
    const rect = { x: 100, y: 50, width: 40, height: 30 }
    // Zoom 1 sem rolagem: a tela é o mundo.
    expect(topCenterOnScreen(rect, { x: 0, y: 0 }, 1)).toEqual({ x: 120, y: 50 })
    // Zoom 2 com a vista começando em (90, 40): (120 − 90)·2, (50 − 40)·2.
    expect(topCenterOnScreen(rect, { x: 90, y: 40 }, 2)).toEqual({ x: 60, y: 20 })
    // Arredonda para px inteiro.
    expect(topCenterOnScreen({ x: 0, y: 0, width: 3, height: 1 }, { x: 0.25, y: 0.25 }, 3)).toEqual({ x: 4, y: -1 })
  })
})
