# Ajustes (backlog do Davi, pedido em 2026-11-16)

Lista viva de ajustes pedidos depois do lançamento. Um item por vez: ao terminar, marcar ✅ com a data e o commit. Ordem pensada para resolver primeiro o que está quebrado, depois o que muda a leitura do quarto, depois conteúdo e por fim a feature nova (que depende dos anteriores).

| # | Ajuste | Área / agente | Status |
|---|---|---|---|
| A1 | Botão de abrir o menu não aparece | `ui-engineer` | ✅ 2026-11-16 |
| A2 | Título visível nas visões de perto (PC e mobile) | `scene-engineer` + `ui-engineer` | ✅ 2026-11-16 |
| A3 | Projetos = repositórios públicos do GitHub, foco em vaga de estágio de IA | `content-curator` | ✅ 2026-11-16 (falta revisão dos textos pelo Davi) |
| A4 | Tutorial em forma de diálogo de videogame + botão para reabrir | `ui-engineer` (+ `content-curator` nos textos) | ✅ 2026-11-16 |
| A5 | Botão "voltar" do celular sai da visão de perto e volta ao quarto | `ui-engineer` | ✅ 2026-11-16 |
| A6 | No celular, o quarto sobe enquanto o diálogo do tutorial está aberto | `scene-engineer` + `ui-engineer` | ✅ 2026-11-16 |
| A7 | No celular, os botões somem enquanto as setas amarelas aparecem | `ui-engineer` | ✅ 2026-11-19 |

---

## A1 – Botão de abrir o menu não aparece
**Pedido:** o botão que abre o menu não está aparecendo.

**Feito (2026-11-16):** o menu de objetos só existia como menu de teclado (`sr-only`, aparecia só com Tab). Agora há um botão **hambúrguer** (três barras em CSS, nome acessível "Abrir menu de objetos") (`.objects-menu-toggle` em `src/ui/hud/Hud.tsx`, chave `hud.objectsMenuButton`):
- Desktop: canto superior esquerdo, menu abre logo abaixo. Celular (< 768 px): canto inferior esquerdo (o topo já tem idioma/período/som), menu abre para cima.
- `aria-expanded`/`aria-controls`; fecha ao escolher um objeto, com Esc (foco volta ao botão) ou com clique/toque fora.
- Some (`visibility: hidden`) com um painel aberto e o foco volta a ele quando o painel fecha.
- Itens do menu no formato **Representação (Objeto)**, ex.: "Projetos (Computador)" (chaves `objects.*`, só no menu).
- O menu de teclado (Tab revela) continua igual. e2e em `e2e/panels.spec.ts`.

## A2 – Título nas visões de perto
**Pedido:** todo interagível com um título dizendo o que representa, no PC e no mobile, bem feito e **sem cor de fundo**. Esclarecido pelo Davi: no quarto a dica de hover que já existia está boa; o título deve aparecer **nas visões de perto**.

**Feito (2026-11-16):**
- Todas as visões de perto mostram no topo, centralizado, só o que o objeto representa ("Habilidades", "Projetos"...; chaves `titles.*`, as mesmas da dica de hover no quarto). Sem fundo: creme com contorno de 2 px na cor da borda (`.closeup-title` em `src/app/global.css`).
- Nas cenas (estante, quadros, caderno, celular, headset, controle) o próprio `<h2>` do diálogo, antes `visually-hidden`, virou o título visível. No computador (`Closeup.tsx`, modo `cover`) é um `<p aria-hidden>` (o `<h2>` é a barra da janela retrô).
- Abaixo de 1200 px de largura o título desce para logo abaixo dos botões (não cabe entre "Fechar" e o HUD).
- Celular/telas sem a ilustração: os painéis de texto já têm cabeçalho visível; `bookshelf.title` passou para "Habilidades".
- Descartado: títulos fixos sobre os objetos no quarto (feito e revertido no mesmo dia, a pedido do Davi).

## A3 – Projetos do GitHub (estágio de IA)
**Pedido:** trocar o conteúdo dos projetos pelo que está público no GitHub do Davi, adaptado para vaga de estágio de IA.

**Feito (2026-11-16):** dos 5 repositórios públicos, o Davi escolheu 4, nesta ordem: **Organizador de Arquivos com IA** (destaque), **IDMRT-PP** (destaque), **Portfolio Quarto Pixel** e **Present**. Saíram os 4 projetos antigos (repositórios privados/apagados, links davam 404) e o "Sistema de Chamadas" (é a versão antiga do Present); o T2 (Sistemas Distribuídos, sem README) ficou de fora. Descrições PT/EN tiradas dos READMEs, destacando LLM, structured outputs, modelo local, pesquisa sobre adoção de IA e desenvolvimento com agentes. O "Onde usei" da estante segue pelas tecnologias (Python, JavaScript, React, Node.js, MySQL).

Também com foco em IA (2026-11-16): `about.json` (objetivo de seguir em Engenharia de IA; PIBIC e projetos com IA citados), `skills.json` (Python primeiro nas linguagens; descrições de Ollama e Claude Code ligadas aos projetos). Ferramentas novas (Claude API, Pydantic) ficaram de fora porque pedem ícones novos na arte da estante.

Pendente: revisão dos textos pelo Davi. `about.json` só aparece quando o retrato entrar (M7).

**Passos (plano original):**
1. Levantar os repositórios públicos (nome, descrição, linguagem, README, link) e o Davi escolher quais entram e em que ordem.
2. Reescrever `src/content/{pt,en}/projects.json` destacando IA/ML/dados (problema, abordagem, stack, resultado), com link do repositório.
3. Revisar se `about.json` e `skills.json` precisam acompanhar o foco em IA (confirmar com o Davi).
4. Registrar o que faltar em `docs/conteudo/pendencias.md`.

**Pronto quando:** PT e EN revisados, links funcionando, painel do computador sem quebra de layout.

## A4 – Tutorial em diálogo de videogame
**Pedido:** um "tutorial" no estilo caixa de diálogo de jogo ensinando a usar o portfolio, e um botão para acionar o diálogo.

**Feito (2026-11-16):**
- `src/ui/tutorial/Tutorial.tsx`: caixa de diálogo de jogo no rodapé, etiqueta "Davi", texto letra a letra (clique/Enter completa, depois avança; reduced motion mostra tudo), botões Pular e Próximo, contador "n/6". Esc fecha. No celular fica acima do botão de menu.
- 6 passos (`steps.ts`, textos em `tutorial.*` do i18n): **"Bem-vindo ao meu quarto!"** → objetos (versão mouse ou toque) → visão de perto → menu → HUD → fim.
- Pedido do Davi: **setas amarelas balançando** sobre cada interagível no passo dos objetos (`TutorialArrows.tsx`; a cena emite `object-anchors`). Nos passos do menu e do HUD, o botão citado ganha contorno amarelo piscando.
- Abre sozinho na 1ª visita ao quarto (`quartoPixel.tutorial` no localStorage ao concluir/pular) e sempre pelo botão **"?"** no HUD (foco volta a ele ao fechar). Escondido com painel aberto e sem WebGL.
- Testes: `tests/tutorial.test.ts` e `e2e/tutorial.spec.ts`; as fixtures dos outros e2e marcam o tutorial como visto.

**Decisões originais:**
- Quando aparece: automaticamente na 1ª visita (lembrar em `localStorage`, com try/catch) e sempre pelo botão no HUD.
- Quem fala: narrador/caixa de texto simples, ou o avatar/gato do M8 depois (deixar o componente pronto para trocar o retrato).
- Passos sugeridos: boas-vindas → clicar/tocar nos objetos (os títulos do A2) → arrastar e pinçar no mobile → Esc/voltar → idioma e som → botão do tutorial para rever.
- Texto letra a letra com "pular" (clique/Enter mostra tudo, depois avança); respeitar `prefers-reduced-motion` (texto inteiro de uma vez).
- Acessibilidade: diálogo com foco preso, `aria-live`, fecha com Esc; textos em `src/i18n/locales/{pt,en}.json`.
- Opcional: destacar o objeto citado em cada passo (evento novo no EventBus — tarefa cruzada, fazer em sequência).

**Pronto quando:** funciona em desktop e mobile, teclado e leitor de tela; e2e do fluxo abrir → avançar → fechar → reabrir pelo botão.

## A5 – Botão "voltar" fecha a visão de perto
**Pedido:** no celular, o botão de voltar sai da visão de perto e volta para o quarto (em vez de sair do site).

**Feito (2026-11-16):** `src/ui/panels/backButton.ts`, ligado no `PanelHost`. Ao abrir um painel empilhamos uma entrada no histórico (`history.state.quartoPixelPanel`); o "voltar" (celular ou navegador) dispara `popstate` e fecha o painel pelo caminho normal (zoom-out, foco devolvido). Fechar pela interface (Fechar, Esc, clique fora) desempilha a entrada com `history.back()` e ignora o `popstate` gerado, então o histórico não acumula e o "voltar" seguinte, no quarto, sai do site normalmente. Testes: `tests/backButton.test.ts` e e2e em `e2e/panels.spec.ts` (desktop e mobile).

## A6 – Quarto sobe com o tutorial aberto (celular)
**Pedido:** no celular, com o diálogo de entrada aberto, subir a visão do quarto para o diálogo não cobrir os objetos.

**Feito (2026-11-16):** abaixo de 768 px de largura, o tutorial calcula quanto subir (`roomLift` em `src/ui/tutorial/steps.ts`: leva o centro do quarto ao meio do espaço livre entre a faixa do HUD e o topo da caixa) e emite `room-lift` a cada passo e no resize; ao fechar emite 0. Na cena, `FocusCamera.setLift` desloca o centro da câmera com um pan curto (instantâneo com reduced motion), fora do clamp do arrasto; durante um zoom de foco o deslocamento fica guardado e volta junto com o quarto. As setas acompanham porque as âncoras são reenviadas quando a câmera anda. Teste em `tests/tutorial.test.ts`.

## A7 – Botões somem no passo das setas (celular)
**Pedido:** no celular as setas amarelas ficavam em cima dos botões; enquanto as setas aparecem, remover os botões.

**Feito (2026-11-19):** o tutorial marca `tutorialArrows` no store no passo das setas; abaixo de 768 px o HUD do topo (?, idioma, período, som) e o botão de menu ganham `visibility: hidden` (classe `.hud-tutorial-hide`) e voltam no passo seguinte, ao fechar o tutorial ou com um painel aberto. No PC nada muda. Coberto em `e2e/tutorial.spec.ts`.
