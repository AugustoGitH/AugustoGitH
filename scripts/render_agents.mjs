/**
 * Desenha a grade de agentes (assets/agents-grid.svg).
 *
 * Quatro painéis de terminal em 2x2. Os agentes se revezam num loop de TOTAL_S
 * segundos: cada um digita seu bloco, passa o contexto ao próximo, e o último
 * devolve ao primeiro.
 *
 * O SVG é auto-contido: sem JS, sem CSS externo, sem webfont — o único tipo de
 * animação que o GitHub deixa passar dentro de <img>.
 *
 * Uso:
 *   node scripts/render_agents.mjs
 *   STATIC=1 node scripts/render_agents.mjs   # quadro congelado, sem <animate>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import {
  T, AGENT_HUE, TYPO, CELL_W, GEO, TIME, TOTAL_S, CUE, CURSOR_DUTY, SPIN,
  FINALE_AT, GROW, splitAt, GROW_END, KEYTIME_DECIMALS, phaseStart, k, ROSTER,
} from './lib/constants/index.mjs'
import { LIMITS } from './lib/constants/index.mjs'
import { assertWidth, assertLineCount, assertBudget } from './lib/assert.mjs'
import { tag, text, animate, esc } from './lib/svg.mjs'
import { paneFrame, paneChrome } from './lib/pane.mjs'

const IN = 'data/profile.json'
const OUT = 'assets/agents-grid.svg'
const STATIC = process.env.STATIC === '1'

const { PANE, BOX, DOT, SPIN_DOT, FOOT } = GEO

/** Monta as linhas animáveis de um painel, já validadas. */
function rows(agent, data) {
  const lines = assertLineCount(agent.lines(data), agent.id)
  const hue = AGENT_HUE[agent.id]
  const out = [{
    text: agent.box(data), x: GEO.boxTextX(), y: GEO.boxTextY(),
    at: CUE.box.at, dur: CUE.box.dur, fill: hue, max: LIMITS.MAX_BOX_COLS,
  }]
  lines.forEach((l, n) => out.push({
    text: l, x: GEO.colX(0), y: GEO.lineY(n),
    at: CUE.lineFrom + n * CUE.lineStep, dur: CUE.lineDur,
    fill: l.startsWith('>') ? T.ink : T.dim,
  }))
  out.push({
    text: agent.foot(data), x: GEO.colX(0), y: FOOT.Y,
    at: CUE.foot.at, dur: CUE.foot.dur, fill: T.muted,
  })
  for (const r of out) assertWidth(r.text, agent.id, r.max)
  return out
}

/**
 * Linha revelada por um clip que abre, com cursor de bloco correndo na borda.
 *
 * Apagar usa a mesma mecânica invertida: o clip encolhe da direita para a
 * esquerda e o cursor volta junto, como um backspace. Nada de a linha
 * desaparecer por outro caminho que não o que a escreveu.
 */
function revealRow(i, r, idx, agentId) {
  const where = `${agentId}/${idx}`
  const hue = AGENT_HUE[agentId]
  const x0 = r.x
  const x1 = r.x + r.text.length * CELL_W
  const w = (x1 - x0).toFixed(2)
  const body = text(x0, r.y, r.fill, r.text)

  if (STATIC) return body

  const p0 = phaseStart(i)
  const wS = p0 + r.at                                   // começa a escrever
  const wE = wS + r.dur                                  // escrito
  const f = TIME.CURSOR_FADE_S
  const id = `c-${i}-${idx}`

  // width no markup = revelado. Sem SMIL a linha aparece inteira (spec §0.3).
  const clip = tag('clipPath', { id }, tag('rect', {
    x: x0, y: r.y - TYPO.SIZE.body, width: w, height: TYPO.LINE_H,
  }, animate({
    attr: 'width',
    values: `0;0;${w};${w}`,
    keyTimes: `0;${k(wS)};${k(wE)};1`,
    dur: TOTAL_S, where: `${where}/clip`,
  })))

  // Cursor: opacidade de fase no <g>, piscar no <rect>. Duas <animate> no mesmo
  // atributo do mesmo elemento entrariam em conflito.
  const blink = animate({
    attr: 'opacity', ...CURSOR_DUTY,
    dur: TIME.CURSOR_BLINK_S, where: `${where}/blink`,
  })
  const slide = animate({
    attr: 'x',
    values: `${x0};${x0};${x1.toFixed(2)};${x1.toFixed(2)}`,
    keyTimes: `0;${k(wS)};${k(wE)};1`,
    dur: TOTAL_S, where: `${where}/slide`,
  })
  // Visível só enquanto escreve e enquanto apaga. Entre os dois ele some, senão
  // os seis cursores do painel ficariam acesos ao mesmo tempo.
  const cursor = tag('g', { opacity: 0 },
    animate({
      attr: 'opacity', values: '0;0;1;1;0;0',
      keyTimes: `0;${k(wS)};${k(wS + f)};${k(wE)};${k(wE + f)};1`,
      dur: TOTAL_S, where: `${where}/cursor`,
    }) +
    tag('rect', {
      x: x1, y: r.y - TYPO.SIZE.body + 1, width: CELL_W, height: TYPO.SIZE.body + 1,
      fill: hue,
    }, slide + blink))

  return clip + tag('g', { 'clip-path': `url(#${id})` }, body) + cursor
}

/**
 * Opacidade do véu do painel i ao longo do loop.
 *
 * O painel fica claro em duas janelas: durante o seu próprio turno, e no final,
 * quando a grade inteira acende com os quatro painéis preenchidos. Entre elas
 * ele segura o conteúdo já escrito, rebaixado — como um pane de tmux que
 * terminou de rodar.
 */
function veilFrames(i) {
  const a = T.veilAlpha
  const f = TIME.VEIL_FADE_S
  const pS = phaseStart(i)
  const outAt = pS + CUE.dim.at
  const dimAt = outAt + CUE.dim.dur
  const finIn = FINALE_AT - f

  // No último agente a janela própria encosta no finale: viram uma só.
  if (dimAt >= finIn) {
    const start = Math.max(0, pS - f)
    return { values: `${a};${a};0;0`, keyTimes: `0;${k(start)};${k(start + f)};1` }
  }
  // O primeiro já começa claro — não há fade de entrada a animar.
  if (i === 0) {
    return {
      values: `0;0;${a};${a};0;0`,
      keyTimes: `0;${k(outAt)};${k(dimAt)};${k(finIn)};${k(FINALE_AT)};1`,
    }
  }
  return {
    values: `${a};${a};0;0;${a};${a};0;0`,
    keyTimes: `0;${k(pS - f)};${k(pS)};${k(outAt)};${k(dimAt)};` +
              `${k(finIn)};${k(FINALE_AT)};1`,
  }
}

/**
 * Visibilidade do spinner de espera.
 *
 * Só enquanto o painel ainda não falou, e de novo depois da limpeza — que são
 * exatamente os momentos em que ele está vazio. Depois de escrever, o painel
 * tem saída própria e não precisa fingir que está processando.
 */
function spinnerFrames(i) {
  const f = TIME.VEIL_FADE_S
  const pS = phaseStart(i)
  // Só enquanto o painel ainda não falou — depois ele tem saída própria, e no
  // fim a seção se multiplica em vez de esvaziar.
  if (i === 0) return { values: '0;0', keyTimes: '0;1' }
  return {
    values: '1;1;0;0',
    keyTimes: `0;${k(pS - f)};${k(pS)};1`,
  }
}

/** Véu que rebaixa o painel fora das suas janelas claras. */
function veil(i) {
  if (STATIC) return ''
  return tag('rect', {
    x: 0, y: 0, width: PANE.W, height: PANE.H, rx: PANE.RX, fill: T.veil, opacity: 0,
  }, animate({ attr: 'opacity', ...veilFrames(i), dur: TOTAL_S, where: `veil/${i}` }))
}

/**
 * Spinner de espera: três pontos em perseguição no rodapé.
 *
 * Três, e não os 8 quadros de um spinner por <set>: um terço dos elementos, e
 * sem SMIL degrada para três pontos parados em vez de nada visível.
 */
function spinner(i) {
  if (STATIC) return ''
  const dots = [0, 1, 2].map((n) => {
    const base = n / DOT.CX.length
    const a = (base + SPIN.lead).toFixed(KEYTIME_DECIMALS)
    const b = (base + SPIN.peak).toFixed(KEYTIME_DECIMALS)
    const c = (base + SPIN.trail).toFixed(KEYTIME_DECIMALS)
    return tag('circle', {
      cx: GEO.colX(n * SPIN_DOT.GAP_COLS) + SPIN_DOT.R, cy: FOOT.Y - TYPO.BASELINE_NUDGE,
      r: SPIN_DOT.R, fill: T.muted, opacity: T.spinnerLow,
    }, animate({
      attr: 'opacity',
      values: `${T.spinnerLow};${T.spinnerLow};1;${T.spinnerLow};${T.spinnerLow}`,
      keyTimes: `0;${a};${b};${c};1`,
      dur: TIME.SPINNER_S, where: `spin/${i}/${n}`,
    }))
  }).join('')
  return tag('g', { opacity: 0 },
    animate({ attr: 'opacity', ...spinnerFrames(i), dur: TOTAL_S, where: `spin/${i}` }) + dots)
}

function pane(i, agent, data) {
  const o = GEO.paneOrigin(i)
  const rect = { x: 0, y: 0, w: PANE.W, h: PANE.H }

  const box = tag('rect', {
    x: BOX.X, y: BOX.Y, width: BOX.W, height: BOX.H, rx: BOX.RX,
    fill: 'none', stroke: AGENT_HUE[agent.id], 'stroke-width': BOX.STROKE,
  })
  const content = rows(agent, data)
    .map((r, idx) => revealRow(i, r, idx, agent.id)).join('')

  const cheio = paneFrame(PANE.W, PANE.H) +
    paneChrome(PANE.W, agent.title, AGENT_HUE[agent.id]) +
    box + content + spinner(i) + veil(i)

  // Cada nível entra quando o SEU agente termina de falar, não quando todos
  // terminam: a frota cresce durante a apresentação, não depois dela.
  return tag('g', { transform: `translate(${o.x} ${o.y})` },
    tag('title', {}, esc(`${agent.title} — ${agent.lines(data).join(' | ')}`)) +
    camada(cheio, splitAt(i, 1), 0, true) +
    camada(subPaneis(rect, GROW.levels[0], agent), splitAt(i, 1), splitAt(i, 2), false) +
    camada(subPaneis(rect, GROW.levels[1], agent), splitAt(i, 2), GROW_END, false))
}


// ------------------------------------------------- multiplicação da frota

/**
 * Os sub-painéis de um agente: n x n dentro do retângulo dele.
 *
 * Não mostram conteúdo porque não cabe — em 196x121 sobram 26 colunas de texto,
 * em 92x55 sobram dez. Resta a silhueta do terminal, e a cor é a do agente de
 * quem descendem.
 */
function subPaneis(pai, n, agent) {
  const s = GEO.SUB
  const hue = AGENT_HUE[agent.id]
  return Array.from({ length: n * n }, (_, i) => {
    const p = GEO.subPane(pai, i, n)
    const ch = Math.round(p.h * s.chromeRatio)
    const rx = Math.min(GEO.PANE.RX, ch)
    const st = GEO.PANE.STROKE

    const moldura =
      tag('rect', { x: p.x + st / 2, y: p.y + st / 2, width: p.w - st, height: p.h - st,
        rx, fill: T.pane, stroke: T.border, 'stroke-width': st }) +
      tag('rect', { x: p.x + st, y: p.y + st, width: p.w - st * 2, height: ch, rx,
        fill: T.chrome }) +
      tag('rect', { x: p.x + st, y: p.y + ch, width: p.w - st * 2, height: rx, fill: T.chrome }) +
      [0, 1, 2].map((d) => tag('circle', {
        cx: p.x + s.pad + d * s.dotGap, cy: p.y + st + ch / 2, r: s.dotR,
        fill: [T.dotRed, T.dotYellow, T.dotGreen][d],
      })).join('')

    // O nível intermediário ainda carrega o endereço; o maior, só o cursor.
    const corpo = n <= s.TEXT_UNTIL / 2
      ? text(p.x + s.pad, p.y + ch + s.pad + s.titleSize, hue, agent.title,
          { 'font-size': s.titleSize }) +
        s.barWidths.map((frac, b) => tag('rect', {
          x: p.x + s.pad, y: p.y + ch + s.pad * 2 + s.titleSize + b * s.barGap,
          width: (p.w - s.pad * 2) * frac, height: s.barH,
          rx: s.barH / 2, fill: T.dim, opacity: s.barOpacity,
        })).join('')
      : cursorMini(p.x + s.pad, p.y + ch + s.pad, agent.id, hue)

    return moldura + corpo
  }).join('')
}

/**
 * O cursor de um sub-painel do nível maior.
 *
 * Animado, sai como <use> do símbolo em <defs> — assim os 64 cursores custam
 * quatro <animate> no arquivo. No quadro estático não há <defs>, e um <use>
 * apontando para nada não desenha: aí o retângulo vai direto.
 */
function cursorMini(x, y, id, hue) {
  const s = GEO.SUB
  return STATIC
    ? tag('rect', { x, y, width: s.cursorW, height: s.cursorH, fill: hue })
    : tag('use', { href: `#cur-${id}`, 'xlink:href': `#cur-${id}`, x, y })
}

/** Os quatro cursores, definidos uma vez e reusados nos 64 sub-painéis. */
function cursorDefs() {
  const s = GEO.SUB
  return tag('defs', {}, ROSTER.map((a) => tag('g', { id: `cur-${a.id}` },
    tag('rect', { x: 0, y: 0, width: s.cursorW, height: s.cursorH, fill: AGENT_HUE[a.id] },
      tag('animate', {
        attributeName: 'opacity', ...CURSOR_DUTY,
        dur: `${TIME.CURSOR_BLINK_S}s`, begin: '0s', repeatCount: 'indefinite',
      })))).join(''))
}

/** Uma camada do painel, visível em [de, ate). `base` é o estado sem SMIL. */
function camada(conteudo, de, ate, base) {
  if (STATIC) return base ? conteudo : ''
  const f = GROW.fade
  const fim = ate + f >= TOTAL_S
  return tag('g', { opacity: base ? 1 : 0 },
    animate({
      attr: 'opacity',
      values: base ? '1;1;0;0' : (fim ? '0;0;1;1;0' : '0;0;1;1;0;0'),
      keyTimes: base
        ? `0;${k(de)};${k(de + f)};1`
        : fim
          ? `0;${k(de)};${k(de + f)};${k(ate)};1`
          : `0;${k(de)};${k(de + f)};${k(ate)};${k(ate + f)};1`,
      dur: TOTAL_S, where: 'camada',
    }) + conteudo)
}

// --------------------------------------------------------------------- main

const main = () => {
  const data = JSON.parse(readFileSync(IN, 'utf8'))
  console.log(`-> lido ${IN}`)

  const svg = [
    // xmlns:xlink declarado porque <use> traz xlink:href por compatibilidade.
    // Sem a declaração o SVG vira XML inválido e o GitHub não renderiza nada.
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${GEO.CANVAS.W}" height="${GEO.CANVAS.H}" ` +
    `viewBox="0 0 ${GEO.CANVAS.W} ${GEO.CANVAS.H}" role="img" ` +
    `aria-label="Quatro agentes de terminal se apresentando em revezamento: ` +
    `identidade, números do perfil, stack e contato.">`,
    // Só a família: o tamanho vem por atributo (ver text() em lib/svg.mjs).
    `<style>text{font-family:${TYPO.STACK}}</style>`,
    tag('rect', { x: 0, y: 0, width: GEO.CANVAS.W, height: GEO.CANVAS.H, fill: T.bg }),
    STATIC ? '' : cursorDefs(),
    ...ROSTER.map((a, i) => pane(i, a, data)),
    '</svg>',
  ].join('\n')

  mkdirSync('assets', { recursive: true })
  const { bytes, animates } = assertBudget(svg)
  writeFileSync(OUT, svg + '\n', 'utf8')
  console.log(`-> ${bytes} bytes, ${animates} <animate>, loop de ${TOTAL_S}s`)
  console.log(`-> gravado ${OUT}${STATIC ? ' (estático)' : ''}`)
}

try { main() } catch (e) { console.error('!', e.message); process.exit(1) }
