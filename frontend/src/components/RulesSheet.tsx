import React from 'react';
import { GameVariant } from '../types/game';
import { getDefaultPresetId, getPreset, resolvePresetId, RulesPresetId } from '../constants/rulesPresets';
import { useLanguage } from '../i18n/useLanguage';
import './RulesSheet.css';

interface RulesSheetProps {
  variant: GameVariant;
  presetId?: RulesPresetId;
  onClose: () => void;
}

export const RulesSheet: React.FC<RulesSheetProps> = ({ variant, presetId, onClose }) => {
  const { language } = useLanguage();
  const resolved = getPreset(resolvePresetId(variant, presetId ?? getDefaultPresetId(variant)));
  const title = language === 'pt' ? resolved.namePt : resolved.name;
  const bullets = language === 'pt' ? resolved.bulletsPt : resolved.bullets;

  return (
    <div className="rules-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="rules-sheet dobo-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="rules-title"
      >
        <h2 id="rules-title">{title}</h2>
        <ul>
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <p className="rules-sheet-note">
          {language === 'pt' ? 'Variantes regionais em breve.' : 'Regional variants coming soon.'}
        </p>
        <button type="button" className="rules-sheet-close dobo-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
