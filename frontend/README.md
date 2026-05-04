# Geldmacht — Frontend

Painel financeiro pessoal de **Antonio Carlos**, construído com Next.js. Replica visualmente a planilha Excel de controle financeiro (CLT + PJ + Investimentos B3 + Cartão + Caixinhas), com dados mockados em JSON que serão substituídos por chamadas de API na Fase 3.

> **"Geldmacht"** — poder financeiro (alemão). O objetivo é transformar dados complexos em clareza visual.

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

# 4. Abrir no navegador
open http://localhost:3000
```

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
   - Cards: `background: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border-subtle)'`
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

## Padrões Visuais

### Identidade Dark Navy Fintech

- **Tema:** Dark navy, inspirado em terminais Bloomberg e painéis de trading
- **Fontes:** DM Sans (corpo) + DM Mono (valores numéricos) — carregadas do Google Fonts
- **Animação de entrada:** `fadeInUp` com `animation-delay` escalonado (delay-1 a delay-4)

### Paleta (CSS Variables em `globals.css`)

```css
/* Superfícies */
--surface-bg: #0f1b2d       /* fundo da página */
--surface-card: #1c2d45     /* cards e tabelas */
--surface-hover: #22374e    /* hover de linha */

/* Semântica de valores */
.value-positive → var(--green-400)  /* entradas */
.value-negative → var(--red-400)    /* gastos */
.value-invest   → var(--blue-400)   /* investimentos */
.value-neutral  → var(--text-secondary)

/* Acentos */
--green-400: #48bb78   /* entradas, dividendos */
--red-400: #fc8181     /* gastos, fatura cartão */
--amber-400: #f6ad55   /* fixos, moradia, alertas */
--blue-400: #63b3ed    /* investimentos, ETFs, links */
--teal-400: #4fd1c5    /* PJ, renda fixa */
--purple-400: #b794f4  /* ETFs, Bitcoin (reservado) */
```

### Convenções de Números

- Valores monetários: **sempre à direita**, `font-family: var(--font-mono)`, `font-variant-numeric: tabular-nums`
- Datas: formato `dd/mm/yyyy` via `formatDate()` em `src/lib/formatters.ts`
- Percentuais: uma casa decimal via `formatPercent()`

---

## Documentos de Referência

| Documento | Descrição |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Contexto completo do usuário, regras de negócio, estrutura de dados |
| [`../BACKLOG.md`](../BACKLOG.md) | Estado atual do projeto, o que foi feito, próximos passos |
| [`../docs/ROADMAP.md`](../docs/ROADMAP.md) | Visão macro das 3 fases |
| [`../docs/FASE-1-FRONTEND.md`](../docs/FASE-1-FRONTEND.md) | Especificação detalhada de cada tela da Fase 1 |
| [`../docs/FASE-2-BACKEND.md`](../docs/FASE-2-BACKEND.md) | Planejamento do backend (FastAPI + PostgreSQL) |
| [`../docs/DADOS-MOCK.md`](../docs/DADOS-MOCK.md) | Estrutura dos JSONs mockados |
