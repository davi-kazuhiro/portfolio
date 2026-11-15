# 10. Tapete (M6) — aprovado (A, kilim) e integrado em 2026-11-14

> Parte das [specs de sprites](../specs.md). Convenções de coordenadas e unidades estão lá.

> **Aprovado pelo Davi em 2026-11-14:** variação **A** (kilim retangular). A **B** (oval felpudo) foi descartada e saiu do gerador; as prévias dela ficam como histórico em `art-src/previews/rug-b*.png`.
>
> - Gerador: `tools/art/scenes/rug.mjs` (`renderRug()`, `rugLightAt()`). O `renderRoomShell()` assa o tapete logo depois do piso; o `renderLightWindow()` usa `rugLightAt()` sobre ele.
> - Exportação: `pnpm art` regera `tiles/room-shell.png` e `objects/light-window.png` (tamanho e âncora iguais: 472×386). `node tools/art/build-og.mjs` regera `public/og-image.png`.
> - Prévias: `art-src/previews/room-m2.png`, `room-m2-dusk.png`, `room-m2-night.png` (iguais às da proposta, `rug-a*.png`).

## Onde fica
Decoração, **sem sprite próprio**: é assado no `tiles/room-shell.png`, logo depois do piso e antes das sombras de parede e da cama (planta: (2,3), 3×2 tiles = x 16–40, y 24–40). Fica no meio do quarto, entre a mesa e a cama. Por ser `room-shell`, recebe o tint MULTIPLY de entardecer e noite em tempo de execução, como o piso. Não há frames pré-tingidos.

## Desenho

| | Kilim |
|---|---|
| Forma | caixa `[17, 39, 25, 39.5, 0, 1]`: 1 u de recuo do tile, 2 px de borda (1 visível + contorno) |
| Topo | campo `cream-2`; barra de 1,6 u em `blue-1` com "dentes" `blue-0` na beira de dentro; filete `gold-1`; 3 × 2 losangos soltos (anel `cream-1`, miolo `blue-0`) |
| Frente (+y) / lado (+x) | `blue-0` / `teal-1` |
| Filete de luz | `sky-1` nas bordas +x e +y do topo (como a aresta da coberta) |
| Conversa com | coberta da cama (rampa azul) e cortina/manta (mostarda) |

## Luz e sombra
- **Cama:** fica na frente (y > 40) e cobre o canto esquerdo do tapete no próprio sprite dela. A sombra de contato dela vai para +x/+y, longe do tapete, e não cai em cima dele.
- **Cadeira:** a sombra de contato (`SHADOWS`, regra 6) cai na beira de trás. Ali o tecido usa o tom mais escuro do material (`cream-* → cream-0`, `blue-* → teal-1`, `gold-1 → gold-0`, `gold-0 → wood-3`). A cadeira em si é sprite e fica por cima.
- **Sol da janela (`light-window`):** de dia pega só a ponta de trás do tapete (≈84 px). No entardecer a mancha cruza o tapete inteiro (≈2.000 px). Sobre o tapete, a mancha usa o tecido **um tom acima** (`cream-2 → cream-3`, `blue-1 → sky-1`, `gold-1 → gold-3`…), não a madeira iluminada. À noite o luar (y < 22) não alcança o tapete.
- Só cores da paleta, alfa 0/255, contorno `outline` de 1 px por dentro da silhueta.

## Integração (feita em 2026-11-14)
O tapete não é objeto do Tiled nem do registry: só `room-shell` e `light-window` mudaram em `public/assets/`, sem mudança de código nem de mapa.
