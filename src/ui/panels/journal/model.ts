import type { JournalAtlas } from '@/ui/closeup/journalAtlas'
import type { JournalPage } from './experience'

// Estado compartilhado entre a ilustração (JournalScene) e o modo texto (JournalText).
export interface JournalModel {
  atlas: JournalAtlas | null
  night: boolean
  /** Experiências na ordem de experiences.json (não reordenar) e, por último, a Formação. */
  pages: JournalPage[]
  /** Página dupla aberta. */
  page: number
  /** Pula para a página `i` e anuncia "Página n de total". */
  goTo: (i: number) => void
  /** Vira uma página dupla (presa nas pontas). */
  turn: (dir: 1 | -1) => void
  /** Data da abertura, para o selo "Atual". */
  now: Date
  titleId: string
  onClose: () => void
}
