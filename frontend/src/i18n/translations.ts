/**
 * Translation strings for bilingual support (PT/EN)
 */

export type Language = 'pt' | 'en';

export interface Translations {
  // Landing Page
  landing: {
    title: string;
    subtitle: string;
    description: string;
    metaPlayers: string;
    metaTeams: string;
    metaCards: string;
    metaGames: string;
    tapHint: string;
    credits: string;
    copyright: string;
  };
  
  // Start Menu
  startMenu: {
    title: string;
    playerNames: string;
    playerPlaceholder: (index: number) => string;
    aiDifficulty: string;
    difficultyEasy: string;
    difficultyMedium: string;
    difficultyHard: string;
    difficultyDescEasy: string;
    difficultyDescMedium: string;
    difficultyDescHard: string;
    dealingMethod: string;
    methodA: string;
    methodB: string;
    startGame: string;
    advancedSettings: string;
    darkMode: string;
    errorPlayer1Required: string;
    errorStartingGame: string;
  };
  
  // Game Board
  gameBoard: {
    us: string;
    them: string;
    points: string;
    games: string;
    game: string;
    dealing: string;
    continue: string;
    aiExternal: string;
    aiLocal: string;
  };
  
  // Modals (strings with {placeholder} format)
  modals: {
    roundComplete: string; // Use {round}
    gamePoints: string;
    games: string;
    totalVictories: string;
    continueToGame: string; // Use {nextRound}
    gameReady: string; // Use {round}
    trumpSuit: string;
    trumpNote: string;
    dealer: string;
    startGame: string;
    gamesComplete: string;
    won: string;
    finalGames: string;
    dealingMethodNext: string;
    newGame: string;
  };
  
  // Game Menu
  gameMenu: {
    title: string;
    pause: string;
    resume: string;
    quit: string;
    newGame: string;
    settings: string;
    player: string;
    playerNames: string;
    aiDifficulty: string;
    dealingMethod: string;
    showGrid: string;
    darkMode: string;
    credits: string;
    quitConfirm: string;
    difficultyChangeNote: string;
    active: string;
    inactive: string;
    save: string;
    cancel: string;
    gameOver: string;
    gameControls: string;
    thanks: string;
  };
  
  // Credits Modal
  credits: {
    title: string;
    subtitle: string;
    description: string;
    metaPlayers: string;
    metaTeams: string;
    metaCards: string;
    metaGames: string;
    imagePlaceholderLabel: string;
    imagePlaceholderFormat: string;
    acknowledgmentsTitle: string;
    acknowledgmentsText: string;
    copyright: string;
    close: string;
    imageAlt: string;
  };
  
  // Pente Visualization
  pente: {
    totalVictories: string;
    gamesComplete: (count: number) => string;
  };
  
  // Accessibility labels
  aria: {
    playerNameInput: (index: number) => string;
    closeButton: string;
  };
}

export const translations: Record<Language, Translations> = {
  pt: {
    landing: {
      title: 'SUECÃO',
      subtitle: 'Um jogo de Sueca',
      description: 'Versão digital do clássico jogo de cartas português, pensada para jogar a solo contra a IA ou em modo cooperativo com amigos ao redor da mesa.',
      metaPlayers: '4 JOGADORES',
      metaTeams: '2 equipas',
      metaCards: '40 cartas',
      metaGames: '4 jogos',
      tapHint: 'toque ou clique para começar a jogar',
      credits: 'Obrigado ao Cursor, ao Buga, ao Tico, à Maria Francisca e à Maria João.',
      copyright: '© 2025 Todos os direitos reservados.'
    },
    startMenu: {
      title: '🃏 Sueca',
      playerNames: 'Nomes dos Jogadores:',
      playerPlaceholder: (index) => `Player ${index + 1}${index === 0 ? ' *' : ''}`,
      aiDifficulty: 'Dificuldade da IA:',
      difficultyEasy: 'Fácil',
      difficultyMedium: 'Médio',
      difficultyHard: 'Difícil',
      difficultyDescEasy: 'AI joga mais aleatoriamente',
      difficultyDescMedium: 'AI usa estratégia básica',
      difficultyDescHard: 'AI usa estratégia avançada com coordenação',
      dealingMethod: 'Método de Distribuição:',
      methodA: 'Método A (Standard)',
      methodB: 'Método B (Dealer First)',
      startGame: 'Iniciar Jogo',
      advancedSettings: 'Configurações Avançadas',
      darkMode: 'Modo Escuro',
      errorPlayer1Required: 'Por favor, insira um nome para o Player 1',
      errorStartingGame: 'Erro ao iniciar o jogo. Por favor, tente novamente.'
    },
    gameBoard: {
      us: 'NÓS',
      them: 'ELES',
      points: 'Pontos:',
      games: 'Jogos:',
      game: 'Jogo',
      dealing: 'Dar Cartas',
      continue: 'Continuar',
      aiExternal: 'AI Externa (Render)',
      aiLocal: 'AI Local (fallback)'
    },
    modals: {
      roundComplete: 'Jogo {round} Completo!',
      gamePoints: 'Pontos do Jogo:',
      games: 'Jogos:',
      totalVictories: 'Total de Vitórias:',
      continueToGame: 'Continuar para Jogo {nextRound}',
      gameReady: 'Jogo {round} Pronto!',
      trumpSuit: 'Carta de Trunfo',
      trumpNote: 'Esta carta de trunfo permanecerá visível durante todo o jogo',
      dealer: 'Distribuidor',
      startGame: 'Iniciar Jogo',
      gamesComplete: '🎉 Jogos Completos! 🎉',
      won: 'Venceu!',
      finalGames: 'Jogos Finais:',
      dealingMethodNext: 'Método de Distribuição para o Próximo Jogo:',
      newGame: 'Novo Jogo'
    },
    gameMenu: {
      title: '🃏 Sueca',
      pause: 'Pausar',
      resume: 'Retomar',
      quit: 'Sair',
      newGame: 'Novo Jogo',
      settings: 'Configurações',
      player: 'Jogador:',
      playerNames: 'Nome dos Jogadores:',
      aiDifficulty: 'Dificuldade da AI:',
      dealingMethod: 'Método de Distribuição:',
      showGrid: 'Mostrar grelha (debug)',
      darkMode: 'Modo Escuro',
      credits: 'Créditos',
      quitConfirm: 'Tem certeza que deseja sair do jogo atual?',
      difficultyChangeNote: '⚠️ Alterar dificuldade e método apenas no menu inicial',
      active: 'Ativo',
      inactive: 'Inativo',
      save: 'Guardar',
      cancel: 'Cancelar',
      gameOver: 'Jogo Terminado',
      gameControls: 'Controles do Jogo:',
      thanks: '🙏 Agradecimentos'
    },
    credits: {
      title: 'SUECÃO',
      subtitle: 'Um jogo de Sueca',
      description: 'Versão digital do clássico jogo de cartas português, pensada para jogar a solo contra a IA ou em modo cooperativo com amigos ao redor da mesa.',
      metaPlayers: '4 JOGADORES',
      metaTeams: '2 equipas',
      metaCards: '40 cartas',
      metaGames: '4 jogos',
      imagePlaceholderLabel: 'capa / animação',
      imagePlaceholderFormat: 'jpg · png · gif',
      acknowledgmentsTitle: 'Agradecimentos',
      acknowledgmentsText: 'Obrigado ao Cursor, ao Buga, ao Tico, à Maria Francisca e à Maria João.',
      copyright: '© 2025 Todos os direitos reservados.',
      close: 'Fechar',
      imageAlt: 'SUECÃO - Capa do Jogo'
    },
    pente: {
      totalVictories: 'Total de Vitórias:',
      gamesComplete: (count) => `${count} jogo${count > 1 ? 's' : ''} completo${count > 1 ? 's' : ''}`
    },
    aria: {
      playerNameInput: (index) => `Nome do jogador ${index + 1}`,
      closeButton: 'Fechar'
    }
  },
  en: {
    landing: {
      title: 'SUECÃO',
      subtitle: 'A Sueca Game',
      description: 'Digital version of the classic Portuguese card game, designed to play solo against AI or cooperatively with friends around the table.',
      metaPlayers: '4 PLAYERS',
      metaTeams: '2 teams',
      metaCards: '40 cards',
      metaGames: '4 games',
      tapHint: 'tap or click to start playing',
      credits: 'Thanks to Cursor, Buga, Tico, Maria Francisca and Maria João.',
      copyright: '© 2025 All rights reserved.'
    },
    startMenu: {
      title: '🃏 Sueca',
      playerNames: 'Player Names:',
      playerPlaceholder: (index) => `Player ${index + 1}${index === 0 ? ' *' : ''}`,
      aiDifficulty: 'AI Difficulty:',
      difficultyEasy: 'Easy',
      difficultyMedium: 'Medium',
      difficultyHard: 'Hard',
      difficultyDescEasy: 'AI plays more randomly',
      difficultyDescMedium: 'AI uses basic strategy',
      difficultyDescHard: 'AI uses advanced strategy with coordination',
      dealingMethod: 'Dealing Method:',
      methodA: 'Method A (Standard)',
      methodB: 'Method B (Dealer First)',
      startGame: 'Start Game',
      advancedSettings: 'Advanced Settings',
      darkMode: 'Dark Mode',
      errorPlayer1Required: 'Please enter a name for Player 1',
      errorStartingGame: 'Error starting game. Please try again.'
    },
    gameBoard: {
      us: 'US',
      them: 'THEM',
      points: 'Points:',
      games: 'Games:',
      game: 'Game',
      dealing: 'Dealing:',
      continue: 'Continue',
      aiExternal: 'External AI (Render)',
      aiLocal: 'Local AI (fallback)'
    },
    modals: {
      roundComplete: 'Game {round} Complete!',
      gamePoints: 'Game Points:',
      games: 'Games:',
      totalVictories: 'Total Victories:',
      continueToGame: 'Continue to Game {nextRound}',
      gameReady: 'Game {round} Ready!',
      trumpSuit: 'Trump Suit:',
      trumpNote: 'This trump suit will remain visible throughout the game',
      dealer: 'Dealer:',
      startGame: 'Start Game',
      gamesComplete: '🎉 Games Complete! 🎉',
      won: 'Won!',
      finalGames: 'Final Games:',
      dealingMethodNext: 'Dealing Method for Next Game:',
      newGame: 'Start New Game'
    },
    gameMenu: {
      title: '🃏 Sueca',
      pause: 'Pause',
      resume: 'Resume',
      quit: 'Quit',
      newGame: 'New Game',
      settings: 'Settings',
      player: 'Player:',
      playerNames: 'Player Names:',
      aiDifficulty: 'AI Difficulty:',
      dealingMethod: 'Dealing Method:',
      showGrid: 'Show grid (debug)',
      darkMode: 'Dark Mode',
      credits: 'Credits',
      quitConfirm: 'Are you sure you want to quit the current game?',
      difficultyChangeNote: '⚠️ Change difficulty and method only in the initial menu',
      active: 'Active',
      inactive: 'Inactive',
      save: 'Save',
      cancel: 'Cancel',
      gameOver: 'Game Over',
      gameControls: 'Game Controls:',
      thanks: '🙏 Thanks'
    },
    credits: {
      title: 'SUECÃO',
      subtitle: 'A Sueca Game',
      description: 'Digital version of the classic Portuguese card game, designed to play solo against AI or cooperatively with friends around the table.',
      metaPlayers: '4 PLAYERS',
      metaTeams: '2 teams',
      metaCards: '40 cards',
      metaGames: '4 games',
      imagePlaceholderLabel: 'cover / animation',
      imagePlaceholderFormat: 'jpg · png · gif',
      acknowledgmentsTitle: 'Acknowledgments',
      acknowledgmentsText: 'Thanks to Cursor, Buga, Tico, Maria Francisca and Maria João.',
      copyright: '© 2025 All rights reserved.',
      close: 'Close',
      imageAlt: 'SUECÃO - Game Cover'
    },
    pente: {
      totalVictories: 'Total Victories:',
      gamesComplete: (count) => `${count} game${count > 1 ? 's' : ''} complete`
    },
    aria: {
      playerNameInput: (index) => `Player ${index + 1} name`,
      closeButton: 'Close'
    }
  }
};
