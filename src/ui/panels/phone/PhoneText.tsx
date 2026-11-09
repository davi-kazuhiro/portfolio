import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { frameBackground } from '@/ui/closeup/spriteStyle'
import { externalProps, resumeNote } from './contact'
import type { PhoneModel } from './model'
import { RESUME_NOTE_ID } from './model'
import { ResumeButton } from './ResumeButton'

/** Escala dos sprites no modo texto (avatar 24 → 48 px, botões 22 → 44 px, alfinete 7 → 14 px). */
const K = 2

// Modo texto (sem ilustração): telas onde o aparelho a 3× não cabe. Papel em tela cheia com as
// mesmas informações; ordem de Tab = Fechar → e-mail → LinkedIn → GitHub → PT → EN.
export function PhoneText({ model }: { model: PhoneModel }) {
  const { t } = useTranslation()
  const { atlas, profile, links, resumes } = model
  const note = resumeNote(resumes)
  const frame = (name: string | undefined) => (atlas && name ? atlas.frames[name] : undefined)
  const avatar = frame(atlas?.avatar.frame)
  const pin = frame(atlas?.icons.pin.frame)
  const firstRef = useRef<HTMLAnchorElement>(null)

  // Ao trocar da cena para o modo texto (resize), o botão focado some: o foco vai para o e-mail.
  useEffect(() => {
    const a = document.activeElement
    if (!a || a === document.body) firstRef.current?.focus()
  }, [])

  return (
    <div className="shelf-text phone-text" style={atlas ? { background: atlas.panelBackground } : undefined}>
      <header className="shelf-text__header">
        <h2 id={model.titleId}>{t('phone.title')}</h2>
        <button type="button" className="pixel-btn" onClick={model.onClose}>
          {t('hud.close')}
        </button>
      </header>
      <div className="shelf-text__body phone-text__body">
        <div className="phone-text__card">
          {atlas && avatar && <span role="img" aria-label={t('phone.avatarAlt')} className="phone-text__sprite" style={frameBackground(atlas, avatar, K)} />}
          <p className="phone-text__name">{profile.name}</p>
          <ul className="phone-text__roles">
            {profile.roles.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="phone-text__city">
            {atlas && pin && <span className="phone-text__sprite" aria-hidden="true" style={frameBackground(atlas, pin, K)} />}
            {profile.city}
          </p>
        </div>

        <ul className="phone-text__links" aria-label={t('phone.title')}>
          {links.map((link, i) => {
            const art = frame(atlas?.apps.items[link.app]?.frame)
            return (
              <li key={link.app}>
                <a ref={i === 0 ? firstRef : undefined} href={link.href} className="phone-text__link" aria-label={t(`phone.aria.${link.service}`)} {...(link.external ? externalProps : {})}>
                  {atlas && art && <span className="phone-text__sprite" aria-hidden="true" style={frameBackground(atlas, art, K)} />}
                  <span>{t(`phone.${link.service}`)}</span>
                </a>
              </li>
            )
          })}
        </ul>

        <section className="phone-text__resume" aria-labelledby="phone-cv-label">
          <h3 id="phone-cv-label">{t('phone.resume')}</h3>
          <ul className="phone-text__cvs">
            {resumes.map((r) => (
              <li key={r.lang}>
                <ResumeButton resume={r} className={`pixel-btn phone-text__cv${r.href ? '' : ' phone-text__cv--disabled'}`}>
                  {t(r.lang === 'pt' ? 'phone.resumePt' : 'phone.resumeEn')}
                </ResumeButton>
              </li>
            ))}
          </ul>
          {note && <p aria-hidden="true">{t(note.key, { langs: note.langs })}</p>}
          <span id={RESUME_NOTE_ID} className="visually-hidden">
            {t('phone.aria.resumeUnavailable')}
          </span>
        </section>
      </div>
    </div>
  )
}
