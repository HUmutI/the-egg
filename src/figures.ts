import { PALETTE } from './util'
import { FIG_VIEWBOX, I, SHELL, W, eggBody, eggClip, eggPath, face, hand, ink, lightOf, mix, nextId, shadeOf } from './ink'

/**
 * The regulars, drawn from the egg kit in ink.ts: same body, same line,
 * same face; the accessories tell you who they are.
 */

export type Kind = 'owl' | 'designer' | 'hardware' | 'founder' | 'researcher' | 'musician' | 'firstTimer' | 'pizza'
type Lang = 'en' | 'tr'

const P = PALETTE
const WOOD = '#e0a15a'
const WOOD_DEEP = '#a8643a'
const METAL = '#cfc8d6'
const CRUST = '#e7a45f'
const font = {
  mono: `font-family="DM Mono, ui-monospace, monospace"`,
  hand: `font-family="Reenie Beanie, cursive"`,
  serif: `font-family="Fraunces, Georgia, serif"`,
}

/** A four-point sparkle, like the hero's. */
const spark = (x: number, y: number, s: number, c: string = I) =>
  `<path d="M${x} ${y - 10 * s}q${2 * s} ${8 * s} ${10 * s} ${10 * s}q${-8 * s} ${2 * s} ${-10 * s} ${10 * s}q${-2 * s} ${-8 * s} ${-10 * s} ${-10 * s}q${8 * s} ${-2 * s} ${10 * s} ${-10 * s}z" fill="${c}"/>`

/** An eighth note. */
const note = (x: number, y: number, r = 0) =>
  `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="7.5" ry="5.6" transform="rotate(-22 ${x} ${y})" fill="${I}"/>${ink(`M${x + 6} ${y - 2}V${y - 32}q4 9 13 12`, 3.4)}</g>`

function owl() {
  // a hoodie, hood up; glasses lit by a laptop at 2am
  const hood = mix(P.lav, P.lavDeep, 0.42)
  const skin = SHELL.white
  const fc = nextId('fo')
  const fx = 100
  const fy = 134
  const glow = nextId('gl')
  return `
    <path d="M206 -6A18 18 0 1 0 222 22A14 14 0 0 1 206 -6Z" fill="${P.yolk}" stroke="${I}" stroke-width="${W.fine}" stroke-linejoin="round"/>
    ${spark(176, -2, 0.7)}${spark(232, 46, 0.5)}
    ${eggBody({ fill: hood })}
    <clipPath id="${fc}"><ellipse cx="${fx}" cy="${fy}" rx="56" ry="51"/></clipPath>
    <radialGradient id="${glow}" cx=".5" cy="1" r=".75"><stop offset="0" stop-color="${P.sky}" stop-opacity=".95"/><stop offset="1" stop-color="${P.sky}" stop-opacity="0"/></radialGradient>
    <ellipse cx="${fx}" cy="${fy}" rx="65" ry="60" fill="${mix(hood, '#ffffff', 0.18)}" stroke="${I}" stroke-width="${W.fine}"/>
    <g clip-path="url(#${fc})">
      <rect x="30" y="70" width="140" height="130" fill="${shadeOf(skin)}"/>
      <ellipse cx="${fx}" cy="${fy + 9}" rx="56" ry="51" fill="${skin}"/>
      <rect x="30" y="120" width="140" height="80" fill="url(#${glow})"/>
    </g>
    <ellipse cx="${fx}" cy="${fy}" rx="56" ry="51" fill="none" stroke="${I}" stroke-width="${W.prop}"/>
    ${face({ y: 134, gap: 21, eyes: 'tired', mouth: 'flat', wow: true })}
    <g fill="${P.sky}" fill-opacity=".38" stroke="${I}" stroke-width="${W.prop}">
      <rect x="62" y="119" width="34" height="28" rx="10"/><rect x="104" y="119" width="34" height="28" rx="10"/>
    </g>
    ${ink('M96 131q4 -4 8 0', W.fine)}
    ${ink('M70 125l9 -2M112 125l9 -2', 2.6, '#ffffff')}
    ${ink('M86 186v30M114 186v30', W.fine)}
    <rect x="81.5" y="212" width="9" height="13" rx="3" fill="${P.cream}" stroke="${I}" stroke-width="2.6"/>
    <rect x="109.5" y="212" width="9" height="13" rx="3" fill="${P.cream}" stroke="${I}" stroke-width="2.6"/>
    <g>
      <rect x="34" y="206" width="132" height="70" rx="9" fill="#e4e0ec" stroke="${I}" stroke-width="${W.prop}"/>
      <rect x="34" y="206" width="132" height="10" rx="5" fill="${P.sky}" opacity=".9"/>
      <path d="M100 228c5.5 0 10 8 10 14.5c0 6-4.5 9.5-10 9.5s-10-3.5-10-9.5c0-6.5 4.5-14.5 10-14.5Z" fill="${P.yolk}" stroke="${I}" stroke-width="2.6"/>
      <rect x="34" y="206" width="132" height="70" rx="9" fill="none" stroke="${I}" stroke-width="${W.prop}"/>
    </g>
    ${hand(42, 214, skin, -20)}${hand(158, 214, skin, 20)}`
}

function designer() {
  // a beret, a striped top and an opinionated swatch fan
  const fill = SHELL.white
  const c = eggClip()
  const stripes = [196, 216, 236, 256].map((y) => `<rect x="0" y="${y}" width="200" height="9" fill="${P.lavDeep}"/>`).join('')
  const cards = [
    [P.lavDeep, -58],
    [P.mintDeep, -32],
    [P.yolk, -6],
    [P.tomato, 20],
  ] as const
  const px = 186
  const py = 236
  return `
    ${c.def}
    ${eggBody({ fill })}
    <g clip-path="${c.url}">
      <path d="M0 190Q100 214 200 190V280H0Z" fill="#fffdf8"/>
      ${stripes.replace(/y="(\d+)"/g, (_, y) => `y="${+y}"`)}
      <path d="M0 190Q100 214 200 190" fill="none" stroke="${I}" stroke-width="${W.fine}"/>
    </g>
    <path d="${eggPath()}" fill="none" stroke="${I}" stroke-width="${W.body}" stroke-linejoin="round"/>
    <g transform="rotate(-10 96 42)">
      <path d="M30 60C22 34 62 14 104 14C150 14 176 34 164 52C148 70 64 76 30 60Z" fill="${P.tomato}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
      <path d="M36 58C70 68 140 64 160 50" fill="none" stroke="${mix(P.tomato, I, 0.35)}" stroke-width="5" stroke-linecap="round"/>
      ${ink('M104 14q0 -10 8 -13', W.prop)}
    </g>
    ${face({ y: 136, eyes: 'dot', mouth: 'smile', blush: true, look: [5, 0], wow: true })}
    ${cards
      .map(
        ([col, a]) => `<g transform="rotate(${a} ${px} ${py})">
          <rect x="${px - 13}" y="${py - 82}" width="26" height="78" rx="4" fill="#fffdf8" stroke="${I}" stroke-width="${W.fine}"/>
          <rect x="${px - 13}" y="${py - 82}" width="26" height="54" rx="4" fill="${col}" stroke="${I}" stroke-width="${W.fine}"/>
          ${ink(`M${px - 7} ${py - 17}h12`, 2.2)}
        </g>`,
      )
      .join('')}
    <circle cx="${px}" cy="${py - 8}" r="4.5" fill="${P.cream}" stroke="${I}" stroke-width="2.6"/>
    ${hand(px - 2, py + 2, fill, -24)}
    ${hand(12, 226, fill, 18)}`
}

function hardware() {
  // goggles up, soldering iron in hand, a board that may or may not work
  const fill = SHELL.brown
  const c = eggClip()
  const ang = -19
  return `
    ${c.def}
    ${eggBody({ fill })}
    <g clip-path="${c.url}">${ink('M0 98Q100 62 200 98', 13, I)}</g>
    <g stroke="${I}" stroke-width="${W.prop}">
      <circle cx="76" cy="86" r="20" fill="${P.mintDeep}"/><circle cx="124" cy="86" r="20" fill="${P.mintDeep}"/>
      <circle cx="76" cy="86" r="12" fill="${P.sky}" stroke-width="${W.fine}"/><circle cx="124" cy="86" r="12" fill="${P.sky}" stroke-width="${W.fine}"/>
    </g>
    ${ink('M70 80l6 -5M118 80l6 -5', 2.6, '#ffffff')}
    ${face({ y: 140, eyes: 'dot', mouth: 'tongue', look: [-5, 3], wow: true })}
    <g transform="rotate(-8 58 224)">
      <rect x="16" y="196" width="84" height="56" rx="6" fill="${P.mintDeep}" stroke="${I}" stroke-width="${W.prop}"/>
      ${ink('M26 208h20l8 8h22M26 240h14l8 -8h30M84 206v14', 2.4, P.yolk)}
      <rect x="44" y="214" width="26" height="20" rx="2" fill="${I}"/>
      ${ink('M48 210v4M55 210v4M62 210v4M48 234v4M55 234v4M62 234v4', 2, '#c8c2cc')}
      <circle cx="88" cy="238" r="5" fill="${P.tomato}" stroke="${I}" stroke-width="2.2"/>
      <circle cx="26" cy="208" r="3" fill="${P.yolk}"/><circle cx="26" cy="240" r="3" fill="${P.yolk}"/>
    </g>
    ${hand(14, 236, fill, 14)}
    ${ink('M98 210q-10 -10 -2 -20q8 -10 -2 -22', 2.8, I, 'opacity=".45"')}
    <g transform="translate(98 212) rotate(${ang})">
      <path d="M0 0L12 -3.5V3.5Z" fill="${METAL}" stroke="${I}" stroke-width="2.6" stroke-linejoin="round"/>
      <rect x="11" y="-4" width="32" height="8" rx="2" fill="${METAL}" stroke="${I}" stroke-width="2.6"/>
      <rect x="42" y="-10" width="56" height="20" rx="9" fill="${P.tomato}" stroke="${I}" stroke-width="${W.prop}"/>
      ${ink('M58 -9v18M66 -9v18', 2.4, mix(P.tomato, I, 0.35))}
      ${ink('M98 0q22 4 36 26', W.fine)}
    </g>
    ${hand(166, 192, fill, -10)}`
}

function founder(lang: Lang) {
  // the lanyard says CEO; someone has corrected it. coffee number four.
  const fill = SHELL.cream
  const c = eggClip()
  const human = lang === 'tr' ? 'insan' : 'human'
  return `
    ${c.def}
    ${eggBody({ fill })}
    <g clip-path="${c.url}">
      ${ink('M40 92L96 186M160 92L104 186', 10, I)}
      ${ink('M40 92L96 186M160 92L104 186', 5, P.tomato)}
    </g>
    ${face({ y: 130, eyes: 'dot', mouth: 'smirk', brows: 'one', wow: true })}
    <g transform="rotate(-5 100 214)">
      <rect x="93" y="180" width="14" height="10" rx="2" fill="${METAL}" stroke="${I}" stroke-width="2.4"/>
      <rect x="62" y="188" width="76" height="58" rx="6" fill="#fffdf8" stroke="${I}" stroke-width="${W.prop}"/>
      <text x="100" y="212" text-anchor="middle" ${font.mono} font-size="17" font-weight="500" letter-spacing="2" fill="${I}">CEO</text>
      ${ink('M74 210L126 202', 3.4, P.tomato)}
      <text x="100" y="239" text-anchor="middle" ${font.hand} font-size="34" fill="${P.tomato}">${human}</text>
    </g>
    <g transform="rotate(8 196 196)">
      ${ink('M188 142q-6 -8 0 -16q6 -8 0 -16M200 140q-6 -8 0 -16', 2.6, I, 'opacity=".45"')}
      <path d="M178 160L184 222H208L214 160Z" fill="#fffdf8" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
      <path d="M180.5 182L182.6 204H209.4L211.5 182Z" fill="${WOOD}" stroke="${I}" stroke-width="2.6" stroke-linejoin="round"/>
      <rect x="173" y="150" width="46" height="12" rx="5" fill="${I}"/>
    </g>
    ${hand(186, 210, fill, -12)}
    ${hand(14, 228, fill, 16)}`
}

function researcher() {
  // big glasses, one eyebrow, and a pile of papers (one of them is theirs)
  const fill = SHELL.white
  const sheets = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((k) => {
      const y = 254 - k * 10
      const dx = [0, 3, -2, 4, -1, 2, -3, 1][k]
      const r = [0, 2, -1.5, 1, -2, 1.5, -1, 2][k]
      return `<rect x="${-40 + dx}" y="${y}" width="74" height="10" rx="2" transform="rotate(${r} ${-3 + dx} ${y + 5})" fill="${k % 2 ? '#fffdf8' : P.cream}" stroke="${I}" stroke-width="${W.fine}"/>`
    })
    .join('')
  return `
    ${eggBody({ fill })}
    ${face({ y: 134, eyes: 'dot', mouth: 'flat', brows: 'one', look: [5, 1], wow: true })}
    <g fill="#ffffff" fill-opacity=".3" stroke="${I}" stroke-width="${W.prop}">
      <circle cx="80" cy="135" r="17"/><circle cx="122" cy="135" r="17"/>
    </g>
    ${ink('M97 133q4 -4 8 0M63 131L42 124M139 131L160 124', W.fine)}
    ${ink('M70 128l7 -6M112 128l7 -6', 2.4, '#ffffff')}
    ${sheets}
    <path d="M-30 176h40v24h-40z" transform="rotate(-6 -10 188)" fill="${P.yolk}" stroke="${I}" stroke-width="2.6"/>
    ${hand(8, 170, fill, 10)}
    <g transform="rotate(10 186 176)">
      <rect x="158" y="132" width="58" height="76" rx="3" fill="#fffdf8" stroke="${I}" stroke-width="${W.prop}"/>
      ${ink('M168 146h38M168 156h30M168 166h36', 2.4, I, 'opacity=".55"')}
      <path d="M170 196v-14M180 196v-22M190 196v-8M200 196v-18" stroke="${P.lavDeep}" stroke-width="6" stroke-linecap="butt"/>
      <text x="206" y="150" ${font.serif} font-style="italic" font-size="20" fill="${P.tomato}">¹</text>
    </g>
    ${hand(166, 206, fill, -16)}`
}

function musician() {
  // headphones on, eyes shut, guitar
  const fill = SHELL.tan
  const g = `translate(80 222) rotate(62)`
  return `
    ${note(-16, 54, -8)}${note(16, 14, 6)}
    ${eggBody({ fill })}
    ${ink('M18 124C8 30 192 30 182 124', 12, I)}
    ${ink('M18 124C8 30 192 30 182 124', 5, P.lavDeep)}
    <rect x="2" y="100" width="30" height="54" rx="14" fill="${P.lavDeep}" stroke="${I}" stroke-width="${W.prop}"/>
    <rect x="168" y="100" width="30" height="54" rx="14" fill="${P.lavDeep}" stroke="${I}" stroke-width="${W.prop}"/>
    <rect x="22" y="108" width="12" height="38" rx="6" fill="${I}"/>
    <rect x="166" y="108" width="12" height="38" rx="6" fill="${I}"/>
    ${face({ y: 136, eyes: 'closed', mouth: 'o', blush: true, wow: true })}
    <g transform="${g}">
      <rect x="-8" y="-150" width="16" height="104" rx="3" fill="${WOOD_DEEP}" stroke="${I}" stroke-width="${W.prop}"/>
      <path d="M-11 -150L-13 -176Q0 -184 13 -176L11 -150Z" fill="${I}"/>
      <path d="M0 -76c20 0 30 10 30 26c0 10-6 14-6 22c0 10 14 16 14 36c0 22-18 34-38 34s-38-12-38-34c0-20 14-26 14-36c0-8-6-12-6-22c0-16 10-26 30-26Z" fill="${WOOD}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
      <circle cx="0" cy="-22" r="11" fill="${I}"/>
      <rect x="-14" y="16" width="28" height="7" rx="2" fill="${WOOD_DEEP}" stroke="${I}" stroke-width="2.4"/>
      ${ink('M-3 -170V18M3 -170V18', 1.4, '#fffdf8', 'opacity=".9"')}
    </g>
    ${hand(108, 230, fill, -30)}
    ${hand(174, 166, fill, 20)}`
}

function firstTimer(lang: Lang) {
  // still wearing some shell. a sticker, in case anyone asks
  const fill = SHELL.white
  const size = { w: 158, h: 204 }
  const top = 262 - size.h
  const [hello, isNew] = lang === 'tr' ? ['MERHABA', 'yeniyim!'] : ['HELLO', 'I’m new!']
  return `
    ${ink('M-30 92q-8 14 0 28M-42 86q-12 20 0 40', 3, I, 'opacity=".5"')}
    ${eggBody({ fill, ...size })}
    <g transform="rotate(-14 100 ${top + 16})">
      <path d="M38 ${top + 30}C40 ${top - 14} 70 ${top - 32} 100 ${top - 32}S160 ${top - 14} 162 ${top + 30}L150 ${top + 18}L138 ${top + 32}L124 ${top + 16}L110 ${top + 32}L96 ${top + 16}L82 ${top + 32}L68 ${top + 16}L54 ${top + 32}Z"
        fill="${lightOf(fill)}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
      <path d="M58 ${top - 4}q10 -18 30 -22" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
    </g>
    ${face({ y: top + 92, gap: 19, eyes: 'wide', mouth: 'smile', blush: true, brows: 'up', wow: true })}
    <g transform="rotate(-6 100 208)">
      <rect x="56" y="180" width="88" height="58" rx="7" fill="#ffffff" stroke="${I}" stroke-width="${W.prop}"/>
      <path d="M56 199V187a7 7 0 0 1 7 -7h74a7 7 0 0 1 7 7v12Z" fill="${P.tomato}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
      <text x="100" y="195" text-anchor="middle" ${font.mono} font-size="${lang === 'tr' ? 11.5 : 13}" font-weight="500" letter-spacing="1.5" fill="#ffffff">${hello}</text>
      <text x="100" y="229" text-anchor="middle" ${font.hand} font-size="32" fill="${I}">${isNew}</text>
    </g>
    ${hand(-12, 116, fill, -30)}
    ${hand(184, 226, fill, 16)}`
}

function pizza() {
  // the slice is the plan
  const fill = SHELL.cream
  const cheese = '#f7cf5a'
  return `
    ${eggBody({ fill })}
    ${face({ y: 132, eyes: 'happy', mouth: 'grin', blush: true, wow: true })}
    <path d="M136 180q-2 22 6 23q8 1 8 -19z" fill="${cheese}" stroke="${I}" stroke-width="${W.fine}" stroke-linejoin="round"/>
    <g transform="translate(122 166) rotate(22)">
      <path d="M0 0L94 -42Q106 0 94 42Z" fill="${cheese}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
      <circle cx="44" cy="-6" r="9" fill="${P.tomato}" stroke="${I}" stroke-width="2.6"/>
      <circle cx="72" cy="16" r="9.5" fill="${P.tomato}" stroke="${I}" stroke-width="2.6"/>
      <circle cx="70" cy="-22" r="8" fill="${P.tomato}" stroke="${I}" stroke-width="2.6"/>
      <circle cx="20" cy="-1" r="3" fill="${P.mintDeep}"/><circle cx="56" cy="8" r="3" fill="${P.mintDeep}"/>
      <path d="M90 -46Q108 0 90 46L104 50Q126 0 104 -50Z" fill="${CRUST}" stroke="${I}" stroke-width="${W.prop}" stroke-linejoin="round"/>
    </g>
    ${hand(212, 208, fill, -20)}
    ${hand(12, 226, fill, 16)}
    ${spark(28, 52, 0.6, P.tomato)}`
}

const DRAW: Record<Kind, (lang: Lang) => string> = {
  owl,
  designer,
  hardware,
  founder,
  researcher,
  musician,
  firstTimer,
  pizza,
}

/** One figure's SVG markup (without the outer <svg>). */
export const figure = (kind: Kind, lang: Lang) => DRAW[kind](lang)

/** The empty seat: a dashed egg, waiting for you. */
export const emptyEgg = (lang: Lang) => `
  <ellipse class="egg__ground" cx="104" cy="266" rx="70" ry="9" fill="${I}" opacity=".1"/>
  <path class="egg__dash" d="${eggPath()}" fill="${P.cream}" fill-opacity=".4" stroke="${I}" stroke-width="${W.prop}" stroke-dasharray="3 12" stroke-linecap="round"/>
  <text x="100" y="168" text-anchor="middle" ${font.serif} font-style="italic" font-size="52" fill="${I}">${lang === 'tr' ? 'sen?' : 'you?'}</text>`

export { FIG_VIEWBOX }
