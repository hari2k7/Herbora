/**
 * Customer reviews shown on soap-wrapper cards.
 *
 * Make sure each review is the customer's own words, used with their permission.
 * Set `sample: true` on any entry to show a "SAMPLE" stamp on its card.
 */

export interface Review {
  id: string
  name: string
  /** optional; shown under the name when set */
  city?: string
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
    name: 'Hari',
    soapId: 'neem',
    rating: 5,
    text: 'My skin feels so clean and fresh after every bath. The breakouts on my forehead have really calmed down. Will definitely buy again!',
  },
  {
    id: 'r2',
    name: 'Sai',
    soapId: 'sandal',
    rating: 5,
    text: 'Lovely natural fragrance that stays for hours. Feels very cooling in this heat. My whole family uses it now.',
  },
  {
    id: 'r3',
    name: 'Amora',
    soapId: 'aloe',
    rating: 4,
    text: 'Very gentle and doesn’t dry out my skin at all. Good lather for a handmade soap. Lasts longer than I expected too.',
  },
  {
    id: 'r4',
    name: 'Anitra',
    soapId: 'kuppaimeni',
    rating: 5,
    text: 'Reminds me of my grandmother’s home remedies. It helped with the itching on my hands within a week. Simple and honest product.',
  },
  {
    id: 'r5',
    name: 'Sudhan',
    soapId: 'tomato',
    rating: 4,
    text: 'Nice, refreshing soap and my face looks less oily by evening. Packing was neat and delivery was quick.',
  },
]
