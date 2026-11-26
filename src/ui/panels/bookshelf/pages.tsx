import { useTranslation } from 'react-i18next'
import type { ShelfAtlas } from '@/ui/closeup/shelfAtlas'
import { Icon } from './Sprite'
import { languagePageOf, starFills, type Language, type PlannedLanguage, type SpokenLanguage, type Tool } from './skills'

// Conteúdo das páginas da prateleira. Usado na ilustração (dentro dos rects `content`) e no
// modo texto; os tamanhos estão em `em` e em `--px` (1 px da arte), então acompanham a escala.

// Estrela em pixel art (25×25 px de arte), transcrita da referência do Davi (2026-11-25).
// o = contorno, y = miolo, w = brilho, s = sombra. Cada cor vira um path de quadradinhos.
const STAR_ART = [
  '...........ooo...........',
  '...........oso...........',
  '..........oyyso..........',
  '..........owyso..........',
  '.........owwyyso.........',
  '.........owyyyso.........',
  '........owwyyyyso........',
  '......ooywyyyyysyoo......',
  '.ooooowwwwyyyyyssssooooo.',
  'oywwwwwwyyyyyyyssssssssso',
  'oyyyyyyyyyyyyyyysssssssso',
  '.oyyyyyyyyyyyyyyssssssso.',
  '..oyyyyyyyyyyyyysssssso..',
  '...oyyyyyyyyyyyyssssso...',
  '....owyyyyyyyyyyyssso....',
  '.....owyyyyyyyyyysso.....',
  '.....owwyyyyyyyyysso.....',
  '.....owyyyyyyyyyysso.....',
  '.....owyyyyyyyyyyyso.....',
  '.....owyyyyyyyyyyyso.....',
  '....owyyyyyyyyyyyysso....',
  '....owyyyyyoooyyyysso....',
  '....oyyyyoo...ooyysso....',
  '....oyyyo.......oyyso....',
  '....oooo.........oooo....',
]
const STAR_W = STAR_ART[0].length
const STAR_H = STAR_ART.length
const STAR_PARTS = { o: 'outline', y: 'fill', w: 'shine', s: 'shade' } as const
type StarPart = (typeof STAR_PARTS)[keyof typeof STAR_PARTS]

/** Um path por cor, cortado em `maxX` (meia estrela = metade da coluna do meio). */
function starLayers(maxX: number): { part: StarPart; d: string }[] {
  return Object.entries(STAR_PARTS).map(([ch, part]) => {
    let d = ''
    STAR_ART.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const cw = Math.min(1, maxX - x)
        if (cw > 0 && row[x] === ch) d += `M${x} ${y}h${cw}v1h-${cw}z`
      }
    })
    return { part, d }
  })
}
const WHOLE = starLayers(STAR_W)
const HALF = starLayers(STAR_W / 2)

/**
 * Nível em estrelas (0–5, meia estrela = metade esquerda pintada). Com `label`, vira imagem
 * acessível. `compact` = tamanho do sumário (sete linhas precisam caber na página).
 */
function Stars({ value, compact = false, label }: { value: number; compact?: boolean; label?: string }) {
  return (
    <span
      className={`shelf-stars${compact ? ' shelf-stars--compact' : ''}`}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {starFills(value).map((fill, i) => (
        <svg key={i} className="shelf-stars__star" viewBox={`0 0 ${STAR_W} ${STAR_H}`}>
          {WHOLE.map(({ part, d }) => (
            <path key={part} d={d} className={`shelf-stars__empty-${part}`} />
          ))}
          {fill > 0 && (fill < 1 ? HALF : WHOLE).map(({ part, d }) => <path key={part} d={d} className={`shelf-stars__full-${part}`} />)}
        </svg>
      ))}
    </span>
  )
}

/** Página 1 do livro Linguagens: todas, com nível e barra. Cada linha pula para a página. */
export function TocPage({ languages, onJump }: { languages: Language[]; onJump: (page: number) => void }) {
  const { t, i18n } = useTranslation()
  const fmt = (n: number) => n.toLocaleString(i18n.language)
  // Só nome e estrelas à vista; o nível vai no nome acessível (começa pelo nome visível, WCAG 2.5.3).
  return (
    <div className="book-page book-page--toc">
      <h3 className="book-page__title">{t('bookshelf.languages')}</h3>
      <p className="book-page__kicker book-page__kicker--red">{t('bookshelf.contents')}</p>
      <ul className="toc">
        {languages.map((lang, i) => (
          <li key={lang.id}>
            <button
              type="button"
              className="toc__row"
              aria-label={t('bookshelf.goToPage', { name: lang.name, n: fmt(lang.level), page: languagePageOf(i) + 1 })}
              onClick={() => onJump(languagePageOf(i))}
            >
              <span className="toc__name">{lang.name}</span>{' '}
              <Stars value={lang.level} compact />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LanguagePage({
  lang,
  usedIn,
  atlas,
  iconK,
}: {
  lang: Language
  usedIn: string[]
  atlas: ShelfAtlas | null
  iconK: number
}) {
  const { t, i18n } = useTranslation()
  return (
    <div className="book-page">
      <div className="book-page__head">
        <Icon atlas={atlas} name={lang.icon} k={iconK} />
        <h3 className="book-page__title">{lang.name}</h3>
      </div>
      <Stars value={lang.level} label={t('bookshelf.levelOf', { n: lang.level.toLocaleString(i18n.language) })} />
      <h4 className="book-page__kicker book-page__kicker--red">{t('bookshelf.whereUsed')}</h4>
      {usedIn.length > 0 ? (
        <ul className="book-page__list">
          {usedIn.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
      ) : (
        <p className="book-page__empty">({t('bookshelf.noProjects')})</p>
      )}
    </div>
  )
}

/** Página da esquerda do livro Idiomas: os que falo, cada um com o nível (e certificados/uso, se houver). */
export function SpokenPage({ langs, atlas, iconK }: { langs: SpokenLanguage[]; atlas: ShelfAtlas | null; iconK: number }) {
  const { t } = useTranslation()
  return (
    <div className="book-page">
      <div className="book-page__head">
        <Icon atlas={atlas} name="globe" k={iconK} />
        <h3 className="book-page__title">{t('bookshelf.spokenLanguages')}</h3>
      </div>
      <hr className="book-page__rule book-page__rule--blue" />
      <ul className="lang-list">
        {langs.map((lang) => {
          const certs = (lang.certificates ?? []).filter(Boolean)
          return (
            <li key={lang.id}>
              <strong className="lang-list__name" lang={lang.id}>
                {lang.name}
              </strong>
              <span className="book-page__meta">{lang.level}</span>
              {certs.length > 0 && <span className="book-page__meta">{`${t('bookshelf.certificates')}: ${certs.join(', ')}`}</span>}
              {lang.usage && <span className="book-page__meta">{`${t('bookshelf.usage')}: ${lang.usage}`}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Página da direita do livro Idiomas: os que pretendo estudar. */
export function PlannedPage({ langs, atlas, iconK }: { langs: PlannedLanguage[]; atlas: ShelfAtlas | null; iconK: number }) {
  const { t } = useTranslation()
  return (
    <div className="book-page">
      <div className="book-page__head">
        <Icon atlas={atlas} name="globe" k={iconK} />
        <h3 className="book-page__title">{t('bookshelf.plannedLanguages')}</h3>
      </div>
      <hr className="book-page__rule book-page__rule--blue" />
      <ul className="lang-list">
        {langs.map((lang) => (
          <li key={lang.id}>
            <strong className="lang-list__name" lang={lang.id}>
              {lang.name}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Lista do cartão "Ferramentas": ícone + nome + descrição (sem descrição, só ícone e nome). */
export function ToolsList({ tools, atlas, iconK }: { tools: Tool[]; atlas: ShelfAtlas | null; iconK: number }) {
  return (
    <ul className="tools-list">
      {tools.map((tool) => (
        <li key={tool.id} className="tools-list__row">
          <Icon atlas={atlas} name={tool.icon} k={iconK} />
          <span>
            <strong className="tools-list__name">{tool.name}</strong>
            {tool.description && <span className="tools-list__desc"> — {tool.description}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}
