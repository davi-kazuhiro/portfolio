import { createAtlasLoader, type AtlasState } from './atlasLoader'
import { parseJournalAtlas, type JournalAtlas } from './journalAtlas'

// Atlas do caderno (specs.md §5). Caminho relativo ao index.html (build com `base: './'`).
export const JOURNAL_ATLAS_JSON = 'assets/ui/closeup-journal.json'

export type JournalAtlasState = AtlasState<JournalAtlas>

const loader = createAtlasLoader(JOURNAL_ATLAS_JSON, parseJournalAtlas, (a) => Boolean(a.frames[a.book.frame]))

/** Carrega (uma vez) o JSON e o PNG. Sem eles, `missing`: o caderno usa o modo texto. */
export const loadJournalAtlas = loader.load
export const useJournalAtlas = loader.useAtlas
