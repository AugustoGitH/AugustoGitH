import { GEO } from './geometry.mjs'
import { CELL_W } from './typography.mjs'

const SAFETY_COLS = 1 // margem para variação de fonte entre SOs

export const LIMITS = Object.freeze({
  MAX_COLS:  Math.floor(GEO.PANE.INNER_W / CELL_W) - SAFETY_COLS, // 58
  // A caixa de status tem padding interno, então cabe menos que uma linha solta.
  MAX_BOX_COLS: Math.floor((GEO.BOX.W - GEO.BOX.PAD * 2) / CELL_W) - SAFETY_COLS, // 55
  MAX_LINES: 8,
  MAX_BYTES: 120_000,
  MAX_ANIMATES: 150,
  REPO_NAME_MAX: 32,
  REPO_LANG_COL: 36,
  /** Tolerância da conferência de altura da cidade. Frouxa o bastante para
   *  erro de ponto flutuante, apertada para pegar erro de acumulação. */
  CITY_HEIGHT_TOLERANCE_PX: 0.01,
})
