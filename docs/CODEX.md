# CODEX — Documentação Técnica do Codebase

> Referência técnica viva do sistema Geldmacht.
> Atualizar sempre que uma decisão de arquitetura mudar ou um novo módulo for criado.

---

## Stack

| Camada | Tecnologia | Versão | Porta |
|---|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript | 15.2.x | 3000 |
| Estilo | TailwindCSS 4 + CSS Variables | 4.x | — |
| Backend | FastAPI + Uvicorn | 0.111+ | 8000 |
| ORM | SQLAlchemy 2 | 2.0+ | — |
| Banco | SQLite | — | — |
| Migrations | Alembic | 1.13+ | — |
| PDF parsing | pdfplumber | 0.11+ | — |
| Excel parsing | openpyxl | 3.1+ | — |
| Testes | pytest | 8.0+ | — |

---

## Estrutura de Pastas

```
geldmacht/
├── backend/
│   ├── app/
│   │   ├── main.py                  # Entry point FastAPI + CORS + routers
│   │   ├── config.py                # Settings via pydantic-settings (.env)
│   │   ├── database.py              # Engine SQLite + SessionLocal + Base
│   │   ├── api/
│   │   │   ├── upload.py            # POST /api/upload
│   │   │   ├── import_transactions.py  # POST /api/import
│   │   │   └── transactions.py      # GET /api/transactions
│   │   ├── parsers/
│   │   │   ├── __init__.py          # ALL_PARSERS + detect_parser()
│   │   │   ├── base.py              # BaseParser (classe abstrata)
│   │   │   ├── nubank_pf.py         # Extrato Nubank PF
│   │   │   ├── nubank_pj.py         # Extrato Nubank PJ (herda NubankPF)
│   │   │   ├── itau.py              # Extrato Itaú Uniclass
│   │   │   ├── fatura_nubank.py     # Fatura Cartão Nubank
│   │   │   └── mercadopago.py       # Extrato Mercado Pago
│   │   ├── categorization/
│   │   │   ├── rules.py             # OWN_ACCOUNTS + INTERNAL_ACCOUNT_HINTS
│   │   │   └── categorizer.py       # classify_transaction() → is_internal_transfer
│   │   ├── models/
│   │   │   ├── account.py           # Model Account
│   │   │   └── transaction.py       # Model Transaction
│   │   └── schemas/
│   │       └── transaction.py       # Pydantic schemas (ParsedTransaction, ImportRequest...)
│   ├── tests/
│   │   ├── fixtures/                # PDFs sintéticos para testes
│   │   └── test_nubank_pf.py        # 26 testes
│   ├── alembic/                     # Migrations
│   ├── geldmacht.db                 # SQLite (gitignored)
│   ├── .env                         # Variáveis locais (gitignored)
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── app/                     # Next.js App Router
│       │   ├── page.tsx             # Dashboard Anual (/)
│       │   ├── layout.tsx           # Layout raiz (Sidebar + Header)
│       │   ├── mes/[mes]/page.tsx   # Visão Mensal
│       │   ├── cartao/[mes]/page.tsx # Detalhe Fatura Cartão
│       │   ├── carteira/page.tsx    # Carteira B3
│       │   ├── proventos/page.tsx   # Proventos B3
│       │   └── upload/page.tsx      # Importar Extrato
│       ├── components/
│       │   ├── Layout/
│       │   │   ├── Sidebar.tsx      # Navegação lateral
│       │   │   └── Header.tsx       # Cabeçalho
│       │   ├── MonthSelector.tsx    # Chips de mês reutilizável
│       │   └── Upload/
│       │       └── UploadPreview.tsx # Tabela de preview + seleção
│       ├── hooks/
│       │   └── useFinancialData.ts  # ⚠️ ainda usa import() estático — migrar na Etapa 3.1
│       ├── lib/
│       │   ├── api.ts               # Funções fetch para o backend
│       │   └── formatters.ts        # formatCurrency, formatDate, etc.
│       ├── types/
│       │   └── financial.ts         # Tipos TypeScript dos datasets
│       └── data/
│           └── archive/             # JSONs mockados (referência de estrutura)
│               ├── monthlyData.json
│               ├── transactions.json
│               ├── creditCard.json
│               ├── investments.json
│               └── dividends.json
│
├── data/                            # PDFs reais (gitignored)
│   ├── teste-1.pdf                  # Nubank PF — mar/2026
│   ├── PJ.pdf                       # Nubank PJ — mar/2026
│   ├── MercadoPago.pdf              # Mercado Pago — mar/2026
│   ├── fatura.pdf                   # Fatura Cartão Nubank — mar/2026
│   └── Itau.pdf                     # Itaú Uniclass — jan-abr/2026
│
└── docs/
    ├── CODEX.md                     # este arquivo
    ├── ROADMAP.md
    ├── FASE-1-FRONTEND.md
    ├── FASE-2-BACKEND.md
    ├── FASE-3-INTEGRACAO.md
    ├── PROGRESSO-FASE-2.md
    └── PROGRESSO-FASE-3.md
```

---

## Backend — Fluxo de Dados

### Upload (preview sem persistência)

```
POST /api/upload (multipart/form-data)
  │
  ├── Valida extensão (.pdf / .xlsx)
  ├── detect_parser(bytes) → percorre ALL_PARSERS, chama can_parse()
  ├── parser.parse(bytes) → list[dict]
  └── Retorna UploadResponse { parser_used, source_file, total, transactions[] }
      └── transactions[].is_internal_transfer já calculado
          └── category / category_group = null (MVP: categorização no frontend)
```

### Import (persistência confirmada)

```
POST /api/import (JSON)
  │
  ├── Para cada transação:
  │   ├── _get_or_create_account(account_key) → Account (cria se não existe)
  │   ├── Verifica duplicata: date + amount + raw_description + account_id
  │   └── Se não duplicata → insere Transaction
  └── Retorna ImportResponse { imported: N, skipped: M }
```

### Deduplicação

Critério: `(date, amount, raw_description, account_id)` todos iguais → duplicata.
Reimportar o mesmo arquivo resulta em `imported: 0, skipped: N`.

---

## Backend — Parsers

### Arquitetura

Todos herdam de `BaseParser` (abstract):

```python
class BaseParser:
    ACCOUNT_KEY: str          # identificador da conta ("nubank_pf", "itau", etc.)

    def can_parse(self, file_content: bytes) -> bool: ...
    def parse(self, file_content: bytes) -> list[dict]: ...
```

### Registro e auto-detecção

```python
# app/parsers/__init__.py
ALL_PARSERS = [
    NubankPJParser(),           # DEVE vir antes do PF (mais específico)
    NubankPFParser(),
    FaturaCartaoNubankParser(),
    MercadoPagoParser(),
    ItauParser(),
]

def detect_parser(content: bytes) -> BaseParser | None:
    for parser in ALL_PARSERS:
        if parser.can_parse(content):
            return parser
    return None
```

**Ordem importa:** `NubankPJParser` antes de `NubankPFParser` porque ambos têm `"agência 0001"` no texto.

### Identificadores por parser

| Parser | `ACCOUNT_KEY` | Fingerprint do `can_parse` |
|---|---|---|
| `NubankPFParser` | `nubank_pf` | `"4365066-8"` + `"agência 0001"` |
| `NubankPJParser` | `nubank_pj` | `"43185640-8"` + `"agência 0001"` |
| `FaturaCartaoNubankParser` | `nubank_cartao` | `r"fatura \d{2} [a-z]{3} \d{4} emissão"` |
| `MercadoPagoParser` | `mercado_pago` | `"83623266135"` + `"extrato de conta"` |
| `ItauParser` | `itau` | `"079787-1"` + `"agência: 0502"` |

### Formato de saída de cada parser

```python
{
    "date": "YYYY-MM-DD",
    "description": str,           # descrição limpa
    "raw_description": str,       # linha original do PDF
    "amount": float,              # positivo = entrada, negativo = saída
    "account": str,               # ACCOUNT_KEY
    "is_internal_transfer": bool,
    "category": None,             # MVP: sempre null
    "category_group": None,       # MVP: sempre null
}
```

### Estratégias de parsing por banco

**Nubank PF/PJ** — máquina de estados linha a linha:
- Detecta linha de cabeçalho de dia (`"05 MAR"`)
- Lê descrição (pode ter continuação na linha seguinte)
- Regex no final da linha para extrair valor: `r"(-?\d{1,3}(?:\.\d{3})*,\d{2})$"`

**Itaú** — regex direto por linha:
- Formato: `DD/MM/YYYY descrição valor`
- `r"^(\d{2}/\d{2}/\d{4})\s+(.+?)\s+([-+]?\d{1,3}(?:\.\d{3})*,\d{2})$"`

**Fatura Nubank Cartão** — regex por linha:
- Formato: `DD MMM Descrição R$ X,XX`
- Ano extraído do cabeçalho `"FATURA DD MMM YYYY"`
- `−R$` (U+2212) = crédito (positivo); `R$` sem sinal = débito (negativo)

**Mercado Pago** — máquina de estados complexa:
- pdfplumber mescla 5 colunas, descrição particionada em 3 partes
- `pending_pre[]` acumula linhas antes da linha de dados
- `expect_suffix` = True só quando não há descrição inline
- Linha de dados: `DD-MM-YYYY [desc_inline] ID R$ valor R$ saldo`

### Detecção de transferências internas

```python
# app/categorization/rules.py
INTERNAL_ACCOUNT_HINTS = [
    "43185640-8",   # nubank pj
    "079787-1",     # itaú
    "mercado pago",
    "nuinvest",
    "9084085",
]

INTERNAL_TRANSFER_PATTERNS = [
    r"resgate\s+rdb",
    r"aplica[çc][aã]o\s+rdb",
    r"dinheiro\s+reservado",
    r"dinheiro\s+retirado",
    r"transfer[eê]ncia\s+entre\s+contas",
    r"poupan[çc]a\s+programada",
]
```

**Por que não inclui o nome do titular nem `"4365066-8"`:**
- Nome do titular aparece como remetente em TODOS os Pix enviados → falso positivo massivo
- `"4365066-8"` aparece em linhas de continuação de saídas da própria conta → FIIs comprados via NuInvest seriam marcados como internos

---

## Backend — Banco de Dados

### Schema

```sql
-- accounts
id          INTEGER PRIMARY KEY
name        TEXT        -- "Nubank PF", "Itaú Uniclass", etc.
type        TEXT        -- "nubank_pf", "itau", etc. (chave de busca)
bank        TEXT        -- "Nubank", "Itaú", etc.
account_number TEXT

-- transactions
id                  INTEGER PRIMARY KEY
date                DATE
description         TEXT(500)
raw_description     TEXT(500)   -- texto original do extrato
amount              FLOAT       -- negativo = saída
account_id          INTEGER FK → accounts.id
category            TEXT(100)   -- null no MVP
category_group      TEXT(50)    -- null no MVP
source_file         TEXT(255)   -- nome do PDF importado
imported_at         DATETIME    -- timestamp da importação
is_internal_transfer BOOLEAN
```

### Estado atual do banco (após Etapa 3.0)

| Conta (`type`) | Transações |
|---|---|
| `nubank_cartao` | 104 |
| `nubank_pf` | 71 |
| `mercado_pago` | 22 |
| `itau` | 20 |
| `nubank_pj` | 4 |
| **Total** | **221** |

Range de datas: **2026-02-04 a 2026-04-29**

---

## Frontend — Arquitetura de Dados

### Estado atual (⚠️ quebrado — Etapa 3.1 pendente)

```
Tela → useFinancialData(dataset) → import('@/data/*.json') → ARQUIVO NÃO EXISTE
```

Os JSONs foram movidos para `src/data/archive/`. O hook `useFinancialData` ainda
faz `import()` estático que o webpack tenta resolver em tempo de build/dev.

### Estado alvo (Etapa 3.1)

```
Tela → useFinancialData(dataset) → fetch('http://localhost:8000/api/...') → SQLite
```

**O ponto de extensão já está preparado** — só o conteúdo de `datasetLoaders` muda:

```ts
// src/hooks/useFinancialData.ts
// ANTES (Fase 1):
const datasetLoaders = {
  monthly: () => import('@/data/monthlyData.json').then(m => m.default),
  ...
}

// DEPOIS (Fase 3):
const datasetLoaders = {
  monthly: () => fetch(`${API_BASE}/api/dashboard/monthly`).then(r => r.json()),
  ...
}
```

Nenhuma tela precisa mudar — apenas o hook.

### Camada de API (`src/lib/api.ts`)

Funções disponíveis:

| Função | Método | Rota | Descrição |
|---|---|---|---|
| `uploadFile(file)` | POST | `/api/upload` | Preview sem salvar |
| `importTransactions(payload)` | POST | `/api/import` | Salva selecionados |
| `getTransactions(filters)` | GET | `/api/transactions` | Lista com filtros |
| `checkHealth()` | GET | `/health` | Verifica conectividade |

### Tipos TypeScript (`src/types/financial.ts`)

Tipos dos datasets mockados — servem como contrato para os endpoints da Etapa 3.1:

- `MonthlyData` → `Record<string, MonthData>` — Dashboard Anual
- `Transactions` → `Transaction[]` — lista de transações
- `CreditCardData` → `Record<string, CreditCardMonth>` — fatura por mês
- `InvestmentsData` → assets + totals + aportesMensais
- `DividendsData` → `Record<string, DividendMonth>` — proventos por mês

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

```env
DATABASE_URL=sqlite:///./geldmacht.db
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
APP_NAME=Geldmacht API
DEBUG=true
```

Em produção (Railway), `DATABASE_URL` aponta para Supabase PostgreSQL e `CORS_ORIGINS` para `https://geldmacht.com`.
Ver `backend/.env.example` para referência completa.

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Em produção (Vercel), `NEXT_PUBLIC_API_URL` não é necessário — o `vercel.json` reescreve `/api/*` diretamente para o Railway.
Ver `frontend/.env.example` para referência completa.

---

## Endpoints da API

| Método | Rota | Status | Descrição |
|---|---|---|---|
| GET | `/` | ✅ | Health check com versão |
| GET | `/health` | ✅ | Health check simples |
| POST | `/api/upload` | ✅ | Extrai transações do PDF (sem salvar) |
| POST | `/api/import` | ✅ | Salva transações selecionadas no banco |
| GET | `/api/transactions` | ✅ | Lista transações (filtros: month, category, account) |
| GET | `/api/dashboard/monthly` | ⚫ | Agregação mensal para Dashboard (Etapa 3.1) |
| GET | `/api/dashboard/cartao` | ⚫ | Dados da fatura por mês (Etapa 3.1) |

Docs interativas: http://localhost:8000/docs

---

## Decisões de Arquitetura

### Categorização no frontend (não no backend)
MVP: `category` e `category_group` sempre `null` na API. O frontend aplicará regras de
categorização configuráveis pelo usuário (Etapa 3.2). Evita acoplamento de preferências
pessoais no servidor.

### `is_internal_transfer` no backend
Detecção estrutural (baseada em números de conta e padrões como "Dinheiro reservado") —
não é preferência do usuário, não muda. Correto ficar no backend.

### Preview separado do import
`POST /api/upload` retorna dados sem persistir. `POST /api/import` persiste o que o
usuário confirmou. Permite seleção individual, edição de categoria e descarte de
transferências internas antes de salvar.

### NubankPJParser herda NubankPFParser
Formato dos PDFs é idêntico — só muda `ACCOUNT_KEY` e `_IDENTIFIERS`. Herança evita
duplicação de ~200 linhas de código.

### `INTERNAL_ACCOUNT_HINTS` ≠ `OWN_ACCOUNTS`
`OWN_ACCOUNTS` inclui o nome do titular e o número da própria conta corrente.
`INTERNAL_ACCOUNT_HINTS` inclui apenas os identificadores das **outras** contas
(contrapartes reais de uma transferência interna). Ver detalhes na seção de parsers.

---

## Como Adicionar um Novo Parser

1. Criar `backend/app/parsers/meu_banco.py` herdando `BaseParser`
2. Implementar `can_parse()` com fingerprint único do PDF
3. Implementar `parse()` retornando `list[dict]` no formato padrão
4. Registrar em `ALL_PARSERS` (mais específico → menos específico)
5. Criar testes em `tests/test_meu_banco.py`

---

## Testes

```bash
cd backend
source venv/bin/activate
pytest tests/ -v          # 26 testes passando
```

Testes isolam o pdfplumber via `unittest.mock.patch` — não dependem de PDFs reais para rodar em CI.

---

## Comandos Úteis

```bash
# Backend
cd backend && source venv/bin/activate
uvicorn app.main:app --reload --port 8000   # dev
alembic upgrade head                         # criar/migrar banco
alembic revision --autogenerate -m "desc"   # nova migration
pytest tests/ -v                             # testes
sqlite3 geldmacht.db "SELECT COUNT(*) FROM transactions;"  # checar banco

# ⚠️ ZERAR O BANCO (apaga todos os dados e recria o schema)
rm backend/geldmacht.db && cd backend && source venv/bin/activate && alembic upgrade head

# Frontend
cd frontend
npm run dev       # dev (porta 3000)
npm run build     # build de produção
npx tsc --noEmit  # checar TypeScript sem build
```
