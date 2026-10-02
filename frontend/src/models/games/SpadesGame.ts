import { BaseGameAdapter } from './GameAdapter';
import { GameState, Player, AIDifficulty } from '../../types/game';
import { chooseBlindNilPreView, chooseSpadesBid } from '../../ai/games/spades/SpadesBidEstimator';
import { chooseSpadesCard } from '../../ai/games/spades/SpadesPlayStrategy';
import { Deck } from '../Deck';
import { trickWinnerIndex } from './trickUtils';
import { applyHandSortToState } from '../../utils/handSort';
import { resolvePresetId } from '../../constants/rulesPresets';
import {
  getSpadesPresetOptions,
  SpadesBidType
} from './spades/spadesRules';
import { SpadesVariantFlow } from './variantFlowApi';
import { recordSpadesBid } from '../../diagnostics/session';
import { teamMatchResult } from '../matchResult';

const WINNING_SCORE = 500;
const BAG_PENALTY_EVERY = 10;
const BAG_PENALTY_POINTS = 100;

export interface SpadesVariantState {
  playerBids: (number | null)[];
  playerBidTypes: SpadesBidType[];
  bidLeaderIndex: number;
  currentBidderIndex: number;
  team1Bid: number;
  team2Bid: number;
  team1Tricks: number;
  team2Tricks: number;
  playerTricks: number[];
  team1Bags: number;
  team2Bags: number;
  waitingForBids: boolean;
  spadesBroken: boolean;
  nilEnabled: boolean;
  blindNilEnabled: boolean;
  /**
   * Per seat. False while that bidder still owes a pre-view Blind Nil decision.
   * Absent on older saves: treated as already resolved so hands are not hidden.
   */
  blindNilResolved?: boolean[];
}

function emptyBidTypes(): SpadesBidType[] {
  return ['normal', 'normal', 'normal', 'normal'];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSeat(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3;
}

function isBidValue(value: unknown): value is number | null {
  if (value === null) return true;
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 13;
}

function isBidType(value: unknown): value is SpadesBidType {
  return value === 'normal' || value === 'nil' || value === 'blindNil';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNumber4(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 4 && value.every(isFiniteNumber);
}

function isBool4(value: unknown): value is boolean[] {
  return Array.isArray(value) && value.length === 4 && value.every((entry) => typeof entry === 'boolean');
}

/**
 * A missing Spades object is not a match. Callers must not bid or play from it.
 * The bidder is -1 so a read cannot look like "seat 0 is waiting to bid".
 */
function nonLiveSpadesState(): SpadesVariantState {
  return {
    playerBids: [null, null, null, null],
    playerBidTypes: emptyBidTypes(),
    bidLeaderIndex: -1,
    currentBidderIndex: -1,
    team1Bid: 0,
    team2Bid: 0,
    team1Tricks: 0,
    team2Tricks: 0,
    playerTricks: [0, 0, 0, 0],
    team1Bags: 0,
    team2Bags: 0,
    waitingForBids: false,
    spadesBroken: false,
    nilEnabled: false,
    blindNilEnabled: false,
    blindNilResolved: [true, true, true, true]
  };
}

/**
 * Required, or the object is not a recognizable Spades hand:
 * - playerBids length 4 (null or 0..13). Absence is not "nobody has bid".
 * - bidLeaderIndex 0..3. Never invented as 0.
 * - waitingForBids when it cannot be derived from the bid array.
 * - currentBidderIndex 0..3 while bidding, and that seat's bid is still null.
 * - playerBidTypes when nil or blind nil is enabled.
 * - team tricks and playerTricks once bidding is over.
 * - bags once the match is past round 1.
 * - spadesBroken once play has started.
 *
 * Safe to fill:
 * - blindNilResolved → all true (an old save must not hide the hand or ask again).
 * - nilEnabled / blindNilEnabled → false, unless an existing bid type already shows that mode.
 * - playerBidTypes → normal, only when nil modes are off.
 * - waitingForBids → false when every bid is already a number; true only when some bids
 *   exist, some are null, and the saved bidder is one of the null seats.
 * - team bids → derived when the auction is complete; 0 while it is still open.
 * - tricks, bags, spadesBroken → 0 / false only before play (bidding, round 1 for bags).
 *
 * A stored waitingForBids of true is closed when every seat already has a bid.
 * A stored false with a null bid is rejected rather than reopened.
 * Returns the same object when nothing needs to change.
 */
export function normalizeSpadesVariant(raw: unknown, game: GameState): SpadesVariantState | null {
  if (!isPlainObject(raw)) return null;
  const src = raw as Partial<SpadesVariantState>;

  if (!Array.isArray(src.playerBids) || src.playerBids.length !== 4 || !src.playerBids.every(isBidValue)) {
    return null;
  }
  const playerBids = src.playerBids as (number | null)[];
  if (!isSeat(src.bidLeaderIndex)) return null;

  const bidsComplete = playerBids.every((bid) => bid !== null);
  const anyBid = playerBids.some((bid) => bid !== null);
  let waitingForBids: boolean;
  let waitingChanged = false;
  if (typeof src.waitingForBids === 'boolean') {
    if (src.waitingForBids && bidsComplete) {
      waitingForBids = false;
      waitingChanged = true;
    } else if (!src.waitingForBids && !bidsComplete) {
      return null;
    } else {
      waitingForBids = src.waitingForBids;
    }
  } else if (bidsComplete) {
    waitingForBids = false;
    waitingChanged = true;
  } else if (anyBid && isSeat(src.currentBidderIndex) && playerBids[src.currentBidderIndex] === null) {
    waitingForBids = true;
    waitingChanged = true;
  } else {
    return null;
  }

  let currentBidderIndex: number;
  let bidderChanged = false;
  if (waitingForBids) {
    if (!isSeat(src.currentBidderIndex) || playerBids[src.currentBidderIndex] !== null) return null;
    currentBidderIndex = src.currentBidderIndex;
  } else if (isSeat(src.currentBidderIndex) || src.currentBidderIndex === -1) {
    currentBidderIndex = src.currentBidderIndex;
  } else if (src.currentBidderIndex === undefined) {
    currentBidderIndex = -1;
    bidderChanged = true;
  } else {
    return null;
  }

  const nilFlag = src.nilEnabled === true;
  const blindFlag = src.blindNilEnabled === true;
  let playerBidTypes: SpadesBidType[];
  let typesChanged = false;
  if (
    Array.isArray(src.playerBidTypes) &&
    src.playerBidTypes.length === 4 &&
    src.playerBidTypes.every(isBidType)
  ) {
    playerBidTypes = src.playerBidTypes;
  } else if (src.playerBidTypes === undefined && !nilFlag && !blindFlag) {
    playerBidTypes = emptyBidTypes();
    typesChanged = true;
  } else {
    return null;
  }

  const sawNil = playerBidTypes.some((bidType) => bidType === 'nil');
  const sawBlind = playerBidTypes.some((bidType) => bidType === 'blindNil');
  let nilEnabled: boolean;
  let blindNilEnabled: boolean;
  let flagsChanged = false;
  if (typeof src.nilEnabled === 'boolean') nilEnabled = src.nilEnabled;
  else {
    nilEnabled = sawNil;
    flagsChanged = true;
  }
  if (typeof src.blindNilEnabled === 'boolean') blindNilEnabled = src.blindNilEnabled;
  else {
    blindNilEnabled = sawBlind;
    flagsChanged = true;
  }

  let team1Bid: number;
  let team2Bid: number;
  let teamBidsChanged = false;
  if (isFiniteNumber(src.team1Bid) && isFiniteNumber(src.team2Bid)) {
    team1Bid = src.team1Bid;
    team2Bid = src.team2Bid;
  } else if (!isFiniteNumber(src.team1Bid) && src.team1Bid !== undefined) {
    return null;
  } else if (!isFiniteNumber(src.team2Bid) && src.team2Bid !== undefined) {
    return null;
  } else if (bidsComplete) {
    const teams = teamBidsFromPlayerBids(playerBids as number[], playerBidTypes);
    team1Bid = isFiniteNumber(src.team1Bid) ? src.team1Bid : teams.team1;
    team2Bid = isFiniteNumber(src.team2Bid) ? src.team2Bid : teams.team2;
    teamBidsChanged = true;
  } else {
    team1Bid = isFiniteNumber(src.team1Bid) ? src.team1Bid : 0;
    team2Bid = isFiniteNumber(src.team2Bid) ? src.team2Bid : 0;
    teamBidsChanged = src.team1Bid === undefined || src.team2Bid === undefined;
  }

  let team1Tricks: number;
  let team2Tricks: number;
  let playerTricks: number[];
  let tricksChanged = false;
  if (waitingForBids) {
    if (src.team1Tricks === undefined) {
      team1Tricks = 0;
      tricksChanged = true;
    } else if (isFiniteNumber(src.team1Tricks)) team1Tricks = src.team1Tricks;
    else return null;
    if (src.team2Tricks === undefined) {
      team2Tricks = 0;
      tricksChanged = true;
    } else if (isFiniteNumber(src.team2Tricks)) team2Tricks = src.team2Tricks;
    else return null;
    if (src.playerTricks === undefined) {
      playerTricks = [0, 0, 0, 0];
      tricksChanged = true;
    } else if (isNumber4(src.playerTricks)) playerTricks = src.playerTricks;
    else return null;
  } else {
    if (!isFiniteNumber(src.team1Tricks) || !isFiniteNumber(src.team2Tricks) || !isNumber4(src.playerTricks)) {
      return null;
    }
    team1Tricks = src.team1Tricks;
    team2Tricks = src.team2Tricks;
    playerTricks = src.playerTricks;
  }

  let team1Bags: number;
  let team2Bags: number;
  let bagsChanged = false;
  if (isFiniteNumber(src.team1Bags) && isFiniteNumber(src.team2Bags)) {
    team1Bags = src.team1Bags;
    team2Bags = src.team2Bags;
  } else if (
    game.round === 1 &&
    src.team1Bags === undefined &&
    src.team2Bags === undefined
  ) {
    team1Bags = 0;
    team2Bags = 0;
    bagsChanged = true;
  } else {
    return null;
  }

  let spadesBroken: boolean;
  let brokenChanged = false;
  if (typeof src.spadesBroken === 'boolean') spadesBroken = src.spadesBroken;
  else if (waitingForBids && src.spadesBroken === undefined) {
    spadesBroken = false;
    brokenChanged = true;
  } else {
    return null;
  }

  const blindNilResolved = isBool4(src.blindNilResolved)
    ? src.blindNilResolved
    : [true, true, true, true];
  const blindChanged = !isBool4(src.blindNilResolved);

  if (
    !waitingChanged &&
    !bidderChanged &&
    !typesChanged &&
    !flagsChanged &&
    !teamBidsChanged &&
    !tricksChanged &&
    !bagsChanged &&
    !brokenChanged &&
    !blindChanged
  ) {
    return src as SpadesVariantState;
  }

  return {
    playerBids: [...playerBids],
    playerBidTypes: [...playerBidTypes],
    bidLeaderIndex: src.bidLeaderIndex,
    currentBidderIndex,
    team1Bid,
    team2Bid,
    team1Tricks,
    team2Tricks,
    playerTricks: [...playerTricks],
    team1Bags,
    team2Bags,
    waitingForBids,
    spadesBroken,
    nilEnabled,
    blindNilEnabled,
    blindNilResolved: [...blindNilResolved]
  };
}

export function getSpadesState(state: GameState): SpadesVariantState {
  return normalizeSpadesVariant(state.variantState?.spades, state) ?? nonLiveSpadesState();
}

/** True only for the bidder who has not yet accepted or declined Blind Nil. */
export function isBlindNilDecisionPending(spades: SpadesVariantState, seat: number): boolean {
  if (!spades.waitingForBids || !spades.blindNilEnabled) return false;
  const resolved = spades.blindNilResolved;
  if (!resolved || resolved.length !== 4) return false;
  return resolved[seat] !== true;
}

function teamBidsFromPlayerBids(
  bids: number[],
  types: SpadesBidType[]
): { team1: number; team2: number } {
  let team1 = 0;
  let team2 = 0;
  for (let i = 0; i < 4; i++) {
    if (types[i] === 'nil' || types[i] === 'blindNil') continue;
    if (i === 0 || i === 2) team1 += bids[i];
    else team2 += bids[i];
  }
  return { team1, team2 };
}

function nilRoundBonus(bidType: SpadesBidType, tricksTaken: number): number {
  if (bidType === 'nil') return tricksTaken === 0 ? 100 : -100;
  if (bidType === 'blindNil') return tricksTaken === 0 ? 200 : -200;
  return 0;
}


export class SpadesGame extends BaseGameAdapter {
  variant = 'spades' as const;
  private state?: GameState;

  getVariantFlow(): SpadesVariantFlow {
    return {
      kind: 'spades',
      readState: getSpadesState,
      submitBid: (playerIndex, bid, bidType) => this.submitBid(playerIndex, bid, bidType),
      declineBlindNil: (playerIndex) => this.declineBlindNil(playerIndex),
      tickBidAi: () => this.tickBidAi()
    };
  }

  initialize(playerNames: string[], options?: Record<string, unknown>): GameState {
    this.state = this.createRoundState(playerNames, options, 1, { team1: 0, team2: 0 }, {
      prevDealerIndex: undefined,
      prevBidLeaderIndex: undefined,
      waitingForBids: true,
      carriedBags: { team1: 0, team2: 0 }
    });
    return this.cloneState(this.state);
  }

  getCurrentState(): GameState {
    if (!this.state) throw new Error('SpadesGame not initialized');
    return this.cloneState(this.state);
  }

  protected getMutableEngineState(): GameState | undefined {
    return this.state;
  }

  /** Recognizable Spades object only. A missing or unsafe partial is not installed. */
  private recognizedSpades(): SpadesVariantState | null {
    if (!this.state) return null;
    return normalizeSpadesVariant(this.state.variantState?.spades, this.state);
  }

  /** @deprecated Use submitBid sequentially. Kept for tests. */
  applyBids(playerBids: number[]): void {
    if (!this.state) return;
    const spades = this.recognizedSpades();
    if (!spades?.waitingForBids) return;

    const leader = spades.bidLeaderIndex;
    for (let step = 0; step < 4; step++) {
      const playerIndex = (leader + step) % 4;
      this.declineBlindNil(playerIndex);
      this.submitBid(playerIndex, playerBids[playerIndex] ?? 0, 'normal');
    }
  }

  submitBid(playerIndex: number, bid: number, bidType: SpadesBidType = 'normal'): boolean {
    if (!this.state) return false;
    const spades = this.recognizedSpades();
    if (!spades?.waitingForBids) return false;
    if (playerIndex !== spades.currentBidderIndex) return false;

    const blindPending = isBlindNilDecisionPending(spades, playerIndex);
    if (blindPending && bidType !== 'blindNil') return false;

    let normalizedBid = Math.max(0, Math.min(13, Math.floor(bid)));
    let normalizedType: SpadesBidType = bidType;

    if (normalizedType === 'nil') {
      if (!spades.nilEnabled) return false;
      normalizedBid = 0;
    } else if (normalizedType === 'blindNil') {
      if (!blindPending) return false;
      normalizedBid = 0;
    } else {
      normalizedType = 'normal';
    }

    spades.playerBids[playerIndex] = normalizedBid;
    spades.playerBidTypes[playerIndex] = normalizedType;
    this.markBlindNilResolved(spades, playerIndex);

    const bidsComplete = spades.playerBids.every((value) => value !== null);
    if (bidsComplete) {
      this.finalizeBidding(spades);
    } else {
      spades.currentBidderIndex = (spades.currentBidderIndex + 1) % 4;
    }

    this.state.variantState = { ...this.state.variantState, spades };

    try {
      recordSpadesBid({
        seat: playerIndex,
        bid: normalizedBid,
        bidType: normalizedType,
        nil: normalizedType === 'nil' || normalizedType === 'blindNil',
        blindNil: normalizedType === 'blindNil',
        nilEnabled: spades.nilEnabled,
        currentBidderAfter: spades.currentBidderIndex,
        bidsComplete,
        team1Bid: bidsComplete ? spades.team1Bid : null,
        team2Bid: bidsComplete ? spades.team2Bid : null,
        roundIndex: this.state.round
      });
    } catch {
      /* diagnostic must never block bidding */
    }

    return true;
  }

  /**
   * Decline pre-view Blind Nil. The hand may then be shown and a normal bid,
   * including Nil, can be submitted. Blind Nil itself is no longer legal.
   */
  declineBlindNil(playerIndex: number): boolean {
    if (!this.state) return false;
    const spades = this.recognizedSpades();
    if (!spades || playerIndex !== spades.currentBidderIndex) return false;
    if (!isBlindNilDecisionPending(spades, playerIndex)) return false;
    this.markBlindNilResolved(spades, playerIndex);
    this.state.variantState = { ...this.state.variantState, spades };
    return true;
  }

  chooseAIBid(playerIndex: number): { bid: number; bidType: SpadesBidType } {
    const s = this.state!;
    const spades = this.recognizedSpades();
    if (!spades) return { bid: 0, bidType: 'normal' };
    const hand = s.players[playerIndex]?.hand ?? [];
    return chooseSpadesBid(hand, spades.nilEnabled, false, s.aiDifficulty);
  }

  tickBidAi(): void {
    if (!this.state) return;
    if (this.state.isPaused) return;
    const spades = this.recognizedSpades();
    if (!spades?.waitingForBids) return;

    const playerIndex = spades.currentBidderIndex;
    const player = this.state.players[playerIndex];
    if (!player || player.type === 'human') return;

    if (isBlindNilDecisionPending(spades, playerIndex)) {
      if (this.state.isPaused) return;
      const takeBlind = chooseBlindNilPreView(this.state.aiDifficulty);
      if (takeBlind) {
        this.submitBid(playerIndex, 0, 'blindNil');
        return;
      }
      this.declineBlindNil(playerIndex);
    }

    const { bid, bidType } = this.chooseAIBid(playerIndex);
    this.submitBid(playerIndex, bid, bidType);
  }

  private markBlindNilResolved(spades: SpadesVariantState, seat: number): void {
    const resolved = spades.blindNilResolved ? [...spades.blindNilResolved] : [true, true, true, true];
    resolved[seat] = true;
    spades.blindNilResolved = resolved;
  }

  private finalizeBidding(spades: SpadesVariantState): void {
    const resolvedBids = spades.playerBids.map((value) => value ?? 0);
    const teams = teamBidsFromPlayerBids(resolvedBids, spades.playerBidTypes);
    spades.playerBids = resolvedBids;
    spades.team1Bid = teams.team1;
    spades.team2Bid = teams.team2;
    spades.waitingForBids = false;
    spades.team1Tricks = 0;
    spades.team2Tricks = 0;
    spades.playerTricks = [0, 0, 0, 0];

    const leadIndex = (this.state!.dealerIndex + 1) % 4;
    this.state!.waitingForRoundStart = false;
    this.state!.currentPlayerIndex = leadIndex;
    this.state!.trickLeader = leadIndex;
    this.state!.isFirstTrick = true;
  }

  private createRoundState(
    playerNames: string[],
    options: Record<string, unknown> | undefined,
    round: number,
    gameScore: { team1: number; team2: number },
    roundOptions: {
      prevDealerIndex?: number;
      prevBidLeaderIndex?: number;
      waitingForBids: boolean;
      carriedBags?: { team1: number; team2: number };
    }
  ): GameState {
    const deck = new Deck('standard52');
    const localPlayerIndex = options?.localPlayerIndex as number | undefined;
    const multiplayerSlots = options?.multiplayerSlots as Array<'human' | 'ai'> | undefined;
    const presetId = resolvePresetId('spades', options?.rulesPresetId as string | undefined);
    const presetOptions = getSpadesPresetOptions(presetId);

    const dealerIndex =
      roundOptions.prevDealerIndex === undefined
        ? 0
        : (roundOptions.prevDealerIndex + 1) % 4;
    const bidLeaderIndex =
      roundOptions.prevBidLeaderIndex === undefined
        ? Math.floor(Math.random() * 4)
        : (roundOptions.prevBidLeaderIndex + 1) % 4;

    const players: Player[] = playerNames.slice(0, 4).map((name, index) => {
      const isTeam1 = index === 0 || index === 2;
      const isLocalHuman = localPlayerIndex !== undefined ? index === localPlayerIndex : index === 0;
      const playerType =
        isLocalHuman
          ? 'human'
          : multiplayerSlots !== undefined
            ? (multiplayerSlots[index] === 'ai' ? 'ai' : 'remote')
            : 'ai';

      return {
        id: `player_${index}`,
        name,
        hand: [],
        team: (isTeam1 ? 1 : 2) as 1 | 2,
        type: playerType
      };
    });

    for (let i = 0; i < 13; i++) {
      for (let p = 0; p < 4; p++) {
        const card = deck.deal(1)[0];
        if (card) players[p].hand.push(card);
      }
    }

    const waitingForBids = roundOptions.waitingForBids;
    const carriedBags = roundOptions.carriedBags ?? { team1: 0, team2: 0 };

    const state: GameState = {
      variant: 'spades',
      players,
      currentPlayerIndex: bidLeaderIndex,
      dealerIndex,
      trumpSuit: 'spades',
      trumpCard: null,
      currentTrick: [],
      trickLeader: bidLeaderIndex,
      scores: { team1: 0, team2: 0 },
      gameScore,
      completedPentes: [],
      round,
      isGameOver: false,
      winner: null,
      lastTrickWinner: null,
      waitingForTrickEnd: false,
      nextTrickLeader: null,
      isFirstTrick: true,
      dealingMethod: 'A',
      dealingDirection: 'left',
      playDirection: 'right',
      dealAlignment: 'same',
      waitingForRoundStart: waitingForBids,
      waitingForRoundEnd: false,
      waitingForGameStart: false,
      playedCards: [],
      isPaused: false,
      playerName: players[0]?.name || 'Player 1',
      aiDifficulty: (options?.aiDifficulty as AIDifficulty) || 'medium',
      partnerSignals: [],
      variantState: {
        spades: {
          playerBids: [null, null, null, null],
          playerBidTypes: emptyBidTypes(),
          bidLeaderIndex,
          currentBidderIndex: bidLeaderIndex,
          team1Bid: 0,
          team2Bid: 0,
          team1Tricks: 0,
          team2Tricks: 0,
          playerTricks: [0, 0, 0, 0],
          team1Bags: carriedBags.team1,
          team2Bags: carriedBags.team2,
          waitingForBids,
          spadesBroken: false,
          nilEnabled: presetOptions.nilEnabled,
          blindNilEnabled: presetOptions.blindNilEnabled,
          blindNilResolved: presetOptions.blindNilEnabled
            ? [false, false, false, false]
            : [true, true, true, true]
        },
        rulesPresetId: presetId
      }
    };
    applyHandSortToState(state);
    return state;
  }

  canPlayCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    const s = this.state!;
    const spades = this.recognizedSpades();
    if (!spades || spades.waitingForBids || s.waitingForRoundStart) return false;
    const player = s.players[playerIndex];
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) return false;
    if (playerIndex !== s.currentPlayerIndex) return false;
    if (s.waitingForTrickEnd || s.isPaused) return false;

    const card = player.hand[cardIndex];
    if (s.currentTrick.length === 0) {
      const hasNonSpades = player.hand.some((c) => c.suit !== 'spades');
      if (card.suit === 'spades' && hasNonSpades && !spades.spadesBroken) return false;
      return true;
    }

    const ledSuit = s.currentTrick[0].suit;
    const canFollowSuit = player.hand.some((c) => c.suit === ledSuit);
    return !canFollowSuit || card.suit === ledSuit;
  }

  playCard(_state: GameState, playerIndex: number, cardIndex: number): boolean {
    if (!this.canPlayCard(_state, playerIndex, cardIndex)) return false;
    const s = this.state!;
    const player = s.players[playerIndex];
    const card = player.hand.splice(cardIndex, 1)[0];
    s.currentTrick.push(card);

    const spades = this.recognizedSpades();
    if (!spades) return false;
    if (card.suit === 'spades') {
      spades.spadesBroken = true;
    }
    s.variantState = { ...s.variantState, spades };

    if (s.currentTrick.length === 4) {
      const winner = trickWinnerIndex(s.currentTrick, s.trickLeader, 'spades');
      s.lastTrickWinner = winner;
      s.waitingForTrickEnd = true;
      s.nextTrickLeader = winner;
    } else {
      s.currentPlayerIndex = (s.currentPlayerIndex + 1) % 4;
    }
    return true;
  }

  finishTrick(_state: GameState): void {
    const s = this.state!;
    if (!s.waitingForTrickEnd) return;
    const spades = this.recognizedSpades();
    if (!spades) return;

    const winner = s.nextTrickLeader ?? s.lastTrickWinner ?? 0;
    const team = s.players[winner]?.team ?? 1;
    if (team === 1) spades.team1Tricks++;
    else spades.team2Tricks++;
    spades.playerTricks[winner]++;
    s.variantState = { ...s.variantState, spades };

    s.waitingForTrickEnd = false;
    s.currentTrick = [];
    s.trickLeader = winner;
    s.currentPlayerIndex = winner;

    if (s.players[0].hand.length === 0) {
      this.endRound(s);
    }
  }

  private scoreTeam(tricks: number, bid: number, bags: number): { round: number; newBags: number } {
    let round = 0;
    let newBags = bags;
    if (tricks >= bid) {
      round = bid * 10 + (tricks - bid);
      newBags += tricks - bid;
    } else {
      round = -bid * 10;
    }
    while (newBags >= BAG_PENALTY_EVERY) {
      round -= BAG_PENALTY_POINTS;
      newBags -= BAG_PENALTY_EVERY;
    }
    return { round, newBags };
  }

  private endRound(s: GameState): void {
    const spades = this.recognizedSpades();
    if (!spades) return;
    const t1 = this.scoreTeam(spades.team1Tricks, spades.team1Bid, spades.team1Bags);
    const t2 = this.scoreTeam(spades.team2Tricks, spades.team2Bid, spades.team2Bags);

    let team1NilBonus = 0;
    let team2NilBonus = 0;
    for (let i = 0; i < 4; i++) {
      const bonus = nilRoundBonus(spades.playerBidTypes[i], spades.playerTricks[i]);
      if (s.players[i]?.team === 1) team1NilBonus += bonus;
      else team2NilBonus += bonus;
    }

    t1.round += team1NilBonus;
    t2.round += team2NilBonus;

    spades.team1Bags = t1.newBags;
    spades.team2Bags = t2.newBags;
    s.variantState = { ...s.variantState, spades };

    s.scores = { team1: t1.round, team2: t2.round };
    s.gameScore.team1 += t1.round;
    s.gameScore.team2 += t2.round;

    const team1Reached = s.gameScore.team1 >= WINNING_SCORE;
    const team2Reached = s.gameScore.team2 >= WINNING_SCORE;

    if (team1Reached || team2Reached) {
      if (team1Reached && team2Reached && s.gameScore.team1 === s.gameScore.team2) {
        s.isGameOver = false;
        s.winner = null;
        s.matchResult = null;
        s.waitingForGameStart = false;
        s.waitingForRoundEnd = true;
        return;
      }
      const winner: 1 | 2 =
        team1Reached && !team2Reached
          ? 1
          : team2Reached && !team1Reached
            ? 2
            : s.gameScore.team1 > s.gameScore.team2
              ? 1
              : 2;
      s.isGameOver = true;
      s.winner = winner;
      s.matchResult = teamMatchResult(winner);
      s.waitingForGameStart = true;
      s.waitingForRoundEnd = false;
      return;
    }

    s.matchResult = null;
    s.waitingForRoundEnd = true;
  }

  continueToNextRound(_state: GameState): void {
    const s = this.state!;
    if (!s.waitingForRoundEnd) return;

    const names = s.players.map((p) => p.name);
    const gameScore = { ...s.gameScore };
    const prev = this.recognizedSpades();
    if (!prev) return;
    this.state = this.createRoundState(
      names,
      {
        aiDifficulty: s.aiDifficulty,
        rulesPresetId: s.variantState?.rulesPresetId
      },
      s.round + 1,
      gameScore,
      {
        prevDealerIndex: s.dealerIndex,
        prevBidLeaderIndex: prev.bidLeaderIndex,
        waitingForBids: true,
        carriedBags: { team1: prev.team1Bags, team2: prev.team2Bags }
      }
    );
  }

  startRound(_state: GameState): void {
    if (this.state) this.state.waitingForRoundStart = false;
  }

  restoreState(state: GameState): GameState {
    const clone = JSON.parse(JSON.stringify(state)) as GameState;
    const raw = clone.variantState?.spades;
    if (!isPlainObject(raw)) {
      throw new Error('Spades restoreState rejected: missing_variant_state');
    }
    const normalized = normalizeSpadesVariant(raw, clone);
    if (!normalized) {
      throw new Error('Spades restoreState rejected: incomplete_variant_state');
    }
    clone.variantState = { ...clone.variantState, spades: normalized };
    this.state = clone;
    return this.getCurrentState();
  }

  chooseAICard(state: GameState, playerIndex: number): number {
    const spades = this.recognizedSpades();
    if (!spades || !this.state) return -1;
    return chooseSpadesCard(this, state, playerIndex, spades, this.state.aiDifficulty);
  }
}
