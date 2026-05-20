import React, { useState } from 'react';
import './VariantModals.css';

interface SpadesBidModalProps {
  onConfirm: (team1Bid: number, team2Bid: number) => void;
}

export const SpadesBidModal: React.FC<SpadesBidModalProps> = ({ onConfirm }) => {
  const [team1Bid, setTeam1Bid] = useState(4);
  const [team2Bid, setTeam2Bid] = useState(4);

  return (
    <div className="variant-modal-overlay">
      <div className="variant-modal">
        <h2>Spades — Bids</h2>
        <p className="variant-modal-hint">Set team bids (0–13) before the round.</p>
        <label>
          Team 1 (You + Partner)
          <input
            type="number"
            min={0}
            max={13}
            value={team1Bid}
            onChange={(e) => setTeam1Bid(Number(e.target.value))}
          />
        </label>
        <label>
          Team 2
          <input
            type="number"
            min={0}
            max={13}
            value={team2Bid}
            onChange={(e) => setTeam2Bid(Number(e.target.value))}
          />
        </label>
        <button type="button" className="variant-modal-primary" onClick={() => onConfirm(team1Bid, team2Bid)}>
          Start round
        </button>
      </div>
    </div>
  );
};
