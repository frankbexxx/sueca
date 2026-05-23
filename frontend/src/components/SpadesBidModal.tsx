import React, { useState } from 'react';
import './VariantModals.css';

interface SpadesBidModalProps {
  playerNames: string[];
  onConfirm: (playerBids: number[]) => void;
}

export const SpadesBidModal: React.FC<SpadesBidModalProps> = ({ playerNames, onConfirm }) => {
  const [bids, setBids] = useState<number[]>([4, 4, 4, 4]);

  const setBid = (index: number, value: number) => {
    setBids((prev) => {
      const next = [...prev];
      next[index] = Math.max(0, Math.min(13, value));
      return next;
    });
  };

  const team1 = bids[0] + bids[2];
  const team2 = bids[1] + bids[3];

  return (
    <div className="variant-modal-overlay">
      <div className="variant-modal dobo-panel">
        <h2>Spades — Bids</h2>
        <p className="variant-modal-hint">Individual bids (0–13) summed per team.</p>
        {playerNames.map((name, index) => (
          <label key={name}>
            {name}
            <input
              type="number"
              min={0}
              max={13}
              value={bids[index]}
              onChange={(e) => setBid(index, Number(e.target.value))}
            />
          </label>
        ))}
        <p className="variant-modal-hint">
          Team totals: {team1} vs {team2}
        </p>
        <button
          type="button"
          className="variant-modal-primary dobo-btn"
          onClick={() => onConfirm(bids)}
        >
          Start round
        </button>
      </div>
    </div>
  );
};
