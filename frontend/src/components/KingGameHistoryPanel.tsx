import React, { useState } from 'react';
import { GameState } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';

interface KingGameHistoryPanelProps {
  gameState: GameState;
}

export const KingGameHistoryPanel: React.FC<KingGameHistoryPanelProps> = ({ gameState }) => {
  const king = getKingPtState(gameState);
  const [open, setOpen] = useState(false);

  if (king.gameHistory.length === 0) return null;

  return (
    <div className="king-history-panel">
      <button type="button" className="king-history-toggle dobo-btn" onClick={() => setOpen(!open)}>
        Histórico ({king.gameHistory.length})
      </button>
      {open && (
        <ul className="king-history-list">
          {king.gameHistory.map((entry) => (
            <li key={entry.gameIndex}>
              <strong>{entry.title}</strong>
              <span>
                {entry.deltas.map((d, i) => (
                  <span key={i} className="king-history-delta">
                    {gameState.players[i]?.name?.slice(0, 3)}: {d >= 0 ? '+' : ''}
                    {d}{' '}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
