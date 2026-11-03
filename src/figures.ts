import { PALETTE } from './util'
import { handEgg, inkEgg, type EggShape } from './riso'

/**
 * The regulars, drawn in the house riso style (riso.ts): a hand-drawn egg,
 * colour printed a little off the line, halftone on one side, a thin wobbly
 * outline that doesn't quite close. Each one is a single idea carried by a
 * dry annotation, with just enough of a face to read the mood: two dots, a
 * line, never a cartoon. Every egg stands on a halftone shadow, and the
 * small moving parts (steam, sparks, notes) are tagged `fx-*` so the plate
 * can wake them on hover (main.css); the pieces of one that move each on
 * their own (a wisp, a bar, a note) are `fx__bit`s, so a section going to
 * sleep can name them.
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
const HAND = `font-family="'Reenie Beanie', 'Reenie Beanie TR', cursive"`

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

/** A halftone shadow for an egg to stand on, printed off-register like the fills. */
const ground = (cx = 106, cy = 271, rx = 66) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx * 0.14).toFixed(1)}" fill="url(#halftone)" opacity=".55"/>
   ${rule(`M${cx - rx * 0.78} ${cy + 1}Q${cx} ${cy + 4} ${cx + rx * 0.62} ${cy}`, 1.6, I, 'opacity=".55"')}`

/** Two ink dots that blink (the .egg__eyes animation in main.css). */
const dots = (x1: number, x2: number, y: number, r = 3.2) =>
  `<g class="egg__eyes"><circle cx="${x1}" cy="${y}" r="${r}" fill="${I}"/><circle cx="${x2}" cy="${y}" r="${r}" fill="${I}"/></g>`

/** Rising steam: three wisps, drawn upward. */
const steam = (x: number, y: number, h = 34) =>
  `<g class="fx-steam">${[0, 11, 22]
    .map((dx, k) => pen(`M${x + dx} ${y}c-7 -${h * 0.25} 7 -${h * 0.5} 0 -${h * 0.75}s6 -${h * 0.2} 2 -${h * 0.3}`, 2, I, `class="fx__bit" opacity=".55" style="--k:${k}"`))
    .join('')}</g>`

function owl() {
  // an anglepoise leaning in from off the plate, the clock, and the eyes of 2am
  const shade = 'translate(56 -36) rotate(-35)'
  return `
    <polygon class="fx-lamp" points="57,0 90,-23 196,104 18,128" fill="${P.yolk}" opacity=".34"/>
    ${ground()}
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
    ${pen('M92 176q8 -2 16 0', 2.2)}
    <g transform="rotate(-4 205 248)">
      <path d="M186 222h44v42a8 8 0 0 1 -8 8h-28a8 8 0 0 1 -8 -8z" fill="${T}" transform="translate(4 3)" opacity=".9"/>
      <path d="M186 222h44v42a8 8 0 0 1 -8 8h-28a8 8 0 0 1 -8 -8z" fill="${P.cream}" fill-opacity=".35" stroke="${I}" stroke-width="2.4" stroke-linejoin="round"/>
      ${pen('M230 232c14 0 14 24 0 24', 2.4)}
      <text x="208" y="254" text-anchor="middle" ${MONO} font-size="13" fill="${P.cream}">no.4</text>
      ${steam(197, 214, 38)}
    </g>
    <text x="216" y="-14" text-anchor="end" ${MONO} font-size="22" letter-spacing="1" fill="${I}" opacity=".75">02:47</text>`
}

function designer() {
  // construction lines, a ratio, and one opinionated swatch
  return `
    ${ground(104, 268, 70)}
    ${inkEgg(eggOf('designer'), CAST.designer.fill)}
    ${dots(64, 84, 172)}
    ${pen('M56 160q7 -4 14 -1M78 158q7 -3 13 1', 2)}
    ${pen('M66 194q7 3 13 -3', 2)}
    <g opacity=".9">
      <circle cx="100" cy="104" r="56" fill="none" stroke="${T}" stroke-width="1.4"/>
      <circle cx="100" cy="104" r="34.6" fill="none" stroke="${T}" stroke-width="1.4"/>
      ${rule('M100 12V282M-14 104H214')}
      ${rule('M18 294H182M18 286v16M182 286v16')}
    </g>
    <text x="100" y="322" text-anchor="middle" ${MONO} font-size="21" fill="${T}">1 : 1.618</text>
    <g class="fx-swatch" transform="rotate(12 200 212)">
      <rect x="178" y="176" width="44" height="66" fill="${P.cream}" stroke="${I}" stroke-width="2"/>
      <rect x="182" y="180" width="36" height="28" fill="${P.yolk}"/>
      <rect x="182" y="212" width="36" height="16" fill="#f8db8e"/>
      ${rule('M184 235h20', 2, I)}
    </g>`
}

function hardware() {
  // it's an egg. it's also a battery. it is looking for a socket.
  return `
    ${ground(104, 270, 58)}
    <rect x="84" y="-2" width="32" height="18" rx="3" fill="${I}"/>
    ${inkEgg(eggOf('hardware'), CAST.hardware.fill)}
    ${dots(88, 112, 118)}
    ${pen('M94 132q6 3 12 0', 2)}
    <g transform="rotate(-2 100 180)">
      <rect x="74" y="150" width="52" height="64" rx="5" fill="${P.cream}" fill-opacity=".55" stroke="${I}" stroke-width="2"/>
      <g class="fx-bars">
        <rect class="fx__bit" x="80" y="156" width="40" height="11" rx="2" fill="${T}" opacity=".18" style="--k:3"/>
        <rect class="fx__bit" x="80" y="170" width="40" height="11" rx="2" fill="${P.mintDeep}" style="--k:2"/>
        <rect class="fx__bit" x="80" y="184" width="40" height="11" rx="2" fill="${P.mintDeep}" style="--k:1"/>
        <rect class="fx__bit" x="80" y="198" width="40" height="11" rx="2" fill="${P.mintDeep}" style="--k:0"/>
      </g>
    </g>
     <text x="100" y="80" text-anchor="middle" ${SERIF} font-size="40" fill="${I}">+</text>
    <text x="100" y="250" text-anchor="middle" ${SERIF} font-size="44" fill="${I}">–</text>
    ${pen('M176 150C216 148 220 204 196 212S162 246 196 260', 3.2)}
    <g transform="translate(196 260) rotate(22)">
      <rect x="0" y="-8" width="20" height="16" rx="3" fill="${I}"/>
      ${rule('M20 -4h9M20 4h9', 3, I)}
    </g>
    <g class="fx-spark">${pen('M232 252l9 -6M236 268l12 2M228 282l8 8', 2.2, T)}</g>
    <text x="100" y="306" text-anchor="middle" ${MONO} font-size="18" fill="${I}" opacity=".7">75% · 3.7V</text>`
}

function founder(lang: Lang) {
  // the lanyard says CEO. someone has proofread it.
  return `
    ${ground()}
    ${inkEgg(eggOf('founder'), CAST.founder.fill)}
    ${dots(90, 114, 92)}
    ${pen('M93 112q9 6 18 -1', 2.2)}
    <circle cx="80" cy="108" r="7" fill="${T}" opacity=".22"/><circle cx="124" cy="108" r="7" fill="${T}" opacity=".22"/>
    ${pen('M62 110L98 146M138 110L102 146', 2.4)}
    <g transform="rotate(-4 100 170)">
      <rect x="95" y="141" width="10" height="9" rx="1.5" fill="${P.cream}" stroke="${I}" stroke-width="1.8"/>
      <rect x="64" y="149" width="72" height="44" rx="3" fill="${P.cream}" stroke="${I}" stroke-width="2.2"/>
      <text x="100" y="178" text-anchor="middle" ${MONO} font-size="19" letter-spacing="2.5" fill="${I}">CEO</text>
      ${rule('M70 173L130 167', 2.8, T)}
    </g>
 <g class="fx-human">
    ${pen('M92 212L100 201L108 212', 2.4, T)}
    <text x="100" y="238" text-anchor="middle" ${HAND} font-size="46" fill="${T}" transform="rotate(-3 100 228)">${lang === 'tr' ? 'insan' : 'human'}</text></g>`
}

function researcher(lang: Lang) {
  // a hairline crack, properly cited
  return `
    ${ground(100, 272, 62)}
    ${inkEgg(eggOf('researcher'), CAST.researcher.fill)}
    ${pen('M124 32l-10 24l14 12l-12 22l10 14', 2.4)}
    <g transform="rotate(-7 100 140)">
      ${dots(78, 116, 132, 3)}
      <g class="fx-glint">
        <circle cx="78" cy="132" r="15" fill="${P.cream}" fill-opacity=".3" stroke="${I}" stroke-width="2.4"/>
        <circle cx="116" cy="132" r="15" fill="${P.cream}" fill-opacity=".3" stroke="${I}" stroke-width="2.4"/>
        ${pen('M71 124l6 -4M109 124l6 -4', 2, P.cream)}
      </g>
      ${pen('M93 131q4 -4 8 0M63 129l-16 -6M131 129l12 -8', 2.2)}
      ${pen('M64 110q12 -7 24 -2', 2)}
      ${pen('M90 166h18', 2)}
    </g>
    <g transform="rotate(4 -6 238)">
      <rect x="-30" y="226" width="56" height="10" fill="${P.cream}" stroke="${I}" stroke-width="1.8"/>
      <rect x="-26" y="216" width="56" height="10" fill="${P.sky}" stroke="${I}" stroke-width="1.8"/>
      <rect x="-32" y="236" width="56" height="10" fill="${P.cream}" stroke="${I}" stroke-width="1.8"/>
      <rect x="-28" y="246" width="58" height="14" fill="${P.butter}" stroke="${I}" stroke-width="1.8"/>
      ${rule('M-22 253h40', 1.4, I, 'opacity=".5"')}
    </g>
    <text x="160" y="58" ${SERIF} font-style="italic" font-size="46" fill="${I}">¹</text>
    ${rule('M-24 288H44', 1.2, I)}
    <text x="-24" y="314" ${SERIF} font-style="italic" font-size="22" fill="${I}" opacity=".85">${lang === 'tr' ? '¹ hakemli. çoğunlukla.' : '¹ peer reviewed. mostly.'}</text>`
}

function musician() {
  // the egg as a note on the bass staff, at a sensible tempo
  const staff = [94, 126, 158, 190, 222].map((y, k) => `M-36 ${y}Q100 ${y + (k % 2 ? 2 : -2)} 236 ${y + (k % 2 ? -1 : 1)}`).join('')
  return `
    ${rule(staff, 2, I, 'opacity=".6"')}
    ${pen('M-22 126C-24 100 6 92 10 116C14 142 -4 168 -32 184', 4.2)}
    <circle cx="-22" cy="126" r="5.5" fill="${I}"/>
    <circle cx="20" cy="112" r="3.6" fill="${I}"/><circle cx="20" cy="140" r="3.6" fill="${I}"/>
    ${ground(116, 270, 58)}
    ${inkEgg(eggOf('musician'), CAST.musician.fill)}
    <g transform="rotate(16 112 158)">
      ${pen('M84 146q7 -6 14 0M116 146q7 -6 14 0', 2.4)}
      <ellipse cx="107" cy="172" rx="5" ry="6" fill="${I}"/>
      <circle cx="78" cy="160" r="7" fill="${T}" opacity=".25"/><circle cx="136" cy="160" r="7" fill="${T}" opacity=".25"/>
    </g>
    ${rule('M184 150V-12', 4.5, I)}
    ${pen('M184 -12C188 20 222 30 214 72', 4.5)}
    <g class="fx-notes">
      <g class="fx__bit" style="--k:0"><ellipse cx="236" cy="128" rx="6" ry="4.5" transform="rotate(-20 236 128)" fill="${T}"/>${rule('M241.5 126V104', 2, T)}</g>
      <g class="fx__bit" style="--k:1"><ellipse cx="226" cy="190" rx="6" ry="4.5" transform="rotate(-20 226 190)" fill="${T}"/>${rule('M231.5 188V166', 2, T)}${pen('M231.5 166q6 4 6 12', 2, T)}</g>
    </g>
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
    ${ground(104, 270, 56)}
    ${inkEgg(eggOf('firstTimer'), CAST.firstTimer.fill)}
    <g class="egg__eyes">
      <circle cx="87" cy="110" r="6" fill="#fffdf8" stroke="${I}" stroke-width="2"/><circle cx="113" cy="110" r="6" fill="#fffdf8" stroke="${I}" stroke-width="2"/>
      <circle cx="88" cy="111" r="2.8" fill="${I}"/><circle cx="114" cy="111" r="2.8" fill="${I}"/>
    </g>
    ${pen('M95 132q5 -3 10 0', 2)}
    <circle cx="70" cy="128" r="7" fill="${T}" opacity=".22"/><circle cx="130" cy="128" r="7" fill="${T}" opacity=".22"/>
    <path class="fx-sweat" d="M146 74c6 10 9 15 9 19a9 9 0 0 1 -18 0c0 -4 3 -9 9 -19z" fill="${P.sky}" stroke="${I}" stroke-width="2"/>
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
    ${ground(104, 270, 66)}
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
    ${steam(58, 12, 44)}
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
  ${pen('M30 280L22 316M170 280L178 316M58 284L56 312M142 284L144 312', 2.6)}
  <path d="M24 270q76 -12 152 0l2 10q-78 -10 -156 0z" fill="${P.yolk}" transform="translate(4 3)" opacity=".85"/>
  ${pen('M24 270q76 -12 152 0l2 10q-78 -10 -156 0z', 2.6)}
  <g transform="rotate(-6 196 250)">
    <path d="M150 266l14 -38h64l14 38z" fill="${P.cream}" stroke="${I}" stroke-width="2.2" stroke-linejoin="round"/>
    ${rule('M164 228l-14 38', 1.4, I, 'opacity=".4"')}
    <text x="196" y="256" text-anchor="middle" ${HAND} font-size="${lang === 'tr' ? 30 : 34}" fill="${T}">${lang === 'tr' ? 'ayrıldı' : 'saved'}</text>
  </g>
  <path class="egg__dash" d="${handEgg(99, { w: 0.95, lean: -5 })}" fill="${P.cream}" fill-opacity="0" stroke="${I}" stroke-width="2.6" stroke-dasharray="2 8" stroke-linecap="round"/>
  <text x="100" y="160" text-anchor="middle" ${SERIF} font-style="italic" font-size="52" fill="${I}">${lang === 'tr' ? 'sen?' : 'you?'}</text>
  ${pen('M62 186q38 10 76 0', 2.2, T)}`

