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

  gsap.matchMedia()
    .add('(min-width: 861px)', () => {
      ScrollTrigger.create({ trigger: stage, pin: true, start: 'top top', end: '+=110%', scrub: 0.6, animation: tl })
    })
    .add('(max-width: 860px)', () => {
      ScrollTrigger.create({ trigger: st, start: 'top 85%', end: 'bottom 40%', scrub: 0.6, animation: tl })
    })
}

/**
 * The house rules, read the same way: the scene holds still while each rule
 * darkens word by word. When rule one is finished, "do not" gets struck out
 * and the hand-written DO appears above it.
 */
export function initRules() {
  const section = $('#rules')
  if (!section) return
  const rules = $$<HTMLLIElement>('.rule', section)
  if (reducedMotion()) {
    section.classList.add('is-read')
    return
  }

  const tl = gsap.timeline({ defaults: { ease: 'none' } })
  let t = 0
  rules.forEach((rule) => {
    const p = rule.querySelector('p')!
    const tokens = tokenize(p)
    const meta = rule.querySelectorAll('.rule__num, .rule__n')
    tl.to(meta, { opacity: 1, duration: 0.8 }, t)
    t += 0.4
    tokens.forEach((tok, i) => tl.to(tok, { opacity: 1, duration: 1 }, t + i * 0.45))
    t += tokens.length * 0.45 + 0.6
    const fix = rule.querySelector('.rule__fix')
    if (fix) {
      tl.to(fix, { '--s': 1, duration: 1.2, ease: 'power2.out' }, t)
      tl.to(fix, { '--d': 1, duration: 1, ease: 'back.out(2.4)' }, t + 0.9)
      t += 2
    }
    t += 0.4
  })

  gsap.matchMedia()
    .add('(min-width: 861px)', () => {
      ScrollTrigger.create({ trigger: section, pin: true, start: 'top top', end: '+=170%', scrub: 0.6, animation: tl })
    })
    .add('(max-width: 860px)', () => {
      ScrollTrigger.create({ trigger: section, start: 'top 80%', end: 'bottom 95%', scrub: 0.6, animation: tl })
    })
}
