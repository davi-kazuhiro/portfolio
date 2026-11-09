import type { CSSProperties, FocusEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ResumeLink } from './contact'
import { RESUME_NOTE_ID } from './model'

/** Handlers de hover/foco que o botão repassa (a cena troca o frame; o modo texto não usa). */
export interface HotHandlers {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocus?: (e: FocusEvent<HTMLElement>) => void
  onBlur?: () => void
}

/**
 * Botão de currículo: com PDF, `<a download>`; sem PDF, `<button aria-disabled>` que não faz nada,
 * descrito pelo aviso "Currículo indisponível por enquanto". Fica na ordem de Tab nos dois casos.
 */
export function ResumeButton({
  resume,
  className,
  style,
  children,
  hot,
}: {
  resume: ResumeLink
  className: string
  style?: CSSProperties
  children: ReactNode
  hot?: HotHandlers
}) {
  const { t } = useTranslation()
  const label = t(resume.lang === 'pt' ? 'phone.aria.resumePt' : 'phone.aria.resumeEn')
  if (resume.href) {
    return (
      <a href={resume.href} download className={className} style={style} aria-label={label} {...hot}>
        {children}
      </a>
    )
  }
  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={label}
      aria-disabled="true"
      aria-describedby={RESUME_NOTE_ID}
      onClick={(e) => e.preventDefault()}
      onFocus={hot?.onFocus}
      onBlur={hot?.onBlur}
    >
      {children}
    </button>
  )
}
