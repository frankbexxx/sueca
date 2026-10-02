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
    /** ARCH-SUECA-06 — session play direction. */
    playDirection: string;
    playDirectionRight: string;
    playDirectionRightHint: string;
    playDirectionLeft: string;
    playDirectionLeftHint: string;
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
    dealingTitle: string;
    /** ARCH-SUECA-06 — per-hand deal alignment (legacy copy; ritual uses physical labels). */
    dealAlignmentLabel: string;
    dealAlignmentSame: string;
    dealAlignmentOpposite: string;
    dealAlignmentSameHint: string;
    dealAlignmentOppositeHint: string;
    playDirectionReadonlyRight: string;
    playDirectionReadonlyLeft: string;
    /** UX-SUECA-01 — hand ritual */
    dealerLabel: string;
    dealPrompt: string;
    dealPhysicalRight: string;
    dealPhysicalLeft: string;
    dealConfirm: string;
    shuffling: (name: string) => string;
    cutting: (name: string) => string;
    dealerDeciding: (name: string) => string;
    willDealRight: (name: string) => string;
    willDealLeft: (name: string) => string;
    ritualRoleShuffler: string;
    ritualRoleCutter: string;
    ritualRoleDealer: string;
    ritualRoleFirstPlayer: string;
    distributing: string;
    trumpRevealTitle: string;
    firstPlayerStarts: (name: string) => string;
    newGame: string;
    heartsRoundTitle: string;
    heartsRoundPoints: string;
    heartsTotalScores: string;
    heartsGameOverTitle: string;
    heartsWinner: (name: string) => string;
    heartsLoser: (name: string) => string;
    resultTie: string;
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
    directionLeft: string;
    directionRight: string;
    directionAcross: string;
    directionTo: (direction: string, name: string) => string;
    selectedCount: (count: number) => string;
    confirm: string;
    received: string;
    holdRound: string;
  };

  spadesBid: {
    title: string;
    yourTurn: (name: string) => string;
    biddingNow: (name: string) => string;
    selectBid: string;
    nil: string;
    blindNil: string;
    seeHand: string;
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
    tricksBidAria: (tricks: number, bid: number) => string;
    scoreShort: string;
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
    privacyPolicy: string;
    termsOfUse: string;
    legalSectionHint: string;
    feedback: string;
    exitApp: string;
    exitConfirm: string;
  };

  accountScreen: {
    title: string;
    subtitle: string;
    /** Soft-hide deep-link panel when Auth not configured (Play v1). */
    unavailable: string;
    guestStatus: string;
    guestExplain: string;
    configMissing: string;
    linkGoogle: string;
    signedInStatus: string;
    signOut: string;
    deleteAccount: string;
    deleteExplain: string;
    deleteConfirmTitle: string;
    deleteConfirmBody: string;
    deleteKeepLocal: string;
    deleteWipeLocal: string;
    deleteWipeConfirmTitle: string;
    deleteWipeConfirmBody: string;
    deleteWipeConfirmAction: string;
    loading: string;
    errorCancelled: string;
    errorMisconfigured: string;
    errorUnavailable: string;
    errorNetwork: string;
    errorBackend: string;
    errorStorage: string;
    errorPendingDelete: string;
    errorInvalidCredential: string;
    errorDelete: string;
    errorGeneric: string;
    /** SYNC-01D Conta sync */
    syncSectionTitle: string;
    syncStatusSetupRequired: string;
    syncStatusSynced: string;
    syncStatusSyncing: string;
    syncStatusOffline: string;
    syncStatusError: string;
    syncStatusAccountMismatch: string;
    syncConfigureCta: string;
    syncNowCta: string;
    syncInfoABody: string;
    syncInfoAConfirm: string;
    syncPrefsTitle: string;
    syncPrefsBody: string;
    syncPrefsDevice: string;
    syncPrefsCloud: string;
    syncSwitchTitle: string;
    syncSwitchBody: string;
    syncSwitchUseCloud: string;
    syncSwitchStay: string;
    syncSeedMismatchTitle: string;
    syncSeedMismatchBody: string;
    syncBusy: string;
    syncError: string;
    syncRetry: string;
    syncCancel: string;
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
    currentLabel: string;
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
    kicker: string;
    back: string;
    players: string;
    youBadge: string;
    aiBadge: string;
    seatName: (index: number) => string;
    difficulty: string;
    rules: string;
    start: string;
    suecaDealSummary: string;
    selectedMode: string;
    kingSyntheticMode: string;
    kingNormalMode: string;
  };

  kingKoh: {
    title: string;
    firstPlayerAuto: (name: string) => string;
    syntheticFirstPlayer: (name: string) => string;
    receivingCard: (name: string) => string;
    winnerFesta: (name: string) => string;
    startDraw: string;
    startHand: string;
    startMatch: string;
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
    music: string;
    musicThemeDefault: string;
    musicOff: string;
    musicRandom: string;
    musicRandomSafe: string;
    musicFamily: string;
    musicSpecific: string;
    musicFamilyLabel: string;
    musicTrackLabel: string;
    musicStreamingSafeHint: string;
    musicContentIdBadge: string;
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
    exitGame: string;
    exitConfirm: string;
    newGame: string;
    leaveConfirm: string;
    newGameConfirm: string;
    pinGame: string;
    pinConfirm: string;
    pinnedToast: string;
    more: string;
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
  
  // Credits Modal / Profile Credits
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
    sectionCards: string;
    assetsCards: string;
    sectionBacks: string;
    assetsBacks: string;
    sectionSfx: string;
    assetsSfx: string;
    sectionMusic: string;
    assetsMusic: string;
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
      copyright: 'Suecão · 2026',
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
      subtitle: 'Idioma e preferências',
      hubGeneral: 'Geral',
      hubGeneralHint: 'Idioma',
      hubHand: 'Mão e Cartas',
      hubHandHint: 'Baralho, verso, ordenação e ritmo'
    },
    profileScreen: {
      title: 'Perfil',
      subtitle: 'Nome local, créditos e sair da app',
      hubName: 'Nome',
      hubNameHint: 'Editar o teu nome local',
      hubCreditsHint: 'Autores, assets e agradecimentos',
      privacyPolicy: 'Política de Privacidade',
      termsOfUse: 'Termos de Utilização',
      legalSectionHint: 'Documentos legais',
      feedback: 'Feedback / reportar bug',
      exitApp: 'Sair da aplicação',
      exitConfirm: 'Voltar ao ecrã inicial? A app será recarregada.'
    },
    accountScreen: {
      title: 'Conta',
      subtitle: 'Conta Google opcional',
      unavailable: 'Conta não está disponível nesta versão.',
      guestStatus: 'Jogar sem conta',
      guestExplain:
        'A conta é opcional. Podes jogar localmente sem conta. Depois de ligares a conta, podes configurar a sincronização quando quiseres.',
      configMissing: 'Ligação Google ainda não configurada neste ambiente.',
      linkGoogle: 'Ligar conta Google',
      signedInStatus: 'Conta ligada',
      signOut: 'Terminar sessão',
      deleteAccount: 'Apagar conta',
      deleteExplain:
        'Terminar sessão mantém a conta. Apagar conta desactiva a conta no servidor — diferente de limpar dados locais.',
      deleteConfirmTitle: 'Apagar conta?',
      deleteConfirmBody:
        'A ligação Google / conta Suecão será desactivada no servidor. Os dados de jogo neste dispositivo podem ficar intactos.',
      deleteKeepLocal: 'Manter dados neste dispositivo',
      deleteWipeLocal: 'Também apagar dados locais',
      deleteWipeConfirmTitle: 'Apagar também os dados locais?',
      deleteWipeConfirmBody:
        'Isto remove estatísticas, histórico, partidas guardadas e preferências deste dispositivo. Não dá para anular.',
      deleteWipeConfirmAction: 'Apagar conta e dados locais',
      loading: 'Aguarde…',
      errorCancelled: 'Início de sessão cancelado.',
      errorMisconfigured: 'Google Auth não está configurado.',
      errorUnavailable: 'Serviço Google indisponível.',
      errorNetwork: 'Sem ligação. Tenta outra vez.',
      errorBackend: 'Não foi possível validar a conta. Tenta outra vez.',
      errorStorage: 'Não foi possível guardar a sessão com segurança.',
      errorPendingDelete: 'Esta conta está marcada para apagar. Não é possível voltar a ligar.',
      errorInvalidCredential: 'Credencial Google inválida ou rejeitada. Tenta outra vez.',
      errorDelete: 'Não foi possível apagar a conta. Tenta outra vez.',
      errorGeneric: 'Não foi possível iniciar sessão com Google.',
      syncSectionTitle: 'Sincronização',
      syncStatusSetupRequired: 'Sincronização por configurar',
      syncStatusSynced: 'Sincronizado',
      syncStatusSyncing: 'A sincronizar…',
      syncStatusOffline: 'Sem ligação',
      syncStatusError: 'Erro de sincronização',
      syncStatusAccountMismatch: 'Conta diferente neste dispositivo',
      syncConfigureCta: 'Configurar sincronização',
      syncNowCta: 'Sincronizar agora',
      syncInfoABody: 'Os dados deste dispositivo serão associados à tua conta.',
      syncInfoAConfirm: 'Continuar',
      syncPrefsTitle: 'Que preferências queres manter?',
      syncPrefsBody:
        'O histórico das partidas será combinado automaticamente. Esta escolha afecta apenas preferências visuais/de jogo sincronizáveis.',
      syncPrefsDevice: 'As deste dispositivo',
      syncPrefsCloud: 'As da cloud',
      syncSwitchTitle: 'Usar esta conta neste dispositivo?',
      syncSwitchBody: 'Este dispositivo tem dados associados a outra conta.',
      syncSwitchUseCloud: 'Usar os dados desta conta',
      syncSwitchStay: 'Continuar sem sincronizar',
      syncSeedMismatchTitle: 'Não foi possível concluir a sincronização',
      syncSeedMismatchBody:
        'Há dados de estatísticas antigas diferentes neste dispositivo e na conta. Contacta o suporte ou resolve noutro dispositivo — não são misturados automaticamente.',
      syncBusy: 'A configurar sincronização…',
      syncError: 'Não foi possível configurar a sincronização. Tenta outra vez.',
      syncRetry: 'Tentar outra vez',
      syncCancel: 'Cancelar'
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
      subtitle: 'Aparência da mesa e do ambiente',
      active: 'Activo',
      currentLabel: 'Tema actual',
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
      rulesPreset: 'Modo de regras',
      kicker: 'Preparar a mesa',
      back: 'Voltar',
      players: 'Jogadores',
      youBadge: 'TU',
      aiBadge: 'IA',
      seatName: (index) => `Nome do jogador ${index + 1}`,
      difficulty: 'Dificuldade',
      rules: 'Regras',
      start: 'Começar',
      suecaDealSummary:
        '10 cartas por jogador, distribuídas em blocos. O sentido do jogo mantém-se durante a partida; em cada mão, o distribuidor pode dar no mesmo sentido ou no sentido oposto.',
      selectedMode: 'Modo seleccionado',
      kingSyntheticMode: 'Todos os negativos + 4 Festas',
      kingNormalMode: '6 negativos + 4 Festas'
    },
    kingKoh: {
      title: 'Viragem do Rei de Copas',
      firstPlayerAuto: (name) =>
        `Primeiro jogador: ${name}. Viragem automática até sair o K♥.`,
      syntheticFirstPlayer: (name) =>
        `Viragem do Rei de Copas — primeiro jogador: ${name}.`,
      receivingCard: (name) => `${name} recebe uma carta…`,
      winnerFesta: (name) => `${name} tirou o Rei de Copas — dono da 1.ª festa.`,
      startDraw: 'Iniciar viragem',
      startHand: 'Começar mão',
      startMatch: 'Começar partida'
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
      music: 'Música',
      musicThemeDefault: 'Tema por defeito',
      musicOff: 'Desligada',
      musicRandom: 'Aleatória',
      musicRandomSafe: 'Aleatória (Streaming Safe)',
      musicFamily: 'Família',
      musicSpecific: 'Faixa específica',
      musicFamilyLabel: 'Família musical',
      musicTrackLabel: 'Faixa',
      musicStreamingSafeHint: 'Exclui faixas com Content ID.',
      musicContentIdBadge: 'Content ID',
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
      exitGame: 'Sair do jogo',
      exitConfirm: 'Abandonar a partida actual?',
      newGame: 'Novo jogo',
      leaveConfirm: 'Voltar ao início? A partida fica guardada.',
      newGameConfirm: 'Abandonar a partida actual e começar uma nova?',
      pinGame: 'Fixar',
      pinConfirm: 'Fixar esta partida no histórico?',
      pinnedToast: 'Partida fixada.',
      more: 'Mais'
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
      playDirection: 'Sentido do jogo',
      playDirectionRight: 'Pela direita',
      playDirectionRightHint: 'Sentido anti-horário',
      playDirectionLeft: 'Pela esquerda',
      playDirectionLeftHint: 'Sentido horário',
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
      nowPlaying: 'A JOGAR',
      trump: 'Trunfo',
      suitClubs: 'Paus',
      suitDiamonds: 'Ouros',
      suitHearts: 'Copas',
      suitSpades: 'Espadas',
      trumpAria: (suitLabel) => `Trunfo: ${suitLabel}`
    },
    heartsPass: {
      title: 'Passar cartas',
      directionLeft: 'Passa 3 cartas à esquerda',
      directionRight: 'Passa 3 cartas à direita',
      directionAcross: 'Passa 3 cartas em frente',
      directionTo: (direction, name) => `${direction} · ${name}`,
      selectedCount: (count) => `${count} de 3 selecionadas`,
      confirm: 'Passar 3 cartas',
      received: 'Cartas recebidas',
      holdRound: 'Esta ronda não se passam cartas.'
    },
    spadesBid: {
      title: 'Spades — bids',
      yourTurn: (name) => `A tua vez, ${name}`,
      biddingNow: (name) => `A bidar: ${name}`,
      selectBid: 'Bid (0–13)',
      nil: 'Nil',
      blindNil: 'Blind nil',
      seeHand: 'Ver mão',
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
      tricksBidAria: (tricks, bid) => `Vazas ${tricks} / Bid ${bid}`,
      scoreShort: 'Pontos',
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
      dealingTitle: 'Distribuição',
      dealAlignmentLabel: 'Sentido da distribuição',
      dealAlignmentSame: 'Mesmo sentido do jogo',
      dealAlignmentOpposite: 'Sentido oposto ao jogo',
      dealAlignmentSameHint:
        'Distribui no mesmo sentido do jogo. O dealer recebe por último e a última carta define o trunfo.',
      dealAlignmentOppositeHint:
        'Distribui no sentido oposto. A primeira carta do dealer define o trunfo.',
      playDirectionReadonlyRight: 'Jogo: pela direita',
      playDirectionReadonlyLeft: 'Jogo: pela esquerda',
      dealerLabel: 'Dealer:',
      dealPrompt: 'Por onde queres distribuir?',
      dealPhysicalRight: 'Pela direita',
      dealPhysicalLeft: 'Pela esquerda',
      dealConfirm: 'Distribuir',
      shuffling: (name) => `${name} está a baralhar…`,
      cutting: (name) => `${name} corta o baralho`,
      dealerDeciding: (name) => `${name} está a decidir por onde distribuir…`,
      willDealRight: (name) => `${name} vai distribuir pela direita`,
      willDealLeft: (name) => `${name} vai distribuir pela esquerda`,
      ritualRoleShuffler: 'BARALHA',
      ritualRoleCutter: 'CORTA',
      ritualRoleDealer: 'DEALER',
      ritualRoleFirstPlayer: 'COMEÇA',
      distributing: 'A distribuir…',
      trumpRevealTitle: 'Trunfo',
      firstPlayerStarts: (name) => `${name} começa`,
      newGame: 'Novo Jogo',
      heartsRoundTitle: 'Fim da ronda',
      heartsRoundPoints: 'Pontos desta ronda',
      heartsTotalScores: 'Total acumulado',
      heartsGameOverTitle: 'Fim do jogo',
      heartsWinner: (name) => `${name} venceu (menos pontos)`,
      heartsLoser: (name) => `${name} perdeu (100+ pontos)`,
      resultTie: 'Empate',
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
      description:
        'Versão digital do clássico jogo de cartas português, pensada para jogar a solo contra a IA ou em modo cooperativo com amigos ao redor da mesa.',
      metaPlayers: '4 JOGADORES',
      metaTeams: '2 equipas',
      metaCards: '40 cartas',
      metaGames: '4 jogos',
      imagePlaceholderLabel: 'capa / animação',
      imagePlaceholderFormat: 'jpg · png · gif',
      acknowledgmentsTitle: 'Agradecimentos',
      acknowledgmentsText:
        'Obrigado ao Cursor, ao Buga, ao Tico, à Maria Francisca e à Maria João.',
      assetsTitle: 'Créditos de conteúdo',
      sectionCards: 'Cartas',
      assetsCards:
        'CardMeister (Danny Engelman); AustinGabriel; woodcut-cards (SONDLecT); Saul Spatz SVGCards; Kenney; Webisso LLC.',
      sectionBacks: 'Versos',
      assetsBacks:
        'Suecão (originais); Sylly / Andrew Tidey (OpenGameArt); woodcut-cards; Saul Spatz; AustinGabriel; Kenney.',
      sectionSfx: 'Som',
      assetsSfx:
        'Kenney.nl (CC0); Freesound (BMacZero, el_boss, KevinHilt); Suecão (sons gerados).',
      sectionMusic: 'Música',
      assetsMusic:
        'Faixas locais: Pixabay Content License, PeriTune e StockTune. Catálogo remoto adicional sob as mesmas famílias de licença. Detalhe no NOTICE do repositório.',
      copyright: 'Suecão · 2026',
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
      copyright: 'Suecão · 2026',
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
      subtitle: 'Language and preferences',
      hubGeneral: 'General',
      hubGeneralHint: 'Language',
      hubHand: 'Hand & Cards',
      hubHandHint: 'Deck, backs, sorting and pace'
    },
    profileScreen: {
      title: 'Profile',
      subtitle: 'Local name, credits and exit app',
      hubName: 'Name',
      hubNameHint: 'Edit your local name',
      hubCreditsHint: 'Authors, assets and thanks',
      privacyPolicy: 'Privacy Policy',
      termsOfUse: 'Terms of Use',
      legalSectionHint: 'Legal documents',
      feedback: 'Feedback / report a bug',
      exitApp: 'Exit app',
      exitConfirm: 'Return to the start screen? The app will reload.'
    },
    accountScreen: {
      title: 'Account',
      subtitle: 'Optional Google account',
      unavailable: 'Account is not available in this build.',
      guestStatus: 'Play without an account',
      guestExplain:
        'An account is optional. Local play works without one. After you link an account, you can set up sync whenever you want.',
      configMissing: 'Google linking is not configured in this environment.',
      linkGoogle: 'Link Google account',
      signedInStatus: 'Account linked',
      signOut: 'Sign out',
      deleteAccount: 'Delete account',
      deleteExplain:
        'Sign out keeps the account. Delete account disables the server account — distinct from clearing local data.',
      deleteConfirmTitle: 'Delete account?',
      deleteConfirmBody:
        'Your Google link / Suecão account will be disabled on the server. Game data on this device can stay intact.',
      deleteKeepLocal: 'Keep data on this device',
      deleteWipeLocal: 'Also delete local data',
      deleteWipeConfirmTitle: 'Also delete local data?',
      deleteWipeConfirmBody:
        'This removes stats, history, saved games, and preferences on this device. It cannot be undone.',
      deleteWipeConfirmAction: 'Delete account and local data',
      loading: 'Please wait…',
      errorCancelled: 'Sign-in cancelled.',
      errorMisconfigured: 'Google Auth is not configured.',
      errorUnavailable: 'Google service unavailable.',
      errorNetwork: 'No connection. Try again.',
      errorBackend: 'Could not validate the account. Try again.',
      errorStorage: 'Could not securely store the session.',
      errorPendingDelete: 'This account is marked for deletion. Sign-in is blocked.',
      errorInvalidCredential: 'Google credential invalid or rejected. Try again.',
      errorDelete: 'Could not delete the account. Try again.',
      errorGeneric: 'Could not sign in with Google.',
      syncSectionTitle: 'Sync',
      syncStatusSetupRequired: 'Sync not set up',
      syncStatusSynced: 'Synced',
      syncStatusSyncing: 'Syncing…',
      syncStatusOffline: 'No connection',
      syncStatusError: 'Sync error',
      syncStatusAccountMismatch: 'Different account on this device',
      syncConfigureCta: 'Set up sync',
      syncNowCta: 'Sync now',
      syncInfoABody: 'Data on this device will be linked to your account.',
      syncInfoAConfirm: 'Continue',
      syncPrefsTitle: 'Which preferences do you want to keep?',
      syncPrefsBody:
        'Match history will be combined automatically. This choice only affects syncable visual/game preferences.',
      syncPrefsDevice: 'This device’s',
      syncPrefsCloud: 'The cloud’s',
      syncSwitchTitle: 'Use this account on this device?',
      syncSwitchBody: 'This device has data linked to another account.',
      syncSwitchUseCloud: 'Use this account’s data',
      syncSwitchStay: 'Continue without syncing',
      syncSeedMismatchTitle: 'Could not finish sync setup',
      syncSeedMismatchBody:
        'Legacy stats on this device and on the account differ. Contact support or resolve on another device — they are not merged automatically.',
      syncBusy: 'Setting up sync…',
      syncError: 'Could not set up sync. Try again.',
      syncRetry: 'Try again',
      syncCancel: 'Cancel'
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
      subtitle: 'Table and atmosphere appearance',
      active: 'Active',
      currentLabel: 'Current theme',
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
      rulesPreset: 'Rules mode',
      kicker: 'Set the table',
      back: 'Back',
      players: 'Players',
      youBadge: 'YOU',
      aiBadge: 'AI',
      seatName: (index) => `Player ${index + 1} name`,
      difficulty: 'Difficulty',
      rules: 'Rules',
      start: 'Start',
      suecaDealSummary:
        '10 cards per player, dealt in blocks. Play direction stays fixed for the match; each hand, the distributor may deal the same way or the opposite way.',
      selectedMode: 'Selected mode',
      kingSyntheticMode: 'All negatives + 4 festas',
      kingNormalMode: '6 negatives + 4 festas'
    },
    kingKoh: {
      title: 'King of Hearts draw',
      firstPlayerAuto: (name) =>
        `First player: ${name}. Cards turn automatically until the K♥ appears.`,
      syntheticFirstPlayer: (name) => `King of Hearts draw — first player: ${name}.`,
      receivingCard: (name) => `${name} receives a card…`,
      winnerFesta: (name) => `${name} drew the King of Hearts — owner of the 1st festa.`,
      startDraw: 'Start the draw',
      startHand: 'Start hand',
      startMatch: 'Start match'
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
      music: 'Music',
      musicThemeDefault: 'Theme default',
      musicOff: 'Off',
      musicRandom: 'Random',
      musicRandomSafe: 'Random (Streaming Safe)',
      musicFamily: 'Family',
      musicSpecific: 'Specific track',
      musicFamilyLabel: 'Music family',
      musicTrackLabel: 'Track',
      musicStreamingSafeHint: 'Excludes tracks with Content ID.',
      musicContentIdBadge: 'Content ID',
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
      exitGame: 'Exit game',
      exitConfirm: 'Leave the current game?',
      newGame: 'New game',
      leaveConfirm: 'Return to home? Your game will be saved.',
      newGameConfirm: 'Abandon the current game and start a new one?',
      pinGame: 'Pin',
      pinConfirm: 'Pin this game to history?',
      pinnedToast: 'Game pinned.',
      more: 'More'
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
      playDirection: 'Play direction',
      playDirectionRight: 'To the right',
      playDirectionRightHint: 'Anti-clockwise',
      playDirectionLeft: 'To the left',
      playDirectionLeftHint: 'Clockwise',
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
      nowPlaying: 'PLAYING',
      trump: 'Trump',
      suitClubs: 'Clubs',
      suitDiamonds: 'Diamonds',
      suitHearts: 'Hearts',
      suitSpades: 'Spades',
      trumpAria: (suitLabel) => `Trump: ${suitLabel}`
    },
    heartsPass: {
      title: 'Pass cards',
      directionLeft: 'Pass 3 cards to the left',
      directionRight: 'Pass 3 cards to the right',
      directionAcross: 'Pass 3 cards across',
      directionTo: (direction, name) => `${direction} · ${name}`,
      selectedCount: (count) => `${count} of 3 selected`,
      confirm: 'Pass 3 cards',
      received: 'Cards received',
      holdRound: 'No passing this round.'
    },
    spadesBid: {
      title: 'Spades — bids',
      yourTurn: (name) => `Your turn, ${name}`,
      biddingNow: (name) => `Bidding: ${name}`,
      selectBid: 'Bid (0–13)',
      nil: 'Nil',
      blindNil: 'Blind nil',
      seeHand: 'See hand',
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
      tricksBidAria: (tricks, bid) => `Tricks ${tricks} / Bid ${bid}`,
      scoreShort: 'Score',
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
      dealingTitle: 'Dealing',
      dealAlignmentLabel: 'Deal direction',
      dealAlignmentSame: 'Same as play',
      dealAlignmentOpposite: 'Opposite to play',
      dealAlignmentSameHint:
        'Deal in the same direction as play. The dealer receives last and the last card sets trump.',
      dealAlignmentOppositeHint:
        'Deal in the opposite direction. The dealer’s first card sets trump.',
      playDirectionReadonlyRight: 'Play: to the right',
      playDirectionReadonlyLeft: 'Play: to the left',
      dealerLabel: 'Dealer:',
      dealPrompt: 'Which way do you want to deal?',
      dealPhysicalRight: 'Anti-clockwise',
      dealPhysicalLeft: 'Clockwise',
      dealConfirm: 'Deal',
      shuffling: (name) => `${name} is shuffling…`,
      cutting: (name) => `${name} cuts the deck`,
      dealerDeciding: (name) => `${name} is deciding which way to deal…`,
      willDealRight: (name) => `${name} will deal anti-clockwise`,
      willDealLeft: (name) => `${name} will deal clockwise`,
      ritualRoleShuffler: 'SHUFFLE',
      ritualRoleCutter: 'CUT',
      ritualRoleDealer: 'DEALER',
      ritualRoleFirstPlayer: 'LEADS',
      distributing: 'Dealing…',
      trumpRevealTitle: 'Trump',
      firstPlayerStarts: (name) => `${name} leads`,
      newGame: 'Start New Game',
      heartsRoundTitle: 'Round complete',
      heartsRoundPoints: 'Points this round',
      heartsTotalScores: 'Total score',
      heartsGameOverTitle: 'Game over',
      heartsWinner: (name) => `${name} wins (lowest score)`,
      heartsLoser: (name) => `${name} lost (100+ points)`,
      resultTie: 'Tie',
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
      description:
        'Digital version of the classic Portuguese card game, designed to play solo against AI or cooperatively with friends around the table.',
      metaPlayers: '4 PLAYERS',
      metaTeams: '2 teams',
      metaCards: '40 cards',
      metaGames: '4 games',
      imagePlaceholderLabel: 'cover / animation',
      imagePlaceholderFormat: 'jpg · png · gif',
      acknowledgmentsTitle: 'Acknowledgments',
      acknowledgmentsText:
        'Thanks to Cursor, Buga, Tico, Maria Francisca and Maria João.',
      assetsTitle: 'Content credits',
      sectionCards: 'Card faces',
      assetsCards:
        'CardMeister (Danny Engelman); AustinGabriel; woodcut-cards (SONDLecT); Saul Spatz SVGCards; Kenney; Webisso LLC.',
      sectionBacks: 'Card backs',
      assetsBacks:
        'Suecão (originals); Sylly / Andrew Tidey (OpenGameArt); woodcut-cards; Saul Spatz; AustinGabriel; Kenney.',
      sectionSfx: 'Sound',
      assetsSfx:
        'Kenney.nl (CC0); Freesound (BMacZero, el_boss, KevinHilt); Suecão (generated sounds).',
      sectionMusic: 'Music',
      assetsMusic:
        'Bundled beds: Pixabay Content License, PeriTune, and StockTune. Additional remote catalog tracks under the same licence families. See repository NOTICE.',
      copyright: 'Suecão · 2026',
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
