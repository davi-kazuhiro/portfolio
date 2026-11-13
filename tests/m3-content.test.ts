import { describe, expect, it } from 'vitest'
import { captionLines } from '@/ui/panels/deskItem/model'
import { INTERACTABLES } from '@/game/objects/registry'
import { nextPeriod } from '@/ui/closeup/period'
import albumsPt from '../src/content/pt/albums.json'
import albumsEn from '../src/content/en/albums.json'
import gamesPt from '../src/content/pt/games.json'
import gamesEn from '../src/content/en/games.json'
import awardsPt from '../src/content/pt/awards.json'
import awardsEn from '../src/content/en/awards.json'
import expPt from '../src/content/pt/experiences.json'
import expEn from '../src/content/en/experiences.json'
import eduPt from '../src/content/pt/education.json'
import eduEn from '../src/content/en/education.json'
import en from '@/i18n/locales/en.json'
import pt from '@/i18n/locales/pt.json'

const ids = (list: { id: string }[]) => list.map((i) => i.id)

describe('M3: paridade PT/EN do conteúdo', () => {
  const pairs: [string, { id: string }[], { id: string }[]][] = [
    ['albums', albumsPt, albumsEn],
    ['games', gamesPt, gamesEn],
    ['awards', awardsPt, awardsEn],
    ['experiences', expPt, expEn],
    ['education', eduPt, eduEn],
  ]
  for (const [name, a, b] of pairs) {
    it(`${name}: mesmos ids, na mesma ordem, sem repetição`, () => {
      expect(a.length).toBeGreaterThan(0)
      expect(ids(b)).toEqual(ids(a))
      expect(new Set(ids(a)).size).toBe(a.length)
    })
  }
})

describe('M3: i18n dos painéis novos', () => {
  const same = (a: object, b: object, path = ''): string[] =>
    Object.keys(a).flatMap((k) => {
      const av = (a as Record<string, unknown>)[k]
      const bv = (b as Record<string, unknown>)[k]
      if (bv === undefined) return [`${path}${k}`]
      return av && typeof av === 'object' ? same(av as object, bv as object, `${path}${k}.`) : []
    })
  for (const ns of ['objects', 'headset', 'controller', 'frames', 'journal', 'phone', 'bookshelf'] as const) {
    it(`namespace ${ns} tem as mesmas chaves em PT e EN`, () => {
      expect(pt).toHaveProperty(ns)
      expect(same(pt[ns], en[ns])).toEqual([])
      expect(same(en[ns], pt[ns])).toEqual([])
    })
  }

  it('todos os 7 objetos do M3 estão no registry', () => {
    const reg = INTERACTABLES.map((i) => i.id) as string[]
    for (const id of ['computer', 'frames', 'bookshelf', 'journal', 'phone', 'headset', 'controller']) {
      expect(reg).toContain(id)
    }
  })
})

describe('captionLines', () => {
  const entry = { id: 'x', fields: { title: 'A', artist: '', genre: 'G' }, details: [] }
  it('mantém a ordem de lines e descarta vazias ou ausentes', () => {
    expect(captionLines(entry, ['artist', 'title', 'genre', 'nada'])).toEqual(['A', 'G'])
  })
})

describe('botão de período', () => {
  it('cicla dia → tarde → noite → dia', () => {
    expect(nextPeriod('day')).toBe('dusk')
    expect(nextPeriod('dusk')).toBe('night')
    expect(nextPeriod('night')).toBe('day')
  })
})
