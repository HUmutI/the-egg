import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, reducedMotion } from './util'

/** Fade-ups, the hand-drawn strikethroughs and the first-rule correction. */
export function initReveals() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const el = e.target as HTMLElement
        el.classList.add(el.classList.contains('strikes') ? 'is-struck' : 'is-in')
        io.unobserve(el)
      }
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
  )
  $$('.reveal, .strikes').forEach((el) => io.observe(el))
}

/**
 * Split an element's text into word spans (`.tok`) so they can be read in
 * one by one. Elements matching `units` (chips, highlights, the struck-out
 * correction…) stay whole and count as a single token; other inline
 * elements (italics) keep their styling and have their words split inside.
 */
const UNITS = '.chip, .hl, .rule__fix, strong'
function tokenize(root: HTMLElement): HTMLElement[] {
  const tokens: HTMLElement[] = []
  const split = (node: Node) => {
    const frag = document.createDocumentFragment()
    for (const part of (node.textContent ?? '').split(/(\s+)/)) {
      if (!part) continue
      if (/^\s+$/.test(part)) frag.append(part)
      else {
        const w = document.createElement('span')
        w.className = 'tok'
        w.textContent = part
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
 * Scene one: the statement sits faint on its own screen and darkens word by
 * word as you scroll; the highlighter strokes draw in as their words arrive.
 * On wide screens the scene holds still (pinned) while it reads itself.
 */
export function initStatement() {
  const stage = $('#whatStage')
  const st = $('#statement')
  if (!stage || !st || reducedMotion()) return

  const tokens = tokenize(st)

  const tl = gsap.timeline({ defaults: { ease: 'none' } })
  tokens.forEach((t, i) => {
    tl.to(t, { opacity: 1, duration: 1 }, i * 0.55)
    if (t.classList.contains('hl')) tl.to(t, { '--p': '100%', duration: 1.4 }, i * 0.55 + 0.3)
  })
  tl.to('.what__cue', { opacity: 0, duration: 1 }, '>-1')
  // Hold the finished sentence for the last quarter of the pin, so the
  // final words have landed before the scene scrolls away.
  tl.to({}, { duration: tl.duration() / 3 })

  gsap.matchMedia()
    .add('(min-width: 861px)', () => {
      ScrollTrigger.create({ trigger: stage, pin: true, start: 'top top', end: '+=70%', scrub: 0.2, animation: tl })
    })
    .add('(max-width: 860px)', () => {
      ScrollTrigger.create({ trigger: st, start: 'top 85%', end: 'bottom 40%', scrub: 0.2, animation: tl })
    })
}

/**
 * The house rules: when the list comes into view the four rules fade in one
 * after another, then "do not" gets struck out and the hand-written DO
 * appears above it. Played once, not scrubbed to the scroll.
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
  lines.forEach((l) => gsap.set(l, { opacity: 0.14 }))
  const tl = gsap.timeline({ paused: true })
  lines.forEach((l, i) => tl.to(l, { opacity: 1, duration: 0.5, ease: 'power2.out' }, i * 0.22))
  const fix = section.querySelector('.rule__fix')
  if (fix) {
    tl.to(fix, { '--s': 1, duration: 0.6, ease: 'power2.out' }, 0.35)
    tl.to(fix, { '--d': 1, duration: 0.5, ease: 'back.out(2.4)' }, 0.8)
  }

  ScrollTrigger.create({ trigger: section, start: 'top 65%', once: true, onEnter: () => tl.play() })
}
