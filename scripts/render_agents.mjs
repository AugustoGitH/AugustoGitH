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
  FINALE_AT, GROW, paneAt, FILL_END, GROW_END, KEYTIME_DECIMALS, phaseStart, k, ROSTER,
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
  const w = (r.text.length * CELL_W).toFixed(2)
  const body = text(r.x, r.y, r.fill, r.text)
  if (STATIC) return body

  const wS = phaseStart(i) + r.at
  const wE = wS + r.dur
  const id = `c-${i}-${idx}`

  // width no markup = revelado. Sem SMIL a linha aparece inteira (§0.3).
  const clip = tag('clipPath', { id }, tag('rect', {
    x: r.x, y: r.y - TYPO.SIZE.body, width: w, height: TYPO.LINE_H,
  }, animate({
    attr: 'width', values: `0;0;${w};${w}`,
    keyTimes: `0;${k(wS)};${k(wE)};1`,
    dur: TOTAL_S, where: `${where}/clip`,
  })))

  return clip + tag('g', { 'clip-path': `url(#${id})` }, body)
}

/**
 * UM cursor por painel, que anda de linha em linha.
 *
 * Antes havia um cursor por linha — seis por painel, três animações cada, 72 no
 * total. Um terminal de verdade tem um cursor só, e ele se move: `x` desliza
 * dentro da linha e volta para o começo da próxima, `y` salta em degraus.
 *
 * Quatro animações por painel no lugar de dezoito.
 */
function cursorDoPainel(i, linhas, agentId) {
  if (STATIC) return ''
  const hue = AGENT_HUE[agentId]
  const janelas = linhas.map((r) => ({
    de: phaseStart(i) + r.at,
    ate: phaseStart(i) + r.at + r.dur,
    x0: r.x,
    x1: r.x + r.text.length * CELL_W,
    y: r.y,
  }))
  const primeiro = janelas[0]
  const ultimo = janelas.at(-1)

  const xs = [primeiro.x0]
  const ys = [primeiro.y]
  const tx = ['0']
  const ty = ['0']
  for (const j of janelas) {
    xs.push(j.x0.toFixed(2), j.x1.toFixed(2))
    tx.push(k(j.de), k(j.ate))
    ys.push(j.y)
    ty.push(k(j.de))
  }
  xs.push(ultimo.x1.toFixed(2)); tx.push('1')
  ys.push(ultimo.y); ty.push('1')

  const f = TIME.CURSOR_FADE_S
  return tag('g', { opacity: 0 },
    animate({
      attr: 'opacity', values: '0;0;1;1;0;0',
      keyTimes: `0;${k(primeiro.de)};${k(primeiro.de + f)};${k(ultimo.ate)};${k(ultimo.ate + f)};1`,
      dur: TOTAL_S, where: `${agentId}/cursor`,
    }) +
    tag('rect', {
      x: primeiro.x0, y: primeiro.y - TYPO.SIZE.body + 1,
      width: CELL_W, height: TYPO.SIZE.body + 1, fill: hue,
    },
      animate({ attr: 'x', values: xs.join(';'), keyTimes: tx.join(';'),
        dur: TOTAL_S, where: `${agentId}/cursor/x` }) +
      // y salta: o cursor não desliza na diagonal entre uma linha e a próxima.
      tag('animate', {
        attributeName: 'y', calcMode: 'discrete',
        values: ys.map((v) => v - TYPO.SIZE.body + 1).join(';'), keyTimes: ty.join(';'),
        dur: `${TOTAL_S}s`, begin: '0s', repeatCount: 'indefinite',
      }) +
      tag('animate', {
        attributeName: 'opacity', ...CURSOR_DUTY,
        dur: `${TIME.CURSOR_BLINK_S}s`, begin: '0s', repeatCount: 'indefinite',
      })))
}

/**
 * Opacidade do véu do painel i ao longo do loop.
 *
 * Claro no seu turno e de novo no final, quando os quatro acendem juntos com
 * tudo escrito. Entre as duas janelas ele segura o conteúdo, rebaixado — como
 * um pane de tmux que terminou de rodar.
 */
function veilFrames(i) {
  const a = T.veilAlpha
  const f = TIME.VEIL_FADE_S
  const pS = phaseStart(i)
  const outAt = pS + CUE.dim.at
  const dimAt = outAt + CUE.dim.dur
  const finIn = FINALE_AT - f

  if (dimAt >= finIn) {
    const start = Math.max(0, pS - f)
    return { values: `${a};${a};0;0`, keyTimes: `0;${k(start)};${k(start + f)};1` }
  }
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

/** O spinner só enquanto o painel ainda não falou — depois ele tem saída própria. */
function spinnerFrames(i) {
  const f = TIME.VEIL_FADE_S
  const pS = phaseStart(i)
  if (i === 0) return { values: '0;0', keyTimes: '0;1' }
  return { values: '1;1;0;0', keyTimes: `0;${k(pS - f)};${k(pS)};1` }
}

/** Véu que rebaixa o painel fora das suas janelas claras. */
function veil(i) {
  if (STATIC) return ''
  return tag('rect', {
    x: 0, y: 0, width: PANE.W, height: PANE.H, rx: PANE.RX, fill: T.veil, opacity: 0,
  }, animate({ attr: 'opacity', ...veilFrames(i), dur: TOTAL_S, where: `veil/${i}` }))
}

/** Três pontos em perseguição no rodapé, enquanto o painel espera a vez. */
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

/** Um dos quatro painéis principais, com o conteúdo escrito. */
function pane(i, agent, data) {
  const o = GEO.paneOrigin(i)
  const linhas = rows(agent, data)

  const box = tag('rect', {
    x: BOX.X, y: BOX.Y, width: BOX.W, height: BOX.H, rx: BOX.RX,
    fill: 'none', stroke: AGENT_HUE[agent.id], 'stroke-width': BOX.STROKE,
  })

  return tag('g', { transform: `translate(${o.x} ${o.y})` },
    tag('title', {}, esc(`${agent.title} — ${agent.lines(data).join(' | ')}`)) +
    paneFrame(PANE.W, PANE.H) +
    paneChrome(PANE.W, agent.title, AGENT_HUE[agent.id]) +
    box +
    linhas.map((r, idx) => revealRow(i, r, idx, agent.id)).join('') +
    cursorDoPainel(i, linhas, agent.id) +
    spinner(i) + veil(i))
}

// ------------------------------------------------- multiplicação da frota

/**
 * A grade de 64, montada de um em um em ordem de leitura.
 *
 * Cada painel tem a sua própria entrada — é isso que faz a grade se montar em
 * vez de aparecer pronta. Custa uma animação por painel, e é o que o efeito
 * exige: aritmético, mais um, mais um.
 *
 * Não mostram conteúdo porque não cabe: em 92x55 sobram dez colunas de texto.
 * Resta a silhueta do terminal, e a cor é a do agente de quem descendem.
 */
function grade() {
  const s = GEO.SUB
  const n = GROW.cols
  return Array.from({ length: n * n }, (_, idx) => {
    const p = GEO.gridPane(idx, n)
    const agent = ROSTER[GEO.parentAgent(idx, n)]
    const hue = AGENT_HUE[agent.id]
    const ch = Math.round(p.h * s.chromeRatio)
    const rx = Math.min(GEO.PANE.RX, ch)
    const st = GEO.PANE.STROKE

    const corpo =
      tag('rect', { x: p.x + st / 2, y: p.y + st / 2, width: p.w - st, height: p.h - st,
        rx, fill: T.pane, stroke: T.border, 'stroke-width': st }) +
      tag('rect', { x: p.x + st, y: p.y + st, width: p.w - st * 2, height: ch, rx,
        fill: T.chrome }) +
      tag('rect', { x: p.x + st, y: p.y + ch, width: p.w - st * 2, height: rx, fill: T.chrome }) +
      [0, 1, 2].map((d) => tag('circle', {
        cx: p.x + s.pad + d * s.dotGap, cy: p.y + st + ch / 2, r: s.dotR,
        fill: [T.dotRed, T.dotYellow, T.dotGreen][d],
      })).join('') +
      cursorMini(p.x + s.pad, p.y + ch + s.pad, agent.id, hue)

    if (STATIC) return ''
    const at = paneAt(idx)
    return tag('g', { opacity: 0 }, animate({
      attr: 'opacity', values: '0;0;1;1;0',
      keyTimes: `0;${k(at)};${k(at + GROW.fade)};${k(GROW_END)};1`,
      dur: TOTAL_S, where: `grade/${idx}`,
    }) + corpo)
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

/** Os quatro grandes se dissolvem no tempo em que a grade se monta. */
function grandes(conteudo) {
  if (STATIC) return conteudo
  return tag('g', { opacity: 1 }, animate({
    attr: 'opacity', values: '1;1;0;0',
    keyTimes: `0;${k(GROW.at)};${k(FILL_END)};1`,
    dur: TOTAL_S, where: 'grandes',
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
    grandes(ROSTER.map((a, i) => pane(i, a, data)).join('')),
    grade(),
    '</svg>',
  ].join('\n')

  mkdirSync('assets', { recursive: true })
  const { bytes, animates } = assertBudget(svg)
  writeFileSync(OUT, svg + '\n', 'utf8')
  console.log(`-> ${bytes} bytes, ${animates} <animate>, loop de ${TOTAL_S}s`)
  console.log(`-> gravado ${OUT}${STATIC ? ' (estático)' : ''}`)
}

try { main() } catch (e) { console.error('!', e.message); process.exit(1) }
