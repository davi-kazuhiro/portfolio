# Áudio (M4)

Mantido pelo agente `art-director`. Decisão: [ADR 0007](../adr/0007-audio-gerado-por-codigo.md). Todo o som é sintetizado por `tools/audio/` (Node puro, sem dependências): `lib.mjs` é o motor (quadrada com duty variável, triângulo, ruído com PRNG semeado, ADSR, filtros de um polo, mixer, escrita de WAV) e `build.mjs` descreve cada som. **Os scripts são a fonte; não edite os WAV.**

## Regerar
```
pnpm audio        # = node tools/audio/build.mjs
```
Grava em `public/assets/audio/` e imprime duração, tamanho, pico e emenda de cada arquivo; sai com erro se algum pico passar de -1 dBFS, se a música passar de 1,5 MB ou se o loop não emendar. O build é determinístico (mesmos bytes a cada execução).

Formato: WAV PCM 16 bits mono, 22 050 Hz, normalizado por pico (alvo por arquivo abaixo).

## Arquivos

| Arquivo | Duração | Tamanho | Pico | Ideia |
|---|---|---|---|---|
| `music-room.wav` (**desativada**, só com `--music`) | 22,86 s (loop) | 984 KB | -1,5 dBFS | Quarto de dev à noite: 8 compassos a **84 BPM em Fá maior** (Fmaj7 Am7 Bbmaj7 C7sus4 / Fmaj7 Dm7 Gm7 C7). Baixo em triângulo, arpejo abafado em quadrada 50 %, melodia em quadrada 25 % com vibrato tardio e eco de colcheia pontuada, hi-hat de ruído nos contratempos, bumbo macio de triângulo. |
| `sfx-hover.wav` | 45 ms | 2 KB | -10 dBFS | Blip de triângulo (G6 subindo levemente), baixo e sem ataque duro: toca muito. |
| `sfx-open.wav` | 245 ms | 11 KB | -5 dBFS | Arpejo ascendente C6 E6 G6 C7 em quadrada 25 %. |
| `sfx-close.wav` | 245 ms | 11 KB | -5 dBFS | O mesmo arpejo descendo (C7 G6 E6 C6). |
| `sfx-door.wav` | 350 ms | 15 KB | -3 dBFS | Clique do trinco, rangido curto da dobradiça (quadrada estreita com altura trêmula) e "whoosh" de ruído com passa-baixa que abre e fecha; casa com a animação de 340 ms da porta. |
| `sfx-toggle.wav` | 70 ms | 3 KB | -6 dBFS | Clique de interruptor: estalo agudo + "toc" grave 28 ms depois (botões do HUD). |

## Loop da música

> **Desativada em 2026-11-13:** o Davi não gostou da música gerada e vai fazer a própria. O jogo não carrega música (`AUDIO.music = null` em `src/game/assets.ts`) e o build só grava `music-room.wav` com `node tools/audio/build.mjs --music`. Para usar a música do Davi, apontar `AUDIO.music` para o arquivo dele (e registrar em `LICENSES.md` se não for própria).
- 1 tempo = 15 750 samples exatos (22 050 × 60 / 84); o loop tem 504 000 samples.
- Toda nota da música é escrita com `wrap`: o release e o eco que passam do fim voltam para o começo do buffer. O arquivo é periódico, então o último sample casa com o primeiro (diferença 171/32 767, menor que o salto mediano entre samples vizinhos) e nenhuma cauda é cortada.
- No Phaser, tocar com `loop: true` (sem fade na emenda). Volume da cena conforme o ADR: música ≈ 0,35, SFX ≈ 0,5.
