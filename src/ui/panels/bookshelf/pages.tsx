import { useTranslation } from 'react-i18next'
import type { ShelfAtlas } from '@/ui/closeup/shelfAtlas'
import { Icon } from './Sprite'
import { languagePageOf, type Language, type PlannedLanguage, type SpokenLanguage, type Tool } from './skills'

// Conteúdo das páginas da prateleira. Usado na ilustração (dentro dos rects `content`) e no
// modo texto; os tamanhos estão em `em` e em `--px` (1 px da arte), então acompanham a escala.

function Bar({ value, tone }: { value: number; tone: 'red' | 'blue' }) {
  const v = Math.min(Math.max(value, 0), 100)
  return (
    <span className={`shelf-bar shelf-bar--${tone}`} aria-hidden="true">
      <span className="shelf-bar__fill" style={{ width: `${v}%` }} />
    </span>
  )
}

/** Página 1 do livro Linguagens: todas, com nível e barra. Cada linha pula para a página. */
export function TocPage({ languages, onJump }: { languages: Language[]; onJump: (page: number) => void }) {
  const { t } = useTranslation()
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
              aria-label={t('bookshelf.goToPage', { name: lang.name, n: lang.level, page: languagePageOf(i) + 1 })}
              onClick={() => onJump(languagePageOf(i))}
            >
              {/* Espaços entre os spans (ignorados pelo grid): o texto visível vira "Java 90", que
                  é o começo do aria-label (WCAG 2.5.3, nome acessível contém o texto visível). */}
              <span className="toc__name">{lang.name}</span>{' '}
              <Bar value={lang.level} tone="red" />{' '}
              <span className="toc__num">{lang.level}</span>
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
  const { t } = useTranslation()
  return (
    <div className="book-page">
      <div className="book-page__head">
        <Icon atlas={atlas} name={lang.icon} k={iconK} />
        <div>
          <h3 className="book-page__title">{lang.name}</h3>
          <p className="book-page__meta">{t('bookshelf.levelOf', { n: lang.level })}</p>
        </div>
      </div>
      <Bar value={lang.level} tone="red" />
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
