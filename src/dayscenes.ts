import { PALETTE } from './util'
import { I, SHELL, W, eggBody, face, hand, ink, mix, nextId } from './ink'

/**
 * "A day at the club", drawn: seven arched windows in a row, each painted
 * with its own hour of the sky, a set piece in front of each, and the cast
 * — our egg and the two teammates it picks up at Nest — drawn from the same
 * egg kit as the specimen plate.
 *
 * Scenes live on a 400 × 300 stage; the floor is y = 270 everywhere, so the
 * windows join into one continuous building. Eggs are drawn at full kit size
 * (cx 100, standing on y 262) and scaled into place, so their line weight
 * scales with them.
 */

const P = PALETTE
const FLOOR = 270
const ARCH = 'M34 270V150A166 136 0 0 1 366 150V270Z'
const WOOD = '#e0a15a'
const WOOD_DEEP = '#a8643a'
const TWIG = '#b98756'
const TWIG_DEEP = '#7d5434'
const SCREEN = '#e4e0ec'
const L = 2.6 // a scene's line weight, matching an egg drawn at ~0.45 scale

const n = (v: number) => +v.toFixed(1)
const line = (d: string, w = L, c: string = I, extra = '') => ink(d, w, c, extra)

/** A four-point sparkle. */
const spark = (x: number, y: number, s: number, c: string = I, cls = '') =>
  `<path ${cls ? `class="${cls}"` : ''} d="M${x} ${y - 10 * s}q${2 * s} ${8 * s} ${10 * s} ${10 * s}q${-8 * s} ${2 * s} ${-10 * s} ${10 * s}q${-2 * s} ${-8 * s} ${-10 * s} ${-10 * s}q${8 * s} ${-2 * s} ${10 * s} ${-10 * s}z" fill="${c}"/>`

const cloud = (x: number, y: number, s = 1) =>
  `<path d="M${x} ${y}h${46 * s}a${12 * s} ${12 * s} 0 0 0 -6 ${-22 * s}a${16 * s} ${16 * s} 0 0 0 -28 ${-8 * s}a${12 * s} ${12 * s} 0 0 0 -16 ${12 * s}a${10 * s} ${10 * s} 0 0 0 4 ${18 * s}z" fill="${P.cream}" stroke="${I}" stroke-width="${L * 0.8}" stroke-linejoin="round"/>`

const sun = (x: number, y: number, r: number, rays = true) => `
  <g class="sc-sun">
    ${rays ? `<g class="sc-rays">${Array.from({ length: 10 }, (_, i) => `<path d="M${x} ${y - r - 7}v-9" transform="rotate(${i * 36} ${x} ${y})" stroke="${I}" stroke-width="${L * 0.8}" stroke-linecap="round"/>`).join('')}</g>` : ''}
    <circle cx="${x}" cy="${y}" r="${r}" fill="${P.yolk}" stroke="${I}" stroke-width="${L * 0.8}"/>
  </g>`

const stars = (pts: [number, number, number][]) =>
  pts.map(([x, y, s], i) => spark(x, y, s, i % 3 ? P.cream : P.yolk, 'sc-star')).join('')

/** An egg from the kit, scaled into a scene. `x` is its centre, `bottom` its feet. */
export const placed = (x: number, bottom: number, s: number, inner: string, cls = '') =>
  `<g ${cls ? `class="${cls}"` : ''} transform="translate(${n(x - 100 * s)} ${n(bottom - 262 * s)}) scale(${s})">${inner}</g>`

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

/** The hero's shell: whole until it hatches, then split along a zigzag. */
const ZIG = '6,178 26,162 46,186 66,160 86,188 106,160 126,186 146,160 166,184 186,164 196,172'

const CRACK = `fill="none" stroke="${I}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`
const crack1 = `<path class="hero__crack hero__crack--1" pathLength="1" d="M132 62l12 18-9 12 15 11" ${CRACK}/>`
const crack2 = `<path class="hero__crack hero__crack--2" pathLength="1" d="M48 118l16 7-5 15 17 5" ${CRACK}/>`
const crack3 = `<polyline class="hero__crack hero__crack--3" pathLength="1" points="${ZIG}" ${CRACK}/>`

/** The whole shell, with the cracks it has by `level` (null: all of them, for CSS to reveal). */
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
]
const GOLD_FACES = {
  5: () => face({ eyes: 'happy', mouth: 'grin', blush: true, y: 120 }),
  6: () => face({ eyes: 'closed', mouth: 'smile', blush: true, y: 120 }),
}
const SWEAT = `<path d="M168 92q8 12 0 18q-8 -6 0 -18z" fill="${P.sky}" stroke="${I}" stroke-width="3"/>`

/** The hero as a still, for the scenes on phones. */
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
              ? phone(160, 196, 12)
              : ''
  const body = hatched
    ? `${golden()}${GOLD_FACES[state as 5 | 6]()}
       ${state === 6 ? `<g transform="translate(112 80) rotate(-16) scale(.46) translate(-100 -178)">${halves!.top}</g>` : ''}
       ${halves!.bottom}
       ${state === 5 ? `<g transform="translate(206 40) rotate(38) scale(.5) translate(-100 -120)">${halves!.top}</g>` : ''}`
    : `${shellWhole(state)}${SHELL_FACES[state]()}`
  const skin = hatched ? P.yolk : SHELL.white
  const hands = state === 5 ? hand(18, 120, skin, -20) + hand(182, 120, skin, 20) : hand(30, 204, skin, -20) + hand(168, 204, skin, 20)
  return `<g class="hero hero--still">${body}${hands}${prop}</g>`
}

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

/* ── the walker: every state at once, CSS picks one ──────────────── */

/**
 * The egg that walks the day on wide screens. Everything it ever holds or
 * wears is in here; `data-state` on the wrapper shows the right pieces. Until
 * Hatch the shell is one piece; at Hatch it swaps for two halves and the top
 * one flies (and comes back as a hat for the walk home).
 */
export function walkerSvg() {
  const h = shellHalves()
  return `
    <svg class="walker__svg" viewBox="-70 -150 340 480" aria-hidden="true">
      <g class="walker__body">
        <ellipse class="walker__shadow" cx="104" cy="318" rx="74" ry="9" fill="${I}" opacity=".14"/>
        <g class="walker__legs">${legs()}</g>
        <g class="walker__golden">
          ${golden()}
          <g class="wface wface--5">${GOLD_FACES[5]()}</g>
          <g class="wface wface--6">${GOLD_FACES[6]()}</g>
        </g>
        <g class="walker__whole">
          ${shellWhole(null)}
          ${SHELL_FACES.map((f, i) => `<g class="wface wface--${i}">${f()}</g>`).join('')}
        </g>
        <g class="walker__bottom">${h.bottom}</g>
        <g class="walker__top">${h.top}</g>
        <g class="walker__hands">
          <g class="whand whand--l">${hand(30, 204, SHELL.white, -20)}</g>
          <g class="whand whand--r">${hand(168, 204, SHELL.white, 20)}</g>
        </g>
        <g class="wprop wprop--0">${coffee(158, 196)}</g>
        <g class="wprop wprop--1">${mic(180, 146)}</g>
        <g class="wprop wprop--2">${spark(-14, 40, 1.1, P.yolk)}${spark(204, 18, 0.8)}</g>
        <g class="wprop wprop--3">${laptop()}${SWEAT}</g>
        <g class="wprop wprop--4">${slice(146, 206, -18)}</g>
        <g class="wprop wprop--5">
          ${hand(10, 116, P.yolk, -30)}${hand(190, 116, P.yolk, 30)}
          ${spark(-34, 30, 1.2, P.yolk)}${spark(236, 46, 1)}${spark(212, -40, 0.8, P.tomato)}
        </g>
        <g class="wprop wprop--6">${hand(36, 214, P.yolk, -20)}${hand(166, 214, P.yolk, 20)}${phone(170, 196, 14)}</g>
      </g>
    </svg>`
}

/** Two legs in red sneakers, hinged at the hips so they can walk. */
function legs() {
  const shoe = (x: number, flip: number) => `
    <path d="M${x - 2} ${300}h${24 * flip}q${10 * flip} 0 ${10 * flip} 10v4h${-40 * flip}q${-2 * flip} -14 ${6 * flip} -14z" fill="${P.tomato}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
    ${line(`M${x - 6 * flip} ${314}h${36 * flip}`, 3, P.cream)}`
  return `
    <g class="leg leg--l">${line('M80 248L76 302', 7)}${shoe(70, -1)}</g>
    <g class="leg leg--r">${line('M120 248L124 302', 7)}${shoe(130, 1)}</g>`
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
      <g class="mate__body">
        <ellipse cx="104" cy="318" rx="70" ry="9" fill="${I}" opacity=".14"/>
        <g class="walker__legs">${legs()}</g>
        ${eggBody({ fill, ground: false })}
        ${hat}
        ${faces.map((f, i) => `<g class="mface mface--${i}">${f}</g>`).join('')}
        <g class="mhands mhands--down">${hand(30, 204, fill, -20)}${hand(168, 204, fill, 20)}</g>
        <g class="mhands mhands--up">${hand(12, 112, fill, -30)}${hand(188, 112, fill, 30)}</g>
        <g class="mprop mprop--slice">${slice(146, 206, -18)}</g>
        <g class="mprop mprop--phone">${phone(166, 196, 12)}</g>
        <g class="mprop mprop--laptop">${laptop()}</g>
      </g>
    </svg>`
}

/* ── the seven scenes ───────────────────────────────────────────── */

interface Frame {
  sky: [number, string][]
  back: string
  set: string
  /** the cast as phones see it: drawn into the scene */
  cast: string
}

function frame(slug: string, f: Frame) {
  const g = nextId('sk')
  const c = nextId('ac')
  const ticks = Array.from({ length: 21 }, (_, i) => line(`M${i * 20} ${FLOOR + 1}v${i % 5 === 0 ? 10 : 5}`, i % 5 === 0 ? 1.8 : 1.2, I, i % 5 ? 'opacity=".5"' : '')).join('')
  return `
    <svg class="scene scene--${slug}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">${f.sky.map(([o, s]) => `<stop offset="${o}" stop-color="${s}"/>`).join('')}</linearGradient>
        <clipPath id="${c}"><path d="${ARCH}"/></clipPath>
      </defs>
      <path d="${ARCH}" fill="url(#${g})"/>
      <g clip-path="url(#${c})">${f.back}</g>
      <path d="${ARCH}" fill="none" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
      <g class="scene__set">${f.set}</g>
      ${line(`M0 ${FLOOR}H400`, L)}
      ${ticks}
      <g class="scene__cast">${f.cast}</g>
    </svg>`
}

const team = (state: number, xs: [number, number] = [56, 336], s = 0.36) => {
  const kinds = ['beanie', 'cap'] as const
  return kinds
    .map((k, i) => {
      const fill = k === 'beanie' ? SHELL.brown : '#ead1b5'
      const hat = k === 'beanie' ? beanie() : cap()
      const mood = [
        face({ eyes: 'happy', mouth: 'smile', blush: true }),
        face({ eyes: 'dot', mouth: 'line', look: [i ? -6 : 6, 2] }),
        face({ eyes: 'happy', mouth: 'tongue', blush: true }),
        face({ eyes: 'happy', mouth: 'grin', blush: true }),
        face({ eyes: 'closed', mouth: 'smile', blush: true }),
      ][Math.max(0, state - 2)]
      const arms = state === 5 ? hand(12, 112, fill, -30) + hand(188, 112, fill, 30) : hand(30, 204, fill, -20) + hand(168, 204, fill, 20)
      const prop = state === 4 ? slice(146, 206, -18) : state === 6 ? phone(166, 196, 12) : ''
      return placed(xs[i], FLOOR, s, `${eggBody({ fill })}${hat}${mood}${arms}${prop}`, 'mate-still')
    })
    .join('')
}

const hero = (state: number, x = 128, s = 0.42) => placed(x, FLOOR, s, heroStill(state), 'hero-still')

function doors() {
  return frame('doors', {
    sky: [
      [0, '#f8cf6a'],
      [0.55, '#fbe3a3'],
      [1, '#fdf1cf'],
    ],
    back: `
      ${sun(92, 132, 22)}
      ${cloud(214, 84, 1)}${cloud(116, 122, 0.7)}
      <path d="M34 250q60 -18 120 -6t130 -4t82 6V270H34Z" fill="${mix('#fbe3a3', WOOD, 0.35)}" opacity=".55"/>`,
    set: `
      <rect x="240" y="120" width="92" height="150" rx="4" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
      <rect x="252" y="132" width="68" height="138" fill="#3a2a38"/>
      <path class="door__light" d="M252 270L320 270L366 290L210 290Z" fill="${P.yolk}" opacity=".0"/>
      <rect x="252" y="132" width="68" height="138" fill="${P.yolk}" class="door__glow" opacity=".0"/>
      <g class="door__leaf"><path d="M252 132H320V270H252Z" fill="${P.peachDeep}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <path d="M268 148h36v44h-36z" fill="${mix(P.peachDeep, '#ffffff', 0.2)}" stroke="${I}" stroke-width="${L * 0.7}"/>
        <path d="M268 206h36v44h-36z" fill="${mix(P.peachDeep, '#ffffff', 0.2)}" stroke="${I}" stroke-width="${L * 0.7}"/>
        <circle cx="309" cy="206" r="4" fill="${P.yolk}" stroke="${I}" stroke-width="2"/></g>
      <g transform="translate(286 102)">
        <ellipse cx="0" cy="0" rx="20" ry="16" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        <path d="M0 -10c6 0 10 8 10 13c0 5 -4 8 -10 8s-10 -3 -10 -8c0 -5 4 -13 10 -13Z" fill="${P.yolk}" stroke="${I}" stroke-width="2"/>
        <circle cx="-3.4" cy="3" r="1.6" fill="${I}"/><circle cx="3.4" cy="3" r="1.6" fill="${I}"/>
      </g>
      <g fill-opacity="1" stroke="${I}" stroke-width="1.6">
        <rect x="340" y="150" width="14" height="14" fill="${P.yolk}" transform="rotate(-6 347 157)"/>
        <rect x="342" y="172" width="14" height="14" fill="${P.pink}" transform="rotate(5 349 179)"/>
        <rect x="339" y="194" width="14" height="14" fill="${P.mint}" transform="rotate(-3 346 201)"/>
      </g>
      <rect x="244" y="266" width="84" height="6" rx="2" fill="${P.tomato}" stroke="${I}" stroke-width="1.6"/>
      <g>
        <path d="M172 226h52v6h-52z" fill="${WOOD}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        ${line('M178 232v38M218 232v38', L)}
        <path d="M184 190h22v34h-22z" fill="#cfc8d6" stroke="${I}" stroke-width="${L}"/>
        <path d="M206 204h6v8h-6" fill="none" stroke="${I}" stroke-width="${L * 0.8}"/>
        <rect x="181" y="186" width="28" height="6" rx="2" fill="${I}"/>
        <g class="steam">${line('M192 180q-5 -7 0 -14q5 -7 0 -14', 2)}${line('M200 182q-5 -7 0 -14', 2)}</g>
      </g>`,
    cast: hero(0, 118),
  })
}

function crack() {
  return frame('crack', {
    sky: [
      [0, '#b9d6ea'],
      [1, '#eaf3f2'],
    ],
    back: `
      ${sun(318, 70, 20)}
      ${cloud(78, 104, 0.8)}${cloud(236, 132, 0.6)}`,
    set: `
      <g class="watch" transform="translate(240 116)">
        <rect x="-7" y="-58" width="14" height="10" rx="3" fill="#cfc8d6" stroke="${I}" stroke-width="${L * 0.8}"/>
        <circle r="44" fill="${P.cream}" stroke="${I}" stroke-width="${L * 1.2}"/>
        ${Array.from({ length: 12 }, (_, i) => line(`M0 -40v${i % 3 ? 4 : 8}`, 2, I, `transform="rotate(${i * 30})"`)).join('')}
        <g class="watch__hand">${line('M0 0V-34', 3)}</g>
        <circle r="4" fill="${I}"/>
      </g>
      <g class="bulb" transform="translate(166 84)">
        <circle class="bulb__glow" r="26" fill="${P.yolk}" opacity="0"/>
        <path d="M0 -18c10 0 16 8 16 16c0 7 -5 10 -7 15h-18c-2 -5 -7 -8 -7 -15c0 -8 6 -16 16 -16Z" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        <path d="M-7 17h14M-5 22h10" stroke="${I}" stroke-width="${L * 0.8}" stroke-linecap="round"/>
        ${line('M-4 2l4 6l4 -6', 1.8)}
      </g>
      <g>
        <path d="M290 238h86v8h-86z" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
        ${line('M298 246v24M368 246v24', L)}
        ${placed(310, 240, 0.2, `${eggBody({ fill: SHELL.brown })}${face({ eyes: 'dot', mouth: 'o', look: [-8, 0] })}`)}
        ${placed(352, 240, 0.2, `${eggBody({ fill: SHELL.white })}${face({ eyes: 'happy', mouth: 'smile', look: [-8, 0], blush: true })}`)}
      </g>
      <path d="M170 236h84l6 34h-96z" fill="${WOOD}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
      ${line('M176 252h80M178 264h80', 1.4, WOOD_DEEP)}`,
    cast: hero(1, 214, 0.4),
  })
}

function nest() {
  const twigs = Array.from({ length: 9 }, (_, i) => {
    const y = 236 + (i % 3) * 10
    const x = 150 + i * 20
    return line(`M${x - 22} ${y}q20 ${-8 + (i % 2) * 14} 44 ${-2}`, 1.8, TWIG_DEEP)
  }).join('')
  return frame('nest', {
    sky: [
      [0, '#a9cde3'],
      [1, '#e6f1ef'],
    ],
    back: `
      ${sun(332, 52, 18)}
      ${cloud(60, 92, 0.9)}
      ${line('M120 70q8 -8 16 0q8 -8 16 0', 2.4)}${line('M168 52q6 -6 12 0q6 -6 12 0', 2)}`,
    set: `
      <g class="nesters">
        ${placed(206, 246, 0.36, `${eggBody({ fill: SHELL.brown })}${beanie()}${face({ eyes: 'happy', mouth: 'smile', blush: true })}`, 'nester nester--a')}
        ${placed(282, 246, 0.36, `${eggBody({ fill: '#ead1b5' })}${cap()}${face({ eyes: 'dot', mouth: 'smile', look: [-6, 0] })}`, 'nester nester--b')}
      </g>
      <g class="nest">
        <path d="M128 228q116 -10 232 0q-6 40 -116 42q-110 -2 -116 -42z" fill="${TWIG}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <path d="M134 230q110 12 220 0" fill="none" stroke="${I}" stroke-width="${L * 0.8}"/>
        ${twigs}
        ${line('M126 226l-14 -10M362 226l16 -12M150 262l-12 8', 2.2, TWIG_DEEP)}
      </g>
      <g class="hearts">
        <path d="M244 172c-6 -8 -18 -2 -12 8l12 12l12 -12c6 -10 -6 -16 -12 -8z" fill="${P.tomato}" stroke="${I}" stroke-width="2"/>
        <path d="M300 150c-4 -6 -13 -1 -9 6l9 9l9 -9c4 -7 -5 -12 -9 -6z" fill="${P.pink}" stroke="${I}" stroke-width="2"/>
      </g>
      <g transform="translate(346 150)">
        ${line('M0 0v84', L)}
        <path d="M0 2l34 10l-34 12z" fill="${P.yolk}" stroke="${I}" stroke-width="${L * 0.8}" stroke-linejoin="round"/>
      </g>`,
    cast: `
      <g class="cast-nest">
        ${placed(196, 246, 0.36, `${eggBody({ fill: SHELL.brown })}${beanie()}${face({ eyes: 'happy', mouth: 'smile', blush: true })}`)}
        ${placed(292, 246, 0.36, `${eggBody({ fill: '#ead1b5' })}${cap()}${face({ eyes: 'happy', mouth: 'grin', blush: true })}`)}
        ${placed(244, 250, 0.4, heroStill(2))}
        <path d="M128 228q116 -10 232 0q-6 40 -116 42q-110 -2 -116 -42z" fill="${TWIG}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <path d="M134 230q110 12 220 0" fill="none" stroke="${I}" stroke-width="${L * 0.8}"/>
        ${twigs}
      </g>`,
  })
}

function incubate() {
  return frame('incubate', {
    sky: [
      [0, '#9cc7e2'],
      [1, '#e2eff2'],
    ],
    back: `
      ${sun(200, 34, 22)}
      ${cloud(140, 82, 0.6)}`,
    set: `
      <g class="clock" transform="translate(84 96)">
        <circle r="26" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        ${Array.from({ length: 4 }, (_, i) => line('M0 -21v4', 2, I, `transform="rotate(${i * 90})"`)).join('')}
        <g class="clock__h">${line('M0 0V-12', 3)}</g>
        <g class="clock__m">${line('M0 0V-18', 2.2)}</g>
        <circle r="3" fill="${I}"/>
      </g>
      <g class="lamp">
        <path class="lamp__beam" d="M282 118L176 222H330Z" fill="${P.yolk}" opacity=".18"/>
        ${line('M362 270V96L318 70', L * 1.2)}
        <path d="M318 70l-24 16l-14 26l40 -8l16 -24z" fill="${P.tomato}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <circle class="lamp__bulb" cx="290" cy="112" r="7" fill="${P.yolk}" stroke="${I}" stroke-width="2"/>
      </g>
      <path d="M156 222h204v8h-204z" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
      ${line('M168 230v40M348 230v40', L)}
      <g class="lap lap--a">
        <path d="M178 222l8 -40h58l-6 40z" fill="${SCREEN}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <path class="lap__screen" d="M190 214l6 -26h42l-4 26z" fill="${P.sky}"/>
        ${line('M198 198h14M200 206h22', 2, P.lavDeep)}
      </g>
      <g class="lap lap--b">
        <path d="M262 222l8 -40h58l-6 40z" fill="${SCREEN}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <path class="lap__screen" d="M274 214l6 -26h42l-4 26z" fill="${P.mint}"/>
        <path d="M290 196l-6 6 6 6M306 196l6 6 -6 6" fill="none" stroke="${P.mintDeep}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <path d="M246 206h12v16h-12z" fill="${P.cream}" stroke="${I}" stroke-width="2"/>
      <g class="code">
        <path d="M196 164l-8 7 8 7M216 160l-7 22M226 164l8 7 -8 7" fill="none" stroke="${P.lavDeep}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M284 150q-6 0 -6 6v3q0 4 -4 4q4 0 4 4v3q0 6 6 6M304 150q6 0 6 6v3q0 4 4 4q-4 0 -4 4v3q0 6 -6 6" fill="none" stroke="${P.mintDeep}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`,
    cast: hero(3, 104, 0.4),
  })
}

function pizza() {
  const pep = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.6" fill="${P.tomato}" stroke="${I}" stroke-width="1.2"/>`
  return frame('pizza', {
    sky: [
      [0, '#e98b5e'],
      [0.45, '#f4b56a'],
      [1, '#f9dcb6'],
    ],
    back: `
      <g class="sc-sunset">${sun(214, 266, 50, true)}</g>
      ${cloud(66, 116, 0.8)}
      <path d="M34 250q80 -12 166 -4t166 0V270H34Z" fill="${mix(P.peachDeep, '#f4b56a', 0.3)}" opacity=".6"/>`,
    set: `
      <g class="bulb bulb--big" transform="translate(296 82)">
        <circle class="bulb__glow" r="36" fill="${P.cream}" opacity="0"/>
        <path d="M0 -24c14 0 22 10 22 22c0 9 -7 13 -9 20h-26c-2 -7 -9 -11 -9 -20c0 -12 8 -22 22 -22Z" fill="${P.yolk}" stroke="${I}" stroke-width="${L}"/>
        <path d="M-9 22h18M-7 28h14" stroke="${I}" stroke-width="${L * 0.8}" stroke-linecap="round"/>
        ${line('M-6 4l6 8l6 -8', 2)}
        ${line('M-34 -18l-8 -6M34 -18l8 -6M0 -34v-9', 2)}
      </g>
      <g>
        ${[0, 1, 2].map((i) => `<g transform="translate(${318 + (i % 2) * 3} ${252 - i * 16})"><path d="M0 0h46v16h-46z" fill="${P.cream}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>${line('M7 8h14', 2.2, P.tomato)}</g>`).join('')}
      </g>
      <g class="pie">
        <path d="M200 252l10 -74h92l6 74z" fill="${P.cream}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <path d="M216 186h74" stroke="${mix(P.cream, I, 0.18)}" stroke-width="1.6"/>
        <g transform="translate(254 214)">
          <ellipse rx="16" ry="12" fill="none" stroke="${P.tomato}" stroke-width="2.4"/>
          <path d="M0 -8c4 0 6 4 6 7c0 3 -2.6 5 -6 5s-6 -2 -6 -5c0 -3 2 -7 6 -7Z" fill="${P.yolk}" stroke="${I}" stroke-width="1.4"/>
        </g>
        <path d="M188 252h132l8 18h-148z" fill="${mix(P.cream, WOOD, 0.25)}" stroke="${I}" stroke-width="${L}" stroke-linejoin="round"/>
        <ellipse cx="254" cy="252" rx="58" ry="11" fill="#e7a45f" stroke="${I}" stroke-width="${L}"/>
        <ellipse cx="254" cy="251.5" rx="49" ry="7.5" fill="${P.tomato}" opacity=".85"/>
        <ellipse cx="254" cy="251" rx="45" ry="6" fill="${P.yolk}"/>
        ${pep(226, 251)}${pep(250, 249)}${pep(276, 252)}${pep(262, 254)}
        <g class="pie__slice">
          <path class="pie__cheese" d="M276 250q4 -14 -2 -26M288 251q8 -12 4 -26" fill="none" stroke="${P.yolk}" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M268 226l38 -10l-6 24z" fill="${P.yolk}" stroke="${I}" stroke-width="${L * 0.8}" stroke-linejoin="round"/>
          <path d="M306 216l-6 24" stroke="#e7a45f" stroke-width="5" stroke-linecap="round"/>
          ${pep(288, 226)}
        </g>
        <g class="steam">${line('M222 238q-5 -7 0 -14q5 -7 0 -14', 2)}${line('M244 236q-5 -7 0 -14', 2)}</g>
      </g>`,
    cast: `${team(4, [54, 100], 0.3)}${hero(4, 148, 0.36)}`,
  })
}

function hatch() {
  const flags = Array.from({ length: 9 }, (_, i) => {
    const x = 70 + i * 32
    const y = 66 + Math.sin(i / 1.4) * 4 + (i - 4) * (i - 4) * 0.7
    const c = [P.yolk, P.tomato, P.mint, P.pink, P.cream][i % 5]
    return `<path d="M${x} ${y}l16 0l-8 16z" fill="${c}" stroke="${I}" stroke-width="1.6" stroke-linejoin="round"/>`
  }).join('')
  const confetti = Array.from({ length: 14 }, (_, i) => {
    const x = 90 + ((i * 53) % 240)
    const y = 96 + ((i * 37) % 90)
    const c = [P.yolk, P.tomato, P.mint, P.pink, P.cream, P.sky][i % 6]
    // the tilt lives on a wrapper so the falling animation can own the rect's transform
    return `<g transform="rotate(${(i * 47) % 180} ${x} ${y})"><rect class="confetti" style="--i:${i}" x="${x}" y="${y}" width="7" height="4" rx="1" fill="${c}"/></g>`
  }).join('')
  return frame('hatch', {
    sky: [
      [0, '#3b2d6e'],
      [0.6, '#7a5fb0'],
      [1, '#d7a7c2'],
    ],
    back: `${stars([
      [80, 60, 0.6],
      [130, 38, 0.4],
      [262, 44, 0.5],
      [330, 82, 0.7],
      [196, 26, 0.35],
    ])}`,
    set: `
      ${line('M58 62q142 24 284 0', 1.6)}
      ${flags}
      <path class="spot" d="M318 40L150 250H262Z" fill="${P.cream}" opacity="0"/>
      <g transform="translate(326 30) rotate(36)">
        ${line('M0 -22v10', 2.4)}
        <path d="M-11 -12h22l4 26h-30z" fill="#3a3340" stroke="${I}" stroke-width="${L * 0.8}" stroke-linejoin="round"/>
        <ellipse cy="14" rx="15" ry="4" fill="${P.cream}" stroke="${I}" stroke-width="${L * 0.8}"/>
      </g>
      <g transform="translate(284 120)">
        <rect x="-38" y="-30" width="76" height="52" rx="4" fill="${P.cream}" stroke="${I}" stroke-width="${L}"/>
        <path d="M-16 -2l12 12l22 -26" fill="none" stroke="${P.mintDeep}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        ${line('M0 22v28M-16 50h32', L)}
      </g>
      <path d="M96 248h272v22h-272z" fill="${mix(P.lavDeep, I, 0.35)}" stroke="${I}" stroke-width="${L}"/>
      ${line('M104 256h256', 1.4, mix(P.lavDeep, '#ffffff', 0.25))}
      <g class="confettis">${confetti}</g>`,
    cast: `${team(5, [326, 70], 0.3)}${placed(200, 248, 0.42, heroStill(5))}`,
  })
}

function afterglow() {
  const lit = Array.from({ length: 18 }, (_, i) => {
    const x = 44 + ((i * 41) % 316)
    const y = 218 + ((i * 13) % 24)
    return `<rect class="win" style="--i:${i}" x="${x}" y="${y}" width="4" height="5" fill="${P.yolk}"/>`
  }).join('')
  return frame('afterglow', {
    sky: [
      [0, P.night],
      [0.7, '#3a2747'],
      [1, '#5a3a5a'],
    ],
    back: `
      ${stars([
        [70, 74, 0.5],
        [120, 44, 0.35],
        [196, 70, 0.4],
        [236, 34, 0.55],
        [160, 120, 0.3],
        [352, 124, 0.4],
      ])}
      <g class="moon"><circle cx="300" cy="64" r="22" fill="${P.yolk}" stroke="${I}" stroke-width="${L * 0.8}"/><circle cx="312" cy="56" r="20" fill="${P.night}"/></g>
      <path d="M34 230q40 -22 80 -10t70 -8t66 4t60 -14t56 8V270H34Z" fill="#2d1d33"/>
      <g transform="translate(288 140)">
        ${line('M0 0V80', 3.4, '#1a1220')}
        <path d="M-6 80h12l3 22h-18z" fill="#1a1220"/>
        <ellipse cx="0" cy="-2" rx="12" ry="7" fill="#1a1220"/>
        <rect class="win" style="--i:3" x="-8" y="-4" width="16" height="2.4" fill="${P.yolk}"/>
        ${line('M0 -9v-12', 1.6, '#1a1220')}
        <circle class="atakule__light" cx="0" cy="-22" r="2" fill="${P.tomato}"/>
      </g>
      ${lit}`,
    set: `
      <g transform="translate(342 170)">
        ${line('M0 0V100', L * 1.2)}
        <circle r="18" fill="${P.tomato}" stroke="${I}" stroke-width="${L}"/>
        <path d="M-9 8V-8l9 10l9 -10V8" fill="none" stroke="${P.cream}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>
      </g>
      <g>
        <path d="M196 238h104v7h-104z" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
        <path d="M196 216h104v7h-104z" fill="${WOOD}" stroke="${I}" stroke-width="${L}"/>
        ${line('M206 245v25M290 245v25M206 223v15M290 223v15', L)}
        <path d="M244 222h46v14h-46z" fill="${P.cream}" stroke="${I}" stroke-width="${L * 0.9}"/>
        ${line('M252 229h14', 2, P.tomato)}
      </g>
      <g class="chat">
        <g class="chat__b" style="--i:0"><rect x="58" y="152" width="46" height="22" rx="11" fill="${P.cream}" stroke="${I}" stroke-width="2"/>${line('M70 163h2M80 163h2M90 163h2', 3)}</g>
        <g class="chat__b" style="--i:1"><rect x="112" y="128" width="40" height="22" rx="11" fill="${P.yolk}" stroke="${I}" stroke-width="2"/><path d="M132 136c-3 -4 -10 -1 -7 4l7 6l7 -6c3 -5 -4 -8 -7 -4z" fill="${P.tomato}" stroke="${I}" stroke-width="1.4"/></g>
        <g class="chat__b" style="--i:2"><rect x="72" y="104" width="52" height="22" rx="11" fill="${P.mint}" stroke="${I}" stroke-width="2"/>${line('M84 115h28', 2.4, P.mintDeep)}</g>
      </g>`,
    cast: `${team(6, [62, 112], 0.3)}${hero(6, 160, 0.36)}`,
  })
}

const SCENES = [doors, crack, nest, incubate, pizza, hatch, afterglow]

/** One scene's markup, by step. */
export const sceneMarkup = (i: number) => SCENES[i]?.() ?? ''

/** Paint every step's scene into its `.step__scene` slot. */
export function renderScenes(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.step__scene').forEach((slot, i) => {
    const draw = SCENES[i]
    if (draw && !slot.childElementCount) slot.innerHTML = draw()
  })
}
