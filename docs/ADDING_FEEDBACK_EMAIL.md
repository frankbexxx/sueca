# Como Adicionar Email de Feedback no Jogo

Este guia explica como adicionar um email de contacto para que os jogadores possam reportar erros e sugerir funcionalidades.

---

## 📧 Opções de Implementação

### Opção 1: Link "mailto:" (Mais Simples - Recomendado para começar)

**Vantagens:**
- Implementação muito simples
- Não requer servidor ou serviços externos
- Funciona imediatamente

**Como funciona:**
- Adiciona um botão/link no jogo
- Ao clicar, abre o cliente de email do utilizador
- Email pré-preenchido com assunto e destinatário

**Onde adicionar no código:**
- Menu "Sobre" / "About"
- Menu de Configurações
- Tela de Créditos

**Exemplo de implementação:**
```tsx
// No componente onde quer adicionar o email
<a href="mailto:seu-email@exemplo.com?subject=Feedback%20Sueca&body=Olá!%0A%0A">
  Reportar Erro / Sugerir Feature
</a>
```

**Ou como botão:**
```tsx
<button onClick={() => window.location.href = 'mailto:seu-email@exemplo.com?subject=Feedback%20Sueca'}>
  Contactar Desenvolvedor
</button>
```

---

### Opção 2: Formulário Web (Mais Profissional)

**Vantagens:**
- Mais profissional
- Pode incluir campos específicos (tipo de feedback, descrição, etc.)
- Melhor experiência para o utilizador

**Como funciona:**
1. Criar página web simples com formulário
2. Hospedar em GitHub Pages, Vercel, ou Netlify (gratuito)
3. Formulário envia email via serviço (Formspree, EmailJS, etc.)
4. Link no jogo aponta para essa página

**Serviços gratuitos para enviar emails:**
- **Formspree:** https://formspree.io (gratuito até 50 submissões/mês)
- **EmailJS:** https://www.emailjs.com (gratuito até 200 emails/mês)
- **Web3Forms:** https://web3forms.com (gratuito, ilimitado)

**Exemplo de página HTML simples:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Feedback - Sueca</title>
</head>
<body>
    <h1>Enviar Feedback</h1>
    <form action="https://formspree.io/f/SEU_ID" method="POST">
        <label>Tipo de Feedback:</label>
        <select name="tipo" required>
            <option value="bug">Reportar Erro</option>
            <option value="feature">Sugerir Funcionalidade</option>
            <option value="outro">Outro</option>
        </select>
        
        <label>Descrição:</label>
        <textarea name="mensagem" required></textarea>
        
        <label>Email (opcional):</label>
        <input type="email" name="email">
        
        <button type="submit">Enviar</button>
    </form>
</body>
</html>
```

---

### Opção 3: GitHub Issues (Para Desenvolvedores)

**Vantagens:**
- Gratuito
- Organizado
- Permite discussão
- Pode ser usado para tracking de bugs

**Como funciona:**
1. Criar repositório público no GitHub (ou usar o existente)
2. Ativar Issues no repositório
3. Link no jogo aponta para criar nova issue

**Link para criar issue:**
```
https://github.com/SEU_USUARIO/SEU_REPOSITORIO/issues/new
```

**Com template pré-preenchido:**
```
https://github.com/SEU_USUARIO/SEU_REPOSITORIO/issues/new?title=[BUG]%20ou%20[FEATURE]&body=Descreva%20aqui...
```

---

## 🎯 Onde Adicionar no Jogo

### 1. Menu "Sobre" / "About"

**Localização sugerida:**
- Criar componente `AboutModal.tsx` ou adicionar ao `CreditsModal.tsx`
- Seção "Contacto" ou "Feedback"

**Exemplo de estrutura:**
```
┌─────────────────────────┐
│   SOBRE O JOGO          │
├─────────────────────────┤
│ Versão: 1.0             │
│                         │
│ Desenvolvido por: ...   │
│                         │
│ ─────────────────────   │
│ CONTACTO                │
│                         │
│ [📧 Reportar Erro]      │
│ [💡 Sugerir Feature]    │
│                         │
│ [Fechar]                │
└─────────────────────────┘
```

### 2. Menu de Configurações

**Localização sugerida:**
- Adicionar opção "Contactar Desenvolvedor" no `GameMenu.tsx` ou `StartMenu.tsx`

### 3. Tela de Créditos

**Localização sugerida:**
- Adicionar seção de contacto no `CreditsModal.tsx`

### 4. Descrição na Play Store

**Localização:**
- Incluir email na descrição completa do jogo no Google Play Console

---

## 📝 Template de Email Sugerido

**Assunto pré-preenchido:**
```
Feedback Sueca - [BUG/FEATURE/SUGESTÃO]
```

**Corpo do email sugerido (para o utilizador):**
```
Olá!

Obrigado pelo seu interesse em melhorar o Sueca!

Por favor, inclua as seguintes informações:

Tipo de feedback: [Bug / Feature Request / Sugestão]

Descrição detalhada:
[Espaço para o utilizador escrever]

Informações adicionais (se aplicável):
- Versão do jogo: [versão]
- Dispositivo: [modelo]
- Versão Android: [versão]

Agradecemos o seu feedback e faremos o nosso melhor para responder!
```

---

## ✅ Checklist de Implementação

### Preparação
- [ ] Email de contacto definido
- [ ] Decidir qual opção usar (mailto, formulário, GitHub)

### Implementação
- [ ] Adicionar botão/link no menu "Sobre"
- [ ] Adicionar botão/link no menu de Configurações (opcional)
- [ ] Testar que o email abre corretamente
- [ ] Verificar em diferentes dispositivos

### Documentação
- [ ] Incluir email na descrição da Play Store
- [ ] Incluir email na Política de Privacidade
- [ ] Incluir email nos Termos de Serviço

### Manutenção
- [ ] Verificar emails regularmente
- [ ] Responder a feedback em tempo razoável (24-48h)
- [ ] Considerar criar FAQ baseado em perguntas frequentes

---

## 💡 Dicas

1. **Responder rapidamente:** Utilizadores apreciam resposta rápida (mesmo que seja apenas "Obrigado, vamos analisar")

2. **Organizar feedback:** Criar sistema simples para organizar:
   - Bugs críticos
   - Features solicitadas
   - Melhorias sugeridas

3. **Agradecer:** Sempre agradecer o feedback, mesmo que não possa implementar imediatamente

4. **Comunicar mudanças:** Se implementar uma feature sugerida, considere agradecer ao utilizador que sugeriu

---

## 🔗 Recursos Úteis

- [Formspree](https://formspree.io) - Serviço de formulários gratuito
- [EmailJS](https://www.emailjs.com) - Envio de emails via JavaScript
- [GitHub Issues](https://docs.github.com/en/issues) - Sistema de issues do GitHub

---

**Última atualização:** Dezembro 2024

