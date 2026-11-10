# Como adicionar um objeto interagível

Exemplo: um violão (`guitar`) que mostra hobbies.

1. **Arte** (`art-director`): o objeto é gerado por código em `tools/art/` (ADR 0005) e exportado em `public/assets/objects/guitar.png` + `guitar.json`, seguindo a [bíblia de arte](../arte/biblia-de-arte.md):
   - JSON Hash do Aseprite, frames `"guitar 0"`, `"guitar 1"`…, todos do mesmo tamanho, sem trim;
   - `pivot` inteiro em cada frame = âncora (centro da pegada no chão, ou base da parede sob o centro);
   - `meta.quartoPixel` com `footprint`, `mount` (`floor`, `wall-back`, `wall-left`), `hit: "alpha"`, `minHit` se for pequeno e `focus` (`[x, y, w, h]` em px do canvas) se o zoom não deve mirar a silhueta inteira;
   - 2 px de margem transparente (o anel branco de aviso e o outline de hover são desenhados por código, por fora; [bíblia](../arte/biblia-de-arte.md), regras 13 e 14);
   - variantes como tags (`idle`, `day`/`dusk`/`night`, `on`/`off`).
2. **Manifesto** (`scene-engineer`): adicionar `guitar: 'assets/objects/guitar'` em `ROOM_SPRITES` (`src/game/assets.ts`). Camadas no mesmo canvas (luz, peça que acende) também entram em `ROOM_SPRITES`, e o JSON delas diz `layerOf: "guitar"` (+ `light: true` se forem luz, fora do tint da noite; `syncFramesWith: "guitar"` se acompanham a animação; `hit: "none"` se não contam para o clique). Enquanto o PNG não existir, dá para acrescentar um stand-in em `src/game/objects/standins.ts` (caixas em unidades do gerador, as mesmas da spec).
3. **Mapa** (`scene-engineer`): no Tiled, abrir `public/maps/room.tmj` (isométrico 7×7, tile 64×32) e desenhar um **retângulo** no object layer `interactables` cobrindo a pegada no chão (1 tile = 32 unidades nos dois eixos; para objeto de parede, um ponto na base da parede), com a propriedade string `id = guitar`. O sprite vai no centro do retângulo, com a origem no pivot. Ids inválidos ou repetidos são ignorados com aviso. **Só entra no mapa quando o sprite existir**: um `id` sem textura não fica clicável. Decoração sem clique vai no layer `decor`, com o nome do arquivo. Convenções: [ADR 0004](../adr/0004-coordenadas-tiled-phaser.md).
   - Objeto **sobre móvel** (caderno na mesa, celular na cama): mesmo ponto do móvel e profundidade do móvel + 0,01, para ganhar o clique (`topOnly`). Esse caso ainda precisa de suporte na cena (M3).
   - Nenhum interagível pode passar de 112 px de altura nem ficar no alto da parede a menos de 1,5 tile do canto do fundo: a câmera corta o alto das paredes em telas baixas ([planta](../arte/planta-do-quarto.md)).
4. **Registry**: adicionar `{ id: 'guitar', labelKey: 'objects.guitar' }` em `src/game/objects/registry.ts`.
5. **Rótulos** (`ui-engineer`): chave `objects.guitar` em `src/i18n/locales/pt.json` e `en.json`. O teste `tests/registry.test.ts` falha se faltar.
6. **Conteúdo** (`content-curator`): `src/content/{pt,en}/hobbies.json` e exportar em `src/content/index.ts`.
7. **Painel** (`ui-engineer`): `src/ui/panels/GuitarPanel.tsx` e registrá-lo no mapa de painéis do `PanelHost`. Se tiver visão de perto, todo elemento clicável da cena ganha `<CueRing>` logo antes do sprite (anel branco piscando; sem frame de hover dourado).
8. **Verificar** (`qa-a11y`): aparece no menu acessível, anel branco piscando no quarto, hover mostra o outline, abre com clique e com Enter, fecha com Esc, PT e EN.

Fora o manifesto em `assets.ts`, nenhuma mudança no motor da cena é necessária.
