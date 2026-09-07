/**
 * Desenha o preview do produto (assets/product-preview.svg).
 *
 * Uma sessão de uso gravada: o ponteiro clica em Orçamentos, os cards aparecem,
 * ele abre um deles e chega na tabela. Somente leitura — sem JS (§0.2), é um
 * replay, como a partida da Seção 4.
 *
 * Layout, cores e rótulos vêm das telas reais da aplicação; nomes, datas e
 * números são amostra, e a moldura declara isso. Os repositórios são privados e
 * da organização, e o conteúdo é dos clientes.
 *
 * Uso:
 *   node scripts/render_product.mjs
 *   STATIC=1 node scripts/render_product.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import {
  T, TYPO, GEO, KEYTIME_DECIMALS, keyTimeTick,
  PRODUCT, UI, RAIL, RAIL_TARGET, CARDS, CARD_TARGET, TABLE, APP, TOUR,
  LAY, WEIGHT, ARROW,
} from './lib/constants/index.mjs'
import { assertBudget } from './lib/assert.mjs'
import { tag, text, animate, esc } from './lib/svg.mjs'

const OUT = 'assets/product-preview.svg'
const STATIC = process.env.STATIC === '1'

const RAIL_X = APP.X + APP.RAIL_W
const BODY_Y = APP.Y + APP.HEADER_H
const BODY_W = APP.VIEW_W - APP.RAIL_W
const BODY_H = APP.VIEW_H - APP.HEADER_H
const ZONE_X = RAIL_X + APP.PADDING
const ZONE_Y = BODY_Y + APP.TITLEBAR_H
const ZONE_W = BODY_W - APP.PADDING * 2

const railY = (i) => BODY_Y + LAY.rail.top + i * LAY.rail.step
const w = (s, size) => s.length * size * TYPO.ADVANCE_RATIO
const bold = (size) => ({ 'font-size': size, 'font-weight': WEIGHT.bold })

// ------------------------------------------------------------------ moldura

/** Glifos do trilho. Simplificações reconhecíveis, não os ícones do produto. */
function glifo(kind, cx, cy, cor) {
  const r = LAY.rail.iconR
  const traco = { fill: 'none', stroke: cor, 'stroke-width': LAY.stroke.icon, 'stroke-linejoin': 'round' }
  switch (kind) {
    case 'home': return tag('path', { d: `M${cx - r} ${cy + 1}L${cx} ${cy - r}L${cx + r} ${cy + 1}V${cy + r}H${cx - r}Z`, ...traco })
    case 'tree': return tag('path', { d: `M${cx - r} ${cy - r}V${cy + r}M${cx - r} ${cy}H${cx + r}M${cx + r} ${cy - r}v${r * 2}`, ...traco })
    case 'tag': return tag('path', { d: `M${cx - r} ${cy - r}h${r}l${r} ${r}l-${r} ${r}h-${r}Z`, ...traco })
    case 'folder': return tag('path', { d: `M${cx - r} ${cy + r}v-${r * 2}h${r}l1 1h${r - 1}v${r * 2}Z`, ...traco })
    case 'coin': return tag('circle', { cx, cy, r, ...traco }) +
      tag('path', { d: `M${cx} ${cy - r + 1}v${r * 2 - 2}`, ...traco })
    case 'chart': return tag('path', { d: `M${cx - r} ${cy + r}L${cx - 1} ${cy - 1}L${cx + 1} ${cy + 1}L${cx + r} ${cy - r}`, ...traco })
    default: return tag('circle', { cx, cy, r: r - 1, ...traco }) +
      tag('circle', { cx, cy, r: r - LAY.rail.aiInner, ...traco })
  }
}

/** Cabeçalho: marca, busca, organização e usuário. */
function header() {
  const h = LAY.header
  const y = APP.Y
  const cx = APP.X + APP.VIEW_W / 2
  return (
    tag('rect', { x: APP.X, y, width: APP.VIEW_W, height: APP.HEADER_H, fill: UI.header }) +
    // tspan em vez de três <text> com x calculado: o fluxo é do renderizador,
    // então a marca não desalinha se a fonte tiver avanço diferente do previsto.
    tag('text', { x: APP.X + h.padX, y: y + h.baseY, fill: UI.surface,
      'font-size': APP.FONT.brand, 'font-weight': WEIGHT.bold },
      esc(PRODUCT.name) +
      tag('tspan', { fill: UI.teal }, esc(PRODUCT.nameAccent)) +
      esc(PRODUCT.nameTail)) +
    tag('rect', { x: cx - h.searchW / 2, y: y + (APP.HEADER_H - h.searchH) / 2,
      width: h.searchW, height: h.searchH, rx: h.searchRx, fill: UI.search }) +
    text(cx - h.searchW / 2 + h.padX, y + h.baseY - 1, UI.faint, PRODUCT.search,
      { 'font-size': APP.FONT.search }) +
    tag('circle', { cx: cx + h.searchW / 2 - h.padX, cy: y + APP.HEADER_H / 2, r: h.searchIconR,
      fill: 'none', stroke: UI.faint, 'stroke-width': LAY.stroke.thin }) +
    tag('rect', { x: APP.X + APP.VIEW_W - h.padX - h.avatarR * 2 - h.avatarGap - h.orgW,
      y: y + (APP.HEADER_H - h.orgH) / 2, width: h.orgW, height: h.orgH, rx: h.orgRx,
      fill: UI.search }) +
    text(APP.X + APP.VIEW_W - h.padX - h.avatarR * 2 - h.avatarGap - h.orgW + h.orgPadX,
      y + h.baseY - 1, UI.surface, PRODUCT.org, { 'font-size': APP.FONT.search }) +
    tag('circle', { cx: APP.X + APP.VIEW_W - h.padX - h.avatarR, cy: y + APP.HEADER_H / 2,
      r: h.avatarR, fill: UI.search }) +
    text(APP.X + APP.VIEW_W - h.padX - h.avatarR, y + h.baseY - 1, UI.surface, PRODUCT.user,
      { 'font-size': APP.FONT.label, 'text-anchor': 'middle' })
  )
}

/** Trilho de ícones. O item de Orçamentos acende depois do clique. */
function rail(sel) {
  const r = LAY.rail
  const itens = RAIL.map((item, i) => {
    const y = railY(i)
    const cx = APP.X + APP.RAIL_W / 2
    const cy = y + r.size / 2
    const ativo = i === RAIL_TARGET
    const chip = ativo
      ? tag('rect', { x: cx - r.size / 2, y, width: r.size, height: r.size, rx: r.rx,
          fill: UI.teal, opacity: 1 }, STATIC ? '' : sel)
      : ''
    return chip + glifo(item.glyph, cx, cy, ativo ? UI.surface : UI.dim)
  }).join('')

  return (
    tag('rect', { x: APP.X, y: BODY_Y, width: APP.RAIL_W, height: BODY_H, fill: UI.canvas }) +
    tag('line', { x1: RAIL_X, y1: BODY_Y, x2: RAIL_X, y2: APP.Y + APP.VIEW_H, stroke: UI.line }) +
    tag('path', { d: `M${APP.X + APP.RAIL_W / 2 - 4} ${BODY_Y + r.collapseY}` +
      `l4 4l-4 4M${APP.X + APP.RAIL_W / 2 + 5} ${BODY_Y + r.collapseY}v8`,
      fill: 'none', stroke: UI.dim, 'stroke-width': LAY.stroke.rail }) +
    itens +
    tag('circle', { cx: APP.X + APP.RAIL_W / 2, cy: APP.Y + APP.VIEW_H - r.footInset,
      r: r.footR, fill: UI.header })
  )
}

/** Barra de título da página, com os botões de ação à direita. */
function titlebar(rotulo, extra = '') {
  const b = LAY.titlebar
  const y = BODY_Y
  const botoes = [0, 1, 2].map((i) => tag('rect', {
    x: APP.X + APP.VIEW_W - b.padX - (i + 1) * b.btn - i * b.btnGap,
    y: y + (APP.TITLEBAR_H - b.btn) / 2, width: b.btn, height: b.btn, rx: b.btnRx,
    fill: UI.teal,
  })).join('')
  return tag('rect', { x: RAIL_X, y, width: BODY_W, height: APP.TITLEBAR_H, fill: UI.canvas }) +
    tag('circle', { cx: RAIL_X + b.padX + b.iconR, cy: y + APP.TITLEBAR_H / 2, r: b.iconR,
      fill: 'none', stroke: UI.dim, 'stroke-width': LAY.stroke.thin }) +
    text(RAIL_X + b.padX + b.iconR * 2 + b.labelGap, y + b.baseY, UI.ink, rotulo, bold(APP.FONT.page)) +
    extra + botoes +
    tag('line', { x1: RAIL_X + b.padX, y1: y + APP.TITLEBAR_H,
      x2: APP.X + APP.VIEW_W - b.padX, y2: y + APP.TITLEBAR_H, stroke: UI.line })
}

// -------------------------------------------------------------------- telas

const cardW = () => (ZONE_W - APP.CARD_GAP * (CARDS.length - 1)) / CARDS.length

/** Tela de cards: barra de plano, estado, progresso e contagem de versões. */
function screenCards() {
  const k = LAY.card
  const cw = cardW()

  const cards = CARDS.map((c, i) => {
    const x = ZONE_X + i * (cw + APP.CARD_GAP)
    const y = ZONE_Y + APP.PADDING - k.topInset
    const plano = UI.plan[c.color]
    const st = UI.state[c.state]

    const barra = tag('path', {
      d: `M${x + k.rx} ${y}h-${k.rx - k.bar}a${k.rx} ${k.rx} 0 0 0-${k.bar} ${k.rx}` +
         `v${APP.CARD_H - k.rx * 2}a${k.rx} ${k.rx} 0 0 0 ${k.bar} ${k.rx}h${k.rx - k.bar}Z`,
      fill: plano,
    })
    const progresso = [
      ['DEFINIÇÃO', c.definition, 0], ['PREENCHIMENTO', c.filling, 1],
    ].map(([rot, pct, n]) => {
      const py = y + k.progY + n * k.progStep
      const tx = x + k.padX
      const tw = cw - k.padX - k.bar - k.trackInset
      return text(tx, py, UI.dim, rot, { 'font-size': APP.FONT.label }) +
        text(tx + tw, py, UI.dim, `${pct}%`,
          { 'font-size': APP.FONT.label, 'text-anchor': 'end' }) +
        tag('rect', { x: tx, y: py + k.trackY - k.trackH, width: tw, height: k.trackH,
          rx: k.trackH / 2, fill: UI.lineSoft }) +
        tag('rect', { x: tx, y: py + k.trackY - k.trackH, width: tw * pct / 100,
          height: k.trackH, rx: k.trackH / 2, fill: UI.orange }) +
        tag('circle', { cx: tx + tw * pct / 100, cy: py + k.trackY - k.trackH / 2,
          r: k.dotR, fill: UI.orange })
    }).join('')

    const linha = (n, rot, valor) => {
      const ly = y + k.rowY + n * k.rowStep
      return text(x + k.padX, ly, UI.faint, rot, { 'font-size': APP.FONT.label }) +
        text(x + cw - k.padX + k.bar, ly, UI.ink, valor,
          { ...bold(APP.FONT.value), 'text-anchor': 'end' })
    }

    return tag('rect', { x, y, width: cw, height: APP.CARD_H, rx: k.rx,
        fill: UI.surface, stroke: i === CARD_TARGET ? UI.teal : UI.line }) +
      barra +
      tag('circle', { cx: x + k.padX + k.badgeR, cy: y + k.badgeY, r: k.badgeR, fill: plano }) +
      text(x + k.titleX, y + k.titleY, UI.ink, c.name, bold(APP.FONT.cardTitle)) +
      text(x + k.padX, y + k.descY, UI.faint, c.desc, { 'font-size': APP.FONT.cardDesc }) +
      linha(0, 'PLANO', c.plan) +
      linha(1, 'PERÍODO', c.period) +
      text(x + k.padX, y + k.rowY + 2 * k.rowStep, UI.faint, 'ESTADO',
        { 'font-size': APP.FONT.label }) +
      tag('rect', { x: x + cw - k.padX + k.bar - (w(st.label, APP.FONT.pill) + k.pillPadX),
        y: y + k.rowY + 2 * k.rowStep - k.pillH + k.pillLift,
        width: w(st.label, APP.FONT.pill) + k.pillPadX, height: k.pillH, rx: k.pillRx,
        fill: st.bg }) +
      text(x + cw - k.padX + k.bar - k.pillPadX / 2, y + k.rowY + 2 * k.rowStep, st.fg,
        st.label, { ...bold(APP.FONT.pill), 'text-anchor': 'end' }) +
      progresso +
      tag('path', { d: `M${x + cw - k.padX - 14} ${y + k.versionY - 6}v6m0 0h6` +
        `M${x + cw - k.padX - 8} ${y + k.versionY - 10}v4`,
        fill: 'none', stroke: UI.dim, 'stroke-width': LAY.stroke.thin }) +
      text(x + cw - k.padX + k.bar, y + k.versionY, UI.dim, String(c.versions),
        { 'font-size': APP.FONT.value, 'text-anchor': 'end' })
  }).join('')

  return titlebar(PRODUCT.page) + cards
}

/** Tela da tabela: painel numerado à esquerda, cabeçalho de tempo à direita. */
function screenTable() {
  const b = LAY.table
  const alvo = CARDS[CARD_TARGET]
  const st = UI.state[alvo.state]

  // Migalha: Orçamentos › nome › pill de estado
  const crumbX = RAIL_X + LAY.titlebar.padX + LAY.titlebar.iconR * 2 + LAY.titlebar.labelGap +
    w(PRODUCT.page, APP.FONT.page) + b.crumbGap
  const migalha =
    text(crumbX, BODY_Y + LAY.titlebar.baseY, UI.dim, `› ${alvo.name}`,
      { 'font-size': APP.FONT.head }) +
    tag('rect', { x: crumbX + w(`› ${alvo.name}`, APP.FONT.head) + b.crumbGap,
      y: BODY_Y + LAY.titlebar.baseY - b.pillH + b.pillLift,
      width: w(st.label, APP.FONT.pill) + b.pillPadX, height: b.pillH, rx: b.pillRx,
      fill: st.bg }) +
    text(crumbX + w(`› ${alvo.name}`, APP.FONT.head) + b.crumbGap + b.pillPadX / 2,
      BODY_Y + LAY.titlebar.baseY, st.fg, st.label, bold(APP.FONT.pill))

  const gx = ZONE_X + b.leftW
  const gw = ZONE_W - b.leftW
  const meses = TABLE.quarters.flatMap((q) => q.months)
  const colW = gw / meses.length
  const y0 = ZONE_Y + APP.PADDING - b.topInset

  // Cabeçalho hierárquico: faixa, ano, trimestre, mês.
  const faixa =
    tag('rect', { x: gx, y: y0, width: gw, height: b.bandH, fill: UI.band }) +
    text(gx + gw / 2, y0 + b.bandH - b.bandBase, UI.surface, TABLE.band,
      { ...bold(APP.FONT.band), 'text-anchor': 'middle', 'letter-spacing': 1 })
  const ano =
    tag('rect', { x: gx, y: y0 + b.bandH, width: gw, height: b.yearH, fill: UI.lineSoft }) +
    text(gx + gw / 2, y0 + b.bandH + b.yearH - b.yearBase, UI.ink, TABLE.year,
      { ...bold(APP.FONT.head), 'text-anchor': 'middle' })
  let qx = gx
  const trimestres = TABLE.quarters.map((q) => {
    const qw = q.months.length * colW
    const el = tag('rect', { x: qx, y: y0 + b.bandH + b.yearH, width: qw, height: b.quarterH,
        fill: UI.surface, stroke: UI.line }) +
      text(qx + qw / 2, y0 + b.bandH + b.yearH + b.quarterH - b.quarterBase, UI.dim, q.label,
        { ...bold(APP.FONT.head), 'text-anchor': 'middle' })
    qx += qw
    return el
  }).join('')
  const headY = y0 + b.bandH + b.yearH + b.quarterH
  const cabecalhoMes =
    tag('rect', { x: gx, y: headY, width: gw, height: b.monthH, fill: UI.surface }) +
    tag('line', { x1: gx, y1: headY + b.monthH, x2: gx + gw, y2: headY + b.monthH, stroke: UI.line }) +
    meses.map((m, i) => text(gx + i * colW + colW / 2, headY + b.monthH - b.monthBase, UI.dim, m,
      { 'font-size': APP.FONT.head, 'text-anchor': 'middle' })).join('')

  const topo = headY + b.monthH
  const linhas = TABLE.rows.map((r, i) => {
    const ry = topo + i * APP.ROW_H
    const par = i % 2 === 1
    const esquerda =
      (r.expand ? tag('path', { d: `M${ZONE_X + b.chevronX} ${ry + 6}l3 3l-3 3`,
        fill: 'none', stroke: UI.faint, 'stroke-width': LAY.stroke.thin }) : '') +
      text(ZONE_X + b.numX, ry + b.baseY, UI.faint, String(r.n),
        { 'font-size': APP.FONT.cell }) +
      text(ZONE_X + b.nameX, ry + b.baseY, UI.ink, r.label, { 'font-size': APP.FONT.cell })
    const celulas = r.cells.map((c, j) => {
      const cx = gx + j * colW
      if (c === null) {
        return tag('circle', { cx: cx + colW / 2, cy: ry + APP.ROW_H / 2, r: b.emptyR,
            fill: 'none', stroke: UI.line, 'stroke-width': 1 }) +
          tag('path', { d: `M${cx + colW / 2 - 2.5} ${ry + APP.ROW_H / 2 + 2.5}` +
            `l5 -5`, stroke: UI.line, 'stroke-width': 1 })
      }
      const marca = r.marks.includes(j)
        ? tag('circle', { cx: cx + colW - b.cellPadR - 2, cy: ry + b.markY, r: b.markR,
            fill: UI.marker })
        : ''
      return marca + text(cx + colW - b.cellPadR, ry + b.baseY + 2, UI.ink, c,
        { 'font-size': APP.FONT.cell, 'text-anchor': 'end' })
    }).join('')
    return tag('rect', { x: ZONE_X, y: ry, width: ZONE_W, height: APP.ROW_H,
        fill: par ? UI.cell : UI.surface }) +
      tag('line', { x1: ZONE_X, y1: ry + APP.ROW_H, x2: ZONE_X + ZONE_W, y2: ry + APP.ROW_H,
        stroke: UI.lineSoft }) +
      esquerda + celulas
  }).join('')

  return titlebar(PRODUCT.page, migalha) +
    tag('rect', { x: ZONE_X, y: y0, width: ZONE_W, height: APP.VIEW_H - (y0 - APP.Y) - b.sheetPad,
      fill: UI.surface }) +
    faixa + ano + trimestres + cabecalhoMes + linhas
}

// ------------------------------------------------------------------- cursor

/** A seta e o pulso do clique. O pulso mora no grupo, então acompanha a seta. */
function ponteiro(q, kk, total) {
  const s = TOUR.CURSOR
  const seta = tag('path', {
    d: 'M' + ARROW.map(([px, py]) => `${(px * s).toFixed(2)} ${(py * s).toFixed(2)}`).join(' L') + ' Z',
    fill: UI.surface, stroke: UI.ink, 'stroke-width': 1, 'stroke-linejoin': 'round',
  })
  const pulso = tag('circle', { cx: 0, cy: 0, r: 0, fill: 'none', stroke: UI.teal,
      'stroke-width': LAY.stroke.icon, opacity: 0 },
    STATIC ? '' :
      animate({ attr: 'r', ...q.pulseR, dur: total, where: 'pulso/r', repeat: false }) +
      animate({ attr: 'opacity', ...q.pulseO, dur: total, where: 'pulso/o', repeat: false }))
  const ultimo = q.path.at(-1)
  return tag('g', { transform: `translate(${ultimo.x.toFixed(1)} ${ultimo.y.toFixed(1)})` },
    (STATIC ? '' : tag('animateTransform', {
      attributeName: 'transform', type: 'translate',
      values: q.path.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(';'),
      keyTimes: q.times.map(kk).join(';'),
      dur: `${total}s`, begin: '0s', repeatCount: 'indefinite',
    })) + pulso + seta)
}

// --------------------------------------------------------------------- main

const main = () => {
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

  const alvoRail = { x: APP.X + APP.RAIL_W / 2, y: railY(RAIL_TARGET) + LAY.rail.size / 2 }
  const cw = cardW()
  const alvoCard = {
    x: ZONE_X + CARD_TARGET * (cw + APP.CARD_GAP) + cw / 2,
    y: ZONE_Y + APP.PADDING - LAY.card.topInset + APP.CARD_H / 2,
  }

  const q = {
    path: [TOUR.START, TOUR.START, alvoRail, alvoRail, alvoCard, alvoCard, alvoCard],
    times: [0, t.move1, t.click1, t.move2, t.click2, t.leave, total],
    pulseR: {
      values: `0;0;${TOUR.CURSOR};0;0;${TOUR.CURSOR};0;0`,
      keyTimes: `0;${kk(t.click1)};${kk(t.click1 + TOUR.CLICK)};${kk(t.click1 + TOUR.CLICK + tick)};` +
                `${kk(t.click2)};${kk(t.click2 + TOUR.CLICK)};${kk(t.click2 + TOUR.CLICK + tick)};1`,
    },
    pulseO: {
      values: '0;0.8;0;0;0.8;0;0;0',
      keyTimes: `0;${kk(t.click1)};${kk(t.click1 + TOUR.CLICK)};${kk(t.click2 - tick)};` +
                `${kk(t.click2)};${kk(t.click2 + TOUR.CLICK)};${kk(t.click2 + TOUR.CLICK + tick)};1`,
    },
  }

  /**
   * Uma tela visível em [de, ate). O estado base é a TABELA: sem SMIL o leitor
   * recebe o quadro mais informativo da sessão, não o de partida (§0.3).
   */
  const tela = (conteudo, de, ate, base) => {
    if (STATIC) return base ? conteudo : ''
    const f = TOUR.FADE
    return tag('g', { opacity: base ? 1 : 0 },
      animate({
        attr: 'opacity',
        values: base ? '1;0;0;1;1' : '0;0;1;1;0',
        keyTimes: base ? `0;${kk(f)};${kk(de)};${kk(de + f)};1`
                       : `0;${kk(de)};${kk(de + f)};${kk(ate)};1`,
        dur: total, where: 'tela', repeat: false,
      }) + conteudo)
  }

  const selecao = STATIC ? '' : animate({
    attr: 'opacity', values: '0;0;1;1',
    keyTimes: `0;${kk(t.click1)};${kk(t.cards)};1`,
    dur: total, where: 'seleção', repeat: false,
  })

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${APP.W}" height="${APP.H}" ` +
    `viewBox="0 0 ${APP.W} ${APP.H}" role="img" ` +
    `aria-label="${PRODUCT.title} — sessão de uso gravada do BudgetXpert: o ponteiro ` +
    `abre ${PRODUCT.page} no menu, os cards de orçamento aparecem com plano, período, ` +
    `estado e barras de definição e preenchimento, e um deles revela a tabela com ` +
    `cabeçalho de ano, trimestre e mês. ${PRODUCT.badge}.">`,
    `<style>text{font-family:${TYPO.STACK}}</style>`,
    tag('rect', { x: 0, y: 0, width: APP.W, height: APP.H, fill: T.bg }),
    text(GEO.PAD, APP.TITLE_Y, T.accent, PRODUCT.title, {
      'font-size': TYPO.SIZE.section, 'font-weight': TYPO.SECTION_WEIGHT,
      'letter-spacing': TYPO.SECTION_TRACKING,
    }),
    text(APP.W - GEO.PAD, APP.TITLE_Y, T.muted, PRODUCT.badge, { 'text-anchor': 'end' }),
    tag('clipPath', { id: 'app' }, tag('rect', {
      x: APP.X, y: APP.Y, width: APP.VIEW_W, height: APP.VIEW_H, rx: APP.RX })),
    tag('g', { 'clip-path': 'url(#app)' },
      tag('rect', { x: APP.X, y: APP.Y, width: APP.VIEW_W, height: APP.VIEW_H,
        fill: UI.canvas }) +
      tela(screenCards(), t.cards, t.table, false) +
      tela(screenTable(), t.table, total, true) +
      header() + rail(selecao) +
      ponteiro(q, kk, total)),
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
