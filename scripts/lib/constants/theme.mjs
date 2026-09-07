/**
 * Paleta. Nenhum hexadecimal existe fora deste arquivo.
 *
 * As superfícies são tokens do GitHub no modo escuro: o SVG precisa assentar
 * no README sem emendas visíveis, então o fundo do canvas e o corpo dos
 * painéis são o mesmo `canvas.default` da página que os hospeda.
 */
export const T = Object.freeze({
  // superfícies — GitHub dark
  bg:        '#0d1117', // canvas.default — igual ao fundo do README
  pane:      '#0d1117', // corpo do terminal, idem: sem emenda com a página
  chrome:    '#161b22', // canvas.subtle — barra de título, um passo acima
  border:    '#30363d', // border.default

  // acento
  accent:    '#d97757',
  accentDim: '#8a4a33',

  // texto — GitHub dark
  ink:       '#e6edf3', // fg.default
  dim:       '#8b949e', // fg.muted
  muted:     '#6e7681', // fg.subtle
  ok:        '#39d353',
  info:      '#79c0ff',

  // semáforos
  dotRed:    '#ff5f57',
  dotYellow: '#febc2e',
  dotGreen:  '#28c840',

  // véu do painel inativo
  veil:      '#0d1117',
  veilAlpha: 0.62,

  // spinner de espera
  spinnerLow: 0.18,
})

/**
 * Uma cor de sinal por agente.
 *
 * Sem isto os quatro terminais são visualmente idênticos — só o texto muda — e
 * quatro agentes que parecem o mesmo agente enfraquecem a leitura de frota.
 *
 * A cor entra em quatro elementos por painel: título, borda da caixa, texto da
 * caixa e cursor. Tudo isso é chrome; as linhas de conteúdo seguem neutras
 * (§0.7). O âmbar fica com o scout para manter a referência do terminal de
 * origem.
 *
 * Contraste sobre T.bg, verificado em 2026-09-06:
 *   âmbar 6.06:1 · ciano 10.69:1 · violeta 9.72:1 · rosa 7.53:1
 */
export const AGENT_HUE = Object.freeze({
  scout:   '#d97757',
  analyst: '#56d4dd',
  builder: '#d2a8ff',
  liaison: '#f778ba',
})

/**
 * Rampa de intensidade da cidade: terracota na base, verde do GitHub no topo.
 *
 * Paradas explícitas com interpolação linear entre adjacentes — nenhum tom
 * intermediário nasce sem alguém ter olhado para as pontas.
 *
 * O piso é #a75e3f e não um terracota mais escuro por uma razão dura: em
 * #4a2a1e um dia de 1 commit ficava em 1.98:1 contra o fundo, e um dia ativo
 * que parece ausente é o desenho mentindo sobre o dado. Piso atual: 4.34:1.
 *
 * O verde não some — fica reservado ao topo. Escasso, ele marca evento em vez
 * de virar cor de fundo.
 */
export const CITY_RAMP = Object.freeze([
  Object.freeze([0.00, '#a75e3f']),
  Object.freeze([0.34, '#c66c48']),
  Object.freeze([0.52, '#d97757']),
  Object.freeze([0.66, '#e2a355']),
  Object.freeze([0.82, '#93cf5f']),
  Object.freeze([1.00, '#39d353']),
])
