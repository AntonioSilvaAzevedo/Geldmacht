# 🎨 Fase 1 — Frontend com Dados Mockados

## 🎯 Objetivo

Construir uma interface web que **replica a planilha** atual, mas com visual moderno e dados mockados em arquivos JSON.

**Resultado esperado:** ao final desta fase, o usuário deve abrir o app no navegador e ver todas as informações da planilha de forma navegável e bonita.

---

## 🛠️ Stack Recomendada

```
Next.js 14+ (App Router)      # Framework React full-stack
TailwindCSS                   # Estilização
Recharts                      # Gráficos (linha, barra, pizza)
Lucide React                  # Ícones
date-fns                      # Manipulação de datas
```

**Por que Next.js?**
- Roteamento por arquivos (App Router) — mais simples que React Router
- Server Components reduzem o JS enviado ao cliente
- Pronto para deploy na Vercel com 1 clique
- Mesma base já preparada para evoluir para Server Actions / API Routes nas próximas fases
- Imagens otimizadas, fontes otimizadas, SEO básico embutido

**Não usar nesta fase:**
- Backend separado, banco de dados, autenticação
- TypeScript (opcional, mas pode complicar o início — começar com JS puro)
- Bibliotecas pesadas de UI (Material, Chakra, etc.) — Tailwind dá mais flexibilidade
- Redux ou state managers complexos (useState/useContext bastam)

---

## 📁 Estrutura de Pastas Sugerida (Next.js App Router)

```
frontend/
├── public/
├── src/
│   ├── app/                          # 🔥 App Router (Next.js 14+)
│   │   ├── layout.jsx                # Layout raiz (Sidebar + Header)
│   │   ├── page.jsx                  # 📊 Dashboard Anual (/)
│   │   ├── globals.css               # Tailwind + estilos globais
│   │   ├── mes/
│   │   │   └── [mes]/
│   │   │       └── page.jsx          # 📅 Visão Mensal
│   │   ├── cartao/
│   │   │   └── [mes]/
│   │   │       └── page.jsx          # 💳 Detalhe da fatura
│   │   ├── carteira/
│   │   │   └── page.jsx              # 💼 Carteira B3
│   │   └── proventos/
│   │       └── page.jsx              # 💰 Proventos
│   ├── data/                         # 🔥 DADOS MOCKADOS (JSON)
│   │   ├── transactions.json
│   │   ├── investments.json
│   │   ├── dividends.json
│   │   ├── creditCard.json
│   │   └── monthlyData.json
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Header.jsx
│   │   ├── Card.jsx                  # Card resumo (R$ valor + label)
│   │   ├── DataTable.jsx             # Tabela genérica
│   │   ├── MonthSelector.jsx         # Seletor de mês
│   │   └── charts/
│   │       ├── BarChart.jsx
│   │       ├── PieChart.jsx
│   │       └── LineChart.jsx
│   ├── lib/
│   │   ├── formatters.js             # formatCurrency, formatDate
│   │   └── calculations.js           # somar, agrupar por categoria
│   └── hooks/
│       └── useFinancialData.js       # carrega os JSONs
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── jsconfig.json
└── README.md
```

**Notas sobre App Router:**
- Cada pasta dentro de `app/` vira uma rota
- `[mes]` é parâmetro dinâmico (acessível via `params.mes`)
- `layout.jsx` envolve todas as páginas filhas
- Componentes podem ser **Server** (default) ou **Client** (`"use client"` no topo)
- Para páginas com gráficos interativos e estado, marque como `"use client"`

---

## 🖥️ Telas a Implementar

### 1. Dashboard Anual (`/`)

**Réplica da aba "📊 Dashboard Anual" da planilha.**

**Componentes:**
- 4 cards no topo: Total Entradas Ano, Total Gastos Ano, Total Investido, Saldo Líquido
- Tabela mensal com colunas: Mês | Salário CLT | Honorários PJ | FGTS | Vale | Total Entradas | Cartão | Fixos | Total Gastos | Investimentos | Saldo
- Gráfico de barras: Entradas vs Gastos vs Investimentos por mês
- Gráfico de linha: Evolução do saldo líquido
- Gráfico de pizza: % por categoria de gasto

### 2. Visão Mensal (`/mes/[mes]`)

**Réplica das abas "📅 Jan-2026", "📅 Fev-2026", etc.**

**Componentes:**
- Seletor de mês no topo
- Seções colapsáveis:
  - ▶ Entradas
  - ▶ Contas Fixas / Moradia
  - ▶ Fatura Cartão
  - ▶ Movimentações de Contas (informativo)
  - ▶ Investimentos
- Card de saldo líquido em destaque
- Botão "Ver detalhes do cartão" → leva para `/cartao/[mes]`

### 3. Detalhe do Cartão (`/cartao/[mes]`)

**Réplica das abas "🧾 Transações Cartão Mar", etc.**

**Componentes:**
- Header: Total da fatura + período + vencimento
- Tabela com filtros: Data | Descrição | Valor | Categoria
- Filtro por categoria (Alimentação, Compras Online, Vestuário, etc.)
- Gráfico de pizza: gastos por categoria
- Highlights: maiores gastos, parcelas ativas

### 4. Carteira B3 (`/carteira`)

**Réplica da aba "💼 Carteira B3".**

**Componentes:**
- 4 cards no topo: Total Ações | Total FIIs | Total ETFs | Patrimônio Total
- Tabela de ativos com: Ticker | Nome | Tipo | Qtde | Preço Atual | Valor Total | % Carteira
- Filtros: por categoria, por segmento (FIIs)
- Gráfico de pizza: alocação por categoria
- Top 10 posições
- Tabela de aportes mensais por categoria
- Tabela de proventos por mês com gráfico de barras

### 5. Proventos (`/proventos`)

**Visão dedicada aos dividendos/rendimentos.**

**Componentes:**
- Resumo anual: Total de Proventos | Média Mensal | Maior Mês
- Tabela mensal com: Mês | Rendimentos (FII) | Dividendos | JCP | Total
- Gráfico de barras empilhadas por mês
- Detalhamento expansível por mês (cada lançamento)
- Top ativos pagadores

---

## 📊 Dados Mockados

Os JSONs devem seguir a estrutura definida em `docs/DADOS-MOCK.md`. Use os valores **reais** da planilha para Jan-Abr/2026, assim o visual já é fiel.

**Princípio:** os dados mockados de hoje devem ser fáceis de **substituir por chamadas de API** na Fase 3. Por isso usaremos um hook `useFinancialData()` que abstrai a fonte.

```jsx
// Hoje (Fase 1):
const { transactions } = useFinancialData('transactions');
// → lê de src/data/transactions.json

// Fase 3:
const { transactions } = useFinancialData('transactions');
// → faz fetch('/api/transactions')
```

---

## ✅ Checklist de Conclusão da Fase 1

- [ ] Projeto Next.js criado e rodando localmente (`npm run dev`)
- [ ] TailwindCSS configurado
- [ ] Sidebar com navegação entre as 5 telas (usando `next/link`)
- [ ] Dashboard Anual funcionando com dados de Jan-Abr
- [ ] Visão Mensal funcionando para os 4 meses (rota dinâmica `/mes/[mes]`)
- [ ] Detalhe do Cartão para Jan, Fev, Mar
- [ ] Carteira B3 com posição completa + aportes + proventos
- [ ] Tela de Proventos funcionando
- [ ] Gráficos interativos (mín. 3 tipos: barra, pizza, linha) — em Client Components
- [ ] Layout responsivo (testar em mobile)
- [ ] Cores e identidade visual consistentes
- [ ] Hook `useFinancialData` abstrai a fonte dos dados
- [ ] README do frontend explicando como rodar

---

## 🎨 Diretrizes Visuais

**Paleta sugerida** (inspirada na planilha refinada):
- **Navy** `#1A365D` — header, totais principais
- **Slate** `#2D3748` — sidebar, headers de tabela
- **Verde** `#2F855A` — entradas (Salário, etc.)
- **Vermelho** `#C53030` — saídas (Cartão, gastos)
- **Âmbar** `#B7791F` — moradia, alertas
- **Azul** `#2B6CB0` — investimentos, ETFs
- **Teal** `#2C7A7B` — PJ, renda fixa
- **Roxo** `#6B46C1` — Bitcoin
- **Cinzas** `#F7FAFC`, `#EDF2F7` — backgrounds suaves

**Tipografia:**
- Sans-serif (Inter, ou system-ui padrão)
- Tabular numerals para valores monetários (`font-variant-numeric: tabular-nums`)

**Padrões de UI:**
- Valores monetários **sempre alinhados à direita**
- Datas no formato `dd/mm/yyyy`
- Use ícones (Lucide React) para categorias
- Animações suaves (Tailwind `transition-all duration-200`)

---

## 🚀 Por Onde Começar com o Claude Code

Após criar o projeto, peça ao Claude Code:

> "Leia o CLAUDE.md, o docs/FASE-1-FRONTEND.md e a skill frontend-design (SKILL.md). Vamos começar a Fase 1. Crie o projeto Next.js 14+ com App Router + Tailwind na pasta `frontend/` (use `npx create-next-app@latest frontend --js --tailwind --app --no-src-dir=false`). Em seguida, crie os arquivos JSON mockados em `frontend/src/data/` com os valores que estão no CLAUDE.md (Jan-Abr/2026). Por fim, implemente o `app/layout.jsx` com Sidebar e a tela de Dashboard Anual em `app/page.jsx`, seguindo os padrões da skill frontend-design."

A partir daí, vá iterando: peça uma tela por vez, valide o resultado, refine. **Sempre lembre o Claude Code de consultar a skill frontend-design** ao criar novos componentes.

**Dica importante sobre Next.js:**
- Páginas com gráficos interativos, useState, useEffect → marcar como `"use client"` no topo
- Páginas que só renderizam dados estáticos podem ficar como Server Components (default — mais rápidas)
- Para importar JSON local, basta usar `import data from '@/data/transactions.json'`
