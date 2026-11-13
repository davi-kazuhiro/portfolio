// Ponto único de acesso ao conteúdo. Cada idioma tem os mesmos arquivos em content/<lang>/.
// EN ainda está incompleto (ver docs/conteudo/pendencias.md): só skills, experiences, profile,
// education e awards existem em en/; os demais arquivos usam PT como fallback.
import about from './pt/about.json'
import albums from './pt/albums.json'
import albumsEn from './en/albums.json'
import games from './pt/games.json'
import gamesEn from './en/games.json'
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
import educationEn from './en/education.json'
import awardsEn from './en/awards.json'

/**
 * Um prêmio ou certificado (quadros, `frames`). O array já vem na ordem de exibição (mais recente
 * primeiro). Esquema em docs/conteudo/guia-de-conteudo.md.
 */
export interface Award {
  /** Estável entre idiomas; igual ao nome do arquivo em public/certificates/. */
  id: string
  title: string
  issuer: string
  /** "AAAA-MM" ou "AAAA-MM-DD", para ordenar. */
  date: string
  /** Data já formatada para exibir. */
  dateLabel: string
  /** Uma frase; null = sem descrição. */
  description: string | null
  /** Caminho do PDF/imagem em public/ ("/certificates/<id>.pdf"); null = sem arquivo. */
  file: string | null
}

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

/**
 * Uma formação = um lado da página dupla "Formação" do caderno (bacharelado à esquerda, ensino
 * médio técnico à direita). Campos `null`/listas vazias são omitidos pela UI.
 */
export interface Education {
  /** Estável entre idiomas. */
  id: string
  /** Nível já traduzido ("Bacharelado", "Ensino Médio Técnico"). */
  level: string
  course: string | null
  institution: string | null
  city: string | null
  /** "AAAA" ou "AAAA-MM"; null se não informado. */
  start: string | null
  end: string | null
  /** Texto de período já traduzido, pronto para exibir. */
  period: string | null
  /** Destaques curtos (ex.: "IRA: 9,4"). */
  highlights: string[]
  /** Disciplinas em destaque. */
  subjects: string[]
}

/** Motivos geométricos permitidos para capas geradas por código. */
export type CoverMotif = 'sun' | 'rings' | 'waves' | 'stripes' | 'grid' | 'triangle' | 'diamond'

/** Capa gerada por código: tokens da paleta (ex.: "teal-2") + motivo. */
export interface Cover {
  bg: string
  fg: string
  dark: string
  ink: string
  motif: CoverMotif
}

/** Um álbum (headset). `coverText`: até 2 linhas de 15 caracteres, sem acento. */
export interface Album {
  /** Estável entre idiomas; frame `cover/<id>` no atlas. */
  id: string
  title: string
  artist: string
  year: number | null
  note: string | null
  cover: Cover
  coverText?: string
}

/** Ícone do jogo, usado no item flutuante do controle. */
export type GameIcon = 'valorant-v' | 'dirt-block' | 'soccer-ball' | 'pokeball' | 'mushroom'

/** Um jogo (controle). `coverText`: até 2 linhas de 12 caracteres, sem acento. */
export interface Game {
  id: string
  title: string
  genre: string
  platform: string | null
  hours: number | null
  note: string | null
  icon: GameIcon
  cover: Cover
  coverText?: string
}

const pt = {
  about,
  albums: albums as Album[],
  awards: awards as Award[],
  games: games as Game[],
  education: education as Education[],
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
  education: educationEn as Education[],
  awards: awardsEn as Award[],
  albums: albumsEn as Album[],
  games: gamesEn as Game[],
}

const byLocale: Record<Locale, Content> = { pt, en }

export function getContent(locale: Locale): Content {
  return byLocale[locale]
}
