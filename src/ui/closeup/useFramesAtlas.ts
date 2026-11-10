import { createAtlasLoader, type AtlasState } from './atlasLoader'
import { parseFramesAtlas, type FramesAtlas } from './framesAtlas'

// Atlas dos quadros (specs/7-quadros.md). Caminho relativo ao index.html (build com `base: './'`).
export const FRAMES_ATLAS_JSON = 'assets/ui/closeup-frames.json'

export type FramesAtlasState = AtlasState<FramesAtlas>

const loader = createAtlasLoader(FRAMES_ATLAS_JSON, parseFramesAtlas, (a) => Boolean(a.frames[a.background.day]))

/** Carrega (uma vez) o JSON e o PNG. Sem eles, `missing`: os quadros usam o modo texto. */
export const loadFramesAtlas = loader.load
export const useFramesAtlas = loader.useAtlas
