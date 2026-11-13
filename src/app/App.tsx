import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { EventBus } from '@/game/EventBus'
import { PhaserGame } from '@/game/PhaserGame'
import { useGameStore } from '@/store/useGameStore'
import { cancelPendingOpen } from '@/ui/hud/requestOpen'
import { Hud } from '@/ui/hud/Hud'
import { PanelHost } from '@/ui/panels/PanelHost'

export function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const { setSceneKey, setHovered, open, setPeriod, setDoorAnchor } = useGameStore.getState()
    const offs = [
      EventBus.on('scene-ready', setSceneKey),
      EventBus.on('object-hover', setHovered),
      EventBus.on('period-changed', setPeriod),
      EventBus.on('door-hover', setDoorAnchor),
      EventBus.on('object-open', (id) => {
        cancelPendingOpen()
        open(id)
      }),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  // `lang` do <html> acompanha o idioma (leitores de tela e hifenização).
  useEffect(() => {
    document.documentElement.lang = i18n.language === 'en' ? 'en' : 'pt-BR'
  }, [i18n.language])

  return (
    <main className="app">
      <PhaserGame />
      <Hud />
      <PanelHost />
    </main>
  )
}
