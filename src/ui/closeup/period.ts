// Período do dia pelo horário local do visitante (game design, "Dia/noite"):
// dia 7h–17h, entardecer 17h–19h, noite 19h–7h. Função pura; o relógio entra como parâmetro.
// A visão de perto usa o período publicado pela cena ('period-changed' → store.period); esta
// função é só o fallback antes do quarto carregar. Espelha src/game/systems/period.ts (React e
// Phaser não se importam); tests/period.test.ts garante que as duas concordam.
export type DayPeriod = 'day' | 'dusk' | 'night'

export function periodAt(date: Date): DayPeriod {
  const h = date.getHours()
  if (h >= 19 || h < 7) return 'night'
  if (h >= 17) return 'dusk'
  return 'day'
}

// Só a noite: atalho para quem não tem variante de entardecer.
export function isNightAt(date: Date): boolean {
  return periodAt(date) === 'night'
}

/** Próximo período do botão do HUD: dia → tarde → noite → dia. */
export function nextPeriod(p: DayPeriod): DayPeriod {
  return p === 'day' ? 'dusk' : p === 'dusk' ? 'night' : 'day'
}

// `?period=day|dusk|night` força o período (só em dev), igual à cena Room, para prévia e QA.
export function parsePeriodParam(search: string): DayPeriod | null {
  const v = new URLSearchParams(search).get('period')
  return v === 'day' || v === 'dusk' || v === 'night' ? v : null
}
