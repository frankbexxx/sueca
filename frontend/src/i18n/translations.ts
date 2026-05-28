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
    imageAlt: string;
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
    multiplayerMode: string;
    enableMultiplayer: string;
    createSession: string;
    joinSession: string;
    sessionId: string;
    sessionIdPlaceholder: string;
    errorPlayer1Required: string;
    errorStartingGame: string;
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

  gameBoard: {
    us: string;
    them: string;
    points: string;
    games: string;
    game: string;
    dealing: string;
    continue: string;
    autoPause: string;
    autoPauseHint: string;
    aiExternal: string;
    aiLocal: string;
  };

  heartsPass: {
    title: string;
    passTo: string;
    selectOnHand: string;
    confirm: (count: number) => string;
  };

  menu: {
    selectGame: string;
  };

  nav: {
    home: string;
    play: string;
    rules: string;
    more: string;
  };

  dashboard: {
    greeting: string;
    continueGame: string;
    continueShort: string;
    continueHint: string;
    playNow: string;
    lastGame: string;
    statsTitle: string;
    gamesPlayed: string;
    wins: string;
    noSavedGame: string;
    playLastGame: (game: string) => string;
    chooseGame: string;
    otherGame: string;
    lastPlayed: string;
    lastPlayedNever: string;
    lastPlayedSaved: string;
    savedAgo: (time: string) => string;
    quickPickTitle: string;
    winRate: string;
    viewProfile: string;
    perGameStats: string;
    playedShort: string;
    winsShort: string;
    buildVersion: string;
    playGame: string;
    configureGame: (game: string) => string;
    playSavedConfirm: string;
    playNewConfirm: string;
  };

  playSetup: {
    title: string;
    subtitle: string;
    rulesPreset: string;
  };

  rulesHub: {
    title: string;
    subtitle: string;
    openRules: string;
  };

  moreScreen: {
    title: string;
    settings: string;
    profile: string;
    credits: string;
    playerName: string;
    sound: string;
    language: string;
    editName: string;
    saveName: string;
    handSort: string;
    sortHand: string;
    suitOrder: string;
    trumpPosition: string;
    trumpLeft: string;
    trumpRight: string;
    trumpNatural: string;
    autoPauseTrick: string;
  };

  earlyRoundEnd: {
    title: string;
    body: string;
    accept: string;
    decline: string;
  };

  inGame: {
    exit: string;
    exitConfirm: string;
    newGame: string;
    leaveConfirm: string;
    newGameConfirm: string;
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
    assetsTitle: string;
    assetsCards: string;
    assetsUi: string;
    assetsAudio: string;
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
      subtitle: '4 jogos de cartas',
      description: 'Sueca, Hearts, Spades e King — joga offline contra a IA.',
      metaPlayers: '4 JOGADORES',
      metaTeams: '2 equipas',
      metaCards: 'baralhos variados',
      metaGames: '4 jogos',
      tapHint: 'Entrar',
      credits: 'Obrigado ao Cursor, ao Buga, ao Tico, à Maria Francisca e à Maria João.',
      copyright: '© 2025 Todos os direitos reservados.',
      imageAlt: 'SUECÃO — capa do jogo'
    },
    menu: {
      selectGame: 'Selecionar Jogo'
    },
    nav: {
      home: 'Início',
      play: 'Jogar',
      rules: 'Regras',
      more: 'Mais'
    },
    dashboard: {
      greeting: 'Olá',
      continueGame: 'Continuar partida',
      continueShort: 'Continuar',
      continueHint: 'Retoma a última partida guardada',
      playNow: 'Jogar agora',
      lastGame: 'Último jogo',
      statsTitle: 'Estatísticas',
      gamesPlayed: 'Partidas',
      wins: 'Vitórias',
      noSavedGame: 'Sem partida guardada',
      playLastGame: (game) => `Jogar ${game}`,
      chooseGame: 'Escolher jogo',
      otherGame: 'Outro jogo…',
      lastPlayed: 'Última partida',
      lastPlayedNever: 'Ainda não jogaste',
      lastPlayedSaved: 'Partida guardada',
      savedAgo: (time) => `guardada ${time}`,
      quickPickTitle: 'Jogos',
      winRate: 'Taxa de vitória',
      viewProfile: 'Ver perfil',
      perGameStats: 'Por jogo',
      playedShort: 'J',
      winsShort: 'V',
      buildVersion: 'Versão',
      playGame: 'Jogar',
      configureGame: (game) => `Configurar ${game}`,
      playSavedConfirm: 'Tens uma partida guardada. Continuar?',
      playNewConfirm: 'Começar novo jogo e apagar a partida guardada?'
    },
    playSetup: {
      title: 'Nova partida',
      subtitle: 'Escolhe o jogo e os adversários',
      rulesPreset: 'Modo de regras'
    },
    rulesHub: {
      title: 'Regras',
      subtitle: 'Consulta as regras de cada jogo',
      openRules: 'Ver regras'
    },
    moreScreen: {
      title: 'Mais',
      settings: 'Definições',
      profile: 'Perfil local',
      credits: 'Créditos',
      playerName: 'O teu nome',
      sound: 'Som',
      language: 'Idioma',
      editName: 'Editar nome',
      saveName: 'Guardar',
      handSort: 'Mão',
      sortHand: 'Ordenar mão automaticamente',
      suitOrder: 'Ordem dos naipes',
      trumpPosition: 'Trunfo (Sueca)',
      trumpLeft: 'À esquerda',
      trumpRight: 'À direita',
      trumpNatural: 'No grupo natural',
      autoPauseTrick: 'Pausa auto entre vazas'
    },
    earlyRoundEnd: {
      title: 'Terminar ronda?',
      body: 'As penalizações já estão definidas. Queres terminar a ronda agora? Se recusares, podes continuar a jogar mas os pontos deixam de mudar.',
      accept: 'Terminar ronda',
      decline: 'Continuar a jogar'
    },
    inGame: {
      exit: 'Sair',
      exitConfirm: 'Abandonar a partida actual?',
      newGame: 'Novo jogo',
      leaveConfirm: 'Voltar ao início? A partida fica guardada.',
      newGameConfirm: 'Abandonar a partida actual e começar uma nova?'
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
      multiplayerMode: 'Multiplayer',
      enableMultiplayer: 'Ativar multiplayer',
      createSession: 'Criar nova sessão',
      joinSession: 'Entrar em sessão existente',
      sessionId: 'ID da Sessão',
      sessionIdPlaceholder: 'Digite ou cole o ID da sessão',
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
      autoPause: 'Pausa auto',
      autoPauseHint: 'Quando activo, não avança automaticamente entre vazas',
      aiExternal: 'AI Externa (Render)',
      aiLocal: 'AI Local (fallback)'
    },
    heartsPass: {
      title: 'Copas — passar 3 cartas',
      passTo: 'Passar para:',
      selectOnHand: 'Selecciona 3 cartas na tua mão (cartas coloridas).',
      confirm: (count) => `Passar cartas (${count}/3)`
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
      assetsTitle: 'Assets gráficos',
      assetsCards: 'Cartas: Hand Drawn Playing Cards por Hazmat Game Studios (itch.io).',
      assetsUi: 'Interface: Vector UI Pack por dobo_ui (itch.io).',
      assetsAudio: 'Sons: Kenney.nl — Casino Audio e Interface Sounds (CC0).',
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
      subtitle: '4 card games',
      description: 'Sueca, Hearts, Spades and King — play offline against AI.',
      metaPlayers: '4 PLAYERS',
      metaTeams: '2 teams',
      metaCards: 'mixed decks',
      metaGames: '4 games',
      tapHint: 'Enter',
      credits: 'Thanks to Cursor, Buga, Tico, Maria Francisca and Maria João.',
      copyright: '© 2025 All rights reserved.',
      imageAlt: 'SUECÃO — game cover'
    },
    menu: {
      selectGame: 'Select Game'
    },
    nav: {
      home: 'Home',
      play: 'Play',
      rules: 'Rules',
      more: 'More'
    },
    dashboard: {
      greeting: 'Hello',
      continueGame: 'Continue game',
      continueShort: 'Continue',
      continueHint: 'Resume your saved game',
      playNow: 'Play now',
      lastGame: 'Last game',
      statsTitle: 'Statistics',
      gamesPlayed: 'Games played',
      wins: 'Wins',
      noSavedGame: 'No saved game',
      playLastGame: (game) => `Play ${game}`,
      chooseGame: 'Choose game',
      otherGame: 'Another game…',
      lastPlayed: 'Last played',
      lastPlayedNever: 'Not played yet',
      lastPlayedSaved: 'Saved game',
      savedAgo: (time) => `saved ${time}`,
      quickPickTitle: 'Games',
      winRate: 'Win rate',
      viewProfile: 'View profile',
      perGameStats: 'By game',
      playedShort: 'P',
      winsShort: 'W',
      buildVersion: 'Version',
      playGame: 'Play',
      configureGame: (game) => `Configure ${game}`,
      playSavedConfirm: 'You have a saved game. Continue?',
      playNewConfirm: 'Start a new game and delete the saved one?'
    },
    playSetup: {
      title: 'New game',
      subtitle: 'Pick a game and opponents',
      rulesPreset: 'Rules mode'
    },
    rulesHub: {
      title: 'Rules',
      subtitle: 'Browse rules for each game',
      openRules: 'View rules'
    },
    moreScreen: {
      title: 'More',
      settings: 'Settings',
      profile: 'Local profile',
      credits: 'Credits',
      playerName: 'Your name',
      sound: 'Sound',
      language: 'Language',
      editName: 'Edit name',
      saveName: 'Save',
      handSort: 'Hand',
      sortHand: 'Sort hand automatically',
      suitOrder: 'Suit order',
      trumpPosition: 'Trump (Sueca)',
      trumpLeft: 'On the left',
      trumpRight: 'On the right',
      trumpNatural: 'In natural group',
      autoPauseTrick: 'Auto-pause between tricks'
    },
    earlyRoundEnd: {
      title: 'End round early?',
      body: 'Penalties are already decided. End the round now? If you decline, you can keep playing but scores will no longer change.',
      accept: 'End round',
      decline: 'Keep playing'
    },
    inGame: {
      exit: 'Exit',
      exitConfirm: 'Leave the current game?',
      newGame: 'New game',
      leaveConfirm: 'Return to home? Your game will be saved.',
      newGameConfirm: 'Abandon the current game and start a new one?'
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
      multiplayerMode: 'Multiplayer',
      enableMultiplayer: 'Enable multiplayer',
      createSession: 'Create new session',
      joinSession: 'Join existing session',
      sessionId: 'Session ID',
      sessionIdPlaceholder: 'Paste or enter the session ID',
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
      autoPause: 'Auto-pause',
      autoPauseHint: 'When on, tricks no longer advance automatically',
      aiExternal: 'External AI (Render)',
      aiLocal: 'Local AI (fallback)'
    },
    heartsPass: {
      title: 'Hearts — pass 3 cards',
      passTo: 'Pass to:',
      selectOnHand: 'Select 3 cards from your hand below.',
      confirm: (count) => `Pass cards (${count}/3)`
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
      assetsTitle: 'Graphic assets',
      assetsCards: 'Playing cards: Hand Drawn Playing Cards by Hazmat Game Studios (itch.io).',
      assetsUi: 'UI chrome: Vector UI Pack by dobo_ui (itch.io).',
      assetsAudio: 'Sound effects: Kenney.nl — Casino Audio and Interface Sounds (CC0).',
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
