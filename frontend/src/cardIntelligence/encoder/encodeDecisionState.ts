import { CardDecisionLogEvent } from '../shared/types/logEvents';
import {
  acesSeenFromPlays,
  countTrumpInPlays,
  sevensSeenFromPlays,
} from '../history/historySelectors';
import { kingHeartsPlayedInHistory } from '../shared/kingObligations';
import { buildMetricContext } from './metricContext';
import { encodeHeartsVariant, resolveHeartsCurrentWinner } from './heartsEncoder';
import { encodeKingVariant, resolveKingContractId, resolveKingCurrentWinner } from './kingEncoder';
import { encodeSpadesVariant, resolveSpadesCurrentWinner } from './spadesEncoder';
import { encodeSuecaVariant, resolveSuecaCurrentWinner } from './suecaEncoder';
import {
  EncodeDecisionStateOptions,
  EncodedDecisionState,
  EncoderInput,
  EngineViewNotSupportedError,
  ENCODED_SCHEMA_VERSION,
  HiddenInformationPolicy,
  ImportantCardsSeen,
  SuecaEncoding,
} from './types';

const PLAYER_VIEW_EXCLUDED = [
  'opponentHands',
  'deckRemaining',
  'confirmedVoids',
];

function resolveEncodeMode(input: EncoderInput): 'pre_decision' | 'post_decision' {
  return input.encodeMode ?? 'post_decision';
}

function resolveViewType(input: EncoderInput): 'player' | 'engine' {
  return input.viewType ?? 'player';
}

function resolveTeamIndex(event: CardDecisionLogEvent): 1 | 2 | null {
  const vf = event.variantFields;
  if ('teamIndex' in vf && (vf.teamIndex === 1 || vf.teamIndex === 2)) {
    return vf.teamIndex;
  }
  return event.playerIndex % 2 === 0 ? 1 : 2;
}

function buildImportantCardsSeen(
  event: CardDecisionLogEvent
): ImportantCardsSeen {
  const plays = event.roundPlayHistory;
  return {
    acesBySuit: acesSeenFromPlays(plays),
    sevensBySuit: sevensSeenFromPlays(plays),
    trumpSeenCount: countTrumpInPlays(plays, event.trumpSuit),
    queenSpadesPlayed: plays.some((p) => p.card.rank === 'Q' && p.card.suit === 'spades'),
    kingHeartsPlayed: kingHeartsPlayedInHistory(plays),
  };
}

function buildHiddenPolicy(viewType: 'player' | 'engine'): HiddenInformationPolicy {
  return {
    viewType,
    excludedFields: viewType === 'player' ? [...PLAYER_VIEW_EXCLUDED] : [],
    inferenceAllowed: viewType === 'player',
    sourceOfTruth: 'log',
  };
}

function resolveContractId(event: CardDecisionLogEvent): string | null {
  if (event.variant === 'king') {
    return resolveKingContractId(event);
  }
  if ('contractId' in event.variantFields && event.variantFields.contractId) {
    return event.variantFields.contractId;
  }
  return event.contract;
}

export function encodeDecisionState(
  input: EncoderInput,
  options: EncodeDecisionStateOptions = {}
): EncodedDecisionState {
  const viewType = resolveViewType(input);
  if (viewType === 'engine' && !options.allowEngineView) {
    throw new EngineViewNotSupportedError();
  }

  const encodeMode = resolveEncodeMode(input);
  const { event, trickEndEvent } = input;
  const chosenCard = encodeMode === 'pre_decision' ? null : event.chosenCard;

  let currentWinner: number | null = null;
  let variantEncoding: EncodedDecisionState['variantEncoding'];

  switch (event.variant) {
    case 'sueca': {
      currentWinner = resolveSuecaCurrentWinner(event, trickEndEvent);
      variantEncoding = encodeSuecaVariant(event, trickEndEvent, currentWinner);
      break;
    }
    case 'spades': {
      currentWinner = resolveSpadesCurrentWinner(event, trickEndEvent);
      variantEncoding = encodeSpadesVariant(event, trickEndEvent, currentWinner);
      break;
    }
    case 'hearts': {
      currentWinner = resolveHeartsCurrentWinner(event, trickEndEvent);
      variantEncoding = encodeHeartsVariant(event, trickEndEvent, currentWinner);
      break;
    }
    case 'king': {
      currentWinner = resolveKingCurrentWinner(event, trickEndEvent);
      variantEncoding = encodeKingVariant(event, trickEndEvent);
      break;
    }
    default: {
      currentWinner = resolveSuecaCurrentWinner(event, trickEndEvent);
      variantEncoding = encodeSuecaVariant(event, trickEndEvent, currentWinner);
      break;
    }
  }

  const suecaEnc = event.variant === 'sueca' ? (variantEncoding as SuecaEncoding) : null;

  const partial: EncodedDecisionState = {
    schemaVersion: ENCODED_SCHEMA_VERSION,
    sourceEventId: event.eventId,
    gameId: event.gameId,
    sessionId: event.sessionId,
    timestamp: event.timestamp,
    variant: event.variant,
    mode: event.mode,
    contractId: resolveContractId(event),
    phase: 'play',
    playerIndex: event.playerIndex,
    playerType: event.playerType,
    difficulty: event.difficulty,
    viewType,
    encodeMode,
    roundIndex: event.roundIndex,
    trickIndex: event.trickIndex ?? 0,
    turnIndex: event.turnIndex,
    hand: event.handBefore,
    legalMoves: event.legalMoves,
    chosenCard,
    currentTrick: event.trickBefore,
    trickPosition: event.trickBefore.length,
    ledSuit: event.ledSuit,
    trumpSuit: event.trumpSuit,
    currentWinner,
    visiblePlayedCards: event.roundPlayHistory,
    importantCardsSeen: buildImportantCardsSeen(event),
    scoreContext: {
      raw: event.scoreBefore.raw,
      teamIndex: resolveTeamIndex(event),
    },
    riskContext: {
      cutRisk: suecaEnc?.cutRisk ?? null,
      avoidBagMode:
        variantEncoding && 'avoidBagMode' in variantEncoding
          ? variantEncoding.avoidBagMode
          : null,
    },
    memoryContext: {
      schemaVersion: '6.0.0-stub',
      aggregates: [],
    },
    metricContext: [],
    availableInformation: {
      known: {
        handSize: event.handBefore.length,
        trickSize: event.trickBefore.length,
        playsSeen: event.roundPlayHistory.length,
      },
      inferred: {},
      hidden: viewType === 'player' ? [...PLAYER_VIEW_EXCLUDED] : [],
    },
    hiddenInformationPolicy: buildHiddenPolicy(viewType),
    variantEncoding,
  };

  partial.metricContext = buildMetricContext(partial);

  return partial;
}

/** Test helper — build minimal CardDecisionLogEvent */
export function createTestLogEvent(
  overrides: Partial<CardDecisionLogEvent> & Pick<CardDecisionLogEvent, 'variant'>
): CardDecisionLogEvent {
  const base: CardDecisionLogEvent = {
    eventId: 'evt-test',
    gameId: 'game-test',
    sessionId: 'session-test',
    timestamp: new Date().toISOString(),
    variant: overrides.variant,
    mode: null,
    contract: null,
    roundIndex: 0,
    trickIndex: 0,
    turnIndex: 0,
    playerIndex: 0,
    playerType: 'human',
    difficulty: null,
    handBefore: [],
    legalMoves: [],
    chosenCard: { suit: 'clubs', rank: '2', id: '2c' },
    trickBefore: [],
    trickAfter: [],
    trumpSuit: null,
    ledSuit: null,
    currentWinnerBefore: null,
    currentWinnerAfter: null,
    roundPlayHistory: [],
    scoreBefore: { raw: {} },
    scoreAfter: { raw: {} },
    metricsCandidateIds: [],
    fixtureCandidateIds: [],
    classification: 'unknown',
    reason: null,
    source: 'test',
    aiSource: null,
    schemaVersion: '3.0.0',
    variantFields: { partnerIndex: 2, teamIndex: 1 },
  };
  return { ...base, ...overrides, variantFields: overrides.variantFields ?? base.variantFields };
}
