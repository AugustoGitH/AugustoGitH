/**
 * Extrai os ícones do produto e gera lib/constants/icons.mjs.
 *
 * Roda LOCAL e à mão, como prep_banner.py (§1.1): depende do repositório do
 * produto, que é privado. O resultado é commitado, e o CI só lê o módulo
 * gerado.
 *
 * Desenhar aproximações à mão produzia glifos que não eram os do produto — e a
 * seção existe para ser fiel. Os arquivos são <path> puro; o `d` é transportado
 * e o uso escala pelo viewBox de origem, que difere entre as duas famílias.
 *
 * Uso:
 *   node scripts/prep_icons.mjs [caminho/para/aimkiller-frontend]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = process.argv[2] ??
  '/home/augusto/applications/budgetXpert/aimkiller-frontend'
const OUT = 'scripts/lib/constants/icons.mjs'

/** Cada família tem seu diretório e seu viewBox. */
const FAMILIAS = Object.freeze({
  ui: {
    dir: 'src/svg/icons/outline',
    nomes: [
      // trilho lateral
      'home', 'plans', 'tag', 'folder', 'coin',
      // cabeçalho e barra de título
      'search', 'building', 'arrow-down', 'add', 'settings', 'menu-hamburguer',
      // cartão e tabela
      'version', 'window-3', 'decimal', 'export',
    ],
  },
  plan: {
    dir: 'src/svg/icons/plan',
    nomes: ['plan-house', 'plan-buildings'],
  },
})

const lerPaths = (dir, nome) => {
  const svg = readFileSync(join(SRC, dir, `${nome}.svg`), 'utf8')
  const view = svg.match(/viewBox="([^"]+)"/)?.[1]
  if (!view) throw new Error(`${nome}: sem viewBox`)
  const paths = [...svg.matchAll(/<path\b([^>]*?)\/?>/g)].map((m) => ({
    d: m[1].match(/\bd="([^"]+)"/)?.[1] ?? '',
    rule: /fill-rule="evenodd"/.test(m[1]) ? 'evenodd' : null,
  })).filter((p) => p.d)
  if (!paths.length) throw new Error(`${nome}: nenhum <path>`)
  return { view, paths }
}

const chave = (n) => (/^[a-z][a-zA-Z0-9]*$/.test(n) ? n : `'${n}'`)
const blocos = []
let total = 0

for (const [familia, { dir, nomes }] of Object.entries(FAMILIAS)) {
  const itens = nomes.map((n) => {
    const { view, paths } = lerPaths(dir, n)
    total += paths.length
    const ps = paths.map((p) =>
      `      Object.freeze({ d: '${p.d}'` +
      (p.rule ? `, rule: '${p.rule}'` : '') + ' }),').join('\n')
    return `  ${chave(n)}: Object.freeze({\n    view: '${view}',\n` +
           `    paths: Object.freeze([\n${ps}\n    ]),\n  }),`
  }).join('\n')
  blocos.push({ familia, itens, n: nomes.length })
}

const corpo = blocos.map(({ familia, itens }) =>
  `export const ${familia === 'ui' ? 'ICONS' : 'PLAN_ICONS'} = Object.freeze({\n${itens}\n})`
).join('\n\n')

writeFileSync(OUT, `/**
 * Ícones do produto.
 *
 * GERADO por scripts/prep_icons.mjs a partir de src/svg/icons do repositório do
 * produto. Não editar à mão.
 *
 * Cada entrada traz o \`viewBox\` de origem junto com os \`<path>\`: as duas
 * famílias têm caixas diferentes (a de interface é 20x20, a de planos 256x256),
 * então quem desenha escala por \`view\`, não por um lado fixo.
 *
 * Vieram do projeto em vez de aproximações desenhadas à mão porque a seção
 * existe para ser fiel — glifo inventado não é o glifo do produto.
 */
${corpo}
`, 'utf8')

console.log(`-> ${blocos.map((b) => `${b.n} ${b.familia}`).join(', ')} | ${total} paths`)
console.log(`-> gravado ${OUT}`)
