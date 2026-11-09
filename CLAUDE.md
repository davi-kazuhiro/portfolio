# Portfolio "Quarto Pixel" — Davi Kazuhiro Natume

Portfolio em forma de menu de jogo: um quarto em **pixel art isométrico 2D** onde cada objeto clicável abre uma parte do portfolio com zoom + UI temática. Visão completa em [docs/00-visao.md](docs/00-visao.md); status dos marcos em [docs/roadmap.md](docs/roadmap.md).

## Stack
- **Phaser 4** (canvas: cenas, câmera, input, tweens, áudio, tilemaps do Tiled) — `src/game/`
- **React 19** (DOM sobreposto: painéis, HUD, acessibilidade) — `src/ui/`, `src/app/`
- **Zustand** (estado global) — `src/store/`; **react-i18next** (PT padrão + EN) — `src/i18n/`
- **Vite 8 + TypeScript 7 + oxlint + Vitest**, gerenciador **pnpm**
- Site 100% estático. O site antigo está preservado na tag git `legacy-v1`.

## Comandos
```
pnpm dev         # dev server em http://localhost:5173
pnpm build       # typecheck + build em dist/
pnpm typecheck | pnpm lint | pnpm test
```
No Windows, se `pnpm` não estiver no PATH: `%APPDATA%\npm\pnpm.cmd`.

## Arquitetura em uma frase
Phaser e React **nunca se importam diretamente**: conversam só pelo `EventBus` tipado (`src/game/EventBus.ts`, interface `GameEvents`) e pelo store Zustand. Detalhes em [docs/adr/arquitetura/](docs/adr/arquitetura/).

## Convenções
- Código em inglês, textos/comentários/docs em português.
- Objetos interagíveis: o `id` é o mesmo no Tiled, em `src/game/objects/registry.ts`, nas chaves `objects.*` do i18n e no painel em `src/ui/panels/`. Passo a passo: [docs/guias/novo-objeto.md](docs/guias/novo-objeto.md).
- Texto de UI vai em `src/i18n/locales/{pt,en}.json`; conteúdo do portfolio em `src/content/{pt,en}/*.json`. Nunca texto fixo em componente.
- Pixel art: só escala inteira, `pixelArt: true`, paleta e grid da [bíblia de arte](docs/arte/biblia-de-arte.md).
- Todo asset de terceiros é registrado em `public/assets/LICENSES.md` antes do commit.
- Decisões de arquitetura viram ADR em `docs/adr/`.

## Agentes e delegação
A sessão principal é a **orquestradora**: quebra o marco atual de `docs/roadmap.md` em tarefas e delega por área. Cada agente só edita os arquivos da sua área e atualiza o doc que mantém.

| Agente | Área | Quando delegar |
|---|---|---|
| `art-director` | `public/assets/`, `docs/arte/` | escolher packs, paleta, specs e licenças de sprites |
| `scene-engineer` | `src/game/`, `public/maps/` | qualquer coisa no canvas Phaser ou no mapa do Tiled |
| `ui-engineer` | `src/ui/`, `src/app/`, `src/i18n/`, `src/store/` | painéis, HUD (quarto e porta de entrada), i18n, responsivo |
| `content-curator` | `src/content/`, `docs/conteudo/` | textos do portfolio, traduções PT/EN, pendências de conteúdo |
| `qa-a11y` | `tests/`, `e2e/`, `docs/qualidade/` | fechar um marco: testes, acessibilidade, performance |

Tarefas que cruzam áreas (ex.: novo evento no EventBus) são feitas pela orquestradora ou em sequência pelos dois agentes, nunca em paralelo nos mesmos arquivos.

### Economia de tokens
- `content-curator` e `qa-a11y` rodam no Sonnet (frontmatter `model`); arte, cena e UI no modelo padrão.
- Specs de arte: leia o índice `docs/arte/specs.md` e **só** o arquivo do objeto em `docs/arte/specs/` (mais a §3 "Tela cheia" quando mexer em visão de perto). Objeto novo ganha arquivo novo.
- Briefings de agente trazem os rects/chaves já decididos em vez de mandar reler docs inteiros; peça no máximo 2–3 screenshots por entrega e leia imagens só quando forem decidir algo.
- Prévias e cenas de propostas descartadas (`build-m3.mjs`, `closeup-shelf2/3`, `closeup-3d`, journal B) são histórico: não leia a menos que o pedido seja sobre elas.
- Comandos longos (dev server, polling) sempre em background, para o agente não travar.

## Referências
- Skills oficiais do Phaser 4: `node_modules/phaser/skills/<tópico>/SKILL.md` (cameras, tilemaps, tweens, input, audio, v3-to-v4-migration...). Ler antes de usar uma API do Phaser; a maioria dos exemplos na web é do Phaser 3.
- MCPs do projeto (`.mcp.json`): `context7` (docs de libs), `playwright` (verificação no navegador).
