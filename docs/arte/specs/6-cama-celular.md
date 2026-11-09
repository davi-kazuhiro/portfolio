# 6. Cama e celular (M3) — aprovados (2026-11-08)

> Parte das [specs de sprites](../specs.md). Convenções de coordenadas e unidades estão lá.

> **Aprovados pelo Davi em 2026-11-08:** roupa de cama **A** (coberta azul-marinho + manta mostarda), celular **grafite** no quarto e visão de perto **A** (celular grafite apoiado no travesseiro). Botão de telefone = **WhatsApp** (o ícone é o fone genérico, sem logotipo). Currículo com **dois botões, PT e EN**; enquanto o PDF não existir, os dois usam o estado **desativado**.
>
> - Geradores: `tools/art/scenes/bed.mjs` (cama e sombra), `tools/art/scenes/phone.mjs` (celular e `light-phone`) e `tools/art/scenes/closeup-phone.mjs` (visão de perto, com a sangria real; `phoneLayers()` dá as camadas).
> - Exportação: `pnpm art` (`tools/art/build.mjs` → quarto; `tools/art/build-phone.mjs` → visão de perto). O build confere que as camadas exportadas, compostas na ordem do JSON, dão **exatamente** a cena de `renderPhoneScene` em 18 estados (sem hover, hover em cada botão, currículo desativado; dia e noite).
> - Prévias: `art-src/previews/closeup-phone.png` (composta pelos frames exportados, com mockup do texto: dia | noite com hover no e-mail; embaixo, currículo desativado), a última linha de `closeup-bleed.png` e `room-m2*.png`.
> - As variações B (roupa mostarda + manta vermelha, capinha vermelha, celular na mão) não são exportadas; ficam como histórico em `node tools/art/build-m3.mjs bed`.
> - Paleta: o build confere alfa 0/255 e as 48 cores na cama, no celular, na sombra e em tudo o que é de dia na visão de perto; à noite, no aparelho e no halo.

## Quarto

### Cama (`objects/bed`, decoração, sem hover)
Footprint (0,5) 4×2. A cabeceira fica na parede esquerda (plano x = 0) e a frente é aberta, sem peseira. Caixas em unidades:

| Parte | Caixa `[x0, x1, y0, y1, z0, z1]` | Tokens |
|---|---|---|
| Pés (só os do pé da cama aparecem) | `[28.5, 30, 41.2, 42.7, 0, 1.5]`, `[28.5, 30, 53.3, 54.8, 0, 1.5]` | madeira (`wood-6/5/4/2/1`, aresta `wood-7`) |
| Estrado | `[1.5, 30.5, 41, 55, 1.5, 5]` | madeira |
| Colchão (lençol) | `[1.5, 30.5, 41, 55, 5, 9]` | `cream-3` / `cream-2` / `cream-1` |
| Cabeceira | `[0, 1.75, 40.5, 55.5, 0, 17]`, face +x `wood-2` com 3 painéis (sulcos `wood-1`), luz `wood-3` sob a travessa e 30% de baixo `wood-1`; travessa `[0, 2.25, 40.25, 55.75, 17, 18]` | **topo a 36 px** |
| Travesseiro (dois andares) | `[2.25, 7.75, 42.25, 53.75, 9, 11]` + `[2.75, 7.25, 42.75, 53.25, 11, 12]` | `cream-3/2/1` |
| Coberta | `[9.5, 31, 40.75, 55.25, 4.5, 10]`: topo a 20 px | `blue-1` topo, `blue-0` frente, `teal-1` lado, aresta `sky-1` |
| Lençol dobrado | `[9.5, 11.25, 40.6, 55.4, 4.25, 10.5]`, listra de 1 px `blue-1` | `cream-3/2/1` |
| Manta dobrada no pé | `[24, 29.5, 40.6, 55.4, 6.5, 11]`, listra de 2 px `red-1` | `gold-1` / `gold-0` / `wood-3`, aresta `gold-3` |
| Sombra de contato | piso `[0, 32.5, 40.5, 56]` (footprint + 1,5 u), `wood-1`, juntas `wood-0` | **assada no `tiles/room-shell.png`** (regerado) |

**Arquivo:** `objects/bed.png/.json`, 1 frame (tag `idle`), **188×128** (com a margem de 2 px).
`meta.quartoPixel`:
```json
{ "anchor": [97, 85], "tile": [2, 6], "mount": "floor", "footprint": [[0, 0, 4, 2]], "hit": "none" }
```
- **Ponto do Tiled: (2, 6)**. Âncora (97, 85) = chão (16, 48, 0), centro do footprint. Pivot (0,5160; 0,6641).
- **Profundidade:** `col + row = 8`.
- **Retrato (M4):** a travessa termina a 36 px e o retrato começa a 70 px (rows 5,4–6,6), então ficam 34 px de parede livre.
- Nenhum pixel em comum com a mesa, a cadeira, o gabinete ou o caderno (o build confere e falha se houver).
- `light-window.png` mudou em 74 px no frame `dusk`: a mancha do entardecer passa atrás da cama e agora é recortada por ela. Mesmo tamanho e âncora.

### Celular (`objects/phone`, interagível)
Deitado na coberta, centro em (1,8; 5,8) tiles = (14,4; 46,4) u. Caixa `[12.4, 16.4, 45.2, 47.6, 10, 11]`: eixo longo paralelo à cama, 2 px de espessura. A silhueta mede **26×15 px**.
- Aparelho grafite: aro e frente `graphite-1`, lado `graphite-0`, aresta `graphite-3`.
- **Tela sempre acesa**: `sky-0` com reflexo diagonal `sky-2`, uma linha de notificação `cream-3` e a câmera `teal-0` no topo (lado +x).

**Arquivos:** `objects/phone.png/.json` (tag `idle`) e `objects/light-phone.png/.json` (tag `night`), os dois em **38×21**, com a mesma âncora.
```json
phone.json       { "anchor": [19, 37], "tile": [2, 6], "mount": "surface", "surfaceOf": "bed", "depthOffset": 0.01,
                   "hit": "alpha", "minHit": [24, 24], "focus": [6, 2, 26, 15] }
light-phone.json { "anchor": [19, 37], "tile": [2, 6], "layerOf": "phone", "light": true, "hit": "none" }
```
- **Ponto do Tiled: (2, 6)**, o mesmo da cama. Âncora (19, 37) = o ponto da cama (16, 48, 0); fica fora do frame (pivot 0,5 / 1,762), como no caderno.
- **Profundidade:** a da `bed` + 0,01 = **8,01**. Sem `footprint`.
- O frame tem 6 px a mais de cada lado da silhueta porque o brilho do `light-phone` passa dela; o `focus` é a silhueta exata.
- **Clique:** a cama é `hit: none` e não rouba o clique. O celular ganha o alvo mínimo de 24×24 em volta do centro da silhueta. O interagível mais perto é o caderno, a ≈100 px.
- **Noite:** o aparelho fica sob o tint. A camada `light-phone`, acima do tint, traz a tela nas cores de dia e um brilho leve: a própria cama nas cores de dia dentro de uma elipse de borda dura no plano da coberta (raios 3,4 × 2,7 u).
- **Hover:** o outline do `phone` é desenhado **acima** do `light-phone`, como no caderno.

## Visão de perto (320×180 + sangria 80/64, âncora (0, 0), escala inteira)
O visitante olha a cama do pé para a cabeceira, no mesmo estilo oblíquo 3/4 da prateleira e do caderno. Na sangria de cima ficam a parede esquerda e a cabeceira; depois vêm o travesseiro, o lençol dobrado e a coberta azul com pesponto; na sangria de baixo, a coberta caindo, o estrado e o vão. O celular grafite está apoiado no travesseiro, em retrato: o travesseiro afunda em volta (anel `cream-1`) e a sombra é curta, (−5, +5). Na coberta há um estojo de fone de ouvido creme.

### Geometria (px da ilustração a 1×)
| Elemento | Rect `[x, y, w, h]` | Tokens |
|---|---|---|
| Parede esquerda | `y −64…−45` (sangria) | `wall-4`/`wall-3`, oclusão `wall-0` |
| Cabeceira | travessa `y −44…−39`, painel até `y −7` | `wood-7/6/5`, painel `wood-2`, base `wood-1` |
| Travesseiro | superelipse com centro (140, 46), semi-eixos 196×62 | `cream-3`/`cream-2`, costura `cream-1` |
| Lençol dobrado | `y 104…123` | `cream-3`, listras `blue-1` |
| Coberta | `y 120…214`, pesponto em grade de 28 px; cai até `y 227`, estrado `y 229…234` | `blue-1`/`blue-0`/`teal-1`, `sky-1` |
| Aparelho (frente) | `100, 3, 120, 175`, cantos r 12; espessura 3 px para (+1, −1); botões laterais em `y 40–55` e `62–71`. Frame `phone`: `100, 0, 124, 178` | `graphite-0…3` |
| **Tela** | **`104, 7, 112, 166`**, cantos r 8 | cabeçalho `teal-2` até `y 31`, linha `teal-1` em `y 32`, corpo `cream-3` |
| Notch + câmera | `150, 9, 20, 6` (r 3) | `graphite-0`, lente `teal-1`/`sky-2` |
| Indicador de início | `145, 167, 30, 2` | `cream-0` |
| Halo da tela (noite) | `90, −8, 143, 195`, r 18 (10 px em volta do aparelho), só na cama | cores de dia |

### Arquivos e JSON (`public/assets/ui/closeup-phone.png/.json`)
Atlas (PNG 1024×512) + JSON Hash do Aseprite com **25 frames**, como o caderno: cada frame recortado (`trimmed: true`) traz a **posição na ilustração** em `spriteSourceSize` (`x, y, w, h`; negativa na sangria) e `sourceSize` 320×180. Os ícones soltos (`icon/*`) não têm posição: `trimmed: false`, `spriteSourceSize` em (0, 0).

| Frame | Rect na ilustração | Conteúdo |
|---|---|---|
| `bleed/day`, `bleed/night` | `−80, −64, 480, 308` | fundo inteiro com a sangria (cama, afundado do travesseiro, sombra do aparelho, estojo; à noite, o halo); **sem o aparelho** |
| `bg/day`, `bg/night` | `0, 0, 320, 180` | o mesmo, só os 320×180 |
| `phone` | `100, 0, 124, 178` | aparelho **sem conteúdo de tela**: corpo, espessura, botões laterais, vidro (cabeçalho `teal-2` + corpo `cream-3`), notch, indicador de início |
| `status` | `110, 10, 99, 4` | barra de status: sinal 7×4 em (110, 10), Wi-Fi 7×4 em (119, 10), bateria 11×4 em (198, 10), `cream-3` |
| `avatar` | `148, 21, 24, 24` | avatar genérico (anel `cream-3`, fundo `sky-1`, silhueta `teal-2`) |
| `divider` | `110, 91, 100, 1` | divisória `cream-1` entre a cidade e os botões |
| `app/<id>` | `110 + 26n, 95, 22, 22` | botão-ícone, `id` = `email`, `linkedin`, `github`, `phone` (n = 0…3) |
| `app/<id>/hover` | `108 + 26n, 93, 26, 26` | o mesmo com o anel de hover (1 px `gold-2` + 1 px `outline`) |
| `cv/pt`, `cv/en` | `110, 137, 48, 18` / `162, 137, 48, 18` | botão de download `gold-1` com a seta `wood-0` |
| `cv/<lang>/hover` | `108, 135, 52, 22` / `160, 135, 52, 22` | com o anel de hover |
| `cv/<lang>/disabled` | o mesmo rect do normal | **desativado**: papel `cream-1` (luz `cream-2`, base `cream-0`), seta `graphite-3`, sem hover |
| `icon/pin` | 7×7 | alfinete `red-1`, para a cidade |
| `icon/download`, `icon/download/disabled` | 12×12 | a seta solta (`wood-0` / `graphite-3`), se o DOM precisar fora do botão |

Ícones dos botões (16×16, glifo `cream-3`), todos genéricos, sem logotipo: `email` = envelope (`red-2`), `linkedin` = maleta (`blue-1`), `github` = `</>` (`graphite-2`), `phone` = fone de telefone (`leaf-1`), que serve para o WhatsApp.

`meta.quartoPixel` (rects `[x, y, w, h]` em px da ilustração a 1×; valores de frame são nomes em `frames`):

| Chave | Valor |
|---|---|
| `anchor`, `size`, `crops.full`, `minScale`, `bleed` | `[0, 0]`, `[320, 180]`, `[0, 0, 320, 180]`, `3`, `{ left: 80, top: 64, right: 80, bottom: 64 }` |
| `panelBackground` | `#f6f2ec` |
| `drawOrder` | lembrete da ordem (abaixo) |
| `background` | `{ rect, day: "bg/day", night: "bg/night", bleed: { rect: [-80, -64, 480, 308], day: "bleed/day", night: "bleed/night" } }` |
| `phone` | `{ rect: [100, 0, 124, 178], frame: "phone", body: [100, 3, 120, 175], bodyRadius: 12 }` |
| `screen` | `{ rect: [104, 7, 112, 166], radius: 8, header: [104, 7, 112, 26], notch: [150, 9, 20, 6], home: [145, 167, 30, 2] }` |
| `content` | **`[108, 20, 104, 146]`**: área total do DOM (a 3×, 312×438 px CSS) |
| `statusBar`, `avatar`, `divider` | `{ rect, frame }` (o `avatar` traz também `center: [160, 33]`, `radius: 12`) |
| `slots.name` | `[108, 48, 104, 9]`: nome, uma linha, centralizado |
| `slots.roles` | `[108, 58, 104, 24]`, com `roleLines: 3` e `roleLineHeight: 8`: 3 linhas de 8 px (24 px CSS a 3×) |
| `slots.city` | `[108, 83, 104, 8]`: `icon/pin` + cidade, centralizados |
| `slots.labels` | `[[108, 119, 26, 7], [134, …], [160, …], [186, …]]`: rótulo embaixo de cada botão, na ordem de `apps.ids` |
| `slots.cvLabel` | `[108, 128, 104, 7]`: "Currículo (PDF)" |
| `apps` | `{ ids: ["email", "linkedin", "github", "phone"], size: 22, y: 95, xs: [110, 136, 162, 188], items: { <id>: { rect, frame, hover: { rect, frame } } }, colors }` |
| `cv` | `{ pt: { rect, frame, hover: { rect, frame }, disabled: { rect, frame } }, en: { … }, iconRect: [4, 3, 12, 12], textRect: [18, 0, 28, 18], disabledHasHover: false }`. `iconRect` e `textRect` são relativos ao botão: o texto "PT"/"EN" vai em `textRect` |
| `icons` | `{ pin: { size: [7, 7], frame: "icon/pin" }, download: { size: [12, 12], frame: "icon/download", disabled: "icon/download/disabled" } }` |
| `textInk` | `{ name: "#2f2c3a", body: "#1f4a5c", label: "#4a4659", cvLabel: "#2f2c3a", cv: "#5a2e22", cvDisabled: "#4a4659" }` |
| `halo` | `{ rect: [90, -8, 143, 195], radius: 18 }` (só referência; já está em `bleed/night`) |
| `nightRule` | texto: `bg/night` e `bleed/night` são pré-tingidos, menos o halo; o aparelho não tem variante noturna |

Sobram `y 155–165` livres na tela, para um aviso curto (ex.: "Currículo em breve") ou para um 5º botão.

**Ordem de composição** (o build confere que ela reproduz a cena aprovada):
1. `background` (em tela cheia, `background.bleed`, que já contém o fundo);
2. `phone`;
3. `statusBar`, `avatar`, `divider`;
4. `apps.items[id].frame` (ou `.hover.frame`) para os 4 botões;
5. `cv.pt` e `cv.en`: `frame`, `hover.frame` ou `disabled.frame`;
6. DOM: nome, cargos, cidade (com `icon/pin`), rótulos, `cvLabel`, texto PT/EN.

De dia vale `day`; à noite, `night`. **Só o fundo muda**: o aparelho, os botões e os ícones ficam nas cores de dia.

### Comportamento (DOM, para o `ui-engineer`)
- Cada botão é um `<a>`/`<button>` no rect de `apps.items[id].rect` / `cv.<lang>.rect`, com `aria-label` ("Enviar e-mail", "LinkedIn", "GitHub", "WhatsApp", "Baixar currículo em português/inglês"). O nome do serviço também aparece no rótulo (`slots.labels`), não só no ícone.
- E-mail → `mailto:`; `phone` → `https://wa.me/<número>` (o rótulo deve dizer "WhatsApp"); currículo → PDF em `public/` (pendência de conteúdo).
- **Currículo sem PDF:** usar `cv/<lang>/disabled`, `aria-disabled="true"`, sem hover nem foco de ativação, texto em `textInk.cvDisabled` (contraste 4,7:1 sobre `cream-1`). Dá para pôr um aviso curto em `y 155–165`. Quando o PDF existir, trocar para `cv/<lang>` com hover.
- Hover e foco do teclado usam o frame `/hover`. Esc fecha. Tab percorre: e-mail, LinkedIn, GitHub, WhatsApp, PT, EN.
- Nada interativo na sangria.

### Para o `scene-engineer` (não editei `src/`)
1. Registrar `bed`, `phone` e `light-phone` em `ROOM_SPRITES` (`assets/objects/<id>`); a camada vem por `layerOf: "phone"`.
2. No `room.tmj`: `bed` na camada `decor` e `phone` em `interactables`, os dois no ponto **(2, 6)**.
3. Profundidade: `bed` = 8; `phone` = a da `bed` + 0,01 (`surfaceOf: "bed"`, `depthOffset`), o mesmo caminho do `journal` sobre o `computer`.
4. Outline de hover do `phone` acima do `light-phone`.
5. `tiles/room-shell.png` e `objects/light-window.png` foram regerados (sombra da cama; recorte da luz do entardecer pela cama). Mesmo tamanho e âncora, nada a mudar no código.

### Histórico
- Proposta de 2026-11-08 com duas roupas de cama (A azul + manta mostarda; B mostarda + manta vermelha), dois celulares no quarto (grafite; capinha vermelha) e duas visões de perto (A apoiado no travesseiro; B na mão, com rampa de pele emprestada da madeira). Aprovadas as três A.
- Na aprovação entrou o estado desativado do currículo (o PDF ainda não existe) e o telefone virou WhatsApp, com o mesmo ícone genérico.
