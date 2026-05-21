# 🤖 Guia de Teste - Integração AI Python com App Sueca

## 📋 Pré-requisitos

1. **Python 3.8+** instalado
2. **Node.js** instalado (para o frontend)
3. **pip** instalado (geralmente vem com Python)

---

## 🚀 Passo a Passo para Testar

### 1. Instalar Dependências do Servidor Python

```bash
cd sueca-ai
pip install -r requirements.txt
```

**Dependências necessárias:**
- `fastapi==0.115.0`
- `uvicorn==0.23.2`
- `pydantic==2.9.2`

### 2. Iniciar o Servidor Python AI

#### Opção A: Usar o script batch (Windows)
```bash
# Na raiz do projeto
start-AI.bat
```

#### Opção B: Comando manual
```bash
cd sueca-ai
uvicorn api.main:app --reload --port 8000
```

**Verificar que está a funcionar:**
- Abrir browser em: `http://127.0.0.1:8000/docs`
- Deves ver a documentação Swagger da API
- Testar endpoint `/health`: `http://127.0.0.1:8000/health`
- Deve retornar: `{"status": "ok"}`

### 3. Iniciar o Frontend React

**Numa nova janela de terminal:**

```bash
cd frontend
npm start
```

O frontend vai abrir em `http://localhost:3000`

### 4. Testar a Integração

1. **Iniciar um jogo** no frontend
2. **Observar o comportamento:**
   - A AI deve usar o serviço Python quando disponível
   - Se o serviço não estiver disponível, usa a AI local (fallback)
   - Verificar no console do browser se há erros

### 5. Verificar Logs

**No terminal do servidor Python:**
- Deves ver requests POST para `/play`
- Cada request mostra o estado do jogo enviado

**No console do browser (F12):**
- Verificar se há erros de CORS
- Verificar se as requests estão a ser feitas

---

## 🔍 Como Verificar se Está a Funcionar

### Teste Manual do Endpoint

Podes testar o endpoint diretamente com `curl` ou Postman:

```bash
curl -X POST http://127.0.0.1:8000/play \
  -H "Content-Type: application/json" \
  -d '{
    "hand": ["AS", "KD", "5C", "2H"],
    "trick": ["2S", "3S"],
    "trump": "S",
    "played": ["7S", "AH"],
    "history": []
  }'
```

**Resposta esperada:**
```json
{
  "play": "AS",
  "reason": "heuristic"
}
```

### Verificar no Código

O frontend já tem fallback implementado em `GameBoard.tsx`:

```typescript
// Tenta serviço externo primeiro
let cardIndex = await tryExternal();
if (cardIndex < 0) {
  // Fallback para AI local
  cardIndex = game.chooseAICard(playerIndex);
}
```

---

## 🐛 Troubleshooting

### Problema: CORS Error

**Sintoma:** Erro no console: `Access to fetch at 'http://127.0.0.1:8000/play' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solução:** O servidor Python já tem CORS configurado para aceitar todas as origens em desenvolvimento. Se ainda assim der erro:
- Verificar que o servidor está a correr
- Verificar que está na porta 8000
- Reiniciar o servidor Python

### Problema: Connection Refused

**Sintoma:** `Failed to fetch` ou `ECONNREFUSED`

**Soluções:**
1. Verificar que o servidor Python está a correr
2. Verificar que está na porta 8000: `http://127.0.0.1:8000/health`
3. Verificar firewall (Windows pode bloquear porta 8000)

### Problema: AI não responde

**Sintoma:** Timeout ou resposta inválida

**Soluções:**
1. Verificar logs do servidor Python
2. Verificar formato dos dados enviados
3. Testar endpoint diretamente (curl/Postman)

### Problema: AI sempre usa fallback local

**Sintoma:** Nunca vês requests no servidor Python

**Soluções:**
1. Verificar variável de ambiente `REACT_APP_AI_SERVICE_URL`
2. Verificar que o servidor está acessível
3. Verificar console do browser para erros

---

## ⚙️ Configuração Avançada

### Mudar URL do Serviço AI

**Opção 1: Variável de ambiente (recomendado)**

Criar ficheiro `.env` em `frontend/`:
```
REACT_APP_AI_SERVICE_URL=http://127.0.0.1:8000
```

**Opção 2: Modificar código**

Editar `frontend/src/services/aiClient.ts`:
```typescript
const DEFAULT_AI_URL = 'http://127.0.0.1:8000'; // ou outra URL
```

### Mudar Porta do Servidor Python

```bash
uvicorn api.main:app --reload --port 8001
```

E atualizar `REACT_APP_AI_SERVICE_URL` para `http://127.0.0.1:8001`

---

## 📊 Estrutura de Dados

### Request (Frontend → Python)

```typescript
{
  hand: string[];      // ["AS", "KD", "5C"] - cartas na mão
  trick: string[];     // ["2S", "3S"] - cartas no trick atual
  trump: string;       // "S" - naipe trunfo (C, D, H, S)
  played?: string[];    // ["7S", "AH"] - cartas já jogadas (opcional)
  history?: string[][]; // [[...], [...]] - tricks anteriores (opcional)
}
```

### Response (Python → Frontend)

```typescript
{
  play: string;  // "AS" - carta a jogar
  reason: string; // "heuristic" - razão da decisão
}
```

### Formato de Cartas

- **Formato:** `{rank}{suit}`
- **Exemplos:** 
  - `"AS"` = Ace of Spades
  - `"KD"` = King of Diamonds
  - `"5C"` = 5 of Clubs
  - `"2H"` = 2 of Hearts

**Ranks:** `2`, `3`, `4`, `5`, `6`, `Q`, `J`, `K`, `7`, `A`  
**Suits:** `C` (clubs), `D` (diamonds), `H` (hearts), `S` (spades)

---

## ✅ Checklist de Teste

- [ ] Servidor Python inicia sem erros
- [ ] Endpoint `/health` retorna `{"status": "ok"}`
- [ ] Endpoint `/play` responde corretamente (teste manual)
- [ ] Frontend inicia sem erros
- [ ] Jogo inicia normalmente
- [ ] AI joga cartas (verificar se usa serviço Python)
- [ ] Logs do servidor Python mostram requests
- [ ] Fallback funciona se servidor estiver offline
- [ ] Sem erros no console do browser

---

## 🎯 Próximos Passos

Após confirmar que a integração funciona localmente:

1. **Deploy do Serviço Python** (Render, Fly.io, Railway, etc.)
2. **Configurar variável de ambiente** no Vercel
3. **Testar em produção**
4. **Melhorar heurísticas** da AI
5. **Adicionar logging** para análise

Ver `docs/AI_INTEGRATION_PLAN.md` para mais detalhes.

---

**Última atualização**: Dezembro 2025
