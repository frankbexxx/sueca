import React from 'react';
import { GameVariant } from '../../types/game';
import { getAvailableGames } from '../../constants/gameMetadata';
import { useLanguage } from '../../i18n/useLanguage';
import { ShellHeader } from '../navigation/ShellHeader';
import { ShellHubList } from '../navigation/ShellHubList';
import '../../styles/shell-screens.css';
import './RulesHub.css';

interface RulesHubScreenProps {
  showBack: boolean;
  onBack: () => void;
  onOpenGame: (variant: GameVariant) => void;
}

export const RulesHubScreen: React.FC<RulesHubScreenProps> = ({
  showBack,
  onBack,
  onOpenGame
}) => {
  const { t } = useLanguage();
  const games = getAvailableGames();

  return (
    <div className="shell-screen screen-rules">
      <ShellHeader
        title={t.rulesHub.title}
        subtitle={t.rulesHub.subtitle}
        showBack={showBack}
        onBack={onBack}
      />
      <ShellHubList
        items={games.map((game) => ({
          id: game.variant,
          label: game.name,
          hint: t.rulesHub.openRules,
          onClick: () => onOpenGame(game.variant)
        }))}
      />
    </div>
  );
};
