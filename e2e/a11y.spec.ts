import AxeBuilder from '@axe-core/playwright'
import { test, expect, firstVisit, visited, enterButton, openByMenu, waitRoom, type Page } from './fixtures'

// Falha só em `serious`/`critical`; o resto vira anotação do teste (aparece no relatório).
async function scan(page: Page, label: string, note: (a: { type: string; description: string }) => void) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  for (const v of violations) {
    note({ type: `axe ${label} [${v.impact}] ${v.id}`, description: `${v.help} (${v.nodes.length} nós; ${v.nodes[0]?.target.join(' ')})` })
  }
  const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(bad.map((v) => `${v.id}: ${v.help} -> ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
}

test.describe('acessibilidade (axe)', () => {
  test('porta', async ({ page }, ti) => {
    await firstVisit(page)
    await page.goto('/')
    await expect(enterButton(page)).toBeAttached()
    await page.waitForTimeout(500)
    await scan(page, 'porta', (a) => ti.annotations.push(a))
  })

  test('quarto', async ({ page }, ti) => {
    await visited(page)
    await page.goto('/')
    await waitRoom(page)
    await scan(page, 'quarto', (a) => ti.annotations.push(a))
  })

  for (const id of ['computer', 'journal']) {
    test(`painel ${id}`, async ({ page }, ti) => {
      await visited(page)
      await page.goto('/')
      await waitRoom(page)
      await openByMenu(page, id)
      await page.waitForTimeout(800)
      await scan(page, `painel ${id}`, (a) => ti.annotations.push(a))
    })
  }
})
