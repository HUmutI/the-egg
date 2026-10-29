import { $, reducedMotion } from './util'

const SITE = 'https://the-egg.club/'
const TITLE = 'The Egg Club'

/**
 * Bring a friend. The message is the one shown in the speech bubble (so it
 * is translated with the rest of the page). Phones get the native share
 * sheet; anything without one keeps the WhatsApp link that ships in the
 * HTML. Copy-link is always there, with feedback in a polite live region.
 */
export function initShare() {
  const msgEl = $('#shareMsg')
  const native = $<HTMLButtonElement>('#shareNative')
  const wa = $<HTMLAnchorElement>('#shareWa')
  const copy = $<HTMLButtonElement>('#shareCopy')
  const status = $('#shareStatus')
  if (!msgEl || !status) return

  const text = (msgEl.textContent ?? '').replace(/\s+/g, ' ').trim()
  const data: ShareData = { title: TITLE, text, url: SITE }

  if (wa) wa.href = `https://wa.me/?text=${encodeURIComponent(`${text} ${SITE}`)}`

  let clear = 0
  const say = (key: 'copied' | 'failed' | 'shared') => {
    // empty first so saying the same thing twice is announced twice
    status.textContent = ''
    window.clearTimeout(clear)
    requestAnimationFrame(() => {
      status.textContent = status.dataset[key] ?? ''
      clear = window.setTimeout(() => (status.textContent = ''), 6000)
    })
  }

  const canShare =
    typeof navigator.share === 'function' && (typeof navigator.canShare !== 'function' || navigator.canShare(data))

  // Share buttons elsewhere (the phone dock) open the same sheet; without
  // one, they bring you down to this section's WhatsApp and copy buttons.
  document.querySelectorAll<HTMLButtonElement>('[data-share]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (canShare) {
        try {
          await navigator.share(data)
        } catch {
          /* closed, or refused: nothing to undo */
        }
        return
      }
      $('#share')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' })
      ;[wa, copy].find((b) => b && !b.hidden)?.focus({ preventScroll: true })
    }),
  )

  if (native && canShare) {
    native.hidden = false
    if (wa) wa.hidden = true
    native.addEventListener('click', async () => {
      try {
        await navigator.share(data)
        say('shared')
      } catch (err) {
        const name = (err as DOMException)?.name
        // closing the sheet, or tapping again while it's open, isn't worth mentioning
        if (name === 'AbortError' || name === 'InvalidStateError') return
        // the sheet refused: hand over the link instead
        say((await copyText(SITE)) ? 'copied' : 'failed')
      }
    })
  }

  if (copy) {
    copy.hidden = false
    const label = copy.querySelector('span')
    const idle = label?.textContent ?? ''
    copy.addEventListener('click', async () => {
      const ok = await copyText(SITE)
      say(ok ? 'copied' : 'failed')
      if (ok && label && copy.dataset.done) {
        label.textContent = copy.dataset.done
        window.setTimeout(() => (label.textContent = idle), 1800)
      }
    })
  }
}

async function copyText(s: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(s)
    return true
  } catch {
    // older browsers, or no clipboard permission: the textarea trick
    const ta = document.createElement('textarea')
    ta.value = s
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
    document.body.append(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}
