import React from 'react';
import { GameVariant } from '../../types/game';
import { getAvailableGames } from '../../constants/gameMetadata';
import { useLanguage } from '../../i18n/useLanguage';
import { ShellHeader } from '../navigation/ShellHeader';
import { RulesContent } from '../RulesContent';

interface RulesDetailScreenProps {
  variant: GameVariant;
  showBack: boolean;
  onBack: () => void;
}

export const RulesDetailScreen: React.FC<RulesDetailScreenProps> = ({
  variant,
  showBack,
  onBack
}) => {
  const { t } = useLanguage();
  const gameName =
    getAvailableGames().find((g) => g.variant === variant)?.name ?? variant;

  return (
    <div className="shell-screen screen-rules-detail">
      <ShellHeader
        title={t.rulesHub.detailTitle(gameName)}
        showBack={showBack}
        onBack={onBack}
      />
      <RulesContent variant={variant} />
    </div>
  );
};
