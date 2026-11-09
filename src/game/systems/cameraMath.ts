// Contas puras da câmera (sem Phaser), para poderem ser testadas isoladamente.

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 8

// Fração da tela que o objeto em foco deve ocupar (no máximo) depois do zoom.
export const FOCUS_FILL = 0.6

// Maior zoom inteiro em que `rect` cabe na viewport ocupando no máximo `fill` dela.
export function fitZoom(viewW: number, viewH: number, rect: Rect, fill = 1): number {
  if (rect.width <= 0 || rect.height <= 0) return MIN_ZOOM
  const z = Math.floor(Math.min((viewW * fill) / rect.width, (viewH * fill) / rect.height))
  return clampZoom(z)
}

// Zoom do foco: sempre inteiro e sempre pelo menos 1 nível acima da visão do quarto.
export function focusZoom(viewW: number, viewH: number, rect: Rect, roomZoom: number): number {
  return clampZoom(Math.max(roomZoom + 1, fitZoom(viewW, viewH, rect, FOCUS_FILL)))
}

export function clampZoom(z: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.floor(z)))
}

export function rectCenter(rect: Rect) {
  return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) }
}

export function padRect(rect: Rect, pad: number): Rect {
  return { x: rect.x - pad, y: rect.y - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
}

export function rectUnion(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  }
}

// Enquadramento do quarto (docs/arte/planta-do-quarto.md, tabela de zoom):
// - `full`: o quarto inteiro (room-shell + margem);
// - `safe`: o que nunca pode ser cortado — largura inteira do quarto e, na vertical, do topo do
//   interagível mais alto (ou da linha de segurança das paredes) até o pé do mais baixo;
// - `fit` (opcional, padrão `safe`): o que decide o zoom — do mesmo topo até o fim do piso. Assim
//   o zoom não sobe só porque a ponta do piso pode ser cortada.
export interface RoomFraming {
  full: Rect
  safe: Rect
  fit?: Rect
}

export interface CameraView {
  zoom: number
  x: number
  y: number
}

// Visão do quarto: o maior zoom inteiro em que `fit` cabe. A câmera mira o centro do quarto
// inteiro, então o que sobra é cortado por igual em cima e embaixo; só se esse corte pegar a área
// segura a câmera desliza o mínimo para mantê-la inteira. Se nem `safe` cabe na altura (zoom 1 em
// tela muito baixa), centraliza no `safe`. Centro alinhado ao pixel (snapCenter).
export function roomView(viewW: number, viewH: number, framing: RoomFraming): CameraView {
  const { full, safe } = framing
  const zoom = fitZoom(viewW, viewH, framing.fit ?? safe)
  const visibleH = viewH / zoom
  const x = full.x + full.width / 2
  let y = full.y + full.height / 2
  if (full.height > visibleH) {
    if (safe.height <= visibleH) {
      const minY = safe.y + safe.height - visibleH / 2 // fim da área segura na borda de baixo
      const maxY = safe.y + visibleH / 2 // topo da área segura na borda de cima
      y = Math.min(maxY, Math.max(minY, y))
    } else y = safe.y + safe.height / 2
  }
  return { zoom, x: snapCenter(x, viewW, zoom), y: snapCenter(y, viewH, zoom) }
}

// Centro da câmera que faz todo pixel inteiro do mundo cair em pixel inteiro da tela.
// A câmera desenha o ponto p em `view/2 + zoom·(p − centro)`; com `view` ímpar (ex.: 951 px),
// centrar num inteiro deixaria tudo a meio pixel. Escolhe o centro mais próximo de `c` em que
// `zoom·centro − view/2` é inteiro.
export function snapCenter(c: number, view: number, zoom: number): number {
  return (Math.round(c * zoom - view / 2) + view / 2) / zoom
}
