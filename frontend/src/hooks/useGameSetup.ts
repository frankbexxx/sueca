import { useState, useEffect, useCallback } from 'react';
import { AIDifficulty, GameVariant, PlayDirection } from '../types/game';
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
import { DEFAULT_PLAYER_NAMES, STORAGE_KEYS } from '../constants/gameConstants';
import { bumpSyncablePrefsRevision } from '../services/syncablePrefsRevision';

function readStoredPlayDirection(): PlayDirection {
  const raw = localStorage.getItem(STORAGE_KEYS.PLAY_DIRECTION);
  if (raw === 'left' || raw === 'right') return raw;
  const last = loadLastConfig();
  if (last?.playDirection === 'left' || last?.playDirection === 'right') {
    return last.playDirection;
  }
  return 'right';
}

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

  /** ARCH-SUECA-06 — session play direction; default RIGHT. Not inferred from Method A/B. */
  const [playDirection, setPlayDirectionState] = useState<PlayDirection>(() =>
    readStoredPlayDirection()
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
        return next.map((n) => n);
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

  const setPlayDirection = useCallback((direction: PlayDirection) => {
    setPlayDirectionState(direction === 'left' ? 'left' : 'right');
  }, []);

  const setGameVariant = (variant: GameVariant) => {
    setGameVariantState(variant);
    setRulesPresetId((prev) => resolvePresetId(variant, prev));
    const names = getPlayerNamesForVariant(variant);
    names[0] = getP1Name();
    setPlayerNamesState(names);
    setAIDifficultyState(getDifficultyForVariant(variant));
  };

  useEffect(() => {
    const prev = localStorage.getItem(STORAGE_KEYS.PLAY_DIRECTION);
    localStorage.setItem(STORAGE_KEYS.PLAY_DIRECTION, playDirection);
    // SYNC-01A — bump only on real user change, not first hydrate.
    if (prev !== null && prev !== playDirection) {
      bumpSyncablePrefsRevision();
    }
  }, [playDirection]);

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
    const play = playDirection === 'left' ? 'left' : 'right';
    return {
      playerNames: cleanedNames,
      aiDifficulty,
      playDirection: play,
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
    playDirection,
    setPlayDirection,
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
