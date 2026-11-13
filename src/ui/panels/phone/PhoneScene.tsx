import { useEffect, useRef, useState, type CSSProperties, type FocusEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { CloseupLayout } from '@/ui/closeup/layout'
import { composePhone, PHONE_SPEC, type PhoneAppId, type PhoneAtlas, type ResumeLang } from '@/ui/closeup/phoneAtlas'
import { CuedSprite } from '@/ui/closeup/CueRing'
import { frameBackground, place } from '@/ui/closeup/spriteStyle'
import { sceneFontSize } from '../bookshelf/skills'
import { externalProps, resumeNote } from './contact'
import type { PhoneModel } from './model'
import { RESUME_NOTE_ID } from './model'
import { ResumeButton, type HotHandlers } from './ResumeButton'

type CssVars = CSSProperties & Record<`--${string}`, string>
type Hot = PhoneAppId | `cv:${ResumeLang}`

/** Foco vindo do teclado (não de clique): só ele acende o anel de hover. */
const isFocusVisible = (el: Element) => {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

// Ilustração do celular em escala inteira cobrindo a janela (regra cover): camadas do atlas na
// ordem da spec, e o DOM (nome, cargos, cidade, rótulos, botões) nos slots da tela.
export function PhoneScene({ model, atlas, layout }: { model: PhoneModel; atlas: PhoneAtlas; layout: CloseupLayout }) {
  const { t } = useTranslation()
  const [hover, setHover] = useState<Hot | null>(null)
  const [focus, setFocus] = useState<Hot | null>(null)
  const firstRef = useRef<HTMLAnchorElement>(null)

  const s = layout.scale
  const origin = { x: layout.crop.x, y: layout.crop.y }
  const { profile, links, resumes } = model
  const available = { pt: false, en: false }
  for (const r of resumes) available[r.lang] = r.href !== null
  const note = resumeNote(resumes)

  const layers = composePhone(atlas, { night: model.night, dusk: model.dusk, hot: hover ?? focus, resume: available })

  // Foco inicial no primeiro botão (e-mail): Tab segue LinkedIn, GitHub, PT, EN, Fechar.
  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  const hotHandlers = (id: Hot, canHover = true): HotHandlers => ({
    onMouseEnter: canHover ? () => setHover(id) : undefined,
    onMouseLeave: canHover ? () => setHover((h) => (h === id ? null : h)) : undefined,
    onFocus: (e: FocusEvent<HTMLElement>) => {
      if (isFocusVisible(e.currentTarget)) setFocus(id)
    },
    onBlur: () => setFocus((f) => (f === id ? null : f)),
  })

  const { slots, textInk } = atlas
  const lineH = slots.roleLineHeight * s
  const viewStyle: CssVars = {
    ...place(layout.crop, s, origin),
    left: layout.view.x,
    top: layout.view.y,
    fontSize: sceneFontSize(s),
    '--px': `${s}px`,
    '--ink-name': textInk.name,
    '--ink-body': textInk.body,
    '--ink-label': textInk.label,
    '--ink-cv-label': textInk.cvLabel,
    '--ink-cv': textInk.cv,
    '--ink-cv-disabled': textInk.cvDisabled,
  }
  const slot = (r: PhoneAtlas['content']): CSSProperties => ({ ...place(r, s, origin), lineHeight: `${r.h * s}px` })
  const pin = atlas.frames[atlas.icons.pin.frame]
  const roles = profile.roles.slice(0, slots.roleLines)
  const labelOf = (app: PhoneAppId) => atlas.apps.ids.indexOf(app)

  return (
    <div className="phone">
      <h2 id={model.titleId} className="visually-hidden">
        {t('phone.title')}
      </h2>
      <button type="button" className="pixel-btn shelf__close" onClick={model.onClose}>
        {t('hud.close')}
      </button>
      <div className="phone__view" style={viewStyle}>
        {layers.map((l) => (
          <CuedSprite key={l.key} atlas={atlas} frame={l.frame} dx={l.dx} s={s} crop={layout.crop} bleed={layout.bleed} cue={l.cue} hot={l.hot} cueEdge={l.cueEdge} />
        ))}

        <span role="img" className="phone__avatar" aria-label={t('phone.avatarAlt')} style={place(atlas.avatar.rect, s, origin)} />
        <p className="phone__name" style={slot(slots.name)}>
          {profile.name}
        </p>
        <ul className="phone__roles" style={{ ...place(slots.roles, s, origin), lineHeight: `${lineH}px` }}>
          {roles.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="phone__city" style={slot(slots.city)}>
          {pin && <span className="phone__pin" aria-hidden="true" style={frameBackground(atlas, pin, s)} />}
          <span>{profile.city}</span>
        </p>

        <ul className="phone__apps" aria-label={t('phone.title')}>
          {links.map((link, i) => {
            const art = atlas.apps.items[link.app]
            if (!art) return null
            const n = labelOf(link.app)
            const label = slots.labels[n]
            return (
              <li key={link.app}>
                <a
                  ref={i === 0 ? firstRef : undefined}
                  href={link.href}
                  className="phone__hit"
                  style={place(art.rect, s, origin)}
                  aria-label={t(`phone.aria.${link.service}`)}
                  {...(link.external ? externalProps : {})}
                  {...hotHandlers(link.app)}
                />
                {label && (
                  <span className="phone__label" aria-hidden="true" style={slot(label)}>
                    {t(`phone.${link.service}`)}
                  </span>
                )}
              </li>
            )
          })}
        </ul>

        <p id="phone-cv-label" className="phone__cv-label" style={slot(slots.cvLabel)}>
          {t('phone.resume')}
        </p>
        <ul className="phone__cvs" aria-labelledby="phone-cv-label">
          {resumes.map((r) => {
            const art = atlas.cv.items[r.lang]
            const disabled = r.href === null
            return (
              <li key={r.lang}>
                <ResumeButton
                  resume={r}
                  className={`phone__hit phone__cv${disabled ? ' phone__cv--disabled' : ''}`}
                  style={place(art.rect, s, origin)}
                  hot={hotHandlers(`cv:${r.lang}`, !disabled || atlas.cv.disabledHasHover)}
                >
                  <span className="phone__cv-text" aria-hidden="true" style={{ ...place(atlas.cv.textRect, s), lineHeight: `${atlas.cv.textRect.h * s}px` }}>
                    {t(r.lang === 'pt' ? 'phone.resumePt' : 'phone.resumeEn')}
                  </span>
                </ResumeButton>
              </li>
            )
          })}
        </ul>
        {note && (
          <p className="phone__note" aria-hidden="true" style={slot(PHONE_SPEC.note)}>
            {t(note.key, { langs: note.langs })}
          </p>
        )}
        <span id={RESUME_NOTE_ID} className="visually-hidden">
          {t('phone.aria.resumeUnavailable')}
        </span>
      </div>
    </div>
  )
}
