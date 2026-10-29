import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, clamp, clockState, lerp } from './util'
import { mix } from './ink'
import { BURST, HAT, LIFT, MARK, MATE_LIFT, SEATED, SEAT_LEGS, mateSvg, renderScenes, walkerSvg } from './dayscenes'

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
/** The Incubate window's afternoon: blue, through pale gold, to apricot. */
const AFTERNOON = ['#9cc7e2', '#f3e2a6', '#f2b98a']
const afternoonAt = (u: number) => (u < 0.5 ? mix(AFTERNOON[0], AFTERNOON[1], u * 2) : mix(AFTERNOON[1], AFTERNOON[2], (u - 0.5) * 2))

/** Each step: a short walk to the next window, then a longer stay while its moment plays. */
const WALK = 0.42
const DWELL = 0.58
/** Hatch is the poster moment and the walk home is the ending: both stay longer. */
const STAY = [1, 1, 1, 1, 1, 1.7, 1.6]
/** When the two on Crack's bench get up and join (through Crack's stay). */
const JOIN = 0.82

const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
const easeIn = (t: number) => t * t
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t))
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
 * and it takes a coffee; it pitches from a crate against a stopwatch until
 * the two on the bench hop down and fall in behind it; the three settle into
 * a nest as a flag goes up; the afternoon spins by at the workbench as the
 * build grows; pizza and a better idea arrive; on stage it wobbles, pops and
 * bursts out everything it carried that day; then the three sit down to the
 * group chat, get up and walk off past the darkening windows to the way to
 * apply. On phones (and with reduced motion) it's a picture book read top to
 * bottom, the cast drawn into every scene.
 */
export function initDay() {
  const section = $('#day')
  const track = $('#dayTrack')
  const cast = $('#dayCast')
  const walker = $('#walker')
  const mates = [$('#mateA'), $('#mateB')]
  const steps = $$<HTMLLIElement>('.step', track)
  const outro = $('.day__edge--out', track)
  const times = steps.map((s) => toMin($('.step__time', s).textContent ?? '10:30'))
  // lights out is lights out: the last window holds at its own hour
  times.push(times[times.length - 1])
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
      golden: q<SVGGElement>(walker, '.walker__golden'),
      rays: q<SVGGElement>(walker, '.walker__rays'),
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

    // GSAP owns the cast's centring, so its own x/y tweens never fight a CSS translate
    gsap.set([walker, ...mates], { xPercent: -50, yPercent: 2.92 })

    // geometry, read fresh on every frame so a resize never goes stale
    const unit = () => (track.querySelector('.step__scene svg')?.getBoundingClientRect().width ?? 400) / 400
    const markX = (i: number) => steps[i].offsetLeft + steps[i].offsetWidth * (MARK / 400)
    const markAt = (pos: number) => {
      const i = Math.floor(pos)
      return lerp(markX(i), markX(Math.min(i + 1, steps.length - 1)), pos - i)
    }
    const eggX = () => walker.offsetLeft
    // at the end the camera follows the three right, until the note and the button sit beside them
    const homeward = () => outro.offsetLeft - 0.16 * steps[0].offsetWidth - markX(steps.length - 1)

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
    tl.to(story.d, { 0: 1, duration: DWELL * STAY[0] })
    for (let i = 1; i < steps.length; i++) {
      tl.to(story, { pos: i, duration: WALK, ease: 'power1.inOut' })
      tl.to(story.d, { [i]: 1, duration: DWELL * STAY[i] })
    }
    tl.to({}, { duration: 0.3 }) // a breath before the section lets go

    /** Hop between what they stand or sit on: down at the start of a walk, up at the end, in a small arc. */
    const liftAt = (lifts: number[], state: number, t: number) => {
      if (t <= 0) return lifts[state]
      const from = lifts[state]
      const to = lifts[state + 1] ?? 0
      if (t < 0.2) return lerp(from, 0, easeOut(t / 0.2)) + (from > 4 ? Math.sin((Math.PI * t) / 0.2) * 10 : 0)
      if (t > 0.8) return lerp(0, to, easeIn((t - 0.8) / 0.2)) + (to > 4 ? Math.sin((Math.PI * (t - 0.8)) / 0.2) * 14 : 0)
      return 0
    }
    /** How folded the legs are: sitting at a seated step, standing up to walk, sitting down on arrival. */
    const foldAt = (state: number, t: number, d: number) => {
      if (t > 0) return Math.max(SEATED[state] ? 1 - band(t, 0, 0.15) : 0, SEATED[state + 1] ? band(t, 0.85, 1) : 0)
      if (state === steps.length - 1) return 1 - band(d, 0.5, 0.56)
      return SEATED[state] ? 1 : 0
    }

    /** Legs and a waddle. `fold` shortens the shins for sitting (0 standing, 1 seated). */
    const pose = (legs: SVGGElement[], body: SVGGElement, ph: number, a: number, fold = 0, dangle = 0) => {
      const sw = Math.sin(2 * ph) * 24 * a + dangle
      const sy = lerp(1, SEAT_LEGS, fold)
      const leg = (deg: number, x: number) => `translate(${x} 248) scale(1 ${sy.toFixed(3)}) rotate(${deg.toFixed(2)}) translate(${-x} -248)`
      legs[0].setAttribute('transform', leg(sw, 80))
      legs[1].setAttribute('transform', leg(-sw * (dangle ? 0.8 : 1), 120))
      body.setAttribute('transform', `translate(0 ${(-Math.abs(Math.cos(2 * ph)) * 6 * a).toFixed(2)}) rotate(${(Math.sin(2 * ph) * 3 * a).toFixed(2)} 100 316)`)
    }

    /**
     * The hatch, scrubbed: a held wobble, the crack runs round, and on the pop
     * the cap kicks off (so the face is there at once), the golden egg squashes
     * and stretches in a flare of rays, everything it carried today bursts out,
     * and the cap comes down as a hat.
     */
    const hatchAt = (d: number) => {
      const wob = band(d, 0.05, 0.32)
      const rot = wob > 0 && wob < 1 ? Math.sin(wob * Math.PI * 6) * 6 * (0.6 + 0.4 * wob) : 0
      const c = band(d, 0.32, 0.42)
      hero.whole.setAttribute('transform', `rotate(${rot.toFixed(2)} 100 262) translate(100 262) scale(1 ${(1 - 0.07 * c).toFixed(3)}) translate(-100 -262)`)
      const popped = d >= 0.42
      walker.dataset.hatch = popped ? 'popped' : 'whole'
      steps[5].classList.toggle('is-popped', popped)
      cast.dataset.cheer = String(popped)
      // squash and stretch as it comes out: 0.9 → 1.12 → 1
      const s1 = band(d, 0.42, 0.48)
      const s2 = band(d, 0.48, 0.58)
      const sy = !popped ? 1 : s2 > 0 ? lerp(1.12, 1, easeOut(s2)) : lerp(0.9, 1.12, easeOut(s1))
      hero.golden.setAttribute('transform', `translate(100 262) scale(${(2 - sy).toFixed(3)} ${sy.toFixed(3)}) translate(-100 -262)`)
      const flare = band(d, 0.42, 0.7)
      hero.rays.setAttribute('opacity', (flare > 0 && flare < 1 ? 1 - flare : 0).toFixed(2))
      hero.rays.setAttribute('transform', `translate(100 150) scale(${(0.6 + 0.8 * easeOut(flare)).toFixed(3)}) translate(-100 -150)`)
      // the cap: kicked off on the pop, up and spinning, then down onto the head
      const u = band(d, 0.42, 0.8)
      const k1 = easeOut(Math.min(u / 0.4, 1))
      const k2 = easeIn(Math.max((u - 0.4) / 0.6, 0))
      const kick = popped ? 60 : 0
      const x = u < 0.4 ? lerp(0, 70, k1) : lerp(70, HAT.x, k2)
      const y = u < 0.4 ? lerp(-kick, -240, k1) : lerp(-240, HAT.y, k2) - (u > 0.92 ? Math.sin(((u - 0.92) / 0.08) * Math.PI) * 6 : 0)
      const r = lerp(popped ? 24 : 0, 360 + HAT.r, u)
      const s = u < 0.4 ? lerp(1, 0.8, k1) : lerp(0.8, HAT.s, k2)
      hero.top.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) translate(100 178) rotate(${r.toFixed(1)}) scale(${s.toFixed(3)}) translate(-100 -178)`)
      // everything it carried today bursts out with the shell, past the arch like the poster
      hero.burst.forEach((g, i) => {
        const b = band(d, 0.42 + i * 0.012, 0.9)
        if (b <= 0.02 || b >= 1) return g.setAttribute('opacity', '0')
        const o = BURST[i]
        const ang = (o.a * Math.PI) / 180
        const dist = o.far * easeOut(b)
        const bx = o.x + Math.cos(ang) * dist
        const by = o.y + Math.sin(ang) * dist + 90 * b * b
        const spin = (i % 2 ? 1 : -1) * 260 * b
        g.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)}) rotate(${spin.toFixed(1)}) scale(${(0.7 + 0.3 * Math.min(1, b * 3)).toFixed(2)})`)
        g.setAttribute('opacity', (b < 0.6 ? 1 : 1 - (b - 0.6) / 0.4).toFixed(2))
      })
    }
    const settled = () => {
      hero.whole.removeAttribute('transform')
      hero.golden.removeAttribute('transform')
      hero.rays.setAttribute('opacity', '0')
      hero.burst.forEach((g) => g.setAttribute('opacity', '0'))
    }

    // the two on Crack's bench hop down and fall in behind, from where they sat
    const hop = () => {
      team.forEach((m, k) => {
        const from = steps[1].querySelector(k === 0 ? '.listener--a' : '.listener--b')
        if (!from) return
        const fr = from.getBoundingClientRect()
        gsap.set(m.el, { x: 0, y: 0 })
        const mr = m.el.getBoundingClientRect()
        const dx = fr.left + fr.width / 2 - (mr.left + mr.width / 2)
        const dy = fr.bottom - mr.bottom
        gsap.killTweensOf(m.el)
        gsap
          .timeline({ delay: k * 0.16 })
          .set(m.el, { x: dx, y: dy, opacity: 1, scale: 0.75, transformOrigin: '50% 100%' })
          .to(m.el, { x: dx * 0.5, y: Math.min(dy, 0) - 70 * unit(), scale: 0.9, duration: 0.3, ease: 'power2.out' })
          .to(m.el, { x: 0, y: 0, scale: 1, duration: 0.45, ease: 'bounce.out' })
      })
    }

    let joined = false
    const setJoined = (j: boolean, forward: boolean) => {
      if (j === joined) return
      joined = j
      section.dataset.team = String(j)
      if (j && forward) hop()
      else if (j) team.forEach((m) => (gsap.killTweensOf(m.el), gsap.set(m.el, { x: 0, y: 0, scale: 1, opacity: 1 })))
      else team.forEach((m) => (gsap.killTweensOf(m.el), gsap.set(m.el, { opacity: 0 })))
    }

    const setStep = (i: number) => {
      if (i === current) return
      current = i
      walker.dataset.state = String(i)
      team.forEach((m) => (m.el.dataset.state = String(i)))
      if (i < 5) {
        walker.dataset.hatch = 'whole'
        steps[5].classList.remove('is-popped')
        hero.top.removeAttribute('transform')
      }
      if (i !== 5) {
        settled()
        cast.dataset.cheer = 'false'
      }
      if (i === 6) {
        walker.dataset.hatch = 'popped'
        hero.top.setAttribute('transform', `translate(${HAT.x} ${HAT.y}) translate(100 178) rotate(${HAT.r}) scale(${HAT.s}) translate(-100 -178)`)
      } else {
        section.style.setProperty('--out', '0')
        section.dataset.end = 'false'
      }
    }

    let lastPos = 0
    const frame = () => {
      const u = unit()
      const last = steps.length - 1
      const state = Math.min(Math.floor(story.pos + 1e-4), last)
      const t = story.pos - state // 0 while it stays, 0..1 on the way to the next window
      const d = story.d[state]
      const forward = story.pos + d >= lastPos
      lastPos = story.pos + d
      setStep(state)
      markStep(state, t > 0 ? 1 : d)
      setJoined(state > 1 || (state === 1 && (t > 0 || d >= JOIN)), forward)

      // the camera keeps the egg's window in the middle, and at the end follows the three home
      const home = state === last && t === 0 ? easeInOut(band(d, 0.56, 0.95)) : 0
      gsap.set(track, { x: eggX() - markAt(story.pos) - home * homeward() })

      // the walk: legs and a waddle only while moving, a small hop onto crates, nests, stools and benches
      const walked = markAt(story.pos) - markX(0) + home * homeward()
      const fold = foldAt(state, t, d)
      let a = Math.sin(Math.PI * t)
      let dangle = fold > 0.6 && t === 0 ? Math.sin(d * Math.PI * 7) * 9 : 0
      if (state === last && t === 0) {
        a = home > 0 && home < 1 ? 1 : 0
        if (a) dangle = 0
        section.style.setProperty('--out', band(d, 0.58, 0.98).toFixed(3))
        section.dataset.end = String(d > 0.7)
        cast.dataset.cheer = String(d > 0.94)
      }
      cast.classList.toggle('is-walking', a > 0.05)
      gsap.set(walker, { y: -lerp(0, liftAt(LIFT, state, t), state === last && t === 0 ? fold : 1) * u })
      pose(hero.legs, hero.body, walked / 32, a, fold, dangle)
      team.forEach((m, k) => {
        gsap.set(m.svg, { y: -lerp(0, liftAt(MATE_LIFT, state, t), state === last && t === 0 ? fold : 1) * u })
        pose(m.legs, m.body, walked / 32 - (k + 1) * 0.9, a, fold, dangle ? Math.sin(d * Math.PI * 7 + k + 1) * 9 : 0)
      })

      // what it's doing: the coffee partway into Doors; on the bench three bubbles, a wink, then a wave goodbye
      walker.dataset.beat = String(
        state === last && t === 0
          ? d < 0.1
            ? 0
            : d < 0.2
              ? 1
              : d < 0.3
                ? 2
                : d < 0.4
                  ? 3
                  : d < 0.94
                    ? 4
                    : 5
          : Math.min(4, Math.floor((t > 0 ? 1 : d) * 5)),
      )
      if (state === 5) hatchAt(t > 0 ? 1 : d)

      // the clock: each stay runs most of its hour, the walk finishes it; it stops at lights out
      const span = times[state + 1] - times[state]
      const minutes = t > 0 ? lerp(times[state] + span * 0.85, times[state + 1], t) : times[state] + span * 0.85 * d
      clockState.dayMinutes = minutes
      clockState.onChange()
      clockH.setAttribute('transform', `rotate(${(((minutes / 60) % 12) * 30).toFixed(1)})`)
      clockM.setAttribute('transform', `rotate(${((minutes % 60) * 6).toFixed(1)})`)
      // the afternoon in the Incubate window: while the clock spins, the sky warms
      const noon = state > 3 ? 1 : state === 3 ? (t > 0 ? 1 : d) : 0
      noonSky.setAttribute('stop-color', afternoonAt(noon))

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
      joined = false
      gsap.set([track, walker, cast, ...team.map((m) => m.svg)], { clearProps: 'transform,opacity' })
      team.forEach((m) => (gsap.killTweensOf(m.el), gsap.set(m.el, { clearProps: 'all' })))
      ;[...hero.legs, hero.body, hero.whole, hero.top, hero.golden, ...team.flatMap((m) => [...m.legs, m.body])].forEach((g) => g.removeAttribute('transform'))
      section.style.removeProperty('--out')
      delete section.dataset.end
      delete section.dataset.team
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
