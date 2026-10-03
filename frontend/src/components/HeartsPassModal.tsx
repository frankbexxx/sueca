import React from 'react';
import { useLanguage } from '../i18n/useLanguage';
import { passTargetIndex, PassDirection } from './HeartsRulesHelper';
import { CanonicalDecisionSurface } from './CanonicalDecisionSurface';
import './VariantModals.css';

interface HeartsPassModalProps {
  passDirection: string;
  playerNames: string[];
  localPlayerIndex: number;
  selectedCount: number;
  onConfirm: () => void;
}

export const HeartsPassModal: React.FC<HeartsPassModalProps> = ({
  passDirection,
  playerNames,
  localPlayerIndex,
  selectedCount,
  onConfirm
}) => {
  const { t } = useLanguage();
  const direction = passDirection as PassDirection;
  if (direction === 'hold') return null;

  const directionLine =
    direction === 'right'
      ? t.heartsPass.directionRight
      : direction === 'across'
        ? t.heartsPass.directionAcross
        : t.heartsPass.directionLeft;
  const targetIndex = passTargetIndex(localPlayerIndex, direction);
  const targetName = playerNames[targetIndex] ?? '';
  const ready = selectedCount === 3;

  const panel = (
    <div
      className="variant-modal variant-modal--bottom-sheet variant-modal--hearts-pass shell-panel"
      data-testid="hearts-pass-surface"
      role="region"
      aria-label={t.heartsPass.title}
    >
      <h2 className="hearts-pass-title">{t.heartsPass.title}</h2>
      <p className="hearts-pass-direction">
        {targetName ? t.heartsPass.directionTo(directionLine, targetName) : directionLine}
      </p>
      <p className="hearts-pass-count" aria-live="polite">
        {t.heartsPass.selectedCount(selectedCount)}
      </p>
      <button
        type="button"
        className="sueca-btn sueca-btn--primary sueca-btn--block sueca-btn--compact hearts-pass-confirm"
        disabled={!ready}
        aria-disabled={!ready}
        onClick={onConfirm}
      >
        {t.heartsPass.confirm}
      </button>
    </div>
  );

  return (
    <CanonicalDecisionSurface zone="decisionSheetRect" align="end">
      {panel}
    </CanonicalDecisionSurface>
  );
};

/** Shown only while the existing pass-exchange beat is locked. */
export const HeartsPassReceipt: React.FC = () => {
  const { t } = useLanguage();
  return (
    <CanonicalDecisionSurface zone="decisionSheetRect" align="end">
      <p
        className="hearts-pass-receipt shell-panel"
        role="status"
        data-testid="hearts-pass-receipt"
      >
        {t.heartsPass.received}
      </p>
    </CanonicalDecisionSurface>
  );
};
