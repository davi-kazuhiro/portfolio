# ADR 0008 — Deploy no GitHub Pages

- **Status:** aceito (2026-11-13)

## Contexto
O roadmap deixava em aberto a plataforma de deploy (GitHub Pages × Vercel) até o M5. O site é 100% estático (`dist/` ≈ 4 MB, sem backend nem rotas no servidor) e o repositório já tem CI no GitHub Actions. Foram comparados GitHub Pages, Vercel, Netlify e Cloudflare Pages.

## Decisão
- Publicar no **GitHub Pages**, com deploy por GitHub Actions (job de deploy depois de lint, testes e build, só na `main`).
- Se o endereço for `usuario.github.io/<repo>`, o Vite usa `base: '/<repo>/'`; com domínio próprio ou repositório `usuario.github.io`, `base` fica `/`. Todos os caminhos de assets devem ser relativos ao `base`.
- **Alternativa se precisar:** Cloudflare Pages (prévia por branch/PR, cabeçalhos de cache configuráveis, tráfego ilimitado no plano grátis). O build não muda, então migrar custa pouco.

## Consequências
- Tudo fica no GitHub, sem conta externa nem configuração extra; HTTPS e domínio próprio grátis. Limites (1 GB por site, ~100 GB/mês de tráfego) muito acima do uso de um portfolio.
- Sem prévia por branch: as propostas de arte continuam sendo vistas localmente ou por screenshot.
- Sem cabeçalhos próprios: o Pages usa cache de 10 min, então visitas de volta revalidam PNGs e WAVs (respostas 304, sem baixar de novo). Aceitável para um portfolio.
- Sem formulário de contato hospedado: o contato continua pelos links do celular (`phone`).
