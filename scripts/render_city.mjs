/**
 * Desenha a cidade de commits (assets/commit-city.svg).
 *
 * Cada semana é um prédio; a altura é o volume de commits; os andares são os
 * dias, cada bloco colorido pela intensidade daquele dia. Os 365 dias
 * continuam todos presentes — não há agregação, só reorganização.
 *
 * Substitui o snake do Platane/snk, encerrando a última dependência de
 * terceiro que gerava arte neste README.
 *
 * Uso:
 *   node scripts/render_city.mjs
 *   STATIC=1 node scripts/render_city.mjs   # quadro congelado, sem <animate>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import {
  T, CITY_RAMP, TYPO, GEO, MONTHS,
  CITY, cityUsableW, colW, buildingW, pxPerCommit, textW,
} from './lib/constants/index.mjs'
import { assertFits, assertCityHeights, assertBudget } from './lib/assert.mjs'
import { tag, text, animate } from './lib/svg.mjs'
import { rampColor } from './lib/color.mjs'

const IN = 'data/profile.json'
const OUT = 'assets/commit-city.svg'
const STATIC = process.env.STATIC === '1'

const soma = (a) => a.reduce((x, y) => x + y, 0)
const mesAno = (iso) => {
  const d = new Date(iso)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Um prédio: blocos empilhados do chão para cima, domingo na base. */
function predio(w, i, cw, bw, scale, maxDay) {
  const x = CITY.PAD + i * cw
  const parcial = w.days.length < CITY.DAYS_PER_WEEK
  const blocos = []
  let y = CITY.GROUND_Y

  for (const c of w.days) {
    if (c === 0) continue // dia sem commit não desenha; some na costura
    const h = c * scale
    y -= h // a POSIÇÃO vem da altura exata — o topo do prédio nunca desloca
    blocos.push(tag('rect', {
      x, y, width: bw,
      // MIN_BAND transborda no vão acima, nunca na altura do prédio.
      height: Math.max(CITY.MIN_BAND, h - CITY.BAND_GAP),
      fill: rampColor(CITY_RAMP, Math.sqrt(c / maxDay)),
    }))
  }

  // Semana corrente: ainda incompleta. Num gráfico comum é um toco que precisa
  // de nota de rodapé; numa cidade é um prédio em obra.
  const obra = parcial
    ? tag('line', {
        x1: x, y1: y - CITY.PARTIAL_CAP_GAP, x2: x + bw, y2: y - CITY.PARTIAL_CAP_GAP,
        stroke: T.dim, 'stroke-width': 1, 'stroke-dasharray': '2 2',
      })
    : ''

  return tag('g', parcial ? { opacity: CITY.PARTIAL_OPACITY } : {},
    blocos.join('') + obra)
}

const main = () => {
  const { contrib } = JSON.parse(readFileSync(IN, 'utf8'))
  const weeks = contrib.weeks
  console.log(`-> lido ${IN} — ${weeks.length} semanas`)

  const scale = pxPerCommit(contrib.maxWeek)
  const cw = colW(weeks.length)
  const bw = buildingW(weeks.length)
  const usable = cityUsableW()
  assertCityHeights(weeks, scale)

  const totais = weeks.map((w) => soma(w.days))
  const media = soma(totais) / totais.length
  const avgY = CITY.GROUND_Y - media * scale
  const iPico = totais.indexOf(Math.max(...totais))

  // --- status: período à esquerda, densidade à direita ---
  const esq = `${mesAno(contrib.from)} -> ${mesAno(contrib.to)}`
  const pct = Math.round((100 * contrib.activeDays) / contrib.days)
  const dir = `${contrib.total} commits · ${contrib.activeDays}/${contrib.days} ` +
              `days active (${pct}%) · ` +
              `${(contrib.drawn / contrib.activeDays).toFixed(1)} per active day`
  assertFits(textW(esq) + textW(dir) + TYPO.SIZE.body, usable, 'status')

  const cidade = weeks.map((w, i) => predio(w, i, cw, bw, scale, contrib.maxDay)).join('')

  const eixo =
    tag('line', { x1: CITY.PAD, y1: avgY, x2: CITY.PAD + usable, y2: avgY,
                  stroke: T.dim, 'stroke-width': 1, 'stroke-dasharray': CITY.AVG_DASH,
                  opacity: CITY.AVG_OPACITY }) +
    text(CITY.PAD, avgY - CITY.AVG_LABEL_GAP, T.dim, `avg ${Math.round(media)}`) +
    tag('line', { x1: CITY.PAD, y1: CITY.GROUND_Y, x2: CITY.PAD + usable,
                  y2: CITY.GROUND_Y, stroke: T.border, 'stroke-width': 1 })

  const titulo = text(CITY.PAD, CITY.TITLE_Y, T.accent, CITY.TITLE, {
    'font-size': TYPO.SIZE.section,
    'font-weight': TYPO.SECTION_WEIGHT,
    'letter-spacing': TYPO.SECTION_TRACKING,
  })

  // Sem uma âncora numérica, uma skyline mostra forma sem magnitude.
  const pico = text(CITY.PAD + iPico * cw + bw / 2, CITY.PEAK_LABEL_Y, T.ink,
    String(totais[iPico]), { 'text-anchor': 'middle' })

  const meses = [
    [weeks[0], CITY.PAD, 'start'],
    [weeks[Math.floor(weeks.length / 2)], CITY.PAD + usable / 2, 'middle'],
    [weeks.at(-1), CITY.PAD + usable, 'end'],
  ].map(([w, x, anchor]) =>
    text(x, CITY.MONTH_Y, T.muted, mesAno(w.firstDay), { 'text-anchor': anchor })).join('')

  const status =
    text(CITY.PAD, CITY.STATUS_Y, T.muted, esq) +
    text(CITY.PAD + usable, CITY.STATUS_Y, T.muted, dir, { 'text-anchor': 'end' })

  const corpo = cidade + eixo + titulo + pico + meses + status

  // O eixo x já é a linha do tempo, então varrer da esquerda para a direita é o
  // ano passando, não um efeito. Uma <animate> para a seção inteira.
  const conteudo = STATIC ? corpo : tag('clipPath', { id: 'build' }, tag('rect', {
      x: CITY.PAD, y: 0, width: usable, height: CITY.H,
    }, animate({
      attr: 'width', values: `0;${usable}`, keyTimes: '0;1',
      dur: CITY.BUILD_DUR, where: 'build', repeat: false,
    }))) + tag('g', { 'clip-path': 'url(#build)' }, corpo)

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CITY.W}" height="${CITY.H}" ` +
    `viewBox="0 0 ${CITY.W} ${CITY.H}" role="img" ` +
    `aria-label="Skyline das contribuições de ${contrib.from} a ${contrib.to}: ` +
    `${weeks.length} semanas, ${contrib.total} commits, ${contrib.activeDays} de ` +
    `${contrib.days} dias ativos, pico semanal de ${totais[iPico]}.">`,
    // Só a família: o tamanho vem por atributo (ver text() em lib/svg.mjs).
    `<style>text{font-family:${TYPO.STACK}}</style>`,
    tag('rect', { x: 0, y: 0, width: CITY.W, height: CITY.H, fill: T.bg }),
    conteudo,
    '</svg>',
  ].join('\n')

  mkdirSync('assets', { recursive: true })
  const { bytes, animates } = assertBudget(svg)
  writeFileSync(OUT, svg + '\n', 'utf8')
  console.log(`-> pico ${totais[iPico]} na semana ${weeks[iPico].firstDay} | média ${media.toFixed(1)}`)
  console.log(`-> ${bytes} bytes, ${animates} <animate>`)
  console.log(`-> gravado ${OUT}${STATIC ? ' (estático)' : ''}`)
}

try { main() } catch (e) { console.error('!', e.message); process.exit(1) }
