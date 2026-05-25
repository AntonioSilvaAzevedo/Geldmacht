# Geldmacht — Frontend

Painel financeiro pessoal de **Antonio Carlos**, construído com Next.js. Replica visualmente a planilha Excel de controle financeiro (CLT + PJ + Investimentos B3 + Cartão + Caixinhas), com dados mockados em JSON que serão substituídos por chamadas de API na Fase 3.

> **"Geldmacht"** — poder financeiro. O objetivo é transformar dados complexos em clareza visual.

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 15 (App Router) | Framework React full-stack, roteamento por arquivo |
| TypeScript | 5 | Type safety end-to-end |
| Tailwind CSS | 4 | Utilitários CSS (mínimo usado — identidade visual via CSS vars) |
| Recharts | 3 | Gráficos (BarChart, LineChart, PieChart) |
| Lucide React | 1 | Ícones SVG |
| date-fns | 4 | Formatação de datas |

---

## Estrutura de Pastas

```
frontend/src/
├── app/                        # App Router (Next.js)
│   ├── layout.tsx              # Layout raiz: Sidebar + wrappers globais
│   ├── page.tsx                # / → Dashboard Anual (Jan–Abr 2026)
│   ├── globals.css             # Design tokens (CSS vars), tipografia, tabelas, animações
│   ├── mes/
│   │   └── [mes]/
│   │       └── page.tsx        # /mes/2026-03 → Visão Mensal com seções colapsáveis
│   ├── cartao/
│   │   └── [mes]/
│   │       └── page.tsx        # /cartao/2026-03 → Detalhe da fatura + filtros + pizza
│   ├── carteira/
│   │   └── page.tsx            # /carteira → Carteira B3: ações, FIIs, ETFs, aportes
│   └── proventos/
│       └── page.tsx            # /proventos → Dividendos, JCP, Rendimentos FII
│
├── components/
│   ├── Layout/
│   │   ├── Sidebar.tsx         # Menu lateral com navegação ativa
│   │   └── Header.tsx          # Barra superior: título, data, botões
│   └── MonthSelector.tsx       # Chips de mês (Jan/Fev/Mar/Abr) + setas de navegação
│
├── data/                       # JSONs mockados (fonte da verdade Fase 1)
│   ├── monthlyData.json        # Resumo consolidado por mês (entradas, gastos, investimentos)
│   ├── transactions.json       # Lista plana de transações (todas as contas)
│   ├── creditCard.json         # Detalhe das faturas por mês
│   ├── investments.json        # Posição B3 + aportes mensais
│   └── dividends.json          # Proventos: Rendimento / Dividendo / JCP por mês
│
├── hooks/
│   └── useFinancialData.ts     # Hook central de dados (abstrai a fonte — ver seção abaixo)
│
├── lib/
│   └── formatters.ts           # formatCurrency, formatDate, formatPercent, classifyValue
│
└── types/
    └── financial.ts            # Tipos TypeScript para todos os datasets
```

---

## Como Rodar Localmente

**Pré-requisitos:** Node.js 20+, npm 10+

```bash
# 1. Entrar na pasta do frontend
cd frontend

# 2. Instalar dependências
npm install

# 3. Rodar em desenvolvimento
npm run dev

# 4. Abrir no navegador (porta padrão 3010; backend em 8010)
open http://localhost:3010
```

Copie `.env.example` para `.env.local` e ajuste se necessário. O backend local deve expor a API em `http://localhost:8010` (ex.: `uvicorn app.main:app --reload --port 8010` no repo `geldmacht-api`), com CORS permitindo `http://localhost:3010`.

**Build de produção:**

```bash
npm run build
npm start
```

---

## Como Adicionar uma Nova Tela

1. **Criar a pasta/arquivo** em `src/app/`:
   ```bash
   mkdir -p src/app/nova-tela
   touch src/app/nova-tela/page.tsx
   ```

2. **Adicionar ao Sidebar** em `src/components/Layout/Sidebar.tsx`:
   ```tsx
   const navItems = [
     // ...
     { href: '/nova-tela', label: 'Nova Tela', icon: SomeIcon },
   ];
   ```

3. **Buscar dados via hook** no topo do componente:
   ```tsx
   const { data, loading, error } = useFinancialData('monthly'); // ou outro dataset
   ```

4. **Seguir os padrões visuais** (ver seção abaixo):
   - Cards: `background: var(--surface-card)`, `borderRadius: var(--radius-lg)`, borda opcional (sutil) ou `box-shadow: var(--shadow-card)` — ver [`CLAUDE.md`](./CLAUDE.md)
   - Tabelas: classe `data-table`
   - Valores numéricos: `fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums'`
   - Animação de entrada: classe `animate-in delay-1` (até `delay-4`)

5. **Marcar como `'use client'`** se a tela tiver estado, efeitos, gráficos ou eventos do DOM.

---

## Como Funcionam os Dados Mockados

O hook `useFinancialData` é a única interface de dados do frontend:

```typescript
// Em qualquer componente 'use client':
const { data, loading, error } = useFinancialData('monthly');
const { data, loading, error } = useFinancialData('transactions');
const { data, loading, error } = useFinancialData('creditCard');
const { data, loading, error } = useFinancialData('investments');
const { data, loading, error } = useFinancialData('dividends');
```

**Fase 1 (atual):** o hook usa `import()` dinâmico dos arquivos JSON em `src/data/`. Os dados já são os reais de Jan–Abr/2026.

**Fase 3 (futura):** para conectar ao backend real, basta alterar o `datasetLoaders` em `src/hooks/useFinancialData.ts`:

```typescript
// Antes (Fase 1):
monthly: () => import('@/data/monthlyData.json').then(m => m.default),

// Depois (Fase 3):
monthly: () => fetch('/api/monthly').then(r => r.json()),
```

Nenhuma tela precisa mudar — a interface do hook permanece idêntica.

---

## Padrões visuais (Apple Direction)

A identidade atual segue o **design system “Apple Direction”** (preto verdadeiro, SF Pro / system UI, verde e vermelho semânticos para fluxo de caixa). **Não usar** navy/cinza‑azulado como fundo de página nem **DM Sans**.

### Onde está documentado

| O quê | Onde |
|---|---|
| Princípios e checklist de UI | [`CLAUDE.md`](./CLAUDE.md) (secção no topo) |
| Tokens e classes (fonte de verdade na app) | [`src/app/globals.css`](./src/app/globals.css) |
| Espelho / referência do token file | [`apple-tokens.css`](./apple-tokens.css) (raiz do `frontend`) |
| Museu HTML (opcional, local) | `Apple_Direction.html` — **não commitar** (está no `.gitignore`) |

### Tipografia

- **Corpo e títulos:** `var(--font-sans)` (−apple‑system, SF Pro, Helvetica Neue, `system-ui`).
- **Valores e datas em colunas:** `var(--font-mono)` com **DM Mono** (única família carregada via Google Fonts).

### Superfícies (ordem de profundidade)

| Token | Papel |
|---|---|
| `--surface-0` (`--surface-bg`) | Fundo da página (`#000000`) |
| `--surface-1` (`--surface-card`) | Card principal |
| `--surface-2` (`--surface-panel`) | Painéis aninhados / cabeçalhos densos |
| `--surface-3` | Inputs / controles |

### Semântica de valores

- **Positivo / entrada:** `var(--green)` — classes `.value-positive` / `.val-positive`
- **Negativo / saída:** `var(--red)` — `.value-negative` / `.val-negative`
- **Investimentos / destaque secundário:** `var(--purple)` — `.value-invest` / `.val-invest` (evitar azul como “cor de dinheiro positivo”)

### Tipografia semântica (classes)

Ex.: `.t-hero`, `.t-large-title`, `.t-title1`, `.t-title2`, `.t-title3`, `.t-body`, `.t-footnote`, `.t-section-label`, `.t-numeric` (definidas em `globals.css`).

### Raios e espaço

- Cards padrão: `var(--radius-lg)` (20px); hero/modal: `var(--radius-xl)` (26px).
- Grid 8pt: `var(--space-4)` … `var(--space-8)`; inset mínimo de card: `var(--inset-card)`.

### Animação de entrada

- Classe **`animate-in`** (+ `delay-1` … `delay-4`): keyframes **`gm-fade-up`** em `globals.css`.

### Paleta de referência rápida (`globals.css`)

Variáveis como `--green`, `--red`, `--blue`, `--orange`, `--purple`, `--separator`, `--shadow-card` e aliases legados (`--navy-*`, `--green-400`, …) estão alinhados aos tokens Apple; detalhes no ficheiro ou em `apple-tokens.css`.

### Convenções de Números

- Valores monetários: **sempre à direita**, `font-family: var(--font-mono)`, `font-variant-numeric: tabular-nums`
- Datas: formato `dd/mm/yyyy` via `formatDate()` em `src/lib/formatters.ts`
- Percentuais: uma casa decimal via `formatPercent()`

---

## Documentos de Referência

| Documento | Descrição |
|---|---|
| [`./CLAUDE.md`](./CLAUDE.md) | Contexto do projeto + **diretrizes visuais (Apple Direction)** |
| [`../BACKLOG.md`](../BACKLOG.md) | Estado atual do projeto, o que foi feito, próximos passos |
| [`../docs/ROADMAP.md`](../docs/ROADMAP.md) | Visão macro das 3 fases |
| [`../docs/FASE-1-FRONTEND.md`](../docs/FASE-1-FRONTEND.md) | Especificação detalhada de cada tela da Fase 1 |
| [`../docs/FASE-2-BACKEND.md`](../docs/FASE-2-BACKEND.md) | Planejamento do backend (FastAPI + PostgreSQL) |
| [`../docs/DADOS-MOCK.md`](../docs/DADOS-MOCK.md) | Estrutura dos JSONs mockados |
