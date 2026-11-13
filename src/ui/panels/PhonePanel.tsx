import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getContent } from '@/content'
import { useViewportSize } from '@/ui/closeup/hooks'
import { HUD_BAND, pickCloseupLayout } from '@/ui/closeup/layout'
import { phoneGeometry } from '@/ui/closeup/phoneAtlas'
import { useNightAtOpen } from '@/ui/closeup/useNightAtOpen'
import { usePhoneAtlas } from '@/ui/closeup/usePhoneAtlas'
import { toLocale } from './locale'
import { contactLinks, resumeLinks, type ContactProfile } from './phone/contact'
import type { PhoneModel } from './phone/model'
import { PhoneScene } from './phone/PhoneScene'
import { PhoneText } from './phone/PhoneText'
import type { PanelProps } from './types'

// Celular → Contato + currículo (specs/6-cama-celular.md). Visão de perto em tela cheia: o celular
// apoiado no travesseiro, com o perfil e os botões na tela. A ilustração cobre a janela (regra
// cover); sem escala ≥ 3 possível (telas estreitas), modo texto em tela cheia.
export function PhonePanel({ titleId, onClose }: PanelProps) {
  const { t, i18n } = useTranslation()
  const profile = getContent(toLocale(i18n.language)).profile as ContactProfile

  const atlasState = usePhoneAtlas()
  const atlas = atlasState.status === 'ready' ? atlasState.atlas : null
  const vp = useViewportSize()
  const { night, dusk } = useNightAtOpen()

  const geometry = useMemo(() => (atlas ? phoneGeometry(atlas) : null), [atlas])
  const layout = geometry ? pickCloseupLayout(vp.w, vp.h, geometry, HUD_BAND) : null
  const sceneMode = layout !== null && layout.mode === 'cover'

  if (atlasState.status === 'loading') {
    return (
      <div className="panel shelf-loading" role="status">
        <h2 id={titleId}>{t('phone.title')}</h2>
        <p>{t('panel.loading')}</p>
      </div>
    )
  }

  const model: PhoneModel = {
    atlas,
    night,
    dusk,
    profile,
    links: contactLinks(profile, atlas?.apps.ids),
    resumes: resumeLinks(profile),
    titleId,
    onClose,
  }
  return sceneMode && layout && atlas ? <PhoneScene model={model} atlas={atlas} layout={layout} /> : <PhoneText model={model} />
}
