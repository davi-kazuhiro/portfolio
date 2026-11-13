// Chaves e caminhos dos assets carregados pelo Preload. Caminhos relativos ao index.html
// (o build usa `base: './'`). Contrato da arte: docs/arte/biblia-de-arte.md ("Arquivos, nomes e
// âncoras") e docs/arte/specs.md.
export const ASSETS = {
  roomMap: { key: 'room-map', url: 'maps/room.tmj' },
} as const

// Sprites do quarto gerados por tools/art (PNG + JSON Hash do Aseprite, com `pivot` e
// `meta.quartoPixel`). A chave da textura é o nome do arquivo (= `id` do registry nos interagíveis).
// Se um arquivo ainda não existir, o Preload cria um stand-in com o mesmo contrato
// (objects/standins.ts).
export const ROOM_SPRITES = {
  'room-shell': 'assets/tiles/room-shell',
  'light-window': 'assets/objects/light-window',
  window: 'assets/objects/window',
  bookshelf: 'assets/objects/bookshelf',
  computer: 'assets/objects/computer',
  'computer-hit': 'assets/objects/computer-hit',
  'desk-lamp': 'assets/objects/desk-lamp',
  'light-computer': 'assets/objects/light-computer',
  journal: 'assets/objects/journal',
  'light-journal': 'assets/objects/light-journal',
  headset: 'assets/objects/headset',
  'light-headset': 'assets/objects/light-headset',
  controller: 'assets/objects/controller',
  'pc-tower': 'assets/objects/pc-tower',
  'desk-chair': 'assets/objects/desk-chair',
  bed: 'assets/objects/bed',
  phone: 'assets/objects/phone',
  'light-phone': 'assets/objects/light-phone',
  frames: 'assets/objects/frames',
  'light-frames': 'assets/objects/light-frames',
} as const

export type RoomSpriteKey = keyof typeof ROOM_SPRITES

// Porta do quarto (cena Entrance, docs/arte/specs/2-porta.md). Mesmo formato dos sprites do quarto;
// a posição de cada camada na ilustração 320×180 vem de `meta.quartoPixel.at`. Na ordem de desenho.
export const ENTRANCE_SPRITES = {
  'entrance-bg': 'assets/tiles/entrance-bg',
  'entrance-wall-column': 'assets/tiles/entrance-wall-column',
  'door-interior': 'assets/objects/door-interior',
  door: 'assets/objects/door',
  'door-light': 'assets/objects/door-light',
  'door-knob-glow': 'assets/objects/door-knob-glow',
} as const

// Áudio gerado por tools/audio (ADR 0007, docs/arte/audio.md). Os SFX vão no Preload; a música só
// é baixada quando o som é ligado (systems/Audio.ts).
export const AUDIO = {
  sfx: {
    'sfx-hover': 'assets/audio/sfx-hover.wav',
    'sfx-open': 'assets/audio/sfx-open.wav',
    'sfx-close': 'assets/audio/sfx-close.wav',
    'sfx-door': 'assets/audio/sfx-door.wav',
    'sfx-toggle': 'assets/audio/sfx-toggle.wav',
  },
  // Música desativada (2026-11-13): o Davi não gostou da gerada e vai compor a própria. Para
  // religar, aponte para o arquivo: { key: 'music-room', url: 'assets/audio/music-room.<ext>' }.
  music: null as { key: string; url: string } | null,
} as const

export type SfxKey = keyof typeof AUDIO.sfx

// Camadas (luminária, luzes) não são listadas aqui: cada JSON diz de quem é camada em
// `meta.quartoPixel.layerOf` (bíblia: mesmo canvas e mesma âncora do principal). A ordem desta
// lista é a ordem de empilhamento das camadas de um mesmo principal.

// Tint (MULTIPLY) do entardecer e da noite. Mesmos valores de TINT em tools/art/palette.mjs.
export const PERIOD_TINT = { day: 0xffffff, dusk: 0xf2c3a0, night: 0x6a6aa8 } as const

// Cores da paleta usadas pelo canvas (docs/arte/biblia-de-arte.md).
export const PALETTE = {
  bg: 0x1b1526,
  panel: 0x2b2140,
  border: 0x0f0b17,
  ink: 0xf3e9d2,
  // = cream-3: clarão de "atravessar" a porta
  cream3: 0xf6f2ec,
  // = gold-2: outline de hover
  accent: 0xf4b860,
  // = `outline` (#2a1b2a): anel escuro em volta do dourado do hover
  outline: 0x2a1b2a,
  // Anel branco que pisca em volta de todo interagível (aviso de "dá para clicar"). Branco puro
  // de propósito: é efeito de interface, não pixel de sprite (bíblia, regra 13).
  cue: 0xffffff,
  cyan: 0x5ec4d6,
} as const
