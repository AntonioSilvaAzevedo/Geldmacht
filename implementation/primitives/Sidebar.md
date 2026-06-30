# Sidebar

> Navegação lateral fixa do app web. Sempre visível em desktop (220px).

- **Status:** ✅ implementado
- **Source:** `frontend/src/components/Layout/Sidebar.tsx`
- **Spec visual:** `ui/Sidebar Component.html`
- **Relacionados:** `Layout/MobileSidebarDrawer.tsx` (drawer mobile), `Layout/BottomTabBar.tsx` (tab bar mobile), `Layout/UserProfileMenu.tsx`

## Comportamento

- **Desktop:** `position: fixed`, largura **220px**, sempre visível. O `<main>`
  recebe a margem equivalente.
- **Mobile:** substituída por `BottomTabBar` + `MobileSidebarDrawer`.
- `"use client"` — usa `usePathname()` para marcar o item ativo.
- Ícones são SVG inline (sem dependência externa); cor ativa `#fff`, inativa
  `rgba(255,255,255,0.45)`, `strokeWidth 1.8`.

## Estrutura de navegação

Duas seções declaradas como arrays no topo do arquivo:

```ts
const NAV_PRINCIPAL = [
  { href: '/home', label: 'Início' },
  { href: '/home/carteira', label: 'Carteira' },
  { href: '/home/lancamentos/novo', label: 'Lançamentos' },
  { href: '/home/proventos', label: 'Proventos' },
]

const NAV_ANALISE = [
  { href: '/home/categorias', label: 'Categorias' },
  { href: '/home/configuracoes', label: 'Configurações' },
]
```

Cada item: `<Link href>` com `<NavIcon active={pathname === href} />` + label.
Para adicionar uma rota, inclua um objeto `{ href, label }` no array e um ícone
correspondente no mapa `icons` de `NavIcon`.

## Tokens / aparência

- Fundo `--surface-0`/`--surface-1`; item ativo realça texto e ícone para branco.
- Item inativo: `text-secondary`/45%, hover `--surface-hover`.
- Tipografia `--font-sans`, labels em `--text-subhead`.
- Cabeçalhos de seção (`PRINCIPAL`, `ANÁLISE`) em `--text-caption1` uppercase,
  `--text-tertiary`.

## Estado ativo

`usePathname()` compara a rota atual com `href`. Para rotas aninhadas
(ex.: `/home/lancamentos/novo` vs `/home/lancamentos`), use `startsWith`
quando o item deva permanecer ativo em sub-rotas.

## Acessibilidade

- Envolva em `<nav aria-label="Navegação principal">`.
- `<Link>` do Next entrega navegação por teclado nativa; marque o ativo com
  `aria-current="page"`.
