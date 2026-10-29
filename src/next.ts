import { lang } from './i18n'

const API = 'https://app.the-egg.club/api/next-event'

type NextEvent = {
  number: number
  startsAt: string
  url: string
  location?: string | null
  applicationsOpen?: boolean
}

/** Where the next Sunday stands: on today, taking applications, or not yet. */
type State = 'live' | 'open' | 'soon' | 'next'

// The club runs 10:30 to 20:00. The app keeps a Sunday "current" for a day
// (for late submissions), but once the evening's done the page should stop
// saying it's on (half an hour of slack for the last pitch).
const LIVE_FOR = 10 * 60 * 60 * 1000

/**
 * Fill a template kept on the element itself (`data-<state>`, translated by
 * i18n like any other attribute), so every word stays in index.html.
 */
function fill(el: HTMLElement | null, key: string, vars: Record<string, string>) {
  const tpl = el?.dataset[key]
  if (!el || tpl == null) return false
  // templates may carry markup; the values come from the app, so escape them
  el.innerHTML = tpl.replace(/\{(\w+)\}/g, (_, k: string) => escape(vars[k] ?? ''))
  return true
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/**
 * The next Sunday, from the app: the masthead's issue number and date, a
 * "next" line under the hero, the ticket in the join section, and every
 * apply link pointed straight at that Sunday's page. The page ships with a
 * complete, date-free version of all of these, so if the app is slow or
 * down nothing breaks — it just stays general.
 */
export async function initNextSunday() {
  let event: NextEvent | null
  try {
    const res = await fetch(API, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return
    event = await res.json()
  } catch {
    return
  }
  if (!event?.startsAt) return

  const start = new Date(event.startsAt)
  if (Number.isNaN(start.getTime())) return
  const age = Date.now() - start.getTime()
  // The app falls back to the most recent Sunday when nothing is scheduled;
  // once that Sunday is over, the page stays general.
  if (age >= LIVE_FOR) return

  const state: State =
    age > 0 ? 'live' : event.applicationsOpen === true ? 'open' : event.applicationsOpen === false ? 'soon' : 'next'

  const locale = lang === 'tr' ? 'tr-TR' : 'en-GB'
  const tz = 'Europe/Istanbul'
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...o, timeZone: tz }).format(start)
  const vars = {
    n: String(event.number).padStart(3, '0'),
    short: fmt({ weekday: 'short', day: 'numeric', month: 'short' }),
    long: fmt({ weekday: 'long', day: 'numeric', month: 'long' }),
    place: event.location?.trim() || (lang === 'tr' ? 'ODTÜ, Ankara' : 'METU, Ankara'),
  }

  // masthead
  const issue = document.querySelector('.mh__issue em')
  const season = document.querySelector('.mh__season')
  if (issue) issue.textContent = vars.n
  if (season) season.textContent = vars.short

  // hero: one line under the facts
  const heroNext = document.getElementById('heroNext')
  if (fill(heroNext, state, vars)) heroNext!.hidden = false

  // join: the ticket
  const ticket = document.getElementById('ticket')
  if (ticket) {
    ticket.dataset.state = state
    for (const el of ticket.querySelectorAll<HTMLElement>('[data-tpl]')) fill(el, 'tpl', vars)
    const no = document.getElementById('ticketNo')
    if (no) no.hidden = false
    fill(document.getElementById('ticketStatus'), state, vars)
  }
  fill(document.getElementById('joinCtaLabel'), state, vars)

  // every apply button goes straight to that Sunday on the app
  if (/^https:\/\/app\.the-egg\.club\//.test(event.url)) {
    document.querySelectorAll<HTMLAnchorElement>('a[data-apply]').forEach((a) => (a.href = event!.url))
  }

  // the hero's next line can add a row: let the scroll triggers re-measure
  document.dispatchEvent(new Event('egg:relayout'))
}
