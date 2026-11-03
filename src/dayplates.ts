import { $, $$, PALETTE, holdPin } from './util'
import { handEgg } from './riso'
import { lang } from './i18n'

/**
 * The day's plates, drawn in the house riso style (see riso.ts): each step of
 * the programme gets one sparse figure, one prop and one dry annotation, on a
 * shared ruler. Our egg and the two it meets at Crack are drawn once, in
 * plate units, so the pinned story (day.ts) can walk them across every plate,
 * and again into each plate for the vertical programme on phones.
 *
 * Plate units: every plate is 800 × 600 and stands on y = 600. Eggs are
 * drawn in the riso 200 × 260 egg box and stand on its y = 330 (their feet).
 */

const I = PALETTE.ink
const T = PALETTE.tomato
const tr = lang === 'tr'

export const PLATE = 800
export const GROUND = 600
/** Where our egg stands in every plate. */
export const MARK = 340
/** How far behind it the two walk, once they've joined. */
export const FOLLOW = [145, 275]
/** Where the two stand listening at Crack (plate 1). */
export const AUDIENCE = [540, 670]
/** The stage at Hatch (plate 5). */
export const STAGE = { l: 250, r: 720, h: 34 }
/** The stopwatch's middle at Crack (plate 1). */
export const WATCH = [624, 222] as const
/** The way down to the metro at Afterglow (plate 6). */
export const STAIRS = 672
/** Egg-box scale of the cast: our egg, then its teammates. */
export const K = { hero: 0.9, mate: 0.74 }
/** Where the shell lands on the stage at the pop: [x, y of the piece's middle, turn]. */
export const LANDED = { top: [650, 519, 172], bot: [490, 507, -8] } as const
/**
 * Phones frame each plate tighter (day.ts), so the cast can be drawn larger:
 * whatever matters at a step stands between `frame`'s two x, a few props and
 * notes standing a little further in than they do on a wide screen.
 */
export const PH = {
  frame: [-8, 692] as const,
  audience: [520, 615],
  landed: { top: [590, 519, 172], bot: [490, 507, -8] } as const,
  /** The metro, a step in, so its sign is whole when the camera follows the three there. */
  stairs: STAIRS - 12,
  /** Each plate's highest ink at rest: the step's copy stands just above it. */
  top: [158, 148, 191, 205, 181, 44, 167],
}
/** The middle of each half of the shell, in the egg box. */
export const PIECE = { top: [100, 78], bot: [100, 200] } as const

const HERO_EGG = handEgg(7, { w: 0.98, h: 1, lean: -2, taper: 0.13 })
const MATES = [
  { d: handEgg(23, { w: 0.92, h: 0.96, lean: 4, taper: 0.16 }), fill: '#bfd5e8' },
  { d: handEgg(41, { w: 0.9, h: 1.02, lean: -5, taper: 0.11 }), fill: '#f3c3b0' },
]
const EGG_BOX: Box = [6, 16, 190, 256]

type Box = [number, number, number, number]
interface PrintOpts {
  off?: [number, number]
  gap?: number
  sw?: number
  shade?: number
  dash?: number
  outline?: boolean
}

let uid = 0
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

/**
 * The riso recipe from riso.ts, for any closed shape: colour printed a few
 * units off the line, halftone on the far side, and a wobbly ink outline that
 * doesn't quite close.
 */
function print(d: string, fill: string, [bx, by, bw, bh]: Box, o: PrintOpts = {}) {
  const id = `dp${++uid}`
  const [ox, oy] = o.off ?? [7, 6]
  const gap = o.gap ?? 0.16
  const sw = o.sw ?? 4.4
  const tone =
    o.shade === 0
      ? ''
      : `<g clip-path="url(#${id})" opacity="${o.shade ?? 0.3}"><rect x="${bx + ox}" y="${by + oy}" width="${bw}" height="${bh}" fill="url(#dayDots)" mask="url(#dayShade)"/></g>`
  const outline =
    o.outline === false
      ? ''
      : `<path d="${d}" fill="none" stroke="${I}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" pathLength="100" stroke-dasharray="${100 - gap * 30} ${gap * 30}" stroke-dashoffset="${o.dash ?? (uid * 37) % 100}" filter="url(#wobble)"/>`
  return `<clipPath id="${id}"><path d="${d}" transform="translate(${ox} ${oy})"/></clipPath><path d="${d}" fill="${fill}" transform="translate(${ox} ${oy})"/>${tone}${outline}`
}

/** A hand-inked line. */
const line = (d: string, w = 3.6, extra = '') =>
  `<path d="${d}" fill="none" stroke="${I}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" filter="url(#wobble)" ${extra}/>`
/**
 * A hand-inked straight line. The wobble filter's region is a share of the
 * shape's box, which is zero across a perfectly straight line (so it would
 * vanish), hence an empty box around it to wobble in.
 */
const rule = (x1: number, y1: number, x2: number, y2: number, w = 3.6) => {
  const [x, y] = [Math.min(x1, x2) - 24, Math.min(y1, y2) - 24]
  return `<g filter="url(#wobble)"><rect x="${x}" y="${y}" width="${Math.abs(x2 - x1) + 48}" height="${Math.abs(y2 - y1) + 48}" fill="none"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="${I}" stroke-width="${w}" stroke-linecap="round"/></g>`
}
/** A tomato construction line: crisp, thin, technical. */
const red = (d: string, w = 2.2, extra = '') =>
  `<path d="${d}" fill="none" stroke="${T}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
const MONO = `font-family="DM Mono, ui-monospace, monospace" letter-spacing="1.6"`
const SERIF = `font-family="Fraunces, Georgia, serif" font-style="italic"`
const mono = (x: number, y: number, s: string, fill: string = T, extra = '') =>
  `<text x="${x}" y="${y}" ${MONO} font-size="26" fill="${fill}" ${extra}>${esc(s)}</text>`
const serif = (x: number, y: number, s: string, size = 28, extra = '') =>
  `<text x="${x}" y="${y}" ${SERIF} font-size="${size}" fill="${I}" ${extra}>${esc(s)}</text>`
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`

/** Shared defs for the day: a coarser riso screen, the shading ramp, the shell's split. */
export function installDayDefs() {
  const defs = document.querySelector('.defs defs')
  if (!defs || defs.querySelector('#dayDots')) return
  const zig = '0,128 22,112 40,132 62,108 84,134 104,110 126,136 146,112 166,132 186,114 200,124'
  defs.insertAdjacentHTML(
    'beforeend',
    `<pattern id="dayDots" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
       <circle cx="4.5" cy="4.5" r="1.7" fill="${I}"/>
     </pattern>
     <linearGradient id="dayShadeGrad" x1="0.15" y1="0.1" x2="0.95" y2="0.95">
       <stop offset="0.45" stop-color="#000"/><stop offset="1" stop-color="#fff"/>
     </linearGradient>
     <mask id="dayShade" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#dayShadeGrad)"/></mask>
     <clipPath id="dayTop"><polygon points="-40,-40 240,-40 240,124 200,124 ${zig.split(' ').reverse().join(' ')} -40,128"/></clipPath>
     <clipPath id="dayBot"><polygon points="-40,128 ${zig} 240,124 240,380 -40,380"/></clipPath>
     <clipPath id="dayEgg"><path d="${HERO_EGG}"/></clipPath>`,
  )
}

// ── the cast ────────────────────────────────────────────────────

const legs = () => `
  <g class="cm__legs" fill="none" stroke="${I}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round">
    <path class="leg leg--l" d="M82 246 L77 326 h-16"/>
    <path class="leg leg--r" d="M118 246 L123 326 h16"/>
  </g>`

/** One half of our egg's shell, with the cracks that half collects through the day. */
export const shellPiece = (which: 'top' | 'bot') => `
  <g clip-path="url(#${which === 'top' ? 'dayTop' : 'dayBot'})">${print(HERO_EGG, PALETTE.cream, EGG_BOX, { dash: 61 })}</g>
  ${
    which === 'top'
      ? `<path class="crack crack--a" pathLength="100" d="M140 44 l-12 22 l15 11 l-11 21"/>
         <g clip-path="url(#dayEgg)"><polyline class="crack crack--z" pathLength="100" points="0,128 22,112 40,132 62,108 84,134 104,110 126,136 146,112 166,132 186,114 200,124"/></g>`
      : `<path class="crack crack--b" pathLength="100" d="M34 182 l24 -7 l4 16 l22 -6"/>`
  }`

/** What was inside all along: the club's mark, golden, with its two eyes. */
const golden = () => `
  ${print(HERO_EGG, PALETTE.yolk, EGG_BOX, { off: [-6, -5], shade: 0.34, dash: 30 })}
  <ellipse cx="56" cy="92" rx="13" ry="25" transform="rotate(30 56 92)" fill="${PALETTE.butter}" opacity=".85"/>
  <ellipse cx="70" cy="166" rx="12" ry="16" fill="${I}"/><ellipse cx="130" cy="166" rx="12" ry="16" fill="${I}"/>`

/** A burst of short rays for the pop. */
const rays = () =>
  `<g class="cm__rays" opacity="0" fill="none" stroke="${I}" stroke-width="4" stroke-linecap="round">${Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const [c, s] = [Math.cos(a), Math.sin(a)]
    return `<path d="M${(100 + c * 128).toFixed(1)} ${(146 + s * 150).toFixed(1)} L${(100 + c * 160).toFixed(1)} ${(146 + s * 184).toFixed(1)}"/>`
  }).join('')}</g>`

const mateInner = (k: number) => `${legs()}${print(MATES[k].d, MATES[k].fill, EGG_BOX)}`

/** Place an egg-box drawing on a plate: centred on x, feet on the floor (less any lift). */
const at = (x: number, k: number, lift = 0) => `translate(${x} ${GROUND - lift}) scale(${k}) translate(-100 -330)`

/**
 * The cast for the pinned story: one long strip of seven plates (5600 × 600)
 * laid over the track, so whatever the cast leaves behind (the shell) stays
 * in its plate as the day moves on.
 */
export function castSvg() {
  return `
    <clipPath id="dayFloor"><rect x="-4000" y="-4000" width="14000" height="${4000 + GROUND + 4}"/></clipPath>
    <g clip-path="url(#dayFloor)">
      <g class="cm cm--mate" id="mateB">${mateInner(1)}</g>
      <g class="cm cm--mate" id="mateA">${mateInner(0)}</g>
      <g class="cm cm--hero" id="walker">
        ${legs()}
        ${rays()}
        <g class="cm__golden" opacity="0">${golden()}</g>
      </g>
      <g class="cm__piece" id="shellBot">${shellPiece('bot')}</g>
      <g class="cm__piece" id="shellTop">${shellPiece('top')}</g>
    </g>
    <g class="cast__door" id="dayDoor" transform="translate(230 250)">${doorLeaf()}</g>`
}

/** Our egg as it is at each step, drawn into the plate (phones, reduced motion). */
function heroAt(step: number) {
  const lift = step === 5 ? STAGE.h : 0
  if (step >= 5) return `<g transform="${at(MARK, K.hero, lift)}">${legs()}${golden()}</g>`
  return `<g transform="${at(MARK, K.hero)}">${legs()}${shellPiece('bot')}${shellPiece('top')}</g>`
}
/** How cracked our egg's shell is by each step (4 is hatched). */
const STAGE_OF = [0, 1, 1, 2, 3, 4, 4]
function castAt(step: number, ph: boolean) {
  const audience = ph ? PH.audience : AUDIENCE
  const landed = ph ? PH.landed : LANDED
  const mates =
    step === 0
      ? ''
      : [1, 0]
          .map((k) => {
            const x = step === 1 ? audience[k] : MARK - FOLLOW[k]
            return `<g transform="${at(x, K.mate)}">${mateInner(k)}</g>`
          })
          .join('')
  const shells =
    step === 5
      ? (['bot', 'top'] as const)
          .map((p) => {
            const [x, y, r] = landed[p]
            const [cx, cy] = PIECE[p]
            return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${K.hero}) translate(${-cx} ${-cy})">${shellPiece(p)}</g>`
          })
          .join('')
      : ''
  const door = step === 0 ? `<g transform="translate(230 250) scale(-0.34 1)">${doorLeaf()}</g>` : ''
  return `<g class="fig__cast" data-stage="${STAGE_OF[step]}">${mates}${heroAt(step)}${shells}${door}</g>`
}

// ── the plates ──────────────────────────────────────────────────

const doorLeaf = () => `
  ${print('M0 0 H220 V350 H0 Z', PALETTE.butter, [0, 0, 220, 350], { off: [6, 5], sw: 4 })}
  ${line('M26 26 H194 V160 H26 Z M26 196 H194 V324 H26 Z', 2.2, 'opacity=".5"')}
  <circle cx="190" cy="186" r="7" fill="${I}"/>`

/** 10:30 Doors: the door it arrives through, measured (on a phone, both ways: not to scale). */
function doors(ph: boolean) {
  return `
    ${print('M232 600 V252 H448 V600 Z', PALETTE.sky, [232, 252, 216, 348], { outline: false, shade: 0.22 })}
    ${line('M230 600 V250 H450 V600', 4.4)}
    ${line('M212 600 V232 H468 V600', 2.4)}
    ${red('M494 250 V600 M484 250 h20 M484 600 h20')}
    ${mono(522, 425, '2.10 m', T, 'text-anchor="middle" transform="rotate(-90 522 425)"')}
    ${ph ? `${red('M212 200 H468 M212 190 v20 M468 190 v20')}${mono(340, 180, '0.90 m', T, 'text-anchor="middle"')}` : ''}`
}

/** 11:00 Crack: a sixty-second pitch against the stopwatch, and the first hairline. */
function crack(ph: boolean) {
  const [cx, cy, r] = [...WATCH, 58]
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    const [s, c] = [Math.sin(a), -Math.cos(a)]
    return `M${(cx + s * (r - 13)).toFixed(1)} ${(cy + c * (r - 13)).toFixed(1)} L${(cx + s * (r - 5)).toFixed(1)} ${(cy + c * (r - 5)).toFixed(1)}`
  }).join(' ')
  return `
    ${print(`M${cx - 12} ${cy - r - 16} h24 v14 h-24 Z`, PALETTE.cream, [cx - 12, cy - r - 16, 24, 14], { shade: 0, sw: 3.4 })}
    ${print(circle(cx, cy, r), PALETTE.cream, [cx - r, cy - r, 2 * r, 2 * r])}
    <path d="${ticks}" stroke="${I}" stroke-width="2.4" stroke-linecap="round"/>
    <g class="watch__hand" transform="rotate(252 ${cx} ${cy})">${red(`M${cx} ${cy + 8} V${cy - r + 12}`, 3.4)}</g>
    <circle cx="${cx}" cy="${cy}" r="4.5" fill="${I}"/>
    ${mono(cx, cy + r + 38, '60 s', T, 'text-anchor="middle"')}
    <g class="here here--late">
      ${serif(394, 356, '¹', 40)}
      ${serif(ph ? 14 : 0, ph ? 168 : 74, tr ? '¹ kılcal çatlak. arkası gelecek.' : '¹ hairline crack. more to follow.', 27, `fill-opacity=".8"`)}
    </g>`
}

/** 11:30 Nest: the idea on the wall, and the team it gathered, circled. */
function nest(ph: boolean) {
  return `
    <g transform="${ph ? 'translate(0 -86) ' : ''}rotate(6 612 330)">
      ${print('M562 282 H662 V380 H562 Z', PALETTE.butter, [562, 282, 100, 98], { sw: 3.4 })}
      ${line('M578 310 H646 M578 330 H640 M578 350 H624', 2.2, 'opacity=".55"')}
    </g>
    <g class="here"${ph ? ' transform="translate(14 0)"' : ''}>
      ${red('M-30 452 C -30 332 90 282 220 284 C 360 286 456 350 452 456 C 448 560 340 612 206 610 C 70 608 -30 560 -30 452 Z', 2.2, 'stroke-dasharray="11 9"')}
      ${mono(14, 262, tr ? 'yuva (aşağı yukarı) · n = 3' : 'nest (approx.) · n = 3')}
    </g>`
}

/** 12:00 Incubate: one laptop, a progress bar that keeps resetting, and six hours, abridged. */
function incubate(ph: boolean) {
  return `
    ${ph ? '<g transform="translate(-26 0)">' : ''}
    ${rule(452, 468, 716, 468, 4.4)}
    ${line('M474 468 V600 M694 468 V600', 3.6)}
    ${print('M510 462 L524 352 L674 352 L664 462 Z', PALETTE.lav, [510, 352, 164, 110], { sw: 4 })}
    ${line('M488 462 H686 L692 470 H482 Z', 3)}
    <ellipse cx="594" cy="404" rx="11" ry="14" fill="${PALETTE.yolk}" stroke="${I}" stroke-width="2"/>
    <g class="here">
      ${ph ? '<g transform="translate(0 -50)">' : ''}
      <rect x="484" y="290" width="200" height="16" fill="none" stroke="${T}" stroke-width="2.2"/>
      <rect class="bar__fill" x="487" y="293" width="194" height="10" fill="${T}"/>
      ${mono(484, 274, 'v0.3 · 100%', T, 'class="bar__label"')}
      ${ph ? '</g>' : ''}
    </g>
    ${ph ? '</g>' : ''}
    <rect class="plate__sky" x="772" y="586" width="16" height="32" style="fill: var(--page)"/>
    ${line('M764 620 L778 582 M782 620 L796 582', 2.6)}
    ${mono(714, 566, tr ? '≈ 6 sa' : '≈ 6 h', I, 'fill-opacity=".72"')}`
}

/**
 * 18:00 Pizza: box one of twelve, and the pineapple question, still open.
 * (A phone has the box a step closer, and the question up in the air.)
 */
function pizza(ph: boolean) {
  const dx = ph ? -76 : 0
  const [cx, cy, rx, ry] = [618 + dx, 543, 116, 46]
  const slices = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((i) => {
      const a = (i / 8) * Math.PI * 2 + 0.3
      return `M${cx} ${cy} L${(cx + Math.cos(a) * (rx - 4)).toFixed(1)} ${(cy + Math.sin(a) * (ry - 3)).toFixed(1)}`
    })
    .join(' ')
  const tops = [
    [566, 534],
    [596, 566],
    [664, 528],
    [690, 556],
    [624, 518],
    [548, 556],
  ]
    .map(([x, y]) => `<ellipse cx="${x + dx}" cy="${y}" rx="10" ry="6" fill="${T}"/>`)
    .join('')
  const [lead, end, y] = ph ? ['M578 538 L614 242 H664', 664, 200] : ['M654 540 L680 470 H796', 796, 428]
  return `
    ${print(`M${470 + dx} 600 L${766 + dx} 600 L${734 + dx} 486 L${502 + dx} 486 Z`, PALETTE.cream, [470 + dx, 486, 296, 114], { sw: 4 })}
    ${print(`M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`, '#f6cf7a', [cx - rx, cy - ry, 2 * rx, 2 * ry], { sw: 3.4, off: [5, 4] })}
    <path d="${slices}" stroke="${I}" stroke-width="2" opacity=".5"/>
    ${tops}
    <path d="M${640 + dx} 552 l14 -17 l10 19 Z" fill="${PALETTE.yolk}" stroke="${I}" stroke-width="2.2"/>
    ${red(lead)}
    ${mono(end, y, tr ? 'ananas' : 'pineapple', T, 'text-anchor="end"')}
    ${mono(end, y + 28, tr ? '(tartışmalı)' : '(disputed)', T, 'text-anchor="end"')}`
}

/** 19:00 Hatch: a stage, a lamp, and a status report (on a phone, up beside the lamp). */
function hatch(ph: boolean) {
  return `
    ${rule(340, ph ? 44 : 8, 340, 96, 2.6)}
    ${print('M318 96 H362 L378 124 H302 Z', PALETTE.cream, [302, 96, 76, 28], { shade: 0, sw: 3.4 })}
    <polygon class="here" points="308,128 372,128 478,566 202,566" fill="${PALETTE.butter}" opacity=".8"/>
    ${print(`M${STAGE.l} 600 V${600 - STAGE.h} H${STAGE.r} V600 Z`, '#cbc0ea', [STAGE.l, 600 - STAGE.h, STAGE.r - STAGE.l, STAGE.h], { sw: 4 })}
    <g class="here here--late">
      ${red('M340 270 V528 M198 398 H482')}
      <circle cx="340" cy="398" r="118" fill="none" stroke="${T}" stroke-width="2.2"/>
      ${ph ? '<g transform="translate(-110 -80)">' : ''}
      ${mono(494, 296, tr ? 'durum: çalışıyor*' : 'status: working*')}
      ${serif(494, 332, tr ? '* iddialı ama bozuk' : '* ambitious and broken', 25, `fill-opacity=".8"`)}
      ${serif(494, 362, tr ? 'olması da sayılır.' : 'also counts.', 25, `fill-opacity=".8"`)}
      ${ph ? '</g>' : ''}
      ${red('M176 352 l-12 -14 M195 344 v-18 M214 352 l12 -14 M46 372 l-12 -14 M65 364 v-18 M84 372 l12 -14', 2.6)}
    </g>`
}

/** 20:00 Afterglow: the metro home, and a group chat that carries on without them. */
function afterglow(ph: boolean) {
  const at = ph ? PH.stairs : STAIRS
  const m = at + 90
  return `
    ${metroEntrance(at)}
    ${rule(m, 600, m, 340, 4.4)}
    ${print(circle(m, 300, 40), PALETTE.cream, [m - 40, 260, 80, 80])}
    <text x="${m}" y="317" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="46" fill="${I}">M</text>
    ${print(`M${m - 44} 352 H${m + 44} V384 H${m - 44} Z`, PALETTE.cream, [m - 44, 352, 88, 32], { shade: 0, sw: 3 })}
    <text x="${m}" y="376" text-anchor="middle" ${MONO} font-size="19" fill="${I}">ODTÜ</text>
    <g class="here chat">
      ${red(ph ? 'M386 330 L412 208' : 'M386 330 L412 262', 2.2, 'class="chat__lead"')}
      ${mono(420, ph ? 186 : 240, tr ? 'grup sohbeti' : 'group chat', T)}
      ${mono(420, ph ? 216 : 270, tr ? '214 okunmamış' : '214 unread', T, 'class="chat__n"')}
    </g>`
}

/** The metro entrance the three walk into: a canopy on two posts over the steps down into the dark. */
function metroEntrance(at: number) {
  const x0 = at - 72
  const x1 = at + 72
  const top = 340
  // the steps' nosings, catching the light as they go down
  const steps = Array.from({ length: 8 }, (_, k) => {
    const y = 600 - 22 - k * 28
    const inset = 22 + k * 5
    return `<path d="M${x0 + inset} ${y} H${x1 - inset}" stroke="${PALETTE.lav}" stroke-width="3" stroke-linecap="round" opacity="${(0.9 - k * 0.09).toFixed(2)}"/>`
  }).join('')
  return `
    ${print(`M${x0 + 12} 600 V${top + 6} H${x1 - 12} V600 Z`, PALETTE.night, [x0 + 12, top + 6, x1 - x0 - 24, 600 - top - 6], { shade: 0.45, outline: false })}
    ${steps}
    ${rule(x0 + 12, top, x0 + 12, 600, 3.8)}
    ${rule(x1 - 12, top, x1 - 12, 600, 3.8)}
    ${print(`M${x0 - 16} ${top} H${x1 + 16} L${x1 + 4} ${top - 24} H${x0 - 4} Z`, PALETTE.cream, [x0 - 16, top - 24, x1 - x0 + 32, 24], { sw: 3.8 })}`
}

const PLATES: ((ph: boolean) => string)[] = [doors, crack, nest, incubate, pizza, hatch, afterglow]

/**
 * One step's plate: its props and notes, and (for the vertical programme) the
 * cast as it is then. `ph`: drawn for the phone story's tighter frame (PH);
 * `crop`: and cut to that frame, from just over its highest ink to the floor.
 */
export function plateSvg(step: number, ph = false, crop = false) {
  const [l, r] = PH.frame
  const top = PH.top[step] - 12
  const box = crop ? `${l} ${top} ${r - l} ${GROUND - top}` : `0 0 ${PLATE} 600`
  return `<svg viewBox="${box}" aria-hidden="true" focusable="false">${PLATES[step](ph)}${castAt(step, ph)}</svg>`
}

/**
 * The day's layouts: day.ts runs one walk or programme per query, and each wants its own plates
 * (`wide` and `still`: as the wide layouts draw them; the phone walks: framed for the phone story;
 * `crop`: framed so and cut to their ink, for a narrow vertical programme).
 */
export const DAY_MEDIA = {
  wide: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
  phoneTall: '(max-width: 899px) and (orientation: portrait) and (min-height: 720px) and (prefers-reduced-motion: no-preference)',
  phoneShort: '(max-width: 899px) and (orientation: portrait) and (max-height: 719.98px) and (prefers-reduced-motion: no-preference)',
  crop: '(max-width: 899px) and (orientation: landscape), (max-width: 899px) and (prefers-reduced-motion: reduce)',
  still: '(min-width: 900px) and (prefers-reduced-motion: reduce)',
} as const

type Plates = 'wide' | 'phone' | 'crop'
let drawn: Plates | null = null
/** Draw the plates for a layout; drawn again only when the layout needs another kind. */
export const drawPlates = (kind: Plates) => {
  if (kind === drawn) return
  drawn = kind
  $$<HTMLElement>('#day .step__fig').forEach((fig, i) => (fig.innerHTML = plateSvg(i, kind !== 'wide', kind === 'crop')))
}

/**
 * Draw the plates and the cast. Runs before anything measures the page, and draws the plates
 * the layout on screen will want, so a phone doesn't draw the wide ones only to throw them away.
 */
export function renderDay() {
  installDayDefs()
  // What pins in the day gets its spacer now, before the plates are written into it: the
  // section on wide screens, the stage (with its heading) on tall phones, the stage alone on short ones.
  const day = document.getElementById('day')
  if (day) {
    holdPin(day, 'day')
    holdPin($('.day__pin', day), 'stage')
    holdPin($('.day__viewport', day), 'view')
  }
  const on = (q: string) => matchMedia(q).matches
  const kind: Plates = on(DAY_MEDIA.crop) ? 'crop' : on(DAY_MEDIA.phoneTall) || on(DAY_MEDIA.phoneShort) ? 'phone' : 'wide'
  // Every stroke takes its gap from the order it's drawn in (print, inkEgg), and the wide plates
  // have always been written first, then the cast, then any other framing: write them still, so
  // each line keeps its gap, but only put the plates on the page that the layout will show.
  const wide = PLATES.map((_, i) => plateSvg(i))
  const cast = document.getElementById('dayCast')
  if (cast && !cast.childElementCount) cast.innerHTML = castSvg()
  if (kind === 'wide') {
    drawn = 'wide'
    $$<HTMLElement>('#day .step__fig').forEach((fig, i) => (fig.innerHTML = wide[i]))
  } else drawPlates(kind)
}
