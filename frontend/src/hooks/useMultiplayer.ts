import { useEffect, useRef, useCallback } from 'react';
import { publishState, subscribeToState, pushAction } from '../services/multiplayerClient';
import { GameState } from '../types/game';
import { GameAction, createClientId, GameActionInput } from '../types/multiplayerActions';
import { mpLog, mpWarn } from '../utils/mpDebug';

function stateSignature(state: GameState): string {
  return JSON.stringify({
    round: state.round,
    trickIndex: state.currentTrick?.length ?? 0,
    currentPlayer: state.currentPlayerIndex,
    waitingForRoundStart: state.waitingForRoundStart,
    waitingForTrickEnd: state.waitingForTrickEnd,
    scores: state.scores,
    gameScore: state.gameScore,
    handLens: state.players.map((p) => p.hand.length),
    trickLen: state.currentTrick.length,
  });
}

interface UseMultiplayerOptions {
  enabled: boolean;
  sessionCode: string;
  onRemoteState: (state: GameState) => void;
  /** Joiners should apply every remote snapshot. */
  applyAllRemoteUpdates?: boolean;
}

interface UseMultiplayerResult {
  publishAfterPlay: (state: GameState) => void;
  submitAction: (action: GameActionInput) => void;
}

export function useMultiplayer({
  enabled,
  sessionCode,
  onRemoteState,
  applyAllRemoteUpdates = false,
}: UseMultiplayerOptions): UseMultiplayerResult {
  const lastPublishedRef = useRef<string | null>(null);
  const lastAppliedRef = useRef<string | null>(null);
  const clientIdRef = useRef(createClientId());

  useEffect(() => {
    if (!enabled || !sessionCode) {
      mpLog('[MP] subscribe skipped', { enabled, sessionCode: sessionCode || '(empty)' });
      return;
    }

    const unsubscribe = subscribeToState(sessionCode, (remoteState) => {
      const sig = stateSignature(remoteState);
      if (!applyAllRemoteUpdates && sig === lastPublishedRef.current) {
        mpLog('[MP] subscribe skipped (own publish)', sig);
        return;
      }
      if (applyAllRemoteUpdates && sig === lastAppliedRef.current) {
        return;
      }
      lastAppliedRef.current = sig;
      mpLog('[MP] subscribe deliver', {
        sig,
        waitingForRoundStart: remoteState.waitingForRoundStart,
        handLens: remoteState.players?.map((p) => p.hand?.length ?? 0),
      });
      onRemoteState(remoteState);
    });

    return unsubscribe;
  }, [enabled, sessionCode, onRemoteState, applyAllRemoteUpdates]);

  const publishAfterPlay = useCallback(
    (state: GameState) => {
      if (!enabled || !sessionCode) {
        mpWarn('[MP] publish skipped', {
          enabled,
          sessionCode: sessionCode || '(empty)',
        });
        return;
      }
      const sig = stateSignature(state);
      lastPublishedRef.current = sig;
      lastAppliedRef.current = sig;
      mpLog('[MP] publish', {
        sig,
        waitingForRoundStart: state.waitingForRoundStart,
        handLens: state.players?.map((p) => p.hand?.length ?? 0),
        session: sessionCode,
      });
      publishState(sessionCode, state).catch((err) => {
        console.error('[Multiplayer] Failed to publish state:', err);
      });
    },
    [enabled, sessionCode]
  );

  const submitAction = useCallback(
    (action: GameActionInput) => {
      if (!enabled || !sessionCode) {
        mpWarn('[MP] action skipped', { enabled, sessionCode: sessionCode || '(empty)' });
        return;
      }
      const payload = {
        ...action,
        clientId: clientIdRef.current,
        at: Date.now(),
      } as GameAction;
      mpLog('[MP] action push', payload);
      pushAction(sessionCode, payload).catch((err) => {
        console.error('[Multiplayer] Failed to push action:', err);
      });
    },
    [enabled, sessionCode]
  );

  return { publishAfterPlay, submitAction };
}
