import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/store/useGameStore'
import type { PanelProps } from './types'

// Painel provisório para objetos que ainda não têm painel temático (M3).
export function GenericPanel({ titleId, onClose }: PanelProps) {
  const { t } = useTranslation()
  const openId = useGameStore((s) => s.openId)

  return (
    <div className="panel generic-panel">
      <h2 id={titleId}>{openId ? t(`titles.${openId}`) : ''}</h2>
      <p>{t('panel.placeholder')}</p>
      <button className="pixel-btn" autoFocus onClick={onClose}>
        {t('hud.close')}
      </button>
    </div>
  )
}
