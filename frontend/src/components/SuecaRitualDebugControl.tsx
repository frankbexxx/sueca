import React from 'react';
import {
  formatSuecaRitualDebugLabel,
  ritualDebugContinueEnabled,
  type SuecaRitualDebugPhase
} from '../dev/suecaRitualDebug';
import './SuecaRitualDebugControl.css';

export interface SuecaRitualDebugControlProps {
  phase: SuecaRitualDebugPhase;
  onContinue: () => void;
}

/** UX-SUECA-08 — compact QA Continuar control (query-param only). */
export const SuecaRitualDebugControl: React.FC<SuecaRitualDebugControlProps> = ({
  phase,
  onContinue
}) => {
  const canContinue = ritualDebugContinueEnabled(phase);
  return (
    <div
      className="sueca-ritual-debug"
      data-testid="sueca-ritual-debug"
      data-debug-phase={phase}
    >
      <span className="sueca-ritual-debug__label" data-testid="sueca-ritual-debug-phase">
        {formatSuecaRitualDebugLabel(phase)}
      </span>
      {canContinue ? (
        <button
          type="button"
          className="sueca-ritual-debug__btn"
          data-testid="sueca-ritual-debug-continue"
          onClick={onContinue}
        >
          Continuar
        </button>
      ) : (
        <span className="sueca-ritual-debug__hint" data-testid="sueca-ritual-debug-choice-hint">
          escolha + Distribuir
        </span>
      )}
    </div>
  );
};
