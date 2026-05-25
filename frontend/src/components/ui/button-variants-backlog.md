# Button — variantes e padrões faltantes

Backlog de variantes **não contempladas** no museu HTML (`Button Component.html`) e hoje resolvidas via `className` na app.

Referência implementada: `src/components/ui/button.tsx`  
Museu: `Button Component.html` (variants `default`, `primary`, `secondary`, `destructive`, `positive`, `outline`, `ghost`, `link` + sizes `sm` / `default` / `lg` / `icon-*`).

**Status:** pendente — atacar em PRs separados após priorização.

---

## Prioridade sugerida

| P | Item | Motivo |
|---|------|--------|
| P1 | `destructive-outline` | Usado em ação destrutiva sem fill; hoje remendado com `className` |
| P1 | `compact` (size) | Ações em cards menores que `sm` |
| P1 | `full` + auth layout | Login/register ainda passam `w-full rounded-[14px]` |
| P2 | `tab` / `filter` | Tabs e pills de filtro repetidos em 3+ telas |
| P2 | `accordion-trigger` | Cabeçalho de grupo expansível (fatura / categorias) |
| P2 | `menu-item` | Popover de perfil e listas de opção |
| P3 | `warning`, `premium` | Já no museu como demo inline, sem variant nomeada |
| P3 | `validation-error` | CTA desabilitado com borda vermelha (upload) |
| P3 | `picker-cell` | Grid de ícone/cor/emoji (categorias) |
| P3 | Utilitários (chrome) | Avatar, olho senha, toast X — avaliar se viram variant ou componente à parte |

---

## 1. `destructive-outline`

**Descrição:** borda e texto vermelhos, fundo transparente. Destructive “leve”, não o fill sólido de `destructive`.

**Onde hoje:**
- `app/(app)/cartao/page.tsx` — botão “Excluir” no card do cartão

**Sugestão de API:**
```tsx
<Button variant="destructive-outline" size="compact" />
// ou: variant="outline" tone="destructive"
```

**Classes típicas a absorver:**
`border-[rgba(229,62,62,0.3)] text-[var(--red-400)] hover:bg-[rgba(229,62,62,0.08)]`

---

## 2. `compact` (size)

**Descrição:** menor que `sm` (36px). Para barras de ação em cards e metadados.

**Onde hoje:**
- `app/(app)/cartao/page.tsx` — “Editar” / “Excluir”
- Vários `text-xs h-auto px-2.5 py-1.5`

**Sugestão de API:**
```tsx
<Button size="compact" /> // ~28–32px altura, 12px texto
```

**Anatomy alvo (a definir):** altura ~28px, padding horizontal ~10px, `text-xs`, ícone ~12px.

---

## 3. Auth layout (`full` + radius auth)

**Descrição:** botões de login/register — largura total, raio 14px, altura ~54px. Parcialmente coberto por `default`/`secondary` + `lg`, mas layout ainda exige `className`.

**Onde hoje:**
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`

**Sugestão de API:**
```tsx
<Button variant="default" size="lg" layout="full" />
// layout: 'full' | 'inline' (default)
```

**Nota:** Google = `secondary` + `lg` + `layout="full"` + `font-medium` (peso medium, não semibold).

---

## 4. `tab` / segmented control

**Descrição:** controle de abas — ativo com superfície + sombra; inativo ghost/secondary com peso normal.

**Onde hoje:**
- `app/(app)/carteira/[slug]/page.tsx` — tabs principais
- `app/(app)/categorias/page.tsx` — toggle Cartão / Conta bancária
- `app/(app)/carteira/[slug]/page.tsx` — chips de conta no extrato

**Sugestão de API:**
```tsx
<Button variant="tab" data-active={tab === id} />
// ou variant="ghost" + size="tab" + compound active:
<Button variant="tab" aria-pressed={active} />
```

**Classes típicas a absorver:**
`rounded-[9px] px-[18px] py-[7px]`, sombra quando ativo, `font-normal` quando inativo.

---

## 5. `filter-pill`

**Descrição:** pill **retangular** para filtros (não `rounded-full`). Ativo = primary ou outline azul; inativo = outline neutro.

**Onde hoje:**
- `components/Upload/UploadPreview.tsx` — todos / entradas / saídas / transferências

**Sugestão de API:**
```tsx
<Button variant="filter" size="sm" data-active={activeFilter === f} />
```

**Diferença do museu:** seção “pill” usa `rounded-full`; filtros usam `rounded-[7px]` + `capitalize`.

---

## 6. `accordion-trigger`

**Descrição:** linha clicável full-width que expande/colapsa conteúdo. Ghost semântico, mas layout de lista.

**Onde hoje:**
- `app/(app)/cartao/[cardId]/[anoMes]/page.tsx` — grupos de categoria
- `app/(app)/cartao/[cardId]/fatura/[invoiceId]/page.tsx` — categorias e compras parceladas

**Sugestão de API:**
```tsx
<Button variant="accordion" /> // w-full rounded-none justify-between font-normal min-h-[52px]
```

**Classes típicas a absorver:**
`w-full rounded-none justify-between font-normal min-h-[52px] px-4 py-3`

---

## 7. `menu-item`

**Descrição:** item de menu dropdown — largura total, alinhado à esquerda, hover de superfície. Variante “Sair” com tom destrutivo no hover.

**Onde hoje:**
- `components/Layout/UserProfileMenu.tsx` — Perfil/Config (Link hoje), Sair (Button)

**Sugestão de API:**
```tsx
<Button variant="menu-item" />
<Button variant="menu-item-destructive" /> // hover vermelho
```

**Alternativa:** manter `MenuLink` com `buttonVariants({ variant: 'menu-item' })` exportado.

---

## 8. `warning` e `premium`

**Descrição:** cores semânticas extras. Aparecem na seção “Semantic Colors” do museu HTML como **demo com style inline**, mas **não** entram no bloco `buttonVariants` do final do documento.

**Onde hoje:** não usados na app após migração (reservar para investimentos / alertas).

**Sugestão de API:**
```tsx
<Button variant="warning" />   // --orange, texto --black
<Button variant="premium" />   // --purple, texto branco
```

---

## 9. `validation-error` (disabled)

**Descrição:** botão desabilitado que **comunica erro de formulário** (borda vermelha, texto vermelho), não o disabled genérico (opacity 0.38).

**Onde hoje:**
- `components/Upload/UploadPreview.tsx` — importar sem cartão/conta selecionada

**Sugestão de API:**
```tsx
<Button variant="outline" invalid disabled title="..." />
// ou variant="validation-error"
```

---

## 10. `link-inline` / `link-micro`

**Descrição:** link textual dentro de linha de tabela/card — sem padding, fonte 10–11px, underline opcional.

**Onde hoje:**
- `components/CategoryGrid.tsx` — “alterar”
- `components/TransactionList.tsx` — “Alterar categoria”
- `app/(app)/cartao/.../fatura/[invoiceId]/page.tsx` — “Categoria”

**Sugestão de API:**
```tsx
<Button variant="link" size="xs" /> // h-auto p-0 text-[10px]
```

**Nota:** `link` do museu usa `font-medium` e underline; micro precisa de size dedicado.

---

## 11. `picker-cell`

**Descrição:** célula quadrada em grid (ícone, cor, emoji). Estado selecionado com ring/borda azul.

**Onde hoje:**
- `app/(app)/categorias/page.tsx` — grid de ícones e cores
- `components/category-icon-select.tsx`

**Sugestão de API:**
```tsx
<Button variant="picker" size="picker" data-selected={selected} />
// ~52×52px, rounded-[14px]
```

**Variante relacionada:** `picker-dashed` — borda tracejada “+ subcategoria”.

---

## 12. Botões utilitários (chrome da UI)

Padrões que **podem não virar variant** do `Button` — candidatos a componentes dedicados (`IconButton`, `AvatarButton`, etc.).

| Padrão | Onde | Notas |
|--------|------|-------|
| Ícone olho (senha) | login, register | `ghost` + overrides; sem caixa |
| Fechar toast | `cartao/page` | ícone dentro de banner colorido |
| Fechar modal (X) | `ReleaseNotesModal` | quadrado 30px, borda sutil |
| Avatar trigger | `UserProfileMenu` | circular 32px, gradiente |
| Hamburger / drawer X | `MobileSidebarDrawer` | posição absoluta no drawer |
| Lápis inline | `EditableDescription` | opacity 0 → 1 no hover do grupo |
| Toggle checkbox (tabela) | `UploadPreview` | ghost sem padding, só ícone |

**Decisão pendente:** estender `Button` vs. criar `IconButton` / `ToolbarButton`.

---

## 13. Layout / responsivo (não são variants de cor)

Props de layout que hoje repetem `className`:

| Prop sugerida | Uso |
|---------------|-----|
| `layout="full"` | `w-full` (auth, modais, CTAs mobile) |
| `layout="flex-1"` | botões que dividem linha (`lancamentos/novo`, nav fatura mobile) |
| `shape="pill"` | `rounded-full` (museu já documenta via className) |

---

## 14. Gradiente legado

**Descrição:** `var(--primary-gradient)` em CTAs antigos. O museu usa azul sólido (`primary`) ou branco (`default`).

**Onde ainda aparece:** links estilizados (`importLinkStyle` em `cartao/page`), não no `Button` migrado.

**Decisão pendiente:** abandonar gradiente ou criar `variant="primary-gradient"` por compat visual.

---

## 15. Badge em botão

**Descrição:** `.btn-badge` existe no CSS do museu (notificações com contador), mas não virou compound do componente React.

**Onde:** exemplificado no HTML; não implementado na app.

**Sugestão:**
```tsx
<Button variant="ghost">
  Notificações
  <Badge count={3} />
</Button>
```

---

## Checklist antes de implementar

- [ ] Definir se novos tokens entram só em `buttonVariants` ou também no museu HTML
- [ ] Limitar API (`variant` + `size` + `layout`) vs. proliferar variants compostas
- [ ] Segunda passada: remover `className` redundantes após cada variant nova
- [ ] Atualizar `Button Component.html` para espelhar o que for implementado

---

## Contagem atual (baseline)

- ~81 usos de `<Button>` na app
- ~56 (~69%) ainda com `className` (migração mecânica de `style={{}}`)
- Meta pós-backlog: `className` só para casos pontuais (`mt-1`, `ml-auto`, etc.)
