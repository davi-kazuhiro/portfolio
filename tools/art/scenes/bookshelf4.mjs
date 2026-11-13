// Prateleira de parede (`bookshelf`, M3), 4ª proposta (2026-11-07). A 3ª continua em bookshelf3.mjs, para comparação.
// Spec: docs/arte/specs.md §4. APROVADA (2026-11-07): exportada por build.mjs (pnpm art) como objects/bookshelf.
//
// Mudanças pedidas pelo Davi em relação à shelf3 (no quarto):
// - cavalo de xadrez escuro (azul-marinho), desenho original: pescoço em "S", crina marcada por um sulco paralelo
//   às costas, orelha pontuda, focinho com a boca, luz da esquerda, colar e pé em degraus;
// - raquete deitada sobre a tábua, na frente do cavalo, com o cabo ao longo da tábua, em vez de encostada na parede.
// Tábua, livros, cubo e tsuru são os da shelf3; o cartucho virou pato de borracha (2026-11-13) (mesma função, com `smalls` próprios).
import { CRANE_MAP, CRANE_S, renderBookshelf3, renderBookshelf3Shadow, SHELF3, SHELF3_Z } from './bookshelf3.mjs'

export { SHELF3_Z as SHELF4_Z }
export const SHELF4 = {
  ...SHELF3,
  knight: [32.9, 3.0], // ponto de apoio do cavalo (0,5 u à direita da shelf3: o pescoço do tsuru não encosta no focinho)
  paddle: [32.4, 5.4], // centro da lâmina da raquete deitada
}

// Cavalo de xadrez escuro, virado para a esquerda (13×16 com o contorno; topo em z 56, o limite da prateleira).
// Mesma rampa fria do cavalo da visão de perto, luz da esquerda: `h` blue-1 (faixa clara na testa e na frente do
// pescoço), `b` blue-0 (meio), `d` teal-1 e `D` teal-0 (sombras), `g` graphite-0 (sulco da crina, olho e boca).
// A orelha tem o recorte da nuca atrás; o sulco `g` desce paralelo às costas; garganta recuada e peito saliente.
export const KNIGHT4_S = [
  '.....o.......',
  '....oho......',
  '...ohbbooo...',
  '..ohbgbbbdo..',
  '.ohbbbbbbhgo.',
  'ohbbbbbbbbhgo',
  'oggobbbbbbhgo',
  '.oo.ohbbbbhgo',
  '...ohbbbbbhgo',
  '..ohhbbbbbhDo',
  '..ohhbbbbbbDo',
  '...ohbbbbbdDo',
  '..ooooooooooo',
  '.ohhhbbbbbbddo',
  '.oDDDDDDDDDDDo',
  '.oooooooooooo.',
]
export const KNIGHT4_MAP = { o: 'outline', h: 'blue-1', b: 'blue-0', d: 'teal-1', D: 'teal-0', g: 'graphite-0' }

// Raquete deitada no tampo (elipse 2:1 da projeção): borracha `red-2` com reflexo `red-3` em cima à esquerda e
// sombra `red-1` à direita; aresta de madeira `wood-2` aparecendo embaixo (1 px de espessura); cabo ao longo da
// tábua (+x = para baixo e à direita na tela), em madeira clara `gold-3`/`gold-0` (em `wood-*` sumia na tábua).
export const PADDLE_LYING_S = [
  '...ooooo.........',
  '.oo33222oo.......',
  'o3322222RRo......',
  'o22222222RRoo....',
  '.oo2222RRRo77oo..',
  '..oowwwwwoo4477oo',
  '....ooooo..oo447o',
  '.............ooo.',
]
export const PADDLE_LYING_MAP = { o: 'outline', 2: 'red-2', 3: 'red-3', R: 'red-1', w: 'wood-2', 7: 'gold-3', 4: 'gold-0' }

// Pato de borracha (rubber duck debugging) no lugar do cartucho (2026-11-13), virado para a esquerda: corpo
// `gold-1` com luz `gold-3` no alto e sombra `gold-0` embaixo, bico `red-3`/`red-2` (o laranja sumia na tábua), olho `graphite-0`.
export const DUCK_S = [
  '....ooo......',
  '...o331o.....',
  '..o33g1o.....',
  '.oBb1111o..o.',
  '..oo1111ooo3o',
  '..o3333111t1o',
  '.o311111111do',
  '.o11111111ddo',
  '..oddddddddo.',
  '...oooooooo..',
]
export const DUCK_MAP = { o: 'outline', 3: 'gold-3', 1: 'gold-1', d: 'gold-0', g: 'graphite-0', B: 'red-3', b: 'red-2', t: 'gold-3' }
export const DUCK_AT = [20.8, 2.4] // onde ficava o cartucho

export function renderBookshelf4() {
  return renderBookshelf3({
    cart: false,
    smalls: [
      { rows: DUCK_S, map: DUCK_MAP, at: DUCK_AT, dx: 6 },
      { rows: CRANE_S, map: CRANE_MAP, at: SHELF4.crane, dx: 9 },
      { rows: KNIGHT4_S, map: KNIGHT4_MAP, at: SHELF4.knight, dx: 7 },
      { rows: PADDLE_LYING_S, map: PADDLE_LYING_MAP, at: SHELF4.paddle, dx: 5, dy: 4 },
    ],
  })
}
export const renderBookshelf4Shadow = renderBookshelf3Shadow
