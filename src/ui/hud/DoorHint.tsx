import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/store/useGameStore'
import { useAnchorPosition } from './useAnchorPosition'

// Dica "Entrar" ao lado da maçaneta enquanto ela está em hover/foco no canvas (`door-hover`).
// Só visual (aria-hidden): quem usa teclado/leitor de tela tem o botão "Entrar no quarto".
export function DoorHint() {
  const { t } = useTranslation()
  const anchor = useGameStore((s) => s.doorAnchor)
  const ref = useRef<HTMLDivElement>(null)
  const text = t('entrance.enter')
  const pos = useAnchorPosition(anchor, ref, text)

  if (!anchor) return null
  return (
    <div
      ref={ref}
      className="tooltip door-hint"
      aria-hidden="true"
      style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}
    >
      {text}
    </div>
  )
}
