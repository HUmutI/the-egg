import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, $$, PALETTE, clamp, clockState, lerp } from './util'

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

const LABELS: [number, string][] = [
  [12 * 60, 'doors soon'],
  [12 * 60 + 30, 'doors open'],
  [13 * 60 + 15, 'pitching'],
  [13 * 60 + 30, 'teaming up'],
  [18 * 60, 'building'],
  [19 * 60, 'pizza'],
  [21 * 60 + 30, 'building'],
  [23 * 60, 'demos'],
  [24 * 60, 'afterglow'],
  [24 * 60 + 40, 'last metro'],
  [99 * 60, 'night owls'],
]

export function initSky() {
  const body = document.body
  const meta = $<HTMLMetaElement>('meta[name="theme-color"]')

  $$('[data-bg]').forEach((el) => {
    const color = BG[el.dataset.bg ?? 'butter']
    // Night only falls once the footer has really arrived.
    const at = el.dataset.bg === 'night' ? '25%' : '55%'
    ScrollTrigger.create({
      trigger: el,
      start: `top ${at}`,
      end: `bottom ${at}`,
      onToggle: (self) => {
        if (!self.isActive) return
        gsap.to(body, { backgroundColor: color, duration: 0.9, ease: 'power2.out', overwrite: true })
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
      [0, 11 * 60 + 40],
      [Math.max(1, clockState.dayStart), 12 * 60],
      [clockState.dayEnd, 23 * 60 + 10],
      [footTop, 24 * 60 + 30],
      [max, 24 * 60 + 59],
    ]
    for (let i = 0; i < keys.length - 1; i++) {
      const [y0, m0] = keys[i]
      const [y1, m1] = keys[i + 1]
      if (y <= y1 || i === keys.length - 2) {
        return lerp(m0, m1, clamp((y - y0) / Math.max(1, y1 - y0), 0, 1))
      }
    }
    return 12 * 60
  }

  let last = ''
  const render = () => {
    const m = Math.round(minutesAt(scrollY))
    const hh = String(Math.floor(m / 60) % 24).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    const str = `${hh}:${mm}`
    if (str !== last) {
      last = str
      time.textContent = str
      label.textContent = (LABELS.find(([t]) => m < t) ?? LABELS[LABELS.length - 1])[1]
      // Sun travels the arc from 07:00 to 21:00, then the moon takes over.
      const t = clamp((m - 7 * 60) / (14 * 60), 0, 1)
      const a = Math.PI * (1 - t)
      sun.setAttribute('cx', String(32 + Math.cos(a) * 29))
      sun.setAttribute('cy', String(24 - Math.sin(a) * 22))
      sun.style.fill = m > 20 * 60 + 30 ? PALETTE.lav : PALETTE.yolk
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
