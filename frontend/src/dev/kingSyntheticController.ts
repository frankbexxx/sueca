/**
 * DEV ONLY — King Sintético controller shell.
 * Combined-round mode only (no per-contract cycling).
 */

import type { DevKingSyntheticJump } from './kingSyntheticJump';

export interface KingSyntheticControllerState {
  active: boolean;
  /** True after KOH confirm enabled the combined-negative engine flag. */
  setupApplied: boolean;
  /** Waiting for KOH confirm before enabling combined mode on the dealt round. */
  pendingAfterKoh: boolean;
}

let state: KingSyntheticControllerState = {
  active: false,
  setupApplied: false,
  pendingAfterKoh: false
};

/** Activate from a parsed jump. Does not mutate engine state. */
export function activateKingSynthetic(_jump: DevKingSyntheticJump): void {
  state = {
    active: true,
    setupApplied: false,
    pendingAfterKoh: true
  };
}

export function deactivateKingSynthetic(): void {
  state = {
    active: false,
    setupApplied: false,
    pendingAfterKoh: false
  };
}

export function isKingSyntheticActive(): boolean {
  return state.active;
}

export function getKingSyntheticState(): Readonly<KingSyntheticControllerState> {
  return state;
}

export function markKingSyntheticSetupApplied(): void {
  if (!state.active) return;
  state = { ...state, setupApplied: true, pendingAfterKoh: false };
}

export function shouldEnableSyntheticAfterKoh(): boolean {
  return state.active && state.pendingAfterKoh && !state.setupApplied;
}

/** Test helper — reset module state. */
export function resetKingSyntheticControllerForTests(): void {
  deactivateKingSynthetic();
}
