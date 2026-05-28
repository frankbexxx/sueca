import React from 'react';
import { AppTab } from '../../types/navigation';
import { useLanguage } from '../../i18n/useLanguage';
import './BottomNav.css';

interface BottomNavProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: AppTab[] = [
  'home',
  'stats',
  'history',
  'themes',
  'rules',
  'settings',
  'profile'
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChange }) => {
  const { t } = useLanguage();

  const labels: Record<AppTab, string> = {
    home: t.nav.home,
    stats: t.nav.stats,
    history: t.nav.history,
    themes: t.nav.themes,
    rules: t.nav.rules,
    settings: t.nav.settings,
    profile: t.nav.profile
  };

  const icons: Record<AppTab, string> = {
    home: '🏠',
    stats: '📊',
    history: '🕘',
    themes: '🎨',
    rules: '📖',
    settings: '⚙',
    profile: '👤'
  };

  return (
    <nav className="bottom-nav bottom-nav--compact" aria-label="Main navigation">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`bottom-nav-item ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onChange(tab)}
          aria-current={activeTab === tab ? 'page' : undefined}
          aria-label={labels[tab]}
          title={labels[tab]}
          data-tooltip={labels[tab]}
        >
          <span className="bottom-nav-icon" aria-hidden>
            {icons[tab]}
          </span>
        </button>
      ))}
    </nav>
  );
};
