# 📁 Estrutura do Projeto

## 🎯 Organização

O projeto está organizado de forma clara e profissional:

### 📂 Raiz do Projeto (Apenas Essencial)

```
SUECA/
├── README.md              # Documentação principal
├── rules.txt              # Regras do jogo
├── URL_DO_JOGO.txt        # URL de produção (rápido acesso)
├── start-server.bat       # Script para iniciar servidor
├── deploy.bat             # Script para deploy
├── .gitignore             # Ficheiros ignorados pelo Git
│
├── frontend/              # Código fonte React/TypeScript
├── assets/                # Imagens das cartas
├── docs/                  # Toda documentação
└── archive/               # Arquivos de referência
```

### 📚 Pasta `docs/` (Documentação Completa)

```
docs/
├── README.md              # Índice da documentação
├── INDEX.md               # Índice detalhado
│
├── QUICKSTART.md          # Início rápido
├── SETUP.md               # Setup detalhado
├── COMO_PARTILHAR.md      # Como partilhar o jogo
│
├── DEPLOY_GUIDE.md        # Guia completo de deploy
├── DEPLOY_QUICK.md        # Deploy rápido
├── CORRIGIR_DEPLOY.md     # Troubleshooting
│
├── STATUS.md              # Estado actual do projeto
├── INDEX.md               # Índice documentação
├── DEVELOPMENT_PLAN.md    # Plano de desenvolvimento
├── NEXT_STEPS.md          # Próximos passos
│
└── TESTING_*.md           # Documentos de testes
```

### 💻 Pasta `frontend/` (Código Fonte)

```
frontend/
├── src/
│   ├── components/        # Componentes React
│   │   ├── GameBoard.tsx  # Componente principal
│   │   ├── GameMenu.tsx   # Menu e controles
│   │   └── *.css          # Estilos
│   ├── models/            # Lógica do jogo
│   │   ├── Game.ts        # Classe principal do jogo
│   │   └── Deck.ts        # Gerenciamento do baralho
│   ├── types/              # TypeScript types
│   │   └── game.ts         # Interfaces e tipos
│   └── App.tsx             # Componente raiz
├── public/                # Assets públicos
│   └── assets/            # Imagens das cartas
├── package.json           # Dependências
└── vercel.json            # Configuração Vercel
```

---

## ✅ Vantagens desta Estrutura

1. **Raiz Limpa**: Apenas ficheiros essenciais
2. **Documentação Organizada**: Tudo em `docs/`
3. **Fácil Navegação**: Estrutura lógica e intuitiva
4. **Profissional**: Segue boas práticas de organização
5. **Manutenível**: Fácil de encontrar e atualizar documentos

---

## 📝 Convenções

- **README.md** na raiz: Documentação principal e visão geral
- **docs/**: Toda documentação detalhada
- **frontend/**: Todo código fonte
- **assets/**: Recursos (imagens, etc.)
- **archive/**: Arquivos de referência (não versionados)

---

**Última atualização:** Dezembro 2025

