import { PALETTE } from './util'
import { lang } from './i18n'
import { I, SHELL, W, eggBody, face, hand, ink, mix, nextId } from './ink'

/**
 * "A day at the club", drawn: seven arched windows in a row, each painted
 * with its own hour of the sky and a set built around the spot where the
 * cast stands, plus the cast itself — our egg and the two teammates it meets
 * at Nest — from the same egg kit as the specimen plate.
 *
 * Scenes live on a 400 × 300 stage; the floor is y = 270 everywhere, so the
 * windows join into one building. The hero stands at x = MARK in every
 * window, its team at SLOTS behind it, so sets keep the middle of the floor
 * clear and put their props to the sides or up in the sky.
 *
 * Eggs are drawn at full kit size (centred on x 100, egg on y 262, feet on
 * y 316) and scaled into place, so their line weight scales with them.
 */

const P = PALETTE
const FLOOR = 270
/** Where the hero stands in each window, and its team behind it. */
export const MARK = 200
export const SLOTS = [136, 72] as const
/** What each step puts under their feet: a crate, the stage, a bench. */
export const LIFT = [0, 34, 0, 0, 0, 22, 26]
export const MATE_LIFT = [0, 0, 0, 0, 0, 22, 26]
/** Scene scale of the eggs: the hero is 80 units wide, the team 69. */
const HERO_S = 0.465
const MATE_S = 0.4

const ARCH = 'M34 270V150A166 136 0 0 1 366 150V270Z'
const WOOD = '#e0a15a'
const WOOD_DEEP = '#a8643a'
const TWIG = '#b98756'
const TWIG_DEEP = '#7d5434'
const SCREEN = '#e4e0ec'
const L = 2.6 // a scene's line weight, matching an egg drawn at ~0.45 scale
const MONO = 'DM Mono, ui-monospace, monospace'
const HAND = 'Reenie Beanie, cursive'
const tr = lang === 'tr'

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
 * poster. It draws itself on when its step comes round.
 */
const note = (o: { x: number; y: number; rot?: number; en: string; tr: string; arrow: string; c?: string; size?: number }) => `
  <g class="note">
    <text x="${o.x}" y="${o.y}" transform="rotate(${o.rot ?? -4} ${o.x} ${o.y})" font-family="${HAND}" font-size="${o.size ?? 27}" fill="${o.c ?? P.tomato}">${tr ? o.tr : o.en}</text>
    <path class="note__arrow" pathLength="1" d="${o.arrow}" fill="none" stroke="${o.c ?? P.tomato}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`

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

const mic = (x: number, y: number) => `
  <g class="prop prop--mic">
    ${line(`M${x - 3} ${y + 12}L${x - 10} ${y + 52}`, 9)}
    ${line(`M${x - 3} ${y + 12}L${x - 10} ${y + 52}`, 4.5, '#5a5163')}
    <circle cx="${x}" cy="${y}" r="15" fill="#3a3340" stroke="${I}" stroke-width="${W.prop}"/>
    ${line(`M${x - 8} ${y - 6}l16 12M${x - 8} ${y + 5}l12 -14`, 2, '#7a7084')}
    <g class="sound">${line(`M${x + 24} ${y - 12}q8 10 0 22`, 3.4)}${line(`M${x + 36} ${y - 20}q12 18 0 38`, 3.4)}</g>
  </g>`

const laptop = () => `
  <g class="prop prop--laptop" transform="rotate(-10 150 210)">
    <rect x="112" y="186" width="84" height="54" rx="7" fill="${SCREEN}" stroke="${I}" stroke-width="${W.prop}"/>
    <path d="M154 202c4 0 7 6 7 11c0 4.5-3 7-7 7s-7-2.5-7-7c0-5 3-11 7-11Z" fill="${P.yolk}" stroke="${I}" stroke-width="2.6"/>
  </g>`

const SWEAT = `<path d="M168 92q8 12 0 18q-8 -6 0 -18z" fill="${P.sky}" stroke="${I}" stroke-width="3"/>`

/** Two legs in red sneakers, hinged at the hips (80, 248) and (120, 248). */
function legs() {
  const shoe = (x: number, flip: number) => `
    <path d="M${x - 2} ${300}h${24 * flip}q${10 * flip} 0 ${10 * flip} 10v4h${-40 * flip}q${-2 * flip} -14 ${6 * flip} -14z" fill="${P.tomato}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
    ${line(`M${x - 6 * flip} ${314}h${36 * flip}`, 3, P.cream)}`
  return `
    <g class="leg leg--l">${line('M80 248L76 302', 7)}${shoe(70, -1)}</g>
    <g class="leg leg--r">${line('M120 248L124 302', 7)}${shoe(130, 1)}</g>`
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
  () => face({ eyes: 'dot', mouth: 'flat', brows: 'worried', look: [5, 3] }),
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

/** Group-chat bubbles that rise from the phone on the way home. */
const bubbles = () => `
  <g class="wbub wbub--1"><rect x="150" y="-34" width="70" height="32" rx="16" fill="${P.cream}" stroke="${I}" stroke-width="3.4"/>${line('M168 -18h3M184 -18h3M200 -18h3', 5)}</g>
  <g class="wbub wbub--2"><rect x="110" y="-84" width="60" height="32" rx="16" fill="${P.yolk}" stroke="${I}" stroke-width="3.4"/><path d="M140 -72c-5 -6 -15 -1 -10 6l10 9l10 -9c5 -7 -5 -12 -10 -6z" fill="${P.tomato}" stroke="${I}" stroke-width="2.4"/></g>
  <g class="wbub wbub--3"><rect x="168" y="-130" width="80" height="32" rx="16" fill="${P.mint}" stroke="${I}" stroke-width="3.4"/>${line('M186 -114h44', 4, P.mintDeep)}</g>`

/** Shell chips and the day's props, flung out of the shell at Hatch. */
const CHIPS = [
  [-40, 'M0 -10l12 4l-4 10l-10 -2z'],
  [-15, 'M0 -8l10 2l-2 9l-9 -1z'],
  [20, 'M0 -9l11 3l-3 9l-9 -3z'],
  [65, 'M0 -7l9 2l-1 8l-9 -1z'],
  [-120, 'M0 -9l12 3l-4 9l-9 -2z'],
  [-165, 'M0 -8l10 3l-3 8l-8 -2z'],
  [160, 'M0 -10l12 4l-4 10l-10 -2z'],
  [115, 'M0 -7l9 2l-2 8l-8 -1z'],
] as const
export const BURST_ANGLES = [-150, -112, -68, -30, ...CHIPS.map(([a]) => a)]
const burst = () => {
  const props = [
    `<g transform="translate(-158 -180)">${coffee(158, 196)}</g>`,
    `<g transform="translate(-170 -170)">${mic(180, 146)}</g>`,
    `<g transform="translate(-154 -214)">${laptop()}</g>`,
    `<g transform="translate(-170 -200)">${slice(146, 206, -18)}</g>`,
  ]
  const chips = CHIPS.map(([, d]) => `<path d="${d}" fill="${SHELL.white}" stroke="${I}" stroke-width="3" stroke-linejoin="round" transform="scale(1.6)"/>`)
  return [...props, ...chips].map((g, i) => `<g class="wburst" data-i="${i}" opacity="0">${g}</g>`).join('')
}

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
        <g class="walker__hands">${hand(30, 204, SHELL.white, -20)}${hand(168, 204, SHELL.white, 20)}</g>
        <g class="wprop wprop--0">${coffee(158, 196)}</g>
        <g class="wprop wprop--1">${mic(180, 146)}</g>
        <g class="wprop wprop--2">${spark(-14, 40, 1.1, P.yolk)}${spark(204, 18, 0.8)}</g>
        <g class="wprop wprop--3">${laptop()}${SWEAT}</g>
        <g class="wprop wprop--4">${slice(146, 206, -18)}</g>
        <g class="wprop wprop--6">${hand(36, 214, P.yolk, -20)}${hand(166, 214, P.yolk, 20)}${phone(170, 196, 14)}${bubbles()}</g>
        <g class="walker__burst">${burst()}</g>
      </g></g>
    </svg>`
}

/** A teammate who walks behind the hero from Nest on. */
export function mateSvg(kind: 'beanie' | 'cap') {
  const fill = kind === 'beanie' ? SHELL.brown : '#ead1b5'
  const hat = kind === 'beanie' ? beanie() : cap()
  const faces = [
    face({ eyes: 'happy', mouth: 'smile', blush: true }),
    face({ eyes: 'dot', mouth: 'line', look: [6, 2] }),
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
        <g class="mprop mprop--laptop">${laptop()}</g>
      </g></g>
    </svg>`
}

/* ── stills: the cast drawn into each scene, for phones ──────────── */

/** The hero as a still at a step, with legs, standing where it stands. */
export function heroStill(state: number) {
  const hatched = state >= 5
  const halves = hatched ? shellHalves() : null
  const prop =
    state === 0
      ? coffee(158, 196)
      : state === 1
        ? mic(180, 146)
        : state === 3
          ? laptop() + SWEAT
          : state === 4
            ? slice(146, 206, -18)
            : state === 6
              ? phone(170, 196, 14) + bubbles()
              : ''
  const body = hatched
    ? `${state === 5 ? armsUp(P.yolk) : ''}${golden()}${state === 5 ? goldJoy() : goldCalm()}
       ${halves!.bottom}
       <g transform="${hatTransform()}">${halves!.top}</g>`
    : `${shellWhole(state)}${SHELL_FACES[state]()}`
  const skin = hatched ? P.yolk : SHELL.white
  const hands = state === 5 ? '' : state === 6 ? hand(36, 214, skin, -20) + hand(166, 214, skin, 20) : hand(30, 204, skin, -20) + hand(168, 204, skin, 20)
  return `<g class="hero hero--still">${legs()}${body}${hands}${prop}</g>`
}

function mateStill(kind: 'beanie' | 'cap', state: number) {
  const fill = kind === 'beanie' ? SHELL.brown : '#ead1b5'
  const hat = kind === 'beanie' ? beanie() : cap()
  const mood = [
    face({ eyes: 'happy', mouth: 'smile', blush: true }),
    face({ eyes: 'dot', mouth: 'line', look: [6, 2] }),
    face({ eyes: 'happy', mouth: 'tongue', blush: true }),
    face({ eyes: 'happy', mouth: 'grin', blush: true }),
    face({ eyes: 'closed', mouth: 'smile', blush: true }),
  ][Math.max(0, state - 2)]
  const arms = state === 5 ? '' : hand(30, 204, fill, -20) + hand(168, 204, fill, 20)
  const prop = state === 4 ? slice(146, 206, -18) : state === 6 ? phone(166, 196, 12) : state === 3 && kind === 'beanie' ? laptop() : ''
  return `${legs()}${state === 5 ? armsUp(fill, 0) : ''}${eggBody({ fill })}${hat}${mood}${arms}${prop}`
}

/** The cast of a step as phones see it: hero at the mark, team behind. */
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

function frame(slug: string, step: number, f: Frame) {
  const g = nextId('sk')
  const c = nextId('ac')
  const ticks = Array.from({ length: 21 }, (_, i) => line(`M${i * 20} ${FLOOR + 1}v${i % 5 === 0 ? 10 : 5}`, i % 5 === 0 ? 1.8 : 1.2, I, i % 5 ? 'opacity=".5"' : '')).join('')
  return `
    <svg class="scene scene--${slug}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">${f.sky.map(([o, s], i) => `<stop class="sky-stop sky-stop--${i}" offset="${o}" stop-color="${s}"/>`).join('')}</linearGradient>
        <clipPath id="${c}"><path d="${ARCH}"/></clipPath>
      </defs>
      <path d="${ARCH}" fill="url(#${g})"/>
      <g clip-path="url(#${c})">${f.back}</g>
      <path d="${ARCH}" fill="none" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
      <g class="scene__set">${f.set}</g>
      ${line(`M0 ${FLOOR}H400`, L)}
      ${ticks}
      <g class="scene__cast">${cast(step)}</g>
      ${f.note ?? ''}
    </svg>`
}

function doors() {
  return frame('doors', 0, {
    sky: [
      [0, '#f8cf6a'],
      [0.55, '#fbe3a3'],
      [1, '#fdf1cf'],
    ],
    back: `
      ${sun(96, 118, 19)}
      ${cloud(236, 66, 0.9)}${cloud(140, 92, 0.6)}
      <path d="M34 250q60 -18 120 -6t130 -4t82 6V270H34Z" fill="${mix('#fbe3a3', WOOD, 0.35)}" opacity=".55"/>`,
    set: `
      <path class="door__light" d="M268 270L324 270L360 296L222 296Z" fill="${P.yolk}" opacity="0"/>
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
        <rect x="341" y="150" width="14" height="14" fill="${P.yolk}" transform="rotate(-6 348 157)"/>
        <rect x="343" y="172" width="14" height="14" fill="${P.pink}" transform="rotate(5 350 179)"/>
        <rect x="340" y="194" width="14" height="14" fill="${P.mint}" transform="rotate(-3 347 201)"/>
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
    note: note({ x: 128, y: 52, en: 'name tag? optional', tr: 'yaka kartı? keyfine', arrow: 'M196 62q16 18 2 46M198 108l-9 -6M198 108l5 -9' }),
  })
}

function crack() {
  const seated = (x: number, fill: string, look: number) =>
    stand(x, 262, 0.3, `${legs()}${eggBody({ fill })}${face({ eyes: 'dot', mouth: 'o', look: [look, 0] })}${hand(30, 204, fill, -20)}${hand(168, 204, fill, 20)}`)
  return frame('crack', 1, {
    sky: [
      [0, '#b9d6ea'],
      [1, '#eaf3f2'],
    ],
    back: `
      ${sun(304, 88, 17)}
      ${cloud(178, 70, 0.6)}`,
    set: `
      <g class="watch" transform="translate(98 142)">
        <rect x="-7" y="-52" width="14" height="10" rx="3" fill="#cfc8d6" stroke="${I}" stroke-width="${L * 0.8}"/>
        <circle r="38" fill="${P.cream}" stroke="${I}" stroke-width="${L * 1.2}"/>
        ${Array.from({ length: 12 }, (_, i) => line(`M0 -34v${i % 3 ? 4 : 8}`, 2, I, `transform="rotate(${i * 30})"`)).join('')}
        <g class="watch__hand">${line('M0 0V-30', 3, P.tomato)}</g>
        <circle r="4" fill="${I}"/>
      </g>
      <g class="bulb" transform="translate(266 120)">
        <circle class="bulb__glow" r="28" fill="${P.yolk}" opacity="0"/>
        <path d="M0 -18c10 0 16 8 16 16c0 7 -5 10 -7 15h-18c-2 -5 -7 -8 -7 -15c0 -8 6 -16 16 -16Z" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        <path class="bulb__on" d="M0 -18c10 0 16 8 16 16c0 7 -5 10 -7 15h-18c-2 -5 -7 -8 -7 -15c0 -8 6 -16 16 -16Z" fill="${P.yolk}" stroke="${I}" stroke-width="${L}" opacity="0"/>
        <path d="M-7 17h14M-5 22h10" stroke="${I}" stroke-width="${L * 0.8}" stroke-linecap="round"/>
        ${line('M-4 2l4 6l4 -6', 1.8)}
      </g>
      <g>
        <path d="M284 244h80v7h-80z" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
        ${line('M292 251v19M356 251v19', L)}
        ${seated(304, SHELL.brown, -8)}${seated(342, SHELL.white, -8)}
      </g>
      <path d="M168 236h64l4 34h-72z" fill="${WOOD}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
      ${line('M170 248h62M168 260h66', 1.4, WOOD_DEEP)}`,
    note: note({ x: 210, y: 46, rot: 3, en: '60 sec. go!', tr: '60 sn. başla!', arrow: 'M226 54q-6 20 -16 36M210 90l-1 -10M210 90l8 -6' }),
  })
}

function nest() {
  const twigs = Array.from({ length: 8 }, (_, i) => {
    const y = 238 + (i % 3) * 9
    const x = 128 + i * 21
    return line(`M${x - 20} ${y}q18 ${-8 + (i % 2) * 14} 40 ${-2}`, 1.8, TWIG_DEEP)
  }).join('')
  const rim = `
    <path d="M112 232q88 -10 176 0q-5 38 -88 40q-83 -2 -88 -40z" fill="${TWIG}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
    <path d="M118 234q82 11 164 0" fill="none" stroke="${I}" stroke-width="${L * 0.8}"/>
    ${twigs}
    ${line('M110 230l-12 -10M290 230l14 -12M134 266l-10 8', 2.2, TWIG_DEEP)}`
  return frame('nest', 2, {
    sky: [
      [0, '#a9cde3'],
      [1, '#e6f1ef'],
    ],
    back: `
      ${sun(306, 82, 16)}
      ${cloud(70, 96, 0.8)}
      ${line('M198 62q8 -8 16 0q8 -8 16 0', 2.4)}${line('M244 44q6 -6 12 0q6 -6 12 0', 2)}`,
    set: `
      <g class="nesters">
        ${placed(160, 256, MATE_S, `${eggBody({ fill: SHELL.brown })}${beanie()}${face({ eyes: 'happy', mouth: 'smile', blush: true })}`, 'nester nester--a')}
        ${placed(240, 256, MATE_S, `${eggBody({ fill: '#ead1b5' })}${cap()}${face({ eyes: 'dot', mouth: 'smile', look: [-6, 0] })}`, 'nester nester--b')}
      </g>
      <g class="nest">${rim}</g>
      <g class="hearts">
        <path d="M236 138c-6 -8 -18 -2 -12 8l12 12l12 -12c6 -10 -6 -16 -12 -8z" fill="${P.tomato}" stroke="${I}" stroke-width="2"/>
        <path d="M282 116c-4 -6 -13 -1 -9 6l9 9l9 -9c4 -7 -5 -12 -9 -6z" fill="${P.pink}" stroke="${I}" stroke-width="2"/>
      </g>
      <g transform="translate(344 152)">
        ${line('M0 0v118', L)}
        <path d="M0 2l34 10l-34 12z" fill="${P.yolk}" stroke="${I}" stroke-width="${L * 0.8}" stroke-linejoin="round"/>
      </g>`,
    note: note({ x: 48, y: 58, rot: -5, en: 'co-founders now', tr: 'artık ortaklar', arrow: 'M86 70q-2 26 18 44M104 114l-10 -2M104 114l-3 -10' }),
  })
}

function incubate() {
  return frame('incubate', 3, {
    sky: [
      [0, '#9cc7e2'],
      [1, '#e2eff2'],
    ],
    back: `
      <g class="noon-sun">${sun(120, 44, 18)}</g>
      ${cloud(300, 58, 0.6)}`,
    set: `
      <g class="clock" transform="translate(200 64)">
        <circle r="25" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        ${Array.from({ length: 12 }, (_, i) => line(`M0 -21v${i % 3 ? 2 : 5}`, i % 3 ? 1.4 : 2.2, I, `transform="rotate(${i * 30})"`)).join('')}
        <g class="clock__h">${line('M0 2V-12', 3.2)}</g>
        <g class="clock__m">${line('M0 3V-18', 2.2)}</g>
        <circle r="3" fill="${I}"/>
      </g>
      <g class="lamp">
        <path class="lamp__beam" d="M274 106L150 262H264Z" fill="${P.yolk}" opacity=".14"/>
        ${line('M296 20L284 80', 2.4)}
        <path d="M262 84l40 -8l6 18l-46 10z" fill="${P.tomato}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <circle class="lamp__bulb" cx="279" cy="103" r="6" fill="${P.yolk}" stroke="${I}" stroke-width="2"/>
      </g>
      <g class="mentor">
        ${placed(322, 226, 0.3, `${eggBody({ fill: SHELL.tan })}${face({ eyes: 'dot', mouth: 'smirk', look: [-8, 0], brows: 'one' })}
          <g fill="${P.sky}" fill-opacity=".38" stroke="${I}" stroke-width="${W.prop}"><rect x="62" y="119" width="34" height="28" rx="10"/><rect x="104" y="119" width="34" height="28" rx="10"/></g>
          ${line('M96 131q4 -4 8 0', W.fine)}
          <path d="M-30 150h80l-4 8h-72z" fill="#cfc8d6" stroke="${I}" stroke-width="${W.prop}"/>
          <circle cx="-8" cy="140" r="11" fill="${WOOD}" stroke="${I}" stroke-width="3.6"/><circle cx="22" cy="138" r="11" fill="#e7a45f" stroke="${I}" stroke-width="3.6"/>
          ${hand(30, 160, SHELL.tan, -20)}`)}
      </g>
      <path d="M262 222h104v8h-104z" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
      ${line('M272 230v40M356 230v40', L)}
      <g class="lap">
        <path d="M268 222l6 -34h44l-4 34z" fill="${SCREEN}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <path class="lap__screen" d="M278 215l4 -21h30l-3 21z" fill="${P.sky}"/>
        <path d="M290 200l-5 5 5 5M302 200l5 5 -5 5" fill="none" stroke="${P.lavDeep}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <path d="M328 208h12v14h-12z" fill="${P.cream}" stroke="${I}" stroke-width="2"/>`,
    note: note({ x: 40, y: 92, rot: -6, en: 'it compiles?!', tr: 'derlendi mi?!', arrow: 'M92 102q30 30 92 76M184 178l-10 -1M184 178l-3 -9' }),
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
      <g class="sc-sunset">${sun(92, 128, 26)}</g>
      ${cloud(250, 52, 0.7)}
      <path d="M34 252q80 -12 166 -4t166 0V270H34Z" fill="${mix(P.peachDeep, '#f4b56a', 0.3)}" opacity=".6"/>`,
    set: `
      <g class="bulb bulb--idea" transform="translate(200 54)">
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
    note: note({ x: 244, y: 104, rot: 4, en: 'pineapple: no.', tr: 'ananas: hayır.', arrow: 'M300 112q8 18 2 40M302 152l-7 -8M302 152l6 -8' }),
  })
}

function hatch() {
  const flags = Array.from({ length: 8 }, (_, i) => {
    const x = 84 + i * 30
    const y = 70 + (i - 3.5) * (i - 3.5) * 0.9
    const c = [P.yolk, P.tomato, P.mint, P.pink, P.cream][i % 5]
    return `<path d="M${x} ${y}l16 0l-8 16z" fill="${c}" stroke="${I}" stroke-width="1.6" stroke-linejoin="round"/>`
  }).join('')
  const confetti = Array.from({ length: 16 }, (_, i) => {
    const x = 70 + ((i * 53) % 260)
    const y = 90 + ((i * 37) % 100)
    const c = [P.yolk, P.tomato, P.mint, P.pink, P.cream, P.sky][i % 6]
    // the tilt lives on a wrapper so the falling animation can own the rect's transform
    return `<g transform="rotate(${(i * 47) % 180} ${x} ${y})"><rect class="confetti" style="--i:${i}" x="${x}" y="${y}" width="7" height="4" rx="1" fill="${c}"/></g>`
  }).join('')
  return frame('hatch', 5, {
    sky: [
      [0, '#3b2d6e'],
      [0.6, '#7a5fb0'],
      [1, '#d7a7c2'],
    ],
    back: `
      ${stars([
        [86, 104, 0.6],
        [132, 40, 0.4],
        [262, 44, 0.5],
        [314, 84, 0.6],
        [196, 26, 0.35],
      ])}
      ${line('M78 70q122 22 244 0', 1.6)}
      ${flags}
      <g class="confettis">${confetti}</g>`,
    set: `
      <path class="spot" d="M322 44L148 248H256Z" fill="${P.cream}" opacity="0"/>
      <g transform="translate(330 32) rotate(38)">
        ${line('M0 -22v10', 2.4)}
        <path d="M-11 -12h22l4 26h-30z" fill="#3a3340" stroke="${I}" stroke-width="${L * 0.8}" stroke-linejoin="round"/>
        <ellipse cy="14" rx="15" ry="4" fill="${P.cream}" stroke="${I}" stroke-width="${L * 0.8}"/>
      </g>
      <g transform="translate(316 150)">
        <rect x="-32" y="-26" width="64" height="44" rx="4" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        <path d="M-14 -2l10 10l20 -22" fill="none" stroke="${P.mintDeep}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
        ${line('M0 18v26M-14 44h28', L)}
      </g>
      <path d="M40 248h328v22h-328z" fill="${mix(P.lavDeep, I, 0.35)}" stroke="${I}" stroke-width="${L}"/>
      ${line('M48 256h312', 1.4, mix(P.lavDeep, '#ffffff', 0.25))}`,
    note: note({ x: 46, y: 112, rot: -6, en: 'it works! (mostly)', tr: 'çalışıyor! (sayılır)', c: P.yolk, arrow: 'M150 100q22 -4 32 8M182 108l-9 -4M182 108l-1 -10' }),
  })
}

function afterglow() {
  const lit = Array.from({ length: 16 }, (_, i) => {
    const x = 42 + ((i * 41) % 316)
    const y = 222 + ((i * 13) % 20)
    return `<rect class="win" style="--i:${i}" x="${x}" y="${y}" width="4" height="5" fill="${P.yolk}"/>`
  }).join('')
  const kocatepe = `
    <g transform="translate(262 236)" fill="#1a1220">
      <path d="M-26 0V-14h52V0z"/>
      <path d="M-15 -14a15 15 0 0 1 30 0z"/>
      <path d="M-24 -14a6 6 0 0 1 12 0zM12 -14a6 6 0 0 1 12 0z"/>
      ${[-32, -24, 24, 32].map((x) => `<rect x="${x - 1.4}" y="-46" width="2.8" height="46"/><path d="M${x - 1.4} -46l1.4 -6l1.4 6z"/><rect class="win" style="--i:${x + 40}" x="${x - 1.4}" y="-38" width="2.8" height="2" fill="${P.yolk}"/>`).join('')}
      <rect class="win" style="--i:2" x="-6" y="-8" width="12" height="3" fill="${P.yolk}"/>
    </g>`
  const atakule = `
    <g transform="translate(320 236)" fill="#1a1220">
      <path d="M-3 0L-2 -72h4L3 0z"/>
      <ellipse cy="-78" rx="9" ry="6"/>
      <rect class="win" style="--i:5" x="-7" y="-80" width="14" height="2.4" fill="${P.yolk}"/>
      <path d="M-0.8 -84v-14h1.6v14z"/>
      <circle class="atakule__light" cy="-100" r="2" fill="${P.tomato}"/>
    </g>`
  const bench = `
    <path d="M40 220h212v8h-212z" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
    ${line('M52 228v16M240 228v16', L)}
    <path d="M36 244h220v8h-220z" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
    ${line('M48 252v18M244 252v18', L)}`
  return frame('afterglow', 6, {
    sky: [
      [0, P.night],
      [0.7, '#3a2747'],
      [1, '#5a3a5a'],
    ],
    back: `
      ${stars([
        [70, 74, 0.5],
        [124, 44, 0.35],
        [196, 70, 0.4],
        [240, 34, 0.55],
        [160, 120, 0.3],
        [352, 128, 0.4],
      ])}
      <g class="moon"><circle cx="314" cy="62" r="20" fill="${P.yolk}" stroke="${I}" stroke-width="${L * 0.8}"/><circle cx="325" cy="55" r="18" fill="${P.night}"/></g>
      <path d="M34 232q40 -18 80 -8t70 -6t66 4t60 -12t56 8V270H34Z" fill="#2d1d33"/>
      ${kocatepe}${atakule}
      ${lit}`,
    set: `
      <g transform="translate(350 196)">
        ${line('M0 0V74', L)}
        <circle r="13" fill="${P.tomato}" stroke="${I}" stroke-width="${L}"/>
        <path d="M-6.5 5.5V-5.5l6.5 7l6.5 -7V5.5" fill="none" stroke="${P.cream}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>
      </g>
      ${bench}
      <path d="M262 236h40v12h-40z" fill="${P.cream}" stroke="${I}" stroke-width="${L * 0.9}"/>
      ${line('M268 242h12', 2, P.tomato)}`,
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
      <text x="34" y="150" transform="rotate(-6 34 150)" font-family="${HAND}" font-size="30" fill="${P.tomato}">${tr ? 'iki pazar sonra' : 'see you in'}</text>
      <text x="44" y="182" transform="rotate(-6 44 182)" font-family="${HAND}" font-size="30" fill="${P.tomato}">${tr ? 'görüşürüz' : 'two Sundays'}</text>
      <path class="note__arrow" pathLength="1" d="M176 176q30 14 30 56M206 232l-8 -8M206 232l6 -9" fill="none" stroke="${P.tomato}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`

/** Paint every step's scene into its slot, and the edges of the strip. */
export function renderScenes(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.step__scene').forEach((slot, i) => {
    const draw = SCENES[i]
    if (draw && !slot.childElementCount) slot.innerHTML = draw()
  })
  const intro = root.querySelector<HTMLElement>('.day__edge--in')
  const outro = root.querySelector<HTMLElement>('.day__edge--out')
  if (intro && !intro.childElementCount) intro.innerHTML = introSvg()
  if (outro && !outro.childElementCount) outro.innerHTML = outroSvg()
}
