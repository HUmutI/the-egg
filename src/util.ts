export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T

export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll(sel)) as T[]

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** The egg silhouette (the day walker's), in a 200×260 box; ink.ts draws the rest of the family. */
export const EGG_PATH = 'M100 6C149.9 6 196 66 196 156C196 212 153.8 256 100 256C46.2 256 4 212 4 156C4 66 50.1 6 100 6Z'
export const CRACK_POINTS = '0,100 22,86 40,106 62,82 84,108 104,84 126,110 146,86 166,106 186,88 200,98'

export const PALETTE = {
  butter: '#fdf3d7',
  cream: '#fdf8ef',
  yolk: '#f4b52a',
  lav: '#d9d2ec',
  lavDeep: '#6a5bbf',
  mint: '#d0e3d4',
  mintDeep: '#2f7d5c',
  peach: '#f2d4c2',
  peachDeep: '#d9734b',
  pink: '#eed3d6',
  pinkDeep: '#b94c72',
  sky: '#d0e0ea',
  tomato: '#e2432a',
  ink: '#1f1722',
  night: '#221624',
} as const

/** Shared clock state: the day section publishes its own time while pinned. */
export const clockState = {
  dayStart: 0,
  dayEnd: 0,
  dayMinutes: null as number | null,
  onChange: () => {},
}

/**
 * Parts of the page sleep while they're off screen: `.is-asleep` pauses every
 * CSS animation inside (main.css). An infinite loop keeps restyling (and, on
 * SVG, re-laying out and repainting under the wobble filter) on every frame
 * even where nobody can see it, so the twinkles, blinks and flickers only run
 * near the viewport. A paused loop picks up where it stopped, so waking shows
 * no jump.
 */
export function sleepOffscreen(els: Element[]) {
  if (!('IntersectionObserver' in window)) return
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-asleep', !e.isIntersecting)),
    { rootMargin: '120px 0px' },
  )
  els.forEach((el) => io.observe(el))
}
