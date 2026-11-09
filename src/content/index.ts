// Ponto único de acesso ao conteúdo. Cada idioma tem os mesmos arquivos em content/<lang>/.
// EN ainda está incompleto (ver docs/conteudo/pendencias.md): só skills, experiences e profile
// existem em en/; os demais arquivos usam PT como fallback.
import about from './pt/about.json'
import awards from './pt/awards.json'
import education from './pt/education.json'
import experiencesPt from './pt/experiences.json'
import extras from './pt/extras.json'
import profile from './pt/profile.json'
import profileEn from './en/profile.json'
import projects from './pt/projects.json'
import skills from './pt/skills.json'
import skillsEn from './en/skills.json'
import experiencesEn from './en/experiences.json'

/** Tipo de experiência: define o carimbo e a cor da aba no caderno (`journal`). */
export type ExperienceType = 'work' | 'research'

/**
 * Uma experiência = uma página dupla do caderno. O array já vem na ordem de exibição
 * (início mais recente primeiro). Esquema em docs/conteudo/guia-de-conteudo.md.
 */
export interface Experience {
  /** Estável entre idiomas; serve de key/âncora das abas. */
  id: string
  type: ExperienceType
  /** Cargo (trabalho) ou título do projeto (pesquisa). */
  title: string
  organization: string
  /** Programa dentro da organização (ex.: "PIBIC"); null se não houver. */
  program: string | null
  city: string
  /** "AAAA-MM". */
  start: string
  /** "AAAA-MM"; null = sem data de término (atual). */
  end: string | null
  /** Texto de período já traduzido, pronto para exibir. */
  period: string
  items: string[]
}

const pt = {
  about,
  awards,
  education,
  experiences: experiencesPt as Experience[],
  extras,
  profile,
  projects,
  skills,
}

export type Content = typeof pt
export type Locale = 'pt' | 'en'

const en: Content = {
  ...pt,
  profile: profileEn,
  skills: skillsEn,
  experiences: experiencesEn as Experience[],
}

const byLocale: Record<Locale, Content> = { pt, en }

export function getContent(locale: Locale): Content {
  return byLocale[locale]
}
