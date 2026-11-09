import type * as Phaser from 'phaser'
import { describe, expect, it } from 'vitest'
import { readQuartoPixel } from '@/game/objects/spriteMeta'
import journal from '../public/assets/objects/journal.json'

// O Phaser copia o JSON do Aseprite (menos `frames`) para `texture.customData`.
const texture = (meta: unknown) => ({ customData: { meta } }) as unknown as Phaser.Textures.Texture

describe('readQuartoPixel: objeto sobre móvel', () => {
  it('lê mount "surface", surfaceOf e depthOffset do journal.json', () => {
    const meta = readQuartoPixel(texture(journal.meta))
    expect(meta.mount).toBe('surface')
    expect(meta.surfaceOf).toBe('computer')
    expect(meta.depthOffset).toBe(0.01)
    expect(meta.minHit).toEqual([24, 24])
    expect(meta.focus).toEqual({ x: 2, y: 2, width: 56, height: 32 })
  })

  it('ignora mount desconhecido e depthOffset que não é número', () => {
    const meta = readQuartoPixel(texture({ quartoPixel: { mount: 'ceiling', depthOffset: '0.01' } }))
    expect(meta.mount).toBeUndefined()
    expect(meta.depthOffset).toBeUndefined()
  })
})
