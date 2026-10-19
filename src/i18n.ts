export type Lang = 'en' | 'tr'

const KEY = 'eggclub:lang'

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'tr' || v === 'en') return v
  } catch {
    /* storage unavailable */
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
  if (lang !== 'tr') return
  document.documentElement.lang = 'tr'

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
}

/** The little EN/TR pill in the nav — always wired, in either language. */
export function initLangToggle() {
  const btn = document.getElementById('langToggle')
  if (!btn) return
  btn.textContent = lang === 'tr' ? 'EN' : 'TR'
  btn.setAttribute('aria-label', lang === 'tr' ? 'Switch to English' : 'Türkçeye geç')
  btn.addEventListener('click', () => setLang(lang === 'tr' ? 'en' : 'tr'))
}
