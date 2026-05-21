# Prompt P5 — Backend multiplayer

> **Obrigatório** antes de release com multiplayer. Preferência deploy: **Render** (alinhado com outros projectos). Ver [DEPLOY_RENDER.md](../../DEPLOY_RENDER.md).

## Objetivo
`backend/` em produção com wss + auth guest.

## Tarefas
1. Deploy `backend/` no **Render** (ou Fly/Railway).
2. `REACT_APP_API_URL`, `REACT_APP_MULTIPLAYER_URL=wss://...`
3. `REACT_APP_MULTIPLAYER_ENABLED=true`
4. Validação autoritativa Sueca (fase 2).

## Critérios
- [ ] 4 clientes na mesma sala.
- [ ] DELETE `/auth/account` funciona.
