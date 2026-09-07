/**
 * Lê o perfil público e grava data/profile.json.
 *
 * REST para usuário e repositórios; GraphQL para o calendário de contribuições,
 * que o REST não expõe. Exige token (GITHUB_TOKEN no CI).
 *
 * Determinístico de propósito: nenhum timestamp de geração no arquivo. O CI só
 * deve commitar quando o DADO mudou, não a cada execução.
 *
 * Uso: GITHUB_TOKEN=... node scripts/fetch_profile.mjs [usuario]
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { MONTHS, PROBE, CONTACT } from './lib/constants/index.mjs'

const USER = process.argv[2] ?? 'AugustoGitH'
const OUT = 'data/profile.json'
const TOKEN = process.env.GITHUB_TOKEN

if (!TOKEN) {
  console.error('! GITHUB_TOKEN ausente — o GraphQL de contribuições não roda sem token.')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'User-Agent': `profile-art (${USER})`,
  Accept: 'application/vnd.github+json',
}

async function rest(path) {
  const r = await fetch(`https://api.github.com${path}`, { headers })
  if (!r.ok) throw new Error(`REST ${path} -> ${r.status} ${r.statusText}`)
  return r.json()
}

async function contributions(login) {
  const query = `query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { firstDay contributionDays { contributionCount } }
        }
      }
    }
  }`
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST', headers,
    body: JSON.stringify({ query, variables: { login } }),
  })
  const j = await r.json()
  if (j.errors) throw new Error(`GraphQL: ${j.errors.map((e) => e.message).join('; ')}`)
  const cal = j.data.user.contributionsCollection.contributionCalendar
  const weeks = cal.weeks.map((w) => ({
    firstDay: w.firstDay,
    days: w.contributionDays.map((d) => d.contributionCount),
  }))
  const flat = weeks.flatMap((w) => w.days)
  return {
    // totalContributions e a soma dos dias NÃO batem: o GitHub devolve os dois
    // na mesma resposta com ~1% de diferença, porque o total anual conta
    // contribuições que o calendário diário não expõe. Guardamos os dois:
    // `total` rotula (bate com o cabeçalho do perfil), `weeks` desenha.
    total: cal.totalContributions,
    activeDays: flat.filter((c) => c > 0).length,
    days: flat.length,
    drawn: flat.reduce((a, b) => a + b, 0),
    maxDay: Math.max(...flat),
    maxWeek: Math.max(...weeks.map((w) => w.days.reduce((a, b) => a + b, 0))),
    from: weeks[0].firstDay,
    to: cal.weeks.at(-1).firstDay,
    weeks,
  }
}

const since = (iso) => {
  const d = new Date(iso)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/**
 * Confere que cada endereço ainda responde. Aborta se algum morrer.
 *
 * O resultado NÃO entra em profile.json: latência varia entre execuções e
 * quebraria o determinismo (§1.3), e um código de status no desenho seria
 * ruído. A verificação protege, a imagem não vira painel de monitoramento.
 *
 * "Vivo" é ter resposta HTTP, qualquer que seja. O LinkedIn devolve 999 a
 * requisição sem navegador — é anti-bot, não link quebrado. Morto é falhar na
 * rede: DNS que não resolve ou conexão recusada. Foi exatamente assim que
 * `augustowestphal.site` esteve quebrado no README sem ninguém notar.
 */
async function conferirEnderecos(user) {
  const alvos = PROBE.map((p) => ({
    id: p.id,
    url: p.url ?? (p.from === 'blog'
      ? `https://${user.blog}`
      : `https://github.com/${user.login}`),
  }))
  const mortos = []
  for (const a of alvos) {
    try {
      const r = await fetch(a.url, { redirect: 'follow', signal: AbortSignal.timeout(15000) })
      console.log(`   ${a.id} ${r.status} ${a.url}`)
    } catch (e) {
      mortos.push(`${a.id} (${a.url}): ${e.message}`)
    }
  }
  if (mortos.length) {
    throw new Error(`endereço inalcançável:\n   ` + mortos.join('\n   '))
  }
}

const main = async () => {
  console.log(`-> GET /users/${USER} + /repos + graphql`)
  const [u, allRepos, contrib] = await Promise.all([
    rest(`/users/${USER}`),
    rest(`/users/${USER}/repos?per_page=100&type=owner`),
    contributions(USER),
  ])

  const repos = allRepos.filter((r) => !r.fork)

  const counts = {}
  for (const r of repos) if (r.language) counts[r.language] = (counts[r.language] ?? 0) + 1
  const totalLang = Object.values(counts).reduce((a, b) => a + b, 0)
  const langs = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, n]) => ({ name, pct: +(100 * n / totalLang).toFixed(1) }))

  const recent = [...repos]
    .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at) || a.name.localeCompare(b.name))
    // Fora: o próprio repo de perfil, e repos sem linguagem detectada — uma
    // linha "NOME  -" não diz o que o dev construiu, só ocupa espaço.
    .filter((r) => r.name.toLowerCase() !== USER.toLowerCase() && r.language)
    .slice(0, 3)
    .map((r) => ({ name: r.name, language: r.language }))

  const payload = {
    user: {
      login: u.login,
      name: u.name,
      company: (u.company ?? '').replace(/^@/, ''),
      blog: (u.blog ?? '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
      followers: u.followers,
      since: since(u.created_at),
    },
    repos: { total: repos.length, recent },
    langs,
    contrib,
  }

  console.log('-> conferindo endereços')
  await conferirEnderecos(payload.user)

  mkdirSync('data', { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 1) + '\n', 'utf8')

  console.log(`-> ${repos.length} repos | ${langs.slice(0, 2).map((l) => `${l.name} ${l.pct}%`).join(' · ')}`)
  console.log(`-> ${contrib.total} contribuições (soma dos dias ${contrib.drawn}), ` +
              `${contrib.activeDays}/${contrib.days} dias ativos`)
  console.log(`-> ${contrib.weeks.length} semanas | pico semanal ${contrib.maxWeek} | pico diário ${contrib.maxDay}`)
  console.log(`-> gravado ${OUT}`)
}

main().catch((e) => { console.error('!', e.message); process.exit(1) })
