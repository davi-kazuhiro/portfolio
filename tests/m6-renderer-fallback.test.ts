import { describe, expect, it } from 'vitest'
import { hasWebGL, markRendererUnavailable } from '@/game/renderer'

// Sem WebGL o jogo não é criado: 'renderer-unavailable' sai depois da montagem e o pai é marcado.
// (No Node não há `window`, então `hasWebGL()` é false, como num navegador sem WebGL.)
describe('fallback sem WebGL', () => {
  it('hasWebGL é false sem window/WebGL', () => {
    expect(hasWebGL()).toBe(false)
  })

  it('não cria o Phaser, marca o pai e emite renderer-unavailable depois', async () => {
    const removed: unknown[] = []
    const parent = {
      dataset: {} as Record<string, string>,
      querySelectorAll: () => [{ remove: () => removed.push(1) }],
    } as unknown as HTMLElement
    let calls = 0
    // config.ts passa `() => EventBus.emit('renderer-unavailable')`.
    const game = markRendererUnavailable(parent, () => calls++)
    expect(game).toBeNull()
    expect(parent.dataset.renderer).toBe('unavailable')
    expect(removed).toHaveLength(1)
    // Ainda não: o listener da UI é registrado depois do efeito que cria o jogo.
    expect(calls).toBe(0)
    await new Promise((r) => setTimeout(r, 0))
    expect(calls).toBe(1)
  })
})
