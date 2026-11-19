import { create } from 'zustand'
import type { InteractableId } from '@/game/objects/registry'
import type { Period } from '@/game/systems/period'
import { browserStorage, readMuted, saveMuted } from './persist'

/** Maçaneta da porta em hover (`door-hover`): px CSS relativos ao canvas. */
export type DoorAnchor = { x: number; y: number }
/** Ponto de um objeto em hover (`object-hover`, 2º argumento opcional): px CSS relativos ao canvas. */
export type ObjectAnchor = DoorAnchor

interface GameState {
  sceneKey: string | null
  hoveredId: InteractableId | null
  // Onde pôr a dica do objeto em hover, se a cena mandar (senão a dica fica no rodapé).
  hoverAnchor: ObjectAnchor | null
  // Item do menu de teclado com foco visível (pede o destaque do objeto no quarto).
  menuFocusId: InteractableId | null
  openId: InteractableId | null
  // Som desligado por padrão; lembrado em localStorage (`quartoPixel.muted`).
  muted: boolean
  // Maçaneta em hover na porta (cena Entrance), para a dica "Entrar"; null = sem hover.
  doorAnchor: DoorAnchor | null
  // Período de luz publicado pela cena (null antes do quarto carregar).
  period: Period | null
  // Período escolhido pelo visitante no HUD (null = segue o relógio). Muda a visão de perto já aberta.
  periodChoice: Period | null
  // Navegador sem WebGL ('renderer-unavailable', M6): sem cena; a UI mostra a imagem estática e o
  // menu de objetos visível. Nunca volta a false (não há 'scene-ready' depois).
  rendererUnavailable: boolean
  // Tutorial em diálogo (A4): aberto agora e qual botão do HUD ele está apontando.
  tutorialOpen: boolean
  tutorialFocus: TutorialFocus
  // Passo das setas amarelas aberto: no celular os botões do HUD somem para as setas não ficarem por cima.
  tutorialArrows: boolean
  setSceneKey: (key: string) => void
  setHovered: (id: InteractableId | null, anchor?: ObjectAnchor | null) => void
  setMenuFocus: (id: InteractableId | null) => void
  open: (id: InteractableId) => void
  close: () => void
  setMuted: (muted: boolean) => void
  setDoorAnchor: (anchor: DoorAnchor | null) => void
  setPeriod: (period: Period) => void
  choosePeriod: (period: Period) => void
  setRendererUnavailable: () => void
  openTutorial: () => void
  closeTutorial: () => void
  setTutorialFocus: (focus: TutorialFocus) => void
  setTutorialArrows: (on: boolean) => void
}

/** Botão do HUD destacado por um passo do tutorial. */
export type TutorialFocus = 'menu' | 'help' | null

export const useGameStore = create<GameState>((set) => ({
  sceneKey: null,
  hoveredId: null,
  hoverAnchor: null,
  menuFocusId: null,
  openId: null,
  muted: readMuted(browserStorage()),
  doorAnchor: null,
  period: null,
  periodChoice: null,
  rendererUnavailable: false,
  tutorialOpen: false,
  tutorialFocus: null,
  tutorialArrows: false,
  setSceneKey: (sceneKey) => set(sceneKey === 'Entrance' ? { sceneKey } : { sceneKey, doorAnchor: null }),
  setHovered: (hoveredId, anchor) => set({ hoveredId, hoverAnchor: hoveredId ? (anchor ?? null) : null }),
  setMenuFocus: (menuFocusId) => set({ menuFocusId }),
  open: (openId) => set({ openId }),
  close: () => set({ openId: null }),
  setMuted: (muted) => {
    saveMuted(browserStorage(), muted)
    set({ muted })
  },
  setDoorAnchor: (doorAnchor) => set({ doorAnchor }),
  setPeriod: (period) => set({ period }),
  choosePeriod: (period) => set({ period, periodChoice: period }),
  // Sem cena: zera a cena e as dicas que dependem dela (requestOpen abre o painel direto).
  setRendererUnavailable: () =>
    set({ rendererUnavailable: true, sceneKey: null, doorAnchor: null, hoveredId: null, hoverAnchor: null }),
  openTutorial: () => set({ tutorialOpen: true }),
  closeTutorial: () => set({ tutorialOpen: false, tutorialFocus: null, tutorialArrows: false }),
  setTutorialFocus: (tutorialFocus) => set({ tutorialFocus }),
  setTutorialArrows: (tutorialArrows) => set({ tutorialArrows }),
}))
