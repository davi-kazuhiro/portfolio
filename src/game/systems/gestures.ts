// Regras puras dos gestos do quarto (M5): degraus de zoom, limite do pan, toque × arrasto e ponto
// fixo da pinça/roda. Sem Phaser, para poder ser testado isoladamente.
//
// Convenção (a mesma do Phaser com origem 0,5): a câmera desenha o ponto `p` do mundo em
// `view/2 + zoom·(p − centro)` px de tela. Pixels do jogo = px CSS (Scale.RESIZE, sem escala).
import { clampZoom, padRect, snapCenter, type CameraView, type Rect } from './cameraMath'

// Quantos degraus acima do enquadramento a pinça/roda alcança.
export const ZOOM_STEPS_ABOVE = 2
// Toque × arrasto: mais que isso (px CSS) ou mais demorado que isso (ms) não abre objeto.
export const TAP_SLOP = 8
export const TAP_MAX_MS = 500
// Folga (px do mundo) além do retângulo do quarto até onde o pan pode ir.
export const PAN_MARGIN = 8
// Duração da troca de degrau (instantânea com reduced-motion).
export const STEP_DURATION = 150

export interface Point {
  x: number
  y: number
}

// Degraus de zoom alcançáveis pelo visitante: do enquadramento (`base`) até `base + 2`.
export function zoomRange(base: number): { min: number; max: number } {
  const min = clampZoom(base)
  return { min, max: clampZoom(min + ZOOM_STEPS_ABOVE) }
}

// Próximo degrau (`delta` = +1 aproxima, −1 afasta), sempre inteiro e dentro da faixa.
export function stepZoom(current: number, delta: number, base: number): number {
  const { min, max } = zoomRange(base)
  return Math.max(min, Math.min(max, Math.round(current) + Math.sign(delta)))
}

// Degrau da pinça: escala o zoom do início do gesto pela razão entre as distâncias dos dedos e
// arredonda para o inteiro mais próximo dentro da faixa (ex.: zoom 1, dedos 1,5× mais afastados → 2).
export function pinchZoom(startZoom: number, startDist: number, dist: number, base: number): number {
  const { min, max } = zoomRange(base)
  if (startDist <= 0 || dist <= 0) return Math.max(min, Math.min(max, Math.round(startZoom)))
  return Math.max(min, Math.min(max, Math.round((startZoom * dist) / startDist)))
}

// Centro que mantém o ponto do mundo sob `anchor` (px de tela) no mesmo lugar ao ir de `fromZoom`
// para `toZoom`.
export function zoomAround(
  center: Point,
  view: { width: number; height: number },
  fromZoom: number,
  toZoom: number,
  anchor: Point,
): Point {
  const kx = anchor.x - view.width / 2
  const ky = anchor.y - view.height / 2
  return {
    x: center.x + kx / fromZoom - kx / toZoom,
    y: center.y + ky / fromZoom - ky / toZoom,
  }
}

// Ponto do mundo sob `screen` px.
export function screenToWorld(center: Point, view: { width: number; height: number }, zoom: number, screen: Point): Point {
  return { x: center.x + (screen.x - view.width / 2) / zoom, y: center.y + (screen.y - view.height / 2) / zoom }
}

// Limita o centro num eixo: o retângulo `[lo, hi]` do mundo nunca sai da tela. Se ele cabe no
// eixo, fica centralizado; senão a borda da tela não passa da borda do retângulo.
function clampAxis(c: number, lo: number, hi: number, visible: number): number {
  if (hi - lo <= visible) return (lo + hi) / 2
  return Math.max(lo + visible / 2, Math.min(hi - visible / 2, c))
}

// Retângulo que limita o pan: `area` (o quarto inteiro com margem) + PAN_MARGIN.
export function panBounds(area: Rect): Rect {
  return padRect(area, PAN_MARGIN)
}

// Centro limitado a `bounds` e alinhado ao pixel do mundo (snapCenter).
export function clampView(
  view: CameraView,
  screen: { width: number; height: number },
  bounds: Rect,
): CameraView {
  const x = clampAxis(view.x, bounds.x, bounds.x + bounds.width, screen.width / view.zoom)
  const y = clampAxis(view.y, bounds.y, bounds.y + bounds.height, screen.height / view.zoom)
  return {
    zoom: view.zoom,
    x: snapCenter(x, screen.width, view.zoom),
    y: snapCenter(y, screen.height, view.zoom),
  }
}

// Pan com um dedo/mouse só vale acima do enquadramento ou quando o quarto não cabe na tela.
export function canPan(zoom: number, base: number, screen: { width: number; height: number }, area: Rect): boolean {
  return zoom > base || area.width * zoom > screen.width || area.height * zoom > screen.height
}

// Um toque/clique só abre objeto se o dedo quase não andou e foi rápido. `maxMs` = Infinity para
// mouse (clique lento continua valendo).
export function isTap(distance: number, durationMs: number, maxMs = TAP_MAX_MS): boolean {
  return distance < TAP_SLOP && durationMs < maxMs
}

// Distância e ponto médio entre dois dedos.
export function pinchGeometry(a: Point, b: Point): { dist: number; mid: Point } {
  return { dist: Math.hypot(b.x - a.x, b.y - a.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
}

// Lado mínimo da área de toque em px CSS no zoom do enquadramento (dispositivos de toque).
export const TOUCH_TARGET_CSS = 32

// Lado mínimo (px do mundo) do alvo de toque para que tenha TOUCH_TARGET_CSS px no zoom `base`.
export function touchMinHit(base: number): number {
  return Math.ceil(TOUCH_TARGET_CSS / Math.max(1, base))
}
