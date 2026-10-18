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
  $$('.reveal, .strikes, .rule--first, .rules').forEach((el) => io.observe(el))
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

  const tokens: HTMLElement[] = []
  const split = (node: Node) => {
    const parts = (node.textContent ?? '').split(/(\s+)/)
    const frag = document.createDocumentFragment()
    for (const part of parts) {
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
  for (const node of Array.from(st.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) split(node)
    else if (node instanceof HTMLElement) {
      if (node.classList.contains('st__quiet')) Array.from(node.childNodes).forEach(split)
      else {
        node.classList.add('tok')
        tokens.push(node)
      }
    }
  }

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

/** Who comes: hover (or tap) a name and the caption line explains them. */
export function initWho() {
  const list = $('#whoList')
  if (!list) return
  const who = $('#who')
  $$<HTMLLIElement>('li', list).forEach((li, i) => li.style.setProperty('--i', String(i)))
  new IntersectionObserver(
    ([e], io) => {
      if (!e.isIntersecting) return
      who.classList.add('is-in')
      io.disconnect()
    },
    { threshold: 0.3 },
  ).observe(who)
  const k = $('#whoK')
  const v = $('#whoV')
  const names = $$<HTMLButtonElement>('.who__n', list)
  if (!matchMedia('(hover: hover)').matches) k.textContent = 'tap a name'
  const def = [k.textContent, v.textContent]
  const show = (b: HTMLButtonElement | null) => {
    names.forEach((n) => n.classList.toggle('is-on', n === b))
    k.textContent = b ? b.textContent!.replace(/\.$/, '') : def[0]
    v.textContent = b ? `— ${b.dataset.note}` : def[1]
  }
  names.forEach((b) => {
    b.addEventListener('pointerenter', () => show(b))
    b.addEventListener('focus', () => show(b))
    b.addEventListener('click', () => show(b))
  })
  list.addEventListener('pointerleave', () => show(null))
}
