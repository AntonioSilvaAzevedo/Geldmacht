# 🐍 Fase 2 — Backend e Parsers de Extratos

⚠️ **Iniciar somente após Fase 1 estar 100% concluída e funcionando.**

## 🎯 Objetivo

Construir uma API REST que **lê extratos bancários (PDFs e Excels) e os transforma em dados estruturados**, sem usar IA/LLMs.

A categorização será **baseada em regras determinísticas** — uma tabela de padrões que mapeia descrições para categorias (ex: "COPEL" → "Energia", "iFood" → "Alimentação").

---

## 🛠️ Stack

```
Python 3.11+
FastAPI                 # Framework web
Uvicorn                 # ASGI server
SQLAlchemy 2.0          # ORM
SQLite                  # Banco (MVP) — depois migrar pra PostgreSQL
Alembic                 # Migrations
pdfplumber              # Extração de PDF
openpyxl                # Excel
pydantic                # Validação de dados
python-multipart        # Upload de arquivos
pytest                  # Testes
```

---

## 📁 Estrutura

```
backend/
├── app/
│   ├── main.py                    # FastAPI entry
│   ├── config.py                  # Configurações
│   ├── database.py                # Conexão SQLite
│   ├── models/                    # SQLAlchemy models
│   │   ├── account.py
│   │   ├── transaction.py
│   │   ├── investment.py
│   │   └── category.py
│   ├── schemas/                   # Pydantic schemas
│   ├── api/                       # Endpoints REST
│   │   ├── accounts.py
│   │   ├── transactions.py
│   │   ├── investments.py
│   │   ├── upload.py
│   │   └── dashboard.py
│   ├── parsers/                   # 🔥 CORAÇÃO DO SISTEMA
│   │   ├── base.py                # Parser abstrato
│   │   ├── nubank_pf.py
│   │   ├── nubank_pj.py
│   │   ├── nubank_fatura.py
│   │   ├── itau.py
│   │   ├── mercado_pago.py
│   │   ├── b3_posicao.py
│   │   ├── b3_movimentacao.py
│   │   └── b3_negociacao.py
│   ├── categorization/
│   │   ├── rules.py               # Regras de categorização
│   │   └── categorizer.py
│   └── services/
│       ├── import_service.py      # Orquestra o import
│       └── reconcile_service.py   # Detecta duplicatas
├── tests/
│   ├── fixtures/                  # PDFs de exemplo
│   └── test_parsers/
├── alembic/                       # Migrations
├── requirements.txt
└── README.md
```

---

## 🔑 Conceito-Chave: Parsers Específicos por Banco

Cada banco tem seu próprio formato de PDF. A estratégia é criar uma **classe parser para cada um**, todas implementando uma interface comum:

```python
# app/parsers/base.py
from abc import ABC, abstractmethod

class BaseParser(ABC):
    """Interface comum para todos os parsers."""
    
    @abstractmethod
    def can_parse(self, file_content: bytes) -> bool:
        """Detecta se o arquivo pertence a este parser."""
        pass
    
    @abstractmethod
    def parse(self, file_content: bytes) -> list[dict]:
        """Extrai transações estruturadas."""
        pass

# app/parsers/nubank_pf.py
import pdfplumber
import re
from datetime import datetime

class NubankPFParser(BaseParser):
    
    def can_parse(self, file_content: bytes) -> bool:
        with pdfplumber.open(file_content) as pdf:
            text = pdf.pages[0].extract_text()
            return "Nubank" in text and "Conta" in text and "Agência 0001" in text
    
    def parse(self, file_content: bytes) -> list[dict]:
        transactions = []
        with pdfplumber.open(file_content) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                # Regex para identificar transações
                # Padrão Nubank: "DD MMM YYYY  Total de entradas/saídas + R$ X,XX"
                pattern = r'(\d{2} \w{3} \d{4})\s+(.*?)\s+([+-])?\s*R\$\s*([\d.,]+)'
                for match in re.finditer(pattern, text):
                    transactions.append({
                        'date': self._parse_date(match.group(1)),
                        'description': match.group(2).strip(),
                        'amount': self._parse_amount(match.group(4), match.group(3)),
                        'account': 'nubank_pf',
                        'raw_text': match.group(0)
                    })
        return transactions
```

---

## 🏷️ Sistema de Categorização (Sem IA)

Tabela de regras em `app/categorization/rules.py`:

```python
CATEGORIZATION_RULES = [
    # Moradia
    {"pattern": r"N N IMOVEIS|EDIFICIO HAYAT", "category": "Aluguel/Condomínio", "group": "Fixos/Moradia"},
    {"pattern": r"COPEL|BMB\*COPEL", "category": "Energia", "group": "Fixos/Moradia"},
    {"pattern": r"COMPAGAS|GASLOG", "category": "Gás", "group": "Fixos/Moradia"},
    {"pattern": r"LIGGA", "category": "Internet", "group": "Fixos/Moradia"},
    {"pattern": r"PORTO SEGURO", "category": "Seguro", "group": "Fixos/Moradia"},
    
    # Alimentação
    {"pattern": r"iFood|99Food|Zé Delivery", "category": "Delivery", "group": "Alimentação"},
    {"pattern": r"Mercadao de Carnes|Super Beal|Condor|Olivia Produtos", "category": "Supermercado", "group": "Alimentação"},
    {"pattern": r"Cioccolato|Baciodilatte|Picolosales", "category": "Sobremesas", "group": "Alimentação"},
    {"pattern": r"Bar Nacional|Saint Germain|Ippai Ramen|Mokaclube", "category": "Restaurante", "group": "Alimentação"},
    
    # Investimentos (extrato bancário mostra)
    {"pattern": r"Aplicação RDB", "category": "RDB", "group": "Investimentos"},
    {"pattern": r"Compra de Ações|Compra de FII|Compra de ETF", "category": "B3", "group": "Investimentos"},
    
    # Receitas
    {"pattern": r"Salário|Itaú Uniclass.*10.873|10.899|10.874", "category": "Salário CLT", "group": "Entradas"},
    {"pattern": r"DCEG|DEZ COMUNICACAO", "category": "Honorários PJ", "group": "Entradas"},
    {"pattern": r"CAIXA ECONOMICA FEDERAL", "category": "FGTS", "group": "Entradas"},
    
    # Movimentações próprias (NÃO contam como gasto/entrada)
    {"pattern": r"Antonio Carlos Silva.*MERCADO PAGO|Transferência enviada pelo Pix Antonio Carlos", "category": "Transferência Própria", "group": "Movimentações"},
    {"pattern": r"Resgate RDB", "category": "Resgate Renda Fixa", "group": "Movimentações"},
]

def categorize(description: str) -> tuple[str, str]:
    """Retorna (categoria, grupo) para uma descrição."""
    for rule in CATEGORIZATION_RULES:
        if re.search(rule["pattern"], description, re.IGNORECASE):
            return rule["category"], rule["group"]
    return "Outros", "Outros"
```

**Por que sem IA?** Porque suas transações se repetem (você compra nos mesmos lugares). Regras determinísticas pegam 95% dos casos. IA fica para a Fase 4.

---

## 🗂️ Divisão em Etapas

A Fase 2 é executada em **3 etapas sequenciais**. Validar cada uma antes de avançar.

| Etapa | Objetivo | Status |
|---|---|---|
| **2.1** | Backend + Parser Nubank PF funcionando | 🔴 Em andamento |
| **2.2** | Todos os parsers prontos | ⚫ Aguardando 2.1 |
| **2.3** | Tela de Upload + seleção de lançamentos | ⚫ Aguardando 2.2 |

**Marco da Etapa 2.1:** conseguir enviar o extrato Nubank PF e ver as transações extraídas no Postman ou terminal. Nada mais.

---

```python
# app/models/transaction.py
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False, index=True)
    description = Column(String(500), nullable=False)
    raw_description = Column(String(500))         # texto original do extrato
    amount = Column(Float, nullable=False)        # negativo = saída
    account_id = Column(Integer, ForeignKey("accounts.id"))
    category = Column(String(100))
    category_group = Column(String(50))           # Entradas, Cartão, Fixos, etc.
    source_file = Column(String(255))             # nome do arquivo importado
    imported_at = Column(DateTime, default=datetime.utcnow)
    is_internal_transfer = Column(Boolean, default=False)  # Pix entre contas próprias
    
    account = relationship("Account", back_populates="transactions")
```

---

## 🌐 Endpoints da API

```
POST /api/upload                  Upload de PDF/Excel
  → detecta tipo, chama parser, salva no banco
  → retorna lista de transações importadas

GET  /api/transactions            Lista com filtros
  ?month=2026-01
  ?category=Alimentação
  ?account=nubank_pf

GET  /api/dashboard/annual        Resumo anual (alimenta Dashboard)
GET  /api/dashboard/month/:mes    Resumo mensal

GET  /api/investments/portfolio   Carteira atual
GET  /api/investments/dividends   Proventos por mês
GET  /api/investments/trades      Negociações

PATCH /api/transactions/:id       Editar categoria manualmente
  (importante: ao mudar categoria, salvar regra para futuras importações)
```

---

## 🧪 Testes

Cada parser deve ter um teste com um PDF de exemplo real:

```
tests/
├── fixtures/
│   ├── nubank_pf_jan_2026.pdf
│   ├── nubank_pj_mar_2026.pdf
│   ├── itau_fev_2026.pdf
│   ├── mercado_pago_mar_2026.pdf
│   ├── fatura_nubank_jan_2026.pdf
│   └── b3_negociacao.xlsx
└── test_parsers/
    ├── test_nubank_pf.py
    ├── test_nubank_pj.py
    └── ...
```

Os PDFs estão em `data/` da pasta principal (extratos reais que o Antonio já tem).

---

## ✅ Checklist por Etapa

### Etapa 2.1 — Backend + Primeiro Parser (ATUAL 🔴)
- [ ] Estrutura `backend/` criada com FastAPI
- [ ] Ambiente virtual Python + `requirements.txt`
- [ ] Banco SQLite com schema via Alembic
- [ ] Endpoint `POST /api/upload` recebe arquivo
- [ ] **Parser Nubank PF** extrai transações corretamente
- [ ] Endpoint `GET /api/transactions` lista o resultado
- [ ] Categorização básica (mín. 20 regras)
- [ ] Teste com extrato real de Jan/2026
- [ ] ✅ Marco: ver transações no Postman/terminal

### Etapa 2.2 — Todos os Parsers (⚫ aguardando 2.1)
- [ ] Parser Nubank PJ
- [ ] Parser Itaú Uniclass
- [ ] Parser Mercado Pago
- [ ] Parser Fatura Cartão Nubank
- [ ] Parser B3 — Posição (`.xlsx`)
- [ ] Parser B3 — Movimentação (`.xlsx`)
- [ ] Parser B3 — Negociação (`.xlsx`)
- [ ] Detecção automática do tipo de arquivo
- [ ] Detecção de duplicatas
- [ ] Regras de categorização completas (mín. 50)
- [ ] Testes para todos os parsers com arquivos reais
- [ ] Documentação automática em `/docs` (FastAPI)
- [ ] ✅ Marco: todos os tipos de arquivo parseados corretamente

### Etapa 2.3 — Tela de Upload + Seleção de Lançamentos (⚫ aguardando 2.2)
- [ ] Tela `/upload` no frontend (drag-and-drop)
- [ ] Preview de lançamentos detectados com checkboxes
- [ ] "Selecionar todos" / "Desmarcar todos"
- [ ] Edição inline de categoria antes de confirmar
- [ ] Indicação visual de duplicatas
- [ ] Botão "Importar selecionados" salva apenas os marcados
- [ ] ✅ Marco: fluxo completo — upload → preview → selecionar → importar → ver no Dashboard

---

## 🚀 Por Onde Começar com o Claude Code (Etapa 2.1)

> "Leia o CLAUDE.md, docs/FASE-2-BACKEND.md e BACKLOG.md. Vamos iniciar a Etapa 2.1 da Fase 2. Crie a estrutura do backend Python na pasta `backend/` com FastAPI + SQLAlchemy + SQLite. Configure o ambiente virtual Python, o `requirements.txt`, e as migrations com Alembic. Em seguida, implemente o endpoint `POST /api/upload` e o Parser Nubank PF. Use os extratos PDF reais em `data/` como referência. O objetivo desta etapa é simples: enviar um extrato Nubank PF e ver as transações extraídas no terminal. Nada mais. Comece pela estrutura base e o parser, implemente um teste básico."

Valide a Etapa 2.1 antes de seguir para a 2.2. Itere um parser por vez.
