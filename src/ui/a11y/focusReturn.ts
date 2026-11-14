import type { Modality } from './inputModality'

// Guarda quem abriu o painel para devolver o foco ao fechar.
// Fica fora do store: elementos do DOM não são estado serializável.

let remembered: HTMLElement | null = null

export function rememberFocus(el: Element | null) {
  remembered = el instanceof HTMLElement && el !== document.body ? el : null
}

/** Devolve (e esquece) o elemento guardado; cai no foco atual se nada foi guardado. */
export function takeRememberedFocus(): HTMLElement | null {
  const el = remembered ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
  remembered = null
  return el && el !== document.body ? el : null
}

/** O que precisamos de um elemento para decidir se ele ainda pode receber o foco. */
export interface FocusCandidate {
  isConnected: boolean
  closest(selector: string): unknown
}

/**
 * Para onde o foco volta ao fechar: quem abriu, se ainda está na página e fora de um `inert`;
 * senão o item do menu de objetos (`fallback`, aberto por clique/toque no canvas).
 */
export function pickReturnTarget<T extends FocusCandidate>(returnTo: T | null, fallback: T | null): T | null {
  if (returnTo && returnTo.isConnected && !returnTo.closest('[inert]')) return returnTo
  return fallback
}

/**
 * Marca o foco devolvido depois de um clique/toque: o CSS não mostra anel nem abre o menu de
 * objetos com ele (rede de segurança para navegadores que ignoram `focusVisible: false`). Sai no
 * blur ou na próxima tecla (`clearQuietFocus`).
 */
export const QUIET_FOCUS_ATTR = 'data-focus-quiet'

/** Foca `el` sem rolar; vindo de ponteiro, sem anel de foco. */
export function restoreFocus(el: HTMLElement, modality: Modality) {
  const quiet = modality === 'pointer'
  if (quiet) {
    el.setAttribute(QUIET_FOCUS_ATTR, '')
    el.addEventListener('blur', () => el.removeAttribute(QUIET_FOCUS_ATTR), { once: true })
  }
  // `focusVisible` (FocusOptions) ainda não está nos tipos do DOM do TypeScript.
  el.focus({ preventScroll: true, focusVisible: !quiet } as FocusOptions)
}

/** Primeira tecla depois de um foco devolvido "quieto": daqui em diante o anel volta a valer. */
export function clearQuietFocus(root: Pick<Document, 'querySelectorAll'> = document) {
  root.querySelectorAll(`[${QUIET_FOCUS_ATTR}]`).forEach((el) => el.removeAttribute(QUIET_FOCUS_ATTR))
}

/** Foco com anel visível (teclado)? O menu de objetos só pede o destaque no quarto nesse caso. */
export function isKeyboardFocus(el: Pick<Element, 'matches' | 'hasAttribute'>): boolean {
  if (el.hasAttribute(QUIET_FOCUS_ATTR)) return false
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}
