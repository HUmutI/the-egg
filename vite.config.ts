import { defineConfig, type Plugin } from 'vite'

/**
 * The built page without its notes: index.html's comments and the indentation at
 * the start of each line go (scripts and styles are left exactly as written).
 * Nothing on the page sets `white-space: pre`, so a line break and its indent
 * collapse to the same single space they did before. Brings the document under
 * the first round trip's ~14.6 KB (TCP's initial window) once compressed.
 */
function tidyHtml(): Plugin {
  return {
    name: 'egg:tidy-html',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const kept: string[] = []
        return html
          .replace(/<(script|style|pre|textarea)\b[\s\S]*?<\/\1>/gi, (m) => `\u0000${kept.push(m) - 1}\u0000`)
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/\n[ \t\r\n]+/g, '\n')
          .replace(/\u0000(\d+)\u0000/g, (_, i: string) => kept[+i])
      },
    },
  }
}

export default defineConfig({
  plugins: [tidyHtml()],
  build: {
    // Small files are inlined into whatever imports them; a font inlined into the stylesheet
    // would be downloaded with it, before first paint, whether the page uses it or not (the
    // arcade's Silkscreen is under 4 KB). Fonts stay files, fetched only when used.
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
  },
})
