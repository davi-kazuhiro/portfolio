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

  test('o menu de objetos lista só os 7 que estão no quarto (retrato no M7, gato no M8)', async ({ page }) => {
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    await expect(page.locator('.objects-menu [data-object-id]')).toHaveCount(OBJECTS.length)
    await expect(menuButton(page, 'portrait')).toHaveCount(0)
    await expect(menuButton(page, 'pet')).toHaveCount(0)
  })

  test('botão hambúrguer abre o menu visível, escolhe um objeto e o foco volta a ele', async ({ page }) => {
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    const toggle = page.getByRole('button', { name: 'Abrir menu de objetos' })
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(menuButton(page, 'journal')).toBeVisible()
    await menuButton(page, 'journal').click()
    await expect(dialog(page)).toBeVisible({ timeout: 10_000 })
    // Com o painel aberto o botão fica oculto (e o fundo, inerte).
    await expect(page.locator('.objects-menu-toggle')).toBeHidden()
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toHaveCount(0)
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    // Esc com o menu aberto fecha o menu.
    await toggle.click()
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(menuButton(page, 'journal')).not.toBeInViewport()
  })

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
