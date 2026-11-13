import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EventBus } from '@/game/EventBus'
import { INTERACTABLES } from '@/game/objects/registry'
import { browserStorage, saveLanguage } from '@/store/persist'
import { useGameStore } from '@/store/useGameStore'
import { rememberFocus } from '@/ui/a11y/focusReturn'
import { nextPeriod, periodAt } from '@/ui/closeup/period'
import { DoorHint } from './DoorHint'
import { cancelPendingOnEscape, requestOpen } from './requestOpen'

const uiSfx = () => EventBus.emit('ui-sfx', 'toggle')

export function Hud() {
  const { t, i18n } = useTranslation()
  const hoveredId = useGameStore((s) => s.hoveredId)
  const openId = useGameStore((s) => s.openId)
  const muted = useGameStore((s) => s.muted)
  const setMuted = useGameStore((s) => s.setMuted)
  const sceneKey = useGameStore((s) => s.sceneKey)
  const atDoor = sceneKey === 'Entrance'
  const scenePeriod = useGameStore((s) => s.period)
  const choosePeriod = useGameStore((s) => s.choosePeriod)
  // Antes do quarto publicar o período, mostra o do relógio (a mesma regra da cena).
  const [clockPeriod] = useState(() => periodAt(new Date()))
  const period = scenePeriod ?? clockPeriod
  const next = nextPeriod(period)
  const changePeriod = () => {
    choosePeriod(next)
    EventBus.emit('period-request', next)
    uiSfx()
  }
  const changeLanguage = () => {
    const lng = i18n.language === 'pt' ? 'en' : 'pt'
    void i18n.changeLanguage(lng)
    saveLanguage(browserStorage(), lng)
    uiSfx()
  }
  // Ligando: liga primeiro para o clique já soar. Desligando: o clique soa antes de calar.
  const toggleSound = () => {
    const on = muted
    if (!on) uiSfx()
    setMuted(!on)
    EventBus.emit('audio-toggle', on)
    if (on) uiSfx()
  }

  // Anúncio curto ao chegar na porta. O texto entra depois da região existir, para ser lido.
  const [announcedAt, setAnnouncedAt] = useState<string | null>(null)
  useEffect(() => {
    if (!atDoor) return
    const id = setTimeout(() => setAnnouncedAt('Entrance'), 300)
    return () => clearTimeout(id)
  }, [atDoor])
  const announce = atDoor && announcedAt === 'Entrance' ? t('entrance.announce') : ''

  // Quem entrou pelo botão "Entrar no quarto" (que some no quarto) continua no menu de objetos,
  // em vez de o foco cair no <body>.
  const enteredByButton = useRef(false)
  useEffect(() => {
    if (atDoor || !enteredByButton.current) return
    enteredByButton.current = false
    const active = document.activeElement
    if (active && active !== document.body) return
    document.querySelector<HTMLElement>('.objects-menu button')?.focus()
  }, [atDoor])

  // Esc durante o zoom pedido pelo menu: a cena cancela o zoom e a UI cancela o fallback de
  // 1,5 s (senão o painel abriria sem zoom). Fase de captura: roda antes do Esc do PanelHost.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      cancelPendingOnEscape(e.key)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  return (
    <>
      {/* Na porta: primeiro item da ordem de Tab (aparece com foco, como um skip-link). */}
      {atDoor && (
        <button
          className="pixel-btn skip-link"
          onClick={() => {
            enteredByButton.current = true
            EventBus.emit('entrance-enter')
          }}
        >
          {t('entrance.enterRoom')}
        </button>
      )}
      <div className="visually-hidden" role="status" aria-live="polite">
        {announce}
      </div>
      {/* Gêmeo acessível do quarto: navegável por teclado e leitor de tela, primeiro na
          ordem de Tab. Usa o mesmo fluxo do clique (zoom da câmera → 'object-open'). */}
      <nav className="sr-only objects-menu" aria-label={t('hud.objectsMenu')}>
        <ul>
          {INTERACTABLES.map((item) => (
            <li key={item.id}>
              <button
                className="pixel-btn"
                data-object-id={item.id}
                onClick={(e) => {
                  rememberFocus(e.currentTarget)
                  requestOpen(item.id)
                }}
              >
                {t(item.labelKey)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="hud">
        <button className="pixel-btn" lang={i18n.language === 'pt' ? 'en' : 'pt'} onClick={changeLanguage}>
          {t('hud.language')}
        </button>
        {/* Também na porta: a Entrance escuta 'period-request' e troca a variante (dia/tarde/noite). */}
        <button
          className="pixel-btn"
          onClick={changePeriod}
          aria-label={t('hud.periodChange', { current: t(`hud.period.${period}`), next: t(`hud.period.${next}`) })}
        >
          {t(`hud.period.${period}`)}
        </button>
        <button className="pixel-btn" onClick={toggleSound} aria-label={muted ? t('hud.sound.offLabel') : t('hud.sound.onLabel')}>
          {muted ? t('hud.sound.off') : t('hud.sound.on')}
        </button>
      </div>
      {atDoor && <DoorHint />}
      {hoveredId && !openId && (
        <div className="tooltip" aria-hidden="true">
          {t(`objects.${hoveredId}`)}
        </div>
      )}
    </>
  )
}
