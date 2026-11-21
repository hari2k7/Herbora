/**
 * Contact popup settings. The shop's WhatsApp number is NOT here on purpose:
 * messages are posted to /api/contact, and the server function forwards them
 * to WhatsApp using the number stored in its environment variables.
 */

/** Starting text in the message box. */
export const WHATSAPP_MESSAGE =
  'Hi Herbora! I would like to order some of your herbal soaps. Could you please share availability and delivery details?'

export const SOAP_BOX_MESSAGE =
  'Hi Herbora! I would like to build a custom soap box. Could you help me pick the soaps?'

export const CONTACT_ENDPOINT = '/api/contact'

/**
 * Messaging is switched off until spam protection and the CallMeBot key are set up.
 * While false, the popup shows an "under construction" note instead of the form.
 * Set to true to turn the WhatsApp form back on.
 */
export const CONTACT_ENABLED = false

/** Ask the message popup to open, optionally with starting text. */
export const openContact = (message = WHATSAPP_MESSAGE) =>
  window.dispatchEvent(new CustomEvent('herbora:contact', { detail: { message } }))
