import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, clockState, lerp, reducedMotion } from './util'
import { mateSvg, renderScenes, walkerSvg } from './dayscenes'

const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

/** The page's own sky at each step: morning butter, a blue midday, a peach sunset, a lavender dusk. */
const SKY = ['#fdf1d3', '#eef2e6', '#e6f0ee', '#e1edf1', '#f7dfcb', '#e6d8ee', '#d9d2ec']

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
 * section pins and the day slides past while our egg walks it — cracking a
 * little at every step, picking up two teammates at Nest, hatching at the
 * 19:00 pitches and walking home with its shell for a hat. On phones it's a
 * picture book read top to bottom, each scene with the cast drawn in.
 */
export function initDay() {
  const section = $('#day')
  const pin = $('.day__pin', section)
  const track = $('#dayTrack')
  const cast = $('#dayCast')
  const walker = $('#walker')
  const mates = [$('#mateA'), $('#mateB')]
  const steps = $$<HTMLLIElement>('.step', track)
  const times = steps.map((s) => toMin($('.step__time', s).textContent ?? '10:30'))
  times.push(times[times.length - 1] + 60)
  const root = document.documentElement

  let current = -1
  const setStep = (i: number) => {
    if (i === current) return
    current = i
    steps.forEach((s, k) => {
      s.classList.toggle('is-now', k === i)
      s.classList.toggle('is-past', k < i)
    })
    walker.dataset.state = String(i)
    mates.forEach((m) => (m.dataset.state = String(i)))
    cast.dataset.team = String(i >= 2)
    // sky.ts reads this when the section takes over the page colour
    section.dataset.sky = SKY[i]
    if (root.dataset.sky === 'day') {
      gsap.to(root, { '--page': SKY[i], duration: 0.9, ease: 'power2.out', overwrite: true })
    }
  }

  const mm = gsap.matchMedia()

  mm.add('(min-width: 900px)', () => {
    const actors = [walker, ...mates].map((el) => ({
      body: el.querySelector<SVGGElement>('.walker__body, .mate__body'),
      l: el.querySelector<SVGGElement>('.leg--l'),
      r: el.querySelector<SVGGElement>('.leg--r'),
    }))

    // the cast stands on the scenes' floor: y 270 of each 300-tall scene
    const place = () => {
      const scene = track.querySelector('.step__scene svg')
      if (!scene) return
      const r = scene.getBoundingClientRect()
      const p = pin.getBoundingClientRect()
      cast.style.top = `${r.top - p.top + r.height * 0.9}px`
    }

    const eggX = () => walker.getBoundingClientRect().left + walker.offsetWidth * 0.5
    // Two legs to the walk: the day slides past until its last window
    // reaches the right edge, then the camera stops and the egg (and its
    // team) walks on into the evening.
    const slide = () => Math.max(0, track.scrollWidth - innerWidth)
    const walkOn = () => {
      const last = steps[steps.length - 1]
      const lastMid = last.offsetLeft + last.offsetWidth * 0.42 - slide()
      return Math.max(0, lastMid - walker.offsetLeft)
    }
    const distance = () => slide() + walkOn()
    const walk = { v: 0 }

    const sync = () => {
      const s = slide()
      const tx = -Math.min(walk.v, s)
      gsap.set(track, { x: tx })
      gsap.set(cast, { x: Math.max(0, walk.v - s) })
      if (!reducedMotion()) {
        // a waddle: each egg a half-step behind the one in front
        const phase = walk.v / 42
        actors.forEach((a, k) => {
          const ph = phase - k * 1.1
          if (a.body) gsap.set(a.body, { y: -Math.abs(Math.sin(ph)) * 8, rotation: Math.sin(ph) * 4, transformOrigin: '50% 100%' })
          if (a.l) gsap.set(a.l, { rotation: Math.sin(ph * 2) * 16, svgOrigin: '80 248' })
          if (a.r) gsap.set(a.r, { rotation: -Math.sin(ph * 2) * 16, svgOrigin: '120 248' })
        })
      }

      // the window the egg is standing in; before anything moves it's Doors
      const x = eggX()
      let i = 0
      if (walk.v > 0) {
        for (let k = 0; k < steps.length; k++) {
          if (steps[k].getBoundingClientRect().left <= x) i = k
        }
      }
      setStep(i)
      const a = steps[i].getBoundingClientRect().left
      const b = steps[i + 1]?.getBoundingClientRect().left ?? a + steps[i].offsetWidth
      const f = Math.min(1, Math.max(0, (x - a) / Math.max(1, b - a)))
      clockState.dayMinutes = walk.v <= 0 ? times[0] : lerp(times[i], times[i + 1], f)
      clockState.onChange()
    }

    // Driven from the tween (not the trigger) so it follows the smoothed
    // scrub and settles on the right step when scrolling stops.
    const st = ScrollTrigger.create({
      trigger: section,
      pin: true,
      start: 'top top',
      end: () => '+=' + distance() * 0.8,
      scrub: reducedMotion() ? true : 0.3,
      invalidateOnRefresh: true,
      animation: gsap.to(walk, { v: () => distance(), ease: 'none', onUpdate: sync }),
      onRefresh: (self) => {
        place()
        clockState.dayStart = self.start
        clockState.dayEnd = self.end
      },
    })

    place()
    clockState.dayStart = st.start
    clockState.dayEnd = st.end

    return () => {
      clockState.dayMinutes = null
      gsap.set([track, cast], { clearProps: 'transform' })
      actors.forEach((a) => gsap.set([a.body, a.l, a.r].filter(Boolean), { clearProps: 'all' }))
    }
  })

  mm.add('(max-width: 899px)', () => {
    // the clock reads the scene you're in: its time, ticking towards the next
    const triggers = steps.map((s, i) =>
      ScrollTrigger.create({
        trigger: s,
        start: 'top 62%',
        end: 'bottom 62%',
        onToggle: (self) => self.isActive && setStep(i),
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
    return () => {
      clockState.dayMinutes = null
      triggers.forEach((t) => t.kill())
      range.kill()
    }
  })

  setStep(0)
}
