# Spike #61 — Cumbuca Open Finance Data MCP

> **Tipo:** spike técnica/produto (investigação, sem código de produção).
> **Data:** 2026-06-18
> **Pergunta central:** o Cumbuca Open Finance Data MCP pode reduzir a dor de lançamento manual e importação de extrato/fatura no Geldmacht?
> **Recomendação:** **Aguardar maturidade para produção** · **Aprovado para protótipo local exploratório** (Caminho 3).

---

## 1. Resumo técnico

O **Open Finance Data MCP** da Cumbuca é um **servidor MCP** (Model Context Protocol) que permite a assistentes de IA acessarem dados bancários do usuário via Open Finance, com autorização do próprio usuário.

| Item | O que foi encontrado |
|---|---|
| **URL do servidor MCP** | `https://mcp.cumbuca.com/mcp` (setup em `cumbuca.com/MCP`) |
| **Protocolo** | MCP (JSON-RPC sobre HTTP) |
| **Autenticação** | OAuth com **Dynamic Client Registration (DCR)** + autorização Open Finance regulada pelo Banco Central. O usuário autoriza no **próprio banco** (biometria/senha bancária), **sem criar conta Cumbuca** e **sem compartilhar credenciais**. |
| **Clientes suportados** | ChatGPT, Claude Desktop, Claude.ai, Claude Code — qualquer cliente que fale MCP. |
| **Armazenamento** | "Os dados bancários que você consulta via MCP **não são armazenados** nos nossos servidores em nenhum momento." Consulta em tempo real. |
| **Preço** | Gratuito (R$ 0). |
| **Maturidade** | MVP lançado na Launch Week da Cumbuca (maio/2026). |

### Capacidades atuais (MVP)
- Extrato bancário de **1 conta, 1 banco**.
- Transações de **cartão de crédito** mencionadas como dado acessível (sem detalhamento de faturas estruturadas).
- **Rate limit ~5 consultas/dia.**
- Apenas contas do **próprio CPF (titular)**.
- "Em breve: múltiplas contas e bancos."

### Consentimento
- Consentimento **explícito** por conexão.
- **Revogável** a qualquer momento na página de gestão de consentimento ("sem fricção, sem ligação, sem fila").

---

## 2. Resumo de produto

### Dor que (potencialmente) resolve
- Elimina o **upload manual de OFX/PDF/CSV** ao trazer transações direto do banco via Open Finance.
- Reduz **lançamento manual** e re-trabalho de digitação.
- Permite **dados em tempo real** (sem esperar fechar fatura/extrato para exportar).

### Dor que **não** resolve (hoje)
- **Não substitui a revisão de lançamentos**: dados crus do Open Finance ainda precisariam de revisão/categorização antes de persistir no Geldmacht.
- **Não cobre faturas de cartão estruturadas** de forma clara — entidade central do Geldmacht.
- **Não resolve em escala**: rate limit ~5/dia e 1 conta/1 banco não sustentam um produto multi-conta.
- **Não é server-to-server pronto**: é pensado para o usuário conversar com uma IA, não para um app próprio sincronizar headless.

### O usuário final do Geldmacht
O produto, hoje, faz mais sentido para **uso pessoal via IA** (analisar gastos conversando) do que como **fonte de dados de um app de terceiros**. Para o Geldmacht, o valor real estaria em **transformar dados Open Finance em lançamentos estruturados** — o que depende de maturidade que o MVP ainda não tem.

---

## 3. Dados disponíveis (mapa)

| Dado | Disponível no MVP? | Observação |
|---|---|---|
| Extrato bancário | ✅ (1 conta/1 banco) | Foco do MVP. |
| Transações | ✅ | Via extrato; tempo real. |
| Cartão de crédito | ⚠️ parcial | Mencionado; sem detalhe de faturas. |
| Faturas | ❓ não confirmado | Não documentado claramente. |
| Saldos | ❓ não confirmado | Plausível via Open Finance, não confirmado na página. |
| Categorias | ❌ | Categorização fica a cargo do cliente de IA. |
| Múltiplas contas/bancos | ❌ (em breve) | Roadmap. |

> **Incerteza registrada:** as **tools/métodos exatos** expostos pelo servidor MCP **não estão documentados publicamente**. Só é possível conhecê-los conectando um cliente MCP e inspecionando (motivação do protótipo local).

---

## 4. Limitações encontradas

1. **Sem API REST/SDK** documentada para uso programático fora de cliente de IA — o contrato é o protocolo MCP + OAuth/DCR.
2. **Rate limit ~5 consultas/dia** (inviável para sincronização de produto).
3. **1 conta / 1 banco** por conexão.
4. **Somente titular (CPF próprio)**.
5. **Faturas de cartão** não claramente disponíveis.
6. **Tools do MCP não documentadas** publicamente.
7. **Produto em MVP** — escopo e limites devem mudar.

---

## 5. Riscos

### Técnicos
- Dependência de um protocolo (MCP) e de um fornecedor (Cumbuca) em estágio inicial.
- Fluxo OAuth/DCR + redirect de Open Finance é **interativo** — difícil para um backend consumir sem UI de consentimento própria.
- Contrato instável (MVP) → retrabalho.

### Privacidade / LGPD
- Hoje o Geldmacht **não armazena credencial bancária**. Integrar e **persistir** dados de Open Finance tornaria o Geldmacht **controlador de dado financeiro sensível**, exigindo base legal, consentimento próprio, política de retenção e tratamento explícito.
- **Nunca logar dados bancários**; em dev/local, **não versionar** tokens, CPF ou respostas com dados reais.

### Regulatório
- A Cumbuca é a participante regulada do Open Finance; o Geldmacht seria consumidor downstream. É preciso confirmar se o uso por um app de terceiros é permitido pelos termos da Cumbuca e pelas regras de Open Finance.

---

## 6. Mapa de fluxos de integração

### Caminho 1 — Backend direto (Geldmacht consome o MCP) — ❌ **não viável agora**
Bloqueado por: ausência de API REST/SDK, fluxo de consentimento interativo, rate limit e 1 conta/banco.

### Caminho 2 — Via cliente MCP + export estruturado — ⚠️ **paliativo**
Usuário consulta no ChatGPT/Claude e gera um CSV/JSON para importar no Geldmacht (fluxo de upload atual). Reduz pouco o trabalho e depende de copiar/colar — baixo valor.

### Caminho 3 — Protótipo local exploratório — ✅ **aprovado (sem produção)**
Conectar o **Claude Code** ao `https://mcp.cumbuca.com/mcp` apenas para **inspecionar as tools e o shape das respostas**, mapeando para as entidades atuais (`Transaction`, `Invoice`, `BankAccount`). Sem persistir dados, sem versionar respostas reais.

### Caminho 4 — Aguardar maturidade — ✅ **recomendado para produção**
Revisitar quando os gatilhos abaixo forem atendidos.

### Fluxo conceitual futuro (se aprovado um dia)
```txt
Conta bancária > Conectar Open Finance (consentimento) > Sincronizar dados >
Deduplicar contra o que já existe > Revisar lançamentos > Confirmar importação
```

---

## 7. Recomendação final

> **Produção: Aguardar maturidade.** **Exploração: Aprovado para protótipo local (Caminho 3).**

Justificativa (critérios da issue):
- **Valor para o usuário:** alto em potencial, baixo na entrega atual (MVP).
- **Esforço técnico:** alto (cliente MCP + OAuth/DCR + UI de consentimento + dedup + revisão).
- **Risco de segurança/privacidade:** alto se persistir dados sensíveis.
- **Risco regulatório:** a confirmar (termos Cumbuca + Open Finance para terceiros).
- **Clareza de documentação:** baixa (tools não documentadas).
- **Compatibilidade com a arquitetura atual:** parcial — exigiria nova camada de conexão/consentimento.
- **Dependência da Cumbuca:** alta (MVP).

### Gatilhos de revisita
- [ ] API REST/SDK pública (uso fora de cliente de IA).
- [ ] Múltiplas contas e bancos.
- [ ] Faturas de cartão estruturadas.
- [ ] Rate limit compatível com sincronização.
- [ ] Documentação das tools do MCP.
- [ ] Confirmação dos termos para uso por app de terceiros.

---

## 8. Próximas issues sugeridas

**Agora (baixo custo):**
1. **Protótipo local de leitura via Cumbuca MCP** — conectar Claude Code ao servidor, listar tools, capturar shape das respostas (anonimizado), mapear para `Transaction`/`Invoice`/`BankAccount`. Sem persistência, sem código de produção.

**Backlog condicional (somente após gatilhos de revisita):**
2. Mapeamento Open Finance → lançamentos do Geldmacht.
3. Fluxo de revisão de lançamentos vindos de Open Finance.
4. Deduplicação de lançamentos importados automaticamente.
5. Tela de consentimento/conexão Open Finance + status (conectado/expirado/erro).
6. Job de sincronização.
7. Logs seguros sem dados sensíveis + estratégia de revogação de consentimento.
8. Documentação de segurança e LGPD para dados financeiros.

---

## 9. `docs/fluxo.md`

Lido. **Não alterado** o fluxo de produção (esta spike não implementa nem muda fluxos existentes). O fluxo conceitual futuro está documentado na seção 6 acima; um ponteiro foi adicionado à seção "Pendências / pontos de atenção" do `docs/fluxo.md`.

---

## 10. Links consultados

- Página oficial (PT): https://www.cumbuca.com/launchweek/of-data-mcp/
- Página oficial (EN): https://www.cumbuca.com/en/launchweek/of-data-mcp/
- Product Hunt: https://www.producthunt.com/products/open-finance-mcp
- Status pages (Open Finance live): https://www.cumbuca.com/en/launchweek/status-pages/
- Juspay × Cumbuca (contexto Open Finance BR): https://fintechmagazine.com/news/juspay-and-cumbuca-unlocking-brazils-open-finance-apis
