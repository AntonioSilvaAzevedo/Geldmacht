# 🗺️ Roadmap do Projeto

> **Última atualização:** 2026-05-16

---

## ✅ Fase 1 — Frontend com Dados Mockados (CONCLUÍDA — 27/04/2026)

Design dark fintech, 5 telas, dados JSON. Tema navy original (substituído pelo Apple Direction na Fase 3).

---

## ✅ Fase 2 — Backend e Parsers de Extratos (CONCLUÍDA — 29/04/2026)

FastAPI + SQLite + 5 parsers (Nubank PF/PJ, Itaú, Mercado Pago, Fatura Nubank) + OFX. 26 testes passando.

---

## ✅ Fase 3 — Integração Frontend + Backend (CONCLUÍDA — Mai/2026)

### ✅ Etapa 3.0 — Banco zerado e dados reais importados
- Alembic migrations, dados reais de produção importados, mocks arquivados.

### ✅ Etapa 3.1 — Frontend conectado à API real
- `src/lib/api.ts` como camada tipada de comunicação.
- Dashboard, mes, cartão, upload, categorias consumindo API real.

### ✅ Etapa 3.2 — Autenticação completa
- NextAuth v5 com Credentials + Google OAuth.
- JWT 7 dias, refresh automático (proativo + reativo).
- `AuthRefreshGuard` para renovação silenciosa e logout amigável.
- Proteção de rotas pelo `(app)` route group.

### ✅ Etapa 3.3 — Navegação Apple Direction
- `Sidebar` desktop + `BottomTabBar` mobile.
- `PageHeader` reutilizável (título + breadcrumb + slot de navegação).
- Design system: tokens CSS Apple, fundo preto, DM Mono para valores.

### ✅ Etapa 3.4 — Carteira e detalhe de instituição
- `carteira/page.tsx` — lista de instituições agrupadas.
- `carteira/[slug]/page.tsx` — tabs Conta / Cartão / Resumo.
- `ContaEmptyState` — fluxo de vincular conta bancária sem limpar banco.

### ✅ Etapa 3.5 — Lançamento manual com fila batch
- Tela `/lancamentos/novo` redesenhada com novos componentes:
  - `TypeToggle` — toggle Saída/Entrada (sizes sm/md/lg)
  - `AmountInput` — campo hero com auto-formatação BRL cents-based
  - `CategorySelector` — grid (web) ou chips + expand (mobile)
  - `BatchQueue` — fila de lançamentos, sidebar (web) ou barra compacta (mobile)
- Endpoint `POST /api/transactions/batch` — lote num único commit.
- `formatCurrencyInput()` / `parseCurrencyDigits()` em `formatters.ts`.

---

## 🔮 Fases Futuras

### Fase 4 — IA para categorização inteligente
Usar Claude API para sugerir categorias automaticamente ao importar.

### Fase 5 — Carteira B3 com dados reais
Integrar xlsx de posição/movimentação/negociação B3. Tela de proventos com dados reais.

### Fase 6 — Notificações
DAS vencendo, fatura alta, dividendo recebido.

### Fase 7 — Projeções e metas financeiras
Dashboard prospectivo: projeção de renda, metas de aporte, reserva de emergência.

### Fase 8 — Multi-usuário / SaaS (se desejado)

---

## 🚦 Status Atual

- [x] **Fase 1** — ✅ Concluída (27/04/2026)
- [x] **Fase 2** — ✅ Concluída (29/04/2026)
- [x] **Fase 3** — ✅ Concluída (Mai/2026) — app funcional end-to-end
- [ ] **Fase 4** — IA para categorização (próxima)
- [ ] **Fase 5** — Carteira B3 real
