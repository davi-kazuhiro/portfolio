import * as Phaser from 'phaser'
import { Boot } from './scenes/Boot'
import { Entrance } from './scenes/Entrance'
import { Preload } from './scenes/Preload'
import { Room } from './scenes/Room'

export function createGame(parent: HTMLElement) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    pixelArt: true,
    backgroundColor: '#1b1526',
    // RESIZE copia o tamanho do pai (getBoundingClientRect), que é fracionário com
    // devicePixelRatio ≠ 1 (ex.: 1365,6 px a 125%). `snap` de 1 px arredonda para baixo o tamanho
    // do jogo/câmera, e `autoRound` o do canvas, para a arte nunca cair em meio pixel.
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
      snap: { width: 1, height: 1 },
      autoRound: true,
    },
    scene: [Boot, Preload, Entrance, Room],
  })
  // Só em dev: acesso ao jogo pelo console/Playwright para depuração e testes e2e.
  if (import.meta.env.DEV) (window as unknown as { __game?: Phaser.Game }).__game = game
  return game
}
