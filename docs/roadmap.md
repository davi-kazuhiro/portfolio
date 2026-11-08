# Roadmap

Cada marco é executado e aprovado separadamente. Ao fechar um marco, o `qa-a11y` roda o [checklist](qualidade/checklist.md).

| Marco | Escopo | Status |
|---|---|---|
| **M0 – Fundação** | Git + tag `legacy-v1`; base Phaser 4 + React 19 + TS + Vite + pnpm; ponte EventBus com painel de teste; conteúdo migrado para `src/content/pt`; `CLAUDE.md`; 5 agentes; `.mcp.json`; docs e ADRs iniciais | ✅ Concluído (2026-10-25) |
| **M1 – Vertical slice** | Mapa isométrico no Tiled com tiles placeholder; `Boot/Preload` reais; computador como objeto do Tiled; hover com outline, clique com zoom de câmera; painel `ComputerPanel` lendo `projects.json`; Esc volta com zoom-out; foco/teclado | ✅ Concluído (2026-10-31) |
| **M2 – Arte** | Arte própria gerada por código ([ADR 0005](adr/0005-arte-propria-gerada-por-codigo.md)); paleta, bíblia e [planta do quarto](arte/planta-do-quarto.md) fechadas; quarto 7×7 e grupo do computador; iluminação dia/noite; **visão de perto** do computador (ilustração frontal com o painel dentro do monitor) e spec da **porta do quarto** (fechada, 3–4 quadros abrindo, variante noturna), ver [game design](design/game-design.md) | ✅ Concluído (2026-11-01) |
| **M3 – Objetos + conteúdo** | Todos os 8 objetos com painéis temáticos e visão de perto; arte de cama, quadros, diploma, retrato, prateleira, caderno, tapete e pet (gato) pela [planta](arte/planta-do-quarto.md); conteúdo EN; prêmios/certificados e família preenchidos. **Um objeto por vez**: proposta de arte + prévia (quarto e visão de perto) → aprovação do Davi → integração e painel. Ordem: prateleira ✅, caderno, cama + celular, diploma, quadros, retrato, gato + tapete | ⏳ Em andamento |
| **M4 – Jogo** | Porta do quarto como tela de entrada (cena `Entrance`, substitui o "Press Start"); música e SFX; avatar e pet animados | — |
| **M5 – Lançamento** | Mobile (toque, pan/zoom), acessibilidade completa, performance, Playwright e2e, SEO/meta tags, deploy | — |

## Decisões em aberto
- Plataforma de deploy (GitHub Pages × Vercel) — decidir até o M5.
- ~~Asset pack~~ — decidido no M2: nenhum pack, arte própria (ADR 0005).
- ~~Aseprite MCP~~ — dispensado no M2: a arte sai de `tools/art`; retoque manual no Piskel/LibreSprite com `docs/arte/paleta.gpl`.
- Tela do monitor e LED do gabinete escurecem à noite (seguem o tint). Manter ou passar para camadas de luz — decidir com o Davi no M3.

## Pendências herdadas do M1 (QA em [checklist](qualidade/checklist.md))
- ~~Largura do jogo fracionária com devicePixelRatio ≠ 1~~ — resolvido no M2 (`scale.snap` + `autoRound`).
- ~~Painel centralizado cobre o objeto em foco~~ — resolvido no M2 pela visão de perto do computador (demais objetos no M3).
- Foco no menu de teclado não destaca o objeto nem mostra tooltip (M5).
- Idioma escolhido não é lembrado entre visitas (M3).
- Quarto pequeno em 360 px (zoom 1) — pan/pinça no M5.

## Pendências herdadas do M2
- ~~Esc durante o zoom de entrada é ignorado e a visão de perto abre mesmo assim~~ — resolvido no M3 (cena + fallback do menu).
- Fundo (canvas, menu, HUD) continua na árvore de acessibilidade com o diálogo aberto (falta `inert`) — `ui-engineer` (M5).
- ~~Em 1366×768 os botões do HUD encostam no canto do monitor na visão de perto~~ — resolvido no M3 (faixa reservada do HUD).
- DPR 1,25: um pixel da arte vira 2 ou 3 pixels do aparelho (sem borrão, mas irregular) — avaliar no M5.
- Tablet (768×1024) mostra o quarto em zoom 1 — pan/zoom no M5.
- `docs/arte/specs.md` §3: exemplos de escala (5×/3×) supõem a área útil do navegador; o código dá 6×/4× na viewport exata — `art-director` esclarecer.
