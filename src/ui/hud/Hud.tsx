import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { EventBus } from '@/game/EventBus'
import { MENU_OBJECTS } from '@/game/objects/registry'
import { browserStorage, saveLanguage } from '@/store/persist'
import { useGameStore } from '@/store/useGameStore'
import { isKeyboardFocus, rememberFocus } from '@/ui/a11y/focusReturn'
import { nextPeriod, periodAt } from '@/ui/closeup/period'
import { IconButton } from './PixelIcon'
import { DoorHint } from './DoorHint'
import { highlightFromMenu } from './focusHighlight'
import { useHudSlot } from './hudSlotStore'
import { ObjectTooltip } from './ObjectTooltip'
import { Tutorial } from '@/ui/tutorial/Tutorial'
import { RoomFallback } from './RoomFallback'
import { cancelPendingOnEscape, requestOpen } from './requestOpen'

const uiSfx = () => EventBus.emit('ui-sfx', 'toggle')

export function Hud() {
  const { t, i18n } = useTranslation()
  const muted = useGameStore((s) => s.muted)
  const setMuted = useGameStore((s) => s.setMuted)
  const sceneKey = useGameStore((s) => s.sceneKey)
  const atDoor = sceneKey === 'Entrance'
  const openId = useGameStore((s) => s.openId)
  // Passo do tutorial apontando um botão do HUD (A4): o botão ganha o destaque amarelo.
  const tutorialFocus = useGameStore((s) => s.tutorialFocus)
  // Passo das setas do tutorial: no celular os botões somem (CSS `.hud-tutorial-hide`).
  const hideForArrows = useGameStore((s) => s.tutorialArrows)
  // Sem WebGL (M6): sem cena, sem porta; imagem estática + menu de objetos visível.
  const noRenderer = useGameStore((s) => s.rendererUnavailable)
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

  // Botão visível que abre o menu de objetos (A1). Fechado, o menu continua `sr-only` e aparece
  // só com foco de teclado; aberto, vira um painel abaixo do botão. Fecha ao escolher um objeto,
  // com Esc (foco volta ao botão) ou com clique/toque fora.
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      toggleRef.current?.focus()
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (toggleRef.current?.contains(target) || navRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [menuOpen])
  const toggleMenu = () => {
    setMenuOpen((open) => !open)
    uiSfx()
  }

  // Com um diálogo aberto o HUD vai para dentro dele (o resto do fundo fica `inert`; ver hudSlotStore.ts).
  const slot = useHudSlot()
  const toolbar = (
    <div className={slot ? 'hud hud--dialog' : hideForArrows ? 'hud hud-tutorial-hide' : 'hud'}>
      {/* Reabre o tutorial (A4). Não aparece dentro dos painéis nem sem renderer. */}
      {!slot && !noRenderer && (
        <button
          type="button"
          className={tutorialFocus === 'help' ? 'pixel-btn hud__help tutorial-target' : 'pixel-btn hud__help'}
          aria-label={t('tutorial.open')}
          title={t('tutorial.open')}
          onClick={() => {
            uiSfx()
            useGameStore.getState().openTutorial()
          }}
        >
          ?
        </button>
      )}
      <button className="pixel-btn" lang={i18n.language === 'pt' ? 'en' : 'pt'} onClick={changeLanguage}>
        {t('hud.language')}
      </button>
      {/* Também na porta: a Entrance escuta 'period-request' e troca a variante (dia/tarde/noite).
          Sem renderer (M6) período e som não têm o que mudar: só o idioma fica. */}
      {!noRenderer && (
        <>
          <IconButton
            icon={period}
            onClick={changePeriod}
            label={t('hud.periodChange', { current: t(`hud.period.${period}`), next: t(`hud.period.${next}`) })}
            tip={t('hud.periodTip')}
          />
          <IconButton
            icon={muted ? 'soundOff' : 'soundOn'}
            onClick={toggleSound}
            label={muted ? t('hud.sound.offLabel') : t('hud.sound.onLabel')}
            tip={muted ? t('hud.sound.tipOff') : t('hud.sound.tipOn')}
            tipAlign="right"
          />
        </>
      )}
    </div>
  )

  const menu = (
    <>
      {/* Gêmeo acessível do quarto: navegável por teclado e leitor de tela, primeiro na
          ordem de Tab. Usa o mesmo fluxo do clique (zoom da câmera → 'object-open'). */}
      {/* Some com um painel aberto (a visão de perto ocupa o canto), mas fica montado: o foco
          volta para ele quando o painel fecha. */}
      {!noRenderer && (
        <button
          ref={toggleRef}
          className={[
            'pixel-btn objects-menu-toggle',
            openId ? 'objects-menu-toggle--hidden' : '',
            tutorialFocus === 'menu' ? 'tutorial-target' : '',
            hideForArrows ? 'hud-tutorial-hide' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-expanded={menuOpen}
          aria-controls="objects-menu"
          aria-label={t('hud.objectsMenuButton')}
          title={t('hud.objectsMenuButton')}
          onClick={toggleMenu}
        >
          {/* Ícone hambúrguer: três barras de pixel em CSS (a fonte pixel não tem ☰). */}
          <span className="hamburger" aria-hidden="true" />
        </button>
      )}
      <nav
        ref={navRef}
        id="objects-menu"
        className={
          noRenderer
            ? 'objects-menu objects-menu--fallback'
            : menuOpen
              ? 'objects-menu objects-menu--open'
              : 'sr-only objects-menu'
        }
        aria-label={t('hud.objectsMenu')}
      >
        {noRenderer && <p className="objects-menu__notice">{t('fallback.notice')}</p>}
        <ul>
          {MENU_OBJECTS.map((item) => (
            <li key={item.id}>
              <button
                className="pixel-btn"
                data-object-id={item.id}
                // Foco de teclado num item destaca o objeto no quarto (o mesmo do hover).
                onFocus={(e) => {
                  if (isKeyboardFocus(e.currentTarget)) highlightFromMenu(item.id)
                }}
                onBlur={() => highlightFromMenu(null)}
                onClick={(e) => {
                  // Aberto pelo botão "Objetos": o foco volta a ele ao fechar o painel.
                  rememberFocus(menuOpen && toggleRef.current ? toggleRef.current : e.currentTarget)
                  setMenuOpen(false)
                  requestOpen(item.id)
                }}
              >
                {t(item.labelKey)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )

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
      {noRenderer ? <RoomFallback>{menu}</RoomFallback> : menu}
      {slot ? createPortal(toolbar, slot) : toolbar}
      {atDoor && <DoorHint />}
      <ObjectTooltip />
      <Tutorial />
    </>
  )
}
