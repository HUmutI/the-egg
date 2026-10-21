# The Egg Club

Landing page for The Egg Club — a Sunday build club, starting in Ankara.
Doors at noon, pizza at six, demos before midnight.

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
| Hero | The finished illustration in `public/hero/` with hand-drawn notes on top (`#doodles`), a magazine-style masthead, and a slow "Built with love by people from…" logo strip (`public/logos/`) | `src/hero.ts` |
| Background + clock | Section colours (`data-bg`) and the scroll-driven clock | `src/sky.ts` |
| What / Who comes / Why | "Who comes": a typeset guest list of disciplines, each with a one-line caption on hover/tap; hand-drawn strikethroughs | `src/story.ts` |
| The day | Pinned horizontal timeline; an egg waddles along a ruler and hatches at 21:30 demos | `src/day.ts` |
| Who shows up | A specimen plate of egg figures; pull one and it springs back, hover/tap for its quote | `src/flock.ts` |
| Join | Links out to app.the-egg.club, where applications live; the next Sunday's date comes from the app's `/api/next-event` | `src/next.ts` |
| Footer → game | Past the end of the footer the page glides: one nudge down (or a 1.6s pause at the bottom of the footer) carries you into the arcade cabinet running **Night Shift**; one nudge up carries you back | `src/portal.ts`, `src/nightshift.ts` |

Everything respects `prefers-reduced-motion`.

### Night Shift (the hidden game)

A pixel-art loft in Kızılay at 23:00, drawn procedurally at 320×192 (no image
assets). Eight builders need pizza before midnight demos: grab a slice from
the counter, walk it over, and each fed team "hatches" its project (the same
ideas as the carton). Arrows/WASD or tap to walk, E/space or the yellow button
to talk. The midnight clock only starts on your first move. On phones the view narrows and follows you, with edge markers for
anyone off-screen. There's a golden egg hidden somewhere.

## Before launch

- **Placeholder content**: the social links in the footer.

## Logos in the hero strip

- `public/logos/odtu.svg`: the ODTÜ / METU wordmark, from Wikimedia Commons (marked public domain).
- `public/logos/odtu-teknokent.svg`: extracted as vectors from ODTÜ Teknokent's own brand guideline
  (Kurumsal Kimlik Kılavuzu). Their rules: never recolour, rotate, outline or box the logo; only the
  original blue or plain black/white. The strip shows them in plain black and in their own colour
  on hover, and only slides them sideways.
- To add another place, add one `<li class="built__logo">` with its logo in `index.html`; the strip
  repeats itself to fill the width automatically. Make sure you're allowed to use each logo.
