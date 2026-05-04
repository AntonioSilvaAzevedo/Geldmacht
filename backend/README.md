# Geldmacht — Backend

API REST em Python/FastAPI para importação e extração de extratos financeiros.

## Stack

| Pacote | Versão | Uso |
|---|---|---|
| FastAPI | ≥ 0.111 | Framework web + docs automáticas |
| Uvicorn | ≥ 0.29 | ASGI server |
| SQLAlchemy 2 | ≥ 2.0 | ORM |
| SQLite | — | Banco de dados (MVP) |
| Alembic | ≥ 1.13 | Migrations |
| pdfplumber | ≥ 0.11 | Extração de texto de PDFs |
| openpyxl | ≥ 3.1 | Leitura de planilhas Excel (.xlsx) |
| Pydantic v2 | ≥ 2.7 | Validação de schemas |
| pytest | ≥ 8.0 | Testes |

## Como rodar

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head               # cria o banco SQLite
uvicorn app.main:app --reload --port 8000
```

Acesse:
- **API:** http://localhost:8000
- **Swagger (docs interativos):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Estrutura de pastas

```
backend/
├── app/
│   ├── main.py              # Entry point FastAPI + CORS + routers
│   ├── config.py            # Settings via pydantic-settings (.env)
│   ├── database.py          # Engine SQLite + SessionLocal + Base
│   ├── models/
│   │   ├── account.py       # Model Account (contas bancárias)
│   │   └── transaction.py   # Model Transaction (lançamentos)
│   ├── schemas/
│   │   └── transaction.py   # Schemas Pydantic (TransactionOut, UploadResponse, ...)
│   ├── api/
│   │   ├── upload.py        # POST /api/upload — recebe PDF, retorna preview
│   │   └── transactions.py  # GET /api/transactions — lista com filtros
│   ├── parsers/
│   │   ├── base.py          # Classe abstrata BaseParser
│   │   ├── nubank_pf.py     # ✅ Nubank PF — conta corrente PF (4365066-8)
│   │   ├── nubank_pj.py     # ✅ Nubank PJ — conta corrente PJ (43185640-8)
│   │   ├── itau.py          # ✅ Itaú Uniclass — conta corrente (079787-1)
│   │   ├── fatura_nubank.py # ✅ Fatura Cartão Nubank (crédito)
│   │   ├── mercadopago.py   # ✅ Mercado Pago — conta (83623266135)
│   │   └── __init__.py      # detect_parser() + ALL_PARSERS registry
│   └── categorization/
│       ├── rules.py         # OWN_ACCOUNTS + INTERNAL_ACCOUNT_HINTS
│       └── categorizer.py   # classify_transaction() — detecta transferências internas
├── tests/
│   ├── fixtures/
│   │   ├── nubank_pf_jan2026.pdf         # PDF sintético (formato real Nubank)
│   │   └── make_nubank_pf_fixture.py     # Gera o PDF de teste (requer fpdf2)
│   └── test_nubank_pf.py    # 26 testes — helpers, parser mockado e PDF sintético
├── alembic/                 # Migrations
├── alembic.ini
├── requirements.txt
├── .env.example
└── README.md
```

## Parsers disponíveis

| Parser | `account` | Arquivo suportado | Identificação automática |
|---|---|---|---|
| `NubankPFParser` | `nubank_pf` | Extrato PDF Nubank PF | `"4365066-8"` + `"agência 0001"` |
| `NubankPJParser` | `nubank_pj` | Extrato PDF Nubank PJ | `"43185640-8"` + `"agência 0001"` |
| `ItauParser` | `itau` | Extrato PDF Itaú Uniclass | `"079787-1"` + `"agência: 0502"` |
| `FaturaCartaoNubankParser` | `nubank_cartao` | Fatura PDF cartão Nubank | `"FATURA DD MMM YYYY EMISSÃO"` |
| `MercadoPagoParser` | `mercado_pago` | Extrato PDF Mercado Pago | `"83623266135"` + `"extrato de conta"` |

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/health` | Health check simples |
| `POST` | `/api/upload` | Enviar PDF → retorna preview de transações (sem salvar) |
| `POST` | `/api/import` | Confirmar importação — salva selecionados no banco |
| `GET` | `/api/transactions` | Listar transações salvas (com filtros) |

### POST /api/upload

Corpo: `multipart/form-data` com campo `file` (PDF).

Resposta:
```json
{
  "parser_used": "nubank_pf",
  "source_file": "extrato.pdf",
  "total_transactions": 93,
  "transactions": [
    {
      "date": "2026-03-05",
      "description": "Transferência recebida pelo Pix ANTONIO CARLOS...",
      "raw_description": "Transferência recebida pelo Pix ANTONIO CARLOS... 10.874,00",
      "amount": 10874.00,
      "account": "nubank_pf",
      "is_internal_transfer": false,
      "category": null,
      "category_group": null
    }
  ]
}
```

> **Nota:** `category` e `category_group` retornam `null` — a categorização é feita no frontend (Etapa 2.3). O backend detecta apenas `is_internal_transfer` (transferências entre contas próprias).

## Decisões de arquitetura

- **Sem categorização no backend:** para MVP, `category`/`category_group` são `null`. O frontend categoriza com base nas preferências do usuário. Evita acoplamento de regras pessoais no servidor.
- **`is_internal_transfer`:** detectado no backend porque é estrutural (baseado em números de conta próprios) e não muda com preferências do usuário.
- **Preview sem persistência:** `POST /api/upload` retorna os dados extraídos mas não salva no banco. A confirmação é feita separadamente via `POST /api/import`.
- **Deduplicação em `/api/import`:** duplicatas detectadas por (data + valor + raw_description + account_id). Transações já existentes são ignoradas e contadas em `skipped`.
- **Account auto-criada:** `POST /api/import` cria a conta bancária automaticamente se ainda não existir no banco, sem necessidade de cadastro prévio.

### POST /api/import

Corpo: JSON com `source_file`, `parser_used` e lista de `transactions` (as que o usuário marcou).

Resposta:
```json
{ "imported": 87, "skipped": 6 }
```

## Como adicionar um novo parser

1. Crie `app/parsers/meu_banco.py` herdando de `BaseParser`:
   ```python
   from .base import BaseParser

   class MeuBancoParser(BaseParser):
       ACCOUNT_KEY = "meu_banco"

       def can_parse(self, file_content: bytes) -> bool:
           # detecta se é este banco pelo conteúdo do PDF
           ...

       def parse(self, file_content: bytes) -> list[dict]:
           # extrai e retorna lista de dicts com os campos:
           # date, description, raw_description, amount, account,
           # is_internal_transfer, category (null), category_group (null)
           ...
   ```

2. Registre em `app/parsers/__init__.py`:
   ```python
   from .meu_banco import MeuBancoParser
   ALL_PARSERS = [..., MeuBancoParser()]
   ```

3. Crie testes em `tests/test_meu_banco.py`.

## Testes

```bash
source venv/bin/activate
pytest tests/ -v
```

Para gerar a fixture sintética do Nubank PF:
```bash
pip install fpdf2
python tests/fixtures/make_nubank_pf_fixture.py
```

## Dados reais

Coloque os extratos reais em `../data/` (ver `../data/README.md`).
Eles estão no `.gitignore` — nunca vão para o repositório.

Para testar com arquivo real via curl:
```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@../data/teste-1.pdf"
```

Ou use o Swagger em http://localhost:8000/docs.

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

```bash
cp .env.example .env
```

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./geldmacht.db` | URL do banco |
| `DEBUG` | `true` | Ativa logs SQL e debug |
