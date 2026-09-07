import { T, AGENT_HUE } from './theme.mjs'
import { TYPO, CELL_W } from './typography.mjs'
import { GEO } from './geometry.mjs'

/**
 * Endereços que a API do GitHub não expõe.
 *
 * O e-mail vinha do cartão anterior — existia SÓ dentro do banner PNG, em
 * pixels, e teria sumido com o arquivo (ver README-LEGADO.md §1.2).
 */
export const CONTACT = Object.freeze({
  linkedin: 'linkedin.com/in/augusto-westphal',
  email: 'augustoc.westphal.ltda@gmail.com',
})

/** Alvos verificados na coleta. Um deles morto aborta o pipeline (§7.4). */
export const PROBE = Object.freeze([
  Object.freeze({ id: 'portfolio', from: 'blog' }),
  Object.freeze({ id: 'linkedin', url: `https://${CONTACT.linkedin}` }),
  Object.freeze({ id: 'github', from: 'login' }),
])

const PAD = GEO.PAD
const CHROME_H = GEO.PANE.CHROME_H
const LABEL_COLS = 12   // largura da coluna de rótulo, em colunas de texto

export const LINKS_PANE = Object.freeze({
  W: GEO.CANVAS.W,
  RX: GEO.PANE.RX,
  CHROME_H,
  PAD,
  TITLE: 'agent://liaison',
  HUE: AGENT_HUE.liaison, // o agente que fecha o loop da Seção 1 fecha a página
  LABEL_X: PAD + CELL_W * 2,
  VALUE_X: PAD + CELL_W * (2 + LABEL_COLS),

  CMD_Y: CHROME_H + 30,                       // 56 — a linha de comando
  FIRST_Y: CHROME_H + 30 + 30,                // 86 — primeiro endereço
  ROW_H: 22,                                  // mais arejado que o corpo: é o fecho
  PROMPT_GAP: 30,                             // do último endereço até o prompt
  PROMPT: 'augusto@westphal:~$',
})

export const LINKS_CANVAS = Object.freeze({
  W: GEO.CANVAS.W,
  // 4 endereços + prompt; altura sai do empilhamento, não é escolhida
  H: LINKS_PANE.FIRST_Y + LINKS_PANE.ROW_H * 3 + LINKS_PANE.PROMPT_GAP + PAD * 2,
})

export const LINKS_TIME = Object.freeze({
  CMD_AT: 0.1,          // a linha de comando, antes de tudo
  LEAD: 0.7,            // primeiro endereço
  STEP: 0.45,           // entre endereços
  DUR: 0.35,            // varredura de cada linha
  PROMPT_GAP: 0.5,      // do último endereço até o prompt
  CURSOR_BLINK: 1.06,   // igual ao da Seção 1 — é o mesmo terminal
})
