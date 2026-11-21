import { gsap } from 'gsap'
import { $, clamp, nextTask, reducedMotion } from './util'
import { FIG_VIEWBOX, emptyEgg, figure, miniEgg, miniYou, type Kind } from './figures'
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

const nn = (i: number) => String(i + 1).padStart(2, '0')
const YOU =
  lang === 'tr'
    ? { name: 'devamı var', say: 'üzerinde adın yazan bir sandalye var.', join: 'katıl' }
    : { name: 'to be continued', say: 'there’s a seat with your name on it.', join: 'join' }

/**
 * The plate of regulars: nine figures on one sheet, each with its number, its name and the line
 * it says, printed under it (nothing waits on a hover or a tap). Wide screens lay the sheet out
 * as a grid, and a figure can be pulled about (it springs back). Phones read it as a strip, one
 * figure at a time, with the whole cast standing in a carton under it (initCarton).
 */
export async function initFlock() {
  const field = $('#flockField')
  if (!field) return

  const caption = (name: string, say: string) =>
    `<figcaption class="bird__cap"><span class="bird__name">${name}</span><span class="bird__say">“${say}”</span></figcaption>`

  const cells: HTMLElement[] = []
  FLOCK.forEach((b, i) => {
    const el = document.createElement('figure')
    el.className = `bird bird--${b.kind}`
    el.style.setProperty('--tilt', `${b.tilt}deg`)
    el.style.setProperty('--i', String(i))
    el.innerHTML = `
      <span class="bird__fig">${FIG} ${nn(i)}</span>
      <span class="bird__body">${svg(figure(b.kind, lang))}</span>
      ${caption(b.name, b.say)}`
    cells.push(el)
  })

  // the empty seat is the way in: the whole cell is the link
  const you = document.createElement('a')
  you.href = '#join'
  you.className = 'bird bird--you'
  you.style.setProperty('--tilt', '-3deg')
  you.setAttribute('aria-label', `${FIG} ${nn(FLOCK.length)}, ${YOU.name}: “${YOU.say}” — ${YOU.join}`)
  you.innerHTML = `
    <span class="bird__fig" aria-hidden="true">${FIG} ${nn(FLOCK.length)}</span>
    <span class="bird__body">${svg(emptyEgg(lang))}</span>
    <span class="bird__cap" aria-hidden="true"><span class="bird__name">${YOU.name}</span><span class="bird__say">“${YOU.say}”</span></span>`
  cells.push(you)

  const note = document.createElement('div')
  note.className = 'flock__note'
  note.setAttribute('aria-hidden', 'true')
  note.innerHTML =
    lang === 'tr'
      ? `<p class="hand">birini çek.<br/>geri sıçrar.</p><p class="mono">levha 02 · müdavimler</p>`
      : `<p class="hand">pull one.<br/>it bounces back.</p><p class="mono">plate 02 · the regulars</p>`

  // The plate goes up a few figures at a time, each few laid out in a task of its own: nine
  // inked figures laid out at once (by whatever reads the page next) are one long task.
  const parts = [...cells, note]
  for (let i = 0; i < parts.length; i += 4) {
    if (i) await nextTask()
    field.append(...parts.slice(i, i + 4))
    void field.offsetHeight
  }

  // a pull that ends on the empty seat's link is not a click on it
  you.addEventListener('click', (e) => {
    if (you.dataset.dragged !== '1') return
    e.preventDefault()
    you.dataset.dragged = ''
  })

  initCarton(field, cells)

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
        // its own layer while it's pulled about: the inked lines are filtered, and
        // moving them as a picture beats repainting the wobble on every pointer move
        art.style.willChange = 'transform'
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
        gsap.to(art, {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 1.1,
          ease: 'elastic.out(1.1, 0.32)',
          // settled, it's printed again at full sharpness
          onComplete: () => art.style.removeProperty('will-change'),
        })
        setTimeout(() => (el.dataset.dragged = ''), 50)
      }
    }
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
  })
}

/**
 * Phones read the plate as a strip you swipe through, a figure at a time. Under it stands the
 * carton: the whole cast as nine small eggs in a row (the statement's carton, grown up), so the
 * mix is in view at once. The egg of whoever is in front stands up out of it, and a tap on any
 * egg brings its figure round. The strip walks in from the right as it arrives, which also says
 * it moves; the figure in front is the one whose moving part is awake.
 */
function initCarton(field: HTMLElement, cells: HTMLElement[]) {
  const phone = matchMedia('(max-width: 760px)')
  const carton = document.createElement('div')
  carton.className = 'flock__carton'
  carton.setAttribute('role', 'group')
  carton.setAttribute('aria-label', lang === 'tr' ? 'Kim geliyor: bir figür seç' : 'Who comes: pick a figure')
  carton.innerHTML =
    FLOCK.map(
      (b, i) =>
        `<button type="button" class="carton__egg" data-i="${i}" aria-controls="flockField" aria-label="${FIG} ${nn(i)}, ${b.name}">${miniEgg(b.kind)}</button>`,
    ).join('') +
    `<button type="button" class="carton__egg carton__egg--you" data-i="${FLOCK.length}" aria-controls="flockField" aria-label="${FIG} ${nn(FLOCK.length)}, ${YOU.name}">${miniYou()}</button>`
  field.after(carton)
  const eggs = Array.from(carton.querySelectorAll<HTMLButtonElement>('.carton__egg'))
  cells.forEach((c, k) => c.style.setProperty('--n', String(k)))

  // The strip's geometry, measured when it changes size rather than on every scroll frame: reading
  // it after a class was written would lay the page out again, mid-frame.
  let stepPx = 1
  let maxLeft = 0
  let left = 0
  const measure = () => {
    stepPx = Math.max(1, (cells[1]?.offsetLeft ?? 1) - (cells[0]?.offsetLeft ?? 0))
    maxLeft = field.scrollWidth - field.clientWidth
    left = field.scrollLeft
  }
  // (the last figure can't reach the strip's start: at the end of the strip, it is the one in front)
  const at = () => (maxLeft > 0 && left > maxLeft - 4 ? cells.length - 1 : clamp(Math.round(left / stepPx), 0, cells.length - 1))
  let shown = -1
  const update = () => {
    const i = phone.matches ? at() : -1
    if (i === shown) return
    shown = i
    eggs.forEach((egg, k) => (k === i ? egg.setAttribute('aria-current', 'true') : egg.removeAttribute('aria-current')))
    cells.forEach((c, k) => c.classList.toggle('is-talking', k === i))
  }

  carton.addEventListener('click', (e) => {
    const i = Number((e.target as HTMLElement).closest<HTMLElement>('[data-i]')?.dataset.i ?? -1)
    if (i >= 0) field.scrollTo({ left: i * stepPx, behavior: reducedMotion() ? 'auto' : 'smooth' })
  })
  let frame = 0
  field.addEventListener(
    'scroll',
    () => {
      left = field.scrollLeft
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    },
    { passive: true },
  )
  // back on a wide screen nobody is in front
  phone.addEventListener('change', update)
  new IntersectionObserver(
    (entries, io) => {
      if (!entries.some((e) => e.isIntersecting)) return
      field.classList.add('is-in')
      io.disconnect()
    },
    { threshold: 0.2 },
  ).observe(field)
  // (its first call comes once the strip is laid out)
  const ro = new ResizeObserver(() => {
    measure()
    update()
  })
  ;[field, cells[0], cells[cells.length - 1]].forEach((el) => el && ro.observe(el))
}
