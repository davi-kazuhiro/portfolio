// Escala px CSS ↔ px do jogo (M6, ADR 0010). Sem Phaser: testável no Vitest.
//
// Com devicePixelRatio inteiro (1, 2, 3) o jogo continua em px CSS e o navegador amplia o canvas
// por um fator inteiro: nada muda em relação ao M5. Com DPR fracionário abaixo de 2 (1,25, 1,5,
// 1,75 — Windows com escala de tela, zoom do navegador), um zoom inteiro em px CSS vira um número
// quebrado de px do aparelho (2 × 1,25 = 2,5: colunas de 2 e 3 px). Nesse caso o canvas, o jogo e
// a câmera passam a trabalhar em px do aparelho, com zoom inteiro em px do aparelho: cada pixel da
// arte vira um quadrado uniforme de `zoom` px do aparelho.
//
// `k` = px do jogo por px CSS (1 ou o DPR). Toda medida pensada em px CSS (alvo de toque, limiar
// de arrasto, posições enviadas à UI) passa por `cssToGame`/`gameToCss`; o resto da câmera já
// trabalha no tamanho do jogo e não precisa saber de `k`.

// Acima disso o DPR fracionário (2,625, 2,75 em celulares) fica em px CSS: a irregularidade de
// 1 px do aparelho some na densidade do celular, e o enquadramento do quarto no telefone muda
// muito (zoom 2 em px do aparelho = quarto pequeno, sem pan) e a área a desenhar quase dobra.
export const DEVICE_SCALE_MAX_DPR = 2

// Fator de escala do jogo para um devicePixelRatio. 1 = jogo em px CSS (comportamento do M5).
export function renderScale(dpr: number): number {
  if (!Number.isFinite(dpr) || dpr <= 0) return 1
  if (Math.abs(dpr - Math.round(dpr)) < 0.01) return 1
  return dpr < DEVICE_SCALE_MAX_DPR ? dpr : 1
}

// A única conversão de medidas: px CSS → px do jogo e de volta.
export function cssToGame(css: number, k: number): number {
  return css * k
}

export function gameToCss(game: number, k: number): number {
  return game / k
}

// Ponto em px do jogo → px CSS inteiros (o que vai para a UI pelo EventBus).
export function pointToCss(p: { x: number; y: number }, k: number): { x: number; y: number } {
  return { x: Math.round(gameToCss(p.x, k)), y: Math.round(gameToCss(p.y, k)) }
}

// Tamanho do jogo (= backing store do canvas, inteiro) e tamanho CSS do canvas para um pai de
// `cssW × cssH` px CSS. Com k = 1 é o `floor` do Scale.RESIZE + snap do M5. Com k fracionário, o
// jogo tem `floor(css × k)` px e o canvas `jogo / k` px CSS: 1 px do jogo = 1 px do aparelho.
export function canvasSize(cssW: number, cssH: number, k: number) {
  const fit = (css: number) => Math.max(1, k === 1 ? Math.floor(css) : Math.floor(cssToGame(css, k) + 1e-6))
  const width = fit(cssW)
  const height = fit(cssH)
  return { width, height, cssWidth: gameToCss(width, k), cssHeight: gameToCss(height, k) }
}

// Fator atual de cada jogo (gravado pelo config.ts a cada resize; 1 se nunca gravado).
const scales = new WeakMap<object, number>()

export function setDeviceScale(game: object, k: number) {
  scales.set(game, k)
}

export function deviceScaleOf(game: object): number {
  return scales.get(game) ?? 1
}
