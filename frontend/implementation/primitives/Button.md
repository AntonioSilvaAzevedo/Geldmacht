# Button

> Botão de ação. Primitivo sobre `@base-ui/react/button` com variantes via `cva`.

- **Status:** ✅ implementado
- **Source:** `frontend/src/components/ui/button.tsx`
- **Spec visual:** `ui/Button Component.html`
- **Exports:** `Button`, `buttonVariants`

## API

Estende `ComponentProps<typeof ButtonPrimitive>` (logo aceita `onClick`,
`type`, `disabled`, `aria-*`, `render`, etc.) + `VariantProps<typeof buttonVariants>`.

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `variant` | `'default' \| 'primary' \| 'destructive' \| 'positive' \| 'secondary' \| 'outline' \| 'ghost' \| 'link'` | `'default'` | estilo visual |
| `size` | `'sm' \| 'default' \| 'lg' \| 'icon' \| 'icon-sm' \| 'icon-lg'` | `'default'` | altura/padding |
| `loading` | `boolean` | `false` | mostra spinner, desabilita e esconde o conteúdo |
| `disabled` | `boolean` | `false` | desabilita (também ativado por `loading`) |
| `className` | `string` | — | merge via `cn()` |

## Variantes

| variant | Aparência |
|---|---|
| `default` | branco sobre preto — **ação primária** |
| `primary` | azul `--blue` sobre branco — ação informativa/link forte |
| `destructive` | `--red`, ring vermelho no foco |
| `positive` | `--green` sobre preto — confirmar/receber |
| `secondary` | `--surface-2`, hover `--surface-3` |
| `outline` | borda `--separator-opaque`, fundo transparente |
| `ghost` | sem fundo, hover `--surface-hover` |
| `link` | texto azul sublinhado, sem altura fixa |

## Tamanhos

| size | Altura | Padding | Ícone |
|---|---|---|---|
| `sm` | 36px (`h-9`) | `px-3.5` | 15px |
| `default` | 44px (`h-11`) | `px-5` | 16px |
| `lg` | 54px | `px-7` | 22px |
| `icon` | 44×44 | — | 18px |
| `icon-sm` | 36×36 | — | 15px |
| `icon-lg` | 54×54 | — | 22px |

`compoundVariants` ajusta o tamanho da fonte de `variant="link"` conforme o `size`.

## Estados

- **hover:** `opacity 0.88` (variantes sólidas) ou troca de superfície.
- **active:** `scale(0.97)`.
- **focus-visible:** `ring-3` azul (vermelho em `destructive`).
- **disabled:** `opacity 0.38`, sem pointer-events, sem `scale`.
- **loading:** `<Loader2>` girando absoluto + conteúdo em `opacity-0`; seta
  `aria-busy`.

## Anatomia / tokens

- Fonte `var(--font-sans)`, peso `semibold` (`link` usa `medium`).
- Transição `120ms ease-out` em `opacity, background, transform, box-shadow`.
- Raio: `--radius-sm` (sm/icon-sm) ou `--radius-md` (resto).
- Ícones SVG: `[&_svg]:shrink-0` e dimensão automática por `size`.

## Uso

```tsx
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

<Button>Salvar</Button>                          {/* primária (branca) */}
<Button variant="positive">Receber</Button>
<Button variant="destructive" size="sm">Excluir</Button>
<Button variant="outline" size="icon"><Plus /></Button>
<Button loading>Processando</Button>
```

## Acessibilidade

- Sempre rotule botões só-ícone com `aria-label`.
- `loading` já comunica estado via `aria-busy`; mantenha o label de texto.
- Não substitua por `<div onClick>` — o primitivo entrega semântica e teclado.
