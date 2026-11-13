import { create } from 'zustand'
import type { InteractableId } from '@/game/objects/registry'
import type { Period } from '@/game/systems/period'
import { browserStorage, readMuted, saveMuted } from './persist'

/** Maçaneta da porta em hover (`door-hover`): px CSS relativos ao canvas. */
export type DoorAnchor = { x: number; y: number }

interface GameState {
  sceneKey: string | null
  hoveredId: InteractableId | null
  openId: InteractableId | null
  // Som desligado por padrão; lembrado em localStorage (`quartoPixel.muted`).
  muted: boolean
  // Maçaneta em hover na porta (cena Entrance), para a dica "Entrar"; null = sem hover.
  doorAnchor: DoorAnchor | null
  // Período de luz publicado pela cena (null antes do quarto carregar).
  period: Period | null
  // Período escolhido pelo visitante no HUD (null = segue o relógio). Muda a visão de perto já aberta.
  periodChoice: Period | null
  setSceneKey: (key: string) => void
  setHovered: (id: InteractableId | null) => void
  open: (id: InteractableId) => void
  close: () => void
  setMuted: (muted: boolean) => void
  setDoorAnchor: (anchor: DoorAnchor | null) => void
  setPeriod: (period: Period) => void
  choosePeriod: (period: Period) => void
}

export const useGameStore = create<GameState>((set) => ({
  sceneKey: null,
  hoveredId: null,
  openId: null,
  muted: readMuted(browserStorage()),
  doorAnchor: null,
  period: null,
  periodChoice: null,
  setSceneKey: (sceneKey) => set(sceneKey === 'Entrance' ? { sceneKey } : { sceneKey, doorAnchor: null }),
  setHovered: (hoveredId) => set({ hoveredId }),
  open: (openId) => set({ openId }),
  close: () => set({ openId: null }),
  setMuted: (muted) => {
    saveMuted(browserStorage(), muted)
    set({ muted })
  },
  setDoorAnchor: (doorAnchor) => set({ doorAnchor }),
  setPeriod: (period) => set({ period }),
  choosePeriod: (period) => set({ period, periodChoice: period }),
}))
