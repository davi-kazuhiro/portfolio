import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { getContent, type Album } from '@/content'
import { useHeadsetAtlas } from '@/ui/closeup/useDeskItemAtlas'
import { DeskItemPanel } from './deskItem/DeskItemPanel'
import type { DeskEntry } from './deskItem/model'
import { toLocale } from './locale'
import type { PanelProps } from './types'

/** Álbum → item do carrossel; campos null ficam de fora. */
function toEntry(a: Album, t: TFunction): DeskEntry {
  const details: string[] = []
  if (a.year !== null) details.push(t('headset.year', { year: a.year }))
  if (a.note) details.push(a.note)
  return { id: a.id, fields: { title: a.title, artist: a.artist }, details }
}

// Headset → Álbuns que o Davi escuta (specs/8-headset.md). Palco compartilhado com o controle.
export function HeadsetPanel({ titleId, onClose }: PanelProps) {
  const { t, i18n } = useTranslation()
  const albums = getContent(toLocale(i18n.language)).albums
  const atlasState = useHeadsetAtlas()
  const entries = albums.map((a) => toEntry(a, t))
  return (
    <DeskItemPanel
      ns="headset"
      titleId={titleId}
      onClose={onClose}
      atlasState={atlasState}
      entries={entries}
      defaultLines={['title', 'artist']}
    />
  )
}
