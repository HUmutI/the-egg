import { PALETTE } from './util'

/**
 * The house illustration style: a hand-drawn silhouette (never the same egg
 * twice), riso-style colour printed slightly off the line, a wobbly ink
 * outline that doesn't quite close, and halftone shading on one side.
 */

const I = PALETTE.ink

/** One-time SVG defs: the wobble filter, halftone dots and the shading mask. */
export function installInkDefs() {
  const defs = document.querySelector('.defs defs')
  if (!defs || defs.querySelector('#wobble')) return // normally shipped in index.html
  defs.insertAdjacentHTML(
    'beforeend',
    `<filter id="wobble" x="-10%" y="-10%" width="120%" height="120%">
       <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n"/>
       <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
     </filter>
     <pattern id="halftone" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
       <circle cx="3" cy="3" r="1.15" fill="${I}"/>
     </pattern>
     <linearGradient id="shadeGrad" x1="0.15" y1="0.1" x2="0.95" y2="0.95">
       <stop offset="0.45" stop-color="#000"/>
       <stop offset="1" stop-color="#fff"/>
     </linearGradient>
     <mask id="shadeMask" maskContentUnits="objectBoundingBox">
       <rect width="1" height="1" fill="url(#shadeGrad)"/>
     </mask>`,
  )
}

const rng = (seed: number) => {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export interface EggShape {
  /** width / height multipliers around a 200×260 egg */
  w?: number
  h?: number
  /** degrees */
  lean?: number
  /** how much the top narrows */
  taper?: number
  /** how lumpy the hand is */
  wobble?: number
  cx?: number
  cy?: number
}

/** A hand-drawn egg: a closed Catmull-Rom curve through jittered points. */
export function handEgg(seed: number, o: EggShape = {}) {
  const { w = 1, h = 1, lean = 0, taper = 0.14, wobble = 0.035, cx = 100, cy = 140 } = o
  const r = rng(seed)
  const p1 = r() * 6
  const p2 = r() * 6
  const N = 16
  const pts: [number, number][] = []
  const a = (lean * Math.PI) / 180
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2 - Math.PI / 2
    const s = Math.sin(t)
    const k = 1 + wobble * (Math.sin(t * 2 + p1) * 0.6 + Math.sin(t * 3 + p2) * 0.4) + (r() - 0.5) * wobble * 0.5
    let x = Math.cos(t) * 90 * w * (1 + taper * s) * k
    let y = s * 120 * h * k
    // the bottom of an egg sits a little lower than its middle
    y += s > 0 ? s * 6 * h : 0
    const rx = x * Math.cos(a) - y * Math.sin(a)
    const ry = x * Math.sin(a) + y * Math.cos(a)
    x = rx
    y = ry
    pts.push([cx + x, cy + y])
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N]
    const pa = pts[i]
    const pb = pts[(i + 1) % N]
    const p3 = pts[(i + 2) % N]
    const c1 = [pa[0] + (pb[0] - p0[0]) / 6, pa[1] + (pb[1] - p0[1]) / 6]
    const c2 = [pb[0] - (p3[0] - pa[0]) / 6, pb[1] - (p3[1] - pa[1]) / 6]
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${pb[0].toFixed(1)} ${pb[1].toFixed(1)}`
  }
  return d + 'Z'
}

let uid = 0

/**
 * Riso egg: colour printed a few px off-register, halftone shade, wobbly
 * outline with a small gap where the pen lifted.
 */
export function inkEgg(d: string, fill: string, o: { off?: [number, number]; gap?: number; shade?: boolean; stroke?: number } = {}) {
  const id = `ie${++uid}`
  const [ox, oy] = o.off ?? [6, 5]
  const gap = o.gap ?? 0.18
  const sw = o.stroke ?? 3.6
  return `
    <clipPath id="${id}"><path d="${d}" transform="translate(${ox} ${oy})"/></clipPath>
    <path d="${d}" fill="${fill}" transform="translate(${ox} ${oy})"/>
    ${o.shade === false ? '' : `<g clip-path="url(#${id})" opacity=".28"><rect x="-40" y="-40" width="300" height="340" fill="url(#halftone)" mask="url(#shadeMask)"/></g>`}
    <path d="${d}" fill="none" stroke="${I}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"
      pathLength="100" stroke-dasharray="${100 - gap * 30} ${gap * 30}" stroke-dashoffset="${(uid * 37) % 100}" filter="url(#wobble)"/>`
}
