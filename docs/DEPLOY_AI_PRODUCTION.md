# 🚀 Deploy Completo - Frontend + AI Python em Produção

## 📋 Objetivo

Fazer deploy da aplicação completa:
- **Frontend React** → Vercel (já está)
- **Servidor Python AI** → Plataforma de backend (Render, Fly.io, Railway, etc.)
- **Conectar ambos** em produção

---

## 🎯 Opções para Deploy do Servidor Python

### Opção 1: Render (Recomendado - Grátis) ⭐

**Vantagens:**
- ✅ Tier gratuito disponível
- ✅ Fácil de configurar
- ✅ Auto-deploy do GitHub
- ✅ HTTPS automático

**Limitações:**
- ⚠️ Serviço "dorme" após 15min de inatividade (primeira request é lenta)
- ⚠️ Tier gratuito tem limites

### Opção 2: Fly.io

**Vantagens:**
- ✅ Sempre ativo (não dorme)
- ✅ Boa performance
- ✅ Fácil de configurar

**Limitações:**
- ⚠️ Pode ter custos (mas tem tier gratuito generoso)

### Opção 3: Railway

**Vantagens:**
- ✅ Muito fácil de usar
- ✅ Auto-deploy

**Limitações:**
- ⚠️ Tier gratuito limitado ($5 crédito/mês)

### Opção 4: Google Cloud Run / AWS Lambda

**Vantagens:**
- ✅ Escalável
- ✅ Pay-per-use

**Limitações:**
- ⚠️ Mais complexo de configurar
- ⚠️ Pode ter custos

**Recomendação:** **Render** para começar (grátis e fácil)

---

## 📝 Passo a Passo - Render (Recomendado)

### 1. Preparar Servidor Python para Produção

#### 1.1 Criar `Procfile` (para Render)

Criar ficheiro `sueca-ai/Procfile`:
```
web: uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

#### 1.2 Atualizar CORS para Produção

Editar `sueca-ai/api/main.py`:

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.schemas import PlayRequest, PlayResponse
from engine.movegen import legal_moves
from engine.heuristics import choose_card_simple
import os

app = FastAPI(title="Sueca AI Service", version="0.1.0")

# CORS - Permitir apenas origem do Vercel em produção
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"  # Dev defaults
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/play", response_model=PlayResponse)
def play(req: PlayRequest):
    legal = legal_moves(req.hand, req.trick, req.trump)
    if not legal:
        raise HTTPException(status_code=400, detail="No legal moves available")
    play, reason = choose_card_simple(req.hand, legal, req.trick, req.trump, req.history or [], req.played or [])
    return PlayResponse(play=play, reason=reason)

@app.options("/play")
def play_options():
    return {}
```

#### 1.3 Criar `runtime.txt` (opcional - especificar versão Python)

Criar ficheiro `sueca-ai/runtime.txt`:
```
python-3.11
```

### 2. Deploy no Render

#### 2.1 Criar Conta no Render
1. Ir para https://render.com
2. Criar conta (pode usar GitHub)
3. Conectar repositório GitHub

#### 2.2 Criar Novo Web Service
1. Clicar em "New +" → "Web Service"
2. Conectar repositório GitHub
3. Selecionar branch (ex: `main` ou `v2-main`)
4. Configurar:
   - **Name:** `sueca-ai` (ou nome que preferires)
   - **Root Directory:** `sueca-ai`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

#### 2.3 Configurar Variáveis de Ambiente
Na secção "Environment Variables":
- **ALLOWED_ORIGINS:** `https://frontend-mu-five-18.vercel.app,https://your-vercel-url.vercel.app`
  (Adicionar todas as URLs do Vercel onde o frontend está deployado)

#### 2.4 Deploy
1. Clicar em "Create Web Service"
2. Aguardar deploy (pode demorar 2-5 minutos)
3. Copiar URL gerada (ex: `https://sueca-ai.onrender.com`)

### 3. Configurar Frontend no Vercel

#### 3.1 Adicionar Variável de Ambiente
1. Ir para projeto no Vercel
2. Settings → Environment Variables
3. Adicionar:
   - **Key:** `REACT_APP_AI_SERVICE_URL`
   - **Value:** `https://sueca-ai.onrender.com` (URL do Render)
   - **Environment:** Production, Preview, Development

#### 3.2 Redeploy
1. Ir para Deployments
2. Clicar em "..." no último deployment
3. "Redeploy"

### 4. Testar em Produção

1. Abrir URL do Vercel em produção
2. Iniciar um jogo
3. Verificar que AI usa serviço Python:
   - Abrir DevTools (F12) → Network
   - Verificar requests para URL do Render
   - Verificar logs no Render dashboard

---

## 📝 Passo a Passo - Fly.io (Alternativa)

### 1. Instalar Fly CLI
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Ou baixar de: https://fly.io/docs/getting-started/installing-flyctl/
```

### 2. Login
```bash
fly auth login
```

### 3. Criar App
```bash
cd sueca-ai
fly launch
```

### 4. Configurar `fly.toml`
```toml
[app]
  name = "sueca-ai"

[build]

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[services]]
  http_checks = []
  internal_port = 8000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

    [[services.ports.tls_options]]
      alpn = ["http/1.1"]
      versions = ["TLSv1.2", "TLSv1.3"]

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

    [[services.ports.tls_options]]
      alpn = ["http/1.1"]
      versions = ["TLSv1.2", "TLSv1.3"]
```

### 5. Deploy
```bash
fly deploy
```

### 6. Configurar CORS
```bash
fly secrets set ALLOWED_ORIGINS="https://frontend-mu-five-18.vercel.app"
```

### 7. Obter URL
```bash
fly info
```

---

## 🔧 Configuração do Frontend

### Atualizar `aiClient.ts` (já está correto)

O código já suporta variável de ambiente:
```typescript
const DEFAULT_AI_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://127.0.0.1:8000';
```

### Verificar Build

O Vercel vai usar a variável `REACT_APP_AI_SERVICE_URL` automaticamente durante o build.

---

## ✅ Checklist de Deploy

### Servidor Python
- [ ] `Procfile` criado
- [ ] CORS configurado para produção
- [ ] Deploy no Render/Fly.io/Railway
- [ ] URL de produção obtida
- [ ] Endpoint `/health` testado
- [ ] Endpoint `/play` testado

### Frontend
- [ ] Variável `REACT_APP_AI_SERVICE_URL` configurada no Vercel
- [ ] Redeploy feito
- [ ] Testado em produção

### Integração
- [ ] Frontend consegue conectar ao servidor Python
- [ ] AI joga usando serviço Python
- [ ] Fallback funciona se servidor offline
- [ ] Sem erros de CORS

---

## 🐛 Troubleshooting Produção

### CORS Error em Produção

**Problema:** `Access to fetch blocked by CORS policy`

**Solução:**
1. Verificar `ALLOWED_ORIGINS` no Render inclui URL do Vercel
2. Verificar que URL está correta (com `https://`)
3. Reiniciar serviço no Render

### Servidor Não Responde

**Problema:** Timeout ou connection refused

**Soluções:**
1. Verificar que serviço está "Running" no Render
2. Verificar logs no Render dashboard
3. Testar endpoint `/health` diretamente
4. Verificar que porta está correta (`$PORT` no Render)

### Variável de Ambiente Não Funciona

**Problema:** Frontend ainda usa localhost

**Soluções:**
1. Verificar que variável está em "Production" no Vercel
2. Fazer redeploy (variáveis só aplicam em novo build)
3. Verificar nome da variável: `REACT_APP_AI_SERVICE_URL` (exato)
4. Verificar build logs no Vercel

---

## 📊 Monitorização

### Render Dashboard
- Ver logs em tempo real
- Ver métricas de uso
- Ver status do serviço

### Vercel Dashboard
- Ver logs de build
- Ver logs de runtime
- Ver métricas de performance

---

## 💰 Custos

### Render (Tier Gratuito)
- ✅ Grátis para sempre
- ⚠️ Serviço "dorme" após 15min
- ⚠️ Primeira request pode ser lenta (~30s)

### Fly.io (Tier Gratuito)
- ✅ $5 crédito/mês
- ✅ Sempre ativo
- ⚠️ Pode ter custos se exceder crédito

### Recomendação
- **Começar com Render** (grátis)
- **Migrar para Fly.io** se precisar de melhor performance

---

## 🚀 Próximos Passos

Após deploy bem-sucedido:

1. **Monitorizar performance**
2. **Otimizar heurísticas** da AI
3. **Adicionar logging** para análise
4. **Considerar cache** para reduzir latência

---

**Última atualização**: Dezembro 2025
