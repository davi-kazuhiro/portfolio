import { describe, expect, it } from 'vitest'
import { cuePixels, ringMask } from '@/ui/closeup/cueRingMask'

describe('cueRingMask.ringMask', () => {
  it('anel de 1 px por fora, em 4-vizinhança (sem cantos)', () => {
    // Um pixel opaco no meio de 1×1 → saída 3×3 com cruz em volta.
    expect([...ringMask([255], 1, 1)]).toEqual([0, 1, 0, 1, 0, 1, 0, 1, 0])
  })

  it('não marca pixels opacos nem buracos sem vizinho opaco', () => {
    // 3×1: opaco, vazio, opaco → o vazio do meio vira anel; a saída é 5×3.
    const m = ringMask([255, 0, 255], 3, 1)
    expect(m[1 * 5 + 2]).toBe(1)
    expect(m[1 * 5 + 1]).toBe(0)
    expect(m[0]).toBe(0)
  })
})

describe('cueRingMask.cuePixels', () => {
  it('sem borda = ringMask com folga 1', () => {
    expect(cuePixels([255], 1, 1, false)).toMatchObject({ pad: 1, width: 3, height: 3 })
  })

  it('com borda: anel branco (1) e, por fora dele, borda escura (2), folga 2', () => {
    const p = cuePixels([255], 1, 1, true)
    expect(p).toMatchObject({ pad: 2, width: 5, height: 5 })
    const at = (x: number, y: number) => p.data[y * 5 + x]
    expect(at(2, 2)).toBe(0) // o próprio pixel
    expect([at(2, 1), at(1, 2), at(3, 2), at(2, 3)]).toEqual([1, 1, 1, 1])
    expect([at(2, 0), at(0, 2), at(1, 1), at(3, 3)]).toEqual([2, 2, 2, 2])
    expect(at(0, 0)).toBe(0)
  })
})
