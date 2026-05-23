import React from 'react';
import { KingFestaChoice } from '../models/games/king/kingContracts';
import './VariantModals.css';

interface KingFestaModalProps {
  ownerName: string;
  onChoose: (choice: KingFestaChoice) => void;
}

export const KingFestaModal: React.FC<KingFestaModalProps> = ({ ownerName, onChoose }) => (
  <div className="variant-modal-overlay">
    <div className="variant-modal dobo-panel">
      <h2>Festa — {ownerName}</h2>
      <p className="variant-modal-hint">Escolhe como jogar a tua festa.</p>
      <div className="king-festa-actions">
        <button type="button" className="variant-modal-primary dobo-btn" onClick={() => onChoose('trump')}>
          Trunfo
        </button>
        <button type="button" className="dobo-btn" onClick={() => onChoose('no_trump')}>
          Sem trunfo
        </button>
        <button type="button" className="dobo-btn" onClick={() => onChoose('nulos')}>
          Nulos (negativa)
        </button>
        <button type="button" className="dobo-btn" onClick={() => onChoose('four_by_three')}>
          4×3×3
        </button>
        <button type="button" className="dobo-btn" onClick={() => onChoose('auction')}>
          Leilão
        </button>
      </div>
    </div>
  </div>
);
