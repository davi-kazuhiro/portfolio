# 5. Caderno (M3) — aprovado (2026-11-08)

> Parte das [specs de sprites](../specs.md). Convenções de coordenadas e unidades estão lá.

> **Aprovado pelo Davi em 2026-11-08: versão A** (capa dura vermelha com elástico, fita marcador dourada, caneta grafite; de perto, pautado com margem vermelha, abas de papel, carimbo, checklist, cantos de virar página, luminária e post-its; à noite o caderno fica iluminado). Padrões adotados para as perguntas sem resposta: capa vermelha; a luminária da visão de perto é **o mesmo objeto do quarto** (redesenhada para igualar); caixinhas vazia e marcada como frames, o DOM escolhe (padrão: todas marcadas); texto e fonte da UI (nada na arte).
>
> **Revisão de 2026-11-09 (aprovada pelo Davi em 2026-11-09 e integrada):** o objeto `diploma` saiu do quarto e a formação virou a última página dupla do caderno (`type` = `education`, aba azul-céu, carimbo com capelo). As abas ficaram **longas (30 px)** para levar o nome do tipo escrito na horizontal (texto do DOM); a caneta foi para a sangria da esquerda e a poça da luminária ficou mais larga (rx 210).
>
> - Gerador: `tools/art/scenes/journal.mjs` (quarto) e `tools/art/scenes/closeup-journal.mjs` (visão de perto, com a sangria real).
> - Exportação: `pnpm art` (`tools/art/build.mjs` → quarto; `tools/art/build-journal.mjs` → visão de perto). O build confere que as camadas exportadas, compostas na ordem do JSON, dão **exatamente** a cena de `renderJournalScene` em 24 estados (1, 2, 3, 4 e 6 páginas, com os três tipos, todas as páginas, dia e noite: 32 estados).
> - Prévias: `art-src/previews/closeup-journal.png` (composta pelos frames exportados: a ordem real research, work, education nas páginas 1 a 3, dia | noite, com hover alternado; na última linha, a página 2 com o retângulo do nome de cada aba pontilhado em `pink` e 6 abas abertas na página 4, à noite), a linha de baixo de `closeup-bleed.png` (fundo com sangria) e `room-m2*.png`. A variação B (espiral azul) não é exportada; fica só como histórico em `node tools/art/build-m3.mjs journal`.
> - Paleta: o build confere alfa 0/255 e as 48 cores em tudo o que é de dia e, à noite, no que fica nas cores de dia.

### Sprite do quarto (`objects/journal`)
| Parte | Caixa (unidades) | Tokens |
|---|---|---|
| Capa dura | `[4, 9.5, 19, 26, 16, 18.5]` (5 px de espessura), lombada na borda −x | topo `red-2`, frente `red-1`, lado `red-0`, aresta `red-3`; folhas `cream-*` entre as capas |
| Elástico | faixa x 7.9–8.5, atravessa o topo e a face +y | `graphite-1` / `graphite-2` |
| Fita marcador | 5×5 px saindo da base (+y), ponta em "V", embaixo do caderno | `gold-1` / `gold-0` |
| Caneta | `[10.8, 11.5, 19.6, 25.2, 16, 16.8]` | `graphite-*`, ponta `gold-1` |

**Arquivos:** `public/assets/objects/journal.png/.json` (1 frame, tag `idle`) e `public/assets/objects/light-journal.png/.json` (1 frame, tag `night`), ambos **60×36** com 2 px de margem e a mesma âncora.

`journal.json` → `meta.quartoPixel`:
```json
{ "anchor": [90, 57], "tile": [2, 2], "mount": "surface", "surfaceOf": "computer", "depthOffset": 0.01,
  "hit": "alpha", "minHit": [24, 24], "focus": [2, 2, 56, 32] }
```
`light-journal.json` → `{ "anchor": [90, 57], "tile": [2, 2], "layerOf": "journal", "light": true, "hit": "none" }`.

- **Ponto do Tiled: (2, 2)**, o mesmo do `computer`. **Âncora** (90, 57) = ponto do mundo (16, 16, 0), o centro do footprint da mesa (bíblia, "Objeto sobre móvel"); fica fora do frame (pivot 1,5 / 1,583), como na janela.
- **Profundidade:** a do `computer` + 0,01 (`depthOffset`): acima da mesa, abaixo da cadeira e do gabinete. Sem `footprint`.
- `mount: "surface"` + `surfaceOf: "computer"` são valores novos (o `Mount` de `spriteMeta.ts` hoje só conhece `floor` e `wall-*`).
- Nenhum pixel em comum com a luminária (o build confere).
- **Noite:** o caderno fica sob o tint, como os móveis; a camada `light-journal` (acima do tint) traz os pixels do caderno e da caneta que caem na poça da luminária (círculo r 10 u em (3, 26) no tampo), nas cores de dia, já recortada pela cadeira e pelo gabinete.
- **`light-computer` regerado:** a poça agora é recortada pelo caderno (senão pintaria a mesa por cima dele). Mesmo tamanho, âncora e frames.

### Visão de perto: ilustração (320×180 + sangria 80/64, âncora (0, 0), escala inteira)
O visitante está sentado no braço B, olhando para o tampo: caderno **aberto** deitado na mesa, parede esquerda no alto, luminária à direita (a cúpula fica na sangria de cima). Cada página dupla = uma experiência: esquerda = título, local, período e o carimbo do tipo; direita = os itens em checklist.

- **Parede esquerda** no alto: listras de 8 px `wall-4`/`wall-3`, oclusão `wall-0` em `y 18–19`.
- **Tampo:** borda de trás em `y 20`; `wood-6` com veio `wood-5` até a aresta da frente, em `y 214`, já na sangria. Abaixo dela, a frente da mesa e o vão escuro.
- **Sombras:** silhueta deslocada (−4, +4), em `wood-4`, só no tampo.

| Elemento | Rect `[x, y, w, h]` (px da ilustração a 1×) | Tokens |
|---|---|---|
| Capa (frente) | **sem borda desde 2026-11-09:** `27, 27, 262, 144` (o tamanho do bloco de folhas com as camadas), sem espessura; o vermelho só aparece na lombada. Frame `book` em `27, 26, 262, 146` | `red-2`, aresta `red-3`, embaixo `red-0`; lombada de pano `red-0` |
| Folhas (esq. / dir.) | `30, 27, 128, 141` / `158, 27, 128, 141`, 3 camadas na borda de fora e embaixo; curva e vinco na dobra; cabeceado `red-0` | `cream-3`, camadas `cream-0…2` |
| Margem | linha vertical em `x 40` e `x 166` | `red-3` |
| **Conteúdo esquerda** | **`44, 34, 104, 124`** (a 3×: 312×372 px CSS) | texto do DOM |
| **Conteúdo direita** | **`170, 34, 104, 124`** | texto do DOM |
| Carimbo do tipo (dentro do conteúdo esquerdo, embaixo à direita; o texto não entra nele) | `116, 126, 30, 30` (frames `stamp/*` em `117, 127, 28, 28`) | anel de 2 px + maleta (`work`) / erlenmeyer (`research`) / capelo (`education`), na tinta do tipo |
| Cantos de página ‹ › (desenhados na folha) | `30, 158, 10, 10` / `276, 158, 10, 10` | dobra `cream-2`/`cream-0`, folha de baixo `cream-1`; hover: dobra de 7 px com borda `gold-2` |
| Abas, slot `j` (0…5) | direita `286, 38 + 22j, 30, 16`; a ativa `286, 38 + 22j, 33, 16` (+3 px para a direita; com o hover vai até x 319); esquerda `4, 38 + 22j, 30, 16` (a borda de dentro continua em x 33) | papel: contorno, faixa clara em `y+1`, cor do tipo em `y+2…y+12`, escura em `y+13…y+14` |
| **Nome da aba** (texto do DOM, slot 0; somar `22j` em y) | direita `289, 40, 24, 11`; ativa `289, 40, 27, 11`; esquerda `7, 40, 24, 11` (o papel sem o contorno, com 2 px de folga de cada lado) | tinta `graphite-1` (#2f2c3a) |
| Luminária | base `297, 22, 31, 15` (no tampo, encostada na parede), haste `308, −12, 8, 39`, cúpula `293, −42, 39, 31` (na sangria) | como no quarto (abaixo) |
| Caneta | **na sangria da esquerda**, `x −20…−13, y 46–144`, levemente inclinada (até 2026-11-08 ficava em `x 2–9, y 52–150`, onde agora entram as abas da esquerda) | `graphite-*`, clipe e ponteira `gold-*` |
| Post-its | dois na parede (sangria de cima, à esquerda), um no tampo (sangria da esquerda) | `pink`/`red-1`, `leaf-2`/`leaf-1`, `gold-3`/`gold-1` |

- **Nome das abas (DOM):** o tipo da página, do i18n: PT "Pesquisa", "Trabalho", "Formação"; EN "Research", "Work", "Education" (o mais longo, 9 letras). Uma linha, sem quebra, centrado no `tabs.label[estado]`, na fonte da cena (`sceneFontSize`, VT323). A VT323 avança 0,4 em e sai 1,25× maior (`font-size-adjust: 0.5`), ou seja **0,5 × font-size por letra**: a 3× (14 px CSS) são 7 px CSS = 2,33 px de arte por letra e "Education" ocupa **21 px de arte** dos 24 (27 na ativa); a 4× ou mais, 2 px por letra (18 px). Altura: 11 px de arte (33 px CSS a 3×) para uma linha de ≈6 px. Contraste do `graphite-1` sobre as abas: 8,2:1 (`gold-1`), 5,0:1 (`leaf-1`), 8,2:1 (`sky-1`). Sugestão ao `ui-engineer`: `white-space: nowrap; overflow: hidden`, para o fallback monoespaçado (0,6 em, ≈25 px) não vazar durante o `font-display: swap`.
- **Pauta e ritmo do texto:** linhas `sky-1` em `y = 40 + 7k` (até `y 159`); cada caixa de linha tem 7 px (`34 + 7k` a `40 + 7k`), **17 linhas por página**. No DOM: `line-height = 7·s` px, com a primeira linha no topo do retângulo de conteúdo, para o texto assentar na pauta. A 3×, 21 px por linha; com fonte de ≈14 px cabem ≈44 caracteres por linha, e os 4 itens do Bradesco (o caso mais longo) cabem inteiros.
- **Página esquerda:** título (até 4 linhas), uma linha vazia, local (ícone `pin`) e período (ícone `calendar`), com os ícones 7×7 na tinta do tipo em x+0 e o texto em x+10. O carimbo fica embaixo, à direita.
- **Página direita:** checklist, uma linha vazia entre itens. Caixa do item em x+0 (frame 9×8 desenhado em `(x do conteúdo, topo da caixa de linha − 2)`), texto em x+10, com o recuo das linhas seguintes alinhado ao texto. Padrão: **todas marcadas** (`check/done/<tipo>`); `check/empty` fica disponível se o conteúdo um dia tiver item em andamento.
- **Cores por tipo** (chaves = campo `type` de `experiences.json`):

| `type` | Aba (cor / escura / clara) | Tinta (carimbo, ícones, visto) | Carimbo |
|---|---|---|---|
| `work` | `gold-1` / `gold-0` / `gold-3` | `wood-2` (#97502c) | maleta |
| `research` | `leaf-1` / `leaf-0` / `leaf-2` | `leaf-0` (#3e7e3a) | erlenmeyer |
| `education` | `sky-1` (#8fd3e8) / `sky-0` (#5ec4d6) / `sky-2` (#c6f6fb) | `blue-0` (#3a5f8c; 5,9:1 sobre `cream-3`) | capelo (chapéu de formatura) com borla |

Ordem das páginas: research, work, **education por último**. Na página dupla de formação, a esquerda traz o bacharelado e a direita o ensino médio técnico (só texto do DOM; a arte é a mesma das outras páginas, com o carimbo do capelo na esquerda).

- **Tinta do texto no DOM (sugestão):** títulos `graphite-1` (#2f2c3a); corpo `teal-1` (#1f4a5c, "caneta azul-escura"). Papel `cream-3` (`panelBackground: #f6f2ec`).
- **Luminária = a do quarto** (`lampObject` em `computer.mjs`): base redonda (cilindro), haste reta, lâmpada sob a cúpula e **cúpula cilíndrica (tambor)**. Cilindros como no gerador do quarto: topo `teal-3`; lateral `teal-3` (27% da esquerda, luz), `teal-2` no meio, `teal-1` (27% da direita); haste `teal-2`/`teal-1`. Lâmpada `cream-2` apagada e `gold-3` acesa; à noite o aro de baixo da cúpula fica `gold-1` (como o `rimBottom` do quarto). De dia, sombra da cúpula e da haste na parede (−4, +4) em `wall-0`. *Pendência fora deste marco:* a luminária da visão de perto do computador (§3) ainda tem a cúpula em trapézio; igualar quando a §3 for retocada.
- **Noite:** pré-tingidos (`tint-night`): parede, tampo fora da poça, luminária, post-its. Nas cores de dia: **o caderno inteiro** (capa, folhas, abas, carimbo, cantos, com o contorno), a lâmpada e o aro, e a **poça da luminária no tampo**, uma elipse de borda dura com centro (158, 104) e raios **210×100** (era 190 até 2026-11-09; alargada para a sombra das abas longas cair inteira na poça, do slot 0 ao 5), com a caneta e as sombras que caem nela. Os cantos do 320×180 e a sangria ficam escuros.
- Nada interativo na sangria.

### Visão de perto: arquivos e JSON (`public/assets/ui/closeup-journal.png/.json`)
Atlas (PNG 1024×508) + JSON Hash do Aseprite com **43 frames**, como o `closeup-bookshelf`: cada frame recortado (`trimmed: true`) traz a **posição na ilustração** em `spriteSourceSize` (`x, y, w, h`; negativa na sangria), com `sourceSize` 320×180. Os frames pequenos (`check/*`, `icon/*`) não têm posição: `trimmed: false`, `spriteSourceSize` em (0, 0).

| Frame | Conteúdo |
|---|---|
| `bleed/day`, `bleed/night` | 480×308 em `(−80, −64)`: o fundo inteiro com a sangria (parede, tampo, sombra da capa, caneta, luminária, post-its, poça à noite); **sem o caderno** |
| `bg/day`, `bg/night` | o mesmo, só os 320×180 |
| `book` | capa + folhas (pauta, margem, cantos), nas cores de dia, sem abas nem carimbo |
| `tab/<tipo>/<estado>` | aba no **slot 0** (`<tipo>` = `work`, `research`, `education`); `<estado>` = `right`, `right-active` ou `left` |
| `tab/<tipo>/<estado>/hover` | a mesma aba com o outline `gold-2` por fora (1 px a mais em volta) |
| `tab-shadow/<estado>` | sombra da aba no tampo (slot 0); igual para os dois tipos e igual de dia e de noite (cai sempre na poça; o build confere até o slot 5) |
| `stamp/work`, `stamp/research`, `stamp/education` | carimbo, na tinta do tipo |
| `page-turn/prev`, `page-turn/next` (+ `/hover`) | 10×10: o canto normal (= o que já está em `book`) e o de hover |
| `check/empty`, `check/done/<tipo>` (os três tipos) | 9×8: caixa 7×7 `graphite-2` em (0, 1); o visto sai 2 px à direita e 1 px acima |
| `icon/pin/<tipo>`, `icon/calendar/<tipo>` | 7×7, na tinta do tipo |

`meta.quartoPixel` (rects `[x, y, w, h]` em px da ilustração a 1×; valores de frame são nomes em `frames`):

| Chave | Valor |
|---|---|
| `anchor`, `size`, `crops.full`, `minScale`, `bleed` | `[0, 0]`, `[320, 180]`, `[0, 0, 320, 180]`, `3`, `{ left: 80, top: 64, right: 80, bottom: 64 }` |
| `panelBackground` | `#f6f2ec` |
| `drawOrder` | lembrete da ordem de composição (abaixo) |
| `background` | `{ rect, day: "bg/day", night: "bg/night", bleed: { rect: [-80, -64, 480, 308], day: "bleed/day", night: "bleed/night" } }` |
| `book` | `{ rect: [24, 21, 271, 153], frame: "book", cover, pages: [esq, dir], marginX: [40, 166] }` |
| `content` | `{ left: [44, 34, 104, 124], right: [170, 34, 104, 124] }` |
| `ruling` | `{ y0: 40, pitch: 7, lineBoxTop: 34, linesPerPage: 17 }` (pauta em `y0 + pitch·k`; a caixa da linha k começa em `lineBoxTop + pitch·k`) |
| `stamp` | `{ rect: [116, 126, 30, 30], frames: { work: { rect, frame }, research: { rect, frame }, education: { rect, frame } } }` |
| `pageTurn` | `{ prev: { rect: [30, 158, 10, 10], normal, hover }, next: { rect: [276, 158, 10, 10], normal, hover } }` |
| `tabs` | `slots: 6`, `pitch: 22`, `firstY: 38`, `size: [30, 16]`, `activeOffset: 3`, `sides: { right: { x: 286, grows: "right" }, left: { x: 4, grows: "left" } }`, `slot0` (`right: [286, 38, 30, 16]`, `right-active: [286, 38, 33, 16]`, `left: [4, 38, 30, 16]`), **`label`** (`right: [289, 40, 24, 11]`, `right-active: [289, 40, 27, 11]`, `left: [7, 40, 24, 11]`), **`labelInk: "#2f2c3a"`**, `labelRule` (texto), `rule` (texto) e `states.<estado> = { shadow: { rect, frame }, types: { <tipo>: { rect, frame, hover: { rect, frame } } } }` |
| `checklist` | `{ size: [9, 8], box: [0, 1, 7, 7], empty: "check/empty", done: { work, research, education }, at: [0, -2], textX: 10, defaultDone: true }` |
| `icons` | `{ size: [7, 7], frames: { pin: { work, research, education }, calendar: { work, research, education } } }` |
| `types` | `{ work: { tab: "#e9c46a", ink: "#97502c", stampIcon: "work" }, research: { tab: "#5fae4e", ink: "#3e7e3a", stampIcon: "research" }, education: { tab: "#8fd3e8", ink: "#3a5f8c", stampIcon: "education" } }` |
| `textInk` | `{ title: "#2f2c3a", body: "#1f4a5c" }` |
| `light` | `{ pool: { cx: 158, cy: 104, rx: 210, ry: 100 }, lampBase: [297, 22, 31, 15] }` |
| `nightRule` | texto: `bg/night` e `bleed/night` são pré-tingidos; o caderno não tem variante noturna |

**Estado de cada aba:** com a página `a` aberta, a aba `j` usa `left` se `j < a`, `right-active` se `j = a` e `right` se `j > a`. Rects e frames das abas, das sombras e do `label` estão no slot 0: **somar `pitch · j` (22·j) em y**.

**Ordem de composição** (o build confere que ela reproduz a cena aprovada):
1. `background` (em tela cheia, `background.bleed`, que já contém o fundo);
2. `tabs.states[estado de j].shadow` para cada aba `j`, deslocada `pitch·j`;
3. `book`;
4. `tabs.states[estado de j].types[tipo de j]` (ou o `hover`), deslocada `pitch·j`;
5. `stamp.frames[tipo da aberta]`;
6. no hover/foco de um canto, `pageTurn.<lado>.hover` por cima;
7. DOM: texto, `icons`, `checklist` e o nome de cada aba em `tabs.label`.

De dia vale `day`; de noite, `night`. Só o fundo muda.

### Comportamento (DOM)
- Ao abrir, mostra a página dupla da experiência mais recente (a ordem vem de `experiences.json`).
- Cantos dobrados, setas do teclado e swipe viram a página; cada canto é um `<button>` no `pageTurn.*.rect`.
- **Abas:** as das páginas já passadas ficam na borda esquerda; a atual e as seguintes, na direita, e a atual sai +3 px. Clicar numa aba pula para aquela página. Cada aba é um `<button>` no rect do slot, com `aria-label` (ex.: "Bradesco Seguros, trabalho") e o **nome do tipo escrito nela** (texto visível em `tabs.label`), então o tipo não depende só da cor.
- Esc fecha; o `aria-live` anuncia "Experiência 2 de 2".
- **Escala:** cabem 6 abas (slots 0–5). Uma experiência nova só acrescenta uma página dupla, sem arte nova; um tipo novo pede cor de aba, tinta e carimbo (frames novos), como o `education` em 2026-11-09. Com a formação, são 3 abas hoje (sobram 3 slots).

### Para o `scene-engineer` (não editei `src/`)
1. Registrar `journal` e `light-journal` em `ROOM_SPRITES` (`assets/objects/journal`, `assets/objects/light-journal`); a camada vem por `layerOf: "journal"`.
2. No `room.tmj`, o interagível `journal` no ponto **(2, 2)** (o mesmo do `computer`).
3. `spriteMeta.ts`: aceitar `mount: "surface"`, `surfaceOf` e `depthOffset`; profundidade = a do `computer` + 0,01.
4. Desenhar o outline de hover do `journal` **acima** das camadas de luz (`light-computer`, `light-journal`); senão ele some à noite.
5. `light-computer.png` mudou (recorte pelo caderno); mesmo tamanho e âncora, nada a mudar no código.

### Histórico
- 2026-11-09 (depois): borda da capa removida a pedido do Davi (capa = bloco de folhas, `depth` 0), para as abas saírem direto do papel.
- 2026-11-09: diploma removido do quarto; tipo `education` (aba `sky`, tinta `blue-0`, capelo) como última página; abas de 18 para 30 px com o nome do tipo (DOM); esquerda de x 16 para x 4; caneta para a sangria da esquerda; poça rx 190 → 210. Aprovado e integrado em 2026-11-09.
- Proposta de 2026-11-08 com duas variações: A (capa dura vermelha, pautado) e B (espiral azul, pontilhado, lápis amarelo). Aprovada a A. A luminária da visão de perto tinha cúpula em cone; passou a tambor, igual à do quarto.
