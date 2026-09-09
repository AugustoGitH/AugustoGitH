/**
 * Auditoria da regra §0.9: nenhum número mágico fora de constants/.
 *
 * Remove comentários e literais de string antes de procurar, senão um `0.5`
 * dentro de um comentário ou de uma cor conta como violação — e um filtro
 * grosseiro por linha deixa passar o caso real.
 *
 * Uso: node scripts/audit_constants.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * A regra mira VALOR DE DESENHO — dimensão, duração, cor, opacidade, limiar.
 * Aritmética estrutural não é valor de desenho e não tem onde ser nomeada sem
 * piorar a leitura: 0/1 (identidades), 2 (metade, par, argv) e 100 (porcento).
 */
const PERMITIDOS = new Set(['0', '1', '2', '100'])

/** color.mjs é aritmética de formato hexadecimal ponta a ponta (offsets 1/3/5,
 *  base 16, pares). Nomear cada um só afastaria o número do seu uso. */
const ISENTOS = new Set(['scripts/lib/color.mjs'])

const limpar = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')   // blocos
  .replace(/\/\/[^\n]*/g, ' ')          // linha
  .replace(/'(?:[^'\\]|\\.)*'/g, "''")  // strings
  .replace(/"(?:[^"\\]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``')

const alvos = [
  'scripts/render_agents.mjs', 'scripts/render_city.mjs',
  'scripts/fetch_profile.mjs', 'scripts/lib/svg.mjs',
  'scripts/lib/color.mjs', 'scripts/lib/assert.mjs',
  'scripts/render_stack.mjs', 'scripts/lib/pack.mjs', 'scripts/render_links.mjs', 'scripts/render_banner.mjs', 'scripts/render_product.mjs',
  'scripts/render_about.mjs',
]

let achados = 0
for (const f of alvos) {
  if (ISENTOS.has(f)) continue
  limpar(readFileSync(f, 'utf8')).split('\n').forEach((linha, n) => {
    for (const m of linha.matchAll(/(?<![\w.])\d+(?:\.\d+)?/g)) {
      if (PERMITIDOS.has(m[0])) continue
      console.log(`  ${f}:${n + 1}  ${m[0]}   ${linha.trim().slice(0, 68)}`)
      achados++
    }
  })
}
console.log(achados ? `\n  ${achados} número(s) mágico(s) fora de constants/` : '  nenhum — OK')
process.exit(achados ? 1 : 0)
