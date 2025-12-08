# 🚀 Próximos Passos - Roadmap

## ✅ Estado Atual

- Jogo funcional (4 jogadores, 2 equipas, regras implementadas)
- UI nova base: mesa verde, jogadores fora da mesa, mão visível só do Sul; demais com contador/stack
- Trunfo sempre visível; botões Play/Next fixos; strip superior com scores/round/dealer
- Grid de debug opcional para checar sobreposição
- Sem animações de cartas; interações mínimas (z-index/borda/sombra)
- Deploy Vercel configurado

---

## 🎯 Próximas Melhorias Sugeridas

### Prioridade Alta ⭐⭐⭐

1. UI/UX básica — precisão e colisões
   - [ ] Ajustar posicionamento fino dos assentos (N/E/W) e mão do Sul
   - [ ] Validar sobreposição (grid/boxes); evitar colisão mão/caixa de info
   - [ ] Melhorar contraste/legibilidade de infos (nomes, scores)

2. Interação mão do Sul
   - [ ] Hover/seleção estável, sem mover cartas
   - [ ] Testar jogabilidade (cliques) e acessibilidade mínima (cursor/estado)

3. Painel lateral simples (opcional, estilo ref. imagem 2)
   - [ ] Mostrar nomes, equipa, dealer/current turn
   - [ ] Espaço para mensagens/log (futuro)

### Prioridade Média ⭐⭐

4. Polimento visual
   - [ ] Refinar cores de mesa/fundo; tema claro/escuro consistente
   - [ ] Estado desativado de botões (Play/Next) bem visível

5. Responsividade inicial
   - [ ] Ajustar para telas médias; mobile pode ficar para depois

### Prioridade Baixa ⭐

6. Animações e áudio
   - [ ] Transições leves ao jogar carta (opcional)
   - [ ] Sons de carta/vaza (opcional)

---

## 📋 Recomendação de Ordem de Implementação

### Sprint 1: UI base e precisão (1 semana)
1. Ajustes de posição (assentos/mão Sul) e colisão
2. Painel lateral simples
3. Contraste/legibilidade + estados de botões

### Sprint 2: Polimento visual leve (1 semana)
1. Cores/tema mesa + grid debug opcional
2. Pequenas animações (se necessário) e estados de interação

### Sprint 3: Responsividade inicial (1 semana)
1. Ajustes para telas médias
2. Planeamento para mobile

---

## 🛠️ Como Continuar

1. **Escolher uma fase** da lista acima
2. **Ler `PROJECT_STATUS.md`** para entender o estado atual
3. **Ler `DEVELOPMENT_PLAN.md`** para detalhes técnicos
4. **Implementar feature por feature**
5. **Testar e fazer deploy** quando concluído

---

## 💡 Notas Importantes

- **Testar localmente** antes de fazer deploy
- **Fazer commits frequentes** com mensagens descritivas
- **Atualizar `PROJECT_STATUS.md`** após cada fase concluída
- **Manter código limpo** e bem documentado

---

## 📚 Referências

- `PROJECT_STATUS.md` - Estado atual detalhado
- `DEVELOPMENT_PLAN.md` - Plano técnico completo
- `rules.txt` - Regras do jogo Sueca

---

**Boa sorte com o desenvolvimento! 🎮**

