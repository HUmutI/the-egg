import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { applyI18n, initLangToggle } from './i18n'
import { initHero } from './hero'
import { initLiveBadge } from './badge'
import { initDock } from './dock'
import { initSky } from './sky'
import { initReveals, initRules, initStatement } from './story'
import { initDay, renderDay } from './day'
import { initFlock } from './flock'
import { initPortal } from './portal'
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
  initPortal()
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
})

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
