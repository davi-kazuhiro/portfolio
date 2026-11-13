// Headset (`headset`) e controle de videogame (`controller`) no quarto — PROPOSTA (M3, 2026-11-10), ainda não
// exportada para public/assets/. Spec: docs/arte/specs.md §8 e §9.
//
// Até aqui os dois eram decoração assada no sprite `computer`. Agora são interagíveis próprios, no padrão do
// caderno (`journal`): sprite desenhado por cima da mesa (profundidade do `computer` + 0,01, `topOnly`), mesmo canvas
// e mesma âncora do `computer`, `minHit` 24×24 e `focus` próprio. O desenho e a posição não mudam: as funções vêm
// de computer.mjs, e o `computer` passa a ser gerado com `items: false`. O build (build-desk-items.mjs) confere que
// `computer` sem os dois + headset + controle = `computer` de hoje, pixel a pixel.
import { roomCanvas } from '../room.mjs'
import { controllerObject, headsetObject } from './computer.mjs'

/** Headset sem fio deitado à direita, atrás do mouse (caixa ≈ `[28.2, 31.2, 3.4, 8.5, 16, 17.1]` u). */
export function renderHeadset() {
  const c = roomCanvas()
  headsetObject(c)
  return c
}

/** Controle deitado no canto do braço A, na frente da caneca (caixa ≈ `[3, 9.5, 7.9, 10.9, 16, 17.6]` u). */
export function renderController() {
  const c = roomCanvas()
  controllerObject(c)
  return c
}
