# Bíblia de arte

Mantida pelo agente `art-director`. **Versão oficial do M2** (2026-10-31).

## Decisão: arte própria, gerada por código
Não usamos asset pack. Toda a arte do quarto é **nossa, gerada por código** (gerador em Node que desenha primitivas isométricas e exporta PNG), com retoques manuais pontuais quando valer a pena. O estilo se inspira no visual geral "tipo Habbo" do pack *Isometric Interiors* de pixel_Salvaje (contorno escuro, cores quentes e saturadas, três tons por material), mas **nada é copiado nem derivado dos arquivos dele**: não compramos nem baixamos o pack.

Motivos (detalhes em [opcoes-de-pack.md](opcoes-de-pack.md), hoje só histórico):
- Os packs bonitos proíbem redistribuição, e o repositório é público.
- O pack CC0 tinha origem duvidosa e paleta de ~240 cores; o GPL exigia cuidados de licença e não tinha pet nem celular.
- Nenhum pack cobria a porta, as ilustrações de "visão de perto", o celular e o caderno. Seria preciso desenhar metade de qualquer jeito.
- Gerar por código dá paleta fechada, grid exato, variantes (dia/noite, hover) de graça e arte reproduzível.

Teste aprovado pelo Davi: cena da mesa do computador (gerador `gen-desk-hd.mjs`, que a orquestradora está trazendo para o repositório).

## Projeção e grid
- **Isométrico 2:1, tile de chão 64×32 px** (largura × altura do losango). No Tiled: mapa `isometric`, `tilewidth: 64`, `tileheight: 32`.
- Eixos (origem no canto do fundo do quarto, no chão):
  - **col (+x)** corre junto à parede do fundo à direita: +1 col = **(+32, +16) px**.
  - **row (+y)** corre junto à parede da esquerda: +1 row = **(−32, +16) px**.
  - **altura (z)** em px de tela: +1 px de altura = −1 px em y.
  - Tile (c, r) no chão → tela `X = (c − r) · 32`, `Y = (c + r) · 16`.
- Alturas de referência: mesa 32 px, assento da cadeira 18 px, gabinete 40 px, topo do monitor 72 px, prateleira 84 px, parede **144 px** visíveis acima do chão (72 unidades; mais 6 px de chão por baixo e rodapé de 6 px). Era 116 px no teste; subiu a pedido do Davi (2026-11-01). Nenhum interagível com topo acima de 112 px de altura (o alto das paredes pode ser recortado pela câmera em telas baixas).
- Quarto: **7×7 tiles** (justificativa em [planta-do-quarto.md](planta-do-quarto.md)). Com paredes, a imagem do quarto mede ≈ **472×386 px** a 1× (944×772 a 2×).
- **Só escala inteira.** Os PNG são exportados a **1×**; o jogo amplia com zoom inteiro (2×, 3×…) e `pixelArt: true`. Nada de rotação, escala fracionária ou posição em meio pixel em repouso. Durante a animação de zoom da câmera o valor passa por frações (é movimento); ao parar, volta a ser inteiro.
- Unidades do gerador (para quem lê o código): 1 unidade = 1/8 de tile no chão (4 px em x, 2 px em y) e 2 px em z. **Atenção:** o comentário do `gen-desk-hd.mjs` diz "tile 64×32 = 16 unidades". Isso descreve o passo de 2 tiles (64 px para a direita, 32 para baixo), não o losango. No grid oficial, **1 tile = 8 unidades**. Por isso a mesa do teste (34×14 unidades) ocupa **≈4×2 tiles**, não 2×1. (No quarto final ela virou uma mesa em L; ver a planta.)

## Paleta oficial (48 cores)
Extraída do objeto `K` do gerador aprovado. As 97 cores originais foram reduzidas para 50 e depois para 48, quando os vasos de planta saíram do quarto (2026-11-01) e a terracota ficou sem uso. A redução foi feita juntando quase-duplicatas (diferença < ~20 em RGB) dentro de rampas por material. Conferi renderizando o teste com a paleta reduzida: o resultado fica praticamente igual ao aprovado. Arquivo para Piskel/LibreSprite: [`paleta.gpl`](paleta.gpl).

Regra: **sprite só usa cores desta tabela.** A exceção são os tons noturnos e de entardecer, que são derivados por multiplicação (ver "Dia, entardecer e noite").

| Grupo | Token | Hex | Uso principal |
|---|---|---|---|
| Contorno | `outline` | `#2a1b2a` | contorno de 1 px de todo objeto |
| Grafite (eletrônicos) | `graphite-0` | `#1f1c28` | face direita de monitor, gabinete, controle e base da cadeira; ventilação |
| | `graphite-1` | `#2f2c3a` | face frontal: moldura do monitor, gabinete, base da cadeira |
| | `graphite-2` | `#4a4659` | topos; brilho da base da cadeira |
| | `graphite-3` | `#5d5875` | aresta de luz do gabinete |
| Madeira (móveis e piso) | `wood-0` | `#5a2e22` | fundo sob a mesa, café |
| | `wood-1` | `#7a472b` | sombra de contato no piso, juntas do piso, 30% inferior da face direita |
| | `wood-2` | `#97502c` | face direita (+x); oclusão do piso junto à parede; veio na tábua clara |
| | `wood-3` | `#ab693a` | tábua de piso B; frestas de gaveta; veio na tábua escura do topo |
| | `wood-4` | `#b8733e` | tábua de piso A; 30% inferior da face frontal |
| | `wood-5` | `#c87138` | face frontal (+y); veio no topo da mesa |
| | `wood-lit` | `#d39258` | piso iluminado pelo sol da janela |
| | `wood-6` | `#e8944a` | topo da mesa |
| | `wood-7` | `#ffc27a` | aresta de luz (1 px) dos topos e faces frontais |
| Dourado / amarelo | `gold-0` | `#c09a45` | cortina e livro amarelo (sombra), latão escuro |
| | `gold-1` | `#e9c46a` | cortina, puxadores de latão, livro amarelo |
| | `gold-2` | `#f4b860` | **= `--accent`**: outline de hover, destaque no código da tela |
| | `gold-3` | `#f6dc8f` | brilho da cortina, lâmpada, luz sob a porta |
| Malva (rodapé e topo da parede) | `mauve-0` | `#4a3240` | topo da parede, lado do rodapé |
| | `mauve-1` | `#6d5560` | rodapé; aresta do topo da parede |
| | `mauve-2` | `#836a75` | aresta de luz do rodapé |
| Parede | `wall-0` | `#93a9ae` | oclusão da parede (faixa sobre o rodapé e no canto) |
| | `wall-1` | `#9fb7bd` | listra B da parede do fundo (direita, a da janela) |
| | `wall-2` | `#a9c1c6` | listra A da parede do fundo (direita) |
| | `wall-3` | `#bfcfd2` | listra B da parede esquerda |
| | `wall-4` | `#c9d8da` | listra A da parede esquerda |
| | `wall-5` | `#dce7e8` | brilho da janela na parede: 2 px nas laterais da moldura e sob o peitoril |
| Creme (papel, plástico, moldura) | `cream-0` | `#a79f94` | frestas do teclado, lado escuro da caneca, sombra da moldura |
| | `cream-1` | `#c8b89c` | face frontal do teclado, lateral da moldura da janela |
| | `cream-2` | `#e7e1d8` | topo do teclado, moldura e peitoril da janela, lateral da caneca |
| | `cream-3` | `#f6f2ec` | teclas, papel, borda da caneca, nuvem |
| Céu / ciano | `sky-0` | `#5ec4d6` | **= `--cyan`**: céu, LED, brilho de tela |
| | `sky-1` | `#8fd3e8` | vidro da janela |
| | `sky-2` | `#c6f6fb` | reflexo no vidro, brilho forte de LED e tela |
| Petróleo (telas e luminária) | `teal-0` | `#132f3d` | fundo da tela ligada |
| | `teal-1` | `#1f4a5c` | reflexo na tela; lado da luminária |
| | `teal-2` | `#2b5f74` | barra de título da tela; corpo da luminária |
| | `teal-3` | `#5f97a3` | topo/brilho da luminária; texto "comentário" na tela |
| Vermelho e rosa | `red-0` | `#83303a` | lado e costura da cadeira |
| | `red-1` | `#b04049` | frente da cadeira; lado do livro rosa |
| | `red-2` | `#c84f57` | assento e encosto iluminados |
| | `red-3` | `#d9666a` | aresta de luz da cadeira |
| | `pink` | `#e3789a` | livro rosa, sintaxe na tela, botão do controle |
| Azul | `blue-0` | `#3a5f8c` | lado do livro azul |
| | `blue-1` | `#4f7fb8` | livro azul |
| Verde | `leaf-0` | `#3e7e3a` | livro verde (lado), folhagem futura na sombra |
| | `leaf-1` | `#5fae4e` | livro verde, folhagem futura |
| | `leaf-2` | `#9ad86f` | sintaxe verde na tela, botão do controle, folhagem futura iluminada |

Rampas que vão faltar no M3 (adicionar com aprovação, mantendo ≤ 56 cores): um terceiro azul claro (`blue-2`, para a coberta da cama ter topo/frente/lado) e talvez tons do pet (pelagem). Toda cor nova entra nesta tabela e no `paleta.gpl` antes de ser usada.

### Tokens de UI (DOM, `src/app/global.css`) — continuam
| Token CSS | Hex | Relação com a paleta |
|---|---|---|
| `--bg` | `#1b1526` | fundo fora do quarto (não é cor de sprite) |
| `--panel` | `#2b2140` | fundo de painéis (só UI) |
| `--border` | `#0f0b17` | contorno de painéis (só UI) |
| `--ink` | `#f3e9d2` | texto (só UI) |
| `--accent` | `#f4b860` | = `gold-2` |
| `--cyan` | `#5ec4d6` | = `sky-0` |

### Correspondência com o `K` do gerador
Para a orquestradora ou o `scene-engineer` trocarem os valores de `K` pelos tokens (os nomes das chaves podem continuar os mesmos):

| Token | Chaves de `K` |
|---|---|
| `outline` | outline |
| `graphite-0` | monSide, chairBaseSide, towerSide, vent |
| `graphite-1` | monBody, monBezel, chairBase, towerFront |
| `graphite-2` | monTop, chairBaseHi, towerTop |
| `graphite-3` | towerHi |
| `wood-0` | woodDark, coffee |
| `wood-1` | woodSide2, floorSeam, floorShadow, coffeeHi |
| `wood-2` | woodSide, floorAO |
| `wood-3` | woodSeam, floorB, floorGrain |
| `wood-4` | woodFront2, floorA |
| `wood-5` | woodFront, woodGrain |
| `wood-lit` | floorLitA, floorLitB |
| `wood-6` | woodTop, woodTop2 |
| `wood-7` | woodHi |
| `gold-0` | brassDark, curtainDark, book3s |
| `gold-1` | brass, curtain, book3 |
| `gold-2` | accent |
| `gold-3` | curtainHi, bulb |
| `mauve-0` | wallCap, wallBaseSide |
| `mauve-1` | wallBase, wallCapHi |
| `mauve-2` | wallBaseHi |
| `wall-0` … `wall-5` | wallAO, wallBack2, wallBack, wallLeft2, wallLeft, wallLeftHi |
| `cream-0` | keyGap, keyDark, mugDark, winFrameDark |
| `cream-1` | keySide, winFrameSide |
| `cream-2` | keyTop, mugSide, winFrame, sill |
| `cream-3` | keyKey, mugTop, mugLit, page, cloud |
| `sky-0` | glow, led, sky |
| `sky-1` | glass, glass2 |
| `sky-2` | glassHi, glowHi, ledHi |
| `teal-0` … `teal-3` | screen; screenHi, lampSide; bar, lampBody; lampHi, dim |
| `red-0` | chairSide, chairSeam |
| `red-1` | chair, book2s |
| `red-2` | chairLit |
| `red-3` | chairTop |
| `pink` | pink, book2 |
| `blue-0` / `blue-1` | book1s / book1 |
| `leaf-0` | leafDark, leafDeep |
| `leaf-1` | leaf |
| `leaf-2` | leafHi, green |
| (UI `--bg`) | bg (fundo do preview; no asset final é transparente) |
| (sem uso) | pot, potLit, potSide, soil (vasos removidos em 2026-11-01) |

Dois ajustes de regra que acompanham a troca: o **veio do piso** passa a ser "um tom abaixo da tábua" (tábua A `wood-4` → veio `wood-3`; tábua B `wood-3` → veio `wood-2`), e **juntas dentro da sombra** usam `wood-0`, para não sumirem na sombra `wood-1`.

## Regras de desenho
Valem para o gerador e para qualquer retoque à mão.

1. **Contorno:** 1 px `outline` em volta da silhueta de cada objeto. Ele fica **dentro** da silhueta (substitui os pixels da borda), não fora. Partes internas de um mesmo objeto (folhas sobrepostas, livros da pilha) não ganham contorno entre si: separam-se por tom.
2. **Três tons por material**. É uma **constante de estilo** (como no Habbo), que não depende de onde fica a janela:
   - **topo** = tom claro;
   - **face frontal-esquerda (+y)** = tom médio;
   - **face direita (+x)** = tom escuro.
3. **Aresta de luz:** 1 px do tom mais claro (`*-7`, `*-3`, `red-3`…) nas arestas da frente do topo (bordas +x e +y) e na linha de cima da face frontal.
4. **Volume nas laterais:** os 30% de baixo das faces frontal e direita usam um tom abaixo (ex.: `wood-5` → `wood-4`; `wood-2` → `wood-1`).
5. **Oclusão ambiente:** faixa de ~3 px no piso junto às paredes (`wood-2`) e faixa de ~9 px na parede logo acima do rodapé e no canto (`wall-0`).
6. **Sombra de contato:** projeção do footprint do móvel no piso, deslocada ~1 tile/5 (≈6 px) para a frente (+x e +y), em **um tom só** (`wood-1`), com borda dura. Sombras ficam assadas na imagem do piso (`room-shell`).
7. **Luz da janela no piso:** a janela fica na parede do fundo à direita (plano `row = 0`). O sol é um paralelogramo que sai da janela para a frente do quarto e se inclina um pouco para a esquerda (para o centro), em `wood-lit` (veio `wood-4`). Em volta da moldura, na parede, há um brilho `wall-5`. Tudo isso fica num sprite separado (`light-window`) para trocar à noite. A janela muda só essa mancha e o brilho; o sombreado das faces (regra 2) continua igual.
8. **Redondos são cilindros:** tampa elíptica e lateral em três faixas verticais (27% esquerdo claro, meio médio, 27% direito escuro), opcional 1 px de aro.
9. **Folhagem são manchas:** elipses sobrepostas, desenhadas de trás para frente; canto superior esquerdo de cada uma em `leaf-2`, inferior direito em `leaf-0`.
10. **Madeira tem veio** por ruído determinístico (mesma semente → mesmo desenho). Piso em tábuas de 16 px de largura, comprimento variável, juntas de 1 px em `wood-1`.
11. **Paredes:** papel listrado (listras de 16 px ao longo da parede, alternando os dois tons da parede), rodapé de 6 px (`mauve-1` com aresta `mauve-2`) e topo da parede com espessura de 12 px (`mauve-0`, aresta `mauve-1`).
12. **Proibido:** dithering, anti-aliasing, degradês, preto ou branco puros, contorno colorido por material, sombras semitransparentes no sprite (transparência só 0 ou 255).
13. **Hover** (interagíveis): outline duplo **por fora** do contorno escuro: 1 px em `gold-2` e, por fora dele, 1 px em `outline` (`#2a1b2a`), para ler sobre fundos claros (tampo, poça da luminária) e escuros (M3, achado do QA). Por isso todo sprite interagível tem **2 px de margem transparente** em volta. O efeito é aplicado por código (não há frame de hover desenhado), exceto quando a spec pede um brilho específico (maçaneta da porta).
14. **Aviso de interagível** (todo objeto clicável, no quarto **e** nas visões de perto): anel de 1 px **branco puro** (`#ffffff`, exceção à regra 12 por ser efeito de interface) por fora do contorno, na mesma margem do hover, piscando (opacidade 1 → 0,15 → 1 em 2 s, *ease-in-out*; parado a 0,8 com reduced motion). Gerado por código a partir do alfa do sprite: no quarto `ensureOutlineTexture(..., PALETTE.cue, null)` + tween em `Room.ts`; nas visões de perto, `CuedSprite`/`CueRing` (`src/ui/closeup/CueRing.tsx`) com a classe `.interact-cue`, ligado pelas flags `cue`/`hot`/`ringOnly` das camadas (`CueFlags`); `ringOnly` quando o desenho normal já está no fundo (setas dos quadros, cantos do caderno). Sobre fundo claro (tela creme do celular) o anel leva **1 px `outline` por fora** (`cueEdge`), senão some. Na janela do computador (DOM), o anel é desenhado no SVG da pasta (`.folder-icon__cue`). O que não ganha anel: o item já aberto/selecionado, setas e cantos sem destino, currículo sem PDF. No quarto o hover dourado substitui o anel; nas visões de perto **não há contorno dourado**: no hover/foco o anel para de piscar e fica aceso. Some quando o objeto não está clicável (zoom, painel aberto).
14. **Telas e luzes** (monitor, LED, celular, abajur) são os únicos pontos de cor fria intensa (`sky-*`) ou amarela intensa (`gold-3`) e continuam visíveis à noite.

## Dia, entardecer e noite
- **Dia (7h–17h):** arte como está.
- **Entardecer (17h–19h) e noite (19h–7h):** o quarto é **multiplicado** por uma cor de tint (retângulo com blend MULTIPLY por cima do quarto). Valores iniciais, a ajustar olhando: `tint-dusk #f2c3a0`, `tint-night #6a6aa8`. Esses tons derivados não contam na paleta.
- **Fontes de luz ficam acima do tint** e usam só cores da paleta:
  - janela: frame `night` (céu `teal-0`/`teal-1`, lua `cream-3`, estrelas `sky-2`) e `dusk` (céu `pink`/`red-3`/`gold-1`, sol `gold-3`). Só o vidro é luz: nesses dois frames a moldura, o peitoril e as cortinas já vêm multiplicados pelo tint do período, e o sprite inteiro fica acima do tint;
  - `light-window`: de dia, mancha de sol (`wood-lit`, `wall-5`); no entardecer, mancha mais longa em `wood-6`; de noite, mancha de luar (`teal-2` no piso, 1 tom; `teal-3` ficou forte demais e parecia um tapete);
  - abajur e luminária: frame `on` (sob o tint) + camada de luz (`light-computer`, acima do tint) com a lâmpada e a poça pintadas nas cores de dia da área iluminada;
  - toda camada de luz sai do gerador já recortada pelos objetos que ficam na frente dela, para poder ir acima do tint sem cobrir nada;
  - monitor, LED do gabinete e celular: sem mudança (já são luz).
- **Cenas frontais** (porta, visões de perto): mesma conta, mas a variante noturna é **pré-renderizada pelo gerador** (cor × `tint-night`), porque as luzes ficam atrás de outros elementos e a ordem de camadas complicaria o tint em tempo real.
- **Visões de perto no entardecer (2026-11-13):** cada visão tem também a variante `dusk`, pré-renderizada pelo gerador como **frame de dia × `tint-dusk`** (`toDusk`, `tools/art/scenes/closeup-bleed.mjs`). Vale para o fundo (`bg/dusk`, `bleed/dusk`), as sombras e as setas; os objetos em destaque ficam nas cores de dia, como à noite. Sem luzes acesas (luminária, halo do monitor e da tela do celular só à noite, como no quarto); a tela acesa e o LED do computador ficam nas cores de dia. O vidro das janelas (computador, prateleira, headset) ganha o céu de pôr do sol da janela do quarto: `pink` no alto, `red-3`, `gold-1` perto do peitoril (faixas de transição pontilhadas), sol `gold-3` com miolo `cream-3` e halo `wood-7`, nuvens finas `pink`/`red-1`. No JSON, `dusk` ao lado de `day`/`night` em cada par; no computador, as tags `off-dusk`, `boot-dusk` e `on-dusk`. Sem `dusk`, o React usa `day`.
- `prefers-reduced-motion`: troca de período sem transição.

## Arquivos, nomes e âncoras
### Pastas
- `public/assets/tiles/` — `room-shell.png` (piso + paredes + rodapé + tapete + oclusão + sombras de contato; tudo o que é plano e nunca muda), `entrance-bg.png`.
- `public/assets/objects/` — objetos do quarto e da cena da porta: interagíveis (`computer`, `frames`, `portrait`, `bookshelf`, `journal`, `phone`), decoração (`desk-chair`, `pc-tower`, `desk-lamp`, `bed`, `pet-bed`, `window`), luzes (`light-window`, `light-computer`, `light-journal`) e a porta (`door`, `door-interior`, `door-knob-glow`).
- `public/assets/characters/` — `pet`, `avatar`.
- `public/assets/ui/` — ilustrações de visão de perto (`closeup-computer.png`, `closeup-computer-frame.png`…).
- Fontes de retoque à mão: `art-src/` (fora do build).

### Nomes
- kebab-case, em inglês. **Interagível = `id` do registry** (`computer.png` + `computer.json`). Decoração e luz: nome descritivo (`desk-chair`, `light-window`).
- Variantes são **tags de animação** no mesmo arquivo, não arquivos separados: `idle`, `on`/`off`, `day`/`dusk`/`night`, `closed`/`open`.
- Partes de um grupo que precisam ficar alinhadas (ex.: luminária e controle sobre a mesa) são exportadas **no mesmo tamanho de canvas e com a mesma âncora** do objeto principal, como camadas. Assim todas vão no mesmo ponto do Tiled.

### Formato
- PNG RGBA a 1×, sem trim (todos os frames do mesmo tamanho), mais JSON no formato **Hash do Aseprite** (o Phaser carrega com `load.aseprite`): `frames` com chave `<id> <n>`, `meta.frameTags` com as tags, `meta.size`, `meta.image`.
- Cada frame leva `"pivot": { "x": ax / w, "y": ay / h }`. O parser `JSONHash` do Phaser 4 lê esse campo e aplica a origem do sprite sozinho. `ax`/`ay` são **inteiros** em px do canvas.
- Metadados do projeto em `meta.quartoPixel` (o Phaser copia para `texture.customData.meta`):
  ```json
  { "footprint": [[0, 0, 4, 2], [0, 2, 2, 2]], "anchor": [122, 110], "mount": "floor", "hit": "alpha", "minHit": [24, 24] }
  ```
  `footprint` é uma lista de retângulos `[col, row, cols, rows]` relativos ao canto do objeto (um só retângulo para móveis comuns; dois para a mesa em L); `mount` é `floor`, `wall-back` (parede do fundo, à direita), `wall-left` ou `surface` (objeto sobre móvel, com `surfaceOf: <id do móvel>` e `depthOffset: 0.01`); `hit` é `alpha` (silhueta) ou uma lista de pontos de polígono; `minHit` é o alvo mínimo de clique/toque em px de canvas (objetos pequenos como `phone` e `journal` ganham área ampliada).

### Âncora (ponto que vai na posição do objeto no Tiled)
- **Objeto de chão:** centro do footprint **no chão** (z = 0). Em footprints com mais de um retângulo (mesa em L), vale o centro do retângulo envolvente. Ex.: cama 4×2 em (0,5) → âncora no ponto de chão (2, 6). A profundidade de desenho é `col + row` desse centro.
- **Objeto de parede:** ponto da base da parede (z = 0) logo abaixo do centro do objeto. A altura do objeto na parede já está no desenho. Profundidade: logo acima da parede, abaixo de qualquer objeto de chão.
- **Objeto sobre móvel** (celular na cama, caderno na mesa): sprite próprio, âncora no centro do footprint **do móvel** e profundidade do móvel + 0,01.
- **Cenas frontais** (porta, visões de perto): âncora no canto superior esquerdo `(0, 0)`. As posições são dadas em px da ilustração.

### Retoque à mão (Piskel / LibreSprite)
1. Carregar `docs/arte/paleta.gpl` e trabalhar a 1×, no grid de 64×32.
2. Não editar o PNG gerado: o retoque é uma **camada de correção** `art-src/patches/<id>.png`, do mesmo tamanho do canvas, transparente onde não muda. O gerador compõe a correção por cima ao exportar. Assim a arte continua reproduzível e o retoque não se perde quando o gerador roda de novo.
3. Peças 100% à mão (se houver) ficam em `art-src/<id>.piskel` e são exportadas com o mesmo formato, âncora e pivot descritos acima.
4. Conferir: só cores da paleta, contorno de 1 px, margem de 2 px nos interagíveis, nenhum pixel semitransparente.

### Licenças
A arte gerada pelo projeto é registrada em `public/assets/LICENSES.md` como "gerado pelo projeto", com o caminho do gerador. Se algum dia entrar asset de terceiros, só CC0, CC-BY (com crédito) ou licença explícita do autor que permita repositório público.

## Specs
- Planta do quarto: [planta-do-quarto.md](planta-do-quarto.md).
- Sprites do M2 (grupo do computador, porta do quarto, visão de perto do computador): [specs.md](specs.md).
- M3: quadros, retrato, prateleira (`bookshelf`), caderno, celular, cama e pet (o diploma saiu em 2026-11-09: a formação virou página do caderno); M4: avatar e animações do pet.
