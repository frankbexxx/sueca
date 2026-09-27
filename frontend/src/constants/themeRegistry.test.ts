import { describe, expect, it, beforeEach } from 'vitest';
import {
  assertThemeRegistryIntegrity,
  BUILT_IN_THEME_IDS,
  BUILT_IN_THEMES,
  THEME_ZONES,
  getThemeZoneForId,
  isBuiltInThemeId
} from './themeRegistry';
import {
  getActiveTheme,
  resolveActiveTheme,
  setActiveTheme
} from '../services/billingService';

describe('themeRegistry', () => {
  it('has 30 unique built-in themes and intact zone mapping', () => {
    expect(BUILT_IN_THEMES).toHaveLength(30);
    expect(BUILT_IN_THEME_IDS).toHaveLength(30);
    const integrity = assertThemeRegistryIntegrity();
    expect(integrity).toEqual({
      ok: true,
      duplicateIds: [],
      orphansInZones: [],
      missingFromZones: []
    });
  });

  it('maps every theme to a zone', () => {
    for (const id of BUILT_IN_THEME_IDS) {
      expect(isBuiltInThemeId(id)).toBe(true);
      expect(getThemeZoneForId(id)).not.toBeNull();
    }
  });

  it('keeps Base zone first with classic/forest/midnight', () => {
    expect(THEME_ZONES[0]?.zoneEn).toBe('Base');
    expect(THEME_ZONES[0]?.subzones[0]?.ids).toEqual(['classic', 'forest', 'midnight']);
  });
});

describe('theme persistence / resolve', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to classic', () => {
    expect(getActiveTheme()).toBe('classic');
    expect(resolveActiveTheme(null)).toBe('classic');
  });

  it('persists selection immediately', () => {
    setActiveTheme('babylon');
    expect(localStorage.getItem('suecao-theme')).toBe('babylon');
    expect(getActiveTheme()).toBe('babylon');
  });

  it('falls back when saved theme is invalid', () => {
    localStorage.setItem('suecao-theme', 'not-a-theme');
    expect(resolveActiveTheme()).toBe('classic');
    expect(getActiveTheme()).toBe('classic');
  });

  it('falls back when custom id is missing locally', () => {
    localStorage.setItem('suecao-theme', 'custom_missing_xyz');
    expect(resolveActiveTheme()).toBe('classic');
  });

  it('rejects setActiveTheme for unknown ids', () => {
    setActiveTheme('ghost-theme' as never);
    expect(localStorage.getItem('suecao-theme')).toBe('classic');
  });
});
