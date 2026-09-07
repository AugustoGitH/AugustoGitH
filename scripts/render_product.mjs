/**
 * Desenha o preview do produto (assets/product-preview.svg).
 *
 * Uma sessão de uso gravada: o cursor clica em Budgets, os cards aparecem, ele
 * abre um budget e chega na tabela. Somente leitura — sem JS (§0.2), é um
 * replay, como a partida da Seção 4.
 *
 * Fiel na ESTRUTURA, amostra no CONTEÚDO. Navegação, hierarquia da tabela,
 * estados e cores vêm do código do produto; os números são inventados, e a
 * moldura diz isso. Os repositórios são privados e o dado é dos clientes.
 *
 * Uso:
 *   node scripts/render_product.mjs
 *   STATIC=1 node scripts/render_product.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import {
  T, TYPO, GEO, KEYTIME_DECIMALS,
  PRODUCT, NAV, NAV_TARGET, UI, CARDS, CARD_TARGET, TABLE, APP, TOUR,
  LAY, WEIGHT, ARROW, keyTimeTick,
} from './lib/constants/index.mjs'
import { assertBudget } from './lib/assert.mjs'
import { tag, text, animate } from './lib/svg.mjs'

const OUT = 'assets/product-preview.svg'
const STATIC = process.env.STATIC === '1'
const WHITE = UI.surface

const CONTENT_X = APP.X + APP.SIDEBAR_W
const CONTENT_Y = APP.Y + APP.HEADER_H
const CONTENT_W = APP.VIEW_W - APP.SIDEBAR_W
const CONTENT_H = APP.VIEW_H - APP.HEADER_H

const navY = (i) => CONTENT_Y + APP.NAV_Y + i * APP.NAV_H
/** Largura aproximada de um texto, para dimensionar pílulas e deslocamentos. */
const textW = (s, size) => s.length * size * TYPO.ADVANCE_RATIO
const bold = (size) => ({ 'font-size': size, 'font-weight': WEIGHT.bold })

// ------------------------------------------------------------------ moldura

/** Cabeçalho, sidebar e marca. A seleção de Budgets acende depois do clique. */
function shell(sel) {
  const h = LAY.header
  const n = LAY.nav

  const itens = NAV.map((item, i) => {
    const y = navY(i)
    const ativo = i === NAV_TARGET
    const realce = ativo
      ? tag('rect', {
          x: APP.X + n.insetX, y, width: APP.SIDEBAR_W - n.insetX * 2,
          height: APP.NAV_H - n.rx, rx: n.rx, fill: UI.hovered, opacity: 1,
        }, STATIC ? '' : sel)
      : ''
    return realce +
      tag('rect', { x: APP.X + n.dotX, y: y + n.dotY, width: n.dot, height: n.dot,
        rx: n.dotRx, fill: ativo ? UI.second : UI.line }) +
      text(APP.X + n.labelX, y + n.baseY, ativo ? UI.main : UI.dim, item.label,
        { 'font-size': APP.FONT.nav })
  }).join('')

  return (
    tag('rect', { x: APP.X, y: APP.Y, width: APP.VIEW_W, height: APP.VIEW_H,
      rx: APP.RX, fill: UI.canvas }) +
    tag('rect', { x: APP.X, y: APP.Y, width: APP.VIEW_W, height: APP.HEADER_H,
      fill: UI.main }) +
    text(APP.X + h.padX, APP.Y + h.baseY, WHITE, PRODUCT.name, bold(APP.FONT.brand)) +
    text(APP.X + h.padX + textW(PRODUCT.name, APP.FONT.brand) + h.tagGap, APP.Y + h.baseY,
      UI.second, PRODUCT.tagline, { 'font-size': APP.FONT.badge }) +
    tag('circle', { cx: APP.X + APP.VIEW_W - h.avatarInset, cy: APP.Y + h.avatarY,
      r: h.avatarR, fill: UI.second }) +
    tag('rect', { x: APP.X, y: CONTENT_Y, width: APP.SIDEBAR_W, height: CONTENT_H,
      fill: UI.surface }) +
    tag('line', { x1: CONTENT_X, y1: CONTENT_Y, x2: CONTENT_X, y2: APP.Y + APP.VIEW_H,
      stroke: UI.line }) +
    itens
  )
}

// -------------------------------------------------------------------- telas

const zonaX = () => CONTENT_X + APP.PADDING
const zonaY = () => CONTENT_Y + APP.PADDING
const zonaW = () => CONTENT_W - APP.PADDING * 2

const tituloTela = (rotulo) =>
  text(zonaX(), zonaY() + LAY.screen.titleY, UI.ink, rotulo, bold(APP.FONT.head))

/** Tela inicial: só um esqueleto, para o clique em Budgets ter de onde sair. */
function screenHome() {
  const g = LAY.home
  const w = zonaW()
  const cw = (w - g.gap * (g.cols - 1)) / g.cols
  const barras = Array.from({ length: g.cols }, (_, i) => tag('rect', {
    x: zonaX() + i * (cw + g.gap), y: zonaY() + g.y, width: cw, height: g.h,
    rx: g.rx, fill: UI.surface, stroke: UI.lineSoft,
  })).join('')
  return tituloTela('Home') + barras
}

/** Cards de budget: nome, estado e contagem de versões — como no BudgetCard. */
function screenCards() {
  const k = LAY.card
  const cw = (zonaW() - APP.CARD_GAP * (CARDS.length - 1)) / CARDS.length
  const nome = { indraft: 'In draft', closed: 'Closed', running: 'Running' }

  const cards = CARDS.map((c, i) => {
    const cx = zonaX() + i * (cw + APP.CARD_GAP)
    const cy = zonaY() + LAY.screen.bodyY
    const st = UI.state[c.state]
    const rotulo = nome[c.state]
    return tag('rect', { x: cx, y: cy, width: cw, height: APP.CARD_H, rx: k.rx,
        fill: UI.surface, stroke: i === CARD_TARGET ? UI.second : UI.line }) +
      tag('rect', { x: cx, y: cy, width: cw, height: k.stripeH, rx: k.stripeRx,
        fill: UI.main }) +
      text(cx + k.padX, cy + k.nameY, UI.ink, c.name, bold(APP.FONT.head)) +
      tag('rect', { x: cx + k.padX, y: cy + k.pillY,
        width: textW(rotulo, APP.FONT.badge) + k.pillPadX, height: k.pillH,
        rx: k.pillRx, fill: st.bg }) +
      text(cx + k.pillTextX, cy + k.pillBaseY, st.fg, rotulo,
        { 'font-size': APP.FONT.badge }) +
      text(cx + k.padX, cy + k.versionsY, UI.faint,
        `${c.versions} version${c.versions > 1 ? 's' : ''}`,
        { 'font-size': APP.FONT.badge })
  }).join('')

  return tituloTela('Budgets') + cards
}

/** A tabela: Categories e Premises aninhados, colunas de período, versões. */
function screenTable() {
  const b = LAY.table
  const x = zonaX()
  const y = zonaY()
  const w = zonaW()
  const colW = (w - APP.LABEL_W) / TABLE.periods.length
  const headY = y + LAY.screen.bodyY
  const marcador = [UI.main, UI.second, UI.third, UI.fourth]

  const versoes = TABLE.versions.map((v, i) => {
    const vx = x + APP.LABEL_W - b.chipBack + i * b.chipGap
    return tag('rect', { x: vx, y: y + b.chipY, width: b.chipW, height: b.chipH,
        rx: b.chipRx, fill: marcador[i] }) +
      text(vx + b.chipW / 2, y + b.chipBaseY, WHITE, v,
        { 'font-size': APP.FONT.badge, 'text-anchor': 'middle' })
  }).join('')

  const colunaX = (i) => x + APP.LABEL_W + i * colW + colW - b.cellPadR

  const cabecalho =
    tag('rect', { x, y: headY, width: w, height: APP.ROW_H, fill: UI.surface }) +
    tag('line', { x1: x, y1: headY + APP.ROW_H, x2: x + w, y2: headY + APP.ROW_H,
      stroke: UI.line }) +
    TABLE.periods.map((p, i) => text(colunaX(i), headY + b.baseY, UI.dim, p,
      { 'font-size': APP.FONT.cell, 'text-anchor': 'end' })).join('')

  const linhas = TABLE.rows.map((r, i) => {
    const ry = headY + APP.ROW_H * (i + 1)
    const categoria = r.kind === 'category'
    return tag('rect', { x, y: ry, width: w, height: APP.ROW_H,
        fill: categoria ? UI.lineSoft : UI.surface }) +
      tag('line', { x1: x, y1: ry + APP.ROW_H, x2: x + w, y2: ry + APP.ROW_H,
        stroke: UI.lineSoft }) +
      text(x + b.labelPadX + r.level * b.indent, ry + b.baseY,
        categoria ? UI.ink : UI.dim, r.label,
        { 'font-size': APP.FONT.label,
          'font-weight': categoria ? WEIGHT.bold : WEIGHT.normal }) +
      r.cells.map((c, j) => text(colunaX(j), ry + b.baseY, UI.ink, c,
        { 'font-size': APP.FONT.cell, 'text-anchor': 'end' })).join('')
  }).join('')

  return tituloTela(`Budgets / ${CARDS[CARD_TARGET].name}`) +
    versoes + cabecalho + linhas
}

// ------------------------------------------------------------------- cursor

/** A seta e o pulso do clique. O pulso mora no grupo, então acompanha a seta. */
function ponteiro(quadros, kk, total) {
  const s = TOUR.CURSOR
  const seta = tag('path', {
    d: 'M' + ARROW.map(([px, py]) => `${(px * s).toFixed(2)} ${(py * s).toFixed(2)}`)
      .join(' L') + ' Z',
    fill: WHITE, stroke: UI.ink, 'stroke-width': 1, 'stroke-linejoin': 'round',
  })
  const pulso = tag('circle', { cx: 0, cy: 0, r: 0, fill: 'none',
      stroke: UI.second, 'stroke-width': 1, opacity: 0 },
    STATIC ? '' :
      animate({ attr: 'r', ...quadros.pulseR, dur: total, where: 'pulso/r', repeat: false }) +
      animate({ attr: 'opacity', ...quadros.pulseO, dur: total, where: 'pulso/o', repeat: false }))

  const ultimo = quadros.path.at(-1)
  return tag('g', { transform: `translate(${ultimo.x} ${ultimo.y})` },
    (STATIC ? '' : tag('animateTransform', {
      attributeName: 'transform', type: 'translate',
      values: quadros.path.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(';'),
      keyTimes: quadros.times.map(kk).join(';'),
      dur: `${total}s`, begin: '0s', repeatCount: 'indefinite',
    })) + pulso + seta)
}

// --------------------------------------------------------------------- main

const main = () => {
  // Roteiro, em segundos.
  const t = {}
  t.move1 = TOUR.FADE
  t.click1 = t.move1 + TOUR.MOVE
  t.cards = t.click1 + TOUR.SETTLE
  t.move2 = t.cards + TOUR.FADE
  t.click2 = t.move2 + TOUR.MOVE
  t.table = t.click2 + TOUR.SETTLE
  t.leave = t.table + TOUR.READ
  const total = +(t.leave + TOUR.FADE).toFixed(2)
  const kk = (s) => (s / total).toFixed(KEYTIME_DECIMALS)
  const tick = keyTimeTick(total)

  const alvoNav = { x: APP.X + LAY.nav.labelX, y: navY(NAV_TARGET) + LAY.nav.rx }
  const cw = (CONTENT_W - APP.PADDING * 2 - APP.CARD_GAP * (CARDS.length - 1)) / CARDS.length
  const alvoCard = {
    x: CONTENT_X + APP.PADDING + CARD_TARGET * (cw + APP.CARD_GAP) + cw / 2,
    y: CONTENT_Y + APP.PADDING + LAY.screen.bodyY + APP.CARD_H / 2,
  }

  const quadros = {
    path: [TOUR.START, TOUR.START, alvoNav, alvoNav, alvoCard, alvoCard, alvoCard],
    times: [0, t.move1, t.click1, t.move2, t.click2, t.leave, total],
    // Dois pulsos, um por clique.
    pulseR: {
      values: `0;0;${TOUR.CURSOR};0;0;${TOUR.CURSOR};0;0`,
      keyTimes: `0;${kk(t.click1)};${kk(t.click1 + TOUR.CLICK)};${kk(t.click1 + TOUR.CLICK + tick)};` +
                `${kk(t.click2)};${kk(t.click2 + TOUR.CLICK)};${kk(t.click2 + TOUR.CLICK + tick)};1`,
    },
    pulseO: {
      values: '0;0.7;0;0;0.7;0;0;0',
      keyTimes: `0;${kk(t.click1)};${kk(t.click1 + TOUR.CLICK)};${kk(t.click2 - tick)};` +
                `${kk(t.click2)};${kk(t.click2 + TOUR.CLICK)};${kk(t.click2 + TOUR.CLICK + tick)};1`,
    },
  }

  /**
   * Uma tela visível no intervalo [de, ate).
   *
   * O estado base é a TABELA: sem SMIL o leitor recebe o quadro mais
   * informativo da sessão, não a tela vazia por onde ela começa (§0.3).
   */
  const tela = (conteudo, de, ate, base) => {
    if (STATIC) return base ? conteudo : ''
    const f = TOUR.FADE
    return tag('g', { opacity: base ? 1 : 0 },
      animate({
        attr: 'opacity',
        values: base ? '1;0;0;1;1' : '0;0;1;1;0',
        keyTimes: base
          ? `0;${kk(f)};${kk(de)};${kk(de + f)};1`
          : `0;${kk(de)};${kk(de + f)};${kk(ate)};1`,
        dur: total, where: 'tela', repeat: false,
      }) + conteudo)
  }

  const selecao = STATIC ? '' : animate({
    attr: 'opacity', values: '0;0;1;1',
    keyTimes: `0;${kk(t.click1)};${kk(t.cards)};1`,
    dur: total, where: 'seleção', repeat: false,
  })

  const titulo = text(GEO.PAD, APP.TITLE_Y, T.accent, PRODUCT.title, {
    'font-size': TYPO.SIZE.section, 'font-weight': TYPO.SECTION_WEIGHT,
    'letter-spacing': TYPO.SECTION_TRACKING,
  })
  const selo = text(APP.W - GEO.PAD, APP.TITLE_Y, T.muted, PRODUCT.badge,
    { 'text-anchor': 'end' })

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${APP.W}" height="${APP.H}" ` +
    `viewBox="0 0 ${APP.W} ${APP.H}" role="img" ` +
    `aria-label="${PRODUCT.title} — sessão de uso gravada do ${PRODUCT.name}, ` +
    `${PRODUCT.tagline}: o ponteiro abre Budgets, os cards aparecem e um deles ` +
    `revela a tabela de orçamento com categorias e premissas por período. ` +
    `Navegação: ${NAV.map((n) => n.label).join(', ')}. ${PRODUCT.badge}.">`,
    `<style>text{font-family:${TYPO.STACK}}</style>`,
    tag('rect', { x: 0, y: 0, width: APP.W, height: APP.H, fill: T.bg }),
    titulo, selo,
    tag('clipPath', { id: 'app' }, tag('rect', {
      x: APP.X, y: APP.Y, width: APP.VIEW_W, height: APP.VIEW_H, rx: APP.RX })),
    tag('g', { 'clip-path': 'url(#app)' },
      shell(selecao) +
      tela(screenHome(), 0, t.cards, false) +
      tela(screenCards(), t.cards, t.table, false) +
      tela(screenTable(), t.table, total, true) +
      ponteiro(quadros, kk, total)),
    tag('rect', { x: APP.X + GEO.HAIRLINE, y: APP.Y + GEO.HAIRLINE,
      width: APP.VIEW_W - GEO.HAIRLINE * 2, height: APP.VIEW_H - GEO.HAIRLINE * 2,
      rx: APP.RX, fill: 'none', stroke: T.border }),
    '</svg>',
  ].join('\n')

  mkdirSync('assets', { recursive: true })
  const { bytes, animates } = assertBudget(svg)
  writeFileSync(OUT, svg + '\n', 'utf8')
  console.log(`-> ${APP.W}x${APP.H} | app ${APP.VIEW_W}x${APP.VIEW_H} | loop ${total}s`)
  console.log(`-> ${bytes} bytes, ${animates} animações`)
  console.log(`-> gravado ${OUT}${STATIC ? ' (estático)' : ''}`)
}

try { main() } catch (e) { console.error('!', e.message); process.exit(1) }
