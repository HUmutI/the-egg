import { PALETTE } from './util'
import { lang } from './i18n'

/**
 * NIGHT SHIFT — the hidden game behind the footer.
 *
 * A tiny top-down pixel loft in Kızılay, 23:00. Eight builders are racing to
 * demo at midnight and nobody has eaten. Grab slices from the pizza counter,
 * walk them over, and every team you feed hatches its project. Talk to
 * everyone; there's a golden egg hidden somewhere.
 *
 * Everything is drawn procedurally at 320×192 and scaled up crisp.
 */

const W = 320
const H = 192
const CELL = 8
const COLS = W / CELL
const ROWS = H / CELL
const DARK = '#140b18'
const MIN_PER_SEC = 1 / 1.4 // game minutes per real second
const BEST_KEY = 'eggclub:nightshift-best'

type Acc = 'glasses' | 'beret' | 'goggles' | 'cap' | 'bandage' | 'headphones' | 'sprout' | 'mustache' | 'crack'

interface Actor {
  x: number
  y: number
  body: string
  acc: Acc
  facing: 1 | -1
  moving: boolean
  anim: number
  path: [number, number][]
}

interface Npc extends Actor {
  name: string
  tag: string
  seat: [number, number]
  hungry: boolean
  project: string
  ask: string[]
  thanks: string
  wanderIn: number
  bob: number
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface Line {
  name: string
  text: string
  color: string
}

const CHATTER =
  lang === 'tr'
    ? [
        'Bir numaralı kural: Egg Club hakkında KONUŞURSUN.',
        'Bir sonraki Pazar Çankaya’da. Tuhaf şeyler üreten bir arkadaşını getir.',
        'Yarım pişmiş olmak burada tarz. Bitmiş şeyler sıkıcı.',
        'Pizza için geldim. Biri deploy’umu düzelttiği için kaldım.',
        'Son dilimi alan, bir sonraki pizzayı ısmarlar. Unutma.',
      ]
    : [
        'Rule one: you DO talk about Egg Club.',
        'Next Sunday is in Çankaya. Bring a friend who builds weird things.',
        'Half-baked is the house style. Finished things are boring.',
        'I came for the pizza. I stayed because someone fixed my deploy.',
        'Whoever takes the last slice orders the next pizza. Remember that.',
      ]

const npcs = (): Npc[] => {
  const mk = (
    name: string,
    tag: string,
    body: string,
    acc: Acc,
    seat: [number, number],
    project: string,
    ask: string[],
    thanks: string,
  ): Npc => ({
    name, tag, body, acc, seat, project, ask, thanks,
    x: seat[0], y: seat[1], facing: 1, moving: false, anim: 0, path: [],
    hungry: true, wanderIn: 4 + Math.random() * 8, bob: Math.random() * 6,
  })
  if (lang === 'tr') {
    return [
      mk('Deniz', 'gece kuşu mühendis', PALETTE.lav, 'glasses', [44, 92], 'Kızılay FM',
        ['Konuşamam. Derliyorum. …dur, pizza mı kokuyor?', 'Kızılay’daki her otobüs artık bir nota. Bana sadece… kalori gerek.'],
        'Yakıt sağlandı. Kızılay FM yayında — otobüsler artık bas.'),
      mk('Ela', 'tasarımcı', PALETTE.pink, 'beret', [76, 92], 'Lost Words',
        ['Kerning doğru olunca yerim. Yani… hiç. Bir dilim getirmezsen tabii.', 'Pizzayı daha yumuşak bir sarıda deneyebilir miyiz?'],
        'Mükemmel. Lost Words şimdi muhteşem görünüyor. Jenerikte adın var.'),
      mk('Kaan', 'donanım cini', PALETTE.mint, 'goggles', [106, 92], 'Pizza Tepsisi',
        ['Bir pizza tepsisi! Tepsiye ihtiyacım var. Pizzaya da sanırım.', 'Bu anten %90 silikon yapıştırıcı. Diğer %10’u umut.'],
        'Bir hava uydusundan canlı görüntü çektik. Pizza tepsisiyle.'),
      mk('Mert', 'iyileşen girişimci', PALETTE.peach, 'cap', [44, 148], 'Apartman Digest',
        ['Sunum yok, söz. Tamam, ufak bir tane: pizza… bana teslim edilsin.', 'Yatırım almıyoruz. Sadece çok, çok açız.'],
        'Apartman Digest: 214 mesaj, bir cümle. Henüz yatırım almıyoruz.'),
      mk('Zeynep', 'araştırmacı', PALETTE.sky, 'bandage', [84, 148], 'Pazar Index',
        ['Optimal pizza dağılımı üzerine bir makale var. Yanlış yapıyorsun. Yine de bir tane getir.', 'Domatesler öğleden sonra %4 arttı. Veriye ihtiyacım var. Ve hamura.'],
        'Pazar Index çiziyor. Hakem değerlendirmesi: nefis.'),
      mk('Arda', 'müzisyen', PALETTE.cream, 'headphones', [212, 148], 'Sound of the City',
        ['Uygulamanın bir bas hattı olsa? Pizzanın içine ben saklansam?', 'Kızılay kalabalığını kaydettim. Şimdi bir atıştırmalık gerek.'],
        'Sound of the City artık adımlarını içinde taşıyor. Dikkatlice dinle.'),
      mk('Selin', 'ilk kez gelen', '#bfe3c9', 'sprout', [244, 148], 'Kedi ID',
        ['İlk hackathon. Hep bu kadar heyecanlı mı? Ayrıca açlıktan ölüyorum.', '300 kedi üzerinde bir model eğittik. Hiçbirimiz yemek yemedi.'],
        'Yayına aldık! Kedi ID üç Tekir buldu ve hepsi farklı.'),
      mk('Bora', 'pizza için burada', PALETTE.lavDeep, 'mustache', [276, 148], 'The Fair Slice',
        ['Açıkçası? Pizza için buradayım. Sonra inşa için. O sırayla.', 'Uygulamam pizza dilimlerini ölçüyor. Hiç pizzam yok. Sorunu görüyor musun?'],
        'The Fair Slice bu dilimin seninkinden %2 daha büyük olduğunu söylüyor. Sağ ol.'),
    ]
  }
  return [
    mk('Deniz', 'night-owl engineer', PALETTE.lav, 'glasses', [44, 92], 'Kızılay FM',
      ['Can’t talk. Compiling. …wait, is that pizza I smell?', 'Every bus in Kızılay is a note now. I just need… calories.'],
      'Fuel acquired. Kızılay FM is live — the buses are the bass.'),
    mk('Ela', 'the designer', PALETTE.pink, 'beret', [76, 92], 'Lost Words',
      ['I’ll eat once the kerning is right. So… never. Unless you bring me a slice.', 'Can we try the pizza in a softer yellow?'],
      'Perfect. Lost Words looks gorgeous now. You’re in the credits.'),
    mk('Kaan', 'hardware gremlin', PALETTE.mint, 'goggles', [106, 92], 'Pizza Tray Dish',
      ['A pizza tray! I need the tray. And the pizza, I suppose.', 'This antenna is 90% hot glue. The other 10% is hope.'],
      'We just pulled a live image from a weather satellite. With a pizza tray.'),
    mk('Mert', 'recovering founder', PALETTE.peach, 'cap', [44, 148], 'Apartman Digest',
      ['No pitch, I promise. Okay, a tiny one: pizza… delivered to me.', 'We’re not raising. We’re just very, very hungry.'],
      'Apartman Digest: 214 messages, one sentence. Not raising. Yet.'),
    mk('Zeynep', 'the researcher', PALETTE.sky, 'bandage', [84, 148], 'Pazar Index',
      ['There’s a paper on optimal pizza distribution. You’re doing it wrong. Bring one anyway.', 'Tomatoes are up 4% since lunch. I need data. And dough.'],
      'Pazar Index is plotting. Peer review: delicious.'),
    mk('Arda', 'the musician', PALETTE.cream, 'headphones', [212, 148], 'Sound of the City',
      ['What if the app… had a bassline? What if the pizza… had me?', 'I recorded the Kızılay crowd. Now I need a snack.'],
      'Sound of the City has your footsteps in it now. Listen closely.'),
    mk('Selin', 'first-timer', '#bfe3c9', 'sprout', [244, 148], 'Kedi ID',
      ['First hackathon. Is it always this exciting? Also I’m starving.', 'We trained a model on 300 cats. None of us have eaten.'],
      'We shipped! Kedi ID found three Tekirs and they’re all different.'),
    mk('Bora', 'here for the pizza', PALETTE.lavDeep, 'mustache', [276, 148], 'The Fair Slice',
      ['Honestly? I’m here for the pizza. Then the build. In that order.', 'My app measures pizza slices. I have no pizza. Do you see the problem?'],
      'The Fair Slice says this one is 2% bigger than yours. Thank you.'),
  ]
}

// ── the room ─────────────────────────────────────────────────────────

const TABLES: Rect[] = [
  { x: 26, y: 66, w: 96, h: 16 },
  { x: 26, y: 122, w: 80, h: 16 },
  { x: 196, y: 122, w: 96, h: 16 },
]
const COUNTER: Rect = { x: 196, y: 58, w: 84, h: 16 }
const PLANTS: [number, number][] = [
  [10, 176],
  [304, 100],
  [304, 176],
  [134, 54],
]
const SOFA: Rect = { x: 136, y: 160, w: 44, h: 14 }
const GOLDEN = { x: 14, y: 182 }
const START = { x: 160, y: 108 }

const blocked: boolean[] = []
const buildGrid = () => {
  const solid: Rect[] = [
    { x: 0, y: 0, w: W, h: 46 },
    { x: 0, y: 186, w: W, h: 6 },
    ...TABLES,
    COUNTER,
    SOFA,
    ...PLANTS.map(([x, y]) => ({ x: x - 6, y: y - 6, w: 12, h: 8 })),
  ]
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const x = c * CELL
      const y = r * CELL
      blocked[r * COLS + c] =
        c === 0 || c === COLS - 1 ||
        solid.some((s) => x + CELL > s.x && x < s.x + s.w && y + CELL > s.y && y < s.y + s.h)
    }
}
buildGrid()

const cellOf = (x: number, y: number) => [Math.floor(x / CELL), Math.floor(y / CELL)] as const
const free = (x: number, y: number) => {
  const [c, r] = cellOf(x, y)
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return false
  return !blocked[r * COLS + c]
}
const freeFeet = (x: number, y: number) => free(x - 3, y) && free(x + 3, y) && free(x - 3, y - 3) && free(x + 3, y - 3)

/** Breadth-first path on the 8px grid; returns waypoints (cell centres). */
function findPath(fx: number, fy: number, tx: number, ty: number): [number, number][] {
  const [sc, sr] = cellOf(fx, fy)
  let [gc, gr] = cellOf(tx, ty)
  if (blocked[gr * COLS + gc]) {
    // nearest free cell to the goal
    let best = -1
    let bd = Infinity
    for (let i = 0; i < blocked.length; i++) {
      if (blocked[i]) continue
      const d = Math.hypot((i % COLS) - gc, Math.floor(i / COLS) - gr)
      if (d < bd) {
        bd = d
        best = i
      }
    }
    gc = best % COLS
    gr = Math.floor(best / COLS)
  }
  const start = sr * COLS + sc
  const goal = gr * COLS + gc
  const prev = new Int32Array(COLS * ROWS).fill(-1)
  prev[start] = start
  const q = [start]
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  while (q.length) {
    const cur = q.shift()!
    if (cur === goal) break
    const c = cur % COLS
    const r = Math.floor(cur / COLS)
    for (const [dc, dr] of dirs) {
      const nc = c + dc
      const nr = r + dr
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue
      const n = nr * COLS + nc
      if (blocked[n] || prev[n] !== -1) continue
      if (dc && dr && (blocked[r * COLS + nc] || blocked[nr * COLS + c])) continue
      prev[n] = cur
      q.push(n)
    }
  }
  if (prev[goal] === -1) return []
  const out: [number, number][] = []
  for (let n = goal; n !== start; n = prev[n]) out.push([(n % COLS) * CELL + 4, Math.floor(n / COLS) * CELL + 6])
  return out.reverse()
}

// ── pixel helpers ────────────────────────────────────────────────────

const EGG_MASK = [
  '....XXXX....',
  '...XXXXXX...',
  '..XXXXXXXX..',
  '..XXXXXXXX..',
  '.XXXXXXXXXX.',
  '.XXXXXXXXXX.',
  'XXXXXXXXXXXX',
  'XXXXXXXXXXXX',
  'XXXXXXXXXXXX',
  'XXXXXXXXXXXX',
  'XXXXXXXXXXXX',
  '.XXXXXXXXXX.',
  '..XXXXXXXX..',
  '...XXXXXX...',
]
const inMask = (x: number, y: number) => y >= 0 && y < EGG_MASK.length && x >= 0 && x < 12 && EGG_MASK[y][x] === 'X'

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)))
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}

const FONT: Record<string, string[]> = {
  E: ['###', '#..', '##.', '#..', '###'],
  G: ['###', '#..', '#.#', '#.#', '###'],
  C: ['###', '#..', '#..', '#..', '###'],
  L: ['#..', '#..', '#..', '#..', '###'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  ' ': ['...', '...', '...', '...', '...'],
}

const SLICE = ['ccccccc', 'yyryyyy', '.yyyyr.', '.yryyy.', '..yyy..', '..yy...', '...y...']
const SLICE_PAL: Record<string, string> = { c: '#d68a3a', y: '#f5c04e', r: '#d0412f' }

function pix(ctx: CanvasRenderingContext2D, x: number, y: number, c: string, w = 1, h = 1) {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

function text3x5(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, c: string) {
  let cx = x
  for (const ch of s) {
    const g = FONT[ch] ?? FONT[' ']
    g.forEach((row, ry) => [...row].forEach((v, rx) => v === '#' && pix(ctx, cx + rx, y + ry, c)))
    cx += 4
  }
}

function drawSlice(ctx: CanvasRenderingContext2D, x: number, y: number) {
  SLICE.forEach((row, ry) => [...row].forEach((v, rx) => v !== '.' && pix(ctx, x + rx, y + ry, SLICE_PAL[v])))
}

function drawEgg(ctx: CanvasRenderingContext2D, a: Actor) {
  const frame = a.moving ? Math.floor(a.anim * 6) % 2 : 0
  const ox = Math.round(a.x) - 6
  const oy = Math.round(a.y) - 15 - (frame ? 1 : 0)
  const f = a.facing

  // soft shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.fillRect(Math.round(a.x) - 5, Math.round(a.y), 10, 2)

  const dark = shade(a.body, 0.78)
  for (let y = 0; y < 14; y++)
    for (let x = 0; x < 12; x++) {
      if (!inMask(x, y)) continue
      const edge = !inMask(x - 1, y) || !inMask(x + 1, y) || !inMask(x, y - 1) || !inMask(x, y + 1)
      pix(ctx, ox + x, oy + y, edge ? DARK : y > 9 && x > 6 ? dark : a.body)
    }
  pix(ctx, ox + 3, oy + 3, 'rgba(255,255,255,.85)', 1, 2)
  pix(ctx, ox + 4, oy + 2, 'rgba(255,255,255,.85)')

  // feet
  const fy = Math.round(a.y) - 1
  const fxs = frame ? [-4, -3, 3, 4] : [-3, -2, 2, 3]
  fxs.forEach((dx) => pix(ctx, Math.round(a.x) + dx, fy, DARK))

  // face
  const eyes = a.acc === 'goggles' ? [4, 7] : [f === 1 ? 5 : 3, f === 1 ? 8 : 6]
  eyes.forEach((ex) => pix(ctx, ox + ex, oy + 7, DARK, 1, 2))

  const P = (x: number, y: number, c: string, w = 1, h = 1) => pix(ctx, ox + (f === 1 ? x : 12 - x - w), oy + y, c, w, h)
  switch (a.acc) {
    case 'glasses':
      P(3, 6, DARK, 3, 1); P(7, 6, DARK, 3, 1); P(3, 9, DARK, 3, 1); P(7, 9, DARK, 3, 1)
      P(2, 7, DARK, 1, 2); P(6, 7, DARK, 1, 2); P(10, 7, DARK, 1, 2)
      break
    case 'beret':
      P(2, 0, PALETTE.tomato, 8, 2); P(3, -1, PALETTE.tomato, 6, 1); P(6, -2, DARK, 1, 1); P(1, 1, DARK, 1, 1)
      break
    case 'goggles':
      P(1, 3, DARK, 10, 2); P(3, 3, PALETTE.sky, 2, 2); P(7, 3, PALETTE.sky, 2, 2)
      break
    case 'cap':
      P(2, 0, PALETTE.lavDeep, 8, 3); P(3, -1, PALETTE.lavDeep, 6, 1); P(9, 2, PALETTE.lavDeep, 4, 1)
      break
    case 'headphones':
      P(2, -1, DARK, 8, 1); P(1, 0, DARK, 1, 2); P(10, 0, DARK, 1, 2)
      P(0, 5, PALETTE.tomato, 2, 4); P(10, 5, PALETTE.tomato, 2, 4)
      break
    case 'bandage':
      P(6, 2, PALETTE.peach, 4, 2); P(7, 2, '#c98', 1, 1); P(4, 1, DARK, 1, 1); P(5, 2, DARK, 1, 1)
      break
    case 'sprout':
      P(6, -2, PALETTE.mintDeep, 1, 2); P(4, -3, PALETTE.mintDeep, 2, 1); P(7, -3, PALETTE.mintDeep, 2, 1)
      break
    case 'mustache':
      P(3, 10, DARK, 6, 1); P(2, 11, DARK, 1, 1); P(9, 11, DARK, 1, 1)
      break
    case 'crack':
      P(5, 1, DARK); P(6, 2, DARK); P(5, 3, DARK); P(6, 4, DARK)
      break
  }
}

// ── static background ────────────────────────────────────────────────

function seeded(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

function paintRoom(ctx: CanvasRenderingContext2D) {
  const rnd = seeded(7)
  // floor planks
  ctx.fillStyle = '#3a2433'
  ctx.fillRect(0, 40, W, H - 40)
  for (let y = 40; y < H; y += 8) {
    ctx.fillStyle = '#33202d'
    ctx.fillRect(0, y, W, 1)
    const off = (y / 8) % 2 ? 0 : 20
    for (let x = off; x < W; x += 40) ctx.fillRect(x, y, 1, 8)
  }
  // rug
  ctx.fillStyle = '#4a2f58'
  ctx.fillRect(124, 146, 68, 34)
  ctx.fillStyle = '#5a3a6a'
  ctx.fillRect(126, 148, 64, 30)
  for (let x = 128; x < 190; x += 6) pix(ctx, x, 150, '#6d4a7e', 3, 1)

  // wall
  ctx.fillStyle = '#271830'
  ctx.fillRect(0, 0, W, 40)
  ctx.fillStyle = '#20132a'
  for (let x = 0; x < W; x += 16) ctx.fillRect(x, 0, 1, 38)
  ctx.fillStyle = '#4a3054'
  ctx.fillRect(0, 38, W, 3)
  ctx.fillStyle = '#170d1d'
  ctx.fillRect(0, 41, W, 2)

  // window A: Atakule + moon · window B: the city's lights, a plane crossing
  const win = (x: number, w: number, far: boolean) => {
    ctx.fillStyle = '#57406a'
    ctx.fillRect(x - 2, 4, w + 4, 30)
    ctx.fillStyle = '#16203f'
    ctx.fillRect(x, 6, w, 26)
    ctx.fillStyle = '#1d2a52'
    ctx.fillRect(x, 20, w, 12)
    for (let i = 0; i < w / 6; i++) pix(ctx, x + Math.floor(rnd() * w), 7 + Math.floor(rnd() * 12), rnd() > 0.5 ? '#fff3d6' : '#9fb3e8')
    if (far) {
      // the city spread out below, lights to the horizon
      ctx.fillStyle = '#0c1024'
      ctx.fillRect(x, 23, w, 9)
      let bx = x
      while (bx < x + w) {
        const bw = 3 + Math.floor(rnd() * 5)
        const bh = 2 + Math.floor(rnd() * 5)
        ctx.fillRect(bx, 23 - bh, Math.min(bw, x + w - bx), bh)
        bx += bw
      }
      for (let i = 0; i < w; i += 3) pix(ctx, x + i + Math.floor(rnd() * 2), 24 + Math.floor(rnd() * 7), rnd() > 0.35 ? '#ffc531' : '#f2a35a')
    } else {
      let bx = x
      while (bx < x + w) {
        const bw = 4 + Math.floor(rnd() * 8)
        const bh = 5 + Math.floor(rnd() * 10)
        ctx.fillStyle = '#0c1024'
        ctx.fillRect(bx, 32 - bh, Math.min(bw, x + w - bx), bh)
        if (rnd() > 0.4) pix(ctx, bx + 2, 32 - bh + 3, '#ffc531')
        bx += bw
      }
      // Atakule: a thin shaft with a round head and a mast
      const gx = x + Math.floor(w * 0.62)
      ctx.fillStyle = '#0c1024'
      ctx.fillRect(gx + 2, 13, 3, 19)
      ctx.fillRect(gx, 10, 7, 4)
      ctx.fillRect(gx + 1, 9, 5, 1)
      ctx.fillRect(gx + 1, 14, 5, 1)
      ctx.fillRect(gx + 3, 5, 1, 4)
      pix(ctx, gx + 1, 11, '#ffc531', 5, 1)
      pix(ctx, gx + 3, 4, PALETTE.tomato)
      // moon
      ctx.fillStyle = '#fff3d6'
      ctx.fillRect(x + 10, 9, 5, 5)
      ctx.fillRect(x + 9, 10, 7, 3)
      ctx.fillStyle = '#16203f'
      ctx.fillRect(x + 13, 9, 3, 3)
    }
    // mullions
    ctx.fillStyle = '#57406a'
    ctx.fillRect(x + Math.floor(w / 2), 6, 2, 26)
    ctx.fillRect(x, 18, w, 1)
  }
  win(10, 88, false)
  win(242, 66, true)

  // whiteboard with sticky notes
  ctx.fillStyle = '#c9c1d6'
  ctx.fillRect(112, 8, 58, 26)
  ctx.fillStyle = '#ece8f3'
  ctx.fillRect(113, 9, 56, 24)
  const notes = [PALETTE.yolk, PALETTE.pink, PALETTE.mint, PALETTE.lav, PALETTE.peach, PALETTE.sky]
  for (let i = 0; i < 9; i++) {
    const nx = 116 + (i % 5) * 10 + (i > 4 ? 5 : 0)
    const ny = 12 + (i > 4 ? 10 : 0) + (i % 2)
    ctx.fillStyle = notes[i % notes.length]
    ctx.fillRect(nx, ny, 7, 7)
    ctx.fillStyle = 'rgba(20,11,24,.35)'
    ctx.fillRect(nx + 1, ny + 2, 5, 1)
    ctx.fillRect(nx + 1, ny + 4, 3, 1)
  }

  // neon sign
  ctx.fillStyle = '#1c1022'
  ctx.fillRect(178, 10, 56, 13)
  text3x5(ctx, 'EGG CLUB', 186, 14, '#ffd9e5')

  // tables with laptops and mugs
  const laptop = (x: number, y: number, glow: string) => {
    ctx.fillStyle = '#8c8496'
    ctx.fillRect(x, y + 4, 10, 2)
    ctx.fillStyle = '#5e5768'
    ctx.fillRect(x + 1, y, 8, 5)
    ctx.fillStyle = glow
    ctx.fillRect(x + 2, y + 1, 6, 3)
  }
  TABLES.forEach((t, ti) => {
    ctx.fillStyle = '#2a1820'
    ctx.fillRect(t.x + 2, t.y + t.h, t.w - 4, 3)
    ctx.fillStyle = '#7a5442'
    ctx.fillRect(t.x, t.y, t.w, t.h)
    ctx.fillStyle = '#8d6450'
    ctx.fillRect(t.x, t.y, t.w, 3)
    ctx.fillStyle = '#5c3d31'
    ctx.fillRect(t.x, t.y + t.h - 2, t.w, 2)
    const glows = [PALETTE.sky, PALETTE.mint, PALETTE.lav, PALETTE.pink]
    for (let x = t.x + 8, k = 0; x < t.x + t.w - 10; x += 26, k++) {
      laptop(x, t.y + 4, glows[(k + ti) % glows.length])
      pix(ctx, x + 14, t.y + 8, '#fffbf1', 3, 3)
      pix(ctx, x + 15, t.y + 8, '#c8b8a6', 1, 1)
    }
    // stray sticky + cables
    pix(ctx, t.x + t.w - 8, t.y + 9, PALETTE.yolk, 4, 4)
  })

  // pizza counter
  const c = COUNTER
  ctx.fillStyle = '#21131f'
  ctx.fillRect(c.x + 2, c.y + c.h, c.w - 4, 3)
  ctx.fillStyle = '#5b3d55'
  ctx.fillRect(c.x, c.y, c.w, c.h)
  ctx.fillStyle = '#6e4c68'
  ctx.fillRect(c.x, c.y, c.w, 3)
  for (let i = 0; i < 3; i++) {
    const bx = c.x + 6 + i * 26
    ctx.fillStyle = '#c99a6b'
    ctx.fillRect(bx, c.y + 2, 20, 12)
    ctx.fillStyle = '#b5845a'
    ctx.fillRect(bx, c.y + 2, 20, 1)
    // the pizza
    ctx.fillStyle = '#d68a3a'
    ctx.fillRect(bx + 3, c.y + 4, 14, 9)
    ctx.fillStyle = '#f5c04e'
    ctx.fillRect(bx + 4, c.y + 5, 12, 7)
    ;[[6, 6], [11, 7], [8, 10], [13, 10], [5, 9]].forEach(([px, py]) => pix(ctx, bx + px, c.y + py, '#d0412f', 2, 1))
    if (i === 1) {
      // missing slices
      ctx.fillStyle = '#c99a6b'
      ctx.fillRect(bx + 10, c.y + 4, 7, 5)
    }
  }
  // sign
  ctx.fillStyle = '#1c1022'
  ctx.fillRect(c.x + c.w - 2, c.y - 12, 26, 10)
  text3x5(ctx, 'PIZZA', c.x + c.w + 1, c.y - 10, PALETTE.yolk)

  // sofa
  ctx.fillStyle = '#2a1a33'
  ctx.fillRect(SOFA.x, SOFA.y + SOFA.h, SOFA.w, 2)
  ctx.fillStyle = '#9d88f0'
  ctx.fillRect(SOFA.x, SOFA.y, SOFA.w, SOFA.h)
  ctx.fillStyle = '#b8a8f5'
  ctx.fillRect(SOFA.x + 2, SOFA.y + 2, SOFA.w / 2 - 3, 6)
  ctx.fillRect(SOFA.x + SOFA.w / 2 + 1, SOFA.y + 2, SOFA.w / 2 - 3, 6)
  ctx.fillStyle = '#7d68d0'
  ctx.fillRect(SOFA.x, SOFA.y, 3, SOFA.h)
  ctx.fillRect(SOFA.x + SOFA.w - 3, SOFA.y, 3, SOFA.h)

  // plants
  PLANTS.forEach(([x, y]) => {
    ctx.fillStyle = '#a5583c'
    ctx.fillRect(x - 4, y - 3, 8, 6)
    ctx.fillStyle = '#c06a49'
    ctx.fillRect(x - 4, y - 3, 8, 1)
    ctx.fillStyle = '#2f7a59'
    ctx.fillRect(x - 6, y - 12, 4, 6)
    ctx.fillRect(x + 2, y - 13, 4, 7)
    ctx.fillRect(x - 2, y - 16, 4, 12)
    ctx.fillStyle = '#4fb487'
    ctx.fillRect(x - 1, y - 15, 2, 6)
    ctx.fillRect(x - 5, y - 11, 2, 3)
    ctx.fillRect(x + 3, y - 12, 2, 3)
  })

  // bottom wall + door
  ctx.fillStyle = '#271830'
  ctx.fillRect(0, 186, W, 6)
  ctx.fillStyle = '#4a3054'
  ctx.fillRect(0, 185, W, 1)
  ctx.fillStyle = '#5a3a2e'
  ctx.fillRect(148, 185, 24, 7)
  ctx.fillStyle = '#ffc531'
  pix(ctx, 168, 188, '#ffc531')
}

function paintLight(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(8,3,16,0.42)'
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'destination-out'
  const holes: [number, number, number][] = [
    [74, 86, 74],
    [66, 136, 60],
    [244, 136, 62],
    [238, 70, 58],
    [206, 18, 34],
    [160, 104, 54],
  ]
  for (const [x, y, r] of holes) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(0,0,0,1)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  ctx.globalCompositeOperation = 'source-over'
}

// ── the game ─────────────────────────────────────────────────────────

export interface NightShift {
  /** Run the room without taking the keyboard (while the cabinet slides in). */
  preview(): void
  /** Hand the keyboard to the game. */
  start(): void
  /** Give the keyboard back but keep the room alive. */
  release(): void
  stop(): void
  talk(): void
  restart(): void
}

export function createNightShift(opts: {
  canvas: HTMLCanvasElement
  hud: HTMLElement
  dialog: HTMLElement
  dialogName: HTMLElement
  dialogText: HTMLElement
  card: HTMLElement
  hint: HTMLElement
  onExit: () => void
  reducedMotion: boolean
}): NightShift {
  const { canvas, hud, dialog, dialogName, dialogText, card, hint } = opts
  const ctx = canvas.getContext('2d')!
  const screenEl = canvas.parentElement!

  // Wide screens see the whole loft; phones get a taller view that follows you.
  let VW = W
  let camX = 0
  const fit = () => {
    const narrow = screenEl.clientWidth > 0 && screenEl.clientWidth < 560
    const next = narrow ? 176 : W
    if (next !== VW || canvas.width !== next) {
      VW = next
      canvas.width = VW
      canvas.height = H
    }
    screenEl.style.aspectRatio = `${VW} / ${H}`
    screenEl.classList.toggle('is-narrow', narrow)
    ctx.imageSmoothingEnabled = false
  }
  new ResizeObserver(fit).observe(screenEl.parentElement!)
  fit()

  const bg = document.createElement('canvas')
  bg.width = W
  bg.height = H
  paintRoom(bg.getContext('2d')!)
  const light = document.createElement('canvas')
  light.width = W
  light.height = H
  paintLight(light.getContext('2d')!)

  let state: 'title' | 'play' | 'end' = 'title'
  let people: Npc[] = []
  const you: Actor = { x: START.x, y: START.y, body: PALETTE.yolk, acc: 'crack', facing: 1, moving: false, anim: 0, path: [] }
  let carrying = false
  let fed = 0
  let minutes = 23 * 60
  let golden = false
  let clockOn = false
  let pending: null | { kind: 'npc'; npc: Npc } | { kind: 'counter' } = null
  let queue: Line[] = []
  let typing = 0
  let typed = ''
  let afterDialog: (() => void) | null = null
  let floats: { x: number; y: number; t: number; text: string; color: string }[] = []
  let sparks: { x: number; y: number; vx: number; vy: number; t: number; c: string }[] = []
  let planeX = 0
  let raf = 0
  let last = 0
  let running = false
  const keys = new Set<string>()
  let best = Number(safeGet(BEST_KEY) ?? 0)

  const fmt = (m: number) => {
    const mm = Math.floor(m)
    return `${String(Math.floor(mm / 60) % 24).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`
  }

  const renderHud = () => {
    if (state !== 'play') {
      hud.innerHTML = ''
      return
    }
    const mid =
      clockOn
        ? `<b>${fmt(minutes)}</b><i> · ${lang === 'tr' ? 'demolar 00:00' : 'demos 00:00'}</i>`
        : `<b>${lang === 'tr' ? 'hareket et, başla' : 'move to start'}</b>`
    const fedLabel = lang === 'tr' ? 'beslenen' : 'fed'
    const handsFree = lang === 'tr' ? 'eller boş' : 'hands free'
    const sliceLabel = lang === 'tr' ? '<b>● dilim</b>' : '<b>● slice</b>'
    hud.innerHTML = `<span>${fedLabel} <b>${fed}/8</b></span><span>${mid}</span><span>${carrying ? sliceLabel : handsFree}${golden ? ' · <b>★</b>' : ''}</span>`
  }

  // ── dialog ──
  const say = (lines: Line[], then?: () => void) => {
    queue = lines.slice()
    afterDialog = then ?? null
    nextLine()
  }
  const nextLine = () => {
    const l = queue.shift()
    if (!l) {
      dialog.hidden = true
      const f = afterDialog
      afterDialog = null
      f?.()
      return
    }
    dialog.hidden = false
    dialog.style.setProperty('--c', l.color)
    dialogName.textContent = l.name
    typed = l.text
    typing = opts.reducedMotion ? l.text.length : 0
    dialogText.textContent = opts.reducedMotion ? l.text : ''
  }
  const advance = () => {
    if (dialog.hidden) return false
    if (typing < typed.length) {
      typing = typed.length
      dialogText.textContent = typed
    } else nextLine()
    return true
  }

  // ── cards ──
  const endCard = (won: boolean) => {
    state = 'end'
    dialog.hidden = true
    if (won && (!best || minutes < best)) {
      best = minutes
      safeSet(BEST_KEY, String(Math.floor(best)))
    }
    const shipped = people.filter((p) => !p.hungry).map((p) => `<li>✓ ${p.project}</li>`).join('')
    card.innerHTML =
      lang === 'tr'
        ? won
          ? `<h3>Demo zamanı</h3>
             <p>Tüm takımlar yayına girdi. Herkes ${fmt(minutes)}’e kadar beslendi${golden ? ', ve altın yumurtayı buldun' : ''}.</p>
             <ul>${shipped}</ul>
             <p>The Egg Club’da bir Pazar böyle hissettirir. Gelip gerçeğini inşa et.</p>
             <div class="pxbtns"><button class="pxbtn" data-act="join" type="button">Yerini ayır</button><button class="pxbtn pxbtn--ghost" data-act="play" type="button">Tekrar oyna</button></div>`
          : `<h3>Gece yarısı</h3>
             <p>Demolar ${8 - fed} açlıktan bitmiş inşacıyla başladı. Seni affederler. Muhtemelen.</p>
             ${shipped ? `<ul>${shipped}</ul>` : ''}
             <div class="pxbtns"><button class="pxbtn" data-act="play" type="button">Tekrar dene</button><button class="pxbtn pxbtn--ghost" data-act="join" type="button">Yerini ayır</button></div>`
        : won
          ? `<h3>Demo time</h3>
             <p>Every team shipped. Everyone fed by ${fmt(minutes)}${golden ? ', and you found the golden egg' : ''}.</p>
             <ul>${shipped}</ul>
             <p>This is what a Sunday at The Egg Club feels like. Come build the real thing.</p>
             <div class="pxbtns"><button class="pxbtn" data-act="join" type="button">Save a seat</button><button class="pxbtn pxbtn--ghost" data-act="play" type="button">Play again</button></div>`
          : `<h3>Midnight</h3>
             <p>Demos started with ${8 - fed} hungry builder${8 - fed === 1 ? '' : 's'}. They’ll forgive you. Probably.</p>
             ${shipped ? `<ul>${shipped}</ul>` : ''}
             <div class="pxbtns"><button class="pxbtn" data-act="play" type="button">Try again</button><button class="pxbtn pxbtn--ghost" data-act="join" type="button">Save a seat</button></div>`
    renderHud()
    card.querySelector<HTMLButtonElement>('.pxbtn')?.focus({ preventScroll: true })
  }

  const play = () => {
    people = npcs()
    you.x = START.x
    you.y = START.y
    you.path = []
    you.facing = 1
    carrying = false
    fed = 0
    minutes = 23 * 60
    golden = false
    clockOn = false
    pending = null
    floats = []
    sparks = []
    queue = []
    dialog.hidden = true
    card.innerHTML = ''
    state = 'play'
    hint.innerHTML =
      lang === 'tr'
        ? 'Saat 23:00. Demolar gece yarısı. Pizza tezgahta — <b>8 inşacının hepsini besle</b>.'
        : 'It’s 23:00. Demos at midnight. Pizza’s on the counter — <b>feed all 8 builders</b>.'
    renderHud()
  }

  // The clock only starts once you actually do something.
  const wake = () => {
    if (clockOn || state !== 'play') return
    clockOn = true
    hint.innerHTML = ''
    renderHud()
  }

  card.addEventListener('click', (e) => {
    const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act
    if (act === 'play') play()
    else if (act === 'exit') opts.onExit()
    else if (act === 'join') opts.onExit()
  })

  // ── interaction ──
  const nearCounter = () => you.x > COUNTER.x - 6 && you.x < COUNTER.x + COUNTER.w + 6 && you.y > COUNTER.y + COUNTER.h && you.y < COUNTER.y + COUNTER.h + 18
  const nearestNpc = (range = 18) => {
    let best: Npc | null = null
    let bd = range
    for (const p of people) {
      const d = Math.hypot(p.x - you.x, p.y - you.y)
      if (d < bd) {
        bd = d
        best = p
      }
    }
    return best
  }

  const takeSlice = () => {
    if (carrying)
      return say([
        { name: 'Pizza', text: lang === 'tr' ? 'Bir seferde bir dilim. Ev kuralı.' : 'One slice at a time. House rules.', color: PALETTE.peach },
      ])
    carrying = true
    renderHud()
    floats.push({ x: you.x, y: you.y - 20, t: 0, text: '+slice', color: PALETTE.yolk })
  }

  const talkTo = (p: Npc) => {
    p.path = []
    p.moving = false
    p.facing = you.x < p.x ? -1 : 1
    you.facing = p.x < you.x ? -1 : 1
    const head = { name: p.name, color: p.body }
    if (p.hungry && carrying) {
      p.hungry = false
      carrying = false
      fed++
      renderHud()
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2
        sparks.push({ x: p.x, y: p.y - 10, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40 - 30, t: 0, c: [PALETTE.yolk, PALETTE.pink, PALETTE.mint, PALETTE.cream][i % 4] })
      }
      floats.push({ x: p.x, y: p.y - 22, t: 0, text: `${p.project}!`, color: PALETTE.mint })
      say([{ ...head, text: p.thanks }], fed === 8 ? () => endCard(true) : undefined)
    } else if (p.hungry) {
      say([{ ...head, text: p.ask[Math.floor(Math.random() * p.ask.length)] }])
    } else {
      say([{ ...head, text: CHATTER[Math.floor(Math.random() * CHATTER.length)] }])
    }
  }

  const interact = () => {
    if (state !== 'play') return
    wake()
    if (advance()) return
    const p = nearestNpc()
    if (p) return talkTo(p)
    if (nearCounter()) return takeSlice()
  }

  // ── input ──
  const onKey = (e: KeyboardEvent) => {
    if (!running || !capturing) return
    const k = e.key.toLowerCase()
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      e.preventDefault()
      if (e.type === 'keydown') {
        wake()
        keys.add(k)
        you.path = []
        pending = null
      } else keys.delete(k)
      return
    }
    if (e.type !== 'keydown') return
    if (k === 'e' || k === ' ' || k === 'enter') {
      // focused buttons (start, talk, exit…) handle their own Enter/Space
      if ((k === 'enter' || k === ' ') && document.activeElement instanceof HTMLButtonElement) return
      e.preventDefault()
      interact()
    }
  }

  const toGame = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    return [camX + ((e.clientX - r.left) / r.width) * VW, ((e.clientY - r.top) / r.height) * H] as const
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (state !== 'play') return
    wake()
    if (advance()) return
    const [gx, gy] = toGame(e)
    const hit = people.find((p) => gx > p.x - 8 && gx < p.x + 8 && gy > p.y - 18 && gy < p.y + 2)
    if (hit) {
      if (Math.hypot(hit.x - you.x, hit.y - you.y) < 20) return talkTo(hit)
      pending = { kind: 'npc', npc: hit }
      you.path = findPath(you.x, you.y, hit.x, hit.y + 6)
      return
    }
    const c = COUNTER
    if (gx > c.x && gx < c.x + c.w && gy > c.y - 14 && gy < c.y + c.h + 4) {
      if (nearCounter()) return takeSlice()
      pending = { kind: 'counter' }
      you.path = findPath(you.x, you.y, Math.max(c.x + 4, Math.min(c.x + c.w - 4, gx)), c.y + c.h + 8)
      return
    }
    pending = null
    you.path = findPath(you.x, you.y, gx, gy)
  })
  dialog.addEventListener('click', () => advance())

  // ── simulation ──
  const followPath = (a: Actor, speed: number, dt: number) => {
    const wp = a.path[0]
    if (!wp) {
      a.moving = false
      return true
    }
    const dx = wp[0] - a.x
    const dy = wp[1] - a.y
    const d = Math.hypot(dx, dy)
    const s = speed * dt
    if (d <= s) {
      a.x = wp[0]
      a.y = wp[1]
      a.path.shift()
    } else {
      a.x += (dx / d) * s
      a.y += (dy / d) * s
    }
    if (Math.abs(dx) > 0.5) a.facing = dx < 0 ? -1 : 1
    a.moving = true
    return a.path.length === 0
  }

  const step = (dt: number) => {
    planeX = (planeX + dt * 5) % 100
    for (const f of floats) f.t += dt
    floats = floats.filter((f) => f.t < 1.2)
    for (const s of sparks) {
      s.t += dt
      s.vy += 90 * dt
      s.x += s.vx * dt
      s.y += s.vy * dt
    }
    sparks = sparks.filter((s) => s.t < 0.8)
    if (state !== 'play') return

    // typewriter
    if (!dialog.hidden) {
      if (typing < typed.length) {
        typing = Math.min(typed.length, typing + dt * 55)
        dialogText.textContent = typed.slice(0, Math.floor(typing))
      }
      return // the world waits while you chat
    }

    // phones see less of the room at once, so they get a gentler clock
    if (clockOn) minutes += dt * (VW < W ? MIN_PER_SEC * 0.7 : MIN_PER_SEC)
    if (minutes >= 24 * 60) {
      minutes = 24 * 60
      return endCard(false)
    }

    // player
    let mx = 0
    let my = 0
    if (keys.has('arrowleft') || keys.has('a')) mx -= 1
    if (keys.has('arrowright') || keys.has('d')) mx += 1
    if (keys.has('arrowup') || keys.has('w')) my -= 1
    if (keys.has('arrowdown') || keys.has('s')) my += 1
    if (mx || my) {
      const len = Math.hypot(mx, my)
      const sp = 70 * dt
      const nx = you.x + (mx / len) * sp
      const ny = you.y + (my / len) * sp
      if (freeFeet(nx, you.y)) you.x = nx
      if (freeFeet(you.x, ny)) you.y = ny
      if (mx) you.facing = mx < 0 ? -1 : 1
      you.moving = true
    } else if (you.path.length) {
      if (followPath(you, 72, dt) && pending) {
        const p = pending
        pending = null
        if (p.kind === 'npc' && Math.hypot(p.npc.x - you.x, p.npc.y - you.y) < 26) talkTo(p.npc)
        else if (p.kind === 'counter' && nearCounter()) takeSlice()
      }
    } else you.moving = false
    you.anim += dt

    // golden egg
    if (!golden && Math.hypot(you.x - GOLDEN.x, you.y - GOLDEN.y) < 12) {
      golden = true
      renderHud()
      say([
        {
          name: '★',
          text:
            lang === 'tr'
              ? 'Bitkinin arkasındaki altın yumurtayı buldun. Pazar günü kesinlikle gelmelisin.'
              : 'You found the golden egg behind the plant. You should definitely come on Sunday.',
          color: PALETTE.yolk,
        },
      ])
    }

    // npcs wander a little, then go back to their seat
    for (const p of people) {
      p.anim += dt
      p.bob += dt
      if (p.path.length) {
        if (followPath(p, 34, dt) && (p.x !== p.seat[0] || p.y !== p.seat[1])) {
          p.wanderIn = 1.5 + Math.random() * 2
        }
        continue
      }
      p.moving = false
      p.wanderIn -= dt
      if (p.wanderIn <= 0) {
        const home = p.x === p.seat[0] && p.y === p.seat[1]
        if (home && Math.random() < 0.45) {
          const tx = p.seat[0] + (Math.random() - 0.5) * 90
          const ty = p.seat[1] + (Math.random() - 0.5) * 50
          p.path = findPath(p.x, p.y, tx, ty).slice(0, 10)
        } else if (!home) {
          p.path = findPath(p.x, p.y, p.seat[0], p.seat[1])
          p.path.push([p.seat[0], p.seat[1]])
        }
        p.wanderIn = 5 + Math.random() * 9
      }
    }
  }

  // ── drawing ──
  const draw = (t: number) => {
    const target = Math.max(0, Math.min(W - VW, you.x - VW / 2))
    camX = VW === W ? 0 : camX + (target - camX) * 0.12
    ctx.setTransform(1, 0, 0, 1, -Math.round(camX), 0)
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(bg, 0, 0)
    // a plane's lights crossing the right window, very slowly
    ctx.save()
    ctx.beginPath()
    ctx.rect(242, 6, 66, 26)
    ctx.clip()
    const fx = 242 + 74 - planeX
    const blink = Math.floor(t / 500) % 2
    pix(ctx, fx, 11, '#fff3d6')
    if (blink) pix(ctx, fx + 2, 11, PALETTE.tomato)
    ctx.restore()

    // golden egg glint (only when close-ish)
    if (!golden && state === 'play' && Math.hypot(you.x - GOLDEN.x, you.y - GOLDEN.y) < 60 && Math.floor(t / 300) % 3 === 0) {
      pix(ctx, GOLDEN.x - 2, GOLDEN.y - 4, PALETTE.yolk, 1, 1)
      pix(ctx, GOLDEN.x - 3, GOLDEN.y - 5, '#fff', 1, 1)
    }

    const actors: Actor[] = state === 'title' ? [] : [...people, you]
    actors.sort((a, b) => a.y - b.y).forEach((a) => drawEgg(ctx, a))

    // slice in hand
    if (carrying && state === 'play') drawSlice(ctx, Math.round(you.x) + (you.facing === 1 ? 4 : -11), Math.round(you.y) - 11)

    ctx.drawImage(light, 0, 0)
    // warm glow on the counter and neon
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = `rgba(255,140,60,${0.05 + Math.sin(t / 700) * 0.01})`
    ctx.fillRect(COUNTER.x - 4, COUNTER.y - 4, COUNTER.w + 8, COUNTER.h + 10)
    ctx.fillStyle = 'rgba(242,126,166,0.08)'
    ctx.fillRect(176, 8, 60, 17)
    ctx.globalCompositeOperation = 'source-over'

    if (state === 'play') {
      // hunger bubbles
      for (const p of people) {
        if (!p.hungry) continue
        const by = Math.round(p.y - 30 + Math.sin(p.bob * (carrying ? 7 : 3)) * (carrying ? 2 : 1))
        const bx = Math.round(p.x - 6)
        pix(ctx, bx, by, DARK, 13, 11)
        pix(ctx, bx + 1, by + 1, PALETTE.cream, 11, 9)
        pix(ctx, bx + 5, by + 11, DARK, 3, 1)
        pix(ctx, bx + 6, by + 12, DARK, 1, 1)
        drawSlice(ctx, bx + 3, by + 2)
      }
      // prompt
      const n = dialog.hidden ? nearestNpc() : null
      const showCounter = dialog.hidden && !n && nearCounter() && !carrying
      if (n || showCounter) {
        const px = n ? n.x : you.x
        const py = n ? n.y - (n.hungry ? 40 : 28) : COUNTER.y - 4
        const blink = Math.floor(t / 400) % 2
        pix(ctx, px - 1, py - 6 + blink, PALETTE.yolk, 2, 4)
        pix(ctx, px - 1, py - 1 + blink, PALETTE.yolk, 2, 1)
      }
    }

    // on narrow screens, point at things that are out of view
    if (state === 'play' && VW < W) {
      const left = camX
      const right = camX + VW
      const marker = (tx: number, ty: number, color: string) => {
        if (tx > left + 6 && tx < right - 6) return
        const onLeft = tx <= left + 6
        const ex = Math.round(onLeft ? left + 3 : right - 7)
        const ey = Math.round(Math.max(48, Math.min(H - 20, ty)))
        const pulse = Math.floor(t / 300) % 2
        for (let i = 0; i < 4; i++) {
          const x = onLeft ? ex + i : ex + 3 - i
          pix(ctx, x + (onLeft ? -pulse : pulse), ey - i, color, 1, i * 2 + 1)
        }
      }
      if (carrying) people.filter((p) => p.hungry).forEach((p) => marker(p.x, p.y - 8, PALETTE.yolk))
      else marker(COUNTER.x + COUNTER.w / 2, COUNTER.y + 8, PALETTE.peach)
    }

    for (const s of sparks) pix(ctx, s.x, s.y, s.c, 2, 2)
    ctx.font = '8px Silkscreen, monospace'
    ctx.textAlign = 'center'
    for (const f of floats) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.2)
      ctx.fillStyle = DARK
      ctx.fillText(f.text, Math.round(f.x) + 1, Math.round(f.y - f.t * 14) + 1)
      ctx.fillStyle = f.color
      ctx.fillText(f.text, Math.round(f.x), Math.round(f.y - f.t * 14))
    }
    ctx.globalAlpha = 1

    if (state === 'title') {
      // a little parade on the title screen
      ctx.fillStyle = 'rgba(13,7,16,.25)'
      ctx.fillRect(0, 0, W, H)
    }
  }

  const loop = (t: number) => {
    if (!running) return
    const dt = Math.min(0.05, (t - last) / 1000)
    last = t
    step(dt)
    renderHudTick()
    draw(t)
    raf = requestAnimationFrame(loop)
  }
  let hudMinute = -1
  const renderHudTick = () => {
    const m = Math.floor(minutes)
    if (state === 'play' && m !== hudMinute) {
      hudMinute = m
      renderHud()
    }
  }

  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__night = () => ({ state, people, you, carrying, fed, minutes, dialogOpen: !dialog.hidden, camX, VW })
  }

  let capturing = false
  const run = () => {
    if (state === 'title') play()
    if (running) return
    running = true
    last = performance.now()
    raf = requestAnimationFrame(loop)
  }

  return {
    preview: run,
    start() {
      run()
      if (capturing) return
      capturing = true
      addEventListener('keydown', onKey)
      addEventListener('keyup', onKey)
    },
    release() {
      if (!capturing) return
      capturing = false
      keys.clear()
      removeEventListener('keydown', onKey)
      removeEventListener('keyup', onKey)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
      this.release()
    },
    talk: interact,
    restart: play,
  }
}

function safeGet(k: string) {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
function safeSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* ignore */
  }
}
