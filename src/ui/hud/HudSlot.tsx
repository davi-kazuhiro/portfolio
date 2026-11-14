import { useCallback } from 'react'
import { registerHudSlot, unregisterHudSlot } from './hudSlotStore'

/** Lugar do HUD dentro do diálogo aberto (ver hudSlotStore.ts). Vai por último: Tab chega nele depois do conteúdo. */
export function HudSlot() {
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    registerHudSlot(el)
    return () => unregisterHudSlot(el)
  }, [])
  return <div className="hud-slot" ref={ref} />
}
