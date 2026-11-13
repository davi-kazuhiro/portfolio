import type { KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { itemFrame } from '@/ui/closeup/deskItemAtlas'
import { frameBackground } from '@/ui/closeup/spriteStyle'
import { useSwipe } from '@/ui/closeup/useSwipe'
import { captionLines, type DeskItemModel } from './model'

// Modo texto (sem ilustração): telas onde a escala 3 não cabe, ou atlas ausente. Papel em tela
// cheia com a capa a 2×, título, subtítulo, detalhes e a paginação (dá a volta).
// Ordem de Tab: Fechar → item → anterior → próximo.
export function DeskItemText({ model }: { model: DeskItemModel }) {
  const { t } = useTranslation()
  const { entries, open, atlas, ns } = model
  const total = entries.length
  const cur = entries[open] ?? null
  const swipe = useSwipe(model.step)
  const frame = atlas && cur ? atlas.frames[itemFrame(atlas, cur.id)] : undefined
  const [title, ...subs] = cur ? captionLines(cur, model.lines) : []

  const onKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      model.step(e.key === 'ArrowLeft' ? -1 : 1)
    }
  }

  return (
    <div className="shelf-text desk-item-text">
      <header className="shelf-text__header">
        <h2 id={model.titleId}>{t(`${ns}.title`)}</h2>
        <button type="button" className="pixel-btn" onClick={model.onClose}>
          {t('hud.close')}
        </button>
      </header>
      <div className="shelf-text__body">
        {cur ? (
          <section
            className="shelf-text__section"
            tabIndex={0}
            aria-label={t(`${ns}.itemOf`, { current: open + 1, total })}
            onKeyDown={onKey}
            {...swipe}
          >
            <div className="shelf-text__stage">
              {atlas && frame && <span className="shelf-frame" aria-hidden="true" style={frameBackground(atlas, frame, 2)} />}
            </div>
            <div className="desk-item-text__info">
              <h3>{title}</h3>
              {subs.map((line, i) => (
                <p key={i} className="desk-item-text__sub">
                  {line}
                </p>
              ))}
              {cur.details.length > 0 && (
                <ul className="desk-item-text__details">
                  {cur.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
            {total > 1 && (
              <div className="shelf-text__pager">
                <button type="button" className="pixel-btn" onClick={() => model.step(-1)}>
                  <span aria-hidden="true">‹ </span>
                  {t(`${ns}.prev`)}
                </button>
                <span>{t(`${ns}.itemOf`, { current: open + 1, total })}</span>
                <button type="button" className="pixel-btn" onClick={() => model.step(1)}>
                  {t(`${ns}.next`)}
                  <span aria-hidden="true"> ›</span>
                </button>
              </div>
            )}
          </section>
        ) : (
          <p>{t(`${ns}.empty`)}</p>
        )}
      </div>
    </div>
  )
}
