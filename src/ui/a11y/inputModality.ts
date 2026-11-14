// Última forma de interação (teclado ou ponteiro), para decidir se o foco devolvido mostra anel.
// O navegador já faz isso no :focus-visible, mas foco por script depois de um clique varia entre
// navegadores; aqui a regra é explícita.

export type Modality = 'keyboard' | 'pointer'

let last: Modality = 'keyboard'

export function lastModality(): Modality {
  return last
}

/** Registra a interação. Teclas modificadoras sozinhas (Shift, Ctrl...) não contam. */
export function noteInput(event: { type: string; key?: string }) {
  if (event.type === 'pointerdown' || event.type === 'mousedown' || event.type === 'touchstart') {
    last = 'pointer'
    return
  }
  if (event.type === 'keydown' && !['Shift', 'Control', 'Alt', 'Meta'].includes(event.key ?? '')) last = 'keyboard'
}

type Target = Pick<Window, 'addEventListener' | 'removeEventListener'>

/** Escuta teclado e ponteiro (fase de captura) em `target`; devolve a função que para. */
export function trackInputModality(target: Target, onKeyboard?: () => void) {
  const onPointer = (e: Event) => noteInput(e)
  const onKey = (e: KeyboardEvent) => {
    noteInput(e)
    if (last === 'keyboard') onKeyboard?.()
  }
  target.addEventListener('pointerdown', onPointer, true)
  target.addEventListener('keydown', onKey, true)
  return () => {
    target.removeEventListener('pointerdown', onPointer, true)
    target.removeEventListener('keydown', onKey, true)
  }
}
