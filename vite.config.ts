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

/**
 * The stylesheet inside the page, not beside it. It blocks first paint either way, but as a
 * separate file it costs a whole extra request before anything can draw (on a slow phone
 * link that request's latency is most of the wait). Inlined, the page paints as soon as the
 * document has arrived. Its url()s are absolute (/assets/…), so they resolve the same.
 */
function inlineCss(): Plugin {
  return {
    name: 'egg:inline-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return html
        return html.replace(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g, (tag, file: string) => {
          const asset = bundle[file]
          if (!asset || asset.type !== 'asset') return tag
          const css = typeof asset.source === 'string' ? asset.source : new TextDecoder().decode(asset.source)
          return `<style>${css}</style>`
        })
      },
    },
  }
}

export default defineConfig({
  plugins: [tidyHtml(), inlineCss()],
  build: {
    // Small files are inlined into whatever imports them; a font inlined into the stylesheet
    // would be downloaded with it, before first paint, whether the page uses it or not (the
    // arcade's Silkscreen is under 4 KB). Fonts stay files, fetched only when used.
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
  },
})
