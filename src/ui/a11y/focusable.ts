// Utilitários puros de foco, usados pelo foco preso dos painéis.

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Elementos alcançáveis por Tab dentro de `container`, na ordem do DOM. `tabindex="-1"` fica de
 * fora mesmo em botões (abas inativas de um tablist com tabindex móvel).
 */
export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('inert') && el.getAttribute('aria-hidden') !== 'true' && el.getAttribute('tabindex') !== '-1',
  )
}

/**
 * Próximo índice ao apertar Tab (ou Shift+Tab) com foco preso.
 * `current` = -1 quando o foco não está em nenhum item da lista (ex.: no próprio diálogo).
 * Retorna -1 se não há itens.
 */
export function wrapFocusIndex(current: number, length: number, backwards: boolean): number {
  if (length <= 0) return -1
  if (current < 0) return backwards ? length - 1 : 0
  if (backwards) return current === 0 ? length - 1 : current - 1
  return current === length - 1 ? 0 : current + 1
}
