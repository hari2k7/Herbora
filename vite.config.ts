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

export default defineConfig({
  plugins: [react(), devApi()],
})
