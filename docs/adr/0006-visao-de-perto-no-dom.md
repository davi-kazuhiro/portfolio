# ADR 0006 — Visão de perto renderizada no DOM

- **Status:** aceito (2026-11-01)

## Contexto
Depois do zoom da câmera, cada objeto mostra uma ilustração frontal em pixel art ("visão de perto", ver [game design](../design/game-design.md)) com o painel React dentro de uma área de conteúdo (no computador, a tela do monitor). Dava para desenhar essa ilustração no canvas do Phaser (uma cena ou camada a mais) ou no DOM, junto do painel.

## Decisão
- A ilustração é uma imagem pré-renderizada (`tools/art`, specs em [docs/arte/specs.md](../arte/specs.md) §3) mostrada pelo React como `<img>` em **escala inteira**, com `image-rendering: pixelated`.
- O painel (`ComputerPanel` etc.) é posicionado de forma absoluta sobre o retângulo de conteúdo definido no JSON/spec da ilustração, na mesma escala.
- O Phaser continua dono do quarto e do zoom; o fluxo de eventos não muda: zoom → `object-open` → React mostra a visão de perto → fechar → `panel-closed` → zoom-out.
- Telas estreitas usam os modos da spec (cena inteira, recorte do monitor ou moldura 9-slice).

## Consequências
- Painel e ilustração ficam no mesmo sistema de layout: foco, leitor de tela, rolagem e i18n continuam no DOM, sem sincronizar coordenadas entre canvas e HTML.
- A ilustração não reage à luz do canvas; dia/noite vêm como variantes pré-renderizadas da imagem.
- Cada objeto do M3 que tiver visão de perto precisa de uma ilustração + retângulo de conteúdo.

## Revisão (2026-11-08): visão de perto em tela cheia ("cover")
Pedido do Davi: a visão de perto cobre a janela inteira, sem as faixas escuras em volta e sem moldura com margem.

- **Regra** (`pickCloseupLayout`, `src/ui/closeup/layout.ts`, pura e testada): para cada escala inteira `s ≥ minScale` em que a área de conteúdo cabe na janela abaixo da faixa do HUD (64 px), a arte é centralizada e presa para (1) cobrir a janela e (2) manter o conteúdo inteiro visível em `[0, vw] × [64, vh]`. O que a arte não alcança é **sangria**. Escolhe a escala com menor sangria lateral, depois menor sangria vertical (até 8 px de arte contam como cobertura), e no empate a menor escala (mais contexto). Sangria acima de `maxBleed` px de arte por lado (computador 32, prateleira 48) → modo `fallback`.
- **Sangria** (`bleedStrips`, `src/ui/closeup/bleed.ts`): a linha/coluna da borda da arte é esticada até a borda da janela (divs com o PNG de fundo, escala inteira no eixo da borda, `image-rendering: pixelated`). `bleedInset` escolhe a linha amostrada (pula o contorno da cortina). Nada de borrão nem escala fracionária.
- **Fallback** (celular, tablet em retrato): o painel ocupa 100% da janela, sem margem. Computador: moldura 9-slice até a borda; prateleira: modo texto. Com o HUD visível (≥ 768 px) o conteúdo começa abaixo dos 64 px e o fundo do painel continua por baixo dos botões.
- Os modos A/B/C da spec (§3) viram `cover`/`fallback`; o recorte do monitor (B) não é mais usado: o recorte sai da própria regra.
- **Sangria real (2026-11-08, mesmo dia):** a arte passou a vir com sangria desenhada (`meta.quartoPixel.bleed`, hoje 80/64/80/64; specs.md §3 "Tela cheia"). A arte disponível é a ilustração expandida pela sangria (célula 480×308) e a ilustração 320×180 fica o mais centralizada possível. Regra de escolha revista: a **menor escala inteira ≥ 3 que cobre a janela só com arte** e mantém o conteúdo abaixo do HUD (mais contexto: mesa, prateleira inteira); só se nenhuma cobrir, vale a sangria sintética (`maxBleed` contado da borda da arte real). O `bleedInset` saiu (a borda da sangria real não tem contorno). Sem `bleed` no JSON, a regra anterior continua valendo.
