import { useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { parsePeriodParam, periodAt, type DayPeriod } from './period'

/**
 * Período da visão de perto (dia, entardecer ou noite), fixado na abertura: a troca do relógio no
 * meio da leitura seria estranha. Segue o período publicado pelo quarto (`store.period`); sem ele
 * (cena ainda carregando), usa a mesma regra de horário e, em dev, `?period=day|dusk|night`.
 * A escolha do visitante no botão do HUD (`store.periodChoice`) vale na hora, mesmo com a visão aberta.
 */
export function usePeriodAtOpen(): DayPeriod {
  const scenePeriod = useGameStore((s) => s.period)
  const choice = useGameStore((s) => s.periodChoice)
  const [atOpen] = useState<DayPeriod>(() => {
    if (scenePeriod) return scenePeriod
    const forced = import.meta.env.DEV ? parsePeriodParam(window.location.search) : null
    return forced ?? periodAt(new Date())
  })
  const [choiceAtOpen] = useState(choice)
  return choice && choice !== choiceAtOpen ? choice : atOpen
}

/** Atalho: `night` e `dusk` do período da visão de perto. */
export function useNightAtOpen(): { night: boolean; dusk: boolean } {
  const period = usePeriodAtOpen()
  return { night: period === 'night', dusk: period === 'dusk' }
}
