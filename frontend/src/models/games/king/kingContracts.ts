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

export type KingFestaPhase =
  | 'auction'
  | 'negotiation'
  | 'fallback'
  | 'setup'
  | null;

export type KingFestaChoice =
  | 'trump'
  | 'no_trump'
  | 'nulos'
  | 'four_by_three';

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
