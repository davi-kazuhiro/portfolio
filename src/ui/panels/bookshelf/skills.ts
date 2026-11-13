// Lógica pura do painel da prateleira (skills.json, docs/conteudo/guia-de-conteudo.md).

export interface Language {
  id: string
  name: string
  level: number
  icon: string
  matches: string[]
}

export interface SpokenLanguage {
  id: string
  name: string
  level: string
  certificates: string[]
  usage: string | null
}

export interface Tool {
  id: string
  name: string
  icon: string
  /** Id de `toolGroups` (seção do cartão). */
  group: string
  description: string | null
}

/** Seção do cartão "Ferramentas" (aba na ilustração, subtítulo no modo texto). */
export interface ToolGroup {
  id: string
  name: string
}

export interface Hobby {
  id: string
  name: string
}

export interface Skills {
  languages: Language[]
  spokenLanguages: SpokenLanguage[]
  toolGroups: ToolGroup[]
  tools: Tool[]
  hobbies: Hobby[]
}

/** Títulos dos projetos cujo `tecnologias` casa com algum `matches` (sem diferenciar maiúsculas). */
export function projectsUsing(matches: readonly string[], projects: readonly { titulo: string; tecnologias: readonly string[] }[]): string[] {
  const wanted = new Set(matches.map((m) => m.trim().toLowerCase()))
  return projects.filter((p) => p.tecnologias.some((t) => wanted.has(t.trim().toLowerCase()))).map((p) => p.titulo)
}

/**
 * Ferramentas por seção, na ordem de `toolGroups`. Seções vazias somem; ferramentas com `group`
 * desconhecido vão para uma seção final sem nome (id `''`), para nada sumir da lista.
 */
export function groupTools(groups: readonly ToolGroup[], tools: readonly Tool[]): { group: ToolGroup; tools: Tool[] }[] {
  const known = new Set(groups.map((g) => g.id))
  const out = groups.map((group) => ({ group, tools: tools.filter((t) => t.group === group.id) }))
  const rest = tools.filter((t) => !known.has(t.group))
  if (rest.length > 0) out.push({ group: { id: '', name: '' }, tools: rest })
  return out.filter((g) => g.tools.length > 0)
}

/**
 * Páginas do livro Linguagens: 0 = sumário, depois uma por linguagem.
 * Página dupla `k` mostra as páginas `2k` (esquerda) e `2k + 1` (direita).
 */
export const languagePageCount = (languages: readonly unknown[]) => languages.length + 1
export const languagePageOf = (index: number) => index + 1

export const spreadCount = (pages: number) => Math.max(1, Math.ceil(pages / 2))
export const spreadOf = (page: number) => Math.floor(page / 2)

/** Limita `n` a `[0, total - 1]`. */
export const clampIndex = (n: number, total: number) => Math.min(Math.max(n, 0), Math.max(total - 1, 0))

/** Próximo item do ciclo (com volta). Item fora do ciclo começa do primeiro. */
export function cycleStep<T>(cycle: readonly T[], current: T, dir: 1 | -1): T {
  const i = cycle.indexOf(current)
  if (cycle.length === 0) return current
  if (i < 0) return cycle[0]
  return cycle[(i + dir + cycle.length) % cycle.length]
}

/** Tamanho da fonte do texto sobre a ilustração (px CSS): 4 px de arte por letra, mínimo 14. */
export const sceneFontSize = (scale: number) => Math.max(14, scale * 4)
