/** Validações que abortam a geração. Erro de conteúdo estoura aqui, não no painel. */
import { LIMITS, CELL, CELL_W, WELL } from './constants/index.mjs'

class SpecError extends Error {}

const fail = (msg) => { throw new SpecError(msg) }

/** Nenhuma linha pode exceder a largura útil do painel. */
export function assertWidth(text, where, max = LIMITS.MAX_COLS) {
  if (text.length > max) {
    fail(`${where}: ${text.length} colunas, máximo ${max}\n  ${text}`)
  }
  return text
}

/** Um painel não pode ter mais linhas de conteúdo do que cabe. */
export function assertLineCount(lines, where) {
  if (lines.length > LIMITS.MAX_LINES) {
    fail(`${where}: ${lines.length} linhas, máximo ${LIMITS.MAX_LINES}`)
  }
  return lines
}

/**
 * A montagem de caracteres tem que ser retangular, e do tamanho anunciado.
 *
 * Cada linha é um <text> com `textLength` fixo: uma linha mais curta que as
 * outras seria ESTICADA até a mesma largura em vez de sair torta, e o quadro
 * inteiro escorregaria sem nada avisar. A conferência é aqui porque o JSON vem
 * de fora do Node (prep_ascii.py, §1.1) e pode ser regerado com outro
 * parâmetro sem que o render saiba.
 */
export function assertAsciiGrid(rows, cols, where) {
  if (!rows?.length) fail(`${where}: quadro vazio`)
  rows.forEach((linha, n) => {
    if (linha.length !== cols) {
      fail(`${where}: linha ${n} com ${linha.length} colunas, esperado ${cols}`)
    }
  })
  return rows
}

/**
 * values e keyTimes precisam ter a mesma contagem.
 *
 * Divergência faz o navegador descartar a animação inteira em silêncio — sem
 * erro, sem console. É a falha mais cara do SMIL e a mais fácil de não notar.
 */
export function assertKeyframes(values, keyTimes, where) {
  const v = values.split(';')
  const t = keyTimes.split(';')
  if (v.length !== t.length) {
    fail(`${where}: ${v.length} values x ${t.length} keyTimes\n  ${values}\n  ${keyTimes}`)
  }
  const nums = t.map(Number)
  if (nums[0] !== 0 || nums[nums.length - 1] !== 1) {
    fail(`${where}: keyTimes precisa começar em 0 e terminar em 1 — ${keyTimes}`)
  }
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < nums[i - 1]) fail(`${where}: keyTimes fora de ordem — ${keyTimes}`)
  }
  return keyTimes
}

/**
 * Todo prefixo usado tem que estar declarado no root.
 *
 * Um `xlink:href` sem `xmlns:xlink` torna o arquivo XML inválido. Dentro de
 * <img> o SVG é parseado como XML estrito, não como HTML tolerante — o
 * navegador não renderiza NADA e não avisa. Foi assim que o <use> dos cursores
 * quebrou a Seção 1 inteira.
 */
export function assertNamespaces(svg) {
  const usados = new Set([...svg.matchAll(/\s([a-zA-Z][\w-]*):[\w-]+=/g)].map((m) => m[1]))
  // 'xml' e 'xmlns' são predefinidos pela especificação e nunca se declaram.
  for (const p of ['xml', 'xmlns']) usados.delete(p)
  const declarados = new Set([...svg.matchAll(/xmlns:([\w-]+)=/g)].map((m) => m[1]))
  const faltando = [...usados].filter((p) => !declarados.has(p))
  if (faltando.length) fail(`prefixo sem xmlns: ${faltando.join(', ')}`)
  return svg
}

/** Orçamentos do arquivo final. */
export function assertBudget(svg) {
  assertNamespaces(svg)
  const bytes = Buffer.byteLength(svg, 'utf8')
  // \b depois de "animate" NÃO casa <animateTransform> — o T é caractere de
  // palavra. Contar só <animate> subestimava o orçamento pela metade.
  const animates = (svg.match(/<animate(?:Transform|Motion)?[\s>]/g) ?? []).length
  if (bytes > LIMITS.MAX_BYTES) fail(`SVG com ${bytes} bytes, máximo ${LIMITS.MAX_BYTES}`)
  if (animates > LIMITS.MAX_ANIMATES) fail(`${animates} <animate>, máximo ${LIMITS.MAX_ANIMATES}`)
  return { bytes, animates }
}

/** Um texto tem que caber na largura útil da seção. */
export function assertFits(px, max, where) {
  if (px > max) fail(`${where}: ${px.toFixed(1)}px, máximo ${max}px`)
  return px
}

/**
 * A altura desenhada de cada prédio tem que ser a soma dos seus dias.
 *
 * É o que impede a cidade de mentir: se o desenho e o dado divergirem por um
 * erro de acumulação, a geração para em vez de publicar um gráfico errado.
 */
export function assertCityHeights(weeks, scale, tolerancePx = LIMITS.CITY_HEIGHT_TOLERANCE_PX) {
  weeks.forEach((w, i) => {
    const soma = w.days.reduce((a, b) => a + b, 0)
    const desenhado = w.days.reduce((y, c) => y + c * scale, 0)
    if (Math.abs(desenhado - soma * scale) > tolerancePx) {
      fail(`semana ${i} (${w.firstDay}): altura ${desenhado.toFixed(3)}px ` +
           `!= ${(soma * scale).toFixed(3)}px de ${soma} commits`)
    }
  })
  return weeks
}

/** Nenhuma peça pode ser mais larga que o teto, nem sair do poço. */
export function assertPieces(placed, well) {
  for (const p of placed) {
    if (p.w > well.MAX_CELLS) {
      fail(`peça "${p.label}": ${p.w} células, máximo ${well.MAX_CELLS}`)
    }
    if (p.col < 0 || p.col + p.w > well.COLS) {
      fail(`peça "${p.label}" fora do poço: col ${p.col} + ${p.w} > ${well.COLS}`)
    }
    if (p.row + well.PIECE_H > well.ROWS) {
      fail(`peça "${p.label}" transborda o poço: fileira ${p.row + well.PIECE_H} > ${well.ROWS}`)
    }
  }
  return placed
}

/**
 * O rótulo tem que caber na largura DESENHADA da peça, não na da grade.
 *
 * A calha (WELL.GUTTER) desconta de cada lado, então uma peça de 3 células com
 * célula de 22px oferece 63px, não 66. Sem esta conferência o texto encosta nas
 * bordas ou vaza, e nada avisa — o SVG segue válido.
 */
export function assertLabelFits(label, run) {
  const disponivel = run * CELL - WELL.GUTTER * 2
  const usado = label.length * CELL_W
  if (usado > disponivel) {
    fail(`rótulo ${label}: ${usado.toFixed(1)}px numa peça de ${disponivel.toFixed(1)}px`)
  }
  return ''
}
