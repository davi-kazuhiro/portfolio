# Imagem de compartilhamento e ícones (M5)

> Parte das [specs de sprites](specs.md). Arte própria gerada por código (ADR 0005).

## Arquivos
| Arquivo | Tamanho | Conteúdo |
|---|---|---|
| `public/og-image.png` | 1200×630 (≈28 KB) | Quarto completo no **entardecer** (luminária e monitor acesos), a 1× (472×386, o maior inteiro que cabe: a 2× teria ≈770 px de altura), à direita, centralizado na vertical, sobre `UI_BG` (`#1b1526`). À esquerda, "DAVI" / "NATUME" em `cream-3`, fonte 5×7 a 12× (60×84 px por letra), e "PORTFOLIO" em `gold-2` a 6×. |
| `public/apple-touch-icon.png` | 180×180 | Recorte 90×90 centrado no monitor (dia), a 2×. |
| `public/icon-192.png` | 192×192 | Recorte 96×96 centrado no monitor (dia), a 2×. |
| `public/icon-512.png` | 512×512 | Recorte 128×128 centrado no monitor (dia), a 4×. |
| `public/favicon.svg` | 8×8 | Mantido: já é um monitor (moldura `gold-2`, tela `sky-0`), coerente com os ícones. |

Todos são PNG RGB opacos (sem alfa). Texto alternativo aprovado da `og-image`: "Quarto em pixel art isométrico com computador, prateleira, caderno e celular, cada um abrindo uma parte do portfolio." O único texto na imagem é o nome e "PORTFOLIO" (igual em PT e EN).

O entardecer ganhou do dia em miniatura: o tom quente separa melhor o quarto do fundo escuro e as luzes acesas dão o clima. A versão de dia fica em `art-src/previews/og-day.png` (gerada com `--period=day`).

## Como regerar
```
node tools/art/build.mjs      # só se a arte do quarto mudou (exporta os sprites em public/assets/)
node tools/art/build-og.mjs   # og-image + ícones; --period=day|dusk|night para testar outro período
```
O `build-og.mjs` monta o quarto a partir dos mesmos PNG/JSON que o jogo carrega (ponto do Tiled − âncora, tag do período pelas regras de `src/game/systems/period.ts`, tint MULTIPLY fora das luzes, como no `DayNight.ts`). Se a ordem de profundidade ou as regras de período mudarem no jogo, atualize a lista `ORDER` e o `pickTag` do script. Ele falha se a `og-image` passar de 300 KB ou se o nome encostar no quarto, e grava a prévia em miniatura (300 px) em `art-src/previews/og-thumb.png`.

As letras novas (N, T, U, M, E, P, O, R, F, L) estendem a `FONT_5x7` dentro do próprio script, sem alterar `flat.mjs`.
