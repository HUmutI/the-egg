import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, PALETTE, clamp, clockState, reducedMotion } from './util'
import { sky as page } from './sky'

const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/**
 * The page through a phone's day, a colour to a frame, from the site's own pastels: butter
 * morning, lavender noon, mint afternoon, peach supper, pink at lights out (and on the way out).
 */
const SKY = [PALETTE.butter, mix(PALETTE.butter, PALETTE.lav, 0.45), PALETTE.lav, PALETTE.mint, PALETTE.peach, PALETTE.lav, PALETTE.pink, PALETTE.pink]
/** Where the whole sheet shows at once, the section is one calm colour. */
const CALM = PALETTE.lav
/** Who reads the sheet as a strip: a phone, narrow or on its side (main.css asks the same of the sheet). */
const STRIP = '(max-width: 760px), (max-height: 500px) and (orientation: landscape) and (hover: none)'

/**
 * "A day at the club": the programme from 10:30 to 18:30 as a storyboard, seven frames and the
 * way out on one sheet (index.html has the copy, dayplates.ts draws the scenes, main.css lays
 * the sheet out). Nothing pins and nothing follows the scroll.
 *
 * Wide screens show the whole sheet, and there is nothing to run: the page is one colour and
 * the club clock goes from doors to lights out across the section (sky.ts).
 *
 * Phones read the sheet as a strip you swipe through, a frame at a time, as they read the plate
 * of regulars (flock.ts). The programme line over it, seven eggs with their hours, is its index:
 * the egg of the frame in front is the one filled, the line is inked up to it, and a tap on an
 * egg brings its frame round. The frame in front also paints the page (morning cream to dusk
 * pink) and sets the club clock to its hour. The strip walks in from the right as it arrives.
 */
export function initDay() {
  const section = $('#day')
  const sheet = $('#daySheet')
  if (!section || !sheet) return
  const cards = $$<HTMLElement>('.frame', sheet)
  const ticks = $$<HTMLButtonElement>('.tick', section)
  const times = $$('.frame__time', sheet).map((t) => toMin(t.textContent ?? '10:30'))
  const root = document.documentElement
  const phone = matchMedia(STRIP)

  // The strip's geometry, measured when it changes size rather than on every scroll frame: reading
  // it after a class was written would lay the page out again, mid-frame.
  let stepPx = 1
  let maxLeft = 0
  let left = 0
  const measure = () => {
    stepPx = Math.max(1, (cards[1]?.offsetLeft ?? 1) - (cards[0]?.offsetLeft ?? 0))
    maxLeft = sheet.scrollWidth - sheet.clientWidth
    left = sheet.scrollLeft
  }
  // (the way out can't reach the strip's start: at the end of the strip, it is the one in front)
  const at = () => (maxLeft > 0 && left > maxLeft - 4 ? cards.length - 1 : clamp(Math.round(left / stepPx), 0, cards.length - 1))

  /** The frame in front (the way out is the one after the last step), or -1 where the whole sheet shows. */
  let shown = -2
  const update = () => {
    const i = phone.matches ? at() : -1
    if (i === shown) return
    shown = i
    ticks.forEach((t, k) => {
      if (k === i) t.setAttribute('aria-current', 'step')
      else t.removeAttribute('aria-current')
      t.classList.toggle('is-past', k < i)
    })
    // the page takes the frame's colour, and the club clock its hour (lights out is lights out:
    // the way out keeps the last one)
    const color = i < 0 ? CALM : SKY[i]
    section.dataset.sky = color
    if (root.dataset.sky === 'day') gsap.to(page, { c: color, duration: 0.9, ease: 'power2.out', overwrite: true })
    clockState.dayMinutes = i < 0 ? null : times[Math.min(i, times.length - 1)]
    clockState.onChange()
  }

  section.addEventListener('click', (e) => {
    const i = Number((e.target as HTMLElement).closest<HTMLElement>('.tick')?.dataset.i ?? -1)
    if (i >= 0) sheet.scrollTo({ left: i * stepPx, behavior: reducedMotion() ? 'auto' : 'smooth' })
  })
  let frame = 0
  sheet.addEventListener(
    'scroll',
    () => {
      left = sheet.scrollLeft
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    },
    { passive: true },
  )
  // back on a wide screen the whole sheet shows, and nobody is in front
  phone.addEventListener('change', update)
  new IntersectionObserver(
    (entries, io) => {
      if (!entries.some((e) => e.isIntersecting)) return
      sheet.classList.add('is-in')
      io.disconnect()
    },
    { threshold: 0.2 },
  ).observe(sheet)
  // (its first call comes once the sheet is laid out)
  const ro = new ResizeObserver(() => {
    measure()
    update()
  })
  ;[sheet, cards[0], cards[cards.length - 1]].forEach((el) => el && ro.observe(el))

  // The day's own stretch of the page, for the club clock (sky.ts). Where the whole sheet shows,
  // the section: 10:30 where it takes the sky, lights out where it gives it up. On a phone, the
  // strip: from when it comes up the screen until it has gone under the nav, the clock is its.
  const nav = $('#nav')
  let whole: ScrollTrigger | undefined
  let strip: ScrollTrigger | undefined
  const stretch = () => {
    const st = phone.matches ? strip : whole
    // (made mid-resize, a trigger has no end until the refresh that follows, which comes back here)
    if (!st || !Number.isFinite(st.end)) return
    clockState.dayStart = st.start
    clockState.dayEnd = st.end
  }
  whole = ScrollTrigger.create({ trigger: section, start: 'top 55%', end: 'bottom 55%', onRefresh: stretch })
  strip = ScrollTrigger.create({ trigger: sheet, start: 'top bottom', end: () => `bottom ${nav.offsetHeight}px`, onRefresh: stretch })
  phone.addEventListener('change', stretch)
  stretch()
  update()
}
