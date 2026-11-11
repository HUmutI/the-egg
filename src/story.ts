import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, nextTask, reducedMotion, sleepOffscreen } from './util'

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
 * one by one. Elements matching `units` (chips, highlights, the struck-out
 * correction…) stay whole and count as a single token; other inline
 * elements (italics) keep their styling and have their words split inside.
 * A word is `.tok.tok--w > .tok__ink`: the faint word waiting to be read is
 * the outer span's background clipped to the glyphs (main.css), and the ink
 * fades in over it from 0, so the faint state is decoration, not text that
 * fails contrast.
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
 * Scene one: the statement sits faint on its own screen and darkens word by
 * word as you scroll; the highlighter strokes draw in as their words arrive.
 * The scene holds still (pinned) while it reads itself: on wide screens from
 * the top, on phones held upright just under the nav, the sentence set as
 * large as the screen holds so it fills the scene to its foot. A phone on
 * its side is too short to hold it, so there it reads as it scrolls by.
 */
export async function initStatement() {
  const stage = $('#whatStage')
  const st = $('#statement')
  if (!stage || !st || reducedMotion()) return

  const tokens = tokenize(st)
  // (the indices of the words among the tokens, so a copy's words can be found again)
  const words = tokens.flatMap((t, i) => (t.matches(UNITS) ? [] : [i]))
  const sizer = statementSizer(stage, st, words)
  // A phone held upright sets the sentence to fill its stage, a search that lays the sentence out
  // nine times over: done ahead, a few tries a task, it is waiting when the scene is set up.
  if (matchMedia(PORTRAIT).matches) await sizer.prepare()

  const tl = gsap.timeline({ defaults: { ease: 'none' } })
  tokens.forEach((t, i) => {
    // (a word: its ink over the faint copy, 0 → 1 over 0.14 reads as 0.14 → 1; once inked
    // the faint copy goes, so the read word is exactly the ink)
    const ink = t.firstElementChild
    if (t.classList.contains('tok--w') && ink) {
      tl.to(ink, { opacity: 1, duration: 1 }, i * 0.55)
      tl.set(t, { '--g': '0%' }, i * 0.55 + 1)
    } else tl.to(t, { opacity: 1, duration: 1 }, i * 0.55)
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
    .add(PORTRAIT, () => {
      // the stage is a screen tall under the nav (main.css), so it holds there.
      // (refreshPriority: see the day's pin in day.ts)
      const nav = $('#nav')
      // The sentence takes the stage's height under its running head, at the largest size that
      // fits it without breaking a word, so the scene has no empty foot to leave behind when it
      // lets go. Measured again on every refresh (a turned phone, the other language).
      const fit = sizer.fit
      fit()
      ScrollTrigger.addEventListener('refreshInit', fit)
      ScrollTrigger.create({
        trigger: stage,
        pin: true,
        start: () => `top ${nav.offsetHeight}px`,
        end: '+=75%',
        scrub: 0.2,
        anticipatePin: 1,
        refreshPriority: 1,
        invalidateOnRefresh: true,
        animation: tl,
      })
      return () => {
        ScrollTrigger.removeEventListener('refreshInit', fit)
        sizer.forget()
        st.style.removeProperty('font-size')
      }
    })
    .add('(max-width: 860px) and (orientation: landscape)', () => {
      ScrollTrigger.create({ trigger: st, start: 'top 85%', end: 'bottom 40%', scrub: 0.2, animation: tl })
    })
}

/** Phones and tablets held upright: the statement pins under the nav, set to fill the stage. */
const PORTRAIT = '(max-width: 860px) and (orientation: portrait)'

/**
 * The size that sets the statement to fill its stage: the largest that fits the stage's height
 * under its running head without breaking a word. `fit` sets it, measuring again only when the
 * answer can change (and every refresh asks: a turned phone, the other language, the fonts
 * arriving); `prepare` runs the same search ahead of time, a few tries a task, for `fit` to find.
 */
function statementSizer(stage: HTMLElement, st: HTMLElement, words: number[]) {
  let last = ''
  let size = ''
  /** What the answer depends on: the stage's size, its padding, the sentence's width, the fonts. */
  const room = () => {
    // (the stage grows with the sentence, and holds its size while pinned: the room is a
    // screen under the nav, its min-height, less the running head's row)
    const cs = getComputedStyle(stage)
    const pad = parseFloat(getComputedStyle(st).paddingTop) || 0
    const head = parseFloat(cs.gridTemplateRows) || 0
    const room = parseFloat(cs.minHeight) - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - head - pad
    return { pad, room, key: [stage.clientWidth, room, document.fonts.status].join() }
  }
  /** The search, one try a step. */
  function* search(pad: number, room: number) {
    // Search on a hidden copy laid over the stage, out of the page's flow: each try then lays out
    // the copy alone, not the whole page below it. (It keeps the sentence's own classes, so its
    // grid area, width and type are the sentence's.)
    const copy = st.cloneNode(true) as HTMLElement
    copy.removeAttribute('id')
    copy.setAttribute('aria-hidden', 'true')
    copy.style.cssText = 'position:absolute;left:0;right:0;top:0;visibility:hidden;contain:layout style;pointer-events:none'
    stage.append(copy)
    try {
      const toks = copy.querySelectorAll('.tok')
      const copyWords = words.map((i) => toks[i])
      let [lo, hi] = [30, Math.min(96, stage.clientWidth * 0.19)]
      for (let i = 0; i < 9; i++) {
        const f = (lo + hi) / 2
        copy.style.fontSize = `${f}px`
        if (copy.offsetHeight - pad <= room && copyWords.every((w) => w.getClientRects().length < 2)) lo = f
        else hi = f
        yield
      }
      return `${lo.toFixed(1)}px`
    } finally {
      copy.remove()
    }
  }
  return {
    fit() {
      const { pad, room: r, key } = room()
      if (key !== last) {
        const steps = search(pad, r)
        let step = steps.next()
        while (!step.done) step = steps.next()
        last = key
        size = step.value
      }
      st.style.fontSize = size
    },
    async prepare() {
      const { pad, room: r, key } = room()
      const steps = search(pad, r)
      let step = steps.next()
      for (let n = 1; !step.done; n++) {
        if (n % 3 === 0) await nextTask()
        step = steps.next()
      }
      // (kept only if nothing it depends on changed while it ran)
      if (room().key === key) {
        last = key
        size = step.value
      }
    },
    forget() {
      last = ''
    },
  }
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
      ScrollTrigger.create({ trigger: section, start: 'top 65%', once: true, onEnter: () => tl.play() })
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
