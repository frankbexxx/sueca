# SUECÂO — Product Essentials (v1 gate)

**Data:** Maio 2026 · Branch `v2-main`

Lista reduzida derivada de [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md).  
**Android AAB só quando este checklist estiver completo.**

---

## Must-have (bloqueia Android)

### Jogos (4 existentes — sem novos)
- [ ] Sueca — regras clássicas PT + testes
- [ ] Hearts — regras clássicas + testes
- [ ] Spades — regras clássicas (sem nil v1) + testes
- [ ] King — spec simplificada completa + testes

### Regras (motor)
- [ ] Jogadas ilegais bloqueadas em todos os jogos
- [ ] Pontuação transparente na UI (ScoreStrip / modais)
- [ ] Sueca: tiers 61/91/120, capote, carry 60-60, fim 4 jogos
- [ ] Hearts: pass L/R/A/hold, 2♣ abertura, hearts broken, shoot moon, fim 100
- [ ] Spades: spades broken, bids, contrato, bags −100/10, fim 500
- [ ] King: ±5/vaza, 10 mãos, trunfo rotativo, game over

### Navegação (app shell)
- [ ] Landing → Dashboard (tab Início)
- [ ] Bottom nav fixo: **Início · Jogar · Regras · Mais**
- [ ] Tab Jogar = setup dedicado (sem scroll monolítico)
- [ ] In-game: nav oculto, mesa domina ecrã, sair com confirmação
- [ ] Tab Regras = hub por jogo
- [ ] Tab Mais = definições, créditos, perfil local

### Mesa (manter)
- [ ] Cartas Hazmat legíveis, verso oponentes
- [ ] Trunfo / vez / dealer visíveis
- [ ] Toque ≥ 48px mobile

### Offline
- [ ] Solo vs bots (IA local)
- [ ] Continuar partida (localStorage)
- [ ] Estatísticas locais básicas (partidas, vitórias por jogo)

### Ajuda
- [ ] Regras legíveis por jogo (RulesHub)
- [ ] Tutorial curto ou regras inline (mínimo: RulesSheet por variante)

### Definições
- [ ] Idioma PT/EN
- [ ] Som on/off
- [ ] Dark mode
- [ ] `REACT_APP_USE_LOCAL_AI_ONLY=true` no build mobile

### QA
- [ ] `npm test` verde (todos os jogos)
- [ ] `npm run build` verde
- [ ] Smoke 360×800: 1 partida completa por variante
- [ ] Legal: `/legal/privacy.html` + `/legal/terms.html`

---

## Should-have (pós-regras, pode entrar antes ou depois do 1.º AAB)

- [ ] Explicação textual jogada ilegal
- [ ] Revanche offline rápida
- [ ] Salas privadas + reconnect (P5 backend)
- [ ] Ranking / histórico local expandido

---

## Won't-have (v1)

- Novos jogos além dos 4 actuais
- Ranked/MMR online, torneios, clubes, chat
- Loja, missões, XP, monetização, ads
- Coach, replay, puzzles, campanha
- Nil/blind nil Spades, renúncia/challenge Sueca
- Pass-and-play, IAP verso vermelho

---

## Gate Android (comando)

Quando todos os Must-have estiverem `[x]`:

```bash
cd frontend
npm run release:android
# → docs/ANDROID_SIGNING.md → internal track
```

Ver [prompts/P8-qa-release.md](prompts/P8-qa-release.md).
