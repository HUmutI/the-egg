import { initHero } from './hero'
import { initLiveBadge } from './badge'
import { initDock } from './dock'
import { renderDay } from './dayplates'
import { initNextSunday } from './next'
import { initShare } from './share'
import { installInkDefs } from './riso'
import { keepPlace, nextTask } from './util'
// hero facts, FAQ, join ticket and share: new UI, kept out of main.css
import './styles/story.css'

// Everything that moves with the scroll (gsap, ScrollTrigger, the scenes) is its own chunk,
// below the first screen: fetch it now, in parallel with this one, and run it further down.
const scroll = import('./scroll')
// A reload or a step back lands where the reader was, once the scroll layer has measured the page.
const backToPlace = keepPlace()

// The house ink (wobble, halftone, the shading mask) before anything draws with it.
installInkDefs()
initNextSunday()
initShare()
// The hero is a picture, not measured text: show it as soon as it decodes
// instead of waiting on the fonts below.
initHero()
initLiveBadge()
initDock()

// The day's scenes are drawn next, in a task of their own, so the page has
// its final height before anything measures it.
const drawn = nextTask().then(renderDay)

// Wait for fonts so measured layouts (pinning, perch position) are right,
// but never block for long.
const fonts = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))])
Promise.all([scroll, drawn, fonts])
  .then(([{ start }]) => start())
  .then(backToPlace)

// iOS only shows :active (the press on buttons) once something listens for touches.
document.addEventListener('touchstart', () => {}, { passive: true })
