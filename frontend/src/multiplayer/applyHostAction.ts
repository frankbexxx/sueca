import { GameAdapter } from '../models/games/GameAdapter';
import { SuecaGame } from '../models/games/SuecaGame';
import { SpadesGame } from '../models/games/SpadesGame';
import { HeartsGame } from '../models/games/HeartsGame';
import { KingGame } from '../models/games/KingGame';
import { GameAction } from '../types/multiplayerActions';
import { DealAlignment, DealingMethod } from '../types/game';
import { resolvePresetId } from '../constants/rulesPresets';
import { resolveLegacyDealAlignment } from '../models/games/migrateSuecaPersistedState';

export interface ApplyHostActionOptions {
  /** Canonical per-hand deal packaging. */
  dealAlignment?: DealAlignment;
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
        const align =
          action.dealAlignment === 'same' || action.dealAlignment === 'opposite'
            ? action.dealAlignment
            : options.dealAlignment === 'same' || options.dealAlignment === 'opposite'
              ? options.dealAlignment
              : null;
        if (align) {
          sueca.setDealAlignment(align);
        } else if (action.dealingMethod) {
          // Compatibility boundary only: map unambiguous legacy Method (play = session).
          const play =
            sueca.getCurrentState().playDirection === 'left' ? 'left' : 'right';
          const method = (action.dealingMethod === 'B' ? 'B' : 'A') as DealingMethod;
          const dir = method === 'B' ? (play === 'right' ? 'left' : 'right') : play;
          const mapped = resolveLegacyDealAlignment(play, method, dir);
          if (mapped) sueca.setDealAlignment(mapped);
          else sueca.setDealAlignment('same');
        } else {
          sueca.setDealAlignment('same');
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
    case 'declineBlindNil': {
      return (adapter as SpadesGame).declineBlindNil(action.playerIndex);
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
