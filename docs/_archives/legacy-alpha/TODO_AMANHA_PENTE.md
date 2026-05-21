# TODO: Melhorias do Pente - Próxima Sessão

## Contexto
Hoje implementámos a base do sistema de pente, mas a visualização precisa de melhorias.

## O que foi feito hoje ✅
- ✅ Componente `PenteVisualization` criado
- ✅ Visualização aparece no final de cada jogo
- ✅ Visualização aparece no final do pente completo
- ✅ Terminologia atualizada (Round → Jogo, Game Score → Pente)
- ✅ Todos os textos traduzidos para português

## O que precisa ser melhorado amanhã 🔧

### Visualização do Pente
O formato desejado é:
```
US       __|__|__|__|__
THEM     |   |   |   |
```

**Problemas atuais:**
- A visualização não está exatamente no formato desejado
- Precisa de melhor alinhamento
- As bolas (●) devem aparecer nas posições corretas
- O formato deve ser mais claro e legível

**Ações necessárias:**
1. Ajustar o CSS para o formato exato do pente
2. Garantir que as 4 posições estão bem visíveis
3. Melhorar o alinhamento entre as duas linhas (US e THEM)
4. Testar em diferentes tamanhos de ecrã
5. Considerar usar caracteres Unicode ou SVG para melhor renderização

### Notas técnicas
- Componente: `frontend/src/components/PenteVisualization.tsx`
- CSS: `frontend/src/components/PenteVisualization.css`
- Usado em: `GameBoard.tsx` (modais de fim de jogo e fim de pente)

### Formato esperado
- 4 posições por equipa
- Linha superior (US): barras horizontais (__) com separadores verticais (|)
- Linha inferior (THEM): apenas separadores verticais (|) alinhados
- Quando uma equipa ganha um jogo, preenche uma posição com bola (●)
- Nunca pode ser 4-4 (jogo termina quando uma equipa chega a 4)

