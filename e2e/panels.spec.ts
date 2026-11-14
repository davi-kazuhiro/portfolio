import { test, expect, visited, menuButton, dialog, openByMenu, waitRoom, OBJECTS } from './fixtures'

test.describe('painéis dos objetos', () => {
  for (const id of OBJECTS) {
    test(`${id}: abre, recebe foco, fundo inerte, Esc fecha e devolve o foco ao menu`, async ({ page }) => {
      await visited(page)
      await page.goto('/')
      await waitRoom(page)
      const btn = await openByMenu(page, id)

      // O diálogo (ou algo dentro dele) tem o foco.
      await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true)
      // Fundo do quarto inerte com o diálogo aberto.
      await expect(page.locator('.app__room')).toHaveAttribute('inert', '')
      await expect(dialog(page)).toHaveAttribute('aria-modal', 'true')

      await page.keyboard.press('Escape')
      await expect(dialog(page)).toHaveCount(0)
      await expect(page.locator('.app__room')).not.toHaveAttribute('inert', '')
      await expect(btn).toBeFocused()
    })
  }

  test('o botão de fechar do diálogo fecha o painel', async ({ page }) => {
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    await openByMenu(page, 'computer')
    await dialog(page)
      .getByRole('button', { name: /Fechar|Close/ })
      .first()
      .click()
    await expect(dialog(page)).toHaveCount(0)
    await expect(menuButton(page, 'computer')).toBeAttached()
  })

  test('o foco fica preso no diálogo (Tab não escapa)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'fluxo de teclado')
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    await openByMenu(page, 'computer')
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true)
    }
  })
})
