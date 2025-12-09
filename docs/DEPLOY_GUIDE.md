# 🚀 Guia de Deploy - Como Partilhar o Jogo

Este guia explica como tornar o jogo Sueca acessível para outras pessoas jogarem online.

## 📋 Opções Disponíveis

### Opção 1: Deploy para Web (RECOMENDADO) ⭐
**Vantagens:**
- ✅ Gratuito
- ✅ Acesso permanente via URL
- ✅ Não precisa instalar nada
- ✅ Funciona em qualquer PC/telemóvel
- ✅ Atualizações automáticas

**Plataformas:**
- **Vercel** (Mais fácil) - Recomendado
- **Netlify** (Alternativa)

### Opção 2: Build Local e Partilhar
**Vantagens:**
- ✅ Não precisa de conta online
- ✅ Funciona offline

**Desvantagens:**
- ❌ Precisa enviar arquivos
- ❌ Não atualiza automaticamente

---

## 🌐 Opção 1: Deploy para Web (Vercel)

### Passo 1: Preparar o Projeto

1. **Garantir que o build funciona:**
   ```bash
   cd frontend
   npm run build
   ```
   
   Se funcionar, está pronto!

### Passo 2: Criar Conta no Vercel

1. Aceder a: https://vercel.com
2. Clicar em "Sign Up"
3. Fazer login com GitHub (recomendado) ou email

### Passo 3: Deploy via Vercel CLI (Mais Rápido)

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Fazer deploy:**
   ```bash
   cd frontend
   vercel
   ```

3. **Seguir as instruções:**
   - Pressionar Enter para confirmar
   - Escolher "Link to existing project" ou criar novo
   - Escolher "frontend" como diretório
   - Confirmar configurações

4. **Obter URL:**
   - Vercel vai dar uma URL tipo: `https://sueca-game.vercel.app`
   - Esta URL pode ser partilhada com qualquer pessoa!

### Passo 4: Deploy via GitHub (Automático)

1. **Criar repositório no GitHub:**
   - Ir a: https://github.com/new
   - Criar repositório (ex: "sueca-game")
   - Fazer push do código

2. **Conectar ao Vercel:**
   - Ir a: https://vercel.com/new
   - Importar repositório do GitHub
   - Configurar:
     - **Root Directory:** `frontend`
     - **Build Command:** `npm run build`
     - **Output Directory:** `build`
   - Clicar em "Deploy"

3. **Pronto!**
   - Cada push para GitHub faz deploy automático
   - URL permanente disponível

---

## 🌐 Opção 1b: Deploy para Web (Netlify)

### Via Netlify CLI:

1. **Instalar Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Fazer deploy:**
   ```bash
   cd frontend
   npm run build
   netlify deploy --prod --dir=build
   ```

3. **Seguir instruções e obter URL**

### Via Netlify Drag & Drop:

1. **Fazer build:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Ir a:** https://app.netlify.com/drop

3. **Arrastar a pasta `frontend/build`** para a página

4. **Obter URL** (tipo: `https://random-name-123.netlify.app`)

---

## 💾 Opção 2: Build Local e Partilhar

### Passo 1: Criar Build

```bash
cd frontend
npm run build
```

Isto cria a pasta `frontend/build` com todos os arquivos necessários.

### Passo 2: Comprimir e Partilhar

1. **Comprimir a pasta `build`:**
   - Windows: Clicar direito → "Send to" → "Compressed folder"
   - Criar ZIP da pasta `frontend/build`

2. **Partilhar:**
   - Enviar por email, Google Drive, Dropbox, etc.
   - Ou usar WeTransfer: https://wetransfer.com

### Passo 3: Instruções para o Amigo

O teu amigo precisa:

1. **Descomprimir o ZIP** recebido

2. **Abrir o arquivo `index.html`** no navegador
   - Pode fazer duplo-clique
   - Ou arrastar para o navegador

3. **Pronto!** O jogo funciona offline

**Nota:** Se o jogo não abrir corretamente, pode ser necessário usar um servidor local simples.

---

## 🔧 Solução: Servidor Local Simples (Para Build Local)

Se o `index.html` não funcionar diretamente, usar um servidor local:

### Windows (PowerShell):

```powershell
cd build
python -m http.server 8000
```

Depois abrir: `http://localhost:8000`

### Ou usar Node.js:

```bash
npx serve -s build -p 8000
```

---

## 📝 Resumo Rápido

### Para Deploy Rápido (Vercel):
```bash
cd frontend
npm install -g vercel
vercel
# Seguir instruções
# Partilhar URL recebida
```

### Para Build Local:
```bash
cd frontend
npm run build
# Comprimir pasta build
# Enviar para amigo
```

---

## ✅ Checklist Antes de Partilhar

- [ ] Build funciona sem erros (`npm run build`)
- [ ] Testar o jogo no build (`npx serve -s build`)
- [ ] Verificar que todas as imagens carregam
- [ ] Testar em diferentes navegadores (Chrome, Firefox, Edge)
- [ ] Verificar responsividade (mobile)

---

## 🆘 Problemas Comuns

### Build falha:
- Verificar que todas as dependências estão instaladas: `npm install`
- Verificar erros no console

### Imagens não aparecem:
- Verificar que pasta `assets` está em `frontend/public/assets`
- Rebuild: `npm run build`

### URL não funciona:
- Verificar que o deploy foi concluído
- Aguardar alguns minutos (primeiro deploy pode demorar)

---

## 🎯 Recomendação Final

**Para partilhar com amigos:** Use **Vercel** (Opção 1)
- Mais fácil
- URL permanente
- Sem necessidade de enviar arquivos
- Atualizações automáticas

**Para uso offline:** Use **Build Local** (Opção 2)
- Não precisa de internet
- Controle total

---

**Boa sorte! 🎮**

