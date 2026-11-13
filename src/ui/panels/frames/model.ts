import type { Award } from '@/content'
import type { FramesAtlas } from '@/ui/closeup/framesAtlas'

// Estado compartilhado entre a ilustração (FramesScene) e o modo texto (FramesText).
export interface FramesModel {
  atlas: FramesAtlas | null
  night: boolean
  /** Entardecer: fundo em `dusk` (dia × tint-dusk). */
  dusk: boolean
  /** Certificados na ordem de awards.json (mais recente primeiro; não reordenar). */
  awards: Award[]
  /** Certificado aberto. */
  open: number
  /** Pula para o certificado `i` e anuncia "Certificado n de total". */
  goTo: (i: number) => void
  /** Anterior/próximo (preso nas pontas). */
  step: (dir: 1 | -1) => void
  titleId: string
  onClose: () => void
}
