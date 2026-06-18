# Fluxo do Geldmacht — o que está funcionando

> Mapa passo a passo do que o app faz hoje, para consulta rápida e para não retroceder em features já entregues.
> **Atualizado em:** 2026-06-18

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

### Mobile — header e modais _(issue #68)_
- **Breadcrumb/header escondido no mobile:** na tela de instituição (`/home/carteira/{id}`) o `PageBreadcrumb` só aparece no **desktop**; no mobile o espaço vertical fica para o conteúdo (navegação de volta segue pela bottom tab e pelas abas `InstitutionNav`).
- **Padrão global de modal (`FormSheet`):** todos os modais de formulário (conta bancária, cartão, lançamento manual, menu Adicionar, pré-requisito, excluir conta) usam o componente único `components/ui/FormSheet.tsx` — **bottom sheet no mobile** / centralizado no desktop, **altura máxima `90dvh`**, **corpo com scroll interno**, **footer fixo** (quando há) e **safe-area** (`env(safe-area-inset-bottom)`). Com o teclado aberto o campo focado continua acessível (viewport com `interactive-widget=resizes-content` + `viewport-fit=cover` no layout raiz). Botões de ação não ficam escondidos atrás da bottom bar nem da barra do navegador.

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
1. Mostra um **card por instituição** (avatar colorido, nº de contas/cartões). Cada card tem uma **engrenagem** no canto direito → "Configurações da conta" → "Excluir conta" (ver 2.6). O **valor da fatura não aparece no topo do card** — fica apenas na **linha interna do cartão de crédito**, evitando sobreposição com a engrenagem. _(issue #58)_
2. **Estado vazio:** "Cadastrar conta bancária" → modal de conta bancária.
3. **Adicionar conta** (tile tracejado) → modal de conta bancária. Ao salvar, faz **get-or-create** da instituição pelo nome digitado e cria a conta já vinculada (`institution_id`). O **cartão de crédito não é criado aqui** — apenas dentro do resumo da instituição.
4. Clicar num card → abre o **resumo da instituição** (`/home/carteira/{id}`).

### 2.2. Resumo da instituição — `/home/carteira/{id}` ✅ (issue #44)
O slug da rota é o **id** da instituição. A tela mostra três seções:

1. **Conta corrente** — lista contas vinculadas; se vazia, botão "Cadastrar conta corrente" (modal com a instituição já fixada). Com contas → link "Ver conta corrente (n)" para o extrato.
2. **Cartão de crédito** — lista cartões vinculados; se vazio, "Cadastrar cartão de crédito" (modal com a instituição já fixada). Com cartões → link "Ver cartão de crédito (n)" para as faturas.
3. **Investimentos** — 🚧 placeholder "Funcionalidade ainda não disponível".

Ao cadastrar conta/cartão por aqui, o produto já entra vinculado àquela instituição e o resumo é recarregado.

### 2.3. Extrato (conta corrente) — `/home/carteira/{id}/extrato` ✅
1. Abas por conta (quando há mais de uma na instituição).
2. **Adicionar lançamento** → abre o **modal** de lançamento manual (mesmo fluxo da sidebar/bottom bar). _(issue #50: antes apontava para uma rota inexistente e quebrava.)_
3. **Importar extrato** → leva ao upload (`/home/upload?type=bank_statement&bankAccountId={conta}`) para arquivos `.ofx/.qfx`, já com a conta corrente como contexto. _(issue #50)_
4. **Exportar extrato** → baixa CSV (`extrato-{conta}-{ano}.csv`).
5. Lista as transações da conta no período.

### 2.4. Faturas do cartão — `/home/carteira/{id}/cartao/faturas` ✅ (issue #14)
> **IDs:** o `{id}` da rota é o **id da instituição** (slug). A busca de faturas usa o **id do cartão** (`cards[0].id`, vindo do `useInstitution()`), **não** o id da instituição/conta. Fonte: `GET /api/cards/{cardId}/annual-invoices?year=YYYY`.

1. **Visão anual inteligente:** exibe **apenas os meses com fatura real ou previsão** (não mais os 12 meses fixos).
2. **Previsão por parcelas:** as parcelas restantes da fatura real **mais recente** projetam os meses à frente (até `installment_total`), marcados com selo **"Previsto"**. Previsto só aparece **após o último mês real** — nunca soma com fatura real (dedup por mês).
3. **Previsão por assinaturas:** assinaturas recorrentes ativas (entidade `RecurringExpense`) somam seu valor mensal nos meses previstos do ano (do mês seguinte ao último real até dezembro). _(issue #14 — fase 2)_
4. Mês **real** → abre o **detalhe da fatura**. Mês **previsto** não é clicável (tela mensal de previstos fica para depois).
5. **Estados da tela** _(issue #60)_: **carregando** (spinner), **vazio** (sem fatura nem previsão → "Nenhuma fatura ou previsão."), e **erro** (falha na API → "Não foi possível carregar as faturas." com botão **"Tentar novamente"**). A tela nunca quebra em branco.

> **Robustez (issue #60):** o backend agora aplica **CORS inclusive em respostas de erro** — um middleware global converte exceções não tratadas em `500 {"detail": ...}` que ainda passa pelo `CORSMiddleware`. Causa original do 500: tabela `recurring_expenses` ausente no banco (migration `m3n4o5p6q7r8` não aplicada).

### 2.5. Detalhe da fatura — `/home/carteira/{id}/cartao/faturas/{invoiceId}` ✅
Detalhe de uma fatura específica (metadados, ciclo, totais e itens). Os lançamentos são agrupados por categoria em **accordions** (componente reutilizável `ExpandableCard`), incluindo o grupo **"Compras parceladas"**. Cada lançamento tem ações **"Categoria"** (recategorizar) e **"Assinatura"** — esta marca o lançamento como **assinatura recorrente** (`POST /api/cards/{id}/recurring`), gerando previsões nos próximos meses. _(issue #14 — fase 2)_

> **Scroll interno em accordions/listas longas** _(issue #62)_: ao expandir uma categoria com muitos lançamentos, o conteúdo do accordion tem **altura máxima responsiva e scroll interno** (`max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain`) — a **página não cresce indefinidamente** e o cabeçalho/total da categoria continuam visíveis. Padronizado no `ExpandableCard` (props `scrollableContent`, `maxContentHeight`, `contentClassName`), valendo também para os accordions do **extrato** (resumo mensal / gastos previstos). Comportamento idêntico em desktop e mobile (mouse e touch), sem scroll horizontal.

### 2.6. Configurações / excluir conta ✅ (issue #48)
A **engrenagem** fica no card da instituição na lista (`/home/carteira`) e no topo do **resumo** (`/home/carteira/{id}`). Ao abrir: "Configurações da conta" → **Excluir conta**.

1. **Modal de confirmação** avisa que a ação é **irreversível** e que todos os dados vinculados (conta corrente, cartões, faturas, extratos, movimentações e lançamentos) serão removidos.
2. **Checkbox obrigatório** ("Entendo que todos os dados serão perdidos…") — o botão "Excluir conta" fica desabilitado até marcar.
3. Ao confirmar, o backend (`DELETE /api/institutions/{id}`) apaga em transação: instituição + contas + cartões + faturas + transações + lotes de importação vinculados. **Categorias globais são preservadas.**
4. **Depois:** a carteira é atualizada; se a conta excluída era a última, volta ao **estado vazio**. Excluindo **de dentro** do resumo, o usuário é **redirecionado para `/home/carteira`**.

---

## 3. Cartões — `/home/cartao` ✅
Visão geral de todos os cartões: limite/fatura, **Adicionar cartão**, editar e excluir. Cada cartão linka para suas faturas dentro da instituição (`/home/carteira/{institution_id}/cartao/faturas`).

---

## 4. Categorias — `/home/categorias` ✅ (issues #23/#38)
1. Categorias **globais** do usuário (sem escopo/destino — simplificado na #38).
2. Usadas para classificar lançamentos manuais e itens importados.

---

## 5. Adicionar — menu de escolha ✅ (issue #54)
O botão **"Adicionar"** (bottom tab/sidebar) abre um **menu com 3 opções**:
1. **Lançamento manual** → modal de lançamento (Tipo Entrada/Saída, Valor, Conta, Categoria, Descrição; pré-requisito: ao menos uma conta, senão abre modal de pré-requisito).
2. **Importar extrato** → `/home/upload?type=bank_statement` (conta corrente).
3. **Importar fatura** → `/home/upload?type=credit_card` (cartão).

Dentro do extrato, **"Adicionar lançamento"** abre direto o modal manual.

---

## 6. Importação / Upload — `/home/upload` ✅
Dois fluxos **separados** (não se misturam):
1. **Importar extrato** bancário (`?type=bank_statement`, arquivos `.ofx/.qfx`) → vincula a uma **conta corrente**. Pré-selecionada quando vem da conta corrente (`bankAccountId`). Acessível pela conta corrente e pelo menu Adicionar.
2. **Importar fatura** de cartão (`?type=credit_card`, `.pdf/.xlsx`) → vincula a um **cartão** e gera a fatura/`invoice`. Pré-selecionado quando vem do cartão (`cardId`). Acessível pelas faturas do cartão e pelo menu Adicionar.
3. **Revisão de lançamentos:** após o upload, a tela de revisão tem a **lista de lançamentos como destaque principal**. Estrutura enxuta _(issue #57)_:
   - **Topo:** apenas o título **"Revisar lançamentos"** e, abaixo, o **nome do arquivo** em label pequena e discreta. Sem chip de parser, sem contagem e sem datas no topo.
   - **Destino compacto:** um único bloco confirma para onde a importação vai — **"Conta corrente de destino"** (extrato) ou **"Cartão de destino"** (fatura, seletor de cartão). Os metadados da fatura (vencimento, ciclo, total) vêm detectados do arquivo e não são mais editáveis na tela.
   - **Sem cards secundários** (resumo da fatura — Total/Estornos/Maior gasto/Parcelas) e **sem busca por descrição nem chips de filtro** na revisão.
   - A **lista rola internamente** e o **botão final de importar fica sempre visível** num rodapé fixo no fim (no mobile, acima da bottom tab bar — não fica mais escondido). Listas grandes não escondem a ação final.
4. Ao concluir, redireciona para o extrato/fatura correspondente (`/home/carteira/{institution_id}/...`).

> **Refator (#54 → #57):** o `UploadPreview` (antes ~1232 linhas, inline-style) foi decomposto em componentes de responsabilidade única — `ReviewTransactionList` (lista) + `ReviewTransactionRow` (linha/card de um lançamento, reutilizável), `ReviewFooter`, `ImportResultView`, `CreditCardInvoiceForm`, `BankStatementInfo` — ficando como orquestrador enxuto. Na #57 a tela foi simplificada: removidos `ReviewFilters` (chips + busca) e o uso dos cards de resumo na revisão (`InvoiceSummaryCards` segue só na tela de sucesso), os blocos de destino reduzidos ao mínimo, e a lista passou a rolar internamente também no mobile (lista `flex-1` com scroll próprio; rodapé em fluxo acima da bottom tab bar). O `CategoryChoiceSelect` mostra um rótulo estático "Sem categoria" quando não há categorias (sem abrir o seletor).

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
- **Open Finance / Cumbuca MCP** (spike #61): investigado, **sem implementação**. Recomendação: aguardar maturidade para produção; aprovado apenas protótipo local exploratório. Fluxo conceitual futuro: `Conta bancária > Conectar Open Finance > Sincronizar > Deduplicar > Revisar lançamentos > Confirmar importação`. Detalhes em [`docs/spikes/61-cumbuca-of-data-mcp.md`](spikes/61-cumbuca-of-data-mcp.md). ⛔

> Sempre que uma issue entregar uma feature nova ou mudar um fluxo, atualizar este arquivo.
