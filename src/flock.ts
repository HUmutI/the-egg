import { gsap } from 'gsap'
import { $, PALETTE, clamp, reducedMotion } from './util'
import { handEgg, inkEgg, installInkDefs, type EggShape } from './ink'
import { lang } from './i18n'

type Kind = 'owl' | 'designer' | 'battery' | 'founder' | 'footnote' | 'wave' | 'nest' | 'slice'

interface Bird {
  name: string
  say: string
  color: string
  kind: Kind
  shape: EggShape
  x: number // % of field
  y: number
  tilt: number
}

const FLOCK_EN: Bird[] = [
  { name: 'the night-owl engineer', say: 'it works on my machine.', color: PALETTE.lav, kind: 'owl', shape: { w: 0.92, h: 1.04, lean: -4 }, x: 4, y: 6, tilt: -5 },
  { name: 'the designer', say: 'can we try it in a softer yellow?', color: PALETTE.butter, kind: 'designer', shape: { w: 1.02, h: 0.94, lean: 6, taper: 0.1 }, x: 25, y: 30, tilt: 6 },
  { name: 'the hardware person', say: 'I brought a soldering iron. And a spare.', color: PALETTE.mint, kind: 'battery', shape: { w: 0.86, h: 1.06, lean: -2, taper: 0.08 }, x: 47, y: 4, tilt: -4 },
  { name: 'the recovering founder', say: 'no pitch, promise. ok, a tiny one.', color: PALETTE.peach, kind: 'founder', shape: { w: 0.98, h: 1, lean: 3 }, x: 70, y: 16, tilt: 5 },
  { name: 'the researcher', say: 'there’s a paper on this. I wrote it.', color: PALETTE.sky, kind: 'footnote', shape: { w: 0.9, h: 1.02, lean: -7, taper: 0.18 }, x: 10, y: 54, tilt: 4 },
  { name: 'the musician', say: 'what if the app… had a bassline?', color: PALETTE.yolk, kind: 'wave', shape: { w: 1.06, h: 0.96, lean: 4 }, x: 36, y: 58, tilt: -6 },
  { name: 'the first-timer', say: 'first hackathon. third slice.', color: PALETTE.cream, kind: 'nest', shape: { w: 0.84, h: 0.92, lean: -3 }, x: 59, y: 56, tilt: 5 },
  { name: 'here for the pizza', say: 'honestly? the pizza.', color: PALETTE.peach, kind: 'slice', shape: { w: 1, h: 1, lean: 2 }, x: 81, y: 50, tilt: -4 },
]

const FLOCK_TR: Bird[] = [
  { name: 'gece kuşu mühendis', say: 'bende çalışıyor.', color: PALETTE.lav, kind: 'owl', shape: { w: 0.92, h: 1.04, lean: -4 }, x: 4, y: 6, tilt: -5 },
  { name: 'tasarımcı', say: 'daha yumuşak bir sarı deneyebilir miyiz?', color: PALETTE.butter, kind: 'designer', shape: { w: 1.02, h: 0.94, lean: 6, taper: 0.1 }, x: 25, y: 30, tilt: 6 },
  { name: 'donanımcı', say: 'bir lehim havyası getirdim. Bir de yedek.', color: PALETTE.mint, kind: 'battery', shape: { w: 0.86, h: 1.06, lean: -2, taper: 0.08 }, x: 47, y: 4, tilt: -4 },
  { name: 'iyileşen girişimci', say: 'sunum yok, söz. tamam, ufak bir tane.', color: PALETTE.peach, kind: 'founder', shape: { w: 0.98, h: 1, lean: 3 }, x: 70, y: 16, tilt: 5 },
  { name: 'araştırmacı', say: 'bu konuda bir makale var. Ben yazdım.', color: PALETTE.sky, kind: 'footnote', shape: { w: 0.9, h: 1.02, lean: -7, taper: 0.18 }, x: 10, y: 54, tilt: 4 },
  { name: 'müzisyen', say: 'uygulamanın… bir bas hattı olsa?', color: PALETTE.yolk, kind: 'wave', shape: { w: 1.06, h: 0.96, lean: 4 }, x: 36, y: 58, tilt: -6 },
  { name: 'ilk kez gelen', say: 'ilk hackathon. üçüncü dilim.', color: PALETTE.cream, kind: 'nest', shape: { w: 0.84, h: 0.92, lean: -3 }, x: 59, y: 56, tilt: 5 },
  { name: 'pizza için burada', say: 'açıkçası? pizza.', color: PALETTE.peach, kind: 'slice', shape: { w: 1, h: 1, lean: 2 }, x: 81, y: 50, tilt: -4 },
]

const FLOCK: Bird[] = lang === 'tr' ? FLOCK_TR : FLOCK_EN

const I = PALETTE.ink
const T = PALETTE.tomato
const line = (d: string, w = 3, c: string = I, extra = '') =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" filter="url(#wobble)" ${extra}/>`

const draw = (b: Bird, i: number) => {
  const d = handEgg(11 + i * 7, b.shape)
  const egg = inkEgg(d, b.color)
  switch (b.kind) {
    case 'owl':
      // an anglepoise lamp leaning in from off-page, and the eyes of 2am
      return `
        <polygon points="70,-14 112,-14 168,118 20,118" fill="${PALETTE.yolk}" opacity=".32"/>
        ${egg}
        ${line('M-18 -54 L40 -30 L78 -40', 3.2)}
        <path d="M66 -48 l30 -6 l10 22 l-46 10z" fill="${I}"/>
        ${line('M70 132 q9 -5 18 0', 3.4)}${line('M114 132 q9 -5 18 0', 3.4)}
        <circle cx="80" cy="136" r="2.6" fill="${I}"/><circle cx="124" cy="136" r="2.6" fill="${I}"/>
        ${line('M72 145 q8 4 15 1', 1.6, I, 'opacity=".45"')}${line('M116 145 q8 4 15 1', 1.6, I, 'opacity=".45"')}`
    case 'designer':
      // construction lines, a ratio, and one opinionated swatch
      return `
        ${egg}
        <g stroke="${T}" stroke-width="1.2" fill="none" opacity=".9">
          <circle cx="100" cy="104" r="56"/><circle cx="100" cy="104" r="34.6"/>
          <path d="M100 18 V292 M-6 104 H206"/>
          <path d="M22 286 H178 M22 280 v12 M178 280 v12"/>
        </g>
        <text x="100" y="304" text-anchor="middle" font-family="DM Mono, monospace" font-size="12" fill="${T}">1 : 1.618</text>
        <g transform="rotate(12 196 214)">
          <rect x="176" y="176" width="44" height="64" fill="${PALETTE.cream}" stroke="${I}" stroke-width="2"/>
          <rect x="180" y="180" width="36" height="34" fill="${PALETTE.yolk}"/>
          <path d="M182 224 h24 M182 231 h16" stroke="${I}" stroke-width="2"/>
        </g>`
    case 'battery':
      // it's an egg. it's also a battery. there is a plug.
      return `
        <rect x="84" y="2" width="32" height="16" rx="3" fill="${I}"/>
        ${egg}
        <text x="100" y="78" text-anchor="middle" font-family="Fraunces, serif" font-size="40" fill="${I}">+</text>
        <text x="100" y="236" text-anchor="middle" font-family="Fraunces, serif" font-size="40" fill="${I}">–</text>
        ${line('M178 150 C 222 150 220 210 196 214 S 168 250 214 262', 3.2)}
        <rect x="206" y="256" width="20" height="14" rx="2" fill="${I}" transform="rotate(16 216 263)"/>
        ${line('M232 246 l10 -6 M236 258 l12 0 M232 270 l10 6', 2, T)}`
    case 'founder':
      // the lanyard says CEO. someone has corrected it.
      return `
        ${egg}
        ${line('M76 92 L100 158 L124 92', 2.4)}
        <g transform="rotate(-4 100 182)">
          <rect x="70" y="156" width="60" height="44" rx="3" fill="${PALETTE.cream}" stroke="${I}" stroke-width="2.2"/>
          <text x="100" y="185" text-anchor="middle" font-family="DM Mono, monospace" font-size="15" letter-spacing="2" fill="${I}">CEO</text>
          ${line('M76 181 L124 176', 2.6, T)}
        </g>
        <text x="122" y="150" font-family="Reenie Beanie, cursive" font-size="30" fill="${T}" transform="rotate(-8 122 150)">human</text>
        <circle cx="96" cy="118" r="3" fill="${I}"/><circle cx="122" cy="118" r="3" fill="${I}"/>`
    case 'footnote':
      // a hairline crack, properly cited
      return `
        ${egg}
        ${line('M132 34 l-10 24 l14 12 l-12 22 l10 14', 2.4)}
        <text x="168" y="54" font-family="Fraunces, serif" font-style="italic" font-size="44" fill="${I}">¹</text>
        <text x="10" y="306" font-family="Fraunces, serif" font-style="italic" font-size="15" fill="${I}" opacity=".75">¹ peer reviewed. mostly.</text>`
    case 'wave':
      // the egg as a speaker cone
      return `
        ${egg}
        ${line('M-24 150 C -4 150 6 150 18 150 S 30 120 40 150 S 52 186 64 150 S 78 92 90 150 S 104 214 116 150 S 130 104 142 150 S 156 178 168 150 S 186 150 224 150', 3)}`
    case 'nest':
      // still half in the carton. peeking.
      return `
        ${egg}
        <path d="M-2 196 C 10 176 40 186 50 200 C 64 182 86 184 100 196 C 116 182 138 184 150 200 C 160 186 190 176 202 196 L 196 262 C 140 274 60 274 4 262 Z"
          fill="#d9d1c4" stroke="${I}" stroke-width="3" stroke-linejoin="round" filter="url(#wobble)"/>
        <path d="M20 226 h160 M28 246 h144" stroke="${I}" stroke-width="1.2" opacity=".35"/>
        <circle cx="88" cy="168" r="3" fill="${I}"/><circle cx="114" cy="168" r="3" fill="${I}"/>
        ${line('M146 36 C 170 20 188 30 192 46', 1.6)}
        <g transform="rotate(14 200 54)"><path d="M184 44 h34 v24 h-34 l-8 -12z" fill="${PALETTE.cream}" stroke="${I}" stroke-width="2"/>
        <text x="200" y="62" text-anchor="middle" font-family="Reenie Beanie, cursive" font-size="22" fill="${T}">1st</text></g>`
    case 'slice': {
      // one slice missing. it's over there, and it has a yolk.
      const id = `sl${i}`
      const wedge = '100,150 230,96 230,206'
      return `
        <defs>
          <mask id="${id}m"><rect x="-40" y="-60" width="300" height="400" fill="#fff"/><polygon points="${wedge}" fill="#000"/></mask>
          <clipPath id="${id}c"><polygon points="${wedge}"/></clipPath>
        </defs>
        <g mask="url(#${id}m)">
          ${egg}
          <circle cx="100" cy="150" r="30" fill="${PALETTE.yolk}" stroke="${I}" stroke-width="2.4"/>
        </g>
        <g transform="translate(26 12) rotate(6 160 150)">
          <g clip-path="url(#${id}c)">
            ${inkEgg(d, b.color, { gap: 0, shade: false })}
            <circle cx="100" cy="150" r="30" fill="${PALETTE.yolk}" stroke="${I}" stroke-width="2.4"/>
          </g>
          ${line('M100 150 L196 110 M100 150 L196 192', 2.6)}
        </g>
        ${line('M100 150 L190 113 M100 150 L190 189', 2.6)}`
    }
  }
}

export function initFlock() {
  const field = $('#flockField')
  if (!field) return
  installInkDefs()

  const cells: HTMLElement[] = []
  FLOCK.forEach((b, i) => {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'bird'
    el.style.setProperty('--tilt', `${b.tilt}deg`)
    el.setAttribute('aria-label', `${b.name}: “${b.say}”`)
    el.innerHTML = `
      <span class="bird__fig" aria-hidden="true">fig. ${String(i + 1).padStart(2, '0')}</span>
      <span class="bird__say" aria-hidden="true">“${b.say}”</span>
      <span class="bird__body"><svg viewBox="-30 -60 270 380" aria-hidden="true">${draw(b, i)}</svg></span>
      <span class="bird__name" aria-hidden="true">${b.name}</span>`
    field.append(el)
    cells.push(el)
  })

  const you = document.createElement('a')
  you.href = '#join'
  you.className = 'bird bird--you'
  you.setAttribute(
    'aria-label',
    lang === 'tr' ? 'Sen? Üzerinde adın yazan bir sandalye var — katıl' : 'You? There’s a seat with your name on it — join',
  )
  you.innerHTML = `
    <span class="bird__fig" aria-hidden="true">fig. 09</span>
    <span class="bird__say" aria-hidden="true">“${lang === 'tr' ? 'üzerinde adın yazan bir sandalye var.' : 'there’s a seat with your name on it.'}”</span>
    <span class="bird__body"><svg viewBox="-30 -60 270 380" aria-hidden="true">
      <path d="${handEgg(99, { w: 0.95, lean: -5 })}" fill="none" stroke="${I}" stroke-width="2.6" stroke-dasharray="2 9" stroke-linecap="round"/>
      <text x="100" y="160" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="52" fill="${I}">${lang === 'tr' ? 'sen?' : 'you?'}</text>
    </svg></span>
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
