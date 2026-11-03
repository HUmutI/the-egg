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
  // Putting a section to sleep restyles everything in it, and the first report has nearly every
  // section off screen: put together, that is one long frame. So those first sleeps go one
  // section a frame (nobody sees a section off screen a few frames longer awake); waking, and
  // every later report, is at once.
  const first = new Set(els)
  const queue: Element[] = []
  const drowse = () => {
    const el = queue.shift()
    if (el && first.delete(el)) el.classList.add('is-asleep')
    if (queue.length) requestAnimationFrame(drowse)
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target, isIntersecting }) => {
        if (first.has(target) && !isIntersecting) {
          if (queue.push(target) === 1) requestAnimationFrame(drowse)
          return
        }
        first.delete(target)
        target.classList.toggle('is-asleep', !isIntersecting)
      }),
    { rootMargin: '120px 0px' },
  )
  els.forEach((el) => io.observe(el))
}

/**
 * Hand the main thread back (to input, to a frame) before going on, so long boot work runs as
 * several short tasks instead of one long one. scheduler.yield() resumes ahead of other queued
 * work; elsewhere a new task does.
 */
export const nextTask = (): Promise<void> => {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler
  return s?.yield ? s.yield() : new Promise((r) => setTimeout(r, 0))
}

/**
 * Hold an element that will pin in a spacer of our own, a `.pin-hold` (main.css), put around it
 * before ScrollTrigger needs one (holdFor finds it). ScrollTrigger takes its own spacer out of the
 * page on every refresh, with the scene in it, and puts the scene back, and a scene put back is
 * styled and laid out anew, every element in it. One that stays in its holder is only restyled.
 */
export const holdPin = (el: Element | null, kind: string) => {
  if (!el?.parentElement) return
  const hold = document.createElement('div')
  hold.className = `pin-hold pin-hold--${kind}`
  el.before(hold)
  hold.append(el)
}

/**
 * The spacer a pin is held in (holdPin), else none, and ScrollTrigger makes its own. (A holder may
 * be a flex box, and ScrollTrigger leaves out the spacing under a pin whose parent is one unless
 * told, so a pin held in one asks for it: `pinSpacing: true`.)
 */
export const holdFor = (el: Element) => {
  const p = el.parentElement
  return p?.classList.contains('pin-hold') ? p : undefined
}

/**
 * Write an attribute only when it changes. A browser restyles (and an SVG lays out and repaints)
 * an element on every setAttribute, even one that writes what is already there; most of what the
 * scroll moves stands still on most frames.
 */
export const put = (el: Element, name: string, value: string) => {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value)
}
