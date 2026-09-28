# SUECÂO — Assets (cartas e UX)

**Pesquisa packs:** [ASSET_PACK_RESEARCH.md](ASSET_PACK_RESEARCH.md) · **Legal ledgers:** [legal/assets/](legal/assets/)
**Handoff técnico:** [DESIGN_HANDOFF.md](DESIGN_HANDOFF.md)

## Estado no repositório (REL-DECK-01D Batch 3 — library complete)

| Pack | Path | Estado |
|------|------|--------|
| Faces default | `cards-cardmeister/` | CardMeister — **default** |
| Faces | `cards/pd-ornate/` | AustinGabriel CC0 |
| Faces | `cards/woodcut/` | SONDLecT CC0 |
| Faces | `cards/jumbo-2/` · `fourcolour/` · `accessible/` | Saul Spatz PD |
| Faces | `cards/kenney/` | Kenney CC0 pixel (384×384 NN×6) |
| Faces | `cards/webisso/` | Webisso MIT (352×512) |
| Backs (**19**) | `card-backs/` | suecao×5 · sylly×6 · woodcut · saul×2 · ornate×4 · kenney |
| Legal | `docs/legal/assets/{cardmeister,pd-ornate,sylly,woodcut,saul-svgcards,kenney,webisso,suecao-backs}/` | |
| Hayeah | — | **SKIPPED** (visual duplication) — see `hayeah-SKIPPED.md` |

**Removido (Batch 1):** Casino `cards3/` + hazmat-red. Theme back mappings unchanged since Batch 1.

### Registry

| Id | Tipo | Notas |
|----|------|-------|
| `cardmeister` | deck (**default**) | |
| `pd-ornate` · `woodcut` · `jumbo-2` · `fourcolour` · `accessible` · `kenney` · `webisso` | deck | |
| `suecao-navy` | back (**fallback**) | |
| `sylly-01`…`06` · `woodcut-01` · `saul-*` · `ornate-*` · `kenney-01` · `suecao-{burgundy,forest,charcoal,gold}` | back | |

### Planned later

- Credits UI polish (separate)
- Optional theme back reassignment polish
- Optional sharper Sylly vector re-export

## Critérios / integração

Ver batches anteriores. Ledger obrigatório em `docs/legal/assets/<id>/`.

## Checklist

- [x] Batch 1: Casino out · CardMeister · pd-ornate · Sylly
- [x] Batch 2: woodcut · Saul×3 · ornate backs
- [x] Batch 3: kenney · webisso · Suecão colourways · Hayeah skipped
- [ ] Credits UI polish (deferred)

## Licenças (cartas shipping)

| Asset | Licença | Ledger |
|-------|---------|--------|
| CardMeister | Unlicense | `cardmeister/` |
| pd-ornate + ornate backs | CC0 | `pd-ornate/` |
| woodcut | CC0 | `woodcut/` |
| Saul Spatz decks + backs | Public domain (author) | `saul-svgcards/` |
| Kenney | CC0 (License.txt) | `kenney/` |
| Webisso | MIT | `webisso/` |
| Suecão navy + colourways | Product original / derived | `suecao-backs/` |
| Sylly | CC0 | `sylly/` |
| Casino / Hazmat | **REMOVED** | |

## SFX / Música

Inalterados nesta slice — ver histórico Batch 1 docs / `sfxAssets.ts` / music core.
