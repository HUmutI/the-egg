import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { applyI18n, initLangToggle } from './i18n'
import { initHero } from './hero'
import { initLiveBadge } from './badge'
import { initDock } from './dock'
import { initSky } from './sky'
import { initReveals, initRules, initStatement } from './story'
import { initDay } from './day'
import { renderDay } from './dayplates'
import { initFlock } from './flock'
import { initNextSunday } from './next'
import { initShare } from './share'
import { installInkDefs } from './riso'
import { initPhone } from './phone'
// hero facts, FAQ, join ticket and share: new UI, kept out of main.css
import './styles/story.css'

gsap.registerPlugin(ScrollTrigger)

// The house ink (wobble, halftone, the shading mask) before anything draws with it.
installInkDefs()
// Translate the DOM before anything measures or animates it.
applyI18n()
initLangToggle()
// The day's scenes are drawn now, so the page has its final height before
// anything measures it.
renderDay()
initNextSunday()
initShare()
// The hero is a picture, not measured text: show it as soon as it decodes
// instead of waiting on the fonts below.
initHero()
initLiveBadge()
initDock()

const start = () => {
  initReveals()
  initStatement()
  initDay()
  initFlock()
  initRules()
  initPhone()
  // The sky (background colour + club clock) reads positions set up by the
  // sections above, so it goes last.
  initSky()
}

// Wait for fonts so measured layouts (pinning, perch position) are right,
// but never block for long.
Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => {
  start()
  ScrollTrigger.refresh()
  loadPortal()
})

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

// Anything that changes height after load (an FAQ answer opening, the
// next-Sunday lines arriving from the app) moves every trigger below it, so
// re-measure, or night falls on the join section early. `toggle` doesn't
// bubble, hence the capture listener.
let relayout = 0
const remeasure = () => {
  window.clearTimeout(relayout)
  relayout = window.setTimeout(() => ScrollTrigger.refresh(), 250)
}
document.addEventListener('toggle', remeasure, true)
document.addEventListener('egg:relayout', remeasure)

// iOS only shows :active (the press on buttons) once something listens for touches.
document.addEventListener('touchstart', () => {}, { passive: true })
