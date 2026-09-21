/**
 * DEV ONLY — King Sintético entry (S1).
 * Query: `?devKingSynthetic=1` optional `&synthContract=no_hearts`
 * Production builds ignore all params (NODE_ENV !== 'development').
 */

import type { KingNegativeContract } from '../models/games/king/kingContracts';
import { KING_NEGATIVE_CONTRACTS } from '../models/games/king/kingContracts';

export interface DevKingSyntheticJump {
  enabled: true;
  /** When set, jump directly to this contract fixture (skips KOH for targeted smoke). */
  contract: KingNegativeContract | null;
}

const CONTRACT_IDS = new Set(KING_NEGATIVE_CONTRACTS.map((c) => c.id));

export function isKingDevSyntheticEnabled(): boolean {
  return process.env.NODE_ENV === 'development';
}

function parseContractId(raw: string | null): KingNegativeContract | null {
  if (raw == null || raw === '') return null;
  const id = raw.toLowerCase() as KingNegativeContract;
  if (CONTRACT_IDS.has(id)) return id;
  return null;
}

/**
 * Parse `?devKingSynthetic=1` and optional `&synthContract=<id>`.
 * Returns null outside DEV, when flag absent, or when flag is not truthy.
 * Invalid synthContract → contract null (fall back to first fixture later).
 */
export function parseDevKingSyntheticParams(search: string): DevKingSyntheticJump | null {
  if (!isKingDevSyntheticEnabled()) return null;

  const raw = search.startsWith('?') ? search.slice(1) : search;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw);
  } catch {
    return null;
  }

  const flag = params.get('devKingSynthetic');
  if (flag !== '1' && flag !== 'true') return null;

  const contractRaw = params.get('synthContract');
  const contract = parseContractId(contractRaw);
  // Invalid explicit contract: still enable synthetic, fall back to first contract.
  if (contractRaw != null && contractRaw !== '' && contract == null) {
    return { enabled: true, contract: null };
  }

  return { enabled: true, contract };
}

export function formatDevKingSyntheticBadge(
  contract: KingNegativeContract | null,
  locale: 'pt' | 'en' = 'pt'
): string {
  if (!contract) return 'DEV · KING SINTÉTICO';
  const def = KING_NEGATIVE_CONTRACTS.find((c) => c.id === contract);
  const label = def ? (locale === 'pt' ? def.namePt : def.nameEn) : contract;
  return `DEV · KING SINTÉTICO · ${label.toUpperCase()}`;
}

export function syntheticContractOrder(): KingNegativeContract[] {
  return KING_NEGATIVE_CONTRACTS.map((c) => c.id);
}

export function nextSyntheticContract(
  current: KingNegativeContract
): KingNegativeContract {
  const order = syntheticContractOrder();
  const idx = order.indexOf(current);
  if (idx < 0) return order[0];
  return order[(idx + 1) % order.length];
}
