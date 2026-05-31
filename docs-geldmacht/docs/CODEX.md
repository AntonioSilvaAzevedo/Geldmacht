# CODEX — Documentação Técnica do Codebase

> Referência técnica viva do sistema Geldmacht.
> Atualizar sempre que uma decisão de arquitetura mudar ou um novo módulo for criado.
> **Última atualização:** 2026-05-16

---

## Stack

| Camada | Tecnologia | Versão | Porta |
|---|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript | 15.2.x | 3000 |
| Estilo | CSS Variables (design system Apple Direction) | — | — |
| Auth Frontend | NextAuth v5 (beta) — JWT strategy | 5.x | — |
| Backend | FastAPI + Uvicorn | 0.111+ | 8000 |
| ORM | SQLAlchemy 2 | 2.0+ | — |
| Banco | SQLite | — | — |
| Migrations | Alembic | 1.13+ | — |
| PDF parsing | pdfplumber | 0.11+ | — |
| Excel parsing | openpyxl | 3.1+ | — |

---

## Estrutura de Pastas

```
geldmacht/
├── frontend/                        # Next.js 15
│   └── src/
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx   # Login email+senha / Google
│       │   │   └── register/page.tsx
│       │   ├── (app)/               # Rotas protegidas (requer autenticação)
│       │   │   ├── layout.tsx       # Layout app: Sidebar + BottomTabBar + AuthRefreshGuard
│       │   │   ├── page.tsx         # Dashboard Anual (/)
│       │   │   ├── mes/[mes]/page.tsx
│       │   │   ├── cartao/
│       │   │   │   ├── page.tsx
│       │   │   │   ├── [cardId]/page.tsx
│       │   │   │   ├── [cardId]/[anoMes]/page.tsx
│       │   │   │   ├── [cardId]/fatura/[invoiceId]/page.tsx
│       │   │   │   └── [cardId]/faturas/page.tsx
│       │   │   ├── carteira/
│       │   │   │   ├── page.tsx          # Lista de instituições
│       │   │   │   └── [slug]/page.tsx   # Detalhe: tabs Conta / Cartão / Resumo
│       │   │   ├── categorias/page.tsx
│       │   │   ├── contas/[id]/page.tsx  # Extrato de conta bancária
│       │   │   ├── lancamentos/novo/page.tsx  # Lançamento manual + fila batch
│       │   │   ├── upload/page.tsx
│       │   │   ├── perfil/page.tsx
│       │   │   ├── configuracoes/page.tsx
│       │   │   └── proventos/page.tsx
│       │   └── layout.tsx           # Root layout (SessionProvider, Providers)
│       ├── components/
│       │   ├── Layout/
│       │   │   ├── Sidebar.tsx          # Navegação lateral (desktop)
│       │   │   ├── BottomTabBar.tsx     # Navegação inferior (mobile)
│       │   │   └── PageHeader.tsx       # Cabeçalho fixo reutilizável (título + breadcrumb + nav slot)
│       │   ├── Cards/
│       │   │   └── AccountCard.tsx      # Card de conta bancária
│       │   ├── Upload/
│       │   │   └── UploadPreview.tsx    # Tabela de preview + seleção
│       │   ├── AmountInput.tsx          # Campo de valor hero (cents-based, auto-formatação BRL)
│       │   ├── TypeToggle.tsx           # Toggle Saída / Entrada (sizes sm/md/lg)
│       │   ├── CategorySelector.tsx     # Seleção de categoria (variant grid ou chips)
│       │   ├── BatchQueue.tsx           # Fila de lançamentos em lote (variant web ou mobile)
│       │   ├── ContaEmptyState.tsx      # Empty state da aba Conta (idle/form/success)
│       │   ├── AuthRefreshGuard.tsx     # Renova token JWT a cada 24h; redireciona se expirado
│       │   ├── TransactionList.tsx      # Lista de transações reutilizável
│       │   ├── TransactionEditForm.tsx  # Form inline de edição de transação
│       │   ├── CategoryGrid.tsx         # Grade de categorias (legado)
│       │   ├── KPIStrip.tsx             # Faixa de indicadores (entradas/saídas/saldo)
│       │   ├── MonthNav.tsx             # Navegação de mês (anterior / próximo)
│       │   ├── MonthSelector.tsx        # Chips de seleção de mês
│       │   ├── EmptyState.tsx           # Estado vazio genérico
│       │   ├── ErrorState.tsx           # Estado de erro genérico
│       │   ├── LoadingSpinner.tsx
│       │   └── Providers.tsx            # SessionProvider + tema
│       ├── hooks/
│       │   └── useIsMobile.ts
│       ├── lib/
│       │   ├── api.ts                   # Cliente tipado para a API REST
│       │   ├── formatters.ts            # formatCurrency, formatCurrencyInput, parseCurrencyDigits, formatDate…
│       │   └── institutionColors.ts     # Cores por instituição financeira
│       ├── types/
│       │   ├── financial.ts             # Tipos de dados financeiros
│       │   └── next-auth.d.ts           # Augment NextAuth: accessToken, error, tokenExpiry
│       └── auth.ts                      # Config NextAuth v5 (Credentials + Google + refresh)
│
└── geldmacht-api/                   # FastAPI
    └── app/
        ├── main.py                  # Entry point + CORS + routers
        ├── config.py                # Settings via pydantic-settings (.env)
        ├── database.py              # Engine SQLite + SessionLocal + Base
        ├── middleware/
        │   └── auth.py              # get_current_user (JWT Bearer)
        ├── api/
        │   ├── auth.py              # POST /auth/login, /auth/google, /auth/refresh
        │   ├── upload.py            # POST /api/upload (preview sem salvar)
        │   ├── import_transactions.py
        │   ├── transactions.py      # CRUD transações + POST /transactions/batch
        │   ├── bank_accounts.py     # CRUD contas bancárias
        │   ├── cards.py             # CRUD cartões + invoices
        │   ├── categories.py        # CRUD categorias
        │   └── dashboard.py         # Agregações
        ├── models/
        │   ├── user.py
        │   ├── transaction.py
        │   ├── bank_account.py
        │   ├── credit_card.py
        │   ├── invoice.py
        │   ├── category.py
        │   ├── import_batch.py
        │   └── account.py           # legado (Account → BankAccount)
        ├── schemas/
        │   └── transaction.py       # ManualTransactionCreate, TransactionOut, etc.
        ├── parsers/                 # Parsers de PDF/OFX
        │   ├── nubank_pf.py
        │   ├── nubank_pj.py (herda PF)
        │   ├── fatura_nubank.py
        │   ├── mercadopago.py
        │   ├── itau.py
        │   └── ofx_bank_statement.py
        ├── categorization/
        │   └── categorizer.py
        └── services/
            ├── bank_statement_import.py
            ├── summary_service.py
            └── transaction_serialization.py
```

---

## Autenticação

### Fluxo

```
Login (email+senha ou Google)
  └── POST /auth/login → { access_token, user }
      └── NextAuth jwt callback → armazena { accessToken, tokenExpiry }
          └── session callback → expõe session.accessToken
              └── AuthRefreshGuard (client) → update() a cada 24h
                  └── jwt callback detecta tokenExpiry - 1d → POST /auth/refresh
                      └── Falha → session.error = 'RefreshAccessTokenError'
                          └── AuthRefreshGuard → signOut → /login?reason=expired
```

### Tokens

- **Duração:** 7 dias (`access_token_expire_minutes = 7 * 24 * 60`)
- **Renovação automática:** quando falta ≤ 1 dia para expirar
- **NextAuth session:** `maxAge: 30 * 24 * 60 * 60` (30 dias de cookie)
- **Estratégia:** JWT (sem sessão no servidor)

### Endpoints de auth

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Email + senha → JWT |
| POST | `/auth/google` | Google OAuth token → JWT |
| POST | `/auth/refresh` | Bearer token atual → novo JWT |

---

## Componentes UI — Referência

### AmountInput

Campo de valor hero com **auto-formatação BRL cents-based**.

```tsx
// Estado no pai: apenas dígitos brutos
const [digits, setDigits] = useState('');

<AmountInput
  value={digits}          // "123456" → exibe "1.234,56"
  onChange={setDigits}    // recebe dígitos, não string formatada
  type="saida"            // 'saida' | 'entrada' — muda cor
  autoFocus
  onEnter={handleSave}
/>

// Para enviar à API:
import { parseCurrencyDigits } from '@/lib/formatters';
const amount = parseCurrencyDigits(digits); // → 1234.56
```

**Como funciona:**
- `onKeyDown` intercepta: dígitos acumulam à direita, Backspace remove último
- Nunca aceita letras, vírgulas ou pontos digitados — formatação é automática
- `formatCurrencyInput("123456")` → `"1.234,56"` (via `Intl.NumberFormat pt-BR`)

### TypeToggle

```tsx
<TypeToggle
  value={tipo}           // 'saida' | 'entrada'
  onChange={setTipo}
  size="md"              // 'sm' | 'md' | 'lg'
  showEmoji={true}
/>
```

### CategorySelector

```tsx
<CategorySelector
  categories={catItems}   // { id: string, label, icon, color }[]
  selected={catId}        // string | null
  onSelect={setCatId}
  variant="grid"          // 'grid' (3-col, web) | 'chips' (inline + expand, mobile)
  visibleCount={4}        // chips: quantas antes do "+N mais"
/>
```

Mapear `Category` da API para `CategoryItem`:
```ts
const catItems = categories.map(c => ({
  id:    String(c.id),
  label: c.name,
  icon:  c.icon  ?? '···',
  color: c.color ?? 'rgba(255,255,255,.3)',
}));
```

### BatchQueue

```tsx
<BatchQueue
  entries={queue}          // QueueEntry[]
  onRemove={id => ...}
  onCommit={handleCommit}
  committing={committing}
  variant="web"            // 'web' (sidebar) | 'mobile' (barra compacta)
/>
```

`QueueEntry` contém tanto campos de exibição (`desc`, `catLabel`, `accLabel`, `dateLabel`) quanto os dados brutos para a API (`bankAccountId`, `categoryId`, `transactionDate`, `transactionType`).

### ContaEmptyState

Renderizado na aba **Conta** de `carteira/[slug]` quando a instituição não tem conta bancária.

```tsx
<ContaEmptyState
  inst={{ name, abbr, color }}
  reason="card_only"        // 'card_only' | 'new'
  onSave={account => ...}   // recebe BankAccountConfig criada
  onImportOFX={() => ...}
/>
```

Estados internos: `idle` → `form` → `success`. Chama `api.createBankAccount()` + `api.createManualTransaction()` (saldo inicial opcional).

### PageHeader

```tsx
<PageHeader
  title="Carteira"
  subtitle="3 contas · 2 cartões"
  crumbs={[{ href: '/carteira', label: 'Carteira' }]}
  right={<SomeAction />}
  nav={<TabBar />}          // fica dentro do header fixo
  px={32}                   // padding horizontal (usar o mesmo do <main>)
/>
```

`nav` slot: fica dentro do header e não rola. Usar para InvoiceNavBar, SegmentedControl, etc.

---

## Formatters (`src/lib/formatters.ts`)

| Função | Entrada | Saída | Uso |
|---|---|---|---|
| `formatCurrency(n)` | `number` | `"R$ 1.234,56"` | Exibição geral |
| `formatCurrency(n, true)` | `number` | `"R$ 1,2K"` | Valores compactos |
| `formatCurrencyInput(digits)` | `"123456"` | `"1.234,56"` | AmountInput — display |
| `parseCurrencyDigits(digits)` | `"123456"` | `1234.56` | AmountInput → API |
| `formatDate(str)` | `"2026-05-16"` | `"16/05/2026"` | Datas em tabelas |
| `formatPercent(n)` | `0.856` | `"0.9%"` | Percentuais |

---

## API REST — Endpoints

### Auth

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Email + senha → JWT |
| POST | `/auth/google` | Google OAuth → JWT |
| POST | `/auth/refresh` | Renovar token |

### Transações

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/transactions` | Lista (filtros: bank_account_id, card_id, month, …) |
| POST | `/api/transactions` | Criar lançamento manual (único) |
| POST | `/api/transactions/batch` | Criar múltiplos lançamentos em lote |
| PATCH | `/api/transactions/{id}` | Editar descrição/categoria |
| GET | `/api/transactions/invoice` | Transações de uma fatura |

### Contas bancárias

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/bank-accounts` | Lista contas |
| POST | `/api/bank-accounts` | Criar conta |
| GET | `/api/bank-accounts/{id}` | Detalhe |
| PATCH | `/api/bank-accounts/{id}` | Editar |
| DELETE | `/api/bank-accounts/{id}` | Desativar |
| GET | `/api/bank-accounts/{id}/import-batches` | Histórico de importações |

### Cartões e faturas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/cards` | Lista cartões |
| POST | `/api/cards` | Criar cartão |
| GET/PATCH/DELETE | `/api/cards/{id}` | CRUD |
| GET | `/api/cards/{id}/dashboard` | KPIs do cartão (fatura atual, média mensal) |
| GET | `/api/cards/{id}/invoices` | Lista faturas |
| GET | `/api/cards/{id}/invoices/{inv_id}` | Detalhe + transações + summary |

### Categorias

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/categories?scope=bank` | Categorias de conta bancária |
| GET | `/api/categories?scope=credit_card` | Categorias de cartão |
| POST | `/api/categories` | Criar |
| PATCH | `/api/categories/{id}` | Editar |
| DELETE | `/api/categories/{id}` | Remover |

### Upload / Import

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/upload` | Preview sem salvar (detecta parser) |
| POST | `/api/import` | Salva transações confirmadas |

Docs interativas: http://localhost:8000/docs

---

## Fluxo de Lançamento Manual

```
Página /lancamentos/novo
  ├── TypeToggle → tipo (saida/entrada)
  ├── AmountInput → digits brutos → parseCurrencyDigits() → amount float
  ├── CategorySelector → catId (string → Number para API)
  ├── Conta (select) → bankId
  │
  ├── "Salvar direto" → POST /api/transactions (single)
  └── "+ Adicionar à fila" → acumula QueueEntry[]
        └── "Confirmar todos" → POST /api/transactions/batch
```

`_build_manual_tx()` no backend valida conta + categoria e cria o objeto sem commit.
O endpoint `/batch` faz um único `db.commit()` para todo o lote.

---

## Design System — Apple Direction

Tokens em `src/app/globals.css`. Referência completa em `frontend/CLAUDE.md`.

Resumo das variáveis mais usadas:

| Token | Valor | Uso |
|---|---|---|
| `--surface-0` / `--surface-bg` | `#000` | Fundo de página |
| `--surface-1` / `--surface-card` | `#1C1C1E` | Card principal |
| `--surface-2` | `#2C2C2E` | Painel aninhado, inputs |
| `--green` | `#30D158` | Entradas, positivo |
| `--red` | `#FF453A` | Saídas, negativo |
| `--blue` | `#0A84FF` | Ações primárias |
| `--orange` | `#FF9F0A` | Alertas |
| `--font-mono` | DM Mono | Valores numéricos |
| `--separator` | `rgba(255,255,255,.08)` | Divisores |

---

## Navegação

- **Desktop (≥ 768px):** `Sidebar.tsx` — menu lateral fixo com ícones + labels
- **Mobile (< 768px):** `BottomTabBar.tsx` — barra inferior com 5 tabs

Ambos controlados por `usePathname()` para highlight ativo.

---

## Decisões de Arquitetura

### AmountInput: cents-based

Valor armazenado como string de dígitos brutos ("123456"). Formatação ocorre apenas no display. Isso evita bugs de cursor e parsing ambíguo — o modelo é identical ao dos apps bancários móveis.

### BatchQueue: commit único

O endpoint `/transactions/batch` valida todos os itens e faz um único `db.commit()`. Se qualquer item falhar na validação, nenhum é salvo (consistência).

### ContaEmptyState: sem limpeza de banco

O componente permite criar uma conta bancária mesmo depois de faturas já importadas. A conta é vinculada ao histórico existente sem apagar dados — o banner explica isso explicitamente ao usuário.

### PageHeader: fora do `<main>`

`PageHeader` fica como sibling antes de `<main>`. O `<main>` tem `flex: 1` e `overflow: auto` — rola sob o header fixo. `paddingTop: 24px` no `<main>` cria o respiro entre o border-bottom do header e o conteúdo.

### Token JWT: 7 dias + refresh proativo

Tokens duram 7 dias. `AuthRefreshGuard` dispara `update()` uma vez por dia (24h timer). O `jwt` callback renova quando falta ≤ 1 dia. Se o refresh falhar, `session.error = 'RefreshAccessTokenError'` e o guard redireciona para `/login?reason=expired`.

---

## Comandos Úteis

```bash
# Backend
cd geldmacht-api
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000   # dev
alembic upgrade head                         # migrar banco
pytest tests/ -v

# Frontend
cd frontend
npm run dev            # dev (porta 3000)
npm run build          # build de produção
npx tsc --noEmit       # checar TypeScript

# Matar e reiniciar ambos
lsof -ti :3000 -ti :8000 | xargs kill -9
```
