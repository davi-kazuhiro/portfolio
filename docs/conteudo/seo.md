# Textos de SEO e compartilhamento (M5)

> **Aprovado pelo Davi em 2026-11-14: recomendação principal** (PT no HTML estático, EN trocado no cliente). As alternativas A/B ficam só como histórico.

Mantido pelo `content-curator`. O Davi escolheu a recomendação principal; a orquestradora/`ui-engineer` aplica no `index.html` e no manifest.

Fatos usados (todos de `profile.json` e `about.json`): estudante de Ciência da Computação (PUCPR), estagiário de desenvolvimento de software, pesquisa em detecção de fraudes, objetivo em Engenharia de IA. Contagens de caracteres conferidas à mão (title ≤ 60, description ≤ 155).

## Recomendação principal

### PT (vai no HTML estático)
| Campo | Texto | Caracteres |
|---|---|---|
| `title` | Davi Natume · Estagiário de Software e Pesquisador | 50 |
| `meta description` | Davi Natume, estudante de Ciência da Computação e estagiário de software. Explore meu portfolio num quarto em pixel art: cada objeto abre uma parte. | 148 |
| `og:title` | Davi Natume · Estagiário de Software e Pesquisador | 50 |
| `og:description` | Explore meu quarto em pixel art: projetos, pesquisa, experiência e contato de Davi Natume, estagiário de software. | 115 |
| `og:image:alt` | Quarto em pixel art isométrico com computador, prateleira, caderno e celular, cada um abrindo uma parte do portfolio. | 117 |

### EN
| Campo | Texto | Caracteres |
|---|---|---|
| `title` | Davi Natume · Software Dev Intern & Researcher | 46 |
| `meta description` | Davi Natume, computer science student and software intern. Explore my portfolio in a pixel art room: every object opens a section. | 130 |
| `og:title` | Davi Natume · Software Dev Intern & Researcher | 46 |
| `og:description` | Explore my pixel art room: projects, research, experience and contact for Davi Natume, software intern. | 104 |
| `og:image:alt` | Isometric pixel art room with a computer, bookshelf, notebook and phone, each opening a section of the portfolio. | 114 |

### PWA / manifest
| Campo | PT | EN |
|---|---|---|
| `name` | Davi Natume · Portfolio | Davi Natume · Portfolio |
| `short_name` | Davas | Davas |
| `description` | mesma `meta description` do idioma | idem |

O manifest é um arquivo único (não troca por idioma): usar a versão PT, ou a neutra acima, que já serve aos dois. `short_name` "Davas" é o apelido da porta do quarto (máx. ~12 caracteres no ícone).

## Alternativas em PT (para escolher)

**Alternativa A** (destaca a pesquisa)
- `title`: Davi Natume · Software, IA e Pesquisa em Fraudes (48)
- `description`: Estudante de Ciência da Computação (PUCPR), estagiário de software e pesquisador em detecção de fraudes. Entre no meu quarto em pixel art e explore. (148)

**Alternativa B** (destaca o quarto/apelido)
- `title`: Davas (Davi Natume) · Portfolio em pixel art (44)
- `description`: Quarto em pixel art isométrico que é o portfolio do Davi Natume: projetos, pesquisa e experiência em software. Clique nos objetos e explore. (140)

Observação: a Alternativa A cita "IA" no title porque é o objetivo declarado no `profile.json` (estágio em Engenharia de IA), não uma experiência já exercida; se preferir não prometer isso, use a recomendação principal ou a B.

## Qual idioma vai no HTML estático
- **PT**, com `<html lang="pt-BR">`. Crawlers e prévias (WhatsApp, LinkedIn, Slack, Discord) leem só o HTML, sem rodar JS, e o público principal e os recrutadores locais usam PT. O título e a descrição EN ficam no i18n/JS: o cliente atualiza `document.title` e a `meta description` quando detecta EN, o que ajuda quem abre o site, mas não as prévias.
- **`hreflang`: não vale a pena agora.** Há uma só URL para os dois idiomas; `hreflang` serve para URLs distintas por idioma (ex.: `/en/`). Pode-se acrescentar só `<meta property="og:locale" content="pt_BR">` e `og:locale:alternate` `en_US`. Se um dia houver `/en/` com HTML próprio, aí sim `hreflang` + `canonical` por idioma.
- Se o Davi quiser prévia em inglês para recrutadores internacionais, a saída é um link separado (ex.: `?lang=en` com HTML estático próprio), o que exige pré-renderização; fica como decisão futura, não do M5.

## Notas para quem aplicar
- `og:image` precisa de arquivo próprio (referência comum: 1200×630 px, PNG) e `og:url` = https://davi-kazuhiro.github.io/portfolio/. O texto de `og:image:alt` acima vale para essa imagem; se a imagem mostrar outra composição, ajustar o alt.
- Ver pendência 32 em [pendencias.md](pendencias.md).
