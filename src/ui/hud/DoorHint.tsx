import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/store/useGameStore'
import { hintPosition } from './hintPosition'

// Dica "Entrar" ao lado da maçaneta enquanto ela está em hover/foco no canvas (`door-hover`).
// Só visual (aria-hidden): quem usa teclado/leitor de tela tem o botão "Entrar no quarto".
export function DoorHint() {
  const { t } = useTranslation()
  const anchor = useGameStore((s) => s.doorAnchor)
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    const container = el?.offsetParent
    const canvas = document.querySelector('.game-canvas canvas') ?? document.querySelector('.game-canvas')
    if (!anchor || !container || !canvas) {
      setPos(null)
      return
    }
    const c = container.getBoundingClientRect()
    const k = canvas.getBoundingClientRect()
    setPos(hintPosition(anchor, k, { left: c.left, top: c.top, width: c.width, height: c.height }))
  }, [anchor])

  if (!anchor) return null
  return (
    <div
      ref={ref}
      className="tooltip door-hint"
      aria-hidden="true"
      style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}
    >
      {t('entrance.enter')}
    </div>
  )
}
