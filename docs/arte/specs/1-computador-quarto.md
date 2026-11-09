# 1. Grupo do computador: mesa em L (quarto, M2)

> Parte das [specs de sprites](../specs.md). Convenções de coordenadas e unidades estão lá.

Revisado em 2026-11-01: mesa em L no canto do fundo, prateleira na parede acima do monitor (é o `bookshelf`) e caderno deitado no braço esquerdo da mesa. Segunda rodada: braço B mais curto, gabinete mais fino, sem vaso de planta, controle de videogame no canto da mesa. Terceira rodada: luminária no fundo do braço B, ao lado do caderno. Posições no quarto: [planta](../planta-do-quarto.md#a-mesa-em-l).

### Composição: o que é um sprite só e o que é separado
| Sprite | Conteúdo | Por que assim |
|---|---|---|
| `computer` (**interagível**) | mesa em L (tampo dos dois braços, perna direita do braço A, gaveteiro sob o braço B, painéis do fundo), monitor (base, haste, tela), teclado, mouse, caneca e controle de videogame no canto | É o que o visitante entende como "o computador". Um sprite só dá um único outline de hover e uma única área de clique. |
| `journal` (**interagível**, M3) | caderno fechado, deitado no braço B, com caneta ao lado | Interagível próprio. Sprite separado, desenhado por cima do `computer`. |
| `bookshelf` (**interagível**, M3) | prateleira de parede com livros e 2 cartuchos, acima do monitor | Objeto de parede (`wall-back`). Não toca a mesa. |
| `desk-lamp` (decoração / luz) | luminária no fundo do braço B, encostada na parede esquerda, ao lado do caderno | Tem estados `off`/`on`. Exportada como **camada do `computer`**: mesmo canvas, mesma âncora, mesmo ponto do Tiled, profundidade do computador + 0,01. |
| `light-computer` (luz) | à noite: poça de luz da luminária sobre o braço B (caderno e parte esquerda da mesa) e brilho do monitor sobre o teclado | Fica acima do tint noturno. Também é camada do `computer`. |
| `pc-tower` (decoração) | gabinete fino com faixa de LED e ventilação | No chão, no tile (4,0), sob a cortina esquerda, com profundidade própria. O LED anima. |
| `desk-chair` (decoração) | cadeira giratória | No canto interno do L, de frente para o monitor. Continua trocável (avatar sentado no M4). |
| sombras de contato | sob a mesa (os dois braços), o gabinete e a cadeira | Assadas no `room-shell` (regra 6 da bíblia). |

A pilha de livros que ficava sobre a mesa no teste foi para a prateleira. O vaso de planta saiu. O **controle de videogame** é decoração **assada no sprite `computer`**: não tem sprite nem clique próprio, e clicar nele abre o computador.

### Posições (unidades do gerador; 8 u = 1 tile)
Mesmo desenho e acabamento do teste aprovado, com a mesa reorganizada em L.

| Parte | Caixa / primitiva | Tokens |
|---|---|---|
| Tampo, braço A (parede do fundo) | `[0, 32, 0, 14, 13, 16]`, veio no topo | `wood-6` topo, `wood-5` veio e frente, `wood-4` faixa de baixo da frente, `wood-2`/`wood-1` lado, `wood-7` arestas |
| Tampo, braço B (parede esquerda) | `[0, 14, 14, 30, 13, 16]` (termina 10 u antes da cama), veio no sentido do braço (ao longo de y). A emenda com o braço A não aparece: é um tampo só. | iguais |
| Perna direita do braço A | `[29, 32, 1, 13, 0, 13]` | frente `wood-5`/`wood-4`, lado `wood-2`/`wood-1`, aresta `wood-7` |
| Painéis do fundo | braço A `[1, 29, 1, 2, 3, 13]`; braço B `[1, 2, 2, 19, 3, 13]` (fecham o canto por baixo do tampo) | `wood-0` |
| Gaveteiro (sob a ponta do braço B) | `[1, 13, 19, 29, 0, 13]`, 2 gavetas **na face +x** (a face visível, de frente para o quarto) | face +x `wood-2` (30% de baixo `wood-1`), frestas `wood-0`, puxadores `gold-1` com aresta `gold-3` (um tom acima, porque estão na face escura); face +y `wood-5`/`wood-4` |
| Caneca (fundo do canto) | cilindro `(5, 3.5) r 1.6, z 16–21`, café no topo | `cream-3` claro, `cream-2` meio, `cream-0` escuro; café `wood-0`/`wood-1` |
| Controle de videogame (canto, deitado) | corpo `[3, 9, 7, 10.5, 16, 17.2]`; 2 pegadores cilindro `(3.6, 10.5) r 1` e `(8.4, 10.5) r 1`, z 16–17.2; no topo, direcional em cruz de 3×3 px à esquerda e 4 botões de 1 px à direita | corpo `graphite-2` topo, `graphite-1` frente, `graphite-0` lado, aresta `graphite-3`; direcional `graphite-0`; botões `pink`, `sky-0`, `leaf-2`, `gold-1`. Escuro sobre o tampo `wood-6`, para ler bem de longe. |
| Monitor | base `[15, 24, 3, 7, 16, 16.8]`, haste `[18.5, 20.5, 3, 4.5, 16.8, 21]`, tela `[11, 28, 3, 4.8, 21, 36]` | `graphite-1` frente e moldura, `graphite-0` lado, `graphite-2` topo; tela `teal-0`, reflexo `teal-1`, barra `teal-2`; código `sky-0`, `gold-2`, `leaf-2`, `pink`, `teal-3` |
| Teclado | `[12.5, 26.5, 8, 12, 16, 17.2]` | topo `cream-2`, teclas `cream-3`, frestas `cream-0`, frente `cream-1`, lado `cream-0` |
| Mouse | cilindro `(29.5, 10.2) r 0.9, z 16–17` | `cream-3`, `cream-2`, `cream-1`, `cream-0` |
| Luminária (`desk-lamp`) | base cilindro `(2, 28) r 1.4, z 16–16.8`, haste `[1.6, 2.4, 27.6, 28.4, 16.8, 26]`, cúpula cilindro `(2.5, 28) r 1.8, z 24–27.5`, lâmpada `(2.5, 28) r 1.1, z 23.6–24`. Cúpula inclinada só 0,5 u para dentro do quarto, para não avançar sobre o caderno (`[4, 10, 19, 26]`). | `teal-2` corpo, `teal-1` lado, `teal-3` topo; lâmpada `gold-3` (`on`) ou `cream-2` (`off`) |
| Gabinete (`pc-tower`) | `[33, 38, 2, 10, 0, 20]` (fino: 5×8 u) | frente `graphite-1`, lado `graphite-0`, topo `graphite-2`, aresta `graphite-3`, ventilação `graphite-0`, LED `sky-0`/`sky-2` |
| Cadeira (`desk-chair`) | as peças do teste deslocadas para o centro `(19.5, 20)` (−7 em x, +0,75 em y) | `red-1` frente, `red-2` assento e encosto iluminados, `red-0` lado e costura, `red-3` arestas; base `graphite-1/0/2` |
| Caderno (`journal`) | ver §5 (aprovado em 2026-11-08): capa `[4, 9.5, 19, 26, 16, 18.5]`, caneta `[10.8, 11.5, 19.6, 25.2, 16, 16.8]` | capa dura `red-*`, elástico `graphite-1`, fita `gold-1`; caneta `graphite-*` com ponta `gold-1` |
| Prateleira (`bookshelf`) | tábua `[9, 30, 0, 5, 42, 43.5]` (84–87 px de altura); 2 mãos-francesas `[11, 12, 0, 4, 38, 42]` e `[27, 28, 0, 4, 38, 42]`; 8 livros em pé `[x, x + 1.5…2.5, 0.5, 4, 43.5, 49…53]` de x = 10 a 24, o último inclinado; 2 cartuchos deitados `[25, 29, 0.8, 4, 43.5, 44.5]` e `[25.3, 28.7, 1, 3.8, 44.5, 45.5]` | tábua `wood-6`/`wood-5`/`wood-2` com aresta `wood-7`; mãos-francesas `graphite-1`; livros `blue-1/0`, `pink`/`red-1`, `gold-1/0`, `red-2/0`, `leaf-1/0`, `teal-3/2`, lombadas com 1 px `cream-3`; cartuchos `graphite-2`/`graphite-1` com etiqueta `sky-0` e `gold-2` |

### Tamanho, âncora e estados (valores reais do gerador, 2026-11-01)
Gerado por `node tools/art/build.mjs` (`pnpm art`). Os números abaixo são os gravados nos JSON; em caso de dúvida, vale o JSON. `pivot = âncora / tamanho do frame`. Todo frame tem o mesmo tamanho, sem trim, lado a lado no PNG.

| Sprite | Arquivo | Frame | Âncora (px do frame) | Pivot | Ponto do Tiled (col, row) | Footprint | Tags / frames |
|---|---|---|---|---|---|---|---|
| `computer` | `public/assets/objects/computer.png/.json` | 252×138 (2 px de margem) | (122, 110) = mundo (16, 16, 0) | (0.4841, 0.7971) | (2, 2) | `[[0,0,4,2],[0,2,2,2]]` | `idle` 0–3 × 500 ms: 0 = tela do teste; 1 = cursor `gold-2` 1×2 px; 2 = +2 px digitados e cursor; 3 = digitado, sem cursor |
| `desk-lamp` | `objects/desk-lamp.png/.json` | 252×138 | (122, 110) | igual | (2, 2) | — | `off` (0), `on` (1: lâmpada `gold-3`, borda de baixo da cúpula `gold-1`) |
| `light-computer` | `objects/light-computer.png/.json` | 252×138 | (122, 110) | igual | (2, 2) | — | `night` 0–3 × 500 ms, **frame a frame igual ao `computer`** (a tela anima junto): tela do monitor, lâmpada acesa, poça da luminária no tampo do braço B (círculo r 10 u em (3, 26), só no tampo) e brilho elíptico da tela sobre tampo e teclado (centro (19.5, 7.5), raios 10×6 u) |
| `desk-chair` | `objects/desk-chair.png/.json` | 74×72 | (39, 59) = mundo (20, 20, 0) | (0.5270, 0.8194) | (2.5, 2.5) | `[[0,0,1,1]]` | `idle` 0 |
| `pc-tower` | `objects/pc-tower.png/.json` | 56×70 | (38, 52) = mundo (36, 4, 0) | (0.6786, 0.7429) | (4.5, 0.5) | `[[0,0,1,1]]` | `idle` 0–1 × 800 ms (LED `sky-0` ↔ trecho de cima `sky-2`) |
| `window` | `objects/window.png/.json` | 91×122 | (49, 144) = base da parede, mundo (46, 0, 0); **abaixo do frame** | (0.5385, 1.1803) | (5.75, 0) | — (`wall-back`) | `day` 0, `dusk` 1, `night` 2 |
| `room-shell` | `public/assets/tiles/room-shell.png/.json` | 472×386 | (236, 156) = canto do fundo no chão, mundo (0, 0, 0) | (0.5, 0.4041) | (0, 0) | `[[0,0,7,7]]` | `idle` 0 |
| `light-window` | `objects/light-window.png/.json` | 472×386 (canvas do `room-shell`) | (236, 156) | (0.5, 0.4041) | (0, 0) | — | `day` 0 (sol `wood-lit`, veio `wood-4`, brilho `wall-5` em volta da moldura), `dusk` 1 (mancha mais longa, `wood-6`/`wood-5`), `night` 2 (luar `teal-2`) |
| `journal` (+ `light-journal`) | M3 | 60×36 | (90, 57), a do `computer`, fora do canvas | — | (2, 2) | — | M3 (§5) |
| `bookshelf` | M3 | ≈110×80 | base da parede, mundo (19.5, 0, 0), fora do canvas | — | (2.4375, 0) | — | M3 |

`meta.quartoPixel` de cada JSON traz `anchor`, `tile` (ponto do Tiled em tiles) e, conforme o caso, `mount`, `footprint`, `hit` (`alpha` no `computer`; `none` no resto), `minHit`, `layerOf` (camadas que vão no mesmo ponto do objeto dono), `light: true` (camadas de luz), `syncFramesWith` e `preTinted`.

**Foco do zoom do `computer`:** `meta.quartoPixel.focus = [66, 2, 200, 140]` (`x, y, w, h` em px do frame do `computer`). Ele passa da borda direita e de baixo do frame de propósito, porque inclui o gabinete, que é outro sprite. Na tela: `x = posição do computer − âncora + focus`.

### Camadas, profundidade e tint (contrato com o `scene-engineer`)
- Profundidade = `col + row` do ponto do Tiled: `room-shell` abaixo de tudo; `window` logo acima das paredes; `computer` 4; `desk-lamp` 4,01; `desk-chair` 5; `pc-tower` 5 (não se sobrepõem na tela).
- A **luminária também está desenhada dentro do `computer`** (estado `off`), para entrar no outline de hover e no clique do computador. A camada `desk-lamp` só troca `off`/`on` por cima, com os mesmos pixels; ela não deve receber clique (deixe sem `setInteractive`).
- **Tint de entardecer/noite** (retângulo MULTIPLY) cobre `room-shell`, `computer`, `desk-lamp`, `desk-chair` e `pc-tower`. **Acima do tint** ficam: `window` (todas as tags), `light-window` e `light-computer`.
  - `window`: só o vidro é luz; nas tags `dusk` e `night` a moldura, o peitoril, o varão e as cortinas **já vêm multiplicados** por `tint-dusk`/`tint-night` (cores derivadas, fora da paleta de propósito). Por isso o sprite inteiro vai acima do tint, sem tint próprio.
  - `light-window` e `light-computer` **já vêm recortadas** pelos objetos que ficam na frente delas (cadeira, gabinete, mesa, janela). Podem ser desenhadas por cima de tudo sem cobrir nada. Se o M3 puser algo na frente (caminha do pet no sol), o gerador recorta de novo.
  - De dia, `light-window` tag `day` fica visível (é o sol); `light-computer` só aparece com a luminária acesa (entardecer e noite).
- Ordem sugerida: shell → light-window (dia) → window → objetos por profundidade → tint → window/light-window (entardecer/noite) → light-computer. Ou, mais simples: light-window e window sempre acima do tint; com tint desligado de dia, o resultado é o mesmo.
- O LED do gabinete fica sob o tint (escurece à noite). Se fizer falta, o gerador pode exportar uma `light-pc-tower`.

### Prévias
- Dia: `art-src/previews/room-m2.png`; noite: `art-src/previews/room-m2-night.png` (2×, com 24 px de borda). Montadas a partir dos PNG/JSON exportados, com cada sprite em `canto do quarto + ((col − row)·32, (col + row)·16) − âncora`, isto é, exatamente a conta que o jogo faz.

### Hover, clique e zoom
- **Hover:** outline `gold-2` por fora, aplicado por código, em `computer`, `journal` e `bookshelf`, cada um com o seu. A cadeira e o gabinete não reagem.
- **Clique:** silhueta de cada sprite (`hit: "alpha"`), com `topOnly`.
  - O `journal` fica por cima do `computer`: clicar nele abre o caderno, e o resto da mesa (inclusive o controle) abre o computador.
  - O `bookshelf` está 12 px (1×) acima do topo do monitor, sem pixel em comum.
  - A parte da mesa coberta pela cadeira continua abrindo o computador (a cadeira não é interagível).
- **Zoom:** o `computer` mira o **retângulo de foco** gravado em `meta.quartoPixel.focus`: braço A + monitor + teclado + gabinete, sem o braço B. Assim o enquadramento mostra "o computador" e o caderno não parece parte dele. O `journal` e o `bookshelf` miram o próprio retângulo, ampliado até a proporção da tela. A luminária agora fica **fora** do retângulo de foco do computador (está no braço B). Tudo bem: ela continua no sprite e acesa à noite; só não entra no enquadramento do zoom. A luz que ela joga no caderno aparece no zoom do `journal`.
