import { GameState, Card, Suit, AIDifficulty, CARD_HIERARCHY } from '../../../types/game';

/**
 * Context supplied by Game.ts to avoid coupling the strategy to the class.
 */
export interface SuecaStrategyContext {
  /** Returns legal cards that the player can play. */
  getValidCards(playerIndex: number): Array<{ card: Card; index: number }>;
}

// ---------------------------------------------------------------------------
// Partner signal helpers (operate on GameState.partnerSignals directly)
// ---------------------------------------------------------------------------

export function getPartnerIndex(state: GameState, playerIndex: number): number | null {
  const player = state.players[playerIndex];
  const partner = state.players.find((p) => p.team === player.team && p.id !== player.id);
  if (!partner) return null;
  return state.players.findIndex((p) => p.id === partner.id);
}

export function getPartnerSignal(state: GameState, playerIndex: number): string | null {
  const partnerIndex = getPartnerIndex(state, playerIndex);
  if (partnerIndex === null) return null;
  const signals = state.partnerSignals.filter((s) => s.playerIndex === playerIndex);
  return signals.length > 0 ? signals[signals.length - 1].signal : null;
}

export function sendPartnerSignal(state: GameState, playerIndex: number, signal: string): void {
  const partnerIndex = getPartnerIndex(state, playerIndex);
  if (partnerIndex === null) return;
  state.partnerSignals.push({
    playerIndex: partnerIndex,
    signal,
    trick: state.round * 10 - (10 - state.players[0].hand.length)
  });
  if (state.partnerSignals.length > 5) state.partnerSignals.shift();
}

// ---------------------------------------------------------------------------
// Card-tracking helpers (operate on GameState directly)
// ---------------------------------------------------------------------------

function getPlayedCardsCount(state: GameState, suit: Suit): number {
  return state.playedCards.filter((c) => c.suit === suit).length;
}

function getPlayedTrumpsCount(state: GameState): number {
  if (!state.trumpSuit) return 0;
  return getPlayedCardsCount(state, state.trumpSuit);
}

/**
 * Probability [0,1] that `card` will win, given cards already played.
 * Used by hard difficulty only.
 */
export function calculateWinProbability(
  state: GameState,
  card: Card,
  suit: Suit,
  trumpSuit: Suit
): number {
  const cardValue = CARD_HIERARCHY[card.rank];
  const isTrump = card.suit === trumpSuit;
  const totalCards = 40;
  const cardsRemaining =
    totalCards - state.playedCards.length - state.currentTrick.length;

  if (cardsRemaining <= 0) return 0.5;

  if (isTrump) {
    const higherTrumpsPlayed = state.playedCards.filter(
      (c) => c.suit === trumpSuit && CARD_HIERARCHY[c.rank] > cardValue
    ).length;
    const higherTrumpsInTrick = state.currentTrick.filter(
      (c) => c.suit === trumpSuit && CARD_HIERARCHY[c.rank] > cardValue
    ).length;
    const totalTrumps = 10;
    const trumpsPlayed = getPlayedTrumpsCount(state);
    const trumpsInTrick = state.currentTrick.filter((c) => c.suit === trumpSuit).length;
    const trumpsRemaining = totalTrumps - trumpsPlayed - trumpsInTrick;
    const higherTrumpsRemaining = Math.max(
      0,
      totalTrumps - cardValue - higherTrumpsPlayed - higherTrumpsInTrick
    );
    return Math.max(0, Math.min(1, 1 - higherTrumpsRemaining / Math.max(1, trumpsRemaining)));
  }

  const trumpsInTrick = state.currentTrick.filter((c) => c.suit === trumpSuit).length;
  if (trumpsInTrick > 0) return 0;

  const higherCardsPlayed = state.playedCards.filter(
    (c) => c.suit === suit && CARD_HIERARCHY[c.rank] > cardValue
  ).length;
  const higherCardsInTrick = state.currentTrick.filter(
    (c) => c.suit === suit && CARD_HIERARCHY[c.rank] > cardValue
  ).length;
  const totalSuitCards = 10;
  const suitCardsPlayed = getPlayedCardsCount(state, suit);
  const suitCardsInTrick = state.currentTrick.filter((c) => c.suit === suit).length;
  const suitCardsRemaining = totalSuitCards - suitCardsPlayed - suitCardsInTrick;
  const higherCardsRemaining = Math.max(
    0,
    totalSuitCards - cardValue - higherCardsPlayed - higherCardsInTrick
  );
  return Math.max(0, Math.min(1, 1 - higherCardsRemaining / Math.max(1, suitCardsRemaining)));
}

/**
 * Sueca card-play strategy (easy / medium / hard).
 *
 * Easy: 70% chance to pick from the 3 lowest legal cards, 30% random.
 * Medium: heuristic — lead with strength, follow by trying to win cheaply.
 * Hard: medium + card-probability tracking + partner signal coordination.
 */
export function chooseSuecaCard(
  state: GameState,
  playerIndex: number,
  ctx: SuecaStrategyContext
): number {
  const player = state.players[playerIndex];
  const trick = state.currentTrick;
  const trumpSuit = state.trumpSuit!;
  const difficulty: AIDifficulty = state.aiDifficulty;

  const validCards = ctx.getValidCards(playerIndex);
  if (validCards.length === 0) return -1;

  // --- Easy ---
  if (difficulty === 'easy') {
    if (Math.random() < 0.7) {
      validCards.sort((a, b) => CARD_HIERARCHY[a.card.rank] - CARD_HIERARCHY[b.card.rank]);
      return validCards[Math.floor(Math.random() * Math.min(3, validCards.length))].index;
    }
    return validCards[Math.floor(Math.random() * validCards.length)].index;
  }

  // --- Medium + Hard ---
  const isCardLikelyToWin = (card: Card, suit: Suit): boolean => {
    if (difficulty === 'hard') {
      return calculateWinProbability(state, card, suit, trumpSuit) > 0.5;
    }
    if (card.suit === trumpSuit) {
      return state.playedCards.filter(
        (c) => c.suit === trumpSuit && CARD_HIERARCHY[c.rank] > CARD_HIERARCHY[card.rank]
      ).length < 2;
    }
    return state.playedCards.filter(
      (c) => c.suit === suit && CARD_HIERARCHY[c.rank] > CARD_HIERARCHY[card.rank]
    ).length < 2;
  };

  // Leading
  if (trick.length === 0) {
    const suitCounts: Record<Suit, number> = { clubs: 0, diamonds: 0, hearts: 0, spades: 0 };
    player.hand.forEach((card) => { suitCounts[card.suit]++; });

    if (difficulty === 'hard') {
      const partnerSignal = getPartnerSignal(state, playerIndex);
      if (partnerSignal === 'need_trump') {
        const trumpCards = validCards.filter((v) => v.card.suit === trumpSuit);
        if (trumpCards.length > 0) {
          sendPartnerSignal(state, playerIndex, 'helping_trump');
          return trumpCards[0].index;
        }
      }
    }

    let bestCard = validCards[0];
    let bestScore = 0;
    for (const v of validCards) {
      const suit = v.card.suit;
      const rankValue = CARD_HIERARCHY[v.card.rank];
      const suitCount = suitCounts[suit];
      let score = rankValue * 2 + suitCount;
      if (suit === trumpSuit && suitCount > 3) score += 5;
      if (difficulty === 'hard' && suitCount >= 4 && rankValue >= CARD_HIERARCHY['K']) score += 3;
      if (score > bestScore) { bestScore = score; bestCard = v; }
    }

    if (difficulty === 'hard' && bestCard.card.suit === trumpSuit && suitCounts[trumpSuit] > 3) {
      sendPartnerSignal(state, playerIndex, 'leading_trumps');
    }
    return bestCard.index;
  }

  // Following
  const leadSuit = trick[0].suit;
  const leadCard = trick[0];
  const leadValue = CARD_HIERARCHY[leadCard.rank];
  const isLeadTrump = leadCard.suit === trumpSuit;
  const partnerIndex = getPartnerIndex(state, playerIndex);
  const isPartnerLeading = partnerIndex !== null && state.trickLeader === partnerIndex;

  const trumpsInTrick = trick.filter((c) => c.suit === trumpSuit);
  const highestTrumpInTrick =
    trumpsInTrick.length > 0
      ? Math.max(...trumpsInTrick.map((c) => CARD_HIERARCHY[c.rank]))
      : 0;

  const cardsOfLeadSuit = validCards.filter((v) => v.card.suit === leadSuit);
  const trumpCards = validCards.filter((v) => v.card.suit === trumpSuit);
  const otherCards = validCards.filter(
    (v) => v.card.suit !== leadSuit && v.card.suit !== trumpSuit
  );

  if (difficulty === 'hard' && isPartnerLeading && cardsOfLeadSuit.length > 0) {
    const winningCards = cardsOfLeadSuit.filter(
      (v) => CARD_HIERARCHY[v.card.rank] > leadValue && !isLeadTrump
    );
    if (winningCards.length > 0) {
      const partnerSignal = getPartnerSignal(state, playerIndex);
      if (partnerSignal === 'need_help') {
        return winningCards.reduce((best, cur) =>
          CARD_HIERARCHY[cur.card.rank] > CARD_HIERARCHY[best.card.rank] ? cur : best
        ).index;
      }
      return winningCards.reduce((best, cur) =>
        CARD_HIERARCHY[cur.card.rank] < CARD_HIERARCHY[best.card.rank] ? cur : best
      ).index;
    }
    const highestSupport = cardsOfLeadSuit.reduce((best, cur) =>
      CARD_HIERARCHY[cur.card.rank] > CARD_HIERARCHY[best.card.rank] ? cur : best
    );
    if (CARD_HIERARCHY[highestSupport.card.rank] < CARD_HIERARCHY['K']) {
      return highestSupport.index;
    }
  }

  if (cardsOfLeadSuit.length > 0) {
    const winningLeadCards = cardsOfLeadSuit.filter(
      (v) => CARD_HIERARCHY[v.card.rank] > leadValue && !isLeadTrump
    );
    if (winningLeadCards.length > 0) {
      const likelyWinners = winningLeadCards.filter((v) => isCardLikelyToWin(v.card, leadSuit));
      const pool = likelyWinners.length > 0 ? likelyWinners : winningLeadCards;
      return pool.reduce((best, cur) =>
        CARD_HIERARCHY[cur.card.rank] < CARD_HIERARCHY[best.card.rank] ? cur : best
      ).index;
    }
    return cardsOfLeadSuit.reduce((best, cur) =>
      CARD_HIERARCHY[cur.card.rank] < CARD_HIERARCHY[best.card.rank] ? cur : best
    ).index;
  }

  if (trumpCards.length > 0 && highestTrumpInTrick > 0) {
    const winningTrumps = trumpCards.filter(
      (v) => CARD_HIERARCHY[v.card.rank] > highestTrumpInTrick
    );
    if (winningTrumps.length > 0) {
      return winningTrumps.reduce((best, cur) =>
        CARD_HIERARCHY[cur.card.rank] < CARD_HIERARCHY[best.card.rank] ? cur : best
      ).index;
    }
  }

  if (trumpCards.length > 0 && highestTrumpInTrick === 0) {
    const lowTrumps = trumpCards.filter(
      (v) => CARD_HIERARCHY[v.card.rank] < CARD_HIERARCHY['K']
    );
    if (lowTrumps.length > 0) {
      return lowTrumps.reduce((best, cur) =>
        CARD_HIERARCHY[cur.card.rank] < CARD_HIERARCHY[best.card.rank] ? cur : best
      ).index;
    }
    if (trumpCards.length > 3) {
      return trumpCards.reduce((best, cur) =>
        CARD_HIERARCHY[cur.card.rank] < CARD_HIERARCHY[best.card.rank] ? cur : best
      ).index;
    }
  }

  if (otherCards.length > 0) {
    return otherCards.reduce((best, cur) =>
      CARD_HIERARCHY[cur.card.rank] < CARD_HIERARCHY[best.card.rank] ? cur : best
    ).index;
  }

  return validCards[0].index;
}
