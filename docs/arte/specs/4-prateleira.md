# 4. Prateleira (M3) — aprovada (2026-11-07)

> Parte das [specs de sprites](../specs.md). Convenções de coordenadas e unidades estão lá.

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

**Dia e noite.** **Desde 2026-11-09 a prateleira fica sempre iluminada:** no quarto o sprite tem `light: true` (fora do tint do entardecer e da noite; a sombra assada no `room-shell` continua escurecendo). Na visão de perto, só os **objetos da tábua** (`shelf/<id>`, inclusive a decoração) usam sempre o frame de dia; o fundo (parede, tábua, cortina com luar), as sombras e as setas continuam com a variante de noite. Os frames `shelf/<id>/night` ficam fora de uso. Histórico: À noite, o fundo, a tábua, os itens da tábua, as sombras e as setas são pré-tingidos (`tint-night`), e a cortina ganha luar `teal-3` nas colunas 310–311. **O destaque fica nas cores de dia**, com o próprio contorno: o livro aberto inteiro, o cartucho ampliado com o cartão e as fitas, o objeto ampliado. Por isso os frames `highlight/*` não têm variante noturna. A sombra do destaque escurece. No quarto, nada disso muda.

### Visão de perto: arquivos e JSON (`public/assets/ui/closeup-bookshelf.png/.json`)
Um atlas (PNG 640×1535) + JSON Hash do Aseprite com 89 frames. Cada frame é recortado (`trimmed: true`) e traz a **posição na ilustração** em `spriteSourceSize` (`x, y, w, h`), com `sourceSize` 320×180. Os ícones são 8×8, sem recorte. A mesma posição está nos `rect` do `meta.quartoPixel`.

Nomes de frame:

| Frame | Conteúdo |
|---|---|
| `bg/day`, `bg/night` | 320×180: parede, cortina, sombras da tábua e da decoração, oclusão, mãos-francesas, tábua |
| `bleed/day`, `bleed/night` | 480×308 em `(−80, −64)`: o fundo com a sangria real (§3, "Tela cheia"), com `bg/*` no meio. Esquerda: parede esquerda (listras de 4 px). Cima: parede e o varão com as argolas. Direita: a janela (vidro até `y 149`, peitoril `y 151–155`) e a parede embaixo. Embaixo: parede (a barra da cortina termina em `y 179`). À noite, estrelas e lua no vidro ficam nas cores de dia |
| `shelf/<id>/day`, `/night` | cada peça da tábua (os 7 itens e os dois grupos de decoração) |
| `shelf/<id>/hover`, `/hover-night` | item clicável com o outline `gold-2` por fora (1 px a mais em volta). **Fora de uso desde 2026-11-09**: o clicável usa o frame normal + anel branco piscando (bíblia, regra 14) |
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

De dia vale `day`; de noite, `night`. As `parts` são as mesmas nos dois. Todo clicável (itens da tábua e setas ‹ ›) tem o anel branco piscando (bíblia, regra 14); os frames `hover` não são mais usados. No hover/foco: o anel fica aceso, subir o item 4 px e pô-lo acima dos vizinhos (os livros se sobrepõem pela extrusão).

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
