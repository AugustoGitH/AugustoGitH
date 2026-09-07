export const TIME = Object.freeze({
  PHASE_S: 6.5,
  CLEAR_S: 2.0,
  AGENTS: 4,
  CURSOR_BLINK_S: 1.06,
  SPINNER_S: 1.2,
  CURSOR_FADE_S: 0.05, // fade instantâneo; existe só para manter keyTimes distintos
  VEIL_FADE_S: 0.3,
})

export const TOTAL_S = TIME.PHASE_S * TIME.AGENTS + TIME.CLEAR_S // 28.0

/** Cues em segundos, relativos ao início da fase do agente. */
export const CUE = Object.freeze({
  box:      Object.freeze({ at: 0.15, dur: 0.30 }),
  lineFrom: 0.60,
  lineStep: 0.55,
  lineDur:  0.45,
  foot:     Object.freeze({ at: 3.90, dur: 0.40 }),

  dim:      Object.freeze({ at: 6.20, dur: 0.30 }),

  // Respiro entre a última linha escrita e o momento em que a grade inteira
  // acende. Sem ele o clarão pisaria em cima do texto ainda sendo digitado.
  finaleHold: 0.30,
})

/**
 * Instante em que os quatro painéis acendem juntos, com todo o conteúdo no ar.
 * É o único momento do loop em que a apresentação existe inteira.
 */
export const FINALE_AT =
  TIME.PHASE_S * (TIME.AGENTS - 1) + CUE.foot.at + CUE.foot.dur + CUE.finaleHold

/**
 * Limpeza. Absoluta, não relativa à fase: os quatro painéis apagam JUNTOS,
 * depois que o último terminou de preencher — e não cada um no fim do seu turno.
 *
 * Mesma mecânica do escrever, invertida: o clip encolhe da direita para a
 * esquerda e o cursor volta com ele, como um backspace.
 */
export const ERASE = Object.freeze({
  at:   TIME.PHASE_S * TIME.AGENTS, // 26.0 — assim que a última fase termina
  step: 0.12,                       // entre linhas; curto, a limpeza não se lê
  dur:  0.30,
})

export const ERASE_END = ERASE.at + ERASE.step * 5 + ERASE.dur

/**
 * Ciclo de trabalho do cursor: aceso na primeira metade, apagado na segunda.
 * keyTimes fechado, relativo ao próprio dur do piscar.
 */
export const CURSOR_DUTY = Object.freeze({
  values:   '1;1;0;0;1',
  keyTimes: '0;0.49;0.50;0.99;1',
})

/**
 * Ponto em que um estado "retido até o fim" solta, pouco antes de 1.
 * Existe para o loop reiniciar sem salto visível.
 */
export const HOLD_END = '0.9900'

/** Perseguição do spinner: início, pico e fim do pulso de cada ponto. */
export const SPIN = Object.freeze({ lead: 0.01, peak: 0.09, trail: 0.17 })

/** Início absoluto da fase do agente i. */
export const phaseStart = (i) => i * TIME.PHASE_S

/** Segundos absolutos -> keyTime normalizado. Nenhum render divide por TOTAL_S. */
/** Casas decimais de um keyTime. Quatro separam eventos a ~2.8ms num loop de
 *  28s — abaixo disso dois cues próximos colidiriam no mesmo valor. */
export const KEYTIME_DECIMALS = 4

export const k = (seconds) => (seconds / TOTAL_S).toFixed(KEYTIME_DECIMALS)

/**
 * Menor intervalo que dois keyTimes conseguem distinguir depois do
 * arredondamento. Serve para separar dois eventos coladinhos sem que o valor
 * arredondado os funda — o que descartaria a animação inteira (§4.6).
 */
export const keyTimeTick = (total) => total / 10 ** KEYTIME_DECIMALS
