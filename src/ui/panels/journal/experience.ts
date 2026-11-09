// Lógica pura do caderno (experiences.json, docs/conteudo/guia-de-conteudo.md).
import type { Experience } from '@/content'

/** "AAAA-MM" → meses desde o ano 0 (NaN se inválido). */
export function monthIndex(ym: string): number {
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim())
  if (!m) return Number.NaN
  return Number(m[1]) * 12 + (Number(m[2]) - 1)
}

/**
 * "Atual": o mês de `now` está entre `start` e `end` (inclusive). `end` null = sem término.
 * Datas inválidas → false.
 */
export function isCurrent(exp: Pick<Experience, 'start' | 'end'>, now: Date): boolean {
  const today = now.getFullYear() * 12 + now.getMonth()
  const start = monthIndex(exp.start)
  if (Number.isNaN(start) || today < start) return false
  if (exp.end === null) return true
  const end = monthIndex(exp.end)
  return !Number.isNaN(end) && today <= end
}

/** Linha de local: "Organização · Programa, Cidade" (programa só se houver). */
export function locationLine(exp: Pick<Experience, 'organization' | 'program' | 'city'>): string {
  const org = exp.program ? `${exp.organization} · ${exp.program}` : exp.organization
  return exp.city ? `${org}, ${exp.city}` : org
}

/** Página (experiência) depois de virar `dir`, presa a `[0, total − 1]`. */
export const turnPage = (page: number, dir: 1 | -1, total: number) => Math.min(Math.max(page + dir, 0), Math.max(total - 1, 0))

/**
 * Destino do teclado numa lista de abas (padrão tablist da APG): ←/↑ anterior, →/↓ próxima (com
 * volta), Home/End nas pontas. Outra tecla → null.
 */
export function tabKeyTarget(key: string, current: number, total: number): number | null {
  if (total <= 0) return null
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      return (current - 1 + total) % total
    case 'ArrowRight':
    case 'ArrowDown':
      return (current + 1) % total
    case 'Home':
      return 0
    case 'End':
      return total - 1
    default:
      return null
  }
}
