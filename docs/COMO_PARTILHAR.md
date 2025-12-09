# 🎮 Como Partilhar o Jogo com o Teu Amigo

## ⚡ Método Mais Rápido (5 minutos)

### Opção A: Deploy Online (RECOMENDADO) 🌐

**Vantagem:** O teu amigo só precisa de uma URL, funciona em qualquer PC/telemóvel!

#### Passos:

1. **Abrir PowerShell/Terminal na pasta do projeto**

2. **Instalar Vercel CLI:**
   ```
   npm install -g vercel
   ```

3. **Ir para a pasta frontend:**
   ```
   cd frontend
   ```

4. **Fazer deploy:**
   ```
   vercel
   ```

5. **Seguir as instruções:**
   - Pressionar Enter para confirmar
   - Escolher opções padrão
   - Vercel vai dar uma URL tipo: `https://sueca-game-xyz.vercel.app`

6. **Partilhar a URL com o teu amigo!**
   - Ele abre no navegador e pode jogar imediatamente
   - Não precisa instalar nada!

---

### Opção B: Build Local 💾

**Vantagem:** Funciona offline, não precisa de conta online

#### Passos:

1. **Abrir PowerShell/Terminal na pasta do projeto**

2. **Ir para frontend:**
   ```
   cd frontend
   ```

3. **Fazer build:**
   ```
   npm run build
   ```

4. **Comprimir a pasta `build`:**
   - Ir para `frontend/build`
   - Clicar direito → "Send to" → "Compressed (zipped) folder"
   - Criar ZIP

5. **Enviar o ZIP para o teu amigo:**
   - Email, Google Drive, WeTransfer, etc.

6. **Instruções para o amigo:**
   - Descomprimir o ZIP
   - Abrir a pasta `build`
   - Fazer duplo-clique em `index.html`
   - O jogo abre no navegador!

---

## 📋 Comparação

| Método | Tempo | Dificuldade | Atualizações | Internet Necessária |
|--------|-------|-------------|--------------|---------------------|
| **Deploy Online** | 5 min | ⭐ Fácil | Automáticas | Sim (só para aceder) |
| **Build Local** | 10 min | ⭐⭐ Médio | Manuais | Não (após download) |

---

## 🎯 Recomendação

**Para partilhar rapidamente:** Use **Deploy Online (Vercel)**
- Mais rápido
- URL permanente
- Atualizações automáticas
- Funciona em qualquer dispositivo

**Para uso offline:** Use **Build Local**
- Não precisa de internet depois de baixar
- Controle total

---

## 🆘 Precisa de Ajuda?

Ver ficheiros na pasta `docs/`:
- `docs/DEPLOY_GUIDE.md` - Guia completo e detalhado
- `docs/DEPLOY_QUICK.md` - Versão rápida

---

**Boa sorte! 🚀**

