import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, clamp, reducedMotion, sleepOffscreen } from './util'

/** Fade-ups, played once as each comes into view. */
export function initReveals() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('is-in')
        io.unobserve(e.target)
      }
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
  )
  $$('.reveal').forEach((el) => io.observe(el))
  // every section's loops (and the arcade's flicker) rest while it's off screen
  sleepOffscreen($$('[data-bg], #portal'))
}

/**
 * Split an element's text into word spans (`.tok`) so they can be read in
 * one by one. Elements matching `units` (chips, highlights) stay whole and
 * count as a single token; other inline elements (italics) keep their
 * styling and have their words split inside.
 * A word is `.tok.tok--w > .tok__ink`: the faint word waiting to be read is
 * the outer span's background clipped to the glyphs (main.css), and the ink
 * fades in over it from 0, so the faint state is decoration, not text that
 * fails contrast.
 */
const UNITS = '.chip, .hl'
function tokenize(root: HTMLElement): HTMLElement[] {
  const tokens: HTMLElement[] = []
  const split = (node: Node) => {
    const frag = document.createDocumentFragment()
    for (const part of (node.textContent ?? '').split(/(\s+)/)) {
      if (!part) continue
      if (/^\s+$/.test(part)) frag.append(part)
      else {
        const w = document.createElement('span')
        w.className = 'tok tok--w'
        const ink = document.createElement('span')
        ink.className = 'tok__ink'
        ink.textContent = part
        w.append(ink)
        frag.append(w)
        tokens.push(w)
      }
    }
    node.parentNode!.replaceChild(frag, node)
  }
  const walk = (el: Element) => {
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) split(node)
      else if (node instanceof HTMLElement) {
        if (node.matches(UNITS)) {
          node.classList.add('tok')
          tokens.push(node)
        } else walk(node)
      }
    }
  }
  walk(root)
  return tokens
}

/**
 * The statement: one sentence in the page's own flow. Nothing pins and nothing follows the
 * scroll: each word inks in once, as its line comes up the screen, left to right along the
 * line, and the highlighter goes over its words a beat later (main.css plays it from `.is-in`
 * and `--d`). The sentence waits faint only if it is still below the screen when this runs: a
 * page that opens on it (a #link) shows it inked and only the strokes draw; a reload lands
 * there after this has run (keepPlace in util.ts), so it plays once on arriving.
 */
export function initStatement() {
  const st = $('#statement')
  if (!st || reducedMotion()) return

  const tokens = tokenize(st)
  const ink = (t: HTMLElement, delay = 0) => {
    t.style.setProperty('--d', `${delay.toFixed(2)}s`)
    t.classList.add('is-in')
  }
  if (!('IntersectionObserver' in window) || st.getBoundingClientRect().top < innerHeight * 0.9) {
    tokens.forEach((t) => ink(t))
    return
  }

  st.classList.add('is-armed')
  const io = new IntersectionObserver(
    (entries) => {
      const box = st.getBoundingClientRect()
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const t = e.target as HTMLElement
        // (a line's words arrive together: the further along the line, the later, a third of a second across)
        ink(t, (clamp(e.boundingClientRect.left - box.left, 0, box.width) / (box.width || 1)) * 0.34)
        io.unobserve(t)
      }
    },
    // a word is read in once it stands clear of the foot of the screen (and of a phone's dock)
    { rootMargin: '0px 0px -14% 0px' },
  )
  tokens.forEach((t) => io.observe(t))
}

/**
 * The house rules: when the list comes into view the four rules fade in one
 * after another, then "do not" gets struck out and the hand-written DO
 * appears above it. Played once, not scrubbed to the scroll. On phones the
 * four rules are taller than the screen, so each one plays as it arrives:
 * it inks in as it comes up from under the dock (never a faint rule waiting
 * at the foot of the screen), and the correction waits until the first rule
 * is well in view.
 */
export function initRules() {
  const section = $('#rules')
  if (!section) return
  const rules = $$<HTMLLIElement>('.rule', section)
  if (reducedMotion()) {
    section.classList.add('is-read')
    return
  }

  const lines = rules.map((rule) => rule.querySelectorAll('.rule__num, .rule__n, p'))
  // The rules go faint only once the reader is a screen away from them (or further down), so
  // nobody sees them change, and a page read from the top holds no faint text waiting below.
  // (Made before the play triggers, so on a page that opens further down it fires first. A page
  // that may open at them is faint from the first paint: .dim-ahead in main.css. One scrolled to
  // them before this ran shows them inked; they don't go faint in front of the reader.)
  const dimAhead = document.documentElement.classList.contains('dim-ahead')
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom+=100%',
    end: 'max',
    once: true,
    onEnter: () => {
      if (!dimAhead && section.getBoundingClientRect().top < innerHeight) return
      lines.forEach((l) => gsap.set(l, { opacity: 0.14 }))
    },
  })
  const tl = gsap.timeline({ paused: true })
  lines.forEach((l, i) => tl.to(l, { opacity: 1, duration: 0.5, ease: 'power2.out' }, i * 0.22))
  const fix = section.querySelector('.rule__fix')
  if (fix) {
    tl.to(fix, { '--s': 1, duration: 0.6, ease: 'power2.out' }, 0.35)
    tl.to(fix, { '--d': 1, duration: 0.5, ease: 'back.out(2.4)' }, 0.8)
  }

  gsap.matchMedia()
    .add('(min-width: 861px)', () => {
      // (the list, not the section: its title stands over it, and the rules play as they come up)
      ScrollTrigger.create({ trigger: $('.rules__list', section), start: 'top 82%', once: true, onEnter: () => tl.play() })
    })
    .add('(max-width: 860px)', () => {
      rules.forEach((rule, i) => {
        const ink = gsap.to(lines[i], { opacity: 1, duration: 0.5, ease: 'power2.out', paused: true })
        ScrollTrigger.create({ trigger: rule, start: 'top bottom-=24px', once: true, onEnter: () => ink.play() })
        if (fix && rule.contains(fix)) {
          const correct = gsap.timeline({ paused: true })
          correct.to(fix, { '--s': 1, duration: 0.6, ease: 'power2.out' })
          correct.to(fix, { '--d': 1, duration: 0.5, ease: 'back.out(2.4)' }, 0.45)
          ScrollTrigger.create({ trigger: rule, start: 'top 72%', once: true, onEnter: () => correct.play() })
        }
      })
    })
}
