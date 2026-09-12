import {
  parseRendererOverrideFromEnv,
  parseRendererOverrideFromQuery,
  resolveRendererOverride,
  resolveTableRenderer
} from './resolveTableRenderer';

describe('resolveTableRenderer', () => {
  describe('Sueca', () => {
    it('defaults to phaser with no override', () => {
      expect(resolveTableRenderer('sueca', { override: null })).toBe('phaser');
      expect(resolveTableRenderer('sueca', { search: '', envOverride: null })).toBe(
        'phaser'
      );
    });

    it('forces phaser with ?renderer=phaser', () => {
      expect(
        resolveTableRenderer('sueca', { search: '?renderer=phaser', envOverride: 'dom' })
      ).toBe('phaser');
    });

    it('forces dom with ?renderer=dom', () => {
      expect(
        resolveTableRenderer('sueca', { search: '?renderer=dom', envOverride: 'phaser' })
      ).toBe('dom');
    });

    it('uses env when query is absent', () => {
      expect(
        resolveTableRenderer('sueca', { search: '', envOverride: 'dom' })
      ).toBe('dom');
      expect(
        resolveTableRenderer('sueca', { search: '', envOverride: 'phaser' })
      ).toBe('phaser');
    });
  });

  describe('Spades', () => {
    it('defaults to phaser with no override', () => {
      expect(resolveTableRenderer('spades', { override: null })).toBe('phaser');
      expect(resolveTableRenderer('spades', { search: '', envOverride: null })).toBe(
        'phaser'
      );
    });

    it('forces phaser with ?renderer=phaser', () => {
      expect(
        resolveTableRenderer('spades', { search: '?renderer=phaser', envOverride: 'dom' })
      ).toBe('phaser');
    });

    it('forces DOM with ?renderer=dom', () => {
      expect(
        resolveTableRenderer('spades', {
          search: '?renderer=dom',
          envOverride: 'phaser'
        })
      ).toBe('dom');
    });
  });

  describe('Hearts', () => {
    it('defaults to phaser with no override', () => {
      expect(resolveTableRenderer('hearts', { override: null })).toBe('phaser');
      expect(resolveTableRenderer('hearts', { search: '', envOverride: null })).toBe(
        'phaser'
      );
    });

    it('forces phaser with ?renderer=phaser', () => {
      expect(
        resolveTableRenderer('hearts', { search: '?renderer=phaser', envOverride: 'dom' })
      ).toBe('phaser');
    });

    it('forces DOM with ?renderer=dom', () => {
      expect(
        resolveTableRenderer('hearts', {
          search: '?renderer=dom',
          envOverride: 'phaser'
        })
      ).toBe('dom');
    });
  });

  describe('King', () => {
    it('defaults to phaser with no override', () => {
      expect(resolveTableRenderer('king', { override: null })).toBe('phaser');
      expect(resolveTableRenderer('king', { search: '', envOverride: null })).toBe(
        'phaser'
      );
    });

    it('forces phaser with ?renderer=phaser', () => {
      expect(
        resolveTableRenderer('king', { search: '?renderer=phaser', envOverride: 'dom' })
      ).toBe('phaser');
    });

    it('forces DOM with ?renderer=dom', () => {
      expect(
        resolveTableRenderer('king', {
          search: '?renderer=dom',
          envOverride: 'phaser'
        })
      ).toBe('dom');
    });
  });

  describe('unknown variant', () => {
    it('returns DOM for non-capable variants', () => {
      expect(resolveTableRenderer('unknown', { override: null })).toBe('dom');
      expect(
        resolveTableRenderer('bridge', { search: '?renderer=phaser' })
      ).toBe('dom');
    });
  });

  describe('precedence', () => {
    it('query wins over env', () => {
      expect(resolveRendererOverride('?renderer=dom', 'phaser')).toBe('dom');
      expect(resolveRendererOverride('?renderer=phaser', 'dom')).toBe('phaser');
    });

    it('ignores unknown renderer query values', () => {
      expect(parseRendererOverrideFromQuery('?renderer=pixi-archive')).toBe(null);
      expect(parseRendererOverrideFromEnv('pixi-archive')).toBe(null);
      expect(
        resolveTableRenderer('sueca', {
          search: '?renderer=pixi-archive',
          envOverride: null
        })
      ).toBe('phaser');
    });
  });
});