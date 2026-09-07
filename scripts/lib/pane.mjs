/**
 * Moldura e barra de título de um painel de terminal.
 *
 * Estava duplicado entre a Seção 1 e a Seção 4, e com um erro de geometria: o
 * chrome era desenhado de 0 a W, cobrindo o traço lateral do corpo. O corpo
 * ficava com borda visível nas laterais e o header não, e o olho lê isso como
 * "o header é mais estreito que o corpo".
 *
 * Aqui o chrome **recua pela largura do traço**, então a moldura emoldura o
 * painel inteiro — header incluso — e as duas partes têm exatamente a mesma
 * largura pintada.
 */
import { T } from './constants/theme.mjs'
import { TYPO, CELL_W } from './constants/typography.mjs'
import { GEO } from './constants/geometry.mjs'
import { tag, text } from './svg.mjs'

/** O corpo: fundo e moldura, com o traço centrado na borda do canvas. */
export const paneFrame = (w, h, rx = GEO.PANE.RX) => {
  const s = GEO.PANE.STROKE
  return tag('rect', {
    x: s / 2, y: s / 2, width: w - s, height: h - s, rx,
    fill: T.pane, stroke: T.border, 'stroke-width': s,
  })
}

/**
 * A barra de título: semáforos e o endereço do agente.
 *
 * Recuada em STROKE de cada lado e no topo, para não comer a moldura. O raio
 * também encolhe pelo traço, senão as curvas do chrome e do corpo ficariam
 * concêntricas com raios iguais e desalinhariam meio pixel.
 */
export function paneChrome(w, title, hue) {
  const s = GEO.PANE.STROKE
  const r = GEO.PANE.RX - s
  const ch = GEO.PANE.CHROME_H
  const { DOT } = GEO

  const barra = tag('path', {
    d: `M${s} ${s + r}a${r} ${r} 0 0 1 ${r} -${r}h${w - s * 2 - r * 2}` +
       `a${r} ${r} 0 0 1 ${r} ${r}v${ch - s - r}H${s}Z`,
    fill: T.chrome,
  })
  const dots = DOT.CX.map((cx, n) => tag('circle', {
    cx, cy: DOT.CY, r: DOT.R, fill: [T.dotRed, T.dotYellow, T.dotGreen][n],
  })).join('')
  const rotulo = text(GEO.colX(DOT.CX[2] / CELL_W + 1),
    DOT.CY + TYPO.BASELINE_NUDGE, hue, title)

  return barra + dots + rotulo
}
