import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, PALETTE, clamp, clockState, lerp } from './util'
import { lang } from './i18n'

/**
 * The whole page is one Sunday. As you scroll, the background drifts through
 * the day's colours and the club clock in the nav ticks from doors-open to
 * the night owls.
 */

const BG: Record<string, string> = {
  butter: PALETTE.butter,
  lav: PALETTE.lav,
  mint: PALETTE.mint,
  peach: PALETTE.peach,
  pink: PALETTE.pink,
  yolk: PALETTE.yolk,
  night: PALETTE.night,
}

const LABELS: [number, string][] =
  lang === 'tr'
    ? [
        [10 * 60 + 30, 'kapılar yakında'],
        [11 * 60, 'kapılar açık'],
        [11 * 60 + 30, 'fikir sunumu'],
        [12 * 60, 'takım kurma'],
        [18 * 60, 'işbaşında'],
        [19 * 60, 'pizza'],
        [20 * 60, 'sunumlar'],
        [21 * 60, 'tatlı yorgunluk'],
        [22 * 60, 'eve dönüş'],
        [99 * 60, 'gece kuşları'],
      ]
    : [
        [10 * 60 + 30, 'doors soon'],
        [11 * 60, 'doors open'],
        [11 * 60 + 30, 'idea pitches'],
        [12 * 60, 'teaming up'],
        [18 * 60, 'building'],
        [19 * 60, 'pizza'],
        [20 * 60, 'pitches'],
        [21 * 60, 'afterglow'],
        [22 * 60, 'heading home'],
        [99 * 60, 'night owls'],
      ]

export function initSky() {
  const root = document.documentElement
  const body = document.body
  const nav = $('#nav')
  const meta = $<HTMLMetaElement>('meta[name="theme-color"]')

  // The sky is one custom property, --page: the body paints it and the
  // nav's backdrop band tints itself with it, so both drift together.
  gsap.set(root, { '--page': PALETTE.butter })
  $$('[data-bg]').forEach((el) => {
    // The day section paints its own sky as it goes (day.ts keeps data-sky
    // current); every other section is one colour.
    const colorOf = () => (el.dataset.bg === 'day' ? (el.dataset.sky ?? PALETTE.lav) : BG[el.dataset.bg ?? 'butter'])
    // Night only falls once the footer has really arrived.
    const at = el.dataset.bg === 'night' ? '25%' : '55%'
    ScrollTrigger.create({
      trigger: el,
      start: `top ${at}`,
      end: `bottom ${at}`,
      onToggle: (self) => {
        if (!self.isActive) return
        const color = colorOf()
        root.dataset.sky = el.id
        gsap.to(root, { '--page': color, duration: 0.9, ease: 'power2.out', overwrite: true })
        body.classList.toggle('is-night', el.dataset.bg === 'night')
        meta?.setAttribute('content', color)
      },
    })
  })

  // ── club clock ──
  const time = $('.clock__time')
  const label = $('.clock__label')
  const sun = $<SVGCircleElement>('.clock__sun')
  const foot = $('#foot')

  const minutesAt = (y: number) => {
    if (clockState.dayMinutes !== null && y >= clockState.dayStart && y <= clockState.dayEnd) {
      return clockState.dayMinutes
    }
    const max = document.documentElement.scrollHeight - innerHeight
    const footTop = foot.offsetTop - innerHeight * 0.6
    const keys: [number, number][] = [
      [0, 10 * 60 + 10],
      [Math.max(1, clockState.dayStart), 10 * 60 + 30],
      [clockState.dayEnd, 20 * 60 + 10],
      // rules, questions and the carton share the afterglow; the footer is the way home
      [footTop, 20 * 60 + 58],
      [max, 22 * 60 + 30],
    ]
    for (let i = 0; i < keys.length - 1; i++) {
      const [y0, m0] = keys[i]
      const [y1, m1] = keys[i + 1]
      if (y <= y1 || i === keys.length - 2) {
        return lerp(m0, m1, clamp((y - y0) / Math.max(1, y1 - y0), 0, 1))
      }
    }
    return 10 * 60 + 30
  }

  let last = ''
  let scrolled: boolean | null = null
  const render = () => {
    const s = scrollY > 8
    if (s !== scrolled) nav?.classList.toggle('is-scrolled', (scrolled = s))
    const m = Math.round(minutesAt(scrollY))
    const hh = String(Math.floor(m / 60) % 24).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    const str = `${hh}:${mm}`
    if (str !== last) {
      last = str
      time.textContent = str
      label.textContent = (LABELS.find(([t]) => m < t) ?? LABELS[LABELS.length - 1])[1]
      // Sun travels the arc from 07:00 to 18:00 (an autumn Ankara day), then
      // the moon takes over around pizza.
      const t = clamp((m - 7 * 60) / (11 * 60), 0, 1)
      const a = Math.PI * (1 - t)
      sun.setAttribute('cx', String(32 + Math.cos(a) * 29))
      sun.setAttribute('cy', String(24 - Math.sin(a) * 22))
      sun.style.fill = m > 17 * 60 + 30 ? PALETTE.lav : PALETTE.yolk
    }
  }

  let ticking = false
  addEventListener(
    'scroll',
    () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        render()
      })
    },
    { passive: true },
  )
  ScrollTrigger.addEventListener('refresh', render)
  clockState.onChange = render
  render()
}
