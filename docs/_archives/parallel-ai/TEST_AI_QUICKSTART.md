# 🚀 Quick Start - Testar AI Python

## ⚡ Início Rápido (2 minutos)

### 1. Terminal 1 - Servidor Python AI
```bash
cd sueca-ai
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

**Verificar:** Abrir `http://127.0.0.1:8000/health` no browser → deve mostrar `{"status": "ok"}`

### 2. Terminal 2 - Frontend React
```bash
cd frontend
npm start
```

### 3. Testar
- Abrir `http://localhost:3000`
- Iniciar um jogo
- A AI deve usar o serviço Python automaticamente

---

## ✅ Verificar se Funciona

**No terminal do servidor Python:** Deves ver requests POST quando a AI joga

**No console do browser (F12):** Sem erros de CORS ou conexão

**No jogo:** AI joga cartas normalmente (se servidor offline, usa fallback local)

---

## 🐛 Problemas Comuns

**CORS Error?** → Servidor já tem CORS configurado, reiniciar servidor

**Connection Refused?** → Verificar que servidor está na porta 8000

**AI não responde?** → Verificar logs do servidor Python

---

**Guia completo:** Ver `docs/TESTING_AI_INTEGRATION.md`
