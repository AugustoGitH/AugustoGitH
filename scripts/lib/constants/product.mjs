import { GEO } from './geometry.mjs'
import { BANNER } from './banner.mjs'

/**
 * Preview de produto: uma sessão de uso gravada, somente leitura.
 *
 * O cursor percorre a interface — clica em Budgets, vê os cards, abre um budget
 * e chega na tabela. Nada é interativo: sem JS (§0.2), é um replay, como a
 * partida da Seção 3.
 *
 * **Nada de dado real entra.** Os repositórios são privados e da organização, e
 * o conteúdo pertence aos clientes. O que é fiel aqui é a ESTRUTURA — navegação,
 * hierarquia da tabela, estados, cores — lida do código em 2026-09-07. Os
 * números são amostra, e a moldura diz isso.
 *
 * Este arquivo é o molde: trocar de produto é trocar PRODUCT, NAV, CARDS e
 * TABLE. A mecânica do cursor e das telas não sabe qual produto está desenhando.
 */
export const PRODUCT = Object.freeze({
  name: 'BudgetXpert',
  tagline: 'Results Management Software',
  url: 'budgetxpert.com',
  title: '$ open ~/work/budgetxpert --preview',
  badge: 'preview · sample data',
})

/** Sidebar real, de src/components/navigations/Sidebar/constants.ts. */
export const NAV = Object.freeze([
  Object.freeze({ label: 'Home' }),
  Object.freeze({ label: 'Plans' }),
  Object.freeze({ label: 'Categories' }),
  Object.freeze({ label: 'Premises' }),
  Object.freeze({ label: 'Budgets' }),
  Object.freeze({ label: 'Analyses' }),
  Object.freeze({ label: 'AI Xpert' }),
])
export const NAV_TARGET = 4 // Budgets

/**
 * Paleta do produto, de tailwind.config.ts.
 *
 * Não é a do README, de propósito: repintar o budgetXpert de terracota
 * deturparia o produto. A coisa parece com ela mesma — mesma lógica das fotos
 * em preto e branco do banner.
 */
export const UI = Object.freeze({
  main:     '#062D3E',
  second:   '#19B09F',
  third:    '#62636C',
  fourth:   '#F26522',
  surface:  '#FFFFFF',
  canvas:   '#F4F6F8',
  line:     '#D8D9E0',
  lineSoft: '#ECEFF3',
  ink:      '#1B2733',
  dim:      '#62636C',
  faint:    '#8A8F98',
  selected: '#1D4253',
  hovered:  '#E2F4FF',
  state: Object.freeze({
    running: Object.freeze({ fg: '#00acc1', bg: '#b2ebf2' }),
    indraft: Object.freeze({ fg: '#ba68c8', bg: '#edd7f2' }),
    closed:  Object.freeze({ fg: '#7e57c2', bg: '#dcd7ee' }),
  }),
})

/** Cards do BudgetCard: name, state, qtVersion. Valores são amostra. */
export const CARDS = Object.freeze([
  Object.freeze({ name: 'FY26 Operating', state: 'running', versions: 3 }),
  Object.freeze({ name: 'FY26 Capex', state: 'indraft', versions: 1 }),
  Object.freeze({ name: 'FY25 Closing', state: 'closed', versions: 4 }),
])
export const CARD_TARGET = 0

/**
 * Tabela: Categories e Premises aninhados por `level`, colunas de período.
 * Estrutura fiel; números de amostra.
 */
export const TABLE = Object.freeze({
  periods: Object.freeze(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']),
  versions: Object.freeze(['v1', 'v2', 'v3']),
  rows: Object.freeze([
    Object.freeze({ label: 'Operating Expenses', level: 0, kind: 'category',
      cells: Object.freeze(['412.0', '418.5', '431.2', '427.9', '440.1', '452.6']) }),
    Object.freeze({ label: 'Headcount', level: 1, kind: 'premise',
      cells: Object.freeze(['248.0', '248.0', '256.4', '256.4', '264.8', '264.8']) }),
    Object.freeze({ label: 'Cloud & Licenses', level: 1, kind: 'premise',
      cells: Object.freeze(['96.5', '101.2', '104.7', '101.0', '104.3', '109.8']) }),
    Object.freeze({ label: 'Facilities', level: 1, kind: 'premise',
      cells: Object.freeze(['67.5', '69.3', '70.1', '70.5', '71.0', '78.0']) }),
    Object.freeze({ label: 'Revenue', level: 0, kind: 'category',
      cells: Object.freeze(['703.4', '718.9', '742.0', '751.3', '769.8', '804.2']) }),
    Object.freeze({ label: 'Subscriptions', level: 1, kind: 'premise',
      cells: Object.freeze(['612.0', '627.5', '648.0', '655.9', '671.4', '702.0']) }),
    Object.freeze({ label: 'Services', level: 1, kind: 'premise',
      cells: Object.freeze(['91.4', '91.4', '94.0', '95.4', '98.4', '102.2']) }),
  ]),
})

const PAD = GEO.PAD
const TOP = BANNER.TOP    // 42 — mesma linha de base do banner
const H_APP = BANNER.SIDE // 260 — mesma altura da montagem do banner

export const APP = Object.freeze({
  W: GEO.CANVAS.W,
  H: TOP + H_APP + PAD,   // 314 — igual ao banner
  TITLE_Y: BANNER.TITLE_Y,
  X: PAD,
  Y: TOP,
  VIEW_W: GEO.CANVAS.W - PAD * 2, // 796
  VIEW_H: H_APP,
  RX: 6,

  HEADER_H: 34,
  SIDEBAR_W: 132,
  NAV_Y: 12,   // do topo da sidebar até o primeiro item
  NAV_H: 26,   // altura de um item de navegação
  ROW_H: 22,   // linha da tabela; em tela cheia o produto usa 28/32
  PADDING: 14, // respiro interno da área de conteúdo

  /**
   * Corpos menores que os 11px do sistema: aqui o SVG imita uma tela inteira
   * reduzida a 796x260, e o texto precisa da mesma proporção que teria no app.
   */
  FONT: Object.freeze({ brand: 12, nav: 10, head: 11, label: 9.5, cell: 9, badge: 8.5 }),
  LABEL_W: 170, // coluna de rótulos da tabela
  CARD_H: 96,
  CARD_GAP: 16,
})

/**
 * Offsets de layout da interface, agrupados por zona.
 *
 * São dezenas de números pequenos — respiro de 16 aqui, linha de base de 22
 * ali. Cada um é uma decisão de desenho (§0.9), e nomear um por um viraria uma
 * lista ilegível. Agrupados por zona eles continuam encontráveis: mexer no
 * cabeçalho é mexer em `header`, e nada mais.
 */
export const LAY = Object.freeze({
  header: Object.freeze({ padX: 16, baseY: 22, tagGap: 10, avatarR: 9, avatarInset: 20, avatarY: 17 }),
  nav: Object.freeze({ insetX: 6, rx: 4, dotX: 16, dotY: 7, dot: 8, dotRx: 2, labelX: 32, baseY: 15 }),
  screen: Object.freeze({ titleY: 12, bodyY: 26 }),
  home: Object.freeze({ cols: 3, gap: 12, y: 30, h: 78, rx: 6 }),
  card: Object.freeze({
    rx: 6, stripeH: 3, stripeRx: 1.5, padX: 12, nameY: 28,
    pillY: 40, pillH: 16, pillRx: 8, pillPadX: 14, pillTextX: 19, pillBaseY: 51,
    versionsY: 78,
  }),
  table: Object.freeze({
    chipW: 28, chipH: 13, chipRx: 3, chipGap: 34, chipBack: 6, chipY: 2, chipBaseY: 12,
    cellPadR: 8, baseY: 15, labelPadX: 10, indent: 14,
  }),
})

/** Pesos de fonte usados na interface. */
export const WEIGHT = Object.freeze({ bold: 600, normal: 400 })

/**
 * A seta do ponteiro, em frações da sua altura. Uma forma, não coordenadas:
 * mudar `TOUR.CURSOR` reescala o desenho inteiro.
 */
export const ARROW = Object.freeze([
  Object.freeze([0, 0]), Object.freeze([0, 1]), Object.freeze([0.29, 0.72]),
  Object.freeze([0.5, 1.07]), Object.freeze([0.64, 1]), Object.freeze([0.43, 0.64]),
  Object.freeze([0.79, 0.64]),
])

/** Roteiro do cursor. Cada parada é um instante e um destino. */
export const TOUR = Object.freeze({
  MOVE: 1.1,    // duração de um deslocamento
  CLICK: 0.28,  // pulso do clique
  SETTLE: 0.45, // troca de tela depois do clique
  READ: 3.0,    // tempo parado sobre a tabela
  FADE: 0.35,
  START: Object.freeze({ x: 640, y: 220 }), // onde o cursor começa
  CURSOR: 14,   // altura da seta
})
