import React from 'react';
import { useLanguage } from '../i18n/useLanguage';
import {
  passDirectionLabel,
  passSourceIndex,
  passTargetIndex,
  PassDirection
} from './HeartsRulesHelper';
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
  const { language, t } = useLanguage();
  const locale = language === 'pt' ? 'pt' : 'en';
  const direction = passDirection as PassDirection;
  const ready = direction === 'hold' ? true : selectedCount === 3;
  const targetIndex = passTargetIndex(localPlayerIndex, direction);
  const sourceIndex = passSourceIndex(localPlayerIndex, direction);
  const targetName = playerNames[targetIndex] ?? `Player ${targetIndex + 1}`;
  const sourceName = playerNames[sourceIndex] ?? `Player ${sourceIndex + 1}`;

  return (
    <div className="variant-modal-overlay variant-modal-overlay--bottom-sheet variant-modal-overlay--hearts-pass">
      <div className="variant-modal variant-modal--bottom-sheet variant-modal--hearts-pass shell-panel">
        <h2 className="hearts-pass-title">{t.heartsPass.title}</h2>
        {direction === 'hold' ? (
          <p className="hearts-pass-hint">{t.heartsPass.holdRound}</p>
        ) : (
          <>
            <p className="hearts-pass-hint hearts-pass-hint--primary">
              {t.heartsPass.passToPlayer(
                targetName,
                passDirectionLabel(direction, locale)
              )}
            </p>
            <p className="hearts-pass-hint">
              {t.heartsPass.receiveFromPlayer(sourceName)} · {t.heartsPass.selectOnHand}
            </p>
          </>
        )}
        <button
          type="button"
          className="sueca-btn sueca-btn--primary sueca-btn--block sueca-btn--compact"
          disabled={!ready}
          onClick={onConfirm}
        >
          {direction === 'hold'
            ? t.heartsPass.confirmHold
            : t.heartsPass.confirm(selectedCount)}
        </button>
      </div>
    </div>
  );
};
