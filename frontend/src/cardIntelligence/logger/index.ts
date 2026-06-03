import { GameAdapter } from '../../models/games/GameAdapter';
import { Card, GameState } from '../../types/game';
import { CARD_INTELLIGENCE_LOGGER_ENABLED } from '../../config/features';
import { logCardDecision } from './CardIntelligenceLogger';

export function capturePlayDecision(
  gameAdapter: GameAdapter,
  stateBefore: GameState,
  playerIndex: number,
  cardIndex: number,
  options?: {
    gameConfigMode?: string | null;
    isMultiplayer?: boolean;
    legalMoves?: Card[];
  }
): void {
  if (!CARD_INTELLIGENCE_LOGGER_ENABLED) return;

  void logCardDecision({
    gameAdapter,
    stateBefore,
    playerIndex,
    cardIndex,
    gameConfigMode: options?.gameConfigMode ?? null,
    isMultiplayer: options?.isMultiplayer ?? false,
    legalMoves: options?.legalMoves,
  }).catch((error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[CardIntelligence] logCardDecision failed', error);
    }
  });
}

export { logCardDecision, resetLoggerSessionForTests } from './CardIntelligenceLogger';
export type { LogCardDecisionInput } from './CardIntelligenceLogger';
