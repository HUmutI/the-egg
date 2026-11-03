import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, PALETTE, clamp, clockState, holdFor, lerp, nextTask, put } from './util'
import { lang } from './i18n'
import { holdDock } from './dock'
import {
  AUDIENCE,
  FOLLOW,
  GROUND,
  K,
  LANDED,
  MARK,
  PH,
  PIECE,
  PLATE,
  STAGE,
  STAIRS,
  WATCH,
  DAY_MEDIA,
  drawPlates,
} from './dayplates'
import { resetSky, sky as page } from './sky'

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

/** Air the phone story keeps at least above and below the step's copy. */
const AIR = 22

/**
 * "A day at the club": a programme from 10:30 to 20:00, set on a hairline,
 * with one riso plate per step on a shared ruler. On wide screens the section
 * pins and the scroll walks one egg through the day: the door opens on it, it
 * pitches against the stopwatch and gets its first crack, the two who
 * listened fall in behind it, they build, they eat, and on stage it hatches
 * into the club's golden egg; then the three take the metro home and the
 * programme hands over to Apply. Phones held upright get the same walk, one
 * plate to a screen: the stage under the nav pins (with the heading, on a
 * screen tall enough to hold both), a row of seven eggs keeps the programme,
 * and the camera stays with the egg, framed close (PH) so the cast is drawn
 * as large as the screen allows. Each step's copy stands just over its plate,
 * and changes as the egg walks on; at the end the three go down to the metro
 * with the camera, and Apply is written on the empty floor. Phones on their
 * side, and reduced motion, read it top to bottom, each plate drawn with the
 * cast as it is at that hour.
 */
export async function initDay() {
  const section = $('#day')
  const viewport = $('.day__viewport', section)
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
  /** The programme's marks as last set, so a frame that changes nothing touches nothing. */
  let marked = ''
  const markStep = (i: number, here: boolean, late: boolean) => {
    const key = `${i} ${here} ${late}`
    if (key === marked) return
    marked = key
    steps.forEach((s, k) => {
      s.classList.toggle('is-now', k === i)
      s.classList.toggle('is-past', k < i)
      s.classList.toggle('is-here', k === i && here)
      s.classList.toggle('is-late', k === i && here && late)
    })
  }

  /**
   * Phones: the stage takes its phone shape, the plates their phone framing, and a row of seven
   * eggs over the stage keeps the programme (made once, and kept while a phone walk holds).
   */
  let ticker: HTMLElement | null = null
  const stagePhone = (tall: boolean) => {
    section.classList.add('day--story')
    section.classList.toggle('day--tall', tall)
    drawPlates('phone')
    steps.forEach((s, k) => s.style.setProperty('--top', String(PH.top[k])))
    if (!ticker) {
      ticker = document.createElement('div')
      ticker.className = 'day__ticker'
      ticker.setAttribute('aria-hidden', 'true')
      ticker.innerHTML =
        '<span class="ticker__ink"></span>' +
        steps.map((s) => `<span class="ticker__node">${$('.step__time', s).textContent ?? ''}</span>`).join('')
      viewport.prepend(ticker)
      ticker.querySelectorAll('.ticker__node')[5]?.classList.add('is-hatch')
    }
    resetSky()
    return ticker
  }
  const texts = steps.map((s) => $('.step__text', s))
  /**
   * The camera frames PH.frame of each plate across the screen, unless the stage is too short
   * for a plate that large under its copy: then the plate is drawn smaller (and more of it shows),
   * until every step's copy, with air above and below, and its plate down from its highest ink
   * fit the height under the programme. The copy reads across the page whatever the plate's
   * scale, so one pass does. (--s is the scale, px to a plate unit; --col a plate's width.)
   * Returns the span of plate units the screen shows.
   */
  const scalePhone = () => {
    const [left, right] = PH.frame
    const w = viewport.clientWidth
    const room = track.clientHeight - (parseFloat(getComputedStyle(track).paddingBottom) || 0)
    let k = w / (right - left)
    texts.forEach((t, i) => (k = Math.min(k, (room - t.offsetHeight - 2 * AIR) / (GROUND - PH.top[i]))))
    k = Math.max(k, 0.2)
    section.style.setProperty('--s', k.toFixed(4))
    section.style.setProperty('--col', `${(PLATE * k).toFixed(2)}px`)
    return w / k
  }
  const unstagePhone = () => {
    section.classList.remove('day--story', 'day--tall')
    section.style.removeProperty('--col')
    section.style.removeProperty('--s')
    ticker?.remove()
    ticker = null
    resetSky()
    steps.forEach((s) => s.style.removeProperty('--top'))
  }

  // A phone's walk is set up ahead, each half in a task of its own: the stage in its phone shape
  // (all of the day restyled and laid out again), then the plates' scale (laid out once more).
  // The walk then finds both done. (Should the phone have turned meanwhile, it goes back.)
  const phoneNow = (['phoneTall', 'phoneShort'] as const).find((q) => matchMedia(DAY_MEDIA[q]).matches)
  if (phoneNow) {
    stagePhone(phoneNow === 'phoneTall')
    void section.offsetHeight
    await nextTask()
    scalePhone()
    void steps[0].offsetWidth
    await nextTask()
    if (!matchMedia(DAY_MEDIA[phoneNow]).matches) unstagePhone()
  }

  const mm = gsap.matchMedia()

  /**
   * The walk itself: wide screens pin the whole section; phones (`phone`) pin it under the nav,
   * the heading and the stage together where the screen is tall enough (`tall`), else the stage alone.
   */
  const walk = (phone: boolean, tall = false) => () => {
    let ink: HTMLElement | null = null
    /** The phone story's row of seven eggs. */
    let nodes: HTMLElement[] = []
    /** Phones: what pins; then where the camera stands in a plate (its left edge, in plate units). */
    const box = tall ? $('.day__pin', section) : viewport
    if (!phone) {
      drawPlates('wide')
      resetSky()
    }
    let fit = () => {}
    let cam = 0
    let camHome = 0
    const bye = $('.day__end', track)
    if (phone) {
      // the stage takes its phone shape, and the plates their phone framing, before anything measures them
      const row = stagePhone(tall)
      ink = $<HTMLElement>('.ticker__ink', row)
      nodes = $$<HTMLElement>('.ticker__node', row)
      const [left, right] = PH.frame
      fit = () => {
        const span = scalePhone()
        cam = (left + right) / 2 - span / 2
        // on the way home it goes with the three towards the metro, as far as the last plate goes
        camHome = clamp(PLATE - span, cam, cam + 120)
      }
      fit()
      ScrollTrigger.addEventListener('refreshInit', fit)
    }
    const audience = phone ? PH.audience : AUDIENCE
    const landed = phone ? PH.landed : LANDED
    const stairs = phone ? PH.stairs : STAIRS
    const q = <T extends Element>(sel: string, el: ParentNode = cast) => el.querySelector<T>(sel)!
    const member = (id: string) => {
      const el = q<SVGGElement>('#' + id)
      return { el, l: q<SVGPathElement>('.leg--l', el), r: q<SVGPathElement>('.leg--r', el), tf: '', sw: '' }
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
    // a breath before the section lets go; on a phone, long enough to see Apply arrive
    tl.to({}, { duration: phone ? 0.6 : 0.3 })
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
      // (while it stands, nothing changes, so nothing is written)
      if (tf !== m.tf) m.el.setAttribute('transform', (m.tf = tf))
      const sw = (Math.sin(ph * 2) * 18 * a).toFixed(2)
      if (sw !== m.sw) {
        m.sw = sw
        m.l.setAttribute('transform', `rotate(${sw} 82 246)`)
        m.r.setAttribute('transform', `rotate(${(-sw).toFixed(2)} 118 246)`)
      }
      return tf
    }

    /** The way home: walk to the stairs, then down them, out of sight below the floor. */
    const homeward = (d: number, from: number, start: number) => {
      const w = band(d, start, start + 0.2)
      const down = band(d, start + 0.2, start + 0.32)
      return {
        x: lerp(from, PLATE * last + stairs, easeInOut(w)) + down * 40,
        sink: easeIn(down) * 340,
        a: Math.max(stride(w), down > 0 && down < 1 ? 1 : 0),
      }
    }

    let lastStage = ''
    let lastLabel = ''
    let lastChat = ''
    /** The column's width, measured on refresh rather than on every frame. */
    let col = steps[0].offsetWidth
    let told = -1
    const setX = gsap.quickSetter(track, 'x', 'px') as (x: number) => void
    const frame = () => {
      const colW = col
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

      // the camera keeps the egg's plate in the first column, until the last walk: then it holds,
      // so the day ends on Hatch, Afterglow and the way to Apply; the programme line inks up to the egg.
      // A phone shows one plate, so its camera stays with the egg all the way (and goes with the
      // three towards the metro at the end), and the row of eggs above the stage inks up instead;
      // the copy holds its place while the plates slide under it, and changes halfway through each walk.
      const home = state === last && here
      const camX = phone ? (colW / PLATE) * lerp(cam, camHome, home ? easeInOut(band(d, LEAVE[0], LEAVE[0] + 0.3)) : 0) : 0
      setX(phone ? -(pos * colW + camX) : -Math.min(pos, last - 1) * colW)
      const along = MARK + PLATE * pos
      if (ink) {
        ink.style.transform = `scaleX(${(pos / last).toFixed(4)})`
        texts.forEach((el, k) => (el.style.transform = `translate3d(${((pos - k) * colW + camX).toFixed(1)}px, 0, 0)`))
        bye.style.transform = `translate3d(${((pos - last) * colW + camX).toFixed(1)}px, 0, 0)`
        const near = Math.round(pos)
        if (near !== told) {
          told = near
          steps.forEach((s, k) => s.classList.toggle('is-told', k === near))
          nodes.forEach((n, k) => {
            n.classList.toggle('is-now', k === near)
            n.classList.toggle('is-past', k < near)
          })
        }
      } else progress.style.transform = `scaleX(${(along / (PLATE * steps.length)).toFixed(4)})`

      // our egg, and the two who stand listening at Crack until it walks past, then fall in behind it
      const walking = here ? 0 : Math.sin(Math.PI * t)
      const ours = home ? homeward(d, along, LEAVE[0]) : { x: along, sink: 0, a: walking }
      mates.forEach((m, k) => {
        const stand = PLATE + audience[k]
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
        if (!popped) return put(el, 'transform', heroTf)
        const f = hatching ? band(d, POP, POP + (p === 'top' ? 0.22 : 0.12)) : 1
        const [cx, cy] = PIECE[p]
        const [lx, ly, lr] = landed[p]
        const x0 = PLATE * 5 + MARK + (cx - 100) * K.hero
        const y0 = GROUND - STAGE.h - (330 - cy) * K.hero
        const x = lerp(x0, PLATE * 5 + lx, f)
        const y = lerp(y0, ly, f) - (p === 'top' ? 250 : 70) * Math.sin(Math.PI * f)
        const r = lerp(0, lr + (p === 'top' ? 360 : 0), easeOut(f))
        put(el, 'transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${K.hero}) translate(${-cx} ${-cy})`)
      })
      put(golden, 'opacity', popped ? '1' : '0')
      if (hatching && popped) {
        const s1 = band(d, POP, POP + 0.05)
        const s2 = band(d, POP + 0.05, POP + 0.16)
        const sy = s2 > 0 ? lerp(1.1, 1, easeOut(s2)) : lerp(0.86, 1.1, easeOut(s1))
        put(golden, 'transform', `translate(100 266) scale(${(2 - sy).toFixed(3)} ${sy.toFixed(3)}) translate(-100 -266)`)
        const r = band(d, POP, POP + 0.2)
        put(rays, 'opacity', (r > 0 && r < 1 ? 1 - r : 0).toFixed(2))
        put(rays, 'transform', `translate(100 146) scale(${(0.85 + 0.45 * r).toFixed(3)}) translate(-100 -146)`)
      } else {
        golden.removeAttribute('transform')
        put(rays, 'opacity', '0')
      }
      const [th, before, after] = CRACKS[state]
      const stage = String(!here || d >= th ? after : before)
      if (stage !== lastStage) cast.dataset.stage = lastStage = stage

      // the door opens on it, standing in the doorway
      const open = state === 0 && here ? easeInOut(band(d, 0.12, 0.55)) : 1
      put(door, 'transform', `translate(230 250) scale(${lerp(1, -0.34, open).toFixed(3)} 1)`)
      // sixty seconds on the stopwatch
      const sweep = state === 1 ? (here ? 360 * d : 360) : pos > 1 ? 360 : 0
      put(hand, 'transform', `rotate(${sweep.toFixed(1)} ${WATCH[0]} ${WATCH[1]})`)
      // the build, the break, the build again
      const [v, p] = state === 3 && here ? build(d) : pos > 3 ? [3, 1] : [1, 0]
      put(bar, 'width', (194 * Math.max(p, 0)).toFixed(1))
      const label = `v0.${v} · ${p < 0 ? 'ERR' : Math.round(p * 100) + '%'}`
      if (label !== lastLabel) barLabel.textContent = lastLabel = label
      // and the group chat, which carries on once they've gone
      const n = state === last ? Math.round(lerp(3, 214, easeIn(band(d, 0.04, 0.92)))) : 3
      const unread = lang === 'tr' ? `${n} okunmamış` : `${n} unread`
      if (unread !== lastChat) chatN.textContent = lastChat = unread
      chatLead.style.opacity = home ? (1 - band(d, LEAVE[0] + 0.02, LEAVE[0] + 0.1)).toFixed(2) : ''
      const end = String(home && d > (phone ? 0.86 : 0.9))
      if (section.dataset.end !== end) section.dataset.end = end

      // the club clock: each stay runs most of its hour, the walk finishes it; it stops at lights out
      const span = times[state + 1] - times[state]
      clockState.dayMinutes = here ? times[state] + span * 0.85 * d : lerp(times[state] + span * 0.85, times[state + 1], t)
      clockState.onChange()

      // the page drifts through the day with it, and flashes cream on the pop
      // (a phone takes the drift in sixteen steps a walk, each too small to see, so the whole
      // page isn't restyled on every frame)
      const fine = (v: number) => (phone ? Math.round(v * 16) / 16 : v)
      let sky = here ? SKY[state] : mix(SKY[state], SKY[state + 1], fine(t))
      if (hatching && popped) sky = mix(sky, PALETTE.cream, fine(0.8 * (1 - easeOut(band(d, POP, POP + 0.16)))))
      if (section.dataset.sky !== sky) section.dataset.sky = sky
      // (a phone only sends real changes)
      if (root.dataset.sky === 'day' && (!phone || page.c !== sky)) gsap.set(page, { c: sky })
    }

    const nav = $('#nav')
    const st = ScrollTrigger.create({
      trigger: phone ? box : section,
      pin: phone ? box : true,
      pinSpacer: holdFor(phone ? box : section),
      pinSpacing: true,
      // a phone pins just under the nav: the heading and the stage, or the stage once the heading has gone by
      start: phone ? () => `top ${nav.offsetHeight}px` : 'top top',
      end: () => '+=' + innerHeight * 0.55 * tl.duration(),
      scrub: 0.5,
      invalidateOnRefresh: true,
      animation: tl,
      onRefresh: (self) => {
        col = steps[0].offsetWidth
        clockState.dayStart = self.start
        clockState.dayEnd = self.end
        frame()
      },
      // the story ends on its own Apply, so the phone dock waits it out. A phone turned on its side
      // and back makes this pin anew, after the triggers below it: refreshPriority has the pins
      // measured first again, so everything under them counts their scroll
      ...(phone
        ? { anticipatePin: 1, refreshPriority: 1, onToggle: (self: ScrollTrigger) => holdDock('day', self.isActive) }
        : {}),
    })

    // (made mid-resize, a trigger has no end until the refresh that follows; onRefresh fills it in)
    if (Number.isFinite(st.end)) {
      clockState.dayStart = st.start
      clockState.dayEnd = st.end
    }
    frame()

    return () => {
      clockState.dayMinutes = null
      current = -1
      marked = ''
      gsap.set(track, { clearProps: 'transform' })
      progress.style.removeProperty('transform')
      hand.setAttribute('transform', rest.hand)
      bar.setAttribute('width', rest.bar)
      barLabel.textContent = rest.label
      chatN.textContent = rest.chat
      chatLead.style.removeProperty('opacity')
      delete section.dataset.end
      delete section.dataset.tl
      if (phone) {
        ScrollTrigger.removeEventListener('refreshInit', fit)
        unstagePhone()
        nodes = []
        steps.forEach((s) => s.classList.remove('is-told'))
        texts.forEach((el) => el.style.removeProperty('transform'))
        bye.style.removeProperty('transform')
        holdDock('day', false)
      }
    }
  }

  mm.add(DAY_MEDIA.wide, walk(false))
  // a phone at least 720px tall keeps the heading on the stage (.day--tall); a shorter one gives the plate the room
  mm.add(DAY_MEDIA.phoneTall, walk(true, true))
  mm.add(DAY_MEDIA.phoneShort, walk(true))

  /**
   * The vertical programme: phones on their side, and reduced motion. Narrower than the wide
   * layout (`narrow`), each plate is the phone story's, framed close and cut to its own ink, so the
   * copy and its picture read together with no empty sky between them.
   */
  const book = (narrow: boolean) => () => {
    drawPlates(narrow ? 'crop' : 'wide')
    resetSky()
    section.classList.toggle('day--crop', narrow)
    const setBook = (i: number) => {
      if (i === current) return
      current = i
      markStep(i, true, true)
      section.dataset.sky = SKY[i]
      if (root.dataset.sky === 'day') gsap.to(page, { c: SKY[i], duration: 0.9, ease: 'power2.out', overwrite: true })
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
      marked = ''
      triggers.forEach((t) => t.kill())
      range.kill()
      section.classList.remove('day--crop')
    }
  }
  mm.add(DAY_MEDIA.crop, book(true))
  mm.add(DAY_MEDIA.still, book(false))
}
