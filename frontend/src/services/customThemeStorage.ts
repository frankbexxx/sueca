import { CustomThemeData } from '../types/theme';

const STORAGE_KEY = 'suecao-custom-themes';
const MAX_THEMES = 10;

export function loadCustomThemes(): CustomThemeData[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveCustomTheme(theme: CustomThemeData): void {
  const existing = loadCustomThemes().filter((t) => t.id !== theme.id);
  existing.unshift(theme);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, MAX_THEMES)));
}

export function deleteCustomTheme(id: string): void {
  const themes = loadCustomThemes().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

export function getCustomTheme(id: string): CustomThemeData | null {
  return loadCustomThemes().find((t) => t.id === id) ?? null;
}
