/** Helpers puros de SVG. Sem estado, sem I/O, sem constante literal. */
import { assertKeyframes } from './assert.mjs'
import { GEO } from './constants/geometry.mjs'

export const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const attrs = (o) => Object.entries(o)
  .filter(([, v]) => v !== undefined && v !== null)
  .map(([k, v]) => `${k}="${typeof v === 'number' ? +v.toFixed(GEO.COORD_DECIMALS) : v}"`)
  .join(' ')

export const tag = (name, a = {}, children = '') =>
  children === ''
    ? `<${name} ${attrs(a)}/>`
    : `<${name} ${attrs(a)}>${children}</${name}>`

/**
 * <animate> com validação obrigatória.
 *
 * begin é sempre 0s: o atraso mora no keyTimes (spec §0.3). Um begin atrasado
 * exigiria estado base invisível, e o README apareceria vazio sem SMIL.
 */
export function animate({ attr, values, keyTimes, dur, where, repeat = true }) {
  assertKeyframes(values, keyTimes, where)
  return tag('animate', {
    attributeName: attr, values, keyTimes, dur: `${dur}s`, begin: '0s',
    // repeat=false: roda uma vez e congela. Uma narrativa repete; um gráfico
    // que se apaga e redesenha em loop cansa numa página que se lê.
    ...(repeat ? { repeatCount: 'indefinite' } : { fill: 'freeze' }),
  })
}

export const text = (x, y, fill, content, extra = {}) =>
  tag('text', { x, y, fill, 'xml:space': 'preserve', ...extra }, esc(content))
