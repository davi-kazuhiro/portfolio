// Stand-in da ilustração do computador enquanto `public/assets/ui/closeup-computer.*` não existe.
// Segue o mesmo contrato do JSON (specs.md §3): 320×180, mesmos retângulos e tags. Desenhado em
// SVG com retângulos da paleta (bíblia de arte), só as massas principais.
import { parseCloseupSheet, type CloseupSheet } from './sheet'

const W = 320, H = 180
const C = {
  outline: '#0f0b17',
  'graphite-0': '#1f1c28', 'graphite-1': '#2f2c3a', 'graphite-2': '#4a4659',
  'teal-0': '#132f3d', 'teal-1': '#1f4a5c', 'teal-2': '#2b5f74', 'teal-3': '#5f97a3',
  'wall-1': '#4b3a5e', 'wall-2': '#5a4870', 'wall-3': '#6e5a86', 'wall-4': '#7f6a98',
  'wood-2': '#6b4630', 'wood-5': '#b07a4c', 'wood-6': '#c99160', 'wood-7': '#ddb07a',
  'cream-0': '#a99a86', 'cream-2': '#e0d3bb', 'cream-3': '#f3e9d2',
  'gold-1': '#d9a441', 'gold-3': '#ffe08a', 'sky-0': '#7ec8e3',
} as const
type Token = keyof typeof C

type Screen = 'off' | 'boot0' | 'boot1' | 'on'
const r = (x: number, y: number, w: number, h: number, c: Token) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C[c]}"/>`

function frame(ox: number, screen: Screen, night: boolean): string {
  const parts = [
    r(0, 0, 30, 112, 'wall-4'),
    r(30, 0, 290, 112, 'wall-2'),
    r(214, 0, 96, 112, 'wall-4'),
    r(310, 0, 10, 105, 'gold-1'),
    r(48, 12, 3, 104, 'wall-1'),
    r(52, 8, 216, 104, 'outline'),
    r(53, 9, 214, 102, 'graphite-1'),
    r(53, 9, 214, 1, 'graphite-2'),
    r(266, 9, 1, 102, 'graphite-0'),
    r(256, 108, 2, 1, 'sky-0'),
    r(0, 112, 320, 60, 'wood-6'),
    r(0, 112, 320, 1, 'wood-2'),
    r(0, 172, 320, 8, 'wood-5'),
    r(0, 172, 320, 1, 'wood-7'),
    r(152, 104, 16, 17, 'graphite-1'),
    r(112, 115, 102, 15, 'graphite-2'),
    r(88, 133, 148, 33, 'cream-2'),
    r(232, 135, 70, 35, 'graphite-0'),
    r(254, 136, 19, 30, 'cream-3'),
    r(256, 116, 46, 16, 'graphite-1'),
    r(8, 142, 46, 21, 'wall-4'),
    r(30, 100, 21, 31, 'cream-2'),
  ]
  // Tela (58, 13, 204, 92).
  if (screen === 'off') parts.push(r(58, 13, 204, 92, 'graphite-0'), r(70, 22, 30, 6, 'teal-1'))
  else if (screen === 'boot0') parts.push(r(58, 13, 204, 92, 'teal-1'))
  else parts.push(r(58, 13, 204, 92, 'teal-0'), r(58, 13, 204, 1, 'teal-1'), r(58, 13, 1, 92, 'teal-1'))
  const body = parts.join('')
  // Noite: escurece tudo menos a tela e a lâmpada (aproximação do tint-night).
  const dim = night
    ? `<path fill="#000" fill-opacity="0.45" fill-rule="evenodd" d="M0 0h${W}v${H}H0z M58 13h204v92H58z"/>`
    : ''
  return `<g transform="translate(${ox} 0)">${body}${dim}</g>`
}

const FRAMES: { screen: Screen; night: boolean; duration: number }[] = [
  { screen: 'off', night: false, duration: 100 },
  { screen: 'boot0', night: false, duration: 60 },
  { screen: 'boot1', night: false, duration: 60 },
  { screen: 'on', night: false, duration: 1000 },
  { screen: 'off', night: true, duration: 100 },
  { screen: 'boot0', night: true, duration: 60 },
  { screen: 'boot1', night: true, duration: 60 },
  { screen: 'on', night: true, duration: 1000 },
]
const TAGS = [
  ['off', 0, 0], ['boot', 1, 2], ['on', 3, 3],
  ['off-night', 4, 4], ['boot-night', 5, 6], ['on-night', 7, 7],
] as const

const svgUrl = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`

// Moldura 9-slice 48×48 (fatias 9/8/15/8): contorno, bisel, centro teal-0 e LED no queixo.
const FRAME_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" shape-rendering="crispEdges">` +
  `${r(0, 0, 48, 48, 'outline')}${r(1, 1, 46, 46, 'graphite-1')}${r(1, 1, 46, 1, 'graphite-2')}` +
  `${r(46, 1, 1, 46, 'graphite-0')}${r(8, 9, 32, 24, 'teal-0')}${r(40, 39, 2, 1, 'sky-0')}</svg>`

export function standinCloseupSheet(): CloseupSheet {
  const width = W * FRAMES.length
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" shape-rendering="crispEdges">` +
    FRAMES.map((f, i) => frame(i * W, f.screen, f.night)).join('') +
    `</svg>`
  const json = {
    frames: FRAMES.map((f, i) => ({ frame: { x: i * W, y: 0, w: W, h: H }, sourceSize: { w: W, h: H }, duration: f.duration })),
    meta: {
      image: svgUrl(svg),
      size: { w: width, h: H },
      frameTags: TAGS.map(([name, from, to]) => ({ name, from, to })),
      quartoPixel: {
        contentRect: [58, 13, 204, 92],
        crops: { full: [0, 0, 320, 180], monitor: [44, 0, 232, 180] },
        nineSlice: { image: svgUrl(FRAME_SVG), size: { w: 48, h: 48 }, slice: [9, 8, 15, 8], scale: 2 },
      },
    },
  }
  return parseCloseupSheet(json, 'standin.json', svgUrl(FRAME_SVG))
}
