# 📁 Pasta `data/`

Coloque aqui os extratos reais (PDFs e Excels) que serão usados como referência para desenvolver e testar os parsers na Fase 2.

## Arquivos sugeridos

```
data/
├── nubank_pf/
│   ├── NU_4365066_8_01JAN2026_31JAN2026.pdf
│   ├── NU_4365066_8_01FEV2026_28FEV2026.pdf
│   └── NU_4365066_8_01MAR2026_31MAR2026.pdf
├── nubank_pj/
│   └── NU_43185640_8_*.pdf
├── itau/
│   └── extrato_itau_*.pdf
├── mercado_pago/
│   └── MercadoPago_*.pdf
├── faturas_nubank/
│   └── Nubank_2026-*.pdf
└── b3/
    ├── posicao-2026-04-25.xlsx
    ├── movimentacao-2026-04-25.xlsx
    └── negociacao-2026-04-25.xlsx
```

## ⚠️ Importante

Os arquivos desta pasta **estão no .gitignore** — não vão para o GitHub. Contêm dados financeiros sensíveis.

Para os testes automatizados, use cópias **anonimizadas** (CPFs, valores ajustados) em `backend/tests/fixtures/`.
