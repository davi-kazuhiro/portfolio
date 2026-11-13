import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { getContent, type Game } from '@/content'
import { useControllerAtlas } from '@/ui/closeup/useDeskItemAtlas'
import { DeskItemPanel } from './deskItem/DeskItemPanel'
import type { DeskEntry } from './deskItem/model'
import { toLocale } from './locale'
import type { PanelProps } from './types'

/** Jogo → item do carrossel; campos null ficam de fora. */
function toEntry(g: Game, t: TFunction): DeskEntry {
  const details: string[] = []
  if (g.platform) details.push(t('controller.platform', { platform: g.platform }))
  if (g.hours !== null) details.push(t('controller.hours', { count: g.hours }))
  if (g.note) details.push(g.note)
  return { id: g.id, fields: { title: g.title, genre: g.genre }, details }
}

// Controle → Jogos que o Davi joga (specs/9-controle.md). Palco compartilhado com o headset.
export function ControllerPanel({ titleId, onClose }: PanelProps) {
  const { t, i18n } = useTranslation()
  const games = getContent(toLocale(i18n.language)).games
  const atlasState = useControllerAtlas()
  const entries = games.map((g) => toEntry(g, t))
  return (
    <DeskItemPanel
      ns="controller"
      titleId={titleId}
      onClose={onClose}
      atlasState={atlasState}
      entries={entries}
      defaultLines={['title', 'genre']}
    />
  )
}
