// Sangria da visão de perto: onde a ilustração não alcança a borda da janela, a última linha
// (ou coluna) da arte é esticada até a borda. Cada faixa é um <div> com o PNG de fundo ampliado
// por inteiro no eixo da borda (escala `s`) e esticado no outro eixo; com `image-rendering:
// pixelated` uma linha de 1 px esticada é a mesma cor repetida, sem borrão. Função pura.
import type { CSSProperties } from 'react'
import type { Sides } from './layout'

export interface BleedSource {
  /** Imagem e tamanho do PNG inteiro (px a 1×). */
  image: string
  sheet: { w: number; h: number }
  /** Região do PNG desenhada (px a 1×): o frame ou parte dele. */
  sx: number
  sy: number
  w: number
  h: number
}

export interface BleedStrip {
  key: string
  style: CSSProperties
}

/**
 * Faixas de sangria sintética em volta de uma região desenhada em `(x, y)` (px CSS) com escala
 * `s`. `ext` = quanto estender de cada lado (px CSS, 0 = nada). A borda externa da sangria real
 * não tem contorno (specs.md §3), então a última linha/coluna é a amostrada.
 */
export function bleedStrips(src: BleedSource, s: number, x: number, y: number, ext: Sides): BleedStrip[] {
  const { sheet, sx, sy, w, h } = src
  // Linha/coluna amostrada em cada lado (px do PNG).
  const rowT = sy
  const rowB = sy + h - 1
  const colL = sx
  const colR = sx + w - 1
  const W = w * s
  const H = h * s
  // Um trecho do PNG começando em (px, py), com escala kx × ky, num retângulo da tela.
  const strip = (key: string, left: number, top: number, width: number, height: number, px: number, py: number, kx: number, ky: number): BleedStrip => ({
    key,
    style: {
      left,
      top,
      width,
      height,
      backgroundImage: `url("${src.image}")`,
      backgroundSize: `${sheet.w * kx}px ${sheet.h * ky}px`,
      backgroundPosition: `${-px * kx}px ${-py * ky}px`,
    },
  })
  const out: BleedStrip[] = []
  const { top: t, right: r, bottom: b, left: l } = ext
  if (t > 0) out.push(strip('t', x, y - t, W, t, sx, rowT, s, t))
  if (b > 0) out.push(strip('b', x, y + H, W, b, sx, rowB, s, b))
  if (l > 0) out.push(strip('l', x - l, y, l, H, colL, sy, l, s))
  if (r > 0) out.push(strip('r', x + W, y, r, H, colR, sy, r, s))
  if (t > 0 && l > 0) out.push(strip('tl', x - l, y - t, l, t, colL, rowT, l, t))
  if (t > 0 && r > 0) out.push(strip('tr', x + W, y - t, r, t, colR, rowT, r, t))
  if (b > 0 && l > 0) out.push(strip('bl', x - l, y + H, l, b, colL, rowB, l, b))
  if (b > 0 && r > 0) out.push(strip('br', x + W, y + H, r, b, colR, rowB, r, b))
  return out
}
