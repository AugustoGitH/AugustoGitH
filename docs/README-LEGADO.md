# Inventário do README anterior

> Capturado em **2026-09-06**, antes da limpeza que deixa apenas a Seção 1.
> Este documento existe para que **nenhuma informação se perca na demolição**.
> Fonte de conteúdo para as Seções 2, 3 e 4, que ainda não foram especificadas.

---

## 0. Por que este documento existe

Parte do conteúdo do README anterior estava **dentro de um PNG**, não em texto.
Deletar o arquivo sem transcrever teria destruído a única cópia do e-mail de
contato e da linha de foco profissional. Tudo abaixo está em texto pesquisável.

---

## 1. `banner_00_rounded.png` — o achado principal

**699 KB · PNG · transcrito integralmente abaixo.**

Não é decoração: é um cartão no estilo `neofetch` com um **retrato em ASCII** à
esquerda e uma ficha técnica à direita. O mesmo conceito que a Seção 1 recria em
SVG — só que raster, não selecionável, não pesquisável e não acessível.

### 1.1 Ficha técnica (transcrição literal)

```
augusto@westphal ------------------------------------------------------------

Name .................................................. Augusto Caetano Westphal
Role .......................................................... Full-Stack Web Developer
Company ....................................................................... BudgetXpert
Focus ..................................... Front-End, Back-End & Test Automation
Experience ....................................................................... 5+ years

Stacks.Programming ................................. JavaScript, TypeScript
Stacks.Frontend .. React, Next.js, Styled Components, MUI, Bootstrap, jQuery, Apollo Client
Stacks.Backend ................... Node.js, Express.js, NestJS, GraphQL
Stacks.Database ......... PostgreSQL, MongoDB, Prisma, TypeORM, Sequelize, Firebase
Stacks.Testing ....... Jest, React Testing Library, Mocha, Chai, Selenium, Robot Framework
Architecture ................................. SOLID, Design Patterns, Clean Code

Contact ----------------------------------------------------------------------

Portfolio ............................................. augustowestphal.site
Email ................................... augustoc.westphal.ltda@gmail.com
LinkedIn ................................................ in/augusto-westphal

Resume ------------------------------------------------------------------------

Passionate Full-Stack Web Developer committed to using technology to create
meaningful and impactful solutions. Constantly seeking new challenges,
learning opportunities, and innovative projects that drive both personal
and professional growth
```

### 1.2 Dados que existiam SOMENTE aqui

| Campo | Valor | Consequência |
| --- | --- | --- |
| **Email** | `augustoc.westphal.ltda@gmail.com` | ausente do markdown; alimenta a Seção 4 |
| **Focus** | `Front-End, Back-End & Test Automation` | terceiro pilar (automação de teste) não aparecia em nenhum outro lugar |
| **Experience** | `5+ years` | coerente com a bio do GitHub |
| **Resume** | parágrafo acima | versão longa da bio, útil como copy |

### 1.3 Retrato ASCII

O lado esquerdo é uma foto convertida em caracteres, sobre fundo escuro, com
recorte arredondado. **Fica preservado como arquivo** — não deletar
`banner_00.png` nem `banner_00_rounded.png` enquanto as Seções 2–4 estiverem
abertas. Sai do README agora; sai do disco só quando não houver mais uso.

---

## 2. `readme-typing-svg` — parâmetros e falas

Serviço externo (`readme-typing-svg.demolab.com`), removido pela Seção 1.

**Parâmetros:** `font=JetBrains Mono` · `weight=500` · `size=18` ·
`duration=3000` · `pause=1200` · `color=#61DAFB` · `center` · `vCenter` ·
`width=900`

**Falas, na ordem:**

```
1. $ whoami
2. Building modern web applications...
3. Frontend Specialist
4. Clean Code Enthusiast
5. Always Learning...
```

`#61DAFB` é o ciano do React — **a cor de acento da identidade anterior**.
Ver conflito em §6.

---

## 3. Badges — a stack declarada

**32 badges de tecnologia + 3 de contato.** Todos com fundo `#20232A`
(cinza-azulado do React) e `logoColor` na cor oficial de cada marca.

Esta é a stack **declarada**, e não é derivável dos repositórios: ferramentas
de teste e arquitetura não aparecem como linguagem de repo. É insumo obrigatório
da Seção 3.

### Front-End (12)

| Tecnologia | logo | logoColor |
| --- | --- | --- |
| React | `react` | `#61DAFB` |
| Next.js | `nextdotjs` | `white` |
| TypeScript | `typescript` | `#3178C6` |
| JavaScript | `javascript` | `#F7DF1E` |
| HTML5 | `html5` | `#E34F26` |
| CSS3 | `css3` | `#1572B6` |
| Sass | `sass` | `#CC6699` |
| Styled Components | `styledcomponents` | `#DB7093` |
| Bootstrap | `bootstrap` | `#7952B3` |
| Material UI | `mui` | `#007FFF` |
| Apollo Client | `apollographql` | `#311C87` |
| jQuery | `jquery` | `#0769AD` |

### Back-End (4)

| Tecnologia | logo | logoColor |
| --- | --- | --- |
| Node.js | `nodedotjs` | `#339933` |
| Express.js | `express` | `white` |
| NestJS | `nestjs` | `#E0234E` |
| GraphQL | `graphql` | `#E10098` |

### Databases & ORM (7)

| Tecnologia | logo | logoColor |
| --- | --- | --- |
| PostgreSQL | `postgresql` | `#4169E1` |
| MongoDB | `mongodb` | `#47A248` |
| Prisma | `prisma` | `white` |
| TypeORM | — | — |
| Sequelize | `sequelize` | `#52B0E7` |
| Firestore | `firebase` | `#FFCA28` |
| Firebase Storage | `firebase` | `#FFCA28` |

### Testing (6)

| Tecnologia | logo | logoColor |
| --- | --- | --- |
| Jest | `jest` | `#C21325` |
| React Testing Library | `testinglibrary` | `#E33332` |
| Mocha | `mocha` | `#8D6748` |
| Chai | — | — |
| Selenium | `selenium` | `#43B02A` |
| Robot Framework | `robotframework` | `white` |

### Architecture (3)

`SOLID` · `Design Patterns` · `Clean Code` — sem logo, fundo `#20232A`.

---

## 4. Estrutura e voz

### Cabeçalhos em motivo de prompt

```
## $ open contact/
## $ tree ./tech-stack
```

Comentários HTML no arquivo também seguiam o motivo. **Preservar** — é
identidade do perfil (§3.3, regra 7 da spec).

### Bloco de fechamento

```text
$ exit

Session closed.

Thanks for visiting.
```

### Links

| Destino | URL | Estado em 2026-09-06 |
| --- | --- | --- |
| Portfólio | `https://augustowestphal.site` | **DNS não resolve** |
| LinkedIn | `https://www.linkedin.com/in/augusto-westphal/` | ok |
| GitHub | `https://github.com/AugustoGitH` | ok |
| Email | `augustoc.westphal.ltda@gmail.com` | só no PNG |

---

## 5. Snake — `.github/workflows/snake.yml`

```yaml
uses: Platane/snk@v3
  github_user_name: AugustoGitH
  outputs: dist/github-contribution-grid-snake.svg
           dist/github-contribution-grid-snake-dark.svg?palette=github-dark
uses: crazy-max/ghaction-github-pages@v4
  target_branch: output
cron: "0 */12 * * *"
```

Publica na branch `output`; o README consumia via `raw.githubusercontent.com`.
Referência funcional para a Seção 2 — o efeito a replicar com código próprio.

---

## 6. Conflitos e decisões herdadas

### 6.1 Como ele se apresenta — três respostas diferentes

| Fonte | Diz |
| --- | --- |
| typing-svg do README | `Frontend Specialist` |
| Cartão PNG (`Role`) | `Full-Stack Web Developer` |
| Cartão PNG (`Focus`) | `Front-End, Back-End & Test Automation` |
| Bio do GitHub | `Full-Stack Web Developer with ~5 years of experience` |

Decidido na spec §4.11: `ROLE = 'front-end specialist · full-stack developer'`.

> **Revisar:** a decisão foi tomada antes desta transcrição e **não contempla
> automação de teste**, que o cartão trata como um dos três pilares e que
> explica 6 badges (Selenium, Robot Framework, Mocha, Chai, Jest, RTL) sem
> nenhuma contrapartida nos repos públicos. Ver spec §4.11.

### 6.2 Cor de acento

A identidade anterior era **ciano React `#61DAFB` sobre `#20232A`**. A Seção 1
adota **terracota `#d97757` sobre `#1e1e1e`**. São paletas incompatíveis —
decidir se a Seção 1 puxa as demais para o terracota ou se o ciano volta como
acento nas Seções 2–4.

### 6.3 E-mail: exposição

Hoje o e-mail está **dentro de um PNG**, o que o esconde de coletor automático.
Promovê-lo a texto no README o expõe a harvesting. Decisão da Seção 4: manter
como imagem, ofuscar, usar formulário, ou aceitar a exposição.

### 6.4 Stack declarada × stack medida

| Declarado | Medido nos repos públicos |
| --- | --- |
| 32 tecnologias | 5 linguagens |
| Selenium, Robot Framework, Chai, Mocha | nenhuma ocorrência |

Não é contradição — ferramenta de teste não vira `repo.language`, e a atividade
real está em repositório privado (3862 contribuições, 306 dias ativos). Mas a
Seção 3 precisa decidir **como** apresentar declarado e medido sem que um
desminta o outro.

---

## 7. O que alimenta qual seção

| Seção | Insumo deste documento |
| --- | --- |
| 2 · Commits | §5 (snake como referência funcional) |
| 3 · Stacks | §3 (32 badges), §1.1 (taxonomia `Stacks.*` do cartão), §6.4 |
| 4 · Links | §4 (links + e-mail), §6.3, §1.1 (Contact) |
| transversal | §6.2 (paleta), §4 (voz e motivo de prompt) |

---

## 8. Checklist da limpeza

Executada em **2026-09-06**, com as quatro seções já implementadas.

- [x] `README.md` reduzido aos quatro blocos (spec §3.2) — 34 linhas, contra 88
- [x] `banner_00.png` e `banner_00_rounded.png` — **mantidos em disco**, fora do
      README. O conteúdo está transcrito em §1.1; a arte ASCII em si, não.
- [x] `.github/workflows/snake.yml` — **removido**: a Seção 2 o substituiu
- [x] `.github/workflows/update-readme-art.yml` — criado
- [ ] branch `output` — **órfã** desde a remoção do snake. Não foi apagada:
      remover branch remota é irreversível e é decisão do dono do repositório.
- [x] este documento escrito ANTES da limpeza

### O que saiu do README

| Item | Peso |
| --- | ---: |
| `readme-typing-svg.demolab.com` | serviço externo |
| `banner_00_rounded.png` | 699 KB |
| 32 badges de tecnologia (`shields.io`) | serviço externo |
| 3 badges de contato (`shields.io`) | serviço externo |
| snake via `Platane/snk@v3` + `crazy-max/ghaction-github-pages@v4` | duas actions de terceiro |
| 5 headings markdown | — |

**Zero serviços de terceiro sobraram no README.** Todo pixel que se move vem de
código deste repositório.
