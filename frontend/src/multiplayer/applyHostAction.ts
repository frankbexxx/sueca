import { GameAdapter } from '../models/games/GameAdapter';
import { SuecaGame } from '../models/games/SuecaGame';
import { SpadesGame } from '../models/games/SpadesGame';
import { HeartsGame } from '../models/games/HeartsGame';
import { KingGame } from '../models/games/KingGame';
import { GameAction } from '../types/multiplayerActions';
import { DealAlignment, DealingDirection, DealingMethod } from '../types/game';
import { resolvePresetId } from '../constants/rulesPresets';

export interface ApplyHostActionOptions {
  /** Canonical per-hand deal packaging (ARCH-SUECA-06). */
  dealAlignment?: DealAlignment;
  /** @deprecated TEMPORARY — prefer dealAlignment. */
  roundDealingMethod?: DealingMethod;
  /** @deprecated TEMPORARY — prefer dealAlignment. */
  dealingDirection?: DealingDirection;
  rulesPresetId?: string;
}

/** Host validates and applies a remote intent on the authoritative adapter. */
export function applyHostAction(
  adapter: GameAdapter,
  action: GameAction,
  options: ApplyHostActionOptions = {}
): boolean {
  switch (action.type) {
    case 'playCard': {
      const state = adapter.getCurrentState();
      if (!adapter.canPlayCard(state, action.playerIndex, action.cardIndex)) return false;
      return adapter.playCard(state, action.playerIndex, action.cardIndex);
    }
    case 'finishTrick': {
      adapter.finishTrick(adapter.getCurrentState());
      return true;
    }
    case 'startRound': {
      if (adapter.variant === 'sueca') {
        const sueca = adapter as SuecaGame;
        if (options.dealAlignment === 'same' || options.dealAlignment === 'opposite') {
          sueca.setDealAlignment(options.dealAlignment);
        } else {
          // TEMPORARY bridge for older action payloads / tests.
          sueca.setDealingMethod(options.roundDealingMethod ?? action.dealingMethod);
          if (options.dealingDirection) {
            sueca.setDealingDirection(options.dealingDirection);
          }
        }
      }
      adapter.startRound(adapter.getCurrentState());
      return true;
    }
    case 'continueRound': {
      adapter.continueToNextRound(adapter.getCurrentState());
      if (adapter.variant === 'king') {
        (adapter as KingGame).tickFestaAi();
      }
      return true;
    }
    case 'confirmPass': {
      return (adapter as HeartsGame).confirmPass(action.playerIndex);
    }
    case 'submitBid': {
      (adapter as SpadesGame).submitBid(action.playerIndex, action.bid, action.bidType);
      return true;
    }
    default:
      return false;
  }
}

export function canJoinerSubmitAction(
  adapter: GameAdapter,
  action: Omit<GameAction, 'clientId' | 'at'>,
  rulesPresetId?: string
): boolean {
  if (action.type === 'startRound' && adapter.variant === 'king') {
    const preset = resolvePresetId('king', rulesPresetId);
    if (preset === 'king-pt-normal' || preset === 'king-pt-synthetic') {
      return false;
    }
  }
  return true;
}
