// Atlas da visão de perto do celular (docs/arte/specs/6-cama-celular.md): `closeup-phone.{png,json}`.
// Frames recortados com a posição na ilustração em `spriteSourceSize`; composição, rects e cores
// em `meta.quartoPixel`. Tudo aqui é puro e testável.
import {
  isObj,
  num,
  obj,
  parseAtlasBase,
  R,
  str,
  toDrawable,
  toSize,
  type CueFlags,
  type Drawable,
  type SpriteAtlas,
} from './atlas'
import type { CloseupGeometry, Rect, Sides } from './layout'
import { toRect, toSides } from './sheet'

/**
 * Botões-ícone do celular, na ordem da tela. O atlas ainda traz o frame `app/phone` (WhatsApp),
 * que ficou sem uso: ids fora desta lista são ignorados.
 */
export type PhoneAppId = 'email' | 'linkedin' | 'github'
export const PHONE_APP_IDS: readonly PhoneAppId[] = ['email', 'linkedin', 'github']

export type ResumeLang = 'pt' | 'en'
export const RESUME_LANGS: readonly ResumeLang[] = ['pt', 'en']

export interface Placed {
  rect: Rect
  frame: string
}

export interface ButtonArt extends Placed {
  hover: Placed | null
}

/** Botão de app: `dx` (px de arte) leva o frame da posição desenhada no atlas até `rect`. */
export interface AppArt extends ButtonArt {
  dx: number
}

export interface CvArt extends ButtonArt {
  disabled: Placed | null
}

export interface PhoneAtlas extends SpriteAtlas {
  size: { w: number; h: number }
  crop: Rect
  minScale: number
  bleed: Sides
  panelBackground: string
  background: Drawable
  backgroundBleed: Drawable | null
  phone: Placed & { body: Rect; bodyRadius: number }
  screen: { rect: Rect; radius: number; header: Rect; notch: Rect; home: Rect }
  content: Rect
  statusBar: Placed
  avatar: Placed
  divider: Placed
  slots: {
    name: Rect
    roles: Rect
    roleLines: number
    roleLineHeight: number
    city: Rect
    labels: Rect[]
    cvLabel: Rect
  }
  apps: { ids: PhoneAppId[]; items: Partial<Record<PhoneAppId, AppArt>>; colors: Record<string, string> }
  cv: { items: Record<ResumeLang, CvArt>; iconRect: Rect; textRect: Rect; disabledHasHover: boolean }
  icons: { pin: { size: { w: number; h: number }; frame: string }; download: { size: { w: number; h: number }; frame: string; disabled: string } }
  textInk: { name: string; body: string; label: string; cvLabel: string; cv: string; cvDisabled: string }
}

// Valores da spec, usados quando o JSON não traz o campo.
export const PHONE_SPEC = {
  size: { w: 320, h: 180 },
  minScale: 3,
  panelBackground: '#f6f2ec',
  phone: R(100, 0, 124, 178),
  body: R(100, 3, 120, 175),
  screen: R(104, 7, 112, 166),
  content: R(108, 20, 104, 146),
  name: R(108, 48, 104, 9),
  roles: R(108, 58, 104, 24),
  city: R(108, 83, 104, 8),
  cvLabel: R(108, 128, 104, 7),
  /** Faixa livre da tela para um aviso curto (ex.: "Em breve"). */
  note: R(108, 155, 104, 10),
  textRect: R(18, 0, 28, 18),
  iconRect: R(4, 3, 12, 12),
  textInk: { name: '#2f2c3a', body: '#1f4a5c', label: '#4a4659', cvLabel: '#2f2c3a', cv: '#5a2e22', cvDisabled: '#4a4659' },
} as const

/** Botões dos apps: 22×22, passo 26, y 95; o rótulo (26×7) fica centrado sob o botão. */
export const APP_SIZE = 22
export const APP_PITCH = 26
const APP_Y = 95
const LABEL_Y = 119

/**
 * x (px inteiros da arte) dos `count` botões centrados na faixa `content`, no passo de 26.
 * Ex.: 3 botões em [108,20,104,146] → 123, 149, 175.
 */
export function centeredAppXs(content: Rect, count: number, size = APP_SIZE, pitch = APP_PITCH): number[] {
  if (count <= 0) return []
  const span = size + pitch * (count - 1)
  const x0 = content.x + Math.floor((content.w - span) / 2)
  return Array.from({ length: count }, (_, n) => x0 + pitch * n)
}
const cvRect = (lang: ResumeLang) => R(lang === 'pt' ? 110 : 162, 137, 48, 18)

function toPlaced(v: unknown, rect: Rect = R(0, 0, 0, 0), frame?: string): Placed | null {
  if (!isObj(v)) return frame ? { rect, frame } : null
  const f = typeof v.frame === 'string' ? v.frame : frame
  if (!f) return null
  return { rect: toRect(v.rect, rect), frame: f }
}

/**
 * Normaliza o JSON do atlas do celular.
 * @param json conteúdo do `.json` (Aseprite Hash ou Array com `filename`)
 * @param jsonUrl caminho do `.json`, para resolver `meta.image`
 */
export function parsePhoneAtlas(json: unknown, jsonUrl: string): PhoneAtlas {
  const { image, sheet, frames, qp } = parseAtlasBase(json, jsonUrl)
  const S = PHONE_SPEC
  const size = toSize(qp.size, S.size)
  const phone = obj(qp.phone)
  const screen = obj(qp.screen)
  const slots = obj(qp.slots)
  const apps = obj(qp.apps)
  const appItems = obj(apps.items)
  const cv = obj(qp.cv)
  const icons = obj(qp.icons)
  const pin = obj(icons.pin)
  const download = obj(icons.download)
  const textInk = obj(qp.textInk)

  // Posições recalculadas aqui (o meta pode trazer as 4 antigas, com o WhatsApp): os botões
  // visíveis ficam centrados na faixa de conteúdo; do JSON valem os frames e a posição em que
  // foram desenhados (`rect` do item), de onde sai o deslocamento `dx` do sprite.
  const content = toRect(qp.content, S.content)
  const ids = (Array.isArray(apps.ids) ? apps.ids : PHONE_APP_IDS).filter((id): id is PhoneAppId => PHONE_APP_IDS.includes(id as PhoneAppId))
  const xs = centeredAppXs(content, ids.length)
  const appY = num(apps.y, APP_Y)
  const items: PhoneAtlas['apps']['items'] = {}
  ids.forEach((id, n) => {
    const v = obj(appItems[id])
    const rect = R(xs[n], appY, APP_SIZE, APP_SIZE)
    const drawnX = toRect(v.rect, R(110 + APP_PITCH * n, appY, APP_SIZE, APP_SIZE)).x
    const frame = typeof v.frame === 'string' ? v.frame : `app/${id}`
    const hover = obj(v.hover)
    const hoverFrame = typeof hover.frame === 'string' ? hover.frame : `${frame}/hover`
    items[id] = { rect, frame, dx: rect.x - drawnX, hover: { rect: R(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4), frame: hoverFrame } }
  })

  const cvItem = (lang: ResumeLang): CvArt => {
    const v = obj(cv[lang])
    const p = toPlaced(v, cvRect(lang), `cv/${lang}`)!
    const hoverRect = { x: p.rect.x - 2, y: p.rect.y - 2, w: p.rect.w + 4, h: p.rect.h + 4 }
    return {
      ...p,
      hover: toPlaced(v.hover, hoverRect, `${p.frame}/hover`),
      disabled: toPlaced(v.disabled, p.rect, `${p.frame}/disabled`),
    }
  }

  const labelY = Array.isArray(slots.labels) && slots.labels.length > 0 ? toRect(slots.labels[0], R(0, LABEL_Y, 0, 0)).y : LABEL_Y
  const labels = xs.map((x) => R(x - (APP_PITCH - APP_SIZE) / 2, labelY, APP_PITCH, 7))

  return {
    image,
    sheet,
    frames,
    size,
    crop: toRect(obj(qp.crops).full, R(0, 0, size.w, size.h)),
    minScale: num(qp.minScale, S.minScale),
    bleed: toSides(qp.bleed),
    panelBackground: str(qp.panelBackground, S.panelBackground),
    background: toDrawable(qp.background) ?? { rect: R(0, 0, size.w, size.h), day: 'bg/day', night: 'bg/night' },
    backgroundBleed: isObj(qp.background) ? toDrawable(qp.background.bleed) : null,
    phone: {
      rect: toRect(phone.rect, S.phone),
      frame: str(phone.frame, 'phone'),
      body: toRect(phone.body, S.body),
      bodyRadius: num(phone.bodyRadius, 12),
    },
    screen: {
      rect: toRect(screen.rect, S.screen),
      radius: num(screen.radius, 8),
      header: toRect(screen.header, R(104, 7, 112, 26)),
      notch: toRect(screen.notch, R(150, 9, 20, 6)),
      home: toRect(screen.home, R(145, 167, 30, 2)),
    },
    content,
    statusBar: toPlaced(qp.statusBar, R(110, 10, 99, 4), 'status')!,
    avatar: toPlaced(qp.avatar, R(148, 21, 24, 24), 'avatar')!,
    divider: toPlaced(qp.divider, R(110, 91, 100, 1), 'divider')!,
    slots: {
      name: toRect(slots.name, S.name),
      roles: toRect(slots.roles, S.roles),
      roleLines: num(slots.roleLines, 3),
      roleLineHeight: num(slots.roleLineHeight, 8),
      city: toRect(slots.city, S.city),
      labels,
      cvLabel: toRect(slots.cvLabel, S.cvLabel),
    },
    apps: {
      ids,
      items,
      colors: Object.fromEntries(Object.entries(obj(apps.colors)).filter(([, v]) => typeof v === 'string')) as Record<string, string>,
    },
    cv: {
      items: { pt: cvItem('pt'), en: cvItem('en') },
      iconRect: toRect(cv.iconRect, S.iconRect),
      textRect: toRect(cv.textRect, S.textRect),
      disabledHasHover: cv.disabledHasHover === true,
    },
    icons: {
      pin: { size: toSize(pin.size, { w: 7, h: 7 }), frame: str(pin.frame, 'icon/pin') },
      download: {
        size: toSize(download.size, { w: 12, h: 12 }),
        frame: str(download.frame, 'icon/download'),
        disabled: str(download.disabled, 'icon/download/disabled'),
      },
    },
    textInk: {
      name: str(textInk.name, S.textInk.name),
      body: str(textInk.body, S.textInk.body),
      label: str(textInk.label, S.textInk.label),
      cvLabel: str(textInk.cvLabel, S.textInk.cvLabel),
      cv: str(textInk.cv, S.textInk.cv),
      cvDisabled: str(textInk.cvDisabled, S.textInk.cvDisabled),
    },
  }
}

// ---------- Composição ----------

export type PhoneLayerRole = 'background' | 'phone' | 'status' | 'avatar' | 'divider' | 'app' | 'cv'

export interface PhoneLayer extends CueFlags {
  key: string
  role: PhoneLayerRole
  frame: string
  /** Deslocamento horizontal (px de arte) do frame; só os apps, recentrados. */
  dx?: number
}

/** Estado de um botão de currículo: com PDF (normal/hover) ou sem (desativado). */
export interface PhoneComposeOptions {
  night: boolean
  /** Botão em hover/foco: um app ou `cv:pt` / `cv:en`. */
  hot?: PhoneAppId | `cv:${ResumeLang}` | null
  /** Quais currículos existem (sem PDF → frame desativado, sem hover). */
  resume: Record<ResumeLang, boolean>
}

/** Frame do botão de currículo `lang` no estado pedido. */
export function cvFrame(atlas: PhoneAtlas, lang: ResumeLang, available: boolean, hot: boolean): string {
  const art = atlas.cv.items[lang]
  if (!available) {
    if (hot && atlas.cv.disabledHasHover && art.hover) return art.hover.frame
    return art.disabled?.frame ?? art.frame
  }
  return hot && art.hover ? art.hover.frame : art.frame
}

/**
 * Ordem de composição da spec: fundo (com a sangria real) → aparelho → barra de status → avatar
 * → divisória → apps → currículo PT/EN (normal ou desativado). Clicáveis (apps, currículos com
 * PDF) ganham o anel branco (regra 14) em vez dos frames `/hover` dourados; sobre a tela creme o
 * anel leva a borda escura, senão some. Frames ausentes do atlas são pulados. Só o fundo muda à noite.
 */
export function composePhone(atlas: PhoneAtlas, { night, hot = null, resume }: PhoneComposeOptions): PhoneLayer[] {
  const layers: PhoneLayer[] = []
  const push = (l: PhoneLayer) => {
    if (atlas.frames[l.frame]) layers.push(l)
  }
  const pick = (d: Drawable) => (night ? d.night : d.day)
  const bgBleed = atlas.backgroundBleed && atlas.frames[pick(atlas.backgroundBleed)] ? atlas.backgroundBleed : null
  push({ key: 'bg', role: 'background', frame: pick(bgBleed ?? atlas.background) })
  push({ key: 'phone', role: 'phone', frame: atlas.phone.frame })
  push({ key: 'status', role: 'status', frame: atlas.statusBar.frame })
  push({ key: 'avatar', role: 'avatar', frame: atlas.avatar.frame })
  push({ key: 'divider', role: 'divider', frame: atlas.divider.frame })
  for (const id of atlas.apps.ids) {
    const art = atlas.apps.items[id]
    if (!art) continue
    push({ key: `app:${id}`, role: 'app', frame: art.frame, dx: art.dx, cue: true, cueEdge: true, hot: hot === id || undefined })
  }
  for (const lang of RESUME_LANGS) {
    const cue = resume[lang]
    push({
      key: `cv:${lang}`,
      role: 'cv',
      frame: cvFrame(atlas, lang, cue, false),
      cue: cue || undefined,
      cueEdge: cue || undefined,
      hot: (cue && hot === `cv:${lang}`) || undefined,
    })
  }
  return layers
}

// ---------- Geometria da visão de perto (regra "cover", layout.ts) ----------

/** Sangria sintética máxima (px de arte), como no caderno. */
export const PHONE_MAX_BLEED = 48

/** Geometria para `pickCloseupLayout`: o aparelho inteiro precisa ficar visível. */
export function phoneGeometry(atlas: PhoneAtlas): CloseupGeometry {
  return {
    size: atlas.size,
    contentRect: atlas.phone.rect,
    crops: { full: atlas.crop },
    minContent: { w: 0, h: 0 },
    minScale: atlas.minScale,
    bleed: atlas.bleed,
    maxBleed: PHONE_MAX_BLEED,
  }
}
