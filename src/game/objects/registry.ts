// Objetos interagíveis do quarto. O `id` é o mesmo nome usado no object layer do Tiled
// e a chave do painel em ui/panels. Ver docs/guias/novo-objeto.md.
export const INTERACTABLES = [
  { id: 'computer', labelKey: 'objects.computer' },
  { id: 'frames', labelKey: 'objects.frames' },
  { id: 'portrait', labelKey: 'objects.portrait', deferred: true },
  { id: 'bookshelf', labelKey: 'objects.bookshelf' },
  { id: 'journal', labelKey: 'objects.journal' },
  { id: 'phone', labelKey: 'objects.phone' },
  { id: 'headset', labelKey: 'objects.headset' },
  { id: 'controller', labelKey: 'objects.controller' },
  { id: 'pet', labelKey: 'objects.pet', deferred: true },
] as const

// Objetos que já existem no contrato mas ainda não estão no quarto (retrato no M7 e gato no M8):
// ficam fora do menu acessível até ganharem arte e painel.
export const MENU_OBJECTS = INTERACTABLES.filter((item) => !('deferred' in item && item.deferred))

export type InteractableId = (typeof INTERACTABLES)[number]['id']

export function isInteractableId(value: string): value is InteractableId {
  return INTERACTABLES.some((item) => item.id === value)
}
