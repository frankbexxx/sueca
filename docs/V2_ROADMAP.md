# 🚀 SUECA 2.0 — Roadmap Curto

## Contexto
- V1 congelada em `v1.0` (hotfixes em `v1-maintenance`).
- V2 em desenvolvimento em `v2-main`; produção em `https://frontend-mu-five-18.vercel.app` (`vercel --prod` a partir de `frontend`).
- Problema nº1: UI desalinhada em Android/mobile.

## Milestones
- **M0 — Kickoff (feito)**: branches/tag criadas, deploy prod ativo.
- **M1 — Estabilidade Mobile/Android**  
  - Responsividade 360×800 e 414×896: mão do Sul sem corte/colisão; info (scores/dealer/trunfo) legível.  
  - Tamanhos de toque ≥48px, espaçamentos fluidos (rem/%).  
  - Smoke-test manual em mobile (devtools + 1 dispositivo real); checklist anexado a release.
- **M2 — Polimento de UI + Design Tokens**  
  - Paleta/tokens (cores, espaçamentos, raio) aplicados em botões, mesa, menu.  
  - Estados claros de botões (ativo/desativado/hover/focus).  
  - Layout do menu/placar consistente em mobile e desktop.
- **M3 — Feedback & Telemetria Leve**  
  - Botão de feedback simples (mailto/form).  
  - Captura mínima de erros de UI (console/error boundary) sem PII.  
  - Indicador de conectividade/reload leve se necessário.

## Backlog (posterior)
- Animações leves de cartas; sons.  
- Melhorias adicionais de AI; multiplayer.  
- Otimizações de performance e offline/reconnect.

## Processo
- Board Kanban com WIP baixo (To Do / In Progress / Done).  
- Branches curtas a partir de `v2-main`; preview com `vercel`.  
- Produção apenas via `vercel --prod` (a partir de `frontend`).

## Testes mínimos por milestone
- M1: smoke mobile (play 1 jogo completo), verificar colisões/legibilidade.  
- M2: revisão visual rápida (contrast, estados de botão), regressão básica de jogo.  
- M3: validar envio de feedback e captura de erros em 1 fluxo completo.

