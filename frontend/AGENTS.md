# AGENTS.md — Geldmacht Frontend

Contexto do projeto para agentes de IA (Claude, Cursor, Copilot, etc.).
Leia este arquivo antes de qualquer tarefa de desenvolvimento.

---

## O que é este projeto

**Geldmacht** é um painel financeiro pessoal multi-usuário. O nome vem do alemão *"poder do dinheiro"*.
Agrega extratos bancários (Nubank, Itaú, MercadoPago), permite edição inline de descrições,
e exibe dashboards de gastos, investimentos, cartão de crédito e proventos.

Stack: **Next.js 15 App Router + TypeScript + Auth.js v5 (next-auth)**.
Backend separado no repo `geldmacht-api` (FastAPI + PostgreSQL via Supabase).

**SEMPRE** use a skill `frontend-design` ao criar ou editar componentes de interface. Antes de escrever qualquer JSX/HTML/CSS, leia o arquivo `SKILL.md` da skill `frontend-design` para garantir:

- Uso correto dos design tokens (cores, espaçamentos, tipografia)
- Componentes seguindo os padrões da skill
- Estados de loading, error e empty bem tratados
- Acessibilidade (semantic HTML, ARIA, keyboard navigation)
- Visual polido e profissional, evitando estética "AI genérica"

---

## Estrutura de pastas

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout — só <html><body><Providers>
│   │   ├── globals.css                   # Design tokens e estilos globais
│   │   │
│   │   ├── (auth)/                       # Route group — sem sidebar
│   │   │   ├── layout.tsx                # Fundo navy, centralizado, sem sidebar
│   │   │   ├── login/page.tsx            # /login → Login com rememberMe
│   │   │   └── register/page.tsx         # /register → Cadastro
│   │   │
│   │   └── (app)/                        # Route group — com sidebar
│   │       ├── layout.tsx                # Sidebar + children
│   │       ├── page.tsx                  # / → Dashboard Anual
│   │       ├── upload/page.tsx           # /upload → Importar extratos
│   │       ├── mes/[mes]/page.tsx        # /mes/2026-04 → Detalhe mensal
│   │       ├── cartao/[mes]/page.tsx     # /cartao/2026-04 → Fatura cartão
│   │       ├── carteira/page.tsx         # /carteira → Carteira de investimentos
│   │       └── proventos/page.tsx        # /proventos → Dividendos e rendimentos
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx               # Navegação lateral (desktop)
│   │   │   └── Header.tsx                # Cabeçalho de página (título + subtítulo)
│   │   ├── Upload/
│   │   │   └── UploadPreview.tsx         # Preview de transações antes de importar
│   │   ├── EditableDescription.tsx       # Edição inline de descrição (hover → lápis → input)
│   │   ├── EmptyState.tsx                # Tela quando não há dados no banco
│   │   ├── ErrorState.tsx                # Tela de erro de API
│   │   ├── LoadingSpinner.tsx            # Spinner de carregamento
│   │   ├── MonthSelector.tsx             # Seletor de mês (navegação prev/next)
│   │   └── Providers.tsx                 # SessionProvider do next-auth
│   │
│   ├── config/
│   │   └── env.ts                        # ← ÚNICO ponto de leitura de env vars
│   │
│   ├── hooks/
│   │   └── useFinancialData.ts           # Hook genérico de busca de dados
│   │
│   ├── lib/
│   │   ├── api.ts                        # ← ÚNICO ponto de chamadas HTTP ao backend
│   │   └── formatters.ts                 # formatCurrency, formatDate, classifyValue
│   │
│   ├── types/
│   │   ├── financial.ts                  # Todos os tipos TypeScript do domínio
│   │   └── next-auth.d.ts                # Augmentação Session/User/JWT (Auth.js v5)
│   │
│   ├── auth.ts                           # Configuração Auth.js v5 (NextAuth)
│   ├── middleware.ts                      # Proteção de rotas (redireciona /login)
│   │
│   └── data/archive/                     # JSONs legados (dados mockados) — não editar
│
├── .env.local                            # URL local (gitignored)
├── .env.production                       # URL de produção (commitado)
└── vercel.json                           # { "framework": "nextjs" }
```

---

## Autenticação (Auth.js v5)

O sistema usa **Auth.js v5 beta** (`next-auth`) com estratégia JWT.

### Providers
- **Credentials** — email + password (valida no backend `POST /auth/login`)
- **Google OAuth** — troca token Google por JWT do backend via `POST /auth/google`

### Sessão
- `session.strategy = 'jwt'`
- **Manter logado:** 30 dias quando checkbox marcado; 1 dia quando desmarcado
- `session.accessToken` contém o Bearer token para chamadas ao backend

### Fluxo de token
```
authorize() → retorna { email, accessToken, rememberMe }
jwt()       → copia accessToken; define token.exp conforme rememberMe
session()   → expõe session.accessToken
```

### Arquivos-chave
| Arquivo | Papel |
|---|---|
| `src/auth.ts` | Config NextAuth — providers, callbacks, session.maxAge |
| `src/middleware.ts` | Protege todas as rotas; redireciona `/login` ↔ `/` |
| `src/types/next-auth.d.ts` | Augmenta `Session`, `User` e JWT (`@auth/core/jwt`) |
| `src/components/Providers.tsx` | `<SessionProvider>` no root layout |

### Regras do middleware
- Usuário **não autenticado** tentando acessar rota da app → redireciona para `/login`
- Usuário **autenticado** tentando acessar `/login` ou `/register` → redireciona para `/`
- Rotas ignoradas: `_next/static`, `_next/image`, `favicon.ico`, `api/auth`

### 401 no backend
Quando qualquer chamada ao backend retorna 401, `src/lib/api.ts` chama
`signOut({ callbackUrl: '/login', redirect: true })` — limpa a sessão Auth.js
antes de redirecionar (evita loop de redirect).

---

## Regras de desenvolvimento

### 1. Chamadas de API
- **Toda** comunicação com o backend passa por `src/lib/api.ts`.
- Nenhum componente ou página chama `fetch()` diretamente para o backend.
- A URL base vem de `src/config/env.ts` → `config.apiUrl`.
- Toda chamada inclui `Authorization: Bearer <token>` via `getAuthHeader()`.

### 2. Variáveis de ambiente
- Lidas **apenas** em `src/config/env.ts`. Nenhum outro arquivo acessa `process.env` diretamente.
- `NEXT_PUBLIC_API_URL` é embutida em build-time (não runtime). Mudanças exigem novo deploy.

### 3. Tipos
- Tipos de domínio em `src/types/financial.ts`.
- Tipos de Auth em `src/types/next-auth.d.ts`.
- Ao adicionar campos do backend, atualizar o tipo correspondente.

### 4. Estilo
- Design tokens definidos em `globals.css` (variáveis CSS `--navy-*`, `--green-*`, etc.).
- Estilização via `style={{}}` inline ou classes utilitárias do `globals.css`.
- **Não** usar classes Tailwind diretamente nos componentes — o projeto usa CSS custom properties.
- Animações de entrada: classe `animate-in` e `delay-{N}` definidas em `globals.css`.

### 5. Navegação
- Rotas da sidebar definidas no array `navItems` em `Sidebar.tsx`.
- Para adicionar uma tela: criar `src/app/(app)/[rota]/page.tsx` e adicionar item ao array.

### 6. Isolamento de dados por usuário
- **Todos os dados são escopados por usuário** no backend (campo `user_id`).
- O frontend nunca precisa passar `user_id` — o backend extrai do token JWT.
- Cada usuário vê apenas suas próprias transações, contas e dashboard.

---

## Endpoints do backend

### Auth
| Método | Path | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Login credentials → retorna `access_token` + `user` |
| `POST` | `/auth/register` | Cadastro → retorna `message` + `user` |
| `POST` | `/auth/google` | Troca token Google por JWT do backend |

### Dados
| Método | Path | Descrição |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/upload` | Upload de PDF/Excel — retorna preview (não persiste) |
| `POST` | `/api/import` | Persiste transações confirmadas pelo usuário |
| `GET` | `/api/transactions` | Lista transações com filtros |
| `GET` | `/api/transactions/invoice` | Fatura do cartão com `InvoiceSummary` calculado |
| `PATCH` | `/api/transactions/{id}` | Edita `description` e/ou `category` de uma transação |
| `GET` | `/api/dashboard/monthly` | Dados agregados por mês para o Dashboard Anual |

**Filtros disponíveis em `GET /api/transactions`:**
`account`, `month` (YYYY-MM), `category`, `start_date`, `end_date`, `limit`, `offset`

**Body do `PATCH /api/transactions/{id}`:**
```json
{ "description": "Nova descrição", "category": "Alimentação" }
```
Ambos os campos são opcionais. Filtrado por `user_id` — usuário só edita as próprias transações.

---

## Fluxo de importação de extratos

```
1. /upload  → usuário arrasta PDF ou Excel
2. POST /api/upload → backend parseia, retorna preview (sem salvar)
3. UploadPreview.tsx exibe as transações para revisão
   - Usuário pode editar descrição de cada transação (EditableDescription local)
   - Usuário pode selecionar categoria via <select>
4. Usuário confirma → POST /api/import → dados persistidos vinculados ao user_id
5. Dashboard atualiza automaticamente
```

**Parsers disponíveis no backend:**
- `nubank_pf` — extrato conta corrente Nubank PF (PDF)
- `nubank_pj` — extrato conta corrente Nubank PJ (PDF)
- `faturacartaonubank` — fatura cartão Nubank (PDF) — detecta parcelas X/Y
- `itau` — extrato Itaú Uniclass (PDF)
- `mercadopago` — extrato MercadoPago (Excel/CSV)

---

## Telas e status

| Rota | Tela | Dados | Status |
|---|---|---|---|
| `/login` | Login | `POST /auth/login` | ✅ API real |
| `/register` | Cadastro | `POST /auth/register` | ✅ API real |
| `/` | Dashboard Anual | `GET /api/dashboard/monthly` | ✅ API real |
| `/upload` | Importar Extratos | `POST /api/upload` + `POST /api/import` | ✅ API real |
| `/mes/[mes]` | Detalhe Mensal | `GET /api/transactions?limit=1000` | ✅ API real + edição inline |
| `/cartao/[mes]` | Fatura Cartão | `GET /api/transactions/invoice?month=YYYY-MM` | ✅ API real + edição inline |
| `/carteira` | Carteira Investimentos | — | ⚫ pendente (Etapa 3.4) |
| `/proventos` | Dividendos | — | ⚫ pendente (Etapa 3.4) |

---

## Componente `EditableDescription`

Localizado em `src/components/EditableDescription.tsx`.

```tsx
<EditableDescription
  value={tx.description}
  onSave={async (newValue) => {
    await api.updateTransaction(tx.id, { description: newValue });
  }}
  textStyle={{ fontSize: 13, color: 'var(--text-primary)' }}
/>
```

- Exibe ícone de lápis ao passar o mouse
- Clique no ícone abre input inline
- **Enter** ou **blur** salva; **Escape** cancela
- Mostra spinner durante save assíncrono
- Em caso de erro de API, reverte para o valor anterior
- Para edição local (sem API), passar `onSave` síncrono: `onSave={val => setState(...)}`

Aplicado em:
- `UploadPreview.tsx` — edição local antes de importar
- `mes/[mes]/page.tsx` — edição via API com override otimista
- `cartao/[mes]/page.tsx` — edição via API com atualização direta do estado

---

## Hook `useFinancialData`

```typescript
const { data, loading, error } = useFinancialData('monthly');
// datasets: 'monthly' | 'transactions' | 'creditCard' | 'investments' | 'dividends'
```

- Datasets `monthly` e `transactions` buscam da API real.
- `creditCard`, `investments` e `dividends` retornam `null` por enquanto (pendente Etapa 3.2+).

---

## Métodos de `api.ts`

```typescript
api.health()                                    // GET /health
api.uploadFile(file)                            // POST /api/upload
api.importTransactions(payload)                 // POST /api/import
api.getTransactions(filters?)                   // GET /api/transactions
api.getCardInvoice(month)                       // GET /api/transactions/invoice?month=YYYY-MM
api.updateTransaction(id, { description?, category? })  // PATCH /api/transactions/{id}
api.getDashboardMonthly()                       // GET /api/dashboard/monthly
```

---

## Tipos principais

```typescript
// src/types/financial.ts
interface Transaction {
  id: number;
  date: string;                  // "YYYY-MM-DD"
  description: string;           // descrição normalizada (editável)
  raw_description: string | null;
  amount: number;                // positivo = entrada, negativo = saída
  account_id: number | null;
  account_type: string | null;   // 'nubank_pf' | 'nubank_pj' | 'nubank_cartao' | 'itau' | 'mercado_pago'
  category: string | null;       // ex: "Alimentação" — atualmente sempre null (sem engine de categorização)
  category_group: string | null;
  is_internal_transfer: boolean;
  is_payment: boolean;
  installment_current: number | null;  // parcela atual (ex: 2)
  installment_total: number | null;    // total de parcelas (ex: 3)
  billing_month: string | null;        // "YYYY-MM" — mês de referência da fatura (só nubank_cartao)
  source_file: string | null;
  imported_at: string;
}
```

> ⚠️ **Categorização:** `category` é sempre `null` atualmente. Não há motor de categorização
> automática. A Visão Mensal categoriza as transações no **frontend** por regras de keywords
> na descrição (não persiste no banco).

---

## URLs e deploy

| Ambiente | Frontend | Backend |
|---|---|---|
| **Local** | `http://localhost:3000` | `http://localhost:8000` |
| **Produção** | `https://geldmacht.com` | `https://geldmacht-api-production.up.railway.app` |

- Frontend: **Vercel** — deploy automático no push para `main` (Root Directory: `frontend`)
- Backend: **Railway** — deploy automático no push para `main` do repo `geldmacht-api`
- Banco: **Supabase** PostgreSQL (região `us-east-2`)

### Variáveis de ambiente necessárias

**Vercel (frontend):**
| Var | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL do backend Railway |
| `AUTH_SECRET` | Secret aleatório para Auth.js |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXTAUTH_URL` | URL do frontend (produção) |

**Railway (backend):**
| Var | Valor |
|---|---|
| `DATABASE_URL` | URL do Supabase PostgreSQL |
| `SECRET_KEY` | Secret para assinar JWT do backend |

---

## Comandos úteis

```bash
# Desenvolvimento local
cd frontend
npm run dev          # inicia em http://localhost:3000

# Build de produção local
npm run build
npm run start

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

**Requisito:** backend rodando em `http://localhost:8000` (ver repo `geldmacht-api`).

---

## Contexto de negócio

- Usuário: trabalhador CLT + PJ simultâneo, investidor B3
- Fontes de renda: Salário CLT, Honorários PJ, Vale Alimentação, FGTS
- Contas monitoradas: Nubank PF (conta + cartão), Nubank PJ, Itaú, MercadoPago
- Moeda: BRL — sempre usar `formatCurrency()` de `src/lib/formatters.ts`
- Locale: `pt-BR` — datas no formato DD/MM/YYYY nas telas
