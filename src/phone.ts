import { gsap } from 'gsap'
import { $ } from './util'

/**
 * Phones: the scroll life a wide screen gets from its pins and hovers, done
 * the phone's way. Transforms and opacity only, scrubbed by ScrollTrigger so
 * every phone gets them (CSS scroll timelines don't reach older iPhones).
 */
export function initPhone() {
  footDrift()
  ticketSettle()
}

/**
 * The rooftop drifts a little behind the page as it scrolls by, as the far
 * view does from a moving train: the sign written in its sky keeps the page's
 * pace, the night moves slower. The picture is clipped to its own frame, and
 * its top is the night's colour and its foot fades into it, so the few
 * pixels it gives up at either edge never show.
 */
function footDrift() {
  const img = $<HTMLImageElement>('#footArt')
  const frame = img?.parentElement
  if (!img || !frame) return
  gsap.matchMedia().add('(max-width: 700px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.fromTo(
      img,
      { yPercent: -3 },
      { yPercent: 3, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.4 } },
    )
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
