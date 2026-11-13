import type { ShelfAtlas } from '@/ui/closeup/shelfAtlas'
import type { Skills } from './skills'

// Estado compartilhado entre a ilustração (ShelfScene) e o modo texto (ShelfText).
export interface ShelfModel {
  atlas: ShelfAtlas | null
  night: boolean
  /** Entardecer: fundo em `dusk` (dia × tint-dusk). */
  dusk: boolean
  skills: Skills
  /** Projetos (título + tecnologias) para "Onde usei". */
  projects: { titulo: string; tecnologias: string[] }[]
  /** Item aberto: `languages`, `spoken-languages`, `tools` ou um hobby. */
  open: string
  /** Abre um item e põe o foco no destaque. */
  select: (id: string) => void
  /** Página atual de cada livro (índice de página, não de página dupla). */
  pages: Record<string, number>
  /** `refocus`: devolve o foco ao livro (o controle clicado vai desmontar). */
  setPage: (book: string, page: number, announce: string, refocus?: boolean) => void
  hobbyCycle: string[]
  stepHobby: (dir: 1 | -1) => void
  hobbyName: (id: string) => string
  titleId: string
  onClose: () => void
}

/** Callback ref do destaque, que recebe o foco depois de `select` (fora do model: o lint trata
 * objetos usados em `ref` como refs). */
export type HighlightRef = (el: HTMLElement | null) => void
