import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import en from '../src/i18n/locales/en.json'
import pt from '../src/i18n/locales/pt.json'

// O HTML estático (crawlers e prévias de link) e o cliente (troca de idioma) usam os mesmos textos
// aprovados em docs/conteudo/seo.md.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const attr = (re: RegExp) => html.match(re)?.[1]

describe('SEO (M5)', () => {
  it('título e descrição PT do i18n são os mesmos do index.html', () => {
    expect(attr(/<title>([^<]+)<\/title>/)).toBe(pt.meta.title)
    expect(attr(/<meta name="description" content="([^"]+)"/)).toBe(pt.meta.description)
  })

  it('limites de tamanho: title ≤ 60 e description ≤ 155 nos dois idiomas', () => {
    for (const { meta } of [pt, en]) {
      expect(meta.title.length).toBeLessThanOrEqual(60)
      expect(meta.description.length).toBeLessThanOrEqual(155)
    }
  })

  it('Open Graph aponta para URLs absolutas do site publicado', () => {
    const base = 'https://davi-kazuhiro.github.io/portfolio/'
    expect(attr(/<meta property="og:url" content="([^"]+)"/)).toBe(base)
    expect(attr(/<meta property="og:image" content="([^"]+)"/)).toBe(`${base}og-image.png`)
  })
})
