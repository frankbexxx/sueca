export type PlayerType = 'human' | 'ai' | 'remote';
export type PlayerConnectionStatus = 'connected' | 'disconnected' | 'waiting';

export interface MultiplayerPlayerInfo {
  index: number;
  name: string;
  type: PlayerType;
  status: PlayerConnectionStatus;
}

export interface MultiplayerMessage<T = unknown> {
  type: string;
  payload: T;
}

export interface MultiplayerStateUpdate {
  gameState: unknown;
  players: MultiplayerPlayerInfo[];
  sessionId: string;
}

export interface MultiplayerClientCallbacks {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (message: string) => void;
  onStateUpdate?: (update: MultiplayerStateUpdate) => void;
  onSessionInfo?: (sessionId: string, players: MultiplayerPlayerInfo[], localPlayerIndex?: number) => void;
  onPlayerListUpdate?: (players: MultiplayerPlayerInfo[]) => void;
  onPlayerAction?: (payload: { playerIndex: number; card: string; action: string }) => void;
}

const DEFAULT_MULTIPLAYER_URL = process.env.REACT_APP_MULTIPLAYER_URL || 'ws://127.0.0.1:8000/ws';

export class MultiplayerClient {
  private socket: WebSocket | null = null;
  private callbacks: MultiplayerClientCallbacks;
  private sessionId?: string;
  private playerName: string;
  private playerIndex: number;
  private pendingMessages: MultiplayerMessage[] = [];

  constructor(playerName: string, playerIndex: number, callbacks: MultiplayerClientCallbacks = {}) {
    this.playerName = playerName;
    this.playerIndex = playerIndex;
    this.callbacks = callbacks;
  }

  connect(url: string = DEFAULT_MULTIPLAYER_URL): void {
    if (this.socket) {
      this.socket.close();
    }

    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () => {
      this.callbacks.onOpen?.();
      this.flushPendingMessages();
    });

    this.socket.addEventListener('message', (event) => {
      try {
        const msg: MultiplayerMessage = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (err) {
        this.callbacks.onError?.('Invalid multiplayer message format');
      }
    });

    this.socket.addEventListener('close', () => {
      this.callbacks.onClose?.();
      this.socket = null;
    });

    this.socket.addEventListener('error', () => {
      this.callbacks.onError?.('Multiplayer connection error');
    });
  }

  private handleMessage(msg: MultiplayerMessage): void {
    switch (msg.type) {
      case 'session_created': {
        const payload = msg.payload as { sessionId: string; players: MultiplayerPlayerInfo[]; localPlayerIndex?: number };
        this.sessionId = payload.sessionId;
        this.callbacks.onSessionInfo?.(payload.sessionId, payload.players, payload.localPlayerIndex);
        break;
      }
      case 'session_joined': {
        const payload = msg.payload as { sessionId: string; players: MultiplayerPlayerInfo[]; localPlayerIndex?: number };
        this.sessionId = payload.sessionId;
        this.callbacks.onSessionInfo?.(payload.sessionId, payload.players, payload.localPlayerIndex);
        break;
      }
      case 'player_list': {
        const payload = msg.payload as { players: MultiplayerPlayerInfo[] };
        this.callbacks.onPlayerListUpdate?.(payload.players);
        break;
      }
      case 'state_update': {
        const payload = msg.payload as MultiplayerStateUpdate;
        this.callbacks.onStateUpdate?.(payload);
        break;
      }
      case 'player_action': {
        const payload = msg.payload as { playerIndex: number; card: string; action: string };
        this.callbacks.onPlayerAction?.(payload);
        break;
      }
      case 'error': {
        const payload = msg.payload as { message: string };
        this.callbacks.onError?.(payload.message);
        break;
      }
      default:
        break;
    }
  }

  private flushPendingMessages(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.socket.send(JSON.stringify(message));
      }
    }
  }

  sendMessage(message: MultiplayerMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.pendingMessages.push(message);
      return;
    }
    this.socket.send(JSON.stringify(message));
  }

  createSession(): void {
    this.sendMessage({
      type: 'create_session',
      payload: {
        playerName: this.playerName,
        playerIndex: this.playerIndex
      }
    });
  }

  joinSession(sessionId: string): void {
    this.sendMessage({
      type: 'join_session',
      payload: {
        sessionId,
        playerName: this.playerName
      }
    });
  }

  sendPlayerAction(action: string, payload: unknown): void {
    this.sendMessage({
      type: action,
      payload
    });
  }

  syncState(gameState: unknown): void {
    this.sendMessage({
      type: 'state_sync',
      payload: {
        gameState,
        sessionId: this.sessionId
      }
    });
  }

  close(): void {
    if (this.socket) {
      this.socket.close();
    }
    this.socket = null;
  }
}
