// Detecção de WebGL e fallback sem renderer (M6, ADR 0010). Sem Phaser: testável no Vitest.
// O build enxuto só tem o renderer WebGL (ADR 0009); sem ele o jogo não é criado.

// O navegador consegue criar um contexto WebGL? (o mesmo teste do Phaser, `Device.Features.webGL`).
// O contexto de teste é liberado na hora.
export function hasWebGL(): boolean {
  try {
    if (typeof window === 'undefined' || !('WebGLRenderingContext' in window)) return false
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

// Sem renderer: limpa o que o Phaser possa ter posto no pai, marca o pai no DOM (CSS da UI e
// testes leem sem depender do momento do evento) e avisa a UI depois da montagem: o listener da UI
// é registrado num efeito do React que roda depois do efeito que cria o jogo.
export function markRendererUnavailable(parent: HTMLElement, notify: () => void): null {
  parent.querySelectorAll('canvas').forEach((c) => c.remove())
  parent.dataset.renderer = 'unavailable'
  setTimeout(notify, 0)
  return null
}
