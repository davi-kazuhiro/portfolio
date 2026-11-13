// Objetos interagíveis do quarto. O `id` é o mesmo nome usado no object layer do Tiled
// e a chave do painel em ui/panels. Ver docs/guias/novo-objeto.md.
export const INTERACTABLES = [
  { id: 'computer', labelKey: 'objects.computer' },
  { id: 'frames', labelKey: 'objects.frames' },
  { id: 'portrait', labelKey: 'objects.portrait' },
  { id: 'bookshelf', labelKey: 'objects.bookshelf' },
  { id: 'journal', labelKey: 'objects.journal' },
  { id: 'phone', labelKey: 'objects.phone' },
  { id: 'headset', labelKey: 'objects.headset' },
  { id: 'controller', labelKey: 'objects.controller' },
  { id: 'pet', labelKey: 'objects.pet' },
] as const

export type InteractableId = (typeof INTERACTABLES)[number]['id']

export function isInteractableId(value: string): value is InteractableId {
  return INTERACTABLES.some((item) => item.id === value)
}
