/**
 * Canonical match outcome. Team games and individual games do not share an integer.
 * Scoring rules stay in each engine; this is only the shape those engines publish.
 */
export type TeamMatchResult = {
  kind: 'team';
  winnerTeam: 1 | 2 | null;
  draw: boolean;
};

export type IndividualMatchResult = {
  kind: 'individual';
  /** Seats that share the winning score, low to high. One seat is a unique win. */
  winnerSeats: number[];
  draw: boolean;
};

export type MatchResult = TeamMatchResult | IndividualMatchResult;
