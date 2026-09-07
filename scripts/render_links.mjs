/**
 * Desenha o fecho da página: o terminal e as quatro peças de contato.
 *
 *   assets/contact-prompt.svg   o terminal, com o comando e o prompt
 *   assets/link-<id>.svg        uma peça por endereço, clicável
 *
 * O terminal encurtou de propósito. Um <a> envolve a imagem inteira e dá um
 * destino só, e o GitHub remove <a> de dentro do SVG — então quatro alvos
 * exigem quatro arquivos. Em vez de listar os endereços no terminal E nas
 * peças, o terminal ficou com o que só ele pode dizer: o comando e o prompt
 * devolvido a quem está lendo.
 *
 * A Seção 1 abre com quatro agentes; aqui o mesmo liaison reaparece e para de
 * falar, e cada peça herda a cor do agente correspondente.
 *
 * Uso:
 *   node scripts/render_links.mjs
 *   STATIC=1 node scripts/render_links.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import {
  T, TYPO, CELL_W, GEO, KEYTIME_DECIMALS, CURSOR_DUTY,
  CONTACT, LINKS_PANE as P, LINKS_CANVAS, LINKS_TIME, TILE, TILES,
} from './lib/constants/index.mjs'
import { assertWidth, assertBudget } from './lib/assert.mjs'
import { tag, text, animate } from './lib/svg.mjs'
import { paneFrame, paneChrome } from './lib/pane.mjs'

const IN = 'data/profile.json'
const STATIC = process.env.STATIC === '1'
const svgOpen = (w, h, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
  `viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">\n` +
  `<style>text{font-family:${TYPO.STACK};font-size:${TYPO.SIZE.body}px}</style>`

/** O cursor de bloco do sistema, piscando no seu próprio ritmo. */
const cursor = (x, y, hue, dur) => tag('rect', {
  x, y: y - TYPO.SIZE.body + 1, width: CELL_W, height: TYPO.SIZE.body + 1, fill: hue,
}, STATIC ? '' : tag('animate', {
  attributeName: 'opacity', ...CURSOR_DUTY,
  dur: `${dur}s`, begin: '0s', repeatCount: 'indefinite',
}))

/** O terminal: comando, prompt, e o cursor que não para. */
function terminal() {
  const H = LINKS_CANVAS.H
  const promptY = P.CMD_Y + P.PROMPT_GAP
  const total = +(LINKS_TIME.CMD_AT + LINKS_TIME.PROMPT_GAP + LINKS_TIME.DUR * 2).toFixed(2)
  const kk = (s) => (s / total).toFixed(KEYTIME_DECIMALS)
  const util = P.W - P.PAD * 2

  const revela = (conteudo, y, at) => {
    if (STATIC) return conteudo
    const id = `l${Math.round(y)}`
    return tag('clipPath', { id }, tag('rect', {
      x: P.PAD, y: y - TYPO.SIZE.body, width: util, height: TYPO.LINE_H,
    }, animate({
      attr: 'width', values: `0;0;${util};${util}`,
      keyTimes: `0;${kk(at)};${kk(at + LINKS_TIME.DUR)};1`,
      dur: total, where: `linha/${y}`, repeat: false,
    }))) + tag('g', { 'clip-path': `url(#${id})` }, conteudo)
  }

  const promptAt = LINKS_TIME.CMD_AT + LINKS_TIME.PROMPT_GAP
  const dots = GEO.DOT.CX.map((cx, n) => tag('circle', {
    cx, cy: GEO.DOT.CY, r: GEO.DOT.R, fill: [T.dotRed, T.dotYellow, T.dotGreen][n],
  })).join('')

  return [
    svgOpen(P.W, H, `${P.TITLE} — $ connect --list, e o prompt devolvido ao leitor.`),
    tag('rect', { x: 0, y: 0, width: P.W, height: H, fill: T.bg }),
    paneFrame(P.W, H),
    paneChrome(P.W, P.TITLE, P.HUE),
    revela(text(P.PAD, P.CMD_Y, T.ink, '$ connect --list'), P.CMD_Y, LINKS_TIME.CMD_AT),
    revela(text(P.PAD, promptY, P.HUE, P.PROMPT), promptY, promptAt),
    tag('g', { opacity: 1 },
      (STATIC ? '' : animate({
        attr: 'opacity', values: '0;0;1;1',
        keyTimes: `0;${kk(promptAt)};${kk(promptAt + LINKS_TIME.DUR)};1`,
        dur: total, where: 'cursor/entrada', repeat: false,
      })) + cursor(P.PAD + CELL_W * (P.PROMPT.length + 1), promptY, P.HUE,
        LINKS_TIME.CURSOR_BLINK)),
    '</svg>',
  ].join('\n')
}

/** Uma peça de contato: rótulo, endereço e um cursor no ritmo próprio dela. */
function peca(t, addr, i, total) {
  // Medianiz desenhada dentro da peça: metade dela nas bordas internas, nada
  // nas externas. A fileira fecha exatamente na largura do terminal acima.
  const g = TILE.GUTTER / 2
  const x = i === 0 ? 0 : g
  const w = TILE.W - (i === 0 ? g : 0) - (i === total - 1 ? g : 0)

  const addrCell = TILE.ADDR_SIZE * TYPO.ADVANCE_RATIO
  const util = Math.floor((w - TILE.PAD * 2) / addrCell)
  assertWidth(addr, `peça/${t.id}`, util)

  const s = TILE.STROKE
  return [
    svgOpen(TILE.W, TILE.H, `${t.id} — ${addr}`),
    tag('rect', { x: 0, y: 0, width: TILE.W, height: TILE.H, fill: T.bg }),
    tag('rect', { x: x + s / 2, y: s / 2, width: w - s, height: TILE.H - s,
      rx: TILE.RX, fill: T.pane, stroke: t.hue, 'stroke-width': s }),
    text(x + TILE.PAD + CELL_W, TILE.LABEL_Y, t.hue, t.id),
    cursor(x + TILE.PAD + CELL_W * (t.id.length + 1 + TILE.CURSOR_GAP), TILE.LABEL_Y,
      t.hue, t.blink),
    text(x + TILE.PAD + CELL_W, TILE.ADDR_Y, T.dim, addr, { 'font-size': TILE.ADDR_SIZE }),
    '</svg>',
  ].join('\n')
}

const main = () => {
  const { user } = JSON.parse(readFileSync(IN, 'utf8'))
  const endereco = (t) => t.addr ?? (t.from === 'blog' ? user.blog : `github.com/${user.login}`)

  mkdirSync('assets', { recursive: true })
  let bytes = 0
  const grava = (arq, svg) => {
    const b = assertBudget(svg)
    writeFileSync(arq, svg + '\n', 'utf8')
    bytes += b.bytes
    return b
  }

  const t = grava('assets/contact-prompt.svg', terminal())
  console.log(`-> terminal ${P.W}x${LINKS_CANVAS.H} | ${t.bytes} bytes, ${t.animates} animações`)

  TILES.forEach((tile, i) => {
    const addr = endereco(tile)
    const b = grava(`assets/link-${tile.id}.svg`, peca(tile, addr, i, TILES.length))
    console.log(`-> ${tile.id.padEnd(9)} ${TILE.W}x${TILE.H} | ${String(b.bytes).padStart(4)} bytes | ${addr}`)
  })
  console.log(`-> ${bytes} bytes no total${STATIC ? ' (estático)' : ''}`)
}

try { main() } catch (e) { console.error('!', e.message); process.exit(1) }
