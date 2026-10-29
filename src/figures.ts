import { PALETTE } from './util'
import { handEgg, inkEgg, type EggShape } from './riso'

/**
 * The regulars, drawn in the house riso style (riso.ts): a hand-drawn egg,
 * colour printed a little off the line, halftone on one side, a thin wobbly
 * outline that doesn't quite close. No faces to speak of and no props to
 * hold; each one is a single idea, carried by a dry annotation.
 */

export type Kind = 'owl' | 'designer' | 'hardware' | 'founder' | 'researcher' | 'musician' | 'firstTimer' | 'pizza'
type Lang = 'en' | 'tr'

const P = PALETTE
const I = P.ink
const T = P.tomato

/** Every figure is drawn around a 200×260 egg at (100, 140); notes spill into the margins. */
export const FIG_VIEWBOX = '-40 -50 290 370'

const MONO = `font-family="DM Mono, ui-monospace, monospace"`
const SERIF = `font-family="Fraunces, Georgia, serif"`
const HAND = `font-family="Reenie Beanie, cursive"`

/** A pen line: thin, round-capped, slightly wobbly. */
const pen = (d: string, w = 3, c: string = I, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" filter="url(#wobble)" ${extra}/>`

/** A ruled line: construction, dimensions, staves. Straight, so no wobble (it would clip a flat line). */
const rule = (d: string, w = 1.4, c: string = T, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`

const CAST: Record<Kind, { seed: number; fill: string; shape: EggShape }> = {
  owl: { seed: 11, fill: P.lav, shape: { w: 0.92, h: 1.04, lean: -4 } },
  designer: { seed: 18, fill: P.butter, shape: { w: 1.02, h: 0.94, lean: 6, taper: 0.1 } },
  hardware: { seed: 25, fill: P.mint, shape: { w: 0.86, h: 1.06, lean: -2, taper: 0.08 } },
  founder: { seed: 32, fill: P.peach, shape: { w: 0.98, h: 1, lean: 3 } },
  researcher: { seed: 39, fill: P.sky, shape: { w: 0.9, h: 1.02, lean: -7, taper: 0.18 } },
  musician: { seed: 46, fill: P.yolk, shape: { w: 0.8, h: 0.84, lean: 16, cx: 112, cy: 158 } },
  firstTimer: { seed: 53, fill: P.cream, shape: { w: 0.84, h: 0.92, lean: -3, cy: 150 } },
  pizza: { seed: 60, fill: P.peach, shape: { w: 1, h: 1, lean: 2 } },
}

const eggOf = (k: Kind) => handEgg(CAST[k].seed, CAST[k].shape)

let uid = 0

function owl() {
  // an anglepoise leaning in from off the plate, the clock, and the eyes of 2am
  const shade = 'translate(56 -36) rotate(-35)'
  return `
    <polygon points="57,0 90,-23 196,104 18,128" fill="${P.yolk}" opacity=".34"/>
    ${inkEgg(eggOf('owl'), CAST.owl.fill)}
    ${pen('M-44 34L-4 -28L54 -36', 3.2)}
    ${pen('M-34 36L0 -18L50 -26', 1.6)}
    <circle cx="-4" cy="-28" r="4.5" fill="${P.cream}" stroke="${I}" stroke-width="2.4"/>
    <path d="M-7 0h14l13 30h-40z" transform="${shade}" fill="${I}"/>
    <g class="egg__eyes">
      ${pen('M68 130q11 -3 23 0M110 130q11 -3 23 0', 3.2)}
      <circle cx="80" cy="134.5" r="3" fill="${I}"/><circle cx="122" cy="134.5" r="3" fill="${I}"/>
    </g>
    ${pen('M71 145q9 4 18 1M113 145q9 4 18 1', 1.8, I, 'opacity=".45"')}
    <text x="216" y="-14" text-anchor="end" ${MONO} font-size="22" letter-spacing="1" fill="${I}" opacity=".75">02:47</text>`
}

function designer() {
  // construction lines, a ratio, and one opinionated swatch
  return `
    ${inkEgg(eggOf('designer'), CAST.designer.fill)}
    <g opacity=".9">
      <circle cx="100" cy="104" r="56" fill="none" stroke="${T}" stroke-width="1.4"/>
      <circle cx="100" cy="104" r="34.6" fill="none" stroke="${T}" stroke-width="1.4"/>
      ${rule('M100 12V282M-14 104H214')}
      ${rule('M18 294H182M18 286v16M182 286v16')}
    </g>
    <text x="100" y="322" text-anchor="middle" ${MONO} font-size="21" fill="${T}">1 : 1.618</text>
    <g transform="rotate(12 200 212)">
      <rect x="178" y="176" width="44" height="66" fill="${P.cream}" stroke="${I}" stroke-width="2"/>
      <rect x="182" y="180" width="36" height="28" fill="${P.yolk}"/>
      <rect x="182" y="212" width="36" height="16" fill="#f8db8e"/>
      ${rule('M184 235h20', 2, I)}
    </g>`
}

function hardware() {
  // it's an egg. it's also a battery. it is looking for a socket.
  return `
    <rect x="84" y="-2" width="32" height="18" rx="3" fill="${I}"/>
    ${inkEgg(eggOf('hardware'), CAST.hardware.fill)}
    <text x="100" y="86" text-anchor="middle" ${SERIF} font-size="44" fill="${I}">+</text>
    <text x="100" y="238" text-anchor="middle" ${SERIF} font-size="44" fill="${I}">–</text>
    ${pen('M176 150C216 148 220 204 196 212S162 246 196 260', 3.2)}
    <g transform="translate(196 260) rotate(22)">
      <rect x="0" y="-8" width="20" height="16" rx="3" fill="${I}"/>
      ${rule('M20 -4h9M20 4h9', 3, I)}
    </g>
    ${pen('M232 252l9 -6M236 268l12 2M228 282l8 8', 2.2, T)}`
}

function founder(lang: Lang) {
  // the lanyard says CEO. someone has proofread it.
  return `
    ${inkEgg(eggOf('founder'), CAST.founder.fill)}
    <g class="egg__eyes"><circle cx="90" cy="98" r="3.2" fill="${I}"/><circle cx="114" cy="98" r="3.2" fill="${I}"/></g>
    ${pen('M62 110L98 146M138 110L102 146', 2.4)}
    <g transform="rotate(-4 100 170)">
      <rect x="95" y="141" width="10" height="9" rx="1.5" fill="${P.cream}" stroke="${I}" stroke-width="1.8"/>
      <rect x="64" y="149" width="72" height="44" rx="3" fill="${P.cream}" stroke="${I}" stroke-width="2.2"/>
      <text x="100" y="178" text-anchor="middle" ${MONO} font-size="19" letter-spacing="2.5" fill="${I}">CEO</text>
      ${rule('M70 173L130 167', 2.8, T)}
    </g>
    ${pen('M92 212L100 201L108 212', 2.4, T)}
    <text x="100" y="238" text-anchor="middle" ${HAND} font-size="46" fill="${T}" transform="rotate(-3 100 228)">${lang === 'tr' ? 'insan' : 'human'}</text>`
}

function researcher(lang: Lang) {
  // a hairline crack, properly cited
  return `
    ${inkEgg(eggOf('researcher'), CAST.researcher.fill)}
    ${pen('M124 32l-10 24l14 12l-12 22l10 14', 2.4)}
    <text x="160" y="58" ${SERIF} font-style="italic" font-size="46" fill="${I}">¹</text>
    ${rule('M-24 286H44', 1.2, I)}
    <text x="-24" y="312" ${SERIF} font-style="italic" font-size="22" fill="${I}" opacity=".85">${lang === 'tr' ? '¹ hakemli. çoğunlukla.' : '¹ peer reviewed. mostly.'}</text>`
}

function musician() {
  // the egg as a note on the bass staff, at a sensible tempo
  const staff = [94, 126, 158, 190, 222].map((y, k) => `M-36 ${y}Q100 ${y + (k % 2 ? 2 : -2)} 236 ${y + (k % 2 ? -1 : 1)}`).join('')
  return `
    ${rule(staff, 2, I, 'opacity=".6"')}
    ${pen('M-22 126C-24 100 6 92 10 116C14 142 -4 168 -32 184', 4.2)}
    <circle cx="-22" cy="126" r="5.5" fill="${I}"/>
    <circle cx="20" cy="112" r="3.6" fill="${I}"/><circle cx="20" cy="140" r="3.6" fill="${I}"/>
    ${inkEgg(eggOf('musician'), CAST.musician.fill)}
    ${rule('M184 150V-12', 4.5, I)}
    ${pen('M184 -12C188 20 222 30 214 72', 4.5)}
    <g opacity=".8">
      <ellipse cx="-27" cy="45" rx="7" ry="5" transform="rotate(-20 -27 45)" fill="${I}"/>
      ${rule('M-20.5 43V15', 2.4, I)}
      <text x="-10" y="52" ${MONO} font-size="22" fill="${I}">= 96</text>
    </g>`
}

function firstTimer(lang: Lang) {
  // the sticker is still on
  const [hello, isNew] = lang === 'tr' ? ['MERHABA', 'yeniyim'] : ['HELLO', 'I’m new']
  return `
    ${inkEgg(eggOf('firstTimer'), CAST.firstTimer.fill)}
    <g class="egg__eyes"><circle cx="88" cy="112" r="3.2" fill="${I}"/><circle cx="112" cy="112" r="3.2" fill="${I}"/></g>
    <g transform="rotate(-5 100 182)">
      <rect x="52" y="150" width="96" height="64" rx="5" fill="#fffdf8"/>
      <path d="M52 170V155a5 5 0 0 1 5 -5h86a5 5 0 0 1 5 5V170Z" fill="${T}"/>
      <rect x="52" y="150" width="96" height="64" rx="5" fill="none" stroke="${I}" stroke-width="2"/>
      <text x="100" y="165.5" text-anchor="middle" ${MONO} font-size="${lang === 'tr' ? 12.5 : 14}" font-weight="500" letter-spacing="${lang === 'tr' ? 1 : 2.5}" fill="${P.cream}">${hello}</text>
      <text x="100" y="203" text-anchor="middle" ${HAND} font-size="36" fill="${I}">${isNew}</text>
    </g>
    ${pen('M206 72C214 110 188 136 158 146', 2.4, T)}
    ${pen('M163 135L156 147L169 151', 2.4, T)}
    <text x="184" y="58" ${MONO} font-size="22" fill="${I}" opacity=".75">v0.1</text>`
}

function pizza() {
  // one eighth of an egg, served
  const d = eggOf('pizza')
  const id = `pz${++uid}`
  const wedge = '100,150 240,90 240,210'
  const pep = (x: number, y: number, r: number) =>
    `<circle cx="${x + 3}" cy="${y + 2.5}" r="${r}" fill="${T}" opacity=".9"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${I}" stroke-width="1.8"/>`
  const yolk = `<circle cx="104" cy="153" r="30" fill="${P.yolk}"/><circle cx="100" cy="150" r="30" fill="none" stroke="${I}" stroke-width="2.4"/>`
  return `
    <defs>
      <mask id="${id}m"><rect x="-60" y="-60" width="340" height="420" fill="#fff"/><polygon points="${wedge}" fill="#000"/></mask>
      <clipPath id="${id}w"><polygon points="${wedge}"/></clipPath>
      <clipPath id="${id}e"><path d="${d}"/></clipPath>
    </defs>
    <g mask="url(#${id}m)">
      ${inkEgg(d, CAST.pizza.fill)}
      <g clip-path="url(#${id}e)">${rule('M100 150L42 10M100 150L158 10M100 150L42 290M100 150L158 290M100 150L-40 92M100 150L-40 208', 1.6, I, 'stroke-dasharray="5 7" opacity=".45"')}</g>
      ${pep(62, 92, 11)}${pep(124, 62, 10)}${pep(52, 196, 12)}${pep(132, 224, 11)}
      ${yolk}
    </g>
    ${pen('M100 150L188 113M100 150L188 187', 2.4)}
    <g transform="translate(40 8) rotate(5 150 150)">
      <g clip-path="url(#${id}w)">
        ${inkEgg(d, CAST.pizza.fill, { gap: 0, shade: false })}
        ${pep(160, 152, 10)}
        ${yolk}
      </g>
      ${pen('M100 150L190 113M100 150L190 187', 2.4)}
    </g>
    ${rule('M214 72L204 104', 1.4, T)}
    <text x="216" y="64" text-anchor="middle" ${MONO} font-size="22" fill="${T}">1/8</text>`
}

const DRAW: Record<Kind, (lang: Lang) => string> = {
  owl,
  designer,
  hardware,
  founder,
  researcher,
  musician,
  firstTimer,
  pizza,
}

/** One figure's SVG markup (without the outer <svg>). */
export const figure = (kind: Kind, lang: Lang) => DRAW[kind](lang)

/** The empty seat: a dotted egg, waiting for you. */
export const emptyEgg = (lang: Lang) => `
  <path class="egg__dash" d="${handEgg(99, { w: 0.95, lean: -5 })}" fill="${P.cream}" fill-opacity="0" stroke="${I}" stroke-width="2.6" stroke-dasharray="2 8" stroke-linecap="round"/>
  <text x="100" y="160" text-anchor="middle" ${SERIF} font-style="italic" font-size="52" fill="${I}">${lang === 'tr' ? 'sen?' : 'you?'}</text>`

