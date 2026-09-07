import { TYPO, CELL_W } from './typography.mjs'

/**
 * Meio pixel. Um stroke de 1px centrado numa coordenada inteira ocupa meio
 * pixel de cada lado e sai borrado; deslocar por 0.5 alinha à grade.
 */
/** Casas decimais em coordenada de atributo. Mais que isso engorda o arquivo
 *  sem mudar um pixel; menos desalinha a grade de células. */
const COORD_DECIMALS = 2

const HAIRLINE = 0.5

const GAP  = 12
const COLS = 2
const ROWS = 2
const PAD  = 12

/**
 * Largura travada pelo container do README, não escolhida por estética.
 *
 * Medido no CSS do Primer servido em github.com/<user> (2026-09-06):
 * .container-xl 1280px - 32px de padding por lado = 1216px; menos
 * --Layout-sidebar-width 296px e --Layout-gutter 24px = 896px de Layout-main;
 * menos 1px de borda e 32px de padding do .profile-readme por lado = 830px.
 *
 * 820 fica abaixo disso com folga. Passar de 830 faria o navegador reduzir o
 * SVG, e fora de 100% a grade de células de 6.6px, as bordas de 1px e o traço
 * de 0.75 deixam de cair em pixel inteiro.
 */
const CANVAS = Object.freeze({ W: 820, H: 520 })

const PANE_W = (CANVAS.W - GAP) / COLS // 414
const PANE_H = (CANVAS.H - GAP) / ROWS // 254

const PANE = Object.freeze({
  W: PANE_W,
  H: PANE_H,
  RX: 8,
  STROKE: 1,   // traço da moldura; o chrome recua por ele (ver lib/pane.mjs)
  CHROME_H: 26,
  PAD,
  INNER_W: PANE_W - PAD * 2, // 390
})

const DOT = Object.freeze({ R: 4.5, CY: 13, CX: Object.freeze([16, 32, 48]) })

const SPIN_DOT = Object.freeze({ R: 2.5, GAP_COLS: 2 })

const BOX = Object.freeze({
  X: PAD,
  Y: PANE.CHROME_H + PAD, // 38 — derivado
  W: PANE.INNER_W,
  H: 34,        // respiro vertical: 34 - 11px de fonte = 11.5 acima e abaixo
  RX: 6,
  PAD: 10,      // respiro horizontal — sem isto o texto encosta na borda
  STROKE: 0.75, // traço fino: 1px cheio pesa demais para uma caixa de destaque
})

// Âncoras de julgamento visual: primitivas, declaradas uma vez.
const BODY = Object.freeze({ Y: 94 })
const FOOT = Object.freeze({ Y: 236 })

/** Origem do painel i na grade COLS x ROWS. */
const paneOrigin = (i) => Object.freeze({
  x: (i % COLS) * (PANE.W + GAP),
  y: Math.floor(i / COLS) * (PANE.H + GAP),
})

/** x da coluna de caractere c, dentro de um painel. */
const colX = (c) => PAD + c * CELL_W

/** baseline y da linha de conteúdo n. */
const lineY = (n) => BODY.Y + n * TYPO.LINE_H

/** baseline y do texto dentro da caixa de status. */
const boxTextY = () => BOX.Y + BOX.H / 2 + TYPO.BASELINE_NUDGE

/** x do texto dentro da caixa de status, respeitando o padding interno. */
const boxTextX = () => BOX.X + BOX.PAD

export const GEO = Object.freeze({
  GAP, COLS, ROWS, PAD, HAIRLINE, COORD_DECIMALS, CANVAS, PANE, DOT, SPIN_DOT, BOX, BODY, FOOT,
  paneOrigin, colX, lineY, boxTextY, boxTextX,
})
