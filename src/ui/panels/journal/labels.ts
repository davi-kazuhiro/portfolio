// Textos derivados de uma página do caderno (aria-labels), usados na cena e no modo texto.
import type { TFunction } from 'i18next'
import type { JournalPage } from './experience'

/** Título da página dupla (aria-label): cargo/projeto da experiência ou "Formação". */
export function pageTitle(t: TFunction, p: JournalPage): string {
  return p.kind === 'experience' ? p.exp.title : t('journal.type.education')
}

/** aria-label da aba: começa pelo nome visível (o tipo) e acrescenta o detalhe da página. */
export function tabAriaLabel(t: TFunction, p: JournalPage): string {
  const type = t(`journal.type.${p.type}`)
  if (p.kind === 'experience') return t('journal.tabAria', { type, title: p.exp.title, organization: p.exp.organization })
  return t('journal.tabAriaEducation', { type, levels: p.items.map((e) => e.level).join(', ') })
}
