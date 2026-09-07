import { T, AGENT_HUE } from './theme.mjs'
import { TYPO, CELL_W } from './typography.mjs'
import { GEO } from './geometry.mjs'

/**
 * Nome inteiro por padrão. Encurta só quem não cabe em MAX_CELLS, e para a
 * palavra distintiva — nunca para inicial: sigla obriga o leitor a decodificar
 * o que deveria reconhecer.
 */
export const SHORT = Object.freeze({
  'Styled Components': 'Styled',
  'React Testing Library': 'Testing Lib',
  'Design Patterns': 'Patterns',
  'Firebase Storage': 'FB Storage',
  'Apollo Client': 'Apollo',
  'Robot Framework': 'Robot',
})

/**
 * Taxonomia declarada. Não vem de API — é dele, transcrita do cartão anterior
 * (README-LEGADO.md §1.1 e §3). Mesma exceção nomeada de ROLE em §0.5.
 */
export const CATEGORIES = Object.freeze([
  Object.freeze({ id: 'front', label: 'FRONT-END', hue: AGENT_HUE.scout,
    items: Object.freeze(['React', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5',
      'CSS3', 'Sass', 'Styled Components', 'Bootstrap', 'Material UI',
      'Apollo Client', 'jQuery']) }),
  Object.freeze({ id: 'back', label: 'BACK-END', hue: AGENT_HUE.analyst,
    items: Object.freeze(['Node.js', 'Express.js', 'NestJS', 'GraphQL']) }),
  Object.freeze({ id: 'data', label: 'DATABASES', hue: AGENT_HUE.builder,
    items: Object.freeze(['PostgreSQL', 'MongoDB', 'Prisma', 'TypeORM',
      'Sequelize', 'Firestore', 'Firebase Storage']) }),
  Object.freeze({ id: 'test', label: 'TESTING', hue: AGENT_HUE.liaison,
    items: Object.freeze(['Jest', 'React Testing Library', 'Mocha', 'Chai',
      'Selenium', 'Robot Framework']) }),
  Object.freeze({ id: 'arch', label: 'ARCHITECTURE', hue: T.ok,
    items: Object.freeze(['SOLID', 'Design Patterns', 'Clean Code']) }),
])

/**
 * Os sete tetrominós, em offsets (coluna, fileira) com a fileira 0 no topo.
 * `run` é a maior sequência horizontal contígua — é onde o nome cabe.
 */
export const SHAPES = Object.freeze({
  I: Object.freeze({ cells: Object.freeze([[0,0],[1,0],[2,0],[3,0]]), run: 4, runRow: 0, runCol: 0 }),
  L: Object.freeze({ cells: Object.freeze([[0,0],[1,0],[2,0],[0,1]]), run: 3, runRow: 0, runCol: 0 }),
  J: Object.freeze({ cells: Object.freeze([[0,0],[1,0],[2,0],[2,1]]), run: 3, runRow: 0, runCol: 0 }),
  T: Object.freeze({ cells: Object.freeze([[0,0],[1,0],[2,0],[1,1]]), run: 3, runRow: 0, runCol: 0 }),
  O: Object.freeze({ cells: Object.freeze([[0,0],[1,0],[0,1],[1,1]]), run: 2, runRow: 0, runCol: 0 }),
  S: Object.freeze({ cells: Object.freeze([[1,0],[2,0],[0,1],[1,1]]), run: 2, runRow: 0, runCol: 1 }),
  Z: Object.freeze({ cells: Object.freeze([[0,0],[1,0],[1,1],[2,1]]), run: 2, runRow: 0, runCol: 0 }),
})

/** Rodízio de formas por sequência, para variar o desenho sem sortear nada. */
export const BY_RUN = Object.freeze({
  2: Object.freeze(['O', 'S', 'Z']),
  3: Object.freeze(['T', 'J', 'L']),
  4: Object.freeze(['I']),
})

const PAD = GEO.PAD
const TOP = 32
const WELL_Y = 42
const COLS = 12         // perto do poço clássico de 10 — proporção retrato
const ROWS = 18         // 14 usadas pela pilha + 4 de folga para a queda entrar
const GAP = 24

/** Lado da célula, em px. Inteiro de propósito: coordenada fracionária
 *  destrói a borda dura que faz a leitura de pixel art. */
export const CELL = 22

const WELL_W = COLS * CELL
const WELL_H = ROWS * CELL

export const WELL = Object.freeze({
  COLS, ROWS,
  X: PAD, Y: WELL_Y, W: WELL_W, H: WELL_H,
  BOTTOM: WELL_Y + WELL_H,

  /**
   * Calha: recuo de desenho em cada lado da peça.
   *
   * É ela que separa peças vizinhas — um vão de fundo, não uma linha. O
   * empacotamento não muda: a peça ocupa as mesmas células, só é desenhada
   * menor. Cerca de 14% da célula, como na referência.
   *
   * Substitui o contorno escuro por peça e o friso claro por célula, que juntos
   * custavam 256 retângulos e faziam o L ler como três quadrados encostados.
   */
  GUTTER: 1.5,

  /** Raio do canto convexo. Côncavo fica vivo (ver lib/outline.mjs). */
  RADIUS: 2.5,
})

export const PANEL = Object.freeze({
  X: PAD + WELL_W + GAP,
  W: GEO.CANVAS.W - PAD - (PAD + WELL_W + GAP),
  ROW_H: 22,
  HEAD_GAP: 24,         // do cabeçalho para a primeira linha
  BLOCK_GAP: 36,        // entre o bloco declarado e o medido
  SWATCH: 9,
  BAR_H: 4,
  BAR_W: 120,
  LABEL_X: 15,
  COUNT_X: 140,
  BAR_X: 152,
  HEAD_Y: 50,
  BAR_DIM: 0.7,         // barra do bloco medido: sem cor de categoria, rebaixada
})

export const STACK_CANVAS = Object.freeze({
  W: GEO.CANVAS.W,
  H: WELL.BOTTOM + PAD,
  TITLE_Y: TOP - GEO.PAD / 2,
  TITLE: '$ tree ./tech-stack --depth=1',
})

/** Ritmo da partida, em segundos. */
/** Peso do rótulo sobre o bloco. Monoespaçado tem avanço fixo, então negrito
 *  não altera a largura — sobra contraste de graça sobre a cor da categoria. */
export const PIECE_LABEL_WEIGHT = 600

export const GAME = Object.freeze({
  LEAD: 0.2,            // antes da primeira peça — evita keyTime duplicado em 0
  FALL_STEP: 0.18,      // entre uma peça e a próxima
  FALL_DUR: 0.45,
  HOLD: 1.5,            // pilha completa, parada
  CLEAR_STEP: 0.07,     // entre fileiras, na desintegração
  CLEAR_DUR: 0.25,
  TAIL: 1.1,            // poço vazio antes de recomeçar
})
