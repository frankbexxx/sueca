import React, { useState } from 'react';
import { GameVariant } from '../../types/game';
import { getAvailableGames } from '../../constants/gameMetadata';
import { getDefaultPresetId } from '../../constants/rulesPresets';
import { RulesSheet } from '../RulesSheet';
import { useLanguage } from '../../i18n/useLanguage';
import './RulesHub.css';

export const RulesHub: React.FC = () => {
  const { t } = useLanguage();
  const games = getAvailableGames();
  const [openVariant, setOpenVariant] = useState<GameVariant | null>(null);

  return (
    <div className="screen-rules">
      <header className="screen-header">
        <h1 className="screen-title">{t.rulesHub.title}</h1>
        <p className="screen-subtitle">{t.rulesHub.subtitle}</p>
      </header>

      <div className="rules-hub-grid">
        {games.map((game) => (
          <button
            key={game.variant}
            type="button"
            className="rules-hub-card dobo-panel"
            onClick={() => setOpenVariant(game.variant)}
          >
            <span className="rules-hub-name">{game.name}</span>
            <span className="rules-hub-action">{t.rulesHub.openRules}</span>
          </button>
        ))}
      </div>

      {openVariant && (
        <RulesSheet
          variant={openVariant}
          presetId={getDefaultPresetId(openVariant)}
          onClose={() => setOpenVariant(null)}
        />
      )}
    </div>
  );
};
