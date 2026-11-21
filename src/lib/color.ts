const toRgb = (hex: string) => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')

export const mix = (a: string, b: string, t: number) => {
  const A = toRgb(a)
  const B = toRgb(b)
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t)
}

export const lighten = (c: string, t: number) => mix(c, '#ffffff', t)
export const darken = (c: string, t: number) => mix(c, '#000000', t)

export const rgba = (hex: string, a: number) => {
  const [r, g, b] = toRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}
