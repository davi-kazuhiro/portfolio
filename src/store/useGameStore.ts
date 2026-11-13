import { create } from 'zustand'
import type { InteractableId } from '@/game/objects/registry'
import type { Period } from '@/game/systems/period'

interface GameState {
  sceneKey: string | null
  hoveredId: InteractableId | null
  openId: InteractableId | null
  muted: boolean
  // Período de luz publicado pela cena (null antes do quarto carregar).
  period: Period | null
  // Período escolhido pelo visitante no HUD (null = segue o relógio). Muda a visão de perto já aberta.
  periodChoice: Period | null
  setSceneKey: (key: string) => void
  setHovered: (id: InteractableId | null) => void
  open: (id: InteractableId) => void
  close: () => void
  toggleMuted: () => void
  setPeriod: (period: Period) => void
  choosePeriod: (period: Period) => void
}

export const useGameStore = create<GameState>((set) => ({
  sceneKey: null,
  hoveredId: null,
  openId: null,
  muted: true,
  period: null,
  periodChoice: null,
  setSceneKey: (sceneKey) => set({ sceneKey }),
  setHovered: (hoveredId) => set({ hoveredId }),
  open: (openId) => set({ openId }),
  close: () => set({ openId: null }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  setPeriod: (period) => set({ period }),
  choosePeriod: (period) => set({ period, periodChoice: period }),
}))
