/**
 * Desenha o banner de abertura (assets/banner.svg).
 *
 * Três quadros da mesma sessão, embutidos como data URI. A foto vira dado
 * dentro do SVG para a seção continuar sendo UM arquivo, como todas as outras
 * (§0.8) e para o texto ficar em SVG de verdade — com a tipografia do sistema —
 * em vez de queimado no raster.
 *
 * O corte e a compressão são feitos por scripts/prep_banner.py, que roda LOCAL
 * e à mão. Este render só lê os .jpg já prontos e é determinístico, então o CI
 * pode rodá-lo como qualquer outro (§1.1).
 *
 * Uso:
 *   node scripts/render_banner.mjs
 *   STATIC=1 node scripts/render_banner.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { T, TYPO, CELL_W, KEYTIME_DECIMALS, BANNER } from './lib/constants/index.mjs'
import { assertBudget } from './lib/assert.mjs'
import { tag, text, animate } from './lib/svg.mjs'

const OUT = 'assets/banner.svg'
const STATIC = process.env.STATIC === '1'

const main = () => {
  const total = +(BANNER.HEADLINE_AT + BANNER.FADE_DUR).toFixed(2)
  const kk = (s) => (s / total).toFixed(KEYTIME_DECIMALS)

  const quadros = BANNER.SRC.map((q, i) => {
    const b64 = readFileSync(q.file).toString('base64')
    const x = BANNER.PAD + i * (BANNER.SIDE + BANNER.GUTTER)
    const y = BANNER.TOP

    const foto = tag('image', {
      x, y, width: BANNER.SIDE, height: BANNER.SIDE,
      preserveAspectRatio: 'xMidYMid slice',
      href: `data:image/jpeg;base64,${b64}`,
    })
    // A marca da borda do filme, sobre a foto.
    const num = text(x + BANNER.NUM_INSET,
      y + BANNER.SIDE - BANNER.NUM_INSET, T.ink,
      String(i + 1).padStart(2, '0'), { opacity: BANNER.NUM_OPACITY })

    // opacity=1 no markup: sem SMIL o banner aparece inteiro (§0.3).
    const at = BANNER.FADE_LEAD + i * BANNER.FADE_STEP
    return tag('g', { opacity: 1 },
      (STATIC ? '' : animate({
        attr: 'opacity', values: '0;0;1;1',
        keyTimes: `0;${kk(at)};${kk(at + BANNER.FADE_DUR)};1`,
        dur: total, where: `quadro/${i + 1}`, repeat: false,
      })) + foto + num)
  }).join('')

  // Faixa e manchete, por cima dos três quadros.
  const meio = BANNER.TOP + BANNER.SIDE / 2
  const faixa = tag('g', { opacity: 1 },
    (STATIC ? '' : animate({
      attr: 'opacity', values: '0;0;1;1',
      keyTimes: `0;${kk(BANNER.HEADLINE_AT)};${kk(BANNER.HEADLINE_AT + BANNER.FADE_DUR)};1`,
      dur: total, where: 'manchete', repeat: false,
    })) +
    tag('rect', { x: 0, y: meio - BANNER.BAND_H / 2, width: BANNER.W,
      height: BANNER.BAND_H, fill: T.bg, opacity: BANNER.BAND_OPACITY }) +
    text(BANNER.W / 2, meio + BANNER.HEADLINE_DROP, T.ink, BANNER.HEADLINE, {
      'font-size': TYPO.SIZE.display, 'font-weight': TYPO.SECTION_WEIGHT,
      'letter-spacing': TYPO.DISPLAY_TRACKING, 'text-anchor': 'middle',
    }))

  const legenda =
    text(BANNER.PAD, BANNER.CAPTION_Y, T.accent, BANNER.TITLE, {
      'font-size': TYPO.SIZE.section,
      'font-weight': TYPO.SECTION_WEIGHT, 'letter-spacing': TYPO.SECTION_TRACKING,
    }) +
    text(BANNER.W - BANNER.PAD, BANNER.CAPTION_Y, T.muted, BANNER.STATUS,
      { 'text-anchor': 'end' })

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${BANNER.W}" height="${BANNER.H}" viewBox="0 0 ${BANNER.W} ${BANNER.H}" ` +
    `role="img" aria-label="${BANNER.HEADLINE} — três retratos em preto e branco de ` +
    `Augusto Caetano Westphal, da mesma sessão: ` +
    `${BANNER.SRC.map((q) => q.alt).join('; ')}. ` +
    `${BANNER.TITLE}: ${BANNER.STATUS}.">`,
    // Só a família: o tamanho vem por atributo (ver text() em lib/svg.mjs).
    `<style>text{font-family:${TYPO.STACK}}</style>`,
    tag('rect', { x: 0, y: 0, width: BANNER.W, height: BANNER.H, fill: T.bg }),
    quadros, faixa, legenda,
    '</svg>',
  ].join('\n')

  mkdirSync('assets', { recursive: true })
  const { bytes, animates } = assertBudget(svg)
  writeFileSync(OUT, svg + '\n', 'utf8')
  console.log(`-> ${BANNER.FRAMES} quadros de ${BANNER.SIDE}px | ${BANNER.W}x${BANNER.H}`)
  console.log(`-> ${bytes} bytes, ${animates} animações, revela em ${total}s e congela`)
  console.log(`-> gravado ${OUT}${STATIC ? ' (estático)' : ''}`)
}

try { main() } catch (e) { console.error('!', e.message); process.exit(1) }
