export type SoapShape = 'bar' | 'oval' | 'pebble'
export type SoapTexture = 'speckle' | 'flecks' | 'strands' | 'gel' | 'none'

export interface Soap {
  id: string
  name: string
  latin: string
  /** main body colour of the bar */
  color: string
  /** darker shade for sides and text accents */
  deep: string
  /** light page tint while this soap is on stage */
  tint: string
  tagline: string
  description: string
  benefits: string[]
  price: number
  /** selling unit shown after the price */
  unit: string
  shape: SoapShape
  texture: SoapTexture
  textureColor?: string
}

export const soaps: Soap[] = [
  {
    id: 'neem',
    name: 'Neem',
    latin: 'Azadirachta indica',
    color: '#6a9440',
    deep: '#2f5418',
    tint: '#e4ecd3',
    tagline: 'The village pharmacy, pressed into a bar.',
    description:
      'Fresh neem leaf and cold-pressed neem oil, slow-cured for six weeks. A clarifying bar that calms breakouts without stripping your skin.',
    benefits: ['Anti-bacterial', 'Clears acne', 'Oil balance'],
    price: 45,
    unit: 'piece',
    shape: 'bar',
    texture: 'speckle',
    textureColor: '#2f5418',
  },
  {
    id: 'aloe',
    name: 'Aloe Vera',
    latin: 'Aloe barbadensis',
    color: '#9ad7a4',
    deep: '#2f7a45',
    tint: '#e2f2e5',
    tagline: 'A cool drink of water for your skin.',
    description:
      'Fresh aloe vera gel blended into a pure coconut-oil base. Soothes sun-tired skin and leaves a dewy, hydrated finish.',
    benefits: ['Deep hydration', 'Soothes sunburn', 'Dewy glow'],
    price: 45,
    unit: 'piece',
    shape: 'pebble',
    texture: 'speckle',
    textureColor: '#3f8a55',
  },
  {
    id: 'carrot',
    name: 'Carrot',
    latin: 'Daucus carota',
    color: '#ef8a2f',
    deep: '#a14a10',
    tint: '#fbe7d1',
    tagline: 'Beta-carotene, poured like sunshine.',
    description:
      'Pressed fresh carrot juice, rich in vitamin A. Wakes up dull skin and helps it repair overnight.',
    benefits: ['Vitamin A', 'Anti-ageing', 'Even tone'],
    price: 50,
    unit: 'piece',
    shape: 'bar',
    texture: 'speckle',
    textureColor: '#b95a17',
  },
  {
    id: 'beetroot',
    name: 'Beetroot',
    latin: 'Beta vulgaris',
    color: '#a8255a',
    deep: '#5e0f30',
    tint: '#f4dce6',
    tagline: 'Pink from the earth, not from a lab.',
    description:
      'Fresh beetroot gives this bar its natural blush. Packed with antioxidants for a healthy, flushed glow.',
    benefits: ['Antioxidant rich', 'Natural blush', 'Softens skin'],
    price: 50,
    unit: 'piece',
    shape: 'oval',
    texture: 'none',
  },
  {
    id: 'kuppaimeni',
    name: 'Kuppaimeni',
    latin: 'Acalypha indica',
    color: '#4f7f3f',
    deep: '#22431a',
    tint: '#dfe9d8',
    tagline: 'Grandmother’s remedy from the backyard.',
    description:
      'The humble Indian nettle, stone-ground fresh. A traditional bar for itchy, irritated skin and stubborn rashes.',
    benefits: ['Anti-itch', 'Rash relief', 'Gentle cleanse'],
    price: 45,
    unit: 'piece',
    shape: 'bar',
    texture: 'flecks',
    textureColor: '#2a4d1f',
  },
  {
    id: 'tomato',
    name: 'Tomato',
    latin: 'Solanum lycopersicum',
    color: '#e2442f',
    deep: '#8f1f12',
    tint: '#f9dfd9',
    tagline: 'Lycopene for a fresh, tight finish.',
    description:
      'Sun-ripened tomato pulp tightens pores and lifts tan. A zesty, juicy bar made for oily and combination skin.',
    benefits: ['Tan removal', 'Tightens pores', 'Oil control'],
    price: 50,
    unit: 'piece',
    shape: 'oval',
    texture: 'speckle',
    textureColor: '#f7c24a',
  },
  {
    id: 'sandal',
    name: 'Sandal',
    latin: 'Santalum album',
    color: '#d9a96b',
    deep: '#7d4f1a',
    tint: '#f5eadb',
    tagline: 'Temple-cool, ancient and calm.',
    description:
      'Pure sandalwood powder and oil. A cooling, fragrant bar that settles heat rashes and leaves a lingering woody calm.',
    benefits: ['Cooling', 'Woody fragrance', 'Even tone'],
    price: 52,
    unit: 'piece',
    shape: 'pebble',
    texture: 'speckle',
    textureColor: '#9c6c32',
  },
  {
    id: 'javvadhu',
    name: 'Javvadhu',
    latin: 'Heritage aromatic blend',
    color: '#5d3b2a',
    deep: '#2a170d',
    tint: '#ecdfd2',
    tagline: 'The perfume of Tamil temples.',
    description:
      'A heritage blend of javvadhu, sandal and warm spices. Deep, musky and luxurious — a bath that smells like a festival evening.',
    benefits: ['Long-lasting scent', 'Deep cleanse', 'Heritage recipe'],
    price: 55,
    unit: 'piece',
    shape: 'bar',
    texture: 'flecks',
    textureColor: '#e8c26a',
  },
  {
    id: 'whitening',
    name: 'Skin Whitening',
    latin: 'Rice · Potato · Licorice',
    color: '#f3d9c6',
    deep: '#a5653d',
    tint: '#fbf1e9',
    tagline: 'Rice, roots and a little patience.',
    description:
      'Rice powder, potato extract, licorice root (athimathuram) and aloe vera in pure coconut oil gently fade dark spots and even out tone for naturally radiant skin.',
    benefits: ['Fades spots', 'Even tone', 'Radiance'],
    price: 60,
    unit: 'piece',
    shape: 'oval',
    texture: 'speckle',
    textureColor: '#c4a07e',
  },
]
