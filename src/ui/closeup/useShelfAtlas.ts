import { createAtlasLoader, type AtlasState } from './atlasLoader'
import { parseShelfAtlas, type ShelfAtlas } from './shelfAtlas'

// Atlas da prateleira (specs.md §4). Caminho relativo ao index.html (build com `base: './'`).
export const SHELF_ATLAS_JSON = 'assets/ui/closeup-bookshelf.json'

export type ShelfAtlasState = AtlasState<ShelfAtlas>

const loader = createAtlasLoader(SHELF_ATLAS_JSON, parseShelfAtlas, (a) => a.shelf.length > 0)

/** Carrega (uma vez) o JSON e o PNG. Sem eles, `missing`: a UI usa o modo texto (sem ilustração). */
export const loadShelfAtlas = loader.load
export const useShelfAtlas = loader.useAtlas
