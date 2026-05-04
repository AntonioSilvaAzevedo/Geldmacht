# 📦 Estrutura dos Dados Mockados (Fase 1)

Os JSONs em `frontend/src/data/` simulam o que viria do backend na Fase 3. Use os valores **reais de Jan-Abr/2026** que estão na planilha.

---

## 1. `monthlyData.json`

Resumo mensal consolidado — alimenta o Dashboard Anual.

```json
{
  "2026-01": {
    "month": "Janeiro",
    "year": 2026,
    "entradas": {
      "salarioCLT": 10899.00,
      "honorariosPJ": 7500.00,
      "fgts": 0,
      "valeAlimentacao": 1069.64,
      "cashback": 303.31
    },
    "gastos": {
      "faturaCartao": 12342.46,
      "fixosMoradia": 9635.38,
      "valeGasto": 1069.64
    },
    "investimentos": {
      "acoes": 220.76,
      "fiis": 1070.09,
      "etfs": 0,
      "bitcoin": 0,
      "rendaFixa": 0
    },
    "totalEntradas": 19771.95,
    "totalGastos": 23047.48,
    "totalInvestimentos": 1290.85,
    "saldoLiquido": -4566.38
  },
  "2026-02": { ... },
  "2026-03": { ... },
  "2026-04": { ... }
}
```

---

## 2. `transactions.json`

Lista de todas as transações (crédito + débito + cartão). Use uma estrutura plana para facilitar filtragem.

```json
[
  {
    "id": "tx-001",
    "date": "2026-01-05",
    "description": "Salário CLT — Itaú Uniclass",
    "amount": 10899.00,
    "type": "credito",
    "account": "itau",
    "category": "Salário",
    "categoryGroup": "Entradas"
  },
  {
    "id": "tx-002",
    "date": "2026-01-10",
    "description": "Aluguel — N N Imóveis",
    "amount": -3273.31,
    "type": "debito",
    "account": "nubank_pf",
    "category": "Aluguel",
    "categoryGroup": "Fixos/Moradia"
  },
  {
    "id": "tx-003",
    "date": "2026-01-15",
    "description": "iFood - NuPay",
    "amount": -168.99,
    "type": "credito_cartao",
    "account": "nubank_credito",
    "category": "Alimentação",
    "categoryGroup": "Cartão"
  }
]
```

**Categorias do `categoryGroup`:**
- `Entradas`
- `Fixos/Moradia`
- `Cartão`
- `Movimentações` (informativo)
- `Investimentos`

---

## 3. `creditCard.json`

Detalhe das faturas mensais.

```json
{
  "2026-01": {
    "month": "Janeiro 2026",
    "period": "04/DEZ a 04/JAN",
    "dueDate": "2026-01-11",
    "totalAmount": 12342.46,
    "minimumPayment": 1851.37,
    "transactions": [
      {
        "date": "2026-01-04",
        "description": "Mercado Livre",
        "amount": 348.25,
        "category": "Compras Online",
        "installment": "4/12"
      }
    ],
    "categorySummary": {
      "Alimentação": 1450.32,
      "Compras Online": 3200.45,
      "Vestuário": 890.10,
      "Supermercado": 2100.50
    }
  }
}
```

---

## 4. `investments.json`

Posição B3 e aportes mensais.

```json
{
  "lastUpdate": "2026-04-25",
  "account": "9084085",
  "broker": "NuInvest",
  "assets": [
    {
      "ticker": "PETR4",
      "name": "Petrobras",
      "type": "Ação",
      "subtype": "PN",
      "quantity": 244,
      "currentPrice": 48.31,
      "totalValue": 11787.64
    },
    {
      "ticker": "HGLG11",
      "name": "Pátria Logística",
      "type": "FII",
      "segment": "Logística",
      "quantity": 61,
      "currentPrice": 156.89,
      "totalValue": 9570.29
    }
  ],
  "totals": {
    "acoes": 60811.62,
    "fiis": 35819.17,
    "etfs": 2590.00,
    "bitcoin": 0,
    "patrimonio": 99220.79
  },
  "aportesMensais": {
    "2026-01": { "acoes": 220.76, "fiis": 1070.09, "etfs": 0, "rendaFixa": 0 },
    "2026-02": { "acoes": 0, "fiis": 582.68, "etfs": 1195.41, "rendaFixa": 4715.00 },
    "2026-03": { "acoes": 975.69, "fiis": 2054.20, "etfs": 1183.25, "rendaFixa": 4270.04 },
    "2026-04": { "acoes": 136.72, "fiis": 267.50, "etfs": 0, "rendaFixa": 0 }
  }
}
```

---

## 5. `dividends.json`

Proventos recebidos.

```json
{
  "2026-01": {
    "total": 551.01,
    "byType": {
      "Rendimento": 415.20,
      "Dividendo": 132.11,
      "JCP": 3.70
    },
    "transactions": [
      {
        "date": "2026-01-15",
        "ticker": "HGLG11",
        "type": "Rendimento",
        "quantity": 61,
        "value": 67.10
      }
    ]
  },
  "2026-02": { ... },
  "2026-03": { ... },
  "2026-04": { ... }
}
```

---

## 💡 Dica para Geração

Peça ao Claude Code:

> "Leia o CLAUDE.md e gere os 5 arquivos JSON mockados em `frontend/src/data/` seguindo a estrutura do `docs/DADOS-MOCK.md`. Use os valores reais de Jan-Abr/2026 documentados no CLAUDE.md."

Ele vai gerar os JSONs prontos para usar.
