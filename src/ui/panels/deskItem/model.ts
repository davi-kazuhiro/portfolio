import type { DeskItemAtlas } from '@/ui/closeup/deskItemAtlas'
import type { DeskItemKind } from '@/ui/closeup/useDeskItemAtlas'

/** Um item do carrossel (álbum ou jogo), já com os textos prontos para mostrar. */
export interface DeskEntry {
  id: string
  /** Campos por nome (`title`, `artist`, `genre`...), para as linhas da legenda. */
  fields: Record<string, string>
  /** Detalhes opcionais já formatados (ano, plataforma, horas, nota); campos null ficam de fora. */
  details: string[]
}

// Estado compartilhado entre a ilustração (DeskItemScene) e o modo texto (DeskItemText).
export interface DeskItemModel {
  /** Namespace do i18n e tipo do atlas (`headset` ou `controller`). */
  ns: DeskItemKind
  atlas: DeskItemAtlas | null
  night: boolean
  /** Entardecer: fundo em `dusk` (dia × tint-dusk). */
  dusk: boolean
  entries: DeskEntry[]
  /** Campos de cada linha da legenda (do atlas, ou o padrão do painel). */
  lines: string[]
  open: number
  /** Anterior/próximo, dando a volta; anuncia a troca. */
  step: (dir: 1 | -1) => void
  titleId: string
  onClose: () => void
}

/** Linhas da legenda do item, na ordem de `lines`, sem as vazias. */
export const captionLines = (entry: DeskEntry, lines: string[]) => lines.map((f) => entry.fields[f] ?? '').filter((v) => v !== '')
