import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, clamp, clockState, lerp } from './util'
import { mix } from './ink'
import { BURST_ANGLES, HAT, LIFT, MARK, MATE_LIFT, mateSvg, renderScenes, walkerSvg } from './dayscenes'

const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

/** The page's own sky at each step, from the palette: morning butter to a dimmed lavender at lights out. */
const SKY = ['#fdf1d3', '#f3f1df', '#e3efe5', '#dde9f1', '#f6dcc6', '#e5d6ee', '#cdc1e3']
const skyAt = (pos: number) => {
  const i = clamp(Math.floor(pos), 0, SKY.length - 1)
  return mix(SKY[i], SKY[Math.min(i + 1, SKY.length - 1)], clamp(pos - i, 0, 1))
}

/** Each step: a short walk to the next window, then a longer stay while its moment plays. */
const WALK = 0.42
const DWELL = 0.58

const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
const easeIn = (t: number) => t * t
const band = (d: number, a: number, b: number) => clamp((d - a) / (b - a), 0, 1)

/** Draw the scenes and the cast. Runs before anything measures the page. */
export function renderDay() {
  renderScenes()
  const fill = (id: string, html: () => string) => {
    const el = document.getElementById(id)
    if (el && !el.childElementCount) el.innerHTML = html()
  }
  fill('walker', walkerSvg)
  fill('mateA', () => mateSvg('beanie'))
  fill('mateB', () => mateSvg('cap'))
}

/**
 * "A day at the club": seven windows from 10:30 to 20:00. On wide screens the
 * section pins and the scroll plays the day as a story: our egg walks to the
 * middle of each window and stays while that hour happens — the door opens
 * and it takes a coffee, it pitches from a crate against a stopwatch, two
 * eggs hop out of a nest to join it, the afternoon spins by under a heat
 * lamp, pizza and a better idea arrive, it hatches on stage in a burst of
 * everything it carried that day, and the three of them sit down to the
 * group chat on the way home. On phones (and with reduced motion) it's a
 * picture book read top to bottom, the cast drawn into every scene.
 */
export function initDay() {
  const section = $('#day')
  const track = $('#dayTrack')
  const cast = $('#dayCast')
  const walker = $('#walker')
  const mates = [$('#mateA'), $('#mateB')]
  const steps = $$<HTMLLIElement>('.step', track)
  const times = steps.map((s) => toMin($('.step__time', s).textContent ?? '10:30'))
  times.push(times[times.length - 1] + 30)
  const root = document.documentElement

  let current = -1
  const markStep = (i: number, d: number) => {
    steps.forEach((s, k) => {
      s.classList.toggle('is-now', k === i)
      s.classList.toggle('is-past', k < i)
      s.style.setProperty('--d', String(k < i ? 1 : k === i ? d : 0))
    })
  }

  const mm = gsap.matchMedia()

  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    const q = <T extends Element>(el: Element, sel: string) => el.querySelector<T>(sel)!
    const hero = {
      body: q<SVGGElement>(walker, '.walker__body'),
      legs: [q<SVGGElement>(walker, '.leg--l'), q<SVGGElement>(walker, '.leg--r')],
      whole: q<SVGGElement>(walker, '.walker__whole'),
      top: q<SVGGElement>(walker, '.walker__top'),
      burst: Array.from(walker.querySelectorAll<SVGGElement>('.wburst')),
    }
    const team = mates.map((m) => ({
      el: m,
      svg: q<SVGSVGElement>(m, 'svg'),
      body: q<SVGGElement>(m, '.mate__body'),
      legs: [q<SVGGElement>(m, '.leg--l'), q<SVGGElement>(m, '.leg--r')],
    }))
    const incubate = steps[3]
    const clockH = q<SVGGElement>(incubate, '.clock__h')
    const clockM = q<SVGGElement>(incubate, '.clock__m')
    const noonSky = q<SVGStopElement>(incubate, '.sky-stop--0')

    // geometry, read fresh on every frame so a resize never goes stale
    const unit = () => (track.querySelector('.step__scene svg')?.getBoundingClientRect().width ?? 400) / 400
    const markX = (i: number) => steps[i].offsetLeft + steps[i].offsetWidth * (MARK / 400)
    const markAt = (pos: number) => {
      const i = Math.floor(pos)
      return lerp(markX(i), markX(Math.min(i + 1, steps.length - 1)), pos - i)
    }
    const eggX = () => walker.offsetLeft

    // the cast stands on the scenes' floor: y 270 of each 300-tall scene
    const place = () => {
      const scene = track.querySelector('.step__scene svg')
      if (!scene) return
      const r = scene.getBoundingClientRect()
      const p = section.querySelector('.day__pin')!.getBoundingClientRect()
      cast.style.top = `${r.top - p.top + r.height * 0.9}px`
    }

    /** The scroll's story, as numbers the frame reads: where the egg is, and how far into each step's moment. */
    const story = { pos: 0, d: [0, 0, 0, 0, 0, 0, 0] }
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: () => frame() })
    tl.to(story.d, { 0: 1, duration: DWELL })
    for (let i = 1; i < steps.length; i++) {
      tl.to(story, { pos: i, duration: WALK, ease: 'power1.inOut' })
      tl.to(story.d, { [i]: 1, duration: i === steps.length - 1 ? DWELL * 1.6 : DWELL })
    }
    tl.to({}, { duration: 0.25 }) // a breath before the section lets go

    /** Hop between what the feet stand on: down at the start of a walk, up at the end, in a small arc. */
    const liftAt = (lifts: number[], state: number, t: number) => {
      if (t <= 0) return lifts[state]
      const from = lifts[state]
      const to = lifts[state + 1] ?? 0
      if (t < 0.2) return lerp(from, 0, easeOut(t / 0.2)) + (from ? Math.sin((Math.PI * t) / 0.2) * 10 : 0)
      if (t > 0.8) return lerp(0, to, easeIn((t - 0.8) / 0.2)) + (to ? Math.sin((Math.PI * (t - 0.8)) / 0.2) * 14 : 0)
      return 0
    }

    const walkLegs = (legs: SVGGElement[], body: SVGGElement, ph: number, a: number) => {
      const sw = Math.sin(2 * ph) * 24 * a
      legs[0].setAttribute('transform', `rotate(${sw.toFixed(2)} 80 248)`)
      legs[1].setAttribute('transform', `rotate(${(-sw).toFixed(2)} 120 248)`)
      body.setAttribute('transform', `translate(0 ${(-Math.abs(Math.cos(2 * ph)) * 6 * a).toFixed(2)}) rotate(${(Math.sin(2 * ph) * 3 * a).toFixed(2)} 100 316)`)
    }
    const dangle = (legs: SVGGElement[], d: number, k: number) => {
      const sw = Math.sin(d * Math.PI * 7 + k) * 9
      legs[0].setAttribute('transform', `rotate(${sw.toFixed(2)} 80 248)`)
      legs[1].setAttribute('transform', `rotate(${(-sw * 0.8).toFixed(2)} 120 248)`)
    }

    /** The hatch, scrubbed: three wobbles, the crack runs round, it pops, the cap flies and lands as a hat. */
    const hatchAt = (d: number) => {
      const wob = band(d, 0.08, 0.38)
      const rot = wob > 0 && wob < 1 ? Math.sin(wob * Math.PI * 6) * 6 : 0
      const c = band(d, 0.38, 0.5)
      hero.whole.setAttribute('transform', `rotate(${rot.toFixed(2)} 100 262) translate(100 262) scale(1 ${(1 - 0.06 * c).toFixed(3)}) translate(-100 -262)`)
      const popped = d >= 0.5
      walker.dataset.hatch = popped ? 'popped' : 'whole'
      steps[5].classList.toggle('is-popped', popped)
      cast.dataset.cheer = String(popped)
      // the cap: up and spinning, then down onto the head
      const u = band(d, 0.5, 0.86)
      const k1 = easeOut(Math.min(u / 0.5, 1))
      const k2 = easeIn(Math.max((u - 0.5) / 0.5, 0))
      const x = u < 0.5 ? lerp(0, 60, k1) : lerp(60, HAT.x, k2)
      const y = u < 0.5 ? lerp(0, -190, k1) : lerp(-190, HAT.y, k2) - (u > 0.92 ? Math.sin(((u - 0.92) / 0.08) * Math.PI) * 6 : 0)
      const r = lerp(0, 360 + HAT.r, u)
      const s = u < 0.5 ? lerp(1, 0.8, k1) : lerp(0.8, HAT.s, k2)
      hero.top.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) translate(100 178) rotate(${r.toFixed(1)}) scale(${s.toFixed(3)}) translate(-100 -178)`)
      // everything it carried today bursts out with the shell
      const b = band(d, 0.5, 0.9)
      hero.burst.forEach((g, i) => {
        if (b <= 0.03 || b >= 1) return g.setAttribute('opacity', '0')
        const ang = (BURST_ANGLES[i] * Math.PI) / 180
        const dist = (i < 4 ? 250 : 180) * easeOut(b)
        // out of the open top, then a little gravity
        const bx = 100 + Math.cos(ang) * dist
        const by = 96 + Math.sin(ang) * dist + 80 * b * b
        const spin = (i % 2 ? 1 : -1) * 240 * b
        g.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)}) rotate(${spin.toFixed(1)}) scale(${(0.7 + 0.3 * Math.min(1, b * 3)).toFixed(2)})`)
        g.setAttribute('opacity', (b < 0.6 ? 1 : 1 - (b - 0.6) / 0.4).toFixed(2))
      })
    }
    const settled = () => {
      hero.whole.removeAttribute('transform')
      hero.burst.forEach((g) => g.setAttribute('opacity', '0'))
    }

    // two eggs hop out of the nest to join, from where they sat
    const hop = () => {
      team.forEach((m, k) => {
        const nester = steps[2].querySelector(k === 0 ? '.nester--a' : '.nester--b')
        if (!nester) return
        const nr = nester.getBoundingClientRect()
        const mr = m.el.getBoundingClientRect()
        const eggBottom = mr.top + (mr.height * (262 + 150)) / 480
        const dx = nr.left + nr.width / 2 - (mr.left + mr.width / 2)
        const dy = nr.bottom - eggBottom
        gsap.killTweensOf(m.el)
        gsap
          .timeline({ delay: k * 0.14 })
          .set(m.el, { x: dx, y: dy, opacity: 1 })
          .to(m.el, { x: dx * 0.45, y: Math.min(dy, 0) - 60 * unit(), duration: 0.28, ease: 'power2.out' })
          .to(m.el, { x: 0, y: 0, duration: 0.42, ease: 'bounce.out' })
      })
    }

    const setStep = (i: number) => {
      const prev = current
      if (i === current) return
      current = i
      walker.dataset.state = String(i)
      team.forEach((m) => (m.el.dataset.state = String(i)))
      if (i >= 2 && prev === 1) hop()
      else if (i >= 2) team.forEach((m) => (gsap.killTweensOf(m.el), gsap.set(m.el, { x: 0, y: 0, opacity: 1 })))
      else team.forEach((m) => (gsap.killTweensOf(m.el), gsap.set(m.el, { opacity: 0 })))
      if (i < 5) {
        walker.dataset.hatch = 'whole'
        steps[5].classList.remove('is-popped')
        cast.dataset.cheer = 'false'
        hero.top.removeAttribute('transform')
      }
      if (i !== 5) {
        settled()
        cast.dataset.cheer = 'false'
      }
      if (i === 6) hero.top.setAttribute('transform', `translate(${HAT.x} ${HAT.y}) translate(100 178) rotate(${HAT.r}) scale(${HAT.s}) translate(-100 -178)`)
      if (i === 6) walker.dataset.hatch = 'popped'
    }

    const frame = () => {
      const u = unit()
      const state = Math.min(Math.floor(story.pos + 1e-4), steps.length - 1)
      const t = story.pos - state // 0 while it stays, 0..1 on the way to the next window
      const d = story.d[state]
      setStep(state)
      markStep(state, t > 0 ? 1 : d)

      // the camera keeps the egg's window in the middle
      gsap.set(track, { x: eggX() - markAt(story.pos) })

      // the walk: legs and a waddle only while moving, a small hop onto crates, stages and benches
      const a = Math.sin(Math.PI * t)
      const walked = markAt(story.pos) - markX(0)
      cast.classList.toggle('is-walking', a > 0.05)
      gsap.set(walker, { y: -liftAt(LIFT, state, t) * u })
      if (state === 6 && t === 0) dangle(hero.legs, d, 0)
      else walkLegs(hero.legs, hero.body, walked / 32, a)
      team.forEach((m, k) => {
        gsap.set(m.svg, { y: -liftAt(MATE_LIFT, state, t) * u })
        if (state === 6 && t === 0) dangle(m.legs, d, k + 1)
        else walkLegs(m.legs, m.body, walked / 32 - (k + 1) * 0.9, a)
      })

      // what it's doing: props come out partway into a stay (the coffee, the bubbles, the wink)
      walker.dataset.beat = String(Math.min(4, Math.floor((t > 0 ? 1 : d) * 5)))
      if (state === 5) hatchAt(t > 0 ? 1 : d)

      // the clock: each stay runs most of its hour, the walk finishes it
      const span = times[state + 1] - times[state]
      const minutes = t > 0 ? lerp(times[state] + span * 0.85, times[state + 1], t) : times[state] + span * 0.85 * d
      clockState.dayMinutes = minutes
      clockState.onChange()
      clockH.setAttribute('transform', `rotate(${(((minutes / 60) % 12) * 30).toFixed(1)})`)
      clockM.setAttribute('transform', `rotate(${((minutes % 60) * 6).toFixed(1)})`)
      // the afternoon in the Incubate window: while the clock spins, the sky warms
      const noon = state > 3 ? 1 : state === 3 ? (t > 0 ? 1 : d) : 0
      noonSky.setAttribute('stop-color', mix('#9cc7e2', '#f2c48a', noon))

      // the page drifts through the day with it
      const sky = skyAt(state + t)
      section.dataset.sky = sky
      if (root.dataset.sky === 'day') gsap.set(root, { '--page': sky })
    }

    const st = ScrollTrigger.create({
      trigger: section,
      pin: true,
      start: 'top top',
      end: () => '+=' + innerHeight * 0.8 * tl.duration(),
      scrub: 0.5,
      invalidateOnRefresh: true,
      animation: tl,
      onRefresh: (self) => {
        place()
        clockState.dayStart = self.start
        clockState.dayEnd = self.end
        frame()
      },
    })

    place()
    clockState.dayStart = st.start
    clockState.dayEnd = st.end
    frame()

    return () => {
      clockState.dayMinutes = null
      current = -1
      gsap.set([track, walker, ...team.map((m) => m.svg)], { clearProps: 'transform' })
      team.forEach((m) => (gsap.killTweensOf(m.el), gsap.set(m.el, { clearProps: 'all' })))
      ;[...hero.legs, hero.body, hero.whole, hero.top, ...team.flatMap((m) => [...m.legs, m.body])].forEach((g) => g.removeAttribute('transform'))
      settled()
    }
  })

  mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
    const setBook = (i: number) => {
      if (i === current) return
      current = i
      markStep(i, 1)
      section.dataset.sky = SKY[i]
      if (root.dataset.sky === 'day') gsap.to(root, { '--page': SKY[i], duration: 0.9, ease: 'power2.out', overwrite: true })
    }
    // the clock reads the scene you're in: its time, ticking towards the next
    const triggers = steps.map((s, i) =>
      ScrollTrigger.create({
        trigger: s,
        start: i === steps.length - 1 ? 'top 80%' : 'top 62%',
        end: 'bottom 62%',
        onToggle: (self) => self.isActive && setBook(i),
        onUpdate: (self) => {
          if (!self.isActive) return
          clockState.dayMinutes = lerp(times[i], times[i + 1], self.progress)
          clockState.onChange()
        },
      }),
    )
    const range = ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onRefresh: (self) => {
        clockState.dayStart = self.start
        clockState.dayEnd = self.end
      },
    })
    clockState.dayStart = range.start
    clockState.dayEnd = range.end
    setBook(0)
    return () => {
      clockState.dayMinutes = null
      current = -1
      triggers.forEach((t) => t.kill())
      range.kill()
    }
  })
}
