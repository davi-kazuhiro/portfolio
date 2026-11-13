import type { InteractableId } from '@/game/objects/registry'
import { CLOSEUPS } from './closeups'
import { loadCloseup } from './useCloseupSheet'
import { loadControllerAtlas, loadHeadsetAtlas } from './useDeskItemAtlas'
import { loadFramesAtlas } from './useFramesAtlas'
import { loadJournalAtlas } from './useJournalAtlas'
import { loadPhoneAtlas } from './usePhoneAtlas'
import { loadShelfAtlas } from './useShelfAtlas'

// Pré-carrega as ilustrações das visões de perto (são pequenas) para o boot entrar na abertura.
// Fica num chunk próprio (import dinâmico no PanelHost), fora do JS inicial.
export function preloadCloseups() {
  for (const id of Object.keys(CLOSEUPS) as InteractableId[]) void loadCloseup(id)
  void loadShelfAtlas()
  void loadJournalAtlas()
  void loadPhoneAtlas()
  void loadFramesAtlas()
  void loadHeadsetAtlas()
  void loadControllerAtlas()
}
