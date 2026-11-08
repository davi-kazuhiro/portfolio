# Specs de sprites (M2 e M3)

Mantido pelo agente `art-director`. Grid, paleta, regras de desenho, formato de arquivo e âncoras: [biblia-de-arte.md](biblia-de-arte.md). Posições no quarto: [planta-do-quarto.md](planta-do-quarto.md).

Convenções desta página:
- Coordenadas do quarto em **unidades do gerador** (8 unidades = 1 tile; em z, 1 unidade = 2 px), porque é assim que o gerador desenha. Caixas no formato `[x0, x1, y0, y1, z0, z1]`.
- Cenas frontais (porta, visão de perto) em **px da ilustração a 1×**, origem no canto superior esquerdo; retângulos como `x, y, w, h`.
- Tamanhos de canvas marcados com ≈ são estimativas da projeção. O valor exato (e o `pivot`) é o que o gerador grava no JSON.

---

## 1. Grupo do computador: mesa em L (quarto, M2)

Revisado em 2026-11-01: mesa em L no canto do fundo, prateleira na parede acima do monitor (é o `bookshelf`) e caderno deitado no braço esquerdo da mesa. Segunda rodada: braço B mais curto, gabinete mais fino, sem vaso de planta, controle de videogame no canto da mesa. Terceira rodada: luminária no fundo do braço B, ao lado do caderno. Posições no quarto: [planta](planta-do-quarto.md#a-mesa-em-l).

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
| Caderno (`journal`) | capa `[4, 10, 19, 26, 16, 17.2]`; elástico de 1 u ao longo de y em x = 8,5; caneta `[11, 11.6, 19.5, 25, 16, 16.6]` | capa `blue-1` topo, `blue-0` lados; miolo nas faces laterais em listras `cream-3`/`cream-0`; elástico `gold-2`; caneta `graphite-1` com ponta `gold-1`; aresta da capa `sky-1` (o tom de luz do azul) |
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
| `journal` | M3 | ≈58×32 | âncora do `computer`, fora do canvas | — | (2, 2) | — | M3 |
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

---

## 2. Porta do quarto (cena `Entrance`, spec no M2, implementação no M4)

### Ilustração e escala
- Cena frontal de **320×180 px** (16:9), desenhada a 1× e ampliada pelo maior inteiro `s = floor(min(vw / 320, vh / 180))`. Ex. (área útil do navegador): 1920×1080 (≈950 de altura) → 5×; 1366×768 (≈650) → 3×; tela cheia 1920×1080 → 6×.
- **Telas largas:** as laterais repetem a coluna `entrance-wall-column` (16×180: listras da parede, rodapé e piso) até encher a tela, na mesma escala.
- **Telas estreitas (retrato):** zona segura `x 104, y 0, w 112, h 180` (porta + batente + placa + luz sob a porta). A escala passa a ser `floor(min(vw / 112, vh / 180))` e o resto é cortado nas laterais. Ex.: 390×844 → 3× (336×540).
- O texto "Entrar" do hover, o HUD e o menu acessível são DOM (i18n), nunca desenhados na arte.

### Camadas e arquivos
| Arquivo | Tamanho | Posição na cena | Conteúdo |
|---|---|---|---|
| `tiles/entrance-bg.png` | 320×180 | 0, 0 | corredor: parede listrada (`wall-3`/`wall-4`, listras de 8 px, faixa clara `wall-5` à esquerda), rodapé `y 150–163` (`mauve-1`, aresta `mauve-2`, base `mauve-0`), piso de tábuas horizontais `y 164–179` (`wood-3`/`wood-4`, juntas `wood-1`), batente da porta `x 120–199, y 14–163` (laterais de 8 px, travessa de 8 px: frente `cream-2`, lado interno `cream-1`, aresta `cream-3`, sombra `cream-0`). Vão interno `x 128–191, y 22–163`. Sombra da porta no piso (1 tom `wood-1`) à direita do batente. |
| `tiles/entrance-wall-column.png` | 16×180 | repetida nas laterais | mesma parede, rodapé e piso, sem porta |
| `objects/door-interior.png` | 64×142 | 128, 22 | o que se vê pelo vão: parede do quarto iluminada (`wall-5`/`wall-4`, 2/3 de cima), piso `wood-lit`/`wood-6` (1/3 de baixo), reflexo do monitor em `sky-0` à direita, e as 2 linhas de baixo em `gold-3`, que aparecem como **luz sob a porta** pela fresta de 2 px |
| `objects/door.png` | frames 64×142 | 128, 22 | a folha da porta (abaixo) |
| `objects/door-light.png` | 80×10 | 120, 164 | luz que escapa para o piso do corredor |
| `objects/door-knob-glow.png` | 12×12 | 177, 91 | brilho da maçaneta no hover |

Ordem de desenho: `entrance-bg` → `door-interior` → `door` → `door-light` → `door-knob-glow`.

**Arquivos gerados (2026-11-01, `node tools/art/build.mjs`).** Todos em JSON Hash do Aseprite, âncora `(0, 0)`, e `meta.quartoPixel.at` com a posição na cena em px da ilustração:

| Arquivo | Frame | Tags (frames) | `meta.quartoPixel` |
|---|---|---|---|
| `public/assets/tiles/entrance-bg.png/.json` | 320×180 | `day` (0), `night` (1, pré-tingido) | `at [0,0]`, `safeZone [104,0,112,180]`, `preTinted ["night"]` |
| `public/assets/tiles/entrance-wall-column.png/.json` | 16×180 | `day` (0), `night` (1, pré-tingido) | `repeat "x"` (emenda sem costura com o `entrance-bg`, que é periódico em 16 px) |
| `public/assets/objects/door-interior.png/.json` | 64×142 | `day` (0), `night` (1) | `at [128,22]` |
| `public/assets/objects/door.png/.json` | 64×142 | `closed` (0), `open` (1–4: 70, 70, 80, 120 ms), `closed-night` (5), `open-night` (6–9) | `at [128,22]`, `preTinted ["closed-night","open-night"]` |
| `public/assets/objects/door-light.png/.json` | 80×10 | `day` (0), `night` (1) | `at [120,164]` |
| `public/assets/objects/door-knob-glow.png/.json` | 12×12 | `hover` (0–1, 300 ms) | `at [177,91]` |

Ajustes de desenho (não mudam o contrato): o `entrance-bg` não tem a faixa clara `wall-5` à esquerda, porque ela quebraria a emenda com a coluna repetida; o reflexo do monitor no `door-interior` é uma faixa vertical `sky-1`/`sky-0` na borda direita (a oval parecia um ovo na parede); o `door-knob-glow` ganhou 4 faíscas de 1 px em volta do anel; nos frames de abertura a folha é a fechada comprimida em perspectiva, então a placa e o adesivo encolhem junto, em vez de virar uma faixa de 2 px. Prévias: `art-src/previews/door.png` e `door-night.png` (fechada, hover, abrindo 1–4).

### Folha da porta (`door`, frame `closed`)
Coordenadas dentro do frame de 64×142:
- **Folha:** `x 0–63, y 0–139` (64×140, proporção ≈1:2,2). As linhas `y 140–141` ficam **transparentes**: é a fresta por onde aparece a luz do `door-interior`.
- **Madeira** (mesma família da mesa): base `wood-5`, veio vertical por ruído em `wood-4`, terço de baixo um tom abaixo (`wood-4`), borda esquerda (dobradiças) com 1 px `wood-6`, borda direita `wood-3`, contorno `outline`.
- **Almofadas em relevo:** superior `x 8–55, y 10–62`; inferior `x 8–55, y 84–130`. Face `wood-5`, arestas de cima e da esquerda `wood-6` (luz vinda de cima e da esquerda), de baixo e da direita `wood-2`.
- **Dobradiças:** 2×8 px `gold-0` em `x 0–1`, `y 16–23` e `y 112–119`.
- **Maçaneta:** 6×6 em `x 52–57, y 72–77` (≈1 m do chão): `gold-1`, brilho de 2 px `gold-3` em cima à esquerda, sombra `gold-0` embaixo à direita, contorno.
- **Plaquinha com o nome:** 32×12 em `x 16–47, y 34–45`, dentro da almofada superior. Fundo `cream-3`, borda de 1 px `gold-0`, aresta de cima `gold-1`, 4 parafusos de 1 px `gold-0`. Texto **"DAVI"** em letras de pixel 5×7 com 1 px de espaço (23 px de largura), centralizado, em `graphite-1`. É um nome próprio, então não precisa de tradução.
- **Detalhe de personalidade:** adesivo **"</>"** de 20×12 em `x 22–41, y 96–107`, na almofada inferior: retângulo de cantos arredondados `graphite-1`, borda branca de adesivo `cream-3`, glifo em `sky-0`. Sem texto, para não precisar de PT/EN. A placa "não perturbe" foi descartada por ter texto; se o Davi quiser algo pendurado, a alternativa é uma plaquinha só com ícone (lua e "z z").

### Abertura (tag `open`, a porta abre para dentro, dobradiças à esquerda)
A borda livre se afasta do visitante: a folha estreita, a borda direita encurta em altura e aparece a espessura da porta (2 px `wood-1`). O vão revelado mostra o `door-interior`.

| Frame | Largura da folha | Borda livre (y) | Detalhes | Duração |
|---|---|---|---|---|
| `closed` (0) | 64 | 0–139 | como acima | — |
| `open` 1 (≈20°) | 50 (`x 0–49`) | 1–138 | almofadas e placa comprimidas na horizontal; maçaneta 5×5 | 70 ms |
| `open` 2 (≈50°) | 30 | 3–136 | almofadas viram 2 retângulos estreitos; placa vira faixa `cream-3` de 2 px; maçaneta 4×4 | 70 ms |
| `open` 3 (≈80°) | 12 | 5–134 | só a borda com 1 linha de almofada; sem maçaneta | 80 ms |
| `open` 4 (aberta) | 3 | 6–133 | só a espessura junto às dobradiças; o vão inteiro mostra a luz | 120 ms |

Total ≈ 340 ms. O "atravessar" (clarão `cream-3` ou zoom rápido) é feito por código depois do frame 4, dentro do limite de 1 s. Com `prefers-reduced-motion`: corte direto de `closed` para o quarto.

### Hover / foco (`door-knob-glow`)
- 12×12 centralizado na maçaneta. Tag `hover`, 2 frames × 300 ms: núcleo 4×4 `gold-3` + anel de 1 px `gold-2` (frame 0) e o mesmo com mais 2 px de reflexo `cream-3` no canto superior esquerdo (frame 1).
- A dica "Entrar" é DOM (i18n), posicionada perto da maçaneta.

### Luz sob a porta (`door-light`)
- **Dia** (tag `day`): linha `y 0` em `gold-3` de `x 8–71` (largura da folha); linha `y 1` em `wood-6` de `x 6–73`; linhas `y 2–3` em `wood-lit` de `x 4–75`. O resto do sprite fica transparente.
- **Noite** (tag `night`): mais alto e mais forte. `y 0–1` em `gold-3`, com 16 px centrais em `sky-2` (a tela do computador ligada lá dentro); `y 2–3` `wood-6`; `y 4–7` `wood-lit`, alargando 2 px por linha. Desenhado sem tint.

### Variante noturna
- `entrance-bg` ganha a tag `night` e `door` ganha `closed-night` e `open-night`, **pré-renderizadas** pelo gerador com cor × `tint-night`.
- `door-interior` na noite: parede `wall-4` com poça `gold-3` da luminária à esquerda e `sky-0` mais forte à direita. Fica sem tint (é a luz do quarto).
- A plaquinha recebe 1 px de reflexo `gold-3` vindo de baixo, da luz da fresta.

---

## 3. Visão de perto do computador (M2)

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

---

## 4. Prateleira (M3) — aprovada (2026-11-07)

> **Aprovada pelo Davi em 2026-11-07** (proposta "shelf4"), exatamente como nas prévias `art-src/previews/m3-shelf4-*.png`. Único retoque depois da aprovação: o serrilhado onde as costas do cavalo ampliado encontram o colar (ver "Cavalo").
>
> - Gerador: `tools/art/scenes/bookshelf4.mjs` (quarto; usa `renderBookshelf3({ smalls })` de `bookshelf3.mjs`) e `tools/art/scenes/closeup-shelf4.mjs` (visão de perto; reaproveita peças de `closeup-shelf3.mjs`).
> - Exportação: `pnpm art` (`tools/art/build.mjs` → `build-bookshelf.mjs`). O build confere que as camadas exportadas, compostas na ordem do JSON, dão **exatamente** a cena de `renderShelf4` nos 7 estados, de dia e de noite.
> - Prévias: `node tools/art/build-m3.mjs shelf4` (folha de estados com texto de mockup) e `art-src/previews/closeup-bookshelf.png` (gerada pelo `pnpm art` a partir dos frames exportados, sem texto).

### O que há na prateleira
| Id (export) | Chave na cena | Tipo | Conteúdo (`skills.json`) | Desenho |
|---|---|---|---|---|
| `languages` | `linguagens` | livro | `languages[]` | lombada vermelha (`red-2`/`red-0`), a mais alta, etiqueta com `</>` |
| `spoken-languages` | `idiomas` | livro | `spokenLanguages[]` | lombada azul (`blue-1`/`blue-0`), etiqueta com globo |
| `tools` | `ferramentas` | cartucho | `tools[]` | grafite com ranhuras, etiqueta `cream-3` com faixa `gold-2` e ícone de branch |
| `rubiks-cube` | `hobby.cubo` | hobby | `hobbies[0]` | adesivos 3×3 nas três faces (topo claro, frente média, lado escuro), juntas `graphite-0` |
| `origami` | `hobby.origami` | hobby | `hobbies[1]` | tsuru em faces de papel `pink`/`red-3`/`red-1`/`red-0` |
| `chess` | `hobby.xadrez` | hobby | `hobbies[2]` | cavalo azul-marinho (rampa fria, ver "Cavalo") |
| `table-tennis` | `hobby.raquete` | hobby | `hobbies[3]` | raquete **deitada** na tábua; ampliada, fica em pé |
| `decor-a`, `decor-b` | `decor.0–4` | decoração | — | 5 livros sem clique: creme e amarelo antes da Linguagens; petróleo, malva e verde depois da Idiomas |

Ordem na tábua, da esquerda para a direita: decor-a, Linguagens, Idiomas, decor-b, cartucho, cubo, tsuru, cavalo, raquete. O cavalo (escuro) fica longe do cartucho (grafite), com o cubo e o tsuru entre os dois.

### Sprite do quarto (`objects/bookshelf`, `wall-back`)
| Parte | Caixa / ponto (unidades) |
|---|---|
| Tábua | `[9, 34.5, 0, 6.5, 46, 48]` (6,5 u de fundo, 4 px de espessura) |
| Mãos-francesas | x 9.8 e 32.6, 0,5 u de largura; braço na parede de z 41 a 46 e escora até y 4.5 |
| Livros em pé | `[x0, x1, 0.6, 5.4, 48, 48 + h]`: creme 9.6–10.8 (h 6.2), amarelo até 11.8 (5.2), **Linguagens** até 14.0 (8), **Idiomas** até 15.8 (7.2), petróleo até 16.9 (6.6), malva até 17.8 (5.6), verde até 19.0 (7.0) |
| Cartucho | `[19.6, 22.0, 1.8, 2.7, 48, 54]`, em pé junto da parede |
| Cubo | base `[24.6, 26.6, 2.4, 4.4]`, desenhado em px de tela (`isoCube`: meia largura 9, faces de 9 px) |
| Tsuru | mapa à mão `CRANE_S` 20×12, apoiado em (29.8, 3.6) |
| Cavalo | mapa à mão `KNIGHT4_S` 14×16, apoiado em (32.9, 3.0): `blue-1` (luz), `blue-0`, `teal-1`, `teal-0`; sulco da crina `graphite-0` |
| Raquete | mapa à mão `PADDLE_LYING_S` 17×8, deitada, centro da lâmina em (32.4, 5.4): borracha `red-2` com reflexo `red-3` e sombra `red-1`, aresta `wood-2`, cabo `gold-3`/`gold-0` ao longo da tábua |

**Arquivo:** `public/assets/objects/bookshelf.png/.json`, 1 frame (tag `idle`), **132×82** com 2 px de margem. `meta.quartoPixel`:
```json
{ "anchor": [80, 134], "tile": [2.75, 0], "mount": "wall-back", "hit": "alpha", "minHit": [24, 24], "focus": [2, 2, 128, 78] }
```
- **Âncora** (80, 134) = base da parede sob o centro da tábua, ponto do mundo (22, 0, 0) (`ANCHOR.bookshelf` em `room.mjs`). **Ponto do Tiled: (2.75, 0).** Pivot (0.6061, 1.6341): a âncora fica abaixo do frame, como na janela.
- Sem `footprint`: é objeto de parede (como a `window`) e não ocupa piso.
- `focus` = o frame sem a margem.
- À noite segue o tint da cena, como os outros móveis (sem frame pré-tingido).
- **Sombra da tábua na parede:** faixa `wall-0` no plano da parede, x `[7.6, 33.1]`, z `[30.6, 33.2]` (`renderBookshelf4Shadow`), assada no `tiles/room-shell.png`. Assim ela fica sob o tint e fora do outline de hover.
- Conferido pelo gerador: paleta (`lint`), contorno de 1 px, folga de 6 px até o monitor, topo a 112 px (56 u) da base da parede.

No quarto, a prateleira é **um interagível só**. Os itens só se separam na visão de perto.

### Visão de perto: ilustração (320×180, âncora (0, 0), escala inteira)
Estilo oblíquo "3/4 frontal" (o de `closeup-3d.mjs`):
- frentes viradas para o visitante; a profundidade aparece como topo + lateral direita, deslocados (+1, −1) px por unidade;
- topo claro, frente média, lado escuro;
- sombra na parede = silhueta deslocada (−4, +4) em `wall-0`, porque a luz vem da janela à direita;
- oclusão de 2 px sob a tábua.

Fundo: parede listrada, canto à esquerda (x 0–30), borda da cortina (x 309–319), tábua `22, 58, 272, 8` com topo de 14 px de fundo, mãos-francesas em x 44 e 264. Os itens ficam apoiados 4 px para dentro do tampo, com a base da frente em y 53.

**Itens na tábua** (`x, y, w, h`; são os valores exportados em `shelf[]`). A Linguagens sai pelo topo da imagem e é cortada em y 0.

| Id | Silhueta (`rect` = `hit`) | Hover (`hover.rect`) | Sombra (`shadow.rect`) |
|---|---|---|---|
| `languages` | `56, 0, 34, 50` | `55, 0, 36, 51` | `52, 5, 4, 39` |
| `spoken-languages` | `82, 2, 30, 48` | `81, 1, 32, 50` | `78, 11, 4, 33` |
| `tools` | `151, 17, 27, 33` | `150, 16, 29, 35` | `147, 24, 4, 20` |
| `rubiks-cube` | `181, 26, 24, 24` | `180, 25, 26, 26` | `177, 34, 4, 10` |
| `origami` | `207, 35, 26, 15` | `206, 34, 28, 17` | `203, 39, 12, 5` |
| `chess` | `237, 21, 19, 28` | `236, 20, 21, 30` | `233, 25, 10, 19` |
| `table-tennis` | `248, 44, 36, 10` | `247, 43, 38, 12` | — (deitada, a sombra cai no tampo) |
| `decor-a` / `decor-b` | `32, 8, 32, 42` / `104, 4, 48, 46` | — | assada no fundo |

Tamanhos na tábua: cubo 17×17 (+7 de fundo), tsuru 26×15 (mapa à mão), cavalo 18×26 (+3), raquete deitada 40×13 (elipse 25×10, cabo à esquerda em `wood-7`/`wood-5`/`wood-4`).

**Layout livro** (`languages`, `spoken-languages`), capa vermelha ou azul:

| Elemento | Rect |
|---|---|
| Capa dura | `40, 76, 240, 94`, 3 px de espessura (frame `highlight/<id>/book` em `40, 73, 243, 97`) |
| Páginas (folha de cima) | `46, 79, 114, 84` / `160, 79, 114, 84`; 3 camadas de folhas na borda de fora e embaixo; vinco e sombra da lombada; cabeceado |
| **Conteúdo esquerda / direita** | **`52, 83, 102, 70`** / **`166, 83, 102, 70`** (a 3×: 306×210 px CSS cada) |
| Cantos de página (botões ‹ ›) | `46, 153, 10, 10` / `264, 153, 10, 10`, já desenhados na página (canto dobrado) |

**Layout cartucho** (`tools`), sem setas e sem contador:

| Elemento | Rect |
|---|---|
| Palco | `28, 76, 82, 96`; cartucho ×3 (frame `highlight/tools/big` em `30, 71, 81, 99`) |
| Cartão | `118, 76, 174, 98`, papel com 2 px de espessura e fitas `pink` / `teal-3` (frame `highlight/tools/card` em `118, 72, 176, 102`) |
| **Conteúdo (lista)** | **`126, 84, 158, 82`**. Título (fonte H2) em y+0, filete `red-3` em y+13; as linhas começam em y+18, com passo de 12 px: ícone 8×8 em x+0 e texto em x+12. Cabem 5 linhas; com mais, duas colunas ou rolagem (decisão da UI). A 3×: 474×246 px CSS |

**Layout hobby** (cubo, tsuru, cavalo, raquete), sem legenda nem plaquinha:

| Elemento | Rect |
|---|---|
| Palco | `100, 72, 120, 82`; objeto ampliado centrado em x (frente + profundidade), base em y 156 |
| Setas ‹ › | frente `60, 104, 16, 14` / `244, 104, 16, 14`; botão `gold-1` com topo `gold-3` e 2 px de espessura (frames `arrow/prev` e `arrow/next` em `60, 102, 18, 16` / `244, 102, 18, 16`) |

| Objeto ampliado | Frente | Profundidade | Frame `highlight/<id>/big` |
|---|---|---|---|
| Cubo | 45×45 | 18 px | `128, 93, 63, 63` |
| Tsuru | 99×66 (o volume vem das faces) | — | `113, 91, 92, 62` |
| Cavalo | 49×73 | 8 px (topo `blue-1`, lado `teal-0`) | `131, 75, 55, 80` |
| Raquete (em pé) | 48×74 | 4 px (borda de madeira) | `134, 78, 52, 78` |

**Cavalo** (desenho original, perfil para a esquerda):
- orelha pontuda com dobra `teal-0`; focinho alongado com narina e boca `graphite-0`; olho com brilho `sky-1`; linha da bochecha `teal-1`;
- pescoço em "S" (crista convexa, cintura côncava, garganta recuada); crina marcada por um sulco `graphite-0` paralelo às costas, com a aresta `blue-1` ao lado;
- colar, cintura, degrau e pé, com aresta de cima `sky-1` e junta `teal-0`;
- luz da esquerda: fio `teal-3` (2 px) na frente da cabeça e do pescoço, faixa `blue-1`, meio `blue-0`, sombra `teal-1`, fundo `teal-0`.
- **Retoque (2026-11-07):** no ampliado, as costas descem retas (x 50) da cintura até o colar. O degrau 50 → 52 → 51 do contorno virava riscos de luz serrilhados na extrusão. A versão da tábua não mudou.

**Dia e noite.** À noite, o fundo, a tábua, os itens da tábua, as sombras e as setas são pré-tingidos (`tint-night`), e a cortina ganha luar `teal-3` nas colunas 310–311. **O destaque fica nas cores de dia**, com o próprio contorno: o livro aberto inteiro, o cartucho ampliado com o cartão e as fitas, o objeto ampliado. Por isso os frames `highlight/*` não têm variante noturna. A sombra do destaque escurece. No quarto, nada disso muda.

### Visão de perto: arquivos e JSON (`public/assets/ui/closeup-bookshelf.png/.json`)
Um atlas (PNG 640×1535) + JSON Hash do Aseprite com 89 frames. Cada frame é recortado (`trimmed: true`) e traz a **posição na ilustração** em `spriteSourceSize` (`x, y, w, h`), com `sourceSize` 320×180. Os ícones são 8×8, sem recorte. A mesma posição está nos `rect` do `meta.quartoPixel`.

Nomes de frame:

| Frame | Conteúdo |
|---|---|
| `bg/day`, `bg/night` | 320×180: parede, cortina, sombras da tábua e da decoração, oclusão, mãos-francesas, tábua |
| `bleed/day`, `bleed/night` | 480×308 em `(−80, −64)`: o fundo com a sangria real (§3, "Tela cheia"), com `bg/*` no meio. Esquerda: parede esquerda (listras de 4 px). Cima: parede e o varão com as argolas. Direita: a janela (vidro até `y 149`, peitoril `y 151–155`) e a parede embaixo. Embaixo: parede (a barra da cortina termina em `y 179`). À noite, estrelas e lua no vidro ficam nas cores de dia |
| `shelf/<id>/day`, `/night` | cada peça da tábua (os 7 itens e os dois grupos de decoração) |
| `shelf/<id>/hover`, `/hover-night` | item clicável com o outline `gold-2` por fora (1 px a mais em volta) |
| `shadow/<id>/day`, `/night` | sombra do item na parede (some junto com o item) |
| `highlight/<id>/<part>` | destaque nas cores de dia: `book` (capa + páginas, sem texto), `big` (cartucho ou hobby ampliado), `card` (cartão "Ferramentas", sem texto) |
| `highlight-shadow/<id>/day`, `/night` | sombra do destaque na parede |
| `arrow/prev` e `arrow/next`: `/day`, `/night`, `/hover`, `/hover-night` | setas do hobby |
| `icon/<nome>` | ícones 8×8: `java`, `leaf`, `python`, `database`, `react`, `js`, `node-js` (= campo `icon` de `languages[]`), `git`, `chart` (`tools[]`), `globe` (idiomas), `code` (símbolo do livro). São símbolos genéricos nossos, não logotipos |

`meta.quartoPixel` (rects sempre `[x, y, w, h]` em px da ilustração a 1×; os valores de frame são nomes em `frames`):

| Chave | O que é |
|---|---|
| `anchor` `[0, 0]`, `size` `[320, 180]`, `crops.full`, `minScale` 3 | como no `closeup-computer` |
| `panelBackground` | `#f6f2ec` (`cream-3`, o papel das páginas e do cartão) |
| `defaultOpen` | `"languages"`: ao abrir, o livro Linguagens já aberto no sumário |
| `drawOrder` | lembrete da ordem de composição (abaixo) |
| `bleed` | `{ left: 80, top: 64, right: 80, bottom: 64 }` (§3) |
| `background` | `{ rect, day, night, bleed: { rect: [-80, -64, 480, 308], day: "bleed/day", night: "bleed/night" } }` |
| `shelf[]` | na ordem de desenho: `{ id, kind, rect, day, night, hover?, hit?, shadow? }`. `kind` é `"book"`, `"cartridge"`, `"hobby"` ou `"decor"`; `hover` e `shadow` são `{ rect, day, night }` (`shadow` pode ser `null`); `hit` = silhueta (o clique fino pode usar o alfa do frame) |
| `highlights.<id>` | `{ layout, shadow: { rect, day, night }, parts: [{ part, rect, frame }] }`; `layout` é `"book"`, `"tools"` ou `"hobby"` |
| `layouts.book` | `cover`, `pages` [esq, dir], `content.left` / `content.right`, `pageTurn.prev` / `pageTurn.next` |
| `layouts.tools` | `stage`, `card`, `content`, `title.ruleY` 13, `firstRowY` 18, `rowPitch` 12, `rowIcon` [8, 8], `rowTextX` 12, `maxRows` 5 (offsets relativos a `content`) |
| `layouts.hobby` | `stage`, `arrows.prev` / `arrows.next` (`{ rect, day, night, hover }`), `cycle` `["rubiks-cube", "origami", "chess", "table-tennis"]` |
| `icons` | `{ size: [8, 8], frames: { <nome>: "icon/<nome>" } }` |
| `nightRule` | texto: `*/night` é pré-tingido; `highlight/*` não tem variante |

**Ordem de composição** (o build confere que ela reproduz a cena aprovada):
1. `background` (em tela cheia, `background.bleed`, que já contém o fundo);
2. `highlights[aberto].shadow`;
3. `shelf[].shadow`, menos a do item aberto;
4. `shelf[]` na ordem da lista, menos o item aberto (fica o vão);
5. `highlights[aberto].parts`;
6. setas (só no layout `hobby`).

De dia vale `day`; de noite, `night`. As `parts` são as mesmas nos dois. No hover/foco: trocar o frame do item por `hover` (ou `hover-night`), subir o item 4 px e pô-lo acima dos vizinhos (os livros se sobrepõem pela extrusão).

### Comportamento (DOM)
- **O item aberto sai da tábua:** o lugar dele fica vazio, e ele aparece embaixo, aberto ou ampliado. Cada item é um `<button>` no `hit`, com `aria-label`.
- **Linguagens:** livro, duas linguagens por página dupla.
  - Página 1 = sumário (todas, com nível e barra).
  - Depois, uma linguagem por página: ícone, nome, "nível N/100", barra e "Onde usei" (projetos cujo `tecnologias` casa com `matches`).
  - Cantos dobrados, setas do teclado e swipe viram a página.
- **Idiomas:** livro, uma página por idioma (nome, nível em texto; certificados e uso quando houver), sem paginação.
- **Ferramentas:** cartucho ampliado e o cartão com a lista inteira (ícone + nome + texto curto). Sem navegação.
- **Hobbies:** objeto ampliado, sem texto visível.
  - Setas ‹ ›, teclado e swipe percorrem `cycle`; cada troca devolve o anterior à tábua.
  - O nome do hobby vai só no `aria-label` e no `aria-live` ("Xadrez, 3 de 4").
- **Esc** fecha a visão de perto.

### Escala do conteúdo
- Linguagens novas só acrescentam páginas. Ícone novo = frame novo em `icon/`; sem desenho, a UI mostra um quadradinho.
- Ferramentas: até 5 linhas no cartão.
- Hobby novo precisa de desenho (tábua e ampliado) e de lugar. Na tábua da visão de perto sobram ≈8 px; no quarto, nada. Um 5º objeto pede tirar um livro de decoração.

### Histórico das propostas
- 1ª (`closeup-bookshelf.mjs`): um livro por skill, dicionário, cartuchos e dado; ficha de papel embaixo.
- 2ª (`bookshelf.mjs` + `closeup-shelf2.mjs`): itens por seção, livros deitados de decoração, soft skills como objetos.
- 3ª (`bookshelf3.mjs` + `closeup-shelf3.mjs`): hobbies no lugar das soft skills, cavalo branco, livro aberto menor, plaquinha de legenda, setas no cartucho.
- 4ª = a aprovada (acima): cavalo escuro, raquete deitada, hobbies sem legenda, cartucho com lista, destaque nas cores de dia à noite.

Os geradores antigos continuam para comparação (`node tools/art/build-m3.mjs bookshelf | shelf2 | shelf3`) e não exportam nada.
