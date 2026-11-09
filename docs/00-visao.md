# Visão do projeto

## Pitch
Em vez de rolar uma página, o visitante **entra no meu quarto**: uma cena em pixel art isométrica, como o menu de um jogo. Cada objeto conta uma parte da minha história — o computador mostra meus projetos, os quadros na parede guardam prêmios e certificados, o retrato fala de mim e da minha família.

## Público
1. **Recrutadores e gestores técnicos** (prioridade): precisam achar projetos, experiência e contato em menos de 1 minuto, inclusive no celular.
2. Colegas, professores e comunidade: exploram com calma, descobrem easter eggs.

Consequência: a experiência é lúdica, mas **nunca esconde o essencial**. Tooltip no hover, menu acessível por teclado, objetos com destaque pulsante e carregamento rápido.

## Definições
| Tema | Decisão |
|---|---|
| Visão | Isométrico 2D, câmera fixa com zoom/pan |
| Assets | Arte própria gerada por código (`tools/art/`), estilo isométrico tipo Habbo, tile 64×32 — ver [ADR 0005](adr/0005-arte-propria-gerada-por-codigo.md) |
| Idiomas | PT-BR (padrão) + EN, com toggle |
| Interação | Zoom da câmera no objeto + UI temática por objeto |
| Extras | Porta do quarto como tela de entrada (abre para revelar o quarto), música + SFX (mudo por padrão), dia/noite pelo horário real, avatar/pet animado |
| Mobile | Mesmo quarto, pan/zoom por toque, objetos com brilho pulsante |
| Deploy | A definir (GitHub Pages ou Vercel); build estático com `base: './'` |
| Extensibilidade | Novo objeto = Tiled + registry + painel + conteúdo |

## Objetos
| Objeto (`id`) | Conteúdo | UI temática |
|---|---|---|
| Computador (`computer`) | Projetos | Desktop retrô com janelas/pastas |
| Quadros (`frames`) | Prêmios e certificados | Moldura ampliada com galeria |
| Retrato (`portrait`) | Sobre mim e família | Porta-retrato com texto |
| Estante (`bookshelf`) | Skills e ferramentas | Livros/cartuchos que abrem fichas |
| Caderno (`journal`) | Experiência e formação | Diário com páginas e abas nomeadas (Pesquisa, Trabalho, Formação) |
| Celular (`phone`) | Contato + currículo | Tela de celular |
| Pet (`pet`) | Easter egg | Balão de diálogo |

## Fora de escopo (por enquanto)
Backend, CMS, analytics com cookies, multiplayer, personagem andando pelo quarto com teclado.
