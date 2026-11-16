import { describe, expect, it } from 'vitest'
import { tutorialSteps, typedLength } from '@/ui/tutorial/steps'
import { readTutorialSeen, saveTutorialSeen } from '@/store/persist'

describe('tutorialSteps', () => {
  it('começa com as boas-vindas e termina no passo final', () => {
    const steps = tutorialSteps(false)
    expect(steps[0].key).toBe('welcome')
    expect(steps.at(-1)?.key).toBe('end')
  })

  it('o passo dos objetos mostra as setas e muda o texto no toque', () => {
    expect(tutorialSteps(false).find((s) => s.arrows)?.key).toBe('objects')
    expect(tutorialSteps(true).find((s) => s.arrows)?.key).toBe('objectsTouch')
  })

  it('destaca o menu e o botão de ajuda', () => {
    const focus = tutorialSteps(false).map((s) => s.focus).filter(Boolean)
    expect(focus).toEqual(['menu', 'help'])
  })
})

describe('typedLength', () => {
  it('avança uma letra por intervalo e para no total', () => {
    expect(typedLength('abcd', 0, 10)).toBe(0)
    expect(typedLength('abcd', 25, 10)).toBe(2)
    expect(typedLength('abcd', 999, 10)).toBe(4)
  })

  it('sem intervalo mostra tudo (reduced motion)', () => {
    expect(typedLength('abcd', 0, 0)).toBe(4)
  })
})

describe('tutorial visto', () => {
  it('lembra depois de gravar e tolera storage quebrado', () => {
    const map = new Map<string, string>()
    const storage = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) }
    expect(readTutorialSeen(storage)).toBe(false)
    saveTutorialSeen(storage)
    expect(readTutorialSeen(storage)).toBe(true)
    const broken = { getItem: () => { throw new Error('x') }, setItem: () => { throw new Error('x') } }
    expect(readTutorialSeen(broken)).toBe(false)
    expect(() => saveTutorialSeen(broken)).not.toThrow()
  })
})
