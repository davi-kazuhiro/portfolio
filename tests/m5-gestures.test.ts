import { describe, expect, it } from 'vitest'
import { padRect, roomView, type Rect, type RoomFraming } from '@/game/systems/cameraMath'
import {
  canPan,
  clampView,
  isTap,
  panBounds,
  pinchGeometry,
  pinchZoom,
  screenToWorld,
  stepZoom,
  touchMinHit,
  zoomAround,
  zoomRange,
} from '@/game/systems/gestures'

// Mesmo enquadramento de camera-room.test.ts (room-shell 472×386).
const SHELL: Rect = { x: -236, y: -156, width: 472, height: 386 }
const FRAMING: RoomFraming = {
  full: padRect(SHELL, 8),
  safe: { x: SHELL.x, y: -90, width: SHELL.width, height: 270 },
  fit: { x: SHELL.x, y: -90, width: SHELL.width, height: SHELL.y + SHELL.height + 90 },
}
const BOUNDS = panBounds(FRAMING.full)
const toScreen = (p: number, center: number, view: number, zoom: number) => view / 2 + zoom * (p - center)

describe('gestures: degraus de zoom', () => {
  it('faixa = do enquadramento até base + 2, limitada pelo MAX_ZOOM', () => {
    expect(zoomRange(1)).toEqual({ min: 1, max: 3 })
    expect(zoomRange(3)).toEqual({ min: 3, max: 5 })
    expect(zoomRange(7)).toEqual({ min: 7, max: 8 })
  })

  it('roda: um degrau inteiro por vez, sem sair da faixa', () => {
    expect(stepZoom(1, 1, 1)).toBe(2)
    expect(stepZoom(2, 120, 1)).toBe(3)
    expect(stepZoom(3, 1, 1)).toBe(3)
    expect(stepZoom(3, -1, 1)).toBe(2)
    expect(stepZoom(1, -1, 1)).toBe(1)
  })

  it('pinça: arredonda a razão dos dedos para o degrau inteiro mais próximo', () => {
    expect(pinchZoom(1, 100, 100, 1)).toBe(1)
    expect(pinchZoom(1, 100, 140, 1)).toBe(1)
    expect(pinchZoom(1, 100, 160, 1)).toBe(2)
    expect(pinchZoom(1, 100, 400, 1)).toBe(3)
    expect(pinchZoom(3, 100, 40, 1)).toBe(1)
    expect(pinchZoom(2, 0, 50, 1)).toBe(2)
    for (const d of [10, 77, 133, 250, 999]) expect(Number.isInteger(pinchZoom(2, 100, d, 2))).toBe(true)
  })
})

describe('gestures: ponto fixo', () => {
  it('o ponto do mundo sob a âncora não se move ao trocar de degrau', () => {
    const view = { width: 390, height: 844 }
    const center = { x: 10, y: 20 }
    const anchor = { x: 300, y: 600 }
    const before = screenToWorld(center, view, 1, anchor)
    const c2 = zoomAround(center, view, 1, 3, anchor)
    const after = screenToWorld(c2, view, 3, anchor)
    expect(after.x).toBeCloseTo(before.x, 9)
    expect(after.y).toBeCloseTo(before.y, 9)
  })

  it('âncora no centro da tela não move o centro', () => {
    expect(zoomAround({ x: 5, y: 6 }, { width: 100, height: 80 }, 2, 4, { x: 50, y: 40 })).toEqual({ x: 5, y: 6 })
  })
})

describe('gestures: limite do pan', () => {
  it('o quarto nunca sai da tela (margem de 16 px além do room-shell)', () => {
    const screen = { width: 390, height: 844 }
    const v = clampView({ zoom: 3, x: 9999, y: -9999 }, screen, BOUNDS)
    const right = SHELL.x + SHELL.width + 16
    const top = SHELL.y - 16
    expect(toScreen(right, v.x, screen.width, 3)).toBeGreaterThanOrEqual(screen.width - 1)
    expect(toScreen(top, v.y, screen.height, 3)).toBeLessThanOrEqual(1)
  })

  it('eixo em que o quarto cabe fica centralizado', () => {
    const screen = { width: 1920, height: 1080 }
    const v = clampView({ zoom: 2, x: 300, y: 0 }, screen, BOUNDS)
    expect(Math.abs(v.x - (BOUNDS.x + BOUNDS.width / 2))).toBeLessThan(1)
  })

  it('centro alinhado ao pixel do mundo (sem meio pixel), inclusive com tela ímpar', () => {
    for (const [w, h, z] of [
      [390, 844, 2],
      [768, 1024, 3],
      [1366, 951, 4],
      [375, 667, 1],
    ]) {
      const v = clampView({ zoom: z, x: 12.37, y: -3.71 }, { width: w, height: h }, BOUNDS)
      expect(Number.isInteger(z * v.x - w / 2)).toBe(true)
      expect(Number.isInteger(z * v.y - h / 2)).toBe(true)
    }
  })

  it('enquadramento padrão já respeita o limite', () => {
    for (const [w, h] of [
      [390, 844],
      [768, 1024],
      [1920, 1080],
      [375, 667],
    ]) {
      const base = roomView(w, h, FRAMING)
      const v = clampView(base, { width: w, height: h }, BOUNDS)
      expect(Math.abs(v.x - base.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(v.y - base.y)).toBeLessThanOrEqual(1)
    }
  })

  it('pan só acima do enquadramento ou com o quarto maior que a tela', () => {
    expect(canPan(2, 2, { width: 1920, height: 1080 }, FRAMING.full)).toBe(false)
    expect(canPan(3, 2, { width: 1920, height: 1080 }, FRAMING.full)).toBe(true)
    expect(canPan(1, 1, { width: 375, height: 667 }, FRAMING.full)).toBe(true)
  })
})

describe('gestures: toque × arrasto', () => {
  it('toque abre só se andou < 8 px e durou < 500 ms', () => {
    expect(isTap(0, 100)).toBe(true)
    expect(isTap(7.9, 499)).toBe(true)
    expect(isTap(8, 100)).toBe(false)
    expect(isTap(2, 500)).toBe(false)
  })

  it('mouse: sem limite de tempo', () => {
    expect(isTap(2, 3000, Infinity)).toBe(true)
    expect(isTap(9, 10, Infinity)).toBe(false)
  })

  it('geometria da pinça', () => {
    expect(pinchGeometry({ x: 0, y: 0 }, { x: 30, y: 40 })).toEqual({ dist: 50, mid: { x: 15, y: 20 } })
  })

  it('alvo de toque de 32 px CSS no zoom base', () => {
    expect(touchMinHit(1)).toBe(32)
    expect(touchMinHit(2)).toBe(16)
    expect(touchMinHit(3)).toBe(11)
    for (const z of [1, 2, 3, 4, 5]) expect(touchMinHit(z) * z).toBeGreaterThanOrEqual(32)
  })
})
