import { test, expect, firstVisit, visited, enterButton, dialog, openByMenu, waitRoom, OBJECTS } from './fixtures'

// Só no projeto mobile (390×844, toque).
test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'só no projeto mobile')

  test('toque na porta entra no quarto', async ({ page }) => {
    await firstVisit(page)
    await page.goto('/')
    await expect(enterButton(page)).toBeAttached()
    const { width, height } = page.viewportSize()!
    await page.touchscreen.tap(width / 2, height / 2)
    await expect(enterButton(page)).toHaveCount(0, { timeout: 10_000 })
  })

  test('a página não rola na horizontal e o diálogo cabe na tela', async ({ page }) => {
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    const overflowX = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(await overflowX()).toBeLessThanOrEqual(0)
    for (const id of OBJECTS) {
      await openByMenu(page, id)
      expect(await overflowX(), `${id}: rolagem horizontal da página`).toBeLessThanOrEqual(0)
      const box = await dialog(page).boundingBox()
      const vp = page.viewportSize()!
      expect(box, `${id}: diálogo visível`).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(-1)
      expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width + 1)
      await page.keyboard.press('Escape')
      await expect(dialog(page)).toHaveCount(0)
    }
  })

  test('visão de perto ocupa a tela e fecha pelo botão', async ({ page }) => {
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    await openByMenu(page, 'journal')
    const box = (await dialog(page).boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - 2)
    await dialog(page)
      .getByRole('button', { name: /Fechar|Close/ })
      .first()
      .click()
    await expect(dialog(page)).toHaveCount(0)
  })
})
