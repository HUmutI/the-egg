# The Egg Club

Landing page for The Egg Club — a free build club every other Sunday at ODTÜ
(METU), Ankara. Doors at 10:30, build all day, pizza at six, pitches at 19:00, done by 20:00.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
```

Vite + TypeScript + GSAP (ScrollTrigger). No framework; every section is plain
HTML in `index.html`, with one module per interaction in `src/`.

## How the page is put together

The whole page is **one Sunday**. The background drifts through the day's
colours as you scroll, and the club clock in the nav runs from doors (10:30) into the evening.

| Where | What | Code |
| --- | --- | --- |
| Hero | The finished illustration in `public/hero/` with hand-drawn notes on top (`#doodles`), a magazine-style masthead, the apply button with the essentials under it (free · every other Sunday · 10:30–20:00 · METU) plus the next date from the app, and a slow "Built with love by people from…" logo strip (`public/logos/`) | `src/hero.ts`, `src/next.ts` |
| Background + clock | Section colours (`data-bg`, painted through `--page`, which is written only on the body's background and the few small things that wear it (the nav's backdrop band, the dock, the programme's markers), never on `:root`, so a change of colour doesn't restyle the whole page) and the scroll-driven clock: the day section runs 10:30 to 20:00, the rest of the page is the afterglow, the footer is the way home | `src/sky.ts` |
| Live badge | The small egg in the corner that links to the commits; it says its line once, then on hover/focus, and steps aside while you scroll, over the hero's logos, the footer and the arcade | `src/badge.ts` |
| What / Who comes / Why | "Who comes": a typeset guest list of disciplines, each with a one-line caption on hover/tap; hand-drawn strikethroughs | `src/story.ts` |
| The day | Seven arched windows from 10:30 to 20:00, each painted with its hour of the sky (gold morning → blue noon → sunset → dusk → night over Ankara) and a scene in front: a door swinging open on coffee, a 60-second stopwatch, a nest, a heat lamp over laptops, pizza, a stage with confetti, the metro home. Wide screens pin the section and slide the day past while our egg walks it — cracking a little at every step, picking up two teammates at Nest, hatching the golden egg at the 19:00 pitches, walking home in its shell cap; at the end the camera stops and the team walks on into the evening. The page colour drifts with it. Below 900px it's a picture book (side by side on tablets) with the cast drawn into each scene | `src/day.ts`, `src/dayscenes.ts` |
| Who shows up | A specimen plate of egg characters (the night-owl engineer, the designer, the hardware person…, and the dashed "you?"); pull one and it springs back, hover/tap for its quote | `src/flock.ts`, `src/figures.ts` |
| Good questions | The FAQ: native `<details>` disclosures (cost, who can come, what to bring, where, language, food, selection, friends…) | markup only, `src/styles/story.css` |
| Join | A ticket for the next Sunday, the apply button, what happens after you apply, and a bring-a-friend share (native share sheet, else WhatsApp; copy link). Applications live on app.the-egg.club | `src/next.ts`, `src/share.ts` |
| Footer → game | The rooftop over Ankara at night (`public/footer/`: the castle, Kocatepe, Atakule, Anıtkabir). Keep scrolling and the arcade cabinet running **Night Shift** rises out of the night (scroll-driven, no scroll-jacking); the footer's "keep scrolling" note glides you there | `src/portal.ts`, `src/nightshift.ts` |

Everything respects `prefers-reduced-motion`.

### Eggs and the brand mark

Every egg on the page comes from one SVG character kit in `src/ink.ts`: the
body (eggshell fills, soft shade, highlight, one ink weight), a face kit (eyes,
mouths, blush) and shared hands. `src/figures.ts` dresses the plate's
characters; `src/dayscenes.ts` draws the day's scenes and its walking cast, and the statement's chips use the same family. The
brand mark is the hero's golden egg with two dot eyes: the nav logo,
the live badge, `public/favicon.svg`/`favicon.ico` and `public/icons/*`
(apple-touch, 192, 512, maskable).

### Sharing

Link previews use `public/og/the-egg-club-og.jpg` (1200×630, small enough for
WhatsApp); `public/og/the-egg-club-og-tr.jpg` is ready for a Turkish URL. The
`<head>` also carries the manifest (`public/site.webmanifest`), JSON-LD for the
club and its recurring Sunday. The fonts are served from the site itself
(`src/fonts/`, declared in `src/styles/fonts.css`: Google Fonts' own files and
subsets, OFL), so no third-party stylesheet holds up the first paint; the
game's Silkscreen is only fetched once its text is laid out.
Unknown paths get the standalone `public/404.html`.

### How it loads

The first screen needs no scroll machinery, so the page arrives in three parts:

- `src/main.ts` (the entry, ~11 KB gzip): language, hero, badge, dock, share,
  the next Sunday, then the day's plates in a task of their own. The hero
  poster fades in from its own `onload` in `index.html`, so the LCP image
  never waits for a script.
- `src/scroll.ts` (gsap, ScrollTrigger and every scene): fetched at once,
  alongside the entry, and started once the fonts are in (or after 1.2 s).
  Each scene is set up in its own task, with one ScrollTrigger refresh at
  the end; later height changes (an FAQ answer, the next-Sunday lines, a late
  font or image at load) re-measure from there. Anything that lays the page
  out at length gets tasks of its own, so none runs past ~50 ms on a slow
  phone: the statement's size is searched a few tries a task, a phone's day
  stage and plate scale are set before its walk, the who-comes figures go up
  four at a time, each pinned scene is first measured in the task after it is
  made, and the far sections go to sleep one a frame. The day's pins sit in
  spacers of their own (`.pin-hold`, made when the plates are drawn), so a
  refresh never takes the day out of the page and rebuilds it.
- `src/portal.ts` (the cabinet and Night Shift): fetched on the reader's
  first scroll, touch or key (or after a long idle, or when the footer is
  near), and its refresh waits for the scroll to stop.

The built `index.html` drops its comments and the indentation at the start of
each line (`vite.config.ts`), so it compresses to under ~14.6 KB and arrives
in the first round trip; comment freely in the source. The hero and the
rooftop come in several widths, and each `<source>`'s `sizes` says how wide
the picture is shown (the hero's follows `.hero__frame` in `main.css`; keep
them in step, and the hero's preload with them), so a laptop takes the
1200 poster and the 1440 rooftop, never a file narrower than its space.

The words the statement reads in, and the house rules, start faint. A faint
statement word is decoration (its own background, clipped to the glyphs, at
14%) with the ink fading in over it from 0, and the rules dim only a screen
before the reader reaches them (`src/story.ts`), so contrast checks never
find faint text waiting on the page.

### The next Sunday

`src/next.ts` reads the app's `/api/next-event` (4 s timeout) and fills in the
masthead, the hero's next-date line, the Join ticket, and points every
`a[data-apply]` at that Sunday's page. Each element ships with complete,
date-free copy, so if the app is slow, down, or has nothing scheduled the page
just stays general. Copy for each state (`live`, `open` — applications open,
`soon` — not yet, `next` — unknown) lives on the element as `data-<state>`
templates (`{n}`, `{short}`, `{long}`, `{place}`), translated like any
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

A pixel-art loft in Kızılay at 18:00, drawn procedurally at 320×192 (no image
assets). Eight builders need pizza before the 19:00 pitches: grab a slice from
the counter, walk it over, and each fed team "hatches" its project (the same
ideas as the carton). Arrows/WASD or tap to walk, E/space or the yellow button
to talk. The clock only starts on your first move. On phones the view narrows and follows you, with edge markers for
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
