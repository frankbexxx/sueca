# Release Check (pós-deploy)

Checklist rápido antes e depois de cada deploy de produção.

## Configuração Vercel

- [x] **Root Directory** = `frontend`
- [x] Deploy CLI a partir da **raiz do repo** (`~/projects/sueca`), não de `frontend/frontend`
- [x] Branch de produção: `v2-main`
- [x] URL de produção: `https://frontend-mu-five-18.vercel.app` (Render opcional: [DEPLOY_RENDER.md](DEPLOY_RENDER.md))

## Comandos locais

```bash
cd ~/projects/sueca/frontend
npm ci
npm run build
npx tsc --noEmit
npm test -- --watchAll=false
```

Deploy produção (a partir da raiz do repo, com projeto já ligado):

```bash
cd ~/projects/sueca
vercel --prod
```

## Smoke test (5 minutos)

- [x] Landing page carrega (HTTP 200 verificado)
- [ ] Imagens das cartas aparecem (sem ícones partidos) — confirmar no browser
- [ ] Iniciar jogo Sueca e jogar pelo menos 1 vaza
- [ ] Trunfo visível na primeira ronda
- [ ] IA joga automaticamente
- [ ] Testar em viewport mobile (360×800) — ver [MOBILE_AUDIT.md](MOBILE_AUDIT.md)
- [ ] Mais → Definições: idioma; Personalizar → Mão e Cartas (ordenar mão / ritmo); Personalizar → Música e Som
- [ ] Sueca: 10 cartas + trunfo à esquerda (se configurado)
- [x] Selector mostra Sueca, Spades, Hearts e King
- [ ] Smoke King PT: viragem K♥ automática · folha 10×4 · festa 13 cartas scroll + bottom sheet · aceitar 1 positiva · sem NÓS/ELES na mesa
- [ ] King `no_king_hearts`: K♥ tomado → popup terminar cedo (aceitar/recusar)
- [ ] Hearts: Q♠ + 13 copas → popup terminar cedo
- [ ] SFX: trick-collect após 4.ª carta (~200 ms); shuffle imediato + deal (~600 ms) após mãos
- [ ] Tab Regras King PT mostra secções completas (negativos, leilão, invariantes)

## Android (Capacitor)

> **Gate:** complete [plan/PRODUCT_ESSENTIALS.md](plan/PRODUCT_ESSENTIALS.md) must-have checklist first.

- [ ] Bottom nav 7 tabs + back stack (Início raiz → submenus → Voltar)
- [ ] Voltar: Config → Mão → Voltar ×2 → Início; Regras → jogo → Voltar; browser/Android back
- [ ] Perfil: Sair da aplicação → landing + refresh
- [ ] Configurações: som, idioma, pausa auto, ordenar mão, trunfo Sueca
- [ ] Regras + testes verdes (Sueca, Hearts, Spades, King)
- [ ] `npm run release:android` (build mobile + `cap sync android`) — ver [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)
- [ ] Ou manual: `npm run build:android` depois `npx cap sync android`
- [ ] AAB assinado (`docs/ANDROID_SIGNING.md`) — internal track Play Console
- [x] Legal: `/legal/privacy.html` e `/legal/terms.html` no deploy (REL-LEGAL-01D2; contact frankbex.dev@gmail.com)
- [ ] `VITE_USE_LOCAL_AI_ONLY=true` no build mobile (`npm run build:android` / `.env.android`)
- [ ] Maestro smoke (`.maestro/smoke.yaml`) no emulador
- [ ] Conta / Auth API: `VITE_AUTH_API_BASE_URL` HTTPS em produção se Conta estiver em uso

## Multiplayer (REL-MP-01 Option C — soft-hide)

- [x] Public v1: `VITE_MULTIPLAYER_ENABLED=false` em `.env.production` e `.env.android`
- [x] Mais → Online **hidden** when flag is false (code retained; enable only for internal/dev)
- [ ] Confirm production deploy does **not** show Online under Mais

## Serviços opcionais

- [ ] `VITE_AI_SERVICE_URL` configurado no Vercel **ou** confirmado fallback para IA local
- [ ] Multiplayer: leave `VITE_MULTIPLAYER_ENABLED=false` for public v1 (soft-hide). Do **not** require a separate `*_MULTIPLAYER_URL` — MP uses Firebase RTDB client config when re-enabled
- [ ] `.env.local` **não** commitado (está em `.gitignore`)

## Git antes do push

```bash
git status
```

Não commitar: `.vercel/`, `.env.local`, `frontend/build/`, `package-lock.json` na raiz do repo.
