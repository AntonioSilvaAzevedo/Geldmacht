# 📋 Progresso — Fase 3 (Integração e Dados Reais)

> **Status: 🔴 Etapa 3.2 aguardando — Etapa 3.1.3 concluída (30/04/2026)**

---

## ✅ Etapa 3.0 — Base de Dados Real (CONCLUÍDA — 29/04/2026)

| # | Item | Status |
|---|---|---|
| 1 | Banco zerado e recriado via Alembic | ✅ |
| 2 | JSONs mockados movidos para `src/data/archive/` | ✅ |
| 3 | PDFs importados via `/upload` | ✅ |
| 4 | 221 transações no banco | ✅ |
| 5 | Deduplicação validada | ✅ |

---

## ✅ Etapa 3.1 — Nubank PF → Dashboard Real (CONCLUÍDA — 29/04/2026)

**Objetivo:** banco limpo → importar extrato Nubank PF → Dashboard exibindo dados reais.

| # | Item | Status |
|---|---|---|
| 1 | Banco zerado novamente (partir limpo) | ✅ |
| 2 | Importar extrato Nubank PF via `/upload` (71 transações, mar/2026) | ✅ |
| 3 | Validar transações no Swagger | ✅ |
| 4 | `GET /api/dashboard/monthly` criado no backend | ✅ |
| 5 | `GET /api/transactions?limit=1000` já existia | ✅ |
| 6 | `useFinancialData` refatorado para `fetch()` | ✅ |
| 7 | Dashboard Anual exibindo dados reais | ✅ |
| 8 | Visão Mensal `/mes/2026-03` exibindo transações reais | ✅ |
| 9 | `LoadingSpinner`, `ErrorState`, `EmptyState` criados e aplicados | ✅ |
| 10 | Build de produção limpo (zero erros TS/ESLint) | ✅ |

**Iniciada em:** 29/04/2026
**Concluída em:** 29/04/2026

### Resultado

| Mês | Entradas | Gastos | Investimentos | Saldo |
|---|---|---|---|---|
| 2026-03 | R$ 16.927 | R$ 24.501 | R$ 5.507 | -R$ 13.081 |

### Notas de bastidores

- O PDF disponível (`teste-1.pdf`) cobre **março/2026**, não abril — não há extrato de abril disponível. Dashboard exibe março corretamente.
- `GET /api/dashboard/monthly` agrega por padrões de descrição: salário (Itaú), investimentos (Compra de FII/Ações/ETF), fatura (Pagamento de fatura), fixos (demais saídas).
- `useFinancialData` agora usa `fetch()` para `monthly` e `transactions`. `creditCard`, `investments` e `dividends` retornam `null` (archive removido) — será resolvido na Etapa 3.2+.
- Componentes `LoadingSpinner`, `ErrorState` e `EmptyState` criados em `src/components/` e aplicados no Dashboard, Visão Mensal, Carteira, Proventos e Cartão.
- `/carteira`, `/proventos` e `/cartao/[mes]` exibem `EmptyState` quando não há dados (banco vazio ou etapa ainda não implementada).

---

## ✅ Etapa 3.1.1 — Correções pós-validação (CONCLUÍDA — 30/04/2026)

**Objetivo:** corrigir bugs encontrados após a primeira importação real antes de expandir para outros bancos.

| # | Bug/Melhoria | Status |
|---|---|---|
| 1 | **Botão "Cancelar" na tela de upload** — voltar para drop zone sem importar | ✅ |
| 2 | **Tabela de preview com scroll interno** — altura fixa, botões sempre visíveis | ✅ |
| 3 | **Visão Mensal com detalhes dos gastos** — seções listam transações individuais | ✅ |
| 4 | **Persistência validada** — todas as extrações consultáveis a qualquer momento | ✅ |
| 5 | Build de produção limpo após correções | ✅ |

**Iniciada em:** 30/04/2026
**Concluída em:** 30/04/2026

### Notas técnicas

- `UploadPreview`: botão "Cancelar" adicionado no rodapé (chama `onBack` → volta para drop zone); tabela com `maxHeight: 60vh / overflowY: auto`; "Importar" movido para rodapé — sempre visível
- `TransactionOut` schema: adicionado campo `account_type` (string do Account.type) via join eager load em `list_transactions`
- `Transaction` TypeScript type: atualizado para refletir campos reais da API (`account_type`, `is_internal_transfer`, etc.)
- Visão Mensal: categorização por regras no frontend (sem `category_group` do banco) — entradas/fixos/cartão/movimentações/investimentos derivados de `amount`, `account_type`, `is_internal_transfer` e keywords de descrição
- Persistência: `DATABASE_URL=sqlite:///./geldmacht.db` → disco ✅ (107 transações nubank_cartao no banco)

---

## ✅ Etapa 3.1.2 — Correções pós-validação segunda rodada (CONCLUÍDA — 30/04/2026)

| # | Bug/Melhoria | Status |
|---|---|---|
| 1 | **Total da fatura zerado** — KPI e header da seção usavam `monthData.gastos.faturaCartao` (0 sem PF extrato) | ✅ |
| 2 | **Valores estranhos na Visão Mensal** — backend agrupa todas as compras do cartão como `fixosMoradia` | ✅ |
| 3 | **`/cartao/[mes]` vazia** — ainda usava `useFinancialData('creditCard')` → `null` | ✅ |
| 4 | **Badge tipo detectado no upload** — `parser_used` bruto substituído por label amigável | ✅ |
| 5 | Build de produção limpo | ✅ |

**Concluída em:** 30/04/2026

### Notas técnicas

- Visão Mensal: **todos os totais agora derivam das arrays de transações** (`txEntradas`, `txCartao`, `txFixos`, `txInvest`) — independentes do `GET /api/dashboard/monthly`. O endpoint monthly é usado apenas para sub-breakdowns (salarioCLT, acoes/fiis/etfs) quando esses extratos forem importados.
- `/cartao/[mes]`: **reescrita completa** — fetch direto `GET /api/transactions?account=nubank_cartao&month={mes}`. Removeu dependência de `CreditCardData` mock. Bundle caiu de 217 kB → 110 kB.
- `UploadPreview`: mapa `PARSER_LABELS` — badge colorido com nome amigável do parser detectado.

---

## ✅ Etapa 3.1.3 — Parcelas (compras parceladas) (CONCLUÍDA — 30/04/2026)

**Objetivo:** detectar "Parcela X/Y" nas transações da fatura Nubank, persistir no banco e exibir na `/cartao/[mes]` com dois grupos e card de comprometimento futuro.

| # | Item | Status |
|---|---|---|
| 1 | **Migração Alembic** — colunas `installment_current` e `installment_total` (INTEGER nullable) adicionadas à tabela `transactions` | ✅ |
| 2 | **Parser `fatura_nubank.py`** — regex `_INSTALLMENT_RE` extrai "- Parcela X/Y" da descrição, remove o sufixo, preenche campos | ✅ |
| 3 | **Schemas** — `TransactionBase` e `ParsedTransaction` com `installment_current/total`; `import_transactions.py` passa os campos | ✅ |
| 4 | **Frontend `/cartao/[mes]`** — dois accordions (À vista / Parceladas), `InstallmentBadge` com progresso, card "Comprometimento Futuro" | ✅ |
| 5 | **Build de produção limpo** | ✅ |

**Concluída em:** 30/04/2026

### Notas técnicas

- Formato no PDF: `04 FEV Mercadolivre*Wrsteel - Parcela 2/3 R$ 65,73` — parcela **na mesma linha** que a descrição, não em linha separada
- Regex: `r"\s*-\s*Parcela\s+(\d+)/(\d+)\s*$"` — aplicado à string de descrição extraída pelo `_TX_LINE_RE`
- Resultado do teste com fatura real: **104 transações totais, 23 parceladas detectadas**
- `comprometimentoFuturo = Σ (installment_total - installment_current) × |amount|` por compra parcelada ainda em aberto
- `InstallmentBadge`: cor varia — blue (< 33%), amber (33–66%), green (≥ 66% pago)
- `Accordion`: collapsible, scroll interno via `overflow-y: auto`
- Bundle `/cartao/[mes]`: 3.55 kB / 111 kB First Load JS

---

## ⚫ Etapa 3.2 — Expandir para outros bancos

| # | Item | Status |
|---|---|---|
| 1 | Importar Nubank PJ | ⚫ |
| 2 | Importar Itaú Uniclass | ⚫ |
| 3 | Importar Mercado Pago | ⚫ |
| 4 | Importar Fatura Cartão Nubank | ⚫ |
| 5 | Dashboard consolidado com todos os bancos | ⚫ |

---

## ⚫ Etapa 3.3 — Categorização (Fase 4+)

Descartada do MVP. Ver BACKLOG.md → seção "🤖 IA / Categorização".

## ⚫ Etapa 3.4 — B3 / Carteira / Proventos (Fase 4+)

Aguarda parsers xlsx. Ver BACKLOG.md → seção "💼 Investimentos".

---

## 📌 Notas de bastidores

_(Preencher conforme o desenvolvimento avança)_
