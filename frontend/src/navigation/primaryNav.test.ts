import { describe, expect, it } from 'vitest';
import { PRIMARY_TABS } from '../types/navigation';
import { tabRootRoute } from '../navigation/shellNavigation';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

describe('Bottom nav IA (REL-HOME-01)', () => {
  it('primary tabs are exactly Home · Actividade · Personalizar · Mais', () => {
    expect(PRIMARY_TABS).toEqual(['home', 'activity', 'personalize', 'more']);
  });

  it('tab roots map to hubs', () => {
    expect(tabRootRoute('home').tab).toBe('home');
    expect(tabRootRoute('activity')).toEqual({ tab: 'activity', screen: 'hub' });
    expect(tabRootRoute('personalize')).toEqual({ tab: 'personalize', screen: 'hub' });
    expect(tabRootRoute('more')).toEqual({ tab: 'more', screen: 'hub' });
  });

  it('BottomNav renders four labelled items', () => {
    const css = readFileSync(join(here, '../components/navigation/BottomNav.tsx'), 'utf8');
    expect(css).toContain('Actividade');
    expect(css).toContain('Personalizar');
    expect(css).toContain('Mais');
    expect(css).not.toContain('bottom-nav-icon');
  });
});
