// Preferências do visitante lembradas entre visitas (localStorage). Toda leitura e escrita é
// protegida: aba anônima, storage bloqueado ou cheio nunca quebram a página.

/** O mínimo de `Storage` que usamos (facilita testar sem DOM). */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

export const MUTED_KEY = 'quartoPixel.muted'
export const LANGUAGE_KEY = 'quartoPixel.lang'

/** `window.localStorage`, ou `null` se não existe ou o acesso lança. */
export function browserStorage(): KeyValueStorage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage ?? null
  } catch {
    return null
  }
}

function read(storage: KeyValueStorage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function write(storage: KeyValueStorage | null, key: string, value: string) {
  try {
    storage?.setItem(key, value)
  } catch {
    // Sem storage: a preferência vale só nesta visita.
  }
}

/** Som desligado por padrão; só `'false'` gravado liga. */
export function readMuted(storage: KeyValueStorage | null): boolean {
  return read(storage, MUTED_KEY) !== 'false'
}

export function saveMuted(storage: KeyValueStorage | null, muted: boolean) {
  write(storage, MUTED_KEY, String(muted))
}

export type UiLanguage = 'pt' | 'en'

/** Idioma lembrado; sem ele, o do navegador (pt* → pt, resto → en). */
export function readLanguage(storage: KeyValueStorage | null, navigatorLanguage: string | undefined): UiLanguage {
  const saved = read(storage, LANGUAGE_KEY)
  if (saved === 'pt' || saved === 'en') return saved
  return navigatorLanguage?.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

export function saveLanguage(storage: KeyValueStorage | null, language: string) {
  if (language === 'pt' || language === 'en') write(storage, LANGUAGE_KEY, language)
}
