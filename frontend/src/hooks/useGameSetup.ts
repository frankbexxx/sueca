import { useState, useEffect } from 'react';
import { AIDifficulty, DealingMethod, GameVariant } from '../types/game';
import { GameConfig } from '../types/gameConfig';
import { getAvailableGames } from '../constants/gameMetadata';
import { MULTIPLAYER_ENABLED } from '../config/features';
import { loadLastConfig } from '../services/gameSessionStorage';

export function useGameSetup(initialVariant?: GameVariant) {
  const last = loadLastConfig();

  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('sueca-player-names');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) return parsed;
      } catch {
        /* ignore */
      }
    }
    return last?.playerNames ?? ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
  });

  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>(
    () => (localStorage.getItem('sueca-ai-difficulty') as AIDifficulty) || last?.aiDifficulty || 'medium'
  );

  const [dealingMethod, setDealingMethod] = useState<DealingMethod>(
    () => (localStorage.getItem('sueca-dealing-method') as DealingMethod) || last?.dealingMethod || 'A'
  );

  const [multiplayerEnabled, setMultiplayerEnabled] = useState(
    () => localStorage.getItem('sueca-multiplayer-enabled') === 'true'
  );

  const [multiplayerJoinMode, setMultiplayerJoinMode] = useState(
    () => localStorage.getItem('sueca-multiplayer-join-mode') === 'true'
  );

  const [multiplayerSessionId, setMultiplayerSessionId] = useState(
    () => localStorage.getItem('sueca-multiplayer-session-id') || ''
  );

  const [gameVariant, setGameVariant] = useState<GameVariant>(() => {
    const saved = localStorage.getItem('sueca-game-variant');
    const allowed = getAvailableGames().map((g) => g.variant);
    if (initialVariant && allowed.includes(initialVariant)) return initialVariant;
    if (saved && allowed.includes(saved as GameVariant)) return saved as GameVariant;
    return last?.gameVariant ?? 'sueca';
  });

  useEffect(() => {
    localStorage.setItem('sueca-player-names', JSON.stringify(playerNames));
  }, [playerNames]);

  useEffect(() => {
    localStorage.setItem('sueca-ai-difficulty', aiDifficulty);
  }, [aiDifficulty]);

  useEffect(() => {
    localStorage.setItem('sueca-dealing-method', dealingMethod);
  }, [dealingMethod]);

  useEffect(() => {
    localStorage.setItem('sueca-multiplayer-enabled', String(multiplayerEnabled));
  }, [multiplayerEnabled]);

  useEffect(() => {
    localStorage.setItem('sueca-multiplayer-join-mode', String(multiplayerJoinMode));
  }, [multiplayerJoinMode]);

  useEffect(() => {
    localStorage.setItem('sueca-multiplayer-session-id', multiplayerSessionId);
  }, [multiplayerSessionId]);

  useEffect(() => {
    localStorage.setItem('sueca-game-variant', gameVariant);
  }, [gameVariant]);

  useEffect(() => {
    const allowed = getAvailableGames().map((g) => g.variant);
    if (!allowed.includes(gameVariant)) setGameVariant('sueca');
  }, [gameVariant]);

  const buildConfig = (): GameConfig => {
    const cleanedNames = playerNames.map((name, index) => {
      const trimmed = name.trim();
      return trimmed || `Player ${index + 1}`;
    });
    return {
      playerNames: cleanedNames,
      aiDifficulty,
      dealingMethod,
      multiplayerEnabled: MULTIPLAYER_ENABLED && multiplayerEnabled,
      multiplayerSessionId: multiplayerSessionId.trim() || undefined,
      multiplayerJoinMode,
      gameVariant
    };
  };

  return {
    playerNames,
    setPlayerNames,
    aiDifficulty,
    setAIDifficulty,
    dealingMethod,
    setDealingMethod,
    multiplayerEnabled,
    setMultiplayerEnabled,
    multiplayerJoinMode,
    setMultiplayerJoinMode,
    multiplayerSessionId,
    setMultiplayerSessionId,
    gameVariant,
    setGameVariant,
    buildConfig
  };
}
