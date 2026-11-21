export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T

export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll(sel)) as T[]

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

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

/**
 * Shared clock state. The day (day.ts) publishes its stretch of the page, `dayStart` to `dayEnd`,
 * which the club clock (sky.ts) runs from doors to lights out; and, on a phone, the hour of the
 * frame in front (`dayMinutes`, else null), which the clock shows instead while the day is on screen.
 */
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
 * Write an attribute only when it changes. A browser restyles (and an SVG lays out and repaints)
 * an element on every setAttribute, even one that writes what is already there; most of what the
 * scroll moves stands still on most frames.
 */
export const put = (el: Element, name: string, value: string) => {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value)
}

/**
 * Where a reload, or a step back to the page, should land: where the reader was. Left to itself the
 * browser puts them back while the page is still short (the plate of regulars isn't drawn yet), so
 * what is drawn in afterwards carries them somewhere else. So while the page starts the browser is
 * told to leave the scroll alone (`scrollRestoration`), the place is kept here (on pagehide), and
 * the function this returns, once everything is measured, goes back to it (unless the reader has
 * moved the page meanwhile) and hands scrolling back to the browser (a #link and back again, say).
 *
 * A first visit by a #link has the same trouble: the browser lands on the target while the page
 * is still short, and one that doesn't hold the place as the drawings arrive above it (Safari has
 * no scroll anchoring) ends up short of it. So the target is found again at the same moment.
 */
export const keepPlace = (): (() => void) => {
  const KEY = 'eggclub:y'
  const hist = 'scrollRestoration' in history
  if (hist) history.scrollRestoration = 'manual'
  addEventListener('pagehide', () => {
    try {
      sessionStorage.setItem(KEY, String(Math.round(scrollY)))
    } catch {}
  })
  let y = 0
  let target: HTMLElement | null = null
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav?.type === 'reload' || nav?.type === 'back_forward') y = Number(sessionStorage.getItem(KEY)) || 0
    if (!y && location.hash) target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
  } catch {}
  const INTENT = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
  let moved = false
  const mark = () => (moved = true)
  if (y || target) INTENT.forEach((type) => addEventListener(type, mark, { capture: true, passive: true }))
  return () => {
    if (y || target) {
      INTENT.forEach((type) => removeEventListener(type, mark, { capture: true }))
      if (!moved && y && Math.abs(scrollY - y) > 1) scrollTo({ top: y, behavior: 'instant' })
      else if (!moved && target) target.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
    // (index.html's first script takes the smooth scroll away while a #link lands)
    document.documentElement.style.removeProperty('scroll-behavior')
    if (hist) history.scrollRestoration = 'auto'
  }
}
