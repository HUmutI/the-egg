import { $ } from './util'

let dock: HTMLElement | null = null
/** What keeps the dock off screen: the elements in view that offer the same thing. */
const blockers = new Set<Element>()
const update = () => dock?.classList.toggle('is-away', blockers.size > 0)

/**
 * Phones: Apply (and send-to-a-friend) under the thumb. The dock waits until
 * the hero's own button has gone by, and steps aside wherever the page
 * already offers the same thing on screen — the day's way out, the join
 * section — and over the footer and the arcade, so it never doubles up or
 * sits on the night. CSS keeps it to phone widths.
 */
export function initDock() {
  dock = $<HTMLElement>('#dock')
  if (!dock) return

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) blockers.add(e.target)
        else blockers.delete(e.target)
      }
      update()
    },
    // the bottom margin lets it leave a little before the footer's crack arrives; the right one
    // is for the day's way out, the last card of a strip: showing at the screen's edge behind the
    // card in front, it isn't on screen yet (everything else watched here is as wide as the page)
    { rootMargin: '0px -20% 10% 0px' },
  )
  for (const sel of ['.hero__cta', '.day__end', '#built', '#join', '#foot', '#portal']) {
    const el = document.querySelector(sel)
    if (el) io.observe(el)
  }
}
