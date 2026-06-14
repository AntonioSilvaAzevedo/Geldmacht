# Design Tokens

Todos os componentes consomem `apple-tokens.css` (importado globalmente em
`src/app/globals.css`). Use sempre `var(--token)` — nunca hex cru no JSX.

## Tipografia

```
--font-sans  -apple-system, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif
--font-mono  'SF Mono', 'DM Mono', 'Fira Code', monospace      ← valores numéricos
```

| Token | px | Uso |
|---|---|---|
| `--text-caption2` | 11 | carimbo de data, hint |
| `--text-caption1` | 12 | legenda, badge |
| `--text-footnote` | 13 | nota de rodapé, meta |
| `--text-subhead` | 15 | secundário, label de campo |
| `--text-callout` | 16 | callout / destaque |
| `--text-body` | 17 | corpo padrão, item de lista |
| `--text-title3` | 20 | título de seção |
| `--text-title2` | 22 | título de card / modal |
| `--text-title1` | 28 | título de página |
| `--text-large` | 34 | KPI / saldo principal |
| `--text-xlarge` | 40 | saldo hero |

Pesos: `--weight-regular 400` · `--weight-medium 500` · `--weight-semibold 600`
· `--weight-bold 700` · `--weight-heavy 800`.
Leading: `--leading-tight 1.05` · `--leading-snug 1.25` · `--leading-normal 1.5`.

## Cores semânticas

| Token | Hex | Significado |
|---|---|---|
| `--green` | `#30D158` | entrada / positivo |
| `--red` | `#FF453A` | saída / negativo |
| `--blue` | `#0A84FF` | link / ação primária / foco |
| `--orange` | `#FF9F0A` | alerta / warning |
| `--purple` | `#BF5AF2` | premium / investimentos |
| `--teal` | `#5AC8FA` | info / PIX |
| `--indigo` | `#5E5CE6` | reservado |

> Azul **não** é a cor primária de botão. Ação primária = branco sobre preto;
> ação afirmativa = verde; destrutiva = vermelho.

## Superfícies

A elevação é feita pela **diferença de superfície**, não por borda nem sombra pesada.

| Token | Valor | Camada |
|---|---|---|
| `--surface-0` | `#000000` | página / fundo da tela |
| `--surface-1` | `#1C1C1E` | card principal |
| `--surface-2` | `#2C2C2E` | card dentro de card |
| `--surface-3` | `#3A3A3C` | input / controle |
| `--surface-hover` | `rgba(255,255,255,0.06)` | hover de lista |
| `--surface-press` | `rgba(255,255,255,0.10)` | press / active |

## Texto

| Token | Valor | Uso |
|---|---|---|
| `--text-primary` | `#FFFFFF` | títulos, valores, label ativo |
| `--text-secondary` | `rgba(255,255,255,0.60)` | meta, subtítulos |
| `--text-tertiary` | `rgba(255,255,255,0.35)` | placeholder, hint |
| `--text-quaternary` | `rgba(255,255,255,0.18)` | divisor textual |

## Separadores

| Token | Valor | Quando |
|---|---|---|
| `--separator` | `rgba(255,255,255,0.10)` | sobre backdrop blur |
| `--separator-opaque` | `#38383A` | sem blur (borda de input/botão) |

## Raio

| Token | px | Uso |
|---|---|---|
| `--radius-xs` | 6 | badge, chip pequeno |
| `--radius-sm` | 10 | botão inline, tag |
| `--radius-md` | 14 | botão primário, input |
| `--radius-lg` | 20 | card padrão |
| `--radius-xl` | 26 | card hero, modal sheet |
| `--radius-full` | 9999 | pill, avatar circular |

## Espaçamento — grade de 8 pt

`--space-1 4` · `--space-2 8` · `--space-3 12` · `--space-4 16` · `--space-5 20`
· `--space-6 24` · `--space-7 28` · `--space-8 32` · `--space-10 40`
· `--space-12 48` · `--space-16 64`.

Insets: `--inset-card 20px` (mínimo horizontal de card) · `--inset-screen 16px`
(margem lateral mobile).

## Elevação

```
--shadow-card   0 2px 8px rgba(0,0,0,.35), 0 0 1px rgba(0,0,0,.20)
--shadow-modal  0 16px 48px rgba(0,0,0,.60), 0 2px 12px rgba(0,0,0,.30)
```

## Ring de foco padrão

```css
focus-visible:ring-3 focus-visible:ring-[rgba(10,132,255,0.45)] focus-visible:ring-offset-0
```

Variantes destrutivas trocam o ring para `rgba(255,69,58,0.45)`.
