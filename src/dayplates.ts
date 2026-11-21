import { $$, PALETTE, nextTask } from './util'
import { handEgg } from './riso'
import { flatten, halftone, sketch } from './sketch'
import { lang } from './i18n'

/**
 * The day's storyboard, drawn in the house riso style (see riso.ts): each step of the programme
 * is one frame, with a sparse scene, one prop, a dry annotation or two, and the cast as it is at
 * that hour. Read across the frames, one egg arrives, cracks a little more at every step, picks
 * up two teammates at Nest, hatches the club's golden egg on stage and takes the metro home.
 *
 * Every frame is the same picture box at the same scale (BOX), so the eggs are the same size
 * from frame to frame, and every scene stands on the same floor line (GROUND) with a short ruler
 * under it. Eggs are drawn in the riso 200 × 260 egg box and stand on its y = 330 (their feet).
 *
 * The ink is drawn, not filtered (src/sketch.ts, as the plate of regulars is): a line is bent
 * once, when it is drawn, and the halftone is real dots, so nothing here is filtered or masked
 * when it paints. That is also why this file belongs to the scroll layer, not the entry.
 */

const I = PALETTE.ink
const T = PALETTE.tomato
/**
 * What is white in a scene (our egg's shell, the stopwatch's face, the pizza box): a shade whiter
 * than the sheet's cream, so on that paper it still prints as a colour, a little off its line.
 */
const WHITE = '#fffefb'
const tr = lang === 'tr'

/** The floor every scene stands on, in plate units. */
const GROUND = 600
/**
 * The picture box: its width, where it starts over the scene, and its foot (the ruler's ticks
 * hang under the floor line, and the nest's circle and the six-hour break dip under it).
 */
const BOX = { w: 720, top: 100, foot: 626 }
/** Where our egg stands in a frame, and its two teammates beside it once they've joined. */
const MARK = 340
const BESIDE: [number, number] = [195, 65]
/** Egg-box scale of the cast: our egg, then its teammates. */
const K = { hero: 0.9, mate: 0.74 }
/** The stage at Hatch. */
const STAGE = { l: 250, r: 696, h: 34 }
/** Where the shell lands on the stage at the pop: [x, y of the piece's middle, turn]. */
const LANDED = { top: [602, 519, 172], bot: [498, 507, -8] } as const
/** The middle of each half of the shell, in the egg box. */
const PIECE = { top: [100, 78], bot: [100, 200] } as const

const HERO_EGG = handEgg(7, { w: 0.98, h: 1, lean: -2, taper: 0.13 })
const MATES = [
  { d: handEgg(23, { w: 0.92, h: 0.96, lean: 4, taper: 0.16 }), fill: '#bfd5e8', dash: 48 },
  { d: handEgg(41, { w: 0.9, h: 1.02, lean: -5, taper: 0.11 }), fill: '#f3c3b0', dash: 11 },
]
interface PrintOpts {
  off?: [number, number]
  gap?: number
  sw?: number
  shade?: number
  dash?: number
  outline?: boolean
  /** the scale the shape is drawn at (an egg's box is set smaller than the frame) */
  k?: number
}
/** The halftone screen, in plate units: its step and its largest dot, the same across a frame whatever a shape's own scale. */
const SCREEN = { pitch: 9.6, dot: 2.6 }

/** A count that starts over with each frame: where a line's gap falls. */
let nth = 0
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

/**
 * Bending a line and setting a shape's dots are the costly part of a scene, and the cast is the
 * same three eggs in every frame: each is worked out once and kept.
 */
const kept = new Map<string, string>()
const keep = (key: string, make: () => string) => {
  let v = kept.get(key)
  if (v === undefined) kept.set(key, (v = make()))
  return v
}
const pen = (d: string) => keep(d, () => sketch(d))
/** (a shape of straight edges is its corners; a curved one, a point every ten units) */
const tone = (d: string, k: number, shade: number) =>
  keep(`${d}|${k}|${shade}`, () => halftone(flatten(d, /[csqt]/i.test(d) ? 10 : 1e6)?.[0]?.pts ?? [], SCREEN.pitch / k, SCREEN.dot / k, shade))

/**
 * The riso recipe from riso.ts, for any closed shape: colour printed a few units off the line,
 * halftone on the far side (a coarser screen than the plate's: a frame is printed smaller), and
 * a hand-drawn ink outline that doesn't quite close.
 */
function print(d: string, fill: string, o: PrintOpts = {}) {
  nth++
  const [ox, oy] = o.off ?? [7, 6]
  const gap = o.gap ?? 0.16
  const sw = o.sw ?? 4.4
  const k = o.k ?? 1
  const dots = o.shade === 0 ? '' : tone(d, k, o.shade ?? 0.3)
  const outline =
    o.outline === false
      ? ''
      : `<path d="${pen(d)}" fill="none" stroke="${I}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" pathLength="100" stroke-dasharray="${100 - gap * 30} ${gap * 30}" stroke-dashoffset="${o.dash ?? (nth * 37) % 100}"/>`
  return `<g transform="translate(${ox} ${oy})"><path d="${d}" fill="${fill}"/>${dots}</g>${outline}`
}

/** A hand-inked line. */
const line = (d: string, w = 3.6, extra = '') =>
  `<path d="${pen(d)}" fill="none" stroke="${I}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
/** A hand-inked straight line. */
const rule = (x1: number, y1: number, x2: number, y2: number, w = 3.6) => line(`M${x1} ${y1}L${x2} ${y2}`, w)
/** A tomato construction line: crisp, thin, technical. */
const red = (d: string, w = 2.2, extra = '') =>
  `<path d="${d}" fill="none" stroke="${T}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
/** The notes: a frame is printed small (a phone's is some 300px across), so they are set large in plate units. */
const MONO = `font-family="DM Mono, ui-monospace, monospace" letter-spacing="1"`
const SERIF = `font-family="Fraunces, Georgia, serif" font-style="italic"`
const mono = (x: number, y: number, s: string, fill: string = T, extra = '') =>
  `<text x="${x}" y="${y}" ${MONO} font-size="30" fill="${fill}" ${extra}>${esc(s)}</text>`
const serif = (x: number, y: number, s: string, size = 29, extra = '') =>
  `<text x="${x}" y="${y}" ${SERIF} font-size="${size}" fill="${I}" ${extra}>${esc(s)}</text>`
/** A circle or an oval as four curves (the pen and the halftone read curves, not arcs). */
const oval = (cx: number, cy: number, rx: number, ry = rx) => {
  const [kx, ky] = [rx * 0.5523, ry * 0.5523]
  return `M${cx - rx} ${cy}C${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry}C${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}C${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry}C${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy}Z`
}

/** Where the shell splits at the hatch, across the egg box. */
const ZIG = '0,128 22,112 40,132 62,108 84,134 104,110 126,136 146,112 166,132 186,114 200,124'

/** Shared defs for the day: the two halves the shell splits into, and the egg it is. */
function installDayDefs() {
  const defs = document.querySelector('.defs defs')
  if (!defs || defs.querySelector('#dayEgg')) return
  defs.insertAdjacentHTML(
    'beforeend',
    `<clipPath id="dayTop"><polygon points="-40,-40 240,-40 240,124 200,124 ${ZIG.split(' ').reverse().join(' ')} -40,128"/></clipPath>
     <clipPath id="dayBot"><polygon points="-40,128 ${ZIG} 240,124 240,380 -40,380"/></clipPath>
     <clipPath id="dayEgg"><path d="${HERO_EGG}"/></clipPath>`,
  )
}

// ── the cast ────────────────────────────────────────────────────

const legs = () =>
  `<path d="M82 246 L77 326 h-16 M118 246 L123 326 h16" fill="none" stroke="${I}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>`

const INK = `fill="none" stroke="${I}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`
/** The line the shell splits along, as far as the egg goes. */
const SPLIT = `<g clip-path="url(#dayEgg)"><polyline points="${ZIG}" ${INK}/></g>`
/**
 * The cracks our egg's shell collects, in the order they come: the hairline at Crack, then one
 * more a step, and by Pizza the split it will hatch along. [which half it is on, the line]
 */
const CRACKS: ['top' | 'bot' | 'both', string][] = [
  ['top', `<path d="M140 44 l-12 22 l15 11 l-11 21" ${INK}/>`],
  ['bot', `<path d="M34 182 l24 -7 l4 16 l22 -6" ${INK}/>`],
  ['bot', `<path d="M178 200 l-23 -5 l-2 16 l-21 -7" ${INK}/>`],
  ['both', SPLIT],
]
const cracksOn = (n: number, half?: 'top' | 'bot') =>
  CRACKS.slice(0, n)
    .filter(([on]) => !half || on === half || on === 'both')
    .map(([, d]) => d)
    .join('')

/** Our egg's shell, whole, as cracked as it is by then. */
const shell = (cracks: number) => `${print(HERO_EGG, WHITE, { dash: 61, k: K.hero })}${cracksOn(cracks)}`
/** One half of it, once it has hatched: its own share of the cracks, and the split as its rim. */
const shellPiece = (half: 'top' | 'bot') =>
  `<g clip-path="url(#${half === 'top' ? 'dayTop' : 'dayBot'})">${print(HERO_EGG, WHITE, { dash: 61, k: K.hero })}</g>${cracksOn(CRACKS.length, half)}`

/** What was inside all along: the club's mark, golden, with its two eyes. */
const golden = () => `
  ${print(HERO_EGG, PALETTE.yolk, { off: [-6, -5], shade: 0.34, dash: 30, k: K.hero })}
  <ellipse cx="56" cy="92" rx="13" ry="25" transform="rotate(30 56 92)" fill="${PALETTE.butter}" opacity=".85"/>
  <ellipse cx="70" cy="166" rx="12" ry="16" fill="${I}"/><ellipse cx="130" cy="166" rx="12" ry="16" fill="${I}"/>`

const mate = (k: number) => `${legs()}${print(MATES[k].d, MATES[k].fill, { k: K.mate, dash: MATES[k].dash })}`

/** Place an egg-box drawing in a frame: centred on x, feet on the floor (less any lift). */
const at = (x: number, k: number, lift = 0) => `translate(${x} ${GROUND - lift}) scale(${k}) translate(-100 -330)`

interface Cast {
  /** where our egg stands */
  hero?: number
  /** how cracked its shell is; `hatched`: the golden egg is out, `shells`: and its shell lies where it fell */
  cracks?: number
  hatched?: boolean
  shells?: boolean
  /** off the floor (the stage) */
  lift?: number
  /** where the two stand: the blue one, then the pink */
  mates?: [number, number]
}

/** The cast as it is at a step: the two behind, our egg in front of them, the shell in front of all. */
function cast({ hero = MARK, cracks = 0, hatched, shells, lift = 0, mates }: Cast) {
  const two = mates ? [1, 0].map((k) => `<g transform="${at(mates[k], K.mate)}">${mate(k)}</g>`).join('') : ''
  const ours = `<g transform="${at(hero, K.hero, lift)}">${legs()}${hatched ? golden() : shell(cracks)}</g>`
  const halves = shells
    ? (['bot', 'top'] as const)
        .map((p) => {
          const [x, y, r] = LANDED[p]
          const [cx, cy] = PIECE[p]
          return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${K.hero}) translate(${-cx} ${-cy})">${shellPiece(p)}</g>`
        })
        .join('')
    : ''
  return two + ours + halves
}

// ── the scenes ──────────────────────────────────────────────────

const doorLeaf = () => `
  ${print('M0 0 H220 V350 H0 Z', PALETTE.butter, { off: [6, 5], sw: 4 })}
  ${line('M26 26 H194 V160 H26 Z M26 196 H194 V324 H26 Z', 2.2, 'opacity=".5"')}
  <circle cx="190" cy="186" r="7" fill="${I}"/>`

/** 10:30 Doors: the door it arrives through, open, and measured both ways (not to scale). */
function doors() {
  return `
    ${print('M232 600 V252 H448 V600 Z', PALETTE.sky, { outline: false, shade: 0.22 })}
    ${line('M230 600 V250 H450 V600', 4.4)}
    ${line('M212 600 V232 H468 V600', 2.4)}
    ${red('M494 250 V600 M484 250 h20 M484 600 h20')}
    ${mono(532, 425, '2.10 m', T, 'text-anchor="middle" transform="rotate(-90 532 425)"')}
    ${red('M212 200 H468 M212 190 v20 M468 190 v20')}
    ${mono(340, 176, '0.90 m', T, 'text-anchor="middle"')}
    <g transform="translate(230 250) scale(-0.34 1)">${doorLeaf()}</g>`
}

/** 11:00 Crack: a sixty-second pitch against the stopwatch, two listening, and the first hairline. */
function crack() {
  const [cx, cy, r] = [604, 214, 58]
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    const [s, c] = [Math.sin(a), -Math.cos(a)]
    return `M${(cx + s * (r - 13)).toFixed(1)} ${(cy + c * (r - 13)).toFixed(1)} L${(cx + s * (r - 5)).toFixed(1)} ${(cy + c * (r - 5)).toFixed(1)}`
  }).join(' ')
  return `
    ${print(`M${cx - 12} ${cy - r - 16} h24 v14 h-24 Z`, WHITE, { shade: 0, sw: 3.4 })}
    ${print(oval(cx, cy, r), WHITE)}
    <path d="${ticks}" stroke="${I}" stroke-width="2.4" stroke-linecap="round"/>
    <g transform="rotate(252 ${cx} ${cy})">${red(`M${cx} ${cy + 8} V${cy - r + 12}`, 3.4)}</g>
    <circle cx="${cx}" cy="${cy}" r="4.5" fill="${I}"/>
    ${mono(cx, cy + r + 42, '60 s', T, 'text-anchor="middle"')}
    ${serif(8, 164, tr ? '¹ kılcal çatlak. arkası gelecek.' : '¹ hairline crack. more to follow.', 29, `fill-opacity=".8"`)}`
}
/** (the footnote's mark, beside the crack it cites: over the shell, so drawn after the cast) */
const crackMark = () => serif(394, 356, '¹', 40)

/** 11:30 Nest: the idea on the wall, and the team it gathered, circled. */
function nest() {
  return `
    <g transform="translate(0 -86) rotate(6 612 330)">
      ${print('M562 282 H662 V380 H562 Z', PALETTE.butter, { sw: 3.4 })}
      ${line('M578 310 H646 M578 330 H640 M578 350 H624', 2.2, 'opacity=".55"')}
    </g>
    ${red('M-16 452 C -16 332 104 282 234 284 C 374 286 470 350 466 456 C 462 560 354 612 220 610 C 84 608 -16 560 -16 452 Z', 2.2, 'stroke-dasharray="11 9"')}
    ${mono(28, 258, tr ? 'yuva (aşağı yukarı) · n = 3' : 'nest (approx.) · n = 3')}`
}

/** Where the floor line breaks at Incubate: six hours, abridged. */
const BREAK: [number, number] = [672, 688]
/** 12:00 Incubate: three at one laptop, a progress bar that keeps resetting, and six hours, abridged. */
function incubate() {
  return `
    ${rule(366, 468, 612, 468, 4.4)}
    ${line('M392 468 V600 M590 468 V600', 3.6)}
    ${print('M420 462 L434 352 L584 352 L574 462 Z', PALETTE.lav, { sw: 4 })}
    ${line('M398 462 H596 L602 470 H392 Z', 3)}
    <ellipse cx="504" cy="404" rx="11" ry="14" fill="${PALETTE.yolk}" stroke="${I}" stroke-width="2"/>
    <rect x="391" y="240" width="222" height="16" fill="none" stroke="${T}" stroke-width="2.2"/>
    <rect x="394" y="243" width="216" height="10" fill="${T}"/>
    ${mono(391, 222, 'v0.3 · 100%')}
    ${mono(704, 562, tr ? '≈ 6 sa' : '≈ 6 h', I, 'text-anchor="end" fill-opacity=".72"')}`
}

/** 16:30 Pizza: box one of twelve, and the pineapple question, still open, up in the air. */
function pizza() {
  const [cx, cy, rx, ry] = [542, 543, 116, 46]
  const slices = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((i) => {
      const a = (i / 8) * Math.PI * 2 + 0.3
      return `M${cx} ${cy} L${(cx + Math.cos(a) * (rx - 4)).toFixed(1)} ${(cy + Math.sin(a) * (ry - 3)).toFixed(1)}`
    })
    .join(' ')
  const tops = [
    [490, 534],
    [520, 566],
    [588, 528],
    [614, 556],
    [548, 518],
    [472, 556],
  ]
    .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="6" fill="${T}"/>`)
    .join('')
  return `
    ${print('M394 600 L690 600 L658 486 L426 486 Z', WHITE, { sw: 4 })}
    ${print(oval(cx, cy, rx, ry), '#f6cf7a', { sw: 3.4, off: [5, 4] })}
    <path d="${slices}" stroke="${I}" stroke-width="2" opacity=".5"/>
    ${tops}
    <path d="M564 552 l14 -17 l10 19 Z" fill="${PALETTE.yolk}" stroke="${I}" stroke-width="2.2"/>
    ${red('M578 538 L614 246 H676')}
    ${mono(676, 198, tr ? 'ananas' : 'pineapple', T, 'text-anchor="end"')}
    ${mono(676, 232, tr ? '(tartışmalı)' : '(disputed)', T, 'text-anchor="end"')}`
}

/** 17:30 Hatch: a stage, a lamp hung from the top of the frame, and a status report. */
function hatch() {
  return `
    ${rule(340, BOX.top, 340, 136, 2.6)}
    ${print('M318 136 H362 L378 164 H302 Z', WHITE, { shade: 0, sw: 3.4 })}
    <polygon points="308,168 372,168 478,566 202,566" fill="${PALETTE.butter}" opacity=".8"/>
    ${print(`M${STAGE.l} 600 V${600 - STAGE.h} H${STAGE.r} V600 Z`, '#cbc0ea', { sw: 4 })}
    ${red('M340 270 V528 M198 398 H482')}
    <circle cx="340" cy="398" r="118" fill="none" stroke="${T}" stroke-width="2.2"/>
    ${mono(382, 214, tr ? 'durum: çalışıyor*' : 'status: working*')}
    ${serif(382, 252, tr ? '* iddialı ama bozuk' : '* ambitious and broken', 28, `fill-opacity=".8"`)}
    ${serif(382, 284, tr ? 'olması da sayılır.' : 'also counts.', 28, `fill-opacity=".8"`)}
    ${red('M176 352 l-12 -14 M195 344 v-18 M214 352 l12 -14 M46 372 l-12 -14 M65 364 v-18 M84 372 l12 -14', 2.6)}`
}

/** Where the way down to the metro stands at Afterglow. */
const STAIRS = 560
/** 18:30 Afterglow: the metro home, and a group chat that carries on without them. */
function afterglow() {
  const m = STAIRS + 90
  return `
    ${metroEntrance(STAIRS)}
    ${rule(m, 600, m, 340, 4.4)}
    ${print(oval(m, 300, 40), WHITE)}
    <text x="${m}" y="317" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="46" fill="${I}">M</text>
    ${print(`M${m - 44} 352 H${m + 44} V384 H${m - 44} Z`, WHITE, { shade: 0, sw: 3 })}
    <text x="${m}" y="376" text-anchor="middle" ${MONO} font-size="22" fill="${I}">ODTÜ</text>
    ${red('M386 330 L410 232', 2.2)}
    ${mono(396, 184, tr ? 'grup sohbeti' : 'group chat', T)}
    ${mono(396, 218, tr ? '214 okunmamış' : '214 unread', T)}`
}

/** The metro entrance the three are heading for: a canopy on two posts over the steps down into the dark. */
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
    ${print(`M${x0 + 12} 600 V${top + 6} H${x1 - 12} V600 Z`, PALETTE.night, { shade: 0.45, outline: false })}
    ${steps}
    ${rule(x0 + 12, top, x0 + 12, 600, 3.8)}
    ${rule(x1 - 12, top, x1 - 12, 600, 3.8)}
    ${print(`M${x0 - 16} ${top} H${x1 + 16} L${x1 + 4} ${top - 24} H${x0 - 4} Z`, WHITE, { sw: 3.8 })}`
}

/**
 * The short ruler a scene stands on: the floor line across the picture box, a tick every
 * twentieth of it and a long one where it starts; at Incubate it is broken (`gap`). Its strokes
 * don't scale with the picture: a hairline at any size.
 */
function ruler(left: number, gap?: [number, number]) {
  const right = left + BOX.w
  const hair = `fill="none" stroke="${I}" stroke-width="1" vector-effect="non-scaling-stroke"`
  let ticks = ''
  for (let k = 1; k < 20; k++) {
    const x = left + (BOX.w / 20) * k
    if (!gap || x < gap[0] || x > gap[1]) ticks += `M${x} ${GROUND}v10`
  }
  const floor = gap ? `M${left} ${GROUND}H${gap[0]}M${gap[1]} ${GROUND}H${right}` : `M${left} ${GROUND}H${right}`
  return `<g shape-rendering="crispEdges"><path d="${ticks}" ${hair} stroke-opacity=".2"/><path d="M${left} ${GROUND}v21" ${hair} stroke-opacity=".72"/><path d="${floor}" ${hair}/></g>${
    gap ? line(`M${gap[0] - 8} 620 L${gap[0] + 6} 582 M${gap[1] - 6} 620 L${gap[1] + 8} 582`, 2.6) : ''
  }`
}

interface Scene {
  /** the picture box's left edge, in plate units: each scene is centred in its own */
  left: number
  props: () => string
  cast: Cast
  /** drawn over the cast */
  over?: () => string
  gap?: [number, number]
}
const SCENES: Scene[] = [
  { left: -20, props: doors, cast: {} },
  { left: -10, props: crack, cast: { cracks: 1, mates: [520, 622] }, over: crackMark },
  { left: -36, props: nest, cast: { cracks: 2, mates: BESIDE } },
  { left: -6, props: incubate, cast: { hero: 296, cracks: 3, mates: [174, 66] }, gap: BREAK },
  { left: -12, props: pizza, cast: { cracks: 4, mates: BESIDE } },
  { left: -8, props: hatch, cast: { hatched: true, shells: true, lift: STAGE.h, mates: BESIDE } },
  { left: -8, props: afterglow, cast: { hatched: true, mates: BESIDE } },
]

/** One frame's picture: the scene, the ruler under it, and the cast standing on that. */
function sceneSvg(step: number) {
  const s = SCENES[step]
  nth = 0
  return `<svg viewBox="${s.left} ${BOX.top} ${BOX.w} ${BOX.foot - BOX.top}" aria-hidden="true" focusable="false">${s.props()}${ruler(s.left, s.gap)}${cast(s.cast)}${s.over?.() ?? ''}</svg>`
}

/**
 * Draw the storyboard: the programme line over the sheet, a row of seven eggs with their hours,
 * which is the strip's index on a phone (day.ts runs it; main.css hides it where the whole sheet
 * shows); then a scene into each frame, each in a task of its own (a scene is some thousand
 * halftone dots and a few dozen bent lines to work out). Nothing here moves the page: the
 * scenes' boxes are their size already, and the programme line's room is kept for it (main.css).
 */
export async function renderDay() {
  const sheet = document.getElementById('daySheet')
  if (!sheet) return
  installDayDefs()
  const frames = $$<HTMLElement>('.frame', sheet).filter((f) => f.querySelector('.frame__scene'))

  const row = document.createElement('div')
  row.className = 'day__ticker'
  row.setAttribute('role', 'group')
  row.setAttribute('aria-label', tr ? 'Gün: bir saat seç' : 'The day: pick an hour')
  row.innerHTML = frames
    .map((f, i) => {
      const time = f.querySelector('.frame__time')?.textContent ?? ''
      const name = f.querySelector('.frame__name')?.textContent ?? ''
      const hatch = f.classList.contains('frame--hatch') ? ' tick--hatch' : ''
      return `<button type="button" class="tick${hatch}" data-i="${i}" aria-controls="daySheet" aria-label="${esc(`${time}, ${name}`)}"><span>${esc(time)}</span></button>`
    })
    .join('')
  sheet.before(row)

  for (const [i, f] of frames.entries()) {
    await nextTask()
    f.querySelector('.frame__scene')!.innerHTML = sceneSvg(i)
  }
}
