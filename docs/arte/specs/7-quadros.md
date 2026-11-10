# 7. Quadros (M3): aprovada (A, galeria) em 2026-11-09

> Parte das [specs de sprites](../specs.md). Convenções de coordenadas e unidades estão lá.

> **Aprovada pelo Davi em 2026-11-09: variação A (galeria de 5 molduras).** Exportada pelo `pnpm art` (`tools/art/build.mjs`):
>
> - Quarto: `public/assets/objects/frames.{png,json}` e `public/assets/objects/light-frames.{png,json}`; a sombra na parede vai assada no `public/assets/tiles/room-shell.png` (regerado).
> - Visão de perto: `public/assets/ui/closeup-frames.{png,json}` (atlas + `meta.quartoPixel`), gerado por `tools/art/build-frames.mjs`. O build confere que as camadas compostas na ordem do JSON são idênticas à cena aprovada (`renderFramesScene`) em 630 estados: dia e noite, 0 a 8 certificados, cada um selecionado, hover em cada miniatura e nas duas setas.
> - Prévia composta pelo JSON: `art-src/previews/closeup-frames.png` (linha 1: 5 certificados, o 1º aberto, dia com hover na 3ª miniatura | noite com hover em ›; linha 2: 8 certificados, o 4º aberto, dia com hover em ‹ | noite). O texto e o botão são **simulação** do DOM, não arte. Sangria: `art-src/previews/closeup-bleed.png` (última linha).
> - Geradores: `tools/art/scenes/frames.mjs` (quarto) e `tools/art/scenes/closeup-frames.mjs` (visão de perto). A variação B (mural de cortiça) fica só como histórico nesses arquivos e no alvo `node tools/art/build-m3.mjs frames` (prévias `m3-frames-*`).
> - Paleta: alfa 0/255 e as 48 cores (de noite, no que fica nas cores de dia). **Nenhuma cor nova.**

## Decisões do Davi (2026-11-09)
1. Variação **A** (galeria), no quarto e de perto.
2. O certificado aberto deixa a **vaga vazia** (marca `wall-5` e prego) com o anel `gold-2`.
3. Mantém o **selo redondo dourado**, sem fita.
4. Luz da noite como proposta: a barra da luminária de quadro acende e a moldura grande fica nas cores de dia, no quarto; de perto, a noite fica quase igual ao dia (a poça cobre tudo o que é interativo).
5. Contador "1 / 5" na plaquinha de latão (DOM).
6. Miniaturas alternam **madeira, grafite e dourada** (`j mod 3`).

## Conteúdo (o que a arte precisa comportar)
Cinco certificados em `src/content/{pt,en}/awards.json`, do mais recente ao mais antigo. Nenhum é prêmio de colocação: são participações e bolsas. Por isso a arte **não tem medalha, troféu nem fita de 1º lugar**: só o certificado com um selo redondo. Título, emissor, data, descrição e o botão "Abrir PDF" são texto do DOM. A arte não tem texto nenhum. Os PDFs ficam em `public/certificates/`. São **8 vagas** de miniatura: até 8 certificados entram sem arte nova.

## Sprite do quarto (`objects/frames`)
Parede esquerda (plano x = 0), `mount: "wall-left"`, acima do braço B da mesa, na faixa que o diploma liberou.

Coordenadas de desenho: **px da parede** `(u, v)` a 1×, `u = (31,5 − y)·4` (para a direita), `v = (56 − z)·2` (para baixo; `v 0` = 112 px). Retângulos `[u, v, w, h]`; cada um vira uma caixa fina presa à parede (`[0, depth, y0, y1, z0, z1]`). A face da frente é a +x; a borda de cima e a lateral +y aparecem com 1 px.

| | A — galeria |
|---|---|
| Composição | 5 molduras separadas, uma por certificado: a maior (nogueira, 30×24) no meio e duas de cada lado (12×14 madeira e 12×10 dourada à esquerda; 18×12 grafite e 14×12 madeira à direita). Decorativo: o quarto não muda com o conteúdo |
| Extra | luminária de quadro de latão sobre a maior (`[28, 1, 14, 2]`, 1,25 u de profundidade) |
| Faixa na parede | `u 4–72`, `v 0–34`: y 13,5–30,5 u (rows 1,69–3,81), **78–112 px** |
| Profundidade | 0,75 u (molduras), 1,25 u (luminária) |
| Canvas exportado | **75×66**, 2 px de margem, âncora **(36, 124)**, pivot (0,48; 1,8788), `tile` **[0, 2,75]**, `focus` `[2, 2, 71, 62]` (a silhueta) |
| Frames | `frames 0` = tag `idle`; `frames 1` = tag `hover` (o sprite com o anel da regra 13 já desenhado, **idêntico** ao que `ensureOutlineTexture` gera; referência, ver abaixo). `meta.quartoPixel.hoverFrame: "hover"` |
| Noite (`light-frames`, 1 frame, tag `night`, `layerOf: "frames"`, `light: true`) | a barra da luminária acende por baixo (`gold-3`) e a moldura maior inteira fica nas cores de dia. Mesmo canvas e âncora do `frames` |

- **Tokens.** Molduras: nogueira `wood-5/4/2/1/0`, madeira `wood-7/6/5/2/1`, grafite `graphite-0…3`, dourada `gold-0/1/3` (lateral `wood-3`). Passe-partout `cream-1`/`cream-2`. Papel `cream-3` com título `cream-0`, linhas `cream-1` e selo `gold-0`/`gold-1`.
- **Sombra na parede:** cada quadro deslocado 2 px para a esquerda e 2 para baixo, em `wall-0`, plano. **Assada no `room-shell`**, como a da prateleira; não entra no hover.
- **Hover (regra 13):** outline por código em volta da silhueta inteira (os vãos de 3–4 px entre as molduras ficam cheios com o anel). É um interagível só. `hit: "alpha"`, `minHit: [24, 24]`.

### Colisões (conferidas pelo `pnpm art`, que falha se houver pixel em comum)
| Com | Resultado |
|---|---|
| Mesa / luminária de mesa | 0 px em comum, nem com o anel de hover; folga vertical de **19 px** a 1× |
| Caderno e `light-journal` | 0 px; folga de 54 px |
| `light-computer` (4 frames), prateleira, cama, celular, `light-phone`, cadeira, gabinete | 0 px |
| Retrato (área reservada, rows 5,4–6,6) | ≈50 px de parede livre na tela |
| Recorte da câmera (regra dos 112 px) | topo da luminária de quadro exatamente em 112 px |

O `light-window` e o `light-computer` não mudaram com a entrada dos quadros (só o `room-shell` foi regerado).

## Visão de perto (`ui/closeup-frames`): 320×180 + sangria 80/64, âncora (0, 0), escala inteira, mínimo 3×
O visitante fica de frente para a parede esquerda. A direita da tela vai para a cama, a esquerda para o canto do fundo. Retângulos em px da ilustração a 1×; entre parênteses, o tamanho a 3× em px CSS.

| Elemento | Rect `[x, y, w, h]` | Tokens / notas |
|---|---|---|
| Parede (tudo, inclusive a sangria) | listras verticais de 8 px | `wall-4`/`wall-3`; sombras (−3, +3) em `wall-0` |
| Luminária de quadro | espelho `112, 0, 8, 4`, braço `115, 4, 2, 4`, barra `78, 7, 76, 5` | latão `gold-0/1/3`; a linha de baixo da barra é `gold-0` de dia e `gold-3` à noite |
| Moldura ampliada | `14, 14, 204, 142`: nogueira (7 px, com sulco e filete `gold-3`/`gold-0`), passe-partout `cream-2` de 8 px com chanfro | |
| **Certificado aberto** (papel) | **`30, 30, 172, 110`** (516×330) | `cream-3`, fio duplo `cream-1` a 3 e 5 px da borda |
| **Texto do DOM** | **`38, 36, 156, 76`** (468×228): título, emissor, data, descrição | título `graphite-1`, corpo `teal-1` |
| **Botão "Abrir PDF"** (DOM) | **`38, 116, 72, 16`** (216×48) | estilo do `ui-engineer`; a arte deixa o papel livre ali |
| Selo (arte, no fundo) | `170, 112, 22, 22` | `gold-0/1/3`, borda serrilhada, sem fita |
| Plaquinha do contador (no fundo) | `92, 160, 48, 12`; **texto "1 / 5" (DOM) em `97, 162, 38, 8`** | `gold-1` com aresta `gold-3`/`gold-0` e dois parafusos; texto `graphite-1` |
| **‹ anterior / próximo ›** | **`72, 158, 16, 16`** / **`144, 158, 16, 16`** (48×48) | placas de latão com seta `graphite-1` (desenho); a normal está no fundo |
| **Miniaturas, vaga `j` (0…7)** | **`234 + 40·(j mod 2), 18 + 40·⌊j/2⌋, 32, 24`** (96×72) | 2 colunas × 4 linhas, ordem de leitura; prego `graphite-2` 7 px acima e arame `graphite-1`; moldura madeira / grafite / dourada (`j mod 3`), passe-partout e certificado em miniatura |

### Estados
- **Normal:** miniatura desenhada (`thumb/<estilo>`).
- **Hover / foco** de miniatura ou seta: ~~anel por fora do retângulo, 1 px `gold-2` e 1 px `outline` (regra 13)~~ **desde 2026-11-09**: miniaturas fechadas e setas com destino têm o anel branco piscando (bíblia, regra 14), aceso no hover/foco; os frames `/hover` abaixo ficaram fora de uso. O anel dourado do selecionado continua. Frames `thumb/<estilo>/hover` e `arrow/<prev|next>/hover` (a peça inteira com o anel; substitui a normal).
- **Selecionado** (o certificado aberto): a vaga fica **vazia** (marca `wall-5` e o prego) com o mesmo anel (`thumb/selected`); no DOM, `aria-current="true"`. Hover sobre ela não muda nada.
- **Vagas sem certificado** (hoje 5 a 7): parede vazia, sem prego (não desenhar nada).

### Noite
`bg/night` e `bleed/night` são pré-tingidos (`tint-night`), menos uma **poça de luz** de borda dura: elipse com centro (160, 90) e raios 200×124 (`light.pool`). Ela cobre tudo o que é interativo, então as miniaturas, a vaga vazia, as setas, o selo e a plaquinha ficam nas cores de dia e **não têm variante de noite**. Ficam escuros os cantos do 320×180 e a sangria. A barra da luminária acende em `gold-3`.

## Exportação: `public/assets/ui/closeup-frames.{png,json}`
Atlas 1024×502, 17 frames, JSON Hash do Aseprite no padrão do `closeup-journal` (frames recortados, `spriteSourceSize` = posição na ilustração 320×180; x/y negativos caem na sangria).

Frames: `bleed/day`, `bleed/night` (480×308 em (−80, −64), **sem** as miniaturas), `bg/day`, `bg/night` (320×180), `seal`, `plaque` (já estão no fundo; à parte só para referência), `arrow/prev`, `arrow/next` (+ `/hover`), `thumb/wood`, `thumb/graphite`, `thumb/gold` (+ `/hover`), `thumb/selected`.

Chaves de `meta.quartoPixel`:

| Chave | Valor |
|---|---|
| `anchor`, `size`, `crops`, `minScale`, `bleed` | `[0, 0]`, `[320, 180]`, `{ full: [0, 0, 320, 180] }`, `3`, `{ left 80, top 64, right 80, bottom 64 }` |
| `panelBackground` | `#f6f2ec` (`cream-3`) |
| `drawOrder` | fundo → miniaturas por vaga (ou `thumb/selected`) → hover da seta → DOM |
| `background` | `rect`, `day`/`night` e `bleed { rect [−80, −64, 480, 308], day, night }` |
| `lamp` | `plate`, `arm`, `bar` |
| `frame` | `rect [14, 14, 204, 142]`, `mouldWidth 7` |
| `paper` | `rect [30, 30, 172, 110]` |
| `content` | `rect [38, 36, 156, 76]` + regra |
| `pdf` | `rect [38, 116, 72, 16]` + regra |
| `seal` | `rect [170, 112, 22, 22]`, `frame "seal"`, `inBackground: true` |
| `counter` | `plaque { rect [92, 160, 48, 12], frame "plaque" }`, `text [97, 162, 38, 8]` + regra |
| `arrows` | `prev`/`next`: `rect` (botão: `[72, 158, 16, 16]` / `[144, 158, 16, 16]`), `frame`, `frameRect` (com a sombra), `hover { rect [70, 156, 20, 20] / [142, 156, 20, 20], frame }` |
| `thumbs` | `slots 8`, `size [32, 24]`, `rects` (as 8), `formula`, `styles ["wood", "graphite", "gold"]`, `styleOf` (`j mod 3`), `frames[estilo] { rect [232, 11, 34, 33], frame, hover { rect [232, 11, 36, 33], frame } }`, `selected { rect [232, 11, 36, 33], frame }`, `offsetRule`, `offsets` (`[0,0] [40,0] [0,40] [40,40] [0,80] [40,80] [0,120] [40,120]`), `emptyRule` |
| `textInk` | `title #2f2c3a` (`graphite-1`), `body #1f4a5c` (`teal-1`), `counter #2f2c3a` |
| `light` | `pool { cx 160, cy 90, rx 200, ry 124 }` |
| `nightRule` | texto da regra acima |

Os frames das miniaturas estão na **vaga 0**. Para a vaga `j`, soma-se `offsets[j]` ao `spriteSourceSize` (a mesma ideia do `pitch·j` das abas do caderno).

## Para o `scene-engineer` (não editei `src/` nem `public/maps/`)
1. Em `src/game/assets.ts`, registrar em `ROOM_SPRITES`: `frames: 'assets/objects/frames'` e `'light-frames': 'assets/objects/light-frames'`.
2. No `public/maps/room.tmj`, o interagível `frames` no ponto **(0; 2,75)** (base da parede esquerda sob o centro do grupo, y 22 u). `mount: "wall-left"` vem do JSON; profundidade de objeto de parede (como a `bookshelf`, na parede do fundo). Âncora (36, 124) no canvas 75×66.
3. A sombra já está no `room-shell.png` regerado; não há sprite de sombra.
4. `light-frames` é camada de luz (`layerOf: "frames"`, tag `night`): fica fora do tint e por cima do `frames`. O **outline de hover** do `frames` vai **acima** do `light-frames`, como no `journal`/`light-journal`; senão, à noite, a moldura grande cobre o anel.
5. O frame 1 (tag `hover`) é só referência: é idêntico ao outline que o código gera. Não precisa tocá-lo; o `pickTag` escolhe `idle` (a primeira tag neutra), então nada muda no `DayNight`. Se preferir usá-lo em vez de gerar a textura, lembre do item 4 (ele seria tingido à noite).
6. Hit: `alpha` com `minHit [24, 24]`; o zoom mira `focus [2, 2, 71, 62]`.

## Para o `ui-engineer` (não editei `src/`)
Painel `frames` (`src/ui/panels/`), lendo `closeup-frames.json` como o `JournalPanel`/`PhonePanel`:
1. **Camadas:** `background.bleed.day|night` (ou `background.day|night`); por cima, para `j` de 0 a `min(n, 8) − 1`: `thumbs.selected.frame` se `j` é o aberto; senão `thumbs.frames[styles[j % 3]].frame` (ou `.hover.frame` no hover/foco), deslocado por `thumbs.offsets[j]`; por fim `arrows[prev|next].hover.frame` no hover/foco da seta. Vagas `j ≥ n`: nada.
2. **Botões do DOM:** cada miniatura é um `<button>` em `thumbs.rects[j]` (×escala), com `aria-label` = título, `aria-current="true"` no aberto; ‹ › são `<button>` em `arrows.prev.rect` / `arrows.next.rect` (48×48 a 3×).
3. **Texto:** título, emissor, data (`dateLabel`) e descrição em `content.rect` (título `textInk.title`, corpo `textInk.body`); "Abrir PDF" é um `<a href={file} target="_blank" rel="noopener">` em `pdf.rect`, avisando que abre um PDF; contador "1 / 5" em `counter.text`, cor `textInk.counter`, centrado, também em `aria-live` ("Certificado 1 de 5").
4. **Navegação:** abre no mais recente (índice 0); ‹ › (presos nas pontas, sem volta, como o caderno), setas do teclado e swipe; clicar numa miniatura pula para ele; Esc fecha.
5. **Noite:** só troca `day` → `night` no fundo; as outras camadas não têm variante. Fundo do painel fora da ilustração: `panelBackground`.
6. Escala inteira, mínimo 3× (`minScale`), com a sangria preenchendo a tela como nos outros painéis.

## Histórico: variação B (mural de cortiça), não escolhida
Quadro de cortiça 72×32 com moldura de madeira, 5 papéis presos com tachinhas e varal de 7 luzinhas que acendia à noite (no quarto: canvas 79×73, âncora (38, 129), rows 1,63–3,88, 77–109 px). De perto: o mural ocupava a tela, certificado aberto `44, 22, 232, 114` preso com duas tachinhas, etiquetas de papel ‹ › nas laterais e 8 miniaturas numa fileira embaixo; sem lugar para o contador. Prós: mais "quarto de estudante", hover limpo de um retângulo só, varal vivo à noite. Contras: menos solene para certificados, contador sem lugar, cortiça cheia de grãos competindo com as miniaturas. O código continua em `scenes/frames.mjs` e `scenes/closeup-frames.mjs` (prévias: `node tools/art/build-m3.mjs frames`).
