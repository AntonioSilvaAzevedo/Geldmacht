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
- **Padrão global de modal (`FormSheet`):** todos os modais de formulário (conta bancária, cartão, lançamento manual, menu Adicionar, pré-requisito, excluir conta) usam o componente único `components/ui/FormSheet.tsx` — **bottom sheet no mobile** / centralizado no desktop, **altura máxima `90dvh`**, **corpo com scroll interno**, **footer fixo** (quando há) e **safe-area** (`env(safe-area-inset-bottom)`). Com o teclado aberto o campo focado continua acessível (viewport com `interactive-widget=resizes-content` + `viewport-fit=cover` no layout raiz). Botões de ação não ficam escondidos atrás da bottom bar nem da barra do navegador.

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

### 2.2. Resumo da instituição — `/home/carteira/{id}` ✅ (issue #44)
O slug da rota é o **id** da instituição. É a **tela inicial** ao abrir uma conta pela carteira e corresponde à aba **`Resumo`** do `InstitutionNav`. Mostra três seções:

1. **Conta corrente** — lista contas vinculadas; se vazia, botão "Cadastrar conta corrente" (modal com a instituição já fixada). Com contas → link "Ver conta corrente (n)" para o extrato.
2. **Cartão de crédito** — lista cartões vinculados; se vazio, "Cadastrar cartão de crédito" (modal com a instituição já fixada). Com cartões → link "Ver cartão de crédito (n)" para as faturas.
3. **Investimentos** — 🚧 placeholder "Funcionalidade ainda não disponível".

Ao cadastrar conta/cartão por aqui, o produto já entra vinculado àquela instituição e o resumo é recarregado.

> **Navegação por abas (issue #80):** o `InstitutionNav` exibe as abas **`Resumo` → `Conta corrente` → `Cartão de crédito`**. `Resumo` é **sempre exibida** (mesmo em conta sem vínculos) e aponta para `/home/carteira/{id}`; `Conta corrente` aparece quando há contas (rota `…/extrato`) e `Cartão de crédito` quando há cartões (rota `…/cartao/faturas`). A aba ativa é resolvida pela rota atual. A **engrenagem** de configurações continua no topo do Resumo.

### 2.3. Extrato (conta corrente) — `/home/carteira/{id}/extrato` ✅
1. Abas por conta (quando há mais de uma na instituição).
2. **Adicionar lançamento** → abre o **modal** de lançamento manual (mesmo fluxo da sidebar/bottom bar). _(issue #50: antes apontava para uma rota inexistente e quebrava.)_
3. **Importar extrato** → leva ao upload (`/home/upload?type=bank_statement&bankAccountId={conta}`) para arquivos `.ofx/.qfx`, já com a conta corrente como contexto. _(issue #50)_
4. **Exportar extrato** → baixa CSV (`extrato-{conta}-{ano}.csv`).
5. Lista as transações da conta no período.

### 2.4. Faturas do cartão — `/home/carteira/{id}/cartao/faturas` ✅ (issue #14)
> **IDs:** o `{id}` da rota é o **id da instituição** (slug). A busca de faturas usa o **id do cartão** (`cards[0].id`, vindo do `useInstitution()`), **não** o id da instituição/conta. Fonte: `GET /api/cards/{cardId}/annual-invoices?year=YYYY`.

1. **Visão anual inteligente:** exibe **apenas os meses com fatura real ou previsão** (não mais os 12 meses fixos).
2. **Previsão por parcelas:** as parcelas restantes da fatura real **mais recente** projetam os meses à frente (até `installment_total`), marcados com selo **"Prevista"**. Previsto só aparece **após o último mês real** — nunca soma com fatura real (dedup por mês).
3. **Previsão por assinaturas:** assinaturas recorrentes ativas (entidade `RecurringExpense`) somam seu valor mensal nos meses previstos do ano (do mês seguinte ao último real até dezembro). _(issue #14 — fase 2)_
4. Mês **real** → abre o **detalhe da fatura**. Mês **previsto** → abre a **fatura prevista** (ver 2.5.1).

> **Regra de recálculo das previsões (issue #82):** a base das previsões é **sempre a fatura real mais recente** do cartão (`latest_month = max(due_month)` em `services/invoice_projection.py`). Ao importar uma fatura mais atual, `latest_month` avança e os meses seguintes são **recalculados automaticamente** a partir dela — a previsão nunca fica presa numa fatura antiga. Meses que já têm fatura real são **deduplicados** (`if month in real_by_month: continue`), então previsto e real **não se somam** no mesmo mês. Parcelas e recorrentes ativas continuam sendo consideradas.

> **Estado visual das previstas (issue #82):** na listagem, faturas previstas usam estilo **neutral/discreto** (borda tracejada, valores em `text-tertiary`) com label **"Prevista"**, mas seguem **clicáveis** (`cursor-pointer`). Faturas reais mantêm o visual normal.
5. **Estados da tela** _(issue #60)_: **carregando** (spinner), **vazio** (sem fatura nem previsão → "Nenhuma fatura ou previsão."), e **erro** (falha na API → "Não foi possível carregar as faturas." com botão **"Tentar novamente"**). A tela nunca quebra em branco.

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
2. **Importar fatura** de cartão (`?type=credit_card`, `.pdf/.xlsx`) → vincula a um **cartão** e gera a fatura/`invoice`. Pré-selecionado quando vem do cartão (`cardId`). Acessível pelas faturas do cartão e pelo menu Adicionar.
3. **Revisão de lançamentos:** após o upload, a tela de revisão tem a **lista de lançamentos como destaque principal**. Estrutura enxuta _(issue #57)_:
   - **Topo:** apenas o título **"Revisar lançamentos"** e, abaixo, o **nome do arquivo** em label pequena e discreta. Sem chip de parser, sem contagem e sem datas no topo.
   - **Destino compacto:** um único bloco confirma para onde a importação vai — **"Conta corrente de destino"** (extrato) ou **"Cartão de destino"** (fatura, seletor de cartão). Os metadados da fatura (vencimento, ciclo, total) vêm detectados do arquivo e não são mais editáveis na tela.
   - **Sem cards secundários** (resumo da fatura — Total/Estornos/Maior gasto/Parcelas) e **sem busca por descrição nem chips de filtro** na revisão.
   - A **lista rola internamente** e o **botão final de importar fica sempre visível** num rodapé fixo no fim (no mobile, acima da bottom tab bar — não fica mais escondido). Listas grandes não escondem a ação final.
   - **Categorizar e renomear** _(issue #71)_: cada lançamento permite **escolher uma categoria** (categorias **globais** do usuário) e **renomear o título** (edição inline; o nome editado é enviado na importação).
   - **Categorização rápida por badges** _(issue #73)_: a categoria é escolhida com **chips clicáveis** (`CategoryBadges`), substituindo o seletor dropdown. No **desktop**, a coluna **Parcela/Tipo foi fundida com Categoria** numa única coluna — lançamentos **sistêmicos** (parcelados/pagamentos) mostram ali o selo bloqueado (`Parcela X/Y · Bloqueado`); os demais mostram os chips de categoria. O conteúdo da revisão tem **largura máxima** (`max-w-[1120px]`, centralizado) para os itens ficarem bem divididos em monitores grandes. No **mobile**, os chips ficam no card. Mostra "Sem categoria" + categorias (todas quando poucas; senão as principais + **"Mais categorias"**, que abre um **bottom sheet `FormSheet` com busca**). A selecionada fica destacada, com `cursor-pointer`, sem scroll horizontal.
   - **Mobile** _(issue #71)_: cards de lançamento **cabem na largura da tela** (sem scroll lateral); o **contador de selecionados** fica numa linha **acima da lista** (saiu do rodapé) e o rodapé mostra só **Cancelar/Importar**, sempre visíveis e com safe-area.
4. **Redirect direto pós-importação** _(issue #77)_: ao confirmar a importação, o usuário vai **direto** para o destino correspondente — **fatura importada** (`/home/carteira/{institution_id}/cartao/faturas/{invoice_id}`) no fluxo de cartão ou **carteira** (`/home/carteira`) no fluxo de extrato. A tela intermediária antiga **"Importação concluída!"** (`ImportResultView` + `InvoiceSummaryCards`) foi **removida** do código, eliminando o **flash visual** que aparecia antes da navegação.

> **Refator (#54 → #57):** o `UploadPreview` (antes ~1232 linhas, inline-style) foi decomposto em componentes de responsabilidade única — `ReviewTransactionList` (lista) + `ReviewTransactionRow` (linha/card de um lançamento, reutilizável), `ReviewFooter`, `CreditCardInvoiceForm`, `BankStatementInfo` — ficando como orquestrador enxuto. Na #57 a tela foi simplificada: removidos `ReviewFilters` (chips + busca) e o uso dos cards de resumo na revisão, os blocos de destino reduzidos ao mínimo, e a lista passou a rolar internamente também no mobile (lista `flex-1` com scroll próprio; rodapé em fluxo acima da bottom tab bar).

> **Parser determinístico hoje (#84):** a leitura de arquivos é feita por **parsers específicos por banco** (`geldmacht-api/app/parsers/`: Nubank PF/PJ, Itaú, Mercado Pago, Fatura Nubank + OFX genérico) atrás de `detect_parser`. Formatos suportados: **PDF** (`pdfplumber`), **Excel** (`openpyxl`) e **OFX**. Não há CSV/TXT/imagem/PDF escaneado nem IA.

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
`auth` · `upload` · `bank-accounts` · `institutions` · `import` (transactions) · `transactions` · `cards` · `categories` · `dashboard` · `release-notes` · `onboarding`.

Modelo de dados central da Carteira: `Institution` 1—N `BankAccount` / `CreditCard` (via `institution_id`); `Transaction` ligada a conta ou cartão; `Invoice` para faturas.

---

## 9. Pendências / pontos de atenção
- **Investimentos**: seção existe só como placeholder no resumo da instituição. ⛔
- **Backfill `institution_id`** (issue #44): precisa estar aplicado no ambiente para que registros antigos apareçam agrupados por instituição. Contas sem instituição ficam no grupo "Sem instituição" (sem hub dedicado).
- Telas 🚧 (Proventos, Configurações, Perfil) ainda em evolução.
- **Open Finance / Cumbuca MCP** (spike #61): investigado, **sem implementação**. Recomendação: aguardar maturidade para produção; aprovado apenas protótipo local exploratório. Fluxo conceitual futuro: `Conta bancária > Conectar Open Finance > Sincronizar > Deduplicar > Revisar lançamentos > Confirmar importação`. Detalhes em [`docs/spikes/61-cumbuca-of-data-mcp.md`](spikes/61-cumbuca-of-data-mcp.md). ⛔

> Sempre que uma issue entregar uma feature nova ou mudar um fluxo, atualizar este arquivo.
