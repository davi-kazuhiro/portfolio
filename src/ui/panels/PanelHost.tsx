import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { useTranslation } from 'react-i18next'
import type { InteractableId } from '@/game/objects/registry'
import { useGameStore } from '@/store/useGameStore'
import { takeRememberedFocus } from '@/ui/a11y/focusReturn'
import { useFocusTrap } from '@/ui/a11y/useFocusTrap'
import { CLOSEUPS } from '@/ui/closeup/closeups'
import { closePanel } from './closePanel'
import type { PanelProps } from './types'

// Tudo que é visão de perto fica fora do JS inicial (folga no orçamento de 500 KB gzip): o
// componente `Closeup`, o painel genérico e os carregadores/parsers dos atlas (preload.ts).
const Closeup = lazy(() => import('@/ui/closeup/Closeup').then((m) => ({ default: m.Closeup })))
const GenericPanel = lazy(() => import('./GenericPanel').then((m) => ({ default: m.GenericPanel })))

// Painéis temáticos por id, carregados sob demanda. Ids fora do mapa usam o GenericPanel.
const PANELS: Partial<Record<InteractableId, LazyExoticComponent<ComponentType<PanelProps>>>> = {
  computer: lazy(() => import('./ComputerPanel').then((m) => ({ default: m.ComputerPanel }))),
  bookshelf: lazy(() => import('./BookshelfPanel').then((m) => ({ default: m.BookshelfPanel }))),
  journal: lazy(() => import('./JournalPanel').then((m) => ({ default: m.JournalPanel }))),
  phone: lazy(() => import('./PhonePanel').then((m) => ({ default: m.PhonePanel }))),
  frames: lazy(() => import('./FramesPanel').then((m) => ({ default: m.FramesPanel }))),
  headset: lazy(() => import('./HeadsetPanel').then((m) => ({ default: m.HeadsetPanel }))),
  controller: lazy(() => import('./ControllerPanel').then((m) => ({ default: m.ControllerPanel }))),
}

// Painéis que são a própria visão de perto (a ilustração inteira é interativa): o diálogo ocupa
// a tela e o painel desenha a cena (prateleira §4, caderno §5 de specs.md, celular specs/6, quadros specs/7,
// headset specs/8, controle specs/9).
const SCENE_PANELS: ReadonlySet<InteractableId> = new Set(['bookshelf', 'journal', 'phone', 'frames', 'headset', 'controller'])

const TITLE_ID = 'panel-title'

/** Botão do menu de teclado do HUD para o objeto `id` (`data-object-id`), se existir. */
const menuButtonFor = (id: InteractableId) =>
  document.querySelector<HTMLElement>(`.objects-menu [data-object-id="${CSS.escape(id)}"]`)

// Hospeda o painel do objeto aberto: diálogo modal, foco preso, Esc/clique fora fecham.
export function PanelHost() {
  const { t } = useTranslation()
  const openId = useGameStore((s) => s.openId)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  // O diálogo pode trocar de elemento (fallback do Suspense → visão de perto): o foco preso
  // acompanha o elemento atual.
  const [dialogEl, setDialogEl] = useState<HTMLDivElement | null>(null)
  const setDialogRef = useCallback((el: HTMLDivElement | null) => {
    dialogRef.current = el
    setDialogEl(el)
  }, [])

  useFocusTrap(dialogEl, openId !== null)

  // Pré-carrega as ilustrações das visões de perto (são pequenas) para o boot entrar na abertura.
  // Chunk à parte, pedido logo depois da montagem.
  useEffect(() => {
    void import('@/ui/closeup/preload').then((m) => m.preloadCloseups())
  }, [])

  // Guarda quem abriu e devolve o foco quando o diálogo desmonta.
  useEffect(() => {
    if (!openId) return
    const returnTo = takeRememberedFocus()
    const id = openId
    return () => {
      if (returnTo?.isConnected) {
        returnTo.focus()
        return
      }
      // Aberto por clique no canvas (nada focado): devolve ao item do menu do mesmo objeto, sem
      // anel de foco nem rolagem (o menu só aparece com :focus-visible).
      menuButtonFor(id)?.focus({ preventScroll: true, focusVisible: false } as FocusOptions)
    }
  }, [openId])

  // Esc fecha. Painéis com navegação interna (ex.: pasta aberta) chamam
  // preventDefault() no seu onKeyDown para tratar o Esc antes.
  useEffect(() => {
    if (!openId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openId])

  if (!openId) return null

  const Panel = PANELS[openId] ?? GenericPanel
  const dialogProps = {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': TITLE_ID,
    tabIndex: -1,
  } as const
  const loading = (
    <div className="panel" role="status">
      <h2 id={TITLE_ID}>{t(`objects.${openId}`)}</h2>
      <p>{t('panel.loading')}</p>
    </div>
  )
  const content = (
    <Suspense fallback={loading}>
      <Panel titleId={TITLE_ID} onClose={closePanel} />
    </Suspense>
  )

  // Visão de perto desenhada pelo próprio painel: diálogo em tela cheia.
  if (SCENE_PANELS.has(openId)) {
    return (
      <div ref={setDialogRef} className={`closeup closeup--scene closeup--${openId}`} {...dialogProps}>
        {content}
      </div>
    )
  }

  // Objetos com visão de perto: ilustração frontal + painel dentro da área de conteúdo.
  if (CLOSEUPS[openId]) {
    // Enquanto o chunk do `Closeup` chega, o mesmo diálogo (centralizado) mostra "Carregando...".
    return (
      <Suspense
        fallback={
          <div className="panel-backdrop">
            <div ref={setDialogRef} className={`panel-dialog panel-dialog--${openId}`} {...dialogProps}>
              {loading}
            </div>
          </div>
        }
      >
        <Closeup
          key={openId}
          id={openId}
          dialogRef={dialogRef}
          setDialogRef={setDialogRef}
          dialogProps={dialogProps}
          onOutsideClick={closePanel}
          onClose={closePanel}
        >
          {content}
        </Closeup>
      </Suspense>
    )
  }

  return (
    <div
      className="panel-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePanel()
      }}
    >
      <div ref={setDialogRef} className={`panel-dialog panel-dialog--${openId}`} {...dialogProps}>
        {content}
      </div>
    </div>
  )
}
