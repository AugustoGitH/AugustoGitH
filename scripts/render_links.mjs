/**
 * Desenha o fecho da página (assets/contact-prompt.svg).
 *
 * Um terminal só, largura inteira, listando os endereços e devolvendo o prompt
 * a quem está lendo. A Seção 1 abre com quatro agentes se apresentando e o
 * liaison encerrando o ciclo com "restarting scout"; aqui o mesmo liaison
 * reaparece no fim da página — e para de falar.
 *
 * Não há dado a codificar: um endereço é um endereço. Diferente das Seções 2 e
 * 3, esta seção apresenta, não mede — e por isso não exibe número nenhum. A
 * verificação dos endereços existe, mas mora no coletor (§7.4), não no desenho.
 *
 * Uso:
 *   node scripts/render_links.mjs
 *   STATIC=1 node scripts/render_links.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import {
  T, TYPO, CELL_W, GEO, KEYTIME_DECIMALS,
  CONTACT, LINKS_PANE as P, LINKS_CANVAS, LINKS_TIME,
} from './lib/constants/index.mjs'
import { assertWidth, assertBudget } from './lib/assert.mjs'
import { tag, text, animate } from './lib/svg.mjs'

const IN = 'data/profile.json'
const OUT = 'assets/contact-prompt.svg'
const STATIC = process.env.STATIC === '1'

const main = () => {
  const { user } = JSON.parse(readFileSync(IN, 'utf8'))
  const linhas = [
    ['portfolio', user.blog],
    ['linkedin', CONTACT.linkedin],
    ['github', `github.com/${user.login}`],
    ['email', CONTACT.email],
  ]
  const maxCols = Math.floor((P.W - P.PAD * 2) / CELL_W)
  for (const [k, v] of linhas) assertWidth(`${k}  ${v}`, 'links', maxCols)

  const promptY = P.FIRST_Y + P.ROW_H * (linhas.length - 1) + P.PROMPT_GAP
  const fimLinhas = LINKS_TIME.LEAD + (linhas.length - 1) * LINKS_TIME.STEP + LINKS_TIME.DUR
  const promptAt = fimLinhas + LINKS_TIME.PROMPT_GAP
  const total = +(promptAt + LINKS_TIME.DUR).toFixed(2)
  const kk = (s) => (s / total).toFixed(KEYTIME_DECIMALS)

  /** Linha revelada por clip, como na Seção 1 — é o mesmo terminal. */
  const revela = (conteudo, y, at, largura) => {
    if (STATIC) return conteudo
    const id = `l${Math.round(y)}`
    return tag('clipPath', { id }, tag('rect', {
      x: P.PAD, y: y - TYPO.SIZE.body, width: largura, height: TYPO.LINE_H,
    }, animate({
      attr: 'width', values: `0;0;${largura};${largura}`,
      keyTimes: `0;${kk(at)};${kk(at + LINKS_TIME.DUR)};1`,
      dur: total, where: `linha/${y}`, repeat: false,
    }))) + tag('g', { 'clip-path': `url(#${id})` }, conteudo)
  }

  const util = P.W - P.PAD * 2
  const cmd = revela(text(P.PAD, P.CMD_Y, T.ink, '$ connect --list'), P.CMD_Y,
    LINKS_TIME.CMD_AT, util)

  const enderecos = linhas.map(([k, v], i) => {
    const y = P.FIRST_Y + i * P.ROW_H
    return revela(
      text(P.LABEL_X, y, T.dim, k) + text(P.VALUE_X, y, T.ink, v),
      y, LINKS_TIME.LEAD + i * LINKS_TIME.STEP, util)
  }).join('')

  // O cursor pisca para sempre: a página termina, o convite não.
  const cursorX = P.PAD + CELL_W * (P.PROMPT.length + 1)
  const cursor = tag('g', { opacity: 1 },
    (STATIC ? '' : animate({
      attr: 'opacity', values: '0;0;1;1',
      keyTimes: `0;${kk(promptAt)};${kk(promptAt + LINKS_TIME.DUR)};1`,
      dur: total, where: 'cursor/entrada', repeat: false,
    })) +
    tag('rect', { x: cursorX, y: promptY - TYPO.SIZE.body + 1,
      width: CELL_W, height: TYPO.SIZE.body + 1, fill: P.HUE },
      STATIC ? '' : tag('animate', {
        attributeName: 'opacity', values: '1;1;0;0;1',
        keyTimes: '0;0.49;0.50;0.99;1',
        dur: `${LINKS_TIME.CURSOR_BLINK}s`, begin: '0s', repeatCount: 'indefinite',
      })))

  const prompt = revela(text(P.PAD, promptY, P.HUE, P.PROMPT), promptY, promptAt, util) + cursor

  const dots = GEO.DOT.CX.map((cx, n) => tag('circle', {
    cx, cy: GEO.DOT.CY, r: GEO.DOT.R, fill: [T.dotRed, T.dotYellow, T.dotGreen][n],
  })).join('')
  const chrome =
    tag('path', {
      d: `M0 ${P.RX}a${P.RX} ${P.RX} 0 0 1 ${P.RX} -${P.RX}h${P.W - P.RX * 2}` +
         `a${P.RX} ${P.RX} 0 0 1 ${P.RX} ${P.RX}v${P.CHROME_H - P.RX}H0Z`,
      fill: T.chrome,
    }) + dots +
    text(GEO.colX(GEO.DOT.CX[2] / CELL_W + 1), GEO.DOT.CY + TYPO.BASELINE_NUDGE, P.HUE, P.TITLE)

  const H = LINKS_CANVAS.H
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${P.W}" height="${H}" ` +
    `viewBox="0 0 ${P.W} ${H}" role="img" ` +
    `aria-label="$ connect --list — ${linhas.map(([k, v]) => `${k}: ${v}`).join(', ')}.">`,
    `<style>text{font-family:${TYPO.STACK};font-size:${TYPO.SIZE.body}px}</style>`,
    tag('rect', { x: 0, y: 0, width: P.W, height: H, fill: T.bg }),
    tag('rect', { x: GEO.HAIRLINE, y: GEO.HAIRLINE,
      width: P.W - GEO.HAIRLINE * 2, height: H - GEO.HAIRLINE * 2, rx: P.RX,
      fill: T.pane, stroke: T.border }),
    chrome, cmd, enderecos, prompt,
    '</svg>',
  ].join('\n')

  mkdirSync('assets', { recursive: true })
  const { bytes, animates } = assertBudget(svg)
  writeFileSync(OUT, svg + '\n', 'utf8')
  console.log(`-> ${linhas.length} endereços | ${P.W}x${H} | revela em ${total}s e congela`)
  console.log(`-> ${bytes} bytes, ${animates} animações`)
  console.log(`-> gravado ${OUT}${STATIC ? ' (estático)' : ''}`)
}

try { main() } catch (e) { console.error('!', e.message); process.exit(1) }
