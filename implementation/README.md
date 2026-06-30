# Geldmacht — Documentação Técnica de Implementação

Especificação de implementação dos componentes do design system Geldmacht (Apple
Direction). Cada documento descreve **a API, anatomia, tokens, estados e como
integrar** o componente no app Next.js de produção.

A referência visual de cada componente está nos protótipos HTML em `ui/` e
`components/`. A implementação canônica vive no app em
`frontend/src/components/`.

---

## Stack alvo

| Item | Valor |
|---|---|
| Framework | Next.js 15.2 (App Router, RSC) |
| React | 19 |
| Estilo | Tailwind CSS v4 + CSS custom properties (`apple-tokens.css`) |
| Primitivos | `@base-ui/react` (Button, Input) |
| Variantes | `class-variance-authority` (cva) |
| Merge de classes | `clsx` + `tailwind-merge` via helper `cn()` |
| Ícones | `lucide-react` |
| Gráficos | `recharts` |
| Datas | `date-fns` |

### Helper `cn()`

Todos os componentes usam `cn()` para compor classes. Importe de `@/lib/utils`:

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Convenções

1. **Tokens, nunca hex cru.** Cores, raios e fontes vêm de `apple-tokens.css`
   como `var(--token)`. Veja [`tokens.md`](./tokens.md).
2. **Controlled by default.** Componentes de seleção (`SegmentedControl`,
   `TypeToggle`, `MonthNav`, `CategorySelector`) não guardam estado — recebem
   `value`/`active` + `onChange` e o estado vive na tela pai.
3. **`data-slot`** em cada raiz de primitivo para hooks de estilo/teste.
4. **Foco visível** com `focus-visible:ring-3 ring-[rgba(10,132,255,0.45)]`.
   Nunca remova outline sem substituir por ring.
5. **Mono para números.** Valores monetários usam `var(--font-mono)` +
   `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
6. **Semântica de cor:** verde = entrada/positivo, vermelho = saída/negativo,
   azul = link/ação, roxo = investimentos. Azul **não** é a cor primária de botão.

---

## Índice

### Primitivos (`frontend/src/components/ui/`) — implementados

| Componente | Doc | Source |
|---|---|---|
| Button | [primitives/Button.md](./primitives/Button.md) | `ui/button.tsx` |
| Input / Textarea / Select / InputGroup | [primitives/Input.md](./primitives/Input.md) | `ui/input.tsx` |
| SegmentedControl | [primitives/SegmentedControl.md](./primitives/SegmentedControl.md) | `ui/segmented-control.tsx` |
| Sidebar | [primitives/Sidebar.md](./primitives/Sidebar.md) | `Layout/Sidebar.tsx` |

### Componentes de composição (`components/`) — spec → implementar

| Componente | Doc | Status |
|---|---|---|
| PageHeader | [components/PageHeader.md](./components/PageHeader.md) | 🟡 spec |
| KPIStrip | [components/KPIStrip.md](./components/KPIStrip.md) | 🟡 spec |
| TransactionList | [components/TransactionList.md](./components/TransactionList.md) | 🟡 spec |
| TransactionEditForm | [components/TransactionEditForm.md](./components/TransactionEditForm.md) | 🟡 spec |
| Extrato | [components/Extrato.md](./components/Extrato.md) | 🟡 spec |
| Resumo | [components/Resumo.md](./components/Resumo.md) | 🟡 spec |
| CategoryBreakdown | [components/CategoryBreakdown.md](./components/CategoryBreakdown.md) | 🟡 spec |
| CategorySelector | [components/CategorySelector.md](./components/CategorySelector.md) | 🟡 spec |
| InstitutionCard | [components/InstitutionCard.md](./components/InstitutionCard.md) | 🟡 spec |
| InstitutionHeader | [components/InstitutionHeader.md](./components/InstitutionHeader.md) | 🟡 spec |
| AccountCard | [components/AccountCard.md](./components/AccountCard.md) | 🟡 spec |
| Cartão (CreditCard) | [components/Cartao.md](./components/Cartao.md) | 🟡 spec |
| ContaEmptyState | [components/ContaEmptyState.md](./components/ContaEmptyState.md) | 🟡 spec |
| InvoiceNav | [components/InvoiceNav.md](./components/InvoiceNav.md) | 🟡 spec |
| MonthNav | [components/MonthNav.md](./components/MonthNav.md) | 🟡 spec |
| AmountInput | [components/AmountInput.md](./components/AmountInput.md) | 🟡 spec |
| Numpad | [components/Numpad.md](./components/Numpad.md) | 🟡 spec |
| TypeToggle | [components/TypeToggle.md](./components/TypeToggle.md) | 🟡 spec |
| BatchQueue | [components/BatchQueue.md](./components/BatchQueue.md) | 🟡 spec |

**Legenda:** ✅ implementado no app · 🟡 protótipo HTML aprovado, falta portar para `.tsx`.
