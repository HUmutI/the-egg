export type Lang = 'en' | 'tr'

/**
 * The page is English only: the toggle and the Turkish copy in index.html are gone.
 * The drawn scenes (flock, day, night shift) still carry their Turkish lines keyed
 * on this, so it stays a constant they can read.
 */
export const lang: Lang = 'en'
