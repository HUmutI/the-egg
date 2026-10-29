import { $ } from './util'

/**
 * The "this site is updating itself" badge stays out of the way: it waits
 * until the hero (poster and logo strip) has gone by, steps aside while you scroll and
 * whenever the footer or the arcade is on screen, and says its line once,
 * the first time it settles in (hover or focus says it again).
 */
export function initLiveBadge() {
  const badge = $<HTMLAnchorElement>('.live-badge')
  if (!badge) return

  const blockers = new Set<Element>()
  let scrolling = false
  let peeked = false
  let idle = 0

  const update = () => {
    const away = scrolling || blockers.size > 0
    badge.classList.toggle('is-away', away)
    if (!away && !peeked) {
      peeked = true
      badge.classList.add('is-peek')
      window.setTimeout(() => badge.classList.remove('is-peek'), 3400)
    }
  }

  // Start away; the observer's first report decides where it stands.
  badge.classList.add('is-away')

  // The bottom margin hides it a little before the footer arrives, so the
  // two never overlap on the way down.
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) blockers.add(e.target)
        else blockers.delete(e.target)
      }
      update()
    },
    { rootMargin: '0px 0px 15% 0px' },
  )
  for (const sel of ['#top', '#foot', '#portal']) {
    const el = document.querySelector(sel)
    if (el) io.observe(el)
  }

  addEventListener(
    'scroll',
    () => {
      if (!scrolling) {
        scrolling = true
        update()
      }
      clearTimeout(idle)
      idle = window.setTimeout(() => {
        scrolling = false
        update()
      }, 700)
    },
    { passive: true },
  )
}
