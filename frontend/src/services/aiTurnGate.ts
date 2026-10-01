import { isExternalAiCancellation } from './aiClient';

/**
 * One in-flight external AI attempt.
 * `signal` aborts the fetch. `isCurrent` is false after close, a newer open,
 * or a caller-supplied live-turn check.
 */
export interface AiTurnScope {
  signal: AbortSignal;
  isCurrent: () => boolean;
}

export interface AiTurnGate {
  open(): AiTurnScope;
  close(): void;
}

/**
 * Per-board gate. Not a singleton: each GameBoard holds its own ref.
 * open() cancels the previous scope. close() cancels the active scope.
 */
export function createAiTurnGate(): AiTurnGate {
  let generation = 0;
  let active: AbortController | null = null;

  const invalidate = () => {
    generation += 1;
    const current = active;
    active = null;
    current?.abort();
  };

  return {
    open() {
      invalidate();
      const id = generation;
      const controller = new AbortController();
      active = controller;
      return {
        signal: controller.signal,
        isCurrent: () => generation === id && !controller.signal.aborted,
      };
    },
    close() {
      invalidate();
    },
  };
}

/** Extra live-state check composed onto a gate scope. Gate failure short-circuits. */
export function bindAiTurnScope(scope: AiTurnScope, stillLive: () => boolean): AiTurnScope {
  return {
    signal: scope.signal,
    isCurrent: () => scope.isCurrent() && stillLive(),
  };
}

/** Turn identity already present on game state. No persisted fields. */
export interface AiTurnIdentity {
  playerIndex: number;
  round: number;
  trickLeader: number;
  trickLength: number;
}

export interface LiveAiTurnState {
  currentPlayerIndex: number;
  round: number;
  trickLeader: number;
  trickLength: number;
  isPaused: boolean;
  isGameOver: boolean;
  waitingForTrickEnd: boolean;
  waitingForRoundStart: boolean;
  waitingForRoundEnd: boolean;
  waitingForGameStart: boolean;
}

export function isSameLiveAiTurn(identity: AiTurnIdentity, live: LiveAiTurnState): boolean {
  return (
    live.currentPlayerIndex === identity.playerIndex &&
    live.round === identity.round &&
    live.trickLeader === identity.trickLeader &&
    live.trickLength === identity.trickLength &&
    !live.isPaused &&
    !live.isGameOver &&
    !live.waitingForTrickEnd &&
    !live.waitingForRoundStart &&
    !live.waitingForRoundEnd &&
    !live.waitingForGameStart
  );
}

export type GuardedAiPlayResult = 'external' | 'local' | 'first-legal' | 'ignored' | 'stuck';

/**
 * Commit an AI card only while `scope` is still the live turn.
 * -1 from requestExternal means "use local AI" (unavailable or a bad card on this turn).
 * Cancellation or a scope that is no longer current does not fall back.
 * A genuine error while the scope is still current falls back to local exactly once.
 */
export async function runGuardedAiPlay(args: {
  scope: AiTurnScope;
  requestExternal: () => Promise<number>;
  onExternalFailure: (error: unknown) => void;
  chooseLocal: () => number;
  play: (cardIndex: number) => boolean;
  playFirstLegal: () => number;
  onPlayRejected: (cardIndex: number) => void;
  onStuck?: () => void;
}): Promise<GuardedAiPlayResult> {
  if (!args.scope.isCurrent()) return 'ignored';

  let fromExternal = false;
  let cardIndex = -1;
  try {
    cardIndex = await args.requestExternal();
    fromExternal = cardIndex >= 0;
  } catch (error) {
    if (!args.scope.isCurrent() || isExternalAiCancellation(error)) return 'ignored';
    args.onExternalFailure(error);
    cardIndex = -1;
    fromExternal = false;
  }

  if (!args.scope.isCurrent()) return 'ignored';

  if (cardIndex < 0) {
    cardIndex = args.chooseLocal();
    fromExternal = false;
  }

  if (!args.scope.isCurrent()) return 'ignored';

  if (cardIndex >= 0 && args.play(cardIndex)) {
    return fromExternal ? 'external' : 'local';
  }

  if (!args.scope.isCurrent()) return 'ignored';

  if (cardIndex >= 0) {
    args.onPlayRejected(cardIndex);
  }

  if (!args.scope.isCurrent()) return 'ignored';

  const fallbackIndex = args.playFirstLegal();
  if (fallbackIndex >= 0) return 'first-legal';
  args.onStuck?.();
  return 'stuck';
}
