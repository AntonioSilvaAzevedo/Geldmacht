# Geldmacht — Documentação de Deploy e Infraestrutura

> **Criado em:** 2026-05-04
> **Autor:** Antonio Carlos
> ⚠️ Este arquivo contém credenciais — **não commitar em repositórios públicos**.

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUÇÃO                                │
│                                                                 │
│  ┌───────────────┐       ┌───────────────┐      ┌───────────┐  │
│  │   FRONTEND    │──────▶│   BACKEND     │─────▶│  BANCO    │  │
│  │   Next.js 15  │ HTTPS │   FastAPI     │ TCP  │ Supabase  │  │
│  │   Vercel      │       │   Railway     │      │ PostgreSQL│  │
│  └───────────────┘       └───────────────┘      └───────────┘  │
│  geldmacht.com           geldmacht-api-          Supabase Pool  │
│                          production.up.          port 6543      │
│                          railway.app                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## URLs de Produção

| Serviço | URL |
|---|---|
| **Frontend** | https://geldmacht.com |
| **Backend (Railway)** | https://geldmacht-api-production.up.railway.app |
| **Health Check** | https://geldmacht-api-production.up.railway.app/health |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/oufjouxtbpnafhvjdwig |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Railway Dashboard** | https://railway.app/dashboard |

---

## Repositórios GitHub

| Repo | URL |
|---|---|
| **Frontend** | https://github.com/AntonioSilvaAzevedo/Geldmacht |
| **Backend (API)** | https://github.com/AntonioSilvaAzevedo/geldmacht-api |

---

## Supabase (Banco de Dados PostgreSQL)

### Dados do projeto
| Campo | Valor |
|---|---|
| **Project ID** | `oufjouxtbpnafhvjdwig` |
| **Project URL** | `https://oufjouxtbpnafhvjdwig.supabase.co` |
| **Região** | `us-east-2` (AWS Ohio) |
| **Usuário DB** | `postgres` |
| **Senha DB** | `3nB+f)9sj\4:T1+LMCBe1` |
| **Publishable Key** | `sb_publishable_p_61MblHSRegW_PJtxmDgw_gsgd66UQ` |

### Connection Strings

#### ❌ URL Direta (NÃO USAR — DNS falha fora da infraestrutura Supabase)
```
postgresql://postgres:3nB+f)9sj\4:T1+LMCBe1@db.oufjouxtbpnafhvjdwig.supabase.co:5432/postgres
```

#### ✅ URL Pooler — Session Mode (porta 5432) — para uso geral
```
postgresql://postgres.oufjouxtbpnafhvjdwig:3nB%2Bf%299sj%5C4%3AT1%2BLMCBe1@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

#### ✅ URL Pooler — Transaction Mode (porta 6543) — usada no Railway e Alembic
```
postgresql://postgres.oufjouxtbpnafhvjdwig:3nB%2Bf%299sj%5C4%3AT1%2BLMCBe1@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

> **Nota:** A senha contém caracteres especiais (`+`, `)`, `\`, `:`).
> Na URL, a senha deve estar **URL-encoded**: `3nB%2Bf%299sj%5C4%3AT1%2BLMCBe1`
> Em variáveis de ambiente que aceitam o valor bruto (ex: Railway), use a senha URL-encoded.

### Como gerar a senha URL-encoded manualmente
```python
import urllib.parse
senha = '3nB+f)9sj\\4:T1+LMCBe1'
print(urllib.parse.quote(senha, safe=''))
# Resultado: 3nB%2Bf%299sj%5C4%3AT1%2BLMCBe1
```

---

## Railway (Backend — FastAPI)

### Serviço
| Campo | Valor |
|---|---|
| **Projeto** | `geldmacht-api` |
| **Serviço** | `geldmacht-api` |
| **URL pública** | `https://geldmacht-api-production.up.railway.app` |
| **Builder** | Nixpacks |
| **Região** | us-east (us-east4) |

### Variáveis de Ambiente (Railway → Variables)

```env
DATABASE_URL=postgresql://postgres.oufjouxtbpnafhvjdwig:3nB%2Bf%299sj%5C4%3AT1%2BLMCBe1@aws-1-us-east-2.pooler.supabase.com:6543/postgres
CORS_ORIGINS=https://geldmacht.com
```

### railway.toml
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

> **Importante:** O `startCommand` já roda `alembic upgrade head` antes de subir o servidor.
> Novas migrations são aplicadas automaticamente no próximo deploy.

---

## Vercel (Frontend — Next.js 15)

### Configuração no Dashboard Vercel
| Campo | Valor |
|---|---|
| **Repositório** | `AntonioSilvaAzevedo/Geldmacht` |
| **Root Directory** | `frontend` |
| **Framework** | Next.js |
| **Output Directory** | *(deixar vazio — padrão Next.js)* |

### Variáveis de Ambiente (Vercel → Settings → Environment Variables)

```env
NEXT_PUBLIC_API_URL=https://geldmacht-api-production.up.railway.app
```

> **Atenção:** `NEXT_PUBLIC_*` são embutidas no build (não runtime).
> Qualquer mudança exige novo deploy no Vercel.

### frontend/vercel.json
```json
{
  "framework": "nextjs"
}
```

### frontend/.env.production (commitado no repo)
```env
NEXT_PUBLIC_API_URL=https://geldmacht-api-production.up.railway.app
```

### frontend/.env.local (gitignored — apenas local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Migrations Alembic

### Migrations existentes
| Revisão | Nome |
|---|---|
| `f23f740ae5f2` | initial schema (accounts + transactions) |
| `1dcb12179e52` | add installment fields (parcelas) |

### Rodar migrations localmente apontando para produção (Supabase)
```bash
cd geldmacht-api
source venv/bin/activate

DATABASE_URL="postgresql://postgres.oufjouxtbpnafhvjdwig:3nB%2Bf%299sj%5C4%3AT1%2BLMCBe1@aws-1-us-east-2.pooler.supabase.com:6543/postgres" \
  alembic upgrade head
```

### Criar nova migration
```bash
cd geldmacht-api
source venv/bin/activate
alembic revision --autogenerate -m "descrição da mudança"
# Revisar o arquivo gerado em alembic/versions/
# Commitar e fazer push — Railway aplica automaticamente no próximo deploy
```

### Ver histórico de migrations
```bash
DATABASE_URL="..." alembic history --verbose
```

---

## Operações de Manutenção

### Verificar contagem de dados em produção
```bash
cd geldmacht-api && source venv/bin/activate
python3 -c "
from sqlalchemy import create_engine, text, pool
url = 'postgresql://postgres.oufjouxtbpnafhvjdwig:3nB%2Bf%299sj%5C4%3AT1%2BLMCBe1@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
engine = create_engine(url, poolclass=pool.NullPool)
with engine.connect() as conn:
    print('Transactions:', conn.execute(text('SELECT count(*) FROM transactions')).scalar())
    print('Accounts:', conn.execute(text('SELECT count(*) FROM accounts')).scalar())
"
```

### Limpar banco de produção (IRREVERSÍVEL)
```bash
cd geldmacht-api && source venv/bin/activate
python3 -c "
from sqlalchemy import create_engine, text, pool
url = 'postgresql://postgres.oufjouxtbpnafhvjdwig:3nB%2Bf%299sj%5C4%3AT1%2BLMCBe1@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
engine = create_engine(url, poolclass=pool.NullPool)
with engine.connect() as conn:
    conn.execute(text('TRUNCATE TABLE transactions, accounts RESTART IDENTITY CASCADE'))
    conn.commit()
    print('Banco limpo.')
"
```

Ou via **Supabase → SQL Editor**:
```sql
TRUNCATE TABLE transactions, accounts RESTART IDENTITY CASCADE;
```

---

## Estrutura de Arquivos Críticos

```
geldmacht-api/
├── app/
│   ├── config.py          ← lê DATABASE_URL e CORS_ORIGINS do ambiente
│   ├── database.py        ← cria engine SQLAlchemy (SQLite local / PostgreSQL prod)
│   ├── main.py            ← CORS middleware usa settings.cors_origins
│   ├── models/
│   │   ├── account.py
│   │   └── transaction.py
│   └── api/
│       ├── upload.py
│       ├── import_transactions.py
│       ├── transactions.py
│       └── dashboard.py
├── alembic/
│   ├── env.py             ← usa create_engine(settings.database_url) diretamente
│   └── versions/
│       ├── f23f740ae5f2_initial_schema.py
│       └── 1dcb12179e52_add_installment_fields.py
├── alembic.ini
└── railway.toml

geldmacht/frontend/
├── src/
│   ├── config/
│   │   └── env.ts         ← único ponto de leitura de NEXT_PUBLIC_API_URL
│   └── lib/
│       └── api.ts         ← todas as chamadas HTTP ao backend
├── .env.production        ← commitado, URL de prod
├── .env.local             ← gitignored, URL local
└── vercel.json
```

---

## Decisões de Arquitetura

| Decisão | Motivo |
|---|---|
| Pooler (porta 6543) em vez de conexão direta | `db.oufjouxtbpnafhvjdwig.supabase.co` não resolve DNS fora da infraestrutura Supabase |
| Senha URL-encoded na DATABASE_URL | Senha contém `+`, `)`, `\`, `:` — psycopg2 exige encoding na URL |
| `create_engine()` direto no `alembic/env.py` | `configparser` do Alembic interpola `%` — URL-encoded quebrava ao ler do `alembic.ini` |
| `NEXT_PUBLIC_API_URL` no Vercel Dashboard + `.env.production` | Build-time embedding exige que a variável exista na build; `.env.production` é fallback |
| `alembic upgrade head` no `startCommand` do Railway | Garante que migrations rodem automaticamente a cada deploy |
| Frontend separado do backend em repos distintos | Deploy independente; Vercel conecta só ao repo do frontend |

---

## Checklist de Deploy — Nova Feature

- [ ] Implementar no backend (geldmacht-api)
- [ ] Se mudou models: `alembic revision --autogenerate -m "descrição"`
- [ ] Revisar e commitar migration
- [ ] `git push` → Railway faz deploy automático + roda migration
- [ ] Implementar no frontend (geldmacht/frontend)
- [ ] `git push` → Vercel faz deploy automático
- [ ] Testar em produção: https://geldmacht.com

---

## Checklist de Deploy — Emergência / Rollback

### Railway (backend)
1. Acesse Railway → projeto → Deployments
2. Clique no deploy anterior → **"Rollback to this deploy"**

### Vercel (frontend)
1. Acesse Vercel → projeto → Deployments
2. Clique no deploy anterior → **"..."** → **"Promote to Production"**

---

*Última atualização: 2026-05-04*
