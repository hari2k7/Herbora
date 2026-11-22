/**
 * Customer reviews shown on soap-wrapper cards.
 *
 * ⚠️ These are SAMPLE reviews written for the demo, not from real customers.
 * Each card shows a "SAMPLE" stamp while `sample: true`. Replace them with real
 * reviews (with the customer's permission) and remove `sample` before going live.
 */

export interface Review {
  id: string
  name: string
  city: string
  /** id of the soap they used, from data/soaps.ts */
  soapId: string
  /** 1 to 5 leaves */
  rating: number
  text: string
  sample?: boolean
}

export const reviews: Review[] = [
  {
    id: 'r1',
    name: 'Priya S.',
    city: 'Chennai',
    soapId: 'neem',
    rating: 5,
    text: 'My skin feels so clean and fresh after every bath. The breakouts on my forehead have really calmed down. Will definitely buy again!',
    sample: true,
  },
  {
    id: 'r2',
    name: 'Karthik R.',
    city: 'Coimbatore',
    soapId: 'sandal',
    rating: 5,
    text: 'Lovely natural fragrance that stays for hours. Feels very cooling in this heat. My whole family uses it now.',
    sample: true,
  },
  {
    id: 'r3',
    name: 'Divya M.',
    city: 'Bengaluru',
    soapId: 'aloe',
    rating: 4,
    text: 'Very gentle and doesn’t dry out my skin at all. Good lather for a handmade soap. Lasts longer than I expected too.',
    sample: true,
  },
  {
    id: 'r4',
    name: 'Lakshmi V.',
    city: 'Madurai',
    soapId: 'kuppaimeni',
    rating: 5,
    text: 'Reminds me of my grandmother’s home remedies. It helped with the itching on my hands within a week. Simple and honest product.',
    sample: true,
  },
  {
    id: 'r5',
    name: 'Arun K.',
    city: 'Trichy',
    soapId: 'tomato',
    rating: 4,
    text: 'Nice, refreshing soap and my face looks less oily by evening. Packing was neat and delivery was quick.',
    sample: true,
  },
]
