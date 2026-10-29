# The Egg Club

Landing page for The Egg Club — a free build club every other Sunday at ODTÜ
(METU), Ankara. Doors at noon, pizza at six, demos at 21:30, done before midnight.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
```

Vite + TypeScript + GSAP (ScrollTrigger). No framework; every section is plain
HTML in `index.html`, with one module per interaction in `src/`.

## How the page is put together

The whole page is **one Sunday**. The background drifts through the day's
colours as you scroll, and the club clock in the nav goes from noon to past midnight.

| Where | What | Code |
| --- | --- | --- |
| Hero | The finished illustration in `public/hero/` with hand-drawn notes on top (`#doodles`), a magazine-style masthead, the apply button with the essentials under it (free · every other Sunday · noon to midnight · METU) plus the next date from the app, and a slow "Built with love by people from…" logo strip (`public/logos/`) | `src/hero.ts`, `src/next.ts` |
| Background + clock | Section colours (`data-bg`) and the scroll-driven clock | `src/sky.ts` |
| What / Who comes / Why | "Who comes": a typeset guest list of disciplines, each with a one-line caption on hover/tap; hand-drawn strikethroughs | `src/story.ts` |
| The day | Pinned horizontal timeline; an egg waddles along a ruler and hatches at 21:30 demos | `src/day.ts` |
| Who shows up | A specimen plate of egg figures; pull one and it springs back, hover/tap for its quote | `src/flock.ts` |
| Good questions | The FAQ: native `<details>` disclosures (cost, who can come, what to bring, where, language, food, selection, friends…) | markup only, `src/styles/story.css` |
| Join | A ticket for the next Sunday, the apply button, what happens after you apply, and a bring-a-friend share (native share sheet, else WhatsApp; copy link). Applications live on app.the-egg.club | `src/next.ts`, `src/share.ts` |
| Footer → game | Keep scrolling past the footer and the night opens into the arcade cabinet running **Night Shift** (scroll-driven, no scroll-jacking); the footer's "keep scrolling" note glides you there | `src/portal.ts`, `src/nightshift.ts` |

Everything respects `prefers-reduced-motion`.

### The next Sunday

`src/next.ts` reads the app's `/api/next-event` (4 s timeout) and fills in the
masthead, the hero's next-date line, the Join ticket, and points every
`a[data-apply]` at that Sunday's page. Each element ships with complete,
date-free copy, so if the app is slow, down, or has nothing scheduled the page
just stays general. Copy for each state (`live`, `open` — applications open,
`soon` — not yet, `next` — unknown) lives on the element as `data-<state>`
templates (`{n}`, `{short}`, `{long}`, `{time}`, `{place}`), translated like any
other attribute.

### Languages

English is the source text in `index.html`; Turkish sits next to it in
`data-i18n-tr` (text), `data-i18n-tr-html` (inline markup) and
`data-i18n-tr-attr-<name>` (attributes, including the `data-*` templates
above), applied by `src/i18n.ts`. With no saved choice, the page follows the
browser: the first of `navigator.languages` that is Turkish or English wins, so
a phone set to Turkish opens in Turkish. The EN/TR toggle saves the choice.
Every visible string needs both.

### Night Shift (the hidden game)

A pixel-art loft in Kızılay at 23:00, drawn procedurally at 320×192 (no image
assets). Eight builders need pizza before midnight demos: grab a slice from
the counter, walk it over, and each fed team "hatches" its project (the same
ideas as the carton). Arrows/WASD or tap to walk, E/space or the yellow button
to talk. The midnight clock only starts on your first move. On phones the view narrows and follows you, with edge markers for
anyone off-screen. There's a golden egg hidden somewhere.

## Before launch

- **No social links yet**: the placeholder Instagram / X / Luma links were removed (they went to
  those sites' home pages). When the club has real accounts, add a column to `.foot__cols` in the
  footer, with an EN and TR heading.
- **Confirmations must carry the room**: the FAQ and Join promise that the exact room (and anything
  needed to get onto the ODTÜ campus) comes with your confirmation. The app only shows the status
  ("you're in ✓") and sends no email yet, so make sure approved people get that message.
- **Dietary needs go to the club inbox**: the food answer asks people to email
  theeggclubb@gmail.com before Sunday; someone has to read it.

## Logos in the hero strip

- `public/logos/odtu.svg`: the ODTÜ / METU wordmark, from Wikimedia Commons (marked public domain).
- `public/logos/odtu-teknokent.svg`: extracted as vectors from ODTÜ Teknokent's own brand guideline
  (Kurumsal Kimlik Kılavuzu). Their rules: never recolour, rotate, outline or box the logo; only the
  original blue or plain black/white. The strip shows them in plain black and in their own colour
  on hover, and only slides them sideways.
- To add another place, add one `<li class="built__logo">` with its logo in `index.html`; the strip
  repeats itself to fill the width automatically. Make sure you're allowed to use each logo.
