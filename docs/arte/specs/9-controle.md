# 9. Controle de videogame (M3): aprovado e exportado (2026-11-10)

> Parte das [specs de sprites](../specs.md). Convenções de coordenadas e unidades estão lá. Visão de perto segue a §3 ["Tela cheia"](3-closeup-computador.md#tela-cheia-regra-cover--sangria-real-2026-11-08).

> **Sprite do quarto aprovado pelo Davi em 2026-11-10, como está.** A visão de perto foi **revisada** com o mesmo layout do headset (§8): fundo simples, controle grande em 3D no meio-esquerda, caixa do jogo flutuando no meio-direita com legenda e setas ◀ ▶. As variações anteriores (A, estante de cartuchos + manual; B, menu na TV) foram descartadas. Único ajuste do Davi: o controle subiu até o centro dele ficar alinhado com o da caixa. **Aprovado e exportado pelo `pnpm art`** (ver "Arquivos exportados").
>
> Mesmos geradores do headset: `tools/art/scenes/desk-items.mjs`, `tools/art/scenes/closeup-desk-items.mjs` e `tools/art/build-desk-items.mjs`. Prévia: `art-src/previews/m3-controller-closeup.png` (dia, com sangria; a legenda é **simulação** do DOM).
>
> Paleta: alfa 0/255 e as 48 cores, de dia e de noite (no que fica nas cores de dia). **Nenhuma cor nova.**

## Conteúdo
Os jogos que o Davi joga (5, conteúdo real desde 2026-11-12). **Direitos:** nada de capa, sprite oficial ou logo rasterizado; cada jogo é representado por um ícone desenhado à mão por código. Nenhuma marca de console nem de loja.

Contrato de `src/content/{pt,en}/games.json`: `id`, `title`, `genre`, `platform` (opcional), `hours` (opcional), `note` e **`icon`** (revisão de 2026-11-12): um de `valorant-v`, `grass-block` (apelido `dirt-block`), `soccer-ball`, `pokeball`, `mushroom`. O build falha com ícone desconhecido. `cover` e `coverText` não são mais usados nos jogos. Na visão de perto aparecem só `title` e `genre` (legenda).

> **Decisão do Davi (2026-11-12, "usar os símbolos"):** o V do Valorant, a pokébola e o cogumelo do Mario com olhos são desenhados como homenagem, em uso referencial num portfolio pessoal e não comercial. O `art-director` recusou (a regra dele veta assets com marca registrada), e os três foram desenhados pela orquestradora em `tools/art/scenes/closeup-desk-items.mjs`, à mão e sem copiar sprite oficial nem rasterizar logo. Se o portfolio virar uso comercial, rever.

**Ícones:** bloco de grama e bola de futebol são formas genéricas; o V do Valorant, a pokébola e o cogumelo com olhos são as homenagens da decisão acima.

## Sprite do quarto (`objects/controller`)
Mesmo desenho e posição de quando era parte do `computer` (`controllerObject` em `tools/art/scenes/computer.mjs`): deitado no canto do braço A, na frente da caneca. A caixa antiga da §1 (`[3, 9, 7, 10.5, 16, 17.2]`) já estava desatualizada; vale a do gerador:

| | Valor |
|---|---|
| Caixa (unidades) | ≈ `[3, 9.5, 7.9, 10.9, 16, 17.6]`: corpo `[4.4, 8.1, 8.7, 10.3, 16, 17]`, punhos cilindro `(4.4, 9.5)` e `(8.1, 9.5)` r 1,35 até z 17,2, ombro `[5.4, 7.2, 7.9, 8.7, 16.3, 17.6]` |
| Tokens | corpo `wall-4`/`wall-2`/`wall-0` com aresta `wall-5`; punhos `wall-5` com anel `wall-2`; ombro `sky-1`/`blue-1`/`blue-0`; direcional `leaf-1`/`leaf-0`; botões `pink`, `sky-0`, `red-2`, `gold-1`; select/start `gold-2` |
| Silhueta | 30×17 px; na tela do quarto `x 208, y 146` |
| Canvas exportado | **34×21** (2 px de margem), âncora do `computer` **(30, 76)**, abaixo do frame, pivot (0,8824; 3,619) |
| `meta.quartoPixel` | `tile [2, 2]`, `mount: "surface"`, `surfaceOf: "computer"`, `depthOffset: 0.01`, `hit: "alpha"`, `minHit: [24, 24]`, `focus: [2, 2, 30, 17]` |
| Frames | `idle` (1 frame) |
| Noite | sem camada de luz: o controle fica fora do brilho do monitor e da poça da luminária (0 px do `light-computer`) |

### Conferido pelo build
- `computer` sem os dois + os dois = `computer` de hoje, pixel a pixel; o retângulo do `computer` não muda.
- 0 px (nem do anel de hover) sobre `computer-hit`, `journal`, luminária, cadeira, gabinete, prateleira e quadros. O `minHit` 24×24 (`x 211, y 143` no quarto) também não toca nenhum deles. A caneca e o teclado ficam por perto, mas são decoração do `computer` sem clique.

## Visão de perto (`ui/closeup-controller`): revisão de 2026-11-10
320×180 + sangria 80/64 (480×308), âncora (0, 0), escala inteira, mínimo 3×. **Mesmo layout do headset** ([§8](8-headset.md)): o palco do meio-direita (sombra, legenda, setas, flutuação de 4 px) tem os mesmos rects, para a UI usar um componente só.

### Fundo (equivalente ao do headset, no canto do quarto)
| Elemento | Rect / posição | Tokens |
|---|---|---|
| Parede esquerda | `x < 26` (inclusive a sangria), listras de 4 px; quina `wall-0` em `x 26` | `wall-4`/`wall-3` |
| Parede do fundo | `x ≥ 27`, acima de `y 132`; listras de 8 px; oclusão `wall-0` em `y 131` | `wall-2`/`wall-1`; a partir de `x 236`, `wall-4`/`wall-3` |
| Tampo | igual ao §8 (fundo `y 132`, aresta da frente `y 170`) | `wood-*`, `mauve-0` |

Sem janela, cortina, TV, cartuchos nem manual.

### Objeto 3D (meio-esquerda)
| | Valor |
|---|---|
| Rect | **`15, 40, 150, 63`** (centro `(90, 71,5)`, alinhado ao centro vertical da caixa do jogo; ajuste do Davi, 2026-11-10). Suspenso acima do tampo, como objeto em exibição, visto de cima e de frente (≈47°), girado ≈13°. Frame `object/day` / `object/night`. **Flutua** (revisão de 2026-11-10): 4 px, período 1,8 s, defasado meio ciclo da caixa (`phaseMs 1800`; animação alternate, ciclo de 3,6 s) |
| Modelo | o mesmo controle do quarto: corpo com dois punhos ovais (união suave), direcional em cruz no punho esquerdo, 4 botões redondos em losango no direito, select/start no meio, dois botões de ombro atrás. Mesmo renderizador do headset (SDF, luz de cima à esquerda, contorno por fora e nas quebras de profundidade) |
| Tokens | corpo `graphite-3`→`wall-0`, `wall-2`, `wall-4`, `wall-5`; anel em volta da tampa dos punhos `wall-0…2`; direcional `leaf-0/1/2`; botões `red-1/pink/cream-3`, `blue-0/sky-0/sky-2`, `red-0/red-2/red-3`, `gold-0/gold-1/gold-3`; select/start `gold-0/2/3`; ombros `blue-0/blue-1/sky-1` |
| Sombra no tampo (parada, no fundo) | elipse, centro `(90, 148)`, raios 58×6, na mesma linha da sombra da caixa (objeto suspenso, não sombra de contato) | `wood-5`, miolo `wood-4` |
| Interação | nenhuma |

### Palco do jogo (meio-direita)
| Elemento | Rect `[x, y, w, h]` | Tokens / notas |
|---|---|---|
| **Ícone do jogo (palco)** | **`208, 43, 56, 56`** (`stage.front`; quadrado centrado no ponto da antiga caixa) | desenhado à mão, sem texto; luz de cima à esquerda, contorno `outline`. `valorant-v`: haste esquerda longa + triângulo à direita, `red-1/2/3`, extrusão 3 px `red-0`; `grass-block`: cubo isométrico, topo `leaf-0/1/2`, lados `wood-*` com franja de grama; `soccer-ball`: esfera `cream-0…3` com gomos `outline`/`graphite-*`; `pokeball`: esfera, metade de cima `red-0…3`, de baixo `cream-0…3`, faixa e anel do botão `outline`, botão `cream-2/3`; `mushroom`: chapéu `red-0…3` com pintas `cream-1/3`, Super Cogumelo pela referência do Davi (2026-11-12): silhueta quase circular `red-0…3`, pinta grande no alto e meias pintas nas laterais `cream-1/2/3`, rosto creme largo de base reta com dois olhos altos `outline` (brilho `cream-3`), contorno interno `outline`; desenhado na nossa escala, sem copiar a imagem pixel a pixel |
| Rects por ícone (frame `item/<id>`, contorno por dentro) | `valorant` `214, 48, 47, 47`; `minecraft` `210, 46, 52, 53`; `rematch` `211, 46, 50, 50`; `pokemon` `224, 39, 36, 59`; `super-mario` `209, 46, 54, 52` | cada jogo tem o seu rect em `items.rects` |
| O que flutua | o frame `item/<id>` inteiro | sobe e desce 4 px por CSS; sombra parada em `(236, 148)`, raios 26×4 |
| Sombra no tampo (parada) | elipse, centro `(236, 148)`, raios 26×4 | igual ao §8 |
| **Legenda (DOM)** | **`176, 112, 120, 24`** | linha 1: título; linha 2: gênero (ou plataforma) |
| **Setas ◀ ▶** | **`178, 65, 16, 14`** e **`282, 65, 16, 14`** (frames `18×16` em `y 63`) | iguais às do §8 e da prateleira |

- **Noite:** tudo × `tint-night`, menos a caixa do jogo (cores de dia). Conferido: paleta e alfa ok.
- **Sangria:** paredes em listras, frente da mesa e vão escuro. Nada interativo nela.

## Arquivos exportados (`pnpm art`, 2026-11-10)
| Arquivo | Conteúdo |
|---|---|
| `public/assets/objects/controller.{png,json}` | 34×21, tag `idle`; `meta.quartoPixel`: `anchor [30, 76]` (pivot 0,8824; 3,619), `tile [2, 2]`, `mount: "surface"`, `surfaceOf: "computer"`, `depthOffset: 0.01`, `hit: "alpha"`, `minHit: [24, 24]`, `focus: [2, 2, 30, 17]`. Sem camada de luz |
| `public/assets/ui/closeup-controller.{png,json}` | atlas 1024×543, 15 frames (5 jogos), mesmas chaves do §8: `bleed/*`, `bg/*` (fundo + sombras, sem o controle), `object/day`, `object/night` (150×63 em `15, 40`), `arrow/prev`, `arrow/next` (+ `/night`), `item/<id>` (ícone; rect próprio em `items.rects`) para cada jogo de `src/content/pt/games.json` |
| `art-src/previews/closeup-controller-games.png` | folha com os 5 ícones (dia), recortados da cena composta pelo JSON, legenda simulada |

`meta.quartoPixel` igual ao do §8 (inclusive `object.frame`, `object.shadow` e `object.float`), com `object.rect [15, 40, 150, 63]`, `object.shadow` centro `(90, 148)` raios 58×6, `stage.front [208, 43, 56, 56]` e `caption.lines ["title", "genre"]`. Conferências do build: as mesmas do §8.

## Pendências para a integração
- **Arte:** feito (2026-11-10). Jogo novo ou trocado em `games.json` pede `pnpm art`.
- **`content-curator`:** `src/content/{pt,en}/games.json` no contrato acima.
- **`scene-engineer`:** objeto `controller` no `room.tmj` (ponto (2, 2)), entrada no `registry.ts` com `minHit`, `focus`, profundidade `computer + 0,01`, `topOnly`.
- **`ui-engineer`:** painel do `controller`, chaves `objects.controller.*`; mesmo componente de item flutuante + legenda + setas do headset (e da prateleira), com ← → e swipe.

> **Sempre iluminados (2026-11-12):** o sprite do quarto tem `light: true` (fica fora do tint do entardecer e da noite, como a prateleira) e, na visão de perto, o objeto 3D usa `object/day` também à noite (`object.frame.night = "object/day"`); `object/night` continua exportado, fora de uso.
