# 🚀 Guia de Deploy

Este guia explica como fazer deploy do jogo Sueca para produção.

**Produção (SUECA 2.0):**
- Branch: `v2-main`
- Vercel **Root Directory**: `frontend`
- Deploy CLI: a partir da **raiz do repo** (`vercel --prod`)
- URL de produção: `https://frontend-mu-five-18.vercel.app`
- Para preview manual: `vercel` (na raiz do repo)
- Checklist pós-deploy: [RELEASE_CHECK.md](RELEASE_CHECK.md)

---

## ⚡ Deploy Rápido (5 Minutos)

### Método Mais Rápido: Vercel CLI

#### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

#### 2. Fazer Deploy
```bash
cd ~/projects/sueca   # raiz do repo (Root Directory na Vercel = frontend)
vercel
```

#### 3. Seguir Instruções
- Pressionar Enter para confirmar
- Escolher opções padrão
- Obter URL (ex: `https://sueca-game.vercel.app`)

#### 4. Partilhar URL
Enviar a URL para o teu amigo - ele pode jogar imediatamente!

---

## 🌐 Deploy Detalhado

### Opção 1: Vercel (Recomendado) ⭐

#### Passo 1: Preparar o Projeto

1. **Garantir que o build funciona:**
   ```bash
   cd frontend
   npm run build
   ```
   
   Se funcionar, está pronto!

#### Passo 2: Criar Conta no Vercel

1. Aceder a: https://vercel.com
2. Clicar em "Sign Up"
3. Fazer login com GitHub (recomendado) ou email

#### Passo 3: Deploy via Vercel CLI

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Fazer login:**
   ```bash
   vercel login
   ```

3. **Deploy de produção:**
   ```bash
   cd ~/projects/sueca
   vercel --prod
   ```

4. **Deploy de preview (teste):**
   ```bash
   cd ~/projects/sueca
   vercel
   ```

> **Nota:** Se correres `vercel` dentro de `frontend/` **e** o Root Directory na Vercel também for `frontend`, o caminho fica duplicado (`frontend/frontend`) e o deploy falha. Usa um dos dois: CLI na raiz **ou** Root Directory vazio com CLI em `frontend/`.

#### Passo 4: Configurar Variáveis de Ambiente (se necessário)

1. Ir ao dashboard do Vercel: https://vercel.com/dashboard
2. Selecionar o projeto
3. Settings → Environment Variables
4. Adicionar variáveis (ex: `REACT_APP_AI_SERVICE_URL`)

#### Passo 5: Verificar Deploy

- Aceder à URL fornecida
- Testar o jogo
- Verificar que todas as funcionalidades funcionam

---

### Opção 2: Netlify (Alternativa)

#### Método Drag & Drop (Mais Simples)

1. **Fazer Build:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Ir a:** https://app.netlify.com/drop

3. **Arrastar pasta `frontend/build`**

4. **Obter URL e partilhar!**

#### Método via Netlify CLI

1. **Instalar Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Fazer login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   cd frontend
   netlify deploy --prod --dir=build
   ```

---

## 🔧 Configuração do Projeto

### Ficheiro `vercel.json`

O projeto já inclui `frontend/vercel.json` com configuração:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Variáveis de Ambiente

Se precisares de variáveis de ambiente (ex: URL do serviço Python):

1. **Criar `.env` local (não commitar):**
   ```
   REACT_APP_AI_SERVICE_URL=http://localhost:8000
   ```

2. **Configurar no Vercel:**
   - Dashboard → Settings → Environment Variables
   - Adicionar para Production, Preview e Development

---

## 🐛 Troubleshooting

### Problema: Build falha

**Solução:**
- Verificar que todas as dependências estão instaladas: `npm install`
- Verificar erros no console: `npm run build`
- Verificar que não há erros de TypeScript

### Problema: Imagens não aparecem

**Solução:**
- Verificar caminhos relativos em `getCardImage()` (usa `frontend/public/assets/cards2/`)
- Garantir que imagens estão em `frontend/public/assets/cards2/` (52 PNGs, nomes `Rank_of_Suit.png`)
- Verificar que `PUBLIC_URL` está correto

### Problema: Path `frontend/frontend` does not exist

**Solução:**
- Na Vercel: Settings → General → Root Directory = `frontend`
- Correr `vercel --prod` a partir da **raiz** do repositório, não de `frontend/`

### Problema: Rotas não funcionam

**Solução:**
- Verificar `vercel.json` tem rewrites configurados
- Garantir que todas as rotas redirecionam para `index.html`

### Problema: Variáveis de ambiente não funcionam

**Solução:**
- Variáveis devem começar com `REACT_APP_`
- Fazer novo deploy após adicionar variáveis
- Verificar no dashboard do Vercel que estão configuradas

---

## 📋 Checklist de Deploy

Antes de fazer deploy:

- [ ] Build local funciona (`npm run build`)
- [ ] Não há erros no console
- [ ] Todas as imagens carregam
- [ ] Jogo funciona localmente
- [ ] Variáveis de ambiente configuradas (se necessário)
- [ ] `vercel.json` está correto

Após deploy:

- [ ] URL acessível
- [ ] Jogo carrega corretamente
- [ ] Todas as funcionalidades funcionam
- [ ] Testar em mobile (se aplicável)
- [ ] Partilhar URL

---

## 🔄 Atualizações

Para atualizar o deploy:

1. **Fazer alterações no código**
2. **Commit e push:**
   ```bash
   git add .
   git commit -m "Descrição das alterações"
   git push
   ```
3. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

Ou configurar deploy automático via GitHub (Vercel detecta pushes automaticamente).

---

**Pronto em 5 minutos! 🚀**

