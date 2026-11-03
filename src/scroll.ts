import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initSky } from './sky'
import { initReveals, initRules, initStatement } from './story'
import { initDay } from './day'
import { initFlock } from './flock'
import { initPhone } from './phone'
import { nextTask } from './util'

/**
 * The scroll layer: gsap, ScrollTrigger and every scene that moves with the scroll. None of it is
 * on the first screen, so it is a chunk of its own (main.ts fetches it at once, alongside the
 * entry, and starts it once the fonts are in).
 */
gsap.registerPlugin(ScrollTrigger)
// ScrollTrigger re-measures on DOMContentLoaded and on load by itself. Here the first comes before
// any trigger exists, and the second straight after start()'s own pass; load is handled below.
ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,resize' })

/** Set up every scene, in page order, each in a task of its own; then measure once. */
export async function start() {
  initReveals()
  await nextTask()
  initStatement()
  await nextTask()
  initDay()
  await nextTask()
  await initFlock()
  await nextTask()
  initRules()
  initPhone()
  await nextTask()
  // The sky (background colour + club clock) reads positions set up by the
  // sections above, so it goes last.
  initSky()
  await nextTask()
  ScrollTrigger.refresh()
  watchLayout()
  loadPortal()
}

/**
 * Anything that changes height after start (an FAQ answer opening, the next-Sunday lines arriving
 * from the app, an image or a late font when the page loads) moves every trigger below it, so
 * re-measure, or night falls on the join section early. (Before start, start's own pass covers it.)
 */
function watchLayout() {
  let relayout = 0
  const remeasure = () => {
    window.clearTimeout(relayout)
    relayout = window.setTimeout(() => ScrollTrigger.refresh(), 250)
  }
  // `toggle` doesn't bubble, hence the capture listener.
  document.addEventListener('toggle', remeasure, true)
  document.addEventListener('egg:relayout', remeasure)
  if (document.readyState === 'complete') return
  // when the page finishes loading, measure again only if it has changed height since
  let measured = document.documentElement.scrollHeight
  const note = () => (measured = document.documentElement.scrollHeight)
  ScrollTrigger.addEventListener('refresh', note)
  addEventListener(
    'load',
    () => {
      ScrollTrigger.removeEventListener('refresh', note)
      if (document.documentElement.scrollHeight !== measured) ScrollTrigger.refresh()
    },
    { once: true },
  )
}

// The night-shift game (and the portal that opens onto it) lives past the
// footer, so it is its own chunk: fetched as soon as the reader does anything
// (a scroll, a touch, a key), or when the page has long been idle, and sooner
// still if the reader is already heading down there. Its triggers sit below
// every other one, so a refresh once it's in is all the page needs; if the
// reader is mid-scroll, that waits for the scroll to stop, so it never costs
// a frame under their finger.
function loadPortal() {
  const portal = document.getElementById('portal')
  if (!portal) return
  const INTENT = ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const
  let requested = false
  const load = () => {
    if (requested) return
    requested = true
    io.disconnect()
    INTENT.forEach((type) => removeEventListener(type, load))
    import('./portal').then(async ({ initPortal }) => {
      initPortal()
      await nextTask()
      ScrollTrigger.refresh(true)
    })
  }
  const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && load(), {
    rootMargin: '150% 0px',
  })
  io.observe(document.getElementById('foot') ?? portal)
  INTENT.forEach((type) => addEventListener(type, load, { once: true, passive: true }))
  const idle = () => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(load) : load()), 6000)
  if (document.readyState === 'complete') idle()
  else addEventListener('load', idle, { once: true })
}
