import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { browserStorage, readTutorialSeen, saveTutorialSeen } from '@/store/persist'
import { useGameStore } from '@/store/useGameStore'
import { useReducedMotion } from '@/ui/closeup/hooks'
import { EventBus } from '@/game/EventBus'
import { roomLift, TYPE_MS, tutorialSteps, typedLength } from './steps'
import { TutorialArrows } from './TutorialArrows'

// Espera depois de o quarto aparecer, para a primeira visita ver o quarto antes do diálogo.
const AUTO_OPEN_MS = 700

const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/**
 * Tutorial em diálogo de videogame (A4): caixa no rodapé com o nome de quem fala, texto letra a
 * letra e botões Pular / Próximo. Abre sozinho na primeira visita ao quarto e sempre pelo botão
 * "?" do HUD. O passo dos objetos mostra setas amarelas sobre os interagíveis; os passos do menu e
 * do HUD destacam o botão citado. Fica escondido com um painel aberto.
 */
export function Tutorial() {
  const open = useGameStore((s) => s.tutorialOpen)
  const openId = useGameStore((s) => s.openId)
  const sceneKey = useGameStore((s) => s.sceneKey)
  const noRenderer = useGameStore((s) => s.rendererUnavailable)

  // Primeira visita: abre sozinho quando o quarto aparece.
  const autoTried = useRef(false)
  useEffect(() => {
    if (autoTried.current || sceneKey !== 'Room' || noRenderer) return
    autoTried.current = true
    if (readTutorialSeen(browserStorage())) return
    const id = window.setTimeout(() => {
      if (!useGameStore.getState().openId) useGameStore.getState().openTutorial()
    }, AUTO_OPEN_MS)
    return () => clearTimeout(id)
  }, [sceneKey, noRenderer])

  if (!open || openId) return null
  return <TutorialDialog />
}

function TutorialDialog() {
  const { t } = useTranslation()
  const reduced = useReducedMotion()
  const steps = useMemo(() => tutorialSteps(isTouch()), [])
  const [index, setIndex] = useState(0)
  const step = steps[index]
  const last = index === steps.length - 1
  const text = t(`tutorial.steps.${step.key}`)

  // Texto letra a letra; reduced motion mostra tudo de uma vez.
  // O progresso vale só para o texto em que foi medido: texto novo (passo/idioma) começa do zero.
  const [typed, setTyped] = useState({ text: '', n: 0 })
  useEffect(() => {
    if (reduced) return
    const start = performance.now()
    const timer = window.setInterval(() => {
      const n = typedLength(text, performance.now() - start, TYPE_MS)
      setTyped((prev) => (prev.text === text && prev.n >= n ? prev : { text, n }))
      if (n >= text.length) clearInterval(timer)
    }, TYPE_MS)
    return () => clearInterval(timer)
  }, [text, reduced])
  const shown = reduced ? text.length : typed.text === text ? typed.n : 0
  const setShown = (n: number) => setTyped({ text, n })
  const typing = shown < text.length

  const setFocus = useGameStore((s) => s.setTutorialFocus)
  useEffect(() => {
    setFocus(step.focus ?? null)
  }, [step, setFocus])

  const close = () => {
    saveTutorialSeen(browserStorage())
    const wasInside = !!document.activeElement?.closest('.tutorial')
    useGameStore.getState().closeTutorial()
    // Foco volta ao botão "?" (quem reabre o tutorial), se estava no diálogo.
    if (wasInside) document.querySelector<HTMLElement>('.hud__help')?.focus()
  }
  const next = () => {
    if (typing) {
      setShown(text.length)
      return
    }
    if (last) close()
    else setIndex((i) => i + 1)
  }

  // Celular: sobe o quarto para o diálogo não cobrir os objetos (A6). Recalcula a cada passo
  // (a altura da caixa muda com o texto) e no resize/rotação; ao fechar, o quarto desce de volta.
  const boxRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const update = () => {
      const box = boxRef.current?.getBoundingClientRect()
      const canvas = document.querySelector('.game-canvas')?.getBoundingClientRect()
      if (!box || !canvas) return
      EventBus.emit('room-lift', roomLift(window.innerWidth, canvas.top, canvas.height, box.top))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [index])
  useEffect(() => () => EventBus.emit('room-lift', 0), [])

  // Foco no "Próximo" ao abrir (teclado: Enter avança). Esc fecha.
  const nextRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true })
  }, [])
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {step.arrows && <TutorialArrows />}
      <section ref={boxRef} className="tutorial" role="dialog" aria-modal="false" aria-labelledby="tutorial-speaker">
        <p className="tutorial__speaker" id="tutorial-speaker">
          <span className="visually-hidden">{t('tutorial.label')}: </span>
          {t('tutorial.speaker')}
        </p>
        {/* Clique na caixa: completa o texto ou avança, como num jogo. O resto do texto ocupa
            espaço invisível para a caixa não mudar de altura enquanto digita. */}
        <p className="tutorial__text" aria-hidden="true" onClick={next}>
          {text.slice(0, shown)}
          <span className="tutorial__rest">{text.slice(shown)}</span>
        </p>
        <p className="visually-hidden" aria-live="polite">
          {text}
        </p>
        <div className="tutorial__actions">
          <button type="button" className="pixel-btn tutorial__skip" onClick={close}>
            {t('tutorial.skip')}
          </button>
          <span className="tutorial__count">
            <span className="visually-hidden">{t('tutorial.stepLabel')} </span>
            {index + 1}/{steps.length}
          </span>
          <button ref={nextRef} type="button" className="pixel-btn tutorial__next" onClick={next}>
            {last ? t('tutorial.finish') : t('tutorial.next')}
          </button>
        </div>
      </section>
    </>
  )
}
