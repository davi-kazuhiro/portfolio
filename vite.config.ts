/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

// Flags de build do Phaser (as mesmas do webpack oficial). O código-fonte usa `typeof FLAG`
// como condição, então a troca tem de ser da expressão inteira; o `define` do Vite só troca
// identificadores. Ver ADR 0009.
const PHASER_FLAGS: Record<string, boolean> = {
  WEBGL_RENDERER: true,
  CANVAS_RENDERER: false,
  WEBGL_DEBUG: false,
  EXPERIMENTAL: false,
  FEATURE_SOUND: true,
  PLUGIN_CAMERA3D: false,
  PLUGIN_FBINSTANT: false,
}
const PHASER_FLAG_RE = new RegExp(`typeof (${Object.keys(PHASER_FLAGS).join('|')})\\b`, 'g')

function phaserFlags(): Plugin {
  return {
    name: 'phaser-flags',
    enforce: 'pre',
    transform(code, id) {
      if (!/[\\/]node_modules[\\/]phaser[\\/]src[\\/]/.test(id) || !code.includes('typeof ')) return null
      const out = code
        .replace(PHASER_FLAG_RE, (_m, flag: string) => String(PHASER_FLAGS[flag]))
        // Só existe no build de debug do WebGL (WEBGL_DEBUG = false), e não é dependência instalada.
        .replace("require('phaser3spectorjs')", 'undefined')
      return out === code ? null : { code: out, map: null }
    },
  }
}

// O build enxuto só vale para `vite build`: o entry importa o código-fonte CommonJS do Phaser,
// que o dev server não converte. Em dev (e no Vitest) fica o pacote ESM completo.
export default defineConfig(({ command }) => ({
  // Caminhos relativos: o build funciona em GitHub Pages (subpasta) ou Vercel (raiz).
  base: './',
  plugins: command === 'build' ? [react(), phaserFlags()] : [react()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // Build enxuto do Phaser (só o que o jogo usa). Os tipos continuam vindo de `phaser`.
      ...(command === 'build'
        ? [{ find: /^phaser$/, replacement: fileURLToPath(new URL('./src/game/phaser-custom.js', import.meta.url)) }]
        : []),
    ],
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Phaser é grande e muda pouco: chunk separado para cache.
        manualChunks: (id) => (/node_modules[\\/]phaser|phaser-custom/.test(id) ? 'phaser' : undefined),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
}))
