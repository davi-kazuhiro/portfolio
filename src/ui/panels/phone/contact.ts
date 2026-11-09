// Links do celular (Contato + currículo), montados a partir de `profile` do conteúdo. Puro.
import { PHONE_APP_IDS, type PhoneAppId, type ResumeLang } from '@/ui/closeup/phoneAtlas'

/** Campos de `profile` usados pelo celular. */
export interface ContactProfile {
  name: string
  roles: string[]
  city: string
  email: string
  links: { linkedin?: string | null; github?: string | null }
  resume?: Partial<Record<ResumeLang, string | null>> | null
}

/** Serviço de cada botão (= id do app). Também é a chave `phone.<service>` do i18n. */
export type ContactService = PhoneAppId

export interface ContactLink {
  app: PhoneAppId
  service: ContactService
  href: string
  /** Abre em nova aba (`target="_blank"` + `rel="noopener noreferrer"`). */
  external: boolean
}

export interface ResumeLink {
  lang: ResumeLang
  /** Caminho do PDF; null = ainda não existe (botão desativado). */
  href: string | null
}

const nonEmpty = (v: string | null | undefined): v is string => typeof v === 'string' && v.trim() !== ''

/** Links dos botões (e-mail, LinkedIn, GitHub), na ordem de `apps` (só os que têm destino no conteúdo). */
export function contactLinks(profile: ContactProfile, apps: readonly PhoneAppId[] = PHONE_APP_IDS): ContactLink[] {
  const out: ContactLink[] = []
  for (const app of apps) {
    const service: ContactService = app
    if (service === 'email') {
      if (nonEmpty(profile.email)) out.push({ app, service, href: `mailto:${profile.email.trim()}`, external: false })
      continue
    }
    const url = profile.links[service]
    if (nonEmpty(url)) out.push({ app, service, href: url.trim(), external: true })
  }
  return out
}

/**
 * Prefixa um caminho do site (`/cv/x.pdf`) com a base de publicação (`import.meta.env.BASE_URL`,
 * ex.: `/portfolio/` no GitHub Pages). Só caminhos que começam com `/` mudam: URLs com esquema
 * (`https:`, `mailto:`), `//host` e caminhos relativos (que já resolvem contra a página) passam intactos.
 */
export function withBase(href: string, base: string = import.meta.env.BASE_URL ?? '/'): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href
  const prefix = base.endsWith('/') ? base : `${base}/`
  return prefix + href.slice(1)
}

/** Currículos PT e EN (null = desativado), com o href já resolvido contra a base do site. */
export function resumeLinks(profile: ContactProfile, base?: string): ResumeLink[] {
  return (['pt', 'en'] as const).map((lang) => {
    const href = profile.resume?.[lang]
    return { lang, href: nonEmpty(href) ? withBase(href.trim(), base) : null }
  })
}

/**
 * Aviso visível sob os botões de currículo: nenhum → null; todos faltando → `phone.resumeUnavailable`
 * ("Em breve"); só alguns → `phone.resumeSoon` com as línguas faltantes ("PT: em breve").
 */
export function resumeNote(resumes: readonly ResumeLink[]): { key: 'phone.resumeUnavailable' | 'phone.resumeSoon'; langs: string } | null {
  const missing = resumes.filter((r) => r.href === null).map((r) => r.lang.toUpperCase())
  if (missing.length === 0) return null
  return { key: missing.length === resumes.length ? 'phone.resumeUnavailable' : 'phone.resumeSoon', langs: missing.join(', ') }
}

/** Atributos de um link externo. */
export const externalProps = { target: '_blank', rel: 'noopener noreferrer' } as const
