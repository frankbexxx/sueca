import React from 'react';
import { ShellHeader } from '../navigation/ShellHeader';
import { ShellHubList } from '../navigation/ShellHubList';
import '../../styles/shell-screens.css';

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
    <div className="shell-screen screen-personalize">
      <ShellHeader
        title="Personalizar"
        subtitle="Tema, mão e cartas, áudio"
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
            id: 'audio',
            label: 'Música e som',
            hint: 'Música, SFX e idioma',
            onClick: onOpenAudio
          },
          {
            id: 'hand',
            label: 'Mão e Cartas',
            hint: 'Ordem de naipes, baralho e verso',
            onClick: onOpenHand
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
  onOpenDiagnostic: () => void;
}

export const MoreHubScreen: React.FC<MoreHubScreenProps> = ({
  showBack,
  onBack,
  onOpenOnline,
  onOpenRules,
  onOpenSettings,
  onOpenProfile,
  onOpenDiagnostic
}) => {
  return (
    <div className="shell-screen screen-more-hub">
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
            id: 'diagnostic',
            label: 'Exportar dados de diagnóstico',
            hint: 'Logs técnicos para análise (não é o histórico)',
            onClick: onOpenDiagnostic
          }
        ]}
      />
    </div>
  );
};
