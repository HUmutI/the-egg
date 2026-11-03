import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Small files are inlined into whatever imports them; a font inlined into the stylesheet
    // would be downloaded with it, before first paint, whether the page uses it or not (the
    // arcade's Silkscreen is under 4 KB). Fonts stay files, fetched only when used.
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
  },
})
