/**
 * Queda com gravidade, determinística.
 *
 * Cada peça é solta do topo em cada coluna possível e para no primeiro
 * obstáculo; fica na coluna que der o repouso mais baixo, desempate pela
 * esquerda. Descer do topo — em vez de procurar o encaixe ótimo — é o que
 * impede a peça de escorregar para baixo de um beiral, e é o que **cria os
 * buracos**: buraco é a assinatura visual do Tetris, e um empacotamento ótimo
 * pareceria um gráfico de barras.
 *
 * `row` conta a partir do topo do poço.
 */
export function dropPieces(pieces, shapes, cols, rows) {
  const grid = new Set()
  const key = (c, r) => `${c},${r}`

  return pieces.map((p) => {
    const { cells } = shapes[p.shape]
    const w = Math.max(...cells.map(([c]) => c)) + 1
    const h = Math.max(...cells.map(([, r]) => r)) + 1

    let best = null
    for (let x = 0; x <= cols - w; x++) {
      let y = -1
      while (y + 1 + h <= rows &&
             !cells.some(([c, r]) => grid.has(key(x + c, y + 1 + r)))) y++
      if (y < 0) continue
      if (best === null || y > best.y) best = { x, y }
    }
    if (best === null) throw new Error(`peça "${p.label}" não coube no poço`)

    for (const [c, r] of cells) grid.add(key(best.x + c, best.y + r))
    return { ...p, col: best.x, row: best.y, w, h }
  })
}

/** Estatísticas da pilha montada. */
export function stackStats(placed, shapes, cols, rows) {
  const ocupadas = placed.reduce((n, p) => n + shapes[p.shape].cells.length, 0)
  const topo = Math.min(...placed.map((p) => p.row))
  const usadas = rows - topo
  return { usadas, topo, ocupadas, buracos: cols * usadas - ocupadas }
}
