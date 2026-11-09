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
  scenes/              # Boot → Preload → Room (Entrance, a porta do quarto, no M4)
  systems/
    RoomMap.ts         # lê o .tmj: image layer room-shell, object layers interactables e decor
    FocusCamera.ts     # câmera: visão do quarto, zoom de foco, resize
    cameraMath.ts      # contas puras de zoom/enquadramento (roomView, snapCenter...) testáveis sem Phaser
    outline.ts         # máscara de opacidade de um grupo de frames + textura do outline de 1 px
    period.ts          # regras puras: período pelo horário, ?period=, tag de cada sprite por período
    DayNight.ts        # cria os sprites do quarto e troca o período (tint, tags, crossfade, frames sincronizados)
    motion.ts          # prefers-reduced-motion
public/maps/room.tmj   # mapa isométrico do Tiled (7×7, tile 64×32), sem tile layers
public/assets/         # arte gerada por tools/art (art-director): tiles/room-shell, objects/*
```

## Estado atual (M2 + prateleira e caderno do M3)
- **Boot** só inicia o Preload.
- **Preload** desenha a barra de progresso em blocos inteiros e carrega `maps/room.tmj` + cada sprite de `ROOM_SPRITES` com `load.aseprite` (PNG + JSON Hash). No `create`, o que não carregou vira **stand-in** (`objects/standins.ts`): caixas isométricas das specs, com o mesmo canvas, pivot, frames `"<chave> <n>"` e `meta.quartoPixel` do arquivo real. Em dev, o console lista os stand-ins usados. Com toda a arte presente (situação atual), nada disso roda.
- **Contrato da arte lido pela cena** (bíblia, "Arquivos, nomes e âncoras"):
  - origem do sprite = `pivot` do frame (o Phaser aplica sozinho; px inteiro);
  - `layerOf: "<chave>"` = camada de outro sprite (mesmo canvas e âncora); `light: true` = fonte de luz, fica fora do tint; `syncFramesWith: "<chave>"` = acompanha o frame do principal; `hit: "none"` = não entra no hover/clique do principal;
  - `meta.quartoPixel.mount` (`floor`, `wall-back`, `wall-left`, `surface`) define a faixa de profundidade; com `surface` (objeto sobre móvel), `surfaceOf: "<chave>"` e `depthOffset` (padrão 0,01) dão a profundidade = a do móvel + `depthOffset`; `focus` (`[x, y, w, h]` em px do canvas) é o enquadramento do zoom; `minHit` amplia o alvo de clique;
  - `meta.frameTags`: as animações são criadas **no próprio sprite** (`spriteMeta.createLocalAnims`), porque as chaves `"<id> <n>"` não funcionam com `anims.createFromAseprite` (ele procura frames `"0"`, `"1"`…) e tags iguais (`idle`) em arquivos diferentes colidiriam no gerenciador global.
- **Room**:
  - **casca**: o image layer `room-shell` do .tmj diz qual imagem é a casca; o sprite vai com o pivot (canto do fundo, no chão) na origem do mundo. Se o PNG não tiver pivot, vale a posição do image layer (em dev, divergência entre os dois gera aviso). `light-window` é camada da casca (profundidade 1);
  - **decoração** (`decor`): ponto/retângulo cujo nome é o arquivo do sprite (`window`, `pc-tower`, `desk-chair`). Não é interativa (o clique atravessa);
  - **interagíveis** (`interactables`): retângulo da pegada + `id`. Só ficam clicáveis se a textura do `id` existir; um id sem sprite fica fora do canvas e o menu de teclado abre o painel sem zoom;
  - **âncora** = centro do retângulo do Tiled, no chão (`tileRectCenter` → `isoToScreen`);
  - **profundidade** (planta, "Leitura e oclusão"): casca 0 < camadas da casca (`light-window`) 1 < parede 5 < chão `10 + col + row` da âncora; objeto sobre móvel (`mount: "surface"`) = profundidade do móvel + `depthOffset` (o `journal` = 14,01; a cena põe os interagíveis `surface` depois dos outros, para o móvel já existir; móvel ausente → aviso e profundidade de chão); camadas (sprites com `layerOf`, na ordem de `ROOM_SPRITES`: `desk-lamp` e `light-computer` sobre o `computer`, `light-journal` sobre o `journal`) = principal + 0,01 × posição; outline = **camada mais alta do objeto (inclusive luz) + 0,005**, para o anel não sumir sob a luz à noite (`computer__outline` e `journal__outline` = 14,025);
  - **hover**: outline de 1 px `gold-2` + 1 px `outline` (#2a1b2a) em volta dele (anel duplo, `PALETTE.outline`; textura com 2 px de folga, posta em (x−2, y−2)). O anel escuro foi pedido pelo QA no M3: só o dourado ficava com contraste ≈1,4:1 sobre o tampo claro e a poça da luminária à noite e quase sumia; agora vale para todos os interagíveis, de dia e à noite. O dourado continua por fora da união do sprite com as camadas sólidas (camadas que não são luz nem `hit: "none"`; a `desk-lamp` final tem `hit: "none"` porque a luminária já está desenhada no `computer`) + `object-hover` (id / `null`). O outline não recebe tint: continua dourado à noite;
  - **prateleira** (`bookshelf`, M3): objeto de parede (`wall-back`, profundidade 5), acima do monitor na tela. As silhuetas da prateleira e do `computer` não se tocam (0 px em comum, conferido no navegador; o gerador deixa 6 px de folga) e o `minHit` 24×24 não amplia nada (a silhueta já é maior). Clique por alpha: livros/tábua abrem `bookshelf`, o monitor abre `computer`. Onde as caixas se sobrepõem, o `computer` (profundidade 14) está por cima, mas o hit por alpha deixa o clique atravessar o transparente. Tint normal da noite (sem frame pré-tingido); a sombra da tábua está assada no room-shell, fora do hover;
  - **caderno** (`journal`, M3): `mount: "surface"`, `surfaceOf: "computer"`, no ponto (2, 2) do Tiled, âncora (90, 57) fora do frame 60×36 (pivot 1,5 / 1,583), profundidade 14,01 (acima da mesa, abaixo da cadeira e do gabinete, 15). A silhueta (56×32 px) já é maior que o `minHit` 24×24, então o alvo não cresce e não alcança teclado nem controle. Conferido no navegador: caderno → `journal`; luminária, controle, frente do braço B e monitor → `computer`; o anel do `computer` não tem nenhum pixel sobre o caderno. `light-journal` (luz, `hit: "none"`) segue a regra das `light-*`: só no entardecer e à noite, fora do tint. Zoom pelo `focus` `[2, 2, 56, 32]`;
  - **clique**: hit test pela mesma silhueta (máscara gerada uma vez, no frame inicial) mais o `minHit` centrado; `input.topOnly = true`, então quem está por cima ganha (o `journal` sobre o `computer`). Clique = pointerup com até 8 px de arrasto, ou `focus-object` → zoom → `object-open`;
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
  - Com tint: `room-shell`, `computer` (inclusive a tela e o LED do gabinete, como na spec), `desk-lamp`, `desk-chair`, `pc-tower`.
  - Sem tint: `window` (tags `dusk`/`night` já vêm pré-tingidas pelo gerador), `light-window`, `light-computer`, `light-journal`, outline de hover.
- **Tags** (`pickTag`): `window` e `light-window` em `day`/`dusk`/`night`; `desk-lamp` `off` de dia e `on` no entardecer e à noite; `light-computer` e `light-journal` (só têm `night`) aparecem no entardecer e à noite.
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

O corte nunca pega um interagível: a área segura sempre cabe na altura. Em 375 px nem o zoom 1 cabe na largura (472 px); pan/pinça é do M5.

## Mapa (room.tmj)
- Isométrico 7×7, `tilewidth` 64, `tileheight` 32, **sem tilesets nem tile layers**.
- Image layer `room-shell`: `../assets/tiles/room-shell.png` em `offsetx −12`, `offsety −156` (o canto do fundo do PNG, (236, 156), sobre o vértice do tile (0,0), que no Tiled fica em (224, 0)). Assim o mapa abre no Tiled com a arte.
- Object layer `decor`: `window` (ponto em (184, 0) = col 5,75 na base da parede do fundo), `pc-tower` (retângulo (128, 0) 32×32 = tile (4,0)), `desk-chair` ((64, 64) 32×32 = tile (2,2)).
- Object layer `interactables`:
  - `computer`, retângulo (0, 0) 128×128 = envelope do L (tiles 0–4 × 0–4), âncora (2, 2). A pegada exata do L está em `meta.quartoPixel.footprint`;
  - `bookshelf`, ponto (88, 0) = tile (2,75, 0), na base da parede do fundo (como a `window`); sem pegada;
  - `journal`, ponto (64, 64) = tile (2, 2), o mesmo ponto do `computer` (objeto sobre móvel); sem pegada.
- Os outros ids do M3 **não estão no mapa**: entram junto com os sprites (ver [novo objeto](../../guias/novo-objeto.md)).

## Decisões
- Phaser 4 + `pixelArt: true` → [ADR 0001](../0001-motor-phaser-react.md).
- Isométrico 2:1 via Tiled → [ADR 0002](../0002-isometrico-tiled.md); tile 64×32 e arte própria → [ADR 0005](../0005-arte-propria-gerada-por-codigo.md).
- Convenções de coordenadas Tiled × Phaser (origem, casca como image layer, âncora, profundidade) → [ADR 0004](../0004-coordenadas-tiled-phaser.md).
- Sem `<StrictMode>` no React: a montagem dupla em dev recriava o `Phaser.Game` e gerava erros de `AudioContext` fechado.

## Pendente / próximos marcos
- Visão de perto do computador: é DOM ([ADR 0006](../0006-visao-de-perto-no-dom.md)). A cena só faz o zoom até o `focus` e emite `object-open`; nada muda aqui.
- M3: `bookshelf` e `journal` no quarto (feitos); colocar os outros 5 objetos no `interactables` (com sprite).
- M5 (mobile): pan/pinça e destaque pulsante nos interagíveis.
