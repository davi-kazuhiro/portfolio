import { describe, expect, it } from 'vitest'
import en from '@/i18n/locales/en.json'
import pt from '@/i18n/locales/pt.json'
import { LANGUAGE_KEY, MUTED_KEY, readLanguage, readMuted, saveLanguage, saveMuted, type KeyValueStorage } from '@/store/persist'

const memory = (init: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } => {
  const data = { ...init }
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v
    },
  }
}

const broken: KeyValueStorage = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
}

describe('som lembrado (quartoPixel.muted)', () => {
  it('desligado por padrão', () => {
    expect(readMuted(memory())).toBe(true)
    expect(readMuted(null)).toBe(true)
  })
  it('lembra a escolha', () => {
    const s = memory()
    saveMuted(s, false)
    expect(s.data[MUTED_KEY]).toBe('false')
    expect(readMuted(s)).toBe(false)
    saveMuted(s, true)
    expect(readMuted(s)).toBe(true)
  })
  it('valor estranho conta como desligado', () => {
    expect(readMuted(memory({ [MUTED_KEY]: 'talvez' }))).toBe(true)
  })
  it('storage que lança não quebra', () => {
    expect(readMuted(broken)).toBe(true)
    expect(() => saveMuted(broken, false)).not.toThrow()
  })
})

describe('idioma lembrado (quartoPixel.lang)', () => {
  it('sem escolha, segue o navegador', () => {
    expect(readLanguage(memory(), 'pt-BR')).toBe('pt')
    expect(readLanguage(memory(), 'en-US')).toBe('en')
    expect(readLanguage(memory(), 'ja')).toBe('en')
    expect(readLanguage(null, undefined)).toBe('en')
  })
  it('a escolha vence o navegador', () => {
    const s = memory()
    saveLanguage(s, 'en')
    expect(s.data[LANGUAGE_KEY]).toBe('en')
    expect(readLanguage(s, 'pt-BR')).toBe('en')
    saveLanguage(s, 'pt')
    expect(readLanguage(s, 'en-US')).toBe('pt')
  })
  it('ignora valores inválidos', () => {
    const s = memory({ [LANGUAGE_KEY]: 'fr' })
    expect(readLanguage(s, 'pt-PT')).toBe('pt')
    saveLanguage(s, 'de')
    expect(s.data[LANGUAGE_KEY]).toBe('fr')
  })
  it('storage que lança não quebra', () => {
    expect(readLanguage(broken, 'pt-BR')).toBe('pt')
    expect(() => saveLanguage(broken, 'en')).not.toThrow()
  })
})

describe('textos do M4 nas duas línguas', () => {
  it('som e porta', () => {
    for (const l of [pt, en]) {
      expect(l.hud.sound.off).toBeTruthy()
      expect(l.hud.sound.on).toBeTruthy()
      // Rótulo acessível começa pelo texto visível (WCAG 2.5.3).
      expect(l.hud.sound.offLabel.startsWith(l.hud.sound.off)).toBe(true)
      expect(l.hud.sound.onLabel.startsWith(l.hud.sound.on)).toBe(true)
      expect(l.entrance.enter).toBeTruthy()
      expect(l.entrance.enterRoom).toBeTruthy()
      expect(l.entrance.announce).toBeTruthy()
    }
  })
})
