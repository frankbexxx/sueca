import type { Card, GameState } from '../../types/game';
import { buildTableRenderModel } from '../../table/buildTableRenderModel';
import { resolveGameBoardFlow } from '../../utils/gameFlowOrchestrator';
import {
  formatKingTableBanner,
  mapTableModelToPhaserView
} from './mapTableModelToPhaserView';
import { nextSyncGeneration, isStaleGeneration } from './phaserSyncGuards';
import { resolveTableRenderer } from '../resolveTableRenderer';
import { mustPlayKingOfHearts, type KingPtVariantState } from '../../models/games/KingPtGame';
import { emptyBreakdown } from '../../models/games/king/kingBreakdown';

function card(suit: Card['suit'], rank: Card['rank'], id: string): Card {
  return { suit, rank, id };
}

function defaultKingPt(overrides: Partial<KingPtVariantState> = {}): KingPtVariantState {
  return {
    phase: 'negative',
    gameIndex: 0,
    kohPlayerIndex: 0,
    contract: 'no_tricks',
    playerScores: [0, 0, 0, 0],
    lastRoundDeltas: [0, 0, 0, 0],
    trickNumber: 0,
    tricksWonThisGame: [0, 0, 0, 0],
    festaOwnerIndex: 0,
    festaMode: null,
    festaPhase: null,
    auctionOrder: [],
    auctionTurnIndex: 0,
    bestBid: null,
    requestedBid: null,
    activeContract: null,
    benefitOwnerIndex: null,
    eightOrNullsPending: false,
    eightOrNullsTarget: null,
    waitingForFallback: false,
    fallbackReason: null,
    waitingForFestaSetup: false,
    chosenTrump: null,
    noTrumpChosen: false,
    firstPlayerIndex: null,
    roundStartScores: [0, 0, 0, 0],
    roundBreakdown: emptyBreakdown(),
    gameHistory: [],
    kohReveal: null,
    nullAuctionStartNote: null,
    showScorePopup: null,
    waitingForEarlyEnd: false,
    scoringFrozen: false,
    earlyEndOffered: false,
    auctionPlayerActions: {},
    ...overrides
  };
}

function kingState(
  kingOverrides: Partial<KingPtVariantState> = {},
  stateOverrides: Partial<GameState> = {}
): GameState {
  const hand = Array.from({ length: 13 }, (_, i) =>
    card(
      'clubs',
      (['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const)[i],
      `c${i}`
    )
  );
  return {
    players: [
      { id: '1', name: 'P1', hand: [...hand], team: 1, type: 'human' },
      {
        id: '2',
        name: 'P2',
        hand: hand.map((c, i) => ({ ...c, id: `p2-${i}` })),
        team: 2,
        type: 'ai'
      },
      {
        id: '3',
        name: 'P3',
        hand: hand.map((c, i) => ({ ...c, id: `p3-${i}` })),
        team: 1,
        type: 'ai'
      },
      {
        id: '4',
        name: 'P4',
        hand: hand.map((c, i) => ({ ...c, id: `p4-${i}` })),
        team: 2,
        type: 'ai'
      }
    ],
    currentPlayerIndex: 0,
    dealerIndex: 3,
    trumpSuit: null,
    trumpCard: null,
    currentTrick: [],
    trickLeader: 0,
    scores: { team1: 0, team2: 0 },
    gameScore: { team1: 0, team2: 0 },
    completedPentes: [],
    round: 1,
    isGameOver: false,
    winner: null,
    lastTrickWinner: null,
    waitingForTrickEnd: false,
    nextTrickLeader: null,
    isFirstTrick: true,
    dealingMethod: 'A',
    dealingDirection: 'left',
    waitingForRoundStart: false,
    waitingForRoundEnd: false,
    waitingForGameStart: false,
    playedCards: [],
    isPaused: false,
    playerName: 'P1',
    aiDifficulty: 'medium',
    partnerSignals: [],
    variantState: { kingPt: defaultKingPt(kingOverrides) },
    ...stateOverrides
  };
}

function mapKing(
  gameState: GameState,
  opts: {
    width?: number;
    height?: number;
    isLocalCardPlayable?: (i: number) => boolean;
    rulesPresetId?: string;
  } = {}
) {
  const kingPt = gameState.variantState?.kingPt as KingPtVariantState;
  const boardFlow = resolveGameBoardFlow({
    variant: 'king',
    gameState,
    rulesPresetId: opts.rulesPresetId ?? 'king-pt-normal',
    kingPt
  });
  const model = buildTableRenderModel({
    gameState,
    variant: 'king',
    rulesPresetId: opts.rulesPresetId ?? 'king-pt-normal',
    localPlayerIndex: 0,
    usTeam: 1,
    themTeam: 2,
    boardFlow,
    auctionLocale: 'pt',
    kingPt
  });
  const view = mapTableModelToPhaserView({
    model,
    width: opts.width ?? 390,
    height: opts.height ?? 740,
    isLocalCardPlayable: opts.isLocalCardPlayable
  });
  return { model, view, boardFlow };
}

describe('King Phaser selector', () => {
  it('defaults Phaser; forces DOM with ?renderer=dom', () => {
    expect(resolveTableRenderer('king', { override: null })).toBe('phaser');
    expect(resolveTableRenderer('king', { search: '?renderer=dom' })).toBe('dom');
    expect(resolveTableRenderer('king', { search: '?renderer=phaser' })).toBe(
      'phaser'
    );
  });
});

describe('formatKingTableBanner', () => {
  it('maps negativas, trump, no-trump, and festa waits', () => {
    expect(
      formatKingTableBanner(
        {
          phase: 'negative',
          gameIndex: 1,
          contract: 'no_hearts',
          festaMode: null,
          festaPhase: null,
          festaOwnerIndex: 0,
          benefitOwnerIndex: null,
          bidderIndex: null,
          beneficiaryIndex: null,
          noTrump: false,
          eightOrNullsPending: false,
          waitingForChoice: false
        },
        null
      ).label
    ).toBe('Copas');

    expect(
      formatKingTableBanner(
        {
          phase: 'festa_play',
          gameIndex: 6,
          contract: null,
          festaMode: 'positive',
          festaPhase: null,
          festaOwnerIndex: 1,
          benefitOwnerIndex: 1,
          bidderIndex: 2,
          beneficiaryIndex: 1,
          noTrump: false,
          eightOrNullsPending: false,
          waitingForChoice: false
        },
        'spades'
      )
    ).toEqual({ label: 'Trunfo ♠', accent: true });

    expect(
      formatKingTableBanner(
        {
          phase: 'festa_play',
          gameIndex: 7,
          contract: null,
          festaMode: 'positive',
          festaPhase: null,
          festaOwnerIndex: 0,
          benefitOwnerIndex: 0,
          bidderIndex: null,
          beneficiaryIndex: 0,
          noTrump: true,
          eightOrNullsPending: false,
          waitingForChoice: false
        },
        null
      ).label
    ).toBe('Sem trunfo');

    expect(
      formatKingTableBanner(
        {
          phase: 'festa_setup',
          gameIndex: 6,
          contract: null,
          festaMode: null,
          festaPhase: 'auction',
          festaOwnerIndex: 0,
          benefitOwnerIndex: null,
          bidderIndex: null,
          beneficiaryIndex: 0,
          noTrump: false,
          eightOrNullsPending: false,
          waitingForChoice: true
        },
        null
      ).label
    ).toBe('Festa · leilão');

    expect(
      formatKingTableBanner(
        {
          phase: 'festa_setup',
          gameIndex: 6,
          contract: null,
          festaMode: null,
          festaPhase: 'negotiation',
          festaOwnerIndex: 0,
          benefitOwnerIndex: null,
          bidderIndex: 2,
          beneficiaryIndex: 0,
          noTrump: false,
          eightOrNullsPending: true,
          waitingForChoice: true
        },
        null
      ).label
    ).toBe('8 ou nulos');
  });
});

describe('mapTableModelToPhaserView — King', () => {
  it.each([
    ['no_tricks', 'Vazas'],
    ['no_hearts', 'Copas'],
    ['no_queens', 'Damas'],
    ['no_men', 'Homens'],
    ['no_king_hearts', 'King ♥'],
    ['no_last_two', 'Últimas']
  ] as const)('maps negative %s banner', (contract, label) => {
    const { view } = mapKing(
      kingState({ contract, gameIndex: 0, phase: 'negative' })
    );
    expect(view.trumpLabel).toBe(label);
    expect(view.kingFestaPhase).toBe(false);
    expect(view.interactionEnabled).toBe(true);
  });

  it('locks interaction during festa auction / choice', () => {
    const { model, view } = mapKing(
      kingState(
        {
          phase: 'festa_setup',
          gameIndex: 6,
          contract: null,
          festaPhase: 'auction',
          festaOwnerIndex: 1,
          auctionPlayerActions: {
            2: 'pass',
            3: { bidderIndex: 3, bidType: 'positive', amount: 4 }
          }
        },
        { waitingForRoundStart: true }
      )
    );
    expect(model.status.festaSheetActive).toBe(true);
    expect(model.activeSeat).toBeNull();
    expect(view.kingFestaPhase).toBe(true);
    expect(view.kingWaitingForChoice).toBe(true);
    expect(view.interactionEnabled).toBe(false);
    expect(view.localIsActive).toBe(false);
    // Festa sheet owns narrative; Phaser banner cleared.
    expect(view.trumpLabel).toBe('');
    expect(view.showTrumpSymbol).toBe(false);
    expect(view.seats[2].bidLabel).toBe('Passou');
    expect(view.seats[3].bidLabel).toBe('4 pos.');
  });

  it('maps positive trump and beneficiary/bidder badges', () => {
    const { view, model } = mapKing(
      kingState(
        {
          phase: 'festa_play',
          gameIndex: 6,
          contract: null,
          festaMode: 'positive',
          festaPhase: null,
          festaOwnerIndex: 1,
          benefitOwnerIndex: 1,
          activeContract: {
            bidType: 'positive',
            amount: 5,
            bidderIndex: 2,
            beneficiaryIndex: 1
          },
          noTrumpChosen: false,
          chosenTrump: 'hearts'
        },
        { trumpSuit: 'hearts', currentPlayerIndex: 0 }
      )
    );
    expect(model.variantUi.king?.bidderIndex).toBe(2);
    expect(model.variantUi.king?.beneficiaryIndex).toBe(1);
    expect(view.trumpLabel).toBe('Trunfo ♥');
    expect(view.bannerAccent).toBe(true);
    expect(view.seats[2].bidLabel).toContain('Lic');
    expect(view.seats[1].bidLabel).toContain('Ben');
  });

  it('maps no-trump and nulos-style festa play', () => {
    const noTrump = mapKing(
      kingState({
        phase: 'festa_play',
        gameIndex: 7,
        contract: null,
        festaMode: 'positive',
        noTrumpChosen: true,
        activeContract: {
          bidType: 'null',
          amount: 2,
          bidderIndex: 3,
          beneficiaryIndex: 0
        }
      })
    );
    expect(noTrump.view.trumpLabel).toBe('Sem trunfo');
    expect(noTrump.model.variantUi.king?.noTrump).toBe(true);

    const eight = mapKing(
      kingState(
        {
          phase: 'festa_setup',
          gameIndex: 6,
          contract: null,
          festaPhase: 'negotiation',
          eightOrNullsPending: true,
          eightOrNullsTarget: 2,
          bestBid: { bidderIndex: 2, bidType: 'positive', amount: 8 }
        },
        { waitingForRoundStart: true }
      )
    );
    expect(eight.view.kingFestaPhase).toBe(true);
    expect(eight.view.trumpLabel).toBe('');
    expect(eight.view.interactionEnabled).toBe(false);
  });

  it('maps 4x3x3 / fallback choice as waiting (React owns CTA)', () => {
    const { view } = mapKing(
      kingState(
        {
          phase: 'festa_setup',
          gameIndex: 6,
          contract: null,
          festaPhase: 'fallback',
          waitingForFallback: true,
          fallbackReason: 'no_bids',
          festaOwnerIndex: 0
        },
        { waitingForRoundStart: true }
      )
    );
    expect(view.kingWaitingForChoice).toBe(true);
    expect(view.interactionEnabled).toBe(false);
    expect(view.trumpLabel).toBe('');
  });

  it('maps legal/illegal and inactive hand', () => {
    const active = mapKing(kingState({ contract: 'no_tricks' }), {
      isLocalCardPlayable: (i) => i % 2 === 0
    });
    expect(active.view.localIsActive).toBe(true);
    expect(active.view.localHand[0].canDrag).toBe(true);
    expect(active.view.localHand[1].canDrag).toBe(false);

    const inactive = mapKing(
      kingState({ contract: 'no_tricks' }, { currentPlayerIndex: 2 }),
      { isLocalCardPlayable: () => true }
    );
    expect(inactive.view.localIsActive).toBe(false);
    expect(inactive.view.localHand.every((c) => c.visualState === 'inactive')).toBe(
      true
    );
  });

  it('maps dealer/leader, trick 0→4, hand shrink, portrait/landscape', () => {
    const empty = mapKing(
      kingState({ contract: 'no_queens' }, { dealerIndex: 2, trickLeader: 1 })
    );
    expect(empty.view.trick).toHaveLength(0);
    expect(empty.model.dealerSeat).toBe(2);
    expect(empty.model.leaderSeat).toBe(1);
    expect(empty.view.layout.aspect).toBe('portrait');

    const withTrick = kingState(
      { contract: 'no_men' },
      {
        currentTrick: [
          card('spades', '2', 's2'),
          card('spades', '5', 's5'),
          card('spades', '9', 's9'),
          card('spades', 'J', 'sj')
        ],
        players: kingState().players.map((p, i) =>
          i === 0 ? { ...p, hand: p.hand.slice(0, 12) } : p
        )
      }
    );
    const mapped = mapKing(withTrick, { width: 800, height: 400 });
    expect(mapped.view.trick).toHaveLength(4);
    expect(mapped.view.localHand).toHaveLength(12);
    expect(mapped.view.layout.aspect).toBe('landscape');
  });

  it('maps empty hand, round end, and generation guard', () => {
    const emptyHand = mapKing(
      kingState(
        { contract: 'no_last_two' },
        { players: kingState().players.map((p) => ({ ...p, hand: [] })) }
      )
    );
    expect(emptyHand.view.localHand).toHaveLength(0);

    const roundEnd = mapKing(
      kingState({ contract: 'no_tricks' }, { waitingForRoundEnd: true })
    );
    expect(roundEnd.view.interactionEnabled).toBe(false);

    let g = 0;
    g = nextSyncGeneration(g);
    g = nextSyncGeneration(g);
    expect(isStaleGeneration(1, g)).toBe(true);
    expect(isStaleGeneration(g, g)).toBe(false);
  });
});

describe('King K♥ first legal opportunity (engine + Phaser mapping)', () => {
  it('maps mandatory vs non-mandatory K♥ via shell playability', () => {
    const king = defaultKingPt({
      contract: 'no_king_hearts',
      gameIndex: 4,
      phase: 'negative'
    });
    const playerMandatory = {
      id: '1',
      name: 'P1',
      team: 1 as const,
      type: 'human' as const,
      hand: [
        card('hearts', 'K', 'kh'),
        card('diamonds', '5', 'd5'),
        card('spades', '3', 's3')
      ]
    };
    // Void in led clubs → must dump K♥
    expect(mustPlayKingOfHearts(playerMandatory, 'clubs', king)).toBe(true);
    // Lead with non-heart available → not mandatory
    expect(mustPlayKingOfHearts(playerMandatory, null, king)).toBe(false);

    const state = kingState(
      { contract: 'no_king_hearts', gameIndex: 4 },
      {
        currentPlayerIndex: 0,
        currentTrick: [card('clubs', '2', 'lead')],
        trickLeader: 3,
        players: [
          playerMandatory,
          ...kingState().players.slice(1)
        ]
      }
    );
    const mandatory = mapKing(state, {
      isLocalCardPlayable: (i) =>
        mustPlayKingOfHearts(state.players[0], 'clubs', king)
          ? state.players[0].hand[i].rank === 'K' &&
            state.players[0].hand[i].suit === 'hearts'
          : true
    });
    expect(mandatory.view.localHand[0].visualState).toBe('legal');
    expect(mandatory.view.localHand[1].visualState).toBe('illegal');
    expect(mandatory.view.localHand[2].visualState).toBe('illegal');

    const inactive = mapKing(
      kingState(
        { contract: 'no_king_hearts', gameIndex: 4 },
        { currentPlayerIndex: 2 }
      ),
      { isLocalCardPlayable: () => true }
    );
    expect(inactive.view.localIsActive).toBe(false);
    expect(inactive.view.localHand.every((c) => c.canDrag === false)).toBe(true);
  });
});
