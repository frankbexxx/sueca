import { encodeDecisionState } from '../encoder/encodeDecisionState';
import type { EncoderInput, EncodedDecisionState } from '../encoder/types';
import { evaluateDecision } from '../evaluator/evaluateDecision';
import { EVALUATOR_SCHEMA_VERSION } from '../evaluator/types';
import { CardDecisionLogEvent } from '../shared/types/logEvents';
import { TrickEndEvent } from '../shared/types/trickEndEvent';
import {
  loadAllLogEvents,
  splitLogEvents,
} from './readLogs';
import { EvaluateStoredOptions, EvaluateStoredResult } from './types';

export interface CiEncodeOptions {
  trickEndEvent?: TrickEndEvent;
  encodeMode?: EncoderInput['encodeMode'];
  viewType?: EncoderInput['viewType'];
  allowEngineView?: boolean;
}

export function findTrickEndForPlay(
  play: CardDecisionLogEvent,
  trickEnds: TrickEndEvent[]
): TrickEndEvent | null {
  const candidates = trickEnds.filter(
    (t) => t.gameId === play.gameId && t.trickIndex === play.trickIndex
  );
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    const after = candidates
      .filter((t) => t.timestamp >= play.timestamp)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    if (after.length > 0) return after[0];
    return [...candidates].sort((a, b) => a.timestamp.localeCompare(b.timestamp))[0];
  }
  return null;
}

export function ciEncode(
  event: CardDecisionLogEvent,
  options: CiEncodeOptions = {}
): EncodedDecisionState {
  const engineView = options.viewType === 'engine' || options.allowEngineView === true;
  return encodeDecisionState(
    {
      event,
      trickEndEvent: options.trickEndEvent,
      encodeMode: options.encodeMode ?? 'post_decision',
      viewType: engineView ? 'engine' : 'player',
    },
    { allowEngineView: engineView }
  );
}

export function evaluateStoredPlay(
  play: CardDecisionLogEvent,
  trickEnds: TrickEndEvent[],
  opts: EvaluateStoredOptions = {}
): EvaluateStoredResult {
  const warnings: string[] = [];
  const trickEnd = findTrickEndForPlay(play, trickEnds);
  if (!trickEnd && play.trickIndex !== null) {
    warnings.push(
      `trick_end missing for trickIndex ${play.trickIndex} (gameId ${play.gameId})`
    );
  }

  const engineView = opts.engineView === true;
  const encoded = ciEncode(play, {
    trickEndEvent: trickEnd ?? undefined,
    encodeMode: 'post_decision',
    viewType: engineView ? 'engine' : 'player',
    allowEngineView: engineView,
  });

  const evaluation = evaluateDecision({
    schemaVersion: EVALUATOR_SCHEMA_VERSION,
    encodedState: encoded,
    chosenCard: play.chosenCard,
    legalMoves: play.legalMoves,
    rawLogEvent: play,
    viewType: engineView ? 'engine' : 'player',
    evaluatorMode: engineView ? 'debug' : 'strict',
  });

  return { play, trickEnd, encoded, evaluation, warnings };
}

export async function evaluateStoredPlayByEventId(
  eventId: string,
  opts: EvaluateStoredOptions = {}
): Promise<EvaluateStoredResult | null> {
  const events = await loadAllLogEvents();
  const { plays, trickEnds } = splitLogEvents(events);
  const play = plays.find((p) => p.eventId === eventId);
  if (!play) return null;
  return evaluateStoredPlay(play, trickEnds, opts);
}

export async function evaluateStoredGame(
  gameId: string,
  opts: EvaluateStoredOptions = {}
): Promise<EvaluateStoredResult[]> {
  const events = await loadAllLogEvents();
  const { plays, trickEnds } = splitLogEvents(events);
  const gamePlays = plays
    .filter((p) => p.gameId === gameId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return gamePlays.map((play) => evaluateStoredPlay(play, trickEnds, opts));
}

export async function encodeStoredPlayByEventId(
  eventId: string,
  opts: EvaluateStoredOptions = {}
): Promise<EvaluateStoredResult | null> {
  const events = await loadAllLogEvents();
  const { plays, trickEnds } = splitLogEvents(events);
  const play = plays.find((p) => p.eventId === eventId);
  if (!play) return null;

  const warnings: string[] = [];
  const trickEnd = findTrickEndForPlay(play, trickEnds);
  if (!trickEnd && play.trickIndex !== null) {
    warnings.push(
      `trick_end missing for trickIndex ${play.trickIndex} (gameId ${play.gameId})`
    );
  }

  const engineView = opts.engineView === true;
  const encoded = ciEncode(play, {
    trickEndEvent: trickEnd ?? undefined,
    encodeMode: 'post_decision',
    viewType: engineView ? 'engine' : 'player',
    allowEngineView: engineView,
  });

  return { play, trickEnd, encoded, warnings };
}
