import { GameFactory } from './GameFactory';
import { KingGame } from './KingGame';
import { SpadesGame } from './SpadesGame';
import { HeartsGame } from './HeartsGame';
import { SuecaGame } from './SuecaGame';
import { GameAdapter } from './GameAdapter';

const names = ['P1', 'P2', 'P3', 'P4'];

function initVariant(variant: 'sueca' | 'spades' | 'hearts' | 'king'): GameAdapter {
  const adapter = GameFactory.getAdapter(variant);
  adapter.initialize(names, { dealingMethod: 'A', aiDifficulty: 'medium' });
  if (variant === 'sueca') {
    adapter.startRound(adapter.getCurrentState());
  }
  if (variant === 'king') {
    (adapter as KingGame).confirmKohReveal();
  }
  return adapter;
}

describe('Adapter source of truth (C1)', () => {
  describe.each(['sueca', 'spades', 'hearts', 'king'] as const)(
    '%s snapshot isolation',
    (variant) => {
      it('external snapshot mutation does not change engine getCurrentState', () => {
        const adapter = initVariant(variant);
        const snapshot = adapter.getCurrentState();
        const beforePaused = snapshot.isPaused;
        const beforeTrickLen = snapshot.currentTrick.length;
        const beforeHand0Len = snapshot.players[0]?.hand.length ?? 0;
        const beforeScore = snapshot.gameScore.team1;

        snapshot.isPaused = !beforePaused;
        snapshot.currentTrick.push({
          suit: 'clubs',
          rank: 'A',
          id: 'tamper-trick'
        });
        if (snapshot.players[0]?.hand.length) {
          snapshot.players[0].hand.pop();
        }
        snapshot.gameScore.team1 = beforeScore + 99;
        if (snapshot.scores) {
          snapshot.scores.team1 = (snapshot.scores.team1 ?? 0) + 50;
        }

        const next = adapter.getCurrentState();
        expect(next.isPaused).toBe(beforePaused);
        expect(next.currentTrick).toHaveLength(beforeTrickLen);
        expect(next.players[0]?.hand).toHaveLength(beforeHand0Len);
        expect(next.gameScore.team1).toBe(beforeScore);
        expect(next.players[0]?.hand).not.toBe(snapshot.players[0]?.hand);
        expect(next.currentTrick).not.toBe(snapshot.currentTrick);
      });
    }
  );

  describe.each(['sueca', 'spades', 'hearts', 'king'] as const)(
    '%s mutators write engine SoT',
    (variant) => {
      it('pauseGame on a discarded snapshot still flips engine via getCurrentState', () => {
        const adapter = initVariant(variant);
        const snapshot = adapter.getCurrentState();
        expect(snapshot.isPaused).toBe(false);

        adapter.pauseGame(snapshot);
        expect(snapshot.isPaused).toBe(false);
        expect(adapter.getCurrentState().isPaused).toBe(true);

        adapter.resumeGame(adapter.getCurrentState());
        expect(adapter.getCurrentState().isPaused).toBe(false);
      });
    }
  );

  it('Spades playCard mutates engine hands visible on next snapshot', () => {
    const adapter = GameFactory.getAdapter('spades') as SpadesGame;
    adapter.initialize(names, { aiDifficulty: 'medium' });
    const s0 = adapter.getCurrentState();
    const leader = (s0.variantState?.spades as { bidLeaderIndex: number }).bidLeaderIndex;
    for (let step = 0; step < 4; step++) {
      adapter.submitBid((leader + step) % 4, 3, 'normal');
    }
    const playing = adapter.getCurrentState();
    const player = playing.currentPlayerIndex;
    let legal = -1;
    for (let i = 0; i < playing.players[player].hand.length; i++) {
      if (adapter.canPlayCard(playing, player, i)) {
        legal = i;
        break;
      }
    }
    expect(legal).toBeGreaterThanOrEqual(0);
    const beforeLen = playing.players[player].hand.length;

    expect(adapter.playCard(playing, player, legal)).toBe(true);
    const after = adapter.getCurrentState();
    expect(after.players[player].hand).toHaveLength(beforeLen - 1);
    expect(after.currentTrick).toHaveLength(1);
    // Discarded snapshot must not be the live hand
    expect(playing.players[player].hand).toHaveLength(beforeLen);
  });

  it('Hearts getMutableEngineState is used by BaseGameAdapter pause', () => {
    const adapter = GameFactory.getAdapter('hearts') as HeartsGame;
    adapter.initialize(names, { aiDifficulty: 'medium' });
    expect(adapter.resolveMutableEngineState()).toBeDefined();
    adapter.pauseGame(adapter.getCurrentState());
    expect(adapter.getCurrentState().isPaused).toBe(true);
  });

  it('SuecaGame exposes no mutable snapshot via getMutableEngineState (uses Game APIs)', () => {
    const adapter = GameFactory.getAdapter('sueca') as SuecaGame;
    adapter.initialize(names, { dealingMethod: 'A', aiDifficulty: 'medium' });
    expect(adapter.resolveMutableEngineState()).toBeUndefined();
  });
});
