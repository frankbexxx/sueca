import React from 'react';
import { AppTab, PRIMARY_TABS } from '../../types/navigation';
import './BottomNav.css';

interface BottomNavProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

const LABELS: Record<AppTab, string> = {
  home: 'Home',
  activity: 'Actividade',
  personalize: 'Personalizar',
  more: 'Mais'
};

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChange }) => {
  return (
    <nav className="bottom-nav bottom-nav--labelled" aria-label="Navegação principal">
      {PRIMARY_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`bottom-nav-item ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onChange(tab)}
          aria-current={activeTab === tab ? 'page' : undefined}
          aria-label={LABELS[tab]}
        >
          <span className="bottom-nav-label">{LABELS[tab]}</span>
        </button>
      ))}
    </nav>
  );
};
