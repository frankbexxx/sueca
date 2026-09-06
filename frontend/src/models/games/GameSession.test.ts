import { GameFactory } from './GameFactory';
import { KingGame } from './KingGame';
import { SpadesGame, getSpadesState } from './SpadesGame';
import { SuecaGame } from './SuecaGame';

describe('GameSession', () => {
  const names = ['P1', 'P2', 'P3', 'P4'];

  it('sueca initialize returns 40-card hands (10 per player) after startRound', () => {
    const adapter = GameFactory.getAdapter('sueca');
    const state = adapter.initialize(names, { dealingMethod: 'A', aiDifficulty: 'medium' });
    expect(state.variant).toBe('sueca');
    adapter.startRound(state);
    const after = adapter.getCurrentState();
    after.players.forEach((p) => expect(p.hand).toHaveLength(10));
  });

  it('spades initialize deals 52 cards (13 per player)', () => {
    const adapter = GameFactory.getAdapter('spades');
    const state = adapter.initialize(names, { aiDifficulty: 'medium' });
    expect(state.variant).toBe('spades');
    const total = state.players.reduce((n, p) => n + p.hand.length, 0);
    expect(total).toBe(52);
    state.players.forEach((p) => expect(p.hand).toHaveLength(13));
  });

  it('hearts initialize deals 13 cards per player after pass', () => {
    const adapter = GameFactory.getAdapter('hearts');
    const state = adapter.initialize(names, { aiDifficulty: 'medium' });
    state.players.forEach((p) => expect(p.hand).toHaveLength(13));
  });

  it('king initialize deals 13 cards per player after KOH reveal', () => {
    const adapter = GameFactory.getAdapter('king') as KingGame;
    adapter.initialize(names, { aiDifficulty: 'medium' });
    adapter.confirmKohReveal();
    const state = adapter.getCurrentState();
    state.players.forEach((p) => expect(p.hand).toHaveLength(13));
  });
});

describe('Adapter pause/resume (A2)', () => {
  const names = ['P1', 'P2', 'P3', 'P4'];

  function expectPauseRoundTrip(
    adapter: ReturnType<typeof GameFactory.getAdapter>,
    initOptions: Record<string, unknown> = {}
  ): void {
    adapter.initialize(names, { aiDifficulty: 'medium', ...initOptions });
    const snapshot = adapter.getCurrentState();
    expect(snapshot.isPaused).toBe(false);

    adapter.pauseGame(snapshot);
    // Snapshot argument is a clone — engine SoT must flip, not the discarded snapshot
    expect(snapshot.isPaused).toBe(false);
    expect(adapter.getCurrentState().isPaused).toBe(true);

    adapter.resumeGame(adapter.getCurrentState());
    expect(adapter.getCurrentState().isPaused).toBe(false);
  }

  it('Spades pause/resume mutates engine state visible via getCurrentState', () => {
    expectPauseRoundTrip(GameFactory.getAdapter('spades'));
  });

  it('Hearts pause/resume mutates engine state visible via getCurrentState', () => {
    expectPauseRoundTrip(GameFactory.getAdapter('hearts'));
  });

  it('King pause/resume mutates engine state visible via getCurrentState', () => {
    const adapter = GameFactory.getAdapter('king') as KingGame;
    adapter.initialize(names, { aiDifficulty: 'medium' });
    adapter.confirmKohReveal();
    const snapshot = adapter.getCurrentState();
    adapter.pauseGame(snapshot);
    expect(adapter.getCurrentState().isPaused).toBe(true);
    adapter.resumeGame(adapter.getCurrentState());
    expect(adapter.getCurrentState().isPaused).toBe(false);
  });

  it('Sueca pause/resume still mutates engine state', () => {
    const adapter = GameFactory.getAdapter('sueca') as SuecaGame;
    adapter.initialize(names, { dealingMethod: 'A', aiDifficulty: 'medium' });
    adapter.startRound(adapter.getCurrentState());
    const snapshot = adapter.getCurrentState();
    adapter.pauseGame(snapshot);
    expect(snapshot.isPaused).toBe(false);
    expect(adapter.getCurrentState().isPaused).toBe(true);
    adapter.resumeGame(adapter.getCurrentState());
    expect(adapter.getCurrentState().isPaused).toBe(false);
  });

  it('Spades canPlayCard is false while paused', () => {
    const adapter = GameFactory.getAdapter('spades') as SpadesGame;
    adapter.initialize(names, { aiDifficulty: 'medium' });
    const s0 = adapter.getCurrentState();
    const spades = getSpadesState(s0);
    for (let step = 0; step < 4; step++) {
      const bidder = (spades.bidLeaderIndex + step) % 4;
      adapter.submitBid(bidder, 3, 'normal');
    }
    const playing = adapter.getCurrentState();
    expect(playing.waitingForRoundStart).toBe(false);
    const player = playing.currentPlayerIndex;
    let legalIndex = -1;
    for (let i = 0; i < playing.players[player].hand.length; i++) {
      if (adapter.canPlayCard(playing, player, i)) {
        legalIndex = i;
        break;
      }
    }
    expect(legalIndex).toBeGreaterThanOrEqual(0);

    adapter.pauseGame(playing);
    const paused = adapter.getCurrentState();
    expect(paused.isPaused).toBe(true);
    expect(adapter.canPlayCard(paused, player, legalIndex)).toBe(false);

    adapter.resumeGame(paused);
    expect(adapter.getCurrentState().isPaused).toBe(false);
  });
});
