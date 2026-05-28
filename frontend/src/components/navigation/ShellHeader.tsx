import React from 'react';
import { useLanguage } from '../../i18n/useLanguage';

interface ShellHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const ShellHeader: React.FC<ShellHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack
}) => {
  const { t } = useLanguage();

  return (
    <header
      className={`shell-screen-header${showBack ? ' shell-screen-header--row' : ''}`}
    >
      {showBack && onBack && (
        <button
          type="button"
          className="sueca-btn sueca-btn--ghost shell-back-btn"
          onClick={onBack}
        >
          ← {t.shell.back}
        </button>
      )}
      <div>
        <h1 className="screen-title">{title}</h1>
        {subtitle && <p className="screen-subtitle">{subtitle}</p>}
      </div>
    </header>
  );
};
