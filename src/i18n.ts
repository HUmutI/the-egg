export type Lang = 'en' | 'tr'

const KEY = 'eggclub:lang'

/**
 * A saved choice from the toggle wins. Without one, follow the browser:
 * walk the visitor's preferred languages and take the first we speak, so a
 * phone set to Turkish lands in Turkish and everyone else gets English.
 */
export function getLang(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'tr' || v === 'en') return v
  } catch {
    /* storage unavailable */
  }
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const p of prefs) {
    const code = (p ?? '').toLowerCase()
    if (code.startsWith('tr')) return 'tr'
    if (code.startsWith('en')) return 'en'
  }
  return 'en'
}

export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l)
  } catch {
    /* storage unavailable */
  }
  location.reload()
}

export const lang: Lang = getLang()

/**
 * Swap every element carrying a `data-i18n-tr*` marker into Turkish. No-op
 * in English, since the English text is already the document's source.
 *
 * - `data-i18n-tr="…"` → textContent
 * - `data-i18n-tr-html="…"` → innerHTML (for nodes with inline markup)
 * - `data-i18n-tr-attr-<name>="…"` → setAttribute(name, …) — covers
 *   attributes like `placeholder`, `aria-label`, or even `data-note`
 */
export function applyI18n() {
  const root = document.documentElement
  root.lang = lang
  // the head script hides translatable text for Turkish visitors until now
  if (lang !== 'tr') return root.classList.remove('i18n-pending')

  document.querySelectorAll<HTMLElement>('[data-i18n-tr]').forEach((el) => {
    el.textContent = el.dataset.i18nTr ?? ''
  })
  document.querySelectorAll<HTMLElement>('[data-i18n-tr-html]').forEach((el) => {
    el.innerHTML = el.dataset.i18nTrHtml ?? ''
  })
  document.querySelectorAll<HTMLElement>('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const m = attr.name.match(/^data-i18n-tr-attr-(.+)$/)
      if (m) el.setAttribute(m[1], attr.value)
    }
  })
  root.classList.remove('i18n-pending')
}

/** The little EN/TR pill in the nav — always wired, in either language. */
export function initLangToggle() {
  const btn = document.getElementById('langToggle')
  if (!btn) return
  const other: Lang = lang === 'tr' ? 'en' : 'tr'
  btn.textContent = other.toUpperCase()
  // The label is written in the language it switches to, so tell screen
  // readers which voice to read it in.
  btn.lang = other
  // Start with the visible text, so "click TR" works for voice control.
  btn.setAttribute('aria-label', other === 'en' ? 'EN – Switch to English' : 'TR – Türkçeye geç')
  btn.addEventListener('click', () => setLang(other))
}
