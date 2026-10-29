import { PALETTE } from './util'

/**
 * The egg family: one body, one face kit, one line weight.
 *
 * Every egg on the site is drawn from these parts, in the style of the hero
 * and rooftop illustrations: a flat eggshell fill, one soft cel-shade on the
 * lower right, a glossy highlight up top, a warm ink outline that is the same
 * weight everywhere, and a face that is two dots and a mouth.
 *
 * Coordinates: a 200-wide stage, the egg stands on y = 262 and is centred on
 * x = 100. Figures use the viewBox in `FIG_VIEWBOX`.
 */

export const I = PALETTE.ink
export const FIG_VIEWBOX = '-44 -26 288 312'

/** Line weights, in figure units (one egg is 172 wide). */
export const W = { body: 5.5, prop: 4.5, fine: 3 } as const

/** Eggshell tones: white, cream and brown eggs, with the shade each one casts. */
export const SHELL = {
  white: PALETTE.cream,
  cream: PALETTE.butter,
  brown: PALETTE.peach,
  tan: '#e7b896',
} as const

const WARM = '#b8693f'

/** Mix two #rrggbb colours. */
export function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/** The cel-shade a fill casts on itself. */
export const shadeOf = (fill: string) => mix(fill, WARM, 0.22)
/** The highlight a fill catches. */
export const lightOf = (fill: string) => mix(fill, '#ffffff', 0.72)

export interface EggSize {
  cx?: number
  /** the y the egg stands on */
  bottom?: number
  w?: number
  h?: number
  /** where the egg is widest, from the tip (0..1) */
  waist?: number
  /** how round the tip is: 0.5 is an egg, 0.6 is a pebble */
  tip?: number
}

const n = (v: number) => +v.toFixed(1)

/** The egg silhouette: four cubic curves, narrow at the top, full at the bottom. */
export function eggPath({ cx = 100, bottom = 262, w = 172, h = 226, waist = 0.6, tip = 0.52 }: EggSize = {}) {
  const top = bottom - h
  const yw = top + h * waist
  const r = w / 2
  const up = yw - top
  const dn = bottom - yw
  const ks = 0.6
  const kb = 0.56
  return (
    `M${n(cx)} ${n(top)}` +
    `C${n(cx + r * tip)} ${n(top)} ${n(cx + r)} ${n(yw - up * ks)} ${n(cx + r)} ${n(yw)}` +
    `C${n(cx + r)} ${n(yw + dn * kb)} ${n(cx + r * kb)} ${n(bottom)} ${n(cx)} ${n(bottom)}` +
    `C${n(cx - r * kb)} ${n(bottom)} ${n(cx - r)} ${n(yw + dn * kb)} ${n(cx - r)} ${n(yw)}` +
    `C${n(cx - r)} ${n(yw - up * ks)} ${n(cx - r * tip)} ${n(top)} ${n(cx)} ${n(top)}Z`
  )
}

let uid = 0
/** A document-unique id for clip paths and gradients. */
export const nextId = (p = 'e') => `${p}${++uid}`

export interface BodyOpts extends EggSize {
  fill: string
  shade?: string
  /** draw the contact shadow on the ground */
  ground?: boolean
  /** extra markup clipped to the shell (stripes, a hoodie…), drawn above the shade */
  inside?: string
  stroke?: number
}

/**
 * One egg body: ground shadow, flat fill, the cel-shade crescent on the
 * lower right, the highlight, and the outline on top.
 */
export function eggBody(o: BodyOpts) {
  const { cx = 100, bottom = 262, w = 172, h = 226 } = o
  const d = eggPath(o)
  const id = nextId('eb')
  const shade = o.shade ?? shadeOf(o.fill)
  const top = bottom - h
  const sx = w / 172
  const sy = h / 226
  // the highlight sits up on the left shoulder, along the curve
  const hx = cx - 44 * sx
  const hy = top + 62 * sy
  return `
    ${o.ground === false ? '' : `<ellipse class="egg__ground" cx="${n(cx + 4)}" cy="${n(bottom + 4)}" rx="${n(w * 0.44)}" ry="9" fill="${I}" opacity=".14"/>`}
    <clipPath id="${id}"><path d="${d}"/></clipPath>
    <path d="${d}" fill="${shade}"/>
    <g clip-path="url(#${id})">
      <path d="${d}" fill="${o.fill}" transform="translate(${n(-15 * sx)} ${n(-10 * sy)})"/>
      ${o.inside ?? ''}
      <ellipse cx="${n(hx)}" cy="${n(hy)}" rx="${n(11 * sx)}" ry="${n(22 * sy)}" transform="rotate(30 ${n(hx)} ${n(hy)})" fill="${lightOf(o.fill)}" opacity=".9"/>
      <circle cx="${n(hx - 9 * sx)}" cy="${n(hy + 34 * sy)}" r="${n(4.5 * sx)}" fill="${lightOf(o.fill)}" opacity=".9"/>
    </g>
    <path d="${d}" fill="none" stroke="${I}" stroke-width="${o.stroke ?? W.body}" stroke-linejoin="round"/>`
}

/** Same silhouette, clipped content only: for hoods, shirts and stripes. */
export function eggClip(o: EggSize = {}) {
  const id = nextId('ec')
  return { id, def: `<clipPath id="${id}"><path d="${eggPath(o)}"/></clipPath>`, url: `url(#${id})` }
}

export type Eyes = 'dot' | 'happy' | 'closed' | 'tired' | 'wide' | 'none'
export type Mouth = 'line' | 'smile' | 'grin' | 'o' | 'smirk' | 'tongue' | 'flat' | 'none'

export interface FaceOpts {
  cx?: number
  y?: number
  gap?: number
  eyes?: Eyes
  mouth?: Mouth
  blush?: boolean
  /** where the eyes look, in units */
  look?: [number, number]
  /** the colour behind the face, for eyelids */
  skin?: string
  /** draw a surprised face that shows while the egg is being pulled */
  wow?: boolean
  brows?: 'up' | 'one' | 'worried'
}

const eye = (x: number, y: number, kind: Eyes) => {
  switch (kind) {
    case 'dot':
      return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="4.8" ry="6.2" fill="${I}"/>`
    case 'wide':
      return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="6" ry="7.6" fill="${I}"/><circle cx="${n(x + 2)}" cy="${n(y - 2.6)}" r="2.1" fill="#fff"/>`
    case 'happy':
      return `<path d="M${n(x - 6.5)} ${n(y + 2.5)}q6.5 -10 13 0" fill="none" stroke="${I}" stroke-width="4" stroke-linecap="round"/>`
    case 'closed':
      return `<path d="M${n(x - 6.5)} ${n(y - 1)}q6.5 7 13 0" fill="none" stroke="${I}" stroke-width="4" stroke-linecap="round"/>`
    case 'tired':
      return `<path d="M${n(x - 5)} ${n(y - 0.5)}a5 6 0 0 0 10 0z" fill="${I}"/><path d="M${n(x - 7.5)} ${n(y - 1)}h15" stroke="${I}" stroke-width="3.4" stroke-linecap="round"/>`
    default:
      return ''
  }
}

const mouthPath = (x: number, y: number, kind: Mouth) => {
  const s = `fill="none" stroke="${I}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"`
  switch (kind) {
    case 'line':
      return `<path d="M${n(x - 4.5)} ${n(y)}h9" ${s}/>`
    case 'flat':
      return `<path d="M${n(x - 7)} ${n(y + 1)}q7 -2.5 14 0" ${s}/>`
    case 'smile':
      return `<path d="M${n(x - 8)} ${n(y - 2)}q8 8.5 16 0" ${s}/>`
    case 'smirk':
      return `<path d="M${n(x - 8)} ${n(y + 1)}q9 3.5 15 -5" ${s}/>`
    case 'o':
      return `<ellipse cx="${n(x)}" cy="${n(y + 1)}" rx="4.4" ry="5.4" fill="${I}"/>`
    case 'grin':
      return `<path d="M${n(x - 11)} ${n(y - 3)}h22q0 15 -11 15t-11 -15z" fill="${I}" stroke="${I}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M${n(x - 6)} ${n(y + 8)}q6 -6 12 0q-6 4 -12 0z" fill="${PALETTE.tomato}"/>`
    case 'tongue':
      return `<path d="M${n(x - 8)} ${n(y - 2)}q8 8.5 16 0" ${s}/>
        <path d="M${n(x + 2)} ${n(y + 2)}q1 9 6 7q4 -2 1 -9" fill="${PALETTE.tomato}" stroke="${I}" stroke-width="2.6" stroke-linejoin="round"/>`
    default:
      return ''
  }
}

/**
 * A face: two eyes, a mouth, optional blush and brows. Eyes sit in their
 * own group so CSS can blink them.
 */
export function face(o: FaceOpts = {}) {
  const { cx = 100, y = 132, gap = 21, eyes = 'dot', mouth = 'smile', look = [0, 0] } = o
  const [lx, ly] = look
  const ex = cx + lx
  const ey = y + ly
  const blush = o.blush
    ? `<ellipse cx="${n(cx - gap - 13)}" cy="${n(y + 15)}" rx="9.5" ry="5.2" fill="${PALETTE.pinkDeep}" opacity=".26"/>
       <ellipse cx="${n(cx + gap + 13)}" cy="${n(y + 15)}" rx="9.5" ry="5.2" fill="${PALETTE.pinkDeep}" opacity=".26"/>`
    : ''
  let brows = ''
  const bs = `fill="none" stroke="${I}" stroke-width="3.4" stroke-linecap="round"`
  if (o.brows === 'up') brows = `<path d="M${n(ex - gap - 7)} ${n(ey - 17)}q7 -5 14 -1M${n(ex + gap - 7)} ${n(ey - 18)}q7 -4 14 1" ${bs}/>`
  if (o.brows === 'one') brows = `<path d="M${n(ex - gap - 7)} ${n(ey - 13)}h13M${n(ex + gap - 7)} ${n(ey - 19)}q7 -6 14 0" ${bs}/>`
  if (o.brows === 'worried') brows = `<path d="M${n(ex - gap - 7)} ${n(ey - 13)}q7 -1 13 -6M${n(ex + gap - 6)} ${n(ey - 19)}q6 5 13 6" ${bs}/>`
  const main = `
    <g class="egg__face">
      ${blush}${brows}
      <g class="egg__eyes">${eye(ex - gap, ey, eyes)}${eye(ex + gap, ey, eyes)}</g>
      ${mouthPath(cx + lx * 0.6, y + 21 + ly * 0.4, mouth)}
    </g>`
  if (!o.wow) return main
  // pulled: eyes wide, mouth an "o"
  return `${main}
    <g class="egg__wow">
      ${o.blush ? blush : ''}
      ${eye(cx - gap, y - 1, 'wide')}${eye(cx + gap, y - 1, 'wide')}
      ${mouthPath(cx, y + 22, 'o')}
    </g>`
}

/** A mitten hand, floating by the body like the rooftop eggs'. */
export function hand(x: number, y: number, fill: string, rot = 0, s = 1) {
  return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(12.5 * s)}" ry="${n(10.5 * s)}" transform="rotate(${rot} ${n(x)} ${n(y)})" fill="${fill}" stroke="${I}" stroke-width="${W.prop}"/>`
}

/** A thick ink line. */
export const ink = (d: string, w: number = W.prop, c: string = I, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`

/**
 * The brand mark: the hero's golden egg with a face. Drawn on a 64×64
 * grid so it holds up as a 16px favicon.
 */
export function markSvg({ size = 64, bg }: { size?: number; bg?: string } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${bg ? `<rect width="64" height="64" fill="${bg}"/>` : ''}${MARK_INNER}</svg>`
}

/** The mark's paths, for inlining (nav, live badge) and for icon export. */
export const MARK_INNER = `<clipPath id="markClip"><path d="M32 4.5C44.5 4.5 55 23 55 38c0 13.5-10 21.5-23 21.5S9 51.5 9 38C9 23 19.5 4.5 32 4.5Z"/></clipPath><path d="M32 4.5C44.5 4.5 55 23 55 38c0 13.5-10 21.5-23 21.5S9 51.5 9 38C9 23 19.5 4.5 32 4.5Z" fill="#d39100"/><g clip-path="url(#markClip)"><path d="M32 4.5C44.5 4.5 55 23 55 38c0 13.5-10 21.5-23 21.5S9 51.5 9 38C9 23 19.5 4.5 32 4.5Z" fill="#f4b52a" transform="translate(-5 -4)"/><ellipse cx="20.5" cy="20" rx="3.6" ry="6.6" transform="rotate(30 20.5 20)" fill="#fdf3d7"/></g><path d="M32 4.5C44.5 4.5 55 23 55 38c0 13.5-10 21.5-23 21.5S9 51.5 9 38C9 23 19.5 4.5 32 4.5Z" fill="none" stroke="#1f1722" stroke-width="4.2" stroke-linejoin="round"/><g class="mark__eyes"><ellipse cx="24" cy="36" rx="4" ry="5" fill="#1f1722"/><ellipse cx="40" cy="36" rx="4" ry="5" fill="#1f1722"/></g>`
