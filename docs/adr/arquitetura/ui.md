# Arquitetura — UI (React)

Mantido pelo agente `ui-engineer`.

## Camadas
```
<main.app>
  <PhaserGame/>  ← canvas, aria-hidden (o conteúdo acessível está no DOM)
  <Hud/>         ← idioma, som, tooltip, menu acessível (sr-only, aparece com foco)
  <PanelHost/>   ← painel do objeto aberto (role="dialog")
```

## Estado e eventos
- `src/store/useGameStore.ts` (Zustand) é a fonte da verdade da UI.
- `App.tsx` assina o `EventBus` e alimenta o store: `scene-ready` → `sceneKey`, `object-hover` → `hoveredId`, `object-open` → `open(id)` (e cancela o fallback do teclado). Também mantém `<html lang>` em sincronia com o idioma.
- **Abrir pelo teclado** (`Hud`, menu `sr-only`): `rememberFocus(botão)` + `requestOpen(id)` (`src/ui/hud/requestOpen.ts`), que emite `focus-object` → a cena faz o zoom → responde `object-open` → painel. Mesmo fluxo do clique.
  - Fallback: se a cena não está pronta (`sceneKey` nulo), abre direto; se `object-open` não chega em 1,5 s, abre direto também (o teclado nunca fica sem resposta).
  - Esc durante esse zoom: a cena cancela o zoom (volta ao quarto sem `object-open`) e o `Hud` (listener de `keydown` em captura) chama `cancelPendingOnEscape` → `cancelPendingOpen()`, então o fallback não abre o painel sem zoom. Sem evento novo no EventBus. Teste em `tests/bookshelf.test.ts`.
- **Fechar** (Esc, botão Fechar, clique no fundo): `closePanel()` (`src/ui/panels/closePanel.ts`) = `close()` no store + `EventBus.emit('panel-closed')`. O `PanelHost` devolve o foco a quem abriu quando o diálogo desmonta.

| Evento | Direção | Uso na UI |
|---|---|---|
| `scene-ready` | Phaser → React | `setSceneKey` (habilita o fluxo com zoom) |
| `object-hover` | Phaser → React | tooltip (escondido com painel aberto) |
| `object-open` | Phaser → React | abre o painel |
| `focus-object` | React → Phaser | menu de teclado pede o zoom |
| `panel-closed` | React → Phaser | zoom-out |

## Painéis
- `PanelHost` (`src/ui/panels/PanelHost.tsx`): fundo (`.panel-backdrop`, clique fora fecha) + diálogo (`role="dialog"`, `aria-modal`, `aria-labelledby="panel-title"`, `tabIndex=-1`). Mapa `PANELS` id → `React.lazy(() => import('./<Id>Panel'))`; ids fora do mapa usam `GenericPanel`. `Suspense` mostra "Carregando...".
- Contrato (`src/ui/panels/types.ts`): `PanelProps = { titleId, onClose }`. O painel põe `id={titleId}` no seu título visível e chama `onClose` no seu botão Fechar.
- Esc: listener global no `PanelHost` fecha, **a menos que** o painel tenha chamado `preventDefault()` no seu `onKeyDown` (navegação interna).
- Foco: `useFocusTrap` (`src/ui/a11y/useFocusTrap.ts`) prende Tab/Shift+Tab e puxa de volta foco que escape; foco inicial vai para o item que o painel focar ou para o diálogo. `focusReturn.ts` guarda quem abriu (botão do menu, ou `document.activeElement`).
- Conteúdo: `getContent(toLocale(i18n.language))` (`src/ui/panels/locale.ts`); trocar o idioma com o painel aberto atualiza o conteúdo.

| Id | Painel | Tema |
|---|---|---|
| `computer` | `ComputerPanel.tsx` (dentro da visão de perto) | desktop retrô: janela com barra de título, barra de endereço, pastas por projeto (destaques primeiro, `sortProjects`), detalhe com descrição, tecnologias e link GitHub (`target=_blank rel="noopener noreferrer"`, aviso de nova aba para leitor de tela). Esc numa pasta volta à lista; foco vai para "Voltar" e retorna à pasta. |
| `bookshelf` | `BookshelfPanel.tsx` (a própria visão de perto; ver "Prateleira") | estante: livros Linguagens/Idiomas, cartucho Ferramentas, hobbies |
| demais | `GenericPanel.tsx` | "em construção" (M3) |

## Visão de perto (M2, [ADR 0006](../0006-visao-de-perto-no-dom.md))
Objetos listados em `CLOSEUPS` (`src/ui/closeup/useCloseupSheet.ts`; hoje só `computer`) não usam o fundo + janela centralizada: o `PanelHost` renderiza `<Closeup>` (`src/ui/closeup/Closeup.tsx`), que mostra a ilustração frontal e põe o **mesmo diálogo** (mesmo `ref`, `role="dialog"`, `aria-modal`, `aria-labelledby`, foco preso e devolvido, Esc) sobre a área de conteúdo. Os demais objetos continuam com o `GenericPanel` centralizado.

- **Arte:** `public/assets/ui/closeup-computer.{png,json}` (tira de frames 320×180, tags `off`, `boot`, `on` e `*-night`), `closeup-computer-steam.{png,json}` (vapor) e `closeup-computer-frame.png` (9-slice). Números vêm de `meta.quartoPixel` (`contentRect`, `crops.full/monitor`, `minContentCss`, `minScale`, `steam`, `frame9`), normalizados por `parseCloseupSheet` (`sheet.ts`, aceita `[x,y,w,h]` ou `{x,y,w,h}`). Sem os arquivos, `standin.ts` gera um SVG com o mesmo contrato. O `PanelHost` pré-carrega tudo ao montar.
- **Faixa do HUD:** `pickCloseupLayout(vw, vh, geo, HUD_BAND)` reserva 64 px no topo (idioma/som ficam por cima da visão de perto): a escala é calculada com `vh − 64` e a ilustração nunca começa acima de `y = 64`. Resolve a pendência do M2 (em 1366×768 os botões encostavam no monitor): lá o computador passa de 4× para 3× (tela 672×378, como na spec) e começa em y 114.
- **Modos** (`pickCloseupLayout`, `layout.ts`, puro): primeiro modo cuja área de conteúdo fica ≥ 640×360 px CSS com escala ≥ 3. **A** = cena inteira, `s = floor(min(vw/320, vh/180))`; **B** = recorte do monitor (248×180); **C** = sem ilustração, o diálogo ganha a moldura como `border-image` (fatias 9/8/15/8 a 2×) e ocupa a tela (abaixo de 768 px, tela cheia sobre o HUD como no M1; acima, deixa 72 px no topo para o HUD). Ex. (com a faixa do HUD): 1920×1080 → A 5×; 1366×768 → A 3×; 768×1024 → B 3×; 375×812 e 360 px → C.
- **Desenho:** `<img alt="">` com a tira inteira ampliada por `s` (`image-rendering: pixelated`), dentro de uma janela `overflow: hidden` do tamanho do recorte; trocar de frame é mudar `left` em múltiplos de `320·s`. Posições sempre em px CSS inteiros. Fundo `.closeup` quase opaco; clique fora do diálogo (na ilustração ou no fundo) fecha.
- **Painel dentro da tela:** reflow, não `transform: scale`. O diálogo tem o tamanho exato da área de conteúdo (`224·s × 126·s`) e o painel se reorganiza nele; a fonte sobe em degraus com a escala (`screenFontSize`: `max(14, 4·s)` px; 16 px no modo C), e os tamanhos internos do `.retro-window` estão em `em`, então tudo acompanha. Menor texto: `.badge` com `max(12px, 0.8em)`. O corpo rola na vertical; a grade de pastas usa `minmax(min(8.5em, 100%), 1fr)` e nunca gera rolagem horizontal. O ícone de pasta cresce em múltiplos inteiros do seu grid 16×12 (`--icon-k`). Visual: fundo `teal-0`, barra de título `teal-2`, sem borda própria (a moldura do monitor é a borda).
- **Boot:** se a arte já estava carregada na abertura, mostra os frames de `boot` (2 × 60 ms, limitado a 300 ms por `bootSequence`) com o painel em `opacity: 0` (continua focável), depois `on`. Com `prefers-reduced-motion`: direto em `on`, sem vapor e sem fade.
- **Dia/noite:** `useNightAtOpen` (`src/ui/closeup/useNightAtOpen.ts`): `store.period` (publicado pela cena com `period-changed`) fixado na abertura; sem ele, `periodAt`/`isNightAt` (`src/ui/closeup/period.ts`, puro): noite 19h–7h usa `*-night`; entardecer usa a de dia. Fixado na abertura. Em dev, `?period=day|dusk|night` força o período (igual à cena). Usado pelo computador e pela prateleira.

## Prateleira (M3, specs.md §4)
`bookshelf` está em `SCENE_PANELS` (`PanelHost`): o diálogo (`.closeup.closeup--scene`, mesmo `ref`, `role="dialog"`, foco preso e devolvido, Esc) ocupa a tela, e o `BookshelfPanel` desenha a cena inteira, porque toda a ilustração é interativa. Fallback de carregamento: o `.panel` "Carregando..." centralizado (Suspense e enquanto o atlas carrega).

- **Atlas:** `public/assets/ui/closeup-bookshelf.{png,json}`, frames recortados com a posição na ilustração em `spriteSourceSize`. `parseShelfAtlas` (`src/ui/closeup/shelfAtlas.ts`, puro) normaliza frames + `meta.quartoPixel` (`background`, `shelf[]`, `highlights`, `layouts.book/tools/hobby`, `icons`), com os valores da spec quando falta campo. `useShelfAtlas`/`loadShelfAtlas` (`useShelfAtlas.ts`) carregam uma vez (pré-carregado pelo `PanelHost`); sem JSON/PNG → `missing` e o painel usa o modo texto.
- **Composição:** `composeShelf(atlas, { open, night, hot })` devolve as camadas na ordem da spec: fundo → sombra do destaque → sombras da tábua (menos a do aberto) → itens (menos o aberto; fica o vão) → partes do destaque → setas (só hobby). Noite usa `*/night`; o destaque é o mesmo de dia. Cada camada é um `<div>` com o PNG como `background` ampliado por `s` (`image-rendering: pixelated`), em px CSS inteiros (`bookshelf/spriteStyle.ts`: `frameBackground`, `place`).
- **Interação:** cada item clicável é um `<button>` transparente no `hit` (`aria-label` do i18n; hobby: "Ver hobby: {{name}}" com o nome do conteúdo); decoração não tem botão. Hover/foco troca para o frame `hover`, sobe 4 px de arte e fica acima dos vizinhos (com foco o botão sobe junto). Abrir um item move o foco para o destaque (o botão some da tábua). Ao abrir o painel: `defaultOpen` (Linguagens no sumário), foco no livro.
  - **Livros** (`SceneBook`): grupo focável na capa (`aria-label` "Linguagens. Página n de total"); páginas no DOM dentro de `content.left/right`, com número de página visível (`aria-hidden`); cantos `pageTurn` são botões transparentes (`aria-disabled` nas pontas; só existem com mais de uma página dupla); ←/→ com foco no livro e swipe (toque) viram; `aria-live` "Página n de total" (n = página dupla). Linguagens: página 0 = sumário (cada linha é um botão que pula para a página), depois uma por linguagem (ícone, nome, "Nível n/100", barra, "Onde usei" via `projectsUsing`; vazio → "nenhum projeto ainda"). Idiomas: uma página por idioma (nome, nível; certificados/uso só se houver).
  - **Ferramentas** (`SceneTools`): título + filete `red-3` + lista (`ToolsList`) com as medidas de `layouts.tools` (linhas de `rowPitch`, texto em `rowTextX`); sem descrição → só ícone e nome; rola se passar do cartão.
  - **Hobbies** (`SceneHobby`): palco focável (`role="img"`, nome "Xadrez, 3 de 4"), setas como botões sobre os frames `arrow/*` (hover troca o frame); ←/→ e swipe percorrem `cycle`; `aria-live` "{{name}}, n de total". Sem texto visível.
- **Texto:** fonte `sceneFontSize(s)` = `max(14, 4·s)` px (3× → 14, 5× → 20); medidas internas em `em` e em `--px` (1 px da arte). Menor texto `max(12px, …)`. Tinta `outline` sobre `cream-3`; subtítulos `red-1`/`blue-0` (AA); barras `red-2`/`blue-1`. Foco em dois tons (contorno `--border` + anel `--ink`), visível na parede de dia, de noite e no papel.
- **Escala e fallback (mobile):** mesma regra do computador com a cena inteira como área de conteúdo: escala inteira ≥ 3 fora da faixa do HUD, ou seja, precisa de 960×604 px CSS (1366×768 → 3×, 1920×1080 → 5×). Fora disso (celular, tablet em retrato, janela baixa) ou sem atlas: **modo texto** (`ShelfText`): papel `cream-3` em tela cheia (abaixo de 768 px cobre o HUD; acima, deixa 72 px no topo), título visível, Fechar, seções como botões `aria-pressed` (Linguagens, Idiomas, Ferramentas, Hobbies), Linguagens página a página com "Página n de total" visível e botões anterior/próxima, Idiomas e Ferramentas em lista, hobby com o objeto ampliado a 2× (frame do atlas) e o nome visível. Escolhido em vez de um recorte menor porque o livro aberto (243 px de arte) não cabe a 3× em 768 px; o modo texto mantém a mesma informação e a navegação por teclado. Verificado em 375×812 sem rolagem horizontal.
- **Lógica pura** (`src/ui/panels/bookshelf/skills.ts`): `projectsUsing`, `languagePageCount`, `spreadOf`, `cycleStep`, `clampIndex`, `sceneFontSize`. Testes em `tests/bookshelf.test.ts` (parser no JSON real, ordem de composição, dia/noite, hover, páginas, faixa do HUD, Esc pendente).
- Arquivos: `BookshelfPanel.tsx` (estado: item aberto, página de cada livro, mensagem `aria-live`; escolhe cena ou texto), `bookshelf/ShelfScene.tsx`, `bookshelf/ShelfText.tsx`, `bookshelf/pages.tsx` (páginas e lista, compartilhadas), `bookshelf/Sprite.tsx`, `bookshelf/spriteStyle.ts`, `bookshelf/useSwipe.ts`, `bookshelf/model.ts`. Rótulos em `bookshelf.*` do i18n.

## Componentes e utilitários
- `src/ui/hud/Hud.tsx`: menu de objetos (primeiro na ordem de Tab, aparece com foco), idioma, som, tooltip.
- `src/ui/a11y/focusable.ts`: `getFocusable`, `wrapFocusIndex` (puro, testado).
- `src/ui/panels/computer/projects.ts`: `sortProjects` (puro, testado). Testes em `tests/ui-logic.test.ts` (inclui paridade de chaves PT/EN).

## Estado atual (M1)
Feito: painéis lazy, `ComputerPanel`, diálogo acessível completo, menu de teclado via `focus-object`, tela cheia abaixo de 768px (testado em 360px sem scroll horizontal), animação de abertura só com `prefers-reduced-motion: no-preference`.

Depende do Phaser: a cena ainda precisa ouvir `focus-object` (zoom + `object-open`) e `panel-closed` (zoom-out). Até lá vale o fallback de 1,5 s.

## Estado atual (M2)
Feito: visão de perto do computador (modos A/B/C, boot, noite, vapor), verificada em 1920×1080, 1366×768, 375×812 e 360×740 sem rolagem horizontal e com texto ≥ 12,8 px.

## Estado atual (M3)
Feito: prateleira (cena em 1920×1080 a 5× e 1366×768 a 3×, dia e noite; modo texto em 375×812), faixa do HUD na visão de perto, Esc cancela a abertura pendente do menu.

## Planejado
- M3: painéis dos demais objetos (registrar no mapa `PANELS`; com visão de perto, também em `CLOSEUPS`, ou em `SCENE_PANELS` se a cena inteira for interativa).
- Faixa de mesa (`closeup-computer-desk.png`) embaixo da moldura no modo C em retrato: ainda não usada.
- M4: HUD da porta do quarto (idioma, som) e menu acessível já disponível antes de entrar.
- M5: revisão mobile completa (toque, pan/zoom) com o `qa-a11y`.

## Estilo
Variáveis em `src/app/global.css` (`--bg`, `--ink`, `--accent`, `--cyan`, `--panel`, `--border`), fonte Pixelify Sans, bordas e sombras em blocos (`.pixel-btn`, `.panel`, `.retro-window`), sem cantos arredondados nem blur. Foco visível: contorno `--cyan`. `.visually-hidden` esconde texto só para leitor de tela. A paleta final vem da bíblia de arte no M2.
