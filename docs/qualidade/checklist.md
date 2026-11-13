# Checklist de qualidade

Rodado pelo `qa-a11y` ao fechar cada marco.

## Build
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` sem erros
- [ ] CI do GitHub Actions (`.github/workflows/ci.yml`) verde no último commit do `main`
- [ ] Console do navegador sem erros ao carregar, abrir e fechar painéis

## Funcional
- [ ] Todo interagível do registry: hover mostra tooltip, clique abre o painel certo
- [ ] Esc, botão e clique fora fecham o painel; câmera volta
- [ ] Troca PT ↔ EN atualiza HUD, tooltip e painel aberto

## Acessibilidade
- [ ] Tab alcança o menu de objetos e todos os botões; foco visível
- [ ] Enter abre; foco vai para o diálogo e volta ao fechar
- [ ] `prefers-reduced-motion`: sem zoom animado nem animações decorativas
- [ ] Contraste AA em textos de painel e HUD
- [ ] `lang` do `<html>` acompanha o idioma

## Mobile (375×812)
- [ ] Quarto visível sem scroll da página; pan/zoom por toque
- [ ] Interagíveis indicam que são tocáveis
- [ ] Painéis legíveis e fecháveis

## Performance
- [ ] JS total < 500 KB gzip; assets < 5 MB
- [ ] Primeira tela interativa < 3 s em 4G simulado
- [ ] FPS estável no quarto

## Registro por marco
| Marco | Data | Resultado | Observações |
|---|---|---|---|
| M0 | 2026-10-25 | Build ok; clique → painel → Esc verificado no navegador; console limpo | Checklist completo começa no M1 |
| M1 | 2026-10-31 | Aprovado com ressalvas (nenhum bloqueador) | Ver "Resultado M1" abaixo |
| M2 | 2026-11-01 | Aprovado com ressalvas (nenhum bloqueador) | Ver "Resultado M2" abaixo |
| M3 (caderno) | 2026-11-08 | Aprovado com ressalvas (nenhum bloqueador) | Ver "Resultado M3 — caderno" abaixo |
| M3 (cama + celular) | 2026-11-08 | Aprovado com ressalvas (nenhum bloqueador) | Ver "Resultado M3 — cama + celular" abaixo |
| M3 (fechamento) | 2026-11-13 | Aprovado com ressalvas (nenhum bloqueador) | Ver "Resultado M3 — fechamento" abaixo |

## Resultado M1 (vertical slice)

Ambiente: `pnpm dev` no navegador embutido (1280×800, 593×566 e 360×740). Com a aba oculta o rAF
do Phaser fica lento; os fluxos foram medidos avançando o loop com `__game.step()` em passos de 16 ms.

| Item | Resultado |
|---|---|
| typecheck / lint / test (31 testes) / build | ok |
| Console limpo após reload, abrir e fechar | ok |
| Hover → outline + tooltip; clique → zoom (zoom final inteiro) → painel | ok (só `computer` está no mapa) |
| Esc / botão X / clique fora fecham; câmera volta | ok |
| Esc dentro da pasta volta à lista, segundo Esc fecha | ok |
| Troca PT ↔ EN com painel aberto (título, X, status, menu, pasta continua aberta) | ok, testado via `i18n.changeLanguage`: o HUD fica atrás do backdrop |
| Tab chega ao menu de objetos e ao HUD; foco visível | ok |
| Enter abre; foco vai ao diálogo e volta ao item do menu | ok |
| Foco depois de fechar painel aberto com o mouse | vai para `body`; o próximo Tab cai no 1º item do menu (aceitável) |
| Foco preso no diálogo (Tab/Shift+Tab circulam) | ok |
| `prefers-reduced-motion`: zoom instantâneo (1 quadro) e sem `panel-pop` | ok |
| Contraste AA (texto) | ok: ink/panel 12.5, accent/panel 8.5, cyan/panel 7.4, border/accent 11.0, ink/#3d3058 9.9 |
| Contraste do indicador de foco do X (ink sobre a barra accent) | 1.47:1, abaixo de 3:1 (ressalva) |
| `lang` do `<html>` acompanha o idioma | ok |
| Mobile 360: quarto sem scroll, painel em tela cheia legível e fechável | ok (quarto fica em zoom 1, pequeno) |
| Pan/zoom por toque; indicação de tocável | não se aplica (M5) |
| JS total gzip < 500 KB | ok: 449 KB (phaser 354 + index 91 + ComputerPanel 4) |
| Assets < 5 MB | ok: `dist/` inteiro 1.7 MB |
| FPS estável | ok: ~60 fps no quarto |
| Primeira tela < 3 s em 4G | não medido |
| Casos de borda: menu → fechar → abrir `frames` durante o zoom-out (fila); duplo clique; resize com painel aberto; fallback de 1,5 s com o loop parado | ok |

## Resultado M2 (arte)

Ambiente: `pnpm dev`. Navegador embutido (aba oculta: loop avançado com `__game.step()`) e Playwright
(contextos novos por tamanho, `deviceScaleFactor` 1 e 1,25, `reducedMotion: 'reduce'`). Capturas em
`.playwright-mcp/m2/` (fora do git).

Testes novos: `tests/camera-room.test.ts` (`roomView`, `snapCenter`, `rectUnion`), `tests/period.test.ts`
(`periodAt`, `parsePeriod`, `pickTag` e `ui/closeup/period`), `tests/closeup.test.ts` (`pickCloseupLayout`,
`screenFontSize`, `parseCloseupSheet`, `parseOverlay`, `bootSequence`), `tests/assets.test.ts`
(`meta.quartoPixel` em todo JSON de `public/assets`, PNG do tamanho de `meta.size`, frames e tags
válidos, camadas com mesma âncora e canvas, todo sprite do `room.tmj` com PNG + JSON).
`tests/camera-iso.test.ts` atualizado para tile 64×32, mapa 7×7, image layer e sem tilesets.

| Item | Resultado |
|---|---|
| typecheck / lint / test (140 testes + 1 falha esperada) / build | ok |
| `?period=` day, dusk e night: tint MULTIPLY no quarto, luzes (`light-window`, `light-computer`, janela) fora do tint, luminária `off`/`on` | ok |
| Hover no computador: outline, cursor `pointer`, tooltip | ok |
| Clique: zoom animado (~320 ms) até zoom inteiro, centro alinhado ao pixel | ok (1920×1080: 3 → 4; 1366×768: 2 → 3) |
| Visão de perto 1920×1080 | modo A 6×, tela 1344×756, fonte 24 px |
| 1366×768 | modo A 4×, tela 896×504, fonte 16 px |
| 768×1024 | modo B 3×, tela 672×378, fonte 14 px |
| 375×812 e 360×740 | modo C, moldura 9-slice (bordas 2×), tela cheia, sem scroll horizontal |
| Painel cabe na tela do monitor sem transbordar (A/B/C) | ok |
| Boot `boot` → `on` (2 × 60 ms); variante noturna `boot-night`/`on-night` no período noite; entardecer usa a arte de dia | ok |
| Vapor da caneca (só sem reduced motion) | ok |
| Resize com a visão de perto aberta (A → C → A) | ok |
| Esc / X / clique fora fecham; câmera volta ao enquadramento do quarto | ok |
| Teclado: Tab → item do menu → Enter → foco na 1ª pasta → Enter → foco em "Voltar" → Esc → foco na pasta → Esc → foco volta ao item do menu | ok |
| Foco preso no diálogo | ok |
| Foco depois de fechar aberto com o mouse | vai para `body` (igual ao M1, aceitável) |
| Leitor de tela: `role=dialog`, `aria-modal`, `aria-labelledby` → "Meus Projetos"; ilustração e vapor com `alt=""`; links externos com "(abre em nova aba)" | ok |
| Fundo (canvas, menu, HUD) continua na árvore de acessibilidade com o diálogo aberto | ressalva (só `aria-modal`, sem `inert`; igual ao M1) |
| `prefers-reduced-motion`: zoom instantâneo, sem boot, sem `closeup-in`, sem vapor, sem animações do quarto, troca de período instantânea | ok |
| Contraste AA no fundo teal | ok: ink/teal-0 11.6, ink/teal-1 (hover) 7.9, ink/teal-2 (título) 5.8, accent/teal-0 7.9, cyan/teal-0 6.9, cyan/border 9.6, border/accent 11.0 |
| Indicador de foco do X (contorno `border` sobre a barra `teal-2`) | 2.77:1, abaixo de 3:1 (ressalva; era 1.47 no M1) |
| Troca PT ↔ EN com a visão de perto aberta (título, X, `lang`) | ok |
| Console limpo após reload, abrir e fechar | ok |
| Console ao destruir o jogo (`game.destroy`, acontece no HMR) | erro `removeInteractive` (bug baixo, ver relatório) |
| Pixel nítido em DPR 1: escala inteira, posições inteiras, `image-rendering: pixelated`, tamanho do jogo inteiro | ok |
| DPR 1,25 (1536×730, 951×601): tamanho do jogo inteiro e centro alinhado em px CSS (pendência do M1 resolvida) | ok |
| DPR 1,25: 1 px da arte = 2,5 px do aparelho (canvas em px CSS, ampliado pelo navegador) | ressalva: pixels alternam 2/3 px do aparelho; sem borrão |
| JS total gzip < 500 KB | ok: 456 KB (phaser 354 + index 99 + ComputerPanel 3,5) |
| Assets < 5 MB | ok: `dist/` inteiro 1,9 MB; maior PNG 15 KB |
| FPS estável | ok: 60 fps no quarto |
| Primeira tela < 3 s em 4G | não medido |

## Resultado M3 — prateleira (`bookshelf`), 2026-11-07

Ambiente: `pnpm dev` + Playwright (1920×1080, 1366×768, 960×604, 375×812; `?period=day|night`; `reducedMotion: 'reduce'`).
Capturas em `.playwright-mcp/m3/` (fora do git). Com a janela do Playwright em segundo plano o loop cai para 1 fps;
os fluxos de zoom foram refeitos com a página na frente (57–60 fps).

| Item | Resultado |
|---|---|
| typecheck / lint (1 aviso em `tools/art`) / test (161) / build | ok |
| JS gzip | ok: 470 KB (phaser 357 + index 84 + jsx-runtime 19 + BookshelfPanel 4,5 + locale 2,8 + ComputerPanel 1,3) |
| `dist/` | ok: 2,0 MB |
| Console limpo (abrir, fechar, trocar idioma, resize) | ok |
| Clique na prateleira pelo canvas → zoom → `object-open` da cena → visão de perto (Linguagens aberto, foco no livro) | ok |
| Hover no canvas: cursor `pointer` + tooltip "Estante — Habilidades"; monitor continua abrindo o computador | ok |
| Esc durante o zoom de entrada (canvas e menu): volta ao quarto, nenhum painel | ok |
| `focus-object` na fila durante o zoom-out (menu logo depois de fechar/cancelar) | **falha**: câmera presa em `zooming-in` no zoom do quarto; só o fallback de 1,5 s abre (sem zoom); se Esc antes, o quarto ignora cliques até outro Esc |
| Linguagens: sumário, ←/→, cantos, pular pelo sumário, "Onde usei", `aria-live` "Página n de 4" | ok |
| Foco depois de pular pelo sumário | **falha**: vai para `body` (o botão do sumário desmonta) |
| Idiomas (1 página dupla, sem cantos), Ferramentas (MOA sem descrição), 4 hobbies (←/→, setas, ciclo, `aria-live`) | ok |
| Item aberto deixa o vão; hover/foco sobe 4 px com contorno `gold-2`; noite com destaque em cores de dia | ok; confere com `m3-shelf4-closeup-sheet.png` |
| Sobreposição Linguagens × Idiomas (x 82–89 da arte): ganha Idiomas | ok na prática: nessa faixa quase tudo visível é a Idiomas; só a quina do topo da Linguagens cai na Idiomas |
| Anel de foco depois de clique de mouse (palco, setas, cantos) | não reproduz no Chromium: `:focus-visible` falso |
| Foco preso, Esc fecha, foco volta ao item do menu (aberto pelo teclado) | ok; aberto pelo mouse vai para `body` (igual ao M1) |
| PT ↔ EN com o painel aberto (título, botões, rótulos, `lang`) | ok |
| Escala/HUD: prateleira 5× em 1920 (y 90) e 3× em 1366 (y 114); computador 5× (1120×630) e 3× (672×378) | ok, HUD termina em y 52 |
| Modo texto: 959×700 e 960×603 → texto; 960×604 → cena | ok |
| 375×812: modo texto, sem rolagem horizontal, menor fonte 12 px, reduced motion sem animações | ok |
| Ordem de Tab no modo texto (conteúdo → Fechar → abas; visual: Fechar → abas → conteúdo) | ressalva |
| Rótulo do sumário "…Ir para a página" sem número | ressalva |

## Resultado M3 — caderno (`journal`), 2026-11-08

Ambiente: `pnpm dev` + Playwright (1920×1080, 1366×768, 1024×768, 1280×720, 1536×864, 1440×900, 1600×900,
2560×1440, 375×812; `?period=day|night`; `reducedMotion: 'reduce'`). Capturas em `.playwright-mcp/m3-journal/`
(fora do git). Trabalho ainda não commitado.

| Item | Resultado |
|---|---|
| typecheck / lint (8 avisos, todos em `tools/art`) / test (202) / build | ok |
| JS gzip | ok: ≈ 478 KB (phaser 357 + index 85 + jsx-runtime 19 + BookshelfPanel 4,1 + atlas 3,8 + JournalPanel 3,5 + locale 3,3 + ComputerPanel 1,3 + useSwipe 1,1) |
| `dist/` | ok: 2,1 MB |
| Console limpo (abrir, fechar, trocar idioma, resize, reduced motion) | ok |
| FPS no quarto | ok: 60 |
| Caderno no braço B, à frente do `computer` (profundidade 14,01); dia/noite conferem com `m3-journal-room.png` | ok |
| Hover no caderno: outline `gold-2` acima das luzes, cursor `pointer`, tooltip "Caderno — Experiência" | ok |
| Hover à noite: outline `gold-2` (244,184,96) sobre a poça da luminária (232,148,74), ≈ 1,4:1 | ressalva: pouco visível |
| Clique no caderno (inclusive na caneta) → zoom 3 → 8 → visão de perto; luminária, controle, mesa A/B, teclado, monitor → computador | ok |
| Esc durante o zoom (caderno e computador): volta ao quarto (zoom 3), sem painel; quarto continua clicável | ok |
| Visão de perto x coluna A de `m3-journal-closeup-sheet.png` (abas left/right-active/right, carimbo, cantos, pauta) | ok |
| Escala: 4× (16 px) em 1920×1080, 1536×864, 1600×900; 3× (14 px) em 1366×768, 1024×768, 1280×720, 1440×900; 6× (24 px) em 2560×1440 | ok |
| Página direita do Bradesco (PT, 4 itens) | **rola** em todas as escalas: 4× 504/496 px, 3× 399/372, 6× 756/744; EN cabe; PIBIC cabe |
| Abas: ↑/↓/←/→ com volta, Home/End, `aria-selected` + tabindex móvel, clique; `aria-live` "Página n de 2" | ok |
| Cantos: clique, hover destacado, `aria-disabled` na ponta (não vira) | ok |
| Swipe por toque/caneta (mouse não arrasta, por projeto) | ok |
| Selo "Atual" em PIBIC (07/2026–08/2027) e Bradesco (07/2025–) com data de 2026-11 | ok |
| Teclado (aberto pelo menu): foco na página dupla → cantos → Fechar → aba ativa → (região "O que fiz" quando rola) → volta; Esc devolve o foco ao item do menu | ok |
| Foco depois de fechar aberto pelo canvas | vai para `body` (igual ao M1–M3, menor) |
| Nomes acessíveis: abas "Tipo: título, organização", cantos, carimbo `role=img` "Carimbo: Trabalho", região só quando rola | ok |
| Contraste no papel `#f6f2ec`: corpo `#1f4a5c` 8,6 (5,8 sobre a pauta `#8fd3e8`), título `#2f2c3a` 12,2; selo "Atual" sobre `cream-2` 10,5; tinta do tipo (só borda/quadradinho): trabalho 5,4, pesquisa 4,4 | ok |
| PT ↔ EN com o painel aberto (título, abas, cantos, carimbo, datas "Jul 2025 — Present", `lang`) | ok |
| 375×812: modo texto, sem rolagem horizontal, menor fonte 13,6 px, reduced motion sem animações | ok |
| Dígito "5" igual a "S" ("Julho 202S", "7S" na prateleira, "S itens" no computador) | ressalva: é o desenho da Pixelify Sans (woff2 oficial v3 do Google Fonts carregado, sem fallback); a 16 px o "C" também vira "O" ("Ouritiba", "PUOPR") |
| Regressão: prateleira e computador (menu → abrir → foco → Esc → foco no item) | ok |

## Resultado M3 — cama + celular (`phone`), 2026-11-08

Ambiente: `pnpm dev` + Playwright (1920×1080, 1366×768, 375×812, 360×740; `?period=day|dusk|night`; PT e EN;
`reducedMotion: 'reduce'`). Capturas em `.playwright-mcp/m3-phone/` (fora do git). Trabalho ainda não commitado.

| Item | Resultado |
|---|---|
| typecheck / lint (só avisos em `tools/art`) / test (224) / build | ok |
| JS gzip | ok: ≈ 483 KB (phaser 357 + index 86,5 + jsx-runtime 19 + BookshelfPanel 4,1 + atlas 3,8 + JournalPanel 3,5 + locale 3,5 + PhonePanel 2,6 + ComputerPanel 1,3 + skills 0,9) |
| `dist/` | ok: 2,0 MB |
| Console limpo (abrir, fechar, trocar idioma, 8 combinações de tamanho × período, reduced motion) | ok |
| Cama (decor) e celular no lugar; sombra de contato; dia, entardecer e noite coerentes com a luz (`light-phone` à noite/entardecer) | ok |
| Clique na cama: nada acontece (sem hover, sem painel, zoom 3) | ok |
| Hover no celular: outline dourado visível de dia e à noite, cursor `pointer`, tooltip "Celular — Contato" | ok |
| Clique no celular → zoom 3 → 8 → visão de perto; Esc durante o zoom volta ao quarto sem painel | ok |
| Menu de objetos (Tab → "Celular — Contato" → Enter) abre; Esc devolve o foco ao item do menu | ok |
| Visão de perto 1920×1080 / 1366×768 / 375×812: modo cena, sem rolagem horizontal, botões dentro da tela, menor fonte 13,6 / 12 / 12 px | ok |
| 360×740: modo texto, menor fonte 16 px, sem rolagem horizontal; EN completo | ok |
| Links: `mailto:daviknatume@gmail.com`; LinkedIn, GitHub e `wa.me/5541997346514` com `target=_blank` e `rel="noopener noreferrer"`; nomes dizem "em nova aba" | ok |
| Currículo PT/EN: `aria-disabled`, `aria-describedby` → "Currículo indisponível por enquanto", focáveis, "Em breve" visível | ok |
| Ordem de Tab: e-mail, LinkedIn, GitHub, WhatsApp, PT, EN, Fechar; foco preso (cicla); foco inicial no e-mail (cena) | ok |
| Foco visível: cena = frame de hover da arte no ícone; modo texto = contorno azul 2,7 px | ok |
| Modo texto: foco inicial vai ao próprio diálogo (não ao 1º link) | ressalva (menor, anuncia o título) |
| Contraste: nome 12,2, cargos `#1f4a5c` ≈ 8,6, rótulos `#4a4659` ≥ 7 sobre o papel; "PT"/"EN" sobre o bege do botão desativado ≈ 4,9 (exceção de componente desativado) | ok |
| `prefers-reduced-motion`: zoom instantâneo, sem animações no DOM | ok |
| PT ↔ EN (feito com o painel fechado; HUD fica atrás do backdrop, como no M1) e `lang` | ok |
| Nome acessível de "PT"/"EN" ("Baixar currículo em português/inglês (PDF)") não contém o texto visível (WCAG 2.5.3 Label in Name, nível A) | ressalva, severidade baixa a média (ver relatório) |
| Dígitos e letras da Pixelify ("Ouritiba", "Oontato", "Oelular") | ressalva já conhecida (C vira O a 16 px) |

## Resultado M3 — fechamento (7 objetos + período), 2026-11-13

Ambiente: `pnpm dev` + navegador embutido do app (o MCP playwright estava travado por outra instância; viewports
emulados 1920×1080, 1366×768 e 390×844; cliques no canvas por eventos de mouse sintéticos, menu por `click()`).
O pane roda a ~25 fps, então FPS e tempo de carga não foram medidos. `prefers-reduced-motion` não foi exercitado
ao vivo (sem emulação de mídia); só conferido no código (`global.css`, `DayNight.ts`, `motion.ts`, `closeup/hooks.ts`)
e nos testes dos marcos anteriores.

| Item | Resultado |
|---|---|
| typecheck / lint (só avisos em `tools/art`) / test (307, +15 em `tests/m3-content.test.ts`) / build | ok |
| JS gzip | ressalva: ≈ 498 KB (phaser 357 + index 89 + jsx-runtime 19 + BookshelfPanel 4,6 + atlas 3,9 + JournalPanel 3,8 + demais ≈ 21); sem folga para a meta de 500 KB |
| `dist/` | ok: 3,9 MB (era 2,0 MB no M3 anterior; áudio/sprites novos), meta < 5 MB |
| Console (carregar, abrir 7 objetos, fechar, PT↔EN, 3 períodos, 3 tamanhos) | ok: zero erros |
| Clique no canvas abre o painel certo (computador, quadros, estante, caderno, celular, headset, controle) a 1366×768 | ok; cursor `pointer` no hover; câmera volta a zoom 2 ao fechar |
| Menu de teclado/botões: abrir os 7 em 1366, 1920 e 390 | ok: diálogo com o título certo, foco dentro, Esc fecha, foco volta ao botão do menu |
| Zoom ao abrir: 1366 → 5×–8× (zoom de quarto 2); 1920: quarto em zoom 3 | ok |
| PT → EN com os 7 painéis: títulos, HUD e `lang="en"` | ok |
| Botão de período: Noite → Dia → Tarde → Noite, rótulo acessível "X. Mudar para Y" | ok |
| 390×844: diálogo cobre a tela, sem rolagem horizontal, botão Fechar visível e funcional nos 7, menor fonte 12 px (celular), 12,8 (computador) | ok |
| Setas do headset a 390: dentro da tela (24–72 e 336–384 px) | ok |
| Elementos da cena (sprites de fundo) mais largos que a tela a 390 (celular/headset/controle) | ok: recorte intencional, sem rolagem da página |
| Retrato e pet aparecem no menu de objetos | fora do M3 (M6); conferir o que o painel mostra em M6 |

### Pendências
| Pendência | Severidade | Responsável | Marco |
|---|---|---|---|
| JS gzip em 498 KB: qualquer feature nova estoura 500 KB. Separar `jsx-runtime`/locale, avaliar `phaser` customizado (tree-shake de módulos não usados) | média | `scene-engineer` + `ui-engineer` | M4 |
| EN ainda cai para PT em `projects`, `about` e `extras` (painel do computador em EN mostra projetos em PT) | média | `content-curator` | M4 |
| `prefers-reduced-motion` e FPS reais não verificados nesta rodada (playwright MCP indisponível) | média | `qa-a11y` | M4 (repetir com Playwright) |
| CI do GitHub Actions não consultado | baixa | orquestradora | M4 |
| Ressalvas abertas de M1–M3: foco volta ao `body` quando fechado pelo mouse; foco após pular pelo sumário; `inert` no fundo; contraste do foco do X (2,77:1); nome acessível de PT/EN do currículo (WCAG 2.5.3); Pixelify "5"≈"S" e "C"≈"O" | baixa | `ui-engineer` (foco, `inert`, rótulo), `art-director` (fonte) | M5 |
| Pan/zoom por toque e indicação de tocável no mobile | média | `scene-engineer` | M5 |
| Avisos de lint em `tools/art/**` (variáveis não usadas) | baixa | `art-director` | M5 |
