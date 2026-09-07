import { LIMITS } from './limits.mjs'

/**
 * Única declaração não-lida do projeto. Espelhar a bio do GitHub.
 * Ordem deliberada: especialidade primeiro, alcance depois.
 */
export const ROLE = 'front-end specialist · full-stack developer'

/** Perfis que a API do GitHub não expõe. */
export const LINKS = Object.freeze({
  linkedin: 'linkedin.com/in/augusto-westphal',
})

/**
 * Glifos dos marcadores.
 *
 * ASCII de propósito. Sem webfont (spec §0.4) a fonte real varia por SO; um
 * glifo ausente cai para outra família com avanço diferente e desalinha a
 * linha. `·` é Latin-1 e existe em toda fonte, então fica.
 */
const MARK = Object.freeze({ box: '*', foot: '->' })

/** Meses em inglês — decisão de idioma da spec §4.4. */
export const MONTHS = Object.freeze([
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
])

const pad = (s, col) => s + ' '.repeat(Math.max(1, col - s.length))

const repoRow = (r) => {
  const name = r.name.length > LIMITS.REPO_NAME_MAX
    ? r.name.slice(0, LIMITS.REPO_NAME_MAX - 3) + '...'
    : r.name
  return pad('  ' + name, LIMITS.REPO_LANG_COL) + (r.language ?? '-')
}

export const ROSTER = Object.freeze([
  Object.freeze({
    id: 'scout',
    title: 'agent://scout',
    box: () => `${MARK.box} ${ROLE}`,
    lines: (d) => [
      '> whoami',
      `  ${d.user.name}`,
      `  @${d.user.company}`,
      `  active since ${d.user.since} · ${d.user.followers} followers`,
    ],
    foot: () => `${MARK.foot} passing context to analyst...`,
  }),
  Object.freeze({
    id: 'analyst',
    title: 'agent://analyst',
    box: () => `${MARK.box} received context from scout`,
    lines: (d) => [
      '> analyze --public',
      `  ${d.repos.total} public repositories`,
      `  ${d.langs[0].name} ${d.langs[0].pct}% · ${d.langs[1].name} ${d.langs[1].pct}%`,
      `  ${d.contrib.total} contributions · ${d.contrib.activeDays} active days`,
    ],
    foot: () => `${MARK.foot} passing context to builder...`,
  }),
  Object.freeze({
    id: 'builder',
    title: 'agent://builder',
    box: () => `${MARK.box} received context from analyst`,
    lines: (d) => [
      '> ls ~/work --sort=recent',
      ...d.repos.recent.map(repoRow),
    ],
    foot: () => `${MARK.foot} passing context to liaison...`,
  }),
  Object.freeze({
    id: 'liaison',
    title: 'agent://liaison',
    box: () => `${MARK.box} received context from builder`,
    lines: (d) => [
      '> contact --open',
      `  ${d.user.blog}`,
      `  ${LINKS.linkedin}`,
      `  github.com/${d.user.login}`,
    ],
    foot: () => `${MARK.foot} restarting scout...`,
  }),
])
