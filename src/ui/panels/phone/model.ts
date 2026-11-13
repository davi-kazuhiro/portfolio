import type { PhoneAtlas } from '@/ui/closeup/phoneAtlas'
import type { ContactLink, ContactProfile, ResumeLink } from './contact'

// Estado compartilhado entre a ilustração (PhoneScene) e o modo texto (PhoneText).
export interface PhoneModel {
  atlas: PhoneAtlas | null
  night: boolean
  /** Entardecer: fundo em `dusk` (dia × tint-dusk). */
  dusk: boolean
  profile: ContactProfile
  links: ContactLink[]
  resumes: ResumeLink[]
  titleId: string
  onClose: () => void
}

/** id do texto que descreve o currículo indisponível (aria-describedby dos botões desativados). */
export const RESUME_NOTE_ID = 'phone-resume-note'
