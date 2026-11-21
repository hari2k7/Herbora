/**
 * POST /api/contact — Vercel server function.
 *
 * Receives { name, phone, message } from the website's message popup and forwards it
 * to the shop's WhatsApp through CallMeBot. The shop number and API key live only in
 * environment variables on the server, so visitors never see them.
 *
 * Required environment variables (Vercel → Project → Settings → Environment Variables):
 *   WHATSAPP_PHONE    shop number with country code, e.g. 919876543210
 *   CALLMEBOT_APIKEY  the key CallMeBot sends you after you activate it
 * Optional:
 *   CONTACT_DRY_RUN=1 log messages instead of sending (used by the local dev server)
 */

// read env without depending on Node type definitions (works in Vercel and in the dev server)
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env

const LIMITS = { name: 60, phone: 16, message: 1000 }

// best-effort rate limit per IP (resets whenever the function instance restarts)
const hits = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

function cleanPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(digits) ? digits : null
}

export async function POST(request: Request) {
  let data: Record<string, unknown>
  try {
    data = await request.json()
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400)
  }

  // hidden "website" field: real visitors leave it empty, simple bots fill it in
  if (typeof data.website === 'string' && data.website.trim()) return json({ ok: true })

  const name = typeof data.name === 'string' ? data.name.trim() : ''
  const message = typeof data.message === 'string' ? data.message.trim() : ''
  const phone = typeof data.phone === 'string' ? cleanPhone(data.phone) : null

  if (!name || name.length > LIMITS.name) return json({ ok: false, field: 'name', error: 'Please enter your name.' }, 400)
  if (!phone) return json({ ok: false, field: 'phone', error: 'Please enter a valid 10-digit mobile number.' }, 400)
  if (!message || message.length > LIMITS.message) return json({ ok: false, field: 'message', error: 'Please write a message.' }, 400)

  const ip = (request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return json({ ok: false, error: 'Too many messages. Please try again in a few minutes.' }, 429)
  recent.push(now)
  hits.set(ip, recent)

  const text = `New Herbora enquiry\n\nName: ${name}\nPhone: ${phone}\n\n${message}`

  const shop = env.WHATSAPP_PHONE
  const apikey = env.CALLMEBOT_APIKEY
  if (!shop || !apikey) {
    if (env.CONTACT_DRY_RUN === '1') {
      console.log('[contact] dry run — would send to WhatsApp:\n' + text)
      return json({ ok: true, dryRun: true })
    }
    console.error('[contact] WHATSAPP_PHONE or CALLMEBOT_APIKEY is not set')
    return json({ ok: false, error: 'Messaging is not set up yet. Please try again later.' }, 503)
  }

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(shop)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const body = await res.text()
    if (!res.ok || /error|invalid|not\s+active/i.test(body.replace(/<[^>]*>/g, ' ').slice(0, 600))) {
      console.error('[contact] CallMeBot rejected the message', res.status, body.slice(0, 300))
      return json({ ok: false, error: 'We couldn’t send your message right now. Please try again shortly.' }, 502)
    }
    return json({ ok: true })
  } catch (err) {
    console.error('[contact] CallMeBot request failed', err)
    return json({ ok: false, error: 'We couldn’t send your message right now. Please try again shortly.' }, 502)
  }
}

export function GET() {
  return json({ ok: false, error: 'Use POST.' }, 405)
}
