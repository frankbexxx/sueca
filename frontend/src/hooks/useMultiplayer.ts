import { useEffect, useRef, useCallback } from 'react';
import { publishState, subscribeToState } from '../services/multiplayerClient';
import { GameState } from '../types/game';

function stateSignature(state: GameState): string {
  const handsDealt =
    state.players.length > 0 && state.players.every((p) => p.hand.length > 0);
  return JSON.stringify({
    round: state.round,
    trickIndex: state.currentTrick?.length ?? 0,
    currentPlayer: state.currentPlayerIndex,
    waitingForRoundStart: state.waitingForRoundStart,
    handsDealt,
  });
}

interface UseMultiplayerOptions {
  enabled: boolean;
  sessionCode: string;
  localPlayerIndex: number;
  onRemoteState: (state: GameState) => void;
}

interface UseMultiplayerResult {
  publishAfterPlay: (state: GameState) => void;
}

/**
 * Subscribes to Firebase state updates when multiplayer is active.
 * Calls `onRemoteState` whenever a remote player publishes a new state.
 * Exposes `publishAfterPlay` to broadcast the local player's new state.
 */
export function useMultiplayer({
  enabled,
  sessionCode,
  localPlayerIndex,
  onRemoteState,
}: UseMultiplayerOptions): UseMultiplayerResult {
  // Track whether the latest state update was published by us to avoid loops
  const lastPublishedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !sessionCode) return;

    const unsubscribe = subscribeToState(sessionCode, (remoteState) => {
      // Ignore our own publishes by comparing a lightweight signature
      const sig = stateSignature(remoteState);
      if (sig === lastPublishedRef.current) {
        console.log('[MP] subscribe skipped (duplicate sig)', sig);
        return;
      }
      console.log('[MP] subscribe deliver', {
        sig,
        waitingForRoundStart: remoteState.waitingForRoundStart,
        handLens: remoteState.players?.map((p) => p.hand?.length ?? 0),
      });
      onRemoteState(remoteState);
    });

    return unsubscribe;
  }, [enabled, sessionCode, onRemoteState]);

  const publishAfterPlay = useCallback(
    (state: GameState) => {
      if (!enabled || !sessionCode) return;
      const sig = stateSignature(state);
      lastPublishedRef.current = sig;
      console.log('[MP] publish', {
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

  return { publishAfterPlay };
}
