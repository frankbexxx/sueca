import {
  applyDevFestaFixture,
  assertJumpTargetsFesta,
  expectedFestaOwnerForGame,
  festaGameNumberToIndex,
  formatDevKingFestaBadge,
  isKingDevJumpEnabled,
  parseDevKingFestaParams,
  DevKingFestaJump
} from './kingFestaJump';
import { KingPtGame, getKingPtState } from '../models/games/KingPtGame';
import { KingGame } from '../models/games/KingGame';

const NAMES = ['P1', 'P2', 'P3', 'P4'];

describe('kingFestaJump (DEV)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('parseDevKingFestaParams', () => {
    it('parses festa 7–10 with default auction', () => {
      process.env.NODE_ENV = 'development';
      expect(parseDevKingFestaParams('?devKingFesta=7')).toEqual({
        festaGameNumber: 7,
        festaPhase: 'auction',
        liveAuction: false
      });
      expect(parseDevKingFestaParams('devKingFesta=10&festaPhase=setup')).toEqual({
        festaGameNumber: 10,
        festaPhase: 'setup',
        liveAuction: false
      });
      expect(parseDevKingFestaParams('?devKingFesta=7&devKingFestaLive=1')).toEqual({
        festaGameNumber: 7,
        festaPhase: 'auction',
        liveAuction: true
      });
    });

    it('ignores invalid query silently', () => {
      process.env.NODE_ENV = 'development';
      expect(parseDevKingFestaParams('?devKingFesta=6')).toBeNull();
      expect(parseDevKingFestaParams('?devKingFesta=11')).toBeNull();
      expect(parseDevKingFestaParams('?devKingFesta=foo')).toBeNull();
      expect(parseDevKingFestaParams('?devKingFesta=7&festaPhase=nope')).toBeNull();
      expect(parseDevKingFestaParams('')).toBeNull();
    });

    it('production ignores dev jump', () => {
      process.env.NODE_ENV = 'production';
      expect(isKingDevJumpEnabled()).toBe(false);
      expect(parseDevKingFestaParams('?devKingFesta=7')).toBeNull();
    });
  });

  describe('applyDevFestaFixture owners', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it.each([
      [7, 0],
      [8, 1],
      [9, 2],
      [10, 3]
    ] as const)('Festa %i → owner Player %i', (festaGameNumber, ownerIndex) => {
      expect(expectedFestaOwnerForGame(festaGameNumber)).toBe(ownerIndex);
      const game = new KingPtGame();
      const jump: DevKingFestaJump = { festaGameNumber, festaPhase: 'auction' };
      expect(assertJumpTargetsFesta(jump)).toBe(true);

      const state = game.applyDevFestaFixture(NAMES, jump, { localPlayerIndex: 0 });
      const king = getKingPtState(state);

      expect(king.gameIndex).toBe(festaGameNumberToIndex(festaGameNumber));
      expect(king.festaOwnerIndex).toBe(ownerIndex);
      expect(king.festaPhase).toBe('auction');
      expect(king.phase).toBe('festa_setup');
      expect(state.waitingForRoundStart).toBe(true);
      expect(state.players.every((p) => p.hand.length === 13)).toBe(true);
      expect(king.auctionOrder).toHaveLength(3);
      expect(king.pauseFestaAiForDev).toBe(true);
    });

    it('auction is not drained immediately with DEV pause', () => {
      const game = new KingPtGame();
      const state = game.applyDevFestaFixture(
        NAMES,
        { festaGameNumber: 7, festaPhase: 'auction' },
        { localPlayerIndex: 0 }
      );
      const before = getKingPtState(state);
      expect(before.festaPhase).toBe('auction');
      expect(before.auctionTurnIndex).toBe(0);
      expect(before.bestBid).toBeNull();

      const acted = game.tickFestaAi();
      expect(acted).toBe(false);
      const after = getKingPtState(game.getCurrentState());
      expect(after.festaPhase).toBe('auction');
      expect(after.auctionTurnIndex).toBe(0);
      expect(after.bestBid).toBeNull();
      expect(Object.keys(after.auctionPlayerActions)).toHaveLength(0);
    });

    it('creates valid playable festa state via KingGame facade', () => {
      const facade = new KingGame();
      const state = applyDevFestaFixture(
        facade,
        NAMES,
        { festaGameNumber: 8, festaPhase: 'auction' },
        { localPlayerIndex: 0, rulesPresetId: 'king-pt-normal' }
      );
      expect(state).not.toBeNull();
      const king = getKingPtState(state!);
      expect(king.festaOwnerIndex).toBe(1);
      expect(king.playerScores).toEqual([-180, 60, -120, 240]);
      expect(state!.isGameOver).toBe(false);
      expect(state!.variant).toBe('king');
    });

    it('negotiation / setup fixtures stay valid', () => {
      const game = new KingPtGame();
      const neg = getKingPtState(
        game.applyDevFestaFixture(NAMES, { festaGameNumber: 7, festaPhase: 'negotiation' })
      );
      expect(neg.festaPhase).toBe('negotiation');
      expect(neg.bestBid).not.toBeNull();
      expect(neg.pauseFestaAiForDev).toBeFalsy();

      const setup = getKingPtState(
        game.applyDevFestaFixture(NAMES, { festaGameNumber: 9, festaPhase: 'setup' })
      );
      expect(setup.festaPhase).toBe('setup');
      expect(setup.waitingForFestaSetup).toBe(true);
      expect(setup.activeContract).not.toBeNull();
    });
  });

  it('live auction jump does not set DEV pause', () => {
    process.env.NODE_ENV = 'development';
    const game = new KingPtGame();
    const state = game.applyDevFestaFixture(
      NAMES,
      { festaGameNumber: 7, festaPhase: 'auction', liveAuction: true },
      { localPlayerIndex: 0 }
    );
    expect(getKingPtState(state).pauseFestaAiForDev).toBeFalsy();
    expect(game.tickFestaAi()).toBe(true);
    const after = getKingPtState(game.getCurrentState());
    expect(after.auctionTurnIndex).toBe(1);
    expect(after.waitingForAuctionContinue).toBe(true);
    expect(game.tickFestaAi()).toBe(false);
  });

  it('formats DEV badge', () => {
    expect(formatDevKingFestaBadge({ festaGameNumber: 7, festaPhase: 'auction' })).toBe(
      'DEV · King Festa 7 · auction'
    );
    expect(
      formatDevKingFestaBadge({ festaGameNumber: 7, festaPhase: 'auction', liveAuction: true })
    ).toBe('DEV · King Festa 7 · auction · live');
  });

  it('production applyDevFestaFixture falls back to normal init', () => {
    process.env.NODE_ENV = 'production';
    const game = new KingPtGame();
    const state = game.applyDevFestaFixture(NAMES, { festaGameNumber: 7, festaPhase: 'auction' });
    const king = getKingPtState(state);
    expect(king.phase).toBe('koh_reveal');
    expect(king.gameIndex).toBe(0);
    expect(king.pauseFestaAiForDev).toBeUndefined();
  });
});