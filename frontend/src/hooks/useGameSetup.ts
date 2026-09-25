import { useState, useEffect, useCallback } from 'react';
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
import {
  getDifficultyForVariant,
  getP1Name,
  getPlayerNamesForVariant,
  savePlayerNamesForVariant,
  setDifficultyForVariant
} from '../services/setupPreferences';
import { DEFAULT_PLAYER_NAMES } from '../constants/gameConstants';

export function useGameSetup(
  initialVariant?: GameVariant,
  initialRulesPresetId?: RulesPresetId
) {
  const last = loadLastConfig();

  const [gameVariant, setGameVariantState] = useState<GameVariant>(() => {
    const saved = localStorage.getItem('sueca-game-variant');
    const allowed = getAvailableGames().map((g) => g.variant);
    if (initialVariant && allowed.includes(initialVariant)) return initialVariant;
    if (saved && allowed.includes(saved as GameVariant)) return saved as GameVariant;
    return last?.gameVariant ?? 'sueca';
  });

  const resolveInitialVariant = (): GameVariant => {
    const allowed = getAvailableGames().map((g) => g.variant);
    if (initialVariant && allowed.includes(initialVariant)) return initialVariant;
    return gameVariant;
  };

  const [playerNames, setPlayerNamesState] = useState<string[]>(() => {
    const variant = resolveInitialVariant();
    const names = getPlayerNamesForVariant(variant);
    // Force P1 from global identity on every mount (variant remounts).
    names[0] = getP1Name();
    return names;
  });

  const [aiDifficulty, setAIDifficultyState] = useState<AIDifficulty>(() =>
    getDifficultyForVariant(resolveInitialVariant())
  );

  const [dealingMethod, setDealingMethod] = useState<DealingMethod>(
    () =>
      (localStorage.getItem('sueca-dealing-method') as DealingMethod) ||
      last?.dealingMethod ||
      'A'
  );

  const [multiplayerEnabled, setMultiplayerEnabled] = useState(
    () => localStorage.getItem('sueca-multiplayer-enabled') === 'true'
  );

  const [multiplayerSessionId, setMultiplayerSessionId] = useState(
    () => localStorage.getItem('sueca-multiplayer-session-id') || ''
  );

  const [rulesPresetId, setRulesPresetId] = useState<RulesPresetId>(() => {
    const variant =
      initialVariant ??
      (localStorage.getItem('sueca-game-variant') as GameVariant | null) ??
      last?.gameVariant ??
      'sueca';
    if (initialRulesPresetId) {
      return resolvePresetId(variant, initialRulesPresetId);
    }
    const saved = localStorage.getItem('sueca-rules-preset');
    if (last?.rulesPresetId && last.gameVariant === variant) {
      return resolvePresetId(variant, last.rulesPresetId);
    }
    return resolvePresetId(variant, saved ?? undefined);
  });

  const setPlayerNames = useCallback(
    (names: string[] | ((prev: string[]) => string[])) => {
      setPlayerNamesState((prev) => {
        const next = typeof names === 'function' ? names(prev) : names;
        savePlayerNamesForVariant(gameVariant, next);
        return next.map((n, i) => n);
      });
    },
    [gameVariant]
  );

  const setAIDifficulty = useCallback(
    (difficulty: AIDifficulty) => {
      setAIDifficultyState(difficulty);
      setDifficultyForVariant(gameVariant, difficulty);
    },
    [gameVariant]
  );

  const setGameVariant = (variant: GameVariant) => {
    setGameVariantState(variant);
    setRulesPresetId((prev) => resolvePresetId(variant, prev));
    const names = getPlayerNamesForVariant(variant);
    names[0] = getP1Name();
    setPlayerNamesState(names);
    setAIDifficultyState(getDifficultyForVariant(variant));
  };

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
      return trimmed || DEFAULT_PLAYER_NAMES[index];
    });
    savePlayerNamesForVariant(gameVariant, cleanedNames);
    setDifficultyForVariant(gameVariant, aiDifficulty);
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
    /** King mode from Home is locked — no in-Setup change. */
    lockRulesPreset: gameVariant === 'king',
    buildConfig
  };
}
