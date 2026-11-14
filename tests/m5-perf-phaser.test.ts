import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// O build enxuto do Phaser (src/game/phaser-custom.js, ADR 0009) só inclui o que o jogo usa.
// O TypeScript não percebe uma API que ficou de fora (os tipos vêm do pacote completo), então
// este teste confere, no código de src/game, os namespaces e os métodos de `add`/`make`/`load`.

const ROOT = process.cwd()
const ENTRY = readFileSync(join(ROOT, 'src/game/phaser-custom.js'), 'utf8')

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.tsx?$/.test(name) ? [readFileSync(path, 'utf8')] : []
  })
}
const CODE = sources(join(ROOT, 'src/game')).join('\n')

function used(re: RegExp): string[] {
  return [...new Set([...CODE.matchAll(re)].map((m) => m[1]))].sort()
}

// Métodos do loader → arquivo do FileType que os registra.
const LOADER_FILES: Record<string, string> = {
  aseprite: 'AsepriteFile',
  audio: 'AudioFile',
  image: 'ImageFile',
  json: 'JSONFile',
  tilemapTiledJSON: 'TilemapJSONFile',
}
const LOADER_NON_FILE = new Set(['on', 'once', 'off', 'start', 'isLoading', 'reset'])

describe('build enxuto do Phaser', () => {
  it('exporta todo namespace usado em runtime', () => {
    const namespaces = used(/\bPhaser\.([A-Z][A-Za-z]*)/g).filter((ns) => ns !== 'Types')
    expect(namespaces.length).toBeGreaterThan(5)
    for (const ns of namespaces) expect(ENTRY, `Phaser.${ns}`).toMatch(new RegExp(`export const ${ns}\\b`))
  })

  it('registra os game objects de this.add.* e this.make.*', () => {
    const add = used(/\badd\s*\.\s*([a-z]\w*)\s*\(/g)
    expect(add).toContain('sprite')
    for (const name of add) {
      const cls = name[0].toUpperCase() + name.slice(1)
      expect(ENTRY, `add.${name}`).toContain(`/${name}/${cls}Factory.js`)
    }
    for (const name of used(/\bmake\s*\.\s*([a-z]\w*)\s*\(/g)) {
      const cls = name[0].toUpperCase() + name.slice(1)
      expect(ENTRY, `make.${name}`).toMatch(new RegExp(`/${cls}Creator\\.js`))
    }
  })

  it('registra os tipos de arquivo de this.load.*', () => {
    const methods = [
      ...used(/\bload\s*\.\s*([a-zA-Z]\w*)\s*\(/g),
      // Audio.ts guarda o loader numa variável (`const loader = scene.load`).
      ...used(/\bloader\s*\.\s*([a-zA-Z]\w*)\s*\(/g),
    ].filter((m) => !LOADER_NON_FILE.has(m))
    expect(methods).toContain('aseprite')
    for (const method of methods) {
      const file = LOADER_FILES[method]
      expect(file, `load.${method} sem FileType mapeado neste teste`).toBeDefined()
      expect(ENTRY, `load.${method}`).toContain(`/loader/filetypes/${file}.js`)
    }
  })

  it('não puxa física, partículas, texto nem o renderer Canvas', () => {
    for (const cut of ['/physics/', '/particles/', '/text/', '/bitmaptext/', '/renderer/canvas/', '/gamepad/']) {
      expect(ENTRY).not.toContain(cut)
    }
  })
})
