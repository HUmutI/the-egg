import { gsap } from 'gsap'
import { $, $$, reducedMotion } from './util'

const STORE = 'eggclub:signups'

/**
 * One question at a time, like a conversation. Submissions are kept in
 * localStorage until there's a real backend to send them to.
 */
export function initJoin() {
  const form = $<HTMLFormElement>('#joinForm')
  if (!form) return
  const qs = $$<HTMLElement>('.q', form)
  const stepLabel = $('#quizStep')
  const nameInput = $<HTMLInputElement>('#fName')
  const emailInput = $<HTMLInputElement>('#fEmail')
  const error = $('#quizError')
  let step = 0

  const go = (n: number) => {
    step = n
    qs.forEach((q, i) => q.classList.toggle('is-active', i === n))
    stepLabel.textContent = n < 3 ? `0${n + 1} / 03` : 'done ✓'
    const target = qs[n].querySelector<HTMLElement>('input:not([type=hidden]), button') ?? qs[n]
    target.focus({ preventScroll: true })
  }

  const shake = (el: HTMLElement) => {
    if (reducedMotion()) return
    gsap.fromTo(el, { x: 0 }, { keyframes: { x: [-10, 9, -6, 4, 0] }, duration: 0.45, ease: 'none' })
  }

  const nextFromName = () => {
    const name = nameInput.value.trim()
    if (!name) {
      shake(nameInput)
      nameInput.focus()
      return
    }
    $$('[data-name]', form).forEach((el) => (el.textContent = name.split(' ')[0]))
    go(1)
  }

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextFromName()
    }
  })

  form.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-next]')
    if (!btn) return
    if (step === 0) nextFromName()
    else if (step === 1) go(2)
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (step === 0) return nextFromName()
    if (step === 1) return go(2)
    const email = emailInput.value.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      error.textContent = 'Hmm, that email looks a bit scrambled.'
      shake(emailInput)
      emailInput.focus()
      return
    }
    error.textContent = ''
    const data = new FormData(form)
    const entry = {
      name: nameInput.value.trim(),
      email,
      make: data.getAll('make'),
      city: data.get('city'),
      at: new Date().toISOString(),
    }
    try {
      const list = JSON.parse(localStorage.getItem(STORE) ?? '[]')
      list.push(entry)
      localStorage.setItem(STORE, JSON.stringify(list))
    } catch {
      /* storage unavailable — still say thanks */
    }
    go(3)
  })
}
