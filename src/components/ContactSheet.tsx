import { useEffect, useRef, useState } from 'react'
import { CONTACT_ENABLED, CONTACT_ENDPOINT, WHATSAPP_MESSAGE } from '../data/contact'

/**
 * Message popup. The visitor fills in name, phone and message; "Send on WhatsApp"
 * posts it to our server function, which delivers it to the shop's WhatsApp.
 * The visitor stays on the site and never sees the shop's number.
 * Open it from anywhere with openContact() from data/contact.
 */

type Status = 'idle' | 'sending' | 'sent' | 'error'

const cleanPhone = (raw: string) => raw.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
const validPhone = (raw: string) => /^[6-9]\d{9}$/.test(cleanPhone(raw))

export default function ContactSheet() {
  const dialog = useRef<HTMLDialogElement>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(WHATSAPP_MESSAGE)
  const [website, setWebsite] = useState('') // hidden field that only bots fill in
  const [nameError, setNameError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [messageError, setMessageError] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    const open = (e: Event) => {
      const preset = (e as CustomEvent).detail?.message as string | undefined
      // every opening starts fresh: empty name and phone, default message
      setMessage(preset || WHATSAPP_MESSAGE)
      setName('')
      setPhone('')
      setWebsite('')
      setNameError(false)
      setPhoneError(false)
      setMessageError(false)
      setStatus('idle')
      setServerError('')
      const d = dialog.current
      if (!d || d.open) return
      d.showModal()
      requestAnimationFrame(() => {
        const t = area.current
        if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length) }
      })
    }
    window.addEventListener('herbora:contact', open)
    return () => window.removeEventListener('herbora:contact', open)
  }, [])

  const close = () => dialog.current?.close()

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    // all three fields are mandatory; flag every problem at once
    const badName = !name.trim()
    const badPhone = !validPhone(phone)
    const badText = !message.trim()
    setNameError(badName)
    setPhoneError(badPhone)
    setMessageError(badText)
    if (badName || badPhone || badText) return

    setStatus('sending')
    setServerError('')
    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: cleanPhone(phone), message: message.trim(), website }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; field?: string }
      if (res.ok && data.ok) {
        setStatus('sent')
        return
      }
      if (data.field === 'name') setNameError(true)
      if (data.field === 'phone') setPhoneError(true)
      if (data.field === 'message') setMessageError(true)
      setServerError(data.error || 'We couldn’t send your message right now. Please try again shortly.')
      setStatus('error')
    } catch {
      setServerError('No connection. Please check your internet and try again.')
      setStatus('error')
    }
  }

  const sending = status === 'sending'

  return (
    <dialog
      ref={dialog}
      className="contact-sheet"
      data-lenis-prevent
      aria-labelledby="cs-title"
      onClick={(e) => { if (e.target === dialog.current && !sending) close() }}
    >
      <div className="cs-card">
        <button type="button" className="cs-close" onClick={close} aria-label="Close" disabled={sending}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
        </button>
        <span className="cs-leaf" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="26" height="26"><path d="M5 27C5 13 14 5 28 4c0 14-8 23-23 23z" fill="currentColor" /></svg>
        </span>

        {!CONTACT_ENABLED ? (
          <div className="cs-done cs-soon" role="status">
            <span className="cs-tick cs-tick-soon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="34" height="34">
                <path d="M4 20h16M6 20V10l6-5 6 5v10" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h3 id="cs-title">Coming soon</h3>
            <p className="cs-sub">Our WhatsApp messaging is still under construction. We&rsquo;re putting the finishing touches on it &mdash; please check back shortly.</p>
            <button type="button" className="cs-send" onClick={close}>Okay</button>
          </div>
        ) : status === 'sent' ? (
          <div className="cs-done" role="status">
            <span className="cs-tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="34" height="34"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <h3 id="cs-title">Message sent!</h3>
            <p className="cs-sub">Thank you, {name.trim()}. We&rsquo;ll reply on WhatsApp to {cleanPhone(phone)} soon.</p>
            <button type="button" className="cs-send" onClick={close}>Done</button>
          </div>
        ) : (
          <form className="cs-form" onSubmit={send} noValidate>
            <h3 id="cs-title">Message Herbora</h3>
            <p className="cs-sub">Write to us here and we&rsquo;ll reply to you on WhatsApp.</p>

            {/* honeypot: hidden from people, tempting for bots */}
            <input className="cs-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />

            <div className="cs-row">
              <label className={'cs-field' + (nameError ? ' invalid' : '')}>
                <span>Your name</span>
                <input
                  name="cs-name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(false) }}
                  autoComplete="off"
                  maxLength={60}
                  required
                  disabled={sending}
                  aria-invalid={nameError}
                  aria-describedby={nameError ? 'cs-name-err' : undefined}
                />
                {nameError && <small id="cs-name-err" className="cs-err">Please enter your name.</small>}
              </label>
              <label className={'cs-field' + (phoneError ? ' invalid' : '')}>
                <span>Phone number</span>
                <input
                  name="cs-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneError(false) }}
                  autoComplete="off"
                  maxLength={16}
                  placeholder="10-digit mobile"
                  required
                  disabled={sending}
                  aria-invalid={phoneError}
                  aria-describedby={phoneError ? 'cs-phone-err' : undefined}
                />
                {phoneError && <small id="cs-phone-err" className="cs-err">Please enter a valid 10-digit mobile number.</small>}
              </label>
            </div>
            <label className={'cs-field' + (messageError ? ' invalid' : '')}>
              <span>Message</span>
              <textarea
                ref={area}
                value={message}
                onChange={(e) => { setMessage(e.target.value); setMessageError(false) }}
                rows={5}
                maxLength={1000}
                required
                disabled={sending}
                aria-invalid={messageError}
                aria-describedby={messageError ? 'cs-msg-err' : undefined}
              />
              {messageError && <small id="cs-msg-err" className="cs-err">Please write a message.</small>}
            </label>

            {serverError && <p className="cs-server-err" role="alert">{serverError}</p>}

            <button type="submit" className={'cs-send' + (sending ? ' is-sending' : '')} disabled={sending}>
              {sending ? <span className="cs-spin" aria-hidden="true" /> : (
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 11.5L21 3l-7 18-3-7.5L3 11.5z" fill="currentColor" /></svg>
              )}
              {sending ? 'Sending…' : 'Send on WhatsApp'}
            </button>
          </form>
        )}
      </div>
    </dialog>
  )
}
