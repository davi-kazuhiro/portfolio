import { withBase } from '../phone/contact'

/**
 * Endereço do arquivo do certificado resolvido contra a base do site (`withBase`, como o
 * currículo do celular): "/certificates/x.pdf" → "./certificates/x.pdf" no build. null = sem arquivo.
 */
export function certificateHref(file: string | null, base?: string): string | null {
  const f = file?.trim()
  return f ? withBase(f, base) : null
}
