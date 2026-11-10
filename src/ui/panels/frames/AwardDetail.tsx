import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { Award } from '@/content'
import { certificateHref } from './awards'

// Texto do certificado (título, emissor, data, descrição) e o link "Abrir PDF", usados na cena e
// no modo texto.

export function AwardDetail({ award, headingId }: { award: Award; headingId: string }) {
  const { t } = useTranslation()
  return (
    <div className="award">
      <h3 id={headingId} className="award__title">
        {award.title}
      </h3>
      <p className="award__issuer">
        <span className="visually-hidden">{t('frames.issuer')}: </span>
        {award.issuer}
      </p>
      <p className="award__date">
        <span className="visually-hidden">{t('frames.date')}: </span>
        <time dateTime={award.date}>{award.dateLabel}</time>
      </p>
      {award.description && <p className="award__desc">{award.description}</p>}
    </div>
  )
}

/** Link para o arquivo do certificado em nova aba; nada se o certificado não tem arquivo. */
export function PdfLink({
  award,
  className,
  style,
}: {
  award: Award
  className: string
  style?: CSSProperties
}) {
  const { t } = useTranslation()
  const href = certificateHref(award.file)
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noopener" className={className} style={style}>
      {t('frames.openPdf')}
      <span className="visually-hidden"> {t('frames.newTab')}</span>
    </a>
  )
}
