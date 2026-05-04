# AGENTS.md — Geldmacht Frontend

Contexto do projeto para agentes de IA (Claude, Cursor, Copilot, etc.).
Leia este arquivo antes de qualquer tarefa de desenvolvimento.

---

## O que é este projeto

**Geldmacht** é um painel financeiro pessoal. O nome vem do alemão *"poder do dinheiro"*.
Agrega extratos bancários (Nubank, Itaú, MercadoPago), categoriza transações automaticamente
e exibe dashboards de gastos, investimentos, cartão de crédito e proventos.

Stack: **Next.js 15 App Router + TypeScript + Tailwind CSS v4 + Recharts**.
Backend separado no repo `geldmacht-api` (FastAPI + PostgreSQL).

---

## Estrutura de pastas

```
frontend/
├── src/
│   ├── app/                      # Rotas (App Router)
│   │   ├── page.tsx              # / → Dashboard Anual
│   │   ├── layout.tsx            # Layout raiz (Sidebar + children)
│   │   ├── globals.css           # Design tokens e estilos globais
│   │   ├── upload/page.tsx       # /upload → Importar extratos
│   │   ├── mes/[mes]/page.tsx    # /mes/2026-04 → Detalhe mensal
│   │   ├── cartao/[mes]/page.tsx # /cartao/2026-04 → Fatura cartão
│   │   ├── carteira/page.tsx     # /carteira → Carteira de investimentos
│   │   └── proventos/page.tsx    # /proventos → Dividendos e rendimentos
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx       # Navegação lateral (desktop)
│   │   │   └── Header.tsx        # Cabeçalho de página (título + subtítulo)
│   │   ├── Upload/
│   │   │   └── UploadPreview.tsx # Preview de transações antes de importar
│   │   ├── EmptyState.tsx        # Tela quando não há dados no banco
│   │   ├── ErrorState.tsx        # Tela de erro de API
│   │   └── LoadingSpinner.tsx    # Spinner de carregamento
│   │
│   ├── config/
│   │   └── env.ts                # ← ÚNICO ponto de leitura de env vars
│   │
│   ├── hooks/
│   │   └── useFinancialData.ts   # Hook genérico de busca de dados
│   │
│   ├── lib/
│   │   ├── api.ts                # ← ÚNICO ponto de chamadas HTTP ao backend
│   │   └── formatters.ts         # formatCurrency, formatDate, classifyValue
│   │
│   ├── types/
│   │   └── financial.ts          # Todos os tipos TypeScript do domínio
│   │
│   └── data/archive/             # JSONs legados (dados mockados) — não editar
│
├── .env.local                    # URL local (gitignored)
├── .env.production               # URL de produção (commitado)
└── vercel.json                   # { "framework": "nextjs" }
```

---

## Regras de desenvolvimento

### 1. Chamadas de API
- **Toda** comunicação com o backend passa por `src/lib/api.ts`.
- Nenhum componente ou página chama `fetch()` diretamente para o backend.
- A URL base vem de `src/config/env.ts` → `config.apiUrl`.

### 2. Variáveis de ambiente
- Lidas **apenas** em `src/config/env.ts`. Nenhum outro arquivo acessa `process.env` diretamente.
- `NEXT_PUBLIC_API_URL` é embutida em build-time (não runtime). Mudanças exigem novo deploy.

### 3. Tipos
- Todos os tipos de domínio ficam em `src/types/financial.ts`.
- Ao adicionar campos do backend, atualizar o tipo correspondente aqui.

### 4. Estilo
- Design tokens definidos em `globals.css` (variáveis CSS `--navy-*`, `--green-*`, etc.).
- Estilização via `style={{}}` inline ou classes utilitárias do `globals.css`.
- **Não** usar classes Tailwind diretamente nos componentes — o projeto usa CSS custom properties.
- Animações de entrada: classe `animate-in` e `delay-{N}` definidas em `globals.css`.

### 5. Navegação
- Rotas da sidebar definidas no array `navItems` em `Sidebar.tsx`.
- Para adicionar uma tela: criar `src/app/[rota]/page.tsx` e adicionar item ao array.

---

## Endpoints do backend

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/upload` | Upload de PDF/Excel — retorna preview (não persiste) |
| `POST` | `/api/import` | Persiste transações confirmadas |
| `GET` | `/api/transactions` | Lista transações com filtros |
| `GET` | `/api/dashboard/monthly` | Dados agregados por mês para o Dashboard |

**Filtros disponíveis em `/api/transactions`:**
`account`, `month` (YYYY-MM), `category`, `start_date`, `end_date`, `limit`, `offset`

---

## Fluxo de importação de extratos

```
1. /upload  → usuário arrasta PDF ou Excel
2. POST /api/upload → backend parseia, retorna preview (sem salvar)
3. UploadPreview.tsx exibe as transações para revisão
4. Usuário confirma → POST /api/import → dados persistidos no Supabase
5. Dashboard atualiza automaticamente
```

**Parsers disponíveis no backend:**
- `nubank_pf` — extrato conta corrente Nubank (PDF)
- `fatura_nubank` — fatura cartão Nubank (PDF)
- `itau` — extrato Itaú (PDF)
- `mercadopago` — extrato MercadoPago (Excel/CSV)

---

## Telas e status

| Rota | Tela | Dados | Status |
|---|---|---|---|
| `/` | Dashboard Anual | `GET /api/dashboard/monthly` | ✅ API real |
| `/upload` | Importar Extratos | `POST /api/upload` + `POST /api/import` | ✅ API real |
| `/mes/[mes]` | Detalhe Mensal | `GET /api/transactions?month=YYYY-MM` | ✅ API real |
| `/cartao/[mes]` | Fatura Cartão | archive JSON (mock) | ⚫ pendente API |
| `/carteira` | Carteira Investimentos | archive JSON (mock) | ⚫ pendente API |
| `/proventos` | Dividendos | archive JSON (mock) | ⚫ pendente API |

---

## Hook `useFinancialData`

```typescript
const { data, loading, error } = useFinancialData('monthly');
// datasets: 'monthly' | 'transactions' | 'creditCard' | 'investments' | 'dividends'
```

- Datasets `monthly` e `transactions` buscam da API real.
- `creditCard`, `investments` e `dividends` retornam `null` por enquanto (pendente Etapa 3.2+).

---

## URLs e deploy

| Ambiente | Frontend | Backend |
|---|---|---|
| **Local** | `http://localhost:3000` | `http://localhost:8000` |
| **Produção** | `https://geldmacht.com` | `https://geldmacht-api-production.up.railway.app` |

- Frontend: **Vercel** — deploy automático no push para `main`
- Backend: **Railway** — deploy automático no push para `main` do repo `geldmacht-api`
- Banco: **Supabase** PostgreSQL (região `us-east-2`)
- Root Directory no Vercel: `frontend`

---

## Comandos úteis

```bash
# Desenvolvimento local
cd frontend
npm run dev          # inicia em http://localhost:3000

# Build de produção local
npm run build
npm run start

# Lint
npm run lint
```

**Requisito:** backend rodando em `http://localhost:8000` (ver repo `geldmacht-api`).

---

## Tipos principais de transação

```typescript
interface Transaction {
  id: number;
  date: string;                  // "YYYY-MM-DD"
  description: string;           // descrição normalizada
  raw_description: string | null;
  amount: number;                // positivo = entrada, negativo = saída
  account_type: string | null;   // 'nubank_pf' | 'fatura_nubank' | 'itau' | 'mercado_pago'
  category: string | null;       // ex: "Alimentação", "Transporte"
  category_group: string | null; // ex: "Gastos", "Investimentos"
  is_internal_transfer: boolean;
  installment_current: number | null;  // parcela atual (ex: 3)
  installment_total: number | null;    // total de parcelas (ex: 12)
  source_file: string | null;
  imported_at: string;
}
```

---

## Contexto de negócio

- Usuário: trabalhador CLT + PJ simultâneo, investidor B3
- Fontes de renda: Salário CLT, Honorários PJ, Vale Alimentação
- Contas monitoradas: Nubank (conta + cartão), Itaú, MercadoPago
- Moeda: BRL — sempre usar `formatCurrency()` de `src/lib/formatters.ts`
- Locale: `pt-BR` — datas no formato DD/MM/YYYY nas telas
