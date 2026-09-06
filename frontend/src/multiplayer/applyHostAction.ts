import { GameAdapter } from '../models/games/GameAdapter';
import { SuecaGame } from '../models/games/SuecaGame';
import { SpadesGame } from '../models/games/SpadesGame';
import { HeartsGame } from '../models/games/HeartsGame';
import { KingGame } from '../models/games/KingGame';
import { GameAction } from '../types/multiplayerActions';
import { DealingDirection, DealingMethod } from '../types/game';
import { resolvePresetId } from '../constants/rulesPresets';

export interface ApplyHostActionOptions {
  roundDealingMethod?: DealingMethod;
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
        (adapter as SuecaGame).setDealingMethod(
          options.roundDealingMethod ?? action.dealingMethod
        );
        if (options.dealingDirection) {
          (adapter as SuecaGame).setDealingDirection(options.dealingDirection);
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
    if (preset === 'king-pt-normal' || preset === 'king-simplified') {
      return false;
    }
  }
  return true;
}
