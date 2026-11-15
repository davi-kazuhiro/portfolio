# ADR 0010 — Escala com DPR fracionário e fallback sem WebGL

- **Status:** aceito (2026-11-14)

## Contexto
Até o M5 o canvas tinha o tamanho em px CSS (`Scale.RESIZE` + snap) e o navegador o ampliava pelo `devicePixelRatio`. Com DPR fracionário (Windows a 125%/150%, zoom do navegador), um zoom inteiro em px CSS vira um número quebrado de px do aparelho: a 125% e zoom 2, cada pixel da arte ocupava 2 ou 3 px da tela, alternando (análise em `arquitetura/cena.md`, "M5 – performance"). Além disso, o build enxuto (ADR 0009) só tem renderer WebGL: sem WebGL o Phaser falhava e o quarto não aparecia.

## Decisão
- **Fator `k`** (`src/game/systems/deviceScale.ts`, `renderScale(dpr)`): `k = dpr` quando o DPR não é inteiro **e é menor que 2**; senão `k = 1` (jogo em px CSS, idêntico ao M5). DPR fracionário de celular (2,625, 2,75) fica com `k = 1`: lá a diferença de 1 px do aparelho não se vê, e mudar para px do aparelho encolheria o quarto no telefone (zoom 2 em px do aparelho, sem pan) e quase dobraria a área desenhada.
- **Canvas feito à mão**: `Scale.NONE`; `config.ts` mede o pai (ResizeObserver) e observa o DPR (`matchMedia('(resolution: Xdppx)')`), põe o backing store em `floor(css × k)` px e o estilo em `jogo / k` px CSS, e chama `scale.resize`, que emite o mesmo RESIZE de antes. O Phaser converte o ponteiro pelo `displayScale` (= `k`). Câmera, `roomView`, `snapCenter` e pan trabalham no tamanho do jogo, então zoom inteiro e centro alinhado ao pixel passam a valer em px do aparelho.
- **Uma conversão** (`cssToGame`/`gameToCss`) para tudo que é definido em px CSS: degraus acima do enquadramento (`round(2k)`), zoom máximo (`floor(8k)`), alvo de toque de 32 px CSS, limiar de arrasto de 8 px CSS, e as posições que vão à UI (`door-hover`, âncora do `object-hover`), que continuam em px CSS.
- **Sem WebGL**: `createGame` testa um contexto WebGL antes de criar o jogo (e captura falha do construtor); sem ele não cria o Phaser, marca o pai com `data-renderer="unavailable"` e emite `renderer-unavailable` (setTimeout 0, depois dos efeitos do React).

## Consequências
- A 125% (1536×864 CSS = 1920×1080 físico), o quarto abre com zoom 3 em px do aparelho (2,4 px CSS por pixel da arte), degraus 3–6; a 150%, 2304×1296, zoom 4, degraus 4–7. Os enquadramentos em px CSS deixam de ser múltiplos inteiros (2,4; 2,67…), mas na tela cada pixel da arte é um quadrado uniforme.
- Mais pixels a desenhar com `k > 1` (1,56× a 125%, 2,25× a 150%), o mesmo que uma tela nativa dessa resolução.
- Com DPR 1, 2 e 3 nada muda (mesmo tamanho de jogo, mesmas contas). Pode haver um RESIZE extra do próprio `ScaleManager` (ele ainda observa o pai em `NONE`); o resultado final é o mesmo.
- A UI precisa tratar `renderer-unavailable` (imagem estática + menu visível); o fallback de `requestOpen` já abre os painéis sem cena.
