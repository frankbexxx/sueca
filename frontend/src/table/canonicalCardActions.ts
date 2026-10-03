/**
 * Phase 1 / Step 4 — canonical card-action semantic contract.
 *
 * Renderer-agnostic intents. No Phaser / React / DOM / CSS / SceneGeometry.
 * Does not own game rules — routes to existing legality / pass / multiplayer authorities.
 *
 * Physical inputs are translated by callers (or resolve*Intent helpers) into:
 *   - selectCard
 *   - activateCard
 *   - togglePassSelection
 *
 * Activation UX is intentionally source-specific (product option C):
 *   DOM: select then activate; Phaser: activate directly.
 */

import { playCardAndLogDecision } from '../cardIntelligence';
import type { HeartsFlowController } from '../flow/heartsFlowController';
import type { GameAdapter } from '../models/games/GameAdapter';
import type { GameState } from '../types/game';
import type { GameActionInput } from '../types/multiplayerActions';

/** Semantic card intents — not UI events. */
export type CanonicalCardAction =
  | { readonly type: 'selectCard'; readonly cardIndex: number }
  | { readonly type: 'activateCard'; readonly cardIndex: number }
  | { readonly type: 'togglePassSelection'; readonly cardIndex: number };

/** Which physical path produced the intent — preserves gate/feedback differences. */
export type CanonicalCardActionSource = 'dom' | 'phaser';

export type CanonicalCardActionEffect =
  | 'selected'
  | 'played'
  | 'passToggled'
  | 'noop';

export type CanonicalCardActionFailureReason =
  | 'no_adapter'
  | 'not_passing'
  | 'gates_closed'
  | 'invalid_index'
  | 'illegal'
  | 'play_failed';

export type CanonicalCardActionResult =
  | { readonly ok: true; readonly effect: CanonicalCardActionEffect; readonly action: CanonicalCardAction }
  | {
      readonly ok: false;
      readonly reason: CanonicalCardActionFailureReason;
      readonly action: CanonicalCardAction;
      /** Presentation hint only — callers decide whether to sound. */
      readonly feedback: 'errorSound' | 'silent';
    };

export interface CanonicalCardActionContext {
  readonly gameAdapter: GameAdapter | null;
  readonly gameState: GameState;
  readonly heartsCtrl: HeartsFlowController | null | undefined;
  readonly localPlayerIndex: number;
  readonly selectedCard: number | null;
  readonly setSelectedCard: (index: number | null) => void;
  readonly syncGameStateFromAdapter: () => void;
  readonly isMultiplayer: boolean;
  readonly isJoiner: boolean;
  readonly isMultiplayerActive: boolean;
  readonly multiplayerPlayerIndex: number;
  readonly suecaPlayReady: boolean;
  readonly waitingForEarlyEnd: boolean;
  readonly festaSheetActive: boolean;
  readonly rulesPresetId: string | null | undefined;
  readonly submitAction: (action: GameActionInput) => void;
  readonly afterHostMutation: () => void;
  readonly playCardSound: () => void;
  /**
   * Illegal / failed play feedback. Callers pass source-appropriate behavior:
   * DOM activates use errorSound; Phaser may use silent when the scene already gated.
   * Step 4 does not unify presentation — context chooses.
   */
  readonly onIllegalOrFailedPlay: () => void;
  readonly source: CanonicalCardActionSource;
}

/** DOM physical activation → semantic intent (preserves select-then-activate). */
export function resolveDomHandIntent(
  cardIndex: number,
  selectedCard: number | null,
  isPassing: boolean
): CanonicalCardAction {
  if (isPassing) return { type: 'togglePassSelection', cardIndex };
  if (selectedCard === cardIndex) return { type: 'activateCard', cardIndex };
  return { type: 'selectCard', cardIndex };
}

/** Phaser physical activation → semantic intent (direct activate; pass toggles). */
export function resolvePhaserHandIntent(
  cardIndex: number,
  isPassing: boolean
): CanonicalCardAction {
  if (isPassing) return { type: 'togglePassSelection', cardIndex };
  return { type: 'activateCard', cardIndex };
}

function fail(
  action: CanonicalCardAction,
  reason: CanonicalCardActionFailureReason,
  feedback: 'errorSound' | 'silent' = 'silent'
): CanonicalCardActionResult {
  return { ok: false, reason, action, feedback };
}

function ok(
  action: CanonicalCardAction,
  effect: CanonicalCardActionEffect
): CanonicalCardActionResult {
  return { ok: true, effect, action };
}

function resolvePlayerIndex(ctx: CanonicalCardActionContext): number {
  return ctx.isMultiplayer ? ctx.multiplayerPlayerIndex : 0;
}

function isLocalTurn(ctx: CanonicalCardActionContext): boolean {
  return ctx.isMultiplayer
    ? ctx.gameState.currentPlayerIndex === ctx.multiplayerPlayerIndex
    : ctx.gameState.currentPlayerIndex === 0;
}

/** Shared wait/pause/over gates used by both DOM and Phaser today. */
function sharedPlayIdleGatesOpen(ctx: CanonicalCardActionContext): boolean {
  const s = ctx.gameState;
  return (
    !s.isGameOver &&
    !s.isPaused &&
    !s.waitingForTrickEnd &&
    !s.waitingForRoundStart &&
    !s.waitingForRoundEnd &&
    !s.waitingForGameStart
  );
}

/**
 * DOM select/activate gates — includes suecaPlayReady; omits early-end/festa
 * (those are reflected via readOnly / isLocalCardPlayable in the shell).
 */
function domPlayGatesOpen(ctx: CanonicalCardActionContext): boolean {
  return isLocalTurn(ctx) && sharedPlayIdleGatesOpen(ctx) && ctx.suecaPlayReady;
}

/**
 * Phaser activate gates — includes early-end + festa sheet; omits suecaPlayReady
 * (Sueca lock is enforced via playLocked / playable hints in the scene).
 */
function phaserPlayGatesOpen(ctx: CanonicalCardActionContext): boolean {
  return (
    isLocalTurn(ctx) &&
    sharedPlayIdleGatesOpen(ctx) &&
    !ctx.waitingForEarlyEnd &&
    !ctx.festaSheetActive
  );
}

function playGatesOpen(ctx: CanonicalCardActionContext): boolean {
  return ctx.source === 'phaser' ? phaserPlayGatesOpen(ctx) : domPlayGatesOpen(ctx);
}

function commitActivateCard(
  ctx: CanonicalCardActionContext,
  action: Extract<CanonicalCardAction, { type: 'activateCard' }>
): CanonicalCardActionResult {
  const { gameAdapter, cardIndex } = { gameAdapter: ctx.gameAdapter, cardIndex: action.cardIndex };
  if (!gameAdapter) return fail(action, 'no_adapter');
  if (!playGatesOpen(ctx)) return fail(action, 'gates_closed');

  const playerIndex = resolvePlayerIndex(ctx);
  const player = ctx.gameState.players[playerIndex];
  if (!player || cardIndex < 0 || cardIndex >= player.hand.length) {
    return fail(action, 'invalid_index');
  }

  const currentState = gameAdapter.getCurrentState();
  if (!gameAdapter.canPlayCard(currentState, playerIndex, cardIndex)) {
    ctx.onIllegalOrFailedPlay();
    return fail(action, 'illegal', 'errorSound');
  }

  if (ctx.isJoiner) {
    ctx.submitAction({ type: 'playCard', playerIndex, cardIndex });
    ctx.playCardSound();
    ctx.setSelectedCard(null);
    return ok(action, 'played');
  }

  if (
    playCardAndLogDecision(gameAdapter, currentState, playerIndex, cardIndex, {
      gameConfigMode: ctx.rulesPresetId,
      isMultiplayer: ctx.isMultiplayerActive
    })
  ) {
    ctx.playCardSound();
    ctx.setSelectedCard(null);
    ctx.afterHostMutation();
    return ok(action, 'played');
  }

  ctx.onIllegalOrFailedPlay();
  return fail(action, 'play_failed', 'errorSound');
}

function commitSelectCard(
  ctx: CanonicalCardActionContext,
  action: Extract<CanonicalCardAction, { type: 'selectCard' }>
): CanonicalCardActionResult {
  const { gameAdapter } = ctx;
  if (!gameAdapter) return fail(action, 'no_adapter');
  // Selection uses DOM gate policy (only DOM emits selectCard today).
  if (!domPlayGatesOpen(ctx)) return fail(action, 'gates_closed');

  const playerIndex = resolvePlayerIndex(ctx);
  const player = ctx.gameState.players[playerIndex];
  const cardIndex = action.cardIndex;
  if (!player || cardIndex < 0 || cardIndex >= player.hand.length) {
    return fail(action, 'invalid_index');
  }

  const currentState = gameAdapter.getCurrentState();
  if (!gameAdapter.canPlayCard(currentState, playerIndex, cardIndex)) {
    ctx.onIllegalOrFailedPlay();
    return fail(action, 'illegal', 'errorSound');
  }

  ctx.setSelectedCard(cardIndex);
  return ok(action, 'selected');
}

function commitTogglePass(
  ctx: CanonicalCardActionContext,
  action: Extract<CanonicalCardAction, { type: 'togglePassSelection' }>
): CanonicalCardActionResult {
  const { gameAdapter, heartsCtrl } = ctx;
  if (!gameAdapter || !heartsCtrl) return fail(action, 'no_adapter');
  if (!heartsCtrl.isPassing(ctx.gameState)) return fail(action, 'not_passing');

  const toggled = heartsCtrl.togglePassCardIfPassing(
    ctx.gameState,
    action.cardIndex,
    ctx.localPlayerIndex
  );
  if (!toggled) return fail(action, 'not_passing');
  ctx.syncGameStateFromAdapter();
  return ok(action, 'passToggled');
}

/**
 * Single semantic entrypoint for card intents from any renderer / a11y consumer.
 */
export function dispatchCanonicalCardAction(
  action: CanonicalCardAction,
  ctx: CanonicalCardActionContext
): CanonicalCardActionResult {
  switch (action.type) {
    case 'togglePassSelection':
      return commitTogglePass(ctx, action);
    case 'selectCard':
      return commitSelectCard(ctx, action);
    case 'activateCard':
      return commitActivateCard(ctx, action);
    default: {
      const _exhaustive: never = action;
      return fail(_exhaustive, 'gates_closed');
    }
  }
}

/**
 * Convenience: DOM PlayerHand / keyboard physical activation.
 * Translates to select | activate | togglePass, then dispatches.
 */
export function handleDomCardPhysicalActivation(
  cardIndex: number,
  ctx: CanonicalCardActionContext
): CanonicalCardActionResult {
  const isPassing = Boolean(ctx.heartsCtrl?.isPassing(ctx.gameState));
  const action = resolveDomHandIntent(cardIndex, ctx.selectedCard, isPassing);
  return dispatchCanonicalCardAction(action, { ...ctx, source: 'dom' });
}

/**
 * Convenience: Phaser tap / drop physical activation.
 * Translates to activate | togglePass, then dispatches.
 */
export function handlePhaserCardPhysicalActivation(
  cardIndex: number,
  ctx: CanonicalCardActionContext
): CanonicalCardActionResult {
  const isPassing = Boolean(ctx.heartsCtrl?.isPassing(ctx.gameState));
  const action = resolvePhaserHandIntent(cardIndex, isPassing);
  return dispatchCanonicalCardAction(action, { ...ctx, source: 'phaser' });
}
