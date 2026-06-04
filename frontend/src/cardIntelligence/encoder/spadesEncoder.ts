import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { TrickEndEvent } from '../shared/types/trickEndEvent';
import { SpadesLogFields } from '../shared/types/variantLogFields';
import { SpadesEncoding } from './types';
import { inferTrickLeader, standardTrickWinnerIndex } from './trickHelpers';

interface SpadesVariantSnapshot {
  playerBids?: number[];
  playerTricks?: number[];
  team1Bid?: number;
  team2Bid?: number;
  team1Tricks?: number;
  team2Tricks?: number;
  team1Bags?: number;
  team2Bags?: number;
  spadesBroken?: boolean;
}

function readSpadesSnapshot(event: CardDecisionLogEvent): SpadesVariantSnapshot | null {
  const raw = event.scoreBefore.raw;
  const spades = raw.variantState as Record<string, unknown> | null | undefined;
  const nested = spades?.spades as SpadesVariantSnapshot | undefined;
  if (nested) return nested;
  return null;
}

function teamIndexForPlayer(playerIndex: number): 1 | 2 {
  return playerIndex % 2 === 0 ? 1 : 2;
}

function derivePlayerTricksFromHistory(event: CardDecisionLogEvent): number | null {
  const wins = countTrickWinsForPlayer(event, event.playerIndex);
  return wins > 0 ? wins : null;
}

function countTrickWinsForPlayer(event: CardDecisionLogEvent, playerIndex: number): number {
  const completedTricks = new Set<number>();
  let wins = 0;
  for (const play of event.roundPlayHistory) {
    if (play.trickIndex === null || play.turnIndex !== 3) continue;
    const key = play.trickIndex;
    if (completedTricks.has(key)) continue;
    const playsInTrick = event.roundPlayHistory.filter(
      (p) => p.trickIndex === play.trickIndex && p.roundIndex === play.roundIndex
    );
    if (playsInTrick.length < 4) continue;
    const trickLeader = (play.playerIndex - 3 + 4) % 4;
    const cards = [...playsInTrick].sort((a, b) => a.turnIndex - b.turnIndex).map((p) => p.card);
    const winner = standardTrickWinnerIndex(cards, trickLeader, 'spades');
    completedTricks.add(key);
    if (winner === playerIndex) wins++;
  }
  return wins;
}

function deriveTricksFromHistory(
  event: CardDecisionLogEvent,
  teamIndex: 1 | 2
): number | null {
  const completedTricks = new Map<number, number>();
  for (const play of event.roundPlayHistory) {
    if (play.trickIndex === null) continue;
    if (play.turnIndex === 3) {
      const trickLeader = (play.playerIndex - 3 + 4) % 4;
      const playsInTrick = event.roundPlayHistory.filter(
        (p) => p.trickIndex === play.trickIndex && p.roundIndex === play.roundIndex
      );
      if (playsInTrick.length < 4) continue;
      const cards = [...playsInTrick]
        .sort((a, b) => a.turnIndex - b.turnIndex)
        .map((p) => p.card);
      const winner = standardTrickWinnerIndex(cards, trickLeader, 'spades');
      if (winner !== null) {
        completedTricks.set(play.trickIndex, winner);
      }
    }
  }
  let count = 0;
  for (const winner of Array.from(completedTricks.values())) {
    if (teamIndexForPlayer(winner) === teamIndex) count++;
  }
  return completedTricks.size > 0 ? count : null;
}

export function encodeSpadesVariant(
  event: CardDecisionLogEvent,
  trickEndEvent: TrickEndEvent | undefined,
  currentWinner: number | null
): SpadesEncoding {
  const vf = event.variantFields as SpadesLogFields;
  const teamIndex = teamIndexForPlayer(event.playerIndex);
  const snapshot = readSpadesSnapshot(event);

  let playerBid = vf.playerBid;
  let teamBid = vf.teamBid;
  let spadesBroken = vf.spadesBroken;
  let playerTricks: number | null = null;
  let teamTricks: number | null = null;
  let bags: number | null = null;

  if (snapshot) {
    if (playerBid === null && Array.isArray(snapshot.playerBids)) {
      const bid = snapshot.playerBids[event.playerIndex];
      playerBid = typeof bid === 'number' ? bid : null;
    }
    if (teamBid === null) {
      teamBid = teamIndex === 1 ? snapshot.team1Bid ?? null : snapshot.team2Bid ?? null;
    }
    if (spadesBroken === null && typeof snapshot.spadesBroken === 'boolean') {
      spadesBroken = snapshot.spadesBroken;
    }
    if (Array.isArray(snapshot.playerTricks)) {
      const pt = snapshot.playerTricks[event.playerIndex];
      playerTricks = typeof pt === 'number' ? pt : null;
    }
    teamTricks =
      teamIndex === 1 ? snapshot.team1Tricks ?? null : snapshot.team2Tricks ?? null;
    bags = teamIndex === 1 ? snapshot.team1Bags ?? null : snapshot.team2Bags ?? null;
  }

  if (trickEndEvent?.variantFields && 'team1Tricks' in trickEndEvent.variantFields) {
    const tf = trickEndEvent.variantFields;
    if (teamIndex === 1 && tf.team1Tricks !== null) teamTricks = tf.team1Tricks;
    if (teamIndex === 2 && tf.team2Tricks !== null) teamTricks = tf.team2Tricks;
  }

  if (playerTricks === null) {
    playerTricks = derivePlayerTricksFromHistory(event);
  }
  if (teamTricks === null) {
    teamTricks = deriveTricksFromHistory(event, teamIndex);
  }

  let bidMet: boolean | null = null;
  let needTricks: number | null = null;
  if (teamBid !== null && teamTricks !== null) {
    bidMet = teamTricks >= teamBid;
    needTricks = Math.max(0, teamBid - teamTricks);
  }

  let avoidBagMode: boolean | null = null;
  if (bidMet === true && bags !== null && bags >= 8) {
    avoidBagMode = true;
  } else if (bidMet === true) {
    avoidBagMode = false;
  }

  const partnerIndex = (event.playerIndex + 2) % 4;
  let partnerWinning: boolean | null = null;
  if (currentWinner !== null) {
    partnerWinning = currentWinner === partnerIndex;
  }

  return {
    playerBid,
    teamBid,
    playerTricks,
    teamTricks,
    bags,
    spadesBroken,
    bidMet,
    needTricks,
    avoidBagMode,
    partnerWinning,
  };
}

export function resolveSpadesCurrentWinner(
  event: CardDecisionLogEvent,
  trickEndEvent: TrickEndEvent | undefined
): number | null {
  if (trickEndEvent) return trickEndEvent.winnerIndex;
  if (event.currentWinnerBefore !== null) return event.currentWinnerBefore;
  const trick = event.trickAfter.length > 0 ? event.trickAfter : event.trickBefore;
  const trickLeader = inferTrickLeader(event.playerIndex, event.turnIndex);
  return standardTrickWinnerIndex(trick, trickLeader, 'spades');
}
