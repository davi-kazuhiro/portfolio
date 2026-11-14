import { test, expect, firstVisit, visited, enterButton, menuButton, dialog, waitRoom, OBJECTS } from './fixtures'

test.describe('porta de entrada', () => {
  test('primeira visita abre na porta e o clique no centro entra no quarto', async ({ page }) => {
    await firstVisit(page)
    await page.goto('/')
    await expect(enterButton(page)).toBeAttached()
    const { width, height } = page.viewportSize()!
    await page.mouse.click(width / 2, height / 2)
    await expect(enterButton(page)).toHaveCount(0, { timeout: 10_000 })
    await expect.poll(() => page.evaluate(() => localStorage.getItem('quartoPixel.visited'))).toBe('1')
  })

  test('Tab até "Entrar no quarto" + Enter entra e o foco continua no menu de objetos', async ({ page, isMobile }) => {
    test.skip(isMobile, 'fluxo de teclado')
    await firstVisit(page)
    await page.goto('/')
    await expect(enterButton(page)).toBeAttached()
    await page.keyboard.press('Tab')
    await expect(enterButton(page)).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(enterButton(page)).toHaveCount(0, { timeout: 10_000 })
    await expect(page.locator('.objects-menu button').first()).toBeFocused()
  })

  test('menu de objetos na porta abre o objeto direto', async ({ page }) => {
    await firstVisit(page)
    await page.goto('/')
    await expect(enterButton(page)).toBeAttached()
    await menuButton(page, 'computer').focus()
    await page.keyboard.press('Enter')
    await expect(dialog(page)).toBeVisible({ timeout: 10_000 })
    await expect(enterButton(page)).toHaveCount(0)
  })

  test('visita repetida pula a porta', async ({ page }) => {
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    await expect(menuButton(page, OBJECTS[0])).toBeAttached()
  })

  test('prefers-reduced-motion entra no quarto sem animação', async ({ page, isMobile }) => {
    test.skip(isMobile, 'fluxo de teclado')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await firstVisit(page)
    await page.goto('/')
    await expect(enterButton(page)).toBeAttached()
    await enterButton(page).focus()
    const t0 = Date.now()
    await page.keyboard.press('Enter')
    // Com animação a travessia leva > 1 s (porta + zoom + clarão); sem, é um corte.
    await expect(enterButton(page)).toHaveCount(0, { timeout: 5_000 })
    expect(Date.now() - t0).toBeLessThan(1_500)
  })
})
