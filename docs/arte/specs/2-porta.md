# 2. Porta do quarto (cena `Entrance`, spec no M2, implementação no M4)

> Parte das [specs de sprites](../specs.md). Convenções de coordenadas e unidades estão lá.

### Ilustração e escala
- Cena frontal de **320×180 px** (16:9), desenhada a 1× e ampliada pelo maior inteiro `s = floor(min(vw / 320, vh / 180))`. Ex. (área útil do navegador): 1920×1080 (≈950 de altura) → 5×; 1366×768 (≈650) → 3×; tela cheia 1920×1080 → 6×.
- **Telas largas:** as laterais repetem a coluna `entrance-wall-column` (16×180: listras da parede, rodapé e piso) até encher a tela, na mesma escala.
- **Telas estreitas (retrato):** zona segura `x 104, y 0, w 112, h 180` (porta + batente + placa + luz sob a porta). A escala passa a ser `floor(min(vw / 112, vh / 180))` e o resto é cortado nas laterais. Ex.: 390×844 → 3× (336×540).
- O texto "Entrar" do hover, o HUD e o menu acessível são DOM (i18n), nunca desenhados na arte.

### Camadas e arquivos
| Arquivo | Tamanho | Posição na cena | Conteúdo |
|---|---|---|---|
| `tiles/entrance-bg.png` | 320×180 | 0, 0 | corredor: parede listrada (`wall-3`/`wall-4`, listras de 8 px, faixa clara `wall-5` à esquerda), rodapé `y 150–163` (`mauve-1`, aresta `mauve-2`, base `mauve-0`), piso de tábuas horizontais `y 164–179` (`wood-3`/`wood-4`, juntas `wood-1`), batente da porta `x 120–199, y 14–163` (laterais de 8 px, travessa de 8 px: frente `cream-2`, lado interno `cream-1`, aresta `cream-3`, sombra `cream-0`). Vão interno `x 128–191, y 22–163`. Sombra da porta no piso (1 tom `wood-1`) à direita do batente. |
| `tiles/entrance-wall-column.png` | 16×180 | repetida nas laterais | mesma parede, rodapé e piso, sem porta |
| `objects/door-interior.png` | 64×142 | 128, 22 | o que se vê pelo vão: parede do quarto iluminada (`wall-5`/`wall-4`, 2/3 de cima), piso `wood-lit`/`wood-6` (1/3 de baixo), reflexo do monitor em `sky-0` à direita, e as 2 linhas de baixo em `gold-3`, que aparecem como **luz sob a porta** pela fresta de 2 px |
| `objects/door.png` | frames 64×142 | 128, 22 | a folha da porta (abaixo) |
| `objects/door-light.png` | 80×10 | 120, 164 | luz que escapa para o piso do corredor |
| `objects/door-knob-glow.png` | 12×12 | 177, 91 | brilho da maçaneta no hover |

Ordem de desenho: `entrance-bg` → `door-interior` → `door` → `door-light` → `door-knob-glow`.

**Arquivos gerados (2026-11-01, `node tools/art/build.mjs`).** Todos em JSON Hash do Aseprite, âncora `(0, 0)`, e `meta.quartoPixel.at` com a posição na cena em px da ilustração:

| Arquivo | Frame | Tags (frames) | `meta.quartoPixel` |
|---|---|---|---|
| `public/assets/tiles/entrance-bg.png/.json` | 320×180 | `day` (0), `night` (1, pré-tingido) | `at [0,0]`, `safeZone [104,0,112,180]`, `preTinted ["night"]` |
| `public/assets/tiles/entrance-wall-column.png/.json` | 16×180 | `day` (0), `night` (1, pré-tingido) | `repeat "x"` (emenda sem costura com o `entrance-bg`, que é periódico em 16 px) |
| `public/assets/objects/door-interior.png/.json` | 64×142 | `day` (0), `night` (1) | `at [128,22]` |
| `public/assets/objects/door.png/.json` | 64×142 | `closed` (0), `open` (1–4: 70, 70, 80, 120 ms), `closed-night` (5), `open-night` (6–9) | `at [128,22]`, `preTinted ["closed-night","open-night"]` |
| `public/assets/objects/door-light.png/.json` | 80×10 | `day` (0), `night` (1) | `at [120,164]` |
| `public/assets/objects/door-knob-glow.png/.json` | 12×12 | `hover` (0–1, 300 ms) | `at [177,91]` |

Ajustes de desenho (não mudam o contrato): o `entrance-bg` não tem a faixa clara `wall-5` à esquerda, porque ela quebraria a emenda com a coluna repetida; o reflexo do monitor no `door-interior` é uma faixa vertical `sky-1`/`sky-0` na borda direita (a oval parecia um ovo na parede); o `door-knob-glow` ganhou 4 faíscas de 1 px em volta do anel; nos frames de abertura a folha é a fechada comprimida em perspectiva, então a placa e o adesivo encolhem junto, em vez de virar uma faixa de 2 px. Prévias: `art-src/previews/door.png` e `door-night.png` (fechada, hover, abrindo 1–4).

### Folha da porta (`door`, frame `closed`)
Coordenadas dentro do frame de 64×142:
- **Folha:** `x 0–63, y 0–139` (64×140, proporção ≈1:2,2). As linhas `y 140–141` ficam **transparentes**: é a fresta por onde aparece a luz do `door-interior`.
- **Madeira** (mesma família da mesa): base `wood-5`, veio vertical por ruído em `wood-4`, terço de baixo um tom abaixo (`wood-4`), borda esquerda (dobradiças) com 1 px `wood-6`, borda direita `wood-3`, contorno `outline`.
- **Almofadas em relevo:** superior `x 8–55, y 10–62`; inferior `x 8–55, y 84–130`. Face `wood-5`, arestas de cima e da esquerda `wood-6` (luz vinda de cima e da esquerda), de baixo e da direita `wood-2`.
- **Dobradiças:** 2×8 px `gold-0` em `x 0–1`, `y 16–23` e `y 112–119`.
- **Maçaneta:** 6×6 em `x 52–57, y 72–77` (≈1 m do chão): `gold-1`, brilho de 2 px `gold-3` em cima à esquerda, sombra `gold-0` embaixo à direita, contorno.
- **Plaquinha com o nome:** 32×12 em `x 16–47, y 34–45`, dentro da almofada superior. Fundo `cream-3`, borda de 1 px `gold-0`, aresta de cima `gold-1`, 4 parafusos de 1 px `gold-0`. Texto **"DAVI"** em letras de pixel 5×7 com 1 px de espaço (23 px de largura), centralizado, em `graphite-1`. É um nome próprio, então não precisa de tradução.
- **Detalhe de personalidade:** adesivo **"</>"** de 20×12 em `x 22–41, y 96–107`, na almofada inferior: retângulo de cantos arredondados `graphite-1`, borda branca de adesivo `cream-3`, glifo em `sky-0`. Sem texto, para não precisar de PT/EN. A placa "não perturbe" foi descartada por ter texto; se o Davi quiser algo pendurado, a alternativa é uma plaquinha só com ícone (lua e "z z").

### Abertura (tag `open`, a porta abre para dentro, dobradiças à esquerda)
A borda livre se afasta do visitante: a folha estreita, a borda direita encurta em altura e aparece a espessura da porta (2 px `wood-1`). O vão revelado mostra o `door-interior`.

| Frame | Largura da folha | Borda livre (y) | Detalhes | Duração |
|---|---|---|---|---|
| `closed` (0) | 64 | 0–139 | como acima | — |
| `open` 1 (≈20°) | 50 (`x 0–49`) | 1–138 | almofadas e placa comprimidas na horizontal; maçaneta 5×5 | 70 ms |
| `open` 2 (≈50°) | 30 | 3–136 | almofadas viram 2 retângulos estreitos; placa vira faixa `cream-3` de 2 px; maçaneta 4×4 | 70 ms |
| `open` 3 (≈80°) | 12 | 5–134 | só a borda com 1 linha de almofada; sem maçaneta | 80 ms |
| `open` 4 (aberta) | 3 | 6–133 | só a espessura junto às dobradiças; o vão inteiro mostra a luz | 120 ms |

Total ≈ 340 ms. O "atravessar" (clarão `cream-3` ou zoom rápido) é feito por código depois do frame 4, dentro do limite de 1 s. Com `prefers-reduced-motion`: corte direto de `closed` para o quarto.

### Hover / foco (`door-knob-glow`)
- 12×12 centralizado na maçaneta. Tag `hover`, 2 frames × 300 ms: núcleo 4×4 `gold-3` + anel de 1 px `gold-2` (frame 0) e o mesmo com mais 2 px de reflexo `cream-3` no canto superior esquerdo (frame 1).
- A dica "Entrar" é DOM (i18n), posicionada perto da maçaneta.

### Luz sob a porta (`door-light`)
- **Dia** (tag `day`): linha `y 0` em `gold-3` de `x 8–71` (largura da folha); linha `y 1` em `wood-6` de `x 6–73`; linhas `y 2–3` em `wood-lit` de `x 4–75`. O resto do sprite fica transparente.
- **Noite** (tag `night`): mais alto e mais forte. `y 0–1` em `gold-3`, com 16 px centrais em `sky-2` (a tela do computador ligada lá dentro); `y 2–3` `wood-6`; `y 4–7` `wood-lit`, alargando 2 px por linha. Desenhado sem tint.

### Variante noturna
- `entrance-bg` ganha a tag `night` e `door` ganha `closed-night` e `open-night`, **pré-renderizadas** pelo gerador com cor × `tint-night`.
- `door-interior` na noite: parede `wall-4` com poça `gold-3` da luminária à esquerda e `sky-0` mais forte à direita. Fica sem tint (é a luz do quarto).
- A plaquinha recebe 1 px de reflexo `gold-3` vindo de baixo, da luz da fresta.
