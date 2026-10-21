import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { $, reducedMotion } from './util'
import { createNightShift } from './nightshift'

/**
 * The footer's secret, Simile-style: keep scrolling past the footer and the
 * night opens like a portal, an arcade cabinet settles into place, and
 * Night Shift is simply there — no click needed. Scroll back up to leave.
 */
export function initPortal() {
  const stage = $('#portal')
  const cabinet = $('#cabinet')
  const poke = $<HTMLButtonElement>('#poke')
  const reduce = reducedMotion()

  const game = createNightShift({
    canvas: $<HTMLCanvasElement>('#pixelGame'),
    hud: $('#ghud'),
    dialog: $('#gdialog'),
    dialogName: $('#gdName'),
    dialogText: $('#gdText'),
    card: $('#gcard'),
    hint: $('#ghint'),
    onExit: () => document.getElementById('join')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }),
    reducedMotion: reduce,
  })

  const screen = $('#screen')
  let mode: 'off' | 'preview' | 'live' = 'off'
  const setMode = (next: typeof mode) => {
    if (next === mode) return
    const wasLive = mode === 'live'
    mode = next
    document.body.classList.toggle('is-arcade', next === 'live')
    if (next === 'off') game.stop()
    else if (next === 'preview') {
      if (wasLive) game.release()
      game.preview()
    } else {
      game.start()
      // a little CRT power-on blink every time you arrive
      screen.classList.remove('is-on')
      void screen.offsetWidth
      screen.classList.add('is-on')
    }
  }

  const reveal = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
  if (reduce) {
    reveal.set(stage, { '--r': '150%' }).set(cabinet, { opacity: 1 })
  } else {
    reveal
      .fromTo(stage, { '--r': '0%' }, { '--r': '150%', duration: 0.5, ease: 'power2.in' }, 0)
      .fromTo(
        cabinet,
        { opacity: 0, y: 120, scale: 0.82, rotateX: 22 },
        { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 0.55, ease: 'power3.out' },
        0.3,
      )
  }

  const st = ScrollTrigger.create({
    trigger: stage,
    start: 'top 85%',
    end: 'bottom bottom',
    scrub: reduce ? true : 0.25,
    animation: reveal,
    onUpdate: (self) => setMode(self.progress > 0.85 ? 'live' : self.progress > 0.2 ? 'preview' : 'off'),
    onLeaveBack: () => setMode('off'),
  })

  // ── getting there ──
  // Scrolling past the footer simply scrolls into the cabinet; the reveal
  // above is scroll-driven, so nothing has to take the scroll away from
  // you. The footer's "keep scrolling" note glides you down in one go.
  let gliding = false
  const glide = (to: number) => {
    if (gliding) return
    const from = scrollY
    if (Math.abs(to - from) < 2) return
    if (reduce) {
      window.scrollTo({ top: to, behavior: 'instant' as ScrollBehavior })
      return
    }
    gliding = true
    const dur = Math.min(1100, 520 + Math.abs(to - from) * 0.35)
    const t0 = performance.now()
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    // any wheel/touch from the reader cancels the glide instead of fighting it
    const cancel = () => (gliding = false)
    addEventListener('wheel', cancel, { once: true, passive: true })
    addEventListener('touchstart', cancel, { once: true, passive: true })
    const step = (now: number) => {
      if (!gliding) return
      const t = Math.min(1, (now - t0) / dur)
      window.scrollTo({ top: from + (to - from) * ease(t), behavior: 'instant' as ScrollBehavior })
      if (t < 1) requestAnimationFrame(step)
      else {
        gliding = false
        removeEventListener('wheel', cancel)
        removeEventListener('touchstart', cancel)
      }
    }
    requestAnimationFrame(step)
  }

  // The footer's note just takes you there.
  poke.addEventListener('click', () => glide(st.end))
  $('#gClose').addEventListener('click', () => game.restart())
  $('#gTalk').addEventListener('click', () => game.talk())
}
