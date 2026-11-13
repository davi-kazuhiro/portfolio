import type { InteractableId } from '@/game/objects/registry'

// Objetos com visão de perto (ADR 0006). Os demais usam o painel genérico centralizado.
// Caminhos relativos ao index.html (build com `base: './'`). Só dados: o PanelHost importa
// isto no chunk inicial; o carregador e o componente `Closeup` ficam no chunk sob demanda.
export const CLOSEUPS: Partial<Record<InteractableId, { json: string; frame: string }>> = {
  computer: { json: 'assets/ui/closeup-computer.json', frame: 'assets/ui/closeup-computer-frame.png' },
}
