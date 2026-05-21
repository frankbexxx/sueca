import React from 'react';
import { AppTab } from '../../types/navigation';
import { useLanguage } from '../../i18n/useLanguage';
import './BottomNav.css';

interface BottomNavProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: AppTab[] = ['home', 'play', 'rules', 'more'];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChange }) => {
  const { t } = useLanguage();

  const labels: Record<AppTab, string> = {
    home: t.nav.home,
    play: t.nav.play,
    rules: t.nav.rules,
    more: t.nav.more
  };

  const icons: Record<AppTab, string> = {
    home: '🏠',
    play: '🃏',
    rules: '📖',
    more: '⚙️'
  };

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`bottom-nav-item ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onChange(tab)}
          aria-current={activeTab === tab ? 'page' : undefined}
        >
          <span className="bottom-nav-icon" aria-hidden>
            {icons[tab]}
          </span>
          <span className="bottom-nav-label">{labels[tab]}</span>
        </button>
      ))}
    </nav>
  );
};
