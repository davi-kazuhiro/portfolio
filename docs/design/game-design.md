# Game design

## Fluxo de telas
```
[Loading] → [Porta do quarto] → [Quarto] ⇄ [Objeto em foco + painel]
                 │                       │
                 └── Opções: idioma, som └── HUD: idioma, som, menu acessível
```
- **Loading** (`Boot`/`Preload`): barra em pixel; carrega mapa, sprites e fonte.
- **Porta do quarto** (`Entrance`, decidido em 2026-10-31; substitui a tela "Press Start"): porta fechada vista de frente, em pixel art, com plaquinha com o nome do Davi, luz escapando por baixo e um detalhe de personalidade (adesivo ou placa "não perturbe"). Hover/foco: a maçaneta brilha e aparece a dica "Entrar". Clique, toque ou qualquer tecla: a porta abre (animação de 3–4 quadros) → a câmera "atravessa" a porta (zoom rápido ou clarão de luz; corte necessário porque a porta é frontal e o quarto é isométrico) → o quarto aparece. Idioma e som ficam no HUD, no canto, como no quarto. Esse primeiro gesto também libera o áudio do navegador (a música só começa se o som estiver ligado).
  - Recrutadores primeiro: qualquer clique ou tecla abre; animação curta (≤ 1 s); quem já visitou entra direto (lembrado em `localStorage`); o menu acessível de objetos já funciona na porta, então teclado e leitor de tela não esperam a animação; com `prefers-reduced-motion` a porta abre sem animação.
- **Quarto** (`Room`): câmera mostra o quarto inteiro. Hover/foco em um objeto → outline + tooltip com nome e o que contém.
- **Objeto em foco**: clique → câmera faz zoom no objeto (≈400 ms, ease-out) → painel temático abre. Esc / botão "Voltar" / clique fora → painel fecha → zoom-out.
- **Visão de perto (decidido em 2026-10-31, entra no M2)**: depois do zoom, o objeto aparece como se o visitante estivesse diante dele, em vez de o painel ocupar a tela inteira. Ex.: no computador vemos mesa, monitor, teclado e caneca, e o conteúdo (pastas de projetos) fica **dentro da tela do monitor**. Cada objeto ganha uma ilustração frontal em pixel art (spec do `art-director`) com um retângulo de "área de conteúdo", onde o painel React é posicionado. Os painéis (`ComputerPanel` etc.) continuam iguais, só mudam de lugar. Em telas estreitas a ilustração é recortada para focar na área de conteúdo. Substitui a pendência do M1 "painel cobre o objeto em foco".

## Estados (store `useGameStore`)
| Campo | Significado |
|---|---|
| `sceneKey` | cena Phaser ativa |
| `hoveredId` | objeto sob o mouse/foco (tooltip) |
| `openId` | objeto com painel aberto (`null` = quarto livre) |
| `muted` | som desligado (padrão `true`) |

## Eventos (EventBus)
| Evento | Origem → destino | Payload |
|---|---|---|
| `scene-ready` | Phaser → React | chave da cena |
| `object-hover` | Phaser → React | id ou `null` |
| `object-open` | Phaser → React | id (emitido **depois** do zoom terminar) |
| `panel-closed` | React → Phaser | — (dispara zoom-out) |
| `focus-object` | React → Phaser | id (menu de teclado pede o zoom; a cena responde com `object-open`) |
| `period-changed` | Phaser → React | `day`, `dusk` ou `night` (na criação do quarto e a cada minuto; a visão de perto usa o do momento da abertura) |

Fluxo único de abertura: clique no canvas **ou** `focus-object` → zoom da câmera → `object-open` → painel. Se `prefers-reduced-motion`, o zoom é instantâneo.

| `door-hover` | Phaser → React | `{ x, y }` da maçaneta em px CSS do canvas, ou `null` (dica "Entrar") |
| `entrance-enter` | React → Phaser | — (botão "Entrar"/teclado abre a porta) |
| `audio-toggle` | React → Phaser | `true` = som ligado (estado inicial: `useGameStore.muted`) |
| `ui-sfx` | React → Phaser | nome do SFX de interface (`toggle`) |

Na porta, `focus-object` (menu acessível) entra direto no quarto, sem esperar a animação, e faz o zoom no objeto pedido.

## Interação por dispositivo
| Ação | Desktop | Teclado | Mobile |
|---|---|---|---|
| Descobrir objetos | hover + outline | Tab no menu acessível | brilho pulsante periódico |
| Abrir | clique | Enter | toque |
| Fechar | Esc / botão / clique fora | Esc | botão Voltar / toque fora |
| Navegar no quarto | — | — | arrastar (pan), pinça (zoom) |

## Dia/noite
Horário local do visitante: dia (7h–17h), entardecer (17h–19h), noite (19h–7h). Muda a luz da janela, a cor ambiente e acende o abajur. Sem animação se `prefers-reduced-motion`.

## Áudio
Desligado por padrão (política de autoplay e respeito ao visitante). Música lo-fi/chiptune em loop baixo; SFX de hover, abrir e fechar. Estado lembrado em `localStorage`.

## Pet e avatar
Pet com animação idle (dormir, espreguiçar); clique mostra frases curtas (easter egg). Avatar opcional sentado à mesa, definido no M2/M4 conforme a arte.
