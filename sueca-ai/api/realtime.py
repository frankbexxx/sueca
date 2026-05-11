import json
import uuid
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect


class MultiplayerPlayerInfo:
    def __init__(self, index: int, name: str, player_type: str = 'remote'):
        self.index = index
        self.name = name
        self.type = player_type
        self.status = 'connected'

    def to_dict(self) -> Dict[str, Any]:
        return {
            'index': self.index,
            'name': self.name,
            'type': self.type,
            'status': self.status,
        }


class GameSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.players: List[MultiplayerPlayerInfo] = []
        self.connections: Dict[WebSocket, int] = {}
        self.game_state: Optional[Dict[str, Any]] = None

    def available_player_index(self) -> Optional[int]:
        used = {player.index for player in self.players}
        for index in range(4):
            if index not in used:
                return index
        return None

    def to_player_list(self) -> List[Dict[str, Any]]:
        return [player.to_dict() for player in self.players]

    def add_player(self, websocket: WebSocket, name: str, player_index: Optional[int] = None) -> int:
        index = player_index if player_index is not None else self.available_player_index()
        if index is None:
            raise ValueError('Session is full')

        self.players.append(MultiplayerPlayerInfo(index=index, name=name))
        self.connections[websocket] = index
        return index

    def remove_connection(self, websocket: WebSocket) -> None:
        if websocket not in self.connections:
            return
        index = self.connections.pop(websocket)
        self.players = [player for player in self.players if player.index != index]

    def get_local_player_index(self, websocket: WebSocket) -> Optional[int]:
        return self.connections.get(websocket)

    async def broadcast(self, message: Dict[str, Any]) -> None:
        for connection in list(self.connections.keys()):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass


class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, GameSession] = {}

    def create_session(self) -> GameSession:
        session_id = uuid.uuid4().hex[:8]
        self.sessions[session_id] = GameSession(session_id)
        return self.sessions[session_id]

    def get_session(self, session_id: str) -> Optional[GameSession]:
        return self.sessions.get(session_id)

    def remove_session(self, session_id: str) -> None:
        if session_id in self.sessions:
            del self.sessions[session_id]

    def find_session_by_connection(self, websocket: WebSocket) -> Optional[GameSession]:
        for session in self.sessions.values():
            if websocket in session.connections:
                return session
        return None


manager = SessionManager()


def register_realtime_routes(app: FastAPI) -> None:

    @app.websocket('/ws')
    async def websocket_endpoint(websocket: WebSocket):
        await websocket.accept()
        session: Optional[GameSession] = None

        try:
            while True:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({
                        'type': 'error',
                        'payload': {'message': 'Invalid JSON format'}
                    }))
                    continue

                msg_type = message.get('type')
                payload = message.get('payload', {})

                if msg_type == 'create_session':
                    player_name = payload.get('playerName', 'Player')
                    session = manager.create_session()
                    local_index = session.add_player(websocket, player_name, player_index=0)
                    await websocket.send_text(json.dumps({
                        'type': 'session_created',
                        'payload': {
                            'sessionId': session.session_id,
                            'players': session.to_player_list(),
                            'localPlayerIndex': local_index
                        }
                    }))
                    await session.broadcast({
                        'type': 'player_list',
                        'payload': {'players': session.to_player_list()}
                    })
                    continue

                if msg_type == 'join_session':
                    session_id = payload.get('sessionId')
                    player_name = payload.get('playerName', 'Player')
                    session = manager.get_session(session_id)
                    if not session:
                        await websocket.send_text(json.dumps({
                            'type': 'error',
                            'payload': {'message': 'Sessão não encontrada'}
                        }))
                        continue
                    try:
                        local_index = session.add_player(websocket, player_name)
                    except ValueError:
                        await websocket.send_text(json.dumps({
                            'type': 'error',
                            'payload': {'message': 'Sessão cheia'}
                        }))
                        continue
                    await websocket.send_text(json.dumps({
                        'type': 'session_joined',
                        'payload': {
                            'sessionId': session.session_id,
                            'players': session.to_player_list(),
                            'localPlayerIndex': local_index
                        }
                    }))
                    await session.broadcast({
                        'type': 'player_list',
                        'payload': {'players': session.to_player_list()}
                    })
                    continue

                if msg_type == 'state_sync':
                    session_id = payload.get('sessionId')
                    session = manager.get_session(session_id)
                    if not session:
                        await websocket.send_text(json.dumps({
                            'type': 'error',
                            'payload': {'message': 'Sessão não encontrada'}
                        }))
                        continue
                    session.game_state = payload.get('gameState')
                    await session.broadcast({
                        'type': 'state_update',
                        'payload': {
                            'gameState': session.game_state,
                            'players': session.to_player_list(),
                            'sessionId': session.session_id
                        }
                    })
                    continue

                if msg_type == 'play_card':
                    session = manager.find_session_by_connection(websocket)
                    if not session:
                        await websocket.send_text(json.dumps({
                            'type': 'error',
                            'payload': {'message': 'Sessão não encontrada'}
                        }))
                        continue
                    action_payload = payload
                    await session.broadcast({
                        'type': 'player_action',
                        'payload': action_payload
                    })
                    continue

                await websocket.send_text(json.dumps({
                    'type': 'error',
                    'payload': {'message': f'Unknown message type: {msg_type}'}
                }))

        except WebSocketDisconnect:
            session = session or manager.find_session_by_connection(websocket)
            if session:
                session.remove_connection(websocket)
                if not session.connections:
                    manager.remove_session(session.session_id)
                else:
                    await session.broadcast({
