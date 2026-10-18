import { $, $$, reducedMotion } from './util'

/**
 * The hero is a single finished illustration. It arrives gently once it has
 * decoded; then someone scribbles on it — the notes in #doodles draw on in
 * sequence, and redraw themselves when you hover them.
 */
export function initHero() {
  const img = $<HTMLImageElement>('#heroArt')
  const doodles = $<SVGSVGElement>('#doodles')
  if (!img) return

  const show = () => {
    img.classList.add('is-in')
    if (doodles) setTimeout(() => doodles.classList.add('is-drawn'), reducedMotion() ? 0 : 350)
  }
  if (img.complete && img.naturalWidth) show()
  else {
    img.addEventListener('load', show, { once: true })
    img.addEventListener('error', show, { once: true })
  }

  fillStrip()

  if (!doodles || reducedMotion()) return
  $$<SVGGElement>('[data-redraw]', doodles).forEach((g) => {
    let busy = false
    g.addEventListener('pointerenter', () => {
      if (busy || !doodles.classList.contains('is-drawn')) return
      busy = true
      g.style.setProperty('--d', '0s')
      g.classList.add('is-redrawing')
      void g.getBoundingClientRect()
      requestAnimationFrame(() => g.classList.remove('is-redrawing'))
      setTimeout(() => (busy = false), 900)
    })
  })
}

/**
 * The logo strip loops by sliding -50%, so its contents have to be two
 * identical halves, each at least as wide as the window. Repeat the real
 * list until that's true; repeats are hidden from screen readers.
 */
function fillStrip() {
  const track = $<HTMLUListElement>('.built__track')
  const win = track?.parentElement
  if (!track || !win) return
  const originals = Array.from(track.children) as HTMLElement[]
  const build = () => {
    track.querySelectorAll('[data-clone]').forEach((n) => n.remove())
    const unit = originals.reduce((w, li) => w + li.getBoundingClientRect().width, 0) || 1
    const copies = Math.max(1, Math.ceil(win.clientWidth / unit))
    const half: HTMLElement[] = []
    for (let k = 1; k < copies; k++) originals.forEach((li) => half.push(li.cloneNode(true) as HTMLElement))
    const second = [...originals, ...half].map((li) => li.cloneNode(true) as HTMLElement)
    for (const li of [...half, ...second]) {
      li.dataset.clone = ''
      li.setAttribute('aria-hidden', 'true')
      li.querySelector('img')?.setAttribute('alt', '')
      track.append(li)
    }
    // keep the speed constant however many copies there are
    track.style.animationDuration = `${Math.round(((unit * copies) / 60) * 10) / 10}s`
  }
  const imgs = originals.map((li) => li.querySelector('img')!).filter(Boolean)
  Promise.all(imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => i.addEventListener('load', r, { once: true }))))).then(build)
  let t = 0
  addEventListener('resize', () => {
    clearTimeout(t)
    t = window.setTimeout(build, 200)
  })
}
