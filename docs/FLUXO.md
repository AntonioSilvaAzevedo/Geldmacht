# Fluxo do Geldmacht — o que está funcionando

> Mapa passo a passo do que o app faz hoje, para consulta rápida e para não retroceder em features já entregues.
> **Atualizado em:** 2026-06-17

**Legenda:** ✅ funcionando · 🚧 em desenvolvimento · ⛔ não iniciado

**Stack:** Next.js (App Router) + React + TypeScript + Tailwind (frontend, repo `Geldmacht`) · FastAPI + SQLAlchemy + Alembic (backend, repo `geldmacht-api`). Local: SQLite · Produção: Supabase/Postgres.

---

## Navegação principal (sidebar / bottom tab)

| Item | Rota | Status |
|---|---|---|
| Início | `/home` | ✅ |
| Carteira | `/home/carteira` | ✅ |
| Proventos | `/home/proventos` | 🚧 |
| Categorias | `/home/categorias` | ✅ |
| Configurações | `/home/configuracoes` | 🚧 |
| Perfil | `/home/perfil` | 🚧 |
| Adicionar (lançamento) | modal global | ✅ |

---

## 1. Autenticação ✅

1. `/login` — entrar com e-mail e senha.
2. `/register` — criar conta.
3. Sessão via NextAuth; rotas `/home/*` exigem login.

---

## 2. Carteira ✅ (foco atual)

A Carteira é organizada por **instituição** (banco/corretora). Desde a issue #44, o vínculo entre instituição e seus produtos usa a **entidade `Institution` (FK `institution_id`)**, não mais a string livre.

> **Conceito-chave:** uma instituição "nasce" no momento em que seu **primeiro produto** (conta corrente **ou** cartão) é criado. Por isso, ao abrir uma instituição, o resumo lista qualquer produto que carregue aquele `institution_id` — inclusive um cartão que tenha sido criado já vinculado a ela.

### 2.1. Lista de instituições — `/home/carteira` ✅
1. Mostra um **card por instituição** (avatar colorido, nº de contas/cartões, total da fatura quando houver).
2. **Estado vazio:** "Cadastrar conta bancária" → modal de conta bancária.
3. **Adicionar cartão** (tile tracejado) → modal de cartão. Ao salvar, faz **get-or-create** da instituição pelo nome digitado e cria o cartão já vinculado (`institution_id`).
4. Clicar num card → abre o **resumo da instituição** (`/home/carteira/{id}`).

### 2.2. Resumo da instituição — `/home/carteira/{id}` ✅ (issue #44)
O slug da rota é o **id** da instituição. A tela mostra três seções:

1. **Conta corrente** — lista contas vinculadas; se vazia, botão "Cadastrar conta corrente" (modal com a instituição já fixada). Com contas → link "Ver conta corrente (n)" para o extrato.
2. **Cartão de crédito** — lista cartões vinculados; se vazio, "Cadastrar cartão de crédito" (modal com a instituição já fixada). Com cartões → link "Ver cartão de crédito (n)" para as faturas.
3. **Investimentos** — 🚧 placeholder "Funcionalidade ainda não disponível".

Ao cadastrar conta/cartão por aqui, o produto já entra vinculado àquela instituição e o resumo é recarregado.

### 2.3. Extrato (conta corrente) — `/home/carteira/{id}/extrato` ✅
1. Abas por conta (quando há mais de uma na instituição).
2. **Adicionar lançamento** → modal de lançamento manual.
3. **Exportar extrato** → baixa CSV (`extrato-{conta}-{ano}.csv`).
4. Lista as transações da conta no período.

### 2.4. Faturas do cartão — `/home/carteira/{id}/cartao/faturas` ✅
1. **Visão anual:** grade dos 12 meses do ano vigente.
2. Cada mês com fatura → mostra o total e abre o **detalhe da fatura**.
3. Meses sem fatura → card vazio.

### 2.5. Detalhe da fatura — `/home/carteira/{id}/cartao/faturas/{invoiceId}` ✅
Detalhe de uma fatura específica (metadados, ciclo, totais e itens).

---

## 3. Cartões — `/home/cartao` ✅
Visão geral de todos os cartões: limite/fatura, **Adicionar cartão**, editar e excluir. Cada cartão linka para suas faturas dentro da instituição (`/home/carteira/{institution_id}/cartao/faturas`).

---

## 4. Categorias — `/home/categorias` ✅ (issues #23/#38)
1. Categorias **globais** do usuário (sem escopo/destino — simplificado na #38).
2. Usadas para classificar lançamentos manuais e itens importados.

---

## 5. Lançamento manual (modal global) ✅
Acionado pelo botão "Adicionar" (bottom tab) ou por "Adicionar lançamento" no extrato.
1. **Tipo:** Entrada (income) / Saída (expense).
2. **Valor**, **Conta** (conta bancária), **Categoria**, **Descrição**.
3. Pré-requisito: precisa existir ao menos uma conta (senão abre modal de pré-requisito).

---

## 6. Importação / Upload — `/home/upload` ✅
1. Importa **extrato bancário (OFX)** → vincula a uma conta corrente.
2. Importa **fatura de cartão (PDF)** → vincula a um cartão e gera a fatura/`invoice`.
3. Pré-visualização antes de confirmar; ao concluir, redireciona para o extrato/fatura correspondente (`/home/carteira/{institution_id}/...`).

---

## 7. Outras telas
| Tela | Rota | Status | Observação |
|---|---|---|---|
| Início (dashboard) | `/home` | ✅ | Visão geral do mês |
| Mês | `/home/mes/{mes}` | ✅ | Detalhe de um mês |
| Proventos | `/home/proventos` | 🚧 | |
| Configurações | `/home/configuracoes` | 🚧 | |
| Perfil | `/home/perfil` | 🚧 | |

---

## 8. Backend — endpoints (resumo)
`auth` · `upload` · `bank-accounts` · `institutions` · `import` (transactions) · `transactions` · `cards` · `categories` · `dashboard` · `release-notes` · `onboarding`.

Modelo de dados central da Carteira: `Institution` 1—N `BankAccount` / `CreditCard` (via `institution_id`); `Transaction` ligada a conta ou cartão; `Invoice` para faturas.

---

## 9. Pendências / pontos de atenção
- **Investimentos**: seção existe só como placeholder no resumo da instituição. ⛔
- **Backfill `institution_id`** (issue #44): precisa estar aplicado no ambiente para que registros antigos apareçam agrupados por instituição. Contas sem instituição ficam no grupo "Sem instituição" (sem hub dedicado).
- Telas 🚧 (Proventos, Configurações, Perfil) ainda em evolução.

> Sempre que uma issue entregar uma feature nova ou mudar um fluxo, atualizar este arquivo.
