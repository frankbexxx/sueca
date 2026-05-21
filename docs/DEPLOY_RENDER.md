# Deploy web — Vercel vs Render

## Situação actual

- **Produção:** Vercel — `https://frontend-mu-five-18.vercel.app`
- **Root Directory:** `frontend`
- **Build:** `npm run build` → pasta `build/` (CRA, `homepage: "."`)

## Porquê considerar Render

- Tens **4 projectos já no Render**; só SUECÂO no Vercel → menos fragmentação de contas/DNS
- CRA é **site estático** — Render Static Site é adequado (igual a Vercel para este caso)
- Backend P5 pode ficar no **mesmo Render** (Web Service) com CORS para o domínio estático

## Opção A — Manter Vercel (mínimo risco)

- Zero migração até AAB publicado
- Backend P5 no Render; front continua Vercel
- CORS: `REACT_APP_API_URL` / `REACT_APP_MULTIPLAYER_URL` apontam para Render

## Opção B — Migrar front para Render Static Site

| Passo | Acção |
|-------|--------|
| 1 | Render → New **Static Site** → repo GitHub `sueca` |
| 2 | Root directory: `frontend` |
| 3 | Build: `npm ci && npm run build` |
| 4 | Publish directory: `build` |
| 5 | Env: `REACT_APP_USE_LOCAL_AI_ONLY=true`, etc. (copiar de Vercel) |
| 6 | Domínio custom ou `*.onrender.com` |
| 7 | Smoke + actualizar [RELEASE_CHECK.md](RELEASE_CHECK.md) |
| 8 | Desactivar produção Vercel ou manter só preview |

**Nota:** Capacitor/Android **não depende** de Vercel — o AAB embute `build/` local.

## Checklist migração (quando decidires)

- [ ] Variáveis de ambiente listadas em `frontend/.env.example`
- [ ] `homepage: "."` mantido (paths relativos)
- [ ] Legal pages `/legal/*` incluídas no `public/`
- [ ] Redirects SPA: regra `/*` → `/index.html` (Render e Vercel suportam)
- [ ] Actualizar URL em `docs/STATUS.md` e Play listing se mudar domínio

## Recomendação (Maio 2026)

1. **AAB primeiro** — não bloquear Android por migração de host.
2. **P5 no Render** — já alinha backend com os outros projectos.
3. **Migrar front** depois do internal track, num commit só com checklist acima.
