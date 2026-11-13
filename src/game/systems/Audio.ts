import * as Phaser from 'phaser'
import { AUDIO, type SfxKey } from '../assets'
import { EventBus } from '../EventBus'
import { useGameStore } from '@/store/useGameStore'

// Volumes fixos (ADR 0007).
const MUSIC_VOLUME = 0.35
const SFX_VOLUME = 0.5
// Intervalo mínimo entre dois blips de hover (o hover pode pular entre objetos vizinhos).
const HOVER_GAP_MS = 120

// Reprodução de áudio do jogo (ADR 0007). Uma instância por Phaser.Game (o SoundManager é global),
// criada no Preload e viva até o jogo ser destruído: atravessa a troca Entrance → Room sem
// duplicar a música.
// - Estado inicial: `useGameStore.muted` (mudo por padrão). Depois, só o evento 'audio-toggle'.
// - Nada toca com som desligado nem antes do primeiro gesto (o SoundManager fica `locked` até lá;
//   a música espera o evento 'unlocked').
// - `music-room` só é baixada quando o som é ligado pela primeira vez, pelo loader da cena ativa.
export class GameAudio {
  private static instances = new WeakMap<Phaser.Game, GameAudio>()

  static of(game: Phaser.Game): GameAudio {
    let audio = GameAudio.instances.get(game)
    if (!audio) {
      audio = new GameAudio(game)
      GameAudio.instances.set(game, audio)
    }
    return audio
  }

  private on: boolean
  private music?: Phaser.Sound.BaseSound
  private loadingMusic = false
  private waitingUnlock = false
  private lastHover = -Infinity
  private panelOpen = false
  private offs: Array<() => void> = []

  private constructor(private readonly game: Phaser.Game) {
    this.on = !useGameStore.getState().muted
    this.offs.push(
      EventBus.on('audio-toggle', (on) => this.setOn(on)),
      EventBus.on('ui-sfx', () => this.play('sfx-toggle')),
      EventBus.on('object-hover', (id) => {
        if (id) this.hover()
      }),
      EventBus.on('door-hover', (anchor) => {
        if (anchor) this.hover()
      }),
      EventBus.on('object-open', () => {
        this.panelOpen = true
        this.play('sfx-open')
      }),
      // 'panel-closed' é idempotente (Esc no zoom de entrada, por exemplo): só soa se havia painel.
      EventBus.on('panel-closed', () => {
        if (!this.panelOpen) return
        this.panelOpen = false
        this.play('sfx-close')
      }),
    )
    game.events.once(Phaser.Core.Events.DESTROY, () => this.destroy())
  }

  // Cada cena chama ao ser criada: se o som está ligado e a música ainda não carregou (ou a carga
  // foi interrompida pela troca de cena), tenta de novo com o loader desta cena.
  attach(scene: Phaser.Scene) {
    if (this.on) this.startMusic(scene)
  }

  play(key: SfxKey) {
    const sound = this.game.sound
    if (!this.on || sound.locked || !this.game.cache.audio.exists(key)) return
    sound.play(key, { volume: SFX_VOLUME })
  }

  private hover() {
    const now = this.game.loop.time
    if (now - this.lastHover < HOVER_GAP_MS) return
    this.lastHover = now
    this.play('sfx-hover')
  }

  private setOn(on: boolean) {
    if (on === this.on) return
    this.on = on
    if (on) this.startMusic()
    else if (this.music?.isPlaying) this.music.pause()
  }

  private startMusic(scene = this.activeScene()) {
    // Sem música configurada (assets.ts): o som ligado toca só os SFX.
    if (!AUDIO.music) return
    const { key, url } = AUDIO.music
    if (this.game.cache.audio.exists(key)) {
      this.playMusic()
      return
    }
    if (this.loadingMusic || !scene) return
    this.loadingMusic = true
    const loader = scene.load
    loader.audio(key, url)
    loader.once(`filecomplete-audio-${key}`, () => {
      this.loadingMusic = false
      if (this.on) this.playMusic()
    })
    // Carga interrompida (troca de cena) ou com erro: libera para a próxima tentativa.
    const reset = () => {
      if (!this.game.cache.audio.exists(key)) this.loadingMusic = false
    }
    loader.once(Phaser.Loader.Events.COMPLETE, reset)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, reset)
    if (!loader.isLoading()) loader.start()
  }

  private playMusic() {
    const sound = this.game.sound
    if (sound.locked) {
      if (!this.waitingUnlock) {
        this.waitingUnlock = true
        sound.once(Phaser.Sound.Events.UNLOCKED, () => {
          this.waitingUnlock = false
          this.playMusic()
        })
      }
      return
    }
    if (!this.on || !AUDIO.music) return
    this.music ??= sound.add(AUDIO.music.key, { loop: true, volume: MUSIC_VOLUME })
    if (this.music.isPaused) this.music.resume()
    else if (!this.music.isPlaying) this.music.play()
  }

  private activeScene(): Phaser.Scene | undefined {
    return this.game.scene.getScenes(true)[0]
  }

  private destroy() {
    for (const off of this.offs) off()
    this.offs = []
    GameAudio.instances.delete(this.game)
  }
}
