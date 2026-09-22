export type KingNegativeContract =
  | 'no_tricks'
  | 'no_hearts'
  | 'no_men'
  | 'no_queens'
  | 'no_king_hearts'
  | 'no_last_two';

export type KingPhase =
  | 'koh_reveal'
  | 'negative'
  | 'festa_setup'
  | 'festa_play'
  | 'game_over';

export interface KingActiveContract {
  bidType: KingBidType;
  amount: number;
  bidderIndex: number;
  beneficiaryIndex: number;
}

export type KingFestaMode = 'positive' | 'negative_festa';

export type KingBidType = 'positive' | 'null';

export interface KingBid {
  bidderIndex: number;
  bidType: KingBidType;
  amount: number;
}

/** Chronological auction history — presentation/state only; not a rules input. */
export interface KingAuctionHistoryEntry {
  seat: number;
  action: 'bid' | 'pass';
  /** Bid amount in vazas when action === 'bid'. */
  amount?: number;
  /** Present for bids so UI can distinguish positivas vs nulos. */
  bidType?: KingBidType;
  sequence: number;
}

export type KingFestaPhase =
  | 'auction'
  | 'auction_result'
  | 'negotiation'
  | 'negotiation_counter'
  | 'fallback'
  | 'setup'
  | null;

export type KingFestaChoice =
  | 'trump'
  | 'no_trump'
  | 'nulos'
  | 'four_by_three';

/** Why the beneficiary is choosing in fallback (presentation / flow only). */
export type KingFallbackReason =
  | 'no_bids'
  | 'negotiation_failed'
  | 'eight_or_nulls_declined';

export interface KingNegativeContractDef {
  id: KingNegativeContract;
  namePt: string;
  nameEn: string;
  totalPoints: number;
}

export const KING_NEGATIVE_CONTRACTS: KingNegativeContractDef[] = [
  { id: 'no_tricks', namePt: 'Não fazer vazas', nameEn: 'No tricks', totalPoints: 260 },
  { id: 'no_hearts', namePt: 'Não fazer copas', nameEn: 'No hearts', totalPoints: 260 },
  { id: 'no_queens', namePt: 'Não fazer damas', nameEn: 'No queens', totalPoints: 200 },
  { id: 'no_men', namePt: 'Não fazer homens', nameEn: 'No men (K+J)', totalPoints: 240 },
  { id: 'no_king_hearts', namePt: 'Não fazer rei de copas', nameEn: 'No K♥', totalPoints: 160 },
  { id: 'no_last_two', namePt: 'Não fazer duas últimas', nameEn: 'No last two tricks', totalPoints: 180 }
];

export const KING_TOTAL_NEGATIVE = 1300;
export const KING_TOTAL_POSITIVE = 1300;
export const KING_TOTAL_GAMES = 10;
export const KING_NEGATIVE_GAMES = 6;
export const KING_FESTA_GAMES = 4;
/** DEV King Sintético display arc: 1 combined negative + 4 festas. */
export const KING_SYNTHETIC_DISPLAY_GAMES = 5;

export type KingMatchProgressOptions = {
  /** DEV session: combined negative → Festa (display total 5). */
  syntheticSession?: boolean;
};

/**
 * Resolve human-facing match current/total.
 * Normal King: gameIndex+1 / 10.
 * Synthetic session: 1/5 on the combined round; Festa gameIndex 6–9 → 2/5…5/5.
 */
export function resolveKingMatchDisplay(
  gameIndex: number,
  options?: KingMatchProgressOptions
): { current: number; total: number } {
  if (options?.syntheticSession) {
    // Combined negative stays at display slot 1; Festa gameIndex 6–9 → 2–5.
    return {
      current: gameIndex < KING_NEGATIVE_GAMES ? 1 : gameIndex - 4,
      total: KING_SYNTHETIC_DISPLAY_GAMES
    };
  }
  return { current: gameIndex + 1, total: KING_TOTAL_GAMES };
}

export function kingContractLabel(contract: KingNegativeContract, locale: 'pt' | 'en'): string {
  const def = KING_NEGATIVE_CONTRACTS.find((c) => c.id === contract);
  if (!def) return contract;
  return locale === 'pt' ? def.namePt : def.nameEn;
}

export function kingGameTitle(
  gameIndex: number,
  contract: KingNegativeContract | null,
  festaOwnerName: string | null,
  locale: 'pt' | 'en'
): string {
  const n = gameIndex + 1;
  if (gameIndex < KING_NEGATIVE_GAMES && contract) {
    const label = kingContractLabel(contract, locale);
    return locale === 'pt' ? `${label} · ${n}/${KING_TOTAL_GAMES}` : `${label} · ${n}/${KING_TOTAL_GAMES}`;
  }
  if (festaOwnerName) {
    return locale === 'pt'
      ? `Festa de ${festaOwnerName} · ${n}/${KING_TOTAL_GAMES}`
      : `${festaOwnerName}'s festa · ${n}/${KING_TOTAL_GAMES}`;
  }
  return locale === 'pt' ? `Jogo ${n}/${KING_TOTAL_GAMES}` : `Game ${n}/${KING_TOTAL_GAMES}`;
}

/** Match axis for King HUD — always labeled (never bare N/total). */
export function kingHudMatchProgress(
  gameIndex: number,
  locale: 'pt' | 'en',
  options?: KingMatchProgressOptions
): string {
  const { current, total } = resolveKingMatchDisplay(gameIndex, options);
  return locale === 'pt' ? `Jogo ${current}/${total}` : `Game ${current}/${total}`;
}

/**
 * Primary contract / festa line without match progress (UX-P3.4b).
 * Match lives in a secondary HUD slot below `Vaza N/13`.
 */
export function kingHudContractPrimary(
  gameIndex: number,
  contract: KingNegativeContract | null,
  festaOwnerName: string | null,
  locale: 'pt' | 'en'
): string {
  if (gameIndex < KING_NEGATIVE_GAMES && contract) {
    return kingContractLabel(contract, locale);
  }
  if (festaOwnerName) {
    return locale === 'pt'
      ? `Festa de ${festaOwnerName}`
      : `${festaOwnerName}'s festa`;
  }
  return kingHudMatchProgress(gameIndex, locale);
}

/**
 * Combined HUD title (compat / modals that still want one string).
 * Prefer `kingHudContractPrimary` + `kingHudMatchProgress` in the live strip.
 */
export function kingHudContractTitle(
  gameIndex: number,
  contract: KingNegativeContract | null,
  festaOwnerName: string | null,
  locale: 'pt' | 'en',
  options?: KingMatchProgressOptions
): string {
  const match = kingHudMatchProgress(gameIndex, locale, options);
  const primary = kingHudContractPrimary(
    gameIndex,
    contract,
    festaOwnerName,
    locale
  );
  if (primary === match) return match;
  return `${primary} · ${match}`;
}

/** DEV King Sintético combined-round HUD / history label. */
export function kingSyntheticRoundLabel(locale: 'pt' | 'en' = 'pt'): string {
  return locale === 'pt'
    ? 'Sintético · Todos os negativos'
    : 'Synthetic · All negatives';
}

/** User-facing product name for DEV King Sintético (never "simplificado"). */
export function kingSyntheticProductName(locale: 'pt' | 'en' = 'pt'): string {
  return locale === 'pt' ? 'King Sintético' : 'King Synthetic';
}

/** Short HUD subtitle under the product name. */
export function kingSyntheticHudSubtitle(locale: 'pt' | 'en' = 'pt'): string {
  return locale === 'pt' ? 'Todos os negativos' : 'All negatives';
}

/** End-of-synthetic-negatives modal copy (score sheet + RoundEnd fallback). */
export function kingSyntheticRoundEndCopy(locale: 'pt' | 'en' = 'pt'): {
  title: string;
  totalSection: string;
  continueCta: string;
} {
  if (locale === 'pt') {
    return {
      title: 'Negativos sintéticos concluídos',
      totalSection: 'Total acumulado',
      continueCta: 'Avançar para festas'
    };
  }
  return {
    title: 'Synthetic negatives complete',
    totalSection: 'Accumulated total',
    continueCta: 'Advance to festas'
  };
}
