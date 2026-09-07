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
  FINALE_AT, ERASE, ERASE_END, KEYTIME_DECIMALS, phaseStart, k, ROSTER,
} from './lib/constants/index.mjs'
import { LIMITS } from './lib/constants/index.mjs'
import { assertWidth, assertLineCount, assertBudget } from './lib/assert.mjs'
import { tag, text, animate, esc } from './lib/svg.mjs'

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
  // Absoluto, não relativo à fase: os quatro painéis apagam juntos no fim.
  const eS = ERASE.at + idx * ERASE.step                 // começa a apagar
  const eE = eS + ERASE.dur                              // apagado
  const f = TIME.CURSOR_FADE_S
  const id = `c-${i}-${idx}`

  // width no markup = revelado. Sem SMIL a linha aparece inteira (spec §0.3).
  const clip = tag('clipPath', { id }, tag('rect', {
    x: x0, y: r.y - TYPO.SIZE.body, width: w, height: TYPO.LINE_H,
  }, animate({
    attr: 'width',
    values: `0;0;${w};${w};0;0`,
    keyTimes: `0;${k(wS)};${k(wE)};${k(eS)};${k(eE)};1`,
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
    values: `${x0};${x0};${x1.toFixed(2)};${x1.toFixed(2)};${x0};${x0}`,
    keyTimes: `0;${k(wS)};${k(wE)};${k(eS)};${k(eE)};1`,
    dur: TOTAL_S, where: `${where}/slide`,
  })
  // Visível só enquanto escreve e enquanto apaga. Entre os dois ele some, senão
  // os seis cursores do painel ficariam acesos ao mesmo tempo.
  const cursor = tag('g', { opacity: 0 },
    animate({
      attr: 'opacity', values: '0;0;1;1;0;0;1;1;0',
      keyTimes: `0;${k(wS)};${k(wS + f)};${k(wE)};${k(wE + f)};` +
                `${k(eS)};${k(eS + f)};${k(eE)};1`,
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
  if (i === 0) {
    return { values: '0;0;1;1', keyTimes: `0;${k(ERASE_END)};${k(ERASE_END + f)};1` }
  }
  return {
    values: '1;1;0;0;1;1',
    keyTimes: `0;${k(pS - f)};${k(pS)};${k(ERASE_END)};${k(ERASE_END + f)};1`,
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
  const dots = DOT.CX.map((cx, n) => tag('circle', {
    cx, cy: DOT.CY, r: DOT.R, fill: [T.dotRed, T.dotYellow, T.dotGreen][n],
  })).join('')

  const chrome =
    tag('path', {
      d: `M0 ${PANE.RX}a${PANE.RX} ${PANE.RX} 0 0 1 ${PANE.RX} -${PANE.RX}` +
         `h${PANE.W - PANE.RX * 2}a${PANE.RX} ${PANE.RX} 0 0 1 ${PANE.RX} ${PANE.RX}` +
         `v${PANE.CHROME_H - PANE.RX}H0Z`,
      fill: T.chrome,
    }) + dots +
    text(GEO.colX(DOT.CX[2] / CELL_W + 1), DOT.CY + TYPO.BASELINE_NUDGE,
         AGENT_HUE[agent.id], agent.title)

  const box = tag('rect', {
    x: BOX.X, y: BOX.Y, width: BOX.W, height: BOX.H, rx: BOX.RX,
    fill: 'none', stroke: AGENT_HUE[agent.id], 'stroke-width': BOX.STROKE,
  })

  const content = rows(agent, data)
    .map((r, idx) => revealRow(i, r, idx, agent.id)).join('')

  return tag('g', { transform: `translate(${o.x} ${o.y})` },
    tag('title', {}, esc(`${agent.title} — ${agent.lines(data).join(' | ')}`)) +
    tag('rect', {
      x: GEO.HAIRLINE, y: GEO.HAIRLINE,
      width: PANE.W - GEO.HAIRLINE * 2, height: PANE.H - GEO.HAIRLINE * 2, rx: PANE.RX,
      fill: T.pane, stroke: T.border,
    }) + chrome + box + content + spinner(i) + veil(i))
}

const main = () => {
  const data = JSON.parse(readFileSync(IN, 'utf8'))
  console.log(`-> lido ${IN}`)

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${GEO.CANVAS.W}" height="${GEO.CANVAS.H}" ` +
    `viewBox="0 0 ${GEO.CANVAS.W} ${GEO.CANVAS.H}" role="img" ` +
    `aria-label="Quatro agentes de terminal se apresentando em revezamento: ` +
    `identidade, números do perfil, stack e contato.">`,
    `<style>text{font-family:${TYPO.STACK};font-size:${TYPO.SIZE.body}px}</style>`,
    tag('rect', { x: 0, y: 0, width: GEO.CANVAS.W, height: GEO.CANVAS.H, fill: T.bg }),
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
