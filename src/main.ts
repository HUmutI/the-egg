import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { applyI18n, initLangToggle } from './i18n'
import { initHero } from './hero'
import { initSky } from './sky'
import { initReveals, initRules, initStatement } from './story'
import { initDay } from './day'
import { initFlock } from './flock'
import { initPortal } from './portal'
import { initNextSunday } from './next'

gsap.registerPlugin(ScrollTrigger)

// Translate the DOM before anything measures or animates it.
applyI18n()
initLangToggle()
initNextSunday()
// The hero is a picture, not measured text: show it as soon as it decodes
// instead of waiting on the fonts below.
initHero()

const start = () => {
  initReveals()
  initStatement()
  initDay()
  initFlock()
  initRules()
  initPortal()
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
