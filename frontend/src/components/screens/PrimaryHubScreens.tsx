import React from 'react';
import { ShellHeader } from '../navigation/ShellHeader';
import { ShellHubList } from '../navigation/ShellHubList';
import { formatAppBuildLabel } from '../../config/appBuildInfo';
import { useLanguage } from '../../i18n/useLanguage';
import '../../styles/shell-screens.css';
import './MoreScreen.css';

interface ActivityHubScreenProps {
  showBack: boolean;
  onBack: () => void;
  onOpenStats: () => void;
  onOpenHistory: () => void;
}

export const ActivityHubScreen: React.FC<ActivityHubScreenProps> = ({
  showBack,
  onBack,
  onOpenStats,
  onOpenHistory
}) => {
  return (
    <div className="shell-screen screen-activity">
      <ShellHeader
        title="Actividade"
        subtitle="Histórico e estatísticas"
        showBack={showBack}
        onBack={onBack}
      />
      <ShellHubList
        items={[
          {
            id: 'history',
            label: 'Histórico',
            hint: 'Continuar, fixadas e partidas terminadas',
            onClick: onOpenHistory
          },
          {
            id: 'stats',
            label: 'Estatísticas',
            hint: 'Totais e resultados por jogo',
            onClick: onOpenStats
          }
        ]}
      />
    </div>
  );
};

interface PersonalizeHubScreenProps {
  showBack: boolean;
  onBack: () => void;
  onOpenThemes: () => void;
  onOpenAudio: () => void;
  onOpenHand: () => void;
}

export const PersonalizeHubScreen: React.FC<PersonalizeHubScreenProps> = ({
  showBack,
  onBack,
  onOpenThemes,
  onOpenAudio,
  onOpenHand
}) => {
  return (
    <div className="shell-screen screen-personalize" data-testid="personalize-hub-screen">
      <ShellHeader
        title="Personalizar"
        subtitle="Temas, mão e cartas, música e som"
        showBack={showBack}
        onBack={onBack}
      />
      <ShellHubList
        items={[
          {
            id: 'themes',
            label: 'Temas',
            hint: 'Aparência da mesa e do ambiente',
            onClick: onOpenThemes
          },
          {
            id: 'hand',
            label: 'Mão e Cartas',
            hint: 'Ordem de naipes, baralho e verso',
            onClick: onOpenHand
          },
          {
            id: 'audio',
            label: 'Música e Som',
            hint: 'Música e efeitos sonoros',
            onClick: onOpenAudio
          }
        ]}
      />
    </div>
  );
};

interface MoreHubScreenProps {
  showBack: boolean;
  onBack: () => void;
  onOpenOnline: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAccount: () => void;
  onOpenDiagnostic: () => void;
}

export const MoreHubScreen: React.FC<MoreHubScreenProps> = ({
  showBack,
  onBack,
  onOpenOnline,
  onOpenRules,
  onOpenSettings,
  onOpenProfile,
  onOpenAccount,
  onOpenDiagnostic
}) => {
  const { language } = useLanguage();
  const buildLabel = formatAppBuildLabel(language === 'en' ? 'en' : 'pt');

  return (
    <div className="shell-screen screen-more-hub" data-testid="more-hub-screen">
      <ShellHeader
        title="Mais"
        subtitle="Online, regras, definições e perfil"
        showBack={showBack}
        onBack={onBack}
      />
      <ShellHubList
        items={[
          {
            id: 'online',
            label: 'Online',
            hint: 'Sessões multijogador',
            onClick: onOpenOnline
          },
          {
            id: 'rules',
            label: 'Regras',
            hint: 'Regras por jogo',
            onClick: onOpenRules
          },
          {
            id: 'settings',
            label: 'Definições',
            hint: 'Geral e mão',
            onClick: onOpenSettings
          },
          {
            id: 'profile',
            label: 'Perfil',
            hint: 'Nome, créditos e sair',
            onClick: onOpenProfile
          },
          {
            id: 'account',
            label: 'Conta',
            hint: 'Conta Google opcional',
            onClick: onOpenAccount
          },
          {
            id: 'diagnostic',
            label: 'Exportar dados de diagnóstico',
            hint: 'Logs técnicos para análise (não é o histórico)',
            onClick: onOpenDiagnostic
          }
        ]}
      />
      <p className="more-build-meta" data-testid="more-build-meta">
        {buildLabel}
      </p>
    </div>
  );
};
