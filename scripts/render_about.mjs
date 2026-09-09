/**
 * Desenha o cartão do blog (assets/about-blog.svg): a sessão de fotos em
 * caracteres, e a legenda embaixo. É a seção de abertura do README.
 *
 * A arte vem pronta de `data/ascii-frames.json`, gerada por prep_ascii.py —
 * local e à mão (§1.1). Aqui não se decodifica imagem nenhuma: o CI é Node
 * puro e só desenha o que já está medido.
 *
 * A arte desce por uma varredura só (um <clipPath> cuja altura abre), como uma
 * imagem decodificando no terminal. Depois o texto digita, com a mesma mecânica
 * de clip da Seção 1 e sem a fase de apagar: escreve uma vez e congela.
 *
 * Uso:
 *   node scripts/render_about.mjs
 *   STATIC=1 node scripts/render_about.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import {
  T, TYPO, CELL_W, KEYTIME_DECIMALS, CURSOR_DUTY,
  ASCII, ABOUT_PANE as P, aboutLayout, ABOUT_TIME as ATIME,
} from './lib/constants/index.mjs'
import { assertWidth, assertAsciiGrid, assertBudget } from './lib/assert.mjs'
import { tag, text, animate } from './lib/svg.mjs'
import { paneFrame, paneChrome } from './lib/pane.mjs'

const OUT = 'assets/about-blog.svg'
const STATIC = process.env.STATIC === '1'

const svgOpen = (w, h, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
  `viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">\n` +
  // Só a família: o tamanho vem por atributo (ver text() em lib/svg.mjs).
    `<style>text{font-family:${TYPO.STACK}}</style>`

/** Une os três quadros numa linha só por fileira, com a calha entre eles. */
function montagem(dados) {
  const sep = ' '.repeat(ASCII.GUTTER)
  const quadros = ASCII.ORDER.map(({ id }) => {
    const arte = dados.frames[id]
    if (!arte) throw new Error(`${ASCII.SRC}: quadro "${id}" não existe`)
    return assertAsciiGrid(arte, dados.cols, `arte/${id}`)
  })
  return Array.from({ length: dados.rows },
    (_, y) => quadros.map((q) => q[y]).join(sep))
}

function cartao(dados) {
  const linhasArte = montagem(dados)
  const L = aboutLayout(linhasArte.length)

  const util = Math.floor((P.W - P.PAD * 2) / CELL_W) - 1
  assertWidth(P.CMD, 'sobre/comando', util)
  assertWidth(P.CMD2, 'sobre/comando-2', util)
  const boxUtil = Math.floor((P.W - P.PAD * 2 - P.BOX_PAD * 2) / CELL_W) - 1
  P.LINES.forEach((linha, i) => assertWidth(linha, `sobre/linha-${i}`, boxUtil))

  // As linhas de TEXTO que digitam, na ordem: os dois comandos e a caixa.
  // Cada uma carrega o próprio cursor (revela() abaixo) — igual à Seção 1.
  const rows = [{
    text: P.CMD, x: P.PAD, y: P.CMD_Y, fill: T.ink, at: ATIME.CMD_AT,
  }]
  rows.push({
    text: P.CMD2, x: P.PAD, y: L.cmd2Y, fill: T.ink,
    at: rows[0].at + ATIME.DUR + ATIME.ART_GAP + ATIME.ART_DUR + ATIME.CMD2_GAP,
  })
  P.LINES.forEach((linha, i) => {
    const prev = rows[rows.length - 1]
    const gap = i === 0 ? ATIME.BOX_GAP : ATIME.STEP
    rows.push({
      text: linha,
      x: P.PAD + P.BOX_PAD,
      y: L.boxY + P.BOX_PAD + TYPO.SIZE.body + i * TYPO.LINE_H,
      fill: i === P.LINES.length - 1 ? T.accent : T.ink,
      at: prev.at + ATIME.DUR + gap,
    })
  })

  const last = rows[rows.length - 1]
  const total = +(last.at + ATIME.DUR + ATIME.TRAIL_PAD).toFixed(KEYTIME_DECIMALS)
  const kk = (s) => (s / total).toFixed(KEYTIME_DECIMALS)

  /** Uma linha revelada por um clip que abre da esquerda para a direita. */
  const digita = (row, idx) => {
    const w = (row.text.length * CELL_W).toFixed(2)
    const body = text(row.x, row.y, row.fill, row.text)
    if (STATIC) return body
    const id = `t${idx}`
    return tag('clipPath', { id }, tag('rect', {
      x: row.x, y: row.y - TYPO.SIZE.body, width: w, height: TYPO.LINE_H,
    }, animate({
      attr: 'width', values: `0;0;${w};${w}`,
      keyTimes: `0;${kk(row.at)};${kk(row.at + ATIME.DUR)};1`,
      dur: total, where: `sobre/texto-${idx}`, repeat: false,
    }))) + tag('g', { 'clip-path': `url(#${id})` }, body)
  }

  /**
   * O cursor que acompanha CADA linha enquanto ela digita — igual ao
   * revealRow da Seção 1. Some depois de escrever; na última linha ele fica,
   * porque não há próxima linha pra herdar o holofote (spec §0.3: o estado
   * final assentado, sem SMIL a base já mostra o cursor no lugar certo).
   */
  const cursorDe = (row, idx) => {
    if (STATIC) return ''
    const isLast = idx === rows.length - 1
    const x0 = row.x
    const x1 = row.x + row.text.length * CELL_W
    const wS = row.at
    const wE = row.at + ATIME.DUR
    const f = ATIME.CURSOR_FADE

    const slide = animate({
      attr: 'x', values: `${x0};${x0};${x1.toFixed(2)};${x1.toFixed(2)}`,
      keyTimes: `0;${kk(wS)};${kk(wE)};1`,
      dur: total, where: `sobre/cursor-${idx}/slide`, repeat: false,
    })
    const blink = tag('animate', {
      attributeName: 'opacity', ...CURSOR_DUTY,
      dur: `${ATIME.CURSOR_BLINK}s`, begin: '0s', repeatCount: 'indefinite',
    })
    const fase = isLast
      ? animate({
        attr: 'opacity', values: '0;0;1;1',
        keyTimes: `0;${kk(wS)};${kk(wS + f)};1`,
        dur: total, where: `sobre/cursor-${idx}`, repeat: false,
      })
      : animate({
        attr: 'opacity', values: '0;0;1;1;0;0',
        keyTimes: `0;${kk(wS)};${kk(wS + f)};${kk(wE)};${kk(wE + f)};1`,
        dur: total, where: `sobre/cursor-${idx}`, repeat: false,
      })

    return tag('g', { opacity: 0 }, fase +
      tag('rect', {
        x: x1, y: row.y - TYPO.SIZE.body + 1, width: CELL_W, height: TYPO.SIZE.body + 1,
        fill: row.fill,
      }, slide + blink))
  }

  /**
   * A arte, uma <text> por fileira.
   *
   * textLength fixa a largura em ASCII.W: a grade deixa de depender do avanço
   * da fonte do sistema, que varia de 0.55 a 0.602 conforme o SO (§0.4).
   * lengthAdjust="spacingAndGlyphs" estica o glifo junto com o espaço — só
   * "spacing" abriria fresta entre as colunas e a massa escura viraria grade.
   */
  const arte = linhasArte.map((linha, y) => text(
    P.PAD, L.artTop + (y + 1) * ASCII.LINE_H, ASCII.FILL, linha,
    { 'font-size': ASCII.FONT, textLength: ASCII.W, lengthAdjust: 'spacingAndGlyphs' },
  )).join('\n')

  // A varredura: um clip só para as 52 fileiras. Altura no markup = revelado,
  // então sem SMIL a montagem aparece inteira (§0.3).
  const varredura = STATIC ? arte : tag('clipPath', { id: 'scan' }, tag('rect', {
    x: P.PAD, y: L.artTop, width: ASCII.W, height: L.artH,
  }, animate({
    attr: 'height', values: `0;0;${L.artH};${L.artH}`,
    keyTimes: `0;${kk(ATIME.CMD_AT + ATIME.DUR + ATIME.ART_GAP)};` +
              `${kk(ATIME.CMD_AT + ATIME.DUR + ATIME.ART_GAP + ATIME.ART_DUR)};1`,
    dur: total, where: 'sobre/varredura', repeat: false,
  }))) + tag('g', { 'clip-path': 'url(#scan)' }, arte)

  const alt = `${P.TITLE} — três retratos de Augusto Caetano Westphal em montagem ` +
    `de caracteres, da mesma sessão: ${ASCII.ORDER.map((f) => f.alt).join('; ')}. ` +
    `${P.STATUS}. Sobre o blog: tecnologia, código, boas práticas e opiniões.`

  return [
    svgOpen(P.W, L.H, alt),
    tag('rect', { x: 0, y: 0, width: P.W, height: L.H, fill: T.bg }),
    paneFrame(P.W, L.H),
    paneChrome(P.W, P.TITLE, P.HUE),
    // À direita da barra de título; ancorado no fim, não numa largura estimada.
    text(P.W - P.PAD, P.STATUS_Y, T.muted, P.STATUS, { 'text-anchor': 'end' }),
    varredura,
    tag('rect', {
      x: P.PAD, y: L.boxY, width: P.W - P.PAD * 2, height: L.boxH,
      rx: P.BOX_RX, fill: T.chrome,
    }),
    rows.map((row, idx) => digita(row, idx) + cursorDe(row, idx)).join('\n'),
    '</svg>',
  ].join('\n')
}

const main = () => {
  const dados = JSON.parse(readFileSync(ASCII.SRC, 'utf8'))
  console.log(`-> lido ${ASCII.SRC} | ${dados.cols}x${dados.rows} por quadro, gama ${dados.gamma}`)

  const svg = cartao(dados)
  mkdirSync('assets', { recursive: true })
  const b = assertBudget(svg)
  writeFileSync(OUT, svg + '\n', 'utf8')
  console.log(`-> ${OUT} ${P.W}x${aboutLayout(dados.rows).H} | ` +
    `${b.bytes} bytes, ${b.animates} animações${STATIC ? ' (estático)' : ''}`)
}

try { main() } catch (e) { console.error('!', e.message); process.exit(1) }
