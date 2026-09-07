/**
 * Fonte e métrica de célula.
 *
 * CELL_W não é escolhido: é o avanço de um monoespaçado, ~0.6x o tamanho da
 * fonte. Derivar mantém a grade correta se o tamanho mudar.
 */
export const TYPO = Object.freeze({
  STACK: "ui-monospace,SFMono-Regular,Menlo,Consolas,'DejaVu Sans Mono',monospace",
  SIZE: Object.freeze({
    body:    11,
    title:   11, // barra de título dos painéis
    box:     11,
    section: 15, // título da seção, dentro da imagem
    display: 34, // manchete sobreposta, só no banner
  }),
  SECTION_WEIGHT: 600,
  SECTION_TRACKING: 0.5,  // px de entreletra; monoespaçado em corpo grande fecha demais
  DISPLAY_TRACKING: 2.5,  // em corpo de manchete o monoespaçado fecha muito mais
  ADVANCE_RATIO: 0.6,
  LINE_H: 15,
  BASELINE_NUDGE: 4, // metade da altura-x, para centrar texto numa caixa
})

export const CELL_W = TYPO.SIZE.body * TYPO.ADVANCE_RATIO // 6.6
