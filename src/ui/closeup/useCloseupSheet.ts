import { useEffect, useState } from 'react'
import type { InteractableId } from '@/game/objects/registry'
import { parseCloseupSheet, parseOverlay, resolveSibling, type CloseupSheet, type Overlay } from './sheet'
import { CLOSEUPS } from './closeups'
import { standinCloseupSheet } from './standin'

const cache = new Map<string, Promise<CloseupSheet>>()
// Já carregados: o hook devolve na primeira renderização (permite animar o boot na abertura).
const resolved = new Map<string, CloseupSheet>()

const probeImage = (src: string) =>
  new Promise<boolean>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })

// Vapor da caneca (`meta.quartoPixel.steam`): opcional; sem ele a cena fica parada.
async function loadOverlay(json: unknown, jsonUrl: string): Promise<Overlay | undefined> {
  const ref = (json as { meta?: { quartoPixel?: { steam?: { json?: unknown } } } })?.meta?.quartoPixel?.steam
  if (!ref || typeof ref.json !== 'string') return undefined
  try {
    const url = resolveSibling(jsonUrl, ref.json)
    const res = await fetch(url)
    if (!res.ok) return undefined
    const overlay = parseOverlay(ref, await res.json(), jsonUrl)
    return overlay && (await probeImage(overlay.image)) ? overlay : undefined
  } catch {
    return undefined
  }
}

/** Carrega (uma vez) o JSON e as imagens. Sem os arquivos, usa o stand-in com o mesmo contrato. */
export function loadCloseup(id: InteractableId): Promise<CloseupSheet> | undefined {
  const src = CLOSEUPS[id]
  if (!src) return undefined
  let p = cache.get(id)
  if (!p) {
    p = (async () => {
      const standin = standinCloseupSheet()
      try {
        const res = await fetch(src.json)
        if (!res.ok) return standin
        const json: unknown = await res.json()
        const sheet = parseCloseupSheet(json, src.json, src.frame)
        sheet.steam = await loadOverlay(json, src.json)
        const [imgOk, frameOk] = await Promise.all([probeImage(sheet.image), probeImage(sheet.frame9.image)])
        if (!imgOk) return standin
        return frameOk ? sheet : { ...sheet, frame9: standin.frame9 }
      } catch {
        return standin
      }
    })().then((sheet) => {
      resolved.set(id, sheet)
      return sheet
    })
    cache.set(id, p)
  }
  return p
}

/** `null` enquanto carrega (a UI usa os números da spec e esconde a ilustração). */
export function useCloseupSheet(id: InteractableId | null): CloseupSheet | null {
  const [state, setState] = useState<{ id: InteractableId; sheet: CloseupSheet } | null>(null)
  useEffect(() => {
    if (!id || resolved.has(id)) return
    let alive = true
    loadCloseup(id)?.then((sheet) => {
      if (alive) setState({ id, sheet })
    })
    return () => {
      alive = false
    }
  }, [id])
  if (!id) return null
  return resolved.get(id) ?? (state && state.id === id ? state.sheet : null)
}
