import { describe, expect, it, vi } from 'vitest'
import { bindBackToClose, PANEL_STATE_KEY, type BackWindow } from '@/ui/panels/backButton'

// Histórico falso: pilha de estados; `back()` dispara `popstate` depois (assíncrono, como no navegador).
function fakeWindow() {
  const stack: unknown[] = [null]
  const listeners: Array<() => void> = []
  const queue: Array<() => void> = []
  const win: BackWindow & { stack: unknown[]; flush: () => void; userBack: () => void } = {
    stack,
    history: {
      get state() {
        return stack[stack.length - 1]
      },
      pushState: (s: unknown) => void stack.push(s),
      back: () => {
        queue.push(() => {
          stack.pop()
          listeners.forEach((fn) => fn())
        })
      },
    } as BackWindow['history'],
    addEventListener: (_t, fn) => void listeners.push(fn),
    flush: () => queue.splice(0).forEach((fn) => fn()),
    userBack: () => {
      win.history.back()
      win.flush()
    },
  }
  return win
}

describe('bindBackToClose', () => {
  it('abrir empilha uma entrada; "voltar" fecha o painel sem novo back()', () => {
    const win = fakeWindow()
    const close = vi.fn()
    const cleanup = bindBackToClose(win, 'computer', close)
    expect(win.stack).toHaveLength(2)
    expect(win.history.state).toEqual({ [PANEL_STATE_KEY]: 'computer' })
    win.userBack()
    expect(close).toHaveBeenCalledOnce()
    cleanup() // o painel desmonta depois do close()
    win.flush()
    expect(win.stack).toHaveLength(1)
  })

  it('fechar pela interface desempilha a entrada e ignora o popstate gerado', () => {
    const win = fakeWindow()
    const close = vi.fn()
    bindBackToClose(win, 'phone', close)()
    win.flush()
    expect(win.stack).toHaveLength(1)
    expect(close).not.toHaveBeenCalled()

    // O próximo painel continua respondendo ao "voltar".
    const close2 = vi.fn()
    bindBackToClose(win, 'journal', close2)
    win.userBack()
    expect(close2).toHaveBeenCalledOnce()
  })

  it('sem painel aberto, "voltar" não chama ninguém', () => {
    const win = fakeWindow()
    const close = vi.fn()
    bindBackToClose(win, 'frames', close)()
    win.flush()
    win.history.pushState({ outra: 1 }, '')
    win.userBack()
    expect(close).not.toHaveBeenCalled()
  })
})
