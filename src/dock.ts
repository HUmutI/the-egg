import { $ } from './util'

/**
 * Phones: Apply (and send-to-a-friend) under the thumb. The dock waits until
 * the hero's own button has gone by, and steps aside wherever the page
 * already offers the same thing on screen — the day's last frame, the join
 * section — and over the footer and the arcade, so it never doubles up or
 * sits on the night. CSS keeps it to phone widths.
 */
export function initDock() {
  const dock = $('#dock')
  if (!dock) return

  const blockers = new Set<Element>()
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) blockers.add(e.target)
        else blockers.delete(e.target)
      }
      dock.classList.toggle('is-away', blockers.size > 0)
    },
    // the bottom margin lets it leave a little before the footer's crack arrives
    { rootMargin: '0px 0px 10% 0px' },
  )
  for (const sel of ['.hero__cta', '.day__end', '#join', '#foot', '#portal']) {
    const el = document.querySelector(sel)
    if (el) io.observe(el)
  }
}
