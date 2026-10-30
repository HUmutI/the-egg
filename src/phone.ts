import { gsap } from 'gsap'
import { $ } from './util'

/**
 * Phones: the scroll life a wide screen gets from its pins and hovers, done
 * the phone's way. Transforms and opacity only, scrubbed by ScrollTrigger so
 * every phone gets them (CSS scroll timelines don't reach older iPhones).
 */
export function initPhone() {
  footPan()
  ticketSettle()
}

/**
 * The rooftop is wider than a phone, so the view drifts across it as it
 * scrolls by: in from the friends on the cushions, settled on the skyline
 * (the castle, Anıtkabir and Atakule) while it's all on screen, out past
 * Atakule to the cat on the wall. --pan is how far across the picture the
 * frame is (main.css turns it into a translate).
 */
function footPan() {
  const img = $<HTMLImageElement>('#footArt')
  if (!img) return
  gsap.matchMedia().add('(max-width: 700px) and (prefers-reduced-motion: no-preference)', () => {
    gsap
      .timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 0.4 } })
      .fromTo(img, { '--pan': 0.24 }, { '--pan': 0.485, duration: 0.3 })
      .to(img, { '--pan': 0.485, duration: 0.4 })
      .to(img, { '--pan': 0.76, duration: 0.3 })
  })
}

/** The ticket for the next Sunday lands on the table as it comes up, and settles at its usual tilt. */
function ticketSettle() {
  const ticket = $('#ticket')
  if (!ticket) return
  gsap.matchMedia().add('(max-width: 860px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.fromTo(
      ticket,
      { rotation: -5, y: 32 },
      { rotation: -1.2, y: 0, ease: 'none', scrollTrigger: { trigger: ticket, start: 'top bottom', end: 'top 58%', scrub: 0.4 } },
    )
  })
}
