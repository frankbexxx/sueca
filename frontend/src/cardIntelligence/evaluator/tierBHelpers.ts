import { CARD_HIERARCHY, Card, Suit } from '../../types/game';
import { cardWouldWinTrickStandard } from '../encoder/trickHelpers';
import { EncodedDecisionState, SpadesEncoding } from '../encoder/types';
import { EvaluatorContext, S25TestContext } from './types';

export type { MoonThreatLevel, PlayerHeartsStats } from '../encoder/heartsMoonThreat';
export { countHeartsByPlayer } from '../encoder/heartsMoonThreat';
export type { S25TestContext } from './types';

export interface OpponentSpadesPressure {
  myTeamBid: number | null;
  opponentTeamBid: number;
  opponentTeamTricks: number;
  opponentNeedTricks: number;
}

interface SpadesSnapshot {
  team1Bid?: number;
  team2Bid?: number;
  team1Tricks?: number;
  team2Tricks?: number;
}

function readSpadesSnapshot(raw: Record<string, unknown>): SpadesSnapshot | null {
  const variantState = raw.variantState as Record<string, unknown> | null | undefined;
  const spades = variantState?.spades as SpadesSnapshot | undefined;
  return spades ?? null;
}

export function highestRankInHand(cards: Card[]): Card {
  return cards.reduce((best, cur) =>
    CARD_HIERARCHY[cur.rank] > CARD_HIERARCHY[best.rank] ? cur : best
  );
}

export function lowestLegalThatLoses(
  legalMoves: Card[],
  trickBefore: Card[],
  leader: number,
  trump: Suit | null
): Card | null {
  const losers = legalMoves.filter(
    (c) => !cardWouldWinTrickStandard(c, trickBefore, leader, trump)
  );
  if (losers.length === 0) return null;
  return losers.reduce((best, cur) =>
    CARD_HIERARCHY[cur.rank] < CARD_HIERARCHY[best.rank] ? cur : best
  );
}

export function cardWouldWinTrick(ctx: EvaluatorContext, card: Card): boolean {
  const trickBefore =
    ctx.state.trickPosition > 0
      ? ctx.state.currentTrick.slice(0, ctx.state.trickPosition)
      : [];
  const trump =
    ctx.state.variant === 'spades'
      ? 'spades'
      : ctx.state.variant === 'sueca'
        ? ctx.state.trumpSuit
        : ctx.state.variant === 'king'
          ? ctx.state.trumpSuit
          : null;
  return cardWouldWinTrickStandard(
    card,
    trickBefore,
    inferLeaderFromCtx(ctx),
    trump
  );
}

function inferLeaderFromCtx(ctx: EvaluatorContext): number {
  const { playerIndex, turnIndex } = ctx.state;
  return (playerIndex - turnIndex + 4) % 4;
}

export function deriveOpponentSpadesPressure(
  ctx: EvaluatorContext
): OpponentSpadesPressure | null {
  const s = ctx.state.variantEncoding as SpadesEncoding;
  const teamIndex = ctx.state.scoreContext.teamIndex;
  if (teamIndex === null) return null;

  const snapshot = readSpadesSnapshot(ctx.state.scoreContext.raw);
  const oppTeam = teamIndex === 1 ? 2 : 1;

  let opponentTeamBid: number | null = null;
  let opponentTeamTricks: number | null = null;

  if (snapshot) {
    opponentTeamBid = oppTeam === 1 ? snapshot.team1Bid ?? null : snapshot.team2Bid ?? null;
    opponentTeamTricks =
      oppTeam === 1 ? snapshot.team1Tricks ?? null : snapshot.team2Tricks ?? null;
  }

  if (opponentTeamBid === null || opponentTeamTricks === null) {
    return null;
  }

  return {
    myTeamBid: s.teamBid,
    opponentTeamBid,
    opponentTeamTricks,
    opponentNeedTricks: Math.max(0, opponentTeamBid - opponentTeamTricks),
  };
}

export function isOpponentHighBidThreat(pressure: OpponentSpadesPressure): boolean {
  if (pressure.opponentNeedTricks <= 0) return false;
  const myBid = pressure.myTeamBid ?? 0;
  return (
    pressure.opponentTeamBid >= 8 ||
    (pressure.opponentNeedTricks <= 2 && pressure.opponentTeamBid > myBid)
  );
}

export function buildS25SyntheticContext(
  overrides: S25TestContext
): { s25: S25TestContext } {
  return { s25: overrides };
}

export function teamIndexFromState(state: EncodedDecisionState): 1 | 2 | null {
  return state.scoreContext.teamIndex;
}
