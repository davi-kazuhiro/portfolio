# ADR 0009 — Build enxuto do Phaser

- **Status:** aceito (2026-11-14)

## Contexto
A meta de peso do M5 é JS total < 500 KB gzip (`docs/qualidade/checklist.md`), e o build estava em ≈ 490 KB, dos quais 357 kB eram o chunk `phaser`. O pacote `phaser` 4.2.1 só publica bundles prontos (`dist/phaser.esm.js`) com tudo dentro: física arcade e matter, partículas, texto, shaders, renderer Canvas etc. Como o namespace é um objeto único, o tree-shaking do Vite não remove nada. O quarto usa uma fração disso: sprites/imagens/graphics/zone, tweens, câmera 2D, input (mouse, toque, teclado), som WebAudio, loader de Aseprite/áudio/Tiled e a leitura de um tilemap sem camadas de tiles.

O código-fonte CommonJS vem no pacote (`node_modules/phaser/src`), com entradas de exemplo (`phaser-core.js`) e flags de build (`typeof WEBGL_RENDERER`, `CANVAS_RENDERER`, `FEATURE_SOUND`, `PLUGIN_*`) que o webpack oficial troca com `DefinePlugin`.

## Decisão
- No `vite build`, `phaser` é um alias para `src/game/phaser-custom.js`, um entry próprio que importa só os módulos usados a partir de `node_modules/phaser/src` e exporta os mesmos nomes do namespace. O código do jogo continua com `import * as Phaser from 'phaser'` e com os tipos do pacote.
- Um plugin do Vite (`phaserFlags`) troca as expressões `typeof FLAG` nos arquivos do Phaser: só WebGL (sem renderer Canvas), som ligado, sem debug WebGL/Spector, sem câmera 3D nem Facebook Instant Games. O `define` do Vite não serve porque só troca identificadores, e `typeof <qualquer coisa>` é sempre uma string verdadeira.
- Em `vite dev` e no Vitest fica o pacote ESM completo: o dev server não converte o código-fonte CommonJS.
- `tests/m5-perf-phaser.test.ts` confere que todo namespace e todo `add.*`, `make.*` e `load.*` usado em `src/game` está no entry.

## Consequências
- Chunk `phaser` 357 → 230 kB gzip; JS total ≈ 490 → 368 KB gzip (folga de ~130 KB para a meta). A porta aparece ~0,15 s antes em "Fast 4G".
- Sem renderer Canvas: um navegador sem WebGL não mostra o quarto (o Phaser falha ao criar o renderer). Hoje isso é raro (o Chrome cai para WebGL por software); a UI do DOM (menu de objetos e painéis) continua acessível.
- Dev e produção usam builds diferentes do Phaser. Uma API nova que fique de fora do entry funciona no `pnpm dev` e quebra no build; o teste cobre os casos comuns, e mudanças no canvas devem ser conferidas também com `pnpm build` + `pnpm preview`.
- Atualizar o Phaser exige rever o entry (caminhos internos de `src/` podem mudar entre versões); por isso a versão está fixada (`4.2.1`).
