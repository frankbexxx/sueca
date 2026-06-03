export interface SuecaLogFields {
  partnerIndex: number;
  teamIndex: 1 | 2;
}

export interface SpadesLogFields {
  playerBid: number | null;
  teamBid: number | null;
  spadesBroken: boolean | null;
}

export interface HeartsLogFields {
  heartsBroken: boolean | null;
  passDirection: string | null;
}

export interface KingLogFields {
  contractId: string | null;
  contractType: string | null;
  festaPhase: string | null;
  noTrump: boolean | null;
  syntheticMode: boolean | null;
}

export type VariantLogFields =
  | SuecaLogFields
  | SpadesLogFields
  | HeartsLogFields
  | KingLogFields;
