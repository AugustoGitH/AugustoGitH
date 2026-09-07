import { GEO } from './geometry.mjs'
import { TYPO, CELL_W } from './typography.mjs'

/**
 * Geometria da Seção 2.
 *
 * A altura é imposta, não escolhida: a cidade precisa ser visível junto com a
 * Seção 1. Numa página de perfil em 1080p sobram ~720px de conteúdo; com a
 * Seção 1 em 520px e 16px de espaçamento, restam 184px.
 *
 * E a restrição empurra para a proporção certa. 53 prédios em 796px dão 13px de
 * largura; com 96px de altura o mais alto fica em 1:7.4, proporção de
 * arranha-céu real. Uma cidade mais alta viraria um campo de agulhas verticais,
 * perdendo justamente a leitura que motivou escolher cidade.
 */
const TOP = 32          // topo do prédio mais alto — julgamento visual (§2.1)
const MAX_H = 90        // altura do prédio mais alto
const PEAK_GAP = 5      // respiro entre o rótulo do pico e o telhado

const GROUND_Y = TOP + MAX_H            // 122
const MONTH_Y  = GROUND_Y + 14          // 136
const STATUS_Y = MONTH_Y + 18           // 154

export const CITY = Object.freeze({
  W: GEO.CANVAS.W,                      // mesma largura da Seção 1
  H: STATUS_Y + 22,                     // 180 — derivado do empilhamento
  PAD: GEO.PAD,
  TOP, MAX_H, PEAK_GAP, GROUND_Y, MONTH_Y, STATUS_Y,

  /** Título e rótulo do pico dividem a mesma linha de base, acima dos telhados:
   *  título à esquerda, valor do pico sobre o prédio mais alto. O espaço já
   *  existia vazio — o título não custou altura de canvas. */
  TITLE_Y: TOP - PEAK_GAP,              // 27
  PEAK_LABEL_Y: TOP - PEAK_GAP,         // 27

  /** Copy do título. Mantém o motivo de prompt que era markdown, agora dentro
   *  da imagem, onde a tipografia é nossa. */
  TITLE: '$ git log --graph --since=1.year',
  STREET: 2,                            // rua entre prédios

  /** Vão entre blocos de dia. Recortado de dentro do bloco: a POSIÇÃO de cada
   *  bloco vem da altura exata, então a altura total do prédio nunca muda. */
  BAND_GAP: 0.6,

  /** Altura mínima desenhada de um bloco. Um dia de 1 commit mede 0.48px na
   *  escala — invisível. Um dia ativo que some é o desenho mentindo. Isso
   *  transborda no vão acima, jamais na altura do prédio. */
  MIN_BAND: 1.0,

  PARTIAL_OPACITY: 0.45,                // semana corrente, ainda incompleta
  PARTIAL_CAP_GAP: 3,                   // vão entre o telhado em obra e o tracejado
  AVG_OPACITY: 0.5,                     // a linha da média é referência, não dado
  AVG_LABEL_GAP: 4,                     // respiro entre o rótulo e a linha
  DAYS_PER_WEEK: 7,                     // semana completa; menos que isso é parcial
  AVG_DASH: '3 3',
  BUILD_DUR: 2.4,                       // varredura da construção, em segundos
})

export const cityUsableW = () => CITY.W - CITY.PAD * 2                 // 796
export const colW = (weeks) => cityUsableW() / weeks                   // 15.02
export const buildingW = (weeks) => colW(weeks) - CITY.STREET          // 13.02
export const pxPerCommit = (maxWeek) => CITY.MAX_H / maxWeek           // 0.4776

/** Largura em px de um texto monoespaçado, para validar contra a área útil. */
export const textW = (s) => s.length * CELL_W
