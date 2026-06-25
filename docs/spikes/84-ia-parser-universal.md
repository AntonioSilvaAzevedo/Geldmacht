# Spike #84 — IA para leitura universal de faturas e extratos

> **Tipo:** spike técnica/produto (investigação, sem código de produção).
> **Data:** 2026-06-25
> **Pergunta central:** vale a pena usar IA no back-end para transformar faturas/extratos de diferentes bancos em dados estruturados universais?
> **Recomendação:** **OFX como padrão do sistema (extrato + fatura)** · **CSV/Excel via parser universal determinístico** · **IA só como fallback para PDF/imagem/escaneado** · **Aprovado para protótipo dev local atrás de feature flag** · **Não ligar em produção sem nova issue de decisão.**

---

## 0. Padrões lidos e documentação consultada

- `CLAUDE.md` (raiz) e `frontend/CLAUDE.md` — lidos.
- `docs/FLUXO.md` — lido (ver seção 10 sobre atualização).
- Precedente: `docs/spikes/61-cumbuca-of-data-mcp.md` (mesma estrutura de entrega).
- Documentação oficial consultada (2026-06-25):
  - Claude — PDF support: https://platform.claude.com/docs/en/docs/build-with-claude/pdf-support
  - Claude — Pricing: https://platform.claude.com/docs/en/about-claude/pricing
  - OpenAI — Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
  - OpenAI — Data controls / retention: https://developers.openai.com/api/docs/guides/your-data
  - OpenAI — Pricing (referência): https://developers.openai.com/api/docs/pricing

---

## 1. Fluxo atual de importação (mapeamento)

```txt
Upload (POST /upload, app/api/upload.py)
> detecta tipo de arquivo
> roteia para parser correto
> retorna PREVIEW (não persiste)
> usuário revisa no front
> Confirmação (POST /import, app/api/import_transactions.py)
> dedup (sha256 do arquivo + duplicidade por transação) + commit
```

| Etapa | Onde | O que faz |
|---|---|---|
| Upload/preview | `app/api/upload.py` | Detecta PDF/Excel/OFX, chama parser, devolve `UploadResponse` (preview, nada salvo) |
| Detecção | `app/parsers/__init__.py` (`detect_parser`) | Itera `ALL_PARSERS`, usa o primeiro cujo `can_parse()` retorna `True` |
| Parsing | `app/parsers/*.py` | Cada parser implementa `BaseParser` (`can_parse` / `parse`) |
| Extrato OFX | `app/parsers/ofx_bank_statement.py` + `app/services/bank_statement_import.py` | Ramo dedicado `import_kind=bank_statement` |
| Persistência | `app/api/import_transactions.py` | Cria conta/fatura, dedup por hash e por transação, commit |
| Resumo da fatura | `app/services/summary_service.py` | `calculate_invoice_summary()` no preview de fatura |

### 1.1. Parsers/funções existentes

Registrados em `ALL_PARSERS` (ordem importa — específico antes de genérico):

| Parser | Classe | Conteúdo | Detecção |
|---|---|---|---|
| Nubank PJ | `NubankPJParser` | Extrato conta PJ | conta `43185640-8` |
| Nubank PF | `NubankPFParser` | Extrato conta PF | conta `4365066-8` |
| Fatura Nubank | `FaturaCartaoNubankParser` | Fatura cartão de crédito | cabeçalho "FATURA DD MMM YYYY" |
| Mercado Pago | `MercadoPagoParser` | Extrato conta | conta `83623266135` |
| Itaú | `ItauParser` | Extrato conta | conta `079787-1` |
| OFX genérico | `parse_bank_statement_ofx` (fora do registro) | Extrato bancário OFX | ramo `import_kind=bank_statement` |

### 1.2. Formatos suportados hoje

- **OFX/QFX** — parser **genérico/bank-agnostic** (`parse_bank_statement_ofx`): lê tags padrão OFX (`<STMTTRN>`, `<TRNAMT>`, `<DTPOSTED>`, `<NAME>`/`<MEMO>`, `<BANKACCTFROM>`), **sem número de banco/conta hardcoded**. Já importa **qualquer banco** que emita OFX, apenas para **extrato** (`import_kind=bank_statement`).
- **PDF** — via `pdfplumber` (extração de texto + regex por layout), apenas para os **5 bancos mapeados** (detecção por número de conta / cabeçalho).
- **Excel (.xlsx/.xls)** — **aceito no upload mas sem parser real**: `openpyxl` está nas dependências, porém **nenhum código usa `load_workbook`**; "planilha B3" aparece só no texto de erro. Na prática, **importar Excel não funciona** hoje.

**Não suportados hoje:** CSV, TXT, imagem (JPG/PNG), PDF escaneado / sem camada de texto, qualquer banco/layout PDF fora dos 5 mapeados, **OFX para fatura de cartão** (OFX só é roteado para extrato).

### 1.3. Limitações do modelo atual

- **1 parser hand-coded por banco/layout.** Custo linear de manutenção; cada novo banco é uma nova classe + regex.
- **Frágil a mudanças de layout.** O parser quebra silenciosamente se o banco muda o template do PDF.
- **Detecção acoplada a números de conta hardcoded** (ex.: `4365066-8`) — não generaliza para outros usuários/contas.
- **Sem fallback.** Se nenhum parser reconhece, retorna 422 e o usuário fica sem caminho.
- **PDF escaneado / imagem não funciona** (`pdfplumber` precisa de camada de texto).
- **Sem CSV/TXT**, formatos comuns de exportação de muitos bancos.

---

## 2. Viabilidade da IA

### 2.1. O que a IA resolve

- **Universalidade:** um caminho único interpreta layouts não mapeados sem novo código por banco.
- **Robustez a layout:** modelo lê o documento por significado, não por posição/regex.
- **Cobertura de formatos novos:** PDF escaneado, imagem e PDF nativo via visão; CSV/TXT como texto.
- **Sugestão de categoria** já no preview (campo `categorySuggestion`).

### 2.2. O que a IA NÃO resolve (e por isso o híbrido)

- **OFX/CSV já são estruturados** — parser determinístico é mais barato, exato e auditável. IA aqui é desperdício e risco.
- **Risco de alucinação** em valores/datas/parcelas → exige validação rígida + revisão humana (já temos a tela de revisão).
- **Dependência externa** (latência, indisponibilidade, custo por importação).

### 2.3. Capacidade técnica dos provedores (comparativo)

| Critério | Claude (Anthropic) | OpenAI |
|---|---|---|
| **PDF nativo** | Sim — `document` block (URL/base64/Files API). Cada página vira **texto + imagem**; entende tabelas/gráficos. Limite 32 MB / 600 págs (100 em modelos de 200k ctx). | Não há "PDF block" universal; envia-se **imagens das páginas** (visão) ou texto extraído. PDF via Files em alguns fluxos. |
| **PDF escaneado / imagem** | Coberto pela mesma capacidade de visão. | Coberto por visão (input de imagem). |
| **JSON rígido** | Tool use / output estruturado (validação no nosso lado obrigatória). | **Structured Outputs** com `response_format: json_schema, strict:true` — **garante** aderência ao schema (exige `additionalProperties:false` e todos os campos `required`). Vantagem real para schema rígido. |
| **Modelos atuais** | Haiku 4.5 / Sonnet 4.6 / Opus 4.8. | GPT-4o-mini / GPT-5.5 (e família 5.x). |
| **Retenção de dados** | Não treina em dados de API por padrão; retenção padrão ~30 dias; **PDF é elegível a Zero Data Retention (ZDR)**. | Não treina em dados de API por padrão (desde 2023); retenção padrão 30 dias; **ZDR** só sob aprovação/enterprise. |

**Leitura:** Claude tem o caminho de PDF mais direto e ZDR mais acessível para o feature de PDF; OpenAI tem a garantia de schema mais forte (`strict:true`). Para um parser financeiro, **as duas coisas importam** — por isso o protótipo deve medir ambos no mesmo conjunto de PDFs.

### 2.4. Correção importante de schema

A issue sugere **Zod**. O parsing universal vive no **back-end (`geldmacht-api`, Python)**, onde a API key precisa ficar. Logo a validação deve usar **Pydantic** (já é o padrão do projeto), não Zod. Zod só entraria se houvesse validação espelhada no front — o que **não** é recomendado, porque a API key e a validação canônica devem permanecer no servidor.

---

## 3. Arquitetura proposta (híbrida — OFX como padrão, IA só para PDF/imagem)

**Princípio:** formatos estruturados nunca precisam de IA. O **padrão do sistema é OFX** — para **extrato E fatura** (vários bancos emitem a fatura do cartão em OFX). IA entra **apenas** onde não há estrutura nem parser: PDF de banco desconhecido, imagem e PDF escaneado.

```txt
Upload de fatura/extrato
> roteamento por tipo:
    OFX (extrato OU fatura)  -> parser genérico determinístico  [PADRÃO do sistema]
    CSV / Excel              -> parser universal determinístico (heurística de colunas)
    PDF de banco conhecido   -> parser específico (como hoje)
    PDF desconhecido         -> IA (texto extraído + página como imagem)
    Imagem / PDF escaneado   -> IA (visão)
> (IA) retorna JSON padronizado
> Validação de schema (Pydantic) + reconciliações
> Preview na tela de revisão (humano valida)
> Confirmação
> Dedup (sha256 + por transação) + persistência
```

> **Por que OFX é o padrão e não precisa de IA:** OFX é um formato padronizado — todo banco emite as mesmas tags. O parser genérico já existe para extrato; estendê-lo para **fatura** é trabalho determinístico (ver issue própria na seção 10). CSV/Excel não são padronizados (colunas/ordem/data/decimal variam), mas ainda assim resolvem com **heurística determinística** + confirmação de colunas na revisão — sem IA.

- **Camada nova sugerida:** `app/services/ai_document_parser.py` (`AiDocumentParserService`) — isolada, atrás de feature flag, **chamada só quando o caminho determinístico falha ou o banco é desconhecido**.
- **Ponto de extensão:** dentro de `detect_parser` / `upload.py`, quando `parser is None`, em vez de 422 imediato, tentar IA (se habilitada).
- **Antes ou depois da extração de texto:** enviar **texto extraído (`pdfplumber`) + a página como imagem** para PDFs nativos; **só imagem** para escaneados/imagem. Texto barateia e melhora; imagem cobre o que o texto perde.
- **Síncrono x assíncrono:** **síncrono** para fatura/extrato típico (poucas páginas, ~5–20 s). **Assíncrono/fila** só se aparecerem documentos longos (muitas páginas) — não necessário na 1ª versão.
- **Storage temporário:** processar em memória; **não** persistir o arquivo bruto. Se precisar (Files API), limpar logo após a resposta.
- **OCR dedicado:** **não necessário** — a visão dos modelos já cobre escaneado. OCR externo (Tesseract) fica como possibilidade futura para reduzir custo, não para a 1ª versão.

---

## 4. Schema JSON proposto (retorno da IA)

```json
{
  "documentType": "credit_card_invoice | bank_statement",
  "bankName": "Nubank",
  "cardLastDigits": "1234",
  "invoiceMonth": "2026-01",
  "dueDate": "2026-02-05",
  "closingDate": "2026-01-25",
  "totalAmount": 1234.56,
  "currency": "BRL",
  "confidence": 0.0,
  "transactions": [
    {
      "date": "2026-01-10",
      "description": "Netflix",
      "amount": 39.90,
      "installment": { "current": 1, "total": 1 },
      "categorySuggestion": null
    }
  ]
}
```

- Validado no back-end com **Pydantic** (não Zod).
- `confidence` adicionado ao schema da issue para suportar estados de "baixa confiança" no front.
- Sinais de valor seguem a convenção atual dos parsers (saída negativa) na conversão para o modelo interno.

---

## 5. Estratégia de validação (obrigatória antes de persistir)

1. **Schema** (Pydantic, `strict`) — tipos, campos obrigatórios, enums.
2. **Datas** — formato `YYYY-MM-DD`, dentro do ciclo da fatura.
3. **Valores** — numéricos, moeda `BRL`.
4. **Reconciliação total x soma** — `sum(transactions) ≈ totalAmount` (tolerância pequena); divergência → marca como baixa confiança, **não** bloqueia, mas alerta na revisão.
5. **Parcelas** — `current <= total`, `total >= 1`.
6. **Destino** — `card_id`/`bank_account_id` válidos do usuário.
7. **Deduplicação** — reusar o que já existe: `sha256` do arquivo + duplicidade por transação (`find_duplicate_bank_statement_tx`).
8. **Revisão humana obrigatória** na 1ª versão — a tela de revisão atual continua sendo o ponto de validação.

---

## 6. Estratégia de fallback

- **IA é o fallback**, não o caminho primário: determinístico primeiro (OFX/CSV/Excel/bancos conhecidos).
- Se a IA **falhar/timeout/indisponível** → mensagem clara + opção de revisão manual; nunca persistir automaticamente.
- Se a **API key não estiver configurada** → o sistema funciona exatamente como hoje (parsers determinísticos), IA simplesmente desligada.
- Parsers atuais **permanecem** — não há remoção nesta nem na próxima fase.

---

## 7. Custo e latência

Premissas: fatura típica de cartão ~3–6 páginas. PDF Claude ≈ 1.500–3.000 tokens de texto/página + imagem/página. Estimativa por importação: **~30k tokens de input, ~3k de output** (JSON de ~50–100 lançamentos).

| Modelo | Input ($/MTok) | Output ($/MTok) | Custo/importação (~30k in + 3k out) |
|---|---|---|---|
| Claude Haiku 4.5 | 1 | 5 | **~US$ 0,045** (~R$ 0,25) |
| Claude Sonnet 4.6 | 3 | 15 | ~US$ 0,135 (~R$ 0,75) |
| Claude Opus 4.8 | 5 | 25 | ~US$ 0,225 |
| GPT-4o-mini | 0,15 | 0,60 | **~US$ 0,006** (~R$ 0,035) |
| GPT-5.5 | 5 | 30 | ~US$ 0,24 |

- **Custo escala com nº de páginas** (cada página = texto + imagem). Prompt caching e Batch API (−50%) reduzem em volume.
- **Latência:** ~5–20 s síncrono para poucas páginas — aceitável para o fluxo de upload→preview.
- **Recomendação de custo:** começar com **Haiku 4.5** ou **GPT-4o-mini**; escalar para Sonnet/GPT-5.5 só se a acurácia for insuficiente nos testes.
- **Timeout/abuso:** timeout explícito por request, limite de páginas, rate-limit por usuário, retry limitado.

---

## 8. Segurança, privacidade e LGPD

| Tema | Decisão |
|---|---|
| **Dados enviados** | Conteúdo financeiro do documento (descrições, valores, datas). Tratar como dado pessoal sensível (LGPD). |
| **Consentimento** | **Explícito** por importação inteligente — tela de consentimento antes de enviar a um provedor externo. |
| **Treinamento** | Ambos os provedores **não treinam** em dados de API por padrão. Exigir contratualmente. |
| **Retenção** | Buscar **ZDR**: nativo/elegível no PDF do Claude; sob aprovação no OpenAI. Sem ZDR, retenção padrão ~30 dias. |
| **API key** | **Somente back-end**, via variável de ambiente. Nunca no front, nunca versionada, nunca em log. Fallback quando ausente. |
| **Logs** | **Proibido** logar conteúdo financeiro. Logar apenas metadados não sensíveis (parser usado, nº de transações, status). |
| **Ambientes** | Separar dev/test/prod. **Não** enviar dados reais a provedor externo sem decisão explícita. Produção só após nova issue. |

---

## 9. Recomendação final

**Padronizar em OFX (extrato + fatura); IA como fallback só para PDF/imagem.** Concretamente:

1. **OFX é o padrão do sistema** — para extrato (já funciona) **e fatura** (estender, issue própria). Formato estruturado, bank-agnostic, exato, sem custo de IA.
2. **CSV/Excel** resolvem com **parser universal determinístico** (heurística de colunas) — também sem IA.
3. **Manter** os parsers determinísticos atuais. **A IA fica restrita a PDF de banco desconhecido, imagem e PDF escaneado** — onde não há estrutura nem parser.
4. **Criar protótipo dev-only** (`AiDocumentParserService`) atrás de feature flag, acionado só quando não há OFX/parser e o documento é PDF/imagem.
5. **Medir Claude (PDF nativo + ZDR) vs OpenAI (Structured Outputs `strict`)** no mesmo conjunto de PDFs sintéticos. Começar pelos modelos baratos (Haiku 4.5 / GPT-4o-mini).
6. **Validação rígida (Pydantic) + reconciliação total×soma + revisão humana** obrigatórias antes de persistir. Reusar dedup existente.
7. **API key só no back-end**, ZDR/sem-treino, consentimento explícito, sem logs sensíveis.
8. **Não ligar em produção** sem nova issue de decisão com resultados do protótipo.

**Por quê não "IA como parser principal" (Abordagem 2):** maior custo, dependência externa e risco sobre dados financeiros, sem ganho frente ao determinístico nos formatos já estruturados (OFX/CSV/Excel). **Por quê não "descartar":** o custo de manutenção 1-parser-por-banco não escala e bloqueia PDFs de bancos novos e escaneados — exatamente onde a IA agrega.

---

## 10. Próximas issues sugeridas

**Determinísticas (sem IA) — prioridade, padronizar OFX:**
1. **Permitir OFX para fatura de cartão** (OFX como padrão também na fatura): front aceitar `.ofx` no fluxo `type=credit_card`; `upload.py` rotear OFX para fatura (`credit_card_invoice` + `card_id`); `import_transactions.py` reconhecer txns OFX como fatura (hoje keyado em `nubank_cartao`/`faturacartaonubank`); **definir `due_month`** (confirmação do vencimento na revisão).
2. **Parser universal determinístico de CSV/Excel** (heurística de colunas: data/descrição/valor, separador decimal, linha de cabeçalho) + passo de confirmação de colunas na revisão. Implementa de fato o Excel (hoje só aceito, sem parser).

**IA (fallback para PDF/imagem) — só após as acima:**
3. Protótipo dev `AiDocumentParserService` (Claude + OpenAI, feature flag, sem produção), acionado só para PDF desconhecido / imagem / escaneado.
4. Schema Pydantic universal de fatura + de extrato (com `confidence`).
5. Conjunto de PDFs sintéticos de bancos diferentes para teste/medição.
6. Validação de reconciliação total×soma e parcelas.
7. Fallback determinístico → IA dentro do `upload.py`.
8. Tela de consentimento de "Importação inteligente" + estados (processando / baixa confiança / erro / sucesso).
9. Logs seguros sem dados sensíveis + métrica de custo/latência por importação.
10. (Futuro) pipeline assíncrono só se surgirem documentos longos.

---

## 11. `docs/fluxo.md`

Lido. **Atualizado**: adicionado ponteiro conceitual para o fluxo híbrido futuro de importação com IA (sem implementação — apenas marcação de proposta investigativa), apontando para este documento.

---

## 12. Links consultados

- Claude — PDF support: https://platform.claude.com/docs/en/docs/build-with-claude/pdf-support
- Claude — Pricing: https://platform.claude.com/docs/en/about-claude/pricing
- OpenAI — Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI — Data controls: https://developers.openai.com/api/docs/guides/your-data
- OpenAI — Pricing: https://developers.openai.com/api/docs/pricing
