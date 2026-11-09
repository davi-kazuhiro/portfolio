# 3. Visão de perto do computador (M2)

> Parte das [specs de sprites](../specs.md). Convenções de coordenadas e unidades estão lá.

Ilustração frontal: o visitante sentado diante do braço A da mesa em L, olhando para a parede do fundo. À esquerda fica o canto (a parede esquerda e o braço B vêm na direção do visitante); à direita fica a janela, de onde vem a luz. O painel React (`ComputerPanel`) fica **dentro da tela do monitor**.

### Arquivo e escala
- `ui/closeup-computer.png` + `.json`, ilustração de **320×180 px** (mesma base da cena da porta) com **sangria real** em volta (80 px à esquerda e à direita, 64 px em cima e embaixo; ver "Tela cheia"), escala inteira `s`.
- **Retângulo de conteúdo (tela do monitor): `x 48, y 11, w 224, h 126`** (16:9). Na tela do visitante: `left = offsetX + 48·s`, `top = offsetY + 11·s`, `width = 224·s`, `height = 126·s`.
- O retângulo vai também no JSON, em `meta.quartoPixel.contentRect`, e os recortes em `meta.quartoPixel.crops`, para a UI não repetir números.

**Arquivos gerados e formato do JSON (2026-11-01).** Pasta `public/assets/ui/`:

| Arquivo | Tamanho | Conteúdo |
|---|---|---|
| `closeup-computer.png` + `.json` | células de 480×308 em tira (8), cada uma com a ilustração 320×180 em `(80, 64)` e a sangria em volta | tags `off` (0), `boot` (1–2, 60 ms cada), `on` (3), `off-night` (4), `boot-night` (5–6), `on-night` (7); as `*-night` são pré-tingidas |
| `closeup-computer-steam.png` + `.json` | frames 12×12 (3 × 200 ms) | tag `idle`; desenhado em `68, 134`; as linhas 0–2 do frame são vazias, então nada entra na tela |
| `closeup-computer-frame.png` | 48×48 | moldura 9-slice (só PNG) |
| `closeup-computer-desk.png` | 32×24 | faixa de mesa que repete em x (só PNG) |

`closeup-computer.json` → `meta.quartoPixel` (retângulos sempre `[x, y, w, h]` em px da ilustração a 1×):
```json
{
  "anchor": [0, 0],
  "size": [320, 180],
  "bleed": { "left": 80, "top": 64, "right": 80, "bottom": 64 },
  "contentRect": [48, 11, 224, 126],
  "crops": { "full": [0, 0, 320, 180], "monitor": [36, 0, 248, 180] },
  "minContentCss": [640, 360],
  "minScale": 3,
  "monitorRect": [40, 2, 240, 150],
  "panelBackground": "#132f3d",
  "preTinted": ["off-night", "boot-night", "on-night"],
  "steam": { "image": "closeup-computer-steam.png", "json": "closeup-computer-steam.json", "at": [68, 134] },
  "frame9": { "image": "closeup-computer-frame.png", "size": [48, 48], "slices": { "left": 8, "top": 9, "right": 8, "bottom": 15 }, "center": "#132f3d" },
  "deskStrip": { "image": "closeup-computer-desk.png", "size": [32, 24], "repeat": "x" }
}
```
Os frames ficam em `frames["closeup-computer <n>"].frame` e apontam **só para a ilustração 320×180** (`x = n · 480 + 80`, `y = 64`, `w 320`, `h 180`); a sangria em volta de cada frame está declarada em `meta.quartoPixel.bleed` (ver "Tela cheia"). As tags ficam em `meta.frameTags` (`name`, `from`, `to`). No DOM: `background-image` com o PNG, `background-size: (meta.size.w · s)px (meta.size.h · s)px` (3840×308 a 1×) e `background-position: -(frame.x · s)px -(frame.y · s)px` para a ilustração, ou `-((frame.x − bleed.left) · s)px -((frame.y − bleed.top) · s)px` para a célula com sangria. À noite, a luminária acende e o halo de 3 px em volta do monitor, a tela e a poça da luminária ficam nas cores de dia; a cortina recebe luar `teal-3` nas 2 colunas da esquerda. Prévias: `art-src/previews/closeup-day.png`, `closeup-night.png` e `closeup-bleed.png` (com a sangria, borda do 320×180 tracejada).

### Composição (px da ilustração)
| Elemento | Retângulo / posição | Tokens |
|---|---|---|
| Parede ao fundo | `30, 0, 290, 158`; listras verticais de 8 px | `wall-2`/`wall-1`; terço direito `wall-4`/`wall-3` (luz da janela, à direita); linha de oclusão `wall-0` em `y 157` |
| Canto e parede esquerda | `0, 0, 30, 158`; quina vertical de 1 px `wall-0` em `x 30`; listras de 4 px (encurtadas pela perspectiva) | `wall-4`/`wall-3` |
| Borda da cortina | `310, 0, 10, 150` | `gold-1` com dobras `gold-0` e brilho `gold-3`; contorno à esquerda |
| Sombra do monitor na parede | faixa de 3 px à **esquerda** e embaixo do monitor (`x 37–39`, `y 6–154`), porque a luz vem da janela à direita | `wall-0` |
| Monitor (caixa externa) | `40, 2, 240, 150` | contorno `outline`; moldura `graphite-1` (topo 8 px, laterais 7 px, queixo 14 px), aresta de cima `graphite-2`, lado direito 1 px `graphite-0` |
| **Tela** | `48, 11, 224, 126` | ligada: `teal-0`, sombra interna de 1 px `teal-1` em cima e à esquerda |
| LED de energia | `266, 143, 2, 1` (no queixo) | `sky-0` |
| Haste | `150, 152, 20, 8` | `graphite-1`, lado `graphite-0` |
| Base | `132, 160, 56, 4` | `graphite-2` topo, `graphite-1` frente |
| Tampo da mesa (vista de cima, em faixa) | `0, 158, 320, 14`; à esquerda de `x 30` o tampo do braço B alarga para baixo até `y 180` (trapézio) | `wood-6` com veio `wood-5`; borda do fundo `wood-2` |
| Frente do tampo | `0, 172, 320, 8` | aresta `wood-7` em `y 172`, `wood-5`, última linha `wood-4` |
| Teclado | `108, 163, 104, 9` | topo `cream-2`, teclas `cream-3` de 5×2 com frestas `cream-0`, frente de 2 px `cream-1` |
| Mouse | `222, 164, 10, 7` | `cream-3`/`cream-2`/`cream-0` |
| Caneca | `64, 146, 20, 25` (alça de 4 px à esquerda) | faixa esquerda `cream-3`, meio `cream-2`, direita `cream-0`; boca com café `wood-0`, brilho `wood-1` |
| Controle de videogame (no canto, deitado) | `30, 161, 28, 9` | corpo `graphite-2`/`graphite-1`, direcional `graphite-0`, botões `pink`, `sky-0`, `leaf-2`, `gold-1` |
| Luminária (no braço B, à esquerda, encostada na parede esquerda) | `2, 96, 26, 70` (base no tampo em `y 160–166`) | `teal-2`/`teal-1`/`teal-3`; lâmpada `gold-3` quando acesa; à noite, poça `wood-7`/`wood-6` no tampo à esquerda |

A prateleira fica acima do monitor, fora do quadro. Nada da arte invade o retângulo de conteúdo: a caneca começa em `y 146`, abaixo da tela (que termina em `y 136`).

### Estados e frames
| Tag | Frames | Uso |
|---|---|---|
| `off` | 1: tela `graphite-0` com reflexo diagonal `teal-1` | início da transição, antes de o painel abrir |
| `boot` | 2 × 60 ms: tela inteira `teal-1`, depois `teal-0` | liga quando a ilustração termina de entrar |
| `on` | 1 | estado normal, com o painel por cima |
| `off-night`, `boot-night`, `on-night` | iguais, pré-renderizados com `tint-night` | noite; a luminária acesa e um halo de 3 px em volta do monitor ficam nas cores de dia (luz); a cortina recebe luar `teal-3` na dobra da esquerda |
| `closeup-computer-steam.png` | 12×12, 3 frames × 200 ms, em `68, 134` | vapor da caneca em `cream-3`, só sobre o queixo do monitor; desligado com `prefers-reduced-motion` |

Sugestão para a UI: fundo do painel em `teal-0` (`#132f3d`) nesse modo, para emendar com a tela, e sem borda própria, porque a moldura do monitor já é a borda.

### Tela cheia: regra "cover" + sangria real (2026-11-08)
Substitui os modos A/B/C (ADR 0006, revisão de 2026-11-08). A ilustração **cobre a janela inteira** em escala inteira: o excesso é cortado nas bordas e a área de conteúdo fica inteira visível, abaixo da faixa do HUD. A escala e o recorte saem de `pickCloseupLayout` (`src/ui/closeup/layout.ts`). Sem escala possível (celular, tablet em retrato), modo `fallback`: o painel em tela cheia, com a moldura 9-slice `closeup-computer-frame.png` (48×48; fatias esquerda 8, topo 9, direita 8, base 15; LED no queixo, que não estica). A faixa `closeup-computer-desk.png` (32×24) era do modo C e não é mais necessária.

Para o recorte poder usar escalas menores (mais contexto, a "visão de pessoa") sem esticar a borda da arte, **toda visão de perto é exportada com sangria real**: arte desenhada em volta da ilustração 320×180, continuação natural da cena.

**Regra para todo objeto com visão de perto (atual e futuro):**
1. Margem de arte real de **pelo menos 48 px** de cada lado; o padrão do projeto é **80 px à esquerda e à direita e 64 px em cima e embaixo** (célula de 480×308). Com ela, centralizada, a arte cobre sem esticar 1366×768 a 3×, 1920×1080 a 4×, 1440×900 e 1280×720 a 4×, 2560×1440 a 6×.
2. A ilustração-base continua em `(0, 0)`–`(320, 180)` lógicos e **não muda** quando a sangria é acrescentada: todo `rect` do JSON (`contentRect`, `monitorRect`, `steam.at`, `crops`, itens da prateleira) continua valendo. O build confere byte a byte.
3. A sangria é cena, não moldura: nada de contorno na borda externa nem objeto cortado ao meio nela. A borda externa deve aguentar ser esticada (listras verticais, céu, vão escuro), porque além da margem a UI ainda estica a última linha/coluna.
4. Noite: a sangria é pré-tingida (`tint-night`) como a ilustração; o que é luz fica nas cores de dia e continua coerente na emenda (poça da luminária, halo do monitor, estrelas e lua).
5. Nada interativo na sangria: ela pode aparecer cortada em qualquer tamanho de janela.

**O que há na sangria do computador** (`tools/art/scenes/closeup-bleed.mjs`):

| Lado | Conteúdo | Tokens |
|---|---|---|
| Esquerda | a parede esquerda continua (listras de 4 px) e a quina `wall-0` em `x 30` sobe até o topo; o tampo do braço B continua para baixo e para a esquerda | `wall-4`/`wall-3`; tampo como na ilustração |
| Cima | parede do fundo (listras de 8 px; da coluna 222 em diante, na luz da janela); varão da cortina em `y −7…−4` com ponteira em `x 294` e 3 argolas até a cortina; alto da janela a partir de `y −1` | `wall-*`, varão `graphite-1`/`graphite-2`, ponteira `gold-1`/`gold-3`, argolas `graphite-0` |
| Direita | janela logo após a cortina: batente `x 320–323`, vidro a partir de `x 325` (montante `x 361–365`), verga `y 0–3`, vidro até `y 135`, peitoril `y 137–141`; parede embaixo até a mesa (linha `wall-0` em `y 157`); o tampo continua | batente `cream-0…3`; vidro `sky-0`, reflexo `sky-1`, nuvens `cream-3`/`sky-2` |
| Baixo | frente da mesa até `y 183` (`wood-4`), contorno em `y 184`, vão escuro debaixo da mesa; à esquerda, o lado do braço B: faixa de 11 px abaixo da aresta diagonal `wood-7` | `wood-5`/`wood-4`, `outline`, `mauve-0` |
| Noite | tudo × `tint-night`, menos: a poça da luminária (a parte que passa de `x 0`), estrelas e lua no vidro (`cream-3`/`cream-1`) e, com a tela acesa (`boot`, `on`), o halo do monitor: `y −1` inteiro (completa os 3 px de halo, como dos lados), `y −2` em xadrez e `y −3` a cada 4 px, sem faixa clara | `off-night` não tem halo |

**Formato no JSON (para o `ui-engineer`)**, igual nas duas visões de perto:
- `meta.quartoPixel.bleed = { left, top, right, bottom }`: px de arte real em volta da ilustração, a 1×. Hoje `{ 80, 64, 80, 64 }`. Sem o campo, vale o comportamento antigo (sangria sintética).
- Computador (tira): `frames[n].frame` continua sendo a ilustração 320×180 (`x = n · 480 + 80`, `y = 64`), então o código atual segue desenhando certo. A célula com sangria do frame é `{ x: frame.x − bleed.left, y: frame.y − bleed.top, w: frame.w + bleed.left + bleed.right, h: frame.h + bleed.top + bleed.bottom }`, desenhada com o canto em `(−bleed.left, −bleed.top)` da ilustração. O `meta.size` passa a 3840×308.
- Prateleira (atlas): frames novos `bleed/day` e `bleed/night` (480×308, `spriteSourceSize` `x −80, y −64`), que já contêm o fundo inteiro (`bg/*` no meio) e o substituem como fundo; `meta.quartoPixel.background.bleed = { rect: [−80, −64, 480, 308], day: "bleed/day", night: "bleed/night" }`.
- Leitura sugerida: a região disponível da arte vira `{ x: −bleed.left, y: −bleed.top, w: 320 + left + right, h: 180 + top + bottom }` em px da ilustração; a sangria sintética (`bleedStrips`) só cobre o que passar dela, e o limite por lado (`maxBleed`) passa a contar a partir da borda da sangria real. O `bleedInset` deixa de ser necessário (a borda externa não tem contorno).

### Para a UI e a cena (não editei `src/`)
- **Decisão de arquitetura em aberto:** quem desenha a visão de perto. Recomendo DOM: um `<img>` ampliado por inteiro com `image-rendering: pixelated` e o painel posicionado de forma absoluta no retângulo. O alinhamento ao pixel fica trivial e o Phaser só faz o zoom até o objeto e emite `object-open`. Vale um ADR.
- A transição sugerida: zoom da câmera no quarto (≈400 ms) → fade curto para a ilustração (`off` → `boot` → `on`) → painel aparece dentro da tela. Esc faz o caminho inverso.
