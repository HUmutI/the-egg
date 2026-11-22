import { PALETTE, nextTask } from './util'
import { handEgg, type EggShape } from './riso'
import { inkEgg } from './sketch'
import { HAND, MONO, dots, ground, pen, rule } from './figures'

/**
 * The team: each host is an egg of the house riso style (riso.ts, sketch.ts), drawn as the
 * regulars are (figures.ts, with the plate's own pen): a colour of the day, a face, and one small
 * idea from their sentence carried by a dry annotation. The cells are in index.html with their
 * text and links; this only draws the eggs into their boxes (`.mate__egg[data-i]`, an index into
 * MATES: a new host needs a cell there and an entry here), which main.css already sizes, so
 * nothing moves when they arrive. One egg a task: each is a few hundred halftone dots and bent
 * lines to work out. The small moving part of each is an `fx__bit`, which main.css wakes while a
 * mouse is over the cell (or a link in it has the focus) and puts to sleep with the section.
 */

const P = PALETTE
const I = P.ink
const T = P.tomato
/** The shell of the day's eggs (main.css --shell): no regular wears it. */
const SHELL = '#e7b896'

type Eyes = 'dots' | 'happy' | 'closed' | 'wink' | 'side'
type Mouth = 'smile' | 'grin' | 'smirk' | 'small' | 'flat'

interface Mate {
  seed: number
  fill: string
  /** (cy: where its middle is, so that every egg's foot is on the floor, y ≈ 268) */
  shape: EggShape & { cy: number }
  eyes: Eyes
  mouth: Mouth
  blush?: boolean
  /** the face's height on the egg */
  fy?: number
  /** its idea, drawn over the egg and in its margins (given the shell's outline) */
  prop: (shell: string) => string
}

// ── the faces: as the regulars' are, two dots and a line, never a cartoon ──

function eyes(kind: Eyes, x1: number, x2: number, y: number) {
  const arc = (x: number, up: boolean) => (up ? `M${x - 6} ${y + 2}q6 -8 12 0` : `M${x - 6} ${y - 1}q6 6 12 0`)
  switch (kind) {
    case 'happy':
      return `<g class="egg__eyes">${pen(arc(x1, true) + arc(x2, true), 2.6)}</g>`
    case 'closed':
      return pen(arc(x1, false) + arc(x2, false), 2.4)
    case 'wink':
      return `<g class="egg__eyes"><circle cx="${x1}" cy="${y}" r="3.6" fill="${I}"/></g>${pen(arc(x2, true), 2.6)}`
    case 'side':
      // sizing something up, off to one side
      return dots(x1 + 4, x2 + 4, y - 1, 3.6)
    default:
      return dots(x1, x2, y, 3.6)
  }
}

function mouth(kind: Mouth, x: number, y: number) {
  switch (kind) {
    case 'grin':
      return `<path d="M${x - 8} ${y - 2}h16q0 11 -8 11t-8 -11z" fill="${I}"/><path d="M${x - 4} ${y + 6}q4 -3 8 0q-4 3 -8 0z" fill="${T}"/>`
    case 'smirk':
      return pen(`M${x - 7} ${y + 1}q8 3 13 -4`, 2.4)
    case 'small':
      return pen(`M${x - 4} ${y}q4 3 8 0`, 2.2)
    case 'flat':
      return pen(`M${x - 5} ${y + 1}h11`, 2.4)
    default:
      return pen(`M${x - 7} ${y - 1}q7 6 14 0`, 2.4)
  }
}

function face(m: Mate) {
  const x = m.shape.cx ?? 100
  const y = m.fy ?? m.shape.cy - 14
  const blush = m.blush
    ? `<circle cx="${x - 28}" cy="${y + 14}" r="7" fill="${T}" opacity=".22"/><circle cx="${x + 28}" cy="${y + 14}" r="7" fill="${T}" opacity=".22"/>`
    : ''
  return `<g transform="rotate(${m.shape.lean ?? 0} ${x} ${m.shape.cy})">
    ${blush}${eyes(m.eyes, x - 13, x + 13, y)}${mouth(m.mouth, x, y + 17)}
  </g>`
}

// ── the ideas, one a host ──

/** Umut: computer vision, medical AI. The model has found an egg, and is nearly sure of it; and a
 *  scan goes down it, top to floor, and shows what's inside as an X-ray would: a chick, curled up. */
function detected(shell: string) {
  const c = (x: number, y: number, dx: number, dy: number) => `M${x} ${y + dy * 22}V${y}H${x + dx * 22}`
  const BONE = '#e4f7ff'
  const GLOW = '#6fcbef'
  // the chick, in bone: a skull with its socket and beak, a curled spine, ribs, a wing, a folded leg, the yolk
  const spine = 'M116 86C150 92 162 128 158 160C154 192 140 210 118 222'
  const bones = [
    'M88 82C112 78 124 98 120 118C116 138 94 144 76 134C58 124 60 90 88 82Z',
    'M64 112L44 122L64 130',
    spine,
    'M154 128C138 132 126 138 118 148M158 146C140 150 128 156 120 166M156 164C140 168 128 174 122 184M150 182C136 186 126 192 120 200',
    'M134 150L108 170L88 162M108 170L96 186',
    'M128 210L102 222L84 208M84 208L72 214M84 208L76 200M84 208L80 218',
  ].join('')
  const vert = [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.92]
    .map((t) => {
      // points along the spine, by its cubic segments
      const seg = t < 0.5 ? [116, 86, 150, 92, 162, 128, 158, 160] : [158, 160, 154, 192, 140, 210, 118, 222]
      const u = t < 0.5 ? t * 2 : (t - 0.5) * 2
      const b = (a: number, b1: number, b2: number, d: number) =>
        (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b1 + 3 * (1 - u) * u * u * b2 + u ** 3 * d
      const x = b(seg[0], seg[2], seg[4], seg[6])
      const y = b(seg[1], seg[3], seg[5], seg[7])
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${BONE}"/>`
    })
    .join('')
  const film = Array.from({ length: 22 }, (_, k) => `M0 ${18 + k * 12}H200`).join('')
  return `
    <defs><clipPath id="mateShell"><path d="${shell}"/></clipPath></defs>
    <g clip-path="url(#mateShell)">
      <g class="fx-xray"><g class="fx__bit">
        <rect x="-10" y="14" width="220" height="258" fill="#0d1b24" opacity=".93"/>
        <path d="${film}" stroke="${GLOW}" stroke-width="1" opacity=".09"/>
        <ellipse cx="108" cy="160" rx="66" ry="84" fill="${GLOW}" opacity=".1"/>
        <circle cx="80" cy="226" r="24" fill="${GLOW}" opacity=".16" stroke="${GLOW}" stroke-width="1.6" stroke-dasharray="4 4"/>
        <path d="${bones}" fill="none" stroke="${GLOW}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".28"/>
        <path d="${bones}" fill="none" stroke="${BONE}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="80" cy="106" r="9" fill="#0d1b24" stroke="${BONE}" stroke-width="2.2"/>
        <circle cx="82" cy="104" r="2.6" fill="${BONE}"/>
        ${vert}
      </g></g>
    </g>
    ${rule('M4 6H196V280H4Z', 1.3, T, 'opacity=".55"')}
    ${rule(c(4, 6, 1, 1) + c(196, 6, -1, 1) + c(4, 280, 1, -1) + c(196, 280, -1, -1), 3.2, T, 'stroke-linejoin="round"')}
    <rect x="3" y="-22" width="44" height="28" fill="${T}"/>
    <text x="25" y="-2" text-anchor="middle" ${MONO} font-size="17" fill="${P.cream}">egg</text>
    <text x="56" y="-1" ${MONO} font-size="23" fill="${T}">p = 0.97</text>
    <g class="fx-scan"><g class="fx__bit">
      <rect x="6" y="2" width="188" height="12" fill="${T}" opacity=".18"/>
      ${rule('M6 14H194', 2.2, T)}
    </g></g>`
}

/** Mehmet: depth estimation for a lunar rover. The rover has taken the egg's measure: its ray
 *  sweeps the shell from its side and leaves a depth map behind it, nearest warm, farthest cool. */
function rover(shell: string) {
  const DEPTH = ['#283a8f', '#2b7fd0', '#36c2c0', '#9bdc5a', '#f5c23a', '#ef6f2b', '#d42f27']
  const rings = DEPTH.map((c, k) => {
    const r = 1 - k / DEPTH.length
    return `<ellipse cx="${96 - k * 3}" cy="${118 - k * 2}" rx="${(118 * r).toFixed(1)}" ry="${(150 * r).toFixed(1)}" fill="${c}"/>`
  }).join('')
  const iso = [0.86, 0.72, 0.58, 0.44, 0.3]
    .map((r, k) => `<ellipse cx="${96 - k * 3}" cy="${118 - k * 2}" rx="${(118 * r).toFixed(1)}" ry="${(150 * r).toFixed(1)}"/>`)
    .join('')
  return `
    <defs><clipPath id="mateShellM"><path d="${shell}"/></clipPath></defs>
    <g clip-path="url(#mateShellM)">
      <g class="fx-depth"><g class="fx__bit">
        <rect x="-30" y="0" width="210" height="290" fill="#1b2160"/>
        <g opacity=".92">${rings}</g>
        <g fill="none" stroke="${P.cream}" stroke-width="1" opacity=".45">${iso}</g>
      </g></g>
    </g>
    <g class="fx-sweep"><g class="fx__bit">${rule('M180 14V272', 2, T, 'opacity=".85"')}</g></g>
    <text x="242" y="48" text-anchor="end" ${MONO} font-size="20" fill="${T}">z = 1.2 m</text>
    <g class="fx-ray">${rule('M186 92H150', 1.8, T, 'class="fx__bit" stroke-dasharray="5 5"')}</g>
    <circle cx="144" cy="92" r="5.5" fill="none" stroke="${T}" stroke-width="1.8"/>
    ${rule('M144 82v-5M144 102v5M134 92h-5', 1.6, T)}
    ${rule('M220 234V104', 3, I)}
    <g class="fx-mast"><g class="fx__bit">
      <rect x="191" y="82" width="40" height="21" rx="3" fill="${P.cream}" stroke="${I}" stroke-width="2.2"/>
      <circle cx="201" cy="92.5" r="4.4" fill="${I}"/><circle cx="217" cy="92.5" r="4.4" fill="${I}"/>
    </g></g>
    <path d="M190 220l26 -9l2 8l-26 9z" fill="${P.sky}" stroke="${I}" stroke-width="1.8" stroke-linejoin="round"/>
    <rect x="182" y="230" width="58" height="21" rx="4" fill="${P.mintDeep}" transform="translate(3 3)" opacity=".5"/>
    <rect x="182" y="230" width="58" height="21" rx="4" fill="${P.mint}" stroke="${I}" stroke-width="2.2"/>
    ${pen('M188 251l-4 8M211 251v8M234 251l4 8', 2)}
    ${[186, 211, 236].map((x) => `<circle cx="${x}" cy="260" r="8.5" fill="${P.cream}" stroke="${I}" stroke-width="2.2"/><circle cx="${x}" cy="260" r="2.2" fill="${I}"/>`).join('')}`
}

/** Mert Ç.: finance and AI products, and a crypto guy about it: shades, lasers, a gold chain.
 *  The candles print one by one, then the price line climbs through the egg and off the chart. */
function candles() {
  const C = [
    { x: 160, o: 78, c: 62, h: 54, l: 86 },
    { x: 179, o: 64, c: 76, h: 56, l: 84 },
    { x: 198, o: 74, c: 44, h: 36, l: 80 },
    { x: 217, o: 46, c: 20, h: 10, l: 54 },
    { x: 236, o: 22, c: -14, h: -24, l: 28 },
  ]
  const candle = ({ x, o, c, h, l }: (typeof C)[number]) => {
    const [top, bot] = [Math.min(o, c), Math.max(o, c)]
    const fill = c < o ? P.mintDeep : T
    return `${rule(`M${x} ${h}V${l}`, 1.8, I)}<rect x="${x - 7}" y="${top}" width="14" height="${bot - top}" fill="${fill}" transform="translate(3 2)" opacity=".85"/><rect x="${x - 7}" y="${top}" width="14" height="${bot - top}" fill="none" stroke="${I}" stroke-width="2"/>`
  }
  const line = 'M-24 246L14 204L40 220L74 160L98 178L130 112L148 124L174 52L196 66L232 -32'
  // dressed for the bull run: pixel shades (with lasers, now and then), a gold chain and its coin
  const px = (x: number, y: number) =>
    `M${x} ${y}h30v11h-4v4h-10v-4h-4v4h-8v-4h-4z`
  const shades = `<g transform="rotate(-5 80 137)">
      <path d="M44 112h76v6H44z" fill="${I}"/>
      <path d="${px(48, 116)}${px(86, 116)}" fill="${I}"/>
      <path d="M53 119h5v4h-5zM91 119h5v4h-5z" fill="${P.cream}"/>
      <g class="fx-laser">
        <g class="fx__bit">
          ${rule('M63 123L150 110M101 123L152 117', 7, T, 'opacity=".28"')}
          ${rule('M63 123L150 110M101 123L152 117', 2.4, '#ff5a3c')}
          <circle cx="63" cy="123" r="5.5" fill="#ff5a3c"/><circle cx="101" cy="123" r="5.5" fill="#ff5a3c"/>
        </g>
      </g>
    </g>`
  const chain = 'M44 168C52 196 66 206 80 206C94 206 108 196 116 168'
  const coin = `<g class="fx-coin"><g class="fx__bit">
      <circle cx="80" cy="216" r="14" fill="${P.yolk}" stroke="${I}" stroke-width="2.2"/>
      <circle cx="80" cy="216" r="9.5" fill="none" stroke="${I}" stroke-width="1.2" opacity=".5"/>
      <text x="80" y="222.5" text-anchor="middle" ${MONO} font-size="17" font-weight="700" fill="${I}">₿</text>
    </g></g>`
  return `
    ${rule(chain, 5.6, I)}
    ${rule(chain, 3.4, P.yolk, 'stroke-dasharray="4 3"')}
    ${coin}
    ${shades}
    ${rule('M148 98H244', 1.4, I, 'opacity=".45"')}
    <g class="fx-print">${C.map((k, i) => `<g class="fx__bit" style="--k:${i}">${candle(k)}</g>`).join('')}</g>
    <g class="fx-climb">
      <path class="fx__bit" d="${line}" pathLength="1" fill="none" stroke="${P.cream}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="fx__bit" d="${line}" pathLength="1" fill="none" stroke="${P.mintDeep}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g class="fx-quote"><g class="fx__bit">
      <path d="M232 -32l-12 4l9 9z" fill="${P.mintDeep}"/>
      <text x="214" y="-18" text-anchor="end" ${MONO} font-size="23" fill="${P.mintDeep}">+420%</text>
    </g></g>`
}

/** Mert K.: makes pando, an open-source dev tool; a builder, a vibe coder: headphones on, laptop
 *  open, coffee going. The command types itself, and the egg it was run on cracks open. */
function terminal(shell: string) {
  const crack = 'M22 92l16 -12l12 14l15 -16l13 15l15 -14l12 13l15 -15l13 12l16 -10'
  // the builder's kit: headphones on (the notes are the vibe), a laptop covered in stickers, a coffee
  const band = 'M10 116C6 30 194 30 190 116'
  const cup = (x: number) =>
    `<rect x="${x}" y="100" width="24" height="44" rx="10" fill="${T}" stroke="${I}" stroke-width="2.4"/><rect x="${x + 6}" y="108" width="12" height="28" rx="5" fill="${I}" opacity=".25"/>`
  const note = (x: number, y: number, k: number) =>
    `<g class="fx__bit" style="--k:${k}"><path d="M${x} ${y}v-16l10 -3v16" fill="none" stroke="${I}" stroke-width="2"/><ellipse cx="${x - 3}" cy="${y}" rx="4" ry="3" fill="${I}"/><ellipse cx="${x + 7}" cy="${y - 3}" rx="4" ry="3" fill="${I}"/></g>`
  const laptop = `
    <path d="M46 196h108l-4 64H50z" fill="${P.lavDeep}" transform="translate(4 3)" opacity=".5"/>
    <path d="M46 196h108l-4 64H50z" fill="#cfd2da" stroke="${I}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M38 260h124l-6 8H44z" fill="#b6bac4" stroke="${I}" stroke-width="2.4" stroke-linejoin="round"/>
    <g transform="rotate(-8 74 216)"><rect x="60" y="206" width="30" height="16" rx="3" fill="${I}"/><text x="75" y="218" text-anchor="middle" ${MONO} font-size="11" fill="${P.mint}">&lt;/&gt;</text></g>
    <circle cx="124" cy="216" r="10" fill="${P.yolk}" stroke="${I}" stroke-width="1.6"/>
    <path d="M124 209c-4 0 -6 5 -6 8s3 5 6 5s6 -2 6 -5s-2 -8 -6 -8z" fill="${P.cream}" stroke="${I}" stroke-width="1.2"/>
    <g transform="rotate(6 100 244)"><rect x="70" y="236" width="60" height="15" rx="7.5" fill="${T}"/><text x="100" y="247.5" text-anchor="middle" ${MONO} font-size="10.5" fill="${P.cream}">ship it</text></g>`
  const mug = `
    <g class="fx-steam">${rule('M206 222q-5 -7 0 -14M216 222q-5 -7 0 -14', 2, I, 'class="fx__bit" opacity=".55"')}</g>
    <path d="M198 228h26v28q0 8 -8 8h-10q-8 0 -8 -8z" fill="${P.cream}" stroke="${I}" stroke-width="2.4"/>
    <path d="M224 236q10 0 10 9t-10 9" fill="none" stroke="${I}" stroke-width="2.4"/>`
  return `
    ${rule(band, 7, I)}
    ${rule(band, 3.4, P.lav)}
    ${cup(-2)}${cup(178)}
    <g class="fx-vibe">${note(-20, 92, 0)}${note(214, 86, 1)}</g>
    ${laptop}
    ${mug}
    <defs><clipPath id="mateShellK"><path d="${shell}"/></clipPath></defs>
    <g clip-path="url(#mateShellK)" class="fx-crack">
      <path class="fx__bit" d="${crack}" pathLength="1" fill="none" stroke="${I}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="rotate(-4 30 0)">
      <rect x="-30" y="-34" width="180" height="86" rx="6" fill="${P.lavDeep}" transform="translate(4 4)" opacity=".8"/>
      <rect x="-30" y="-34" width="180" height="86" rx="6" fill="${I}"/>
      <circle cx="-19" cy="-23" r="3" fill="${T}"/><circle cx="-9" cy="-23" r="3" fill="${P.yolk}"/><circle cx="1" cy="-23" r="3" fill="${P.mint}"/>
      <text x="-19" y="12" ${MONO} font-size="19" fill="${P.yolk}">$</text>
      <g class="fx-type"><text class="fx__bit" x="4" y="12" ${MONO} font-size="19" fill="${P.cream}">pando start</text></g>
      <g class="fx-cursor"><g class="fx-caret"><rect class="fx__bit" x="130" y="-3" width="9" height="18" fill="${P.cream}"/></g></g>
      <g class="fx-out"><text class="fx__bit" x="-19" y="38" ${MONO} font-size="15" fill="${P.mint}">✓ hatched in 0.3s</text></g>
    </g>`
}

/** Cansu: philosophy, and dressed for it: a laurel wreath, a beard to stroke, a toga with a key
 *  border. Thought about it, one bubble at a time; concluded. */
function philosopher(shell: string) {
  // the wreath: leaves along a band over the crown, in pairs, tips towards the front
  const [x0, y0, cx, cy, x1, y1] = [28, 74, 100, 16, 172, 74]
  const leaves: string[] = []
  for (let k = 0; k <= 12; k++) {
    if (k === 6) continue
    const t = k / 12
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1
    const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx)
    const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy)
    const a = (Math.atan2(dy, dx) * 180) / Math.PI + (t < 0.5 ? 0 : 180)
    for (const side of [-1, 1]) {
      leaves.push(
        `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="3.6" transform="rotate(${(a + side * 32).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}) translate(${t < 0.5 ? 6 : -6} 0)" fill="${P.mintDeep}" stroke="${I}" stroke-width="1.2"/>`,
      )
    }
  }
  const band = `M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`
  // the beard: curls from cheek to cheek, down to a point
  const beard =
    'M66 150C58 162 62 176 70 182C66 194 76 206 86 206C88 218 100 226 108 216C120 220 130 208 128 198C140 194 144 178 136 168C142 160 138 150 132 148C122 158 112 160 100 160C88 160 76 158 66 150Z'
  const curls = 'M76 172q6 4 12 0M90 186q6 4 12 0M108 180q6 4 12 0M96 200q5 4 10 0M118 166q5 4 10 0M82 160q5 3 10 0'
  // the toga: over one shoulder, a key border along its edge
  const edge = 'M-10 200L210 152'
  let key = ''
  for (let k = 0; k < 15; k++) {
    const x = -6 + k * 15
    const y = 200 - (x + 10) * (48 / 220) + 5
    key += `M${x} ${y.toFixed(1)}h7v-4h-4v-2h6v7`
  }
  return `
    <defs><clipPath id="mateShellC"><path d="${shell}"/></clipPath></defs>
    <g clip-path="url(#mateShellC)">
      <path d="M-10 200L210 152V300H-10Z" fill="${P.cream}"/>
      ${rule('M30 230q30 -2 52 -20M60 262q34 -6 66 -40M120 270q30 -14 60 -64', 1.6, I, 'opacity=".4"')}
      <path d="M-10 196L210 148L210 160L-10 208Z" fill="${P.pinkDeep}" opacity=".85"/>
      ${rule(key, 1.3, P.cream, 'stroke-linejoin="miter" stroke-linecap="butt"')}
      ${rule(edge, 2.2, I)}
      <path d="${shell}" fill="none" stroke="${I}" stroke-width="3.6"/>
    </g>
    <g class="fx-beard"><g class="fx__bit">
      <path d="${beard}" fill="#efe9e1" stroke="${I}" stroke-width="2.4" stroke-linejoin="round"/>
      ${rule(curls, 1.6, I, 'opacity=".55"')}
    </g></g>
    ${pen('M88 152q6 -5 12 -1q6 -4 12 1', 2.4)}
    ${rule(band, 2.4, P.mintDeep)}
    ${leaves.join('')}
    ${thought()}`
}

function thought() {
  const cloud =
    'M118 0C98 -4 98 -32 122 -32C124 -50 152 -54 164 -40C176 -56 206 -52 210 -34C232 -40 250 -18 240 -2C254 8 244 34 222 30C218 46 190 48 180 36C168 50 136 48 134 32C112 36 102 10 118 0Z'
  // (set 8 lower than it was drawn, so its top stays inside the drawing's box)
  return `<g transform="translate(0 8)" class="fx-ponder">
    <g class="fx__bit" style="--k:2">
      <path d="${cloud}" fill="${P.pink}" transform="translate(4 3)" opacity=".9"/>
      <path d="${cloud}" fill="${P.cream}"/>
      ${pen(cloud, 2.4)}
    </g>
    <g class="fx-think">
      <g class="fx__bit" style="--k:1"><circle cx="128" cy="54" r="7" fill="${P.cream}" stroke="${I}" stroke-width="2.2"/></g>
      <g class="fx__bit" style="--k:0"><circle cx="115" cy="72" r="4.5" fill="${P.cream}" stroke="${I}" stroke-width="2"/></g>
    </g>
    <text class="fx__bit" style="--k:3" x="172" y="-4" text-anchor="middle" ${HAND} font-size="38" fill="${I}">cogito,</text>
    <text class="fx__bit" style="--k:4.5" x="176" y="24" text-anchor="middle" ${HAND} font-size="38" fill="${T}">ergo ovum.</text></g>`
}

/** Vahip: an industrial designer. The egg, toleranced: a sweep turns the shell into its CAD
 *  wireframe, sections and meridians on blueprint, while the compass checks the radius. */
function drafted(shell: string) {
  const grid = Array.from({ length: 21 }, (_, k) => `M${-10 + k * 12} 0V290M-20 ${4 + k * 14}H220`).join('')
  const sections = [44, 80, 116, 152, 188, 224, 254]
    .map((y) => {
      const t = (y - 145) / 130
      const rx = 92 * Math.sqrt(Math.max(0, 1 - t * t)) * (1 - 0.08 * t)
      return `<ellipse cx="100" cy="${y}" rx="${rx.toFixed(1)}" ry="${(rx * 0.14).toFixed(1)}"/>`
    })
    .join('')
  const meridians = [30, 62].map((rx) => `<ellipse cx="100" cy="145" rx="${rx}" ry="128"/>`).join('')
  return `
    <defs><clipPath id="mateShellV"><path d="${shell}"/></clipPath></defs>
    <g clip-path="url(#mateShellV)">
      <g class="fx-blue"><g class="fx__bit">
        <rect x="-10" y="0" width="220" height="290" fill="#1f4a94"/>
        <path d="${grid}" stroke="${P.cream}" stroke-width=".8" opacity=".16"/>
        <g fill="none" stroke="${P.cream}" stroke-width="1.5" opacity=".85">${sections}${meridians}</g>
        ${rule('M100 6V284M0 145H200', 1.2, P.yolk, 'stroke-dasharray="10 4 2 4" opacity=".9"')}
        <path d="${shell}" fill="none" stroke="${P.cream}" stroke-width="5"/>
      </g></g>
    </g>
    <g class="fx-trace"><g class="fx__bit">${rule('M-10 10V280', 2, P.lavDeep, 'opacity=".9"')}</g></g>
    ${rule('M94 70h12M100 64v12', 1.4, T)}
    <g class="fx-arc"><path class="fx__bit" d="M62 58A40 40 0 0 1 138 58" fill="none" stroke="${T}" stroke-width="1.6" stroke-dasharray="6 5"/></g>
    ${rule('M100 70L72 42L24 -2H-30', 1.4, T)}
    <path d="M72 42l-10 -2l5 -6z" fill="${T}"/>
    <text x="-30" y="-10" ${MONO} font-size="24" fill="${T}">R 40</text>
    <g class="fx-dim">${rule('M192 26H244M192 268H244M232 34V260', 1.4, T, 'class="fx__bit" pathLength="1"')}</g>
    <path d="M232 26l-4 10h8zM232 268l-4 -10h8z" fill="${T}"/>
    <text x="0" y="0" transform="translate(224 148) rotate(-90)" text-anchor="middle" ${MONO} font-size="20" fill="${T}">242 ±0.5</text>`
}

/** In the order of the cells: Umut, Mehmet, Mert Ç., Mert K., Cansu, Vahip. */
const MATES: Mate[] = [
  { seed: 81, fill: P.sky, shape: { w: 0.9, h: 1.02, lean: -3, cy: 142 }, eyes: 'dots', mouth: 'smile', prop: detected },
  { seed: 87, fill: P.mint, shape: { w: 0.96, h: 0.98, lean: 4, taper: 0.1, cx: 74, cy: 146 }, eyes: 'happy', mouth: 'grin', blush: true, prop: rover },
  { seed: 93, fill: P.peach, shape: { w: 0.88, h: 1.04, lean: -5, taper: 0.16, cx: 80, cy: 137 }, eyes: 'dots', mouth: 'smirk', prop: candles },
  { seed: 99, fill: P.lav, shape: { w: 0.94, h: 1, lean: 3, cy: 143 }, eyes: 'wink', mouth: 'smile', blush: true, prop: terminal },
  { seed: 105, fill: P.pink, shape: { w: 0.92, h: 1.01, lean: -2, taper: 0.12, cy: 143 }, eyes: 'closed', mouth: 'small', prop: philosopher },
  { seed: 111, fill: SHELL, shape: { w: 0.95, h: 0.99, lean: 2, taper: 0.1, cy: 145 }, eyes: 'side', mouth: 'flat', fy: 136, prop: drafted },
]

/** Every egg is drawn around a 200×260 egg at (100, ~142), standing on y ≈ 268; its idea is in the margins. */
export const MATE_VIEWBOX = '-36 -40 282 336'

/** One host: the floor, the shell, the face, and the idea. */
export function mateSvg(m: Mate) {
  const x = m.shape.cx ?? 100
  const d = handEgg(m.seed, { cx: x, ...m.shape })
  return `<svg viewBox="${MATE_VIEWBOX}" aria-hidden="true" focusable="false">
    ${ground(x + 4, 270, 64)}
    ${inkEgg(d, m.fill)}
    ${face(m)}
    ${m.prop(d)}
  </svg>`
}

/** Draw every host's egg into its box, one a task. */
export async function initTeam() {
  const boxes = Array.from(document.querySelectorAll<HTMLElement>('.mate__egg[data-i]'))
  for (const [k, box] of boxes.entries()) {
    const m = MATES[Number(box.dataset.i)]
    if (!m) continue
    if (k) await nextTask()
    box.innerHTML = mateSvg(m)
  }
}
