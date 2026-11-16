// Botão "voltar" do celular (e do navegador) fecha a visão de perto e volta ao quarto.
//
// Ao abrir um painel empilhamos uma entrada no histórico. "Voltar" dispara `popstate`, que fecha o
// painel. Fechar pela interface (Fechar, Esc, clique fora) desempilha a entrada com `history.back()`
// para o histórico não acumular; o `popstate` que esse `back()` gera depois é ignorado. Um único
// ouvinte de `popstate` por janela cuida das duas coisas.

/** Marca da entrada que empilhamos em `history.state`. */
export const PANEL_STATE_KEY = 'quartoPixelPanel'

/** O mínimo de `window` usado (facilita testar sem DOM). */
export interface BackWindow {
  history: Pick<History, 'state' | 'pushState' | 'back'>
  addEventListener(type: 'popstate', fn: () => void): void
}

const isPanelState = (state: unknown) =>
  typeof state === 'object' && state !== null && PANEL_STATE_KEY in (state as Record<string, unknown>)

interface Binding {
  // `back()` pedidos por nós cujo `popstate` ainda não chegou.
  pendingBacks: number
  // Quem fecha o painel aberto agora (null = nenhum).
  onBack: (() => void) | null
}
const bindings = new WeakMap<BackWindow, Binding>()

function bindingOf(win: BackWindow): Binding {
  let b = bindings.get(win)
  if (!b) {
    const binding: Binding = { pendingBacks: 0, onBack: null }
    win.addEventListener('popstate', () => {
      if (binding.pendingBacks > 0) {
        binding.pendingBacks--
        return
      }
      const fn = binding.onBack
      binding.onBack = null
      fn?.()
    })
    bindings.set(win, binding)
    b = binding
  }
  return b
}

/**
 * Liga o "voltar" ao painel `id` enquanto ele está aberto. Devolve a limpeza, para chamar quando o
 * painel fecha (por qualquer caminho).
 */
export function bindBackToClose(win: BackWindow, id: string, close: () => void): () => void {
  const b = bindingOf(win)
  if (!isPanelState(win.history.state)) {
    const base = typeof win.history.state === 'object' && win.history.state !== null ? win.history.state : {}
    win.history.pushState({ ...base, [PANEL_STATE_KEY]: id }, '')
  }
  let closedByBack = false
  const onBack = () => {
    closedByBack = true
    close()
  }
  b.onBack = onBack
  return () => {
    if (b.onBack === onBack) b.onBack = null
    if (!closedByBack && isPanelState(win.history.state)) {
      b.pendingBacks++
      win.history.back()
    }
  }
}
