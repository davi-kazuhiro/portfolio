# Quarto Pixel · Portfolio de Davi Kazuhiro Natume

[![CI](https://github.com/davi-kazuhiro/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/davi-kazuhiro/portfolio/actions/workflows/ci.yml)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

> Em vez de rolar uma página, você **entra no meu quarto**: uma cena em pixel art isométrica, como o menu de um jogo. Cada objeto conta uma parte da minha história.

O computador mostra meus projetos, os quadros na parede guardam prêmios e certificados, a estante reúne minhas skills e o celular tem meu contato. Por trás do visual de jogo, o site continua sendo um site para recrutadores: rápido, acessível por teclado, em português e inglês, e sem esconder o essencial.

**Este projeto também é um experimento de engenharia de software com agentes de IA.** Ele é desenvolvido com o [Claude Code](https://claude.com/claude-code) atuando como uma pequena equipe: um orquestrador e cinco agentes especializados. Eu defino a visão, tomo as decisões e aprovo cada marco. O processo está todo documentado no repositório e é descrito [abaixo](#como-a-ia-desenvolve-este-projeto).

> **Status:** em desenvolvimento. Os marcos M0 (fundação) e M1 (vertical slice: quarto com o computador interagível) estão concluídos. O próximo é o M2 (arte final). A versão anterior do site, em React tradicional, está preservada na tag [`legacy-v1`](https://github.com/davi-kazuhiro/portfolio/tree/legacy-v1).

## Sumário

- [A experiência](#a-experiência)
- [Como a IA desenvolve este projeto](#como-a-ia-desenvolve-este-projeto)
- [Arquitetura](#arquitetura)
- [Roadmap](#roadmap)
- [Como executar](#como-executar)
- [Documentação](#documentação)

## A experiência

| Objeto | O que abre | Interface temática |
|---|---|---|
| Computador | Projetos | Desktop retrô com janelas e pastas |
| Quadros | Prêmios e certificados | Moldura ampliada com galeria |
| Retrato | Sobre mim e minha família | Porta-retrato com texto |
| Estante | Skills e ferramentas | Livros e cartuchos que abrem fichas |
| Caderno | Experiência e formação | Diário com páginas |
| Celular | Contato e currículo | Tela de celular |
| Pet | Easter egg | Balão de diálogo |

Hoje o computador já funciona de ponta a ponta. Os outros objetos entram nos marcos M2 e M3.

O visitante passa o mouse sobre um objeto e vê um destaque com o nome dele. Ao clicar, a câmera dá zoom no objeto e o painel temático abre. Esc, o botão "Voltar" ou um clique fora fecham o painel.

**Recrutadores primeiro.** O público principal precisa achar projetos, experiência e contato em menos de um minuto, inclusive no celular. Por isso:
- todos os objetos são acessíveis por um **menu de teclado** compatível com leitor de tela;
- os painéis usam `role="dialog"`, prendem o foco e o devolvem ao fechar;
- `prefers-reduced-motion` desliga o zoom animado;
- o idioma alterna entre **PT e EN**, e todo o conteúdo fica em arquivos JSON, nunca fixo no código.

## Como a IA desenvolve este projeto

### Uma equipe de agentes

A sessão principal do Claude Code é a **orquestradora**. Ela pega o marco atual do [roadmap](docs/roadmap.md), divide em tarefas e delega cada uma ao agente da área. Cada agente é definido em [`.claude/agents/`](.claude/agents/), com seu próprio prompt, ferramentas permitidas, **arquivos que pode editar** e um documento que precisa manter atualizado.

| Agente | Responsabilidade | Pode editar | Mantém |
|---|---|---|---|
| [`art-director`](.claude/agents/art-director.md) | Pesquisar asset packs, definir paleta e grid, escrever specs de sprites e verificar licenças | `public/assets/`, `docs/arte/` | [Bíblia de arte](docs/arte/biblia-de-arte.md) e `LICENSES.md` |
| [`scene-engineer`](.claude/agents/scene-engineer.md) | Canvas Phaser 4: cenas, mapa isométrico, câmera, interação e áudio | `src/game/`, `public/maps/` | [Arquitetura da cena](docs/adr/arquitetura/cena.md) |
| [`ui-engineer`](.claude/agents/ui-engineer.md) | Camada React: painéis, HUD, i18n, estado e acessibilidade | `src/ui/`, `src/app/`, `src/i18n/`, `src/store/` | [Arquitetura da UI](docs/adr/arquitetura/ui.md) |
| [`content-curator`](.claude/agents/content-curator.md) | Textos do portfolio e tradução PT ↔ EN | `src/content/`, `docs/conteudo/` | [Pendências de conteúdo](docs/conteudo/pendencias.md) |
| [`qa-a11y`](.claude/agents/qa-a11y.md) | Fechar marcos: testes, navegador, acessibilidade e performance | `tests/`, `e2e/`, `docs/qualidade/` | [Checklist de qualidade](docs/qualidade/checklist.md) |

Tarefas que cruzam áreas, como um evento novo entre o jogo e a interface, são feitas pela orquestradora ou em sequência pelos dois agentes, **nunca em paralelo nos mesmos arquivos**.

### Guardrails: como evitar que a IA faça bobagem

Delegar código para agentes só funciona com limites claros. Os principais deste projeto:

| Risco | Guardrail |
|---|---|
| Um agente quebrar a parte de outro | Cada agente só edita a própria área. O resto é só leitura, e problemas fora da área viram relatório para a orquestradora |
| A IA usar API desatualizada (a maioria dos exemplos na web é do Phaser 3) | Os agentes leem as **skills oficiais do Phaser 4** em `node_modules/phaser/skills/` antes de usar uma API. Para as outras libs, consultam a documentação atual pelo **MCP Context7** |
| A IA inventar informação sobre mim | O `content-curator` tem a regra "**nunca invente fatos**": o que falta vira um item em [pendências](docs/conteudo/pendencias.md) para eu responder, e o campo fica vazio |
| Usar arte sem direito de uso | O `art-director` só aceita CC0, CC-BY ou licença explícita, e todo asset é registrado em `LICENSES.md` antes do commit |
| Arquitetura se perder entre sessões | Todo agente lê o [`CLAUDE.md`](CLAUDE.md) antes de começar. Decisões estruturais viram [ADRs](docs/adr/), e cada agente atualiza o documento da sua área ao terminar |
| Regressões | 31 testes (Vitest), lint (oxlint), typecheck e build rodam no **CI a cada push**. O `qa-a11y` verifica o site no navegador real pelo **MCP Playwright** e roda o [checklist](docs/qualidade/checklist.md) completo antes de cada marco ser aprovado |

### O papel humano

A IA executa; as decisões são minhas.
- Cada marco do roadmap é **executado e aprovado separadamente**.
- As decisões que definem o projeto foram aprovadas por mim e registradas em ADR, com as alternativas consideradas: Phaser 4 em vez de Godot, Unity ou PixiJS ([ADR 0001](docs/adr/0001-motor-phaser-react.md)), o quarto isométrico montado no Tiled ([ADR 0002](docs/adr/0002-isometrico-tiled.md)) e a porta do quarto como tela de entrada ([game design](docs/design/game-design.md)).
- O `art-director` precisa da minha confirmação antes de fixar um asset pack ou a paleta.
- Todo conteúdo pessoal vem de respostas minhas.

### Ferramentas

| Ferramenta | Uso |
|---|---|
| **Claude Code** | Orquestrador e os 5 subagentes |
| **MCP Context7** | Documentação atualizada de Phaser 4, React 19 e i18next |
| **MCP Playwright** | Verificação do site no navegador pelo agente de QA |
| **Skills oficiais do Phaser 4** | Referência de API dentro do próprio `node_modules` |
| **GitHub Actions** | Lint, testes e build a cada push |

As versões dos MCPs ficam fixadas em [`.mcp.json`](.mcp.json), e a do pnpm em `package.json`, para o ambiente dos agentes ser reproduzível.

## Arquitetura

O desafio técnico central é combinar **um motor de jogo** (canvas, câmera, tilemaps) com **uma interface acessível** (texto selecionável, foco, leitor de tela). A solução separa as duas camadas:

```
┌──────────────── Phaser 4 (canvas) ────────────────┐
│ cenas Boot/Preload/Room · mapa isométrico do Tiled │
│ câmera com zoom · hover/outline · input            │
└───────────────┬────────────────────────────────────┘
                │  EventBus tipado + store Zustand
┌───────────────┴──── React 19 (DOM) ───────────────┐
│ painéis temáticos · HUD · menu acessível · i18n   │
└───────────────────────────────────────────────────┘
```

- **Phaser e React nunca se importam diretamente.** Eles conversam só pelo [`EventBus`](src/game/EventBus.ts), que é tipado (`object-hover`, `object-open`, `panel-closed`, `focus-object`...), e pelo store Zustand.
- **Fluxo único de abertura:** um clique no canvas ou o menu de teclado pede o foco → a câmera dá zoom → o Phaser emite `object-open` → o React abre o painel. Mouse, teclado e toque passam pelo mesmo caminho.
- **Extensível sem mexer no motor:** um objeto novo é um retângulo no Tiled, uma linha no registry, um rótulo no i18n, um JSON de conteúdo e um painel ([guia](docs/guias/novo-objeto.md)). Um teste falha se algum objeto do registry ficar sem rótulo em PT ou EN.
- **Pixel art nítido:** só escala inteira e `pixelArt: true`. As convenções de coordenadas entre o Tiled e o Phaser no modo isométrico estão no [ADR 0004](docs/adr/0004-coordenadas-tiled-phaser.md).

| Camada | Tecnologias |
|---|---|
| Cena | Phaser 4, Tiled (mapa isométrico 2:1) |
| Interface | React 19, Zustand, react-i18next |
| Build e qualidade | Vite 8, TypeScript 7, oxlint, Vitest, pnpm, GitHub Actions |
| Deploy | Site 100% estático (GitHub Pages ou Vercel, a decidir no M5) |

## Roadmap

| Marco | Escopo | Status |
|---|---|---|
| M0 · Fundação | Base Phaser 4 + React 19, ponte EventBus, conteúdo migrado do site antigo, `CLAUDE.md`, 5 agentes, MCPs, ADRs | ✅ Concluído |
| M1 · Vertical slice | Quarto isométrico no Tiled, computador interagível com outline, zoom e painel de projetos, navegação por teclado | ✅ Concluído |
| M2 · Arte | Asset pack, paleta, sprites customizados, dia/noite e "visão de perto" do computador | ⏳ Próximo |
| M3 · Objetos e conteúdo | Os 8 objetos com painéis temáticos e conteúdo em inglês | — |
| M4 · Jogo | Porta do quarto como tela de entrada, música e SFX, avatar e pet animados | — |
| M5 · Lançamento | Mobile com pan/zoom por toque, acessibilidade completa, testes e2e, SEO e deploy | — |

## Como executar

Pré-requisitos: Node.js 20.19+ e pnpm.

```bash
git clone https://github.com/davi-kazuhiro/portfolio.git
cd portfolio
pnpm install
pnpm dev          # http://localhost:5173
```

```bash
pnpm test         # testes (Vitest)
pnpm lint         # oxlint
pnpm build        # typecheck + build estático em dist/
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Contexto que todo agente lê primeiro: stack, convenções e delegação |
| [Visão](docs/00-visao.md) | Pitch, público, definições e objetos |
| [Game design](docs/design/game-design.md) | Fluxo de telas, estados, eventos e interação por dispositivo |
| [ADRs](docs/adr/) | Decisões de arquitetura e o porquê de cada uma |
| [Roadmap](docs/roadmap.md) | Marcos, decisões em aberto e pendências |
| [Checklist de qualidade](docs/qualidade/checklist.md) | O que é verificado antes de aprovar um marco |
