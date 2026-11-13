# Planta do quarto

Mantida pelo agente `art-director`. Grid, paleta e regras de desenho: [biblia-de-arte.md](biblia-de-arte.md). Specs dos sprites: [specs.md](specs.md).

Revisão de 2026-11-01, depois de o Davi ver o bloco de teste do 7×7. Mudanças pedidas:
1. paredes mais altas;
2. a estante virou uma **prateleira na parede, acima do monitor** (continua sendo o interagível `bookshelf`);
3. a janela foi para a **parede do fundo à direita**;
4. a mesa virou uma **mesa em L** no canto das duas paredes;
5. sem criado-mudo;
6. o caderno fica **deitado na parte esquerda da mesa**.

Segunda rodada (2026-11-01, depois do bloco v2): gabinete mais fino; pet no canto direito do quarto (6,0); sem os dois vasos de planta; mesa menor (braço B mais curto, com um vão visível antes da cama); controle de videogame sobre a mesa, como decoração. Terceira rodada: a luminária foi para o fundo do braço B, encostada na parede esquerda, ao lado do caderno.

## Tamanho: 7×7 tiles (64×32), paredes de 144 px
**Recomendação: continua 7×7.**

- **Por que não 6×6.** No grid oficial (losango de 64×32 = 8 unidades do gerador), a mesa do teste já mede ≈4×2 tiles, e o quarto do teste (6,5×5 tiles) fica cheio só com mesa, cadeira, gabinete e janela. Em 6×6 não cabem a mesa em L, a cama, a caminha do pet e os 8 interagíveis sem esconder uns aos outros.
- **Paredes:** sobem de 116 para **144 px** (72 unidades), +24%. Isso dá espaço para a prateleira acima do monitor (84–106 px) e para os quadros (até 112 px) sem encostar no topo.
- **Tamanho a 1×:** ≈ **472×386 px** com as paredes (antes 472×358). A 2×: **944×772**.

| Tela (área útil aproximada) | Zoom inteiro | Observação |
|---|---|---|
| 1920×1080 (≈1920×950) | **2×** (944×772) | cabe inteiro, com folga para o HUD |
| 1536×864, notebook 1080p a 125% (≈1536×730) | 2× com recorte de ~21 px (1×) no alto das paredes | só some a ponta da parede junto ao canto do fundo |
| 1366×768 (≈1366×650) | 2× com recorte de até 61 px (1×), ou 1× | conferido: o topo mais alto de um interagível (quadros e prateleira, a −82 px do canto do fundo no chão) fica 13 px abaixo da linha de corte (−95) |
| celular | 1× + pan/pinça (M5) | já previsto no roadmap |

Regra que garante o recorte: **nenhum interagível com topo acima de 112 px de altura**, e nada interagível no alto da parede a menos de 1,5 tile do canto do fundo.

## Sistema de coordenadas
- `(col, row)` = canto do footprint mais próximo do canto do fundo. A origem `(0,0)` é o canto do fundo do quarto, no chão.
- **col** corre ao longo da **parede do fundo à direita** (agora a parede da **janela** e do monitor); **row** corre ao longo da **parede esquerda** (quadros, cama).
- A parede do fundo à direita é a borda `row = 0`; a parede esquerda é a borda `col = 0`. As bordas `col = 7` e `row = 7` são abertas (paredes da frente removidas). A porta do quarto fica numa parede da frente e não aparece; ela só existe na cena `Entrance`.
- Âncora = centro do retângulo que envolve o footprint, no chão (objetos de chão), ou base da parede sob o centro (objetos de parede).

## Planta (vista de cima)
```
   parede        col →   0     1     2     3     4     5     6
   esquerda           ┌─ parede do fundo (direita): prateleira cols 1,1–3,75 · janela cols 5,0–6,5 ─
                row 0 │ MESA  MESA  MESA  MESA  GAB    .    PET
   quadros      row 1 │ MESA  MESA  MESA  MESA   .     .     .        sol da janela:
   quadros      row 2 │ MESA  MESA  CAD    .     .     .     .        rows 0–3,
                row 3 │ MESA  MESA  TAP   TAP   TAP    .     .        cols ≈4–7,
                row 4 │  .     .    TAP   TAP   TAP    .     .        inclinado p/ o centro
   retrato      row 5 │ CAMA  CAMA  CAMA  CAMA   .     .     .
   retrato      row 6 │ CAMA  CAMA  CAMA  CAMA   .     .     .
                                           (frente aberta)
 MESA mesa em L (computador; caderno no braço esquerdo, rows 2–3) · GAB gabinete · CAD cadeira
 TAP tapete · PET caminha + pet (canto direito) · row 4 nas cols 0–1: vão entre a mesa e a cama
```

## A mesa em L
Um único sprite `computer` com dois braços, encostado nas duas paredes:
- **Braço A** (parede do fundo): cols 0–3, row 0 até 1,75 (caixa `[0, 32, 0, 14]` em unidades). Tem monitor, teclado e mouse. O monitor fica de frente para o visitante (face +y), como no teste aprovado: é o que mais aparece no quarto.
- **Braço B** (parede esquerda): cols 0–1,75, rows 1,75–3,75 (caixa `[0, 14, 14, 30]`). Tem o **caderno**, deitado, e a **luminária**, no fundo do braço, encostada na parede esquerda, entre o caderno e a ponta do braço. Termina 10 u (1,25 tile) antes da cama, e esse vão aparece na tela.
- **Canto** (cols 0–1, rows 0–1): caneca no fundo do canto e **controle de videogame** deitado na frente dela (decoração, parte do sprite `computer`, não interagível). Sem vasos de planta.
- A cadeira fica no canto interno do L, de frente para o monitor.
- O gabinete, mais fino (5×8 u em vez de 7×9), vai para o chão logo à direita do braço A, sob a cortina esquerda: 40 px de altura contra a cortina, que começa a 46 px, sem colisão. Entre o gabinete e o pet fica ≈1,4 tile de chão livre ao sol.

## Tabela de objetos
Footprint = `(col, row)` + tamanho em cols×rows. Alturas em px acima do chão.

| Objeto | Arquivo / `id` | Tipo | Posição e footprint | Montagem | Altura | Marco |
|---|---|---|---|---|---|---|
| Casca do quarto (piso, paredes, rodapé, oclusão, sombras de contato) | `room-shell` | base | 7×7 + paredes de 144 | — | 144 | **M2** |
| Janela com cortinas | `window` | decoração / luz | parede do fundo: vidro e moldura cols 5,0–6,5; cortinas cols 4,6–6,9 | `wall-back` | peitoril 48, vidro 52–116, cortinas 46–120 | **M2** |
| Sol da janela / luar | `light-window` | luz | piso rows 0–3,25, cols ≈4–7 (inclinado para o centro; pega a caminha do pet), mais brilho `wall-5` em volta da moldura | camada do `room-shell` | — | **M2** |
| Computador: mesa em L + monitor + teclado + mouse + caneca (controle e headset viram interagíveis próprios, aprovado em 2026-11-10) | `computer` | **interagível** | braço A (0,0) 4×2 + braço B (0,2) 2×2 | chão, canto do fundo | monitor 72 | **M2** |
| Headset (sem fio, deitado) | `headset` | **interagível** | braço A, atrás do mouse, ao lado do gabinete: centro ≈ (3,7; 0,75) | sobre móvel (`computer`) | +2 sobre o tampo | M3 ([§8](specs/8-headset.md)) |
| Controle de videogame | `controller` | **interagível** | canto do braço A, na frente da caneca: centro ≈ (0,8; 1,15) | sobre móvel (`computer`) | +2 sobre o tampo | M3 ([§9](specs/9-controle.md)) |
| Luminária de mesa | `desk-lamp` | decoração / luz | fundo do braço B, encostada na parede esquerda, base em (0,25; 3,5) | camada do `computer` | 55 | **M2** |
| Gabinete (fino) | `pc-tower` | decoração | (4,0), 1×1 (desenho 5×8 u) | chão, sob a cortina esquerda | 40 | **M2** |
| Cadeira | `desk-chair` | decoração | (2,2), 1×1; desenho com centro em (2,4; 2,5), de frente para o monitor | chão | encosto 54 | **M2** |
| Prateleira com livros | `bookshelf` | **interagível** | parede do fundo, cols 1,1–3,75, centrada sobre o monitor | `wall-back` | tábua 84–87, livros até 106 | M3 |
| Caderno | `journal` | **interagível** | deitado no braço B da mesa, centro em (0,9; 2,8) | sobre móvel (`computer`) | +2 sobre o tampo (34) | M3 |
| Quadros (certificados): galeria de 5 molduras + luminária de quadro | `frames` (+ `light-frames`) | **interagível** | parede esquerda, rows 1,69–3,81 (acima do braço B); ponto do Tiled **(0; 2,75)** | `wall-left` | 78–112 | M3 (exportado em 2026-11-09) |
| Retrato (família) | `portrait` | **interagível** | parede esquerda, rows 5,4–6,6, acima da cabeceira | `wall-left` | 70–100 | M3 |
| Cama | `bed` | decoração | (0,5), 4×2, cabeceira na parede esquerda | chão | colchão 20, cabeceira 36 | M3 |
| Celular | `phone` | **interagível** | sobre a cama, centro em (1,8; 5,8) | sobre móvel (`bed`) | +1 | M3 |
| Tapete | parte do `room-shell` | decoração | (2,3), 3×2 | piso | 0 | M3 |
| Caminha do pet + pet | `pet-bed`, `pet` | decoração + **interagível** | **(6,0), 1×1, canto direito do quarto**, sob a cortina direita e na beira do sol | chão | ≈20 | M3 (animações no M4) |

Saíram: estante de chão (virou a prateleira), criado-mudo, vaso da mesa, planta de chão e, em 2026-11-09, o **diploma** (a formação virou a última página dupla do caderno, `type` = `education`; ver [specs §5](specs/5-caderno.md)). O trecho da parede esquerda em **rows 3,1–3,9** que ele liberou foi ocupado pelos **quadros** (variação A, aprovada em 2026-11-09), que agora usam a faixa inteira, rows 1,69–3,81. A "luz que acende à noite" continua sendo a luminária de mesa.

## Áreas de clique que dividem espaço
- **Na mesa: `computer` e `journal`.**
  - O caderno é um sprite próprio, desenhado por cima do `computer` (profundidade da mesa + 0,01). Com `topOnly`, o clique sobre ele vai para o `journal`, e o resto da mesa continua abrindo o computador.
  - O caderno fica no braço B, a ≈100 px (1×) do teclado na tela e a ≈40 px do controle, e tem alvo mínimo de 24×24 px (`minHit`).
  - O zoom do `computer` mira o retângulo de foco do braço A (monitor + teclado + gabinete, ver [specs](specs.md)), não o L inteiro. Assim o caderno não entra no enquadramento como se fosse parte do computador.
- **Prateleira × monitor:** a tábua começa a 84 px de altura e o topo do monitor está a 72 px. A folga é de 12 px a 1× (24 px a 2×), e os dois outlines de hover não se tocam. A prateleira é objeto de parede, desenhado atrás da mesa, mas nada da mesa sobe até ela. A luminária não está mais no braço A.
- **Quadros × braço B:** ficam na parede, a 78 px ou mais, enquanto o tampo está a 32 px e o caderno a 34 px. Conferido pelo `pnpm art`: nenhum pixel (nem o anel de hover) em comum com a mesa, a luminária, o caderno, a prateleira, a cama, o celular ou as luzes; folga vertical de 19 px até a luminária de mesa e de 54 px até o caderno.
- **Na mesa, aprovado em 2026-11-10: `headset` e `controller` viram interagíveis** no padrão do caderno: sprite próprio por cima do `computer` (profundidade + 0,01, `topOnly`), `minHit` 24×24, `focus` próprio. O `computer` é regerado sem os dois (o build confere que o quarto não muda nenhum pixel), e a silhueta `computer-hit` (monitor + mouse) já não os cobria.
  - **Controle × teclado, caneca, monitor e caderno:** o controle (≈ `[3, 9.5, 7.9, 10.9]` u) fica 3 u à esquerda do teclado, na frente da caneca e ≈8 u atrás do caderno. Nem ele, nem o anel de hover, nem o `minHit` encostam em `computer-hit`, `journal` ou na luminária (0 px, conferido). Teclado e caneca são decoração sem clique.
  - **Headset × mouse, monitor e gabinete:** o headset (≈ `[28.2, 31.4, 3.4, 8.5]` u) fica atrás do mouse e abaixo do canto direito do monitor: 0 px em comum com `computer-hit`, nem com o anel. O gabinete (profundidade 5) cobre 10 px do headset e o `minHit` pega 91 px do gabinete, que não é interagível; clicar ali abre o headset (aceito pelo Davi).
  - **Luz:** o `light-computer` precisa ser recortado pelo headset (hoje pinta 59 px do tampo embaixo dele) e o headset ganha `light-headset`, como o caderno. O controle fica fora das luzes.
- **Luminária × caderno:** a luminária faz parte do sprite `computer` (clicar nela abre o computador), e o caderno é desenhado por cima, então tem prioridade. Na tela, a cúpula fica ≈7 px à esquerda da borda do caderno, sem pixel em comum, e o caderno continua inteiro à vista.
- **Luminária × quadros:** a luminária (55 px) não cobre os quadros; a folga na tela é de 19 px a 1×. (O diploma, que ficava logo acima dela, saiu em 2026-11-09.)
- **Quadros × retrato:** ≈50 px de parede livre entre os dois na tela.
- **Janela:** não é interagível. Começa 1 col depois do fim do braço A (a mesa termina em col 4 e a cortina começa em col 4,6) e fica longe dos quadros, que agora estão na outra parede.
- **Retrato × cabeceira**, **celular × caderno** (outro móvel, ≈100 px de distância) e **pet × gabinete** (≈24 px de chão livre entre eles na tela), **pet × cortina** (a cortina começa a 46 px de altura; o topo do pet fica ≈35 px abaixo dela na tela): sem sobreposição no bloco de teste.

## Leitura e oclusão (câmera fixa)
Um objeto cobre o que está atrás dele (menor `col + row`) e na mesma faixa horizontal da tela. Por isso:
- **Tudo o que é alto fica nas paredes do fundo:** monitor (72), prateleira (106), janela, gabinete (40). Na frente do quarto (`col + row ≥ 8`) só há coisas baixas: cama e tapete. O pet fica no canto direito, com nada atrás além da parede.
- A cadeira cobre um pedaço da frente do braço A e a ponta esquerda do teclado, como no teste. Ela não é interagível, e o clique atravessa para o `computer`.
- Profundidade da mesa em L: centro do retângulo envolvente (2; 2), ou seja `col + row = 4`. Todos os objetos de chão na frente dela têm soma maior: cadeira 4,9, gabinete ≈5,2 (fica ao lado, sem sobrepor), pet 7, cama 8.
- Bloco de teste desta revisão (formas simples com a paleta oficial, a 2×): `C:\Users\davik\AppData\Local\Temp\claude\C--Projetos-portfolio\5dba4048-cdfd-44a6-8137-220f418fe331\scratchpad\ad\blockout-v4.png`.

## O que entra em cada marco
- **M2:** `room-shell` (piso, paredes de 144 px, rodapé, oclusão, sombras do grupo do computador; sem tapete), `window` (dia, entardecer, noite), `light-window`, grupo do computador (`computer` em L, `desk-lamp`, `light-computer`, `pc-tower`, `desk-chair`), a visão de perto do computador e a porta da cena `Entrance`. As outras áreas do quarto ficam vazias, mas já em 7×7, para câmera e mapa não mudarem no M3.
- **M3:** prateleira (`bookshelf`), caderno (`journal`, com a formação como última página), quadros, retrato, cama + celular, tapete (o `room-shell` é regerado com tapete e as novas sombras), caminha + pet (parado) e as visões de perto dos outros objetos.
- **M4:** animações do pet e avatar opcional sentado na cadeira.

## Para o `scene-engineer` (não editei `src/` nem `public/maps/`)
- `public/maps/room.tmj`: mapa isométrico **7×7, `tilewidth` 64, `tileheight` 32**. O `room-shell.png` (≈472×386, âncora no canto do fundo no chão em ≈(236, 156)) entra como image layer ou imagem na cena. No mapa 7×7, esse canto fica no ponto (224, 0), então a imagem vai em ≈(−12, −156). O valor exato sai do `pivot` do JSON.
- Object layer: um ponto por objeto, no centro do retângulo envolvente do footprint (ou na base da parede). O nome é o `id` (interagíveis) ou o nome do arquivo (decoração).
- Profundidade = `col + row` do ponto de âncora. Objetos de parede ficam logo acima das paredes; objetos sobre móvel ficam com a profundidade do móvel + 0,01.
- Tint de noite e entardecer por cima de tudo, menos das camadas de luz (`light-*`, monitor, LED, tags `on`).
- O comentário "tile 64×32 = 16 unidades" do gerador deve virar "1 tile (losango 64×32) = 8 unidades", e `WALL` passa a 72.
