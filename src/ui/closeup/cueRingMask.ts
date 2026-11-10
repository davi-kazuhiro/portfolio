// Anel branco de "dá para clicar" das visões de perto: 1 px por fora da silhueta do frame
// (4-vizinhança), igual ao anel do quarto (src/game/systems/outline.ts). Gerado do alfa do
// próprio frame, então não precisa de frame desenhado no atlas. O pulso é do CSS
// (`.interact-cue`), com o mesmo ritmo do quarto.
import { useEffect, useState } from 'react'
import type { AtlasFrame, SpriteAtlas } from './atlas'

/** Cor do anel (= `PALETTE.cue` do canvas). Branco puro: efeito de interface, não sprite. */
export const CUE_COLOR: readonly [number, number, number] = [255, 255, 255]
/** Borda opcional por fora do anel (= `outline`, #2a1b2a), para fundos claros (tela do celular). */
export const CUE_EDGE_COLOR: readonly [number, number, number] = [0x2a, 0x1b, 0x2a]

/**
 * Máscara do anel: entrada = alfa do frame (w×h, um byte por pixel, >0 = opaco); saída =
 * (w+2)×(h+2), 1 onde o pixel é vazio e tem vizinho opaco em cima/baixo/esquerda/direita.
 */
export function ringMask(alpha: ArrayLike<number>, w: number, h: number): Uint8Array {
  const ow = w + 2
  const oh = h + 2
  const out = new Uint8Array(ow * oh)
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && alpha[y * w + x] > 0
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const ix = x - 1
      const iy = y - 1
      if (solid(ix, iy)) continue
      if (solid(ix - 1, iy) || solid(ix + 1, iy) || solid(ix, iy - 1) || solid(ix, iy + 1)) out[y * ow + x] = 1
    }
  }
  return out
}

/**
 * Pixels do anel com folga `pad` (1, ou 2 com borda) em cada lado: 0 = vazio, 1 = anel branco,
 * 2 = borda escura (1 px por fora do anel, também em 4-vizinhança).
 */
export function cuePixels(alpha: ArrayLike<number>, w: number, h: number, edge: boolean) {
  const ring = ringMask(alpha, w, h)
  if (!edge) return { pad: 1, width: w + 2, height: h + 2, data: ring }
  const iw = w + 2
  const ih = h + 2
  const solid = new Uint8Array(iw * ih)
  for (let y = 0; y < ih; y++) {
    for (let x = 0; x < iw; x++) {
      const inside = x >= 1 && y >= 1 && x <= w && y <= h && alpha[(y - 1) * w + x - 1] > 0
      solid[y * iw + x] = inside || ring[y * iw + x] ? 1 : 0
    }
  }
  const outer = ringMask(solid, iw, ih)
  const data = new Uint8Array((w + 4) * (h + 4))
  for (let y = 0; y < h + 4; y++) {
    for (let x = 0; x < w + 4; x++) {
      const i = y * (w + 4) + x
      if (outer[i]) data[i] = 2
      else if (x >= 1 && y >= 1 && x <= iw && y <= ih && ring[(y - 1) * iw + x - 1]) data[i] = 1
    }
  }
  return { pad: 2, width: w + 4, height: h + 4, data }
}

const images = new Map<string, Promise<HTMLImageElement>>()
const rings = new Map<string, Promise<string | null>>()

function loadImage(url: string) {
  let p = images.get(url)
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`cueRing: falha ao carregar ${url}`))
      img.src = url
    })
    images.set(url, p)
  }
  return p
}

async function buildRing(image: string, f: AtlasFrame, edge: boolean): Promise<string | null> {
  const img = await loadImage(image)
  const src = document.createElement('canvas')
  src.width = f.w
  src.height = f.h
  const sctx = src.getContext('2d', { willReadFrequently: true })
  if (!sctx) return null
  sctx.drawImage(img, f.sx, f.sy, f.w, f.h, 0, 0, f.w, f.h)
  const px = sctx.getImageData(0, 0, f.w, f.h).data
  const alpha = new Uint8Array(f.w * f.h)
  for (let i = 0; i < alpha.length; i++) alpha[i] = px[i * 4 + 3]
  const ring = cuePixels(alpha, f.w, f.h, edge)

  const out = document.createElement('canvas')
  out.width = ring.width
  out.height = ring.height
  const octx = out.getContext('2d')
  if (!octx) return null
  const data = octx.createImageData(out.width, out.height)
  for (let i = 0; i < ring.data.length; i++) {
    if (!ring.data[i]) continue
    data.data.set([...(ring.data[i] === 1 ? CUE_COLOR : CUE_EDGE_COLOR), 255], i * 4)
  }
  octx.putImageData(data, 0, 0)
  return out.toDataURL('image/png')
}

/**
 * Data URL do anel do frame (cache por imagem + região + borda); `null` enquanto gera ou se
 * falhar. A imagem tem `edge ? 2 : 1` px de folga em cada lado.
 */
export function useCueRing(atlas: SpriteAtlas, frame: string, edge = false): string | null {
  const f = atlas.frames[frame]
  const key = f ? `${atlas.image}#${f.sx},${f.sy},${f.w},${f.h}${edge ? '+edge' : ''}` : null
  const [ring, setRing] = useState<{ key: string; url: string | null } | null>(null)

  useEffect(() => {
    if (!key || !f) return
    let alive = true
    let p = rings.get(key)
    if (!p) {
      p = buildRing(atlas.image, f, edge).catch(() => null)
      rings.set(key, p)
    }
    void p.then((url) => {
      if (alive) setRing({ key, url })
    })
    return () => {
      alive = false
    }
  }, [key, atlas.image, f, edge])

  return ring && ring.key === key ? ring.url : null
}
