import React from 'react';
import { GameVariant } from '../types/game';
import './RulesSheet.css';

const RULES: Record<GameVariant, { title: string; bullets: string[] }> = {
  sueca: {
    title: 'Sueca',
    bullets: [
      '4 players, 2 teams. 40-card deck.',
      'Follow suit; trump wins if you cannot follow.',
      'First team to 4 games (120+ points per game) wins the match.'
    ]
  },
  spades: {
    title: 'Spades',
    bullets: [
      'Bid tricks per team before each round.',
      'Spades are always trump. Follow suit when possible.',
      'Score to 500; bags penalize overtricks.'
    ]
  },
  hearts: {
    title: 'Hearts',
    bullets: [
      'Avoid hearts (1 pt) and Queen of Spades (13 pts).',
      'Pass 3 cards each round (left / right / across).',
      'Lowest total score wins; shoot the moon reverses scoring.'
    ]
  },
  king: {
    title: 'King (simplified)',
    bullets: [
      '10 hands: 6 negative, 4 positive.',
      'Negative: avoid winning tricks. Positive: win tricks.',
      'Rotating trump. See docs/rules/king-simplified.md.'
    ]
  }
};

interface RulesSheetProps {
  variant: GameVariant;
  onClose: () => void;
}

export const RulesSheet: React.FC<RulesSheetProps> = ({ variant, onClose }) => {
  const rule = RULES[variant];
  return (
    <div className="rules-sheet-overlay" onClick={onClose} role="presentation">
      <div className="rules-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="rules-title">
        <h2 id="rules-title">{rule.title}</h2>
        <ul>
          {rule.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <button type="button" className="rules-sheet-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
