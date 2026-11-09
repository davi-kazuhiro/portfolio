import { describe, expect, it } from 'vitest'
import {
  fitZoom,
  padRect,
  rectUnion,
  roomView,
  snapCenter,
  type Rect,
  type RoomFraming,
} from '@/game/systems/cameraMath'

// Enquadramento parecido com o real (Room.framing): room-shell 472×386 com âncora em (236, 156),
// margem de 8 px; área segura do topo das paredes (−90) até o pé do interagível mais baixo (180),
// acima da ponta do piso (230).
const SHELL: Rect = { x: -236, y: -156, width: 472, height: 386 }
const FRAMING: RoomFraming = {
  full: padRect(SHELL, 8),
  safe: { x: SHELL.x, y: -90, width: SHELL.width, height: 180 + 90 },
  fit: { x: SHELL.x, y: -90, width: SHELL.width, height: SHELL.y + SHELL.height + 90 },
}

// Tela → mundo: a câmera desenha p em view/2 + zoom·(p − centro).
const toScreen = (p: number, center: number, view: number, zoom: number) => view / 2 + zoom * (p - center)

describe('cameraMath.rectUnion', () => {
  it('menor retângulo que contém os dois', () => {
    expect(rectUnion({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: -5, width: 10, height: 4 })).toEqual({
      x: 0,
      y: -5,
      width: 15,
      height: 15,
    })
  })
  it('um dentro do outro devolve o maior', () => {
    const big = { x: -10, y: -10, width: 40, height: 40 }
    expect(rectUnion(big, { x: 0, y: 0, width: 5, height: 5 })).toEqual(big)
    expect(rectUnion({ x: 0, y: 0, width: 5, height: 5 }, big)).toEqual(big)
  })
  it('separados e comutativo', () => {
    const a = { x: 0, y: 0, width: 2, height: 2 }
    const b = { x: 10, y: 20, width: 2, height: 2 }
    expect(rectUnion(a, b)).toEqual({ x: 0, y: 0, width: 12, height: 22 })
    expect(rectUnion(b, a)).toEqual(rectUnion(a, b))
  })
})

describe('cameraMath.snapCenter', () => {
  it('view par e zoom 1: centro inteiro fica como está', () => {
    expect(snapCenter(10, 800, 1)).toBe(10)
    expect(snapCenter(0, 1920, 2)).toBe(0)
  })
  it('view ímpar: desloca meio pixel de tela', () => {
    // zoom 2, view 951: 2·c − 475,5 tem que ser inteiro → c = 0,25
    expect(snapCenter(0, 951, 2)).toBe(0.25)
  })
  it('zoom·centro − view/2 é sempre inteiro e o desvio é ≤ meio pixel de tela', () => {
    for (const view of [360, 375, 593, 768, 951, 1366, 1537]) {
      for (const zoom of [1, 2, 3, 4, 5]) {
        for (const c of [-37.3, 0, 12.5, 55.5, 101.9]) {
          const s = snapCenter(c, view, zoom)
          const off = s * zoom - view / 2
          expect(Math.abs(off - Math.round(off)), `view ${view} zoom ${zoom} c ${c}`).toBeLessThan(1e-9)
          expect(Math.abs(s - c) * zoom).toBeLessThanOrEqual(0.5 + 1e-9)
        }
      }
    }
  })
  it('pixel inteiro do mundo cai em pixel inteiro da tela', () => {
    const s = snapCenter(3, 951, 3)
    for (const p of [-200, -1, 0, 7, 150]) {
      const x = toScreen(p, s, 951, 3)
      expect(Math.abs(x - Math.round(x))).toBeLessThan(1e-9)
    }
  })
})

describe('cameraMath.roomView', () => {
  it('1920×950: zoom 2, quarto inteiro centralizado (planta do quarto)', () => {
    const v = roomView(1920, 950, FRAMING)
    expect(v.zoom).toBe(2)
    const { full } = FRAMING
    expect(v.x).toBe(full.x + full.width / 2)
    expect(v.y).toBe(full.y + full.height / 2)
  })

  it('1536×730: zoom 2 com recorte dividido entre cima e embaixo; área segura visível', () => {
    const v = roomView(1536, 730, FRAMING)
    expect(v.zoom).toBe(2)
    const visibleH = 730 / v.zoom
    const top = v.y - visibleH / 2
    const bottom = v.y + visibleH / 2
    const { full, safe } = FRAMING
    expect(top).toBeGreaterThan(full.y) // cortou um pouco em cima
    expect(bottom).toBeLessThan(full.y + full.height) // e um pouco embaixo
    expect(top).toBeLessThanOrEqual(safe.y + 0.5) // nunca a área segura
    expect(bottom).toBeGreaterThanOrEqual(safe.y + safe.height - 0.5)
  })

  it('centraliza no quarto inteiro quando o corte simétrico não pega a área segura', () => {
    const v = roomView(1536, 730, FRAMING)
    const { full } = FRAMING
    expect(Math.abs(v.y - (full.y + full.height / 2)) * v.zoom).toBeLessThanOrEqual(0.5)
  })

  it('tela muito baixa (nem a área segura cabe): zoom 1 centrado na área segura', () => {
    const v = roomView(400, 200, FRAMING)
    expect(v.zoom).toBe(1)
    expect(v.y).toBe(FRAMING.safe.y + FRAMING.safe.height / 2)
  })

  it('zoom é o maior inteiro em que a área de ajuste (até o fim do piso) cabe', () => {
    for (const [w, h] of [[360, 740], [375, 812], [768, 1024], [1280, 720], [1366, 657], [1920, 950], [2560, 1300]]) {
      expect(roomView(w, h, FRAMING).zoom, `${w}×${h}`).toBe(fitZoom(w, h, FRAMING.fit!))
    }
  })

  it('largura inteira do quarto sempre visível e centro sempre alinhado ao pixel', () => {
    for (const [w, h] of [[360, 740], [593, 566], [951, 601], [1280, 720], [1366, 657], [1537, 731], [1920, 950]]) {
      const v = roomView(w, h, FRAMING)
      expect(Number.isInteger(v.zoom)).toBe(true)
      const halfW = w / v.zoom / 2
      if (FRAMING.safe.width <= w / v.zoom) {
        expect(v.x - halfW).toBeLessThanOrEqual(FRAMING.safe.x + 0.5)
        expect(v.x + halfW).toBeGreaterThanOrEqual(FRAMING.safe.x + FRAMING.safe.width - 0.5)
      }
      for (const [c, view] of [[v.x, w], [v.y, h]]) {
        const off = c * v.zoom - view / 2
        expect(Math.abs(off - Math.round(off)), `${w}×${h}`).toBeLessThan(1e-9)
      }
    }
  })
})
