# Spec de Montagem — README de Perfil

> Documento vivo. Define **o que** o README mostra, **de onde vem o dado** e
> **como o SVG é montado**. Nada aqui é implementado por terceiros: todo
> elemento animado é gerado por código deste repositório e commitado como arquivo.

- **Escopo deste documento:** as seções do README.
- **Última atualização:** 2026-09-06

> **Fonte de verdade deste documento.** Tudo aqui é derivado de (a) este
> repositório, (b) a API pública do GitHub para os dados do perfil e (c)
> comportamento verificado da plataforma (o que o GitHub aceita dentro de um
> `<img>` SVG). Repositórios de outras pessoas servem como **referência de
> funcionalidade** — "quero um efeito assim" — e nunca como fonte de
> implementação, de convenção de conteúdo ou de decisão de arquitetura. Se uma
> escolha não se justifica pelos itens (a)–(c), ela não entra.

## Índice

| # | Capítulo | Conteúdo |
| :-: | --- | --- |
| 0 | [Princípios](#0-princípios) | invariantes que toda seção herda |
| 1 | [Arquitetura](#1-arquitetura) | runtime, arquivos, contrato dos scripts, CI |
| 2 | [Constantes](#2-constantes) | onde vive cada número e cor do projeto |
| 3 | [Estrutura do README](#3-estrutura-do-readme) | blocos, marcadores, regras de montagem |
| 4 | [Seção 1 — A frota de agentes](#4-seção-1--a-frota-de-agentes) | painéis de terminal em revezamento |
| 5 | [Seção 2 — A cidade de commits](#5-seção-2--a-cidade-de-commits) | skyline do calendário de contribuições |
| 6 | [Seção 3 — O poço de stacks](#6-seção-3--o-poço-de-stacks) | partida de Tetris com as tecnologias |
| 7 | [Seção 4 — O prompt devolvido](#7-seção-4--o-prompt-devolvido) | fecho: os endereços e o cursor esperando |
| 8 | [Seção 0 — O banner](#8-seção-0--o-banner) | abertura: folha de contatos e o blog |
| 9 | [Seção 1 — O preview do produto](#9-seção-1--o-preview-do-produto) | **fora do README**; mantida como referência |

---

## 0. Princípios

Invariantes. Qualquer seção nova precisa respeitá-los.

### 0.1 Zero terceiros no caminho crítico

O README não depende de nenhum servidor que não seja o próprio GitHub.
Sem `shields.io`, sem `readme-typing-svg.demolab.com`, sem action de terceiro
gerando arte. Todo SVG é um arquivo em `assets/`, versionado.

**Por quê:** hoje 100% do que se move no README vem de servidor alheio. Quando
um deles cair, mudar de política ou for rate-limitado, o perfil quebra e você
não tem o que consertar.

### 0.2 Sem JavaScript — SMIL é o único vetor de animação

O GitHub renderiza `<img src="./assets/x.svg">` em **modo imagem**. Script não
executa. `<animate>` / `<animateTransform>` (SMIL) executam.

Consequência: toda coreografia é declarativa, resolvida em tempo de geração.
O script Node calcula os `keyTimes` e escreve o SVG pronto.

### 0.3 O estado base do markup é o estado VISÍVEL

Todo elemento animado tem, **no atributo do markup**, o valor do estado final
(revelado). O `<animate>` é quem o esconde em `t=0`.

```xml
<!-- CERTO: sem SMIL, o retângulo aparece com 390 de largura -->
<rect width="390"><animate attributeName="width" values="0;0;390;390;0" .../></rect>

<!-- ERRADO: sem SMIL, some pra sempre -->
<rect width="0"><animate ... begin="4s"/></rect>
```

**Por quê:** leitor de RSS, proxy de imagem, print, preview de link e navegador
com SMIL desativado não rodam a animação. Um README que às vezes aparece vazio
é pior que um README estático.

### 0.4 Sem webfont — layout em células de caractere

O SVG não pode carregar fonte externa. A stack obrigatória é:

```
ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace
```

A fonte real varia por SO, então **nunca centralize por medida de texto**.
Posicione tudo numa grade de células fixas, derivada do tamanho da fonte
(§2.4). Evite emoji: renderização inconsistente entre plataformas. Use glifos
monoespaçados (`✳ ▸ ⏵ ░ █ ●`).

### 0.4.1 `font-size` nunca vai na folha de estilo do SVG

Cada SVG carrega um `<style>` com a família monoespaçada. Ele **não pode**
declarar `font-size`.

**Por quê:** atributo de apresentação em SVG tem especificidade zero. Qualquer
regra CSS ganha dele, inclusive um seletor de tipo. Enquanto a folha declarou
`text{font-size:11px}`, todo `font-size="15"` e `font-size="9"` foi
silenciosamente ignorado — os títulos das Seções 2 e 3 saíram a 11px desde que
foram criados, e o endereço das peças de contato renderizou a 11px numa placa
dimensionada para 9px, transbordando e sendo recortado.

Nada avisa: o SVG é válido, o atributo está lá, e o navegador simplesmente
prefere a regra. Só se vê olhando o resultado.

O tamanho vem de `text()` em `lib/svg.mjs`, sempre como atributo, com
`TYPO.SIZE.body` como padrão. Se `font-size` voltar para o `<style>`, o
parâmetro para de funcionar de novo.

### 0.5 Todo número exibido é lido, nunca estimado

Nenhuma seção pode exibir um dado que não venha de `data/*.json` gerado por um
script deste repo.

**Corolário: placeholder é falha de design, não etapa de trabalho.** Um campo
digitado à mão é verdade no dia em que você escreve e vai ficando falso
sozinho — mesma doença da parede de badges, outro formato. Se um dado não é
obtível pela API, a pergunta certa não é "que texto eu ponho aqui", é "essa
linha merece existir".

Exceção única e nomeada: `ROLE` (§4.4). É manchete, não medição — nenhuma API
tem opinião sobre como você se apresenta. Fica declarada uma vez em
`roster.mjs`, com a obrigação de espelhar a bio do GitHub.

### 0.6 Escuro sempre, nos dois temas do GitHub

Toda seção pinta o próprio fundo em `#0d1117` — o `canvas.default` do GitHub no
modo escuro — **independente do tema de quem visita**. No modo claro as seções
aparecem como placas escuras sobre branco, e continuam legíveis: são imagens,
não a página.

**Por quê:** são terminais e um skyline noturno. A direção é cyberpunk, e
cyberpunk é neon sobre quase-preto — acento saturado só existe contra escuro.
Uma variante clara não seria a mesma peça noutro tema, seria outra peça.

Consequência: nada de `<picture>` com `prefers-color-scheme`. Um arquivo por
seção, um estado visual.

### 0.7 Neon na estrutura, nunca no texto

A cor saturada vive em borda, cursor, título e nos blocos da cidade. As linhas
de conteúdo ficam em `T.ink` / `T.dim`.

**Por quê:** texto monoespaçado de 11px sem webfont (§0.4) já é o elemento mais
frágil do projeto. Colorir ou dar brilho ali troca conteúdo por efeito.

Corolário: **sem `<filter>`, sem glow.** A cidade tem 306 blocos; brilho por
bloco força o navegador a rasterizar cada um, e num `<img>` do GitHub isso é
caro e inconsistente entre navegadores. Neon num quadro parado é cor saturada
sobre escuro — o borrão é o que a câmera faz, não o que o letreiro é.

### 0.8 Um SVG por seção, não por elemento

Elementos que precisam estar **sincronizados** vivem no mesmo arquivo. Quatro
`<img>` separados iniciam suas linhas do tempo em momentos diferentes conforme
o carregamento — coreografia entre arquivos é impossível.

### 0.9 Nenhum valor de desenho fora de `constants/`

Cor, coordenada, duração, opacidade, limiar e texto de roteiro vivem em
`scripts/lib/constants/`.

A regra mira **valor de desenho** — algo que alguém decidiu olhando para a tela.
Aritmética estrutural não é valor de desenho e não tem onde ser nomeada sem
piorar a leitura: `0` e `1` (identidades), `2` (metade, par, `argv`), `100`
(porcento). `color.mjs` é isento por inteiro: é aritmética de formato
hexadecimal ponta a ponta — offsets 1/3/5, base 16, pares — e nomear cada um só
afastaria o número do seu uso.

**Por quê:** o SVG é geometria pura. Um `414` solto numa concatenação de string
é indistinguível de qualquer outro `414`, e mover um painel vira caça ao
literal em quatro arquivos.

**Verificação:** `node scripts/audit_constants.mjs`. Ele remove comentários e
literais de string **antes** de procurar — um filtro por linha deixa passar
justamente o caso real, porque `opacity: 0.5` começa com letra e parece um
comentário para um grep ingênuo.

## 1. Arquitetura

### 1.1 Runtime: Node, zero dependências

```
scripts/**/*.mjs  →  Node 20+, ESM, sem dependência de produção
```

`fetch` é nativo desde o Node 18. `node:fs` e `node:path` cobrem o resto. A
geração de SVG é concatenação de string — não existe biblioteca envolvida.

> **Nota de decisão:** o único terreno onde o npm não tem equivalente maduro é
> processamento pesado de imagem (segmentação por modelo, equalização de
> histograma). A Seção 1 não pisa nele — é geometria e texto. Se uma seção
> futura vier a precisar, aquele script roda **local e à mão**, nunca no CI, e
> o CI segue Node puro.

### 1.2 Layout de arquivos

```
.github/workflows/
  update-readme-art.yml        # cron diário + workflow_dispatch + push em scripts/**

scripts/
  lib/
    constants/
      index.mjs                # barrel: único ponto de import dos renders
      theme.mjs                # cores
      typography.mjs           # fonte, tamanhos, métrica de célula
      geometry.mjs             # canvas, painel, âncoras internas
      timing.mjs               # fases, cues, TOTAL, normalizador de keyTime
      roster.mjs               # os 4 agentes: identidade e roteiro
      limits.mjs               # orçamentos e limites validados na geração
    svg.mjs                    # helpers puros: escape, tag, animate, clip
    pane.mjs                   # moldura e barra de título de um terminal
    color.mjs                  # interpolação de rampa
    assert.mjs                 # validações que abortam a geração
  audit_constants.mjs          # verifica a regra §0.9
  fetch_profile.mjs            # REST + GraphQL -> data/profile.json (exige token)
  render_agents.mjs            # §4 -> assets/agents-grid.svg
  render_city.mjs              # §5 -> assets/commit-city.svg

data/
  profile.json                 # fonte única de verdade, commitada

assets/
  agents-grid.svg              # saída, commitada

docs/
  README-SPEC.md               # este arquivo
```

Nenhum arquivo além destes até a Seção 1 estar fechada.

### 1.3 Contrato de todo script de render

| Regra | Detalhe |
| --- | --- |
| Entrada | lê **apenas** `data/profile.json` — nunca chama API |
| Constantes | importa **só** de `lib/constants/index.mjs` |
| Saída | escreve **um** arquivo em `assets/`, e nada mais |
| Determinismo | mesma entrada ⇒ byte-idêntico (sem timestamp, sem random) |
| Modo estático | `STATIC=1 node scripts/render_agents.mjs` gera o quadro congelado |
| Falha alta | violação de limite (§2.7) **aborta**; nunca degrada em silêncio |
| Log | imprime o que leu e o que escreveu, em uma linha cada |

O determinismo importa: o commit automático do CI só deve acontecer quando o
**dado** mudou, não a cada execução.

### 1.4 Pipeline de CI

```
cron 06:17 UTC (03:17 BRT)  ─┐
workflow_dispatch           ─┼─▶ fetch_profile.mjs ─▶ render_agents.mjs ─▶ auto-commit
push em scripts/**          ─┘                                             [skip ci]
```

`permissions: contents: write`. Commit só se `git status` acusar mudança, e a
mensagem leva `[skip ci]` pra não realimentar o próprio workflow.

`fetch_profile.mjs` recebe `GITHUB_TOKEN` no ambiente — o GraphQL de
contribuições (§4.4.1) não funciona sem ele. Os renders não recebem token
nenhum: eles só leem `profile.json`.

---

## 2. Constantes

### 2.1 A regra: primitivo vs. derivado

Dentro de `constants/`, um número aparece **uma vez**, como primitivo. Todo o
resto é calculado a partir dele.

```js
// ✓ CERTO
const GAP = 12
export const CANVAS = Object.freeze({ W: 840, H: 520 })
export const PANE = Object.freeze({
  W: (CANVAS.W - GAP) / 2,     // 414 — derivado
  H: (CANVAS.H - GAP) / 2,     // 254 — derivado
})

// ✗ ERRADO — 414 vira uma segunda fonte de verdade
export const PANE = { W: 414, H: 254 }
```

Se mudar `CANVAS.W`, o painel, a largura útil e o número máximo de colunas se
reajustam sozinhos. Sem isso, cada mudança de layout é uma caçada.

Todo export é `Object.freeze`. Constante que pode ser mutada em runtime não é
constante.

**Derive quando existe relação; declare quando é julgamento visual.** `PANE.W`
deriva de `CANVAS.W` porque há uma relação real. `BODY.Y = 88` é uma escolha de
respiro feita a olho — forçar uma fórmula sobre ela cria precisão falsa e
esconde que aquilo foi decidido, não calculado. A regra é *uma fonte de
verdade*, não *tudo é fórmula*: o primitivo de julgamento continua sendo
primitivo, desde que apareça uma única vez e dentro de `constants/`.

### 2.2 O barrel

`constants/index.mjs` reexporta tudo. Os renders importam **só dele**:

```js
import { T, GEO, TYPO, TIME, ROSTER, LIMITS } from './lib/constants/index.mjs'
```

**Por quê:** um único import por render torna trivial auditar o que ele usa, e
renomear um módulo interno não toca nenhum script de render.

### 2.3 `theme.mjs` — cores

Superfícies e texto são tokens do GitHub no modo escuro: o SVG precisa assentar
no README sem emendas, então o fundo do canvas e o corpo dos painéis são o mesmo
`canvas.default` da página que os hospeda.

```js
export const T = Object.freeze({
  // superfícies — GitHub dark
  bg:        '#0d1117', // canvas.default — igual ao fundo do README
  pane:      '#0d1117', // corpo do terminal, idem: sem emenda com a página
  chrome:    '#161b22', // canvas.subtle — barra de título, um passo acima
  border:    '#30363d', // border.default

  // acento base do sistema
  accent:    '#d97757',
  accentDim: '#8a4a33',

  // texto — GitHub dark
  ink:       '#e6edf3', // fg.default
  dim:       '#8b949e', // fg.muted
  muted:     '#6e7681', // fg.subtle
  ok:        '#39d353',
  info:      '#79c0ff',

  // semáforos da barra de título
  dotRed:    '#ff5f57',
  dotYellow: '#febc2e',
  dotGreen:  '#28c840',

  // véu do painel inativo
  veil:      '#0d1117',
  veilAlpha: 0.62,

  // spinner de espera
  spinnerLow: 0.18,
})
```

Ver §0.6 para a decisão de tema e §0.7 para o limite do neon.

#### Uma cor por agente

Os quatro terminais eram visualmente idênticos — só o texto mudava. Quatro
agentes que parecem o mesmo agente enfraquecem a leitura de frota.

```js
export const AGENT_HUE = Object.freeze({
  scout:   '#d97757', // âmbar — mantém a referência do terminal de origem
  analyst: '#56d4dd', // ciano
  builder: '#d2a8ff', // violeta
  liaison: '#f778ba', // rosa
})
```

A cor entra em **três elementos por painel**: a borda da caixa de status, o
cursor e o título `agent://`. Isso é ~2% dos pixels; o resto segue quase-preto
com texto cinza. É essa proporção que separa neon de bagunça (§0.7).

Contraste sobre `#0d1117`, verificado em 2026-09-06: âmbar 6.06:1 · ciano
10.69:1 · violeta 9.72:1 · rosa 7.53:1 — todos acima de 4.5:1.

#### Rampa da cidade

```js
export const CITY_RAMP = Object.freeze([
  [0.00, '#a75e3f'], [0.34, '#c66c48'], [0.52, '#d97757'],
  [0.66, '#e2a355'], [0.82, '#93cf5f'], [1.00, '#39d353'],
])
```

Paradas explícitas com interpolação linear entre adjacentes — nenhum tom
intermediário nasce sem alguém ter olhado para as pontas.

O piso é `#a75e3f`, e não um terracota mais escuro, por uma razão dura: em
`#4a2a1e` um dia de 1 commit ficava em **1.98:1** contra o fundo. Um dia ativo
que parece ausente é o desenho mentindo sobre o dado. Piso atual: **4.34:1**.

### 2.4 `typography.mjs` — fonte e métrica de célula

A largura de célula **não é um número escolhido**: é o avanço de um
monoespaçado, que é ≈ 0.6 × o tamanho da fonte. Derive.

```js
export const TYPO = Object.freeze({
  STACK: "ui-monospace,SFMono-Regular,Menlo,Consolas,'DejaVu Sans Mono',monospace",
  SIZE:  Object.freeze({ body: 11, title: 11, box: 11 }),
  ADVANCE_RATIO: 0.6,        // avanço / tamanho, num monoespaçado
  LINE_H: 15,
})

export const CELL_W = TYPO.SIZE.body * TYPO.ADVANCE_RATIO   // 6.6
```

Tabela de referência (para conferência manual, não para copiar no código):

| `SIZE.body` | `CELL_W` | `LINE_H` sugerido |
| ---: | ---: | ---: |
| 10 | 6.0 | 14 |
| 11 | 6.6 | 15 |
| 12 | 7.2 | 17 |

### 2.5 `geometry.mjs` — canvas, painel, âncoras

```js
import { TYPO, CELL_W } from './typography.mjs'

const GAP  = 12
const COLS = 2
const ROWS = 2
const PAD  = 12

export const CANVAS = Object.freeze({ W: 840, H: 520 })

const PANE_W = (CANVAS.W - GAP) / COLS          // 414
const PANE_H = (CANVAS.H - GAP) / ROWS          // 254

export const PANE = Object.freeze({
  W: PANE_W,
  H: PANE_H,
  RX: 8,
  CHROME_H: 26,
  PAD,
  INNER_W: PANE_W - PAD * 2,                    // 390
})

export const DOT = Object.freeze({ R: 4.5, CY: 13, CX: [16, 32, 48] })

export const BOX = Object.freeze({              // caixa de status, borda accent
  X:  PAD,
  Y:  PANE.CHROME_H + PAD,                      // 38 — derivado
  W:  PANE.INNER_W,
  H:  28,
  RX: 6,
})

// Âncoras de julgamento visual (§2.1): primitivas, declaradas uma vez.
export const BODY = Object.freeze({ Y: 88 })    // baseline da 1ª linha
export const FOOT = Object.freeze({ Y: 236 })   // baseline do handoff

/** Origem do painel i numa grade COLS × ROWS. */
export const paneOrigin = (i) => Object.freeze({
  x: (i % COLS) * (PANE.W + GAP),
  y: Math.floor(i / COLS) * (PANE.H + GAP),
})

/** x da coluna de caractere c, dentro de um painel. */
export const colX = (c) => PAD + c * CELL_W

/** y da linha de conteúdo n. */
export const lineY = (n) => BODY.Y + n * TYPO.LINE_H
```

`colX` e `lineY` são o que elimina coordenada solta dos renders: nenhum script
escreve `x="12"`, escreve `colX(0)`.

**Folga vertical conferida:** `BODY.Y + MAX_LINES × LINE_H = 88 + 8 × 15 = 208`,
contra `FOOT.Y = 236`. Cabem as 8 linhas com 28 px de respiro antes do rodapé.

### 2.6 `timing.mjs` — a linha do tempo

```js
export const TIME = Object.freeze({
  PHASE_S: 6.5,                                  // por agente
  CLEAR_S: 2.0,                                  // limpeza antes do loop
  AGENTS:  4,
  CURSOR_BLINK_S: 1.06,
})

export const TOTAL_S = TIME.PHASE_S * TIME.AGENTS + TIME.CLEAR_S   // 28.0

/** Cues em segundos, relativos ao início da fase do agente. */
export const CUE = Object.freeze({
  box:      Object.freeze({ at: 0.15, dur: 0.30 }),
  lineFrom: 0.60,
  lineStep: 0.55,
  lineDur:  0.45,
  foot:     Object.freeze({ at: 5.30, dur: 0.40 }),
  dim:      Object.freeze({ at: 6.20, dur: 0.30 }),
})

/** Início absoluto da fase do agente i. */
export const phaseStart = (i) => i * TIME.PHASE_S

/** Segundos absolutos -> keyTime normalizado, com 4 casas. */
export const k = (seconds) => (seconds / TOTAL_S).toFixed(4)
```

`k()` é a peça central: **nenhum render divide por 28**. Mudar `PHASE_S`
recalcula todos os `keyTimes` do arquivo.

### 2.7 `limits.mjs` — orçamentos que o gerador valida

```js
const SAFETY_COLS = 1     // margem para variação de fonte entre SOs

export const LIMITS = Object.freeze({
  MAX_COLS:  Math.floor(PANE.INNER_W / CELL_W) - SAFETY_COLS,   // 58
  MAX_LINES: 8,
  MAX_BYTES: 120_000,
  MAX_ANIMATES: 150,
})
```

`MAX_COLS` é **derivado**, não escolhido. Se o canvas encolher ou a fonte
crescer, o limite acompanha e o gerador passa a rejeitar linhas que antes
cabiam — que é exatamente o comportamento desejado.

### 2.8 `roster.mjs` — conteúdo é dado, não código

O roteiro dos agentes é uma estrutura de dados, não string espalhada pelo
render. Cada agente declara `box`, `lines` e `foot` como funções puras de
`profile.json` — o render não sabe o que os agentes dizem, só como desenhar.
Detalhado em §4.4.

Este módulo também abriga `ROLE`, a única string declarada (não lida) do
projeto, e `LINKS`, para os perfis que a API do GitHub não expõe.

### 2.9 Verificação

```bash
# Nenhuma cor, decimal ou número >= 10 fora de constants/ — deve não retornar nada
grep -nE "#[0-9a-fA-F]{6}|[0-9]*\.[0-9]+|\b[0-9]{2,}\b" \
  scripts/render_agents.mjs scripts/lib/svg.mjs scripts/lib/assert.mjs
```

O grep pega as classes que importam: hexadecimais, decimais e inteiros de dois
dígitos ou mais. Literal de um dígito (`2`, `5`) escapa da rede — esses ficam
por conta da revisão, guiados pela regra de §0.7 (só `0` e `1` são permitidos).

---

## 3. Estrutura do README

### 3.1 Princípio: o README não desenha, ele referencia

O `README.md` é uma lista ordenada de blocos. Cada bloco é **uma seção** e
contém **um `<img>`**. Layout, espaçamento, cor e tipografia são
responsabilidade do SVG — o markdown não participa dessas decisões.

### 3.2 Esqueleto

```markdown
<!-- ══════════ 00 · BANNER ══════════ -->

<div align="center">
  <img src="./assets/banner.svg" width="820" alt="..." />
</div>

<br />

<!-- ══════════ 01 · APRESENTAÇÃO ══════════ -->

<div align="center">
  <img src="./assets/agents-grid.svg" width="820"
       alt="Quatro agentes de terminal se revezando para apresentar
            Augusto Westphal: identidade, números do perfil, stack e contato." />
</div>

<!-- ══════════ 02 · COMMITS ══════════ -->

<br />

<div align="center">
  <img src="./assets/commit-city.svg" width="820"
       alt="$ git log --graph --since=1.year — skyline das contribuições de
            set/2025 a set/2026: 53 semanas, 3862 commits, 306 de 365 dias
            ativos, pico semanal de 201." />
</div>

<!-- ══════════ 03 · STACKS ══════════ -->

<br />

<div align="center">
  <img src="./assets/stack-well.svg" width="820"
       alt="$ tree ./tech-stack --depth=1 — 32 tecnologias empilhadas como peças
            de Tetris, agrupadas por categoria, ao lado da distribuição de
            linguagens medida nos repositórios públicos." />
</div>

<!-- ══════════ 04 · LINKS ══════════ -->

<br />

<div align="center">
  <img src="./assets/contact-prompt.svg" width="820"
       alt="$ connect --list — portfolio: augustowestphal.netlify.app,
            linkedin: linkedin.com/in/augusto-westphal,
            github: github.com/AugustoGitH,
            email: augustoc.westphal.ltda@gmail.com." />
</div>

<p align="center">
  <a href="https://augustowestphal.netlify.app">portfolio</a> ·
  <a href="https://www.linkedin.com/in/augusto-westphal/">linkedin</a> ·
  <a href="https://github.com/AugustoGitH">github</a> ·
  <a href="mailto:augustoc.westphal.ltda@gmail.com">email</a>
</p>
```

**Nenhum heading markdown.** O README é uma pilha de imagens e comentários de
bloco, e nada mais.

### 3.3 Regras de montagem

| # | Regra | Motivo |
| :-: | --- | --- |
| 1 | Um bloco = uma seção = um `<img>` | substituição determinística; o diff mostra qual seção mudou |
| 1b | **Exceção, única:** o bloco 04 tem cinco imagens — o terminal e quatro peças, cada uma num `<a>` | um `<a>` envolve a imagem inteira e dá um destino só, e o GitHub remove `<a>` de dentro do SVG. Quatro alvos exigem quatro arquivos (§7.7) |
| 2 | Marcador `<!-- ═ NN · NOME ═ -->` abre todo bloco | delimita a fronteira sem ambiguidade |
| 3 | Caminho sempre relativo: `./assets/…` | resolve na branch atual; não acopla a `main`; evita uma segunda ida ao proxy de imagem |
| 4 | `width` explícito, igual à largura do canvas | sem ele o GitHub usa a largura intrínseca e o SVG estoura em tela estreita |
| 5 | `alt` descreve o **conteúdo**, não o meio | "Quatro agentes…", nunca "SVG animado" |
| 6 | Espaçamento **dentro** de uma seção é do SVG | `<br/>` empilhado para arejar uma peça é sintoma de padding faltando no canvas |
| 6b | Espaçamento **entre** seções é do README: **dois** `<br />` por junta | o `<div>` não recebe margem no `markdown-body`, e um SVG não sabe o que vem depois dele. Sem isso as seções encostam — e como todas pintam o fundo em `canvas.default`, elas se fundem num bloco escuro contínuo |
| 7 | **Título de seção vive dentro do SVG**, nunca como heading markdown | tipografia, tamanho, cor e posição passam a ser nossos; o markdown do GitHub só oferece um `h2` com borda inferior |
| 8 | Nada fora de um bloco marcado | se não está num bloco, não pertence ao README |

#### Acessibilidade sem headings

Um README sem heading nenhum tira do leitor de tela a navegação por títulos.
O `alt` de cada imagem passa a carregar essa função e **começa pelo título da
seção**, palavra por palavra igual ao que está desenhado — quem ouve recebe a
mesma âncora que quem vê.

Numa página de perfil isso é suficiente: são quatro blocos, não um documento
longo. Numa peça maior a conclusão seria outra.

### 3.4 Slots reservados

| # | Seção | Estado hoje | Ao ser especificada |
| :-: | --- | --- | --- |
| 00 | Banner | — (nova) | `banner.svg` (§8) |
| 01 | Produto | removida do README; a spec e os scripts ficam (§9) |  |
| 01 | Apresentação | `readme-typing-svg` externo + `banner_00_rounded.png` (699 KB) | **substituído** por `agents-grid.svg` |
| 02 | Commits | snake via `Platane/snk@v3` | **substituído** por `commit-city.svg` (§5) |
| 03 | Stacks | ~35 badges `shields.io` | **substituído** por `stack-well.svg` (§6) |
| 04 | Links | 3 badges `shields.io` | **substituído** por `contact-prompt.svg` (§7) |

**Regra de transição:** um slot reservado mantém o conteúdo atual intacto até
sua seção ser especificada. Não remover nada "por antecipação" — o README fica
funcional em todos os estados intermediários.

### 3.5 Limpeza ao fechar a Seção 1

Quando `agents-grid.svg` entrar, estes artefatos saem do repositório:

- `banner_00.png` — 635 KB, não referenciado
- `banner_00_rounded.png` — 699 KB, substituído
- a tag `<img>` apontando para `readme-typing-svg.demolab.com`

Isso é ~1.3 MB e a última dependência de serviço externo da Seção 1.

---

## 4. Seção 1 — A frota de agentes

### 4.1 Conceito

Quatro janelas de terminal em grade 2×2, cada uma um agente de CLI rodando. Os
agentes **não falam ao mesmo tempo**: eles se revezam num loop coreografado,
onde cada um continua de onde o anterior parou. O quarto devolve o turno ao
primeiro, e o ciclo recomeça — o loop é diegético, faz parte da ficção.

O painel ativo fica em brilho pleno com cursor piscando; os três inativos ficam
rebaixados por um véu escuro, exibindo estado de espera.

Efeito: quem abre o perfil vê uma frota se apresentando por você, em vez de ler
uma parede de badges.

### 4.2 Decisão de marca

O visual de referência é a tela de boas-vindas do Claude Code. **A estética é
adotada; a marca não.** Nenhum painel reproduz o logo `CLAUDE CODE` nem a frase
"Welcome to the Claude Code research preview!".

A identidade é carregada pelos dois elementos que a geometria de fato tem: o
esquema `agent://` na barra de título e os nomes dos agentes. Não há banner nem
logotipo — um painel de 414×254 com barra de título de 26 px não comporta
block-letters, e a grade não precisa deles para se identificar.

**Por quê:** o visual reproduzido literalmente faz o bloco parecer um artefato
oficial da Anthropic hospedado no seu perfil. O mesmo layout com sua marca tem
idêntico impacto visual e é seu.

### 4.3 Geometria

Todos os valores abaixo vêm de `constants/geometry.mjs` (§2.5). A tabela é
documentação do resultado, não uma segunda fonte de verdade.

```
CANVAS   820 × 520
GAP      12
PANE     404 × 254        (CANVAS.W - GAP) / 2  ×  (CANVAS.H - GAP) / 2
INNER_W  380              PANE.W - PAD * 2
MAX_COLS 56               floor(INNER_W / CELL_W) - SAFETY_COLS
```

**A largura é imposta, não escolhida.** Medido no CSS do Primer servido em
`github.com/<user>` (2026-09-06): `.container-xl` de 1280px com 32px de padding
por lado dá 1216px; menos `--Layout-sidebar-width` 296px e `--Layout-gutter`
24px dá **896px** de `Layout-main`; menos 1px de borda e 32px de padding do
`.profile-readme` por lado dá **830px** de conteúdo.

Um canvas acima disso é reduzido pelo navegador, e fora de 100% a grade de
células de 6.6px, as bordas de 1px e o traço de 0.75 da caixa deixam de cair em
pixel inteiro. 820 fica sob o limite com margem para a parte menos verificada da
conta (o padding do Box).

Origem dos painéis, via `paneOrigin(i)`:

| i | posição | x | y |
| :-: | --- | ---: | ---: |
| 0 | topo-esquerda | 0 | 0 |
| 1 | topo-direita | 416 | 0 |
| 2 | base-esquerda | 0 | 266 |
| 3 | base-direita | 416 | 266 |

Anatomia interna de um painel (coordenadas relativas à sua origem):

```
┌──────────────────────────────────────────────┐  0
│ ● ● ●   agent://scout                        │  CHROME_H = 26
├──────────────────────────────────────────────┤  26
│                                              │
│  ┌────────────────────────────────────────┐  │  BOX
│  │ ✳ ready — 41 repos indexed             │  │  y=38, h=28, rx=6
│  └────────────────────────────────────────┘  │  stroke = T.accent
│                                              │
│  > linha 0                                   │  BODY.Y = 88
│  > linha 1                                   │  passo LINE_H = 15
│  > linha 2                                   │  máx. MAX_LINES = 8
│  ...                                         │
│                                              │
│  ⏵ handing off to analyst…              ░    │  FOOT.Y = 236
└──────────────────────────────────────────────┘  254
```

**Largura útil: 56 colunas.** Limite duro do design, validado na geração — não
é sugestão. Linha mais longa vaza do painel.

### 4.4 Elenco e roteiro

Quatro agentes, cada um com um papel que **complementa** o anterior. Toda linha
de conteúdo é **lida** de `data/profile.json` (§0.5). Não há placeholder.

#### Idioma: inglês, sem mistura

Todo texto dentro dos painéis é inglês — comando, conteúdo, estado e handoff.

**Por quê:** o perfil já é integralmente inglês (bio, badges, headline). Painel
com comando em inglês e conteúdo em português lê como tradução inacabada. A
decisão vive só em `roster.mjs`; trocar o idioma é editar um arquivo.

#### Mapa de campos

| Agente | Linha | Origem | Verificado 2026-09-06 |
| --- | --- | --- | --- |
| `scout` | nome | `user.name` | Augusto Caetano Westphal |
| `scout` | empresa | `user.company` | BudgetXpert |
| `scout` | tempo de conta | `user.created_at` | 2022-02-21 |
| `scout` | seguidores | `user.followers` | 38 |
| `analyst` | total de repos | `repos.length` (não-fork) | 41 |
| `analyst` | linguagens | agregado por `repo.language` | TS 39.5% · JS 34.2% |
| `analyst` | contribuições | GraphQL `contributionCalendar` (§4.4.1) | 3862 · 306 dias ativos |
| `builder` | repos recentes | `repos` por `pushed_at` desc | 3 mais recentes |
| `liaison` | portfólio | `user.blog` | augustowestphal.netlify.app |
| `liaison` | linkedin | `LINKS.linkedin` (declarado) | /in/augusto-westphal |
| `liaison` | github | `user.login` | AugustoGitH |

**`user.blog` é lido, nunca hardcoded.** Em 2026-09-06 o README apontava para
`augustowestphal.site`, que **não resolve DNS**, enquanto o campo `blog` do
perfil apontava para o Netlify, que responde 200. Ler o campo faz o README
seguir o perfil e torna esse tipo de divergência impossível por construção.

**Domínio canônico decidido:** `augustowestphal.netlify.app`. O campo `blog` do
perfil já aponta para lá — nada a corrigir no GitHub. O badge do README que
aponta para o `.site` morto sai na limpeza da Seção 4 (§3.4); até lá ele
permanece, e permanece quebrado.

**`user.location` foi descartado.** O valor é `'Brasil'` — um país inteiro
gastando uma das cinco linhas do painel sem produzir sinal. `user.company`
ocupa o mesmo espaço com mais informação. Se um dia virar cidade/estado, a
decisão pode ser revisitada.

#### Agente 0 — `scout` · identidade

```
✳ front-end specialist · full-stack developer
> whoami
  Augusto Caetano Westphal
  @BudgetXpert
  active since feb 2022 · 38 followers
⏵ passing context to analyst…
```

Interpolado: `✳ {ROLE}` · `{user.name}` · `@{user.company}` ·
`active since {created:mmm aaaa} · {user.followers} followers`.

#### Agente 1 — `analyst` · os números

```
✳ received context from scout
> analyze --public
  41 public repositories
  TypeScript 39.5% · JavaScript 34.2%
  3862 contributions · 306 active days
⏵ passing context to builder…
```

> Verificado em 2026-09-06. Repos via `api.github.com/users/AugustoGitH/repos`:
> 41 não-fork · TypeScript 39.5% · JavaScript 34.2% · CSS 18.4% · HTML 5.3% ·
> Sass 2.6%. Contribuições via GraphQL (§4.4.1): 3862 em 365 dias, 306 ativos,
> janela 2025-09-07 → 2026-09-06.

**A linha de contribuições é a mais importante do painel.** Os repositórios
públicos param em julho/2026 e sugerem inatividade; o calendário mostra 306
dias ativos de 365 (84%). Sem essa linha, o `analyst` contaria uma versão pior
da verdade.

**Linguagens ficam em duas entradas, não cinco.** `CSS`, `HTML` e `Sass` saem
daqui — a distribuição completa é assunto da Seção 3, e repetir a mesma tabela
em dois painéis gasta espaço sem acrescentar informação.

#### 4.4.1 De onde vêm as contribuições

O REST não expõe o calendário de contribuições. A fonte é o GraphQL:

```graphql
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}
```

Exige token. No CI, `secrets.GITHUB_TOKEN`.

> **Verificação parcial.** A query foi executada e validada em 2026-09-06 com um
> token de usuário (`gh api graphql`), retornando 3862/306/365. **Não** foi
> validada com o token padrão do Actions, cujo escopo é diferente. Se a primeira
> execução do CI falhar em `contributionsCollection`, o remédio é um PAT com
> `read:user` guardado como secret — não trocar para scraping de HTML, que
> depende de markup não documentado e quebra em silêncio.

Descartado: raspar `github.com/users/<user>/contributions`. Dispensa token, mas
acopla o pipeline a seletores de HTML que o GitHub pode mudar sem aviso, e a
falha é silenciosa — o CI simplesmente para de commitar.

#### Agente 2 — `builder` · o que ele constrói

```
✳ received context from analyst
> ls ~/work --sort=recent
  PORTFOLIO_RECRUITER_MODE            TypeScript
  SCRIPT_EXTRACT_BOOK                 JavaScript
  ONLINKS-FRONTEND--DEV               TypeScript
⏵ passing context to liaison…
```

Este painel se atualiza sozinho a cada push — é o mais vivo dos quatro.

**Duas colunas, larguras fixas.** O nome do repo começa na coluna 2 e a
linguagem na coluna 36 — alinhamento em grade, não por espaços contados à mão.
Nome de repo é entrada não confiável: `PORTFOLIO_RECRUITER_MODE` tem 24
caracteres hoje, mas nada impede um repo futuro de ter 45. O gerador **trunca**
em `REPO_NAME_MAX = 32` com reticências, garantindo `36 + 16 = 52 ≤ 56` mesmo
com a linguagem mais longa do linguist (`Jupyter Notebook`).

**Sem coluna de data.** `pushed_at` ordena a lista, mas não é exibido. O dado
público mais recente é de julho/2026 enquanto o calendário registra 306 dias
ativos no ano (§4.4) — a atividade real está em repositório privado. Uma coluna
de data mostraria a data pública como se fosse a atividade do dev, o que é
falso. Ordenar por ela e não exibi-la mantém a lista atual sem afirmar nada
errado.

#### Agente 3 — `liaison` · contato e fechamento do loop

```
✳ received context from builder
> contact --open
  augustowestphal.netlify.app
  linkedin.com/in/augusto-westphal
  github.com/AugustoGitH
⏵ restarting scout…
```

A última linha do agente 3 fecha o ciclo: o loop não "recomeça do nada", ele é
entregue de volta.

#### Forma em `constants/roster.mjs`

O roster guarda **estrutura e texto fixo**; os valores entram por interpolação
a partir de `profile.json` no momento da geração.

```js
// Única declaração não-lida do projeto (§0.5). Espelhar a bio do GitHub.
// Ordem deliberada: especialidade primeiro, alcance depois.
export const ROLE = 'front-end specialist · full-stack developer'   // 42 col

export const LINKS = Object.freeze({
  linkedin: 'linkedin.com/in/augusto-westphal',
})

export const ROSTER = Object.freeze([
  Object.freeze({
    id:    'scout',
    title: 'agent://scout',
    box:   () => `✳ ${ROLE}`,
    lines: (d) => [
      '> whoami',
      `  ${d.user.name}`,
      `  @${d.user.company}`,
      `  active since ${d.user.since} · ${d.user.followers} followers`,
    ],
    foot:  '⏵ passing context to analyst…',
  }),
  // … analyst, builder, liaison
])
```

### 4.5 Linha do tempo

Valores de `constants/timing.mjs` (§2.6).

```
PHASE_S    6.5    por agente
FINALE_AT 24.1    os quatro acendem juntos
GROW.at   25.6    começa a subdividir; +1.4 para o nível seguinte
GROW_END  29.7    o campo de 64 começa a sair
TOTAL_S   30.4
```

Janela ativa do agente `i`: `[phaseStart(i), phaseStart(i) + PHASE_S)`.

Cues dentro da fase, contados do início dela:

| Evento | offset | duração |
| --- | ---: | ---: |
| caixa de status revela | 0.15 s | 0.30 s |
| linha de conteúdo `n` | `0.60 + n × 0.55` | 0.45 s |
| rodapé (handoff) | 5.30 s | 0.40 s |
| painel escurece | 6.20 s | 0.30 s |

Todos os `keyTimes` saem de `k(segundos)`; o `<animate>` mestre usa
`dur="28s" repeatCount="indefinite"`.

### 4.6 Primitivas de animação

Quatro primitivas cobrem tudo. Todas em `scripts/lib/svg.mjs`.

#### a) Revelação por clip (o "digitar")

Cada linha vive dentro de um `<g clip-path="url(#clip-N)">`. O retângulo do
clip cresce da esquerda para a direita.

```xml
<!-- agente 0, linha 0: revela 0.60s -> 1.05s, some em 6.50s -->
<clipPath id="clip-0-0">
  <rect x="12" y="88" width="390" height="15">
    <animate attributeName="width"
             values="0;0;390;390;0"
             keyTimes="0;0.0214;0.0375;0.2321;1"
             dur="28s" begin="0s" repeatCount="indefinite"/>
  </rect>
</clipPath>
```

- `width="390"` no markup ⇒ sem SMIL, a linha aparece inteira. (§0.3)
- último valor `0` ⇒ o loop reinicia sem salto visível.
- `begin="0s"` sempre; o atraso mora no `keyTimes`. Nunca use `begin` atrasado.
- **`values` e `keyTimes` têm que ter o mesmo número de entradas.** Cinco e
  cinco no exemplo. Divergência faz o navegador descartar a animação inteira em
  silêncio — sem erro, sem aviso. `assert.mjs` valida isso antes de escrever.
- os `keyTimes` saem de `k()`: `k(0.60) = 0.0214`, `k(1.05) = 0.0375`,
  `k(6.50) = 0.2321`.

#### b) Cursor de bloco

`<rect>` de `CELL_W × 12` em `T.accent`, na borda direita do clip. O piscar e o
gate de fase são **animações em elementos diferentes** — piscar no `<rect>`,
visibilidade da fase no `<g>` que o contém. Duas `<animate>` no mesmo atributo
do mesmo elemento entram em conflito.

```xml
<g opacity="1">
  <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="…"
           dur="28s" begin="0s" repeatCount="indefinite"/>
  <rect … fill="#d97757">
    <animate attributeName="opacity" values="1;1;0;0;1"
             keyTimes="0;0.49;0.5;0.99;1"
             dur="1.06s" begin="0s" repeatCount="indefinite"/>
  </rect>
</g>
```

#### Moldura e barra de título — `lib/pane.mjs`

O chrome era desenhado de `0` a `W`, **cobrindo o traço lateral do corpo**. O
corpo ficava com borda visível nas laterais e o header não, e o olho lê isso
como "o header é mais estreito que o corpo".

O chrome recua pela largura do traço (`PANE.STROKE`), então a moldura emoldura o
painel inteiro — header incluso — e as duas partes têm exatamente a mesma
largura pintada. O raio do chrome também encolhe pelo traço: raios iguais em
curvas concêntricas desalinhariam meio pixel.

O código estava duplicado entre a Seção 1 e a Seção 4, com o mesmo erro nas
duas. Agora vive em `lib/pane.mjs` e as duas seções não podem mais divergir.

#### c) Véu do painel inativo

Atributo de markup `opacity="0"` (fallback: todos os painéis nítidos); a
animação o levanta para `T.veilAlpha` fora da fase daquele agente.

```xml
<!-- agente 0: claro de 0s a 6.2s, escuro de 6.5s ao fim do ciclo -->
<rect x="0" y="0" width="414" height="254" rx="8" fill="#0d1117" opacity="0">
  <animate attributeName="opacity"
           values="0;0;0.62;0.62;0"
           keyTimes="0;0.2214;0.2321;0.9900;1"
           dur="28s" begin="0s" repeatCount="indefinite"/>
</rect>
```

O número de entradas varia com a posição do agente: o agente 0 é
`claro → escuro` (5 valores), os agentes 1–3 são `escuro → claro → escuro`
(7 valores). O gerador monta a lista a partir da fase, não à mão.

#### d) A multiplicação da frota

Depois que os quatro terminam e a grade acende inteira, cada painel se divide em
quatro, duas vezes: **4 → 16 → 64**. É o fecho da seção, e substituiu a limpeza
linha a linha.

O nível de 64 **não é legível, e não deveria ser**. Em 820×520 o painel fica com
92×55px e 29px de corpo — os três semáforos sozinhos ocupariam 52 dos 92 se
mantivessem o tamanho original. A ilegibilidade é a mensagem: você lê quatro, e
vê que são sessenta e quatro.

| nível | painel | mostra |
| --- | --- | --- |
| 4 | 404×254 | tudo — chrome, título, caixa, quatro linhas, rodapé |
| 16 | 196×121 | chrome, `agent://…` e duas barras que insinuam saída |
| 64 | 92×55 | chrome e um cursor |

**A cor diz a descendência.** Cada quadrante herda o agente pai: as 16 do canto
superior esquerdo descendem do `scout`, e assim por diante. `parentAgent(i, n)`
resolve isso pela posição, então subdividir lê como cada agente gerando uma
equipe, não como a grade trocando de tamanho.

**Custo pago com `<use>`.** Os 64 cursores saem de quatro símbolos em `<defs>`,
um por cor. `<use>` replica a animação em cada cópia: **64 cursores vivos por
quatro `<animate>` no arquivo**. Sem isso o orçamento de 150 estouraria.

> **Uma armadilha que isso trouxe.** `<use>` costuma vir com `xlink:href`, e o
> primeiro render escreveu o atributo sem declarar `xmlns:xlink` no root. Dentro
> de `<img>` o SVG é parseado como **XML estrito**, não como HTML tolerante: o
> navegador não renderiza nada e não avisa. `assertNamespaces` agora aborta a
> geração quando um prefixo não está declarado — `xml` e `xmlns`, que a
> especificação predefine, são exceção.

#### e) Spinner de espera

Painel inativo mostra no rodapé três pontos `● ● ●` com `opacity` defasada em
0.4 s, via `<animate>` com `repeatCount="indefinite"`.

Alternativa descartada: 8 quadros por `<set>` encadeados — 8 elementos contra
3, e sem SMIL degrada para nada visível em vez de três pontos estáticos.

### 4.7 Acessibilidade

```xml
<svg role="img"
     aria-label="Quatro agentes de terminal se apresentando em revezamento:
                 identidade, números do perfil, stack e contato.">
```

O `alt` do `<img>` no README repete a mesma informação em prosa (§3.3, regra 5).
O conteúdo textual de cada painel também vai como `<title>` do seu grupo.

### 4.8 Fallback estático

`STATIC=1 node scripts/render_agents.mjs` emite o mesmo SVG **sem nenhuma tag
`<animate>`**, com todos os painéis revelados e em brilho pleno. Serve para:

- conferir o layout sem esperar o loop;
- validar que o estado base do markup está correto (§0.3) — se o quadro
  estático estiver certo, o fallback está certo.

### 4.9 Orçamento e verificação

| Métrica | Alvo | Verificação |
| --- | ---: | --- |
| Tamanho do SVG | < 120 KB | `wc -c assets/agents-grid.svg` |
| Nº de `<animate>` | < 150 | `grep -c '<animate' assets/agents-grid.svg` |
| Colunas por linha | ≤ 56 | `assert.mjs` — **aborta** a geração |
| `values` × `keyTimes` | contagens iguais | `assert.mjs` — **aborta** a geração |
| Números mágicos | zero | grep de §2.9 |
| Determinismo | byte-idêntico | rodar 2× e comparar hash |

Erro de conteúdo tem que estourar na geração, não vazar no painel.

### 4.10 Integração no README

Bloco `01` do esqueleto de §3.2. Substitui o `readme-typing-svg` externo e o
`banner_00_rounded.png` de 699 KB; a limpeza está em §3.5.

### 4.11 Decisões da Seção 1

Todas resolvidas em 2026-09-06. **A Seção 1 está pronta para implementação.**

| Decisão | Resultado |
| --- | --- |
| `ROLE` | `front-end specialist · full-stack developer` (42 col) |
| Domínio | `augustowestphal.netlify.app` — campo `blog` do perfil já correto |
| Idioma | inglês em todos os painéis (§4.4) |
| `contrib.total` | **entra** no `analyst` — 3862 · 306 dias ativos (§4.4.1) |
| Coluna de data no `builder` | **não exibir** — ordena, não mostra (§4.4) |
| Nome da frota | **descartado** — `agent://` + nomes dos agentes já bastam (§4.2) |

**Única ação fora do código:** a bio do GitHub diz `Full-Stack Web Developer` e
não menciona a especialidade em front. Alinhar à `ROLE`, senão as duas fontes
voltam a divergir.

> **`ROLE` reaberta por evidência nova (2026-09-06).** A transcrição do cartão
> `banner_00_rounded.png` (ver `README-LEGADO.md` §1.1) revelou um campo `Focus`
> com três pilares: `Front-End, Back-End & Test Automation`. A `ROLE` decidida
> cobre os dois primeiros e omite o terceiro, que é o que explica seis badges de
> teste sem nenhuma contrapartida nos repos públicos. A decisão continua válida
> como está; a alternativa é `front-end specialist · full-stack · test
> automation` (46 col, cabe). Escolha de posicionamento, não de layout.


---

## 5. Seção 2 — A cidade de commits

### 5.1 Intenção

Um skyline em elevação plana: cada semana do ano é um prédio, a altura é o
volume de commits, e os andares são os dias. O objetivo declarado é **impressionar
pela densidade** — commits por dia e ao longo do período.

Substitui o snake do `Platane/snk@v3`, encerrando a última dependência de
terceiro que gera arte no README.

### 5.2 Por que cidade, e não outro heatmap

Não é escolha estética. Altura é um canal perceptivo mais preciso que saturação
de cor: comprimento se compara com exatidão, intensidade não.

E há um limite concreto no heatmap do GitHub: a escala de cor satura no nível 4.
Uma semana de 50 e uma de 200 pintam praticamente igual. Os dados de 2025-09 a
2026-09 vão de **15 a 201 commits por semana** — uma curva de crescimento de
5× ao longo do ano que o heatmap não consegue mostrar e a skyline mostra de
imediato.

**A restrição de janela definiu a altura.** A Seção 2 precisa ser visível junto
com a Seção 1. Numa página de perfil em 1080p sobram ~720px de conteúdo depois
do header fixo, das abas e do cabeçalho e padding da Box. Com a Seção 1 em 520px
e 16px de espaçamento, restam **184px**.

> **Revisado em 2026-09-06.** A junta entre seções (§3.3, regra 6b) foi de 16
> para ~64px com dois `<br />`, e o banner de 308px entrou acima de tudo (§8.7).
> A janela de leitura conjunta deixou de existir, e deixou de fazer sentido: uma
> página com abertura editorial é lida rolando. A altura de 176px da Seção 2
> continua onde está — 96px de prédio dariam agulhas de 1:14, e a proporção de
> 1:6.9 que a restrição produziu segue certa pelo motivo dela mesma, não pelo
> orçamento que a originou.

Isso não é um teto incômodo: em 796px úteis, 53 prédios dão 13px de largura
cada. Com 110px de altura máxima, o prédio mais alto fica em **1:8.5** — a
proporção de um arranha-céu real. Uma cidade mais alta viraria um campo de
agulhas verticais, perdendo justamente a leitura que motivou a escolha.

> **Alvo 1080p, assumido.** Em 1366×768 sobram 435px visíveis — nem a Seção 1
> sozinha cabe. Não há como atender telas menores sem reduzir a Seção 1 a ponto
> do texto de 11px deixar de ser legível. Nessas telas a leitura é sequencial.

### 5.3 Geometria

Canvas **820 × 176**. A largura é a mesma da Seção 1, travada pelo container do
README (§4.3); a altura sai do empilhamento, não é escolhida.

```
 32   TOP — topo do prédio mais alto     título e pico na baseline y = 27
 90   MAX_H
  1   linha do chão                      y = 122
 14   rótulos de mês                     baseline y = 136
 18   linha de status                    baseline y = 154
 22   respiro + descidas
```

Horizontal, com `PAD = 12` reaproveitado de `geometry.mjs`:

```
usável   796            CANVAS.W - PAD * 2
COL_W     15.02         usável / semanas      (derivado, não escolhido)
STREET     2
BUILDING  13.02         COL_W - STREET
```

`COL_W` deriva da contagem de semanas, que varia entre 52 e 53 conforme o ano
cai no calendário. Nada de largura fixa por prédio.

Aspecto do prédio mais alto: **1 : 6.9**. Janela ocupada: `520 + 16 + 176 = 712`
dos 720 disponíveis (§5.2).

#### 5.3.1 O título mora dentro da imagem

`TITLE_Y` e `PEAK_LABEL_Y` são a mesma baseline: título à esquerda, valor do
pico sobre o prédio mais alto. **A faixa já existia vazia** — só o rótulo do
pico a ocupava, num x lá na direita — então o título não custou altura de
canvas. Ao contrário: acomodá-lo levou `TOP` de 26 para 32 e `MAX_H` de 96 para
90, e o prédio mais alto melhorou de 1:7.4 para 1:6.9.

```js
TITLE: '$ git log --graph --since=1.year'
```

Tipografia: a mesma stack monoespaçada de todo o resto (§0.4) — não há webfont
a carregar. O destaque vem de tamanho (15px contra 11px), peso 600, entreletra
de 0.5px e a cor de acento. Monoespaçado em corpo grande fecha demais sem a
entreletra.

O motivo de prompt (`$ comando`) que era heading markdown sobrevive aqui, agora
num lugar onde a tipografia é nossa.

### 5.4 Mapa de dados

| Elemento | Dado | Verificado 2026-09-06 |
| --- | --- | --- |
| um prédio | uma semana | 53 semanas, nenhuma zerada |
| altura do prédio | commits da semana | 15 a 201 |
| faixas dentro do prédio | os 7 dias, altura proporcional | 306 faixas desenhadas |
| ordem das faixas | domingo no chão, sábado no topo | cronológica |
| tom da faixa | dia útil vs. fim de semana | fds = 7% do total |
| linha tracejada | média semanal | 72.1 commits |
| rótulo do pico | maior semana, valor impresso | 201 |
| linha do chão | eixo, e só | — |

**Os 365 dias continuam todos presentes.** Não há agregação: a altura lê o
volume da semana, as faixas leem o ritmo dentro dela. Um prédio alto com uma
faixa dominante foi um push único; um da mesma altura com seis faixas parecidas
foi semana constante. O dado de pico do período sustenta o contraste: **dia
recorde de 54 commits** e **49 dias acima de 20**.

Dia com zero commits não desenha faixa — some na costura entre as vizinhas.

### 5.5 Escala

Linear, sem compressão:

```
PX_POR_COMMIT = MAX_H / maiorSemana      110 / 201 = 0.5473
```

| Semana | Altura |
| ---: | ---: |
| 201 (pico) | 110.0 px |
| 72.1 (média) | 39.5 px |
| 15 (mínima) | 8.2 px |

Raiz quadrada ou log achatariam a curva de crescimento — que é exatamente a
informação que a seção existe para mostrar. Fica linear.

A escala é **relativa ao pico do próprio período**, então ela se reajusta quando
o dado muda. Por isso o pico é rotulado com o valor: sem uma âncora numérica,
uma skyline mostra forma sem magnitude.

### 5.6 Anotações

- **Rótulos de mês:** três, não doze. Início, meio e fim do período — alinhados
  à esquerda, ao centro e à direita, para nenhum vazar do canvas.
- **Linha da média:** tracejada, em `T.dim`, rotulada `avg 72`. É a segunda
  âncora de magnitude e o que torna a curva legível ("as últimas oito semanas
  estão todas acima").
- **Semana em construção:** a última semana do período é parcial — em
  2026-09-06 tem 15 commits em 1 dia. Desenhada com opacidade reduzida e topo
  tracejado. Num gráfico comum isso é um toco que precisa de nota de rodapé;
  numa cidade é um prédio em obra, e a metáfora carrega a ressalva do dado.

### 5.7 Linha de status

Duas âncoras, alinhadas às bordas — período à esquerda, densidade à direita:

```
sep 2025 -> sep 2026        3862 commits · 306/365 days active (84%) · 12.5 per active day
```

Larguras: 20 e 62 colunas, somando 541px dos 796 úteis. Folga confortável.

#### 5.7.1 Os dois totais do GitHub — decisão registrada

A API do GitHub devolve, **na mesma resposta**, dois valores que não batem:

```
totalContributions ......... 3862
soma dos 365 contributionDays ... 3821      (diferença de 41)
```

`totalContributions` conta contribuições que o calendário diário não expõe. Isso
cria uma escolha sem saída limpa:

| Rotular com | Ganha | Perde |
| --- | --- | --- |
| **3862** | bate com "3,862 contributions" que o GitHub mostra no próprio perfil | o número não é a soma dos prédios desenhados |
| 3821 | descreve exatamente o desenho | discorda do número visível no mesmo perfil |

**Decidido: 3862.** Um visitante compara o README com o cabeçalho do perfil
logo acima; ninguém soma 53 prédios. A Seção 1 já usa a mesma fonte, então as
duas seções concordam entre si.

> Registrado para que ninguém "conserte" isso depois: os prédios somam 3821 de
> propósito, porque o calendário diário do GitHub omite 41 contribuições que o
> total anual inclui. Não é bug do gerador.

Tudo que **não** é o total sai do array de dias — dias ativos, média por dia
ativo, pico semanal, pico diário. Esses são reprodutíveis a partir do mesmo
array que desenha os prédios.

### 5.8 Animação

A cidade se constrói da esquerda para a direita e congela.

Um único `clipPath` retangular varre o eixo do tempo — **uma `<animate>` para a
seção inteira**. O eixo x já é a linha do tempo, então a varredura da esquerda
para a direita é o ano passando, não um efeito.

```xml
<clipPath id="build">
  <rect x="12" y="0" width="796" height="180">
    <animate attributeName="width" values="0;796" keyTimes="0;1"
             dur="2.4s" begin="0s" fill="freeze"/>
  </rect>
</clipPath>
```

- `width="796"` no markup ⇒ sem SMIL a cidade aparece inteira (§0.3).
- `fill="freeze"`, sem `repeatCount`: é um gráfico, não uma narrativa. Uma
  visualização que se apaga e redesenha em loop cansa numa página que se lê.
  Diferente da Seção 1, que **é** uma narrativa e por isso repete.

Descartado: cada prédio subindo do chão. Custa 2 `<animate>` por prédio (106 no
total) contra 1, e a varredura já conta a mesma história — a do tempo passando.

### 5.9 Cores

A cidade é **terracota**, com o verde do GitHub reservado ao topo da
intensidade. A rampa está em §2.3.

```
t = sqrt(commitsDoDia / maiorDia)
```

Raiz quadrada, não linear: a distribuição é enviesada — 216 dos 306 dias ativos
ficam abaixo de 14 commits, e um mapeamento linear jogaria 70% deles no quarto
mais escuro da rampa.

> **Altura linear, cor em raiz — e isso não é incoerência.** Altura é o canal
> preciso, onde comprimir seria mentir sobre a curva de crescimento (§5.5). Cor
> é o canal de textura, onde a rampa só precisa distribuir bem os tons.

Distribuição resultante, verificada em 2026-09-06:

| Família | Dias | Fatia |
| --- | ---: | ---: |
| terracota | 253 | 82.7% |
| âmbar (transição) | 32 | 10.5% |
| verde | 21 | 6.9% |

**O verde se concentra, e é isso que lhe dá força.** Dos 21 dias verdes, **13
estão em agosto de 2026**:

```
out/25: 2   fev/26: 1   jun/26: 3   jul/26: 2   ago/26: 13
```

A cidade é terracota e o centro acende verde. A curva de crescimento fica
contada duas vezes — pela altura e pela cor — e o verde deixa de ser cor de
fundo para virar evento.

Descartado: os 5 níveis discretos do heatmap do GitHub. Os limiares dele caem em
~5/11/16 commits, então **80 dias (26% dos ativos), de 16 a 54 commits, pintariam
idênticos** — 38 commits de amplitude achatados. Esse teto foi o argumento a
favor da cidade (§5.2); adotá-lo seria trazê-lo de volta pela porta dos fundos,
e ele engole justamente o topo.

Demais elementos, sem token novo:

| Elemento | Token |
| --- | --- |
| bloco de dia | `CITY_RAMP`, pela intensidade |
| prédio em construção | mesma rampa, opacidade reduzida |
| linha do chão | `T.border` |
| linha da média | `T.dim`, tracejada |
| rótulos e status | `T.muted` |
| valor do pico | `T.ink` |

**Custo aceito:** a cor passou a codificar intensidade, então dia útil e fim de
semana ficaram indistinguíveis. Eram 7% dos commits. Se voltar a importar, o
canal livre é a largura do bloco, não a cor.

### 5.10 O que muda no pipeline

`fetch_profile.mjs` hoje guarda apenas `total`, `activeDays` e `days` do
calendário. O GraphQL **já devolve** as semanas e os dias — nenhuma chamada
nova, só persistir o que já chega:

```jsonc
"contrib": {
  "total": 3862,          // totalContributions (§5.7.1)
  "activeDays": 306,
  "days": 365,
  "from": "2025-09-07",
  "to": "2026-09-06",
  "weeks": [              // 53 entradas
    { "firstDay": "2025-09-07", "days": [0, 4, 9, 8, 7, 9, 0] }
  ]
}
```

Arquivos novos, seguindo o contrato de §1.3:

```
scripts/lib/constants/city.mjs   geometria, escala e limites da Seção 2
scripts/render_city.mjs          profile.json -> assets/commit-city.svg
```

### 5.11 Orçamento e verificação

| Métrica | Alvo | Verificação |
| --- | --- | --- |
| Tamanho do SVG | < 40 KB | `wc -c assets/commit-city.svg` |
| Nº de `<animate>` | 1 | `grep -c '<animate' assets/commit-city.svg` |
| Faixas desenhadas | = dias ativos | comparar com `contrib.activeDays` |
| Soma das alturas | = soma dos dias | `assert.mjs` — **aborta** se divergir |
| Status ≤ largura útil | 796 px | `assert.mjs` — **aborta** |
| Altura do canvas | ≤ 184 px | orçamento de janela (§5.2) |
| Determinismo | byte-idêntico | rodar 2× e comparar hash |

A verificação da soma é o que impede a cidade de mentir: se o desenho e o dado
divergirem, a geração para.

### 5.12 Decisões da Seção 2

| Decisão | Resultado |
| --- | --- |
| Projeção | **elevação plana** — isométrico distorce a comparação de altura, que é o canal que motivou a cidade |
| Canvas | 820 × 176, imposto pela janela de leitura conjunta (§5.2) |
| Unidade do prédio | semana; os dias viram faixas, nada é agregado fora |
| Escala | linear — comprimir achataria a curva que a seção existe para mostrar |
| Rótulos de mês | três: início, meio, fim |
| Total exibido | `totalContributions` (3862), com a divergência documentada (§5.7.1) |
| Animação | uma varredura, `fill="freeze"` — é gráfico, não narrativa |
| Paleta | terracota com o verde reservado ao topo da intensidade (§5.9) |
| Decoração | nenhuma. Lua, nuvens, carros e antenas não codificam dado (§0.5) |


---

## 6. Seção 3 — O poço de stacks

### 6.1 Intenção

Uma partida de Tetris onde cada peça é uma tecnologia. As peças caem, encaixam
de forma previsível mas imperfeita, a pilha completa fica visível por um
instante, e então desintegra de baixo para cima e recomeça.

Substitui a parede de 32 badges do `shields.io` — a última dependência de
serviço externo do README.

**Não é um jogo, é um replay.** Sem JS (§0.2), ninguém joga. É uma partida
gravada. Isso é a favor: um jogo de verdade num README seria uma distração.

### 6.2 O risco nomeado

Nas Seções 1 e 2 a forma carregava dado — altura era commits. **Uma lista de
stacks não tem distribuição.** Se a forma do Tetris não codificar nada, ela
vira uma lista com blocos coloridos em volta, que é o que a parede de badges já
era e o que §0.5 proíbe.

O que existe de dado real, e por onde entra:

| Dado | Canal |
| --- | --- |
| categoria (5 grupos, definidos por ele) | cor da peça |
| tamanho de cada grupo (12/4/7/6/3) | quanto do poço cada cor ocupa |
| distribuição medida nos repos públicos | painel lateral (§6.6) |

A largura da peça é o comprimento do nome, e isso é **estrutural, não dado** —
está registrado aqui para ninguém ler significado onde não há.

### 6.3 A forma sai do nome

As peças são **tetrominós de verdade** — as sete formas do jogo, quatro células
cada — e não retângulos. Isso parecia incompatível com nomes legíveis, e não é:
o nome não vai na peça inteira, vai na **maior sequência horizontal contígua**
dela.

| Forma | Sequência | Cabe (a 22px de célula, fonte 11) |
| :-: | :-: | ---: |
| `O` `S` `Z` | 2 células | 5 caracteres |
| `T` `J` `L` | 3 células | 9 caracteres |
| `I` | 4 células | 12 caracteres |

E aí a forma deixa de ser arbitrária: **ela é escolhida pelo tamanho do nome.**
Nome curto vira O/S/Z, médio vira T/J/L, longo vira I. Dentro de cada faixa há
rodízio pela ordem, para as sete aparecerem sem nada ser sorteado — §1.3 exige
determinismo.

As sete formas aparecem; a distribuição sai do rodízio e muda quando a lista muda.

#### Nomes: inteiros por padrão, resumidos por exceção

O nome vai inteiro. Encurta só quem não cabe nem na sequência de 4, e para a
palavra distintiva — **nunca para inicial**. Sigla obriga o leitor a decodificar
o que deveria reconhecer.

Das 33, **3 foram resumidas**:

| Original | No bloco |
| --- | --- |
| React Testing Library | `Testing Lib` |
| Robot Framework | `Robot` |
| Firebase Storage | `FB Storage` |

As outras 30 aparecem por extenso.
`PostgreSQL` inclusos, todos como peça `I`.

O `alt` da imagem lista os **nomes originais**: quem ouve recebe a informação
completa.

### 6.4 Vetor chapado: peça sólida, canto arredondado, calha

Cada peça é **uma forma só**. Não há divisão entre as células que a compõem — o
`L` é um `L` inteiro, não três quadrados encostados. Preenchimento chapado, sem
friso, sem relevo, sem contorno.

| Recurso | Efeito |
| --- | --- |
| um `<path>` por peça | some a costura interna entre células |
| cantos convexos arredondados, côncavos vivos | é o que sai de uma união de retângulos arredondados, e o que a referência mostra |
| calha de recuo em cada lado | separa peças vizinhas com um vão de fundo, não com uma linha |

**A calha é de desenho, não de empacotamento.** A queda com gravidade e os 40
buracos continuam idênticos: a peça ocupa as mesmas células, só é desenhada
menor. `GUTTER = 1.5` em célula de 22px dá 3px entre peças vizinhas — cerca de
14% da célula, na faixa da referência.

#### O contorno é traçado, não montado

`lib/outline.mjs` recebe o conjunto de células e devolve um caminho:

1. junta as arestas de cada célula e descarta as que têm vizinha dentro — sobra
   a fronteira
2. encadeia a fronteira num ciclo e funde as colineares em vértices
3. recua cada vértice pela soma das normais internas das duas arestas que nele
   se encontram
4. arredonda só os vértices convexos, com o raio limitado a metade do menor
   lado adjacente

O traçado sai do próprio `cells`, então não há geometria duplicada em constante
para divergir quando uma forma mudar.

#### O que isso substituiu

A versão anterior era pixel art: `shape-rendering="crispEdges"`, coordenada
inteira, friso claro de 1px por célula e uma camada escura inflada por peça para
separá-la das vizinhas. Eram **256 retângulos** e o `L` lia como três quadrados
encostados.

`crispEdges` saiu junto — ele serrilharia os cantos arredondados, e com ele cai
a exigência de coordenada inteira que existia só para servi-lo.

```
52.376 bytes  →  32.251 bytes
```

#### Geometria

```
CELL      22 px
GUTTER     1.5 px por lado
RADIUS     2.5 px no canto convexo
COLS      12         perto do poço clássico de 10 — proporção retrato
ROWS      18         14 usadas pela pilha + 4 de folga para a queda entrar
POÇO      264 × 396 px
CANVAS    820 × 450 px
PAINEL    508 px
```

Largura da peça: `ceil((nome + 1) / 2)` células, de **3 a 6** — e o encaixe é
conferido contra a largura **desenhada**, não a da grade. Uma peça de 3 células
oferece 63px, não 66, e `assertLabelFits` aborta a geração se o rótulo não
couber. Sem essa conferência o texto encosta nas bordas ou vaza, e nada avisa:
o SVG segue válido.

#### A ordem de queda intercala as categorias

Caindo na ordem das categorias, cada cor formava uma faixa horizontal e a pilha
lia como um gráfico de barras empilhadas — o oposto de um poço de Tetris.

A ordem de queda é um **rodízio**: uma peça de cada categoria, e repete. Rodízio,
e não sorteio, porque §1.3 exige determinismo.

A ordem das categorias em `stack.mjs` continua sendo a de **leitura** — é ela que
o painel lateral mostra. Só a queda embaralha.

#### Queda com gravidade, não encaixe ótimo

Cada peça é solta do topo em cada coluna e para no primeiro obstáculo; fica na
coluna que der o repouso mais baixo, desempate pela esquerda.

```
33 peças · 15 fileiras · 48 buracos
```

Descer do topo — em vez de procurar o melhor encaixe — é o que impede a peça de
escorregar para baixo de um beiral, e é o que **cria os buracos**. Buraco é a
assinatura visual do Tetris; um empacotamento ótimo pareceria um gráfico de
barras.

#### O que se manteve da referência, e o que não

A referência é uma ilustração sem texto, sobre branco, com sete cores
decorativas. Três desvios deliberados:

- **os nomes ficam** — são o conteúdo da seção; sem eles sobra uma ilustração
  que não diz nada
- **a paleta é a nossa** — cinco cores que dizem categoria, não sete que dizem
  nada
- **o fundo continua escuro** — abrir um terceiro registro claro, além do
  preview do produto, custaria mais do que rende

### 6.5 Cores

Nenhum token novo. As cinco categorias reusam as quatro cores de agente da
Seção 1 e o verde da Seção 2:

| Categoria | Peças | Cor |
| --- | ---: | --- |
| Front-End | 12 | `#d97757` âmbar |
| Back-End | 4 | `#56d4dd` ciano |
| Databases & ORM | 7 | `#d2a8ff` violeta |
| Testing | 6 | `#f778ba` rosa |
| Architecture | 3 | `#39d353` verde |

O README inteiro fecha em **cinco matizes**, e a Seção 3 é onde eles aparecem
juntos — o que faz dela o fecho visual do sistema, não uma peça avulsa.

Texto do bloco em `T.bg` (quase-preto) sobre a cor: contraste de 6.06:1 no pior
caso, o âmbar. Bloco sólido com texto escuro é a leitura de arcade, e inverte a
regra §0.7 de propósito — aqui a cor **é** a superfície, não o acento.

### 6.6 Painel lateral: o declarado ao lado do medido

O poço ocupa 264px; sobram ~508px. O painel usa esse espaço para colocar o que
o código público mede **ao lado** do que o perfil declara:

```
FRONT-END      12  ████        PUBLIC CODE
BACK-END        4  █           TypeScript   39.5%
DATABASES       7  ██          JavaScript   34.2%
TESTING         6  ██          CSS          18.4%
ARCHITECTURE    3  █           HTML          5.3%
                               Sass          2.6%
```

Isto resolve a tensão registrada em `README-LEGADO.md` §6.4 — 32 tecnologias
declaradas contra 5 linguagens medidas — **sem juízo de valor**.

> **Alternativa descartada:** marcar as 5 medidas com preenchimento sólido e as
> 27 restantes com contorno. Codificava mais, mas convidava a leitura de "27
> não verificadas" — que é falsa. O trabalho real está em repositório privado
> (3862 commits, 306 dias ativos, §5.7). Ausência nos repos públicos não é
> ausência de uso, e um desenho não deve sugerir o contrário.

Os dois blocos lado a lado, sem hierarquia: o poço diz o que ele declara, o
painel diz o que o código público mede. O leitor tira a própria conclusão.

### 6.7 Animação: queda em passos

```
0.2 – 6.2s   as 32 peças caem, escalonadas em 0.18s
6.2 – 7.7s   pilha completa, parada — o único momento em que a stack existe inteira
7.7 – 8.9s   desintegra de baixo para cima, fileira a fileira
8.9 – 10.0s  poço vazio
             recomeça
```

**A queda é discreta, uma fileira por vez** — `calcMode="discrete"` segura cada
posição até o próximo keyTime em vez de interpolar. É a diferença entre uma
peça que desliza e uma peça que cai num jogo em grade, e faz parte da leitura de
pixel art tanto quanto o `crispEdges`.

Cada peça é um `<g>` com quatro blocos e o texto: **um `animateTransform` para a
queda e um `animate` de opacidade para a desintegração** — 64 no total, folgado
sob o teto de 150.

O `animateTransform` é montado à mão e por isso passava ao largo da validação de
`values` × `keyTimes`. Agora é validado explicitamente: uma peça com contagens
divergentes aborta a geração, em vez de simplesmente não animar em silêncio.

A desintegração é por fileira, de baixo para cima, como a limpeza de linha do
jogo. Uma peça some quando a fileira em que sua base está é limpa.

**Esta seção repete.** É uma partida: tem começo, fim e um ciclo que faz parte
da peça — mesma razão pela qual a Seção 1 repete e a Seção 2 congela (§5.8).

### 6.8 Dados

Nada novo do GitHub. A taxonomia das 32 tecnologias e seus 5 grupos são dele,
transcritos do cartão anterior em `README-LEGADO.md` §1.1 e §3. Como não vêm de
API, vivem em `constants/` como conteúdo declarado — a mesma exceção nomeada de
`ROLE` em §0.5.

O painel de código público lê `langs` do `profile.json`, que já existe.

```
scripts/lib/constants/stack.mjs   taxonomia, resumos, cores por categoria
scripts/lib/pack.mjs              empacotamento bottom-left determinístico
scripts/render_stack.mjs          profile.json + stack.mjs -> assets/stack-well.svg
```

### 6.9 Orçamento e verificação

| Métrica | Alvo | Verificação |
| --- | ---: | --- |
| Tamanho do SVG | < 60 KB | `wc -c assets/stack-well.svg` |
| `<animate>` + `<animateTransform>` | 64 | `grep -c` |
| Peças desenhadas | = 33 | contagem contra `stack.mjs` |
| `values` × `keyTimes` da queda | contagens iguais | `assert.mjs` — **aborta** |
| Nenhuma peça fora do poço | — | `assert.mjs` — **aborta** |
| Determinismo | byte-idêntico | rodar 2× e comparar hash |

### 6.10 Decisões da Seção 3

| Decisão | Resultado |
| --- | --- |
| Formato | replay, não jogo — a plataforma não executa JS |
| Nomes | inteiros; 6 resumidos por não caberem; nenhuma sigla |
| Poço | 12 colunas × 18 fileiras, célula de 22px, calha de 1.5px |
| Empacotamento | queda com gravidade, determinística — 40 buracos por consequência, não por enfeite |
| Formas | os sete tetrominós; a forma é escolhida pelo tamanho do nome |
| Cores | as 5 já existentes; o README fecha em 5 matizes |
| Medido × declarado | lado a lado no painel, sem marcar as peças |
| Animação | queda em passos discretos → pilha → desintegração → loop |
| Estilo | vetor chapado: peça sólida, canto convexo arredondado, calha entre peças |


---

## 7. Seção 4 — O prompt devolvido

### 7.1 Intenção

Um terminal só, largura inteira, listando os endereços e devolvendo o prompt a
quem está lendo.

A Seção 1 abre com quatro agentes se apresentando, e é o `liaison` que fecha
aquele ciclo dizendo `-> restarting scout...`. Aqui **o mesmo liaison
reaparece** no fim da página — com o mesmo `agent://liaison` na barra de título
e a mesma cor — e para de falar. O cursor fica piscando.

A página abre com quatro terminais relatando e fecha com um esperando.

### 7.2 Esta seção não codifica dado, e isso está declarado

Um endereço é um endereço. Diferente das Seções 2 e 3, aqui **não há
distribuição a medir**, e a seção não exibe número nenhum.

§0.5 exige que todo número mostrado seja lido; não exige que toda seção mostre
número. Forçar uma métrica aqui produziria exatamente o enfeite disfarçado de
dado que o princípio existe para impedir.

### 7.3 O que se descartou

**Exibir status HTTP de cada endereço.** Era a única coisa medível, e não
sobreviveu a duas checagens:

| Problema | Medido em 2026-09-06 |
| --- | --- |
| o LinkedIn devolve `999` a requisição sem navegador | é anti-bot, não link quebrado — exibir isso mentiria |
| a latência varia entre execuções | 1.81s e 1.74s na mesma sessão; entraria em `profile.json` e quebraria o determinismo (§1.3), fazendo o CI commitar todo dia sem mudança real |

### 7.4 A verificação foi para o coletor

O que morreu como desenho sobreviveu como **asserção**: `fetch_profile.mjs`
confere cada endereço e **aborta o pipeline** se algum ficar inalcançável.

"Vivo" é ter resposta HTTP, qualquer que seja — o `999` do LinkedIn conta.
"Morto" é falhar na rede: DNS que não resolve ou conexão recusada. Foi
exatamente assim que `augustowestphal.site` esteve quebrado no README anterior
sem ninguém notar (`README-LEGADO.md` §4).

Nada disso entra em `profile.json`. A verificação protege; a imagem não vira
painel de monitoramento.

### 7.5 Geometria

Canvas **820 × 206**, o menor das quatro seções. A altura sai do empilhamento:

```
26   barra de título, com os semáforos e agent://liaison
30   $ connect --list                     baseline y = 56
30   primeiro endereço                    baseline y = 86
22   passo entre endereços                mais arejado que o corpo — é o fecho
30   do último endereço até o prompt      baseline y = 182
```

Moldura, semáforos e barra de título são os mesmos da Seção 1: é o mesmo
terminal, num painel só em vez de quatro.

### 7.6 Animação: revela e não recomeça

```
0.10 – 0.45s   $ connect --list
0.70 – 2.40s   os quatro endereços, escalonados em 0.45s
2.90 – 3.25s   o prompt
depois         o cursor pisca, indefinidamente
```

Cada linha usa o mesmo clip que abre da Seção 1 — mesma mecânica, mesmo
terminal.

**Congela, mas continua viva.** A revelação roda uma vez com `fill="freeze"`; o
cursor tem sua própria `<animate>` com `repeatCount="indefinite"`. É a quarta
combinação distinta do documento, e cada uma tem razão própria:

| Seção | Comportamento | Porquê |
| --- | --- | --- |
| 1 · agentes | repete | é uma narrativa, o ciclo faz parte dela |
| 2 · cidade | congela | é um gráfico; redesenhar em loop cansa |
| 3 · tetris | repete | é uma partida: começo, fim e recomeço |
| 4 · contato | congela, cursores vivos | a página termina; o convite não |

### 7.7 Clicabilidade — por que a seção virou cinco arquivos

Um `<a>` envolve a imagem inteira e dá **um destino só**, e o GitHub remove
`<a>` de dentro do SVG. Não existe link por região: quatro alvos exigem quatro
arquivos.

A saída ingênua seria manter o terminal com a lista e pôr as peças embaixo — e
aí cada endereço apareceria duas vezes. Em vez disso **o terminal encurtou**: a
lista saiu dele, e ele ficou com o que só ele pode dizer.

```
● ● ●  agent://liaison            contact-prompt.svg   820 × 110
       $ connect --list
       augusto@westphal:~$ █

[ portfolio ][ linkedin ][ github ][ email ]   link-<id>.svg   194 × 46 cada
```

Cada peça herda a **cor do agente correspondente** da Seção 1 — âmbar, ciano,
violeta, rosa — para a fileira ler como quatro coisas distintas em vez de quatro
botões iguais.

E cada uma pisca num ritmo próprio: 1.06s, 1.22s, 0.94s, 1.14s. Em uníssono
pareceriam um só elemento cintilando; fora de fase, parecem quatro processos
vivos. A defasagem vem de durações diferentes, não de `begin` atrasado — que
§0.3 proíbe.

**A fileira fecha exatamente na largura do terminal.** O espaço em branco entre
`<img>` inline é decidido pelo navegador e não serve de medianiz — então cada
peça ocupa **1/4 da largura cheia (205px)** e traz a medianiz desenhada dentro
de si: metade dela em **cada** borda interna, nada nas externas.

```
peça 0   placa   0..201     recua só à direita
peça 1   placa 209..406     recua dos dois lados
peça 2   placa 414..611     recua dos dois lados
peça 3   placa 619..820     recua só à esquerda
```

Os dois recuos são independentes. Subtrair a medianiz apenas nas pontas deixava
as peças do meio com a largura cheia, e a placa transbordava a arte de 205px: o
traço direito era recortado fora e as duas do meio apareciam sem borda de um
lado.

**Endereço trunca em vez de transbordar.** O endereço completo vive no `href` e
no `alt`; na placa ele só precisa identificar. A peça mais estreita é a régua, e
o corte usa `...` em ASCII — o caractere de reticências pode faltar na fonte do
sistema (§0.4). Com medianiz de 8px cabem 33 colunas e o endereço mais longo tem
32, então hoje nada trunca: é guarda, não recurso em uso.

Consequência no markdown: **nenhum espaço entre as tags `<a>`**. Um único
caractere em branco viraria ~4px de medianiz fantasma e a fileira deixaria de
alinhar com o terminal acima.

A linha de links em markdown puro **saiu**: as peças fazem o mesmo trabalho
desenhadas.

### 7.8 Orçamento e verificação

| Métrica | Alvo | Verificação |
| --- | ---: | --- |
| Tamanho dos 5 SVGs | < 10 KB | `wc -c assets/contact-prompt.svg assets/link-*.svg` |
| Animações | 4 no terminal + 1 por peça | `grep -c` |
| Largura das linhas | ≤ largura útil | `assert.mjs` — **aborta** |
| Endereços alcançáveis | todos | `fetch_profile.mjs` — **aborta** |
| Determinismo | byte-idêntico | rodar 2× e comparar hash |

### 7.9 Decisões da Seção 4

| Decisão | Resultado |
| --- | --- |
| Forma | um terminal, o mesmo `agent://liaison` da Seção 1 |
| Dado | nenhum — a seção apresenta, não mede, e isso está declarado |
| Status HTTP | descartado no desenho, movido para asserção no coletor |
| Animação | revela uma vez e congela; o cursor pisca para sempre |
| Cor | rosa do `liaison` — o agente de contato fecha a página |
| Clicabilidade | quatro peças, uma por endereço, cada uma num `<a>` (§7.7) |


---

## 8. Seção 0 — O banner

### 8.1 Intenção

Uma folha de contatos: três quadros da mesma sessão fotográfica abrindo a
página e servindo de porta para o blog de tecnologia.

### 8.2 Dois registros, de propósito

O preto-e-branco editorial contra o terminal cyberpunk **não é inconsistência**.
A página passa a ter dois registros:

- **a pessoa** — fotográfico, mesma linguagem da foto de perfil do GitHub
  (verificada em 2026-09-06: mesmo preto-e-branco, mesma parede de reboco, mesma
  geração)
- **o sistema** — os quatro terminais e gráficos abaixo

O banner pertence ao primeiro. Por isso o brilho das fotos **não** é tingido no
acento do sistema: tingir tentaria costurar dois registros que devem ler como
dois.

### 8.3 A única seção raster

Toda outra seção é vetor gerado. Esta carrega três JPEG embutidos como data URI.

**Por que embutir, e não referenciar três arquivos:** a seção continua sendo UM
arquivo, como todas as outras (§0.8), e o texto fica em SVG de verdade — com a
tipografia do sistema — em vez de queimado no raster.

As fotos entram **inteiras**. São quadradas na origem (1024×1024) e o conteúdo
dos três quadros é para ser preservado, então há reamostragem, não recorte.

| | |
| --- | ---: |
| origem | 1024×1024, ~1.3 MB cada |
| quadro | 390×390 JPEG q85, ~21 KB cada |
| exibido | 260×260 (1.5× para tela densa) |
| SVG final | 91 KB, dentro do teto de 120 KB |

### 8.4 O corte roda à mão — o caso que §1.1 previu

`scripts/prep_banner.py` reamostra e comprime. **Python, local, nunca no CI** —
exatamente a exceção que §1.1 abriu ao dizer que processamento de imagem é o
único terreno sem equivalente maduro em npm.

Os caminhos das fotos originais ficam no script como registro da origem; outras
entram por argumento.

`render_banner.mjs`, esse sim, é Node e determinístico: só lê os `.jpg` prontos
e embute. O CI o roda como qualquer outro render.

### 8.4.1 Ordem dos quadros e manchete

**A ordem de exibição não é a de geração.** O quadro `03` — o agachamento
simétrico, com os dois símbolos apoiados no banco — vai ao **centro**, e o `02`
vai à direita. A simetria no meio dá eixo à peça; nas pontas ela se perdia.

A descrição de cada quadro viaja junto com ele em `BANNER.SRC`, então o `alt`
não pode divergir do que está desenhado quando a ordem mudar.

**Manchete `My Blog`**, sobreposta aos três. Sobre foto o texto não pode
depender do que houver atrás, então vem numa **faixa escura de largura cheia** a
82% — o strap de capa de revista — com o corpo em 34px e entreletra de 2.5px
(monoespaçado em corpo de manchete fecha muito mais que em corpo de texto).

Monocromática: o acento pertence ao sistema, e o banner é o registro
fotográfico (§8.2).

### 8.5 Geometria

```
TITLE_Y   27      mesma linha de base das Seções 2 e 3
TOP       42      topo dos quadros
PAD       12
GUTTER     8
SIDE     260      (usável 796 - 2 medianizes) / 3
CANVAS   820 × 314
```

**O título fica acima da montagem**, não abaixo — mesma convenção de §5.3 e
§6.4. O estado (`writing · soon`) vai à direita, na mesma linha de base: assim o
banner não tem texto sob os quadros e abre a página como um cabeçalho.

O número do quadro fica **sobre** a foto, no canto inferior esquerdo — é a marca
da borda do filme, e economiza uma linha de legenda.

### 8.6 O blog ainda não existe, e o pipeline barraria o link

`fetch_profile.mjs` aborta quando um endereço não responde (§7.4). Se a URL do
blog entrasse no `PROBE` antes de estar no ar, **o primeiro cron quebraria** —
seria repetir o bug do `augustowestphal.site` com o mecanismo que criamos para
impedi-lo.

Então: o banner declara o estado (`writing · soon`) e **não** leva link. Quando
o blog subir, são duas linhas — a URL no `PROBE` e um `<a>` na linha de links do
bloco 04.

### 8.7 Consequência: a janela de leitura conjunta acabou

§5.2 dimensionou a Seção 2 para caber na tela junto com a Seção 1. Com o banner
de 308px acima, isso deixa de ser possível — e deixa de fazer sentido: uma
página com abertura editorial é lida rolando.

A altura da Seção 2 continua onde está: 96px de prédio dariam agulhas de 1:14, e
a proporção de 1:6.9 que a restrição produziu segue sendo a certa pelo motivo
dela mesma, não pelo orçamento que a originou.

### 8.8 Decisões da Seção 0

| Decisão | Resultado |
| --- | --- |
| Registro visual | fotográfico, sem tingir — contraste deliberado com o sistema |
| Recorte | nenhum; as três fotos inteiras |
| Formato | JPEG q85 embutido como data URI num SVG |
| Corte e compressão | Python, local e à mão (§1.1) |
| Link do blog | ausente até estar no ar; o banner declara o estado |
| Ordem | 01, 03, 02 — a simetria vai ao centro |
| Manchete | `My Blog` em faixa de largura cheia, monocromática |
| Animação | os quadros surgem escalonados, a manchete por último, e congela em 1.6s |


---

## 9. Seção 1 — O preview do produto · fora do README

> **Removida do README em 2026-09-07.** O bloco saiu, o asset foi apagado e o
> render saiu do CI. Os scripts, as constantes e os ícones extraídos ficam no
> repositório: a seção custou muito para ser descartada, e reativá-la é repor o
> bloco e a linha do workflow. O capítulo abaixo segue valendo como registro do
> que foi decidido e por quê.

### 9.1 Intenção

Uma sessão de uso gravada do BudgetXpert: o ponteiro clica em **Budgets**, os
cards aparecem, ele abre um deles e chega na tabela de orçamento. Somente
leitura, em loop.

Não é um jogo nem um app embutido — sem JS (§0.2), é um **replay**, pela mesma
razão que a partida da Seção 4 é.

### 9.2 Posição: depois do banner, antes da apresentação

```
00 banner     capa — identidade visual
01 produto    o que ele constrói        ← aqui
02 agentes    quem é
03 cidade     atividade
04 stacks     ferramentas
05 links      contato
```

O README abria com o teaser de um blog que **ainda não existe**. Um produto no
ar é uma primeira impressão mais forte, e o banner segue como capa.

O produto vir antes da apresentação funciona porque a página de perfil do GitHub
já mostra nome e avatar na barra lateral, ao lado do README — o visitante não
depende da Seção 2 para saber de quem é o perfil.

### 9.3 Terceiro registro, e por quê

O produto é uma interface corporativa **clara**, dentro de uma página escura. É
o terceiro registro do README, depois do fotográfico (banner) e do terminal.

Repintar o BudgetXpert de terracota deturparia o produto. A coisa parece com ela
mesma — mesma lógica que manteve as fotos do banner em preto e branco (§8.2).

### 9.4 Fiel às telas reais, amostra no conteúdo

A primeira versão foi reconstruída só a partir do código e **errou o essencial**:
inventou uma sidebar com rótulos onde o produto tem um trilho de ícones, e uma
tabela plana onde ele tem cabeçalho hierárquico de tempo. Capturas da aplicação
corrigiram o desenho.

O que é fiel, de capturas de 2026-09-07 e do código:

| Elemento | Origem |
| --- | --- |
| cabeçalho com marca, busca, seletor de organização e avatar | captura |
| trilho de **ícones** (não rótulos), com o item ativo em chip teal | captura + `Sidebar/constants.ts` |
| **todos** os glifos — trilho, busca, empresa, seta, ações da barra, plano do card, versões | **os SVGs do produto**, extraídos por `prep_icons.mjs` |
| card: barra de plano colorida, badge, PLANO/PERÍODO/ESTADO, duas barras de progresso, contagem de versões | captura + `BudgetCard` |
| pills ELABORAÇÃO e EXECUÇÃO | captura + `tailwind.config.ts` |
| tabela: faixa BUDGET, ano, trimestre, mês; linhas numeradas com expansão; marcador laranja na célula; símbolo de vazio | captura + `BudgetTable` |
| paleta | **amostragem de pixel** das capturas |

As cores saíram do pixel, não do palpite: `#062D3E` no cabeçalho, `#1D4253` na
busca, `#9FC131` e `#7C3AED` nas barras de plano, `#FF6900` no ponto de
progresso, `#F26522` no marcador de célula.

**Nada de dado real entra.** Nomes, datas e números são amostra; os repositórios
são privados e da organização, e o conteúdo é dos clientes. A moldura declara:
`preview · sample data`.

Como a Seção 5, esta seção **apresenta, não mede** — e isso fica declarado, não
disfarçado (§0.5).

### 9.5 Geometria

Canvas **820 × 330**, 16px a mais que o banner — o preço de um card completo
legível. O app ocupa 796 × 276.

```
TITLE_Y           27    mesma linha de base das demais seções
header            34
trilho            44    ícones, sem rótulo
barra de título   32
card             186    quatro por linha
tabela                 faixa 16 + ano 14 + trimestre 14 + mês 16, linhas de 19
```

Os corpos vão de 6.5 a 11px: o SVG imita uma tela de ~1280px reduzida a 796, e o
texto precisa da proporção que teria no app.

#### Ver o resultado, não só os números

Este render é o primeiro que **não dá para conferir por medida**. Uma
reimplementação em Pillow reproduziria os meus próprios erros.

A verificação passou a ser rasterizar o SVG de verdade, com `cairosvg`, num
ambiente isolado fora do repositório. Foi assim que apareceu a marca
`Budget✕pert` sobreposta: os três pedaços eram três `<text>` com `x` calculado
pelo avanço monoespaçado, e qualquer fonte diferente os empilhava. Viraram
`<tspan>` — o fluxo é do renderizador, e o desenho deixa de depender do avanço
previsto.

**Regra que sai daqui:** posição derivada de largura de texto é frágil. Onde o
fluxo resolve — `tspan`, `text-anchor` — prefira o fluxo.

#### O trilho tem dois estados

Inativo, o ícone é verde sobre o fundo do trilho. Ativo, um chip verde e o ícone
branco. São os dois únicos estados, e o trilho mostra **cinco** itens — Analyses
e AI Xpert saíram a pedido.

#### O que estava na referência mas não é o produto

A captura pegou o indicador flutuante do Next.js no canto inferior esquerdo. É
ferramenta de desenvolvimento, não interface — foi removido e fica ignorado nas
próximas referências.

#### Os ícones vêm do produto, não da mão

A primeira versão desenhava aproximações — uma casinha, um retângulo, um
círculo. Nenhuma era o glifo do produto, e a seção existe para ser fiel.

`scripts/prep_icons.mjs` lê `src/svg/icons/outline` do repositório do produto e
gera `lib/constants/icons.mjs`: sete ícones, treze `<path>` num viewBox 20×20.
Roda **local e à mão**, como o `prep_banner.py` — depende de um repositório
privado, e o CI só lê o módulo gerado (§1.1).

#### Todas as animações repetem

As telas usavam `fill=freeze`: rodavam uma vez e a sessão **congelava na
tabela**, enquanto só o ponteiro seguia em ciclo. Era o comportamento da Seção 3
aplicado por engano a uma seção que é narrativa, não gráfico.

Agora as seis animações têm `repeatCount=indefinite`, e cada tela volta a zero
no fim do ciclo. Verificação: `grep -c 'fill="freeze"'` no arquivo tem que dar
zero.

#### Os offsets de UI moram agrupados por zona

Desenhar uma interface produz dezenas de números pequenos. As duas versões deste
render tiveram **72 e 23** valores soltos, e a auditoria de §0.9 pegou os dois
lotes. Ficaram agrupados em `LAY`: `stroke`, `header`, `rail`, `titlebar`,
`card`, `table`.

### 9.6 O roteiro do ponteiro

```
0.35 – 1.45s   o ponteiro vai até Budgets
1.45s          clique — pulso, e a seleção da sidebar acende
1.90 – 2.25s   os cards entram
2.25 – 3.35s   o ponteiro vai até o primeiro card
3.35s          clique
3.80 – 4.15s   a tabela entra
4.15 – 7.15s   parado, tempo de ler
               recomeça
```

A seta é um `path` em frações da própria altura (`ARROW`), então mudar
`TOUR.CURSOR` reescala o desenho inteiro. O pulso do clique mora **dentro** do
grupo do ponteiro, na origem — assim ele acompanha a seta sem precisar de uma
segunda animação de posição.

Um só elemento de pulso serve aos dois cliques, com dois picos na mesma lista de
`values`. Separar dois eventos vizinhos exige `keyTimeTick()`: menos que isso e
os dois valores arredondam para o mesmo keyTime, o que descartaria a animação
inteira (§4.6).

**O estado base é a TABELA.** Sem SMIL o leitor recebe o quadro mais informativo
da sessão, não a tela vazia por onde ela começa (§0.3).

### 9.7 Molde para outros produtos

`constants/product.mjs` é o molde. Trocar de produto é trocar `PRODUCT`, `NAV`,
`UI`, `CARDS` e `TABLE` — a mecânica do ponteiro e das telas não sabe qual
produto está desenhando.

### 9.8 Decisões da Seção 1

| Decisão | Resultado |
| --- | --- |
| Posição | 01, depois do banner e antes da apresentação (§9.2) |
| Registro | claro, a paleta do produto — repintar deturparia (§9.3) |
| Dado | telas reais como referência, cores amostradas do pixel, números de amostra |
| Interação | replay com ponteiro visível; a plataforma não executa JS |
| Altura | 330 — 16px a mais que o banner, o preço de um card completo legível |
| Reuso | `product.mjs` é o molde para o próximo projeto |
