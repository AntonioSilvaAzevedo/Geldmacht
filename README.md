# 💰 Financeiro Pessoal — Sistema Web

Sistema web para controle financeiro pessoal que automatiza a importação de extratos bancários, categorização de transações e visualização de dashboards.

## 🎯 O Que É

Substitui uma planilha Excel complexa que consolida:

- 💼 Renda CLT + Renda PJ
- 💳 Fatura de cartão de crédito
- 🏦 Múltiplas contas (Nubank PF/PJ, Itaú, Mercado Pago)
- 📈 Carteira de investimentos B3 (Ações, FIIs, ETFs)
- 💵 Caixinhas e reservas

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router) + TailwindCSS + Recharts |
| Backend (Fase 2) | Python + FastAPI |
| Banco (Fase 2) | SQLite (MVP) → PostgreSQL (produção) |
| Parser PDF (Fase 2) | pdfplumber + regex específico por banco |
| Parser Excel (Fase 2) | openpyxl |

## 📋 Como Começar

Veja o roadmap em [`docs/ROADMAP.md`](docs/ROADMAP.md).

Antes de codar qualquer coisa, leia o [`CLAUDE.md`](CLAUDE.md) para entender o contexto do projeto.

## 📐 Fases do Projeto

1. **Fase 1 — Frontend com dados mockados** ([detalhes](docs/FASE-1-FRONTEND.md))
2. **Fase 2 — Backend e parsers de extratos** ([detalhes](docs/FASE-2-BACKEND.md))
3. **Fase 3 — Integração frontend + backend** ([detalhes](docs/FASE-3-INTEGRACAO.md))

## 📂 Estrutura

```
projeto-financeiro/
├── CLAUDE.md              # Contexto principal do projeto (LER PRIMEIRO)
├── README.md              # Este arquivo
├── docs/                  # Documentação por fase
│   ├── ROADMAP.md
│   ├── FASE-1-FRONTEND.md
│   ├── FASE-2-BACKEND.md
│   ├── FASE-3-INTEGRACAO.md
│   └── DADOS-MOCK.md      # Estrutura dos dados mockados para Fase 1
├── frontend/              # Código React
├── backend/               # Código Python (criado na Fase 2)
└── data/                  # PDFs e Excels de exemplo (extratos reais)
```
