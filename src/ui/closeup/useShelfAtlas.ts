import { useEffect, useState } from 'react'
import { parseShelfAtlas, type ShelfAtlas } from './shelfAtlas'

// Atlas da prateleira (specs.md §4). Caminho relativo ao index.html (build com `base: './'`).
export const SHELF_ATLAS_JSON = 'assets/ui/closeup-bookshelf.json'

export type ShelfAtlasState = { status: 'loading' } | { status: 'ready'; atlas: ShelfAtlas } | { status: 'missing' }

let promise: Promise<ShelfAtlasState> | null = null
let settled: ShelfAtlasState | null = null

const probeImage = (src: string) =>
  new Promise<boolean>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })

/** Carrega (uma vez) o JSON e o PNG. Sem eles, `missing`: a UI usa o modo texto (sem ilustração). */
export function loadShelfAtlas(): Promise<ShelfAtlasState> {
  promise ??= (async (): Promise<ShelfAtlasState> => {
    try {
      const res = await fetch(SHELF_ATLAS_JSON)
      if (!res.ok) return { status: 'missing' }
      const atlas = parseShelfAtlas(await res.json(), SHELF_ATLAS_JSON)
      if (atlas.shelf.length === 0 || !(await probeImage(atlas.image))) return { status: 'missing' }
      return { status: 'ready', atlas }
    } catch {
      return { status: 'missing' }
    }
  })().then((state) => {
    settled = state
    return state
  })
  return promise
}

export function useShelfAtlas(): ShelfAtlasState {
  const [state, setState] = useState<ShelfAtlasState>(() => settled ?? { status: 'loading' })
  useEffect(() => {
    if (settled) return
    let alive = true
    void loadShelfAtlas().then((s) => {
      if (alive) setState(s)
    })
    return () => {
      alive = false
    }
  }, [])
  return settled ?? state
}
