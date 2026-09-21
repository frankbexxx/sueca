/**
 * DEV ONLY — King Sintético controller shell (S1).
 * No automatic progression / scoring / Festa handoff (S3/S4).
 */

import type { KingNegativeContract } from '../models/games/king/kingContracts';
import {
  nextSyntheticContract,
  syntheticContractOrder,
  type DevKingSyntheticJump
} from './kingSyntheticJump';

export interface KingSyntheticControllerState {
  active: boolean;
  /** Current fixture contract. */
  contract: KingNegativeContract;
  contractIndex: number;
  /** True after a fixture has been applied to the engine. */
  setupApplied: boolean;
  /** Waiting for KOH confirm before first fixture (default entry without synthContract). */
  pendingAfterKoh: boolean;
}

const DEFAULT_CONTRACT = syntheticContractOrder()[0];

let state: KingSyntheticControllerState = {
  active: false,
  contract: DEFAULT_CONTRACT,
  contractIndex: 0,
  setupApplied: false,
  pendingAfterKoh: false
};

function indexOfContract(contract: KingNegativeContract): number {
  const order = syntheticContractOrder();
  const idx = order.indexOf(contract);
  return idx >= 0 ? idx : 0;
}

/** Activate from a parsed jump. Does not apply fixtures. */
export function activateKingSynthetic(jump: DevKingSyntheticJump): void {
  const order = syntheticContractOrder();
  const contract = jump.contract ?? order[0];
  state = {
    active: true,
    contract,
    contractIndex: indexOfContract(contract),
    setupApplied: false,
    // Targeted contract query skips KOH; bare flag waits for KOH then applies fixture.
    pendingAfterKoh: jump.contract == null
  };
}

export function deactivateKingSynthetic(): void {
  state = {
    active: false,
    contract: DEFAULT_CONTRACT,
    contractIndex: 0,
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

export function getKingSyntheticContract(): KingNegativeContract | null {
  return state.active ? state.contract : null;
}

export function markKingSyntheticSetupApplied(): void {
  if (!state.active) return;
  state = { ...state, setupApplied: true, pendingAfterKoh: false };
}

export function shouldApplyFixtureAfterKoh(): boolean {
  return state.active && state.pendingAfterKoh && !state.setupApplied;
}

/**
 * DEV skip — advance to next contract fixture intent only.
 * Caller must load the fixture; does not fake scores/completion.
 */
export function skipToNextKingSyntheticContract(): KingNegativeContract | null {
  if (!state.active) return null;
  const next = nextSyntheticContract(state.contract);
  state = {
    ...state,
    contract: next,
    contractIndex: indexOfContract(next),
    setupApplied: false,
    pendingAfterKoh: false
  };
  return next;
}

export function setKingSyntheticContract(contract: KingNegativeContract): void {
  if (!state.active) return;
  state = {
    ...state,
    contract,
    contractIndex: indexOfContract(contract),
    setupApplied: false,
    pendingAfterKoh: false
  };
}

/** Test helper — reset module state. */
export function resetKingSyntheticControllerForTests(): void {
  deactivateKingSynthetic();
}
