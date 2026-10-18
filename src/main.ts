import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initHero } from './hero'
import { initSky } from './sky'
import { initReveals, initWho } from './story'
import { initDay } from './day'
import { initFlock } from './flock'
import { initJoin } from './join'
import { initPortal } from './portal'

gsap.registerPlugin(ScrollTrigger)

const start = () => {
  initHero()
  initReveals()
  initWho()
  initDay()
  initFlock()
  initJoin()
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
