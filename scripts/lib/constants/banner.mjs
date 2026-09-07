import { T } from './theme.mjs'
import { TYPO } from './typography.mjs'
import { GEO } from './geometry.mjs'

/**
 * Folha de contatos: três quadros da mesma sessão, inteiros.
 *
 * É a única seção fotográfica, e a única com asset raster. O contraste com os
 * terminais é deliberado: a página tem dois registros — a pessoa (fotográfico,
 * mesma linguagem da foto de perfil do GitHub) e o sistema (terminal). O banner
 * pertence ao primeiro, e por isso o brilho das fotos NÃO é tingido no acento.
 *
 * As fotos entram inteiras: são quadradas na origem e o conteúdo dos três
 * quadros é para ser preservado, então há reamostragem, não recorte.
 */
const PAD = GEO.PAD
const GUTTER = 8
const FRAMES = 3
const USABLE = GEO.CANVAS.W - PAD * 2
const SIDE = (USABLE - GUTTER * (FRAMES - 1)) / FRAMES // 260

/**
 * O título fica ACIMA da montagem, na mesma linha de base das Seções 2 e 3
 * (§5.3, §6.4). O estado vai à direita, na mesma linha: assim o banner não tem
 * texto embaixo dos quadros e abre a página como um cabeçalho.
 */
const TITLE_Y = 27
const TOP = 42

export const BANNER = Object.freeze({
  W: GEO.CANVAS.W,
  PAD, GUTTER, FRAMES, SIDE,
  TITLE_Y, TOP,
  H: TOP + SIDE + PAD,                      // 314 — derivado do empilhamento

  /** Número do quadro, sobre a foto — a marca da borda do filme. */
  NUM_INSET: 8,
  NUM_OPACITY: 0.75,

  /**
   * Origem e ORDEM dos quadros. Gerados por scripts/prep_banner.py, à mão (§1.1).
   *
   * A ordem de exibição não é a de geração: o quadro 03 vai ao centro e o 02 à
   * direita. A descrição acompanha a ordem para o alt nunca divergir do que
   * está desenhado.
   */
  SRC: Object.freeze([
    Object.freeze({ file: 'assets/src/frame-01.jpg',
      alt: 'agachado sobre um banco de concreto, segurando um asterisco luminoso nas mãos' }),
    Object.freeze({ file: 'assets/src/frame-03.jpg',
      alt: 'agachado no banco entre dois símbolos luminosos apoiados nele' }),
    Object.freeze({ file: 'assets/src/frame-02.jpg',
      alt: 'deitado de lado sobre o banco, com o mesmo asterisco luminoso' }),
  ]),

  /**
   * Manchete sobreposta aos três quadros.
   *
   * Sobre foto o texto não pode depender do que houver atrás, então ele vem numa
   * faixa escura de largura cheia — o strap de capa de revista. Monocromática:
   * o acento pertence ao sistema, e o banner é o registro fotográfico (§8.2).
   */
  HEADLINE: 'My Blog',
  BAND_H: 52,
  BAND_OPACITY: 0.82,
  HEADLINE_DROP: 12,        // do centro da faixa até a linha de base
  HEADLINE_AT: 1.05,        // entra depois do último quadro

  TITLE: '$ blog --status',
  STATUS: 'writing · soon',

  FADE_LEAD: 0.15,
  FADE_STEP: 0.25,
  FADE_DUR: 0.55,
})
