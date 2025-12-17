# 🚀 Quick Start - Deploy Completo (Frontend + AI)

## ⚡ Resumo Rápido

1. **Deploy Servidor Python AI** → Render (grátis)
2. **Configurar Vercel** → Adicionar variável de ambiente
3. **Testar** → Pronto!

---

## 📝 Passo a Passo

### 1. Deploy Servidor Python no Render

1. **Ir para:** https://render.com
2. **Criar conta** (pode usar GitHub)
3. **New +** → **Web Service**
4. **Conectar repositório** GitHub
5. **Configurar:**
   - **Name:** `sueca-ai`
   - **Root Directory:** `sueca-ai`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables:**
   - **ALLOWED_ORIGINS:** `https://frontend-mu-five-18.vercel.app`
7. **Create Web Service**
8. **Copiar URL** gerada (ex: `https://sueca-ai.onrender.com`)

### 2. Configurar Vercel

1. **Ir para:** Projeto no Vercel
2. **Settings** → **Environment Variables**
3. **Add:**
   - **Key:** `REACT_APP_AI_SERVICE_URL`
   - **Value:** `https://sueca-ai.onrender.com` (URL do Render)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
4. **Save**
5. **Deployments** → **Redeploy** último deployment

### 3. Testar

1. Abrir URL do Vercel em produção
2. Iniciar jogo
3. Verificar que AI funciona (usa serviço Python)

---

## ✅ Verificar

- **Render Dashboard:** Serviço "Running"
- **Vercel Dashboard:** Variável configurada
- **Jogo:** AI joga normalmente

---

**Guia completo:** Ver `docs/DEPLOY_AI_PRODUCTION.md`
