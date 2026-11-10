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
- Foco: `useFocusTrap` (`src/ui/a11y/useFocusTrap.ts`) prende Tab/Shift+Tab e puxa de volta foco que escape; foco inicial vai para o item que o painel focar ou para o diálogo. `focusReturn.ts` guarda quem abriu (botão do menu, ou `document.activeElement`); sem ninguém (clique no canvas), o `PanelHost` devolve ao botão do menu do objeto, sem anel de foco.
- Conteúdo: `getContent(toLocale(i18n.language))` (`src/ui/panels/locale.ts`); trocar o idioma com o painel aberto atualiza o conteúdo.

| Id | Painel | Tema |
|---|---|---|
| `computer` | `ComputerPanel.tsx` (dentro da visão de perto) | desktop retrô: janela com barra de título, barra de endereço, pastas por projeto (destaques primeiro, `sortProjects`), detalhe com descrição, tecnologias e link GitHub (`target=_blank rel="noopener noreferrer"`, aviso de nova aba para leitor de tela). Esc numa pasta volta à lista; foco vai para "Voltar" e retorna à pasta. |
| `bookshelf` | `BookshelfPanel.tsx` (a própria visão de perto; ver "Prateleira") | estante: livros Linguagens/Idiomas, cartucho Ferramentas, hobbies |
| `journal` | `JournalPanel.tsx` (a própria visão de perto; ver "Caderno") | caderno aberto na mesa: uma experiência por página dupla, abas por experiência |
| `phone` | `PhonePanel.tsx` (a própria visão de perto; ver "Celular") | celular apoiado no travesseiro: perfil, 4 botões de contato e currículo PT/EN |
| `frames` | `FramesPanel.tsx` (a própria visão de perto; ver "Quadros") | galeria de molduras: certificado aberto na moldura grande, 8 vagas de miniatura, setas e contador |
| demais | `GenericPanel.tsx` | "em construção" (M3) |

## Visão de perto (M2, [ADR 0006](../0006-visao-de-perto-no-dom.md))
Objetos listados em `CLOSEUPS` (`src/ui/closeup/useCloseupSheet.ts`; hoje só `computer`) não usam o fundo + janela centralizada: o `PanelHost` renderiza `<Closeup>` (`src/ui/closeup/Closeup.tsx`), que mostra a ilustração frontal e põe o **mesmo diálogo** (mesmo `ref`, `role="dialog"`, `aria-modal`, `aria-labelledby`, foco preso e devolvido, Esc) sobre a área de conteúdo. Os demais objetos continuam com o `GenericPanel` centralizado.

- **Arte:** `public/assets/ui/closeup-computer.{png,json}` (tira de frames 320×180, tags `off`, `boot`, `on` e `*-night`), `closeup-computer-steam.{png,json}` (vapor) e `closeup-computer-frame.png` (9-slice). Números vêm de `meta.quartoPixel` (`contentRect`, `crops.full/monitor`, `minContentCss`, `minScale`, `steam`, `frame9`), normalizados por `parseCloseupSheet` (`sheet.ts`, aceita `[x,y,w,h]` ou `{x,y,w,h}`). Sem os arquivos, `standin.ts` gera um SVG com o mesmo contrato. O `PanelHost` pré-carrega tudo ao montar.
- **Faixa do HUD:** `pickCloseupLayout(vw, vh, geo, HUD_BAND)`: a área de conteúdo (tela do monitor) nunca entra nos 64 px do topo (idioma/som ficam por cima da arte, não do conteúdo).
- **Tela cheia, regra "cover"** (2026-11-08, revisão da [ADR 0006](../0006-visao-de-perto-no-dom.md); `layout.ts`, puro): a arte disponível é a ilustração 320×180 **mais a sangria real** do JSON (`meta.quartoPixel.bleed`, 80/64/80/64 → célula 480×308; `layout.crop` = essa região, `layout.view` = onde ela fica na tela). Escolha: a **menor escala inteira ≥ 3 que cobre a janela só com arte**, com a ilustração o mais centralizada possível e a área de conteúdo inteira em `[0, vw] × [64, vh]`. Se nenhuma cobre, sangria sintética: `bleedStrips` (`bleed.ts`) estica a última linha/coluna da arte (menor sangria lateral → vertical, com folga `FREE_BLEED` = 8 px de arte → menor escala; máximo `maxBleed` = 32 px de arte por lado a partir da borda real). Nada cabe → **fallback**: moldura 9-slice (`border-image`, fatias 9/8/15/8 a 2×) em 100% da janela; com o HUD visível (≥ 768 px) o painel desce 46 px. Computador: 1920×1080, 1536×864 → 4×; 1366×768, 1280×720, 1440×900, 1024×768 → 3×; 2560×1440 → 6×; 768×1024 → 3× com 50 px de sangria sintética em cima e embaixo; 375×812 → fallback. A faixa `closeup-computer-desk.png` não é usada.
- **Desenho:** `<img alt="">` com a tira inteira ampliada por `s` (`image-rendering: pixelated`), dentro de `.closeup__view` (`overflow: hidden`, tamanho da ilustração, pode sair da janela; `.closeup` corta); trocar de frame é mudar `left` em múltiplos de `320·s`; as faixas `.closeup__bleed` usam o mesmo frame. Posições sempre em px CSS inteiros. Clique fora do diálogo (na ilustração) fecha.
- **Painel dentro da tela:** reflow, não `transform: scale`. O diálogo tem o tamanho exato da área de conteúdo (`224·s × 126·s`) e o painel se reorganiza nele; a fonte sobe em degraus com a escala (`screenFontSize`: `max(14, 4·s)` px; 16 px no modo C), e os tamanhos internos do `.retro-window` estão em `em`, então tudo acompanha. Menor texto: `.badge` com `max(12px, 0.8em)`. O corpo rola na vertical; a grade de pastas usa `minmax(min(8.5em, 100%), 1fr)` e nunca gera rolagem horizontal. O ícone de pasta cresce em múltiplos inteiros do seu grid 16×12 (`--icon-k`). Visual: fundo `teal-0`, barra de título `teal-2`, sem borda própria (a moldura do monitor é a borda).
- **Boot:** se a arte já estava carregada na abertura, mostra os frames de `boot` (2 × 60 ms, limitado a 300 ms por `bootSequence`) com o painel em `opacity: 0` (continua focável), depois `on`. Com `prefers-reduced-motion`: direto em `on`, sem vapor e sem fade.
- **Dia/noite:** `useNightAtOpen` (`src/ui/closeup/useNightAtOpen.ts`): `store.period` (publicado pela cena com `period-changed`) fixado na abertura; sem ele, `periodAt`/`isNightAt` (`src/ui/closeup/period.ts`, puro): noite 19h–7h usa `*-night`; entardecer usa a de dia. Fixado na abertura. Em dev, `?period=day|dusk|night` força o período (igual à cena). Usado pelo computador e pela prateleira.

## Prateleira (M3, specs.md §4)
`bookshelf` está em `SCENE_PANELS` (`PanelHost`): o diálogo (`.closeup.closeup--scene`, mesmo `ref`, `role="dialog"`, foco preso e devolvido, Esc) ocupa a tela, e o `BookshelfPanel` desenha a cena inteira, porque toda a ilustração é interativa. Fallback de carregamento: o `.panel` "Carregando..." centralizado (Suspense e enquanto o atlas carrega).

- **Atlas:** `public/assets/ui/closeup-bookshelf.{png,json}`, frames recortados com a posição na ilustração em `spriteSourceSize`. `parseShelfAtlas` (`src/ui/closeup/shelfAtlas.ts`, puro) normaliza frames + `meta.quartoPixel` (`background`, `shelf[]`, `highlights`, `layouts.book/tools/hobby`, `icons`), com os valores da spec quando falta campo. `useShelfAtlas`/`loadShelfAtlas` (`useShelfAtlas.ts`) carregam uma vez (pré-carregado pelo `PanelHost`); sem JSON/PNG → `missing` e o painel usa o modo texto.
- **Composição:** `composeShelf(atlas, { open, night, hot })` devolve as camadas na ordem da spec: fundo → sombra do destaque → sombras da tábua (menos a do aberto) → itens (menos o aberto; fica o vão) → partes do destaque → setas (só hobby). Noite usa `*/night`; o destaque é o mesmo de dia. Cada camada é um `<div>` com o PNG como `background` ampliado por `s` (`image-rendering: pixelated`), em px CSS inteiros (`src/ui/closeup/spriteStyle.ts`: `frameBackground`, `place`).
- **Interação:** cada item clicável é um `<button>` transparente no `hit` (`aria-label` do i18n; hobby: "Ver hobby: {{name}}" com o nome do conteúdo); decoração não tem botão. Hover/foco troca para o frame `hover`, sobe 4 px de arte e fica acima dos vizinhos (com foco o botão sobe junto). Abrir um item move o foco para o destaque (o botão some da tábua). Ao abrir o painel: `defaultOpen` (Linguagens no sumário), foco no livro.
  - **Livros** (`SceneBook`): grupo focável na capa (`aria-label` "Linguagens. Página n de total"); páginas no DOM dentro de `content.left/right`, com número de página visível (`aria-hidden`); cantos `pageTurn` são botões transparentes (`aria-disabled` nas pontas; só existem com mais de uma página dupla); ←/→ com foco no livro e swipe (toque) viram; `aria-live` "Página n de total" (n = página dupla). Linguagens: página 0 = sumário (cada linha é um botão que pula para a página), depois uma por linguagem (ícone, nome, "Nível n/100", barra, "Onde usei" via `projectsUsing`; vazio → "nenhum projeto ainda"). Idiomas: uma página por idioma (nome, nível; certificados/uso só se houver).
  - **Ferramentas** (`SceneTools`): título + filete `red-3` + lista (`ToolsList`) com as medidas de `layouts.tools` (linhas de `rowPitch`, texto em `rowTextX`); sem descrição → só ícone e nome; rola se passar do cartão.
  - **Hobbies** (`SceneHobby`): palco focável (`role="img"`, nome "Xadrez, 3 de 4"), setas como botões sobre os frames `arrow/*` (hover troca o frame); ←/→ e swipe percorrem `cycle`; `aria-live` "{{name}}, n de total". Sem texto visível.
- **Texto:** fonte `sceneFontSize(s)` = `max(14, 4·s)` px (3× → 14, 5× → 20); medidas internas em `em` e em `--px` (1 px da arte). Menor texto `max(12px, …)`. Tinta `outline` sobre `cream-3`; subtítulos `red-1`/`blue-0` (AA); barras `red-2`/`blue-1`. Foco em dois tons (contorno `--border` + anel `--ink`), visível na parede de dia, de noite e no papel.
- **Escala e fallback (mobile):** mesma regra cover, com `shelfGeometry(atlas)` (`shelfAtlas.ts`): conteúdo = todos os destaques (livro, cartucho + cartão, palco + setas) + os `HIT_KEEP` = 15 px de baixo de cada item clicável (45 px CSS a 3×; o topo dos livros altos pode ficar sob o HUD ou cortado). sangria real do atlas (`meta.quartoPixel.bleed`; o fundo vira `background.bleed` = `bleed/day|night`, 480×308 em −80, −64, que já contém `bg/*`); `maxBleed` sintético 48. Só o fundo encosta na borda da arte e recebe sangria sintética (`SceneSprite`, `bleed`). Escalas: 1920×1080 e 1536×864 → 4×, 1366×768, 1280×720 e 1024×768 → 3×, 2560×1440 → 6×, todas sem sangria sintética. Fora disso (celular, tablet em retrato) ou sem atlas: **modo texto** (`ShelfText`): papel `cream-3` em 100% da janela, sem moldura (≥ 768 px: conteúdo começa abaixo do HUD, papel por baixo dos botões), título visível, Fechar, seções como botões `aria-pressed` (Linguagens, Idiomas, Ferramentas, Hobbies), Linguagens página a página com "Página n de total" visível e botões anterior/próxima, Idiomas e Ferramentas em lista, hobby com o objeto ampliado a 2× (frame do atlas) e o nome visível. Verificado em 375×812 e 412×915 sem rolagem horizontal. Sem "fundo" clicável na cena (a arte cobre tudo): fecha pelo botão Fechar ou Esc.
- **Lógica pura** (`src/ui/panels/bookshelf/skills.ts`): `projectsUsing`, `languagePageCount`, `spreadOf`, `cycleStep`, `clampIndex`, `sceneFontSize`. Testes em `tests/bookshelf.test.ts` (parser no JSON real, 3 apps centrados e rótulos, `app/phone` ignorado, ordem de composição, dia/noite, hover, páginas, regra cover da prateleira, Esc pendente); regra cover e sangria em `tests/closeup.test.ts`.
- Arquivos: `BookshelfPanel.tsx` (estado: item aberto, página de cada livro, mensagem `aria-live`; escolhe cena ou texto), `bookshelf/ShelfScene.tsx`, `bookshelf/ShelfText.tsx`, `bookshelf/pages.tsx` (páginas e lista, compartilhadas), `bookshelf/Sprite.tsx`, `bookshelf/model.ts`; compartilhados com o caderno em `src/ui/closeup/`: `spriteStyle.ts`, `useSwipe.ts`, `SceneSprite.tsx`, `atlas.ts` (base do parser), `atlasLoader.ts` (carregador genérico). Rótulos em `bookshelf.*` do i18n.

## Caderno (M3, specs.md §5)
`journal` está em `SCENE_PANELS`, como a prateleira (mesmo diálogo em tela cheia, foco preso e devolvido, Esc). Conteúdo: `experiences` de `getContent(locale)`, na ordem do JSON.

- **Atlas:** `public/assets/ui/closeup-journal.{png,json}`. `parseJournalAtlas` (`src/ui/closeup/journalAtlas.ts`, puro, sobre `atlas.ts`) normaliza `meta.quartoPixel` (`background` + `bleed`, `book`, `content.left/right`, `ruling`, `stamp`, `pageTurn`, `tabs.states`, `checklist`, `icons`, `types`, `textInk`), com valores da spec quando falta campo. **Apps:** só `email`, `linkedin`, `github` (`PHONE_APP_IDS`; o id/frame `app/phone` do atlas fica sem uso e é ignorado). As posições não vêm do meta (que ainda traz as 4 antigas): `centeredAppXs` centra os botões 22×22 a passo 26 no `content` [108,20,104,146] → x 123, 149, 175 (y 95; hover inflado 2 px); os sprites, desenhados no atlas em 110/136/162, são deslocados por `dx` (= novo x − `rect` do meta) na camada do `composePhone`, rótulos 26×7 em x 121, 147, 173 (y 119). `useJournalAtlas`/`loadJournalAtlas` (pré-carregado pelo `PanelHost`); sem atlas → modo texto.
- **Composição** (`composeJournal`): fundo/sangria → sombras das abas → caderno → abas (hover troca o frame) → carimbo do tipo da aberta → canto em hover → DOM. Aba `j` com a experiência `a` aberta: `left` se j<a, `right-active` se j=a, `right` se j>a (`tabState`); rects e frames no slot 0, + `pitch·j` (22) em y (`tabArt`, `slotOffset`); no máximo `slots` (6) abas. Noite: só o fundo muda (`bg|bleed/night`).
- **Página esquerda** (`ExperienceHead`, `journal/pages.tsx`): tipo + selo "Atual" (`isCurrent`: mês corrente entre `start` e `end`, `end` null = atual, data fixada na abertura), título (`h3`), local com ícone pin (`locationLine`: organização + ` · programa` se houver + `, cidade`), período com ícone calendário. O texto para nas linhas acima do carimbo. **Direita** (`Checklist`): lista com caixinhas marcadas (`defaultDone`); `line-height` = 7·s, alinhado à pauta, sem linha vazia entre itens na cena (a caixinha marca o começo de cada um; Bradesco, 4 itens, ocupa 15 de 17 linhas a 3×, 4× e 6×); rolar (e virar região focável) fica só como último recurso para conteúdo futuro maior.
- **Navegação:** abas como `tablist` vertical (setas com volta, Home/End; tabIndex móvel), página dupla como `tabpanel` focável (foco inicial; ←/→ viram), cantos `pageTurn` como botões transparentes (alvo mínimo 15 px de arte, `aria-disabled` nas pontas), swipe; `aria-live` "Página n de total".
- **Escala:** regra cover com `journalGeometry` (caderno + todos os slots de aba dos dois lados, para a cena não pular); `maxBleed` 48. 1920×1080 → 4× (verificado), 1366×768 e 1024×768 → 3×; celular → **modo texto** (`JournalText`): papel `panelBackground`, título, Fechar, abas por organização (cor do tipo), cabeçalho, checklist, anterior/próxima e "Página n de total" visível.
- Lógica pura em `journal/experience.ts` (`monthIndex`, `isCurrent`, `locationLine`, `turnPage`, `tabKeyTarget`). Testes em `tests/journal.test.ts` (parser no JSON real, estados e deslocamento das abas, ordem de composição e noite, "Atual", paginação, paridade de ids PT/EN, regra cover). Rótulos em `journal.*` do i18n.
- Arquivos: `JournalPanel.tsx` (estado: página, mensagem `aria-live`, data; escolhe cena ou texto), `journal/JournalScene.tsx`, `journal/JournalText.tsx`, `journal/pages.tsx`, `journal/model.ts`, `journal/experience.ts`.
- Eventos: nenhum novo; usa `store.period` via `useNightAtOpen` (`?period=` em dev).

## Celular (M3, specs/6-cama-celular.md)
`phone` está em `SCENE_PANELS` (diálogo em tela cheia, foco preso e devolvido, Esc). Conteúdo: `profile` de `getContent(locale)` (`name`, `roles` curtos, `city`, `email`, `links.linkedin|github`, `resume.pt|en`). Sem WhatsApp: o código não lê `links.whatsapp` nem `phoneDisplay`.

- **Atlas:** `public/assets/ui/closeup-phone.{png,json}` (25 frames). `parsePhoneAtlas` (`src/ui/closeup/phoneAtlas.ts`, puro, sobre `atlas.ts`) normaliza `background` + `bleed`, `phone`, `screen`, `content`, `statusBar`, `avatar`, `divider`, `slots`, `apps`, `cv`, `icons`, `textInk`, com valores da spec quando falta campo. `usePhoneAtlas`/`loadPhoneAtlas` (pré-carregado pelo `PanelHost`); sem atlas → modo texto.
- **Composição** (`composePhone`): fundo/sangria → aparelho → status → avatar → divisória → 3 apps (hover ou foco do teclado troca para `/hover`) → cv PT/EN (`cvFrame`: com PDF normal/hover; sem PDF `/disabled`, sem hover) → DOM. Noite: só o fundo muda.
- **DOM nos slots** (`phone/PhoneScene.tsx`): nome, 3 cargos (`roleLineHeight`·s), cidade com `icon/pin`, rótulos sob os botões (`aria-hidden`; o nome acessível é o `aria-label`), "Currículo (PDF)", texto PT/EN em `cv.textRect` e o aviso em y 155–165 (`resumeNote`): "Em breve" quando os dois PDFs são null, "PT: em breve" (`phone.resumeSoon`) quando só um falta. Botões transparentes nos rects: `<a>` (e-mail `mailto:`; LinkedIn e GitHub com `target=_blank rel="noopener noreferrer"`); currículo com PDF `<a download>`, sem PDF `<button aria-disabled>` descrito por "Currículo indisponível por enquanto", com contorno de foco próprio. O anel `/hover` acende no hover e no foco só com `:focus-visible`.
- **Teclado:** foco inicial no e-mail; Tab: e-mail, LinkedIn, GitHub, PT, EN, Fechar.
- **Escala:** regra cover com `phoneGeometry` (aparelho inteiro, 124×178); `maxBleed` 48. 1920×1080 → 4×, 1366×768 → 3×, **375×812 → 3×** (o aparelho em retrato cabe, 372 px); abaixo disso (ex.: 360×740) → **modo texto** (`PhoneText`): papel, título, Fechar, avatar/nome/cargos/cidade, links com o ícone do app a 2× e o nome visível, botões PT/EN. Se a troca de modo (resize) tirar o foco, ele vai para o e-mail.
- Lógica pura em `phone/contact.ts` (`contactLinks`, `resumeLinks`, `withBase`, `resumeNote`; o serviço de cada botão é o próprio id do app). Testes em `tests/phone.test.ts` (parser no JSON real, ordem de composição e noite, hover, currículo desativado/ativo, links gerados, paridade `phone.*` PT/EN, regra cover). Rótulos em `phone.*` do i18n.
- **Currículo e subcaminho:** `resumeLinks` passa o caminho do conteúdo (`/cv/davi-kazuhiro-natume-en.pdf`) por `withBase`, que troca a `/` inicial por `import.meta.env.BASE_URL` (`vite.config.ts` usa `base: './'` → `./cv/…` no build, relativo ao `index.html`; funciona em `/portfolio/` no GitHub Pages). URLs com esquema, `//host` e caminhos relativos passam intactos.
- Arquivos: `PhonePanel.tsx` (escolhe cena ou texto), `phone/PhoneScene.tsx`, `phone/PhoneText.tsx`, `phone/ResumeButton.tsx`, `phone/model.ts`, `phone/contact.ts`.
- Eventos: nenhum novo; usa `store.period` via `useNightAtOpen`.

## Quadros (M3, specs/7-quadros.md, variação A "galeria de molduras")
`frames` está em `SCENE_PANELS` (diálogo em tela cheia, foco preso e devolvido, Esc). Conteúdo: `awards` de `getContent(locale)`, na ordem do JSON (mais recente primeiro; não reordenar).

- **Atlas:** `public/assets/ui/closeup-frames.{png,json}`. `parseFramesAtlas` (`src/ui/closeup/framesAtlas.ts`, puro, sobre `atlas.ts`) normaliza `background` + `bleed`, `frame`, `content`, `pdf`, `counter` (`text`, `plaque`), `arrows` (rect + `hover`), `thumbs` (`slots`, `rects`, `offsets`, `styles`, `frames`, `selected`) e `textInk`, com valores da spec quando falta campo (rects das vagas pela fórmula `thumbSlotRect`). `useFramesAtlas`/`loadFramesAtlas` (pré-carregado pelo `PanelHost`); sem atlas → modo texto.
- **Composição** (`composeFrames`): fundo/sangria (já traz moldura, papel, selo, luminária, plaquinha e setas normais) → miniaturas `j < min(n, 8)`: `thumb/selected` (vaga vazia com anel) no aberto, senão `thumb/<estilo>` (`styles[j % 3]`: madeira, grafite, dourada) ou `/hover` no hover/foco, deslocadas por `offsets[j]` (`dx`/`dy` do `SceneSprite`) → seta em hover/foco (`arrow/<dir>/hover`, só se ela leva a outro certificado) → DOM. Vagas sem certificado ficam vazias. Noite: só o fundo muda.
- **DOM** (`frames/FramesScene.tsx`): área do certificado em `content` (`role="group"`, `tabIndex=0`, foco inicial; título `h3` em até 2 linhas, emissor, `dateLabel` em `<time>`, descrição com reticências em 4 linhas), "Abrir PDF" em `pdf` (`<a target="_blank" rel="noopener">` + "(abre em nova aba)" escondido; não aparece se `file` é null), contador "n / total" em `counter.text` (`aria-hidden`; o anúncio vai no `aria-live` do painel: "Certificado n de total: título"), setas `<button>` em `arrows.*.rect` (48×48 a 3×, `aria-disabled` nas pontas) e miniaturas `<button>` em `thumbs.rects[j]` (`aria-label` = título, `aria-current="true"` no aberto). Mais de 8 certificados: só os 8 primeiros têm miniatura; as setas navegam por todos.
- **Navegação:** abre no índice 0; ‹ ›, ←/→ na área do certificado e swipe na ilustração; **presa nas pontas** (`stepAward`, sem dar a volta, como o caderno); clicar numa miniatura pula para ele. Ordem de Tab: Fechar → certificado → Abrir PDF → setas → miniaturas.
- **Escala:** regra cover com `framesGeometry` (moldura, plaquinha, setas com hover e as 8 vagas com hover, 294×165); `maxBleed` 48. 1366×768 → 3×; celular (375×812) → **modo texto** (`FramesText`): papel `panelBackground`, título, Fechar, abas por certificado com "emissor ano" visível (`aria-label` "emissor ano: título", padrão tablist com ←/→/Home/End de `tabKeyTarget`), detalhe, "Abrir PDF" e anterior/próximo com "Certificado n de total".
- **PDF e subcaminho:** `certificateHref` (`frames/awards.ts`) passa `file` por `withBase` do celular (`/certificates/x.pdf` → `./certificates/x.pdf` no build).
- Testes em `tests/frames.test.ts` (parser no JSON real e sem meta, vagas pela fórmula e offsets, estilos, ordem de composição e noite, seta nas pontas, limite de 8, navegação presa, regra cover em 1366×768 e 375×812, paridade de ids PT/EN, ordem por data, arquivos existentes em `public/certificates/`). Rótulos em `frames.*` do i18n.
- Arquivos: `FramesPanel.tsx` (estado: aberto, mensagem `aria-live`; escolhe cena ou texto), `frames/FramesScene.tsx`, `frames/FramesText.tsx`, `frames/AwardDetail.tsx` (`AwardDetail`, `PdfLink`), `frames/awards.ts`, `frames/model.ts`; CSS em `.frames*`, `.award*`, `.frames-text*` (`global.css`).
- Eventos: nenhum novo; usa `store.period` via `useNightAtOpen`.

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

## Estado atual (tela cheia, 2026-11-08)
Feito: visão de perto cobrindo a janela inteira (regra cover + sangria) no computador e na prateleira; fallback sem margens. Verificado em 1920×1080, 1536×864, 1366×768, 1280×720, 1024×768, 768×1024, 375×812 e 412×915, dia e noite (`.playwright-mcp/fullscreen/`; com a sangria real, `.playwright-mcp/fullscreen2/`).

## Estado atual (caderno, 2026-11-08)
Feito: caderno de experiências (cena em 1920×1080 a 4×, 1366×768 e 1024×768 a 3×, dia e noite, PT e EN; modo texto em 375×812), aberto por clique real no quarto; prateleira conferida. Capturas em `.playwright-mcp/journal/`. Aberto por clique no canvas, ao fechar o foco volta ao item do menu de teclado do mesmo objeto (`data-object-id`; `focus({ preventScroll, focusVisible: false })`), sem mostrar o menu: ele aparece com `:has(:focus-visible)`, não mais `:focus-within`. Vale para todos os painéis.

## Estado atual (celular, 2026-11-08)
Feito: celular (Contato + currículo) em 1920×1080 a 4× (dia, PT), 1366×768 a 3× (noite, EN) e 375×812 a 3×; modo texto em 360×740 sem rolagem horizontal. Aberto pelo menu de teclado (o clique no quarto depende da integração do `scene-engineer`). Capturas em `.playwright-mcp/phone/`.

## Estado atual (quadros, 2026-11-09)
Feito: painel dos quadros (variação A) conferido pelo menu de teclado em 1366×768 a 3× (dia, PT; navegação por ←/→, contador, ordem de Tab) e modo texto em 375×812. Clique no quarto depende da integração do `scene-engineer`. Noite, EN e 1920×1080 não conferidos no navegador (cobertos por teste).

## Planejado
- M3: painéis dos demais objetos (registrar no mapa `PANELS`; com visão de perto, também em `CLOSEUPS`, ou em `SCENE_PANELS` se a cena inteira for interativa).
- Faixa de mesa (`closeup-computer-desk.png`) embaixo da moldura no modo C em retrato: ainda não usada.
- M4: HUD da porta do quarto (idioma, som) e menu acessível já disponível antes de entrar.
- M5: revisão mobile completa (toque, pan/zoom) com o `qa-a11y`.

## Estilo
Variáveis em `src/app/global.css` (`--bg`, `--ink`, `--accent`, `--cyan`, `--panel`, `--border`), fontes self-hosted (ver "Fontes"), bordas e sombras em blocos (`.pixel-btn`, `.panel`, `.retro-window`), sem cantos arredondados nem blur. Foco visível: contorno `--cyan`. `.visually-hidden` esconde texto só para leitor de tela. A paleta final vem da bíblia de arte no M2.

### Fontes (decisão do Davi, 2026-11-08)
A Pixelify Sans no texto miúdo confundia 5/S e C/O ("Ouritiba", "202S"). Agora:
- **Texto corrido: VT323** (SIL OFL 1.1): páginas do livro e do caderno, tela do monitor, tela do celular, modos texto, tooltip e botões do HUD. 5/S, C/O, 0/O e 1/l/I distintos, acentos do português, monoespaçada, só peso 400. Comparada com Tiny5 (larga, quase caixa-alta), Jersey 10 (condensada, pequena a 14–16 px), DotGothic16 (l = I), Micro 5 e Handjet (miúdas). Pixel Operator e m5x7 ficaram de fora por não estarem num repositório confiável para self-host.
- **Títulos grandes: Pixelify Sans** (OFL), com negrito real: `.panel h2`, `.shelf-text__header h2`, `.retro-window__title`, `.project-detail h3`, `.book-page__title`, `.shelf-tools__title`, `.phone__name`, `.phone-text__name` (variável `--font-title`).
- Arquivos em `src/app/fonts/` (woff2 do subconjunto latin do Google Fonts + `OFL-*.txt`), `@font-face` com `font-display: swap` em `global.css`; o Vite empacota com hash (funciona com `base: './'`). Nenhuma requisição ao Google Fonts.
- **Tamanho:** `:root` tem `font-size-adjust: 0.5`, então a VT323 (x-height 0,4 em) sai 1,25× o font-size declarado, com a mesma largura média da Pixelify. Por isso `sceneFontSize`, `screenFontSize`, os `em` e os mínimos (`max(12px, …)`, agora 15 px efetivos) não mudaram, e nada estoura os rects (pauta 7·s, 3 cargos de 8·s, livro da prateleira) em PT e EN a 3× e 4×. A grade da VT323 é 1/25 em: a 5× (base 20 → 25 px) fica pixel-perfeita; a 3×/4× (17,5/20 px) fica levemente suave, mas legível. Os títulos em Pixelify usam `font-size-adjust: none`.
- `font-synthesis-weight: none`: elementos com `font-weight: 700` em VT323 (kickers, rótulos) ficam regulares, sem falso negrito borrado; a hierarquia vem da cor e do tamanho.
