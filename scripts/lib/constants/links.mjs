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

/**
 * O terminal encurtou: a lista de endereços saiu dele e virou peça clicável.
 *
 * Um <a> envolve a imagem inteira e dá um destino só, e o GitHub remove <a> de
 * dentro do SVG — então quatro alvos exigem quatro arquivos. Em vez de duplicar
 * os endereços (uma vez no terminal, outra nas peças), o terminal ficou com o
 * que só ele pode dizer: o comando e o prompt devolvido.
 */
export const LINKS_PANE = Object.freeze({
  W: GEO.CANVAS.W,
  RX: GEO.PANE.RX,
  CHROME_H,
  PAD,
  TITLE: 'agent://liaison',
  HUE: AGENT_HUE.liaison,

  CMD_Y: CHROME_H + 30,          // 56
  PROMPT_GAP: 30,                // do comando até o prompt
  PROMPT: 'augusto@westphal:~$',
})

export const LINKS_CANVAS = Object.freeze({
  W: GEO.CANVAS.W,
  H: LINKS_PANE.CMD_Y + LINKS_PANE.PROMPT_GAP + 24,   // 110 — derivado
})

/**
 * As quatro peças de contato.
 *
 * Cada uma herda a cor do agente correspondente da Seção 1, para a fileira ler
 * como quatro coisas distintas em vez de quatro botões iguais. E cada uma pisca
 * num ritmo levemente diferente: em uníssono pareceriam um só elemento
 * cintilando; fora de fase, parecem quatro processos vivos.
 */
export const TILE = Object.freeze({
  // 4 x 194 + o espaço em branco entre <img> inline cabe nos 796 úteis. A
  // largura sai do endereço mais longo (32 colunas) com folga para variação de
  // avanço entre as fontes monoespaçadas do sistema.
  W: 194,
  H: 46,
  RX: 6,
  PAD: 6,
  STROKE: 0.75,
  LABEL_Y: 20,
  ADDR_Y: 36,
  ADDR_SIZE: 9,          // o endereço mais longo tem 32 colunas e precisa caber
  CURSOR_GAP: 1,         // colunas entre o rótulo e o cursor
})

export const TILES = Object.freeze([
  Object.freeze({ id: 'portfolio', hue: AGENT_HUE.scout,   blink: 1.06, from: 'blog' }),
  Object.freeze({ id: 'linkedin',  hue: AGENT_HUE.analyst, blink: 1.22,
                  addr: CONTACT.linkedin, href: `https://${CONTACT.linkedin}` }),
  Object.freeze({ id: 'github',    hue: AGENT_HUE.builder, blink: 0.94, from: 'login' }),
  Object.freeze({ id: 'email',     hue: AGENT_HUE.liaison, blink: 1.14,
                  addr: CONTACT.email, href: `mailto:${CONTACT.email}` }),
])

export const LINKS_TIME = Object.freeze({
  CMD_AT: 0.1,          // a linha de comando, antes de tudo
  LEAD: 0.7,            // primeiro endereço
  STEP: 0.45,           // entre endereços
  DUR: 0.35,            // varredura de cada linha
  PROMPT_GAP: 0.5,      // do último endereço até o prompt
  CURSOR_BLINK: 1.06,   // igual ao da Seção 1 — é o mesmo terminal
})
