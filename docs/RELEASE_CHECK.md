# Release Check (pós-deploy)

Checklist rápido antes e depois de cada deploy de produção.

## Configuração Vercel

- [x] **Root Directory** = `frontend`
- [x] Deploy CLI a partir da **raiz do repo** (`~/projects/sueca`), não de `frontend/frontend`
- [x] Branch de produção: `v2-main`
- [x] URL de produção: `https://frontend-mu-five-18.vercel.app`

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
- [ ] Selector mostra Sueca, Spades, Hearts e King
- [ ] Smoke: 1 ronda por variante (sem alterar layout da mesa)

## Serviços opcionais

- [ ] `REACT_APP_AI_SERVICE_URL` configurado no Vercel **ou** confirmado fallback para IA local
- [ ] `REACT_APP_MULTIPLAYER_URL` configurado **ou** multiplayer desligado em produção
- [ ] `.env.local` **não** commitado (está em `.gitignore`)

## Git antes do push

```bash
git status
```

Não commitar: `.vercel/`, `.env.local`, `frontend/build/`, `package-lock.json` na raiz do repo.
