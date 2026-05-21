# Design handoff — SUECÂO

Guia único para levar gráficos de **qualquer** ferramenta de design para o repo, sem depender de Figma sozinho.

## Ferramentas suportadas

| Tool | Export | Tokens |
|------|--------|--------|
| **Figma** | PNG/SVG por frame; plugin Tokens → JSON | Copiar JSON para `frontend/src/styles/design-tokens.json` e espelhar em `design-tokens.css` |
| **Penpot** | Export assets + CSS/JSON specs | Idem |
| **Pack comercial** | ZIP com cartas | `tools/map-card-pack.mjs` |
| **Só código** | — | Editar `design-tokens.css` directamente |

**Não usar** como base principal: plugins “Figma → React” no `GameBoard` (lógica de jogo + posicionamento ficam em código).

## Convenção de ficheiros — cartas

Destino: `frontend/public/assets/cards2/`

| Ficheiro | Exemplo |
|----------|---------|
| Carta | `Queen_of_Clubs.png` (Title_Case, `_of_`) |
| Verso | `card_back.png` |
| Extensão produção | PNG ou WebP (`REACT_APP_CARD_EXT=png`) |

Import intermédio: `frontend/public/assets/cards-pack-import/` (qualquer nome; o script normaliza).

```bash
node tools/map-card-pack.mjs \
  --input frontend/public/assets/cards-pack-import \
  --output frontend/public/assets/cards2
```

## Convenção — UI chrome (menus, modais)

| Asset | Tamanho sugerido | Path |
|-------|------------------|------|
| Fundo menu | 1080×1920 ou 9:16 slice | `public/assets/ui/menu-bg.png` |
| Botão primário | min 48×48 dp equivalente | `public/assets/ui/btn-primary.png` ou CSS + tokens |
| Ícone app | 512×512 | `image/ico/buga_ico_draw/` → Capacitor |

Usar variáveis em [`design-tokens.css`](../frontend/src/styles/design-tokens.css): `--sueca-color-primary`, `--sueca-touch-min`, etc.

## Frame de referência mobile

- **360×800** — mão do Sul, 10 cartas clicáveis, sem overflow
- **414×896** — segunda verificação
- Safe areas: `env(safe-area-inset-*)` já em `index.css`

## Checklist antes de commit

- [ ] `git status` limpo ou só ficheiros pretendidos
- [ ] `cd frontend && npm ci && npm test -- --watchAll=false`
- [ ] `npm run build` sem 404 de cartas
- [ ] Contagem ≥ 40 cartas em `cards2/` (52 para variantes 52)
- [ ] Licença anotada em [ASSETS.md](ASSETS.md)

## Build Android após assets

```bash
cd frontend
npx cap add android   # só na primeira vez (android/ não vai para git)
npm run release:android
# Depois: Android Studio → bundleRelease (ver ANDROID_SIGNING.md)
```

Env mobile: copiar `.env.android` → usar variáveis no `build:android` (já no script).

## Vite (fase opcional)

**Adiado.** CRA não é gargalo confirmado (build ~15s, CI verde). Reavaliar se migrares UI pesadamente ou builds &gt; 2 min.
