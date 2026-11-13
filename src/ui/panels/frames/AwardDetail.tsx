import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { Award } from '@/content'
import type { FramesAtlas } from '@/ui/closeup/framesAtlas'
import { place } from '@/ui/closeup/spriteStyle'
import { certificateHref } from './awards'

// Texto do certificado (título, emissor, data, descrição) e o link "Abrir PDF": `CertificateText`
// na cena (cada parte no seu rect do papel), `AwardDetail` no modo texto.

/**
 * Texto do certificado aberto na cena, posicionado nos rects de `atlas.text` (relativos a `origin`):
 * "CERTIFICADO" na fita, título e descrição centrados, emissor e data sobre as linhas de assinatura.
 */
export function CertificateText({
  award,
  headingId,
  atlas,
  s,
  origin,
}: {
  award: Award
  headingId: string
  atlas: FramesAtlas
  s: number
  origin: { x: number; y: number }
}) {
  const { t } = useTranslation()
  const r = atlas.text
  return (
    <>
      <p className="cert__kicker" aria-hidden="true" style={place(r.kicker, s, origin)}>
        {t('frames.kicker')}
      </p>
      <h3 id={headingId} className="cert__title" style={place(r.title, s, origin)}>
        <span>{award.title}</span>
      </h3>
      {award.description && (
        <p className="cert__desc" style={place(r.desc, s, origin)}>
          <span>{award.description}</span>
        </p>
      )}
      <p className="cert__field" style={place(r.issuer, s, origin)}>
        <span className="visually-hidden">{t('frames.issuer')}: </span>
        {award.issuer}
      </p>
      <p className="cert__field" style={place(r.date, s, origin)}>
        <span className="visually-hidden">{t('frames.date')}: </span>
        <time dateTime={award.date}>{award.dateLabel}</time>
      </p>
    </>
  )
}

export function AwardDetail({ award, headingId }: { award: Award; headingId: string }) {
  const { t } = useTranslation()
  return (
    <div className="award">
      <p className="award__kicker" aria-hidden="true">
        {t('frames.kicker')}
      </p>
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
