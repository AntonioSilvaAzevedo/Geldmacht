# Input · Textarea · Select · InputGroup

> Família de campos de formulário sobre `@base-ui/react/input`, com variantes `cva`.

- **Status:** ✅ implementado
- **Source:** `frontend/src/components/ui/input.tsx`
- **Spec visual:** `ui/Input Component.html`
- **Exports:** `Input`, `Textarea`, `Select`, `InputGroup`, `InputGroupRow`, `inputVariants`, `textareaVariants`

## `Input`

Estende `ComponentProps<typeof InputPrimitive>` (sem `size`, redefinido) +
`VariantProps<typeof inputVariants>`.

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `variant` | `'default' \| 'filled' \| 'ghost' \| 'search' \| 'group'` | `'default'` | estilo da caixa |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | altura |
| `inputState` | `'default' \| 'error' \| 'success' \| 'warning'` | `'default'` | feedback de validação (override `!important`) |
| `type` | `string` | — | tipo HTML do input |
| `className` | `string` | — | merge via `cn()` |

### Variantes

| variant | Aparência |
|---|---|
| `default` | borda `--separator-opaque`, fundo `--surface-2`, hover borda branca 18% |
| `filled` | sem borda visível, fundo `--surface-2`, borda azul no foco |
| `ghost` | transparente, hover `--surface-hover` |
| `search` | pill (`--radius-full`), `pl-10` para o ícone de busca |
| `group` | sem borda/fundo — para uso dentro de `InputGroupRow` |

### Tamanhos

| size | Altura | Padding | Fonte |
|---|---|---|---|
| `sm` | 36px | `px-2.5` | `--text-footnote` |
| `default` | 44px | `px-3.5` | `--text-subhead` |
| `lg` | 54px | `px-[18px]` | `--text-body` |

### Estados

- **focus-visible:** borda `--blue`, fundo `--surface-1`, ring azul 22%.
- **error/aria-invalid:** borda `--red` + ring vermelho 18%.
- **success:** borda `--green` + ring verde 16%. **warning:** `--orange` + ring 16%.
- **disabled:** `opacity 0.40`, fundo `--surface-1`.
- **read-only:** sem borda, fundo `--surface-1`, texto secundário, sem ring no foco.

> `inputState` aplica `!important` para vencer a borda de foco — use para validação
> controlada por servidor; `aria-invalid` continua funcionando para validação nativa.

## `Textarea`

`ComponentProps<'textarea'>` + `inputState`. `min-h-[90px]`, `resize-y`, raio
`--radius-md`, mesmas cores de foco/erro do Input.

## `Select`

`ComponentProps<'select'>` (sem `size`) + as mesmas variantes do Input. Reaproveita
`inputVariants`.

## `InputGroup` / `InputGroupRow`

Empilha campos numa única superfície arredondada (estilo iOS settings):

- `InputGroup` — wrapper `overflow-hidden rounded-[--radius-md] bg-[--surface-2]`.
- `InputGroupRow` — linha `h-[54px]`, separador `border-b white/8` (exceto última),
  `focus-within` tinge de azul 7%. Coloque um `<Input variant="group">` dentro.

## Uso

```tsx
import { Input, Textarea, Select, InputGroup, InputGroupRow } from '@/components/ui/input'

<Input placeholder="Descrição" />
<Input variant="search" placeholder="Buscar lançamento" />
<Input inputState="error" defaultValue="abc" aria-invalid />
<Textarea placeholder="Observações" />

<InputGroup>
  <InputGroupRow><Input variant="group" placeholder="Nome" /></InputGroupRow>
  <InputGroupRow><Input variant="group" placeholder="E-mail" /></InputGroupRow>
</InputGroup>
```

## Acessibilidade

- Associe sempre um `<label htmlFor>` (ou `aria-label`).
- Para validação, prefira `aria-invalid` + mensagem com `aria-describedby`;
  `inputState` é apenas o reforço visual.
