// Ponto único de acesso ao conteúdo. Cada idioma tem os mesmos arquivos em content/<lang>/.
// EN ainda está incompleto (ver docs/conteudo/pendencias.md): só skills.json existe em en/;
// os demais arquivos usam PT como fallback.
import about from './pt/about.json'
import awards from './pt/awards.json'
import education from './pt/education.json'
import experiences from './pt/experiences.json'
import extras from './pt/extras.json'
import profile from './pt/profile.json'
import projects from './pt/projects.json'
import skills from './pt/skills.json'
import skillsEn from './en/skills.json'

const pt = { about, awards, education, experiences, extras, profile, projects, skills }

export type Content = typeof pt
export type Locale = 'pt' | 'en'

const en: Content = { ...pt, skills: skillsEn }

const byLocale: Record<Locale, Content> = { pt, en }

export function getContent(locale: Locale): Content {
  return byLocale[locale]
}
