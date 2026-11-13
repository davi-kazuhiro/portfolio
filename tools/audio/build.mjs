// Gera música e efeitos sonoros do Quarto Pixel em public/assets/audio/ (ADR 0007). `pnpm audio`.
// Os scripts são a fonte: não edite os WAV gerados. Documentação: docs/arte/audio.md.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buffer, fade, mtof, note, removeDc, SR, writeWav } from './lib.mjs'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../../public/assets/audio')
const results = []
const save = (name, buf, peakDb) => results.push({ name, ...writeWav(join(OUT, name), buf, { peakDb }) })

// ---------------------------------------------------------------------------------------------------------
// music-room.wav — loop de 8 compassos, 84 BPM, Fá maior com sétimas. 1 tempo = 15 750 samples exatos.
// Todas as notas usam `wrap`: a cauda que passa do fim volta para o começo, então o buffer é periódico e o
// loop emenda sem clique e sem cortar release nem eco.
// ---------------------------------------------------------------------------------------------------------
const BPM = 84
const BEAT = 60 / BPM
const BARS = 8
const music = buffer({ samples: Math.round(BARS * 4 * BEAT * SR) })
const at = (bar, beat) => (bar * 4 + beat) * BEAT

// [nome, baixo (MIDI), notas do arpejo (MIDI)]
const CHORDS = [
  ['Fmaj7', 41, [53, 57, 60, 64]],
  ['Am7', 45, [57, 60, 64, 67]],
  ['Bbmaj7', 46, [58, 62, 65, 69]],
  ['C7sus4', 48, [60, 65, 67, 70]],
  ['Fmaj7', 41, [53, 57, 60, 64]],
  ['Dm7', 38, [50, 53, 57, 60]],
  ['Gm7', 43, [55, 58, 62, 65]],
  ['C7', 48, [52, 55, 58, 60]],
]

// Melodia: [nota MIDI | null (pausa), duração em tempos], 4 tempos por compasso.
const MELODY = [
  [[76, 1.5], [72, 0.5], [69, 2]],
  [[67, 1], [69, 0.5], [72, 0.5], [76, 2]],
  [[74, 1.5], [72, 0.5], [69, 1], [65, 1]],
  [[67, 3], [null, 1]],
  [[76, 1.5], [77, 0.5], [76, 1], [72, 1]],
  [[74, 1.5], [72, 0.5], [69, 2]],
  [[70, 1], [69, 0.5], [67, 0.5], [65, 1], [67, 1]],
  [[64, 2], [67, 1], [null, 1]],
]

/** Vibrato que entra devagar depois de 0,25 s (só em notas longas). */
const vibrato = (f) => (t) => f * (1 + 0.0045 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, Math.max(0, (t - 0.25) / 0.3)))

let seed = 100
for (let bar = 0; bar < BARS; bar++) {
  const [, root, tones] = CHORDS[bar]

  // Baixo em triângulo: fundamental, quinta, fundamental, oitava.
  for (const [beat, m, len] of [[0, root, 1.4], [2, root + 7, 0.9], [3, root, 0.4], [3.5, root + 12, 0.4]]) {
    note(music, {
      start: at(bar, beat), dur: len * BEAT, freq: mtof(m), wave: 'triangle', vol: 0.55,
      env: { a: 0.01, d: 0.2, s: 0.7, r: 0.12 }, wrap: true,
    })
  }

  // Arpejo suave em colcheias (quadrada 50 % abafada).
  const pattern = [0, 1, 2, 3, 2, 1, 2, 3]
  pattern.forEach((idx, k) => {
    note(music, {
      start: at(bar, k * 0.5), dur: 0.35 * BEAT, freq: mtof(tones[idx]), wave: 'square', duty: 0.5, lp: 900,
      vol: 0.09, env: { a: 0.004, d: 0.15, s: 0.35, r: 0.15 }, wrap: true,
    })
  })

  // Hi-hat de ruído discreto nos contratempos.
  for (let k = 0; k < 4; k++) {
    note(music, {
      start: at(bar, k + 0.5), dur: 0.008, wave: 'noise', hp: 6500, vol: k % 2 ? 0.07 : 0.05,
      env: { a: 0.001, d: 0.01, s: 0.4, r: 0.035 }, wrap: true, seed: seed++,
    })
  }

  // Bumbo macio (triângulo com queda de altura) nos tempos 1 e 3.
  for (const beat of [0, 2]) {
    note(music, {
      start: at(bar, beat), dur: 0.05, freq: (t) => 45 + 70 * Math.exp(-t * 40), wave: 'triangle', vol: 0.45,
      env: { a: 0.002, d: 0.06, s: 0.3, r: 0.08 }, wrap: true,
    })
  }

  // Melodia (quadrada 25 %) + eco de colcheia pontuada, mais baixo e mais abafado.
  let beat = 0
  for (const [m, len] of MELODY[bar]) {
    if (m != null) {
      for (const [delay, vol, lp] of [[0, 0.22, 2600], [0.75, 0.07, 1500], [1.5, 0.03, 1100]]) {
        note(music, {
          start: at(bar, beat + delay), dur: len * BEAT * 0.9, freq: vibrato(mtof(m)), wave: 'square', duty: 0.25,
          lp, vol, env: { a: 0.012, d: 0.12, s: 0.65, r: 0.18 }, wrap: true,
        })
      }
    }
    beat += len
  }
}
removeDc(music)
// Música desativada no jogo (2026-11-13; ver src/game/assets.ts). Só grava com `--music`, para prévia.
if (process.argv.includes('--music')) save('music-room.wav', music, -1.5)

// ---------------------------------------------------------------------------------------------------------
// SFX
// ---------------------------------------------------------------------------------------------------------

// sfx-hover.wav — blip curtíssimo (45 ms): triângulo com leve subida de altura, quase sem ataque.
{
  const b = buffer({ seconds: 0.045 })
  note(b, {
    start: 0, dur: 0.012, freq: (t) => 1568 + 4000 * t, wave: 'triangle', vol: 0.8,
    env: { a: 0.002, d: 0.02, s: 0.2, r: 0.03 },
  })
  save('sfx-hover.wav', fade(b, { outMs: 3 }), -10)
}

// sfx-open.wav / sfx-close.wav — arpejo de Dó maior (C6 E6 G6 C7) subindo / descendo.
const arp = (notes, name) => {
  const b = buffer({ seconds: 0.245 })
  notes.forEach((m, i) => {
    note(b, {
      start: i * 0.045, dur: 0.04, freq: mtof(m), wave: 'square', duty: 0.25, lp: 4500, vol: 0.5,
      env: { a: 0.002, d: 0.04, s: 0.5, r: 0.06 },
    })
  })
  save(name, fade(b, { outMs: 4 }), -5)
}
arp([84, 88, 91, 96], 'sfx-open.wav')
arp([96, 91, 88, 84], 'sfx-close.wav')

// sfx-door.wav — clique do trinco, rangido curto da dobradiça e "whoosh" de ar (350 ms, porta anima em 340 ms).
{
  const b = buffer({ seconds: 0.35 })
  // trinco: estalo de ruído agudo + pulso quadrado
  note(b, { start: 0, dur: 0.004, wave: 'noise', hp: 2500, vol: 0.7, env: { a: 0.0005, d: 0.004, s: 0.5, r: 0.012 }, seed: 7 })
  note(b, { start: 0.001, dur: 0.006, freq: 1900, wave: 'square', vol: 0.18, env: { a: 0.0005, d: 0.006, s: 0.3, r: 0.01 } })
  // rangido: quadrada estreita com altura subindo e tremendo, abafada
  note(b, {
    start: 0.025, dur: 0.15,
    freq: (t) => 150 + 260 * t + 18 * Math.sin(2 * Math.PI * 27 * t) + 9 * Math.sin(2 * Math.PI * 61 * t),
    wave: 'square', duty: (t) => 0.1 + 0.08 * Math.sin(2 * Math.PI * 9 * t), lp: 1600, hp: 180, vol: 0.28,
    env: { a: 0.02, d: 0.06, s: 0.6, r: 0.06 },
  })
  // whoosh: ruído com passa-baixa que abre e fecha
  note(b, {
    start: 0.06, dur: 0.2, wave: 'noise', vol: 0.55, seed: 21,
    lp: (t) => 300 + 2200 * Math.sin(Math.PI * Math.min(1, t / 0.28)), hp: 120,
    env: { a: 0.11, d: 0.06, s: 0.75, r: 0.085 },
  })
  save('sfx-door.wav', fade(b, { outMs: 6 }), -3)
}

// sfx-toggle.wav — clique de interruptor (70 ms): estalo agudo + "toc" mais grave 28 ms depois.
{
  const b = buffer({ seconds: 0.07 })
  note(b, { start: 0, dur: 0.003, wave: 'noise', hp: 2000, vol: 0.6, env: { a: 0.0003, d: 0.003, s: 0.4, r: 0.008 }, seed: 33 })
  note(b, { start: 0, dur: 0.005, freq: 2400, wave: 'square', vol: 0.25, env: { a: 0.0003, d: 0.005, s: 0.3, r: 0.01 } })
  note(b, { start: 0.028, dur: 0.006, freq: 900, wave: 'triangle', lp: 3000, vol: 0.4, env: { a: 0.0005, d: 0.008, s: 0.3, r: 0.02 } })
  save('sfx-toggle.wav', fade(b, { outMs: 3 }), -6)
}

// ---------------------------------------------------------------------------------------------------------
// Relatório + checagens (pico ≤ -1 dBFS, música ≤ 1,5 MB, emenda do loop).
// ---------------------------------------------------------------------------------------------------------
let ok = true
for (const r of results) {
  const flags = []
  if (r.peakDb > -1) flags.push('CLIPA')
  if (r.name.startsWith('music') && (r.bytes > 1.5 * 1024 * 1024 || r.seam > 0.02)) flags.push('LOOP/TAMANHO')
  if (flags.length) ok = false
  console.log(
    `${r.name.padEnd(16)} ${(r.seconds * 1000).toFixed(0).padStart(6)} ms ${(r.bytes / 1024).toFixed(1).padStart(8)} KB ` +
      `pico ${r.peakDb.toFixed(2)} dBFS  emenda ${r.seam.toFixed(4)} ${flags.join(' ')}`,
  )
}
if (!ok) process.exit(1)
