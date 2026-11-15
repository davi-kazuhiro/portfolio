import { describe, expect, it } from 'vitest'
import { focusZoom, maxZoomFor, MAX_ZOOM, padRect, roomView, snapCenter, topCenterOnScreen, type Rect, type RoomFraming } from '@/game/systems/cameraMath'
import { canvasSize, cssToGame, deviceScaleOf, gameToCss, pointToCss, renderScale, setDeviceScale } from '@/game/systems/deviceScale'
import { worldToScreen, entranceView } from '@/game/systems/entranceMath'
import { exceedsSlop, isTap, pinchZoom, stepZoom, touchMinHit, zoomRange } from '@/game/systems/gestures'

// Mesmo enquadramento de camera-room.test.ts (room-shell 472×386).
const SHELL: Rect = { x: -236, y: -156, width: 472, height: 386 }
const FRAMING: RoomFraming = {
  full: padRect(SHELL, 8),
  safe: { x: SHELL.x, y: -90, width: SHELL.width, height: 270 },
  fit: { x: SHELL.x, y: -90, width: SHELL.width, height: SHELL.y + SHELL.height + 90 },
}

describe('deviceScale.renderScale', () => {
  it('DPR inteiro: jogo continua em px CSS (k = 1)', () => {
    for (const dpr of [1, 2, 3, 4, 2.001]) expect(renderScale(dpr)).toBe(1)
  })
  it('DPR fracionário abaixo de 2: jogo em px do aparelho (k = DPR)', () => {
    expect(renderScale(1.25)).toBe(1.25)
    expect(renderScale(1.5)).toBe(1.5)
    expect(renderScale(1.75)).toBe(1.75)
    expect(renderScale(0.9)).toBe(0.9)
  })
  it('DPR fracionário de celular (≥ 2) e valores inválidos ficam em px CSS', () => {
    for (const dpr of [2.625, 2.75, 3.5, 0, -1, Number.NaN]) expect(renderScale(dpr)).toBe(1)
  })
})

describe('deviceScale: conversão CSS ↔ jogo', () => {
  it('ida e volta', () => {
    expect(cssToGame(8, 1.25)).toBe(10)
    expect(cssToGame(32, 1.5)).toBe(48)
    expect(gameToCss(1920, 1.25)).toBe(1536)
    expect(gameToCss(cssToGame(37, 1.5), 1.5)).toBeCloseTo(37)
  })
  it('k = 1 não muda nada', () => {
    expect(cssToGame(123, 1)).toBe(123)
    expect(pointToCss({ x: 645, y: 291 }, 1)).toEqual({ x: 645, y: 291 })
  })
  it('ponto para a UI: px CSS inteiros', () => {
    expect(pointToCss({ x: 1373, y: 727 }, 1.25)).toEqual({ x: 1098, y: 582 })
    expect(pointToCss({ x: 100, y: 101 }, 1.5)).toEqual({ x: 67, y: 67 })
  })
  it('fator por jogo (1 se nunca gravado)', () => {
    const game = {}
    expect(deviceScaleOf(game)).toBe(1)
    setDeviceScale(game, 1.25)
    expect(deviceScaleOf(game)).toBe(1.25)
  })
})

describe('deviceScale.canvasSize', () => {
  it('k = 1: floor do tamanho CSS (como o Scale.RESIZE + snap do M5)', () => {
    expect(canvasSize(1228.79, 583.59, 1)).toEqual({ width: 1228, height: 583, cssWidth: 1228, cssHeight: 583 })
  })
  it('DPR 1,25: 1536×864 CSS → 1920×1080 px do aparelho', () => {
    expect(canvasSize(1536, 864, 1.25)).toEqual({ width: 1920, height: 1080, cssWidth: 1536, cssHeight: 864 })
  })
  it('DPR 1,5: 1280×720 CSS → 1920×1080; tamanho quebrado arredonda para baixo sem passar do pai', () => {
    expect(canvasSize(1280, 720, 1.5)).toEqual({ width: 1920, height: 1080, cssWidth: 1280, cssHeight: 720 })
    const s = canvasSize(1228.8, 583.2, 1.5)
    expect(s.width).toBe(1843)
    expect(s.height).toBe(874)
    expect(s.cssWidth).toBeLessThanOrEqual(1228.8)
    expect(s.cssHeight).toBeLessThanOrEqual(583.2)
  })
})

describe('degraus e zoom em DPR fracionário', () => {
  it('zoom máximo em px do jogo = 8 px CSS por pixel da arte', () => {
    expect(maxZoomFor(1)).toBe(MAX_ZOOM)
    expect(maxZoomFor(1.25)).toBe(10)
    expect(maxZoomFor(1.5)).toBe(12)
  })
  it('k = 1: faixa igual à do M5', () => {
    expect(zoomRange(3, 1)).toEqual({ min: 3, max: 5 })
    expect(zoomRange(7, 1)).toEqual({ min: 7, max: 8 })
  })
  it('DPR 1,25 (1536×864 CSS = 1920×1080): base 3, degraus 3–6 (2,4 a 4,8 px CSS por pixel)', () => {
    const k = 1.25
    const s = canvasSize(1536, 864, k)
    const view = roomView(s.width, s.height, FRAMING, maxZoomFor(k))
    expect(view.zoom).toBe(3)
    expect(zoomRange(view.zoom, k)).toEqual({ min: 3, max: 6 })
    expect(stepZoom(6, 1, 3, k)).toBe(6)
    expect(stepZoom(3, -1, 3, k)).toBe(3)
    expect(stepZoom(4, 1, 3, k)).toBe(5)
    expect(pinchZoom(3, 100, 400, 3, k)).toBe(6)
  })
  it('DPR 1,5 (1536×864 CSS = 2304×1296): base 4, degraus 4–7', () => {
    const k = 1.5
    const s = canvasSize(1536, 864, k)
    expect(s).toMatchObject({ width: 2304, height: 1296 })
    const view = roomView(s.width, s.height, FRAMING, maxZoomFor(k))
    expect(view.zoom).toBe(4)
    expect(zoomRange(view.zoom, k)).toEqual({ min: 4, max: 7 })
  })
  it('zoom do foco pode passar de 8 em px do jogo, até o máximo convertido', () => {
    const small = { x: 0, y: 0, width: 23, height: 14 }
    expect(focusZoom(1920, 1080, small, 3, maxZoomFor(1.25))).toBe(10)
    expect(focusZoom(1920, 1080, small, 3)).toBe(MAX_ZOOM)
  })
  it('centro alinhado ao pixel do aparelho (snapCenter em px do jogo)', () => {
    const k = 1.5
    const s = canvasSize(1228.8, 583.2, k)
    const view = roomView(s.width, s.height, FRAMING, maxZoomFor(k))
    for (const [c, size] of [
      [view.x, s.width],
      [view.y, s.height],
    ]) {
      expect(Number.isInteger(Math.round((c * view.zoom - size / 2) * 1e6) / 1e6)).toBe(true)
    }
    expect(snapCenter(10.3, 1843, 3) * 3 - 1843 / 2).toBeCloseTo(Math.round(10.3 * 3 - 1843 / 2))
  })
})

describe('gestos medidos em px CSS', () => {
  it('limiar de arrasto: 8 px CSS = 10 px do aparelho a 125%, 12 a 150%', () => {
    expect(exceedsSlop(9.9, 1.25)).toBe(false)
    expect(exceedsSlop(10, 1.25)).toBe(true)
    expect(exceedsSlop(11.9, 1.5)).toBe(false)
    expect(exceedsSlop(12, 1.5)).toBe(true)
    expect(exceedsSlop(8, 1)).toBe(true)
    expect(isTap(9, 100, undefined, 1.25)).toBe(true)
    expect(isTap(9, 100)).toBe(false)
  })
  it('alvo de toque de 32 px CSS no zoom base em px do jogo', () => {
    expect(touchMinHit(3, 1.25)).toBe(14) // 40 px do aparelho / 3
    expect(touchMinHit(4, 1.5)).toBe(12) // 48 / 4
    expect(touchMinHit(2, 1)).toBe(16)
    for (const [z, k] of [
      [3, 1.25],
      [4, 1.5],
      [5, 1.75],
    ]) {
      expect(gameToCss(touchMinHit(z, k) * z, k)).toBeGreaterThanOrEqual(32)
    }
  })
})

describe('posições enviadas à UI continuam em px CSS', () => {
  it('maçaneta da porta: 1536×864 CSS a 125% = mesmo ponto CSS de 1920×1080 a 100%', () => {
    // A 100%, 1920×1080: zoom 6 e ilustração centrada → (1098, 582) (cena.md).
    const v1 = entranceView(1920, 1080)
    const view1 = { x: snapCenter(160, 1920, v1.zoom) - 1920 / 2 / v1.zoom, y: snapCenter(90, 1080, v1.zoom) - 1080 / 2 / v1.zoom }
    expect(worldToScreen({ x: 183, y: 97 }, view1, v1.zoom)).toEqual({ x: 1098, y: 582 })
    // A 125%, o jogo tem os mesmos 1920×1080 px; a UI recebe px CSS (÷ 1,25).
    expect(worldToScreen({ x: 183, y: 97 }, view1, v1.zoom, 1.25)).toEqual({ x: 878, y: 466 })
  })
  it('âncora do object-hover dividida por k', () => {
    const rect = { x: 100, y: 40, width: 40, height: 20 }
    expect(topCenterOnScreen(rect, { x: 90, y: 40 }, 2)).toEqual({ x: 60, y: 0 })
    expect(topCenterOnScreen(rect, { x: 90, y: 30 }, 3, 1.5)).toEqual({ x: 60, y: 20 })
  })
})
