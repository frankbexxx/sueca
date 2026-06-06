import { Card } from '../../types/game';
import { DevLabScenarioError } from './errors';
import { DevLabScenario } from './types';

function cardKey(card: Card): string {
  return `${card.suit}:${card.rank}:${card.id}`;
}

function isSubsetOf(moves: Card[], hand: Card[]): boolean {
  const handKeys = new Set(hand.map(cardKey));
  return moves.every((move) => handKeys.has(cardKey(move)));
}

export function validateScenario(scenario: DevLabScenario): void {
  if (!scenario.id.trim()) {
    throw new DevLabScenarioError('Scenario id is required');
  }

  if (scenario.variant !== scenario.playEvent.variant) {
    throw new DevLabScenarioError(
      `Variant mismatch: scenario=${scenario.variant} event=${scenario.playEvent.variant}`
    );
  }

  const chosen = scenario.chosenCard ?? scenario.playEvent.chosenCard;
  if (chosen && !scenario.legalMoves.some((move) => cardKey(move) === cardKey(chosen))) {
    throw new DevLabScenarioError(
      `chosenCard ${cardKey(chosen)} not in legalMoves for scenario ${scenario.id}`
    );
  }

  const hand = scenario.playEvent.handBefore;
  if (hand.length > 0 && !isSubsetOf(scenario.legalMoves, hand)) {
    throw new DevLabScenarioError(
      `legalMoves must be subset of handBefore for scenario ${scenario.id}`
    );
  }
}
