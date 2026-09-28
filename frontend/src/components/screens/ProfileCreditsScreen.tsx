import React from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { ShellHeader } from '../navigation/ShellHeader';
import { CreditsBody } from '../CreditsBody';
import '../../styles/shell-screens.css';
import '../CreditsModal.css';

interface ProfileCreditsScreenProps {
  showBack: boolean;
  onBack: () => void;
}

export const ProfileCreditsScreen: React.FC<ProfileCreditsScreenProps> = ({
  showBack,
  onBack
}) => {
  const { t } = useLanguage();

  return (
    <div
      className="shell-screen screen-profile-credits"
      data-testid="profile-credits-screen"
    >
      <ShellHeader title={t.moreScreen.credits} showBack={showBack} onBack={onBack} />
      <div className="credits-inline shell-panel">
        <CreditsBody titleAs="h2" />
      </div>
    </div>
  );
};
