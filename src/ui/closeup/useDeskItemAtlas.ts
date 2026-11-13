import { createAtlasLoader, type AtlasState } from './atlasLoader'
import { parseDeskItemAtlas, type DeskItemAtlas } from './deskItemAtlas'

// Atlas do headset (specs/8-headset.md) e do controle (specs/9-controle.md), mesmo palco.
// Caminhos relativos ao index.html (build com `base: './'`).
export type DeskItemKind = 'headset' | 'controller'

export const DESK_ITEM_ATLAS_JSON: Record<DeskItemKind, string> = {
  headset: 'assets/ui/closeup-headset.json',
  controller: 'assets/ui/closeup-controller.json',
}

export type DeskItemAtlasState = AtlasState<DeskItemAtlas>

const loaders = {
  headset: createAtlasLoader(DESK_ITEM_ATLAS_JSON.headset, parseDeskItemAtlas, (a) => Boolean(a.frames[a.background.day])),
  controller: createAtlasLoader(DESK_ITEM_ATLAS_JSON.controller, parseDeskItemAtlas, (a) => Boolean(a.frames[a.background.day])),
}

/** Carrega (uma vez) o JSON e o PNG. Sem eles, `missing`: o painel usa o modo texto. */
export const loadHeadsetAtlas = loaders.headset.load
export const loadControllerAtlas = loaders.controller.load

/** Hooks por tipo (cada loader tem o seu cache). */
export const useHeadsetAtlas: () => DeskItemAtlasState = loaders.headset.useAtlas
export const useControllerAtlas: () => DeskItemAtlasState = loaders.controller.useAtlas
