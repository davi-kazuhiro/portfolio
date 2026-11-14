import { test, expect, visited, dialog, openByMenu, waitRoom, type Page } from './fixtures'

const langBtn = (page: Page) => page.getByRole('button', { name: /^(English|Português)$/ })
const soundBtn = (page: Page) => page.getByRole('button', { name: /^Som:|^Sound:/ })

test.describe('idioma e som', () => {
  test('troca PT/EN muda html[lang], título e textos, e é lembrada após reload', async ({ page }) => {
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
    const ptTitle = await page.title()
    await expect(page.locator('nav.objects-menu')).toHaveAttribute('aria-label', 'Objetos do quarto')

    await langBtn(page).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect.poll(() => page.title()).not.toBe(ptTitle)
    expect(await page.title()).toContain('Software Dev Intern')
    await expect(page.locator('nav.objects-menu')).toHaveAttribute('aria-label', 'Room objects')

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect.poll(() => page.title()).toContain('Software Dev Intern')
    expect(await page.evaluate(() => localStorage.getItem('quartoPixel.lang'))).toBe('en')
  })

  test('trocar o idioma com um painel aberto atualiza o painel', async ({ page, isMobile }) => {
    test.skip(isMobile, 'em telas pequenas o HUD fica escondido dentro do diálogo (global.css, .hud--dialog)')
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    await openByMenu(page, 'computer')
    const before = await dialog(page).innerText()
    await dialog(page).getByRole('button', { name: /^English$/ }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect.poll(() => dialog(page).innerText()).not.toBe(before)
  })

  test('som vem desligado por padrão e a escolha é lembrada', async ({ page }) => {
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    await expect(soundBtn(page)).toHaveText('Som: desligado')
    await soundBtn(page).click()
    await expect(soundBtn(page)).toHaveText('Som: ligado')
    expect(await page.evaluate(() => localStorage.getItem('quartoPixel.muted'))).toBe('false')
    await page.reload()
    await expect(soundBtn(page)).toHaveText('Som: ligado')
  })
})
