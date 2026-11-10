import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getContent } from '@/content'
import { sortProjects, type Project } from './computer/projects'
import { toLocale } from './locale'
import type { PanelProps } from './types'

// Ícone de pasta em pixel art (16×12, desenhado em escala 2×). Decorativo.
// Anel branco de clicável (bíblia, regra 14): 1 px por fora da silhueta (aba + corpo), 4-vizinhança.
const FOLDER_CUE: Array<[number, number, number, number]> = [
  [0, 0, 6, 1],
  [-1, 1, 1, 11],
  [6, 1, 1, 2],
  [7, 2, 9, 1],
  [16, 3, 1, 9],
  [0, 12, 16, 1],
]

function FolderIcon({ open = false, cue = false }: { open?: boolean; cue?: boolean }) {
  return (
    <svg className="folder-icon" viewBox="0 0 16 12" width="32" height="24" aria-hidden="true" shapeRendering="crispEdges">
      {cue && (
        <g className="folder-icon__cue">
          {FOLDER_CUE.map(([x, y, w, h]) => (
            <rect key={`${x},${y}`} x={x} y={y} width={w} height={h} />
          ))}
        </g>
      )}
      <rect x="0" y="1" width="6" height="2" fill="var(--border)" />
      <rect x="1" y="2" width="4" height="1" fill="var(--accent)" />
      <rect x="0" y="3" width="16" height="9" fill="var(--border)" />
      <rect x="1" y="4" width="14" height="7" fill="var(--accent)" />
      <rect x="1" y="4" width="14" height="1" fill="var(--folder-light)" />
      {open && <rect x="3" y="6" width="12" height="5" fill="var(--folder-dark)" />}
    </svg>
  )
}

// Computador → Projetos. Tema "desktop retrô": janela com barra de título e pastas.
export function ComputerPanel({ titleId, onClose }: PanelProps) {
  const { t, i18n } = useTranslation()
  const projects: Project[] = useMemo(
    () => sortProjects(getContent(toLocale(i18n.language)).projects as Project[]),
    [i18n.language],
  )
  const [selected, setSelected] = useState<number | null>(null)
  const folderRefs = useRef<(HTMLButtonElement | null)[]>([])
  const backRef = useRef<HTMLButtonElement>(null)
  const lastOpened = useRef<number | null>(null)

  // Entrando na pasta: foco no "Voltar". Na lista: foco na pasta que estava aberta (ou na primeira).
  useEffect(() => {
    if (selected !== null) backRef.current?.focus()
    else folderRefs.current[lastOpened.current ?? 0]?.focus()
  }, [selected])

  const openFolder = (index: number) => {
    lastOpened.current = index
    setSelected(index)
  }

  // Esc dentro de uma pasta volta para a lista; o PanelHost ignora Esc já tratado.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && selected !== null) {
      e.preventDefault()
      setSelected(null)
    }
  }

  const project = selected !== null ? projects[selected] : undefined

  return (
    <div className="retro-window" onKeyDown={onKeyDown}>
      <div className="retro-window__titlebar">
        <h2 id={titleId} className="retro-window__title">
          {t('computer.windowTitle')}
        </h2>
        <button className="retro-window__close" onClick={onClose} aria-label={t('hud.close')}>
          <span aria-hidden="true">X</span>
        </button>
      </div>

      <div className="retro-window__address" aria-hidden="true">
        {project ? `${t('computer.path')}\\${project.titulo}` : t('computer.path')}
      </div>

      <div className="retro-window__body">
        {project ? (
          <article className="project-detail" aria-labelledby="project-detail-title">
            <button ref={backRef} className="pixel-btn" onClick={() => setSelected(null)}>
              {t('computer.back')}
            </button>
            <div className="project-detail__heading">
              <FolderIcon open />
              <h3 id="project-detail-title">{project.titulo}</h3>
              {project.destaque && <span className="badge">{t('computer.featured')}</span>}
            </div>
            <p>{project.descricao}</p>
            {project.tecnologias.length > 0 && (
              <>
                <h4>{t('computer.technologies')}</h4>
                <ul className="tech-list">
                  {project.tecnologias.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
              </>
            )}
            {project.link ? (
              <a className="pixel-btn project-detail__link" href={project.link} target="_blank" rel="noopener noreferrer">
                {t('computer.openRepo')}
                <span className="visually-hidden"> {t('computer.newTab')}</span>
              </a>
            ) : (
              <p className="project-detail__nolink">{t('computer.noLink')}</p>
            )}
          </article>
        ) : (
          <ul className="folder-grid" aria-label={t('computer.listLabel')}>
            {projects.map((p, i) => (
              <li key={p.titulo}>
                <button
                  ref={(el) => {
                    folderRefs.current[i] = el
                  }}
                  className={`folder${p.destaque ? ' folder--featured' : ''}`}
                  onClick={() => openFolder(i)}
                >
                  <FolderIcon cue />
                  <span className="folder__name">{p.titulo}</span>
                  {p.destaque && <span className="badge">{t('computer.featured')}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="retro-window__status" aria-live="polite">
        {project ? project.titulo : t('computer.itemCount', { count: projects.length })}
      </div>
    </div>
  )
}
