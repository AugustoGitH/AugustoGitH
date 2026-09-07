/**
 * Desenha o poço de stacks (assets/stack-well.svg).
 *
 * Uma partida de Tetris onde cada peça é uma tecnologia. As peças caem, encaixam
 * de forma previsível mas imperfeita, a pilha completa fica visível um instante,
 * e então desintegra de baixo para cima e recomeça.
 *
 * Não é um jogo, é um replay: sem JS (§0.2), ninguém joga.
 *
 * Substitui a parede de 32 badges do shields.io — a última dependência de
 * serviço externo do README.
 *
 * Uso:
 *   node scripts/render_stack.mjs
 *   STATIC=1 node scripts/render_stack.mjs   # pilha montada, sem <animate>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import {
  T, TYPO, CELL_W, GEO, KEYTIME_DECIMALS,
  CELL, SHORT, CATEGORIES, SHAPES, BY_RUN, WELL, PANEL, STACK_CANVAS, GAME,
  PIECE_LABEL_WEIGHT,
} from './lib/constants/index.mjs'
import { assertBudget, assertKeyframes } from './lib/assert.mjs'
import { dropPieces, stackStats } from './lib/pack.mjs'
import { tag, text, animate } from './lib/svg.mjs'
import { lighten } from './lib/color.mjs'

const IN = 'data/profile.json'
const OUT = 'assets/stack-well.svg'
const STATIC = process.env.STATIC === '1'

/**
 * A forma sai do nome, não de sorteio: a peça precisa de uma sequência
 * horizontal que caiba o rótulo. Nome curto vira O/S/Z, médio vira T/J/L,
 * longo vira I. Dentro de cada faixa há rodízio, para as sete formas
 * aparecerem sem nada ser aleatório (§1.3 exige determinismo).
 */
function formaPara(label, ordem) {
  const largura = (label.length + 1) * CELL_W
  const runs = Object.keys(BY_RUN).map(Number).sort((a, b) => a - b)
  const run = runs.find((r) => largura <= r * CELL) ?? runs.at(-1)
  const opcoes = BY_RUN[run]
  return opcoes[ordem % opcoes.length]
}

/** As 32 tecnologias, na ordem das categorias, já com forma atribuída. */
const pecas = CATEGORIES.flatMap((c) => c.items).map((nome, i) => {
  const label = SHORT[nome] ?? nome
  const cat = CATEGORIES.find((c) => c.items.includes(nome))
  return { nome, label, hue: cat.hue, grupo: cat.id, shape: formaPara(label, i) }
})

/**
 * Um bloco unitário, no estilo dos blocos do jogo: quadrado de cor sólida com
 * friso claro por dentro. `crispEdges` desliga o antialiasing — é o que dá a
 * aresta dura da pixel art, e o motivo de toda coordenada aqui ser inteira.
 */
function bloco(x, y, hue) {
  const b = WELL.BEVEL
  return tag('rect', {
    x: x + b / 2, y: y + b / 2, width: CELL - b, height: CELL - b,
    fill: hue, stroke: lighten(hue, WELL.BEVEL_LIGHTEN), 'stroke-width': b,
    'shape-rendering': 'crispEdges',
  })
}

/** Camada escura sob o bloco, inflada em OUTLINE. Ver WELL.OUTLINE. */
function contorno(x, y) {
  const o = WELL.OUTLINE
  return tag('rect', {
    x: x - o, y: y - o, width: CELL + o * 2, height: CELL + o * 2,
    fill: T.bg, 'shape-rendering': 'crispEdges',
  })
}

/** Uma peça: quatro blocos e o nome sobre a maior sequência horizontal. */
function peca(p, i, tempos, kk) {
  const forma = SHAPES[p.shape]
  const px = (c) => WELL.X + (p.col + c) * CELL
  const py = (r) => WELL.Y + (p.row + r) * CELL

  const corpo =
    // Duas camadas: contornos primeiro, preenchimentos por cima. As arestas
    // internas somem e só a silhueta da peça fica escura.
    forma.cells.map(([c, r]) => contorno(px(c), py(r))).join('') +
    forma.cells.map(([c, r]) => bloco(px(c), py(r), p.hue)).join('') +
    text(px(forma.runCol + forma.run / 2), py(forma.runRow) + CELL / 2 + TYPO.BASELINE_NUDGE,
      T.bg, p.label, { 'text-anchor': 'middle', 'font-weight': PIECE_LABEL_WEIGHT })

  if (STATIC) return tag('g', {}, corpo)

  // Queda em passos: uma fileira por vez, como no jogo. calcMode="discrete"
  // segura cada posição até o próximo keyTime, em vez de interpolar.
  const passos = p.row + p.h
  const cai = tempos.fall(i)
  const dt = (cai.end - cai.at) / passos
  const vals = [`0 ${-passos * CELL}`]
  const keys = ['0']
  for (let s = 0; s <= passos; s++) {
    vals.push(`0 ${-(passos - s) * CELL}`)
    keys.push(kk(cai.at + s * dt))
  }
  vals.push('0 0')
  keys.push('1')

  const limpa = tempos.clear(p.row + p.h - 1)
  assertKeyframes(vals.join(';'), keys.join(';'), `queda/${p.label}`)
  return tag('g', { transform: 'translate(0,0)' },
    tag('animateTransform', {
      attributeName: 'transform', type: 'translate', calcMode: 'discrete',
      values: vals.join(';'), keyTimes: keys.join(';'),
      dur: `${tempos.total}s`, begin: '0s', repeatCount: 'indefinite',
    }) +
    animate({
      attr: 'opacity', values: '1;1;0;0',
      keyTimes: `0;${kk(limpa.at)};${kk(limpa.end)};1`,
      dur: tempos.total, where: `peça/${p.label}`,
    }) + corpo)
}

/** Linha do painel: swatch, rótulo, número e barra. */
function linha(y, cor, rotulo, valor, frac) {
  return (cor ? tag('rect', {
    x: PANEL.X, y: y - PANEL.SWATCH + 1,
    width: PANEL.SWATCH, height: PANEL.SWATCH, rx: 1, fill: cor,
  }) : '') +
  text(PANEL.X + PANEL.LABEL_X, y, T.dim, rotulo) +
  text(PANEL.X + PANEL.COUNT_X, y, T.ink, valor, { 'text-anchor': 'end' }) +
  tag('rect', { x: PANEL.X + PANEL.BAR_X, y: y - PANEL.BAR_H,
    width: Math.max(1, PANEL.BAR_W * frac), height: PANEL.BAR_H,
    rx: 1, fill: cor ?? T.dim, opacity: cor ? 1 : PANEL.BAR_DIM })
}

const main = () => {
  const { langs } = JSON.parse(readFileSync(IN, 'utf8'))
  const colocadas = dropPieces(pecas, SHAPES, WELL.COLS, WELL.ROWS)
  const est = stackStats(colocadas, SHAPES, WELL.COLS, WELL.ROWS)
  const fileiras = est.usadas

  // --- ritmo, todo derivado de GAME ---
  const fimQueda = GAME.LEAD + (colocadas.length - 1) * GAME.FALL_STEP + GAME.FALL_DUR
  const inicioLimpeza = fimQueda + GAME.HOLD
  const fimLimpeza = inicioLimpeza + (fileiras - 1) * GAME.CLEAR_STEP + GAME.CLEAR_DUR
  const total = +(fimLimpeza + GAME.TAIL).toFixed(2)
  const kk = (s) => (s / total).toFixed(KEYTIME_DECIMALS)
  const tempos = {
    total,
    fall: (i) => ({ at: GAME.LEAD + i * GAME.FALL_STEP,
                    end: GAME.LEAD + i * GAME.FALL_STEP + GAME.FALL_DUR }),
    // Limpa de baixo para cima: a fileira mais funda some primeiro.
    clear: (rowFundo) => {
      const at = inicioLimpeza + (WELL.ROWS - 1 - rowFundo) * GAME.CLEAR_STEP
      return { at, end: at + GAME.CLEAR_DUR }
    },
  }

  // --- poço: paredes e fundo, boca aberta, como no jogo ---
  const paredes = tag('path', {
    d: `M${WELL.X} ${WELL.Y}V${WELL.BOTTOM}H${WELL.X + WELL.W}V${WELL.Y}`,
    fill: 'none', stroke: T.border, 'stroke-width': 1,
    'shape-rendering': 'crispEdges',
  })
  const clip = tag('clipPath', { id: 'well' }, tag('rect', {
    x: WELL.X, y: WELL.Y, width: WELL.W, height: WELL.H,
  }))
  const pilha = tag('g', { 'clip-path': 'url(#well)' },
    colocadas.map((p, i) => peca(p, i, tempos, kk)).join(''))

  // --- painel: o declarado ao lado do medido, sem hierarquia ---
  const maxCat = Math.max(...CATEGORIES.map((c) => c.items.length))
  let y = PANEL.HEAD_Y
  const decl = text(PANEL.X, y, T.muted, 'DECLARED') +
    CATEGORIES.map((c, n) => linha(
      PANEL.HEAD_Y + PANEL.HEAD_GAP + n * PANEL.ROW_H,
      c.hue, c.label, String(c.items.length), c.items.length / maxCat)).join('')

  const y2 = PANEL.HEAD_Y + PANEL.HEAD_GAP + CATEGORIES.length * PANEL.ROW_H
            - PANEL.ROW_H + PANEL.BLOCK_GAP
  const maxPct = Math.max(...langs.map((l) => l.pct))
  const med = text(PANEL.X, y2, T.muted, 'PUBLIC CODE') +
    langs.map((l, n) => linha(
      y2 + PANEL.HEAD_GAP + n * PANEL.ROW_H,
      null, l.name, `${l.pct}%`, l.pct / maxPct)).join('')

  const titulo = text(GEO.PAD, STACK_CANVAS.TITLE_Y, T.accent, STACK_CANVAS.TITLE, {
    'font-size': TYPO.SIZE.section,
    'font-weight': TYPO.SECTION_WEIGHT,
    'letter-spacing': TYPO.SECTION_TRACKING,
  })

  const nomes = CATEGORIES.map((c) => `${c.label}: ${c.items.join(', ')}`).join('. ')
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${STACK_CANVAS.W}" ` +
    `height="${STACK_CANVAS.H}" viewBox="0 0 ${STACK_CANVAS.W} ${STACK_CANVAS.H}" ` +
    `role="img" aria-label="${STACK_CANVAS.TITLE} — ${pecas.length} tecnologias ` +
    `empilhadas como peças de Tetris, agrupadas por categoria. ${nomes}.">`,
    `<style>text{font-family:${TYPO.STACK};font-size:${TYPO.SIZE.body}px}</style>`,
    tag('rect', { x: 0, y: 0, width: STACK_CANVAS.W, height: STACK_CANVAS.H, fill: T.bg }),
    STATIC ? '' : clip,
    titulo + paredes + pilha + decl + med,
    '</svg>',
  ].join('\n')

  mkdirSync('assets', { recursive: true })
  const { bytes, animates } = assertBudget(svg)
  writeFileSync(OUT, svg + '\n', 'utf8')
  console.log(`-> ${colocadas.length} peças | ${fileiras} fileiras | ${est.buracos} buracos | loop ${total}s`)
  console.log(`-> ${bytes} bytes, ${animates} animações`)
  console.log(`-> gravado ${OUT}${STATIC ? ' (estático)' : ''}`)
}

try { main() } catch (e) { console.error('!', e.message); process.exit(1) }
