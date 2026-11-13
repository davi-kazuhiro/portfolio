// Motor de síntese chiptune do Quarto Pixel (ADR 0007). Node puro, sem dependências.
// Osciladores (quadrada com duty variável, triângulo, ruído), envelope ADSR, filtros de um polo, mixer em
// buffer Float32 e escrita de WAV PCM 16 bits mono 22 050 Hz com normalização (pico abaixo de 0 dBFS).
// Tudo determinístico: o ruído usa um PRNG semeado (mulberry32).
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export const SR = 22050

/** PRNG determinístico (mulberry32): devolve uma função que gera floats em [0, 1). */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Frequência (Hz) de uma nota MIDI (A4 = 69 = 440 Hz). */
export const mtof = (m) => 440 * 2 ** ((m - 69) / 12)

/** Buffer de mixagem com `seconds` de duração (ou `samples` exatos). */
export const buffer = ({ seconds, samples }) => new Float32Array(samples ?? Math.round(seconds * SR))

// ---- osciladores (fase em ciclos, 0..1) ----
export const square = (ph, duty = 0.5) => ((ph % 1) < duty ? 1 : -1)
export const triangle = (ph) => {
  const p = ph % 1
  return p < 0.5 ? 4 * p - 1 : 3 - 4 * p
}

/** Envelope ADSR (segundos; `s` é nível 0..1). `t` = tempo desde o início, `hold` = duração até soltar. */
export function adsr(t, hold, { a = 0.005, d = 0.05, s = 0.7, r = 0.05 } = {}) {
  const sustainAt = (u) => (u < a ? u / a : u < a + d ? 1 - (1 - s) * ((u - a) / d) : s)
  if (t < hold) return sustainAt(t)
  const u = t - hold
  return u >= r ? 0 : sustainAt(hold) * (1 - u / r)
}

/** Coeficiente de um filtro de um polo para a frequência de corte `fc` (Hz). */
const onePole = (fc) => 1 - Math.exp((-2 * Math.PI * Math.min(fc, SR * 0.45)) / SR)

/**
 * Soma uma nota no buffer `out`.
 * - `start`, `dur` em segundos (`dur` = tempo até soltar; a cauda do release vem depois).
 * - `freq` em Hz, ou função `(t) => Hz` para glissando/vibrato.
 * - `wave`: 'square' | 'triangle' | 'noise'; `duty` (quadrada, número ou função de t); `vol`; `env` (ADSR).
 * - `lp` / `hp`: corte (Hz, número ou função de t) de passa-baixa / passa-alta de um polo, por nota.
 * - `wrap`: se true, o que passar do fim do buffer volta para o começo (loop sem emenda).
 * - `seed`: semente do ruído (ruído é "sample and hold" na frequência `freq`, ou branco se `freq` faltar).
 */
export function note(out, o) {
  const { start, dur, freq, wave = 'square', duty = 0.5, vol = 0.5, env, lp, hp, wrap = false, seed = 1 } = o
  const r = env?.r ?? 0.05
  const n = Math.ceil((dur + r) * SR)
  const s0 = Math.round(start * SR)
  const rand = rng(seed)
  const fOf = typeof freq === 'function' ? freq : () => freq
  const dOf = typeof duty === 'function' ? duty : () => duty
  const lpOf = lp == null ? null : typeof lp === 'function' ? lp : () => lp
  const hpOf = hp == null ? null : typeof hp === 'function' ? hp : () => hp
  let ph = 0
  let held = 0
  let lpState = 0
  let hpState = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    let x
    if (wave === 'noise') {
      const f = freq == null ? SR : fOf(t)
      ph += f / SR
      if (i === 0 || ph >= 1) {
        held = rand() * 2 - 1
        ph %= 1
      }
      x = held
    } else {
      x = wave === 'triangle' ? triangle(ph) : square(ph, dOf(t))
      ph += fOf(t) / SR
    }
    if (lpOf) x = lpState += onePole(lpOf(t)) * (x - lpState)
    if (hpOf) {
      hpState += onePole(hpOf(t)) * (x - hpState)
      x -= hpState
    }
    const v = x * vol * adsr(t, dur, env)
    let k = s0 + i
    if (wrap) k = ((k % out.length) + out.length) % out.length
    else if (k >= out.length) break
    out[k] += v
  }
}

/** Mixer: soma `src` em `dst` com ganho. */
export function mix(dst, src, gain = 1) {
  for (let i = 0; i < dst.length; i++) dst[i] += (src[i] ?? 0) * gain
  return dst
}

/** Fade linear de `ms` no começo e/ou fim (para SFX terminarem em silêncio). */
export function fade(buf, { inMs = 0, outMs = 0 } = {}) {
  const a = Math.round((inMs / 1000) * SR)
  const b = Math.round((outMs / 1000) * SR)
  for (let i = 0; i < a && i < buf.length; i++) buf[i] *= i / a
  for (let i = 0; i < b && i < buf.length; i++) buf[buf.length - 1 - i] *= i / b
  return buf
}

/** Remove o nível DC (média). */
export function removeDc(buf) {
  let m = 0
  for (const v of buf) m += v
  m /= buf.length
  for (let i = 0; i < buf.length; i++) buf[i] -= m
  return buf
}

const dbToLin = (db) => 10 ** (db / 20)
export const linToDb = (x) => 20 * Math.log10(Math.max(x, 1e-9))

/**
 * Normaliza o pico para `peakDb` (padrão -1,5 dBFS), quantiza em PCM 16 bits e grava o WAV.
 * Devolve estatísticas: duração, bytes, pico (dBFS) e diferença entre o primeiro e o último sample.
 */
export function writeWav(path, buf, { peakDb = -1.5 } = {}) {
  let peak = 0
  for (const v of buf) peak = Math.max(peak, Math.abs(v))
  const g = peak > 0 ? dbToLin(peakDb) / peak : 0
  const n = buf.length
  const data = Buffer.alloc(44 + n * 2)
  data.write('RIFF', 0)
  data.writeUInt32LE(36 + n * 2, 4)
  data.write('WAVE', 8)
  data.write('fmt ', 12)
  data.writeUInt32LE(16, 16) // tamanho do bloco fmt
  data.writeUInt16LE(1, 20) // PCM
  data.writeUInt16LE(1, 22) // mono
  data.writeUInt32LE(SR, 24)
  data.writeUInt32LE(SR * 2, 28) // byte rate
  data.writeUInt16LE(2, 32) // block align
  data.writeUInt16LE(16, 34) // bits
  data.write('data', 36)
  data.writeUInt32LE(n * 2, 40)
  let maxQ = 0
  for (let i = 0; i < n; i++) {
    const q = Math.max(-32767, Math.min(32767, Math.round(buf[i] * g * 32767)))
    maxQ = Math.max(maxQ, Math.abs(q))
    data.writeInt16LE(q, 44 + i * 2)
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, data)
  const first = data.readInt16LE(44)
  const last = data.readInt16LE(44 + (n - 1) * 2)
  return {
    seconds: n / SR,
    bytes: data.length,
    peakDb: linToDb(maxQ / 32767),
    seam: Math.abs(first - last) / 32767,
  }
}
