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

> **Nav enxuta (issue #73):** a **sidebar** e a **bottom tab (mobile)** exibem apenas **Carteira**, **Categorias** e **Adicionar lançamento**. Os itens **Início**, **Proventos** e **Configurações** ficam **ocultos** (rotas continuam existindo; o acesso ao perfil segue no rodapé da sidebar).

> **Entrada do app vai para a Carteira:** como **Início** (`/home`) saiu da navegação (#73), todos os pontos de entrada redirecionam **direto para `/home/carteira`** — raiz `/`, pós-login, pós-registro e usuário logado que acessa `/login`/`/register` (`middleware.ts`, `app/page.tsx`, telas de login/registro). A rota `/home` (dashboard "em desenvolvimento") **continua existindo**, apenas não é mais o destino de entrada.

### Mobile — header e modais _(issue #68)_
- **Breadcrumb/header removido da tela de instituição _(issue #80)_:** a `PageBreadcrumb` foi retirada do fluxo `/home/carteira/{id}` em **desktop e mobile** — a navegação acontece pelas abas `InstitutionNav` (Resumo / Conta corrente / Cartão de crédito) e pela bottom tab. O componente `components/ui/breadcrumb.tsx` segue disponível como primitivo do design system, mas sem uso neste fluxo.
- **Padrão global de modal (`FormSheet`):** todos os modais de formulário (conta bancária, cartão, lançamento manual, menu Adicionar, pré-requisito, excluir conta, recategorização) usam o componente único `components/ui/FormSheet.tsx` — **corpo com scroll interno**, **footer fixo** (quando há) e **safe-area**. Com o teclado aberto o campo focado continua acessível (viewport com `interactive-widget=resizes-content` + `viewport-fit=cover` no layout raiz). Botões de ação não ficam escondidos atrás da bottom bar nem da barra do navegador.
- **Modais abrem de cima para baixo no mobile _(issue #95)_:** o padrão mobile deixou de ser bottom-sheet (`items-end`) e passou a ser **top-anchored** (`items-start`) — o modal abre a partir do topo da área útil, respeitando **safe-area superior e inferior** (overlay com `pt/pb = env(safe-area-inset-top/bottom) + 12px`), com `max-height` baseada em `dvh` descontando as safe-areas e **scroll interno** no conteúdo. No **desktop** segue **centralizado** (`sm:items-center`), inalterado. A **animação** reforça a abertura de cima (`gm-modal-slide-down`: `translateY(-12px) → 0`) no mobile; `gm-modal-slide-in` no desktop. O mesmo padrão foi aplicado ao **`ModalDialog`** (Onboarding/Release notes, agora top-anchored + scroll interno) e os modais **inline** foram migrados para o `FormSheet`: **"Editar lançamento/Tags"** (detalhe da fatura) e **"Excluir cartão"** (`/home/cartao`). **Revisados e não alterados:** popover da engrenagem (`AccountSettingsMenu`, é dropdown ancorado ao gatilho, não modal) e o overlay de **loading** do fluxo de lançamento (apenas spinner). Importar fatura/extrato são **rotas** (`/home/upload`), não modais. A página por trás não rola (overlay `fixed inset-0`); sem scroll horizontal; desktop preservado.

---

## 1. Autenticação ✅

1. `/login` — entrar **apenas com e-mail e senha**. O login com Google foi removido (#67) — front e endpoint `/auth/google` do backend retirados.
2. `/register` — criar conta.
3. Sessão via NextAuth (JWT). Rotas `/home/*` exigem login, protegidas pelo `middleware.ts`.

### Comportamento de sessão (#67)
- **Token válido** → renderiza a aplicação.
- **Token ausente, expirado ou inválido** → o `middleware` redireciona **direto para `/login`** antes de renderizar a área autenticada (sem flash); a sessão local é limpa.
- A expiração da **sessão NextAuth acompanha a expiração do access token do backend**: no `jwt` callback o `exp` do token do backend é lido e aplicado ao `token.exp`. Assim a sessão não "sobrevive" ao token e não há mais o caso de renderizar a tela e só depois quebrar com 401.
- Sem **"Manter logado"**, a sessão é limitada a 1 dia (cap sobre o `exp` do token).

### Expiração do token e usuário de teste (#67)
- **Token:** `ACCESS_TOKEN_EXPIRE_MINUTES` (env). **Dev/teste: 10080 (7 dias)**. **Produção define o seu próprio valor explicitamente** (recomenda-se menor) — não usar 7 dias em produção por padrão.
- **Usuário de teste padrão** (apenas dev/teste, criado por seed no startup quando `SEED_TEST_USER=true`, idempotente, senha com hash, sem privilégios especiais):
  - **E-mail:** `teste@agente.com`
  - **Senha:** `teste@123`
- **A partir da #67, issues que exijam validação autenticada devem usar esse usuário de teste por padrão.** Não habilitar `SEED_TEST_USER` em produção.

---

## 2. Carteira ✅ (foco atual)

A Carteira é organizada por **instituição** (banco/corretora). Desde a issue #44, o vínculo entre instituição e seus produtos usa a **entidade `Institution` (FK `institution_id`)**, não mais a string livre.

> **Conceito-chave:** uma instituição "nasce" no momento em que seu **primeiro produto** (conta corrente **ou** cartão) é criado. Por isso, ao abrir uma instituição, o resumo lista qualquer produto que carregue aquele `institution_id` — inclusive um cartão que tenha sido criado já vinculado a ela.

### 2.1. Lista de instituições — `/home/carteira` ✅
1. Mostra um **card por instituição** (avatar colorido, nº de contas/cartões). Cada card tem uma **engrenagem** no canto direito → "Configurações da conta" → "Excluir conta" (ver 2.6). O **valor da fatura não aparece no topo do card** — fica apenas na **linha interna do cartão de crédito**, evitando sobreposição com a engrenagem. _(issue #58)_
2. **Estado vazio:** "Cadastrar conta bancária" → modal de conta bancária.
3. **Adicionar conta** (tile tracejado) → modal de conta bancária. Ao salvar, faz **get-or-create** da instituição pelo nome digitado e cria a conta já vinculada (`institution_id`). O **cartão de crédito não é criado aqui** — apenas dentro do resumo da instituição.
4. Clicar num card → abre o **resumo da instituição** (`/home/carteira/{id}`).
5. **Carregamento (issue #96):** enquanto contas/cartões/faturas chegam, exibe **skeleton** do grid de instituições (`CarteiraSkeleton`) em vez de spinner, via `use()` + `<Suspense>` (refetch após criar conta usa `startTransition`).

### 2.2. Resumo da instituição — `/home/carteira/{id}` ✅ (issue #44, redesenhado na #90)
O slug da rota é o **id** da instituição. É a **tela inicial** ao abrir uma conta pela carteira e corresponde à aba **`Resumo`** do `InstitutionNav`.

**Redesign #90 — de central de links para resumo financeiro:** os antigos cards de navegação (Conta corrente / Cartão de crédito / Investimentos) foram **removidos**. A tela mostra um topo enxuto com apenas o **período do mês atual por extenso** (ex. `Junho 2026`) ao lado da engrenagem, e **5 indicadores** em estilo dashboard (chip de ícone colorido + valor em cor semântica e números tabulares) escopados **àquela instituição** (suas contas e cartões):

1. **Saldo disponível** — `Conta corrente`. **Adiado nesta versão:** sempre `R$ 0,00` (não há saldo armazenado; `bank_account` não tem coluna de saldo e o `ledger_balance` do OFX não é persistido). Issue futura.
2. **Receitas do mês** — soma dos lançamentos **positivos** das contas da instituição no mês atual, **excluindo transferências internas**. Empty: `Nenhuma entrada neste mês`.
3. **Despesas do mês** — soma absoluta dos lançamentos **negativos** das contas da instituição no mês atual, excluindo transferências internas. Empty: `Nenhuma saída neste mês`.
4. **Parcelamentos ativos** — compras parceladas dos cartões da instituição que ainda têm parcelas futuras (singular/plural). Empty: `Nenhum parcelamento ativo`.
5. **Futuro comprometido** — soma de `valor_parcela × parcelas_restantes` das compras parceladas ativas. Empty: `Nenhum valor futuro comprometido`.

**Agrupamento de parcelas:** sem `installmentGroupId`, usa fallback `(card_id, descrição normalizada, installment_total)` (o parser remove o sufixo `- Parcela X/Y`); por grupo considera a **maior `installment_current`**, ativo quando `current < total`, `restantes = total − current`. Não duplica parcelas da mesma compra.

**Backend:** `GET /api/summary?institution_id={id}` (autenticado) → `summary_service.get_financial_summary`, schema `FinancialSummary`. Sem `institution_id` o cálculo é global (não usado nesta tela). Valores em BRL (`formatCurrency`).

A **engrenagem** (`AccountSettingsMenu`) segue no topo (excluir conta). **Investimentos** saiu desta versão (a issue exclui investimentos). Navegação para extrato/faturas continua pelas abas do `InstitutionNav`. **Sem botões de cadastro nesta tela** — adicionar conta/cartão a uma instituição existente não tem ponto de entrada aqui (a criação inicial acontece em `/home/carteira`).

> **Navegação por abas (issue #80):** o `InstitutionNav` exibe as abas **`Resumo` → `Conta corrente` → `Cartão de crédito`**. `Resumo` é **sempre exibida** (mesmo em conta sem vínculos) e aponta para `/home/carteira/{id}`; `Conta corrente` aparece quando há contas (rota `…/extrato`) e `Cartão de crédito` quando há cartões (rota `…/cartao/faturas`). A aba ativa é resolvida pela rota atual. A **engrenagem** de configurações continua no topo do Resumo.

> **Scroll interno mantendo as abas fixas (issue #94):** o `[slug]/layout` virou um **shell que não rola** (`<main class="institution-shell">` com `overflow:hidden` e `padding:0`, via regra scoped em `globals.css` que sobrepõe o scroll padrão do `<main>`). Dentro dele a **`InstitutionNav` fica fixa** (`shrink-0`) e há um **container interno rolável** (`flex-1 min-h-0 overflow-y-auto overscroll-contain`) que leva o `padding-bottom` da bottom bar (`calc(56px + safe-area + 12px)` no mobile). Assim a **página inteira não rola** — só a lista interna — e as **abas/headers de navegação permanecem visíveis** em mobile e desktop (padrão único, igual ao scroll interno dos accordions de categoria). Vale para **Resumo, Conta corrente, Cartão (faturas/detalhe/prevista)**. O último card fica acessível acima da bottom bar; sem scroll horizontal. Telas fora desse layout (lista de carteira, categorias, importação, cartão global) seguem com **scroll de página intencional** (não têm abas fixas) e não foram alteradas.

> **Indicador deslizante das abas (issue #96):** o `InstitutionNav` ganhou um **pill animado** que desliza para a aba ativa. É um indicador absoluto atrás das abas cuja posição/largura é **medida via refs** (`getBoundingClientRect` da aba ativa vs. container) e animada por **CSS** (`transform`/`width`, `cubic-bezier(0.22,1,0.36,1)`, 240ms) — **sem dependência nova** (não usa framer-motion nem Radix Tabs; as abas continuam sendo `Link` por rota). A animação só liga após a 1ª medição (sem slide no mount); recalcula em resize e quando muda o nº de abas.

> **Carregamento por skeleton (issue #96):** as abas são `Link` do Next e o `InstitutionProvider` (no `layout`) não desmonta ao alternar entre elas — **a aba ativa muda imediatamente** e a barra de abas não some. Enquanto os **dados** de uma tela chegam, exibe-se um **skeleton** com o formato final do conteúdo (não mais o spinner global), via **`use()` + `<Suspense>`** (React 19): a página cria a promessa do fetch e um filho a consome com `use()`, suspendendo de verdade até resolver. O skeleton base é `ui/skeleton.tsx` (padrão ShadCN — `animate-pulse rounded-md` sobre `--surface-3`, tema escuro, sem layout shift). Componentes de skeleton específicos em `components/skeletons/`: **`SummarySkeleton`** (período + 5 cards do resumo), **`InvoiceListSkeleton`** (grade de faturas) e **`InvoiceDetailSkeleton`** (cabeçalho + accordions). **Cobertura nesta entrega:** Resumo, listagem de faturas e detalhe da fatura. **Refetch pós-edição** (modal da fatura) usa `startTransition`, então mantém o conteúdo atual sem piscar o skeleton. O **bootstrap da instituição** (carga de contas/cartões no `layout.tsx` ao entrar na carteira) também usa **skeleton** (`InstitutionNavSkeleton` + `SummarySkeleton`), encadeando direto no skeleton da aba Resumo. **Spinner mantido** apenas em ações pontuais/bloqueantes (não navegação): botão **Salvar** do modal de edição, extrato/conta corrente e telas fora do escopo desta issue. O `loading.tsx` de rota existe apenas no **detalhe** (`…/faturas/{invoiceId}`), segmento isolado, para a transição de rota; demais telas usam só o Suspense in-page.

### 2.3. Extrato (conta corrente) — Extrato Inteligente `/home/carteira/{id}/extrato` ✅ (issue #101)
**Visão mensal (mês atual)** que diferencia **movimentação bancária** de **impacto financeiro real**: transferências internas e pagamentos de fatura **não inflam** receitas/despesas.

1. **Header:** "Conta corrente" + **navegação mensal por setas** `‹ Junho 2026 ›` (issue #107). Abas por conta quando há mais de uma. **Sem botões de ação principais** nesta tela (Exportar / Importar extrato / Adicionar lançamento foram removidos — a importação e o lançamento manual seguem pelos seus pontos de entrada próprios: menu Adicionar, sidebar/bottom bar, cartão). Exceção: link **"Limpar lançamentos do mês"** (issue #103, ver nota abaixo), exibido só quando o mês tem movimentações.
2. **Cards do mês:** **Saldo disponível** (`—`, **adiado nesta versão** — `BankAccount` não tem saldo armazenado, igual ao #90), **Entradas** (receitas), **Saídas reais** (despesas), **Transferências** (entre contas do usuário).
3. **Filtros** (`SegmentedControl`): **Todos / Receitas / Despesas / Transferências / Faturas**.
4. **Lista agrupada por data** (`Hoje` / `Ontem` / data), com classificação visual: receita **verde (+)**, despesa **vermelho (−)**, transferência interna e pagamento de fatura em **neutro** (fatura com tag **"Fatura"**).
5. **Classificação (`movement_type`)** vem do **back-end** — serviço `bank_movement.classify_movement` exposto em `TransactionOut.movement_type` (`income` | `expense` | `internal_transfer` | `credit_card_payment`). Regra: `is_internal_transfer` → transferência; `is_payment`/`transaction_type='payment'` **ou** descrição casando heurística de pagamento de fatura (e `amount<0`) → pagamento de fatura; senão sinal do valor → receita/despesa. O front tem fallback equivalente (`lib/carteira/movement.ts`) para dados sem o campo.
6. **Cálculos do mês:** Entradas = soma das **receitas**; Saídas reais = soma absoluta das **despesas**; Transferências = soma absoluta das **transferências internas**. Pagamento de fatura **aparece no extrato** mas **não** entra em saídas reais (o gasto real está no fluxo do cartão).
7. **Empty states** por filtro e para o mês sem movimentações. Sem scroll horizontal; estrutura preparada para evolução (despesas fixas/recorrências) — fora desta versão.
8. **Carregamento por skeleton (padrão #96):** o conteúdo dependente de dados (cards + filtros + lista) usa **`use()` + `<Suspense>`** com fallback **`ExtratoSkeleton`**; o header e as abas de conta ficam **fora** do Suspense (permanecem visíveis). Trocar de conta remonta o conteúdo (`key={accountId}`) e mostra o skeleton novamente; erro tem retry via `startTransition`. Sem mais `LoadingSpinner` nesta tela.

> **Navegação mensal por setas (issue #107):** o header tem **setas `‹ ›`** para navegar entre meses. **Passado livre, presente permitido, futuro bloqueado** — a seta de **próximo mês fica desabilitada no mês atual** (visual `opacity-40` + `cursor-not-allowed`) e não há acesso a meses futuros (conta corrente só mostra movimentações realizadas; sem recorrência/previsto, não há mês futuro útil). O mês selecionado é refletido na URL via **`?month=YYYY-MM`** (`router.replace`). Sem `month` → **mês atual**; `month` inválido (`abc`, `2026-99`, `2026`, `2026-6`) ou **futuro** → normaliza para o mês atual (reescreve a URL). Ao trocar de mês, **cards, lista, contagem e empty state recalculam** pelo período — o filtro por mês é **client-side** (o `loadExtrato` já carrega as transações da conta; trocar de mês **não refaz fetch**, é instantâneo e não remonta o Suspense). Empty por mês: "Nenhuma movimentação neste mês." + "Importe ou cadastre movimentações para visualizar este período." Responsivo, sem scroll horizontal.

> **Limitações conhecidas (v1, issues #101/#107):** **Transferências internas** dependem de `is_internal_transfer`, que o parser OFX ainda não detecta (sempre `false`) e não há UI para marcar — o indicador vem populado conforme os dados existirem. Detecção automática de transferência/recorrência e o **saldo real** ficam para issues futuras.

> **Conflito entre manual e importado (issue #103):** o back-end não persiste um "estado do mês" — ele é **derivado em tempo real** por conta+mês a partir de `Transaction.source` (`GET /api/bank-accounts/{id}/month-status?month=YYYY-MM`, `has_manual` | `has_imported` | `manual_after_import` | `can_import_statement` | `needs_impact_confirmation`).
> - **Manual antes do extrato:** se o mês já tem lançamento manual (`source=manual`), a **importação de extrato é bloqueada** — no back-end (`POST /api/import` retorna `409` listando os meses bloqueados) e no front (revisão de importação: botão desabilitado com o motivo, `ReviewFooter`/`UploadPreview`).
> - **Extrato antes do manual:** com o mês já importado, o modal de lançamento manual (`LancamentoModal`) pergunta **"Afeta o saldo e o resumo do mês?"** (Sim/Não, `SegmentedControl`) antes de salvar. A escolha vira o campo **`affects_summary`** (bool, default `true`) em `Transaction` — `summary_service.get_financial_summary` só soma entradas/saídas de linhas com `affects_summary=true`.
> - **Manual pós-importação bloqueia nova importação** do mesmo mês, independente da escolha de impacto (a regra de bloqueio olha só a existência de `source=manual`, não o valor de `affects_summary`).
> - **Limpar lançamentos do mês:** link discreto na Conta corrente (só aparece com movimentações no mês) abre modal de confirmação (checkbox obrigatório, padrão igual ao de excluir conta) e chama `DELETE /api/bank-accounts/{id}/transactions?month=YYYY-MM` — **hard delete** de todos os lançamentos (manuais e importados) daquele mês/conta. Os lotes de importação (`ImportBatch`) daquele período **não são apagados** (ficam como histórico órfão, fora do escopo desta issue); depois de limpar, o mês volta ao estado vazio e a importação é liberada.
> - **Terminologia:** conferido nesta issue — o fluxo de conta corrente já usava **"extrato"** consistentemente desde a #89; **"fatura"** só aparece onde é o termo correto (pagamento de fatura de cartão, fluxo de cartão). Nenhum texto precisou mudar.

> **Origem, status e conciliação (issue #108):** `Transaction` ganhou um campo **`status`** (`pending | confirmed | reconciled | ignored_duplicate`) e um campo de vínculo **`reconciled_with_transaction_id`** (auto-referência, usado quando uma movimentação manual é conciliada com a equivalente importada). **Toda movimentação existente e nova nasce com `status="confirmed"`** — preserva exatamente os cálculos atuais; `pending`/`reconciled` ficam modelados para um fluxo de revisão futuro (fora do escopo desta issue). O campo **`source`** já existente (`pdf_invoice_import | ofx_invoice_import | bank_statement_import | manual`) cobre a origem — passa a aceitar também `system` para uso futuro; nenhum dado existente foi migrado para um novo enum. O **resumo financeiro** (`summary_service.get_financial_summary`) já ignora movimentações com `status="ignored_duplicate"` no cálculo de entradas/saídas — hoje nada cria esse status (sem algoritmo de matching automático nesta issue), é só a base preparada. O **lote de importação** já existia (`import_batch_id`/`ImportBatch`, issue #54) e cobre a rastreabilidade por lote exigida aqui. Sem mudança visual na tela de Conta corrente — `status`/`reconciled_with_transaction_id` chegaram ao tipo `Transaction` do front-end, mas a tela ainda não exibe badges para esses campos.

### 2.4. Faturas do cartão — `/home/carteira/{id}/cartao/faturas` ✅ (issue #14)
> **IDs:** o `{id}` da rota é o **id da instituição** (slug). A busca de faturas usa o **id do cartão** (`cards[0].id`, vindo do `useInstitution()`), **não** o id da instituição/conta. Fonte: `GET /api/cards/{cardId}/annual-invoices?year=YYYY`.

1. **Visão anual inteligente:** exibe **apenas os meses com fatura real ou previsão** (não mais os 12 meses fixos).
2. **Previsão por parcelas:** as parcelas restantes da fatura real **mais recente** projetam os meses à frente (até `installment_total`), marcados com selo **"Prevista"**. Previsto só aparece **após o último mês real** — nunca soma com fatura real (dedup por mês).
3. **Previsão por assinaturas:** assinaturas recorrentes ativas (entidade `RecurringExpense`) somam seu valor mensal nos meses previstos do ano (do mês seguinte ao último real até dezembro). _(issue #14 — fase 2)_
4. Mês **real** → abre o **detalhe da fatura**. Mês **previsto** → abre a **fatura prevista** (ver 2.5.1).

> **Regra de recálculo das previsões (issue #82):** a base das previsões é **sempre a fatura real mais recente** do cartão (`latest_month = max(due_month)` em `services/invoice_projection.py`). Ao importar uma fatura mais atual, `latest_month` avança e os meses seguintes são **recalculados automaticamente** a partir dela — a previsão nunca fica presa numa fatura antiga. Meses que já têm fatura real são **deduplicados** (`if month in real_by_month: continue`), então previsto e real **não se somam** no mesmo mês. Parcelas e recorrentes ativas continuam sendo consideradas.

> **Estado visual das previstas (issue #82):** na listagem, faturas previstas usam estilo **neutral/discreto** (borda tracejada, valores em `text-tertiary`) com label **"Prevista"**, mas seguem **clicáveis** (`cursor-pointer`). Faturas reais mantêm o visual normal.
5. **Estados da tela** _(issue #60, carregando atualizado na #96)_: **carregando** (**skeleton** da grade de faturas — ver nota #96), **vazio** (sem fatura nem previsão → "Nenhuma fatura ou previsão."), e **erro** (falha na API → "Não foi possível carregar as faturas." com botão **"Tentar novamente"**). A tela nunca quebra em branco.

> **Robustez (issue #60):** o backend agora aplica **CORS inclusive em respostas de erro** — um middleware global converte exceções não tratadas em `500 {"detail": ...}` que ainda passa pelo `CORSMiddleware`. Causa original do 500: tabela `recurring_expenses` ausente no banco (migration `m3n4o5p6q7r8` não aplicada).

### 2.5. Detalhe da fatura — `/home/carteira/{id}/cartao/faturas/{invoiceId}` ✅
Detalhe de uma fatura específica (metadados, ciclo, totais e itens). Os lançamentos são agrupados por categoria em **accordions** (componente reutilizável `ExpandableCard`), incluindo o grupo **"Compras parceladas"**. _(issue #14 — fase 2)_

> **Editar lançamento na fatura** _(issue #77)_: os links **"Categoria"** e **"Assinatura"** abaixo de cada lançamento foram **removidos**. Agora o **clique direto no lançamento** (`cursor-pointer`) abre o modal **"Editar lançamento"**, que permite **editar a descrição/título** e **alterar a categoria** (badges `CategoryBadges`). Ao salvar (`PATCH /api/transactions/{id}` com `description` + `category_id`), a alteração persiste no back-end e a fatura é recarregada — **descrição, totais e agrupamentos por categoria atualizam**. Só **despesas não-sistêmicas** entram no agrupamento por categoria (estornos/créditos e parcelados não); o grupo "Compras parceladas" não é editável.

> **Scroll interno em accordions/listas longas** _(issue #62)_: ao expandir uma categoria com muitos lançamentos, o conteúdo do accordion tem **altura máxima responsiva e scroll interno** (`max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain`) — a **página não cresce indefinidamente** e o cabeçalho/total da categoria continuam visíveis. Padronizado no `ExpandableCard` (props `scrollableContent`, `maxContentHeight`, `contentClassName`), valendo também para os accordions do **extrato** (resumo mensal / gastos previstos). Comportamento idêntico em desktop e mobile (mouse e touch), sem scroll horizontal.

> **Ajustes da fatura mensal _(issue #86)_:**
> - **Título da categoria sem truncar (mobile):** os accordions desta tela usam a nova prop `titleWrap` do `ExpandableCard` — o título **quebra linha** (`break-words`) em vez de `truncate`, então **"Compras parceladas"** (e categorias de nome longo) aparecem **completos**, sem corte e sem scroll horizontal. A prop é **opcional** (default mantém `truncate`), então o extrato e demais usos do componente **não mudam**.
> - **Destaque de última parcela (verde):** no grupo "Compras parceladas", quando `installment_current === installment_total` o lançamento recebe **destaque positivo em verde** — fundo sutil (`rgba(48,209,88,0.06)`), a linha "Parcela X de Y" em `var(--green-400)` e um badge **"Última parcela"** —, sinalizando que aquela compra parcelada **termina nessa fatura**. Parcelas intermediárias não recebem destaque. Mesmo destaque aplicado na **fatura prevista** (2.5.1) quando o item de parcela é o último — sem alterar a regra de projeção.
> - **Resumo no topo (Total da fatura + Entradas):** no espaço superior direito (onde havia o botão "Importar fatura", removido na #80) a tela exibe **Total da fatura** (hierarquia maior, `summary.total_invoice` = soma dos gastos da fatura atual) e, abaixo e secundário, **Entradas** (`summary.total_other_credits`, em verde). **Regra de Entradas:** considera apenas **créditos/estornos/devoluções da fatura atual** e **exclui pagamento de fatura anterior / pagamento da própria fatura**. A exclusão é **estrutural**, baseada no flag `is_payment` (o parser marca "Pagamento ... em DD/MM" como `is_payment=true`), não em texto frágil — `total_other_credits` no `summary_service` já soma só os créditos com `is_payment=false`. **Sem mudança no back-end** (a API de detalhe da fatura já retornava esses totais no `summary`).

> **Tags em lançamentos _(issue #88)_:** o modal **"Editar lançamento"** ganhou uma seção **Tags** — marcações auxiliares, **diferentes de categoria**. No modal o usuário **cria** uma tag nova (campo + "Adicionar"/Enter), **reutiliza** tags já criadas (chips clicáveis abaixo do campo) e **remove** tags aplicadas (chip com `x`). Ao salvar, além do `PATCH` de descrição/categoria, é feito `PUT /api/transactions/{id}/tags` com a lista de nomes (substitui o conjunto). As tags aplicadas aparecem como **chips discretos** na linha do lançamento na listagem da fatura.
> - **Tag ≠ categoria:** categoria continua sendo a classificação principal (maior hierarquia visual); tag é só marcação. **Tags não impactam** totais da fatura, totais por categoria, faturas previstas, recorrentes nem parceladas.
> - **Reuso e dedup:** tags pertencem ao usuário (`Tag`: `user_id`, `name`, `normalized_name`, único por `user_id + normalized_name`). O nome é **normalizado** (trim, espaços duplicados colapsados, case-insensitive) antes de criar — `"Casa"`, `" casa "`, `"CASA"` viram a mesma tag; o nome exibido preserva o texto digitado. Relação N:N via `transaction_tags`. Endpoints: `GET /api/tags` (listar) e `PUT /api/transactions/{id}/tags` (definir conjunto). A associação cai junto com o lançamento (FK `ON DELETE CASCADE`); a tag em si permanece para reuso mesmo sem lançamentos.

### 2.5.1. Fatura prevista — `/home/carteira/{id}/cartao/faturas/prevista/{anoMes}` ✅ (issue #82)
Ao clicar num mês **previsto** da listagem, abre uma tela **read-only** que mostra **a composição da previsão** daquele mês — sem se confundir com fatura real importada.

1. **Fonte:** `GET /api/cards/{cardId}/predicted-invoices/{anoMes}` retorna os itens previstos + **total previsto**. Retorna **404** se o mês não for previsto (já é real, ou anterior/igual ao último mês real, ou sem itens).
2. **Composição por origem:** os itens são agrupados em **Compras parceladas** (parcelas restantes da fatura real mais recente, com selo `Parcela X/Y`) e **Recorrentes** (assinaturas ativas, selo `Recorrente`), cada um com valor e categoria quando disponível. Reaproveita o `ExpandableCard`.
3. **Clareza de previsão:** banner indicando que é **projeção baseada na fatura real mais recente** e que os itens **ainda não foram importados**; label **"Prevista"** no título. Sem ações de edição (diferente da fatura real).
4. **Navegação:** link **"Faturas"** volta para a listagem. Responsivo em desktop/mobile, sem scroll horizontal.

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

## 4. Categorias — `/home/categorias` ✅ (issues #23/#38/#71)
1. Categorias **globais** do usuário. Novas categorias são criadas com `scope="global"` no backend; a listagem (`GET /api/categories`) **ignora `scope`** e retorna todas — então valem tanto para extrato quanto para fatura. _(issue #71)_
2. Usadas para classificar lançamentos manuais e itens importados (inclusive na **revisão de importação**, ver seção 6).
3. **UI (issue #71):** o `SummaryStrip` fica fixo no topo e a **lista de categorias rola internamente** (a página não rola inteira). Abaixo da lista há uma **ação tracejada "Adicionar categoria"** (padrão do tile "Adicionar conta" da carteira), que substitui o antigo botão "Nova categoria". Sem categorias → estado vazio com a mesma ação tracejada.

> **Categorias sugeridas pelo sistema — `Recorrentes` (issue #79):** a tela exibe um bloco **"Sugestões do sistema"** no topo da lista quando há sugestões não usadas. A 1ª sugestão é **`Recorrentes`** (assinaturas, aluguel, mensalidades, cobranças mensais). Em **"Usar categoria"** (`POST /api/categories/suggestions/recorrentes`, **idempotente**), ela vira **categoria global** do usuário com `system_key="recorrentes"` (campo novo em `Category` que identifica a categoria de forma estável, não por nome) e passa a aparecer normalmente na categorização (fatura/revisão). Não duplica se já existir; some das sugestões após ativada. Fonte das sugestões: `GET /api/categories/suggestions`.
>
> **Lançamento de fatura como `Recorrentes` → recorrência de 12 meses:** ao categorizar um lançamento da fatura como `Recorrentes` (no modal de edição ou na importação), o backend cria/atualiza uma **`RecurringExpense` vinculada ao lançamento de origem** (`source_transaction_id`), com `start_month` = mês da fatura e `end_month` = **+12 meses**, descrição/valor do lançamento. **Descategorizar remove** a recorrência (`sync_recurrence_for_transaction` em `services/recurrence_service.py`, chamado no `PATCH /transactions/{id}` e na importação). Lançamentos **sistêmicos** (parcelados/pagamento) não geram recorrência.
>
> **Impacto nas faturas futuras:** a projeção (`invoice_projection.py`) passa a respeitar `end_month` (recorrências sem `end_month` — ex.: as manuais antigas — seguem abertas). Faturas previstas somam **parceladas + recorrentes**; a **dedup com a fatura real** por mês já existente continua valendo (recorrente não soma no mês que já tem fatura real). Primeira versão **apenas fatura/cartão de crédito**.

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
2. **Importar fatura** de cartão (`?type=credit_card`, **`.ofx` preferencial**, ou `.pdf`) → vincula a um **cartão** e gera a fatura/`invoice`. Pré-selecionado quando vem do cartão (`cardId`). Acessível pelas faturas do cartão e pelo menu Adicionar. **Excel não é aceito na fatura.**
3. **Revisão de lançamentos:** após o upload, a tela de revisão tem a **lista de lançamentos como destaque principal**. Estrutura enxuta _(issue #57)_:
   - **Topo:** apenas o título **"Revisar lançamentos"** e, abaixo, o **nome do arquivo** em label pequena e discreta. Sem chip de parser, sem contagem e sem datas no topo.
   - **Destino compacto:** um único bloco confirma para onde a importação vai — **"Conta corrente de destino"** (extrato) ou **"Cartão de destino"** (fatura, seletor de cartão). Os metadados da fatura (vencimento, ciclo, total) vêm detectados do arquivo e não são mais editáveis na tela.
   - **Sem cards secundários** (resumo da fatura — Total/Estornos/Maior gasto/Parcelas) e **sem busca por descrição nem chips de filtro** na revisão.
   - A **lista rola internamente** e o **botão final de importar fica sempre visível** num rodapé fixo no fim (no mobile, acima da bottom tab bar — não fica mais escondido). Listas grandes não escondem a ação final.
   - **Categorizar e renomear** _(issue #71)_: cada lançamento permite **escolher uma categoria** (categorias **globais** do usuário) e **renomear o título** (edição inline; o nome editado é enviado na importação).
   - **Categorização rápida por badges** _(issue #73)_: a categoria é escolhida com **chips clicáveis** (`CategoryBadges`), substituindo o seletor dropdown. No **desktop**, a coluna **Parcela/Tipo foi fundida com Categoria** numa única coluna — lançamentos **sistêmicos** (parcelados/pagamentos) mostram ali o selo bloqueado (`Parcela X/Y · Bloqueado`); os demais mostram os chips de categoria. O conteúdo da revisão tem **largura máxima** (`max-w-[1120px]`, centralizado) para os itens ficarem bem divididos em monitores grandes. No **mobile**, os chips ficam no card. Mostra "Sem categoria" + categorias (todas quando poucas; senão as principais + **"Mais categorias"**, que abre um **bottom sheet `FormSheet` com busca**). A selecionada fica destacada, com `cursor-pointer`, sem scroll horizontal.
   - **Mobile** _(issue #71)_: cards de lançamento **cabem na largura da tela** (sem scroll lateral); o **contador de selecionados** fica numa linha **acima da lista** (saiu do rodapé) e o rodapé mostra só **Cancelar/Importar**, sempre visíveis e com safe-area.
4. **Redirect direto pós-importação** _(issue #77)_: ao confirmar a importação, o usuário vai **direto** para o destino correspondente — **fatura importada** (`/home/carteira/{institution_id}/cartao/faturas/{invoice_id}`) no fluxo de cartão ou **carteira** (`/home/carteira`) no fluxo de extrato. A tela intermediária antiga **"Importação concluída!"** (`ImportResultView` + `InvoiceSummaryCards`) foi **removida** do código, eliminando o **flash visual** que aparecia antes da navegação.

> **Segmentação e reimportação de fatura (issue #89):**
> - **Textos segmentados:** a tela de upload deixou de mostrar o título genérico **"Importar extrato"** no fluxo de fatura. Agora o título é **"Importar extrato bancário"** (`?type=bank_statement`) ou **"Importar fatura"** (`?type=credit_card`), com subtítulos coerentes — sem misturar texto de extrato com fatura. Cada fluxo valida o contexto: **fatura exige cartão** (seleção no preview), **extrato exige conta corrente** (seletor obrigatório).
> - **Aviso de fatura fechada:** no fluxo de fatura, um aviso curto orienta a **importar preferencialmente após o fechamento** — importar uma fatura aberta traz lançamentos parciais e pode exigir reimportação. O aviso **não bloqueia** a importação de fatura aberta.
> - **Estratégia de reimportação (merge automático):** reimportar a mesma fatura **não duplica**. A fatura é reconhecida por **`card_id` + `due_month`** (`_get_or_create_invoice` reusa a existente). Cada lançamento é deduplicado por **`(date, amount, raw_description, account_id)`**: duplicatas são **re-vinculadas** à fatura (sem recriar) e os **novos** lançamentos (que apareceram após o fechamento) são **adicionados**. **Edições do usuário são preservadas:** descrição renomeada (dedup casa por `raw_description`), categoria (a importação envia `category_id=None`, então não sobrescreve) e **tags** (nunca tocadas). Lançamentos que **somem** numa nova importação são **mantidos** (não há deleção automática). Sem perguntar ao usuário — automático e documentado. Totais recalculados a partir dos lançamentos. _(coberto por `tests/test_invoice_reimport.py` no `geldmacht-api`.)_
> - **Lançamento manual bloqueado na fatura (estrutural):** não há caminho para criar compra manual dentro de uma fatura. O `LancamentoModal` só tem destino **Conta** (conta bancária); a tela de detalhe da fatura **não tem** botão "Adicionar lançamento"; e o back-end força `card_id=None`/`invoice_id=None` em `create_manual_transaction` (lançamento manual é sempre de conta bancária). Edição de lançamento **importado** (renomear/recategorizar/tags) continua permitida.

> **OFX como formato padrão/prioritário — extrato e fatura (issue #104):**
> - **Prioridade por extensão:** arquivo `.ofx`/`.qfx` usa **sempre o parser OFX** (`parse_bank_statement_ofx`), nunca cai no `detect_parser` de PDF/Excel. A regra de prioridade é `.ofx → parser OFX` antes de qualquer fallback. PDF/Excel seguem suportados (fora do escopo remover).
> - **Parser único reaproveitado:** o mesmo parser OFX do extrato passou a alimentar a **fatura**. Ele lê `BANKTRANLIST/STMTTRN` tanto de extrato (`STMTRS`) quanto de cartão (`CCSTMTRS`), independente do banco. Saída interna padronizada (`ParsedTransaction`): `date`, `description`, `amount` (compra negativa, crédito positivo — mesma convenção do PDF da fatura), `source_reference` (FITID), `transaction_type`.
> - **Destino valida o contexto:** **extrato OFX exige conta corrente** (`bank_account_id`, `import_kind=bank_statement`, `parser_used=bank_statement_ofx`); **fatura OFX exige cartão** (`card_id`, `import_kind=credit_card_invoice`, `parser_used=credit_card_ofx`). Sem cartão, a importação de fatura é recusada (`400`). Em ambos a **revisão é obrigatória** antes de persistir.
> - **Bloqueio por incompatibilidade de tipo (antes da revisão):** o `/upload` detecta se o OFX é de **conta** (`BANKMSGSRSV1/STMTRS/BANKACCTFROM`) ou de **cartão** (`CREDITCARDMSGSRSV1/CCSTMTRS/CCACCTFROM`) via `detect_ofx_kind`. Se o arquivo não casar com o fluxo escolhido, retorna `422` com mensagem clara **sem ir para a tela de revisão**: extrato no fluxo de fatura → "use Importar extrato"; fatura no fluxo de extrato → "use Importar fatura". OFX ambíguo/sem marcadores **não bloqueia** (segue o destino escolhido).
> - **OFX vs PDF na fatura:** **OFX é o formato preferencial** e pode ser importado **a qualquer momento**. **PDF** é recomendado **somente com a fatura fechada** (fatura aberta traz lançamentos parciais → reimportação por merge, sem duplicar). O aviso na tela de upload deixa isso explícito.
> - **Roteamento:** no `/upload`, `import_kind=credit_card_invoice` + arquivo OFX usa o parser OFX e marca `account=credit_card_ofx`; o `/import` reconhece esse caso (`is_card_invoice`) e cria/atualiza a `Invoice` por `card_id + due_month` (mês detectado do período do OFX, com fallback pelo mês mais frequente das transações). Origem rastreável: `source=ofx_invoice_import` (extrato OFX usa o batch/`source=bank_statement_import`).
> - **Deduplicação:** extrato usa **FITID** (`source_reference`) com fallback por fingerprint determinístico; fatura usa o fallback por **`(date, amount, raw_description, account_id)`** — reaproveita o merge de reimportação já existente (#89), sem duplicar.
> - **Limitação conhecida (v1):** o parser OFX não marca `is_payment`/parcelas. Numa fatura OFX, um **"Pagamento recebido"** vem como crédito (positivo) e pode contar como **Entrada** na fatura; o usuário revisa e pode desmarcar antes de importar. Detecção de pagamento/parcela no OFX fica para issue futura. _(coberto por `tests/test_ofx_credit_card_invoice.py` no `geldmacht-api`.)_

> **Refator (#54 → #57):** o `UploadPreview` (antes ~1232 linhas, inline-style) foi decomposto em componentes de responsabilidade única — `ReviewTransactionList` (lista) + `ReviewTransactionRow` (linha/card de um lançamento, reutilizável), `ReviewFooter`, `CreditCardInvoiceForm`, `BankStatementInfo` — ficando como orquestrador enxuto. Na #57 a tela foi simplificada: removidos `ReviewFilters` (chips + busca) e o uso dos cards de resumo na revisão, os blocos de destino reduzidos ao mínimo, e a lista passou a rolar internamente também no mobile (lista `flex-1` com scroll próprio; rodapé em fluxo acima da bottom tab bar).

> **Parser determinístico hoje (#84):** a leitura de arquivos é feita por **parsers específicos por banco** (`geldmacht-api/app/parsers/`: Nubank PF/PJ, Itaú, Mercado Pago, Fatura Nubank + OFX genérico) atrás de `detect_parser`. Formatos suportados: **PDF** (`pdfplumber`), **Excel** (`openpyxl`) e **OFX** (parser genérico, prioritário para `.ofx` — ver nota #104). Não há CSV/TXT/imagem/PDF escaneado nem IA.

> **Proposta investigativa — Importação universal (spike #84):** spike avaliou universalizar a leitura de faturas/extratos. **Recomendação: OFX como padrão do sistema — para extrato (já funciona) e fatura (estender, issue própria)**; **CSV/Excel via parser universal determinístico** (heurística de colunas); e **IA apenas como fallback para PDF de banco desconhecido / imagem / escaneado**, atrás de feature flag em dev, com **validação rígida (Pydantic), reconciliação total×soma, revisão humana, dedup, API key só no back-end (env), consentimento e ZDR/sem-treino**. **Sem implementação de IA** nesta fase. Análise completa (custo/latência/segurança/LGPD, comparativo Claude × OpenAI) em [`docs/spikes/84-ia-parser-universal.md`](spikes/84-ia-parser-universal.md).

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
`auth` · `upload` · `bank-accounts` · `institutions` · `import` (transactions) · `transactions` · `cards` · `categories` · `dashboard` · `summary` (`GET /api/summary?institution_id={id}` — resumo financeiro do mês da instituição, §2.2) · `release-notes` · `onboarding`.

Modelo de dados central da Carteira: `Institution` 1—N `BankAccount` / `CreditCard` (via `institution_id`); `Transaction` ligada a conta ou cartão; `Invoice` para faturas.

---

## 9. Pendências / pontos de atenção
- **Investimentos**: seção existe só como placeholder no resumo da instituição. ⛔
- **Backfill `institution_id`** (issue #44): precisa estar aplicado no ambiente para que registros antigos apareçam agrupados por instituição. Contas sem instituição ficam no grupo "Sem instituição" (sem hub dedicado).
- Telas 🚧 (Proventos, Configurações, Perfil) ainda em evolução.
- **Open Finance / Cumbuca MCP** (spike #61): investigado, **sem implementação**. Recomendação: aguardar maturidade para produção; aprovado apenas protótipo local exploratório. Fluxo conceitual futuro: `Conta bancária > Conectar Open Finance > Sincronizar > Deduplicar > Revisar lançamentos > Confirmar importação`. Detalhes em [`docs/spikes/61-cumbuca-of-data-mcp.md`](spikes/61-cumbuca-of-data-mcp.md). ⛔

> Sempre que uma issue entregar uma feature nova ou mudar um fluxo, atualizar este arquivo.

---

## Versionamento do front-end (issue #107)

A versão do front-end fica em **`frontend/package.json`** (`version`) e é exposta por `config/env.ts` → `config.appVersion`, exibida no **Sidebar** (`v{appVersion}`) e registrada em `lib/authVersion.ts`. Pode ser sobreposta em deploy por `NEXT_PUBLIC_APP_VERSION`.

**Regra obrigatória — toda PR que gera entrega/deploy deve incrementar a versão do front-end** e a descrição da PR deve informar:

```txt
Versão anterior:
Nova versão:
Tipo de alteração: patch | minor | major
Deploy esperado: sim | não
```

Convenção (semver): **feature nova → minor**; correção → **patch**; quebra de contrato → **major**.

> **Defasagem corrigida na #107:** a versão estava **travada em `0.4.0`** desde o commit `60b6838`, acumulando **~13 PRs mergeadas sem incremento** (#77, #79, #80, #82, #86, #88, #89, #90, #94, #95, #96, #101, #104). A #107 retoma o controle bumpando para **`0.5.0`**. A partir daqui, cada entrega incrementa a versão.
