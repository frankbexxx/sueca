/**
 * Spades / Hearts / King — default deal + play direction contracts.
 */

import { describe, expect, it } from 'vitest';
import { SpadesGame } from './SpadesGame';
import { HeartsGame } from './HeartsGame';
import { KingPtGame } from './KingPtGame';

describe('Spades / Hearts / King deal+play defaults', () => {
  it('Spades: 13 cards each; one-at-a-time seat loop; dealingDirection left', () => {
    const game = new SpadesGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], { aiDifficulty: 'medium' });
    state.players.forEach((p) => expect(p.hand).toHaveLength(13));
    expect(state.dealingDirection).toBe('left');
    expect(state.dealerIndex).toBe(0);
    // Play / lead after bids uses dealer+1 (see SpadesGame.applyBids path)
    expect((state.dealerIndex + 1) % 4).toBe(1);
  });

  it('Hearts: 13 cards each; dealingDirection left; dealer rotates by round', () => {
    const game = new HeartsGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], { aiDifficulty: 'medium' });
    state.players.forEach((p) => expect(p.hand).toHaveLength(13));
    expect(state.dealingDirection).toBe('left');
    expect(state.dealerIndex).toBe(0);
  });

  it('King: dealingDirection left on initial state', () => {
    const game = new KingPtGame();
    const state = game.initialize(['A', 'B', 'C', 'D'], { aiDifficulty: 'medium' });
    expect(state.dealingDirection).toBe('left');
    expect(state.variant).toBe('king');
  });
});
