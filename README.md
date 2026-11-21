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
| Hero | The finished illustration in `public/hero/` with hand-drawn notes on top (`#doodles`), a magazine-style masthead, the apply button with the essentials under it (free · every other Sunday · 10:30–20:00 · METU) plus the next date from the app, and a slow "Built with love by people from…" logo strip (`public/logos/`). The hero is the first screen on any screen: on phones and tablets held upright the poster takes the room the rest leaves (`.hero__art` is a size container; the frame is sized in container units), the two buttons sit side by side on a phone, and room to spare is shared above the poster, under it and over the logos. The next Sunday is set as a headline ("Next: Sunday 22 November", from the app; "Every other Sunday" when there is none) over the hours and the place, before the buttons; the line holds its place while the app answers, so nothing moves when the date arrives | `src/hero.ts`, `src/next.ts` |
| Background + clock | Section colours (`data-bg`, painted through `--page`, which is written only on the body's background and the two small things that wear it (the nav's backdrop band, the dock), never on `:root`, so a change of colour doesn't restyle the whole page) and the scroll-driven clock: the day section runs from doors (10:30) to lights out (18:30), the rest of the page is the afterglow, the footer is the way home. A phone's day is the exception: there the frame in front says the hour and the colour | `src/sky.ts` |
| Live badge | The small egg in the corner that links to the commits; it says its line once, then on hover/focus, and steps aside while you scroll, over the hero's logos, the footer and the arcade | `src/badge.ts` |
| The spread | The hero is the cover and is centred; everything after it is set like the pages inside. The numbered sections (01 What is this … 06 Get in the carton) each open on an ink hairline (the one the hero closes on) with the numbered name under it (`.label--rule`), ranged left on the column's edge at every width. Between them stand two interludes (`.interlude`: the 2am line, the hand-off to the app): a couplet in the display face, a sentence a line, centred like the cover. One set of steps spaces all of it: `--sec-y-tight` from a section's last line down to the next hairline, 14px to the name, `--spread-head` to the first line, `--sec-y` above and below an interlude | `main.css` ("THE SPREAD") |
| What | One sentence in the page's own flow: nothing pins and nothing follows the scroll. A phone sets it one sense unit a line (`.st__br`), sized so its longest line runs the column; a wide screen centres it. Each word inks in once as its line comes up the screen, and the highlighter goes over its words a beat later (`.is-in` and `--d`, set by `initStatement`; the rest is CSS). A page that opens on it by a #link shows it inked | `src/story.ts`, `main.css` |
| Why | An interlude: "Ankara has almost six million people. / Somehow you're still building alone at 2am." | markup, `main.css` |
| The day | A storyboard: seven frames from 10:30 to 18:30 on one sheet of cream paper, set like the plate of regulars, and an eighth cell that is the way out ("see you in two Sundays", Apply). A frame reads top to bottom: its hour in the mono with a small egg, the scene, the step's name, its line, all of it in full ink; nothing waits on a hover, a tap or the scroll, and nothing pins. Every scene is the same picture box at the same scale, standing on its own short ruler, with the cast drawn in, so the story reads across the frames: one egg comes through the door, cracks a little more at every step, picks up two teammates at Nest, hatches the club's golden egg on stage at Hatch and takes the metro home. Wide screens show the whole sheet (four frames to a row, three on a small laptop with the way out over two cells, two on a tablet) on one calm colour, and the clock runs from doors to lights out across the section. Phones read it as a strip, a frame at a time, with the programme line over it as its index: seven eggs with their hours, each a button; the egg of the frame in front is filled and the line is inked up to it. There the frame in front paints the page (morning cream to dusk pink) and sets the club clock to its hour. A phone on its side gets the same strip, each frame set along the screen | `src/day.ts`, `src/dayplates.ts`, `src/sketch.ts` |
| Who comes | A specimen plate of the regulars (the night-owl engineer, the designer, the hardware person…, and the dashed "you?", which is the way to Join): one sheet of cream paper, a figure to a cell, each with its number, its name and the line it says printed under it, so nothing waits on a hover or a tap. Wide screens lay it out as a grid (five to a row, three on tablets) and a figure can be pulled about; it springs back. Phones read it as a strip, a figure at a time, with the carton under it: the whole cast as nine small eggs in the pill the statement's three sit in; whoever is in front stands up out of it, and a tap on an egg brings its figure round | `src/flock.ts`, `src/figures.ts`, `src/sketch.ts` |
| Good questions | The FAQ: native `<details>` disclosures (cost, who can come, what to bring, where, language, food, selection, friends…) | markup only, `src/styles/story.css` |
| Join | A ticket for the next Sunday, the apply button, what happens after you apply, and a bring-a-friend share (native share sheet, else WhatsApp; copy link). Applications live on app.the-egg.club | `src/next.ts`, `src/share.ts` |
| Footer → game | The rooftop over Ankara at night (`public/footer/`: the castle, Kocatepe, Atakule, Anıtkabir). Keep scrolling and the arcade cabinet running **Night Shift** rises out of the night (scroll-driven, no scroll-jacking); the footer's "keep scrolling" note glides you there | `src/portal.ts`, `src/nightshift.ts` |

Everything respects `prefers-reduced-motion`.

### Eggs and the brand mark

The plate's figures and the day's scenes are drawn in the house riso style
(`src/riso.ts`): a hand-drawn silhouette, colour printed a little off the line,
halftone on one side, a thin wobbly outline that doesn't quite close, and one dry
annotation each (`src/figures.ts` draws the regulars, `src/dayplates.ts` the day's
scenes). In both the wobble is in the lines themselves (`sketch` bends each path
once, when it is drawn) and the halftone is real dots that grow towards the shade
(`halftone`; both in `src/sketch.ts`), so no drawing is filtered or masked when it
paints; only the hero's hand-drawn notes still go through the `#wobble` filter.
`src/ink.ts` is an older character kit that nothing draws with now. The
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

- `src/main.ts` (the entry, ~5 KB gzip): language, hero, badge, dock, share,
  the next Sunday. The hero poster fades in from its own `onload` in
  `index.html`, so the LCP image never waits for a script.
- `src/scroll.ts` (gsap, ScrollTrigger, every scene, and the drawings below
  the first screen: the regulars and the day's storyboard): fetched at once,
  alongside the entry, and started once the fonts are in (or after 1.2 s).
  Each scene is set up in its own task, with one ScrollTrigger refresh at
  the end; later height changes (an FAQ answer, the next-Sunday lines, a late
  font or image at load) re-measure from there. Anything that takes long
  gets tasks of its own, so none runs past ~50 ms on a slow phone: the day's
  scenes are drawn one to a task (a scene is some thousand halftone dots and
  a few dozen bent lines; the cast, the same three eggs in every frame, is
  worked out once), the who-comes figures go up four at a time, and the far
  sections go to sleep one a frame. Nothing on the page pins, so a refresh
  only measures. The day's picture boxes and its programme line have their
  room from the first paint (`main.css`), so drawing them in moves nothing.
  A reload or a step back lands where the reader was once that refresh is
  done (`keepPlace()` in `src/util.ts`): the browser's own restoring is
  switched off while the page starts, since it lands before the regulars
  are drawn.
- `src/portal.ts` (the cabinet and Night Shift): fetched on the reader's
  first scroll, touch or key (or after a long idle, or when the footer is
  near), and its refresh waits for the scroll to stop.

While you scroll, a phone has about 16 ms a frame, and ScrollTrigger reads
the scroll position at the start of each one, which makes the browser
restyle at once anything changed since the last frame. So the page changes
little per frame, and nothing changes in a way that spreads:

- A section off screen sleeps (`.is-asleep`, `src/util.ts`), and its loops
  pause. The rule in `main.css` names each thing that animates; an
  animation added to a section goes in that list. (With `*` there, every
  sleep and wake restyled the whole section.) Nothing in the day loops, so
  it has nothing in the list.
- No rule ends in `> *` or a `[class…]` match behind a class that changes
  at runtime: either makes each change of that class restyle everything
  under the element. Name the children instead (the flock's moving pieces
  are `fx__bit`s for this, and the arcade's rule names the nav's parts).
- No custom property changes on the body (or `:root`) as you scroll, not
  even through a class there: one changed there restyles the whole page.
  That is why the night's focus ring is a sheet that `src/sky.ts` turns on
  and off.
- The clock's sun is written only when it moves (`put()` in `src/util.ts`):
  an SVG element is restyled on every write, even one with the same value.
- Nothing is measured in a scroll frame. A phone's strips (the regulars, the
  day) measure themselves when they change size, and on a swipe only read
  how far they have gone; the frame in front changes classes and attributes
  on the programme line's seven eggs, and the page's colour through the same
  few elements a section's colour is painted on.

The built `index.html` drops its comments and the indentation at the start of
each line (`vite.config.ts`), so it compresses to under ~14.6 KB and arrives
in the first round trip; comment freely in the source. The hero and the
rooftop come in several widths, and each `<source>`'s `sizes` says how wide
the picture is shown (the hero's follows `.hero__frame` in `main.css`; keep
them in step, and the hero's preload with them), so a laptop takes the
1200 poster and the 1440 rooftop, never a file narrower than its space.

The words the statement inks in, and the house rules, start faint. A faint
statement word is decoration (its own background, clipped to the glyphs, at
14%) with the ink fading in over it from 0, and only when the script found
the sentence still below the screen; the rules dim only a screen before the
reader reaches them (`src/story.ts`), so contrast checks never find faint
text waiting on the page.

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

- **The footer's sky is measured**: `--foot-sky` in `main.css` is how much night stands above the
  rooftop painting, sized so the links' last line clears the tower's tip and the moon at every
  width. Add a link to a footer column and it has to grow (`polish-tools/foot-check.mjs` on the
  build laptop measures the clearance).
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
