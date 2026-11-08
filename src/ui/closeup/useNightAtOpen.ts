import { useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { isNightAt, parsePeriodParam } from './period'

/**
 * Dia/noite da visão de perto, fixado na abertura (a troca no meio da leitura seria estranha).
 * Segue o período publicado pelo quarto (`store.period`); sem ele (cena ainda carregando), usa a
 * mesma regra de horário e, em dev, `?period=day|dusk|night`. Entardecer usa a variante de dia.
 */
export function useNightAtOpen(): boolean {
  const scenePeriod = useGameStore((s) => s.period)
  const [night] = useState(() => {
    if (scenePeriod) return scenePeriod === 'night'
    const forced = import.meta.env.DEV ? parsePeriodParam(window.location.search) : null
    return forced ? forced === 'night' : isNightAt(new Date())
  })
  return night
}
