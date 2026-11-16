import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EventBus, type ObjectAnchorPoint } from '@/game/EventBus'

// Distância (px CSS) entre a ponta da seta e o topo do objeto.
const GAP = 6

// Última lista recebida: a cena só reenvia quando algo muda, então as setas montadas depois
// (passo do tutorial) começam por ela.
let lastAnchors: ObjectAnchorPoint[] | null = null
EventBus.on('object-anchors', (anchors) => {
  lastAnchors = anchors
})

/**
 * Setas amarelas balançando sobre cada interagível do quarto (passo do tutorial). Seguem a câmera
 * pelas âncoras de 'object-anchors'. Decorativas (aria-hidden, sem ponteiro).
 */
export function TutorialArrows() {
  const [anchors, setAnchors] = useState<ObjectAnchorPoint[] | null>(() => lastAnchors)
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => EventBus.on('object-anchors', setAnchors), [])

  // Âncoras vêm relativas ao canvas; a camada fica no `.app`.
  useLayoutEffect(() => {
    const container = ref.current?.offsetParent
    const canvas = document.querySelector('.game-canvas canvas')
    if (!anchors || !container || !canvas) return
    const c = container.getBoundingClientRect()
    const k = canvas.getBoundingClientRect()
    const next = { left: Math.round(k.left - c.left), top: Math.round(k.top - c.top) }
    setOffset((prev) => (prev && prev.left === next.left && prev.top === next.top ? prev : next))
  }, [anchors])

  if (!anchors) return null
  return (
    <div ref={ref} className="tutorial-arrows" aria-hidden="true">
      {offset &&
        anchors.map((a) => (
          <span key={a.id} className="tutorial-arrow" style={{ left: a.x + offset.left, top: a.y + offset.top - GAP }}>
            <PixelArrow />
          </span>
        ))}
    </div>
  )
}

// Seta para baixo em pixel art (9×10 pixels, escala 3): amarela com contorno escuro.
function PixelArrow() {
  return (
    <svg viewBox="0 0 9 10" width="27" height="30" shapeRendering="crispEdges">
      <path
        className="tutorial-arrow__edge"
        d="M2 0h5v4h2v2h-1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h-1v-2h2z"
      />
      <path className="tutorial-arrow__fill" d="M3 1h3v4h2v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1v-1h2z" />
    </svg>
  )
}
