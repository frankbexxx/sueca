import { GameAdapter } from '../../models/games/GameAdapter';
import { Card, GameState } from '../../types/game';
import { CARD_INTELLIGENCE_LOGGER_ENABLED } from '../../config/features';
import { logCardDecision } from './CardIntelligenceLogger';
import { recordLogFailure } from './logFailureTelemetry';

export function capturePlayDecision(
  gameAdapter: GameAdapter,
  stateBefore: GameState,
  playerIndex: number,
  cardIndex: number,
  options: {
    gameConfigMode?: string | null;
    isMultiplayer?: boolean;
    legalMoves: Card[];
  }
): void {
  if (!CARD_INTELLIGENCE_LOGGER_ENABLED) return;

  void logCardDecision({
    gameAdapter,
    stateBefore,
    playerIndex,
    cardIndex,
    gameConfigMode: options.gameConfigMode ?? null,
    isMultiplayer: options.isMultiplayer ?? false,
    legalMoves: options.legalMoves,
  }).catch(recordLogFailure);
}

export { logCardDecision, resetLoggerSessionForTests } from './CardIntelligenceLogger';
export type { LogCardDecisionInput } from './CardIntelligenceLogger';
export {
  playCardAndLogDecision,
  playFirstLegalAndLogDecision,
} from './playWithLogging';
export type { PlayLogOptions } from './playWithLogging';
export { getLogFailureCount, resetLogFailureCountForTests } from './logFailureTelemetry';
