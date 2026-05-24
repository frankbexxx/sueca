import React from 'react';
import { GameVariant } from '../types/game';
import { getDefaultPresetId, getPreset, resolvePresetId, RulesPresetId } from '../constants/rulesPresets';
import { KING_PT_RULES_SECTIONS } from '../constants/kingRulesContent';
import { useLanguage } from '../i18n/useLanguage';
import './RulesSheet.css';

interface RulesSheetProps {
  variant: GameVariant;
  presetId?: RulesPresetId;
  onClose: () => void;
}

export const RulesSheet: React.FC<RulesSheetProps> = ({ variant, presetId, onClose }) => {
  const { language } = useLanguage();
  const resolvedId = resolvePresetId(variant, presetId ?? getDefaultPresetId(variant));
  const resolved = getPreset(resolvedId);
  const title = language === 'pt' ? resolved.namePt : resolved.name;
  const bullets = language === 'pt' ? resolved.bulletsPt : resolved.bullets;
  const isKingPt = resolvedId === 'king-pt-normal';

  return (
    <div className="rules-sheet-overlay" onClick={onClose} role="presentation">
      <div
        className="rules-sheet dobo-panel rules-sheet-scroll"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="rules-title"
      >
        <h2 id="rules-title">{title}</h2>
        {isKingPt ? (
          <div className="king-rules-sections">
            {KING_PT_RULES_SECTIONS.map((section) => (
              <section key={section.title} className="king-rules-section">
                <h3>{language === 'pt' ? section.title : section.titleEn}</h3>
                <ul>
                  {(language === 'pt' ? section.body : section.bodyEn).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul>
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        <button type="button" className="rules-sheet-close dobo-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
