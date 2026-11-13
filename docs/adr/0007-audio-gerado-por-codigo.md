# ADR 0007 — Áudio próprio gerado por código

- **Status:** aceito (2026-11-13)
- **Relacionado:** [ADR 0005](0005-arte-propria-gerada-por-codigo.md) (arte própria gerada por código)

## Contexto
O M4 traz música e efeitos sonoros ([game design](../design/game-design.md#áudio)). A arte do quarto já é toda própria, gerada por scripts, sem licença de terceiros. O Davi escolheu o mesmo caminho para o som (2026-11-13), em vez de um pack CC0 ou de arquivos fornecidos por ele.

## Decisão
- Música e SFX são **sintetizados por scripts Node sem dependências** em `tools/audio/` (osciladores de onda quadrada, triângulo e ruído, com envelope, no estilo chiptune). `node tools/audio/build.mjs` (`pnpm audio`) grava os arquivos em `public/assets/audio/`. Os scripts são a fonte; não se edita o arquivo gerado.
- Formato **WAV PCM 16 bits mono, 22 050 Hz** (escrito pelo próprio script, sem codificador externo). SFX curtos (≤ 0,4 s); música em **loop curto** (≤ 32 s) que emenda sem clique.
- **Mudo por padrão.** O estado do som fica no store Zustand e é lembrado em `localStorage`. A música **só é baixada quando o som é ligado** (carga sob demanda na cena, fora do `Preload`), para não pesar na primeira visita; os SFX, pequenos, podem ir no `Preload`.
- O primeiro gesto do visitante (na porta) libera o `AudioContext` do navegador; nada toca antes disso.
- Ponte React → Phaser pelo evento `audio-toggle` (`[on: boolean]`) no `EventBus`. A cena é dona da reprodução (música em loop, SFX de hover, abrir, fechar, porta).
- Volume baixo e fixo (música ≈ 0,35, SFX ≈ 0,5); sem controle de volume no M4.

## Consequências
- Sem custo nem restrição de licença; nada novo em `LICENSES.md`.
- WAV é maior que OGG/MP3: o orçamento é ≈ 1,5 MB para a música, aceitável porque ela só é baixada com o som ligado. Se pesar no M5, trocar por OGG gerado com um codificador (decisão nova).
- Som sintetizado é simples; a música é um loop chiptune curto, não lo-fi gravado.

## Atualização (2026-11-13)
A música gerada foi **desativada**: o Davi não gostou e vai compor a própria. Os SFX continuam gerados por código. O sistema de áudio segue pronto para música (carga sob demanda, loop, volume 0,35); basta apontar `AUDIO.music` em `src/game/assets.ts` para o novo arquivo. Se ela não for gerada por código, este ADR passa a valer só para os SFX.
