# Guia de conteúdo

Mantido pelo agente `content-curator`.

## Onde fica
`src/content/<lang>/<seção>.json`, lido por `getContent(locale)` em `src/content/index.ts`.

| Arquivo | Objeto | Conteúdo |
|---|---|---|
| `profile.json` | HUD / celular | nome, contato, links, cargos, objetivo |
| `about.json` | retrato | quem sou, o que me move, `familia` |
| `projects.json` | computador | projetos |
| `experiences.json` | caderno | trabalho e pesquisa |
| `education.json` | diploma | curso, IRA, disciplinas |
| `skills.json` | prateleira (`bookshelf`) | linguagens, idiomas, ferramentas, hobbies (+ soft skills não exibidas) |
| `awards.json` | quadros | prêmios e certificados |
| `extras.json` | estante / caderno | atividades extras |

## Regras
- PT é a fonte; EN espelha as mesmas chaves.
- Não inventar fatos. Faltou informação → `null`/lista vazia + item em [pendencias.md](pendencias.md).
- Primeira pessoa, frases curtas; cabe numa janela pequena.

## Esquema de `skills.json` (prateleira, M3)
Chaves em inglês; PT e EN idênticos na estrutura (só `name`, `level` de idioma e `description` são traduzidos). Itens na ordem de exibição.

| Chave | Campos | Onde aparece |
|---|---|---|
| `languages[]` | `id`, `name`, `level` (0–100), `icon`, `matches[]` | livro vermelho "Linguagens": sumário + uma página por item |
| `spokenLanguages[]` | `id` (código ISO), `name`, `level` (texto), `certificates[]` (vazio por enquanto), `usage` (`string \| null`) | livro azul "Idiomas": uma página por item |
| `tools[]` | `id`, `name`, `icon`, `description` (`string \| null`, uma linha) | cartucho "Ferramentas": lista |
| `hobbies[]` | `id` (`rubiks-cube`, `origami`, `chess`, `table-tennis`), `name` | objetos de hobby: só `aria-label`/`aria-live`, sem texto visível |
| `softSkills` | `displayed: false`, `items[]` (`id`, `name`, `level`) | **não exibido** nesta versão; dados preservados |

**"Onde usei"**: um projeto de `projects.json` entra na página de uma linguagem quando algum item de `projects[].tecnologias` é igual (sem diferenciar maiúsculas) a algum item de `languages[].matches`. Lista vazia → rótulo "nenhum projeto ainda" (i18n). Ao adicionar tecnologia nova a um projeto com nome diferente (ex.: "Spring Boot", "JS"), acrescente o alias em `matches` nos dois idiomas.

Campos `null` ou listas vazias: a UI omite a linha/seção (ex.: ferramenta sem `description` mostra só ícone + nome).

Ligação com a arte (`docs/arte/specs.md` §4): `hobby.cubo` = `rubiks-cube`, `hobby.origami` = `origami`, `hobby.xadrez` = `chess`, `hobby.raquete` = `table-tennis`.

## Esquema de `experiences.json` (caderno `journal`, M3)
Array de experiências; cada item é uma página dupla do caderno. Chaves em inglês, idênticas em PT e EN; tipo `Experience` em `src/content/index.ts`.

| Campo | Tipo | Traduzir? | Uso no painel |
|---|---|---|---|
| `id` | `string` (kebab-case, estável) | não | key/âncora da aba |
| `type` | `"work" \| "research"` | não | carimbo e cor da aba (rótulo vem do i18n) |
| `title` | `string` | sim | cargo (trabalho) ou título do projeto (pesquisa) |
| `organization` | `string` | não (nome próprio) | página esquerda |
| `program` | `string \| null` | sim | programa dentro da organização (ex.: "PIBIC"); em EN com explicação curta. `null` → omitir |
| `city` | `string` | sim | PT "Curitiba, PR"; EN "Curitiba, Brazil" |
| `start` | `"AAAA-MM"` | não | ordenação / datas estruturadas |
| `end` | `"AAAA-MM" \| null` | não | `null` = sem término (atual) |
| `period` | `string` | sim | texto exibido, já formatado ("Julho 2025 — Atual" / "Jul 2025 — Present") |
| `items[]` | `string[]` | sim | checklist da página direita |

**Ordem**: a ordem do array é a ordem de exibição — `start` mais recente primeiro (empate: `end` mais recente). A UI não reordena. Ao adicionar experiência, inserir na posição certa nos dois idiomas.

**"Atual"**: `end === null` significa em andamento sem data de término. Uma experiência com `end` no futuro (ex.: PIBIC até 2027-08) também está em andamento; se a UI quiser marcar "atual", deve comparar `start`/`end` com o mês corrente, não só checar `null`.

Migração (2026-11-08): `tipo`/`titulo`/`local`/`periodo`/`itens` → campos acima; `local` foi separado em `organization` + `program` + `city`.

## Formato sugerido para `awards.json`
```json
{ "titulo": "", "emissor": "", "data": "AAAA-MM", "tipo": "premio | certificado", "imagem": "assets/awards/<arquivo>.png", "link": null }
```
