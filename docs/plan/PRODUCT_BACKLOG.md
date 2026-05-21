# SUECÂO — Product Backlog (inventário completo)

**Data:** Maio 2026 · Branch `v2-main`

> **Nota:** Este documento é um inventário de ideias — **não** é roadmap de implementação.  
> Para o que entra em v1, ver [PRODUCT_ESSENTIALS.md](PRODUCT_ESSENTIALS.md).

---

## 1. Core da app

### Jogos incluídos
- Sueca, Hearts, Spades, King

### Possibilidade futura
- Bisca, Copas, Bridge simplificado, Tute, Buraco, Canasta, Truco, Rummy

### Modos principais
- Solo vs bots · Online vs pessoas · Com amigos · Equipa · Torneios · Ranked · Casual · Offline · Treino/tutorial

---

## 2. Lobby / menu inicial

- Home: Jogar agora, escolher jogo, continuar partida, criar/entrar sala, offline, ranking, perfil, loja, missões, definições
- Seleção rápida: último jogo, última variante, revanche, mesmos amigos, partida rápida

---

## 3. Perfis de jogador

### Básico
- Nome, avatar, país, nível, XP, estatísticas, favoritos, histórico, V/D, ranking, medalhas

### Avançado
- Win rate por jogo/parceiro, sequências, abandonos, tempo médio, estilo (agressivo/defensivo/…), reputação, emblemas

---

## 4. Sistema de regras

### Motor
- Regras por jogo, configuráveis, validação automática, jogada ilegal + explicação, variantes, presets

### Sueca
- 4 jogadores, 2v2, baralho 40, hierarquia Ás-7-R-V-D-6-5-4-3-2, 120 pts, trunfo, assistir naipe, pontuação por equipa, fim mão/partida
- Variantes: trunfo última carta/escolhido/oculto, baralhar/cortar, quem começa, partida até 4/10/21 jogos, bandeiras/capote/contra-capote, renúncia, sinalização, clássico PT, competitivo sem ajudas

### Hearts
- 52 cartas, copas 1 pt, Q♠ 13, passagem L/R/frente/sem, quebrar copas, shoot the moon, fim 100 pts configurável
- Variantes: valor Q♠, J♦ negativo, shoot moon 26, alvo 50/100/150, 1.ª vaza copas/Q♠

### Spades
- 2v2, espadas trunfo, bids, contrato, bags, nil/blind nil, seguir naipe, espadas quebradas, fim por pontos
- Variantes: 250/500/1000, nil rules, bags custom, bidding individual/equipa, jokers, solo/partnership

### King
- Contratos por rodada, pontuação +/-, festas clássicas (não fazer vazas/copas/damas/reis/rei copas/últimas vazas/fazer vazas/positivo)
- Variantes: PT/turco/russo/BR, contratos fixos/escolhidos, custom, com/sem trunfo, curto/longo

---

## 5. IA / bots

- Níveis fácil/médio/difícil/especialista, estilos, por jogo (contagem, trunfo, parceiro, capote, shoot moon, bids, contratos King)
- Avançado: Monte Carlo, personalidade, erros humanos, tempo natural, coach treino, fantasma online

---

## 6. Multiplayer online

- Matchmaking (rápido, nível, região, ranked, casual, bots em fila)
- Salas privadas (código, link, convite, regras, bots, chat, pronto, trocar lugar/equipa)
- In-game: sync, reconnect, pausa, bot substituto, tempo limite, abandono, indicadores
- Revanche: rápida, mesmos jogadores, trocar parceiros/lugares, votar

---

## 7. Sistema ranked / competitivo

- Rankings global/país/amigos/jogo/temporada/modo/equipa
- ELO/MMR, casual vs ranked, divisões Bronze→Lenda, temporadas, recompensas

---

## 8. Torneios

- Por jogo, casual/ranked/privado; formatos eliminação, liga, swiss, melhor de 3/5; diários/semanais
- Inscrição, check-in, bracket, prémios, espectador, chat, notificações, anti-abandono

---

## 9. UX do jogo

- Mesa limpa, cartas legíveis, animações, tap/drag, cartas jogáveis/ilegais, trunfo/vez/dealer/pontuação, histórico vaza
- Acessibilidade: jumbo, contraste, daltónico, animações reduzidas, háptico, som, voz
- Ajuda visual: jogáveis, pontuação provável, cartas jogadas, modo iniciante vs competitivo

---

## 10. Tutoriais e aprendizagem

- Tutorial geral + por jogo + variantes + pontuação + estratégia
- Modo treino: guiado, melhor jogada, repetir mão, desfazer, ver bots, puzzles, desafios diários

---

## 11. Chat, emotes e social

- Chat texto/frases/emotes/reações/stickers, silenciar/denunciar/bloquear
- Amigos, convites, recentes, favoritar parceiro, clubes, equipas fixas, histórico H2H

---

## 12. Anti-cheat / fair play

- Servidor autoritativo, logs, deteção colaboração/multi-conta/abandono
- Penalizações, reputação, moderação, suspensões, ban

---

## 13. Estatísticas

- Gerais + por jogo (Sueca capotes, Hearts shoot moon, Spades bids/bags, King contratos)

---

## 14. Histórico e replay

- Histórico partidas, replay jogada a jogada, partilhar, denúncia, treino

---

## 15. Personalização

- Temas mesa/cartas/fundos/avatares/versos/naipes/áudio/velocidade/confirmação/ordenação mão/tablet/orientação

---

## 16. Progressão e gamificação

- XP, níveis, missões diárias/semanais, conquistas

---

## 17. Economia interna

- Moedas virtuais, cosméticos — **sem vantagem competitiva**

---

## 18. Monetização

- Ads opcionais, remove ads, passe temporada, cosméticos premium — **sem pay-to-win**

---

## 19. Offline

- Bots configuráveis, salvar partida, stats locais, tutoriais, modo avião, pass-and-play, Bluetooth/Wi-Fi local

---

## 20. Notificações

- Amigo online, convite, torneio, missões, recompensa, revanche, temporada — configuráveis

---

## 21. Administração / backend

- Eventos, torneios, recompensas, banners, cosméticos, temporadas, missões, moderação, analytics (DAU, retenção, funil)

---

## 22. Onboarding

- Idioma, nome, avatar, jogo preferido, nível, tutorial sugerido, 1.ª partida bots, onboarding inteligente por jogo

---

## 23. Internacionalização

- PT, PT-BR, EN, ES, FR, IT, TR, RU; regras/baralhos regionais, moderação por idioma

---

## 24. Features “go wild”

- Coach inteligente, replay com análise, bots com personalidade, clubes, espectador, eventos especiais, campanha, modo party, modo sénior/baixa visão

---

## 25. MVP realista (referência histórica)

- Fase 1: Sueca offline · Fase 2: MP privado · Fase 3: outros jogos + ranked + cosméticos

---

## 26. Features obrigatórias (não parecer app fraca)

- Motor regras, bots decentes, cartas legíveis, animações, ilegais bloqueadas, pontuação transparente, histórico vaza, tutorial, offline, reconnect, salas, revanche, stats, definições, acessível, anti-abandono, variantes, ranking básico

---

## 27. Features diferenciadoras

- Coach, replay análise, bots personalidade, variantes regionais, modo sénior, torneios privados, clubes, stats profundas, puzzles, campanha, personalização, MP estável, sem pay-to-win

---

## 28. Estrutura técnica recomendada

- Separar: motor cartas, motor regras, estado partida, UI, bots, MP, persistência, stats, variantes
- Modelo: **plataforma de trick-taking games**, cada jogo = regras + pontuação + variantes

---

## 29. Prioridade prática (referência)

1. Motor cartas → motor vazas → Sueca offline → bots → UI → salas → reconnect → Hearts → Spades → King → ranked → torneios → coach → clubes → monetização

---

Ver também: [PRODUCT_ESSENTIALS.md](PRODUCT_ESSENTIALS.md) · [PLAN_GLOBAL.md](PLAN_GLOBAL.md) · [STATUS.md](../STATUS.md)
