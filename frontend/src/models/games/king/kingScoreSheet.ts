import { GameState } from '../../../types/game';
import { festaOwner, getKingPtState } from '../KingPtGame';
import {
  KING_NEGATIVE_CONTRACTS,
  KING_NEGATIVE_GAMES,
  KING_TOTAL_GAMES,
  kingGameTitle
} from './kingContracts';
import { KingRoundSummary } from './kingBreakdown';

export interface KingScoreSheetRow {
  gameIndex: number;
  label: string;
  deltas: (number | null)[];
  isCompleted: boolean;
  isHighlighted: boolean;
}

export function buildKingScoreSheet(
  gameState: GameState,
  locale: 'pt' | 'en' = 'pt'
): { rows: KingScoreSheetRow[]; totals: number[] } {
  const king = getKingPtState(gameState);
  const historyByIndex = new Map<number, KingRoundSummary>();
  king.gameHistory.forEach((entry) => historyByIndex.set(entry.gameIndex, entry));

  const rows: KingScoreSheetRow[] = [];
  for (let gameIndex = 0; gameIndex < KING_TOTAL_GAMES; gameIndex++) {
    const contract = gameIndex < KING_NEGATIVE_GAMES ? KING_NEGATIVE_CONTRACTS[gameIndex].id : null;
    const ownerName =
      gameIndex >= KING_NEGATIVE_GAMES
        ? gameState.players[festaOwner(king.kohPlayerIndex, gameIndex)]?.name ?? ''
        : null;
    const label = kingGameTitle(gameIndex, contract, ownerName, locale);
    const entry = historyByIndex.get(gameIndex);
    const deltas = entry ? [...entry.deltas] : [null, null, null, null];
    rows.push({
      gameIndex,
      label,
      deltas,
      isCompleted: Boolean(entry),
      isHighlighted: gameIndex === king.gameIndex && king.showScorePopup === 'round'
    });
  }

  return { rows, totals: [...king.playerScores] };
}

export function formatScoreCell(value: number | null): string {
  if (value === null) return '—';
  return value >= 0 ? `+${value}` : `${value}`;
}
