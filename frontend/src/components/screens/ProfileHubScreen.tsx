import React, { useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { FEEDBACK_ISSUE_URL } from '../../constants/feedback';
import { exitAppToLanding } from '../../services/appLifecycle';
import { ShellHeader } from '../navigation/ShellHeader';
import { ShellHubList } from '../navigation/ShellHubList';
import { ConfirmDialog } from '../common/ConfirmDialog';
import '../../styles/shell-screens.css';
import './MoreScreen.css';

interface ProfileHubScreenProps {
  showBack: boolean;
  onBack: () => void;
  onOpenSection: (section: 'name' | 'credits') => void;
}

export const ProfileHubScreen: React.FC<ProfileHubScreenProps> = ({
  showBack,
  onBack,
  onOpenSection
}) => {
  const { t } = useLanguage();
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  const handleExitApp = () => {
    setExitConfirmOpen(true);
  };

  const confirmExitApp = () => {
    setExitConfirmOpen(false);
    exitAppToLanding();
  };

  return (
    <div className="shell-screen screen-profile">
      <ShellHeader
        title={t.profileScreen.title}
        subtitle={t.profileScreen.subtitle}
        showBack={showBack}
        onBack={onBack}
      />
      <ShellHubList
        items={[
          {
            id: 'name',
            label: t.profileScreen.hubName,
            hint: t.profileScreen.hubNameHint,
            onClick: () => onOpenSection('name')
          },
          {
            id: 'credits',
            label: t.moreScreen.credits,
            hint: t.profileScreen.hubCreditsHint,
            onClick: () => onOpenSection('credits')
          }
        ]}
      />
      <section className="shell-panel">
        <a
          href={FEEDBACK_ISSUE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sueca-btn sueca-btn--ghost sueca-btn--block more-feedback-link"
        >
          {t.profileScreen.feedback}
        </a>
      </section>
      <section className="shell-panel">
        <button
          type="button"
          className="sueca-btn sueca-btn--danger sueca-btn--block"
          onClick={handleExitApp}
          data-testid="profile-exit-app"
        >
          {t.profileScreen.exitApp}
        </button>
      </section>
      <ConfirmDialog
        open={exitConfirmOpen}
        title={t.profileScreen.exitApp}
        message={t.profileScreen.exitConfirm}
        confirmLabel={t.profileScreen.exitApp}
        cancelLabel={t.gameMenu.cancel}
        destructive
        onConfirm={confirmExitApp}
        onCancel={() => setExitConfirmOpen(false)}
      />
    </div>
  );
};
