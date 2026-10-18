import { $, $$ } from './util'

/** Fade-ups, the hand-drawn strikethroughs and the first-rule correction. */
export function initReveals() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const el = e.target as HTMLElement
        el.classList.add(el.classList.contains('strikes') ? 'is-struck' : 'is-in')
        io.unobserve(el)
      }
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
  )
  $$('.reveal, .strikes, .rule--first, .rules').forEach((el) => io.observe(el))
}

/** Who comes: hover (or tap) a name and the caption line explains them. */
export function initWho() {
  const list = $('#whoList')
  if (!list) return
  const k = $('#whoK')
  const v = $('#whoV')
  const names = $$<HTMLButtonElement>('.who__n', list)
  if (!matchMedia('(hover: hover)').matches) k.textContent = 'tap a name'
  const def = [k.textContent, v.textContent]
  const show = (b: HTMLButtonElement | null) => {
    names.forEach((n) => n.classList.toggle('is-on', n === b))
    k.textContent = b ? b.textContent!.replace(/\.$/, '') : def[0]
    v.textContent = b ? `— ${b.dataset.note}` : def[1]
  }
  names.forEach((b) => {
    b.addEventListener('pointerenter', () => show(b))
    b.addEventListener('focus', () => show(b))
    b.addEventListener('click', () => show(b))
  })
  list.addEventListener('pointerleave', () => show(null))
}
