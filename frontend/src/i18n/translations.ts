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
    heartsRoundTitle: string;
    heartsRoundPoints: string;
    heartsTotalScores: string;
    heartsGameOverTitle: string;
    heartsWinner: (name: string) => string;
    heartsLoser: (name: string) => string;
    heartsFinalScores: string;
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
    continueTrickHint: string;
    continueTrickAria: string;
    aiExternal: string;
    aiLocal: string;
    roundPointsShort: (points: number) => string;
    nowPlaying: string;
    trump: string;
    suitClubs: string;
    suitDiamonds: string;
    suitHearts: string;
    suitSpades: string;
    trumpAria: (suitLabel: string) => string;
  };

  heartsPass: {
    title: string;
    passTo: string;
    passToPlayer: (name: string, direction: string) => string;
    receiveFromPlayer: (name: string) => string;
    holdRound: string;
    confirmHold: string;
    selectOnHand: string;
    confirm: (count: number) => string;
  };

  spadesBid: {
    title: string;
    yourTurn: (name: string) => string;
    biddingNow: (name: string) => string;
    selectBid: string;
    nil: string;
    blindNil: string;
    normalBid: string;
    nilSelected: string;
    blindNilSelected: string;
    confirm: string;
    pending: string;
    badgeNil: string;
    badgeBlind: string;
  };

  spadesStatus: {
    bagsWord: string;
    bagsLine: (bags: number) => string;
    spadesClosed: string;
    spadesBroken: string;
  };

  heartsStatus: {
    heartsClosed: string;
    heartsBroken: string;
  };

  menu: {
    selectGame: string;
  };

  nav: {
    home: string;
    stats: string;
    history: string;
    themes: string;
    rules: string;
    settings: string;
    profile: string;
    /** @deprecated legacy 4-tab shell */
    play?: string;
    /** @deprecated legacy 4-tab shell */
    more?: string;
  };

  shell: {
    back: string;
  };

  statsScreen: {
    title: string;
    subtitle: string;
  };

  settingsScreen: {
    title: string;
    subtitle: string;
    hubGeneral: string;
    hubGeneralHint: string;
    hubHand: string;
    hubHandHint: string;
  };

  profileScreen: {
    title: string;
    subtitle: string;
    hubName: string;
    hubNameHint: string;
    hubCreditsHint: string;
    feedback: string;
    exitApp: string;
    exitConfirm: string;
  };

  historyScreen: {
    title: string;
    subtitle: string;
    continueSection: string;
    pinnedSection: string;
    finishedSection: string;
    emptyContinue: string;
    emptyPinned: string;
    emptyFinished: string;
    pinCopy: string;
    pinnedAt: (time: string) => string;
    unpin: string;
    hubContinueHint: (count: number) => string;
    hubPinnedHint: (count: number) => string;
    hubFinishedHint: (count: number) => string;
  };

  themesScreen: {
    title: string;
    subtitle: string;
    active: string;
    iapNote: string;
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
    playNewGameConfirm: string;
    multiplayerOfflineContinueBlocked: string;
  };

  playSetup: {
    title: string;
    subtitle: string;
    subtitleVariant: (game: string) => string;
    rulesPreset: string;
  };

  onlineScreen: {
    title: string;
    subtitle: string;
    unavailable: string;
    createTable: string;
    createTableSub: string;
    joinWithCode: string;
    joinWithCodeSub: string;
    gameLabel: string;
    suecaOnlyHint: string;
    seatsLabel: string;
    hostBadge: string;
    youBadge: string;
    botLabel: string;
    yourNamePlaceholder: string;
    friendPlaceholder: (index: number) => string;
    createRoom: string;
    creating: string;
    roomCodeLabel: string;
    shareCodeHint: string;
    playersLabel: string;
    startGame: string;
    joinCodeLabel: string;
    joinCodePlaceholder: string;
    join: string;
    joining: string;
    roomTitle: (code: string) => string;
    joinedAs: (name: string, seat: number) => string;
    enterGame: string;
    waitForHostHint: string;
    slotReady: string;
    slotWaiting: string;
    slotAi: string;
    errorCreate: string;
    errorJoinEmpty: string;
    errorJoinGeneric: string;
  };

  rulesHub: {
    title: string;
    subtitle: string;
    openRules: string;
    detailTitle: (game: string) => string;
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
    pinGame: string;
    pinConfirm: string;
    pinnedToast: string;
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
      stats: 'Estatísticas',
      history: 'Histórico',
      themes: 'Temas',
      rules: 'Regras',
      settings: 'Configurações',
      profile: 'Perfil'
    },
    shell: {
      back: 'Voltar'
    },
    statsScreen: {
      title: 'Estatísticas',
      subtitle: 'Resumo das tuas partidas locais'
    },
    settingsScreen: {
      title: 'Configurações',
      subtitle: 'Som, idioma, mão e pausa automática',
      hubGeneral: 'Geral',
      hubGeneralHint: 'Som, modo escuro, idioma e pausa',
      hubHand: 'Mão',
      hubHandHint: 'Ordenar cartas, naipes e trunfo Sueca'
    },
    profileScreen: {
      title: 'Perfil',
      subtitle: 'Nome local, créditos e sair da app',
      hubName: 'Nome',
      hubNameHint: 'Editar o teu nome local',
      hubCreditsHint: 'Autores, assets e agradecimentos',
      feedback: 'Feedback / reportar bug',
      exitApp: 'Sair da aplicação',
      exitConfirm: 'Voltar ao ecrã inicial? A app será recarregada.'
    },
    historyScreen: {
      title: 'Histórico',
      subtitle: 'Continuar, partidas fixadas e últimas terminadas',
      continueSection: 'Continuar',
      pinnedSection: 'Fixadas',
      finishedSection: 'Últimas terminadas',
      emptyContinue: 'Nenhuma partida guardada.',
      emptyPinned: 'Nenhuma partida fixada.',
      emptyFinished: 'Ainda não terminaste partidas.',
      pinCopy: 'Fixar partida',
      pinnedAt: (time) => `fixada ${time}`,
      unpin: 'Desfixar',
      hubContinueHint: (count) =>
        count === 0 ? 'Nenhuma partida guardada' : `${count} partida(s) guardada(s)`,
      hubPinnedHint: (count) =>
        count === 0 ? 'Nenhuma fixada' : `${count} partida(s) fixada(s)`,
      hubFinishedHint: (count) =>
        count === 0 ? 'Nenhuma terminada' : `${count} última(s) terminada(s)`
    },
    themesScreen: {
      title: 'Temas',
      subtitle: 'Aparência visual da app',
      active: 'Activo',
      iapNote: 'Temas premium disponíveis em breve na Play Store.'
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
      playNewGameConfirm: 'Quer começar jogo novo? (Tens um jogo activo)',
      multiplayerOfflineContinueBlocked:
        'Esta partida era online. Usa Online para criar ou entrar numa nova sala.'
    },
    playSetup: {
      title: 'Nova partida',
      subtitle: 'Escolhe o jogo e os adversários',
      subtitleVariant: (game) => `Configurar ${game}`,
      rulesPreset: 'Modo de regras'
    },
    onlineScreen: {
      title: 'Online',
      subtitle: 'Joga com amigos em dispositivos diferentes',
      unavailable: 'Multiplayer não está disponível nesta versão.',
      createTable: 'Criar Mesa',
      createTableSub: 'Define o jogo e convida amigos',
      joinWithCode: 'Entrar com Código',
      joinWithCodeSub: 'Junta-te a uma mesa existente',
      gameLabel: 'Jogo',
      suecaOnlyHint: 'Multiplayer online disponível apenas para Sueca.',
      seatsLabel: 'Lugares',
      hostBadge: 'Host',
      youBadge: ' (tu)',
      botLabel: 'Bot (IA)',
      yourNamePlaceholder: 'O teu nome',
      friendPlaceholder: (index) => `Amigo ${index}`,
      createRoom: '🏠 Criar Sala',
      creating: 'A criar…',
      roomCodeLabel: 'Código da sala',
      shareCodeHint: 'Partilha este código com os teus amigos',
      playersLabel: 'Jogadores',
      startGame: '▶ Iniciar Jogo',
      joinCodeLabel: 'Código da sala',
      joinCodePlaceholder: 'Ex: AB3CD',
      join: '🔗 Entrar',
      joining: 'A entrar…',
      roomTitle: (code) => `Sala: ${code}`,
      joinedAs: (name, seat) => `Entraste como ${name} (lugar ${seat})`,
      enterGame: '▶ Entrar no Jogo',
      waitForHostHint:
        'Aguarda que o host inicie, ou entra já — a mesa sincroniza automaticamente.',
      slotReady: 'Pronto',
      slotWaiting: 'A aguardar…',
      slotAi: 'IA',
      errorCreate: 'Erro ao criar sala. Verifica a ligação.',
      errorJoinEmpty: 'Introduz o código da sala.',
      errorJoinGeneric: 'Erro ao entrar na sala.',
    },
    rulesHub: {
      title: 'Regras',
      subtitle: 'Consulta as regras de cada jogo',
      openRules: 'Ver regras',
      detailTitle: (game) => `Regras — ${game}`
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
      newGameConfirm: 'Abandonar a partida actual e começar uma nova?',
      pinGame: 'Fixar',
      pinConfirm: 'Fixar esta partida no histórico?',
      pinnedToast: 'Partida fixada.'
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
      continueTrickHint: 'Vaza terminada',
      continueTrickAria: 'Continuar para a próxima vaza',
      aiExternal: 'AI Externa (Render)',
      aiLocal: 'AI Local (fallback)',
      roundPointsShort: (points) => `Ronda: ${points}`,
      nowPlaying: 'A jogar',
      trump: 'Trunfo',
      suitClubs: 'Paus',
      suitDiamonds: 'Ouros',
      suitHearts: 'Copas',
      suitSpades: 'Espadas',
      trumpAria: (suitLabel) => `Trunfo: ${suitLabel}`
    },
    heartsPass: {
      title: 'Copas — passar 3 cartas',
      passTo: 'Passar para:',
      passToPlayer: (name, direction) => `Passas 3 cartas para ${name} (${direction})`,
      receiveFromPlayer: (name) => `Recebes 3 cartas de ${name}`,
      holdRound: 'Esta ronda não se passam cartas.',
      confirmHold: 'Continuar',
      selectOnHand: 'Selecciona 3 cartas na tua mão (cartas coloridas).',
      confirm: (count) => `Passar cartas (${count}/3)`
    },
    spadesBid: {
      title: 'Spades — bids',
      yourTurn: (name) => `A tua vez, ${name}`,
      biddingNow: (name) => `A bidar: ${name}`,
      selectBid: 'Bid (0–13)',
      nil: 'Nil',
      blindNil: 'Blind nil',
      normalBid: 'Bid normal',
      nilSelected: 'Nil (0 vazas)',
      blindNilSelected: 'Blind nil (0 vazas)',
      confirm: 'Confirmar bid',
      pending: '…',
      badgeNil: 'Nil',
      badgeBlind: 'Blind'
    },
    spadesStatus: {
      bagsWord: 'bags',
      bagsLine: (bags) => `${bags} bags`,
      spadesClosed: '♠ Fechadas',
      spadesBroken: '♠ Quebradas'
    },
    heartsStatus: {
      heartsClosed: '♥ Fechadas',
      heartsBroken: '♥ Quebradas'
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
      newGame: 'Novo Jogo',
      heartsRoundTitle: 'Fim da ronda',
      heartsRoundPoints: 'Pontos desta ronda',
      heartsTotalScores: 'Total acumulado',
      heartsGameOverTitle: 'Fim do jogo',
      heartsWinner: (name) => `${name} venceu (menos pontos)`,
      heartsLoser: (name) => `${name} perdeu (100+ pontos)`,
      heartsFinalScores: 'Pontuação final'
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
      stats: 'Stats',
      history: 'History',
      themes: 'Themes',
      rules: 'Rules',
      settings: 'Settings',
      profile: 'Profile'
    },
    shell: {
      back: 'Back'
    },
    statsScreen: {
      title: 'Statistics',
      subtitle: 'Summary of your local games'
    },
    settingsScreen: {
      title: 'Settings',
      subtitle: 'Sound, language, hand sorting and auto-pause',
      hubGeneral: 'General',
      hubGeneralHint: 'Sound, dark mode, language and pause',
      hubHand: 'Hand',
      hubHandHint: 'Sort cards, suits and Sueca trump'
    },
    profileScreen: {
      title: 'Profile',
      subtitle: 'Local name, credits and exit app',
      hubName: 'Name',
      hubNameHint: 'Edit your local name',
      hubCreditsHint: 'Authors, assets and thanks',
      feedback: 'Feedback / report a bug',
      exitApp: 'Exit app',
      exitConfirm: 'Return to the start screen? The app will reload.'
    },
    historyScreen: {
      title: 'History',
      subtitle: 'Continue, pinned games and last finished',
      continueSection: 'Continue',
      pinnedSection: 'Pinned',
      finishedSection: 'Last finished',
      emptyContinue: 'No saved games.',
      emptyPinned: 'No pinned games.',
      emptyFinished: 'No finished games yet.',
      pinCopy: 'Pin game',
      pinnedAt: (time) => `pinned ${time}`,
      unpin: 'Unpin',
      hubContinueHint: (count) =>
        count === 0 ? 'No saved games' : `${count} saved game(s)`,
      hubPinnedHint: (count) =>
        count === 0 ? 'None pinned' : `${count} pinned game(s)`,
      hubFinishedHint: (count) =>
        count === 0 ? 'None finished' : `${count} last finished`
    },
    themesScreen: {
      title: 'Themes',
      subtitle: 'Visual appearance of the app',
      active: 'Active',
      iapNote: 'Premium themes coming soon on the Play Store.'
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
      playNewGameConfirm: 'Start a new game? (You have an active game)',
      multiplayerOfflineContinueBlocked:
        'This was an online game. Use Online to create or join a new room.'
    },
    playSetup: {
      title: 'New game',
      subtitle: 'Pick a game and opponents',
      subtitleVariant: (game) => `Configure ${game}`,
      rulesPreset: 'Rules mode'
    },
    onlineScreen: {
      title: 'Online',
      subtitle: 'Play with friends on different devices',
      unavailable: 'Multiplayer is not available in this build.',
      createTable: 'Create Table',
      createTableSub: 'Set up the game and invite friends',
      joinWithCode: 'Join with Code',
      joinWithCodeSub: 'Join an existing table',
      gameLabel: 'Game',
      suecaOnlyHint: 'Online multiplayer is available for Sueca only.',
      seatsLabel: 'Seats',
      hostBadge: 'Host',
      youBadge: ' (you)',
      botLabel: 'Bot (AI)',
      yourNamePlaceholder: 'Your name',
      friendPlaceholder: (index) => `Friend ${index}`,
      createRoom: '🏠 Create Room',
      creating: 'Creating…',
      roomCodeLabel: 'Room code',
      shareCodeHint: 'Share this code with your friends',
      playersLabel: 'Players',
      startGame: '▶ Start Game',
      joinCodeLabel: 'Room code',
      joinCodePlaceholder: 'e.g. AB3CD',
      join: '🔗 Join',
      joining: 'Joining…',
      roomTitle: (code) => `Room: ${code}`,
      joinedAs: (name, seat) => `You joined as ${name} (seat ${seat})`,
      enterGame: '▶ Enter Game',
      waitForHostHint: 'Wait for the host to start, or enter now — the table syncs automatically.',
      slotReady: 'Ready',
      slotWaiting: 'Waiting…',
      slotAi: 'AI',
      errorCreate: 'Could not create room. Check your connection.',
      errorJoinEmpty: 'Enter the room code.',
      errorJoinGeneric: 'Could not join the room.',
    },
    rulesHub: {
      title: 'Rules',
      subtitle: 'Browse rules for each game',
      openRules: 'View rules',
      detailTitle: (game) => `Rules — ${game}`
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
      newGameConfirm: 'Abandon the current game and start a new one?',
      pinGame: 'Pin',
      pinConfirm: 'Pin this game to history?',
      pinnedToast: 'Game pinned.'
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
      continueTrickHint: 'Trick complete',
      continueTrickAria: 'Continue to the next trick',
      aiExternal: 'External AI (Render)',
      aiLocal: 'Local AI (fallback)',
      roundPointsShort: (points) => `Round: ${points}`,
      nowPlaying: 'Playing',
      trump: 'Trump',
      suitClubs: 'Clubs',
      suitDiamonds: 'Diamonds',
      suitHearts: 'Hearts',
      suitSpades: 'Spades',
      trumpAria: (suitLabel) => `Trump: ${suitLabel}`
    },
    heartsPass: {
      title: 'Hearts — pass 3 cards',
      passTo: 'Pass to:',
      passToPlayer: (name, direction) => `Pass 3 cards to ${name} (${direction})`,
      receiveFromPlayer: (name) => `Receive 3 cards from ${name}`,
      holdRound: 'No passing this round.',
      confirmHold: 'Continue',
      selectOnHand: 'Select 3 cards from your hand below.',
      confirm: (count) => `Pass cards (${count}/3)`
    },
    spadesBid: {
      title: 'Spades — bids',
      yourTurn: (name) => `Your turn, ${name}`,
      biddingNow: (name) => `Bidding: ${name}`,
      selectBid: 'Bid (0–13)',
      nil: 'Nil',
      blindNil: 'Blind nil',
      normalBid: 'Normal bid',
      nilSelected: 'Nil (0 tricks)',
      blindNilSelected: 'Blind nil (0 tricks)',
      confirm: 'Confirm bid',
      pending: '…',
      badgeNil: 'Nil',
      badgeBlind: 'Blind'
    },
    spadesStatus: {
      bagsWord: 'bags',
      bagsLine: (bags) => `${bags} bags`,
      spadesClosed: '♠ Closed',
      spadesBroken: '♠ Broken'
    },
    heartsStatus: {
      heartsClosed: '♥ Closed',
      heartsBroken: '♥ Broken'
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
      newGame: 'Start New Game',
      heartsRoundTitle: 'Round complete',
      heartsRoundPoints: 'Points this round',
      heartsTotalScores: 'Total score',
      heartsGameOverTitle: 'Game over',
      heartsWinner: (name) => `${name} wins (lowest score)`,
      heartsLoser: (name) => `${name} lost (100+ points)`,
      heartsFinalScores: 'Final scores'
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
