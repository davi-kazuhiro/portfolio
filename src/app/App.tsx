import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { EventBus } from '@/game/EventBus'
import { PhaserGame } from '@/game/PhaserGame'
import { useGameStore, type ObjectAnchor } from '@/store/useGameStore'
import { clearQuietFocus } from '@/ui/a11y/focusReturn'
import { trackInputModality } from '@/ui/a11y/inputModality'
import { cancelPendingOpen } from '@/ui/hud/requestOpen'
import { Hud } from '@/ui/hud/Hud'
import { PanelHost } from '@/ui/panels/PanelHost'

export function App() {
  const { t, i18n } = useTranslation()
  // Diálogo aberto: canvas, menu de objetos e dicas saem da árvore acessível e do Tab (`inert`);
  // o HUD vai para dentro do diálogo (hudSlotStore.ts). Volta ao fechar.
  const dialogOpen = useGameStore((s) => s.openId !== null)

  useEffect(() => {
    const { setSceneKey, setHovered, open, setPeriod, setDoorAnchor } = useGameStore.getState()
    const offs = [
      EventBus.on('scene-ready', setSceneKey),
      // 2º argumento opcional (proposto): ponto do objeto para a dica ficar ao lado dele.
      EventBus.on('object-hover', (id, anchor?: ObjectAnchor | null) => setHovered(id, anchor)),
      EventBus.on('period-changed', setPeriod),
      EventBus.on('door-hover', setDoorAnchor),
      EventBus.on('object-open', (id) => {
        cancelPendingOpen()
        open(id)
      }),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  // Teclado ou ponteiro: decide se o foco devolvido ao fechar um painel mostra anel.
  useEffect(() => trackInputModality(window, () => clearQuietFocus()), [])

  // `lang` do <html>, título e descrição acompanham o idioma (leitores de tela, hifenização e
  // aba do navegador). O HTML estático fica em PT para crawlers e prévias (docs/conteudo/seo.md).
  useEffect(() => {
    document.documentElement.lang = i18n.language === 'en' ? 'en' : 'pt-BR'
    document.title = t('meta.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'))
  }, [i18n.language, t])

  return (
    <main className="app">
      <div className="app__room" inert={dialogOpen}>
        <PhaserGame />
        <Hud />
      </div>
      <PanelHost />
    </main>
  )
}
