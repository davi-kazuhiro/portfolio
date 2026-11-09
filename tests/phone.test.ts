import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getContent } from '@/content'
import { HUD_BAND, pickCloseupLayout } from '@/ui/closeup/layout'
import { centeredAppXs, composePhone, cvFrame, parsePhoneAtlas, phoneGeometry } from '@/ui/closeup/phoneAtlas'
import { contactLinks, resumeLinks, type ContactProfile } from '@/ui/panels/phone/contact'
import en from '@/i18n/locales/en.json'
import pt from '@/i18n/locales/pt.json'

const JSON_URL = 'assets/ui/closeup-phone.json'
const raw: unknown = JSON.parse(readFileSync('public/assets/ui/closeup-phone.json', 'utf8'))
const atlas = parsePhoneAtlas(raw, JSON_URL)

describe('phoneAtlas.parsePhoneAtlas (specs/6-cama-celular.md, JSON real)', () => {
  it('lê tamanho, sangria, aparelho, slots e frames', () => {
    expect(atlas.image).toBe('assets/ui/closeup-phone.png')
    expect(atlas.size).toEqual({ w: 320, h: 180 })
    expect(atlas.minScale).toBe(3)
    expect(atlas.bleed).toEqual({ left: 80, top: 64, right: 80, bottom: 64 })
    expect(atlas.backgroundBleed).toEqual({ rect: { x: -80, y: -64, w: 480, h: 308 }, day: 'bleed/day', night: 'bleed/night' })
    expect(atlas.phone.rect).toEqual({ x: 100, y: 0, w: 124, h: 178 })
    expect(atlas.content).toEqual({ x: 108, y: 20, w: 104, h: 146 })
    expect(atlas.slots.roleLines).toBe(3)
    expect(atlas.slots.roleLineHeight).toBe(8)
    expect(atlas.apps.ids).toEqual(['email', 'linkedin', 'github'])
    expect(atlas.apps.items.github?.hover?.frame).toBe('app/github/hover')
    expect(atlas.cv.items.en.rect).toEqual({ x: 162, y: 137, w: 48, h: 18 })
    expect(atlas.cv.items.pt.disabled?.frame).toBe('cv/pt/disabled')
    expect(atlas.cv.textRect).toEqual({ x: 18, y: 0, w: 28, h: 18 })
    expect(atlas.cv.disabledHasHover).toBe(false)
    expect(atlas.textInk.cvDisabled).toBe('#4a4659')
    expect(Object.keys(atlas.frames)).toHaveLength(25)
  })
})

describe('apps sem WhatsApp, centrados na tela', () => {
  it('3 botões 22×22 a passo 26, centrados em [108,20,104,146]', () => {
    expect(centeredAppXs(atlas.content, 3)).toEqual([123, 149, 175])
    expect(atlas.apps.items.email?.rect).toEqual({ x: 123, y: 95, w: 22, h: 22 })
    expect(atlas.apps.items.linkedin?.rect).toEqual({ x: 149, y: 95, w: 22, h: 22 })
    expect(atlas.apps.items.github?.rect).toEqual({ x: 175, y: 95, w: 22, h: 22 })
    expect(atlas.apps.items.github?.hover?.rect).toEqual({ x: 173, y: 93, w: 26, h: 26 })
    // sprites desenhados em 110/136/162 no atlas → deslocados para as novas posições
    expect([atlas.apps.items.email?.dx, atlas.apps.items.linkedin?.dx, atlas.apps.items.github?.dx]).toEqual([13, 13, 13])
    const apps = composePhone(atlas, { night: false, resume: { pt: false, en: false } }).filter((l) => l.role === 'app')
    expect(apps.map((l) => atlas.frames[l.frame].x + (l.dx ?? 0))).toEqual([123, 149, 175])
    const { x, w } = atlas.content
    const first = atlas.apps.items.email!.rect
    const last = atlas.apps.items.github!.rect
    expect(first.x - x).toBe(x + w - (last.x + last.w))
  })

  it('rótulos 26×7 centrados sob cada botão', () => {
    expect(atlas.slots.labels).toEqual([
      { x: 121, y: 119, w: 26, h: 7 },
      { x: 147, y: 119, w: 26, h: 7 },
      { x: 173, y: 119, w: 26, h: 7 },
    ])
  })

  it('o id phone do atlas é ignorado (frame app/phone sem uso)', () => {
    expect('phone' in atlas.apps.items).toBe(false)
    expect(composePhone(atlas, { night: false, resume: { pt: false, en: false } }).map((l) => l.frame)).not.toContain('app/phone')
  })
})

describe('composePhone', () => {
  const none = { pt: false, en: false }
  it('ordem: fundo → aparelho → status → avatar → divisória → 3 apps → cv PT/EN', () => {
    const roles = composePhone(atlas, { night: false, resume: none }).map((l) => l.role)
    expect(roles).toEqual(['background', 'phone', 'status', 'avatar', 'divider', 'app', 'app', 'app', 'cv', 'cv'])
  })

  it('noite: só o fundo muda (sangria real)', () => {
    const day = composePhone(atlas, { night: false, resume: none })
    const night = composePhone(atlas, { night: true, resume: none })
    expect(day[0].frame).toBe('bleed/day')
    expect(night[0].frame).toBe('bleed/night')
    expect(night.slice(1)).toEqual(day.slice(1))
  })

  it('hover troca o frame do app', () => {
    const frames = composePhone(atlas, { night: false, hot: 'linkedin', resume: none }).map((l) => l.frame)
    expect(frames).toContain('app/linkedin/hover')
    expect(frames).toContain('app/email')
  })

  it('currículo: desativado sem PDF (sem hover); com PDF, normal e hover', () => {
    expect(cvFrame(atlas, 'pt', false, false)).toBe('cv/pt/disabled')
    expect(cvFrame(atlas, 'pt', false, true)).toBe('cv/pt/disabled')
    expect(cvFrame(atlas, 'en', true, false)).toBe('cv/en')
    expect(cvFrame(atlas, 'en', true, true)).toBe('cv/en/hover')
    const frames = composePhone(atlas, { night: false, hot: 'cv:en', resume: { pt: false, en: true } }).map((l) => l.frame)
    expect(frames.slice(-2)).toEqual(['cv/pt/disabled', 'cv/en/hover'])
  })
})

describe('links do contato', () => {
  const profile = getContent('pt').profile as ContactProfile

  it('e-mail em mailto:, LinkedIn e GitHub externos, nessa ordem (sem WhatsApp)', () => {
    const links = contactLinks(profile)
    expect(links.map((l) => l.service)).toEqual(['email', 'linkedin', 'github'])
    expect(links[0]).toEqual({ app: 'email', service: 'email', href: `mailto:${profile.email}`, external: false })
    expect(links.slice(1).every((l) => l.external && l.href.startsWith('https://'))).toBe(true)
  })

  it('pula serviço sem destino', () => {
    const links = contactLinks({ ...profile, links: { ...profile.links, github: null } })
    expect(links.map((l) => l.app)).toEqual(['email', 'linkedin'])
  })

  it('não depende de links.whatsapp nem phoneDisplay no conteúdo', () => {
    const extra = { ...profile, phoneDisplay: '+55', links: { ...profile.links, whatsapp: 'https://wa.me/1' } } as ContactProfile
    expect(contactLinks(extra).map((l) => l.service)).toEqual(['email', 'linkedin', 'github'])
  })

  it('currículo: null → desativado; caminho → link', () => {
    expect(resumeLinks(profile)).toEqual([
      { lang: 'pt', href: profile.resume?.pt ?? null },
      { lang: 'en', href: profile.resume?.en ?? null },
    ])
    expect(resumeLinks({ ...profile, resume: { pt: 'cv/davi-pt.pdf', en: null } })).toEqual([
      { lang: 'pt', href: 'cv/davi-pt.pdf' },
      { lang: 'en', href: null },
    ])
  })
})

describe('i18n phone.*', () => {
  const keys = (o: object, p = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
  it('mesmas chaves em PT e EN, incluindo os rótulos de cada serviço', () => {
    expect(keys(pt.phone).sort()).toEqual(keys(en.phone).sort())
    for (const s of ['email', 'linkedin', 'github']) {
      expect(keys(pt.phone)).toContain(s)
      expect(keys(pt.phone)).toContain(`aria.${s}`)
    }
    expect(keys(pt.phone)).not.toContain('whatsapp')
    expect(keys(pt.phone)).not.toContain('aria.whatsapp')
  })
})

describe('regra cover do celular', () => {
  const geo = phoneGeometry(atlas)
  it('1920×1080 → 4×; 1366×768 → 3×; 360 px → modo texto', () => {
    expect(pickCloseupLayout(1920, 1080, geo, HUD_BAND)).toMatchObject({ mode: 'cover', scale: 4 })
    expect(pickCloseupLayout(1366, 768, geo, HUD_BAND)).toMatchObject({ mode: 'cover', scale: 3 })
    expect(pickCloseupLayout(360, 740, geo, HUD_BAND).mode).toBe('fallback')
  })
})
