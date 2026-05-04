# 🗺️ Roadmap do Projeto

O projeto é dividido em **3 fases sequenciais**. Cada fase deve estar funcional e validada antes de partir para a próxima.

---

## ✅ Fase 1 — Frontend com Dados Mockados (CONCLUÍDA — 27/04/2026)

**Objetivo:** ter retorno visual rápido — replicar a planilha como uma interface web bonita e funcional, mas usando dados em arquivos JSON locais.

**Por que começar pelo frontend?**
- Ver o resultado visual em poucos dias motiva a continuar
- Permite refinar a UX antes de complicar com backend
- Os dados mockados servirão como referência da estrutura final

**Entregáveis — todos concluídos ✅:**
- Next.js 15 + TypeScript + Tailwind 4 rodando localmente
- 5 telas: Dashboard Anual, Visão Mensal, Cartão de Crédito, Carteira B3, Proventos
- Dados em JSON (Jan-Abr/2026) com valores reais da planilha
- Gráficos interativos: barra, linha, pizza, barras empilhadas
- Hook `useFinancialData` com dynamic imports (pronto para Fase 3)
- Tipos TypeScript centralizados em `src/types/financial.ts`
- Design dark navy fintech, responsivo, build limpo
- Tema: `#0f1b2d` background + DM Sans/Mono

**Detalhes:** `docs/FASE-1-FRONTEND.md` | Histórico: `docs/PROGRESSO-FASE-1.md`

---

## ✅ Fase 2 — Backend e Parsers de Extratos (CONCLUÍDA — 29/04/2026)

**Objetivo:** o sistema deve ser capaz de **ler e entender extratos** automaticamente.

**Entregáveis — todos concluídos ✅:**
- API REST em FastAPI rodando em `localhost:8000`
- 5 parsers funcionando: Nubank PF, Nubank PJ, Itaú, Mercado Pago, Fatura Nubank
- Banco SQLite com schema via Alembic + 221 transações reais importadas
- Endpoint `POST /api/upload` — extrai sem salvar (preview)
- Endpoint `POST /api/import` — salva confirmados com deduplicação
- Tela `/upload` no frontend com drag-and-drop, preview, checkboxes, edição de categoria
- `frontend/src/lib/api.ts` — camada tipada de comunicação frontend↔backend
- 26 testes passando

**Detalhes:** `docs/FASE-2-BACKEND.md` | Histórico: `docs/PROGRESSO-FASE-2.md`

---

## 🔴 Fase 3 — Integração Frontend + Backend (EM ANDAMENTO)

**Objetivo:** conectar tudo. Frontend consome a API real, dados mockados são removidos.

**Etapas:**
- ✅ **Etapa 3.0 (CONCLUÍDA):** Banco zerado, dados reais importados, mocks arquivados
- 🔴 **Etapa 3.1 (ATUAL):** Dashboard e telas consumindo API real (substituir imports JSON por fetch)
- ⚫ **Etapa 3.2:** Categorização no frontend (motor de regras configurável)
- ⚫ **Etapa 3.3:** Carteira B3 e Proventos com dados reais (aguarda xlsx B3)

**Detalhes:** `docs/FASE-3-INTEGRACAO.md` | Histórico: `docs/PROGRESSO-FASE-3.md`

---

## 🔮 Fases Futuras (depois do MVP)

- **Fase 4** — IA para categorização inteligente (Claude API ou similar)
- **Fase 5** — App mobile (React Native)
- **Fase 6** — Notificações (DAS vencendo, fatura alta, dividendo recebido)
- **Fase 7** — Projeções e metas financeiras
- **Fase 8** — Multi-usuário (virar SaaS, se desejado)

---

## 🚦 Status Atual

- [x] Planilha Excel funcional como referência
- [x] **Fase 1 — ✅ CONCLUÍDA (27/04/2026) — 13/13 itens**
- [x] **Fase 2 — ✅ CONCLUÍDA (29/04/2026) — 5 parsers, 221 transações importadas**
- [ ] **Fase 3 — 🔴 Em andamento (Etapa 3.1 — Dashboard consumindo API real)**
