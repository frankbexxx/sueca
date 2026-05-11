import React, { useState } from 'react';
import { GameVariant } from '../types/game';
import { getAvailableGames, GameMetadata } from '../constants/gameMetadata';
import { useLanguage } from '../i18n/useLanguage';
import './GameSelector.css';

interface GameSelectorProps {
  selectedGame: GameVariant;
  onSelectGame: (variant: GameVariant) => void;
  disabled?: boolean;
}

export const GameSelector: React.FC<GameSelectorProps> = ({ selectedGame, onSelectGame, disabled }) => {
  const { t } = useLanguage();
  const availableGames = getAvailableGames();

  const handleSelectGame = (variant: GameVariant) => {
    onSelectGame(variant);
  };

  return (
    <div className="game-selector">
      <h2 className="game-selector__title">SUECÂO - {t.menu?.selectGame || 'Select Game'}</h2>
      <div className="game-selector__grid">
        {availableGames.map((game: GameMetadata) => (
          <button
            key={game.variant}
            className={`game-selector__item ${selectedGame === game.variant ? 'game-selector__item--active' : ''} ${
              game.status === 'placeholder' ? 'game-selector__item--placeholder' : ''
            }`}
            onClick={() => handleSelectGame(game.variant)}
            disabled={disabled}
            title={game.description}
          >
            <div className="game-selector__name">{game.name}</div>
            <div className="game-selector__status">{game.status === 'placeholder' ? '(Placeholder)' : ''}</div>
            <div className="game-selector__description">{game.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
