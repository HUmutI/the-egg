import { initHero } from './hero'
import { initLiveBadge } from './badge'
import { initDock } from './dock'
import { initNextSunday } from './next'
import { initShare } from './share'
import { installInkDefs } from './riso'
import { keepPlace } from './util'
// hero facts, FAQ, join ticket and share: new UI, kept out of main.css
import './styles/story.css'

// Everything that moves with the scroll (gsap, ScrollTrigger, the scenes) is its own chunk,
// below the first screen: fetch it now, in parallel with this one, and run it further down.
const scroll = import('./scroll')
// A reload or a step back lands where the reader was, once the scroll layer has measured the page.
const backToPlace = keepPlace()

// The house ink's shared defs (the halftone the regulars stand on) before anything draws with it.
installInkDefs()
initNextSunday()
initShare()
// The hero is a picture, not measured text: show it as soon as it decodes
// instead of waiting on the fonts below.
initHero()
initLiveBadge()
initDock()

// Wait for fonts so what the scroll layer measures is right, but never block for long.
const fonts = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))])
Promise.all([scroll, fonts])
  .then(([{ start }]) => start())
  // Without the scroll layer (its chunk never arrived, or a scene threw), what waits for it (the
  // fade-ups, a phone's day strip walking in, the house rules dimmed ahead) would wait for ever:
  // the page falls back to how it reads without script, where all of it simply stands there.
  .catch((err) => {
    document.documentElement.classList.remove('js')
    console.error(err)
  })
  .finally(backToPlace)

// iOS only shows :active (the press on buttons) once something listens for touches.
document.addEventListener('touchstart', () => {}, { passive: true })
