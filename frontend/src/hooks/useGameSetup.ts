import { useState, useEffect } from 'react';
import { AIDifficulty, DealingMethod, GameVariant } from '../types/game';
import { GameConfig } from '../types/gameConfig';
import { getAvailableGames } from '../constants/gameMetadata';
import {
  getDefaultPresetId,
  getPresetsForVariant,
  resolvePresetId,
  RulesPresetId
} from '../constants/rulesPresets';
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

  const [multiplayerSessionId, setMultiplayerSessionId] = useState(
    () => localStorage.getItem('sueca-multiplayer-session-id') || ''
  );

  const [gameVariant, setGameVariantState] = useState<GameVariant>(() => {
    const saved = localStorage.getItem('sueca-game-variant');
    const allowed = getAvailableGames().map((g) => g.variant);
    if (initialVariant && allowed.includes(initialVariant)) return initialVariant;
    if (saved && allowed.includes(saved as GameVariant)) return saved as GameVariant;
    return last?.gameVariant ?? 'sueca';
  });

  const [rulesPresetId, setRulesPresetId] = useState<RulesPresetId>(() => {
    const saved = localStorage.getItem('sueca-rules-preset');
    const variant =
      initialVariant ??
      (localStorage.getItem('sueca-game-variant') as GameVariant | null) ??
      last?.gameVariant ??
      'sueca';
    if (last?.rulesPresetId) {
      return resolvePresetId(variant, last.rulesPresetId);
    }
    return resolvePresetId(variant, saved ?? undefined);
  });

  const setGameVariant = (variant: GameVariant) => {
    setGameVariantState(variant);
    setRulesPresetId((prev) => resolvePresetId(variant, prev));
  };

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
    localStorage.setItem('sueca-multiplayer-session-id', multiplayerSessionId);
  }, [multiplayerSessionId]);

  useEffect(() => {
    localStorage.setItem('sueca-game-variant', gameVariant);
  }, [gameVariant]);

  useEffect(() => {
    localStorage.setItem('sueca-rules-preset', rulesPresetId);
  }, [rulesPresetId]);

  useEffect(() => {
    const allowed = getPresetsForVariant(gameVariant).map((p) => p.id);
    if (!allowed.includes(rulesPresetId)) {
      setRulesPresetId(getDefaultPresetId(gameVariant));
    }
  }, [gameVariant, rulesPresetId]);

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
      gameVariant,
      rulesPresetId: resolvePresetId(gameVariant, rulesPresetId)
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
    multiplayerSessionId,
    setMultiplayerSessionId,
    gameVariant,
    setGameVariant,
    rulesPresetId,
    setRulesPresetId,
    presetOptions: getPresetsForVariant(gameVariant),
    buildConfig
  };
}
