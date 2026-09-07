/** Interpolação de rampas de cor. Sem estado, sem I/O. */

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const pad2 = (n) => n.toString(16).padStart(2, '0')

/**
 * Cor da rampa em t (0..1), interpolando linearmente entre paradas adjacentes.
 * Fora do intervalo, satura nas pontas.
 */
export function rampColor(stops, t) {
  const x = Math.min(1, Math.max(0, t))
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i]
    const [b, cb] = stops[i + 1]
    if (x >= a && x <= b) {
      const f = b === a ? 0 : (x - a) / (b - a)
      const A = hex(ca)
      const B = hex(cb)
      return '#' + A.map((v, j) => pad2(Math.round(v + (B[j] - v) * f))).join('')
    }
  }
  return stops[stops.length - 1][1]
}

/** Clareia uma cor em direção ao branco. Usado no friso dos blocos. */
export function lighten(hexColor, amount) {
  const c = hex(hexColor)
  return '#' + c.map((v) => pad2(Math.round(v + (255 - v) * amount))).join('')
}
