import type { Experience } from '@/content'
import type { JournalAtlas } from '@/ui/closeup/journalAtlas'

// Estado compartilhado entre a ilustração (JournalScene) e o modo texto (JournalText).
export interface JournalModel {
  atlas: JournalAtlas | null
  night: boolean
  /** Na ordem de exibição de experiences.json (não reordenar). */
  experiences: Experience[]
  /** Experiência aberta (= página dupla). */
  page: number
  /** Pula para a experiência `i` e anuncia "Página n de total". */
  goTo: (i: number) => void
  /** Vira uma página dupla (presa nas pontas). */
  turn: (dir: 1 | -1) => void
  /** Data da abertura, para o selo "Atual". */
  now: Date
  titleId: string
  onClose: () => void
}
