import { gsap } from 'gsap'
import { $, clamp, reducedMotion } from './util'
import { FIG_VIEWBOX, emptyEgg, figure, type Kind } from './figures'
import { lang } from './i18n'

interface Bird {
  name: string
  say: string
  kind: Kind
  tilt: number
}

const FLOCK_EN: Bird[] = [
  { name: 'the night-owl engineer', say: 'it works on my machine.', kind: 'owl', tilt: -5 },
  { name: 'the designer', say: 'can we try it in a softer yellow?', kind: 'designer', tilt: 6 },
  { name: 'the hardware person', say: 'I brought a soldering iron. And a spare.', kind: 'hardware', tilt: -4 },
  { name: 'the recovering founder', say: 'no pitch, promise. ok, a tiny one.', kind: 'founder', tilt: 5 },
  { name: 'the researcher', say: 'there’s a paper on this. I wrote it.', kind: 'researcher', tilt: 4 },
  { name: 'the musician', say: 'what if the app… had a bassline?', kind: 'musician', tilt: -6 },
  { name: 'the first-timer', say: 'first hackathon. third slice.', kind: 'firstTimer', tilt: 5 },
  { name: 'here for the pizza', say: 'honestly? the pizza.', kind: 'pizza', tilt: -4 },
]

const FLOCK_TR: Bird[] = [
  { name: 'gece kuşu mühendis', say: 'bende çalışıyor.', kind: 'owl', tilt: -5 },
  { name: 'tasarımcı', say: 'daha yumuşak bir sarı deneyebilir miyiz?', kind: 'designer', tilt: 6 },
  { name: 'donanımcı', say: 'bir lehim havyası getirdim. Bir de yedek.', kind: 'hardware', tilt: -4 },
  { name: 'iyileşen girişimci', say: 'sunum yok, söz. tamam, ufak bir tane.', kind: 'founder', tilt: 5 },
  { name: 'araştırmacı', say: 'bu konuda bir makale var. Ben yazdım.', kind: 'researcher', tilt: 4 },
  { name: 'müzisyen', say: 'uygulamanın… bir bas hattı olsa?', kind: 'musician', tilt: -6 },
  { name: 'ilk kez gelen', say: 'ilk hackathon. üçüncü dilim.', kind: 'firstTimer', tilt: 5 },
  { name: 'pizza için burada', say: 'açıkçası? pizza.', kind: 'pizza', tilt: -4 },
]

const FLOCK: Bird[] = lang === 'tr' ? FLOCK_TR : FLOCK_EN
/** "fig." in a specimen plate; Turkish plates say "şekil" */
const FIG = lang === 'tr' ? 'şek.' : 'fig.'

const svg = (inner: string) => `<svg viewBox="${FIG_VIEWBOX}" aria-hidden="true" focusable="false">${inner}</svg>`

export function initFlock() {
  const field = $('#flockField')
  if (!field) return

  const cells: HTMLElement[] = []
  FLOCK.forEach((b, i) => {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = `bird bird--${b.kind}`
    el.style.setProperty('--tilt', `${b.tilt}deg`)
    el.style.setProperty('--i', String(i))
    el.setAttribute('aria-label', `${b.name}: “${b.say}”`)
    el.innerHTML = `
      <span class="bird__fig" aria-hidden="true">${FIG} ${String(i + 1).padStart(2, '0')}</span>
      <span class="bird__say" aria-hidden="true">“${b.say}”</span>
      <span class="bird__body">${svg(figure(b.kind, lang))}</span>
      <span class="bird__name" aria-hidden="true">${b.name}</span>`
    field.append(el)
    cells.push(el)
  })

  const you = document.createElement('a')
  you.href = '#join'
  you.className = 'bird bird--you'
  you.style.setProperty('--tilt', '-3deg')
  you.setAttribute(
    'aria-label',
    lang === 'tr' ? 'Sen? Üzerinde adın yazan bir sandalye var — katıl' : 'You? There’s a seat with your name on it — join',
  )
  you.innerHTML = `
    <span class="bird__fig" aria-hidden="true">${FIG} 09</span>
    <span class="bird__say" aria-hidden="true">“${lang === 'tr' ? 'üzerinde adın yazan bir sandalye var.' : 'there’s a seat with your name on it.'}”</span>
    <span class="bird__body">${svg(emptyEgg(lang))}</span>
    <span class="bird__name" aria-hidden="true">${lang === 'tr' ? 'devamı var' : 'to be continued'}</span>`
  field.append(you)
  cells.push(you)

  const note = document.createElement('div')
  note.className = 'flock__note'
  note.setAttribute('aria-hidden', 'true')
  note.innerHTML =
    lang === 'tr'
      ? `<p class="hand">birini çek.<br/>geri sıçrar.</p><p class="mono">levha 02 · müdavimler</p>`
      : `<p class="hand">pull one.<br/>it bounces back.</p><p class="mono">plate 02 · the regulars</p>`
  field.append(note)

  // Tap to read the quote on touch.
  cells.forEach((el) => {
    el.addEventListener('click', (e) => {
      if (el.dataset.dragged === '1') {
        e.preventDefault()
        el.dataset.dragged = ''
        return
      }
      if (el instanceof HTMLButtonElement) {
        cells.forEach((o) => o !== el && o.classList.remove('is-talking'))
        el.classList.toggle('is-talking')
      }
    })
  })

  initPlateRow(field, cells)

  // ── pull and let go: the figure springs back into its cell ──
  if (reducedMotion()) return
  cells.forEach((el) => {
    const body = el.querySelector('.bird__body') as HTMLElement
    const art = body.firstElementChild as SVGElement
    let sx = 0
    let sy = 0
    let lastX = 0
    let moved = false
    let active = false

    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return
      active = true
      moved = false
      sx = lastX = e.clientX
      sy = e.clientY
      el.setPointerCapture(e.pointerId)
      gsap.killTweensOf(art)
    })
    el.addEventListener('pointermove', (e) => {
      if (!active) return
      const dx = e.clientX - sx
      const dy = e.clientY - sy
      if (!moved && Math.hypot(dx, dy) < 5) return
      if (!moved) {
        moved = true
        el.classList.add('is-dragging')
        el.classList.remove('is-talking')
      }
      // a rubber band: the further you pull, the harder it resists
      const k = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 0.82)
      gsap.set(art, { x: k(dx), y: k(dy), rotation: clamp((e.clientX - lastX) * 1.4, -22, 22) })
      lastX = e.clientX
    })
    const end = () => {
      if (!active) return
      active = false
      el.classList.remove('is-dragging')
      if (moved) {
        el.dataset.dragged = '1'
        gsap.to(art, { x: 0, y: 0, rotation: 0, duration: 1.1, ease: 'elastic.out(1.1, 0.32)' })
        setTimeout(() => (el.dataset.dragged = ''), 50)
      }
    }
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
  })
}

/**
 * Phones read the plate as one row you swipe through. Under it, a counter
 * and two arrows say there's more (and work for anyone who doesn't swipe),
 * and whoever is in front says their line without being tapped.
 */
function initPlateRow(field: HTMLElement, cells: HTMLElement[]) {
  const phone = matchMedia('(max-width: 760px)')
  const total = String(cells.length).padStart(2, '0')
  const nav = document.createElement('div')
  nav.className = 'flock__nav'
  nav.innerHTML = `
    <p class="flock__count mono" aria-hidden="true"><b>${FIG} 01</b> / ${total}</p>
    <div class="flock__arrows">
      <button type="button" class="flock__arrow" data-dir="-1" aria-controls="flockField" aria-label="${lang === 'tr' ? 'Önceki' : 'Previous'}">←</button>
      <button type="button" class="flock__arrow" data-dir="1" aria-controls="flockField" aria-label="${lang === 'tr' ? 'Sonraki' : 'Next'}">→</button>
    </div>`
  field.after(nav)
  const count = nav.querySelector('b')!
  const [prev, next] = Array.from(nav.querySelectorAll<HTMLButtonElement>('.flock__arrow'))

  const step = () => Math.max(1, (cells[1]?.offsetLeft ?? 1) - (cells[0]?.offsetLeft ?? 0))
  const at = () => clamp(Math.round(field.scrollLeft / step()), 0, cells.length - 1)
  let seen = false
  const talk = () => {
    if (!phone.matches || !seen) return
    const i = at()
    cells.forEach((c, k) => c.classList.toggle('is-talking', k === i))
  }
  // back on a wide screen, quotes are for hovering again
  phone.addEventListener('change', () => {
    if (phone.matches) talk()
    else cells.forEach((c) => c.classList.remove('is-talking'))
  })
  const update = () => {
    const i = at()
    count.textContent = `${FIG} ${String(i + 1).padStart(2, '0')}`
    prev.disabled = field.scrollLeft < 4
    next.disabled = field.scrollLeft > field.scrollWidth - field.clientWidth - 4
  }

  nav.addEventListener('click', (e) => {
    const dir = Number((e.target as HTMLElement).closest<HTMLElement>('[data-dir]')?.dataset.dir)
    if (dir) field.scrollBy({ left: dir * step(), behavior: reducedMotion() ? 'auto' : 'smooth' })
  })
  let frame = 0
  let settle = 0
  field.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
      clearTimeout(settle)
      settle = window.setTimeout(talk, 160)
    },
    { passive: true },
  )
  // the first figure speaks up once the row is properly on screen
  new IntersectionObserver(
    (entries, io) => {
      if (!entries.some((e) => e.isIntersecting)) return
      seen = true
      talk()
      io.disconnect()
    },
    { threshold: 0.6 },
  ).observe(field)
  update()
}
