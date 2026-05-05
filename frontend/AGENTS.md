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
│   │       ├── cartao/page.tsx           # /cartao → Cartões cadastrados
│   │       ├── cartao/[cardId]/page.tsx  # /cartao/1 → Detalhe do cartão
│   │       ├── cartao/[cardId]/[anoMes]/page.tsx # /cartao/1/2026-04 → Fatura (legado/compat.)
│   │       ├── cartao/[cardId]/fatura/[invoiceId]/page.tsx # /cartao/1/fatura/10 → Fatura por ID (preferencial)
│   │       ├── categorias/page.tsx       # /categorias → Categorias manuais
│   │       ├── carteira/page.tsx         # /carteira → Carteira de investimentos
│   │       └── proventos/page.tsx        # /proventos → Dividendos e rendimentos
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx               # Navegação lateral (desktop)
│   │   │   └── Header.tsx                # Cabeçalho de página (título + subtítulo)
│   │   ├── Upload/
│   │   │   └── UploadPreview.tsx         # Preview de transações antes de importar
│   │   ├── Cards/
│   │   │   └── CreditCardForm.tsx        # Form de criar/editar cartão
│   │   ├── CategoryIcon.tsx              # Ícone de categoria (CATEGORY_ICONS map + ICON_OPTIONS)
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
| `POST` | `/api/upload` | Upload PDF/Excel — preview + `invoice_metadata` para fatura Nubank |
| `POST` | `/api/import` | Persiste transações; cria `Invoice` e vincula transactions via `invoice_id` |
| `GET` | `/api/transactions` | Lista transações com filtros |
| `GET` | `/api/transactions/invoice?invoice_id=ID` | **Preferencial** — fatura por `invoice_id` |
| `GET` | `/api/transactions/invoice?card_id=ID&month=YYYY-MM` | Legado — busca por `reference_month` |
| `PATCH` | `/api/transactions/{id}` | Edita `description` e/ou `category` |
| `GET` | `/api/dashboard/monthly` | Dados agregados por mês para Dashboard Anual |
| `GET` | `/api/cards` | Lista cartões cadastrados do usuário |
| `GET` | `/api/cards/{id}` | Dados de um cartão do usuário |
| `POST` | `/api/cards` | Cria cartão |
| `PATCH` | `/api/cards/{id}` | Edita cartão |
| `DELETE` | `/api/cards/{id}` | Remove cartão, invoices e transações em cascata |
| `GET` | `/api/cards/{id}/invoices` | Lista invoices reais da tabela `Invoice` |
| `GET` | `/api/cards/{id}/invoices/{invoice_id}` | Detalhes da fatura + transactions + summary |
| `GET` | `/api/cards/{id}/invoices-by-month/{due_month}` | Busca invoice por `due_month` (compat. legada) |
| `GET` | `/api/categories?scope=credit_card` | Lista categorias manuais de cartão |
| `POST` | `/api/categories` | Cria categoria manual |
| `PATCH` | `/api/categories/{id}` | Edita categoria manual |
| `DELETE` | `/api/categories/{id}` | Remove categoria manual |

### Regras do backend para cartões

**Exclusão de cartão (`DELETE /api/cards/{id}`):**
- Valida que o cartão pertence ao usuário logado.
- Limpa `invoice_id` das transactions → exclui transactions → exclui invoices → exclui cartão.
- Operação atômica (rollback se falhar).
- Retorna `{ "deleted": true }`.

**Importação de fatura (`POST /api/import` com `invoice` preenchido):**
- `card_id` é obrigatório → `400` se ausente, `404` se de outro usuário.
- Cria ou atualiza a `Invoice` via `_get_or_create_invoice`.
- Salva transactions com `card_id`, `invoice_id`, `reference_month` (legado).
- Preserva `date` (data real da compra) sem alteração.
- Retorna `{ imported, skipped, card_id, invoice_id, due_month }`.

**Consulta de fatura (`GET /api/transactions/invoice`):**
- Preferencial: filtrar por `invoice_id`.
- Legado: `card_id + month` (YYYY-MM) buscando por `reference_month`.

**Filtros disponíveis em `GET /api/transactions`:**
`account`, `month` (YYYY-MM), `category`, `start_date`, `end_date`, `limit`, `offset`

**Body do `PATCH /api/transactions/{id}`:**
```json
{ "description": "Nova descrição", "category": "Alimentação", "category_id": 1 }
```
Todos os campos são opcionais. Filtrado por `user_id` — usuário só edita as próprias transações.

---

## Fluxo de importação de extratos

```
1. /upload  → usuário arrasta PDF ou Excel
2. POST /api/upload → backend parseia, retorna preview (sem salvar)
   - Para fatura Nubank: inclui invoice_metadata com due_date, cycle_start_date, cycle_end_date, total_amount etc.
3. UploadPreview.tsx exibe transações para revisão + bloco de dados da fatura
   - Usuário pode editar metadados da fatura (vencimento, período, total)
   - Usuário pode editar descrição de cada transação (EditableDescription local)
   - Para fatura de cartão, usuário pode selecionar categoria manual com scope = credit_card
4. Usuário confirma → POST /api/import com invoice + card_id → cria Invoice no banco
5. Redireciona para /cartao/[cardId]/fatura/[invoice_id]
```

### Importação de fatura por cartão

Fluxo padrão (iniciado pelo card do cartão):

```
/cartao
  → usuário clica em "Importar fatura" dentro do card de um cartão específico
/upload?type=credit_card&cardId=1
  → upload carrega a lista de cartões e pré-seleciona o cartão pelo cardId
POST /api/upload → preview com invoice_metadata
  → cartão vem pré-selecionado; campos da fatura (vencimento, período) pré-preenchidos
Usuário confirma/ajusta dados da fatura
POST /api/import com card_id + invoice (due_month, due_date, cycle_start_date, etc.)
Redireciona para /cartao/[cardId]/fatura/[invoice_id]
```

Fluxo sem cardId na URL (`/upload?type=credit_card`):

```
/upload?type=credit_card
  → upload carrega a lista de cartões (sem pré-seleção)
Tela de revisão exige seleção manual do cartão
  → botão "Importar" fica desabilitado até seleção
Usuário seleciona o cartão → habilita importação
POST /api/import com card_id selecionado manualmente
```

Regras:

- A importação do tipo `credit_card` exige cartão selecionado antes de confirmar.
- O botão de confirmar importação fica desabilitado se `type=credit_card` e nenhum cartão selecionado.
- Mensagem de validação: "Selecione o cartão desta fatura antes de importar."
- A data real da compra continua em `date` / `transaction_date`.
- `invoice_metadata` pré-preenche o bloco de dados da fatura; o usuário pode corrigir.
- O payload de import envia `invoice` (metadados completos), não apenas `reference_month`.
- `reference_month` continua sendo enviado apenas como fallback/compat. de dados antigos.
- Categorias no preview vêm da API (`GET /api/categories?scope=credit_card`); sem lista hardcoded.
- A fatura é vinculada apenas ao cartão selecionado — não aparece em outros cartões.

### Totais na listagem e no detalhe da fatura

- **Listagem** (`/cartao/[cardId]`): o valor em destaque deve ser `invoice.total_amount` quando existir, com o rótulo **“Total da fatura (PDF)”**. `computed_total` na API é só a soma das transações com `amount < 0` (conferência) — se divergir do PDF, exibir como **“Soma dos gastos (lanç.)”**.
- **Detalhe** (`/cartao/.../fatura/[invoiceId]` e `[anoMes]`): quando há `invoice.total_amount`, o **primeiro card** da grade de métricas é **“Total da fatura (PDF)”** com valor em destaque (fonte maior). O cabeçalho acima só traz vencimento e período. Se a soma das compras nos lançamentos divergir do PDF, mantém-se a linha de conferência em texto menor.

### Linguagem visual das faturas

**Usar:**
- "Fatura com vencimento em Abril/2026"
- "Vence em 13/04/2026"
- "Período da fatura: 04/03/2026 a 04/04/2026"
- "Mês de pagamento"
- "Vencimento"

**Evitar:**
- "Fatura de Abril" isolado
- "Mês da fatura" como se fosse mês dos gastos
- "reference_month" exposto na interface
- "Mês de referência" como label principal para o usuário

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
| `/upload` | Importar Extratos | `POST /api/upload` + `POST /api/import` | ✅ API real + invoice_metadata |
| `/mes/[mes]` | Detalhe Mensal | `GET /api/transactions?limit=1000` | ✅ API real + edição inline |
| `/cartao` | Cartões | `GET /api/cards` | ✅ API real + empty state + ações por card |
| `/cartao/[cardId]` | Detalhe do cartão | `GET /api/cards/{id}` + `GET /api/cards/{id}/invoices` | ✅ API real — lista invoices reais |
| `/cartao/[cardId]/fatura/[invoiceId]` | Fatura por ID | `GET /api/cards/{id}/invoices/{invoice_id}` | ✅ API real — compras parceladas + recategorização |
| `/cartao/[cardId]/[anoMes]` | Fatura por Mês (legado) | `GET /api/cards/{id}/invoices-by-month/{due_month}` | ✅ API real + fallback legado |
| `/categorias` | Categorias | `GET/POST/PATCH/DELETE /api/categories` | ✅ API real — criar/editar/excluir com ícone |
| `/carteira` | Carteira Investimentos | — | ⚫ pendente (Etapa 3.4) |
| `/proventos` | Dividendos | — | ⚫ pendente (Etapa 3.4) |

### Comportamentos específicos da página `/cartao`

**Estado sem cartões:**
- Exibe apenas o `EmptyState` centralizado com mensagem e botão "Adicionar cartão".
- Não exibe botão de importar fatura, lista vazia de faturas, ou qualquer dado de cartão.
- O botão "Adicionar cartão" abre o formulário `CreditCardForm` inline.

**Estado com cartões:**
- Exibe grid de cards. Cada card mostra: nome, instituição, dia de fechamento, dia de vencimento, abertura estimada.
- O cabeçalho de cada card é um link clicável para `/cartao/[cardId]` (ver faturas importadas).
- Cada card tem três ações na barra inferior:
  - **Importar fatura** → navega para `/upload?type=credit_card&cardId=ID`
  - **Editar** → abre `CreditCardForm` inline abaixo do card
  - **Excluir** → abre modal de confirmação de exclusão

**Modal de exclusão de cartão:**
- Exibe nome do cartão, quantidade de faturas vinculadas e quantidade de lançamentos vinculados.
- Avisa que a ação é irreversível e que faturas/lançamentos também serão excluídos.
- Botão de confirmação: "Excluir cartão e faturas" (tom destrutivo).
- Botão de cancelamento: "Cancelar" (fecha o modal sem alterar dados).
- Ao confirmar: chama `DELETE /api/cards/{id}`, atualiza lista local, exibe toast de sucesso.
- Em caso de erro: exibe toast de erro, cartão permanece na lista.
- Após exclusão do último cartão: exibe o empty state correto (sem botão de importar fatura).

**Botão "Importar fatura" global removido:**
- Não existe botão global de importar fatura na página `/cartao`.
- A importação é sempre iniciada a partir do botão "Importar fatura" dentro do card de um cartão específico.
- Isso garante que o `cardId` sempre esteja disponível no fluxo de importação.

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
- `mes/[mes]/page.tsx` — edição via API com override otimista (`descOverrides` state)
- `cartao/[cardId]/[anoMes]/page.tsx` — edição via API com atualização direta do estado
- `cartao/[cardId]/fatura/[invoiceId]/page.tsx` — edição via API dentro do agrupamento por categoria

---

## Categorias de cartão

Categorias manuais para lançamentos de fatura de cartão de crédito.

### Modelo de dados
- Tabela `categories` no banco: `id, user_id, name, scope, color, icon`
- `icon` — chave de ícone (ex: `"shopping-cart"`). Nullable. Campo principal de representação visual.
- `color` — legado, mantido para compatibilidade.
- `scope = 'credit_card'` — único escopo válido atualmente
- Isoladas por `user_id` — cada usuário tem suas próprias categorias

### Tipo no frontend (`api.ts`)
```typescript
interface Category {
  id: number; user_id: number; name: string; scope: 'credit_card';
  color: string | null; icon: string | null;
  created_at: string; updated_at: string;
}
interface CategoryPayload     { name: string; scope: 'credit_card'; color?: string | null; icon?: string | null; }
interface CategoryUpdatePayload { name?: string; color?: string | null; icon?: string | null; }
```

### Fluxo de uso
1. **Criar:** `/categorias` → formulário "Nome + Ícone" → `POST /api/categories` com `scope='credit_card'`
2. **Editar:** botão Editar por card → edição inline de nome e ícone → `PATCH /api/categories/{id}`
3. **Atribuir no import:** `UploadPreview` exibe `<select>` por linha com nome da categoria
4. **Atribuir depois:** `PATCH /api/transactions/{id}` com `{ category_id: N }` na fatura
5. **Exibir:** `/cartao/[cardId]/fatura/[invoiceId]` agrupa lançamentos por categoria em acordeão com ícone

### Componente `CategoryIcon`
`src/components/CategoryIcon.tsx`
```tsx
<CategoryIcon icon={category.icon} size={16} color="var(--blue-400)" />
```
- Mapa seguro `iconKey → LucideComponent` em `CATEGORY_ICONS`
- Fallback `Tag` quando `icon` é null/desconhecido
- `ICON_OPTIONS` — lista de opções para o seletor (key + label amigável)
- Nunca renderiza componente dinamicamente a partir de string arbitrária

### Agrupamento no detalhe da fatura
```
CategoryGroup { key, label, icon, total, transactions[] }
↑ gerado via useMemo() filtrando tx.amount < 0
↑ icon buscado de categories[] pelo category_id
↑ ordenado por total decrescente
↑ "Sem categoria" (key='uncategorized') para transações sem category_id
```

### Recategorização de lançamentos na fatura
Na tela `/cartao/[cardId]/fatura/[invoiceId]`, cada lançamento exibe:
- categoria atual (ícone + nome) ou "Sem categoria"
- botão "alterar" → abre select inline com todas as categorias do usuário + opção "Sem categoria"
- `onChange` aciona `PATCH /api/transactions/{id}` com `{ category_id: N }` ou `{ category_id: 0 }` para remover
- Após salvar: atualiza `transactions` local; `groups` é recalculado automaticamente via `useMemo`
- Em caso de erro: estado não é alterado (mantém valor anterior)

### Regras
- Só transações com `amount < 0` (gastos) entram nos grupos de categoria
- `category_name` via JOIN é o campo a usar para exibição (não `category` denormalizado)
- `category_id = 0` na API remove a categoria da transaction
- Categorias sem ícone exibem fallback `Tag`

---

## Compras Parceladas

Compras parceladas são uma **classificação sistêmica** baseada nos campos `installment_current` e `installment_total` da `Transaction`. **Não** dependem de categoria manual.

### Identificação
O parser Nubank detecta "- Parcela X/Y" na linha e define:
- `tx.installment_current` — parcela atual (ex: 2)
- `tx.installment_total` — total de parcelas (ex: 4)
- `tx.description` — sem o sufixo "- Parcela X/Y" (limpo pelo parser)

Critério: `installment_current != null && installment_total != null && installment_total > 1`

### Seção "Compras parceladas" na fatura
Na tela `/cartao/[cardId]/fatura/[invoiceId]`:
- Seção aparece **somente** quando há ≥1 transaction parcelada
- Se não houver, a seção não é renderizada (sem estado vazio)
- Exibido no topo, antes do agrupamento por categorias

Layout:
```
Compras parceladas
  Nesta fatura: R$ 625,30
  Parcelas futuras estimadas: R$ 1.840,20
  Compras parceladas: 8

  [ Amazon — Parcela 2 de 4 · 04/03/2026
    2 parcelas futuras estimadas: R$ 121,44 ]
```

### Cálculos (todos no frontend, nenhum persistido)
```typescript
// Por lançamento:
futureCount  = tx.installment_total - tx.installment_current
futureAmount = Math.abs(tx.amount) * futureCount

// Total da seção:
installmentsTotalHere  = sum(abs(tx.amount) for tx in installments)
installmentsFutureTotal = sum(futureAmount for each)
```

- Última parcela (`futureCount === 0`) exibe "Última parcela ✓"
- Esses cálculos são **estimativas** — não alteram `invoice.total_amount`
- Não cria transações futuras automaticamente

### Convivência com categorias manuais
- A seção "Compras parceladas" é **complementar** ao agrupamento por categoria
- Um lançamento parcelado pode aparecer em ambos (compras parceladas E na categoria "Compras")
- Isso não é duplicidade no banco — é apenas duas visões do mesmo lançamento
- `category_id` manual continua funcionando normalmente em lançamentos parcelados

### Revisão de importação (`UploadPreview`)
- Coluna "Parcela" na tabela de revisão exibe `X/Y` quando `installment_current != null`
- Badge estilizado azul para parcelas; `—` para não parcelados
- `installment_current` e `installment_total` são enviados no payload de importação

---

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
api.uploadFile(file)                            // POST /api/upload → retorna invoice_metadata para Nubank
api.importTransactions(payload)                 // POST /api/import → inclui invoice no payload
api.getTransactions(filters?)                   // GET /api/transactions
api.getCardInvoice(month)                       // GET /api/transactions/invoice?month=YYYY-MM (legado)
api.getCardInvoiceByCard(cardId, month)         // GET /api/transactions/invoice?card_id=ID&month=YYYY-MM (legado)
api.getInvoiceTransactions(invoiceId)           // GET /api/transactions/invoice?invoice_id=ID (preferencial)
api.updateTransaction(id, { description?, category? })  // PATCH /api/transactions/{id}
api.getDashboardMonthly()                       // GET /api/dashboard/monthly
api.listCards()                                 // GET /api/cards
api.getCard(id)                                 // GET /api/cards/{id}
api.createCard(payload)                         // POST /api/cards
api.updateCard(id, payload)                     // PATCH /api/cards/{id}
api.deleteCard(id)                              // DELETE /api/cards/{id}
api.getCardInvoices(cardId)                     // GET /api/cards/{id}/invoices → lista CardInvoice[]
api.getCardInvoiceDetail(cardId, invoiceId)     // GET /api/cards/{id}/invoices/{invoice_id}
api.getCardInvoiceByMonth(cardId, dueMonth)     // GET /api/cards/{id}/invoices-by-month/{due_month}
api.listCategories(scope?)                      // GET /api/categories[?scope=credit_card]
api.createCategory(payload)                     // POST /api/categories
api.updateCategory(id, payload)                 // PATCH /api/categories/{id}
api.deleteCategory(id)                          // DELETE /api/categories/{id}
```

---

## Tipos principais

```typescript
// src/types/financial.ts
interface Transaction {
  id: number;
  date: string;                  // "YYYY-MM-DD"
  description: string;           // descrição normalizada (editável inline)
  raw_description: string | null;
  amount: number;                // positivo = entrada, negativo = saída
  account_id: number | null;
  account_type: string | null;   // 'nubank_pf' | 'nubank_pj' | 'nubank_cartao' | 'itau' | 'mercado_pago'
  card_id: number | null;        // ID do cartão (só transações de cartão)
  invoice_id: number | null;     // âncora principal da fatura (preferencial)
  category: string | null;       // nome da categoria denormalizado (preenchido via import ou PATCH)
  category_id: number | null;    // FK para tabela categories (scope=credit_card)
  category_name: string | null;  // nome da categoria via JOIN (retornado pela API — prefira este)
  category_group: string | null;
  is_internal_transfer: boolean;
  is_payment: boolean;
  installment_current: number | null;  // parcela atual (ex: 2)
  installment_total: number | null;    // total de parcelas (ex: 3)
  reference_month: string | null;      // "YYYY-MM" legado — preferir invoice_id
  billing_month: string | null;        // "YYYY-MM" — legado
  source_file: string | null;
  imported_at: string;
}
```

> **Categorização manual:** `category` e `category_id` podem ser definidos na tela de importação
> (select por linha no `UploadPreview`) ou editados depois via `PATCH /api/transactions/{id}`.
> Não há motor de categorização automática — o usuário atribui manualmente.
> `category_name` é preenchido via JOIN no backend e sempre preferível para exibição.

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
