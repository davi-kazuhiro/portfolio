import { test as base, expect, type Page } from '@playwright/test'

export const OBJECTS = ['computer', 'frames', 'bookshelf', 'journal', 'phone', 'headset', 'controller'] as const
export type ObjectId = (typeof OBJECTS)[number]
export type { Page }

/** Todo teste falha se a página lançar erro ou logar `console.error`. */
export const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(`console.error: ${m.text()}`)
      })
      await use(errors)
      expect(errors, 'erros no console').toEqual([])
    },
    { auto: true },
  ],
})
export { expect }

/** Grava localStorage antes de a página carregar (só na primeira carga da sessão da aba). */
export async function seedStorage(page: Page, values: Record<string, string>) {
  await page.addInitScript((v) => {
    if (sessionStorage.getItem('__seeded')) return
    sessionStorage.setItem('__seeded', '1')
    for (const [k, val] of Object.entries(v)) localStorage.setItem(k, val)
  }, values)
}

/** Visitante recorrente: pula a porta e abre direto no quarto. */
export const visited = (page: Page, extra: Record<string, string> = {}) =>
  seedStorage(page, { 'quartoPixel.visited': '1', 'quartoPixel.lang': 'pt', ...extra })

/** Primeira visita: abre na porta. */
export const firstVisit = (page: Page, extra: Record<string, string> = {}) =>
  seedStorage(page, { 'quartoPixel.lang': 'pt', ...extra })

export const menuButton = (page: Page, id: string) => page.locator(`.objects-menu [data-object-id="${id}"]`)
export const dialog = (page: Page) => page.getByRole('dialog')
export const enterButton = (page: Page) => page.getByRole('button', { name: /Entrar no quarto|Enter the room/ })

/** Abre o objeto pelo menu acessível (foco + Enter). */
export async function openByMenu(page: Page, id: string) {
  const btn = menuButton(page, id)
  await btn.focus()
  await page.keyboard.press('Enter')
  await expect(dialog(page)).toBeVisible({ timeout: 10_000 })
  await dialogSettled(page)
  return btn
}

/**
 * Espera o diálogo chegar ao estado final. Nas visões de perto o elemento `role="dialog"` é trocado
 * ~300 ms depois de aparecer (o "Carregando..." do Suspense dá lugar ao `Closeup`): medir antes disso
 * pega o elemento que vai sair da página.
 */
export async function dialogSettled(page: Page) {
  await expect(dialog(page).getByText(/^(Carregando|Loading)\.\.\.$/)).toHaveCount(0, { timeout: 10_000 })
  await expect(dialog(page)).toBeVisible()
}

/** Espera o canvas existir e o quarto estar no ar (sem botão da porta). */
export async function waitRoom(page: Page) {
  await expect(page.locator('canvas')).toBeVisible()
  await expect(enterButton(page)).toHaveCount(0)
  await page.waitForTimeout(500)
}
