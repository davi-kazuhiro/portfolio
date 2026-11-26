import { useTranslation } from 'react-i18next'
import type { ShelfAtlas } from '@/ui/closeup/shelfAtlas'
import { Icon } from './Sprite'
import { languagePageOf, starFills, type Language, type PlannedLanguage, type SpokenLanguage, type Tool } from './skills'

// Conteúdo das páginas da prateleira. Usado na ilustração (dentro dos rects `content`) e no
// modo texto; os tamanhos estão em `em` e em `--px` (1 px da arte), então acompanham a escala.

// Estrelas em pixel art: contorno escuro, miolo e brilho no canto de cima à esquerda, como os
// ícones da estante. Duas formas: 9×9 px de arte na página da linguagem e 7×7 no sumário (onde
// sete linhas precisam caber na página). Cada camada é um path de quadradinhos.
const STAR_SHAPES = {
  md: ['....#....', '...###...', '#########', '.#######.', '..#####..', '..#####..', '.###.###.', '.##...##.', '##.....##'],
  sm: ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'],
}
type StarSize = keyof typeof STAR_SHAPES
type StarPart = 'outline' | 'fill' | 'shine'
const PARTS: StarPart[] = ['outline', 'fill', 'shine']

function buildStar(shape: string[]) {
  const w = shape[0].length
  const inStar = (x: number, y: number) => shape[y]?.[x] === '#'
  const isInner = (x: number, y: number) => inStar(x, y) && inStar(x - 1, y) && inStar(x + 1, y) && inStar(x, y - 1) && inStar(x, y + 1)
  const partAt = (x: number, y: number): StarPart | null => {
    if (!inStar(x, y)) return null
    if (!isInner(x, y)) return 'outline'
    return x < w / 2 && y < shape.length / 2 && (!isInner(x - 1, y) || !isInner(x, y - 1)) ? 'shine' : 'fill'
  }
  /** Path da camada, cortado em `maxX` (meia estrela = metade da coluna do meio). */
  const layers = (maxX: number) =>
    PARTS.map((part) => {
      let d = ''
      shape.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const cw = Math.min(1, maxX - x)
          if (cw > 0 && partAt(x, y) === part) d += `M${x} ${y}h${cw}v1h-${cw}z`
        }
      })
      return { part, d }
    })
  return { w, h: shape.length, whole: layers(w), half: layers(w / 2) }
}
const STARS = { md: buildStar(STAR_SHAPES.md), sm: buildStar(STAR_SHAPES.sm) }

/** Nível em estrelas (0–5, meia estrela = metade esquerda pintada). Com `label`, vira imagem acessível. */
function Stars({ value, size = 'md', label }: { value: number; size?: StarSize; label?: string }) {
  const star = STARS[size]
  return (
    <span className="shelf-stars" {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>
      {starFills(value).map((fill, i) => (
        <svg
          key={i}
          className="shelf-stars__star"
          style={{ width: `calc(var(--px, 2px) * ${star.w})`, height: `calc(var(--px, 2px) * ${star.h})` }}
          viewBox={`0 0 ${star.w} ${star.h}`}
          shapeRendering="crispEdges"
        >
          {star.whole.map(({ part, d }) => (
            <path key={part} d={d} className={`shelf-stars__empty-${part}`} />
          ))}
          {fill > 0 && (fill < 1 ? star.half : star.whole).map(({ part, d }) => <path key={part} d={d} className={`shelf-stars__full-${part}`} />)}
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
              <Stars value={lang.level} size="sm" />
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
