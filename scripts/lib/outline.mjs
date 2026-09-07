/**
 * Contorno de uma peça: de um conjunto de células a um caminho único.
 *
 * Antes cada peça era desenhada como N retângulos por célula, mais uma camada
 * escura inflada para separá-la das vizinhas. O desenho ficava com costuras
 * internas — o L lia como três quadrados encostados, não como um L.
 *
 * Aqui a peça vira **um caminho só**: traça-se a fronteira do conjunto de
 * células, recua-se pela calha e arredondam-se apenas os cantos convexos. Canto
 * côncavo fica vivo, que é o que a referência mostra e o que sai naturalmente
 * de uma união de retângulos arredondados.
 */

const key = (c, r) => `${c},${r}`

/** As quatro arestas de uma célula, no sentido horário com o interior à direita. */
const ARESTAS = [
  { de: [0, 0], para: [1, 0], vizinho: [0, -1] }, // topo
  { de: [1, 0], para: [1, 1], vizinho: [1, 0] },  // direita
  { de: [1, 1], para: [0, 1], vizinho: [0, 1] },  // base
  { de: [0, 1], para: [0, 0], vizinho: [-1, 0] }, // esquerda
]

/** Fronteira do conjunto: só as arestas cuja célula vizinha está de fora. */
function fronteira(cells) {
  const dentro = new Set(cells.map(([c, r]) => key(c, r)))
  const arestas = []
  for (const [c, r] of cells) {
    for (const a of ARESTAS) {
      if (dentro.has(key(c + a.vizinho[0], r + a.vizinho[1]))) continue
      arestas.push({
        de: [c + a.de[0], r + a.de[1]],
        para: [c + a.para[0], r + a.para[1]],
      })
    }
  }
  return arestas
}

/** Encadeia as arestas num ciclo e funde as colineares em vértices. */
function vertices(arestas) {
  const porInicio = new Map(arestas.map((a) => [key(...a.de), a]))
  const ciclo = []
  let atual = arestas[0]
  for (let i = 0; i < arestas.length; i++) {
    ciclo.push(atual)
    atual = porInicio.get(key(...atual.para))
    if (!atual) throw new Error('contorno aberto: a peça não é simplesmente conexa')
  }

  const pontos = []
  for (let i = 0; i < ciclo.length; i++) {
    const ant = ciclo[(i - 1 + ciclo.length) % ciclo.length]
    const d1 = [ciclo[i].de[0] - ant.de[0], ciclo[i].de[1] - ant.de[1]]
    const d2 = [ciclo[i].para[0] - ciclo[i].de[0], ciclo[i].para[1] - ciclo[i].de[1]]
    // Colineares: o ponto não é vértice, é meio de reta.
    if (d1[0] === d2[0] && d1[1] === d2[1]) continue
    pontos.push({ p: ciclo[i].de, entra: d1, sai: d2 })
  }
  return pontos
}

/**
 * Caminho da peça, em pixels.
 *
 * @param cells  células em coordenadas de grade, relativas à peça
 * @param lado   lado da célula em px
 * @param ox,oy  canto superior esquerdo da célula (0,0) da peça, em px
 * @param calha  recuo em px de cada lado — é ele que separa peças vizinhas
 * @param raio   raio do canto convexo em px
 */
export function caminhoDaPeca(cells, lado, ox, oy, calha, raio) {
  const vs = vertices(fronteira(cells))

  // Recuo: cada aresta anda pela sua normal interna. Como tudo é ortogonal, o
  // vértice recuado é a soma das duas normais das arestas que nele se encontram.
  const normal = ([dx, dy]) => [-dy, dx]
  const pts = vs.map(({ p, entra, sai }) => {
    const n1 = normal(entra)
    const n2 = normal(sai)
    // Convexo quando a curva vira no sentido do percurso (produto vetorial > 0).
    const convexo = entra[0] * sai[1] - entra[1] * sai[0] > 0
    return {
      x: ox + p[0] * lado + (n1[0] + n2[0]) * calha,
      y: oy + p[1] * lado + (n1[1] + n2[1]) * calha,
      entra, sai, convexo,
    }
  })

  const n = pts.length
  const fmt = (v) => v.toFixed(2)
  let d = ''
  for (let i = 0; i < n; i++) {
    const v = pts[i]
    const ant = pts[(i - 1 + n) % n]
    const prox = pts[(i + 1) % n]
    // O raio não pode comer mais que metade de qualquer um dos dois lados.
    const meia = (a, b) => Math.hypot(b.x - a.x, b.y - a.y) / 2
    const r = v.convexo ? Math.min(raio, meia(ant, v), meia(v, prox)) : 0

    const entrada = { x: v.x - v.entra[0] * r, y: v.y - v.entra[1] * r }
    const saida = { x: v.x + v.sai[0] * r, y: v.y + v.sai[1] * r }

    d += i === 0 ? `M${fmt(entrada.x)} ${fmt(entrada.y)}` : `L${fmt(entrada.x)} ${fmt(entrada.y)}`
    if (r > 0) d += `Q${fmt(v.x)} ${fmt(v.y)} ${fmt(saida.x)} ${fmt(saida.y)}`
  }
  return d + 'Z'
}
