export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T

export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll(sel)) as T[]

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** The one egg silhouette used everywhere, in a 200×260 box. */
export const EGG_PATH = 'M100 4C150 4 196 92 196 162c0 58-42 94-96 94S4 220 4 162C4 92 50 4 100 4Z'
export const CRACK_POINTS = '0,128 22,112 40,132 62,108 84,134 104,110 126,136 146,112 166,132 186,114 200,124'

export const PALETTE = {
  butter: '#fdf3d7',
  cream: '#fdf8ef',
  yolk: '#f4b52a',
  lav: '#d9d2ec',
  lavDeep: '#6a5bbf',
  mint: '#d0e3d4',
  mintDeep: '#2f7d5c',
  peach: '#f2d4c2',
  peachDeep: '#d9734b',
  pink: '#eed3d6',
  pinkDeep: '#b94c72',
  sky: '#d0e0ea',
  tomato: '#e2432a',
  ink: '#1f1722',
  night: '#221624',
} as const

/** Shared clock state: the day section publishes its own time while pinned. */
export const clockState = {
  dayStart: 0,
  dayEnd: 0,
  dayMinutes: null as number | null,
  onChange: () => {},
}
