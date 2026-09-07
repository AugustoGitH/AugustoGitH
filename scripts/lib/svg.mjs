/** Helpers puros de SVG. Sem estado, sem I/O, sem constante literal. */
import { assertKeyframes } from './assert.mjs'
import { GEO } from './constants/geometry.mjs'
import { TYPO } from './constants/typography.mjs'

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

/**
 * Um <text>, com o tamanho SEMPRE como atributo.
 *
 * Atributo de apresentação em SVG tem especificidade zero: qualquer regra CSS
 * ganha dele, inclusive um seletor de tipo. Enquanto a folha de estilo do
 * arquivo declarava `text{font-size:11px}`, todo `font-size="15"` e
 * `font-size="9"` era silenciosamente ignorado — títulos de seção saíam a 11px
 * e endereços transbordavam a placa.
 *
 * Por isso a folha carrega só a família, e o tamanho vem daqui. Se algum dia
 * `font-size` voltar para o <style>, este parâmetro para de funcionar de novo.
 */
export const text = (x, y, fill, content, extra = {}) =>
  tag('text', {
    x, y, fill, 'xml:space': 'preserve',
    'font-size': TYPO.SIZE.body, ...extra,
  }, esc(content))
