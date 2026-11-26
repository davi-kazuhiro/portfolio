import type { ButtonHTMLAttributes } from 'react'

// Ícones do HUD em pixel art, desenhados em grade (# = pixel aceso) e pintados com a cor do
// texto do botão (`currentColor`): seguem o hover/foco do .pixel-btn sem CSS extra.
const ICONS = {
  soundOn: [
    '......#.....',
    '.....##..#..',
    '....###...#.',
    '#######.#..#',
    '#######..#.#',
    '#######..#.#',
    '#######..#.#',
    '#######.#..#',
    '....###...#.',
    '.....##..#..',
    '......#.....',
  ],
  soundOff: [
    '......#.....',
    '.....##.....',
    '....###.....',
    '#######.....',
    '#######.#..#',
    '#######..##.',
    '#######..##.',
    '#######.#..#',
    '....###.....',
    '.....##.....',
    '......#.....',
  ],
  day: [
    '.....#.....',
    '.#...#...#.',
    '..#.....#..',
    '....###....',
    '...#####...',
    '##.#####.##',
    '...#####...',
    '....###....',
    '..#.....#..',
    '.#...#...#.',
    '.....#.....',
  ],
  night: [
    '....###....',
    '..###......',
    '.###.......',
    '.###.......',
    '###........',
    '###........',
    '####.......',
    '.#####.....',
    '.#######.#.',
    '..#######..',
    '....###....',
  ],
  dusk: [
    '.....#.....',
    '.#...#...#.',
    '..#.....#..',
    '....###....',
    '...#####...',
    '##.#####.##',
    '...........',
    '###########',
    '...........',
    '..#######..',
    '....###....',
  ],
  close: ['##.....##', '###...###', '.###.###.', '..#####..', '...###...', '..#####..', '.###.###.', '###...###', '##.....##'],
} satisfies Record<string, string[]>

export type IconName = keyof typeof ICONS

const PATHS = Object.fromEntries(
  Object.entries(ICONS).map(([name, rows]) => [
    name,
    {
      w: rows[0].length,
      h: rows.length,
      d: rows.flatMap((row, y) => [...row].map((c, x) => (c === '#' ? `M${x} ${y}h1v1h-1z` : ''))).join(''),
    },
  ]),
) as Record<IconName, { w: number; h: number; d: string }>

/** Ícone decorativo (o nome acessível fica no botão). 2 px CSS por pixel da arte. */
export function PixelIcon({ name }: { name: IconName }) {
  const { w, h, d } = PATHS[name]
  return (
    <svg className="pixel-icon" width={w * 2} height={h * 2} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  )
}

/**
 * Botão só com ícone. `tip` aparece numa dica no hover (mouse) e no foco por teclado;
 * `label` é o nome acessível. `tipAlign` = lado em que a dica encosta (o botão está num canto).
 */
export function IconButton({
  icon,
  label,
  tip,
  tipAlign = 'center',
  className = '',
  ...rest
}: {
  icon: IconName
  label: string
  tip: string
  tipAlign?: 'left' | 'center' | 'right'
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'>) {
  return (
    <button
      type="button"
      {...rest}
      className={`pixel-btn icon-btn icon-btn--tip-${tipAlign}${className ? ` ${className}` : ''}`}
      aria-label={label}
      data-tip={tip}
    >
      <PixelIcon name={icon} />
    </button>
  )
}
