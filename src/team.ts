import { PALETTE, nextTask } from './util'
import { handEgg, type EggShape } from './riso'
import { inkEgg, sketch } from './sketch'

/**
 * The team: each host is an egg of the house riso style (riso.ts, sketch.ts), in a colour of the
 * day, with a face and nothing else. The cells are in index.html with their text and links; this
 * only draws the eggs into their boxes (`.mate__egg[data-i]`, an index into MATES: a new host needs
 * a cell there and an entry here), which main.css already sizes, so
 * nothing moves when they arrive. One egg a task: each is a few hundred halftone dots and bent
 * lines to work out.
 */

const I = PALETTE.ink
const T = PALETTE.tomato

type Eyes = 'dots' | 'happy' | 'closed' | 'wink'
type Mouth = 'smile' | 'grin' | 'smirk' | 'small'

interface Mate {
  seed: number
  fill: string
  shape: EggShape
  eyes: Eyes
  mouth: Mouth
  blush?: boolean
}

/** In the order of the cells: Umut, Mehmet, Mert Ç., Mert K., Cansu. */
const MATES: Mate[] = [
  { seed: 81, fill: PALETTE.sky, shape: { w: 0.9, h: 1.02, lean: -3 }, eyes: 'dots', mouth: 'smile' },
  { seed: 87, fill: PALETTE.mint, shape: { w: 0.96, h: 0.98, lean: 4, taper: 0.1 }, eyes: 'happy', mouth: 'grin', blush: true },
  { seed: 93, fill: PALETTE.peach, shape: { w: 0.88, h: 1.04, lean: -5, taper: 0.16 }, eyes: 'dots', mouth: 'smirk' },
  { seed: 99, fill: PALETTE.lav, shape: { w: 0.94, h: 1, lean: 3 }, eyes: 'wink', mouth: 'smile', blush: true },
  { seed: 105, fill: PALETTE.pink, shape: { w: 0.92, h: 1.01, lean: -2, taper: 0.12 }, eyes: 'closed', mouth: 'small' },
]

/** Every egg is drawn around a 200×260 egg at (100, 140), standing on y ≈ 272. */
export const MATE_VIEWBOX = '0 6 212 282'

const pen = (d: string, w = 3.4, extra = '') =>
  `<path d="${sketch(d, 1.6)}" fill="none" stroke="${I}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`

function eyes(kind: Eyes, x1: number, x2: number, y: number) {
  const dot = (x: number) => `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="5.8" fill="${I}"/>`
  const arc = (x: number, up: boolean) => (up ? `M${x - 7} ${y + 3}q7 -10 14 0` : `M${x - 7} ${y - 1}q7 8 14 0`)
  switch (kind) {
    case 'happy':
      return `<g class="egg__eyes">${pen(arc(x1, true) + arc(x2, true), 3.6)}</g>`
    case 'closed':
      return pen(arc(x1, false) + arc(x2, false), 3.4)
    case 'wink':
      return `<g class="egg__eyes">${dot(x1)}</g>${pen(arc(x2, true), 3.6)}`
    default:
      return `<g class="egg__eyes">${dot(x1)}${dot(x2)}</g>`
  }
}

function mouth(kind: Mouth, x: number, y: number) {
  switch (kind) {
    case 'grin':
      return `<path d="M${x - 11} ${y - 2}h22q0 14 -11 14t-11 -14z" fill="${I}"/><path d="M${x - 6} ${y + 8}q6 -5 12 0q-6 4 -12 0z" fill="${T}"/>`
    case 'smirk':
      return pen(`M${x - 9} ${y + 1}q10 4 17 -5`, 3.2)
    case 'small':
      return pen(`M${x - 5} ${y}q5 4 10 0`, 3)
    default:
      return pen(`M${x - 9} ${y - 2}q9 9 18 0`, 3.2)
  }
}

/** One host's egg: its shadow, the shell, and the face (the shell leans, so the face goes with it). */
export function mateSvg(m: Mate) {
  const d = handEgg(m.seed, { ...m.shape, cx: 100, cy: 140 })
  const lean = m.shape.lean ?? 0
  const blush = m.blush
    ? `<ellipse cx="72" cy="150" rx="9" ry="5" fill="${T}" opacity=".22"/><ellipse cx="128" cy="150" rx="9" ry="5" fill="${T}" opacity=".22"/>`
    : ''
  return `<svg viewBox="${MATE_VIEWBOX}" aria-hidden="true" focusable="false">
    <ellipse cx="108" cy="274" rx="70" ry="8" fill="${I}" opacity=".12"/>
    ${pen('M40 276Q108 281 178 275', 2, 'opacity=".55"')}
    ${inkEgg(d, m.fill)}
    <g transform="rotate(${lean} 100 140)">
      ${blush}
      ${eyes(m.eyes, 82, 118, 128)}
      ${mouth(m.mouth, 100, 152)}
    </g>
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
