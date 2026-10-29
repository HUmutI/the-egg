import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, PALETTE, clamp, clockState, lerp } from './util'
import { lang } from './i18n'
import {
  AUDIENCE,
  FOLLOW,
  GROUND,
  K,
  LANDED,
  MARK,
  PIECE,
  PLATE,
  STAGE,
  STAIRS,
  WATCH,
  castSvg,
  installDayDefs,
  plateSvg,
} from './dayplates'

const toMin = (s: string) => {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/** The page through the day, from the site's own pastels: butter morning, lavender noon, mint afternoon, peach supper, pink at lights out. */
const SKY = [PALETTE.butter, mix(PALETTE.butter, PALETTE.lav, 0.45), PALETTE.lav, PALETTE.mint, PALETTE.peach, PALETTE.lav, PALETTE.pink]

/** Each step: a short walk to the next plate, then a stay while its moment plays. */
const WALK = 0.45
const DWELL = 0.6
/** The hatch and the way home stay longest. */
const STAY = [0.9, 1.1, 0.8, 1.2, 0.9, 1.7, 1.6]
/** The pop, through the Hatch stay. */
const POP = 0.42
/** When each stay's second note shows: the first crack, the pop. */
const LATE = [2, 0.45, 2, 2, 2, POP, 2]
/** How cracked the shell is through each stay: [from d, before, after]. 4 is hatched. */
const CRACKS: [number, number, number][] = [
  [0, 0, 0],
  [0.45, 0, 1],
  [0, 1, 1],
  [0.35, 1, 2],
  [0.45, 2, 3],
  [POP, 3, 4],
  [0, 4, 4],
]
/** On the way home, when each of the three sets off for the stairs: ours, then the two. */
const LEAVE = [0.3, 0.4, 0.5]

const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
const easeIn = (t: number) => t * t
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t))
const band = (d: number, a: number, b: number) => clamp((d - a) / (b - a), 0, 1)
/** Legs on for a walk from 0 to 1, easing in and out at its ends. */
const stride = (w: number) => (w <= 0 || w >= 1 ? 0 : Math.min(1, w * 6, (1 - w) * 6))

/** Build it, break it, build it again: [version, progress], -1 when it breaks. */
const build = (d: number): [number, number] => {
  if (d < 0.1) return [1, 0]
  if (d < 0.42) return [1, band(d, 0.1, 0.42) * 0.8]
  if (d < 0.48) return [1, -1]
  if (d < 0.7) return [2, band(d, 0.48, 0.7) * 0.55]
  if (d < 0.75) return [2, -1]
  return [3, band(d, 0.75, 0.95)]
}

/** Draw the plates and the cast. Runs before anything measures the page. */
export function renderDay() {
  installDayDefs()
  $$<HTMLElement>('#day .step').forEach((s, i) => {
    const fig = s.querySelector('.step__fig')
    if (fig && !fig.childElementCount) fig.innerHTML = plateSvg(i)
  })
  const cast = document.getElementById('dayCast')
  if (cast && !cast.childElementCount) cast.innerHTML = castSvg()
}

/**
 * "A day at the club": a programme from 10:30 to 20:00, set on a hairline,
 * with one riso plate per step on a shared ruler. On wide screens the section
 * pins and the scroll walks one egg through the day: the door opens on it, it
 * pitches against the stopwatch and gets its first crack, the two who
 * listened fall in behind it, they build, they eat, and on stage it hatches
 * into the club's golden egg; then the three take the metro home and the
 * programme hands over to Apply. On phones (and with reduced motion) it reads
 * top to bottom, each plate drawn with the cast as it is at that hour.
 */
export function initDay() {
  const section = $('#day')
  const track = $('#dayTrack')
  const steps = $$<HTMLLIElement>('.step', track)
  const cast = $<SVGSVGElement>('#dayCast')
  const progress = $('.day__progress', track)
  const times = steps.map((s) => toMin($('.step__time', s).textContent ?? '10:30'))
  // lights out is lights out: the last step holds at its own hour
  times.push(times[times.length - 1])
  const root = document.documentElement
  const last = steps.length - 1

  let current = -1
  const markStep = (i: number, here: boolean, late: boolean) => {
    steps.forEach((s, k) => {
      s.classList.toggle('is-now', k === i)
      s.classList.toggle('is-past', k < i)
      s.classList.toggle('is-here', k === i && here)
      s.classList.toggle('is-late', k === i && here && late)
    })
  }

  const mm = gsap.matchMedia()

  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    const q = <T extends Element>(sel: string, el: ParentNode = cast) => el.querySelector<T>(sel)!
    const member = (id: string) => {
      const el = q<SVGGElement>('#' + id)
      return { el, l: q<SVGPathElement>('.leg--l', el), r: q<SVGPathElement>('.leg--r', el) }
    }
    const hero = member('walker')
    const mates = [member('mateA'), member('mateB')]
    const golden = q<SVGGElement>('.cm__golden')
    const rays = q<SVGGElement>('.cm__rays')
    const pieces = { top: q<SVGGElement>('#shellTop'), bot: q<SVGGElement>('#shellBot') }
    const door = q<SVGGElement>('#dayDoor')
    const hand = q<SVGGElement>('.watch__hand', steps[1])
    const bar = q<SVGRectElement>('.bar__fill', steps[3])
    const barLabel = q<SVGTextElement>('.bar__label', steps[3])
    const chatLead = q<SVGPathElement>('.chat__lead', steps[6])
    const chatN = q<SVGTextElement>('.chat__n', steps[6])
    const rest = {
      hand: hand.getAttribute('transform') ?? '',
      bar: bar.getAttribute('width') ?? '',
      label: barLabel.textContent ?? '',
      chat: chatN.textContent ?? '',
    }

    /** The scroll's story, as numbers the frame reads: where the egg is, and how far into each stay. */
    const story = { pos: 0, d: [0, 0, 0, 0, 0, 0, 0] }
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: () => frame() })
    tl.to(story.d, { 0: 1, duration: DWELL * STAY[0] })
    for (let i = 1; i < steps.length; i++) {
      tl.to(story, { pos: i, duration: WALK, ease: 'power1.inOut' })
      tl.to(story.d, { [i]: 1, duration: DWELL * STAY[i] })
    }
    tl.to({}, { duration: 0.3 }) // a breath before the section lets go
    section.dataset.tl = tl.duration().toFixed(2)

    /** Up onto the stage at Hatch and off again, with a small hop at each edge. */
    const groundAt = (x: number) => {
      const lx = x - PLATE * 5
      const e = 44
      const up = clamp((lx - (STAGE.l - e / 2)) / e, 0, 1)
      const down = clamp((STAGE.r + e / 2 - lx) / e, 0, 1)
      return STAGE.h * easeInOut(Math.min(up, down)) + 26 * (Math.sin(Math.PI * up) + Math.sin(Math.PI * down))
    }

    /** One egg on its legs: a waddle and a stride while it moves (a, 0 to 1), standing on the floor at x. */
    const pose = (m: ReturnType<typeof member>, x: number, sink: number, a: number, tilt: number, k: number) => {
      const ph = x / 90
      const bob = -Math.abs(Math.sin(ph)) * 8 * a
      const rot = Math.sin(ph) * 4 * a + tilt
      const tf = `translate(${x.toFixed(1)} ${(GROUND - groundAt(x) + sink + bob).toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${k}) translate(-100 -330)`
      m.el.setAttribute('transform', tf)
      const sw = Math.sin(ph * 2) * 18 * a
      m.l.setAttribute('transform', `rotate(${sw.toFixed(2)} 82 246)`)
      m.r.setAttribute('transform', `rotate(${(-sw).toFixed(2)} 118 246)`)
      return tf
    }

    /** The way home: walk to the stairs, then down them, out of sight below the floor. */
    const homeward = (d: number, from: number, start: number) => {
      const w = band(d, start, start + 0.2)
      const down = band(d, start + 0.2, start + 0.32)
      return {
        x: lerp(from, PLATE * last + STAIRS, easeInOut(w)) + down * 40,
        sink: easeIn(down) * 340,
        a: Math.max(stride(w), down > 0 && down < 1 ? 1 : 0),
      }
    }

    let lastStage = ''
    let lastLabel = ''
    let lastChat = ''
    const frame = () => {
      const colW = steps[0].offsetWidth
      const pos = story.pos
      const state = Math.min(Math.floor(pos + 1e-4), last)
      const t = Math.max(0, pos - state)
      const here = t < 1e-4
      const d = story.d[state]
      if (state !== current) {
        current = state
        hero.el.dataset.state = String(state)
      }
      markStep(state, here, d >= LATE[state])

      // the camera keeps the egg's plate in the first column; the programme line inks up to it
      gsap.set(track, { x: -pos * colW })
      const along = MARK + PLATE * pos
      progress.style.transform = `scaleX(${(along / (PLATE * steps.length)).toFixed(4)})`

      // our egg, and the two who stand listening at Crack until it walks past, then fall in behind it
      const walking = here ? 0 : Math.sin(Math.PI * t)
      const home = state === last && here
      const ours = home ? homeward(d, along, LEAVE[0]) : { x: along, sink: 0, a: walking }
      mates.forEach((m, k) => {
        const stand = PLATE + AUDIENCE[k]
        const behind = along - FOLLOW[k]
        let x = Math.max(stand, behind)
        let sink = 0
        let a = walking * clamp((behind - stand) / 40, 0, 1)
        if (home) ({ x, sink, a } = homeward(d, behind, LEAVE[k + 1]))
        pose(m, x, sink, a, 0, K.mate)
        // until Crack, they're part of the programme still to come
        m.el.style.opacity = pos < 0.5 ? '0.42' : ''
      })

      // the hatch: a held wobble, the pop, and the shell's two halves land on the stage
      const hatching = state === 5 && here
      const popped = state > 5 || (state === 5 && (!here || d >= POP))
      let tilt = 0
      if (hatching) {
        const w = band(d, 0.1, 0.38)
        if (w > 0 && w < 1) tilt = Math.sin(w * Math.PI * 7) * 6 * (0.4 + 0.6 * w)
      }
      const heroTf = pose(hero, ours.x, ours.sink, ours.a, tilt, K.hero)
      ;(['top', 'bot'] as const).forEach((p) => {
        const el = pieces[p]
        if (!popped) return el.setAttribute('transform', heroTf)
        const f = hatching ? band(d, POP, POP + (p === 'top' ? 0.22 : 0.12)) : 1
        const [cx, cy] = PIECE[p]
        const [lx, ly, lr] = LANDED[p]
        const x0 = PLATE * 5 + MARK + (cx - 100) * K.hero
        const y0 = GROUND - STAGE.h - (330 - cy) * K.hero
        const x = lerp(x0, PLATE * 5 + lx, f)
        const y = lerp(y0, ly, f) - (p === 'top' ? 250 : 70) * Math.sin(Math.PI * f)
        const r = lerp(0, lr + (p === 'top' ? 360 : 0), easeOut(f))
        el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${K.hero}) translate(${-cx} ${-cy})`)
      })
      golden.setAttribute('opacity', popped ? '1' : '0')
      if (hatching && popped) {
        const s1 = band(d, POP, POP + 0.05)
        const s2 = band(d, POP + 0.05, POP + 0.16)
        const sy = s2 > 0 ? lerp(1.1, 1, easeOut(s2)) : lerp(0.86, 1.1, easeOut(s1))
        golden.setAttribute('transform', `translate(100 266) scale(${(2 - sy).toFixed(3)} ${sy.toFixed(3)}) translate(-100 -266)`)
        const r = band(d, POP, POP + 0.2)
        rays.setAttribute('opacity', (r > 0 && r < 1 ? 1 - r : 0).toFixed(2))
        rays.setAttribute('transform', `translate(100 146) scale(${(0.85 + 0.45 * r).toFixed(3)}) translate(-100 -146)`)
      } else {
        golden.removeAttribute('transform')
        rays.setAttribute('opacity', '0')
      }
      const [th, before, after] = CRACKS[state]
      const stage = String(!here || d >= th ? after : before)
      if (stage !== lastStage) cast.dataset.stage = lastStage = stage

      // the door opens on it, standing in the doorway
      const open = state === 0 && here ? easeInOut(band(d, 0.12, 0.55)) : 1
      door.setAttribute('transform', `translate(230 250) scale(${lerp(1, -0.34, open).toFixed(3)} 1)`)
      // sixty seconds on the stopwatch
      const sweep = state === 1 ? (here ? 360 * d : 360) : pos > 1 ? 360 : 0
      hand.setAttribute('transform', `rotate(${sweep.toFixed(1)} ${WATCH[0]} ${WATCH[1]})`)
      // the build, the break, the build again
      const [v, p] = state === 3 && here ? build(d) : pos > 3 ? [3, 1] : [1, 0]
      bar.setAttribute('width', (194 * Math.max(p, 0)).toFixed(1))
      const label = `v0.${v} · ${p < 0 ? 'ERR' : Math.round(p * 100) + '%'}`
      if (label !== lastLabel) barLabel.textContent = lastLabel = label
      // and the group chat, which carries on once they've gone
      const n = state === last ? Math.round(lerp(3, 214, easeIn(band(d, 0.04, 0.92)))) : 3
      const unread = lang === 'tr' ? `${n} okunmamış` : `${n} unread`
      if (unread !== lastChat) chatN.textContent = lastChat = unread
      chatLead.style.opacity = home ? (1 - band(d, LEAVE[0] + 0.02, LEAVE[0] + 0.1)).toFixed(2) : ''
      section.dataset.end = String(home && d > 0.9)

      // the club clock: each stay runs most of its hour, the walk finishes it; it stops at lights out
      const span = times[state + 1] - times[state]
      clockState.dayMinutes = here ? times[state] + span * 0.85 * d : lerp(times[state] + span * 0.85, times[state + 1], t)
      clockState.onChange()

      // the page drifts through the day with it, and flashes cream on the pop
      let sky = here ? SKY[state] : mix(SKY[state], SKY[state + 1], t)
      if (hatching && popped) sky = mix(sky, PALETTE.cream, 0.8 * (1 - easeOut(band(d, POP, POP + 0.16))))
      section.dataset.sky = sky
      if (root.dataset.sky === 'day') gsap.set(root, { '--page': sky })
    }

    const st = ScrollTrigger.create({
      trigger: section,
      pin: true,
      start: 'top top',
      end: () => '+=' + innerHeight * 0.55 * tl.duration(),
      scrub: 0.5,
      invalidateOnRefresh: true,
      animation: tl,
      onRefresh: (self) => {
        clockState.dayStart = self.start
        clockState.dayEnd = self.end
        frame()
      },
    })

    clockState.dayStart = st.start
    clockState.dayEnd = st.end
    frame()

    return () => {
      clockState.dayMinutes = null
      current = -1
      gsap.set(track, { clearProps: 'transform' })
      progress.style.removeProperty('transform')
      hand.setAttribute('transform', rest.hand)
      bar.setAttribute('width', rest.bar)
      barLabel.textContent = rest.label
      chatN.textContent = rest.chat
      chatLead.style.removeProperty('opacity')
      delete section.dataset.end
      delete section.dataset.tl
    }
  })

  mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
    const setBook = (i: number) => {
      if (i === current) return
      current = i
      markStep(i, true, true)
      section.dataset.sky = SKY[i]
      if (root.dataset.sky === 'day') gsap.to(root, { '--page': SKY[i], duration: 0.9, ease: 'power2.out', overwrite: true })
    }
    // the clock reads the step you're on: its time, ticking towards the next
    const triggers = steps.map((s, i) =>
      ScrollTrigger.create({
        trigger: s,
        start: i === last ? 'top 80%' : 'top 62%',
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
