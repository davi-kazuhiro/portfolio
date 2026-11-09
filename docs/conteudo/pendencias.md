# Pendências de conteúdo

O que ainda precisa vir do Davi. Mantido pelo `content-curator`.

| # | Item | Para | Marco | Status |
|---|---|---|---|---|
| 1 | Lista de prêmios e certificados (título, emissor, data) + imagem/PDF de cada | quadros (`awards.json`) | M3 | ⏳ |
| 2 | Texto sobre a família e o que pode aparecer (nomes? fotos? só descrição?) | retrato (`about.familia`) | M3 | ⏳ |
| 3 | Descrição do avatar (cabelo, roupa, óculos...) | sprite do avatar | M2 | ⏳ |
| 4 | Existe um pet real? Espécie, cor, nome | sprite e frases do pet | M2 | ⏳ |
| 5 | Currículo em PDF (PT e EN) | celular | M3 | ⏳ |
| 6 | Prints ou GIFs dos projetos | computador | M3 | ⏳ |
| 7 | Aprovar tradução EN | todos | M3 | ⏳ |
| 8 | Escolher asset pack entre as opções do `art-director` | arte | M2 | ⏳ |
| 11 | Sistema de Chamadas: avisar quando houver demo ou repositório público para o campo `link` (hoje `null`) | computador | M3 | ⏳ aguardando |
| 13 | Contexto e ano de cada projeto (disciplina, extensão, pessoal) e o que foi responsabilidade sua dentro da equipe, se quiser mostrar no painel | computador | M3 | ⏳ |
| 14 | Criar `src/content/en/*.json` espelhando o PT (hoje `index.ts` usa PT como fallback para EN). Em EN, explicar "projeto de extensão" (university outreach project). **Feito: `en/skills.json`, `en/experiences.json`.** Faltam os outros 6 | todos | M3 | ⏳ parcial |
| 15 | **Rascunho para revisar** — descrição do Git (uma linha). PT: "Controle de versão nos meus projetos e repositórios no GitHub." EN: "Version control for my projects and GitHub repositories." | prateleira (`skills.tools`) | M3 | ✏️ rascunho |
| 16 | **O que é o MOA e como você usa?** Não há menção no conteúdo atual (`description` está `null`). Hipótese a confirmar: Massive Online Analysis, framework Java de mineração de fluxos de dados, usado no PIBIC. Se for isso, rascunho PT: "Framework de mineração de fluxos de dados que uso na pesquisa de iniciação científica." EN: "Data stream mining framework I use in my undergraduate research (PIBIC)." Confirmar também o ícone (hoje `chart`, provisório) | prateleira (`skills.tools`) | M3 | ❓ pergunta |
| 17 | **Onde mostrar as soft skills, se em algum lugar?** Saíram da prateleira por decisão sua; os dados continuam em `skills.softSkills` com `displayed: false` | a definir | M3 | ❓ pergunta |
| 18 | Idiomas: certificados (nome, emissor, ano) e/ou onde usa cada idioma (`spokenLanguages[].certificates` / `usage`, hoje vazios). Opcional. Se quiser barra de nível, dizer o número (não foi inventado) | prateleira (livro Idiomas) | M3 | ⏳ opcional |
| 19 | "Onde usei" lista só projetos: Java e Spring ficam com "nenhum projeto ainda", embora Java apareça no estágio no Bradesco. Quer que a página cite também experiências? Algum projeto com Java/Spring para entrar no portfolio? | prateleira (livro Linguagens) | M3 | ❓ pergunta |
| 20 | **Revisar a tradução EN do caderno** (`en/experiences.json`). Pontos de atenção: "reduzindo rotinas de consultas em 80%" → "cutting query routines by 80%" (o 80% é de tempo, de quantidade de rotinas ou de esforço? se puder, deixar explícito nos dois idiomas); PIBIC em EN = "PIBIC (undergraduate research program)"; cidade em EN = "Curitiba, Brazil" | caderno (`journal`) | M3 | ✏️ rascunho |
| 21 | PIBIC: qual o seu papel para aparecer na página (ex.: bolsista de iniciação científica, voluntário)? Orientador(a) pode aparecer? Hoje a página mostra só o título do projeto. Período "Julho 2026 — Agosto 2027" mantido (em andamento; término previsto) — confirmar se as datas ainda valem | caderno (`journal`) | M3 | ❓ pergunta |
| 22 | Bradesco: os itens estão no passado ("Desenvolvi...") e o PIBIC em substantivos ("Estudo de..."). Quer padronizar (ex.: PIBIC em 1ª pessoa no presente: "Estudo benchmarks...")? Não alterado sem sua aprovação | caderno (`journal`) | M3 | ❓ pergunta |
| 23 | `extras.json` (Maratona SBC) também está mapeado para "estante / caderno": deve aparecer no caderno como outro tipo de página? Se sim, com período e local | caderno / estante | M3 | ❓ pergunta |

Observação: `profile.json` contém o telefone pessoal (veio do site antigo). Confirmar se deve continuar público.

## Resolvido
- 2026-11-08, caderno (`journal`): `experiences.json` migrado para chaves em inglês (`id`, `type` work/research, `title`, `organization`, `program`, `city`, `start`, `end`, `period`, `items`), ordem por início mais recente (PIBIC primeiro). `en/experiences.json` criado e ligado no `index.ts` (tipo `Experience`). Nenhum fato novo; textos PT inalterados. Esquema em [guia-de-conteudo.md](guia-de-conteudo.md).
- M1: revisão de `projects.json` (ortografia, clareza, frases curtas; "microPython" → "MicroPython"; operações de conjuntos em minúsculas; título "Controle de Estoque da ONG"). Tecnologias preenchidas a partir do próprio texto: Beat Learning (Processing), Bebedouro (MicroPython, ESP32, Wokwi, SolidWorks), Organizador de Arquivos e Calculadora de Conjuntos (Python). Formato e nomes de campos inalterados.
- 2026-11-07, prateleira aprovada: `skills.json` reestruturado em `languages` (com `matches` para o "Onde usei"), `spokenLanguages`, `tools`, `hobbies` e `softSkills` (não exibido). Nomes dos 4 hobbies em PT/EN. Esquema em [guia-de-conteudo.md](guia-de-conteudo.md).
- 2026-10-31, respostas do Davi: Controle de Estoque da ONG usa HTML, CSS, JavaScript e MySQL (#9); todos os projetos foram feitos em equipe, agora dito em cada descrição (#10); Sistema de Chamadas ainda sem demo (#11 segue aguardando); Bebedouro Inteligente removido da lista de projetos (#12 descartada).
