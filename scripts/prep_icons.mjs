/**
 * Extrai os ícones da sidebar do produto e gera lib/constants/icons.mjs.
 *
 * Roda LOCAL e à mão, como prep_banner.py (§1.1): depende do repositório do
 * produto, que é privado. O resultado é commitado, e o CI só lê o módulo
 * gerado.
 *
 * Desenhar aproximações à mão produzia glifos que não eram os do produto — e a
 * seção existe para ser fiel. Os arquivos são <path> puro num viewBox 20x20,
 * então basta transportar o `d` e escalar no uso.
 *
 * Uso:
 *   node scripts/prep_icons.mjs [caminho/para/aimkiller-frontend]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = process.argv[2] ??
  '/home/augusto/applications/budgetXpert/aimkiller-frontend'
const DIR = join(SRC, 'src/svg/icons/outline')
const OUT = 'scripts/lib/constants/icons.mjs'

/** Os sete itens da sidebar, na ordem de Sidebar/constants.ts. */
const NOMES = ['home', 'plans', 'tag', 'folder', 'coin', 'scale', 'helix']

const lerPaths = (nome) => {
  const svg = readFileSync(join(DIR, `${nome}.svg`), 'utf8')
  const view = svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 20 20'
  const paths = [...svg.matchAll(/<path\b([^>]*)\/>/g)].map((m) => {
    const attrs = m[1]
    return {
      d: attrs.match(/\bd="([^"]+)"/)?.[1] ?? '',
      evenodd: /fill-rule="evenodd"/.test(attrs),
    }
  }).filter((p) => p.d)
  if (!paths.length) throw new Error(`${nome}: nenhum <path> encontrado`)
  return { view, paths }
}

const icones = Object.fromEntries(NOMES.map((n) => [n, lerPaths(n)]))
const lado = Number(icones.home.view.split(' ')[2])

const corpo = NOMES.map((n) => {
  const { view, paths } = icones[n]
  const ps = paths.map((p) =>
    `      Object.freeze({ d: '${p.d}'` +
    (p.evenodd ? ", rule: 'evenodd'" : '') + ' }),').join('\n')
  return `  ${n}: Object.freeze({\n` +
         `    view: '${view}',\n` +
         `    paths: Object.freeze([\n${ps}\n    ]),\n  }),`
}).join('\n')

writeFileSync(OUT, `/**
 * Ícones da sidebar do produto.
 *
 * GERADO por scripts/prep_icons.mjs a partir de src/svg/icons/outline do
 * repositório do produto. Não editar à mão.
 *
 * São <path> preenchidos num viewBox ${lado}x${lado}; o uso escala pelo lado
 * desejado. Vieram do projeto em vez de aproximações desenhadas à mão porque a
 * seção existe para ser fiel — glifo inventado não é o glifo do produto.
 */
export const ICON_SIDE = ${lado}

export const ICONS = Object.freeze({
${corpo}
})
`, 'utf8')

const total = NOMES.reduce((n, k) => n + icones[k].paths.length, 0)
console.log(`-> ${NOMES.length} ícones, ${total} paths, viewBox ${lado}x${lado}`)
console.log(`-> gravado ${OUT}`)
