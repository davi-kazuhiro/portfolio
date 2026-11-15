import AxeBuilder from '@axe-core/playwright'
import { test, expect, visited, firstVisit, dialog, openByMenu, menuButton, OBJECTS } from './fixtures'

// Navegador sem WebGL (M6): sem Phaser; imagem estática do quarto + menu de objetos visível.
// Só no projeto desktop (Chromium com WebGL desligado; `launchOptions` só vale no topo do arquivo).
test.use({ launchOptions: { args: ['--disable-webgl', '--disable-webgl2'] } })

test.describe('sem WebGL', () => {
  test.skip(({ isMobile }) => isMobile, 'só no projeto desktop')

  test('imagem e menu visíveis; computador abre e fecha; axe limpo', async ({ page }) => {
    await visited(page)
    await page.goto('/')
    await expect(page.locator('.game-canvas')).toHaveAttribute('data-renderer', 'unavailable')
    await expect(page.locator('canvas')).toHaveCount(0)

    const img = page.locator('.room-fallback__img')
    await expect(img).toBeVisible()
    expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)

    await expect(page.getByText(/Seu navegador não mostra o quarto animado/)).toBeVisible()
    for (const id of OBJECTS) await expect(menuButton(page, id)).toBeVisible()
    // Sem porta nem dica "Entrar"; o HUD mantém só o idioma.
    await expect(page.getByRole('button', { name: /Entrar no quarto/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'English' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Som:/ })).toHaveCount(0)

    const { violations } = await new AxeBuilder({ page }).setLegacyMode().withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([])

    // Clique (ponteiro) abre o computador; Esc fecha e o foco volta ao item do menu.
    await menuButton(page, 'computer').click()
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page).getByText(/^(Carregando|Loading)\.\.\.$/)).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toHaveCount(0)
    await expect(menuButton(page, 'computer')).toBeFocused()

    // Teclado: abre de novo e fecha pelo botão.
    await openByMenu(page, 'computer')
    await dialog(page).getByRole('button', { name: /Fechar|Close/ }).first().click()
    await expect(dialog(page)).toHaveCount(0)
  })

  test('primeira visita também cai direto no menu (sem porta)', async ({ page }) => {
    await firstVisit(page)
    await page.goto('/')
    await expect(page.locator('.room-fallback__img')).toBeVisible()
    await expect(menuButton(page, 'journal')).toBeVisible()
    await openByMenu(page, 'journal')
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toHaveCount(0)
  })
})
