# SegmentedControl

> Controle de abas inline, estilo iOS segmented picker. Alterna sub-telas dentro
> de um header sem mudar a URL nem remontar a tela pai.

- **Status:** ✅ implementado
- **Source:** `frontend/src/components/ui/segmented-control.tsx`
- **Spec visual:** `ui/Segmented Control Component.html` (canônico) · `components/SegmentedControl Component.html` (protótipo inline)
- **Exports:** `SegmentedControl`

## API

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `tabs` | `string[]` | — | rótulos na ordem. **Máx 3** (4+ → use `Select` ou tab bar) |
| `active` | `string` | — | rótulo ativo (**controlled**) |
| `onChange` | `(tab: string) => void` | — | callback ao trocar |
| `size` | `'sm' \| 'md'` | `'md'` | densidade |
| `fullWidth` | `boolean` | `false` | estica para a largura do container |
| `className` | `string` | — | merge via `cn()` |

Stateless: a aba ativa vive na tela pai. Trocar de aba **não** remonta a tela.

## Anatomia / tokens

| Parte | md | sm |
|---|---|---|
| Track radius | `10px` | `9px` |
| Track padding | `3px` | `2px` |
| Track bg | `--surface-2` | `--surface-2` |
| Gap | `4px` | `4px` |
| Segment radius | `lg` (8px) | `7px` |
| Segment padding | `px-3.5 py-1.5` | `px-[11px] py-1` |
| Fonte | `13px` | `12px` |

- **Thumb ativo:** fundo `--surface-0` (preto), `font-semibold`, `text-primary`,
  `shadow-[0_1px_4px_rgba(0,0,0,0.4)]`.
- **Inativo:** transparente, `text-secondary`, hover → `text-primary`.
- **Transição:** `120ms ease-out` em `background, color, box-shadow`.
- **focus-visible:** `ring-3 rgba(10,132,255,0.45)`.
- `fullWidth` → track `flex w-full`, cada segmento `flex-1 text-center`; senão
  track `inline-flex self-start`.

## Uso

```tsx
import { SegmentedControl } from '@/components/ui/segmented-control'

const [tab, setTab] = useState('Conta')

<SegmentedControl
  tabs={['Conta', 'Cartão', 'Resumo']}
  active={tab}
  onChange={setTab}
/>

{/* dentro de card, compacto */}
<SegmentedControl size="sm" tabs={['Dia','Semana','Mês']} active={p} onChange={setP} />

{/* 2 abas full-width */}
<SegmentedControl tabs={['Cartão','Conta']} active={t} onChange={setT} fullWidth />
```

No `PageHeader`, vai sempre no slot `right`, alinhado à base do título.
Veja [InstitutionHeader](../components/InstitutionHeader.md) e
[PageHeader](../components/PageHeader.md).

## Acessibilidade

- Cada segmento é um `<button type="button">` — navegável por Tab.
- Para semântica de tablist, considere envolver com `role="tablist"` e os botões
  com `role="tab"` + `aria-selected` quando controla painéis nomeados.
