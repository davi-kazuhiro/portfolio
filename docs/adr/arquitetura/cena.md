# Arquitetura — cena (Phaser)

Mantido pelo agente `scene-engineer`.

## Estrutura
```
src/game/
  config.ts            # cria o Phaser.Game (pixelArt, Scale.RESIZE com snap de 1 px, cenas); em dev expõe window.__game
  PhaserGame.tsx       # componente React que monta o jogo uma única vez
  EventBus.ts          # contrato tipado Phaser ⇄ React (GameEvents)
  assets.ts            # mapa, manifesto dos sprites gerados (ROOM_SPRITES), tint dos períodos e paleta
  iso.ts               # projeção 2:1 64×32 (isoToScreen, unitsToScreen), objetos do Tiled → tiles, âncora
  objects/
    registry.ts        # ids dos interagíveis
    Interactable.ts    # hover (outline), clique pela silhueta (+ minHit) e retângulo de foco de um objeto
    spriteMeta.ts      # lê o contrato da arte: meta.quartoPixel, frameTags, animações locais por tag
    standins.ts        # stand-ins com o mesmo contrato, só para arte que ainda não existe
  scenes/              # Boot → Preload → Entrance (porta do quarto, M4) → Room
  systems/
    RoomMap.ts         # lê o .tmj: image layer room-shell, object layers interactables e decor
    FocusCamera.ts     # câmera: visão do quarto, zoom de foco, degraus/pan do visitante, resize
    gestures.ts        # regras puras dos gestos (M5): degraus, limite do pan, toque × arrasto, ponto fixo
    RoomGestures.ts    # liga pinça, pan, roda e toque aos ponteiros do Phaser
    cameraMath.ts      # contas puras de zoom/enquadramento (roomView, snapCenter...) testáveis sem Phaser
    outline.ts         # máscara de opacidade de um grupo de frames + textura do outline de 1 px
    period.ts          # regras puras: período pelo horário, ?period=, tag de cada sprite por período
    DayNight.ts        # cria os sprites do quarto e troca o período (tint, tags, crossfade, frames sincronizados)
    motion.ts          # prefers-reduced-motion
    entranceMath.ts    # regras puras da porta: escala/zona segura, tags por período, visited
    Audio.ts           # GameAudio: música e SFX (uma instância por jogo, sobrevive à troca de cena)
public/maps/room.tmj   # mapa isométrico do Tiled (7×7, tile 64×32), sem tile layers
public/assets/         # arte gerada por tools/art (art-director): tiles/room-shell, objects/*
```

## Porta do quarto e áudio (M4)
- **Preload** também carrega `ENTRANCE_SPRITES` (`assets.ts`: `entrance-bg`, `entrance-wall-column`, `door-interior`, `door`, `door-light`, `door-knob-glow`) e os 5 SFX de `AUDIO.sfx`; cria o `GameAudio`. No `create`: se `localStorage['quartoPixel.visited'] === '1'` vai direto ao `Room` (`shouldSkipEntrance`, acesso ao storage em try/catch); em dev, `?entrance=1` força a porta. Sem a arte da porta, também vai ao `Room`.
- **Entrance** (spec `docs/arte/specs/2-porta.md`):
  - camadas na posição `meta.quartoPixel.at`, profundidade = ordem de desenho (bg 0 → interior 1 → porta 2 → luz 3 → brilho 4); colunas `entrance-wall-column` repetidas nas laterais com a profundidade do fundo;
  - **escala** (`entranceView`): zoom inteiro da câmera `floor(min(vw/320, vh/180))`; se a zona segura (`x104 w112`) der zoom maior (`floor(min(vw/112, vh/180))`), usa esse e corta as laterais. Ilustração centrada com `snapCenter`. Resize refaz zoom, centro e colunas. Ex.: 1920×1080 → 6 (sem colunas), 1920×950 → 5 (2 colunas de cada lado), 1024×768 → 4 (estreita), 390×844 → 3 (estreita);
  - **período**: `periodAt` (ou `?period=` em dev); tags `day|dusk|night` no fundo, colunas, interior e luz; porta `closed`/`closed-dusk`/`closed-night` (pré-tingidas, sem tint). Tag ausente cai na de dia (`availableTag`). `period-request` do HUD troca na hora e segue para o Room; emite `period-changed`;
  - **hover** (zona da folha 128,22 64×140, cursor pointer): mostra `door-knob-glow` (tag `hover`, parada com reduced-motion) e emite `door-hover` com a maçaneta (183, 97) em px CSS do canvas (`worldToScreen`; reemitido no resize); ao sair, `door-hover(null)`. Conferido: 1920×1080 → (1098, 582);
  - **entrar**: clique/toque na folha, `entrance-enter` ou Enter/Espaço com `document.activeElement` = body ou canvas (sem captura de tecla; Tab e teclas com foco no DOM ficam com o DOM). SFX `sfx-door`, porta toca `open*` (≈340 ms, `repeat: 0`), depois zoom ×1,5 + `fadeOut` 160 ms para `cream-3`; o Room faz `fadeIn` de 250 ms da mesma cor (total ≈750 ms). Com reduced-motion: corte direto, sem fade;
  - **`focus-object` na porta**: entra direto (sem animação) e passa `{ focus: id }` em `scene.start('Room', data)`; o Room chama `requestFocus(id)` no fim do `create` (zoom → `object-open`, fluxo normal). Se a troca já foi pedida (porta abrindo/clarão), o id é gravado no mesmo objeto `data` (o Phaser guarda a referência), então o pedido não se perde. O Room cria seus listeners no mesmo passo em que a Entrance desliga os dela: não há janela sem ouvinte;
  - `scene-ready('Entrance')` no `create`; limpeza (EventBus, resize, teclado, `door-hover(null)`) no `SHUTDOWN`.
- **Room** recebe `RoomStartData` (`focus`, `via: 'door'`, `period`), grava `quartoPixel.visited = '1'` no `create` e chama `GameAudio.attach`.
- **Áudio** (`systems/Audio.ts`, ADR 0007): `GameAudio.of(game)` = uma instância por `Phaser.Game` (WeakMap), destruída com o jogo; o `SoundManager` é global, então a música atravessa a troca de cena sem duplicar.
  - estado inicial: `!useGameStore.getState().muted` (só leitura no início); depois só `audio-toggle`;
  - ligar: carrega `music-room.wav` sob demanda pelo loader da cena ativa (se a cena cair no meio da carga, a próxima cena tenta de novo em `attach`) e toca em loop, volume 0,35; desligar pausa (religar continua de onde parou). Se o `SoundManager` ainda estiver `locked` (sem gesto), espera o evento `unlocked`;
  - SFX (volume 0,5, nada com som desligado ou `locked`): `sfx-hover` em `object-hover`/`door-hover` não nulos (no máximo 1 a cada 120 ms), `sfx-open` em `object-open`, `sfx-close` em `panel-closed` só se havia painel aberto, `sfx-door` na porta, `sfx-toggle` em `ui-sfx`.
- Conferido no navegador (dev, `?entrance=1`): 1920×1080 nos 3 períodos (tags e brilho da maçaneta à noite), 390×844 (zoom 3, zona segura inteira), abertura → Room com `visited = 1`, `focus-object('computer')` na porta → Room → `object-open('computer')`, `audio-toggle(true)` → `music-room` baixada e tocando a 0,35, `audio-toggle(false)` → nada tocando.

## M5 – gestos
- **Degraus** (`gestures.zoomRange`): do zoom do enquadramento (`roomView`, "base") até `base + 2` (limitado a `MAX_ZOOM` 8), sempre inteiros. Resultado: 390×844 → 1–3, 768×1024 → 1–3, 1366×768 → 2–4, 1920×1080 → 3–5.
- **Pinça** (dois dedos; `RoomGestures` chama `input.addPointer(1)`, o Phaser só cria 1 ponteiro de toque): degrau = `round(zoom inicial × distância/distância inicial)` (`pinchZoom`). **Roda**: um degrau por evento, no máximo 1 a cada 140 ms (rajada do trackpad). Os dois mantêm o ponto sob os dedos/cursor (`zoomAround`) e trocam o degrau com tween de 150 ms (`STEP_DURATION`, contador do `tweens`, centro = ponto fixo + correção do limite); com reduced-motion, instantâneo. Fora do estado `room` (zoom de foco ou painel aberto) a roda é ignorada.
- **Pan** (um dedo ou mouse com botão esquerdo): só quando `canPan` (zoom > base ou o quarto maior que a tela, ex.: 375–390 px no zoom 1). Começa depois de 8 px de arrasto, a partir do ponto em que foi reconhecido, sem inércia. O centro fica dentro de `panBounds` = quarto inteiro (`framing.full`, room-shell + 8) + 8 px = 16 px do mundo além do room-shell; num eixo em que o quarto cabe, fica centralizado (`clampView`). Todo centro passa por `snapCenter` (sem meio pixel).
- **Toque × arrasto** (`isTap`): abre só com < 8 px e, no toque, < 500 ms (mouse sem limite de tempo). Um gesto (do primeiro dedo até o último sair) com arrasto ≥ 8 px ou pinça nunca abre, e o hover é tirado no início do arrasto/pinça e ignorado durante ele (`RoomGestures.busy`). No toque, o hover é limpo quando o último dedo sai.
- **Abrir/fechar**: `FocusCamera.focus` guarda a vista do visitante (zoom + centro); o zoom-out do `panel-closed` volta para ela (reclampada), não para o enquadramento.
- **Resize/rotação**: descarta a vista guardada e o degrau em curso; volta ao enquadramento padrão.
- **Toque** (`pointer: coarse` ou `hover: none`): alvo de clique de pelo menos 32 px CSS no zoom base (`touchMinHit(base)` px do mundo, recalculado no resize), ampliando só a área de clique, como o `minHit` (`Interactable.setTouchMin`). O anel branco já pisca o tempo todo em todos os interagíveis (não depende de hover).
- **Navegador**: o `TouchManager` do Phaser já chama `preventDefault` (listeners não passivos) nos toques do canvas; mesmo assim a UI deve pôr `touch-action: none` no canvas.
- Conferido no navegador (Chrome headless, toque via CDP): 390×844 e 768×1024 — pinça 1→3 e 3→1, pan com um dedo começando no computador (não abre), toque no celular → zoom de foco + painel, Esc → volta à mesma vista (zoom 3 e scroll de antes), centro alinhado ao pixel; 1366×768 — roda 2→4→2 em volta do cursor e arrasto com o mouse.

## Estado atual (M2 + prateleira, caderno, cama e celular do M3)
- **Boot** só inicia o Preload. (Preload/porta do M4: ver a seção acima.)
- **Preload** desenha a barra de progresso em blocos inteiros e carrega `maps/room.tmj` + cada sprite de `ROOM_SPRITES` com `load.aseprite` (PNG + JSON Hash). No `create`, o que não carregou vira **stand-in** (`objects/standins.ts`): caixas isométricas das specs, com o mesmo canvas, pivot, frames `"<chave> <n>"` e `meta.quartoPixel` do arquivo real. Em dev, o console lista os stand-ins usados. Com toda a arte presente (situação atual), nada disso roda.
- **Contrato da arte lido pela cena** (bíblia, "Arquivos, nomes e âncoras"):
  - origem do sprite = `pivot` do frame (o Phaser aplica sozinho; px inteiro);
  - `layerOf: "<chave>"` = camada de outro sprite (mesmo canvas e âncora); `light: true` = fonte de luz, fica fora do tint; `syncFramesWith: "<chave>"` = acompanha o frame do principal; `hit: "none"` = não entra no hover/clique do principal;
  - `meta.quartoPixel.mount` (`floor`, `wall-back`, `wall-left`, `surface`) define a faixa de profundidade; com `surface` (objeto sobre móvel), `surfaceOf: "<chave>"` e `depthOffset` (padrão 0,01) dão a profundidade = a do móvel + `depthOffset`; `focus` (`[x, y, w, h]` em px do canvas) é o enquadramento do zoom; `minHit` amplia o alvo de clique;
  - `meta.frameTags`: as animações são criadas **no próprio sprite** (`spriteMeta.createLocalAnims`), porque as chaves `"<id> <n>"` não funcionam com `anims.createFromAseprite` (ele procura frames `"0"`, `"1"`…) e tags iguais (`idle`) em arquivos diferentes colidiriam no gerenciador global.
- **Room**:
  - **casca**: o image layer `room-shell` do .tmj diz qual imagem é a casca; o sprite vai com o pivot (canto do fundo, no chão) na origem do mundo. Se o PNG não tiver pivot, vale a posição do image layer (em dev, divergência entre os dois gera aviso). `light-window` é camada da casca (profundidade 1);
  - **decoração** (`decor`): ponto/retângulo cujo nome é o arquivo do sprite (`window`, `pc-tower`, `desk-chair`, `bed`). Não é interativa (o clique atravessa);
  - **interagíveis** (`interactables`): retângulo da pegada + `id`. Só ficam clicáveis se a textura do `id` existir; um id sem sprite fica fora do canvas e o menu de teclado abre o painel sem zoom;
  - **âncora** = centro do retângulo do Tiled, no chão (`tileRectCenter` → `isoToScreen`);
  - **profundidade** (planta, "Leitura e oclusão"): casca 0 < camadas da casca (`light-window`) 1 < parede 5 < chão `10 + col + row` da âncora; objeto sobre móvel (`mount: "surface"`) = profundidade do móvel + `depthOffset` (o `journal` = 14,01, o `phone` = 18,01 sobre a `bed` 18; a cena põe os interagíveis `surface` depois dos outros, para o móvel já existir; móvel ausente → aviso e profundidade de chão); camadas (sprites com `layerOf`, na ordem de `ROOM_SPRITES`: `desk-lamp` e `light-computer` sobre o `computer`, `light-journal` sobre o `journal`, `light-headset` sobre o `headset`, `light-phone` sobre o `phone`, `light-frames` sobre os `frames`) = principal + 0,01 × posição; outline = **camada mais alta do objeto (inclusive luz) + 0,005**, para o anel não sumir sob a luz à noite (`computer__outline` e `journal__outline` = 14,025, `phone__outline` = 18,025, `frames__outline` = 5,015 sobre `light-frames` 5,01);
  - **hover**: outline de 1 px `gold-2` + 1 px `outline` (#2a1b2a) em volta dele (anel duplo, `PALETTE.outline`; textura com 2 px de folga, posta em (x−2, y−2)). O anel escuro foi pedido pelo QA no M3: só o dourado ficava com contraste ≈1,4:1 sobre o tampo claro e a poça da luminária à noite e quase sumia; agora vale para todos os interagíveis, de dia e à noite. O dourado continua por fora da união do sprite com as camadas sólidas (camadas que não são luz nem `hit: "none"`; a `desk-lamp` final tem `hit: "none"` porque a luminária já está desenhada no `computer`) + `object-hover` (id / `null`). O outline não recebe tint: continua dourado à noite;
  - **prateleira** (`bookshelf`, M3): objeto de parede (`wall-back`, profundidade 5), acima do monitor na tela. As silhuetas da prateleira e do `computer` não se tocam (0 px em comum, conferido no navegador; o gerador deixa 6 px de folga) e o `minHit` 24×24 não amplia nada (a silhueta já é maior). Clique por alpha: livros/tábua abrem `bookshelf`, o monitor abre `computer`. Onde as caixas se sobrepõem, o `computer` (profundidade 14) está por cima, mas o hit por alpha deixa o clique atravessar o transparente. Tint normal da noite (sem frame pré-tingido); a sombra da tábua está assada no room-shell, fora do hover;
  - **caderno** (`journal`, M3): `mount: "surface"`, `surfaceOf: "computer"`, no ponto (2, 2) do Tiled, âncora (90, 57) fora do frame 60×36 (pivot 1,5 / 1,583), profundidade 14,01 (acima da mesa, abaixo da cadeira e do gabinete, 15). A silhueta (56×32 px) já é maior que o `minHit` 24×24, então o alvo não cresce e não alcança teclado nem controle. Conferido no navegador: caderno → `journal`; luminária, controle, frente do braço B e monitor → `computer`; o anel do `computer` não tem nenhum pixel sobre o caderno. `light-journal` (luz, `hit: "none"`) segue a regra das `light-*`: só no entardecer e à noite, fora do tint. Zoom pelo `focus` `[2, 2, 56, 32]`;
  - **headset e controle** (`headset`, `controller`, M3, aprovados em 2026-11-10): antes decoração assada no `computer`, agora sprites próprios no padrão exato do `journal` (nenhuma mudança no motor). `mount: "surface"`, `surfaceOf: "computer"`, `depthOffset` 0,01 (profundidade 14,01), ponto (2, 2) do Tiled, `hit: "alpha"` + `minHit` 24×24, `topOnly`. `headset` 27×18, âncora (−80, 36), `focus` `[2, 2, 23, 14]`, com `light-headset` (luz, `hit: "none"`, fora do tint, só no entardecer e à noite; outline 14,025); `controller` 34×21, âncora (30, 76), `focus` `[2, 2, 30, 17]`, sem luz (outline 14,015). O `minHit` do headset pega um pedaço do `pc-tower` (decoração): clicar ali abre o headset (aceito pelo Davi). A silhueta de clique do `computer` (`computer-hit`) é só monitor + mouse, então nenhum dos dois disputa clique com ele. Conferido no navegador: anel branco nos dois, hover → outline, clique → zoom até o `focus` + `object-open`; caderno → `journal`, monitor → `computer`;
  - **cama e celular** (M3): `bed` é decoração (`mount: "floor"`, `hit: "none"`, pegada `[[0,0,4,2]]`), retângulo (0, 160) 128×64 no `decor` = tiles col 0–3, row 5–6, âncora no centro (2, 6), profundidade 18. Não é interativa: clique fora do celular atravessa a cama e não abre nada. Fica nas rows 5–6, longe da mesa (rows 0–3), então não cobre caderno nem computador; o pet futuro precisa de alvo próprio (interagível acima de 18 se andar sobre a cama). `phone` é interagível `mount: "surface"`, `surfaceOf: "bed"`, `depthOffset` 0,01, ponto (64, 192) = (2, 6), âncora (19, 37) fora do frame 38×21, `hit: "alpha"` + `minHit` 24×24, zoom pelo `focus` `[6, 2, 26, 15]`. `light-phone` (luz, `hit: "none"`) só no entardecer e à noite, fora do tint. Conferido no navegador: hover dá cursor pointer, clique no celular → `phone` (painel genérico), clique no cobertor não abre nada;
  - **quadros** (`frames`, M3, variação A): objeto de parede (`mount: "wall-left"`, profundidade 5, como a `bookshelf`), ponto (0, 88) = tile (0; 2,75) na base da parede esquerda, âncora (36, 124) fora do canvas 75×66. `hit: "alpha"` + `minHit` 24×24, zoom pelo `focus` `[2, 2, 71, 62]`. O frame 1 (tag `hover`) do PNG é só referência: o hover continua sendo o outline gerado. `light-frames` (luz, `layerOf: "frames"`, tag `night`) fica fora do tint, só no entardecer e à noite; o outline (5,015) vai acima dela. A sombra está assada no `room-shell`. Conferido no navegador (dia e `?period=night`): hover mostra o anel inteiro também à noite e o rótulo "Quadros — Prêmios e certificados"; clique e o item do menu de objetos dão zoom 7 centrado em (−86, −47) e abrem o painel; não toca a luminária nem a mesa;
  - **clique**: hit test pela mesma silhueta (máscara gerada uma vez, no frame inicial) mais o `minHit` centrado; `input.topOnly = true`, então quem está por cima ganha (o `journal` sobre o `computer`). Clique = pointerup que `RoomGestures.acceptsTap` aceita (M5), ou `focus-object` → zoom → `object-open`;
  - **dia/noite**: ver a seção abaixo. Tags neutras (`idle`) animam em loop, exceto com `prefers-reduced-motion` (frame parado).
- **Câmera** (`FocusCamera`), estados `room` → `zooming-in` → `focused` → `zooming-out` → `room`:
  - **visão do quarto** (`cameraMath.roomView`) usa dois retângulos. `full` = room-shell + 8 px. `safe` = largura do room-shell × (do topo do interagível mais alto, ou da linha de segurança das paredes — 112 px de altura a 1,5 tile do canto, y = −88 —, menos 2 px, até o fim do piso). Zoom = maior inteiro em que `safe` cabe. Se `full` cabe, centraliza; senão desce até o chão mantendo o topo de `safe` e corta só o alto das paredes;
  - **foco**: `pan` + `zoomTo` em 400 ms `Cubic.easeOut` até `meta.quartoPixel.focus` (sem ele, a caixa da silhueta); zoom final inteiro, ≥ zoom do quarto + 1, objeto em ≤ 60% da tela, máximo 8. Ao terminar, o estado final é reaplicado exato;
  - **alinhamento ao pixel**: todo centro passa por `snapCenter`, que escolhe o centro em que `zoom·centro − tela/2` é inteiro (com altura ímpar, como 951 px, centrar num inteiro deixava tudo a meio pixel);
  - `prefers-reduced-motion`: tudo instantâneo (lido a cada foco);
  - resize: reenquadra na hora; se estiver animando, ao fim da animação.
- **Tamanho do canvas**: `Scale.RESIZE` copia o `getBoundingClientRect` do pai, fracionário com devicePixelRatio ≠ 1. `scale.snap = { width: 1, height: 1 }` arredonda para baixo o tamanho do jogo e da câmera, e `autoRound` o do canvas (conferido a 125%: pai 1228,79×583,59 → jogo, câmera e canvas 1228×583). Com DPR fracionário, o navegador ainda amplia o canvas pela razão do DPR (ex.: 1,25 px de tela por px CSS); isso é do navegador e vale para a página toda.
- **Garantias do fluxo** (combinadas com o `ui-engineer`, sem mudança no M2):
  - `object-open` sai **uma vez** por foco, ~400 ms depois do pedido (medido: diálogo aberto em ≈440 ms; com reduced-motion, ≈30 ms), bem abaixo do fallback de 1,5 s da UI;
  - cliques são ignorados fora do estado `room`;
  - `panel-closed` é idempotente em qualquer estado: em `room` não faz nada; durante `zooming-in` cancela o zoom **sem** emitir `object-open`; em `focused` faz o zoom-out;
  - `focus-object` que chega durante o `zooming-out` fica na fila (só o último vale); em `zooming-in`/`focused` é ignorado. O fim de cada animação (`onDone`) roda num microtask: o Phaser chama o callback de progresso antes do `effectComplete`, que desliga o efeito; uma animação nova começada ali (o foco da fila) era desligada na hora e a câmera ficava presa em `zooming-in` (bug do QA no M3);
  - `focus-object` de um id que não está no canvas abre sem zoom; o `panel-closed` seguinte volta sem animação;
  - **Esc durante o zoom de entrada** (M3): a cena escuta `keydown-ESC` no teclado do Phaser (sem `addKey`/captura, o Esc continua chegando ao DOM) e, só em `zooming-in`, faz o mesmo que `panel-closed`: cancela o zoom sem emitir `object-open` e volta ao quarto. Nos outros estados não faz nada (com o painel aberto o Esc é da UI). Limitação: num pedido vindo do menu de teclado, o fallback de 1,5 s da UI (`requestOpen`) ainda abre o painel sem zoom; falta a UI cancelar esse fallback no Esc (ou um evento de cancelamento) — pendência do `ui-engineer`.
- **Limpeza**: listeners do EventBus e do `scale` saem no `SHUTDOWN`/`DESTROY` da cena.

### Dia, entardecer e noite (`systems/DayNight.ts`)
- **Período** pelo horário local do visitante (`periodAt`): dia 7h–17h, entardecer 17h–19h, noite 19h–7h. Reavaliado a cada minuto (`time.addEvent`, 60 s; com a aba em segundo plano o loop do Phaser pausa e a checagem roda ao voltar).
- **Tint**: `PERIOD_TINT` em `assets.ts` (mesmos valores de `TINT` em `tools/art/palette.mjs`): dia `#ffffff`, entardecer `#f2c3a0`, noite `#6a6aa8`. O "retângulo MULTIPLY" da bíblia é feito como **tint MULTIPLY em cada sprite que não é luz** (`setTint`, modo padrão do Phaser 4). Com pixels só opacos ou transparentes, o resultado é idêntico, sem a borda de um retângulo sobre o fundo fora do quarto e sem reordenar profundidades: o que é luz (`meta.quartoPixel.light`) só não recebe tint e por isso fica "acima" dele.
  - Com tint: `room-shell`, `computer` (inclusive a tela e o LED do gabinete, como na spec), `desk-lamp`, `desk-chair`, `pc-tower`, `bed`, `phone`.
  - Sem tint: `window` (tags `dusk`/`night` já vêm pré-tingidas pelo gerador), `light-window`, `light-computer`, `light-journal`, `light-headset`, `light-phone`, `light-frames`, outline de hover.
- **Tags** (`pickTag`): `window` e `light-window` em `day`/`dusk`/`night`; `desk-lamp` `off` de dia e `on` no entardecer e à noite; `light-computer`, `light-journal`, `light-headset`, `light-phone` e `light-frames` (só têm `night`) aparecem no entardecer e à noite.
- **Frames sincronizados**: `light-computer` tem `syncFramesWith: "computer"`. Ela não anima sozinha: no `ANIMATION_UPDATE` do `computer`, copia o índice do frame (cursor piscando na tela e o brilho juntos). Com reduced-motion os dois ficam no frame 0.
- **Transição**: crossfade de 600 ms (`Sine.easeInOut`): o tint é interpolado; sprites que trocam de frame (janela, luz da janela, luminária) ganham uma cópia com o frame antigo por cima, que some; luzes que acendem/apagam fazem fade de alpha. Uma troca no meio de outra termina a anterior na hora. Com `prefers-reduced-motion`, troca instantânea.
- A troca não mexe na câmera, no hover nem no EventBus (contrato e tempos do M1/M2 iguais).
- **Forçar o período (só em dev)**: `http://localhost:5173/?period=day`, `?period=dusk` ou `?period=night`. Com o parâmetro, o horário é ignorado (inclusive na checagem de cada minuto). No build de produção o parâmetro não tem efeito. No console de dev também dá para trocar ao vivo, com transição: `__game.scene.getScene('Room').dayNight.set('night')`.

### Zoom por tela (conferido no navegador com a arte final, M2)
| Área do canvas | Zoom do quarto | Corte | Zoom do foco no computador |
|---|---|---|---|
| 1920×950 (1080p com barras do navegador) | 2 | nenhum | 3 |
| 1920×1080 (tela cheia) | 3 | 34 px (1×) no alto das paredes | 4 |
| 1536×730 (notebook 1080p a 125%) | 2 | 29 px no alto das paredes | 3 |
| 1366×768 (tela cheia) | 2 | 10 px no alto das paredes | 3 |
| 1366×650 (com barras) | 2 | 66 px no alto das paredes (o topo da vista é a linha de segurança) | 3 |
| 375×667 e 375×812 | 1 | 49 px de cada lado (pontas esquerda e direita do quarto; o computador aparece inteiro) | 2 |

O corte nunca pega um interagível: a área segura sempre cabe na altura. Em 375 px nem o zoom 1 cabe na largura (472 px); o pan do M5 alcança as pontas.

## Mapa (room.tmj)
- Isométrico 7×7, `tilewidth` 64, `tileheight` 32, **sem tilesets nem tile layers**.
- Image layer `room-shell`: `../assets/tiles/room-shell.png` em `offsetx −12`, `offsety −156` (o canto do fundo do PNG, (236, 156), sobre o vértice do tile (0,0), que no Tiled fica em (224, 0)). Assim o mapa abre no Tiled com a arte.
- Object layer `decor`: `window` (ponto em (184, 0) = col 5,75 na base da parede do fundo), `pc-tower` (retângulo (128, 0) 32×32 = tile (4,0)), `desk-chair` ((64, 64) 32×32 = tile (2,2)), `bed` ((0, 160) 128×64 = col 0–3, row 5–6, centro (2, 6)).
- Object layer `interactables`:
  - `computer`, retângulo (0, 0) 128×128 = envelope do L (tiles 0–4 × 0–4), âncora (2, 2). A pegada exata do L está em `meta.quartoPixel.footprint`;
  - `bookshelf`, ponto (88, 0) = tile (2,75, 0), na base da parede do fundo (como a `window`); sem pegada;
  - `journal`, ponto (64, 64) = tile (2, 2), o mesmo ponto do `computer` (objeto sobre móvel); sem pegada.
  - `headset` e `controller`, ponto (64, 64) = tile (2, 2), como o `journal`; sem pegada.
  - `phone`, ponto (64, 192) = tile (2, 6), o centro da `bed` (objeto sobre móvel); sem pegada.
  - `frames`, ponto (0, 88) = tile (0; 2,75), na base da parede esquerda; sem pegada.
- Os outros ids do M3 **não estão no mapa**: entram junto com os sprites (ver [novo objeto](../../guias/novo-objeto.md)).

## Decisões
- Phaser 4 + `pixelArt: true` → [ADR 0001](../0001-motor-phaser-react.md).
- Isométrico 2:1 via Tiled → [ADR 0002](../0002-isometrico-tiled.md); tile 64×32 e arte própria → [ADR 0005](../0005-arte-propria-gerada-por-codigo.md).
- Convenções de coordenadas Tiled × Phaser (origem, casca como image layer, âncora, profundidade) → [ADR 0004](../0004-coordenadas-tiled-phaser.md).
- Sem `<StrictMode>` no React: a montagem dupla em dev recriava o `Phaser.Game` e gerava erros de `AudioContext` fechado.

## Pendente / próximos marcos
- Visão de perto do computador: é DOM ([ADR 0006](../0006-visao-de-perto-no-dom.md)). A cena só faz o zoom até o `focus` e emite `object-open`; nada muda aqui.
- M3: `bookshelf`, `journal`, `phone`, `frames`, `headset` e `controller` no quarto (feitos). `portrait` e `pet` continuam no registry, sem sprite nem ponto no mapa (adiados para o M6).
- M5 (mobile): pan/pinça/roda e alvo de toque feitos (seção "M5 – gestos").
