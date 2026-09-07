import { GEO } from './geometry.mjs'
import { BANNER } from './banner.mjs'

/**
 * Preview de produto: uma sessão de uso gravada, somente leitura.
 *
 * O ponteiro clica em Orçamentos, vê os cards e abre um deles até a tabela.
 * Sem JS (§0.2), é um replay — como a partida da Seção 4.
 *
 * **Fiel às telas reais.** Layout, cores, rótulos e estrutura foram lidos das
 * capturas da aplicação em 2026-09-07 e do código do produto; as cores saíram
 * por amostragem de pixel, não do palpite do config.
 *
 * **Nada de dado real entra.** Os repositórios são privados e da organização, e
 * o conteúdo pertence aos clientes. Nomes, datas e números são amostra, e a
 * moldura declara isso.
 *
 * Este arquivo é o molde: trocar de produto é trocar as constantes daqui. A
 * mecânica do ponteiro e das telas não sabe qual produto está desenhando.
 */
export const PRODUCT = Object.freeze({
  name: 'Budget',
  nameAccent: 'X',
  nameTail: 'pert',
  url: 'budgetxpert.com',
  title: '$ open ~/work/budgetxpert --preview',
  badge: 'preview · sample data',
  org: 'Acme Inc. Corp',
  user: 'JS',
  search: 'Pesquisar',
  page: 'Orçamentos',
})

/**
 * Paleta amostrada das capturas da aplicação (2026-09-07), conferida contra
 * tailwind.config.ts onde os dois se encontram.
 */
export const UI = Object.freeze({
  header:   '#062D3E', // = main
  search:   '#1D4253', // = selected
  teal:     '#19B09F', // = second
  tealSoft: '#C9F0EB',
  canvas:   '#F4FAFE',
  surface:  '#FFFFFF',
  line:     '#E3E8EE',
  lineSoft: '#EFF1F4',
  ink:      '#1B2733',
  dim:      '#62636C', // = third
  faint:    '#8A8F98',
  orange:   '#FF6900', // ponto de progresso
  marker:   '#F26522', // = fourth, marcador de célula
  cell:     '#F9F9FB',
  band:     '#0B3040', // faixa BUDGET da tabela
  plan: Object.freeze({ green: '#9FC131', purple: '#7C3AED' }),
  state: Object.freeze({
    elaboracao: Object.freeze({ label: 'ELABORAÇÃO', fg: '#BA68C8', bg: '#EDD7F2' }),
    execucao:   Object.freeze({ label: 'EXECUÇÃO',   fg: '#00ACC1', bg: '#B2EBF2' }),
  }),
})

/**
 * A sidebar real é um trilho de ícones, sem rótulo. Sete itens, na ordem de
 * src/components/navigations/Sidebar/constants.ts, com os nomes de ícone que o
 * produto usa — os glifos vêm de icons.mjs, extraídos do próprio projeto.
 */
export const RAIL = Object.freeze([
  Object.freeze({ id: 'home', icon: 'home' }),
  Object.freeze({ id: 'plan', icon: 'plans' }),
  Object.freeze({ id: 'category', icon: 'tag' }),
  Object.freeze({ id: 'premise', icon: 'folder' }),
  Object.freeze({ id: 'budget', icon: 'coin' }),
  Object.freeze({ id: 'analysis', icon: 'scale' }),
  Object.freeze({ id: 'aixpert', icon: 'helix' }),
])
export const RAIL_TARGET = 4 // Orçamentos

/** Cards de orçamento. Estrutura fiel ao BudgetCard; conteúdo de amostra. */
export const CARDS = Object.freeze([
  Object.freeze({
    name: 'Orçamento 2027 — Matriz', desc: 'Orçamento inicial',
    plan: 'PLANO ANUAL', period: '01/01/2027 - 31/12/2027',
    state: 'elaboracao', color: 'green', definition: 62, filling: 41, versions: 3,
  }),
  Object.freeze({
    name: 'Capex 2027', desc: 'Investimentos',
    plan: 'PLANO ANUAL', period: '01/01/2027 - 31/12/2027',
    state: 'elaboracao', color: 'green', definition: 28, filling: 12, versions: 1,
  }),
  Object.freeze({
    name: 'Trimestral Q1', desc: 'Revisão trimestral',
    plan: 'PLANO TRIMESTRAL', period: '01/01/2027 - 31/03/2027',
    state: 'execucao', color: 'purple', definition: 100, filling: 87, versions: 4,
  }),
  Object.freeze({
    name: 'Fechamento 2026', desc: 'Encerrado',
    plan: 'PLANO ANUAL', period: '01/01/2026 - 31/12/2026',
    state: 'execucao', color: 'purple', definition: 100, filling: 100, versions: 7,
  }),
])
export const CARD_TARGET = 0

/**
 * A tabela do budget selecionado.
 *
 * O cabeçalho é hierárquico — faixa BUDGET, ano, trimestre, mês — e as linhas
 * são numeradas com expansão à esquerda. Célula sem valor mostra o símbolo de
 * vazio; célula com marcador ganha um ponto laranja acima do número.
 */
export const TABLE = Object.freeze({
  band: 'BUDGET',
  year: '2027',
  quarters: Object.freeze([
    Object.freeze({ label: 'Q1', months: Object.freeze(['Jan', 'Fev', 'Mar']) }),
    Object.freeze({ label: 'Q2', months: Object.freeze(['Abr', 'Mai', 'Jun']) }),
    Object.freeze({ label: 'Q3', months: Object.freeze(['Jul', 'Ago', 'Set']) }),
  ]),
  rows: Object.freeze([
    Object.freeze({ n: 1, label: 'Receita Líquida', expand: true,
      cells: Object.freeze(['727,00', '747,00', '787,00', '804,00', '812,00', '840,00', '861,00', '879,00', '902,00']),
      marks: Object.freeze([0, 1, 2]) }),
    Object.freeze({ n: 2, label: 'Custo dos Serviços', expand: true,
      cells: Object.freeze(['275,00', '244,00', '292,00', '277,00', '242,00', '242,00', '251,00', '258,00', '264,00']),
      marks: Object.freeze([0, 1]) }),
    Object.freeze({ n: 3, label: 'Pessoal', expand: true,
      cells: Object.freeze(['627,00', '647,00', '696,00', '680,00', '680,00', '680,00', '712,00', '712,00', '740,00']),
      marks: Object.freeze([1, 2]) }),
    Object.freeze({ n: 4, label: 'Infraestrutura', expand: false,
      cells: Object.freeze(['435,00', '435,00', '435,00', null, null, null, null, null, null]),
      marks: Object.freeze([]) }),
    Object.freeze({ n: 6, label: 'Licenças de Software', expand: true,
      cells: Object.freeze(['621,00', '441,00', '406,00', '380,00', '330,00', '330,00', '380,00', '380,00', '412,00']),
      marks: Object.freeze([0, 1]) }),
    Object.freeze({ n: 7, label: 'Marketing', expand: true,
      cells: Object.freeze([null, null, null, null, null, null, null, null, null]),
      marks: Object.freeze([3]) }),
    Object.freeze({ n: 8, label: 'Despesas Gerais', expand: false,
      cells: Object.freeze(['223,00', '223,00', '223,00', '223,00', '287,00', '220,00', '220,00', '220,00', '240,00']),
      marks: Object.freeze([0, 1, 2, 3, 4]) }),
  ]),
})

const PAD = GEO.PAD
const TOP = BANNER.TOP // 42 — mesma linha de base do banner

export const APP = Object.freeze({
  W: GEO.CANVAS.W,
  TITLE_Y: BANNER.TITLE_Y,
  X: PAD,
  Y: TOP,
  VIEW_W: GEO.CANVAS.W - PAD * 2, // 796
  VIEW_H: 276,
  H: TOP + 276 + PAD,             // 330
  RX: 6,

  HEADER_H: 34,
  RAIL_W: 44,
  TITLEBAR_H: 32,
  PADDING: 14,
  CARD_H: 186,
  CARD_GAP: 12,
  ROW_H: 19,

  /**
   * Corpos bem menores que os 11px do sistema: o SVG imita uma tela de ~1280px
   * reduzida a 796, e o texto precisa da proporção que teria no app.
   */
  FONT: Object.freeze({
    brand: 11, search: 8, page: 11, cardTitle: 8.5, cardDesc: 7,
    label: 6.5, value: 7.5, pill: 6.5, cell: 7.5, head: 7.5, band: 7.5,
  }),
})

/** Offsets de layout, agrupados por zona — nomear um a um viraria lista ilegível. */
export const LAY = Object.freeze({
  /** Espessuras de traço da interface. */
  stroke: Object.freeze({ thin: 1.2, rail: 1.3, icon: 1.4 }),

  header: Object.freeze({
    padX: 14, baseY: 21, searchW: 300, searchH: 18, searchRx: 9,
    orgW: 92, orgH: 18, orgRx: 9, avatarR: 9, avatarGap: 10,
    searchIconR: 3, orgPadX: 8,
  }),
  rail: Object.freeze({
    top: 10, step: 26, size: 20, rx: 5, iconSize: 12, collapseY: 8,
    footR: 8, footInset: 12, aiInner: 3.5,
  }),
  titlebar: Object.freeze({
    padX: 14, baseY: 20, iconR: 6, btn: 16, btnGap: 5, btnRx: 4, labelGap: 8,
  }),
  card: Object.freeze({
    rx: 6, bar: 5, padX: 14, badgeR: 8, badgeY: 18,
    titleX: 30, titleY: 15, titleY2: 25, descY: 40,
    rowY: 58, rowStep: 15, pillH: 12, pillRx: 6, pillPadX: 10,
    progY: 112, progStep: 24, trackH: 3, trackY: 8, dotR: 3,
    versionY: 172, topInset: 6, trackInset: 8, pillLift: 3,
  }),
  table: Object.freeze({
    leftW: 190, numX: 18, nameX: 34, chevronX: 8,
    bandH: 16, yearH: 14, quarterH: 14, monthH: 16,
    cellPadR: 6, baseY: 13, markR: 1.8, markY: 4, emptyR: 3.5,
    crumbGap: 8, pillH: 13, pillRx: 6, pillPadX: 9, pillLift: 3,
    topInset: 8, bandBase: 5, yearBase: 4, quarterBase: 4, monthBase: 5, sheetPad: 6,
  }),
})

export const WEIGHT = Object.freeze({ bold: 600, normal: 400 })

/** A seta do ponteiro, em frações da própria altura. */
export const ARROW = Object.freeze([
  Object.freeze([0, 0]), Object.freeze([0, 1]), Object.freeze([0.29, 0.72]),
  Object.freeze([0.5, 1.07]), Object.freeze([0.64, 1]), Object.freeze([0.43, 0.64]),
  Object.freeze([0.79, 0.64]),
])

/** Roteiro do ponteiro. Cada parada é um instante e um destino. */
export const TOUR = Object.freeze({
  MOVE: 1.1,
  CLICK: 0.28,
  SETTLE: 0.45,
  READ: 3.2,
  FADE: 0.35,
  START: Object.freeze({ x: 660, y: 250 }),
  CURSOR: 13,
})
