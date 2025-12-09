# 📌 Draft de Issues — SUECA 2.0 (para GitHub quando quisermos)

## 1) Android/mobile layout desalinhado
- **Objetivo**: Layout funcional em mobile (360×800 e 414×896) sem colisões ou cortes.
- **Critérios de aceitação:**
  - Mão do Sul totalmente visível e jogável; header/placar/dealer/trunfo legíveis.
  - Botões Play/Next e menu sempre acessíveis (sem overflow).
  - Hit targets ≥ 48px; espaçamentos fluidos (rem/%), evitando valores fixos que quebrem.
  - Teste manual: devtools em 360×800 e 414×896 + 1 dispositivo real; jogar 1 partida completa sem cortes/overlaps.
- **Notas**: Prioridade alta (M1 do roadmap V2).

## 2) Checklist de smoke mobile
- **Objetivo**: Checklist rápido para cada build que toque em UI.
- **Checklist sugerido:**
  - Abrir em 360×800 e 414×896: verificar mão do Sul, header/placar, trunfo, botões/menu.
  - Jogar 1 ronda completa: sem cortes/overlaps, botões utilizáveis.
  - Confirmar hit targets (toques ~48px) e ausência de scroll lateral indesejado.
  - Registar device/viewport/data/resultado (pass/fail).

## 3) Board V2 (Kanban)
- **Objetivo**: Organizar trabalho com WIP baixo.
- **Tarefas:**
  - Criar colunas To Do / In Progress / Done.
  - Limite de WIP: máx 2 itens em progresso.
  - Etiquetas úteis: `priority-high`, `mobile`, `ui`, `bug`.
  - Adicionar os issues acima ao board.

## 4) (Opcional) Nota de deploy V2
- Garantir que deploy de produção sai de `v2-main` via `vercel --prod` (domínio `frontend-mu-five-18.vercel.app`); previews com `vercel`.

