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

## Formato sugerido para `awards.json`
```json
{ "titulo": "", "emissor": "", "data": "AAAA-MM", "tipo": "premio | certificado", "imagem": "assets/awards/<arquivo>.png", "link": null }
```
