# Specs de sprites (M2 e M3)

Mantido pelo agente `art-director`. Grid, paleta, regras de desenho, formato de arquivo e âncoras: [biblia-de-arte.md](biblia-de-arte.md). Posições no quarto: [planta-do-quarto.md](planta-do-quarto.md).

Convenções desta página:
- Coordenadas do quarto em **unidades do gerador** (8 unidades = 1 tile; em z, 1 unidade = 2 px), porque é assim que o gerador desenha. Caixas no formato `[x0, x1, y0, y1, z0, z1]`.
- Cenas frontais (porta, visão de perto) em **px da ilustração a 1×**, origem no canto superior esquerdo; retângulos como `x, y, w, h`.
- Tamanhos de canvas marcados com ≈ são estimativas da projeção. O valor exato (e o `pivot`) é o que o gerador grava no JSON.

## Índice
Cada objeto tem o seu arquivo em `docs/arte/specs/`. Leia só o do objeto em que está trabalhando (referências como "specs.md §4" no código apontam para a linha da tabela abaixo). Objeto novo do M3 em diante ganha um arquivo novo aqui, com a margem de sangria da §3 ("Tela cheia").

| Seção | Arquivo |
|---|---|
| §1 | [Grupo do computador: mesa em L (quarto, M2)](specs/1-computador-quarto.md) |
| §2 | [Porta do quarto (cena `Entrance`, spec no M2, implementação no M4)](specs/2-porta.md) |
| §3 | [Visão de perto do computador (M2)](specs/3-closeup-computador.md) |
| §4 | [Prateleira (M3) — aprovada (2026-11-07)](specs/4-prateleira.md) |
| §5 | [Caderno (M3) — aprovado (2026-11-08); revisão de 2026-11-09 (formação + abas com nome) aprovada](specs/5-caderno.md) |
| §6 | [Cama e celular (M3) — aprovados (2026-11-08)](specs/6-cama-celular.md) |
| §7 | [Quadros (M3) — aprovados (A, galeria) em 2026-11-09](specs/7-quadros.md) |
