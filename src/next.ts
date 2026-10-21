import { lang } from './i18n'

const API = 'https://app.the-egg.club/api/next-event'

type NextEvent = {
  number: number
  startsAt: string
  url: string
}

const DAY = 24 * 60 * 60 * 1000

/**
 * The next Sunday, from the app: the masthead's issue number and date, plus a
 * "next Sunday" link in the join section. If the app can't be reached the
 * page keeps its static masthead and the link stays hidden.
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
  if (!event) return

  const start = new Date(event.startsAt)
  const age = Date.now() - start.getTime()
  // The app falls back to the most recent Sunday when nothing is scheduled.
  if (age > DAY) return

  const locale = lang === 'tr' ? 'tr-TR' : 'en-GB'
  const date = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Istanbul',
  }).format(start)
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  }).format(start)

  const issue = document.querySelector('.mh__issue em')
  const season = document.querySelector('.mh__season')
  if (issue) issue.textContent = String(event.number).padStart(3, '0')
  if (season) season.textContent = date

  const link = document.getElementById('nextSunday') as HTMLAnchorElement | null
  if (!link) return
  const live = age > 0
  link.textContent =
    lang === 'tr'
      ? `${live ? 'Bugün' : 'Sıradaki Pazar'}: ${date}, ${time} · Nº${event.number} →`
      : `${live ? 'On today' : 'Next Sunday'}: ${date}, ${time} · Nº${event.number} →`
  link.href = event.url
  link.hidden = false
}
