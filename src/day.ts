import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, clockState, lerp, reducedMotion } from './util'

const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

/**
 * "A day at the club": on wide screens the section pins and the day slides
 * past horizontally while a single egg waddles along the ruler, cracking a
 * little more at every step until it hatches at 17:30 demos.
 */
export function initDay() {
  const section = $('#day')
  const track = $('#dayTrack')
  const ruler = $('#dayRuler')
  const roller = $('#roller')
  const rollerSvg = $<SVGSVGElement>('.roller__svg', roller)
  const legL = $<SVGPathElement>('.leg--l', roller)
  const legR = $<SVGPathElement>('.leg--r', roller)
  const steps = $$<HTMLLIElement>('.step', track)
  const times = steps.map((s) => toMin($('.step__time', s).textContent ?? '09:00'))
  times.push(times[times.length - 1] + 60)

  // Which crack stage belongs to each step (hatches on step 6, "Hatch").
  const STAGE = [0, 0, 1, 2, 3, 4, 4]

  let current = -1
  const setStep = (i: number) => {
    if (i === current) return
    current = i
    steps.forEach((s, k) => s.classList.toggle('is-now', k === i))
    roller.dataset.stage = String(STAGE[i] ?? 0)
    roller.dataset.doors = String(i === 0)
  }

  const mm = gsap.matchMedia()

  mm.add('(min-width: 900px)', () => {
    const eggX = () => roller.getBoundingClientRect().left + roller.offsetWidth * 0.5
    // Scroll until the last step ("Afterglow") has slid under the egg.
    const distance = () => {
      const last = steps[steps.length - 1]
      const restX = roller.offsetLeft + roller.offsetWidth * 0.5
      return Math.max(track.scrollWidth - innerWidth, last.offsetLeft - restX + last.offsetWidth * 0.3)
    }

    const sync = () => {
      const tx = Number(gsap.getProperty(track, 'x'))
      // ruler ticks slide under the egg; the egg waddles in place
      ruler.style.backgroundPositionX = `${tx}px, ${tx}px`
      if (!reducedMotion()) {
        const phase = -tx / 46
        gsap.set(rollerSvg, {
          rotate: Math.sin(phase) * 5,
          y: -Math.abs(Math.sin(phase)) * 5,
          transformOrigin: '50% 100%',
        })
        // and it walks
        legL.style.transform = `rotate(${Math.sin(phase * 2) * 18}deg)`
        legR.style.transform = `rotate(${-Math.sin(phase * 2) * 18}deg)`
      }

      // find the step whose column is passing over the egg — but before any
      // scrubbing has happened (tx >= 0, the resting frame), the untransformed
      // track's gutter padding can put a later column under the egg's rest
      // position, so pin it to "Doors" until the track actually starts moving.
      const x = eggX()
      let i = 0
      if (tx < 0) {
        for (let k = 0; k < steps.length; k++) {
          if (steps[k].getBoundingClientRect().left <= x) i = k
        }
      }
      setStep(i)
      const a = steps[i].getBoundingClientRect().left
      const b = steps[i + 1]?.getBoundingClientRect().left ?? a + steps[i].offsetWidth
      const f = Math.min(1, Math.max(0, (x - a) / Math.max(1, b - a)))
      clockState.dayMinutes = tx >= 0 ? times[0] : lerp(times[i], times[i + 1], f)
      clockState.onChange()
    }

    // Driven from the tween (not the trigger) so it follows the smoothed
    // scrub and settles on the right step when scrolling stops.
    const st = ScrollTrigger.create({
      trigger: section,
      pin: true,
      start: 'top top',
      end: () => '+=' + distance() * 0.7,
      scrub: reducedMotion() ? true : 0.25,
      invalidateOnRefresh: true,
      animation: gsap.to(track, { x: () => -distance(), ease: 'none', onUpdate: sync }),
      onRefresh: (self) => {
        clockState.dayStart = self.start
        clockState.dayEnd = self.end
      },
    })

    clockState.dayStart = st.start
    clockState.dayEnd = st.end

    return () => {
      clockState.dayMinutes = null
      gsap.set(rollerSvg, { clearProps: 'all' })
    }
  })

  mm.add('(max-width: 899px)', () => {
    const triggers = steps.map((s, i) =>
      ScrollTrigger.create({
        trigger: s,
        start: 'top 60%',
        end: 'bottom 60%',
        onToggle: (self) => self.isActive && setStep(i),
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
      triggers.forEach((t) => t.kill())
      range.kill()
    }
  })

  setStep(0)
}
