import { describe, expect, it } from 'vitest'
import { parsePeriod, periodAt, pickTag, type Period } from '@/game/systems/period'
import { isNightAt, nextPeriod, parsePeriodParam, periodAt as uiPeriodAt } from '@/ui/closeup/period'
import { useGameStore } from '@/store/useGameStore'

const at = (h: number, m = 0) => new Date(2026, 10, 1, h, m)

describe('game/systems/period.periodAt (dia 7–17, entardecer 17–19, noite 19–7)', () => {
  it('limites das faixas', () => {
    expect(periodAt(at(6, 59))).toBe('night')
    expect(periodAt(at(7, 0))).toBe('day')
    expect(periodAt(at(12))).toBe('day')
    expect(periodAt(at(16, 59))).toBe('day')
    expect(periodAt(at(17, 0))).toBe('dusk')
    expect(periodAt(at(18, 59))).toBe('dusk')
    expect(periodAt(at(19, 0))).toBe('night')
    expect(periodAt(at(23, 59))).toBe('night')
    expect(periodAt(at(0, 0))).toBe('night')
  })
})

describe('game/systems/period.parsePeriod', () => {
  it('aceita só os três valores exatos', () => {
    expect(parsePeriod('day')).toBe('day')
    expect(parsePeriod('dusk')).toBe('dusk')
    expect(parsePeriod('night')).toBe('night')
  })
  it('qualquer outra coisa é null', () => {
    for (const v of ['', 'DAY', 'Night', ' day', 'noon', null, undefined]) expect(parsePeriod(v)).toBeNull()
  })
})

describe('game/systems/period.pickTag', () => {
  it('sprite sem tags: visível, frame 0', () => {
    for (const p of ['day', 'dusk', 'night'] as Period[]) expect(pickTag([], p)).toEqual({ visible: true })
  })
  it('window / light-window (day, dusk, night): tag do próprio período', () => {
    const tags = ['day', 'dusk', 'night']
    expect(pickTag(tags, 'day')).toEqual({ tag: 'day', visible: true })
    expect(pickTag(tags, 'dusk')).toEqual({ tag: 'dusk', visible: true })
    expect(pickTag(tags, 'night')).toEqual({ tag: 'night', visible: true })
  })
  it('desk-lamp (off, on): apagada de dia, acesa no entardecer e à noite', () => {
    const tags = ['off', 'on']
    expect(pickTag(tags, 'day')).toEqual({ tag: 'off', visible: true })
    expect(pickTag(tags, 'dusk')).toEqual({ tag: 'on', visible: true })
    expect(pickTag(tags, 'night')).toEqual({ tag: 'on', visible: true })
  })
  it('light-computer (só night): some de dia, aparece no entardecer e à noite', () => {
    expect(pickTag(['night'], 'day')).toEqual({ visible: false })
    expect(pickTag(['night'], 'dusk')).toEqual({ tag: 'night', visible: true })
    expect(pickTag(['night'], 'night')).toEqual({ tag: 'night', visible: true })
  })
  it('sprite com dia e noite, sem dusk: o entardecer usa a noite', () => {
    expect(pickTag(['day', 'night'], 'dusk')).toEqual({ tag: 'night', visible: true })
  })
  it('tag neutra (idle) vale em qualquer período; tag do período tem preferência', () => {
    for (const p of ['day', 'dusk', 'night'] as Period[]) expect(pickTag(['idle'], p)).toEqual({ tag: 'idle', visible: true })
    expect(pickTag(['idle', 'night'], 'night')).toEqual({ tag: 'night', visible: true })
    expect(pickTag(['idle', 'night'], 'day')).toEqual({ tag: 'idle', visible: true })
  })
})

describe('ui/closeup/period', () => {
  it('periodAt usa as mesmas faixas', () => {
    expect(uiPeriodAt(at(6, 59))).toBe('night')
    expect(uiPeriodAt(at(7))).toBe('day')
    expect(uiPeriodAt(at(16, 59))).toBe('day')
    expect(uiPeriodAt(at(17))).toBe('dusk')
    expect(uiPeriodAt(at(18, 59))).toBe('dusk')
    expect(uiPeriodAt(at(19))).toBe('night')
  })
  it('concorda com game/systems/period.periodAt em todo minuto do dia', () => {
    for (let min = 0; min < 24 * 60; min++) {
      const d = at(Math.floor(min / 60), min % 60)
      expect(uiPeriodAt(d)).toBe(periodAt(d))
    }
  })
  it('isNightAt: só a noite (entardecer usa a arte de dia)', () => {
    expect(isNightAt(at(12))).toBe(false)
    expect(isNightAt(at(18))).toBe(false)
    expect(isNightAt(at(19))).toBe(true)
    expect(isNightAt(at(3))).toBe(true)
  })
  it('parsePeriodParam lê ?period= da query string', () => {
    expect(parsePeriodParam('?period=night')).toBe('night')
    expect(parsePeriodParam('?lang=en&period=dusk')).toBe('dusk')
    expect(parsePeriodParam('period=day')).toBe('day')
    expect(parsePeriodParam('')).toBeNull()
    expect(parsePeriodParam('?period=noon')).toBeNull()
    expect(parsePeriodParam('?period=NIGHT')).toBeNull()
    expect(parsePeriodParam('?periods=night')).toBeNull()
  })
})

describe('botão de período do HUD', () => {
  it('alterna dia → tarde → noite → dia', () => {
    expect(nextPeriod('day')).toBe('dusk')
    expect(nextPeriod('dusk')).toBe('night')
    expect(nextPeriod('night')).toBe('day')
  })
  it('choosePeriod grava a escolha e o período (a visão de perto aberta acompanha)', () => {
    useGameStore.getState().setPeriod('day')
    expect(useGameStore.getState().periodChoice).toBeNull()
    useGameStore.getState().choosePeriod('night')
    expect(useGameStore.getState()).toMatchObject({ period: 'night', periodChoice: 'night' })
  })
})
