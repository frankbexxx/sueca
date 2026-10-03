import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DealAlignment, PlayDirection, PlayerType } from '../types/game';
import { useLanguage } from '../i18n/useLanguage';
import {
  alignmentFromPhysicalDealChoice,
  isSuecaDealerAi,
  pickAiPhysicalDealDirection,
  resolveRitualTimings,
  ritualFocusForPhase,
  ritualSeatsForDealer,
  type SuecaPhysicalDealDirection,
  type SuecaRitualFixedTimings,
  type SuecaRitualFocus,
  type SuecaRitualPhase
} from '../models/games/suecaHandRitual';
import type { SuecaRitualDebugPhase } from '../dev/suecaRitualDebug';
import { useSceneGeometrySnapshot } from '../hooks/SceneGeometryContext';
import { resolveSuecaRitualCanonicalZone } from '../runtime/canonicalScenePlacement';
import { CanonicalDecisionSurface } from './CanonicalDecisionSurface';
import './VariantModals.css';

export interface SuecaDealingModalPlayer {
  name: string;
  type?: PlayerType;
}

interface SuecaDealingModalProps {
  playDirection: PlayDirection;
  dealerIndex: number;
  players: SuecaDealingModalPlayer[];
  onConfirm: (alignment: DealAlignment) => void;
  /** UX-SUECA-03 — notify table of ritual focus (cleared on unmount). */
  onRitualFocusChange?: (focus: SuecaRitualFocus | null) => void;
  /** Injected RNG for AI 50/50 (tests). */
  random?: () => number;
  /** Fixed phase durations (tests / deterministic). */
  timings?: Partial<SuecaRitualFixedTimings>;
  /**
   * UX-SUECA-08 — freeze timers; parent Continuar bumps `debugAdvanceNonce`.
   */
  ritualDebug?: boolean;
  /** Increment to request exactly one phase advance (debug only). */
  debugAdvanceNonce?: number;
  onRitualDebugPhase?: (phase: SuecaRitualDebugPhase) => void;
}

function debugPhaseForRitual(
  phase: SuecaRitualPhase,
  dealerIsAi: boolean
): SuecaRitualDebugPhase {
  if (phase === 'dealer-decision' && !dealerIsAi) return 'dealer-choice';
  return phase;
}

/** UX-SUECA-03 — compact premium table card + ritual focus callbacks. */
export const SuecaDealingModal: React.FC<SuecaDealingModalProps> = ({
  playDirection,
  dealerIndex,
  players,
  onConfirm,
  onRitualFocusChange,
  random = Math.random,
  timings: timingOverrides,
  ritualDebug = false,
  debugAdvanceNonce = 0,
  onRitualDebugPhase
}) => {
  const { t } = useLanguage();
  const sceneGeometry = useSceneGeometrySnapshot();
  const seats = useMemo(() => ritualSeatsForDealer(dealerIndex), [dealerIndex]);
  const dealer = players[seats.dealer];
  const shuffler = players[seats.shuffler];
  const cutter = players[seats.cutter];
  const dealerName = dealer?.name ?? `Player ${seats.dealer + 1}`;
  const shufflerName = shuffler?.name ?? `Player ${seats.shuffler + 1}`;
  const cutterName = cutter?.name ?? `Player ${seats.cutter + 1}`;
  const dealerIsAi = isSuecaDealerAi(dealer?.type);

  const [phase, setPhase] = useState<SuecaRitualPhase>('shuffle');
  const [physicalChoice, setPhysicalChoice] = useState<SuecaPhysicalDealDirection | null>(
    null
  );
  const [aiResult, setAiResult] = useState<SuecaPhysicalDealDirection | null>(null);

  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  const onFocusRef = useRef(onRitualFocusChange);
  onFocusRef.current = onRitualFocusChange;
  const onDebugPhaseRef = useRef(onRitualDebugPhase);
  onDebugPhaseRef.current = onRitualDebugPhase;
  const randomRef = useRef(random);
  randomRef.current = random;
  const confirmedRef = useRef(false);
  const lastAdvanceNonceRef = useRef(debugAdvanceNonce);

  const resolvedTimings = useMemo(
    () => resolveRitualTimings(timingOverrides, random),
    // Resolve once per mount — avoid re-rolling mid-ritual.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount cadence
    [timingOverrides]
  );

  useEffect(() => {
    confirmedRef.current = false;
    setPhase('shuffle');
    setPhysicalChoice(null);
    setAiResult(null);
  }, [dealerIndex, playDirection]);

  useEffect(() => {
    onFocusRef.current?.(ritualFocusForPhase(phase, dealerIndex));
  }, [phase, dealerIndex]);

  useEffect(() => {
    onDebugPhaseRef.current?.(debugPhaseForRitual(phase, dealerIsAi));
  }, [phase, dealerIsAi]);

  useEffect(() => {
    return () => {
      onFocusRef.current?.(null);
    };
  }, []);

  /** UX-SUECA-08 — one Continuar click → one phase (no timers). */
  useEffect(() => {
    if (!ritualDebug) return;
    if (debugAdvanceNonce === lastAdvanceNonceRef.current) return;
    lastAdvanceNonceRef.current = debugAdvanceNonce;
    if (debugAdvanceNonce <= 0) return;

    if (phase === 'shuffle') {
      setPhase('cut');
      return;
    }
    if (phase === 'cut') {
      setPhase('dealer-decision');
      return;
    }
    if (phase === 'dealer-decision') {
      if (!dealerIsAi) {
        // Human must choose + Distribuir — Continuar must not bypass.
        return;
      }
      const physical = pickAiPhysicalDealDirection(randomRef.current);
      setAiResult(physical);
      setPhase('dealer-decision-result');
      return;
    }
    if (phase === 'dealer-decision-result' && dealerIsAi && aiResult) {
      if (confirmedRef.current) return;
      confirmedRef.current = true;
      onConfirmRef.current(alignmentFromPhysicalDealChoice(playDirection, aiResult));
    }
  }, [
    ritualDebug,
    debugAdvanceNonce,
    phase,
    dealerIsAi,
    aiResult,
    playDirection
  ]);

  useEffect(() => {
    if (ritualDebug) return;
    if (phase !== 'shuffle') return;
    const id = window.setTimeout(() => setPhase('cut'), resolvedTimings.shuffleMs);
    return () => window.clearTimeout(id);
  }, [phase, resolvedTimings.shuffleMs, ritualDebug]);

  useEffect(() => {
    if (ritualDebug) return;
    if (phase !== 'cut') return;
    const id = window.setTimeout(() => setPhase('dealer-decision'), resolvedTimings.cutMs);
    return () => window.clearTimeout(id);
  }, [phase, resolvedTimings.cutMs, ritualDebug]);

  useEffect(() => {
    if (ritualDebug) return;
    if (phase !== 'dealer-decision' || !dealerIsAi) return;
    const id = window.setTimeout(() => {
      const physical = pickAiPhysicalDealDirection(randomRef.current);
      setAiResult(physical);
      setPhase('dealer-decision-result');
    }, resolvedTimings.aiDecisionMs);
    return () => window.clearTimeout(id);
  }, [phase, dealerIsAi, resolvedTimings.aiDecisionMs, ritualDebug]);

  useEffect(() => {
    if (ritualDebug) return;
    if (phase !== 'dealer-decision-result' || !dealerIsAi || !aiResult) return;
    const id = window.setTimeout(() => {
      if (confirmedRef.current) return;
      confirmedRef.current = true;
      onConfirmRef.current(alignmentFromPhysicalDealChoice(playDirection, aiResult));
    }, resolvedTimings.decisionResultMs);
    return () => window.clearTimeout(id);
  }, [
    phase,
    dealerIsAi,
    aiResult,
    playDirection,
    resolvedTimings.decisionResultMs,
    ritualDebug
  ]);

  const handleConfirm = () => {
    if (!physicalChoice || confirmedRef.current) return;
    confirmedRef.current = true;
    onConfirm(alignmentFromPhysicalDealChoice(playDirection, physicalChoice));
  };

  const showHumanDecision = phase === 'dealer-decision' && !dealerIsAi;
  const density =
    showHumanDecision ? 'human' : phase === 'shuffle' || phase === 'cut' ? 'status' : 'decision';
  const ritualKind = density === 'human' ? 'human' : density === 'status' ? 'status' : 'decision';
  const geometry = sceneGeometry?.supported === true ? sceneGeometry.geometry : null;
  const canonicalZone = geometry
    ? resolveSuecaRitualCanonicalZone(geometry, ritualKind)
    : 'decisionSheetRect';

  let statusText: string | null = null;
  if (phase === 'shuffle') statusText = t.modals.shuffling(shufflerName);
  else if (phase === 'cut') statusText = t.modals.cutting(cutterName);
  else if (phase === 'dealer-decision' && dealerIsAi) {
    statusText = t.modals.dealerDeciding(dealerName);
  } else if (phase === 'dealer-decision-result' && aiResult) {
    statusText =
      aiResult === 'right'
        ? t.modals.willDealRight(dealerName)
        : t.modals.willDealLeft(dealerName);
  }

  return (
    <CanonicalDecisionSurface
      zone={canonicalZone}
      align="center"
      testId="sueca-ritual-overlay"
      className="canonical-decision-surface--sueca-ritual"
    >
      <div
        className={`variant-modal dealing-modal dealing-modal--ritual dealing-modal--ritual-plaque dealing-modal--ritual-clearance dealing-modal--ritual-${density}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dealing-modal-title"
        data-ritual-phase={phase}
        data-dealer-ai={dealerIsAi ? 'true' : 'false'}
        data-ritual-debug={ritualDebug ? '1' : undefined}
        data-canonical-zone={canonicalZone}
      >
        <p id="dealing-modal-title" className="dealing-modal-kicker">
          {t.modals.dealingTitle}
        </p>

        {!showHumanDecision && statusText ? (
          <p
            className={`dealing-modal-status${
              phase === 'dealer-decision' || phase === 'dealer-decision-result'
                ? ' dealing-modal-status--decision'
                : ''
            }`}
            aria-live="polite"
          >
            {statusText}
          </p>
        ) : null}

        {showHumanDecision ? (
          <>
            <p className="dealing-modal-dealer" aria-live="polite">
              <span className="dealing-modal-dealer-label">{t.modals.dealerLabel}</span>{' '}
              <strong>{dealerName}</strong>
            </p>
            <p className="dealing-modal-prompt">{t.modals.dealPrompt}</p>
            <div
              className="dealing-modal-choices"
              role="radiogroup"
              aria-label={t.modals.dealPrompt}
            >
              {(
                [
                  { id: 'right' as const, label: t.modals.dealPhysicalRight },
                  { id: 'left' as const, label: t.modals.dealPhysicalLeft }
                ] as const
              ).map((opt) => {
                const selected = physicalChoice === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-physical-deal={opt.id}
                    className={`dealing-choice-card${selected ? ' is-selected' : ''}`}
                    onClick={() => setPhysicalChoice(opt.id)}
                  >
                    <span className="dealing-choice-card__body">
                      <span className="dealing-choice-card__title">{opt.label}</span>
                    </span>
                    {selected ? (
                      <span className="deal-select-check" aria-hidden="true">
                        ✓
                      </span>
                    ) : (
                      <span
                        className="deal-select-check deal-select-check--empty"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="sueca-btn sueca-btn--primary dealing-modal-start"
              disabled={!physicalChoice}
              onClick={handleConfirm}
            >
              {t.modals.dealConfirm}
            </button>
          </>
        ) : null}
      </div>
    </CanonicalDecisionSurface>
  );
};
