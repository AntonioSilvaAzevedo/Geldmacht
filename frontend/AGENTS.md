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
│   │       ├── cartao/[cardId]/page.tsx  # /cartao/1 → Dashboard / visão geral do cartão
│   │       ├── cartao/[cardId]/faturas/page.tsx # /cartao/1/faturas → Listagem completa de faturas
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
| `GET` | `/api/cards/{id}/invoices` | Lista invoices reais (usado para nav e listagem) |
| `GET` | `/api/cards/{id}/invoices/{invoice_id}` | Detalhes da fatura + transactions + summary |
| `GET` | `/api/cards/{id}/dashboard` | Visão geral agregada do cartão (Feature 3) |
| `GET` | `/api/cards/{id}/invoices-by-month/{due_month}` | Busca invoice por `due_month` (compat. legada) |
| `GET` | `/api/categories?scope=credit_card` | Lista categorias manuais de cartão |
| `POST` | `/api/categories` | Cria categoria manual |
| `PATCH` | `/api/categories/{id}` | Edita categoria manual |
| `DELETE` | `/api/categories/{id}` | Remove categoria manual |
| `GET` | `/api/release-notes/pending` | **Lista acumulativa** de releases pendentes (`{releases:[...]}`) |
| `POST` | `/api/release-notes/mark-seen` | Marca múltiplas releases como vistas (bulk, idempotente) |
| `POST` | `/api/release-notes/{id}/mark-seen` | Legado — marca uma única release como vista |
| `GET` | `/api/onboarding/status` | Status do onboarding inicial do usuário |
| `POST` | `/api/onboarding/mark-seen` | Marca onboarding como visualizado (idempotente) |

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
| `/mes/[mes]` | Detalhe Mensal | — | 🚧 ComingSoonState (em desenvolvimento) |
| `/cartao` | Cartões | `GET /api/cards` | ✅ API real + empty state + ações por card |
| `/cartao/[cardId]` | Dashboard do cartão | `GET /api/cards/{id}` + `GET /api/cards/{id}/dashboard` | ✅ API real — métricas, gráfico, top categorias e faturas recentes |
| `/cartao/[cardId]/faturas` | Listagem completa de faturas | `GET /api/cards/{id}/invoices` | ✅ API real — todas as faturas ordenadas por vencimento |
| `/cartao/[cardId]/fatura/[invoiceId]` | Fatura por ID | `GET /api/cards/{id}/invoices/{invoice_id}` + `GET /api/cards/{id}/invoices` | ✅ API real — compras parceladas + recategorização + navegação prev/next |
| `/cartao/[cardId]/[anoMes]` | Fatura por Mês (legado) | `GET /api/cards/{id}/invoices-by-month/{due_month}` | ✅ API real + fallback legado |
| `/categorias` | Categorias | `GET/POST/PATCH/DELETE /api/categories` | ✅ API real — criar/editar/excluir com ícone |
| `/carteira` | Carteira Investimentos | — | 🚧 ComingSoonState (em desenvolvimento) |
| `/proventos` | Dividendos | — | 🚧 ComingSoonState (em desenvolvimento) |
| `/perfil` | Perfil do usuário | — | 🚧 ComingSoonState (acessado via UserProfileMenu) |
| `/configuracoes` | Configurações | — | 🚧 ComingSoonState (acessado via UserProfileMenu) |

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
- Tabela `categories` no banco: `id, user_id, name, scope, color, icon, card_id, parent_id, invoice_budget_limit`
- `icon` — chave de ícone (ex: `"shopping-cart"`). Nullable. Campo principal de representação visual.
- `color` — legado, mantido para compatibilidade.
- `scope = 'credit_card'` — único escopo válido atualmente
- `card_id` — FK para `credit_cards`. `null` = aplica em todos os cartões (global); `N` = exclusiva do cartão.
- `parent_id` — FK self-referencial. `null` = categoria principal; `N` = subcategoria. Profundidade máxima 1 nível.
- `invoice_budget_limit` — limite de gasto **por fatura** (numérico, nullable). Quando definido, deve ser `> 0`. É apenas visual — não bloqueia lançamentos.
- Isoladas por `user_id` — cada usuário tem suas próprias categorias

### Tipo no frontend (`api.ts`)
```typescript
interface Category {
  id: number; user_id: number; name: string; scope: 'credit_card';
  color: string | null; icon: string | null;
  card_id: number | null;             // null = todos os cartões
  parent_id: number | null;           // null = categoria principal
  invoice_budget_limit: number | null;// null = sem limite
  created_at: string; updated_at: string;
}
interface CategoryPayload {
  name: string; scope: 'credit_card';
  color?: string | null; icon?: string | null;
  card_id?: number | null;            // null/omitido = global
  parent_id?: number | null;          // null/omitido = principal
  invoice_budget_limit?: number | null;
}
interface CategoryUpdatePayload {
  name?: string; color?: string | null; icon?: string | null;
  card_id?: number | null;            // 0 limpa (vira global)
  parent_id?: number | null;          // 0 limpa (vira categoria principal)
  invoice_budget_limit?: number | null; // 0 remove o limite
}
```

### Fluxo de uso
1. **Criar:** `/categorias` → botão "Nova categoria" → modal com nome, ícone, escopo, cartão aplicado, limite por fatura.
2. **Adicionar subcategoria:** dentro do card de uma categoria, botão `+` → modal já com a categoria pai fixada (herda card_id).
3. **Editar:** botão de lápis no card → modal de edição com mesmos campos (sentinelas `0` para limpar valores).
4. **Atribuir no import:** `UploadPreview` exibe `<select>` por linha já filtrado pelo cartão da fatura, com label hierárquico para subcategorias (`Pai / Sub`).
5. **Atribuir depois:** `PATCH /api/transactions/{id}` com `{ category_id: N }` na tela da fatura. O backend valida que `card_id` da categoria é compatível com o cartão da transação.
6. **Exibir:** `/cartao/[cardId]/fatura/[invoiceId]` agrupa lançamentos por categoria em acordeão com ícone, mostrando barra de progresso quando há limite definido.

### Página `/categorias` — layout

Header explica o propósito: "Gerencie categorias, subcategorias, ícones, cartões vinculados e limites de gasto por fatura."

Resumo (cards): total de categorias, com limite definido, sem limite, aplicadas a todos os cartões.

Filtros: select de cartão (`Todos os cartões` ou cartão específico) + busca textual (filtra por nome da categoria ou nome da subcategoria).

Lista de categorias principais (parents):
- Card por categoria com ícone, nome, chip de limite, contador de subcategorias, label do cartão aplicado.
- Ações: `+` (adicionar subcategoria), lápis (editar), lixeira (excluir).
- Subcategorias aparecem dentro do card pai ao expandir o chip "N subcategorias".

Modal de criar/editar:
- Nome
- Ícone (com seletor visual)
- Usar esta categoria em (`Fatura de cartão de crédito`, fixo)
- Aplicar em (apenas para categorias principais — `Todos os cartões` ou cartão específico)
- Limite de gasto por fatura (opcional)
- Categoria pai (fixa quando criando subcategoria; bloqueada como "Nenhuma — categoria principal" ao criar principal)

Sentinelas para limpar campos no PATCH:
- `card_id: 0` → vira global
- `parent_id: 0` → vira categoria principal
- `invoice_budget_limit: 0` → remove o limite

### Filtragem por cartão na revisão da importação

`UploadPreview` calcula `categoryOptions` com `useMemo`:

1. Filtra `categories` aceitando apenas `scope === 'credit_card'` e (`card_id === null` || `card_id === selectedCard.id`).
2. Mapeia para `{ id, label, isSub }` onde `label` vira `Pai / Sub` quando `parent_id != null`.
3. Ordena por `label` para apresentação consistente.

Quando o usuário troca o cartão selecionado, um `useEffect` limpa `categoryIds` que deixaram de ser válidos (categoria de outro cartão), evitando enviar payloads que o backend rejeitaria.

Lançamentos sistêmicos (parcelas, pagamentos) continuam mostrando badge bloqueado em vez do `<select>`.

### Filtragem por cartão na tela da fatura

`/cartao/[cardId]/fatura/[invoiceId]` chama `api.listCategories('credit_card', cardId)` — o backend já retorna apenas categorias aplicáveis àquele cartão. Categorias de outros cartões nunca aparecem no `<select>` de recategorize.

O label das opções usa `categoryLabel(cat, fallback)` que prefixa com o nome da pai quando há `parent_id`. O agrupamento por categoria (`groups`) também usa esse label hierárquico.

### Barra de progresso de limite (`CategoryBudgetProgress`)

Componente: `src/components/CategoryBudgetProgress.tsx`.

Renderizado dentro de cada card de grupo de categoria na tela da fatura, **apenas** quando a categoria do grupo tem `invoice_budget_limit != null && > 0`.

Estados (faixas de % do gasto vs limite):

| Faixa     | Status         | Cor      |
|-----------|----------------|----------|
| 0–70%     | within_limit   | verde    |
| 71–90%    | attention      | amarelo  |
| 91–100%   | near_limit     | laranja  |
| > 100%    | exceeded       | vermelho |

Mostra: gasto/limite, % usado, mensagem de status (ex: "Atenção · R$ 280,00 disponível" ou "Limite ultrapassado em R$ 180,00"). Quando `> 100%`, a barra fica preenchida com padrão diagonal hachurado.

Não bloqueia lançamentos. Não altera `invoice.total_amount` nem nenhuma transaction.

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
- **Accordion**: o cabeçalho (chevron + resumo rápido) fica sempre visível; ao expandir, mostra os **três cards de resumo** (nesta fatura, parcelas futuras estimadas, quantidade de lançamentos) e a **lista** de compras parceladas
- Estado inicial do accordion **fechado** (`installmentsOpen = false`)

Layout (fechado: só o botão cabeçalho com valor nesta fatura à direita; expandido: cards + lista):
```
▼ Compras parceladas · N lançamentos · Nesta fatura R$ ...
  Nesta fatura | Parcelas futuras estimadas | Lançamentos parcelados
  [ Amazon — Parcela 2 de 4 · ...
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

## Bloqueio de Categoria em Lançamentos Sistêmicos

Compras parceladas (`installment_total > 1`) e pagamentos da fatura (`is_payment = true`) são lançamentos **sistêmicos** e não recebem `category_id` manual.

### Visual

**`UploadPreview` (revisão de importação):**
- Para parceladas: célula da coluna Categoria mostra um badge `Compra parcelada` com borda tracejada, em vez do `<select>`. Tooltip: *"Este lançamento é sistêmico e não pode ser categorizado manualmente."*
- Para pagamento: badge `Pagamento da fatura` com mesmo estilo.
- Ao montar o payload de importação, `category_id` desses lançamentos é forçado a `null` localmente — o backend faz o mesmo, mas o frontend deve evitar enviar valores inválidos.

**Detalhe da fatura (`/cartao/[cardId]/fatura/[invoiceId]`):**
- A linha de "alterar categoria" é substituída por um chip com ícone de cadeado: `Compra parcelada` ou `Pagamento da fatura`.
- O botão "alterar" não aparece para sistêmicos.
- Tooltip informativo idêntico ao do UploadPreview.

### Fluxo no backend

- **Importação**: backend normaliza silenciosamente — `category_id` enviado para sistêmicos é gravado como `null`.
- **Recategorização**: `PATCH /api/transactions/{id}` com `category_id` em sistêmico retorna `400 — Este lançamento é sistêmico e não pode ser categorizado manualmente.`

### Helper `isSystemicTx(tx)`

Função local na página de fatura:
```typescript
function isSystemicTx(tx: Transaction): boolean {
  if (tx.is_payment) return true;
  if (tx.installment_current != null && tx.installment_total != null && tx.installment_total > 1) return true;
  return false;
}
```

---

## Navegação entre faturas

Na tela `/cartao/[cardId]/fatura/[invoiceId]`, quando o cartão tem mais de uma fatura, aparece uma barra de navegação:

- **Botão Anterior** (`ChevronLeft + label do mês`): navega para `due_month` imediatamente menor.
- **Select / dropdown** com todas as faturas do cartão (rotuladas como `<Mês/Ano> — vence DD/MM/YYYY — R$ valor`).
- **Botão Próxima** (`label + ChevronRight`): navega para `due_month` imediatamente maior.

Regras:
- Lista de faturas vem de `api.getCardInvoices(cardId)`, carregada em paralelo com o detalhe da fatura.
- Ordenação por `due_month` ascendente para localizar prev/next.
- Se não houver fatura anterior/posterior, o botão correspondente fica desabilitado (opacity 0.4, cursor not-allowed).
- Trocar fatura no dropdown faz `router.push('/cartao/{cardId}/fatura/{newInvoiceId}')`.
- Faturas de outros cartões nunca aparecem (lista é filtrada por `card_id` no backend).
- A barra é ocultada quando o cartão tem apenas 1 fatura (sem nada para navegar).

---

## Dashboard do cartão (`/cartao/[cardId]`)

A rota `/cartao/[cardId]` agora é o **dashboard / visão geral** do cartão (não mais a listagem completa de faturas — essa migrou para `/cartao/[cardId]/faturas`).

Carrega via `api.getCardDashboard(cardId)` (`GET /api/cards/{id}/dashboard`).

### Layout

1. **Cabeçalho** com nome do cartão, instituição e dias de fechamento/vencimento. Botões `Importar fatura` e `Editar configurações` (form inline).
2. **4 metric cards** (`grid auto-fit`): Última fatura, Média mensal, Maior fatura, Parcelas futuras estimadas.
3. **Gráfico de evolução das faturas** (BarChart de `recharts`, já presente em `package.json`) — última 12 faturas em ordem cronológica crescente.
4. **Categorias principais** — top 5 categorias do cartão, com `CategoryIcon` e total formatado.
5. **Faturas recentes** — últimas 5 faturas com link para o detalhe + botão "Ver todas as faturas →" para `/cartao/[cardId]/faturas`.

### Empty state

Sem faturas: mostra apenas dados do cartão + `EmptyState` com botão "Importar fatura". Não exibe metric cards zerados nem gráficos vazios.

---

## Listagem completa de faturas (`/cartao/[cardId]/faturas`)

Rota separada para **todas** as faturas do cartão.

- Carrega via `api.getCardInvoices(cardId)` e ordena por `due_date` (fallback `due_month`) decrescente.
- Cada item navega para `/cartao/[cardId]/fatura/[invoiceId]`.
- Header com link "← Voltar à visão geral" e "Importar nova fatura".
- Empty state se não houver faturas.

---

## Onboarding Inicial (Bem-vindo ao Geldmacht)

Modal de boas-vindas exibido **uma única vez** para novos usuários, antes do fluxo de release notes.

### Componentes

- `src/components/OnboardingModal.tsx` — UI pura. Props: `onClose`, `onComplete`. Layout: header com gradiente + título "Bem-vindo ao Geldmacht", lista de tópicos com ícones, observação sobre áreas em desenvolvimento, botões "Pular" e "Começar". Ambos os botões disparam o mesmo fluxo (marcar como visto). Acessível: `role=dialog`, `aria-modal`, `aria-labelledby`, fecha por Esc/X/overlay.

- `src/components/WelcomeFlowGate.tsx` — orquestrador. Substitui o antigo `ReleaseNotesGate`. Após `useSession()` virar `'authenticated'`, dispara em paralelo `getOnboardingStatus()` e `getPendingReleaseNotes()` e decide qual modal mostrar.

### Conteúdo atual do onboarding

Tópicos do que o sistema faz **hoje** (não promete features inexistentes):

- Cadastre seus cartões de crédito.
- Importe faturas em PDF.
- Revise os lançamentos antes de salvar.
- Categorize seus gastos com categorias e subcategorias.
- Defina limites de gasto por categoria.
- Acompanhe compras parceladas e parcelas futuras.
- Veja dashboards com resumo dos seus cartões.

Observação: "Algumas áreas, como o dashboard geral, ainda estão em desenvolvimento." — exibida em caixa pontilhada como aviso honesto, sem prometer prazo.

### Prioridade entre modais

`WelcomeFlowGate` segue uma máquina de estados simples:

```
'loading' → carrega status (onboarding + pending releases) em paralelo
   ↓
'onboarding'   ← se should_show_onboarding === true
   ↓ (após dismissOnboarding)
'releases'     ← se houver releases pendentes
   ↓ (após dismissReleases)
'done'         ← nada mais a mostrar
```

Regras:

- **Onboarding tem prioridade** sobre release notes — só uma janela aparece por vez.
- Usuário antigo (já viu onboarding) sem releases pendentes → fase vai direto para `done`, nenhum modal aparece.
- Usuário antigo com releases pendentes → pula direto para `releases`.
- Usuário novo sem releases pendentes → mostra apenas onboarding e termina em `done`.
- Usuário novo com releases pendentes → onboarding primeiro, releases depois (transição automática após `dismissOnboarding`).

### Marcar como visto

- Carregar a Dashboard **não** marca como visto. Só `dismissOnboarding()` chama `markOnboardingSeen()`.
- Pular, Começar, fechar (X), Esc e clicar no overlay disparam o mesmo `dismissOnboarding()` — todos marcam como visto. Isso evita o modal reaparecer.
- Idempotente: chamadas repetidas no backend mantêm o timestamp original.
- Falha silenciosa: se o `markOnboardingSeen` falhar, o modal fecha localmente e o backend volta a indicar pendência na próxima sessão (não perdemos info).

### Tipos no `api.ts`

```typescript
api.getOnboardingStatus(): Promise<{
  should_show_onboarding: boolean;
  onboarding_key: string;            // "initial_app_overview"
  seen_at: string | null;
}>
api.markOnboardingSeen(): Promise<{ success: boolean; seen_at: string }>
```

### Diferença em relação a release notes

| Aspecto      | Onboarding                          | Release notes                         |
|--------------|-------------------------------------|---------------------------------------|
| Quando       | Apenas no primeiro acesso           | A cada nova versão `show_modal=true`  |
| Frequência   | Uma única vez por usuário           | Acumulativa por versão                |
| Conteúdo     | "O que o sistema faz"               | "O que mudou nesta versão"            |
| Persistência | `users.onboarding_seen_at`          | `user_release_note_views`             |
| Prioridade   | **Maior** (vem antes)               | Menor (após onboarding)               |

## Release Notes / Notas de atualização

Modal **acumulativo** de novidades exibido após login na Dashboard quando há ≥ 1 release pendente para o usuário.

### Componentes

- `src/components/ReleaseNotesModal.tsx` — UI pura. Props: `releases: ReleaseNote[]`, `onClose`, `onConfirm`. Acessível (role=dialog, aria-modal, aria-labelledby), fecha por Esc, X, clique no overlay ou botão "Entendi". Exibe scroll interno quando o conteúdo excede a altura.
- `src/components/ReleaseNotesGate.tsx` — orquestra o ciclo. Busca `getPendingReleaseNotes()` quando a sessão Auth.js está autenticada; se a lista vier não vazia, renderiza o `ReleaseNotesModal`; ao fechar/confirmar, chama `markReleaseNotesSeen(ids)` em **uma única chamada bulk**.

### Onde é carregado

`ReleaseNotesGate` é montado no topo da Dashboard (`src/app/(app)/page.tsx`). Não aparece em `/login`, `/register` (não estão sob `(app)`), nem antes da sessão estar autenticada — o `useSession()` aguarda `status === 'authenticated'` antes de chamar a API.

### Modal acumulativo (uma versão vs múltiplas)

- **Uma release** pendente → cabeçalho `Novidades · v0.X.Y` + título `Novidades da versão 0.X.Y`. Sem badge de versão repetido na seção.
- **Múltiplas releases** pendentes → cabeçalho `Novidades · N atualizações acumuladas` + título `Novidades desde seu último acesso` + subtítulo "Veja o que mudou enquanto você esteve fora.". Cada release vira uma seção própria com badge `vX.Y.Z` + título + descrição + lista de tópicos. Divisor entre seções.
- Releases vêm do backend já ordenadas da mais antiga para a mais recente — o modal renderiza nessa ordem.

### Regra de exibição única

A regra oficial é **no backend**. O `Gate`:

1. Pergunta ao backend o que está pendente (`GET /api/release-notes/pending`).
2. Backend retorna `{ releases: [...] }` (sempre 200, lista pode ser vazia).
3. Se `releases.length === 0` → modal não monta.
4. Ao fechar/confirmar, chama `POST /api/release-notes/mark-seen` com **todos** os `release_note_ids` exibidos (bulk, idempotente).
5. Não usa `localStorage` como fonte primária. Se a chamada de mark-seen falhar, na próxima sessão o backend ainda devolverá as releases.

A mesma versão **nunca** aparece duas vezes para o mesmo usuário. Usuários inativos (que ficaram tempo sem acessar) recebem **todas** as versões que perderam de uma só vez.

### Marcar como visto apenas no fechamento

- Carregar a lista **não** marca como visto. Só `mark-seen` persiste.
- Recarregar a Dashboard antes de fechar o modal mantém as releases pendentes.
- Fechar pelo X, overlay, Esc ou "Entendi" disparam o mesmo fluxo (`dismiss()` → `markReleaseNotesSeen(ids)` → fecha modal localmente).
- Se o backend recusar o bulk (offline, 500), o modal fecha localmente para não trapear o usuário, mas as releases continuam pendentes — voltam no próximo acesso.

### Como a versão é obtida

O modal usa o campo `version` retornado pelo backend (vindo da release note cadastrada via seed em `app/services/release_notes_seed.py`). A sidebar continua exibindo `config.appVersion` (lido de `package.json` ou `NEXT_PUBLIC_APP_VERSION`).

**Convenção:** ao adicionar uma release note no backend, atualize `frontend/package.json#version` para a mesma string. Isso mantém sidebar e modal alinhados.

### Tipos no `api.ts`

```typescript
interface ReleaseNote {
  id: number;
  version: string;
  title: string;
  description: string | null;
  items: string[];
  show_modal: boolean;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

api.getPendingReleaseNote(): Promise<ReleaseNote | null>      // 204 → null
api.markReleaseNoteSeen(id): Promise<{ success, seen }>       // idempotente
```

`getPendingReleaseNote` trata `204 No Content` retornando `null` em vez de erro de parse JSON.

### Como inserir release notes em novos prompts/features

Sempre que um prompt entregar mudança visível ao usuário, adicione/atualize a nota no backend:

1. Edite `RELEASE_NOTES` em `app/services/release_notes_seed.py` (mais nova primeiro).
2. Atualize `frontend/package.json#version` para a nova versão.
3. Use linguagem simples e amigável — **nunca** termos técnicos (`schema`, `migration`, `endpoint`, `refactor`, etc.).
4. `show_modal: true` é o padrão; use `false` apenas para ajustes internos.
5. No deploy, o seed roda no startup do backend e popula a versão idempotentemente.

Resumo do bloco para adicionar em prompts:

```
RELEASE NOTES:
  - Atualizar release note da versão atual.
  - Texto amigável, sem termos técnicos.
  - show_modal: true (padrão).
```

## Responsividade — Fluxo de Importação

A aplicação está sendo migrada gradualmente para mobile. **O primeiro fluxo migrado é a importação** (`/upload`). Outras telas seguem o padrão desktop atual e serão adaptadas em prompts futuros.

### Breakpoints

| Breakpoint | Largura          | Comportamento                                           |
|------------|------------------|---------------------------------------------------------|
| mobile     | ≤ 768px          | Sidebar oculta + drawer hamburger; layouts em coluna    |
| tablet     | 769–1024px       | Igual desktop; espaçamento padrão                       |
| desktop    | > 1024px         | Padrão completo                                         |

### Hook `useIsMobile`

Em `src/hooks/useIsMobile.ts`. Usa `window.matchMedia('(max-width: 768px)')` e atualiza no resize. SSR retorna `false` no primeiro render — componentes que dependem do valor mobile só atualizam após mount.

```typescript
const isMobile = useIsMobile();
```

### Utilities CSS (em `globals.css`)

- `.sidebar-desktop` — sidebar fixa visível só em > 768px.
- `.is-mobile-only` — `display: none` em desktop, `display: inline-flex` em mobile.
- `.is-desktop-only` — `display: none` em mobile.
- `.has-mobile-actionbar` — adiciona `padding-bottom: 80px` em mobile, reservando espaço para a barra sticky.
- Em mobile, `input/select/textarea` recebem `font-size: 16px` (evita zoom-on-focus do Safari iOS) e `min-height: 40px`. Botões: `min-height: 38px`. `html/body` ganham `overflow-x: hidden` para impedir scroll horizontal global.

### Drawer mobile (Sidebar overlay)

`src/components/Layout/MobileSidebarDrawer.tsx` — botão hamburger no Header (visível só ≤ 768px) que abre a `Sidebar` original como drawer overlay (`min(82vw, 280px)`). Fecha por X, clique no overlay escuro, Esc ou ao clicar em um link da sidebar (delegação no container).

O Header também:
- Mostra título/subtítulo com `text-overflow: ellipsis` para evitar quebra.
- Esconde a data atual e o botão de notificações em mobile (classe `is-desktop-only`).
- Mantém o `UserProfileMenu` sempre visível.

### Upload page (`/upload`)

- Padding reduzido em mobile (`20px 14px 28px` vs `32px 40px`).
- Header com fonte ligeiramente menor.
- Dropzone com padding interno reduzido e texto adaptado: **"Toque para selecionar arquivo"** em mobile (drag-and-drop continua funcionando, mas a mensagem foca no toque).
- Botão "Processar arquivo" continua `width: 100%` — naturalmente bom para toque.
- Lista de "Formatos suportados" funciona com `flex-wrap`.

### UploadPreview — cards mobile + tabela desktop

O componente decide o layout via `useIsMobile()`:

**Desktop (> 768px)**: tabela completa (Data, Descrição, Parcela, Categoria, Valor) com scroll interno e `max-height: 60vh`.

**Mobile (≤ 768px)**: lista vertical de **cards**, um por lançamento. Cada card mostra:

- Checkbox (toque grande, 17px)
- Data + descrição editável (`EditableDescription`)
- Valor à direita
- Badge de parcela (`Parcela X/Y`) quando aplicável
- Bloco de categoria com label + select de largura total OU badge "Compra parcelada · Bloqueado" / "Pagamento da fatura · Bloqueado" para sistêmicos

Cards têm visual diferente quando selecionados (fundo azul claro + borda azul) e quando o lançamento é uma transferência interna (opacidade reduzida).

### Bloco "Dados da fatura" responsivo

Grid alterna entre `repeat(auto-fill, minmax(180px, 1fr))` (desktop) e `1fr` (mobile, empilhado). Os inputs já tinham `width: 100%` natural — no mobile ficam confortáveis para toque graças aos `min-height: 40px` do CSS global.

### Barra de ações sticky no mobile

No mobile, a faixa final de "Cancelar / Importar" vira **sticky bottom**:

- `position: fixed; left: 0; right: 0; bottom: 0`
- Padding com `env(safe-area-inset-bottom)` para iPhones com notch
- `box-shadow: 0 -8px 24px rgba(0,0,0,0.30)` para destacar do conteúdo
- O container externo recebe `class="has-mobile-actionbar"` que reserva `padding-bottom: 80px` no conteúdo abaixo

Texto do botão também é compactado: `Importar (5)` em vez de `Importar 5 selecionados`. Contador mostra `5 selecionados` em vez de `Mostrando 82 de 100 · 5 serão importados`.

No desktop, a barra continua inline no final do conteúdo (sem sticky).

### Selects, modais e dropdowns

- Selects nativos `<select>` abrem com a UI nativa do dispositivo (segura no mobile).
- Modais (Onboarding, ReleaseNotes, Categorias) já usam `max-height: 90vh` + `overflow: auto` interno — caem dentro da tela mobile.
- Dropdown do `UserProfileMenu` tem `position: absolute` + `right: 0` — pode ficar próximo da borda em mobile mas não corta porque o container é do tamanho do viewport.

### Padrão para futuras telas mobile

1. Importar `useIsMobile` quando o layout precisar de variação significativa (cards vs tabela, sticky bar, navegação).
2. Para variações simples (font/padding), usar style condicional `isMobile ? X : Y`.
3. Para visibilidade alternada, preferir classes utilitárias `.is-mobile-only` / `.is-desktop-only`.
4. Reservar espaço quando houver barra sticky com `class="has-mobile-actionbar"`.
5. Não duplicar dados — sempre mesma fonte de verdade, só layout muda.
6. Inputs nativos respeitam o reset global (font-size 16px, min-height 40px) — não sobrescrever para valores menores em mobile.

## Sidebar e Header

### Sidebar (`src/components/Layout/Sidebar.tsx`)

- **Não exibe nome, e-mail ou qualquer dado pessoal hardcoded.** Avatar e dados do usuário ficam exclusivamente no `UserProfileMenu` (no Header).
- Logo + lista de itens de navegação (Menu) e Ferramentas (Importar).
- **Rodapé contém apenas a versão do sistema** como chip discreto à direita: `v{config.appVersion}`. Sem nome de usuário, sem e-mail, sem botão de sair.
- A versão **nunca** é hardcoded — sempre vem de `config.appVersion` (que lê `NEXT_PUBLIC_APP_VERSION` ou `package.json#version`).

### Header (`src/components/Layout/Header.tsx`)

Simplificado para conter apenas:
- Título e subtítulo da página.
- Data atual (capitalize, `pt-BR`).
- Botão de notificações (placeholder).
- `UserProfileMenu` — avatar com popover de ações.

**Não tem mais** botão "Atualizar dados" (RefreshCw) nem botão de Sair solto. Logout só está dentro do popover do perfil.

### `UserProfileMenu` (`src/components/Layout/UserProfileMenu.tsx`)

Avatar circular com iniciais derivadas do nome/e-mail real da sessão Auth.js. Quando não há sessão, exibe ícone de usuário genérico (sem dados fake). Clicar abre popover com:

- **Perfil** → `/perfil` (ComingSoonState)
- **Configurações** → `/configuracoes` (ComingSoonState)
- **Sair** → chama `signOut({ callbackUrl: '/login' })` do `next-auth/react`.

Comportamento:
- Cabeçalho do popover mostra nome + e-mail vindos da sessão (apenas se existirem).
- Fecha por clique fora, tecla `Esc` ou ao selecionar uma ação.
- `aria-haspopup`, `aria-expanded`, `role="menu"`, `role="menuitem"` para acessibilidade.

Regras importantes:
- Nunca renderizar nome/e-mail fixos como fallback — se a sessão não tem, simplesmente não exibe.
- O popover é a **única** porta de saída para logout no app autenticado.

## Estado "em desenvolvimento" (ComingSoonState)

Componente: `src/components/ComingSoonState.tsx`.

Use sempre que uma página estiver acessível pela navegação mas ainda não tiver dados reais ou implementação concluída — evita mostrar mocks ou layouts vazios sem explicação.

```tsx
<ComingSoonState
  title="Página mensal em desenvolvimento"
  description="Em breve você poderá acompanhar gastos, entradas e evolução mensal por aqui."
  icon={<CalendarDays size={20} color="var(--blue-400)" />}
/>
```

Páginas atualmente em desenvolvimento que usam o componente:
- `/mes/[mes]` — detalhamento mensal completo.
- `/carteira` — investimentos e ativos.
- `/proventos` — dividendos e rendimentos.
- `/perfil` — perfil do usuário (acessado pelo `UserProfileMenu`).
- `/configuracoes` — configurações do app (acessado pelo `UserProfileMenu`).

**Regras:**
- Não renderizar números, gráficos ou listas com dados inventados.
- Não deixar a página em branco.
- Não criar dados simulados como fallback.
- Quando o backend ganhar suporte real, substituir o `ComingSoonState` pela implementação completa.

## Dashboard sem dados fixos

`/(app)/page.tsx` consome **sempre** dados reais via `useFinancialData('monthly')`. Regras:

- **Subtítulo do Header é dinâmico** — derivado do primeiro e último mês carregados (ex: `"Janeiro — Abril 2026"`); ausente quando ainda não há dados.
- **Médias por mês** dividem por `months.length`, nunca por número fixo.
- **Subtítulos dos cards e gráficos** referenciam `rangeLabel` calculado, não strings literais com mês/ano.
- **Melhor Mês / Pior Mês** são calculados dos dados reais (mês com maior/menor `saldoLiquido`). Nunca hardcoded.
- **Taxa de Poupança / Gasto-Entrada** mostram `—` quando `totalEntradas <= 0` (evita NaN/Infinity).
- Nenhum badge tipo "Dados mockados" — em vez disso, exibe a contagem real de meses (`N meses`).
- Estados de erro (`<ErrorState>`) e sem dados (`<EmptyState>`) já existiam e são preservados.

Ao adicionar novos cards/gráficos à Dashboard, **siga o mesmo padrão**: nada hardcoded; calcule de `data` ou exiba placeholder explícito quando não houver número real.

## Logout obrigatório por versão

Mecanismo client-side para forçar relogin quando uma nova versão exige sessão renovada (Opção B do design — frontend-controlado; o backend não precisa de mudanças).

### Como configurar

1. No `.env.production`, defina `NEXT_PUBLIC_MIN_AUTH_VERSION` igual à versão atual do app:
   ```
   NEXT_PUBLIC_MIN_AUTH_VERSION=0.4.0
   ```
2. Faça bump em `frontend/package.json#version` para a mesma versão.
3. Deploy. Ao próximo acesso autenticado, sessões emitidas em versões anteriores são forçadas a relogar.

Se a próxima versão não exigir relogin, **não atualize** `NEXT_PUBLIC_MIN_AUTH_VERSION` — mantenha o valor anterior. Sessões já feitas naquela versão continuam válidas.

### Como funciona

- `src/config/env.ts` expõe `config.minAuthVersion` (lido de `NEXT_PUBLIC_MIN_AUTH_VERSION`; vazio = sem força).
- `src/lib/version.ts::compareVersions` faz comparação semver-style (sem dependências).
- `src/lib/authVersion.ts` controla o `localStorage["geldmacht_auth_version"]`:
  - `markAuthVersionCurrent()` — grava `appVersion` após login bem-sucedido.
  - `getStoredAuthVersion()` / `clearStoredAuthVersion()` — leitura/limpeza.
  - `shouldForceRelogin()` — true quando `stored < minAuthVersion` e `stored` existe.
- `src/components/AuthVersionGate.tsx` é montado em `src/app/(app)/layout.tsx` e:
  - Se `status === 'authenticated'` e `shouldForceRelogin()` → limpa storage e chama `signOut({ callbackUrl: '/login' })`.
  - Se `status === 'authenticated'` e storage está vazio → grava a versão atual (primeiro acesso pós-login).
  - Não faz nada quando não autenticado.

### Por que não dispara em loop

A função `shouldForceRelogin()` exige que **já exista** valor armazenado e ele seja **menor** que o mínimo. Em primeiro login pós-deploy, storage está vazio → função retorna false → o Gate apenas grava o storage com a versão atual. Após o relogin, novo acesso na mesma versão não dispara.

### Integração com release notes

`AuthVersionGate` roda em **paralelo** ao `ReleaseNotesGate` na Dashboard. Como `AuthVersionGate` chama `signOut` antes do modal carregar, o usuário é redirecionado para `/login` sem que a release note seja marcada como vista. Após o login, a Dashboard carrega normalmente e `ReleaseNotesGate` exibe a release note pendente — fechá-la marca como vista no backend.

### Limpeza coordenada

- `UserProfileMenu` (logout manual): `clearStoredAuthVersion()` antes de `signOut`.
- `lib/api.ts`: ao receber 401 do backend, também limpa o storage antes de redirecionar para `/login`.
- `AuthVersionGate` (logout automático): limpa storage antes de chamar `signOut`.

Isso evita estado inconsistente: storage = versão velha + sessão Auth.js já invalidada.

## Página Categorias — estados e robustez

A página `/categorias` (`src/app/(app)/categorias/page.tsx`) trata explicitamente cinco estados:

1. **Carregando** — spinner + texto "Carregando categorias...".
2. **Erro de carregamento** — caixa com ícone de alerta, mensagem do erro e botão "Tentar novamente" que chama `load()` de novo.
3. **Sem categorias (`categories.length === 0`)** — empty state com botão "Criar primeira categoria".
4. **Sem resultado por filtro (`filtersActive`)** — mensagem "Nenhuma categoria encontrada com os filtros atuais" + botão "Limpar filtros".
5. **Mismatch (total > 0 mas `parents.length === 0`)** — alerta amarelo informando que existem N categorias cadastradas mas nenhuma principal foi encontrada, com botão "Recarregar". Esse estado captura situações anômalas (todas as categorias se tornaram subcategorias órfãs, etc.).

### Filtros defensivos

Os filtros de hierarquia usam **comparação loose (`== null`)**, não estrita (`=== null`):

```typescript
const parents = categories.filter(c => c.parent_id == null);
const subsByParent = ...categories.filter(c => c.parent_id != null);
```

Isso casa tanto `null` quanto `undefined`. Foi a correção do bug em produção onde o `total` aparecia mas a lista ficava vazia: a API podia retornar `parent_id`/`card_id` como ausentes em alguns cenários (cache stale, schema antigo) e o filtro estrito descartava todos os registros.

## Versão do sistema na sidebar

A versão é exibida no rodapé da sidebar (em `Sidebar.tsx`) como um chip discreto: `v0.3.0`.

### Fonte da versão

Centralizada em `src/config/env.ts`:

```typescript
import pkg from '../../package.json';
const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ?? (pkg as { version?: string }).version ?? '0.0.0';

export const config = { apiUrl, appVersion: APP_VERSION, ... };
```

Prioridade:
1. `NEXT_PUBLIC_APP_VERSION` (variável pública injetada no build) — pode ser usada por CI/CD para sobrescrever em deploy.
2. `package.json#version` (default em dev) — embutido em build-time pelo Next.js (`resolveJsonModule: true` já habilitado).

### Regras
- Não hardcodar a versão diretamente em `Sidebar.tsx` — sempre via `config.appVersion`.
- Atualizar a versão em `package.json` ao fazer release significativo.
- Convenção: `0.1.0` primeira versão, `0.1.x` correções, `0.x.0` features relevantes.

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
api.listCategories(scope?, cardId?)              // GET /api/categories[?scope=credit_card][&card_id=N]
api.createCategory(payload)                     // POST /api/categories
api.updateCategory(id, payload)                 // PATCH /api/categories/{id}
api.deleteCategory(id)                          // DELETE /api/categories/{id}
api.getPendingReleaseNotes()                    // GET /api/release-notes/pending → { releases: ReleaseNote[] }
api.markReleaseNotesSeen(ids: number[])         // POST /api/release-notes/mark-seen (bulk, idempotente)
api.getOnboardingStatus()                       // GET /api/onboarding/status
api.markOnboardingSeen()                        // POST /api/onboarding/mark-seen
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
