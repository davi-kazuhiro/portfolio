import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { Experience } from '@/content'
import type { JournalAtlas } from '@/ui/closeup/journalAtlas'
import { frameBackground } from '@/ui/closeup/spriteStyle'
import { locationLine } from './experience'

// Conteúdo das páginas do caderno, usado na ilustração (dentro de `content.left/right`, com
// line-height = 1 linha da pauta) e no modo texto. Tamanhos em `em` e nas variáveis `--line`
// (altura de uma linha) e `--px` (1 px da arte), definidas por quem usa.

/** Frame pequeno do atlas (ícone 7×7, caixinha 9×8) em escala `k`; sem atlas, um quadradinho. */
function AtlasGlyph({ atlas, frame, k, w, h, className, style }: {
  atlas: JournalAtlas | null
  frame: string | undefined
  k: number
  w: number
  h: number
  className: string
  style?: CSSProperties
}) {
  const f = frame ? atlas?.frames[frame] : undefined
  if (!atlas || !f) {
    return <span className={`${className} journal-glyph--missing`} aria-hidden="true" style={{ width: w * k, height: h * k, ...style }} />
  }
  return <span className={className} aria-hidden="true" style={{ ...frameBackground(atlas, f, k), ...style }} />
}

/** Página esquerda: tipo (+ "Atual"), título, local e período. */
export function ExperienceHead({
  exp,
  current,
  atlas,
  k,
  headingId,
}: {
  exp: Experience
  current: boolean
  atlas: JournalAtlas | null
  /** Escala dos ícones (px CSS por px de arte). */
  k: number
  headingId?: string
}) {
  const { t } = useTranslation()
  const icons = atlas?.icons
  return (
    <div className="journal-head">
      <p className="journal-head__kicker">
        <span>{t(`journal.type.${exp.type}`)}</span>
        {current && <span className="journal-head__current">{t('journal.current')}</span>}
      </p>
      <h3 id={headingId} className="journal-head__title">
        {exp.title}
      </h3>
      <p className="journal-head__meta journal-head__meta--gap">
        <AtlasGlyph atlas={atlas} frame={icons?.pin[exp.type]} k={k} w={7} h={7} className="journal-head__icon" />
        <span>{locationLine(exp)}</span>
      </p>
      <p className="journal-head__meta">
        <AtlasGlyph atlas={atlas} frame={icons?.calendar[exp.type]} k={k} w={7} h={7} className="journal-head__icon" />
        <span>{exp.period}</span>
      </p>
    </div>
  )
}

/** Página direita: itens em checklist (todos marcados por padrão, specs.md §5). */
export function Checklist({ exp, atlas, k, labelId }: { exp: Experience; atlas: JournalAtlas | null; k: number; labelId?: string }) {
  const { t } = useTranslation()
  const c = atlas?.checklist
  const done = c?.defaultDone ?? true
  const frame = done ? c?.done[exp.type] : c?.empty
  return (
    <>
      <h4 id={labelId} className="journal-list__label visually-hidden">
        {t('journal.checklistLabel')}
      </h4>
      <ul className="journal-list" aria-labelledby={labelId}>
        {exp.items.map((item, i) => (
          <li key={i} className="journal-list__item">
            <AtlasGlyph atlas={atlas} frame={frame} k={k} w={9} h={8} className="journal-list__check" />
            {item}
          </li>
        ))}
      </ul>
    </>
  )
}
