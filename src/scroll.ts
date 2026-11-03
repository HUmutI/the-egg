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
  initFlock()
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
// footer, so it is its own chunk: fetched once the page is idle, or sooner
// if the reader is already heading down there. Its triggers sit below every
// other one, so a refresh once it's in is all the page needs.
function loadPortal() {
  const portal = document.getElementById('portal')
  if (!portal) return
  let requested = false
  const load = () => {
    if (requested) return
    requested = true
    io.disconnect()
    import('./portal').then(({ initPortal }) => {
      initPortal()
      ScrollTrigger.refresh()
    })
  }
  const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && load(), {
    rootMargin: '150% 0px',
  })
  io.observe(document.getElementById('foot') ?? portal)
  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 4000 })
  else setTimeout(load, 2500)
}
