import { useEffect, useState } from 'react'

// Carregador genérico de atlas da visão de perto (prateleira, caderno): baixa o JSON uma vez,
// normaliza com `parse`, confere a imagem. Sem JSON/PNG (ou `ok` falso) → `missing`, e o painel
// usa o modo texto.

export type AtlasState<A> = { status: 'loading' } | { status: 'ready'; atlas: A } | { status: 'missing' }

const probeImage = (src: string) =>
  new Promise<boolean>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })

export function createAtlasLoader<A extends { image: string }>(
  jsonUrl: string,
  parse: (json: unknown, jsonUrl: string) => A,
  ok: (atlas: A) => boolean = () => true,
) {
  let promise: Promise<AtlasState<A>> | null = null
  let settled: AtlasState<A> | null = null

  function load(): Promise<AtlasState<A>> {
    promise ??= (async (): Promise<AtlasState<A>> => {
      try {
        const res = await fetch(jsonUrl)
        if (!res.ok) return { status: 'missing' }
        const atlas = parse(await res.json(), jsonUrl)
        if (!ok(atlas) || !(await probeImage(atlas.image))) return { status: 'missing' }
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

  function useAtlas(): AtlasState<A> {
    const [state, setState] = useState<AtlasState<A>>(() => settled ?? { status: 'loading' })
    useEffect(() => {
      if (settled) return
      let alive = true
      void load().then((s) => {
        if (alive) setState(s)
      })
      return () => {
        alive = false
      }
    }, [])
    return settled ?? state
  }

  return { load, useAtlas }
}
