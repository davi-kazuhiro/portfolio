# 8. Headset (M3): aprovado e exportado (2026-11-10)

> Parte das [specs de sprites](../specs.md). Convenções de coordenadas e unidades estão lá. Visão de perto segue a §3 ["Tela cheia"](3-closeup-computador.md#tela-cheia-regra-cover--sangria-real-2026-11-08).

> **Sprite do quarto aprovado pelo Davi em 2026-11-10, como está** (inclusive o `minHit` sobre o gabinete). **A visão de perto foi revisada** a pedido dele ("fundo mais simples; o fone em 3D bem modelado no meio-esquerda; a capa flutuando como o objeto da prateleira; duas setas no meio-direita"). A proposta anterior (discos na parede + aparelho de som) foi descartada. **Visão de perto aprovada no mesmo dia e tudo exportado pelo `pnpm art`** (ver "Arquivos exportados").
>
> Geradores: `tools/art/scenes/desk-items.mjs` (quarto), `tools/art/scenes/closeup-desk-items.mjs` (visão de perto), `tools/art/build-desk-items.mjs` (prévias). `node tools/art/build-desk-items.mjs` grava só em `art-src/previews/`:
> - `m3-desk-items-room.png`: o quarto a 2× com os dois destacados (referência do sprite aprovado);
> - `m3-headset-closeup.png`: visão de perto com sangria, dia | noite (borda do 320×180 tracejada). A legenda é **simulação** do DOM.
>
> Paleta: alfa 0/255 e as 48 cores. **Nenhuma cor nova.**

## Conteúdo (o que a arte precisa comportar)
Cerca de 6 álbuns que o Davi escuta. A lista real vem do `content-curator`; a prévia usa placeholders (`ARTISTA UM`, `MARE ALTA`…).

**Direitos:** nenhuma capa real. A capa é **gerada por código**: cor de fundo + um motivo geométrico + o título em fonte de pixel 3×5. Não tocamos áudio de terceiros.

Contrato proposto para `src/content/{pt,en}/albums.json` (o build da arte lê o PT, como o caderno lê `experiences.json`):

| Campo | Exemplo | Uso |
|---|---|---|
| `id` | `album-1` | frame `cover/<id>` no atlas |
| `title`, `artist` | | legenda no DOM (o título também vai na capa) |
| `cover.bg`, `cover.fg`, `cover.dark`, `cover.ink` | `teal-2`, `gold-3`, `teal-1`, `cream-3` | tokens da paleta: fundo, motivo, sombra do motivo, título |
| `cover.motif` | `sun` | um de `sun`, `rings`, `waves`, `stripes`, `grid`, `triangle`, `diamond` |
| `coverText` (opcional) | `MARE ALTA` | texto da capa se o título for longo: até 2 linhas de 15 caracteres (capa de 64 px), sem acento |

## Sprite do quarto (`objects/headset`)
Mesmo desenho e posição de quando era parte do `computer` (`headsetObject` em `tools/art/scenes/computer.mjs`): deitado à direita do braço A, atrás do mouse, ao lado do gabinete.

| | Valor |
|---|---|
| Caixa (unidades) | ≈ `[28.2, 31.4, 3.4, 8.5, 16, 17.1]`: conchas cilindro `(29.3, 4.5)` e `(29.3, 7.4)` r 1,05, haste em arco até x 31,4 |
| Tokens | conchas `graphite-2` topo, `graphite-1`/`graphite-0` lados, almofada `graphite-0`; haste `graphite-3`/`graphite-2`/`graphite-1`; LED `sky-0` |
| Silhueta | 23×14 px; na tela do quarto `x 318, y 186` |
| Canvas exportado | **27×18** (2 px de margem), mesmo canvas e âncora do `computer`: âncora **(−80, 36)**, fora do frame (como o `journal`), pivot (−2,963; 2,0) |
| `meta.quartoPixel` | `tile [2, 2]`, `mount: "surface"`, `surfaceOf: "computer"`, `depthOffset: 0.01`, `hit: "alpha"`, `minHit: [24, 24]`, `focus: [2, 2, 23, 14]` (a silhueta) |
| Frames | `idle` (1 frame) |
| Noite (`light-headset`, `layerOf: "headset"`, `light: true`) | os pixels do headset que caem no brilho elíptico do monitor (o mesmo do `light-computer`), nas cores de dia. Mesmo canvas e âncora |

### Conferido pelo build (`build-desk-items.mjs`)
- `computer` sem o headset e o controle + os dois por cima = `computer` de hoje, **pixel a pixel**. Visualmente o quarto não muda.
- O retângulo do `computer` (`116, 114, 248, 132` na tela do quarto) não muda. A silhueta `computer-hit` (monitor + mouse) também não; ela **já não cobria** o headset: 0 px em comum, nem com o anel de hover.
- `minHit` 24×24 centrado na silhueta (`x 318, y 181` no quarto): 0 px sobre `computer-hit`, `journal`, luminária, cadeira, prateleira e quadros. **Pega 91 px do gabinete** (`pc-tower`, que não é interagível): clicar ali abre o headset.
- O gabinete (profundidade 5) já cobre 10 px do headset hoje; o anel de hover fica atrás dele nesses pontos. É o comportamento certo.
- O `light-computer` agora é recortado pelo headset e pelo controle; os 59 px que caíam no headset vão para o `light-headset`. O build confere: `light-computer` + `light-headset` = o `light-computer` antigo, nos 4 frames.

## Visão de perto (`ui/closeup-headset`): revisão de 2026-11-10
> **Segunda revisão (2026-11-10, pedido do Davi):** o objeto 3D passou a ser uma camada própria (`object/day|night`) que **flutua** como o item, defasada meio ciclo, com a sombra parada no tampo. (Um redesenho laranja do headset foi testado no mesmo dia e revertido; vale o desenho grafite abaixo.)

320×180 + sangria 80/64 (célula 480×308), âncora (0, 0), escala inteira, mínimo 3×. Três coisas só: o fundo simples, o headset grande em 3D no meio-esquerda e o palco do álbum no meio-direita. O layout do palco (capa, sombra, legenda, setas) é **o mesmo do controle** (§9) e segue o hobby da prateleira (§4): o item flutua por CSS (`.shelf__float`, 4 px, ease-in-out, parado com `prefers-reduced-motion`), a sombra no tampo fica parada e a legenda é texto VT323 com contorno (`.shelf__caption`).

### Fundo
| Elemento | Rect / posição | Tokens |
|---|---|---|
| Parede do fundo | tudo acima de `y 132` (inclusive a sangria); listras de 8 px; oclusão `wall-0` em `y 131` | `wall-2`/`wall-1`; luz da janela a partir de `x 196`: `wall-4`/`wall-3` |
| Cortina | `302, −64, 22, 195` | `gold-1`, dobras `gold-0`, brilho `gold-3`; contorno |
| Janela (só na sangria) | batente a partir de `x 324`, vidro `x 328+` até `y 96`, peitoril `y 98–103` | `cream-2`/`cream-0`/`cream-1`; vidro `sky-0` + reflexo `sky-1`; noite `teal-0` + estrelas `cream-3` |
| Tampo | fundo `y 132` (`wood-2`), veio, aresta da frente `y 170` (`wood-7`), frente `y 171–181`, contorno, vão escuro embaixo | `wood-6`/`wood-5`/`wood-4`, `wood-0`, `mauve-0` |

### Objeto 3D (meio-esquerda)
| | Valor |
|---|---|
| Rect | **`31, 26, 122, 133`** (frame `object/day` / `object/night`; base em `y 159`, centro em `x 92`): em pé sobre as conchas, girado ≈35° para mostrar a face de fora da concha esquerda e a almofada da direita, **5 px acima do tampo**, flutuando |
| Modelo | haste em arco (seção retangular arredondada) com almofada por dentro, corrediças de metal, garfos, conchas ovais com almofada voltada para dentro. Raymarching (SDF), câmera ortográfica, luz de cima à esquerda, tons quantizados nas rampas; contorno `outline` por fora e nas quebras de profundidade |
| Tokens | casco e haste `outline`→`graphite-0…3` (5 tons, brilho em `graphite-3`); almofadas `outline`→`graphite-2` (foscas); corrediças `graphite-2`→`cream-0…3` (metal); anel de LED na concha `sky-0`/`sky-2`; logo em baixo-relevo `graphite-*` |
| Sombra (parada, no fundo) | elipse no tampo, centro `(92, 163)`, raios 50×5 | `wood-5`, miolo `wood-4` |
| Flutuação | 4 px, período 1,8 s, **defasada meio ciclo** do item (`phaseMs 1800`; a animação é `alternate`, ciclo de 3,6 s): sobe quando a capa desce |
| Interação | nenhuma (decorativo, sem hover) |

### Palco do álbum (meio-direita)
| Elemento | Rect `[x, y, w, h]` | Tokens / notas |
|---|---|---|
| **Capa (frente)** | **`204, 40, 64, 64`** | gerada (ver "Conteúdo"); título 3×5 em `(x + 2, y + 2)`, até 2 linhas de 15 caracteres |
| Espessura da capa | extrusão de 3 px para cima e para a direita | topo `cream-2`, lado `cream-0` (papelão) |
| Vinil saindo da capa | disco r 27, centro `(246, 42)`, atrás da capa | `graphite-0` com sulcos `graphite-1` e reflexo `graphite-2`; selo `cover.fg` com borda `cover.dark`; furo `wall-2` |
| Item inteiro (o que flutua) | **`204, 15, 69, 89`** (capa + vinil, contorno por dentro; frame `item/<id>`) | sobe e desce 4 px por CSS |
| Sombra no tampo (parada) | elipse, centro `(236, 148)`, raios 26×4 | `wood-5`, miolo `wood-4` |
| **Legenda (DOM)** | **`176, 112, 120, 24`**, centrada em `x 236` | linha 1: título (`cream-3`, grande); linha 2: artista (`gold-3`, menor). Texto com contorno pixel e sombra para baixo, sem fundo, igual ao `.shelf__caption` |
| **Seta ◀** | **`178, 65, 16, 14`** (frame com a espessura: `178, 63, 18, 16`) | botão `gold-1`, topo `gold-3`, lado `gold-0` (2 px), seta `graphite-1`; igual às setas da prateleira |
| **Seta ▶** | **`282, 65, 16, 14`** (frame `282, 63, 18, 16`) | idem |

- Clicáveis: só as duas setas (anel branco piscando, regra 14). A capa pode ter `aria-label` com "título, artista". ← → e swipe trocam o álbum; a lista dá a volta.
- **Noite:** tudo × `tint-night`, menos o item flutuante (capa + vinil, nas cores de dia, como o destaque da prateleira) e as estrelas. As setas, a sombra e o headset (`object/night`, pré-tingido) escurecem.
- **Sangria:** parede, cortina até o topo, janela e peitoril à direita, frente da mesa e vão escuro embaixo. Nada interativo nela.

## Arquivos exportados (`pnpm art`, 2026-11-10)
Gerados por `tools/art/build.mjs` (quarto) e `tools/art/build-desk-items.mjs` (`buildDeskItemsCloseups`, chamado pelo `build.mjs`).

| Arquivo | Conteúdo |
|---|---|
| `public/assets/objects/headset.{png,json}` | 27×18, tag `idle`; `meta.quartoPixel`: `anchor [-80, 36]` (pivot −2,963; 2,0), `tile [2, 2]`, `mount: "surface"`, `surfaceOf: "computer"`, `depthOffset: 0.01`, `hit: "alpha"`, `minHit: [24, 24]`, `focus: [2, 2, 23, 14]` |
| `public/assets/objects/light-headset.{png,json}` | 27×18, tag `night`; mesma âncora; `layerOf: "headset"`, `light: true`, `hit: "none"` |
| `public/assets/objects/computer.png`, `light-computer.png` | regerados sem headset e controle (`renderComputer({ items: false })`); JSON iguais aos de antes (mesmo canvas 252×136 e âncora) |
| `public/assets/ui/closeup-headset.{png,json}` | atlas 1024×579, 16 frames: `bleed/day`, `bleed/night` (480×308 em `−80, −64`; fundo + sombras, **sem** o headset), `bg/day`, `bg/night` (320×180), `object/day`, `object/night` (122×133 em `31, 26`), `arrow/prev`, `arrow/next` e `…/night` (18×16), `item/<id>` (69×89 em `204, 15`) para cada álbum de `src/content/pt/albums.json` |
| `art-src/previews/closeup-headset-albums.png` | folha com as 6 capas (dia), recortadas da cena composta pelo JSON, legenda simulada. O build valida que o texto da capa cabe (2 linhas × 15 caracteres) e falha se não couber |

`closeup-headset.json` → `meta.quartoPixel`: `size`, `bleed`, `minScale: 3`, `drawOrder`, `background` (`day`/`night` e `bleed`), `object` (`id`, `rect [31, 26, 122, 133]`, `frame {day, night}`, `interactive: false`, `shadow {center, radii, inBackground}`, `float {amplitude: 4, periodMs: 1800, phaseMs: 1800}`), `stage` (`front [204, 40, 64, 64]`, `shadow` (no fundo, parada), `float` (`amplitude: 4`, `periodMs: 1800`, `phaseMs: 0`), `caption` (`rect`, `lines: ["title", "artist"]`)), `arrows.prev/next` (`rect`, `frameRect`, `day`, `night`), `items` (`content`, `order`, `frame: "item/<id>"`, `rects`), `nightRule`. Ordem de desenho: fundo (dia ou noite, já com as duas sombras) → `object/day|night` num wrapper que flutua (`animation-delay: −1800ms`) → setas (dia ou noite) → `item/<id>` (sempre o de dia) num wrapper que flutua → DOM (legenda e botões).

O build confere: `computer` sem os dois + headset + controle = `computer` antigo (4 frames, luminária apagada e acesa); `light-computer` + `light-headset` = `light-computer` antigo; fundo + objeto + setas + item = cena de referência, dia e noite, para todos os álbuns; paleta e alfa. Quarto: as prévias `room-m2.png` e `room-m2-night.png` saem **idênticas, pixel a pixel**, às do build do commit anterior.

## Pendências para a integração
- **Arte:** feito (2026-11-10). Álbum novo ou trocado em `albums.json` pede `pnpm art`.
- **`content-curator`:** `src/content/{pt,en}/albums.json` no contrato acima (6 álbuns reais, cores e motivos escolhidos da lista).
- **`scene-engineer`:** objeto `headset` no `room.tmj` (ponto do `computer`, (2, 2)), entrada no `registry.ts` com `minHit`, `focus`, profundidade `computer + 0,01`, `topOnly`; `light-headset` acima do tint.
- **`ui-engineer`:** painel `src/ui/panels/` do `headset`, chaves `objects.headset.*` no i18n, visão de perto com `pickCloseupLayout`; capa flutuando com o mesmo `.shelf__float` / legenda `.shelf__caption` da prateleira (reutilizar, de preferência num componente comum), setas ◀ ▶ + teclado (← →) + swipe. Sem áudio.

> **Sempre iluminados (2026-11-12):** o sprite do quarto tem `light: true` (fica fora do tint do entardecer e da noite, como a prateleira) e, na visão de perto, o objeto 3D usa `object/day` também à noite (`object.frame.night = "object/day"`); `object/night` continua exportado, fora de uso.
