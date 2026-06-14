# Refatoração `/home/carteira/[slug]` — Opção C

Checklist de implementação: rotas filhas, layout compartilhado, eliminação da tab Cartão.

**Decisões fechadas**

- [x] Default da instituição = `/home/carteira/[slug]/resumo`
- [x] Tab Cartão eliminada — cartões acessados via Resumo → `/home/cartao/[cardId]`
- [x] Dados compartilhados via Context no `layout.tsx`
- [x] Extrato = rota própria (conteúdo atual do `ExtratoPanel`; listagem futura fora de escopo)

---

## Mapa de rotas alvo

```
/home/carteira                          → hub (sem mudança)
/home/carteira/[slug]                   → redirect → /resumo
/home/carteira/[slug]/layout.tsx        → shell: fetch, breadcrumb, nav
/home/carteira/[slug]/resumo            → ex-ResumoTab
/home/carteira/[slug]/extrato           → ex-ExtratoPanel
/home/cartao/[cardId]                   → detalhe do cartão (já existe)
```

---

## Estrutura de arquivos alvo

```
src/app/home/carteira/[slug]/
  layout.tsx
  page.tsx                              ← redirect
  resumo/page.tsx
  extrato/page.tsx

src/components/carteira/
  institution-nav.tsx
  institution-context.tsx
  resumo/
    summary-strip.tsx
    accounts-section.tsx
    cards-section.tsx
    stats-section.tsx
    quick-actions.tsx
    section-label.tsx
    resumo-row.tsx
    resumo-tab.tsx
  extrato/
    extrato-panel.tsx

src/lib/carteira/
  institution-helpers.ts
  account-type-labels.ts
  types.ts

src/hooks/
  use-institution-detail.ts
```

---

## PR 1 — Fundação

**Objetivo:** shared code antes de quebrar rotas.

### Helpers e tipos

- [x] Criar `src/lib/carteira/institution-helpers.ts`
  - [x] `decodeSlug(slug: string): string`
  - [x] `matchesInstitution(field: string | null, name: string): boolean`
  - [x] `toSlug(name: string): string` (mover de `carteira/page.tsx`)
  - [x] `deriveDisplayName(...)` (extraído do hook)
- [x] Criar `src/lib/carteira/account-type-labels.ts`
  - [x] Exportar `ACCOUNT_TYPE_LABELS`
- [x] Atualizar `src/app/home/carteira/page.tsx` para importar helpers/labels compartilhados
- [x] ~~Atualizar monolito `[slug]/page.tsx`~~ — substituído por redirect (PR 2)

### Hook de dados

- [x] Criar `src/hooks/use-institution-detail.ts`
  - [x] Input: `institutionName` (slug decodificado)
  - [x] Fetch: `api.listBankAccounts`, `api.listCards`
  - [x] Fetch paralelo: `api.getCardDashboard` por cartão (`Promise.allSettled`)
  - [x] **Não** buscar `api.getCardInvoices` (só servia tab Cartão)
  - [x] Retorno: `{ accounts, cards, dashboards, displayName, loading, error, refetch }`
  - [x] Derivar `displayName` da capitalização real nos dados (como hoje)

### Tipos

- [x] Definir tipo `InstitutionDetail` em `src/lib/carteira/types.ts`

**Critério de done PR 1:** hook isolado; helpers sem duplicação entre hub e detalhe. ✅

---

## PR 2 — Layout shell + rotas

**Objetivo:** App Router aninhado; redirect default; shell visual.

### Context

- [x] Criar `src/components/carteira/institution-context.tsx`
  - [x] Provider consome `useInstitutionDetail`
  - [x] Exportar `useInstitution()` para rotas filhas
  - [x] Expor: `accounts`, `cards`, `dashboards`, `displayName`, `institutionName`, `loading`, `error`, `institutionColor`, `refetch`, `slug`

### Layout

- [x] Criar `src/app/home/carteira/[slug]/layout.tsx` (`'use client'`)
  - [x] Ler `slug` via `useParams`
  - [x] Envolver `{children}` com `InstitutionProvider`
  - [x] Loading: `LoadingSpinner` centralizado
  - [x] Erro: mensagem + botão retry (`refetch`)
  - [x] Breadcrumb: `Carteira` (link) + `{displayName}` (`BreadcrumbPage` via `currentPage`)
  - [x] Renderizar `InstitutionNav` abaixo do breadcrumb
  - [x] `<main>` wrapper com padding/maxWidth consistente com hoje

### Navegação

- [x] Criar `src/components/carteira/institution-nav.tsx`
  - [x] Tabs como links: `Resumo` → `/resumo`, `Extrato` → `/extrato`
  - [x] Tab ativa via `usePathname()`
  - [x] Ocultar tab **Extrato** quando `accounts.length === 0`
  - [x] Estilo alinhado ao `SegmentedControl` (Links + Tailwind)

### Rotas

- [x] Criar `src/app/home/carteira/[slug]/page.tsx` com `redirect` para `/home/carteira/[slug]/resumo`
- [x] Confirmar link do hub (`carteira/page.tsx`) continua `/home/carteira/${slug}` (redirect ok)

### CSS

- [x] Verificar `globals.css`: `[data-page-breadcrumb]` permanece fixo no scroll

**Critério de done PR 2:** `/home/carteira/nubank` → `/resumo`; layout mostra breadcrumb + tabs. ✅

---

## PR 3 — Migrar Resumo

**Objetivo:** primeira rota filha funcional; extrair UI do god file.

### Componentes

- [x] Extrair `SummaryStrip` → `src/components/carteira/resumo/summary-strip.tsx`
  - [x] Corrigir tile "Contas: 0 / saldo indisponível" → `accounts.length` real
- [x] Extrair `AccountsSection` → `accounts-section.tsx`
- [x] Extrair `CardsSection` → `cards-section.tsx`
  - [x] Link primário para `/home/cartao/[id]` (substitui tab Cartão)
- [x] Extrair `StatsSection` → `stats-section.tsx`
- [x] Extrair `QuickActions` → `quick-actions.tsx`
- [x] Extrair primitivos compartilhados do resumo:
  - [x] `SectionLabel` → `section-label.tsx`
  - [x] `ResumoRow` → `resumo-row.tsx`
- [x] Criar `resumo-tab.tsx` compondo as seções acima

### Rota

- [x] Criar `src/app/home/carteira/[slug]/resumo/page.tsx`
  - [x] Consumir `useInstitution()`
  - [x] Renderizar `<ResumoTab />`

### Estilo

- [x] Migrar `style={{}}` → Tailwind nos componentes de resumo (tokens `var(--*)`)

**Critério de done PR 3:** `/resumo` equivalente ou melhor que tab Resumo anterior. ✅

---

## PR 4 — Migrar Extrato + remover tab Cartão

**Objetivo:** segunda rota filha; deletar código duplicado de cartão.

### Extrato

- [x] Extrair `ExtratoPanel` → `src/components/carteira/extrato/extrato-panel.tsx`
- [x] Criar `src/app/home/carteira/[slug]/extrato/page.tsx`
  - [x] Estado `activeAccountId` **local** à página (não no layout/context)
  - [x] Default: primeira conta da instituição
  - [x] Empty state quando `accounts.length === 0` (mensagem existente)
  - [ ] (Opcional) CTA importar OFX — spec futura

### Remoções

- [x] Deletar tab Cartão e componentes exclusivos dela (`CardPanel`, `CardVisual`, etc.)
- [x] Remover fetch `cardInvoices` / estado `cardInvoices`
- [x] Remover `useState<Tab>` e lógica `setTab('cartao')`
- [x] Deletar monolito `page.tsx` (1183 linhas) → substituído por redirect (12 linhas)

### Comportamento

- [x] Instituição só com cartões, sem contas → landing em `/resumo`; tab Extrato oculta

**Critério de done PR 4:** god file eliminado; extrato navegável por URL. ✅

---

## PR 5 — Limpeza e links cruzados

**Objetivo:** consistência em todo o app; código morto fora.

### Breadcrumbs e links

- [x] Atualizar `src/app/home/cartao/[cardId]/page.tsx`
  - [x] Breadcrumb instituição → `/home/carteira/[slug]/resumo`
  - [x] Usar `toSlug()` compartilhado
- [x] Revisar outros links para `/home/carteira/[slug]` no repo — hub ok (redirect)

### Arquivos órfãos

- [x] Deletar `src/components/Layout/PageHeader.tsx` (sem imports)
- [x] `PageBreadcrumb` ganhou prop `currentPage` (substitui uso no layout)

### Documentação

- [x] Atualizar `src/components/ui/button-variants-backlog.md` (paths antigos)
- [ ] Atualizar `implementation/README.md` se houver entrada de PageHeader/rota instituição

### Verificação manual

- [ ] Hub → instituição → resumo
- [ ] resumo ↔ extrato (com contas)
- [ ] resumo → cartão → breadcrumb → instituição/resumo
- [ ] Instituição sem contas (só cartões): resumo ok, extrato oculto
- [ ] Instituição sem contas e sem cartões: empty state coerente
- [ ] Mobile: padding breadcrumb/nav/main alinhado (`px` 14 vs 32)
- [ ] Scroll: breadcrumb fixo; só `<main>` rola

**Critério de done PR 5:** pendente verificação manual no browser.

---

## Fora de escopo (registrar, não bloquear)

- [ ] Listagem de lançamentos no Extrato (spec `implementation/components/Extrato.md`)
- [ ] SWR/React Query para cache entre layout e refetch
- [ ] Refatorar `carteira/page.tsx` (hub) — além dos helpers compartilhados
- [ ] Unificar `CardHero` (`cartao/[cardId]`) com visual de cartão da tab removida
- [ ] CTA importar OFX no ExtratoPanel

---

## Ordem de execução

```
PR 1 → PR 2 → PR 3 → PR 4 → PR 5 (verificação manual)
```

---

## Estado pós-refatoração

| Arquivo | Linhas ~ | Papel |
|---|---|---|
| `[slug]/layout.tsx` | ~75 | shell: context, breadcrumb, nav, main |
| `[slug]/page.tsx` | ~12 | redirect → resumo |
| `[slug]/resumo/page.tsx` | ~18 | composição ResumoTab |
| `[slug]/extrato/page.tsx` | ~35 | ExtratoPanel + estado local |
| `components/carteira/**` | ~500 | UI modular |

**Implementado em:** 2026-06-03
