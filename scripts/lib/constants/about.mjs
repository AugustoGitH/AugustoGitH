import { T } from './theme.mjs'
import { TYPO } from './typography.mjs'
import { GEO } from './geometry.mjs'

/**
 * O cartão do blog: a sessão de fotos em caracteres, e a legenda embaixo.
 *
 * É a seção de abertura do README, e substitui o banner fotográfico (spec §8).
 * As mesmas três fotos continuam sendo a fonte — o que mudou é o registro: em
 * vez de raster embutido, uma montagem ASCII gerada a partir dos pixels.
 *
 * **Por quê:** o banner era o único registro fotográfico numa página que é
 * toda terminal, e mantinha 91KB de JPEG em base64 dentro de um SVG. Em
 * caracteres, a mesma imagem passa a falar a língua do resto da página, e o
 * arquivo vira texto — comprimível, versionável, legível num diff.
 *
 * O parágrafo senta numa caixa T.chrome — o mesmo tom que já é "um passo
 * acima" do fundo em toda barra de título. É o par de papéis que o GitHub usa
 * na listra de tabela (bg default / bg muted), aqui como linha destacada.
 *
 * Digita uma vez e para: mesma mecânica de clip da Seção 1, sem a fase de
 * apagar — não há revezamento aqui, só uma sessão que termina e fica.
 */
const PAD = GEO.PAD
const CHROME_H = GEO.PANE.CHROME_H

const CMD_Y = CHROME_H + 30          // 56 — mesma âncora da Seção 4
const ART_GAP = 14                   // do comando até a primeira linha da arte
const ART_TOP = CMD_Y + ART_GAP      // 70 — topo da caixa da arte
const CMD2_GAP = 26                  // do fim da arte até o segundo comando
const BOX_GAP = 20                   // do comando até a caixa de destaque
const BOX_PAD = 14
const BOX_RX = 6
const BOTTOM_PAD = 20

/**
 * A montagem de caracteres.
 *
 * A largura NÃO depende do avanço da fonte: cada linha é um <text> com
 * `textLength` fixo, então as 265 colunas fecham em 796px em qualquer sistema.
 * Sem isso, a diferença entre o avanço do Consolas (0.55) e o do DejaVu (0.602)
 * seria de 66px — a arte transbordaria o painel numa máquina e ficaria torta
 * na outra, e nada avisaria (§0.4).
 *
 * Célula de 3.0 x 5px: o quadro é quadrado na origem e 87 colunas por 52
 * linhas devolvem 261 x 260px, quadrado de novo.
 */
export const ASCII = Object.freeze({
  SRC: 'data/ascii-frames.json',
  FONT: 5,
  LINE_H: 5,
  GUTTER: 2,                    // colunas em branco entre um quadro e o próximo
  W: GEO.CANVAS.W - PAD * 2,    // 796 — fixada por textLength, não medida
  FILL: T.ink,

  /**
   * Ordem de EXIBIÇÃO, que não é a de geração: o quadro 03 vai ao centro e o
   * 02 à direita. Herdada do banner (§8), junto com as descrições — o texto
   * alternativo acompanha o que está desenhado, nunca o nome do arquivo.
   */
  ORDER: Object.freeze([
    Object.freeze({ id: 'frame-01',
      alt: 'agachado sobre um banco de concreto, segurando um asterisco luminoso nas mãos' }),
    Object.freeze({ id: 'frame-03',
      alt: 'agachado no banco entre dois símbolos luminosos apoiados nele' }),
    Object.freeze({ id: 'frame-02',
      alt: 'deitado de lado sobre o banco, com o mesmo asterisco luminoso' }),
  ]),
})

export const ABOUT_PANE = Object.freeze({
  W: GEO.CANVAS.W,
  RX: GEO.PANE.RX,
  CHROME_H,
  PAD,
  TITLE: 'agent://blog',
  HUE: T.accent,

  /** Herdado do banner (§8): o estado do blog, à direita da barra de título. */
  STATUS: 'writing · soon',
  STATUS_Y: GEO.DOT.CY + TYPO.BASELINE_NUDGE, // 17 — a linha de base do chrome

  /** Os parâmetros reais da conversão, à mostra: são lidos, não enfeite. */
  CMD_Y,
  CMD: '$ ascii-art assets/src/*.jpg --cols 87',
  CMD2: '$ cat sobre.md',

  BOX_PAD,
  BOX_RX,
  /**
   * A última linha é o convite — cor de acento pra destacar do resto do
   * parágrafo, igual ao "-> passing context..." da Seção 1.
   */
  LINES: Object.freeze([
    'Escrevo sobre tudo que envolve a área de tecnologia — problemas e',
    'soluções técnicas, código, boas práticas, opiniões e mais.',
    '-> leia o blog',
  ]),
})

/**
 * O empilhamento, derivado da altura da arte — que vem do dado, não daqui.
 * Trocar o número de colunas em prep_ascii.py muda as linhas, e o painel
 * inteiro se reacomoda sozinho.
 */
export const aboutLayout = (artRows) => {
  const artH = artRows * ASCII.LINE_H
  const cmd2Y = ART_TOP + artH + CMD2_GAP
  const boxY = cmd2Y + BOX_GAP
  const boxH = BOX_PAD * 2 + TYPO.SIZE.body +
    (ABOUT_PANE.LINES.length - 1) * TYPO.LINE_H
  return Object.freeze({
    artTop: ART_TOP, artH, cmd2Y, boxY, boxH,
    H: boxY + boxH + BOTTOM_PAD,
  })
}

/**
 * Cadência: o comando, a varredura da arte, o segundo comando, e as linhas da
 * caixa uma a uma. Sem fase de apagar — a última `values` congela, e só o
 * `repeatCount` do cursor continua (§0.3).
 */
export const ABOUT_TIME = Object.freeze({
  CMD_AT: 0.1,          // a linha de comando, antes de tudo
  ART_GAP: 0.2,         // do comando até a varredura começar
  ART_DUR: 1.1,         // a arte descendo, como imagem que decodifica
  CMD2_GAP: 0.35,       // do fim da arte até o segundo comando
  BOX_GAP: 0.35,        // do comando até a primeira linha da caixa
  STEP: 0.4,            // de uma linha da caixa até a próxima
  DUR: 0.35,            // varredura de cada linha de texto
  TRAIL_PAD: 0.15,      // depois da última linha, antes do cursor assentar
  CURSOR_BLINK: 1.06,   // igual às demais seções
})

/**
 * O blog em si ainda não existe — é o que a barra de título diz. Até publicar,
 * o cartão aponta pro mesmo endereço do link "portfolio": é o único destino
 * real que já existe pra essa frente.
 *
 * TODO: trocar pela URL do blog assim que ele for ao ar, e espelhar a troca
 * no <a href> que envolve assets/about-blog.svg no README.
 */
export const ABOUT_HREF = 'https://augustowestphal.netlify.app'
