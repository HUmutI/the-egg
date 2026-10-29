import { PALETTE } from './util'
import { lang } from './i18n'
import { I, SHELL, W, eggBody, face, hand, ink, mix, nextId } from './ink'

/**
 * "A day at the club", drawn: seven arched windows in a row, each painted
 * with its own hour of the sky — one sun crossing the building, low at the
 * door, overhead at noon, setting behind the pizza, then the moon — and a set
 * built around the spot where the cast stands. The cast — our egg and the two
 * who hear its pitch at Crack and join it there — comes from the same egg
 * kit as the specimen plate.
 *
 * Scenes live on a 400 × 300 stage; the floor is y = 270 everywhere, so the
 * windows join into one building. The hero stands at x = MARK in every
 * window, its team at SLOTS behind it, so sets keep the middle of the floor
 * clear and put their props to the sides or up in the sky. Each scene keeps
 * a clear patch of sky, at least 10 units inside the arch, for its note.
 *
 * Eggs are drawn at full kit size (centred on x 100, egg on y 262, feet on
 * y 316) and scaled into place, so their line weight scales with them.
 */

const P = PALETTE
const FLOOR = 270
/** Where the hero stands in each window, and its team behind it. */
export const MARK = 200
export const SLOTS = [136, 72] as const
/**
 * What each step puts under them: a crate, the nest, stools at the
 * workbench, the stage, the bench. Seated steps rest the egg on the seat
 * with the shins folded short.
 */
export const LIFT = [0, 34, 7, 9, 0, 22, 13]
export const MATE_LIFT = [0, 0, 10, 12, 0, 22, 16]
export const SEATED = [false, false, true, true, false, false, true]
/** How long the shins look when sitting (legs fold towards you). */
export const SEAT_LEGS = 0.5
/** Scene scale of the eggs: the hero is 80 units wide, the team 69. */
const HERO_S = 0.465
const MATE_S = 0.4

const ARCH = 'M34 270V150A166 136 0 0 1 366 150V270Z'
const WOOD = '#e0a15a'
const WOOD_DEEP = '#a8643a'
const CARD = '#d9a56a'
const TWIG = '#b98756'
const TWIG_DEEP = '#7d5434'
const SCREEN = '#e4e0ec'
const BEANIE_SHELL = SHELL.brown
const CAP_SHELL = '#ead1b5'
const L = 2.6 // a scene's line weight, matching an egg drawn at ~0.45 scale
const MONO = 'DM Mono, ui-monospace, monospace'
const HAND = 'Reenie Beanie, cursive'
const tr = lang === 'tr'

/** Each window's handwritten aside (phones show it as a line above the picture). */
export const NOTES: ({ en: string; tr: string } | null)[] = [
  { en: 'name tag? optional', tr: 'yaka kartı? keyfine' },
  { en: '60 sec. go!', tr: '60 sn. başla!' },
  { en: 'co-founders now', tr: 'artık ortaklar' },
  { en: 'it compiles?!', tr: 'derlendi mi?!' },
  { en: 'pineapple: no.', tr: 'ananas: hayır.' },
  { en: 'it works! (mostly)', tr: 'çalışıyor! (sayılır)' },
  null,
]
const noteText = (i: number) => (NOTES[i] ? (tr ? NOTES[i]!.tr : NOTES[i]!.en) : '')

const n = (v: number) => +v.toFixed(1)
const line = (d: string, w = L, c: string = I, extra = '') => ink(d, w, c, extra)

/** A four-point sparkle. */
const spark = (x: number, y: number, s: number, c: string = I, cls = '') =>
  `<path ${cls ? `class="${cls}"` : ''} d="M${x} ${y - 10 * s}q${2 * s} ${8 * s} ${10 * s} ${10 * s}q${-8 * s} ${2 * s} ${-10 * s} ${10 * s}q${-2 * s} ${-8 * s} ${-10 * s} ${-10 * s}q${8 * s} ${-2 * s} ${10 * s} ${-10 * s}z" fill="${c}"/>`

const cloud = (x: number, y: number, s = 1) =>
  `<path d="M${x} ${y}h${46 * s}a${12 * s} ${12 * s} 0 0 0 -6 ${-22 * s}a${16 * s} ${16 * s} 0 0 0 -28 ${-8 * s}a${12 * s} ${12 * s} 0 0 0 -16 ${12 * s}a${10 * s} ${10 * s} 0 0 0 4 ${18 * s}z" fill="${P.cream}" stroke="${I}" stroke-width="${L * 0.8}" stroke-linejoin="round"/>`

const sun = (x: number, y: number, r: number, cls = '') => `
  <g class="sc-sun ${cls}">
    <g class="sc-rays">${Array.from({ length: 10 }, (_, i) => `<path d="M${x} ${y - r - 6}v-8" transform="rotate(${i * 36} ${x} ${y})" stroke="${I}" stroke-width="${L * 0.8}" stroke-linecap="round"/>`).join('')}</g>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${P.yolk}" stroke="${I}" stroke-width="${L * 0.8}"/>
  </g>`

const stars = (pts: [number, number, number][]) =>
  pts.map(([x, y, s], i) => spark(x, y, s, i % 3 ? P.cream : P.yolk, 'sc-star')).join('')

/**
 * A handwritten note with an arrow, like the ones scribbled over the hero
 * poster. It fits its clear patch of sky (`w` wide) in either language, and
 * writes itself on when its step comes round.
 */
const note = (step: number, o: { x: number; y: number; w: number; rot?: number; arrow: string; c?: string }) => {
  const text = noteText(step)
  const size = Math.min(27, o.w / (text.length * 0.44))
  const c = o.c ?? P.tomato
  return `
  <g class="note">
    <text x="${o.x}" y="${o.y}" transform="rotate(${o.rot ?? -4} ${o.x} ${o.y})" font-family="${HAND}" font-size="${n(size)}" fill="${c}">${text}</text>
    <path class="note__arrow" pathLength="1" d="${o.arrow}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`
}

/** An egg from the kit, scaled into a scene by its egg's bottom (no legs showing). */
export const placed = (x: number, bottom: number, s: number, inner: string, cls = '') =>
  `<g ${cls ? `class="${cls}"` : ''} transform="translate(${n(x - 100 * s)} ${n(bottom - 262 * s)}) scale(${s})">${inner}</g>`

/** An egg with legs, scaled into a scene by its feet. */
const stand = (x: number, feet: number, s: number, inner: string, cls = '') =>
  `<g ${cls ? `class="${cls}"` : ''} transform="translate(${n(x - 100 * s)} ${n(feet - 316 * s)}) scale(${s})">${inner}</g>`

/* ── the cast, in kit coordinates ───────────────────────────────── */

const beanie = (c = P.mintDeep) => `
  <path d="M26 98C28 42 62 20 100 20S172 42 174 98Z" fill="${mix(c, '#ffffff', 0.18)}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
  <path d="M22 84h156v24H22z" fill="${c}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
  ${[44, 66, 88, 110, 132, 154].map((x) => line(`M${x} 88v16`, 3, mix(c, I, 0.35))).join('')}
  <circle cx="100" cy="16" r="14" fill="${mix(c, '#ffffff', 0.4)}" stroke="${I}" stroke-width="${W.prop}"/>`

const cap = () => `
  <path d="M30 94C34 46 64 28 100 28S166 46 170 94Z" fill="${P.yolk}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
  <path d="M30 90q-34 2 -44 18q26 10 52 -4z" fill="${mix(P.yolk, I, 0.15)}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
  ${line('M100 30v60', 3, mix(P.yolk, I, 0.3))}
  <circle cx="100" cy="28" r="7" fill="${P.yolk}" stroke="${I}" stroke-width="3"/>`

const slice = (x: number, y: number, r = 0) => `
  <g transform="rotate(${r} ${x} ${y})">
    <path d="M${x} ${y}l58 -26l-6 50z" fill="${P.yolk}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
    <path d="M${x + 58} ${y - 26}q10 22 -6 50" fill="none" stroke="${I}" stroke-width="10" stroke-linecap="round"/>
    <path d="M${x + 58} ${y - 26}q10 22 -6 50" fill="none" stroke="#e7a45f" stroke-width="5" stroke-linecap="round"/>
    <circle cx="${x + 30}" cy="${y - 4}" r="6" fill="${P.tomato}" stroke="${I}" stroke-width="2.6"/>
    <circle cx="${x + 44}" cy="${y + 12}" r="5" fill="${P.tomato}" stroke="${I}" stroke-width="2.6"/>
  </g>`

const phone = (x: number, y: number, r = 0) => `
  <g transform="rotate(${r} ${x} ${y})">
    <rect x="${x - 15}" y="${y - 26}" width="30" height="50" rx="7" fill="${I}"/>
    <rect x="${x - 11}" y="${y - 21}" width="22" height="38" rx="3" fill="${P.sky}"/>
    <rect x="${x - 8}" y="${y - 16}" width="13" height="6" rx="3" fill="${P.cream}"/>
    <rect x="${x - 3}" y="${y - 6}" width="11" height="6" rx="3" fill="${P.yolk}"/>
  </g>`

const coffee = (x: number, y: number) => `
  <g class="prop prop--coffee">
    <path d="M${x - 16} ${y - 30}h32l-4 44h-24z" fill="${P.cream}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
    <path d="M${x - 15} ${y - 14}h30l-1.5 14h-27z" fill="${P.tomato}" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="${x - 19}" y="${y - 36}" width="38" height="8" rx="3" fill="${mix(P.cream, I, 0.15)}" stroke="${I}" stroke-width="3"/>
    <g class="steam">${line(`M${x - 6} ${y - 44}q-6 -8 0 -16q6 -8 0 -16`, 3)}${line(`M${x + 7} ${y - 46}q-6 -8 0 -16`, 3)}</g>
  </g>`

/** A stage mic held up to the mouth: a light grille, a dark handle, a mitten round it. */
const mic = (x: number, y: number, held = true) => `
  <g class="prop prop--mic">
    ${line(`M${x + 2} ${y + 12}L${x + 9} ${y + 52}`, 11)}
    ${line(`M${x + 2} ${y + 12}L${x + 9} ${y + 52}`, 6, '#5a5163')}
    <circle cx="${x}" cy="${y}" r="15" fill="#c7c0d0" stroke="${I}" stroke-width="${W.prop}"/>
    ${line(`M${x - 10} ${y - 4}h20M${x - 12} ${y + 2}h24M${x - 6} ${y - 11}v22M${x + 2} ${y - 13}v24`, 1.6, '#7d7389')}
    <path d="M${x - 14} ${y + 9}h28l-2 6h-24z" fill="#5a5163" stroke="${I}" stroke-width="2.4" stroke-linejoin="round"/>
    ${held ? hand(x + 8, y + 44, SHELL.white, 12) : ''}
    <g class="sound">${line(`M${x + 24} ${y - 12}q8 10 0 22`, 3.4)}${line(`M${x + 36} ${y - 20}q12 18 0 38`, 3.4)}</g>
  </g>`

/** A closed laptop, carried (or flung). */
const laptop = () => `
  <g class="prop prop--laptop" transform="rotate(-10 150 210)">
    <rect x="112" y="186" width="84" height="54" rx="7" fill="${SCREEN}" stroke="${I}" stroke-width="${W.prop}"/>
    <path d="M154 202c4 0 7 6 7 11c0 4.5-3 7-7 7s-7-2.5-7-7c0-5 3-11 7-11Z" fill="${P.yolk}" stroke="${I}" stroke-width="2.6"/>
  </g>`

/** An open laptop on the lap, seen from behind its lid. */
const laptopOpen = (skin: string) => `
  <g class="prop prop--laptop-open">
    <path d="M44 236h112l14 16h-140z" fill="${mix(SCREEN, I, 0.12)}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
    <rect x="52" y="176" width="96" height="62" rx="7" fill="${SCREEN}" stroke="${I}" stroke-width="${W.prop}"/>
    <path d="M100 194c4.4 0 7.6 6.4 7.6 11.4c0 4.6-3.2 7.4-7.6 7.4s-7.6-2.8-7.6-7.4c0-5 3.2-11.4 7.6-11.4Z" fill="${P.yolk}" stroke="${I}" stroke-width="2.6"/>
    <path class="lap__glow" d="M56 176q44 -14 88 0" fill="none" stroke="${P.sky}" stroke-width="5" stroke-linecap="round" opacity=".8"/>
    ${hand(40, 236, skin, -10)}${hand(160, 236, skin, 10)}
  </g>`

const SWEAT = `<path d="M168 92q8 12 0 18q-8 -6 0 -18z" fill="${P.sky}" stroke="${I}" stroke-width="3"/>`

/** Two legs in red sneakers, hinged at the hips (80, 248) and (120, 248); seated, the shins hang short. */
function legs(seated = false) {
  const shoe = (x: number, flip: number) => `
    <path d="M${x - 2} ${300}h${24 * flip}q${10 * flip} 0 ${10 * flip} 10v4h${-40 * flip}q${-2 * flip} -14 ${6 * flip} -14z" fill="${P.tomato}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
    ${line(`M${x - 6 * flip} ${314}h${36 * flip}`, 3, P.cream)}`
  const pair = `
    <g class="leg leg--l">${line('M80 248L76 302', 7)}${shoe(70, -1)}</g>
    <g class="leg leg--r">${line('M120 248L124 302', 7)}${shoe(130, 1)}</g>`
  return seated ? `<g transform="translate(0 248) scale(1 ${SEAT_LEGS}) translate(0 -248)">${pair}</g>` : pair
}

/** Arms up: an ink arm from each shoulder to a raised mitten. */
const armsUp = (fill: string, spread = 1) => `
  ${line(`M44 168L${8 - 4 * spread} 92`, 7)}${line(`M156 168L${192 + 4 * spread} 92`, 7)}
  ${hand(6 - 4 * spread, 86, fill, -30)}${hand(194 + 4 * spread, 86, fill, 30)}`

/** The hero's shell: whole until it hatches, then split along a zigzag. */
const ZIG = '6,178 26,162 46,186 66,160 86,188 106,160 126,186 146,160 166,184 186,164 196,172'
const CRACK = `fill="none" stroke="${I}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`
const crack1 = `<path class="hero__crack hero__crack--1" pathLength="1" d="M132 62l12 18-9 12 15 11" ${CRACK}/>`
const crack2 = `<path class="hero__crack hero__crack--2" pathLength="1" d="M48 118l16 7-5 15 17 5" ${CRACK}/>`
const crack3 = `<polyline class="hero__crack hero__crack--3" pathLength="1" points="${ZIG}" ${CRACK}/>`

/** The whole shell, with the cracks it has by `level` (null: all of them, for the walker to reveal). */
const shellWhole = (level: number | null) =>
  `${eggBody({ fill: SHELL.white, ground: false })}
   ${level === null || level >= 1 ? crack1 : ''}${level === null || level >= 3 ? crack2 : ''}${level === null || level === 4 ? crack3 : ''}`

/** The two halves of a hatched shell, broken edge inked. */
function shellHalves() {
  const top = nextId('ht')
  const bot = nextId('hb')
  const shell = eggBody({ fill: SHELL.white, ground: false })
  const edge = `<polyline points="${ZIG}" fill="none" stroke="${I}" stroke-width="${W.body}" stroke-linejoin="round"/>`
  return {
    top: `<clipPath id="${top}"><polygon points="${ZIG} 240,172 240,-60 -40,-60 -40,178"/></clipPath><g clip-path="url(#${top})">${shell}</g>${edge}`,
    bottom: `<clipPath id="${bot}"><polygon points="${ZIG} 240,172 240,320 -40,320 -40,178"/></clipPath><g clip-path="url(#${bot})">${shell}</g>${edge}`,
  }
}

/** The shell top worn as a hat: where the hatch sends it. */
export const HAT = { x: 12, y: -98, r: -16, s: 0.46 }
const hatTransform = (t = HAT) => `translate(${t.x} ${t.y}) translate(100 178) rotate(${t.r}) scale(${t.s}) translate(-100 -178)`

/** The golden egg inside: the brand mark, grown up. */
const golden = () => `
  ${eggBody({ fill: P.yolk, shade: '#d39100', w: 158, h: 212, ground: false })}
  ${line('M146 60q12 14 12 30', 4, '#fdf3d7')}`

const SHELL_FACES = [
  () => face({ eyes: 'dot', mouth: 'smile', blush: true }),
  () => face({ eyes: 'wide', mouth: 'o', brows: 'up' }),
  () => face({ eyes: 'happy', mouth: 'grin', blush: true }),
  () => face({ eyes: 'dot', mouth: 'flat', brows: 'worried', look: [0, 6] }),
  () => face({ eyes: 'happy', mouth: 'tongue', blush: true }),
  () => face({ eyes: 'wide', mouth: 'flat', brows: 'worried' }),
]
const goldJoy = () => face({ eyes: 'happy', mouth: 'grin', blush: true, y: 120 })
const goldCalm = () => face({ eyes: 'closed', mouth: 'smile', blush: true, y: 120 })
/** Left eye shut, right eye open: the last thing it does on the way home. */
const goldWink = () => `
  <g class="egg__face">
    <ellipse cx="66" cy="135" rx="9.5" ry="5.2" fill="${P.pinkDeep}" opacity=".26"/><ellipse cx="134" cy="135" rx="9.5" ry="5.2" fill="${P.pinkDeep}" opacity=".26"/>
    <path d="M72.5 121q6.5 -8 13 0" fill="none" stroke="${I}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="121" cy="119" rx="4.8" ry="6.2" fill="${I}"/>
    <path d="M90 140q10 9 20 -1" fill="none" stroke="${I}" stroke-width="3.6" stroke-linecap="round"/>
  </g>`

/** Group-chat bubbles that rise from the phone on the way home (to the left of the moon). */
const bubbles = () => `
  <g class="wbub wbub--1"><rect x="90" y="-34" width="70" height="32" rx="16" fill="${P.cream}" stroke="${I}" stroke-width="3.4"/>${line('M108 -18h3M124 -18h3M140 -18h3', 5)}</g>
  <g class="wbub wbub--2"><rect x="40" y="-84" width="60" height="32" rx="16" fill="${P.yolk}" stroke="${I}" stroke-width="3.4"/><path d="M70 -72c-5 -6 -15 -1 -10 6l10 9l10 -9c5 -7 -5 -12 -10 -6z" fill="${P.tomato}" stroke="${I}" stroke-width="2.4"/></g>
  <g class="wbub wbub--3"><rect x="96" y="-130" width="80" height="32" rx="16" fill="${P.mint}" stroke="${I}" stroke-width="3.4"/>${line('M114 -114h44', 4, P.mintDeep)}</g>`

/**
 * The hatch burst: everything it carried today, and jagged shards of shell
 * (white outside, yolk inside). Props fly out of the open top; shards come
 * off the crack line, each with its own way out.
 */
export const BURST = [
  { a: -152, x: 100, y: 140, far: 520 },
  { a: -118, x: 100, y: 140, far: 500 },
  { a: -62, x: 100, y: 140, far: 500 },
  { a: -28, x: 100, y: 140, far: 520 },
  { a: -40, x: 150, y: 176, far: 340 },
  { a: -12, x: 176, y: 176, far: 360 },
  { a: 22, x: 186, y: 180, far: 320 },
  { a: 58, x: 160, y: 182, far: 300 },
  { a: -140, x: 50, y: 176, far: 340 },
  { a: -168, x: 24, y: 176, far: 360 },
  { a: 158, x: 14, y: 180, far: 320 },
  { a: 122, x: 40, y: 182, far: 300 },
]
const shard = (k: number) => {
  const s = 1.4 + (k % 3) * 0.25
  return `<g transform="scale(${s})">
    <path d="M-16 6l5 -12l6 8l6 -12l6 9l5 -7v14h-28z" fill="${SHELL.white}" stroke="${I}" stroke-width="2.6" stroke-linejoin="round"/>
    ${line('M-13 13h22', 2.6, P.yolk)}
  </g>`
}
const burst = () => {
  const props = [
    `<g transform="translate(-158 -180)">${coffee(158, 196)}</g>`,
    `<g transform="translate(-150 -170)">${mic(146, 146, false)}</g>`,
    `<g transform="translate(-154 -214)">${laptop()}</g>`,
    `<g transform="translate(-170 -200)">${slice(146, 206, -18)}</g>`,
  ]
  const shards = Array.from({ length: 8 }, (_, k) => shard(k))
  return [...props, ...shards].map((g, i) => `<g class="wburst" data-i="${i}" opacity="0">${g}</g>`).join('')
}

/** A ring of rays that flares behind the golden egg as it comes out. */
const rays = () =>
  `<g class="walker__rays" opacity="0">${Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2
    const r0 = 128
    const r1 = i % 2 ? 176 : 196
    return line(`M${n(100 + Math.cos(a) * r0)} ${n(150 + Math.sin(a) * r0)}L${n(100 + Math.cos(a) * r1)} ${n(150 + Math.sin(a) * r1)}`, 9, i % 2 ? P.cream : P.yolk)
  }).join('')}</g>`

/* ── the walker: every state at once, the script picks one ───────── */

/**
 * The egg that walks the day on wide screens. Everything it ever holds or
 * wears is in here; data attributes on the wrapper show the right pieces and
 * day.ts drives the moving parts (walk, wobble, hatch, burst) frame by frame.
 */
export function walkerSvg() {
  const h = shellHalves()
  return `
    <svg class="walker__svg" viewBox="-70 -150 340 480" aria-hidden="true">
      <g class="walker__body"><g class="breathe">
        <ellipse class="walker__shadow" cx="104" cy="318" rx="74" ry="9" fill="${I}" opacity=".14"/>
        ${rays()}
        <g class="walker__legs">${legs()}</g>
        <g class="wprop wprop--arms">${armsUp(P.yolk)}</g>
        <g class="walker__golden">
          ${golden()}
          <g class="gface gface--joy">${goldJoy()}</g>
          <g class="gface gface--calm">${goldCalm()}</g>
          <g class="gface gface--wink">${goldWink()}</g>
        </g>
        <g class="walker__whole">
          ${shellWhole(null)}
          ${SHELL_FACES.map((f, i) => `<g class="sface sface--${i}">${f()}</g>`).join('')}
        </g>
        <g class="walker__bottom">${h.bottom}</g>
        <g class="walker__top">${h.top}</g>
        <g class="walker__hands"><g class="whand whand--l">${hand(30, 204, SHELL.white, -20)}</g><g class="whand whand--r">${hand(168, 204, SHELL.white, 20)}</g></g>
        <g class="wprop wprop--0">${coffee(158, 196)}</g>
        <g class="wprop wprop--1">${mic(146, 146)}</g>
        <g class="wprop wprop--2">${spark(-14, 40, 1.1, P.yolk)}${spark(204, 18, 0.8)}</g>
        <g class="wprop wprop--3">${laptopOpen(SHELL.white)}${SWEAT}</g>
        <g class="wprop wprop--4">${slice(146, 206, -18)}</g>
        <g class="wprop wprop--6">${hand(36, 214, P.yolk, -20)}${hand(166, 214, P.yolk, 20)}${phone(170, 196, 14)}${bubbles()}</g>
        <g class="walker__burst">${burst()}</g>
      </g></g>
    </svg>`
}

/** A teammate who walks behind the hero once they've joined at Crack. */
export function mateSvg(kind: 'beanie' | 'cap') {
  const fill = kind === 'beanie' ? BEANIE_SHELL : CAP_SHELL
  const hat = kind === 'beanie' ? beanie() : cap()
  const faces = [
    face({ eyes: 'happy', mouth: 'smile', blush: true }),
    face({ eyes: 'dot', mouth: 'line', look: [0, 6] }),
    face({ eyes: 'happy', mouth: 'tongue', blush: true }),
    face({ eyes: 'happy', mouth: 'grin', blush: true }),
    face({ eyes: 'closed', mouth: 'smile', blush: true }),
  ]
  return `
    <svg class="mate__svg" viewBox="-70 -150 340 480" aria-hidden="true">
      <g class="mate__body"><g class="breathe">
        <ellipse cx="104" cy="318" rx="70" ry="9" fill="${I}" opacity=".14"/>
        <g class="walker__legs">${legs()}</g>
        <g class="mhands mhands--up">${armsUp(fill, 0)}</g>
        ${eggBody({ fill, ground: false })}
        ${hat}
        ${faces.map((f, i) => `<g class="mface mface--${i}">${f}</g>`).join('')}
        <g class="mhands mhands--down">${hand(30, 204, fill, -20)}${hand(168, 204, fill, 20)}</g>
        <g class="mprop mprop--slice">${slice(146, 206, -18)}</g>
        <g class="mprop mprop--phone">${phone(166, 196, 12)}</g>
        <g class="mprop mprop--laptop">${laptopOpen(fill)}</g>
      </g></g>
    </svg>`
}

/* ── stills: the cast drawn into each scene, for phones ──────────── */

/** The hero as a still at a step, with legs, standing (or sitting) where it does. */
export function heroStill(state: number) {
  const hatched = state >= 5
  const halves = hatched ? shellHalves() : null
  const prop =
    state === 0
      ? coffee(158, 196)
      : state === 1
        ? mic(146, 146)
        : state === 3
          ? laptopOpen(SHELL.white) + SWEAT
          : state === 4
            ? slice(146, 206, -18)
            : state === 6
              ? phone(170, 196, 14) + bubbles()
              : ''
  const body = hatched
    ? `${state === 5 ? armsUp(P.yolk) : ''}${golden()}${state === 5 ? goldJoy() : goldWink()}
       ${halves!.bottom}
       <g transform="${hatTransform()}">${halves!.top}</g>`
    : `${shellWhole(state)}${SHELL_FACES[state]()}`
  const skin = hatched ? P.yolk : SHELL.white
  const hands =
    state === 5 || state === 3
      ? ''
      : state === 6
        ? hand(36, 214, skin, -20) + hand(166, 214, skin, 20)
        : state === 1
          ? hand(30, 204, skin, -20)
          : hand(30, 204, skin, -20) + hand(168, 204, skin, 20)
  return `<g class="hero hero--still">${legs(SEATED[state])}${body}${hands}${prop}</g>`
}

function mateStill(kind: 'beanie' | 'cap', state: number) {
  const fill = kind === 'beanie' ? BEANIE_SHELL : CAP_SHELL
  const hat = kind === 'beanie' ? beanie() : cap()
  const mood = [
    face({ eyes: 'happy', mouth: 'smile', blush: true }),
    face({ eyes: 'dot', mouth: 'line', look: [0, 6] }),
    face({ eyes: 'happy', mouth: 'tongue', blush: true }),
    face({ eyes: 'happy', mouth: 'grin', blush: true }),
    face({ eyes: 'closed', mouth: 'smile', blush: true }),
  ][Math.max(0, state - 2)]
  const arms = state === 5 || state === 3 ? '' : hand(30, 204, fill, -20) + hand(168, 204, fill, 20)
  const prop = state === 4 ? slice(146, 206, -18) : state === 6 ? phone(166, 196, 12) : state === 3 ? laptopOpen(fill) : ''
  return `${legs(SEATED[state])}${state === 5 ? armsUp(fill, 0) : ''}${eggBody({ fill })}${hat}${mood}${arms}${prop}`
}

/** The cast of a step as phones see it: hero at the mark, team behind (from Nest; at Crack they're still on the bench). */
const cast = (state: number) => {
  const team =
    state >= 2
      ? (['beanie', 'cap'] as const).map((k, i) => stand(SLOTS[i], FLOOR - MATE_LIFT[state], MATE_S, mateStill(k, state))).reverse().join('')
      : ''
  return `${team}${stand(MARK, FLOOR - LIFT[state], HERO_S, heroStill(state))}`
}

/* ── the seven scenes ───────────────────────────────────────────── */

interface Frame {
  sky: [number, string][]
  back: string
  set: string
  note?: string
}

/** A window: its sky (with a printed halftone, like the poster), its set, the floor, the cast (phones), its note. */
function frame(slug: string, step: number, f: Frame) {
  const g = nextId('sk')
  const c = nextId('ac')
  const h = nextId('hf')
  const ticks = Array.from({ length: 21 }, (_, i) => line(`M${i * 20} ${FLOOR + 1}v${i % 5 === 0 ? 10 : 5}`, i % 5 === 0 ? 1.8 : 1.2, I, i % 5 ? 'opacity=".5"' : '')).join('')
  return `
    <svg class="scene scene--${slug}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">${f.sky.map(([o, s], i) => `<stop class="sky-stop sky-stop--${i}" offset="${o}" stop-color="${s}"/>`).join('')}</linearGradient>
        <clipPath id="${c}"><path d="${ARCH}"/></clipPath>
        <pattern id="${h}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><circle cx="3.5" cy="3.5" r="1.1" fill="${I}"/></pattern>
      </defs>
      <path d="${ARCH}" fill="url(#${g})"/>
      <g clip-path="url(#${c})">
        ${f.back}
        <rect x="34" y="0" width="332" height="270" fill="url(#${h})" opacity=".07"/>
      </g>
      <path d="${ARCH}" fill="none" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
      <g class="scene__set">${f.set}</g>
      ${line(`M0 ${FLOOR}H400`, L)}
      ${ticks}
      <g class="scene__cast">${cast(step)}</g>
      ${f.note ?? ''}
    </svg>`
}

/** The two from Crack's bench: a brown egg in a beanie and a tan one in a cap. */
const beanieEgg = (look = 0) => `${eggBody({ fill: BEANIE_SHELL })}${beanie()}${face({ eyes: 'happy', mouth: 'smile', blush: true, look: [look, 0] })}`
const capEgg = (look = 0) => `${eggBody({ fill: CAP_SHELL })}${cap()}${face({ eyes: 'dot', mouth: 'smile', look: [look, 0] })}`

function doors() {
  return frame('doors', 0, {
    sky: [
      [0, '#f8cf6a'],
      [0.55, '#fbe3a3'],
      [1, '#fdf1cf'],
    ],
    back: `
      ${sun(90, 162, 18)}
      <path d="M34 248q60 -18 120 -6t130 -4t82 6V270H34Z" fill="${mix('#fbe3a3', WOOD, 0.35)}" opacity=".55"/>`,
    set: `
      <rect x="256" y="118" width="80" height="152" rx="4" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
      <rect x="268" y="130" width="56" height="140" fill="#3a2a38"/>
      <rect class="door__glow" x="268" y="130" width="56" height="140" fill="${P.yolk}" opacity="0"/>
      <g class="door__leaf">
        <path d="M268 130H324V270H268Z" fill="${P.peachDeep}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <path d="M278 144h36v46h-36zM278 204h36v50h-36z" fill="${mix(P.peachDeep, '#ffffff', 0.2)}" stroke="${I}" stroke-width="${L * 0.7}"/>
        <circle cx="317" cy="204" r="3.6" fill="${P.yolk}" stroke="${I}" stroke-width="2"/>
      </g>
      <g transform="translate(296 100)">
        <rect x="-36" y="-11" width="72" height="22" rx="5" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        <path d="M-24 -6c4 0 6.5 5 6.5 8.5c0 3.4 -2.6 5.4 -6.5 5.4s-6.5 -2 -6.5 -5.4c0 -3.5 2.5 -8.5 6.5 -8.5Z" fill="${P.yolk}" stroke="${I}" stroke-width="1.6"/>
        <text x="7" y="4.6" text-anchor="middle" font-family="${MONO}" font-size="13" font-weight="500" letter-spacing="1.5" fill="${I}">ODTÜ</text>
      </g>
      <g stroke="${I}" stroke-width="1.6">
        <rect x="341" y="128" width="14" height="14" fill="${P.yolk}" transform="rotate(-6 348 135)"/>
        <rect x="343" y="150" width="14" height="14" fill="${P.pink}" transform="rotate(5 350 157)"/>
        <rect x="340" y="172" width="14" height="14" fill="${P.mint}" transform="rotate(-3 347 179)"/>
      </g>
      <g transform="rotate(7 344 268)">
        <rect x="338" y="206" width="12" height="62" rx="6" fill="${P.lavDeep}" stroke="${I}" stroke-width="${L * 0.9}"/>
        ${line('M344 214v46', 1.6, P.cream)}
        <circle cx="352" cy="216" r="3.6" fill="${P.cream}" stroke="${I}" stroke-width="1.6"/><circle cx="352" cy="256" r="3.6" fill="${P.cream}" stroke="${I}" stroke-width="1.6"/>
      </g>
      <rect x="260" y="266" width="72" height="6" rx="2" fill="${P.tomato}" stroke="${I}" stroke-width="1.6"/>
      <g>
        <path d="M48 226h64v6h-64z" fill="${WOOD}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        ${line('M54 232v38M106 232v38', L)}
        <path d="M58 190h24v34h-24z" fill="#cfc8d6" stroke="${I}" stroke-width="${L}"/>
        <path d="M82 204h6v8h-6" fill="none" stroke="${I}" stroke-width="${L * 0.8}"/>
        <rect x="55" y="186" width="30" height="6" rx="2" fill="${I}"/>
        <path d="M92 214h8l-1 12h-6z" fill="${P.cream}" stroke="${I}" stroke-width="1.6"/>
        <path d="M100 214h8l-1 12h-6z" fill="${P.cream}" stroke="${I}" stroke-width="1.6"/>
        <g class="steam">${line('M66 180q-5 -7 0 -14q5 -7 0 -14', 2)}${line('M74 182q-5 -7 0 -14', 2)}</g>
      </g>`,
    note: note(0, { x: 108, y: 64, w: 184, arrow: 'M198 72q12 20 2 54M200 126l-8 -7M200 126l6 -8' }),
  })
}

function crack() {
  // the two who'll join: seated on the bench, arms going up when the pitch lands
  const listener = (x: number, inner: string, fill: string, cls: string) =>
    stand(x, 262, 0.3, `${legs()}<g class="lhands lhands--up">${armsUp(fill, 0)}</g>${inner}<g class="lhands lhands--down">${hand(30, 204, fill, -20)}${hand(168, 204, fill, 20)}</g>`, `listener ${cls}`)
  const leaf = (r: number) => `<path d="M0 0q-14 -20 0 -44q14 24 0 44z" transform="rotate(${r})" fill="${P.mintDeep}" stroke="${I}" stroke-width="2"/>`
  return frame('crack', 1, {
    sky: [
      [0, '#b9d6ea'],
      [1, '#eaf3f2'],
    ],
    back: `${sun(96, 130, 15)}`,
    set: `
      <g class="watch" transform="translate(318 136) scale(.74)">
        <rect x="-7" y="-52" width="14" height="10" rx="3" fill="#cfc8d6" stroke="${I}" stroke-width="${L}"/>
        <circle r="38" fill="${P.cream}" stroke="${I}" stroke-width="${L * 1.4}"/>
        ${Array.from({ length: 12 }, (_, i) => line(`M0 -34v${i % 3 ? 4 : 8}`, 2.4, I, `transform="rotate(${i * 30})"`)).join('')}
        <g class="watch__hand">${line('M0 0V-30', 3.6, P.tomato)}</g>
        <circle r="4.6" fill="${I}"/>
      </g>
      <g class="bulb" transform="translate(150 84)">
        <circle class="bulb__glow" r="26" fill="${P.yolk}" opacity="0"/>
        <path d="M0 -18c10 0 16 8 16 16c0 7 -5 10 -7 15h-18c-2 -5 -7 -8 -7 -15c0 -8 6 -16 16 -16Z" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        <path class="bulb__on" d="M0 -18c10 0 16 8 16 16c0 7 -5 10 -7 15h-18c-2 -5 -7 -8 -7 -15c0 -8 6 -16 16 -16Z" fill="${P.yolk}" stroke="${I}" stroke-width="${L}" opacity="0"/>
        <path d="M-7 17h14M-5 22h10" stroke="${I}" stroke-width="${L * 0.8}" stroke-linecap="round"/>
        ${line('M-4 2l4 6l4 -6', 1.8)}
      </g>
      <g transform="translate(336 248)">
        ${leaf(-34)}${leaf(-8)}${leaf(22)}
        <path d="M-14 0h28l-4 22h-20z" fill="${P.peachDeep}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
      </g>
      <g class="listeners">
        <path d="M36 244h92v7h-92z" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
        ${line('M44 251v19M120 251v19', L)}
        ${listener(58, capEgg(10), CAP_SHELL, 'listener--b')}
        ${listener(104, beanieEgg(10), BEANIE_SHELL, 'listener--a')}
      </g>
      <path d="M168 236h64l4 34h-72z" fill="${WOOD}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
      ${line('M170 248h62M168 260h66', 1.4, WOOD_DEEP)}`,
    note: note(1, { x: 206, y: 84, w: 112, rot: 3, arrow: 'M262 92q2 30 -26 52M236 144l1 -10M236 144l9 -5' }),
  })
}

function nest() {
  const twigs = Array.from({ length: 10 }, (_, i) => {
    const y = 244 + (i % 3) * 8
    const x = 44 + i * 21
    return line(`M${x - 18} ${y}q16 ${-8 + (i % 2) * 14} 36 ${-2}`, 1.8, TWIG_DEEP)
  }).join('')
  return frame('nest', 2, {
    sky: [
      [0, '#a9cde3'],
      [1, '#e6f1ef'],
    ],
    back: `
      ${sun(150, 60, 14)}
      ${line('M290 140q8 -8 16 0q8 -8 16 0', 2.4)}${line('M322 120q6 -6 12 0q6 -6 12 0', 2)}`,
    set: `
      <g class="nest">
        <path d="M28 238q112 -10 224 0q-6 32 -112 34q-106 -2 -112 -34z" fill="${TWIG}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <path d="M34 240q106 10 212 0" fill="none" stroke="${I}" stroke-width="${L * 0.8}"/>
        ${twigs}
        ${line('M26 236l-8 -8M254 236l12 -10', 2.2, TWIG_DEEP)}
      </g>
      <g class="team-flag">
        ${line('M250 238V150', L)}
        <g class="team-flag__cloth"><path d="M250 152l42 12l-42 14z" fill="${P.yolk}" stroke="${I}" stroke-width="${L * 0.8}" stroke-linejoin="round"/>
          <path d="M262 160c2.6 0 4.6 3.6 4.6 6.4c0 2.6 -2 4.2 -4.6 4.2s-4.6 -1.6 -4.6 -4.2c0 -2.8 2 -6.4 4.6 -6.4Z" fill="${P.cream}" stroke="${I}" stroke-width="1.4"/></g>
      </g>
      <g class="hearts">
        <path d="M58 122c-6 -8 -18 -2 -12 8l12 12l12 -12c6 -10 -6 -16 -12 -8z" fill="${P.tomato}" stroke="${I}" stroke-width="2"/>
        <path d="M100 104c-4 -6 -13 -1 -9 6l9 9l9 -9c4 -7 -5 -12 -9 -6z" fill="${P.pink}" stroke="${I}" stroke-width="2"/>
      </g>`,
    note: note(2, { x: 204, y: 112, w: 138, rot: -4, arrow: 'M206 118q-26 2 -48 22M158 140l4 -10M158 140l10 -2' }),
  })
}

function incubate() {
  const stool = (x: number) => `<path d="M${x - 22} 236h44v6h-44z" fill="${WOOD}" stroke="${I}" stroke-width="${L * 0.9}"/>${line(`M${x - 16} 242l-4 28M${x + 16} 242l4 28`, L * 0.9)}`
  const sticky = Array.from({ length: 12 }, (_, k) => {
    const col = k % 3
    const row = Math.floor(k / 3)
    const c = [P.yolk, P.pink, P.mint, P.sky, P.peach][k % 5]
    const x = 284 + col * 15
    const y = 70 + row * 15
    return `<rect class="sticky" style="--k:${k}" x="${x}" y="${y}" width="12" height="12" fill="${c}" stroke="${I}" stroke-width="1.4" transform="rotate(${((k * 37) % 9) - 4} ${x + 6} ${y + 6})"/>`
  }).join('')
  const cups = Array.from({ length: 5 }, (_, k) => `<path class="cup" style="--k:${k}" d="M${276} ${214 - k * 10}h16l-2 10h-12z" fill="${P.cream}" stroke="${I}" stroke-width="1.6" stroke-linejoin="round"/>`).join('')
  const proto = `
    <g class="proto proto--1"><rect x="304" y="194" width="34" height="24" fill="${CARD}" stroke="${I}" stroke-width="${L * 0.9}"/>${line('M310 204h12M310 210h18', 1.4, WOOD_DEEP)}</g>
    <g class="proto proto--2"><rect x="310" y="176" width="22" height="18" fill="${CARD}" stroke="${I}" stroke-width="${L * 0.9}"/><circle cx="317" cy="185" r="2.2" fill="${I}"/><circle cx="325" cy="185" r="2.2" fill="${I}"/></g>
    <g class="proto proto--3">${line('M321 176v-12', 2)}<circle cx="321" cy="162" r="3.6" fill="${P.tomato}" stroke="${I}" stroke-width="1.6"/></g>`
  return frame('incubate', 3, {
    sky: [
      [0, '#9cc7e2'],
      [1, '#e2eff2'],
    ],
    back: `${sun(206, 32, 13)}`,
    set: `
      <g class="clock" transform="translate(100 72) scale(.8)">
        <circle r="25" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        ${Array.from({ length: 12 }, (_, i) => line(`M0 -21v${i % 3 ? 2 : 5}`, i % 3 ? 1.4 : 2.2, I, `transform="rotate(${i * 30})"`)).join('')}
        <g class="clock__h">${line('M0 2V-12', 3.2)}</g>
        <g class="clock__m">${line('M0 3V-18', 2.2)}</g>
        <circle r="3" fill="${I}"/>
      </g>
      <g class="lamp">
        <path class="lamp__beam" d="M242 100L146 236H262Z" fill="${P.yolk}" opacity=".14"/>
        ${line('M250 44V82', 2.4)}
        <path d="M232 82h36l8 14h-52z" fill="${P.tomato}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <circle class="lamp__bulb" cx="250" cy="99" r="5" fill="${P.yolk}" stroke="${I}" stroke-width="2"/>
      </g>
      <g class="sticky-wall">${sticky}</g>
      <g class="mentor">
        ${placed(300, 222, 0.28, `${eggBody({ fill: SHELL.tan })}${face({ eyes: 'dot', mouth: 'smirk', look: [-8, 0], brows: 'one' })}
          <g fill="${P.sky}" fill-opacity=".38" stroke="${I}" stroke-width="${W.prop}"><rect x="62" y="119" width="34" height="28" rx="10"/><rect x="104" y="119" width="34" height="28" rx="10"/></g>
          ${line('M96 131q4 -4 8 0', W.fine)}
          <path d="M-30 150h80l-4 8h-72z" fill="#cfc8d6" stroke="${I}" stroke-width="${W.prop}"/>
          <circle cx="-8" cy="140" r="11" fill="${WOOD}" stroke="${I}" stroke-width="3.6"/><circle cx="22" cy="138" r="11" fill="#e7a45f" stroke="${I}" stroke-width="3.6"/>
          ${hand(30, 160, SHELL.tan, -20)}`)}
      </g>
      <path d="M266 218h100v8h-100z" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
      ${line('M274 226v44M358 226v44', L)}
      ${cups}${proto}
      ${stool(72)}${stool(136)}${stool(200)}`,
    note: note(3, { x: 238, y: 156, w: 118, rot: -3, arrow: 'M252 164q2 16 -6 30M246 194l-6 -8M246 194l7 -6' }),
  })
}

function pizza() {
  const pep = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="2.4" fill="${P.tomato}" stroke="${I}" stroke-width="1.2"/>`
  return frame('pizza', 4, {
    sky: [
      [0, '#e98b5e'],
      [0.45, '#f4b56a'],
      [1, '#f9dcb6'],
    ],
    back: `
      <g class="sc-sunset">${sun(350, 178, 22)}</g>
      ${cloud(92, 122, 0.6)}
      <path d="M34 252q80 -12 166 -4t166 0V270H34Z" fill="${mix(P.peachDeep, '#f4b56a', 0.3)}" opacity=".6"/>`,
    set: `
      <g class="bulb bulb--idea" transform="translate(222 56)">
        <circle class="bulb__glow" r="34" fill="${P.cream}" opacity="0"/>
        <path d="M0 -22c13 0 20 9 20 20c0 8 -6 12 -8 18h-24c-2 -6 -8 -10 -8 -18c0 -11 7 -20 20 -20Z" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        <path class="bulb__on" d="M0 -22c13 0 20 9 20 20c0 8 -6 12 -8 18h-24c-2 -6 -8 -10 -8 -18c0 -11 7 -20 20 -20Z" fill="${P.yolk}" stroke="${I}" stroke-width="${L}" opacity="0"/>
        <path d="M-8 20h16M-6 26h12" stroke="${I}" stroke-width="${L * 0.8}" stroke-linecap="round"/>
        ${line('M-5 4l5 7l5 -7', 2)}
        <g class="bulb__rays">${line('M-32 -16l-8 -6M32 -16l8 -6M0 -32v-8', 2)}</g>
      </g>
      ${Array.from({ length: 6 }, (_, i) => `<g transform="translate(${318 + (i % 2) * 4} ${256 - i * 13})"><path d="M0 0h44v13h-44z" fill="${P.cream}" stroke="${I}" stroke-width="${L * 0.9}" stroke-linejoin="round"/>${line('M6 6.5h12', 2, P.tomato)}</g>`).join('')}
      <g class="pie">
        <path d="M246 254l8 -56h58l4 56z" fill="${P.cream}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <g transform="translate(282 226)">
          <ellipse rx="12" ry="9" fill="none" stroke="${P.tomato}" stroke-width="2.2"/>
          <path d="M0 -6c3 0 5 3 5 5.5c0 2.4 -2 4 -5 4s-5 -1.6 -5 -4c0 -2.5 2 -5.5 5 -5.5Z" fill="${P.yolk}" stroke="${I}" stroke-width="1.2"/>
        </g>
        <path d="M238 254h88l6 16h-100z" fill="${mix(P.cream, WOOD, 0.25)}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <ellipse cx="282" cy="254" rx="40" ry="8.5" fill="#e7a45f" stroke="${I}" stroke-width="${L}"/>
        <ellipse cx="282" cy="253.6" rx="33" ry="5.6" fill="${P.tomato}" opacity=".85"/>
        <ellipse cx="282" cy="253.4" rx="30" ry="4.4" fill="${P.yolk}"/>
        ${pep(264, 253)}${pep(282, 252)}${pep(298, 254)}
        <g class="pie__slice">
          <path class="pie__cheese" d="M300 252q4 -12 -2 -22M308 253q7 -10 3 -22" fill="none" stroke="${P.yolk}" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M292 230l32 -9l-5 21z" fill="${P.yolk}" stroke="${I}" stroke-width="${L * 0.8}" stroke-linejoin="round"/>
          <path d="M324 221l-5 21" stroke="#e7a45f" stroke-width="4.4" stroke-linecap="round"/>
          ${pep(310, 230)}
        </g>
        <g class="steam">${line('M266 190q-5 -7 0 -14q5 -7 0 -14', 2)}${line('M282 186q-5 -7 0 -14', 2)}</g>
      </g>`,
    note: note(4, { x: 206, y: 128, w: 138, rot: 3, c: I, arrow: 'M290 136q8 28 -2 56M288 192l-7 -7M288 192l7 -6' }),
  })
}

function hatch() {
  const flags = Array.from({ length: 8 }, (_, i) => {
    const x = 84 + i * 30
    const y = 74 + (i - 3.5) * (i - 3.5) * 0.9
    const c = [P.yolk, P.tomato, P.mint, P.pink, P.cream][i % 5]
    return `<path d="M${x} ${y}l16 0l-8 16z" fill="${c}" stroke="${I}" stroke-width="1.6" stroke-linejoin="round"/>`
  }).join('')
  const confetti = Array.from({ length: 16 }, (_, i) => {
    const x = 70 + ((i * 53) % 260)
    const y = 96 + ((i * 37) % 96)
    const c = [P.yolk, P.tomato, P.mint, P.pink, P.cream, P.sky][i % 6]
    // the tilt lives on a wrapper so the falling animation can own the rect's transform
    return `<g transform="rotate(${(i * 47) % 180} ${x} ${y})"><rect class="confetti" style="--i:${i}" x="${x}" y="${y}" width="7" height="4" rx="1" fill="${c}"/></g>`
  }).join('')
  const disco = `
    <g transform="translate(318 88)">
      ${line('M0 -70V-14', 1.6)}
      <circle r="14" fill="#cfc8d6" stroke="${I}" stroke-width="${L}"/>
      ${line('M-14 0h28M-12 -7h24M-12 7h24M0 -14v28M-7 -12v24M7 -12v24', 1, '#7d7389')}
      <path d="M-8 -8h5v5h-5z" fill="${P.cream}"/><path d="M3 2h5v5h-5z" fill="${P.sky}"/>
      ${spark(-22, -4, 0.45, P.cream, 'sc-star')}${spark(24, 12, 0.4, P.yolk, 'sc-star')}
    </g>`
  return frame('hatch', 5, {
    sky: [
      [0, '#3b2d6e'],
      [0.6, '#7a5fb0'],
      [1, '#d7a7c2'],
    ],
    back: `
      ${stars([
        [66, 150, 0.5],
        [84, 112, 0.4],
        [352, 168, 0.45],
        [300, 140, 0.35],
      ])}
      ${line('M78 74q122 22 244 0', 1.6)}
      ${flags}
      <g class="confettis">${confetti}</g>`,
    set: `
      <path class="spot" d="M78 58L148 248H256Z" fill="${P.cream}" opacity="0"/>
      <g transform="translate(68 46) rotate(-38)">
        ${line('M0 -22v10', 2.4)}
        <path d="M-11 -12h22l4 26h-30z" fill="#3a3340" stroke="${I}" stroke-width="${L * 0.8}" stroke-linejoin="round"/>
        <ellipse cy="14" rx="15" ry="4" fill="${P.cream}" stroke="${I}" stroke-width="${L * 0.8}"/>
      </g>
      ${disco}
      <g transform="translate(316 162)">
        <rect x="-30" y="-24" width="60" height="40" rx="4" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        <path d="M-13 -2l9 9l18 -20" fill="none" stroke="${P.mintDeep}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
        ${line('M0 16v24M-12 40h24', L)}
      </g>
      <path d="M40 248h328v22h-328z" fill="${mix(P.lavDeep, I, 0.35)}" stroke="${I}" stroke-width="${L}"/>
      ${line('M48 256h312', 1.4, mix(P.lavDeep, '#ffffff', 0.25))}`,
    note: note(5, { x: 106, y: 64, w: 188, rot: -3, c: P.cream, arrow: 'M198 72q10 12 4 24M202 96l-7 -5M202 96l5 -7' }),
  })
}

function afterglow() {
  const lit = Array.from({ length: 12 }, (_, i) => {
    const x = 250 + ((i * 29) % 96)
    const y = 204 + ((i * 11) % 22)
    return `<rect class="win" style="--i:${i}" x="${x}" y="${y}" width="4" height="5" fill="${P.yolk}"/>`
  }).join('')
  const kocatepe = `
    <g transform="translate(268 236) scale(1.25)" fill="#1a1220">
      <path d="M-26 0V-14h52V0z"/>
      <path d="M-15 -14a15 15 0 0 1 30 0z"/>
      <path d="M-24 -14a6 6 0 0 1 12 0zM12 -14a6 6 0 0 1 12 0z"/>
      ${[-32, -24, 24, 32].map((x) => `<rect x="${x - 1.4}" y="-46" width="2.8" height="46"/><path d="M${x - 1.4} -46l1.4 -6l1.4 6z"/><rect class="win" style="--i:${x + 40}" x="${x - 1.4}" y="-38" width="2.8" height="2" fill="${P.yolk}"/>`).join('')}
      <rect class="win" style="--i:2" x="-6" y="-8" width="12" height="3" fill="${P.yolk}"/>
    </g>`
  const atakule = `
    <g transform="translate(326 236) scale(1.2)" fill="#1a1220">
      <path d="M-3 0L-2 -72h4L3 0z"/>
      <ellipse cy="-78" rx="9" ry="6"/>
      <rect class="win" style="--i:5" x="-7" y="-80" width="14" height="2.4" fill="${P.yolk}"/>
      <path d="M-0.8 -84v-14h1.6v14z"/>
      <circle class="atakule__light" cy="-100" r="2" fill="${P.tomato}"/>
    </g>`
  // a park bench: slatted back, a seat with depth, armrests
  const bench = `
    <path d="M42 188h188v6h-188z" fill="${WOOD}" stroke="${I}" stroke-width="${L * 0.9}"/>
    ${Array.from({ length: 9 }, (_, k) => `<rect x="${48 + k * 21}" y="194" width="9" height="34" fill="${WOOD}" stroke="${I}" stroke-width="${L * 0.7}"/>`).join('')}
    <path d="M38 226h196l8 6h-212z" fill="${mix(WOOD, '#ffffff', 0.15)}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
    <path d="M30 232h212v8h-212z" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
    ${line('M40 240v30M232 240v30', L * 1.1)}
    <path d="M26 206h14v26M246 206h-14v26" fill="none" stroke="${I}" stroke-width="${L * 1.2}" stroke-linejoin="round"/>
    <path d="M22 204h22v6h-22zM228 204h22v6h-22z" fill="${WOOD_DEEP}" stroke="${I}" stroke-width="${L * 0.8}"/>`
  return frame('afterglow', 6, {
    sky: [
      [0, P.night],
      [0.7, '#3a2747'],
      [1, '#5a3a5a'],
    ],
    back: `
      ${stars([
        [70, 84, 0.5],
        [130, 50, 0.35],
        [196, 34, 0.45],
        [244, 52, 0.4],
        [340, 124, 0.4],
      ])}
      <g class="moon"><circle cx="290" cy="80" r="19" fill="${P.yolk}" stroke="${I}" stroke-width="${L * 0.8}"/><circle cx="300" cy="73" r="17" fill="${P.night}"/></g>
      <path d="M34 234q40 -18 80 -8t70 -6t66 4t60 -12t56 8V270H34Z" fill="#2d1d33"/>
      ${kocatepe}${atakule}
      ${lit}`,
    set: `
      <g transform="translate(356 202)">
        ${line('M0 0V68', L)}
        <circle r="11" fill="${P.tomato}" stroke="${I}" stroke-width="${L}"/>
        <path d="M-5.5 4.5V-4.5l5.5 6l5.5 -6V4.5" fill="none" stroke="${P.cream}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
      </g>
      ${bench}
      <path d="M262 258h40v12h-40z" fill="${P.cream}" stroke="${I}" stroke-width="${L * 0.9}"/>
      ${line('M268 264h12', 2, P.tomato)}`,
  })
}

const SCENES = [doors, crack, nest, incubate, pizza, hatch, afterglow]

/** One scene's markup, by step. */
export const sceneMarkup = (i: number) => SCENES[i]?.() ?? ''

/* ── the edges of the day: the way in, and the way home ─────────── */

const introSvg = () => `
  <svg class="edge__art" viewBox="0 0 200 300" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
    <g transform="translate(120 0)">
      ${line('M0 270V140', L * 1.3)}
      <path d="M-46 146h74l14 12l-14 12h-74z" fill="${WOOD}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
      <text x="-10" y="164" text-anchor="middle" font-family="${MONO}" font-size="14" font-weight="500" letter-spacing="1.5" fill="${I}">ODTÜ</text>
      <path d="M-40 186h66l12 10l-12 10h-66z" fill="${P.cream}" stroke="${I}" stroke-width="${L * 0.9}" stroke-linejoin="round"/>
      <text x="-8" y="200" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="1" fill="${I}">${tr ? 'PAZAR' : 'SUNDAY'}</text>
    </g>
    <g transform="translate(36 270)">
      <path d="M0 0c-4 -16 10 -26 20 -18c4 -14 24 -12 26 2c12 -4 20 8 14 16z" fill="${P.mint}" stroke="${I}" stroke-width="${L * 0.9}" stroke-linejoin="round"/>
    </g>
  </svg>`

const outroSvg = () => `
  <svg class="edge__art" viewBox="0 0 260 300" preserveAspectRatio="xMinYMax meet" aria-hidden="true">
    <g class="note">
      <text x="30" y="118" transform="rotate(-6 30 118)" font-family="${HAND}" font-size="30" fill="${P.tomato}">${tr ? 'iki pazar sonra' : 'see you in'}</text>
      <text x="40" y="150" transform="rotate(-6 40 150)" font-family="${HAND}" font-size="30" fill="${P.tomato}">${tr ? 'görüşürüz' : 'two Sundays'}</text>
      <path class="note__arrow" pathLength="1" d="M170 150q34 12 30 52M200 202l-8 -8M200 202l6 -9" fill="none" stroke="${P.tomato}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`

/** Paint every step's scene into its slot (and its note as a line for phones), and the edges of the strip. */
export function renderScenes(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.step__scene').forEach((slot, i) => {
    const draw = SCENES[i]
    if (draw && !slot.childElementCount) slot.innerHTML = draw()
    const step = slot.closest('.step')
    if (NOTES[i] && step && !step.querySelector('.step__note')) {
      const p = document.createElement('p')
      p.className = 'step__note'
      p.setAttribute('aria-hidden', 'true')
      p.textContent = noteText(i)
      slot.before(p)
    }
  })
  const intro = root.querySelector<HTMLElement>('.day__edge--in')
  const outro = root.querySelector<HTMLElement>('.day__edge--out .edge__note')
  if (intro && !intro.childElementCount) intro.innerHTML = introSvg()
  if (outro && !outro.childElementCount) outro.innerHTML = outroSvg()
}
