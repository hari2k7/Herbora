import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Runs the Vercel server function (api/contact.ts) inside `npm run dev`, so the
 * message popup works locally. Reads secrets from .env.local. Without them it
 * runs in dry-run mode and just prints the message in the terminal.
 */
function devApi(): Plugin {
  return {
    name: 'herbora-dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv('development', process.cwd(), '')
      for (const k of ['WHATSAPP_PHONE', 'CALLMEBOT_APIKEY', 'CONTACT_DRY_RUN']) if (env[k]) process.env[k] = env[k]
      if (!process.env.CALLMEBOT_APIKEY || !process.env.WHATSAPP_PHONE) process.env.CONTACT_DRY_RUN = '1'

      server.middlewares.use('/api/contact', async (req, res) => {
        try {
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const headers = new Headers()
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
          const request = new Request('http://localhost/api/contact', {
            method: req.method,
            headers,
            body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
          })
          const mod = await server.ssrLoadModule('/api/contact.ts')
          const handler = mod[req.method ?? 'GET'] as ((r: Request) => Promise<Response> | Response) | undefined
          const response = handler ? await handler(request) : new Response('Method not allowed', { status: 405 })
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          console.error(err)
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, error: 'Dev server error' }))
        }
      })
    },
  }
}

/**
 * After the production build:
 *  1. pre-render the landing page with React on the server and put the HTML into
 *     dist/index.html, so the hero appears before any JavaScript downloads;
 *  2. inline the main stylesheet (removes a render-blocking request);
 *  3. preload the two brand fonts so the HERBORA title paints in the right font at once.
 */
function prerender(): Plugin {
  let outDir = 'dist'
  let root = process.cwd()
  return {
    name: 'herbora-prerender',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir
      root = c.root
    },
    async closeBundle() {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const { createServer } = await import('vite')
      const dist = path.resolve(root, outDir)
      const file = path.join(dist, 'index.html')
      if (!fs.existsSync(file)) return

      const server = await createServer({
        root,
        configFile: false,
        plugins: [react()],
        logLevel: 'error',
        server: { middlewareMode: true, hmr: false },
        appType: 'custom',
      })
      let appHtml = ''
      try {
        const mod = await server.ssrLoadModule('/src/entry-server.tsx')
        appHtml = (mod.render as () => string)()
      } finally {
        await server.close()
      }

      let html = fs.readFileSync(file, 'utf8')
      html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

      const assets = fs.readdirSync(path.join(dist, 'assets'))
      // the HERBORA title (the largest thing on screen) uses Titan One: embed that small
      // font in the page so the title paints in its final font straight away
      const titan = assets.find((f) => /^titan-one-latin-400-normal-.*\.woff2$/.test(f))

      // inline the main CSS
      html = html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/, (tag, href: string) => {
        let css = fs.readFileSync(path.join(dist, href), 'utf8')
        if (titan) {
          const b64 = fs.readFileSync(path.join(dist, 'assets', titan)).toString('base64')
          css = css.split(`/assets/${titan}`).join(`data:font/woff2;base64,${b64}`)
        }
        return `<style>${css}</style>`
      })

      // preload the remaining brand font (latin woff2)
      const fonts = assets.filter((f) => /^lilita-one-latin-400-normal-.*\.woff2$/.test(f))
      const preload = fonts.map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin>`).join('\n    ')
      html = html.replace('</title>', `</title>\n    ${preload}`)

      fs.writeFileSync(file, html)
      console.log(`[prerender] landing page pre-rendered (${(appHtml.length / 1024).toFixed(1)} kB of HTML), CSS inlined, ${fonts.length} fonts preloaded`)
    },
  }
}

export default defineConfig({
  plugins: [react(), devApi(), prerender()],
})
