import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

// Navegador sem WebGL (M6, 'renderer-unavailable'): no lugar do canvas, a imagem estática do quarto
// (og-image, 1200×630) em escala de pixel e, abaixo dela, o menu de objetos visível (children).
export function RoomFallback({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="room-fallback">
      <img
        className="room-fallback__img"
        src={`${import.meta.env.BASE_URL ?? '/'}og-image.png`}
        alt={t('fallback.imageAlt')}
        width={1200}
        height={630}
        draggable={false}
      />
      {children}
    </div>
  )
}
