import { PALETTE } from './util'

/**
 * The plate's ink, drawn rather than filtered (the house style is described in riso.ts).
 *
 * `sketch` bends a pen line a little along its way, once, so it comes out as an ordinary crisp
 * stroke; `halftone` shades a shape with real dots; `inkEgg` puts a riso egg together from
 * both. Kept apart from riso.ts, which the first screen's script loads: only the regulars
 * (src/figures.ts), the hosts (src/team.ts) and the day's scenes (src/dayplates.ts), all in
 * the scroll layer, draw with these.
 */

const I = PALETTE.ink

type Pt = [number, number]

/**
 * An SVG path as polylines, a point every `step` units along it. Reads M L H V C S Q T Z,
 * absolute or relative (all the plate's pen lines use); anything else (an arc) gives null.
 */
export function flatten(d: string, step = 4): { pts: Pt[]; closed: boolean }[] | null {
  const toks = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g)
  if (!toks) return null
  const subs: { pts: Pt[]; closed: boolean }[] = []
  let cur: Pt[] | null = null
  let [x, y, sx, sy, px, py] = [0, 0, 0, 0, 0, 0]
  let i = 0
  let cmd = ''
  let prev = ''
  const num = () => parseFloat(toks[i++])
  const line = (x1: number, y1: number) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x, y1 - y) / step))
    for (let k = 1; k <= n; k++) cur!.push([x + ((x1 - x) * k) / n, y + ((y1 - y) * k) / n])
    x = x1
    y = y1
  }
  const cubic = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    const len = (Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2) + Math.hypot(x3 - x, y3 - y)) / 2
    const n = Math.max(3, Math.ceil(len / step))
    for (let k = 1; k <= n; k++) {
      const t = k / n
      const u = 1 - t
      cur!.push([
        u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
      ])
    }
    x = x3
    y = y3
  }
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++]
    else if (!cmd || cmd === 'z' || cmd === 'Z') return null
    const rel = cmd === cmd.toLowerCase()
    const C = cmd.toUpperCase()
    const [ox, oy] = rel ? [x, y] : [0, 0]
    if (C !== 'M' && !cur) return null
    if (C === 'M') {
      x = sx = num() + ox
      y = sy = num() + oy
      cur = [[x, y]]
      subs.push({ pts: cur, closed: false })
      // (further pairs after a move are lines)
      cmd = rel ? 'l' : 'L'
    } else if (C === 'L') line(num() + ox, num() + oy)
    else if (C === 'H') line(num() + ox, y)
    else if (C === 'V') line(x, num() + oy)
    else if (C === 'C' || C === 'S') {
      const smooth = prev === 'C' || prev === 'S'
      const [x1, y1] = C === 'C' ? [num() + ox, num() + oy] : smooth ? [2 * x - px, 2 * y - py] : [x, y]
      const [x2, y2, x3, y3] = [num() + ox, num() + oy, num() + ox, num() + oy]
      cubic(x1, y1, x2, y2, x3, y3)
      px = x2
      py = y2
    } else if (C === 'Q' || C === 'T') {
      const smooth = prev === 'Q' || prev === 'T'
      const [qx, qy] = C === 'Q' ? [num() + ox, num() + oy] : smooth ? [2 * x - px, 2 * y - py] : [x, y]
      const [x3, y3] = [num() + ox, num() + oy]
      cubic(x + ((qx - x) * 2) / 3, y + ((qy - y) * 2) / 3, x3 + ((qx - x3) * 2) / 3, y3 + ((qy - y3) * 2) / 3, x3, y3)
      px = qx
      py = qy
    } else if (C === 'Z') {
      line(sx, sy)
      subs[subs.length - 1].closed = true
      cur = null
    } else return null
    if (Number.isNaN(x) || Number.isNaN(y)) return null
    prev = C
  }
  return subs
}

/** Smooth noise over the drawing's plane, 0..1 (the same wherever it is asked, so lines that meet stay met). */
const grain = (x: number, y: number, s: number) => {
  const at = (ix: number, iy: number) => {
    let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(s, 1442695041)
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  const [ix, iy] = [Math.floor(x), Math.floor(y)]
  const [fx, fy] = [x - ix, y - iy]
  const [u, v] = [fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)]
  const [a, b, c, d] = [at(ix, iy), at(ix + 1, iy), at(ix, iy + 1), at(ix + 1, iy + 1)]
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

const f1 = (v: number) => +v.toFixed(1)

/**
 * A pen line drawn by hand: the path, bent a little along its way. What the #wobble filter did
 * to the finished pixels on every paint, done once to the line itself, so it comes out as an
 * ordinary crisp stroke. (A path this can't read is returned as it was.)
 */
export function sketch(d: string, amount = 2.6) {
  const subs = flatten(d)
  if (!subs) return d
  const F = 0.035
  const bend = ([x, y]: Pt) => {
    const dx = grain(x * F, y * F, 1) - 0.5 + (grain(x * F * 2, y * F * 2, 2) - 0.5) / 2
    const dy = grain(x * F, y * F, 3) - 0.5 + (grain(x * F * 2, y * F * 2, 4) - 0.5) / 2
    return `${f1(x + dx * amount)} ${f1(y + dy * amount)}`
  }
  return subs
    .map(({ pts, closed }) => {
      // (a closed line's last point is its first again)
      const run = closed ? pts.slice(0, -1) : pts
      return `M${run.map(bend).join('L')}${closed ? 'Z' : ''}`
    })
    .join('')
}

const inside = (poly: Pt[], x: number, y: number) => {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/**
 * Halftone shading for a shape: dots on a 28° screen that grow towards the lower right, as a
 * real screen's do. Each dot is a round-capped stroke of no length, in one of four weights, so
 * the whole shade is four paths (no pattern to tile, no mask to composite). (`pitch`, `max`:
 * the screen's step and its largest dot, in the drawing's units; `opacity`: how dark it prints.)
 */
export function halftone(poly: Pt[], pitch = 6.2, max = 1.9, opacity = 0.3) {
  if (poly.length < 3) return ''
  const xs = poly.map((p) => p[0])
  const ys = poly.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const [w, h] = [x1 - x0, y1 - y0]
  const [cx, cy] = [x0 + w / 2, y0 + h / 2]
  const [cos, sin] = [Math.cos((28 * Math.PI) / 180), Math.sin((28 * Math.PI) / 180)]
  const reach = Math.ceil(Math.hypot(w, h) / 2 / pitch) + 1
  const sizes: string[][] = [[], [], [], []]
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      const x = cx + (i * cos - j * sin) * pitch
      const y = cy + (i * sin + j * cos) * pitch
      if (x < x0 || x > x1 || y < y0 || y > y1) continue
      // how far into the shade: nothing on the upper left, full on the lower right
      const t = (((x - x0) / w - 0.15) * 0.8 + ((y - y0) / h - 0.1) * 0.85) / (0.8 * 0.8 + 0.85 * 0.85)
      const s = Math.min(1, Math.max(0, (t - 0.44) / 0.56))
      if (s < 0.14 || !inside(poly, x, y)) continue
      sizes[Math.min(3, Math.floor(s * 4))].push(`M${f1(x)} ${f1(y)}h.01`)
    }
  }
  return `<g fill="none" stroke="${I}" stroke-linecap="round" opacity="${opacity}">${sizes
    .map((dots, k) => (dots.length ? `<path d="${dots.join('')}" stroke-width="${f1(max * 2 * (0.3 + 0.7 * ((k + 0.5) / 4)))}"/>` : ''))
    .join('')}</g>`
}

let uid = 0

/**
 * Riso egg: colour printed a few px off-register, halftone shade, wobbly
 * outline with a small gap where the pen lifted.
 */
export function inkEgg(d: string, fill: string, o: { off?: [number, number]; gap?: number; shade?: boolean; stroke?: number } = {}) {
  const [ox, oy] = o.off ?? [6, 5]
  const gap = o.gap ?? 0.18
  const sw = o.stroke ?? 3.6
  uid++
  return `
    <g transform="translate(${ox} ${oy})"><path d="${d}" fill="${fill}"/>${o.shade === false ? '' : halftone(flatten(d, 7)?.[0]?.pts ?? [])}</g>
    <path d="${sketch(d)}" fill="none" stroke="${I}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"
      pathLength="100" stroke-dasharray="${100 - gap * 30} ${gap * 30}" stroke-dashoffset="${(uid * 37) % 100}"/>`
}
