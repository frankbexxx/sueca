# 📱 Requisitos para Publicação no Google Play Store

Este documento lista todas as obrigações legais e da plataforma necessárias para publicar o jogo Sueca no Google Play Store.

---

## 🏛️ OBRIGAÇÕES LEGAIS

### 1. Política de Privacidade (OBRIGATÓRIO)

**Requisito:** Deve ter uma Política de Privacidade acessível publicamente via URL.

**O que deve incluir:**
- Que dados são recolhidos (se houver)
- Como os dados são usados
- Se há partilha de dados com terceiros
- Direitos dos utilizadores (GDPR - se aplicável na UE)
- Contacto para questões de privacidade

**Para o jogo Sueca:**
- Se não recolher dados pessoais: mencionar claramente
- Se usar analytics: explicar quais e para que fim
- Se usar publicidade: explicar que dados são partilhados

**Onde hospedar:**
- GitHub Pages (gratuito)
- Vercel/Netlify (gratuito)
- Website próprio

**Template sugerido:**
```
Política de Privacidade - Sueca Card Game

Última atualização: [DATA]

1. Dados Recolhidos
   - Este jogo não recolhe dados pessoais dos utilizadores
   - [OU: Listar exatamente quais dados são recolhidos]

2. Uso de Dados
   - [Explicar como os dados são usados]

3. Partilha de Dados
   - [Se há partilha com terceiros ou não]

4. Direitos dos Utilizadores
   - [Conforme GDPR se aplicável]

5. Contacto
   - Email: [SEU_EMAIL]
```

---

### 2. Termos de Serviço (RECOMENDADO)

**Requisito:** Não é obrigatório, mas altamente recomendado para proteger o desenvolvedor.

**O que deve incluir:**
- Limitação de responsabilidade
- Propriedade intelectual
- Uso aceitável do jogo
- Rescisão de acesso
- Lei aplicável

**Onde hospedar:** Mesmo local da Política de Privacidade

---

### 3. GDPR (Regulamento Geral sobre a Proteção de Dados)

**Aplicável se:**
- O jogo está disponível na União Europeia
- Recolhe dados de utilizadores da UE

**Obrigações:**
- Consentimento explícito para recolha de dados
- Direito ao esquecimento
- Direito de acesso aos dados
- Política de privacidade clara

**Para o jogo Sueca:**
- Se não recolher dados: mencionar na política de privacidade
- Se usar analytics: garantir conformidade GDPR

---

## 📋 REQUISITOS DA GOOGLE PLAY STORE

### 1. Conta de Desenvolvedor

**Custo:** Taxa única de **$25 USD** (aproximadamente €23)

**Processo:**
1. Aceder a [Google Play Console](https://play.google.com/console)
2. Criar conta Google (se não tiver)
3. Aceitar Contrato de Distribuição do Desenvolvedor
4. Pagar taxa de inscrição
5. Preencher informações da conta (nome, endereço, etc.)

**Nota:** A taxa é única e válida para sempre.

---

### 2. Informações da Aplicação

#### 2.1 Detalhes Básicos (OBRIGATÓRIO)
- **Nome da aplicação:** "Sueca" ou "Sueca Card Game"
- **Descrição curta:** Máximo 80 caracteres
- **Descrição completa:** Máximo 4000 caracteres
- **Categoria:** Jogos > Cartas
- **Classificação de conteúdo:** PEGI/ESRB (geralmente "Everyone" para jogos de cartas)

#### 2.2 Imagens e Gráficos (OBRIGATÓRIO)
- **Ícone da aplicação:** 512x512 px (PNG, sem transparência)
- **Screenshot:** Mínimo 2, máximo 8
  - Telefone: 16:9 ou 9:16, mínimo 320px
  - Tablet: 16:9 ou 9:16, mínimo 320px
- **Imagem de destaque:** 1024x500 px (opcional mas recomendado)
- **Banner promocional:** 180x120 px (opcional)

#### 2.3 Contacto e Suporte (OBRIGATÓRIO)
- **Email de suporte:** Obrigatório
- **Website:** Opcional mas recomendado
- **Telefone:** Opcional

---

### 3. Política de Privacidade (OBRIGATÓRIO)

**Requisito:** URL pública acessível

**Onde configurar:**
- Google Play Console → Política de Privacidade
- Inserir URL completa (ex: https://seudominio.com/privacy)

**Validação:**
- Google verifica se o URL está acessível
- Deve estar em inglês ou no idioma principal do jogo

---

### 4. Classificação de Conteúdo

**Sistema:** IARC (International Age Rating Coalition)

**Processo:**
1. Preencher questionário sobre conteúdo
2. Obter classificações automáticas:
   - PEGI (Europa)
   - ESRB (América do Norte)
   - Outros conforme região

**Para jogos de cartas tradicionais:**
- Geralmente classificado como "Everyone" / "3+" / "Livre"

---

### 5. Formato de Publicação

**Formato obrigatório:** Android App Bundle (.aab)

**Não aceite:**
- APK (apenas para testes internos)
- Outros formatos

**Como criar:**
- Usar Android Studio
- Build → Generate Signed Bundle / APK → Android App Bundle

---

### 6. Testes e Qualidade

**Requisitos:**
- Aplicação deve funcionar corretamente
- Sem crashes críticos
- Performance adequada
- Conformidade com políticas do Google

**Testes recomendados:**
- Testar em diferentes dispositivos Android
- Testar em diferentes versões do Android
- Verificar em diferentes tamanhos de ecrã

---

### 7. Preços e Distribuição

**Gratuito ou Pago:**
- Definir se o jogo é gratuito ou pago
- Se pago: definir preço por país/região

**Países de distribuição:**
- Escolher em quais países disponibilizar
- Pode ser global ou selecionar países específicos

---

## 📧 EMAIL DE FEEDBACK

### Como Adicionar Email de Feedback no Jogo

**Opções de implementação (sem código complexo):**

#### Opção 1: Link "mailto:" (Mais Simples)
- Adicionar botão/link no menu "Sobre" ou "Ajuda"
- Link direto: `mailto:seu-email@exemplo.com?subject=Feedback%20Sueca`
- Abre cliente de email do utilizador

#### Opção 2: Formulário Web (Recomendado)
- Criar página simples com formulário
- Hospedar em GitHub Pages, Vercel, ou Netlify
- Link no jogo aponta para essa página
- Formulário envia email via serviço (ex: Formspree, EmailJS)

#### Opção 3: GitHub Issues
- Criar link para abrir issue no GitHub
- Utilizadores podem reportar bugs e sugerir features
- Gratuito e organizado

---

### Onde Colocar o Email no Jogo

**Locais sugeridos:**
1. **Menu "Sobre" / "About"**
   - Seção "Contacto" ou "Feedback"
   - Botão "Reportar Erro" / "Sugerir Feature"

2. **Menu de Configurações**
   - Opção "Contactar Desenvolvedor"

3. **Tela de Créditos**
   - Seção de contacto

4. **Descrição na Play Store**
   - Incluir email na descrição do jogo

---

### Template de Email de Feedback

**Assunto sugerido:** "Feedback Sueca - [Tipo: Bug/Feature/Sugestão]"

**Conteúdo sugerido para o utilizador:**
```
Olá!

Obrigado pelo seu interesse em melhorar o Sueca!

Por favor, inclua:
- Tipo de feedback: [Bug / Feature Request / Sugestão]
- Descrição detalhada
- Passos para reproduzir (se for bug)
- Versão do jogo
- Dispositivo/Android (se relevante)

Agradecemos o seu feedback!
```

---

## ✅ CHECKLIST PRÉ-PUBLICAÇÃO

### Documentação Legal
- [ ] Política de Privacidade criada e hospedada (URL pública)
- [ ] Termos de Serviço criados (recomendado)
- [ ] Email de contacto definido
- [ ] Conformidade GDPR verificada (se aplicável)

### Google Play Console
- [ ] Conta de desenvolvedor criada ($25 pago)
- [ ] Informações da conta preenchidas
- [ ] Aplicação criada no console

### Informações da Aplicação
- [ ] Nome da aplicação definido
- [ ] Descrição curta (80 caracteres)
- [ ] Descrição completa (até 4000 caracteres)
- [ ] Categoria selecionada
- [ ] Classificação de conteúdo obtida

### Assets Visuais
- [ ] Ícone 512x512 px criado
- [ ] Mínimo 2 screenshots criados
- [ ] Imagem de destaque 1024x500 px (opcional)
- [ ] Banner promocional (opcional)

### Aplicação
- [ ] Android App Bundle (.aab) gerado
- [ ] Aplicação testada em vários dispositivos
- [ ] Sem crashes críticos
- [ ] Performance adequada

### Contacto e Suporte
- [ ] Email de suporte configurado no console
- [ ] Email de feedback adicionado no jogo
- [ ] Website/URL de privacidade configurado

### Testes
- [ ] Testado em Android 8.0+ (mínimo recomendado)
- [ ] Testado em diferentes tamanhos de ecrã
- [ ] Testado em modo claro e escuro (se aplicável)

---

## 📝 NOTAS IMPORTANTES

1. **Política de Privacidade é OBRIGATÓRIA** - Sem ela, a aplicação não será aprovada
2. **Email de suporte é OBRIGATÓRIO** - Deve responder em tempo razoável
3. **Taxa de $25 é única** - Válida para sempre, não é anual
4. **Revisão do Google** - Pode levar 1-7 dias úteis
5. **Atualizações** - Após publicação, pode atualizar quando quiser

---

## 🔗 RECURSOS ÚTEIS

- [Google Play Console](https://play.google.com/console)
- [Políticas do Google Play](https://play.google.com/about/developer-content-policy/)
- [Guia de Política de Privacidade](https://support.google.com/googleplay/android-developer/answer/10787469)
- [GDPR para Desenvolvedores](https://gdpr.eu/)

---

**Última atualização:** Dezembro 2024

