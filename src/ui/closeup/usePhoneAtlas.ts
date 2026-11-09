import { createAtlasLoader, type AtlasState } from './atlasLoader'
import { parsePhoneAtlas, type PhoneAtlas } from './phoneAtlas'

// Atlas do celular (specs/6-cama-celular.md). Caminho relativo ao index.html (build com `base: './'`).
export const PHONE_ATLAS_JSON = 'assets/ui/closeup-phone.json'

export type PhoneAtlasState = AtlasState<PhoneAtlas>

const loader = createAtlasLoader(PHONE_ATLAS_JSON, parsePhoneAtlas, (a) => Boolean(a.frames[a.phone.frame]))

/** Carrega (uma vez) o JSON e o PNG. Sem eles, `missing`: o celular usa o modo texto. */
export const loadPhoneAtlas = loader.load
export const usePhoneAtlas = loader.useAtlas
