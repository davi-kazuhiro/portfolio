import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/store/useGameStore'
import { tooltipTarget } from './tooltipTarget'
import { useAnchorPosition } from './useAnchorPosition'

// Dica com o nome do objeto: hover no quarto (`object-hover`) ou foco de teclado no menu de
// objetos. Com âncora (2º argumento de `object-hover`), fica ao lado do objeto; sem ela, no rodapé.
// Só visual (aria-hidden): o nome acessível já está no item do menu.
export function ObjectTooltip() {
  const { t } = useTranslation()
  const hoveredId = useGameStore((s) => s.hoveredId)
  const hoverAnchor = useGameStore((s) => s.hoverAnchor)
  const menuFocusId = useGameStore((s) => s.menuFocusId)
  const openId = useGameStore((s) => s.openId)
  const sceneKey = useGameStore((s) => s.sceneKey)
  const target = tooltipTarget({ hoveredId, hoverAnchor, menuFocusId, openId, sceneKey })
  const ref = useRef<HTMLDivElement>(null)
  const text = target ? t(`titles.${target.id}`) : ''
  const pos = useAnchorPosition(target?.anchor ?? null, ref, text)

  if (!target) return null
  const anchored = target.anchor !== null
  return (
    <div
      ref={ref}
      className={`tooltip${anchored ? ' tooltip--anchored' : ''}`}
      aria-hidden="true"
      style={anchored ? (pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }) : undefined}
    >
      {text}
    </div>
  )
}
