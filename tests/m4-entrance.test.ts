import { describe, expect, it } from 'vitest'
import {
  availableTag,
  doorTag,
  entranceView,
  markVisited,
  readVisited,
  shouldSkipEntrance,
  VISITED_KEY,
  worldToScreen,
} from '@/game/systems/entranceMath'

describe('entranceView (escala inteira, zona segura em telas estreitas)', () => {
  it('telas largas: floor(min(vw/320, vh/180)) + colunas laterais', () => {
    expect(entranceView(1920, 950)).toEqual({ zoom: 5, narrow: false, sideColumns: 2 })
    expect(entranceView(1920, 1080)).toEqual({ zoom: 6, narrow: false, sideColumns: 0 })
    expect(entranceView(1366, 650).zoom).toBe(3)
    // 1366/3 = 455,3 px de mundo → 67,7 de sobra de cada lado → 5 colunas de 16
    expect(entranceView(1366, 650).sideColumns).toBe(5)
  })

  it('telas estreitas: zona segura de 112 px manda e corta as laterais', () => {
    expect(entranceView(390, 844)).toEqual({ zoom: 3, narrow: true, sideColumns: 0 })
    expect(entranceView(375, 667).zoom).toBe(3)
  })

  it('nunca menor que 1', () => {
    expect(entranceView(80, 100).zoom).toBe(1)
  })
})

describe('tags da porta por período', () => {
  it('folha: closed/open de dia, -dusk/-night nos outros', () => {
    expect(doorTag('closed', 'day')).toBe('closed')
    expect(doorTag('open', 'day')).toBe('open')
    expect(doorTag('closed', 'dusk')).toBe('closed-dusk')
    expect(doorTag('open', 'night')).toBe('open-night')
  })

  it('sheet sem a tag pedida usa a de reserva', () => {
    expect(availableTag(['day', 'night', 'dusk'], 'dusk', 'day')).toBe('dusk')
    expect(availableTag(['day', 'night'], 'dusk', 'day')).toBe('day')
    expect(availableTag(['closed', 'open'], 'open-dusk', 'open')).toBe('open')
    expect(availableTag([], 'night', 'day')).toBeUndefined()
  })
})

describe('quem já visitou entra direto', () => {
  it('visited=1 pula a porta; ?entrance=1 só força em dev', () => {
    expect(shouldSkipEntrance(null, '', false)).toBe(false)
    expect(shouldSkipEntrance('1', '', false)).toBe(true)
    expect(shouldSkipEntrance('1', '?entrance=1', true)).toBe(false)
    expect(shouldSkipEntrance('1', '?entrance=1', false)).toBe(true)
  })

  it('storage que lança não quebra', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(readVisited(broken)).toBeNull()
    expect(() => markVisited(broken)).not.toThrow()
  })

  it('grava e lê a chave', () => {
    const data = new Map<string, string>()
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }
    expect(readVisited(storage)).toBeNull()
    markVisited(storage)
    expect(data.get(VISITED_KEY)).toBe('1')
    expect(readVisited(storage)).toBe('1')
  })
})

describe('worldToScreen (posição da maçaneta em px CSS)', () => {
  it('desconta a vista e aplica o zoom', () => {
    expect(worldToScreen({ x: 183, y: 97 }, { x: -32, y: 0 }, 3)).toEqual({ x: 645, y: 291 })
  })
})
