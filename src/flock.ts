import { gsap } from 'gsap'
import { $, clamp, reducedMotion } from './util'
import { FIG_VIEWBOX, emptyEgg, ensureRisoDefs, figure, type Kind } from './figures'
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
  ensureRisoDefs()

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
