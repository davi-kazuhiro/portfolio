import * as Phaser from 'phaser'
import { EventBus } from './EventBus'
import { hasWebGL, markRendererUnavailable } from './renderer'
import { Boot } from './scenes/Boot'
import { Entrance } from './scenes/Entrance'
import { Preload } from './scenes/Preload'
import { Room } from './scenes/Room'
import { canvasSize, renderScale, setDeviceScale } from './systems/deviceScale'

// Cria o jogo dentro de `parent`. Sem WebGL (o build enxuto só tem o renderer WebGL, ADR 0009) não
// cria nada, emite 'renderer-unavailable' e devolve `null`: a UI mostra a imagem estática e o menu
// de objetos, que abre os painéis sem a cena (requestOpen sem `sceneKey`).
export function createGame(parent: HTMLElement): Phaser.Game | null {
  if (!hasWebGL()) return rendererUnavailable(parent)
  const k = renderScale(window.devicePixelRatio)
  const rect = parent.getBoundingClientRect()
  const size = canvasSize(rect.width, rect.height, k)
  let game: Phaser.Game
  try {
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      pixelArt: true,
      backgroundColor: '#1b1526',
      // Tamanho do canvas feito à mão (M6, ADR 0010): com DPR inteiro, jogo = `floor` do tamanho
      // CSS do pai (como o Scale.RESIZE + snap do M5); com DPR fracionário, jogo e canvas em px do
      // aparelho e o estilo do canvas em px CSS, para o zoom inteiro da câmera ser inteiro na tela.
      scale: {
        mode: Phaser.Scale.NONE,
        width: size.width,
        height: size.height,
        autoRound: true,
      },
      scene: [Boot, Preload, Entrance, Room],
    })
  } catch (err) {
    // O contexto WebGL pode falhar mesmo com a detecção dizendo que existe (GPU na lista negra).
    console.warn('[quarto] Phaser não iniciou:', err)
    return rendererUnavailable(parent)
  }
  setDeviceScale(game, k)
  // O canvas nasce com o estilo = tamanho do backing store (px do jogo); com k ≠ 1 o estilo em px
  // CSS é posto aqui e o `refresh` recalcula a conversão do ponteiro (displayScale = k).
  const init = () => {
    setCanvasStyle(game.canvas, size)
    game.scale.refresh()
    followParentSize(game, parent)
  }
  if (game.isBooted) init()
  else game.events.once(Phaser.Core.Events.BOOT, init)
  // Só em dev: acesso ao jogo pelo console/Playwright para depuração e testes e2e.
  if (import.meta.env.DEV) (window as unknown as { __game?: Phaser.Game }).__game = game
  return game
}

// Sem renderer: nada de Phaser; a UI recebe 'renderer-unavailable' (renderer.ts).
function rendererUnavailable(parent: HTMLElement): null {
  return markRendererUnavailable(parent, () => EventBus.emit('renderer-unavailable'))
}

function setCanvasStyle(canvas: HTMLCanvasElement, size: { cssWidth: number; cssHeight: number }) {
  canvas.style.width = `${size.cssWidth}px`
  canvas.style.height = `${size.cssHeight}px`
}

// Acompanha o tamanho do pai (ResizeObserver) e o devicePixelRatio (zoom do navegador, troca de
// monitor: `matchMedia('(resolution: Xdppx)')`). A cada mudança: grava o fator, ajusta o estilo do
// canvas e chama `scale.resize`, que emite o RESIZE que as cenas já escutam.
function followParentSize(game: Phaser.Game, parent: HTMLElement) {
  let lastK = renderScale(window.devicePixelRatio)
  const apply = () => {
    if (!game.canvas) return
    const k = renderScale(window.devicePixelRatio)
    const rect = parent.getBoundingClientRect()
    const size = canvasSize(rect.width, rect.height, k)
    setDeviceScale(game, k)
    setCanvasStyle(game.canvas, size)
    if (size.width !== game.scale.width || size.height !== game.scale.height || k !== lastK) {
      lastK = k
      game.scale.resize(size.width, size.height)
    } else {
      // Mesmo tamanho do jogo, mas o canvas pode ter mudado de lugar/estilo: atualiza a conversão
      // do ponteiro (displayScale) sem reenquadrar a câmera.
      game.scale.updateBounds()
      game.scale.displayScale.set(game.scale.baseSize.width / game.scale.canvasBounds.width, game.scale.baseSize.height / game.scale.canvasBounds.height)
    }
  }
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null
  observer?.observe(parent)
  if (!observer) window.addEventListener('resize', apply)

  let query: MediaQueryList | null = null
  const watchDpr = () => {
    query?.removeEventListener('change', onDprChange)
    query = window.matchMedia?.(`(resolution: ${window.devicePixelRatio}dppx)`) ?? null
    query?.addEventListener('change', onDprChange)
  }
  function onDprChange() {
    watchDpr()
    apply()
  }
  watchDpr()

  game.events.once(Phaser.Core.Events.DESTROY, () => {
    observer?.disconnect()
    window.removeEventListener('resize', apply)
    query?.removeEventListener('change', onDprChange)
  })
}
