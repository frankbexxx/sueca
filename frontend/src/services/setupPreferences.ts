/**
 * Setup preferences (REL-PLAYERS-01 / REL-DIFF-01).
 *
 * Storage model `sueca-setup-prefs-v1`:
 * - p1Name: global profile identity (shared with Profile)
 * - botNamesByVariant: P2–P4 remembered per game variant (not per rulesPresetId)
 * - difficultyByVariant: AI difficulty remembered per game variant
 *
 * Legacy keys migrated once, then kept in sync for older readers:
 * - `sueca-player-names` → assembled [p1, p2, p3, p4] for the last-touched variant
 * - `sueca-ai-difficulty` → last-selected difficulty (compat)
 */
import { AIDifficulty, GameVariant } from '../types/game';
import { DEFAULT_AI_DIFFICULTY, DEFAULT_PLAYER_NAMES, STORAGE_KEYS } from '../constants/gameConstants';

export const SETUP_PREFS_KEY = 'sueca-setup-prefs-v1';
const LAST_CONFIG_KEY = 'sueca-last-config';

export type BotNameTrio = [string, string, string];

export interface SetupPrefsV1 {
  version: 1;
  p1Name: string;
  botNamesByVariant: Record<GameVariant, BotNameTrio>;
  difficultyByVariant: Record<GameVariant, AIDifficulty>;
}

const VARIANTS: GameVariant[] = ['sueca', 'spades', 'hearts', 'king'];

const DEFAULT_BOTS: BotNameTrio = [
  DEFAULT_PLAYER_NAMES[1],
  DEFAULT_PLAYER_NAMES[2],
  DEFAULT_PLAYER_NAMES[3]
];

function isDifficulty(value: unknown): value is AIDifficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function normalizeBotTrio(raw: unknown, fallback: BotNameTrio = DEFAULT_BOTS): BotNameTrio {
  if (!Array.isArray(raw) || raw.length < 3) return [...fallback] as BotNameTrio;
  return [
    String(raw[0] ?? fallback[0]).trim() || fallback[0],
    String(raw[1] ?? fallback[1]).trim() || fallback[1],
    String(raw[2] ?? fallback[2]).trim() || fallback[2]
  ];
}

function readLegacyLastConfigNames(): string[] | null {
  const raw = localStorage.getItem(LAST_CONFIG_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { playerNames?: string[] };
    if (Array.isArray(parsed.playerNames) && parsed.playerNames.length === 4) {
      return parsed.playerNames.map((n, i) => String(n ?? '').trim() || DEFAULT_PLAYER_NAMES[i]);
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readLegacyLastConfigDifficulty(): AIDifficulty | null {
  const raw = localStorage.getItem(LAST_CONFIG_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { aiDifficulty?: string };
    if (isDifficulty(parsed.aiDifficulty)) return parsed.aiDifficulty;
  } catch {
    /* ignore */
  }
  return null;
}

function readLegacyNames(): string[] | null {
  const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_NAMES);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 4) {
        return parsed.map((n, i) => String(n ?? '').trim() || DEFAULT_PLAYER_NAMES[i]);
      }
    } catch {
      /* ignore */
    }
  }
  return readLegacyLastConfigNames();
}

function readLegacyDifficulty(): AIDifficulty {
  const raw = localStorage.getItem(STORAGE_KEYS.AI_DIFFICULTY);
  if (isDifficulty(raw)) return raw;
  return readLegacyLastConfigDifficulty() ?? DEFAULT_AI_DIFFICULTY;
}

function emptyPrefs(seedNames: string[] | null, seedDiff: AIDifficulty): SetupPrefsV1 {
  const names = seedNames ?? [...DEFAULT_PLAYER_NAMES];
  const bots = normalizeBotTrio([names[1], names[2], names[3]]);
  const botNamesByVariant = {} as Record<GameVariant, BotNameTrio>;
  const difficultyByVariant = {} as Record<GameVariant, AIDifficulty>;
  for (const v of VARIANTS) {
    botNamesByVariant[v] = [...bots] as BotNameTrio;
    difficultyByVariant[v] = seedDiff;
  }
  return {
    version: 1,
    p1Name: String(names[0] ?? '').trim() || DEFAULT_PLAYER_NAMES[0],
    botNamesByVariant,
    difficultyByVariant
  };
}

function parsePrefs(raw: string): SetupPrefsV1 | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SetupPrefsV1>;
    if (parsed?.version !== 1 || typeof parsed.p1Name !== 'string') return null;
    const seedDiff = readLegacyDifficulty();
    const seedNames = readLegacyNames();
    const base = emptyPrefs(seedNames, seedDiff);
    const botNamesByVariant = { ...base.botNamesByVariant };
    const difficultyByVariant = { ...base.difficultyByVariant };
    for (const v of VARIANTS) {
      botNamesByVariant[v] = normalizeBotTrio(
        parsed.botNamesByVariant?.[v],
        base.botNamesByVariant[v]
      );
      const d = parsed.difficultyByVariant?.[v];
      difficultyByVariant[v] = isDifficulty(d) ? d : base.difficultyByVariant[v];
    }
    return {
      version: 1,
      p1Name: parsed.p1Name.trim() || DEFAULT_PLAYER_NAMES[0],
      botNamesByVariant,
      difficultyByVariant
    };
  } catch {
    return null;
  }
}

/** Idempotent: migrates legacy keys once into v1, then returns prefs. */
export function loadSetupPrefs(): SetupPrefsV1 {
  const existing = localStorage.getItem(SETUP_PREFS_KEY);
  if (existing) {
    const parsed = parsePrefs(existing);
    if (parsed) return parsed;
  }
  const migrated = emptyPrefs(readLegacyNames(), readLegacyDifficulty());
  persistSetupPrefs(migrated);
  return migrated;
}

export function persistSetupPrefs(prefs: SetupPrefsV1, syncLegacyForVariant?: GameVariant): void {
  localStorage.setItem(SETUP_PREFS_KEY, JSON.stringify(prefs));
  const variant = syncLegacyForVariant ?? 'sueca';
  const assembled = assemblePlayerNames(prefs, variant);
  localStorage.setItem(STORAGE_KEYS.PLAYER_NAMES, JSON.stringify(assembled));
  localStorage.setItem(STORAGE_KEYS.AI_DIFFICULTY, prefs.difficultyByVariant[variant]);
}

export function assemblePlayerNames(prefs: SetupPrefsV1, variant: GameVariant): string[] {
  const bots = prefs.botNamesByVariant[variant] ?? DEFAULT_BOTS;
  return [prefs.p1Name, bots[0], bots[1], bots[2]];
}

export function getP1Name(): string {
  return loadSetupPrefs().p1Name;
}

export function setP1Name(name: string): void {
  const prefs = loadSetupPrefs();
  const trimmed = name.trim() || DEFAULT_PLAYER_NAMES[0];
  prefs.p1Name = trimmed;
  persistSetupPrefs(prefs);
  const raw = localStorage.getItem(LAST_CONFIG_KEY);
  if (raw) {
    try {
      const last = JSON.parse(raw) as { playerNames?: string[] };
      if (Array.isArray(last.playerNames) && last.playerNames.length === 4) {
        const updatedNames = [...last.playerNames];
        updatedNames[0] = trimmed;
        localStorage.setItem(
          LAST_CONFIG_KEY,
          JSON.stringify({ ...last, playerNames: updatedNames })
        );
      }
    } catch {
      /* ignore */
    }
  }
}

export function getBotNamesForVariant(variant: GameVariant): BotNameTrio {
  return loadSetupPrefs().botNamesByVariant[variant] ?? [...DEFAULT_BOTS] as BotNameTrio;
}

export function setBotNamesForVariant(variant: GameVariant, bots: BotNameTrio): void {
  const prefs = loadSetupPrefs();
  prefs.botNamesByVariant[variant] = normalizeBotTrio(bots);
  persistSetupPrefs(prefs, variant);
}

export function getDifficultyForVariant(variant: GameVariant): AIDifficulty {
  return loadSetupPrefs().difficultyByVariant[variant] ?? DEFAULT_AI_DIFFICULTY;
}

export function setDifficultyForVariant(variant: GameVariant, difficulty: AIDifficulty): void {
  const prefs = loadSetupPrefs();
  prefs.difficultyByVariant[variant] = isDifficulty(difficulty)
    ? difficulty
    : DEFAULT_AI_DIFFICULTY;
  persistSetupPrefs(prefs, variant);
}

/** Build the four seat names for a variant (P1 global + per-game bots). */
export function getPlayerNamesForVariant(variant: GameVariant): string[] {
  return assemblePlayerNames(loadSetupPrefs(), variant);
}

/**
 * Persist full seat list: index 0 → global P1; 1–3 → bots for this variant.
 */
export function savePlayerNamesForVariant(variant: GameVariant, names: string[]): void {
  const prefs = loadSetupPrefs();
  const cleaned = [0, 1, 2, 3].map((i) => {
    const trimmed = String(names[i] ?? '').trim();
    return trimmed || DEFAULT_PLAYER_NAMES[i];
  });
  prefs.p1Name = cleaned[0];
  prefs.botNamesByVariant[variant] = [cleaned[1], cleaned[2], cleaned[3]];
  persistSetupPrefs(prefs, variant);
}
