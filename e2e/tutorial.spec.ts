import { test, expect, visited, waitRoom } from './fixtures'

test.describe('tutorial em diálogo (A4)', () => {
  test('abre na 1ª visita, mostra setas e destaques, fecha e reabre pelo "?"', async ({ page }) => {
    await visited(page, { 'quartoPixel.tutorial': '' })
    await page.goto('/')
    await waitRoom(page)
    const box = page.locator('.tutorial')
    await expect(box).toBeVisible({ timeout: 10_000 })
    await expect(box).toContainText('Bem-vindo ao meu quarto!')
    const next = page.locator('.tutorial__next')
    await expect(next).toBeFocused()

    // Cada Enter completa o texto ou avança.
    const goTo = async (n: number) => {
      for (let i = 0; i < 20; i++) {
        if ((await page.locator('.tutorial__count').innerText()).endsWith(`${n}/6`)) return
        await page.keyboard.press('Enter')
      }
    }
    await goTo(2)
    await expect(page.locator('.tutorial-arrow').first()).toBeVisible()
    await goTo(4)
    await expect(page.locator('.tutorial-arrow')).toHaveCount(0)
    await expect(page.locator('.objects-menu-toggle')).toHaveClass(/tutorial-target/)
    await goTo(5)
    await expect(page.locator('.hud__help')).toHaveClass(/tutorial-target/)

    // Pular fecha e lembra.
    await page.locator('.tutorial__skip').click()
    await expect(box).toHaveCount(0)
    expect(await page.evaluate(() => localStorage.getItem('quartoPixel.tutorial'))).toBe('1')

    // Reabre pelo "?" e Esc fecha devolvendo o foco a ele.
    const help = page.getByRole('button', { name: 'Ver tutorial' })
    await help.click()
    await expect(box).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(box).toHaveCount(0)
    await expect(help).toBeFocused()
  })

  test('visita repetida não abre sozinho', async ({ page }) => {
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    await page.waitForTimeout(1500)
    await expect(page.locator('.tutorial')).toHaveCount(0)
  })
})
