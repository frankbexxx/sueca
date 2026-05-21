# Pesquisa de asset packs (qualidade — itch.io e afins)

Objectivo: **identidade visual forte** para Play Store, sem desenhar do zero. Figma/Penpot só se um pack exigir adaptação pontual — **prioridade = packs comerciais prontos**.

## O que comprar (2 packs ou 1 bundle)

### Pack A — Baralho 52 + verso

| Critério | Mínimo aceitável | Ideal |
|----------|------------------|-------|
| Formato | PNG transparente **ou** SVG | PNG @2x (512px+ largura) |
| Ficheiros | 52 faces + **card back** | Nomes exportáveis ou fácil rename |
| Licença | **Commercial use** + app mobile | Sem atribuição obrigatória (ou créditos OK em `CreditsModal`) |
| Estilo | Legível em **360×800** (números/figuras claros) | Coerente com fundo verde mesa |
| Sueca 40 | Pack 52 (subset usado no jogo) | Mesmo pack para Spades/Hearts/King |

**Evitar:** pixel art ilegível em mobile, fundos opacos nos cantos, apenas PSD sem PNG, licença “personal use only”.

### Pack B — UI chrome (opcional mas recomendado)

| Critério | Mínimo | Ideal |
|----------|--------|-------|
| Conteúdo | Botões, painéis, ícones menu | Kit completo + paleta escura |
| Formato | PNG 9-slice ou SVG | Compatível com `--sueca-*` tokens |
| Âmbito | Menus/modais **fora** da mesa | Não substituir layout da vaza |

Pode ser o mesmo autor do Pack A (consistência visual).

## Onde procurar (ordem)

1. **[itch.io](https://itch.io/game-assets)** — tags: `playing cards`, `card game`, `UI kit`, `mobile game GUI`
2. **Kenney.nl** — rápido mas genérico; só se não encontrares melhor em 2h de pesquisa
3. **Craftpix / Unity Asset Store** — frequentemente bundles cartas+UI
4. **GraphicRiver / Creative Market** — maior qualidade, preço mais alto

## Filtros itch.io (pesquisa)

- Preço: €5–40 por pack (suspeita se “demasiado barato” sem licença clara)
- Licença: ler página — **redistribuição em app** permitida
- Preview: screenshot com **todas as cartas** visíveis
- Reviews / downloads recentes

## Keywords (EN)

```
playing card deck png commercial
card game UI kit mobile
poker cards sprite sheet transparent
casual card game asset pack
```

## Checklist antes de comprar

- [ ] Licença permite **app Android comercial** (Google Play)
- [ ] 52 cartas + verso no preview ou lista de ficheiros
- [ ] Resolução suficiente (≥ 256px altura da carta no PNG)
- [ ] Estilo combina com mesa verde / tema escuro do jogo
- [ ] Formato PNG (preferido para `REACT_APP_CARD_EXT=png`) ou SVG com paths simples

## Depois de comprar

1. Extrair para `frontend/public/assets/cards-pack-import/`
2. `node tools/map-card-pack.mjs --input ... --output frontend/public/assets/cards2`
3. `npm run build:android` + smoke visual
4. Registar licença em [ASSETS.md](ASSETS.md)

## Referência técnica

- Convenção nomes: `Rank_of_Suit.png` — [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)
- Env: `REACT_APP_CARD_EXT=png` em `.env.android` / `build:android`
