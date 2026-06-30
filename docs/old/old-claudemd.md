## Princípios fundamentais

Todo novo componente ou tela deve seguir estes princípios antes de qualquer coisa:

1. **Fundo preto verdadeiro** — usar `var(--surface-0)` (`#000000`) para backgrounds de página. Nunca navy, nunca cinza-azulado.
2. **Tipografia do sistema** — usar `var(--font-sans)` (-apple-system, SF Pro, Helvetica Neue). Sem importações externas de fontes sans-serif. **DM Mono** (`var(--font-mono)`, Google Fonts) apenas para valores numéricos e datas.
3. **Hierarquia por peso e tamanho** — não por cor. Usar as classes `.t-hero`, `.t-title1`, `.t-large-title`, `.t-title2`, `.t-title3`, `.t-body`, `.t-callout`, `.t-subhead`, `.t-footnote`, `.t-caption`, `.t-section-label` quando fizer sentido.
4. **Verde e vermelho semânticos:** `var(--green)` #30D158 → entradas / positivo; `var(--red)` #FF453A → saídas / negativo. Evitar azul como “cor primária” em valores monetários; investimentos / destaque secundário: `var(--purple)`.
5. **Cards elevados por superfície** — diferença entre `--surface-0`, `--surface-1`, `--surface-2`. Borda só sutil se necessário; sombra opcional `var(--shadow-card)`.
6. **Border radius generoso** — `var(--radius-lg)` (20px) para cards padrão, `var(--radius-xl)` (26px) para hero/modal. Evitar raio pequeno em cards “principais” (mínimo coerente: `var(--radius-sm)` 10px para chips).
7. **Espaçamento generoso** — grid de 8pt: `var(--space-4)` … `var(--space-8)`; inset mínimo de card `var(--inset-card)` (20px).

## Tokens disponíveis

### Superfícies (ordem de profundidade)

| Token | Uso |
|------|-----|
| `--surface-0` | Página / canvas (`--surface-bg` aponta aqui) |
| `--surface-1` | Card principal (`--surface-card`) |
| `--surface-2` | Painel aninhado, cabeçalhos densos (`--surface-panel`) |
| `--surface-3` | Inputs / controles |
| `--surface-hover` / `--surface-press` | Estados de linha / interação |

### Texto

`--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-quaternary`, `--text-link` (link = azul sistema).

### Separadores e bordas

`--separator`, `--separator-opaque`; aliases legados: `--border-subtle`, `--border-default`.

### Cores sistema

`--green`, `--red`, `--blue`, `--orange`, `--purple`, `--teal`, `--indigo`. Aliases legados (`--green-400`, `--navy-800`, etc.) foram remapeados em `globals.css` — prefira tokens Apple em código novo.

### Espaços e raios

`--space-1` … `--space-16`, `--radius-xs` … `--radius-full`, `--inset-screen`.

### Tipografia numérica

Classe `.t-numeric` + variantes `.val-positive` / `.val-negative` (espelho das antigas `.value-*`).

## Boas práticas de implementação

- Preferir **CSS variables** em `style={{}}` ou classes utilitárias Tailwind quando já mapeadas.
- **`AGENTS.md`** do frontend detalha rotas e API; **`CLAUDE.md`** (esta pasta) define **pilha visual**.
- Skill `frontend-design`: usar para polimento e acessibilidade **sem contradizer** superfície preta e tokens acima.

---

# Projeto Financeiro Pessoal — Antonio Carlos

## 🎯 Visão Geral

Sistema web para controle financeiro pessoal que **substitui uma planilha Excel complexa** que gerencio hoje. A planilha consolida CLT + PJ + Investimentos B3 + Cartão de Crédito + Caixinhas Mercado Pago.

O sistema deve **automatizar** o que hoje faço manualmente: importar extratos, categorizar transações, gerar visualizações e dashboards.

## 👤 Sobre o Usuário

- **Nome:** Antonio Carlos Silva de Azevedo
- **Localização:** Curitiba, PR
- **Renda CLT:** ~R$ 10.873/mês (Itaú → transferido para Nubank)
- **Renda PJ:** ~R$ 11.000/mês (DEZ Comunicação, contrato de Abr/2026 em diante)
- **CNPJ PJ:** 47.014.242/0001-06 (Antonio Carlos Silva de Azevedo Serviços ME)
- **Regime tributário:** Simples Nacional, Anexo III, CNAE 140201 (Assistência técnica), alíquota 6%
- **Vale Alimentação:** R$ 1.069,64/mês (iFood Benefícios)
- **Patrimônio investido B3:** ~R$ 99k (49 ativos: ações, FIIs, ETFs)

## 🏦 Bancos e Contas

| Conta | Banco | Uso |
|---|---|---|
| Nubank PF (4365066-8) | Nubank | Conta principal pessoa física |
| Itaú Uniclass (Ag 0502, Cta 079787-1) | Itaú | Recebe salário CLT (transferido para Nubank no mesmo dia) |
| Nubank PJ (43185640-8) | Nubank | Conta empresa, recebe honorários PJ |
| Mercado Pago (CPF) | Mercado Pago | Caixinhas: Aluguel, Próxima fatura, Saldo amor, FGTS-2026, Reserva |
| NuInvest (9084085) | Nubank | Conta de investimentos B3 |

## 💰 Estrutura PJ (Decidida)

- **Pró-labore:** salário mínimo (R$ 1.621) com 11% INSS = ~R$ 178/mês
- **Distribuição de Lucros:** restante, isento de IR (limite R$ 50k/mês está muito longe)
- **Transferência mensal PJ → PF:** R$ 10.000
- **Reserva PJ:** R$ 1.000-1.200/mês para cobrir DAS (~R$ 660), INSS (~R$ 178), contador (~R$ 200)

## 📂 Tipos de Documentos a Importar

### PDFs
1. **Extrato Nubank PF** — formato fixo, transações com data/descrição/valor
2. **Extrato Nubank PJ** — mesmo formato do PF
3. **Extrato Itaú Uniclass** — formato diferente
4. **Extrato Mercado Pago** — formato com caixinhas (descrição menciona "Dinheiro reservado" ou "Pix recebido/enviado")
5. **Fatura Cartão Nubank** — transações categorizáveis (Alimentação, Compras, etc.)
6. **NFS-e (Nota Fiscal de Serviço Eletrônica)** — emitida quando recebe da PJ

### Excel/CSV
1. **Posição B3** (`posicao-YYYY-MM-DD.xlsx`) — carteira atual: Ações, ETFs, FIIs com qtde e preço
2. **Movimentação B3** (`movimentacao-YYYY-MM-DD.xlsx`) — proventos (Rendimento, Dividendo, JCP) e operações
3. **Negociação B3** (`negociacao-YYYY-MM-DD.xlsx`) — compras e vendas oficiais (fonte da verdade para aportes)

## 🗂️ Estrutura de Categorização

### Entradas Reais (somam no Total Entradas)
- Salário CLT
- Honorários PJ (incluindo rescisão quando houver)
- FGTS (apenas quando houver entrada real da Caixa Econômica Federal)
- Vale Alimentação
- Cashback / Méliuz / créditos em conta (pequenos, mas reais)

### Movimentações de Contas (informativo, NÃO somam no total)
- Transferências Pix entre contas próprias
- Transferências para caixinhas Mercado Pago
- Resgates RDB / NuInvest
- Pix recebidos de terceiros (reembolsos, etc.)

### Gastos
- **Cartão de Crédito** (fatura mensal Nubank — geralmente o maior gasto)
- **Fixos / Moradia** — aluguel, condomínio, energia, gás, internet, seguro, IPVA, DAS, e qualquer compra no débito
- **Vale Alimentação** — gastos do iFood Benefícios

### Investimentos (separados em categorias)
- **Ações** (PETR4, BBAS3, KLBN4, etc. — 18 ativos)
- **FIIs** (HGLG11, GGRC11, BTLG11, etc. — 15 ativos)
- **ETFs** (IVVB11, NASD11)
- **Bitcoin** (categoria existe, mas Antonio ainda não compra)
- **Renda Fixa** (RDB Nubank — vem do extrato Nubank PF)

## 🔍 Regras de Negócio Importantes

1. **Salário CLT entra no Itaú e é imediatamente transferido ao Nubank no mesmo dia** — não duplicar como duas entradas.
2. **Pix entre contas próprias não é gasto nem entrada** — é movimentação interna.
3. **Caixinhas do Mercado Pago são "subcontas"** — movimentação entre caixinhas é interna, mas pagamento de boleto via caixinha (ex: Porto Seguro pago da caixinha "Aluguel") é gasto real.
4. **FGTS só conta como entrada se a transação for da CEF (Caixa Econômica Federal)** — retirada de caixinha "FGTS-2026" é resgate interno, não entrada nova.
5. **B3 mostra apenas COMPRAS no arquivo de Negociação** — extrato bancário pode mostrar débitos de liquidação que parecem operações duplicadas (D+2), mas é só liquidação contábil.
6. **NFS-e PJ mostra a alíquota correta do Simples** — usar para validar o DAS.

## 🎨 Modelo de Dados (alto nível)

```
User
  ├── Account (PF Nubank, PJ Nubank, Itaú, Mercado Pago, NuInvest)
  ├── Transaction
  │     ├── date, amount, description, raw_text
  │     ├── category (Salário, Aluguel, Supermercado, etc.)
  │     ├── account_id
  │     └── source (extrato_pdf, fatura_pdf, manual, etc.)
  ├── Investment
  │     ├── ticker, asset_type (Ação/FII/ETF), quantity, avg_price
  │     └── current_position
  ├── Trade (compras/vendas B3)
  ├── Dividend (proventos: Rendimento/Dividendo/JCP)
  └── Category (Alimentação, Moradia, Investimento, etc.)
```

## ✅ Status Atual

Hoje toda essa lógica está em uma **planilha Excel** (`Financas_Antonio_2026_v1.5.xlsx`) com as abas:
- 📊 Dashboard Anual (visão consolidada)
- 📅 Jan, Fev, Mar, Abr 2026 (uma por mês)
- 🧾 Transações Cartão (uma por mês)
- 📈 Investimentos
- 💼 Carteira B3 (com aportes mensais por categoria + tabela de proventos)
- 🏦 Conta Itaú Histórico
- 🏢 Conta PJ Serviços

A planilha funciona, mas demanda muito trabalho manual. O objetivo do sistema web é **automatizar** isso.

## 🎨 Diretrizes de Frontend

1. **UI:** obedecer a secção **«Frontend — Diretrizes Visuais (Apple Direction)»** no topo deste ficheiro (tokens em `src/app/globals.css`).
2. **Polimento / acessibilidade:** onde fizer sentido, usar a skill `frontend-design` (`SKILL.md`) — sem reintroduzir navy, DM Sans nem fundos cinza-azulados.


## 📚 Documentação Técnica

| Arquivo | Conteúdo |
|---|---|
| `docs/ROADMAP.md` | Visão geral das fases e status atual |
| `docs/CODEX.md` | **Referência técnica do codebase** — arquitetura, fluxos, decisões, comandos |
| `docs/FASE-3-INTEGRACAO.md` | Especificação da Fase 3 |
| `docs/PROGRESSO-FASE-3.md` | Acompanhamento da Fase 3 (etapa atual) |
| `docs/PROGRESSO-FASE-2.md` | Histórico da Fase 2 (concluída) |
| `docs/PROGRESSO-FASE-1.md` | Histórico da Fase 1 (concluída) |

Comece sempre lendo `docs/ROADMAP.md` + `docs/CODEX.md`.