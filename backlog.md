# 📋 Backlog do Projeto

Arquivo vivo de ideias, features e acompanhamento de progresso.

**Como usar:**
- Adicione ideias novas em **💡 Ideias / Backlog**
- Mova para **🚧 Em Andamento** quando começar
- Mova para **✅ Concluído** quando terminar
- Use **❌ Descartado** se desistir de algo (com motivo)

---

## 🚧 Em Andamento

> Coisas que estão sendo feitas agora.

### Fase 2 — Backend e Parsers

**Dividida em 3 etapas sequenciais. Cada etapa deve ser validada antes de seguir para a próxima.**

---

#### ✅ Etapa 2.1 — Backend + Primeiro Parser (CONCLUÍDA — 28/04/2026)
> Objetivo: API rodando e conseguindo ler pelo menos UM tipo de arquivo corretamente.

- [x] Estrutura do projeto FastAPI criada (`backend/`)
- [x] Ambiente virtual Python configurado (`requirements.txt`)
- [x] Banco SQLite com schema inicial (Alembic migrations)
- [x] Endpoint `POST /api/upload` — aceita PDF ou Excel
- [x] **Parser Nubank PF** (extrato PDF) — implementado com máquina de estados
- [x] Endpoint `GET /api/transactions` — lista transações com filtros
- [x] Categorização por regras (40+ regras cobrindo casos reais do Antonio)
- [x] 28 testes passando — helpers, parser mockado e PDF sintético
- [x] ✅ **Marco validado:** upload PDF → 10 transações extraídas, categorizadas, JSON correto

---

#### ✅ Etapa 2.2 — Demais Parsers (CONCLUÍDA — 29/04/2026)
> Objetivo: todos os tipos de arquivo que o Antonio usa sendo parseados.

- [x] Parser Nubank PJ
- [x] Parser Itaú Uniclass
- [x] Parser Mercado Pago
- [x] Parser Fatura Cartão Nubank
- [ ] Parser B3 — Posição (`.xlsx`) _(sem arquivo disponível ainda)_
- [ ] Parser B3 — Movimentação (`.xlsx`) _(sem arquivo disponível ainda)_
- [ ] Parser B3 — Negociação (`.xlsx`) _(sem arquivo disponível ainda)_
- [x] Detecção automática do tipo de arquivo (identificar qual parser usar)
- [x] Categorização movida para o frontend — backend retorna apenas dados brutos + `is_internal_transfer`
- [x] ✅ **Marco validado:** upload de cada PDF → transações corretas (276 txs no total entre os 5 arquivos)

---

#### ✅ Etapa 2.3 — Tela de Upload + Seleção de Lançamentos (CONCLUÍDA — 29/04/2026)
> Objetivo: o usuário consegue enviar um arquivo pelo navegador e escolher o que importar.

- [x] Tela de Upload no frontend (`/upload`) — drag and drop
- [x] Após upload: preview de todos os lançamentos detectados
- [x] Checkboxes por lançamento (selecionar / desmarcar individualmente)
- [x] "Selecionar todos" / "Desmarcar todos"
- [x] Edição inline da categoria antes de confirmar
- [x] Indicação visual de transferências internas (⚠️ desmarcadas por padrão)
- [x] Botão "Importar selecionados" → salva apenas os marcados no banco
- [x] Endpoint `POST /api/import` — detecta duplicatas, persiste no SQLite
- [x] Arquivo `frontend/src/lib/api.ts` — camada de comunicação tipada com o backend
- [x] Item "Importar" adicionado à Sidebar
- [x] ✅ **Marco de validação:** fluxo completo — upload → preview → selecionar → importar → confirmação

---

## 💡 Ideias / Backlog

> Coisas que quero fazer mas ainda não comecei. Adicionar livremente.

### 🎨 Frontend / UX

- [ ] Tema escuro (dark mode)
- [ ] Filtros avançados nas tabelas (data, valor mínimo/máximo)
- [ ] Botão de exportar para PDF/Excel
- [ ] Comparação ano vs ano (quando tiver dados de 2027)
- [ ] Página inicial com "destaques do mês" (alertas, conquistas)

### 🐍 Backend / Parsers

- [ ] **Seleção de lançamentos no upload (com checkboxes)** — após o sistema processar o PDF/planilha enviado, exibir uma tela de preview com **todos os lançamentos detectados e checkboxes para o usuário marcar quais devem ser importados**. Permite excluir transferências internas, lançamentos duplicados ou irrelevantes antes de salvar no banco. Funcionalidades:
  - Checkbox "Selecionar todos" / "Desmarcar todos"
  - Filtro por tipo (entrada/saída) ou categoria sugerida
  - Edição inline da categoria antes de confirmar
  - Indicação visual de possíveis duplicatas (já existem no banco)
  - Botão "Importar selecionados" só salva os marcados
- [ ] Parser para extrato Itaú PJ (se um dia abrir)
- [ ] Parser para extrato de outros bancos (Bradesco, BB, Inter)
- [ ] Detecção automática de duplicatas mais inteligente
- [ ] Importação em lote (vários PDFs de uma vez)

### 📊 Dashboard / Relatórios

- [ ] Projeção: "Se você manter este ritmo, terá R$ X em 12 meses"
- [ ] Comparativo: gastos deste mês vs média dos últimos 3 meses
- [ ] Alerta visual quando um gasto fixo aumenta muito (ex: COPEL R$ 246 de repente)
- [ ] Calculadora de aposentadoria com base nos investimentos atuais
- [ ] Gráfico de evolução do patrimônio investido (mês a mês)

### 💼 Investimentos

- [ ] Cotações em tempo real (API B3 ou Yahoo Finance)
- [ ] Cálculo de rentabilidade real da carteira (TWR ou IRR)
- [ ] Comparação carteira vs IBOV / IFIX / CDI
- [ ] Calendário de proventos (quando esperar receber)
- [ ] Sugestão de rebalanceamento (se uma classe ficar acima de X%)
- [ ] Histórico de preço médio por ativo
- [ ] Cálculo automático de IR sobre vendas (lucro/prejuízo)

### 🏦 PJ / Impostos

- [ ] Lembrete automático: "DAS vence em X dias"
- [ ] Calculadora de pró-labore ideal (otimização tributária)
- [ ] Histórico de notas fiscais emitidas
- [ ] Controle de comprovantes de despesas dedutíveis
- [ ] Limite de faturamento Simples (alerta ao se aproximar do teto)

### 📱 Mobile

- [ ] App mobile (React Native ou PWA)
- [ ] Notificações push (DAS vencendo, fatura alta)
- [ ] Adicionar gasto rapidamente pela câmera (foto do recibo)

### 🤖 IA (Fase 4+)

- [ ] Categorização inteligente de transações ambíguas
- [ ] Análise de hábitos: "Você gastou 30% mais em delivery este mês"
- [ ] Recomendações personalizadas de investimento
- [ ] Chatbot financeiro: "Quanto gastei com mercado em março?"

### 🔐 Segurança / Infra

- [ ] Backup automático do banco (diário, semanal)
- [ ] Criptografia de dados sensíveis em repouso
- [ ] Multi-fator de autenticação
- [ ] LGPD / política de privacidade (se virar SaaS)

### 🚀 Possíveis evoluções (se virar produto)

- [ ] Multi-usuário (cada um vê só seus dados)
- [ ] Plano gratuito + plano pago
- [ ] Integração direta com Open Finance (sem precisar baixar PDF)
- [ ] Categorização por etiquetas customizáveis
- [ ] Compartilhamento com cônjuge/família

---

## ✅ Concluído

> Conquistas! Adicionar com data quando finalizar.

### Fase 0 — Planejamento
- [x] **Planilha Excel funcional como referência base** _(25/04/2026)_
- [x] **Estrutura PJ definida** (pró-labore + distribuição lucros) _(25/04/2026)_
- [x] **Decisão de stack** (Next.js + Python/FastAPI) _(25/04/2026)_
- [x] **Documentação inicial criada** (CLAUDE.md + roadmap das 3 fases) _(25/04/2026)_
- [x] **Backlog criado** _(25/04/2026)_

### Fase 1 — Frontend ✅ COMPLETA (27/04/2026)
- [x] **Projeto Next.js 14+ scaffoldado e rodando** _(25/04/2026)_
- [x] **TailwindCSS 4 configurado** _(25/04/2026)_
- [x] **Sidebar e Header implementados** _(25/04/2026)_
- [x] **Tela Dashboard Anual completa com gráficos e tabela** _(25/04/2026)_
- [x] **5 arquivos JSON mockados criados** (Jan-Abr/2026) _(25/04/2026)_
- [x] **Identidade visual definida** (dark navy, DM Sans/Mono, animações) _(25/04/2026)_
- [x] **Hook `useFinancialData` com dynamic imports** (pronto para Fase 3) _(27/04/2026)_
- [x] **Tela Visão Mensal `/mes/[mes]` com seções colapsáveis** _(27/04/2026)_
- [x] **Tela Detalhe do Cartão `/cartao/[mes]` com gráfico de pizza** _(27/04/2026)_
- [x] **Tela Carteira B3 `/carteira`** com tabs e top 10 posições _(27/04/2026)_
- [x] **Tela Proventos `/proventos`** com gráfico de barras empilhadas _(27/04/2026)_
- [x] **MonthSelector reutilizável** com chips e setas _(27/04/2026)_
- [x] **Tipos TypeScript** dos datasets (`src/types/financial.ts`) _(27/04/2026)_
- [x] **Responsividade mobile validada** _(27/04/2026)_
- [x] **README do frontend customizado** _(27/04/2026)_
- [x] **Build de produção limpo** (zero erros TS/ESLint) _(27/04/2026)_

### Fase 2 — Backend e Parsers ✅ COMPLETA (29/04/2026)
- [x] **Etapa 2.1 — Backend + Parser Nubank PF** _(28/04/2026)_
- [x] **Etapa 2.2 — 5 parsers funcionando** (Nubank PF/PJ, Itaú, Fatura, Mercado Pago) _(29/04/2026)_
- [x] **Etapa 2.3 — Tela de upload + preview + importação confirmada** _(29/04/2026)_
- [x] **`POST /api/import`** — endpoint de persistência com deduplicação _(29/04/2026)_
- [x] **`frontend/src/lib/api.ts`** — camada tipada de comunicação frontend↔backend _(29/04/2026)_

---

## ❌ Descartado

> Ideias que tive mas decidi não fazer (com motivo).

- _(vazio por enquanto)_

---

## 📅 Timeline / Marcos Importantes

| Data | Marco |
|---|---|
| 25/04/2026 | Início do projeto, planejamento concluído |
| 25/04/2026 | 🎉 Primeira tela funcional: Dashboard Anual (Fase 1 ~38%) |
| 27/04/2026 | 🏆 **MVP da Fase 1 funcionando — todas as 5 telas, 100% concluído** |
| 28/04/2026 | ✅ Etapa 2.1 — Backend + Parser Nubank PF validado |
| 29/04/2026 | ✅ Etapa 2.2 — 5 parsers funcionando (Nubank PF/PJ, Itaú, Fatura, Mercado Pago) |
| 29/04/2026 | ✅ Etapa 2.3 — Upload + preview + importação no frontend |
| 29/04/2026 | 🏆 **Fase 2 completa — fluxo upload → extração → seleção → banco funcionando** |
| __/__/2026 | ✅ Fase 3 — Dashboard consumindo dados reais do banco |

---

## 💭 Notas e Aprendizados

> Espaço livre para anotar coisas que aprendi durante o desenvolvimento, decisões importantes, problemas que resolvi.

- **25/04/2026:** Decidido começar pelo frontend com dados mockados em vez de backend, para ter feedback visual rápido e validar o design antes de complicar com parsers.
- **25/04/2026:** Optou-se por Next.js em vez de Vite — App Router e deploy fácil na Vercel justificam a escolha.
- **25/04/2026:** IA/LLM ficará para Fase 4. MVP usa apenas regras determinísticas para categorização (mais rápido, mais barato, mais previsível).
- **25/04/2026:** Projeto acabou usando TypeScript (`.tsx`) ao invés de JS puro — vantajoso para autocomplete e segurança de tipos, manter assim.
- **25/04/2026:** Tema visual escolhido: dark navy fintech (`#0f1b2d` / `#1c2d45`) + DM Sans/Mono. Ficou com cara de produto de mercado.
- **25/04/2026:** Sidebar com 5 itens criada antecipadamente — 4 levam a 404 enquanto as telas não existem. Ok deixar assim, evidencia o que ainda falta.
- **27/04/2026:** Hook `useFinancialData` implementado com `dynamic imports` em `datasetLoaders`. Para Fase 3, basta trocar os loaders por `fetch('/api/...')` sem mexer em nenhuma tela. Padrão arquitetural validado.
- **27/04/2026:** MonthSelector criado como componente reutilizável (chips + setas) — usado tanto em `/mes` quanto em `/cartao`. Investir em componentes compartilhados desde o início economiza muito tempo.
- **27/04/2026:** Tipos TypeScript dos datasets centralizados em `src/types/financial.ts` — facilita evolução do schema na Fase 2/3.
- **27/04/2026:** Build de produção (`npm run build`) passa limpo, zero erros TS/ESLint. Boa base técnica para evoluir.

---

## 🎯 Reflexão Periódica

Sugestão: a cada 2-4 semanas, responder:

1. **O que foi entregue desde a última revisão?**
2. **O que está travado e por quê?**
3. **Alguma ideia nova merece subir de prioridade?**
4. **Alguma feature deixou de fazer sentido?**

### Última revisão: ___/___/2026
- O que foi entregue:
- O que está travado:
- Próximas prioridades:
