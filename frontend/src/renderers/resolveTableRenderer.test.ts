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

  describe('Hearts / King flag-only Phaser', () => {
    it.each(['hearts', 'king'] as const)('%s defaults to DOM', (variant) => {
      expect(resolveTableRenderer(variant, { override: null })).toBe('dom');
      expect(resolveTableRenderer(variant, { search: '', envOverride: null })).toBe(
        'dom'
      );
    });

    it.each(['hearts', 'king'] as const)(
      '%s enables Phaser only with explicit override',
      (variant) => {
        expect(
          resolveTableRenderer(variant, { search: '?renderer=phaser' })
        ).toBe('phaser');
        expect(
          resolveTableRenderer(variant, { envOverride: 'phaser' })
        ).toBe('phaser');
      }
    );

    it.each(['hearts', 'king'] as const)(
      '%s forces DOM with ?renderer=dom',
      (variant) => {
        expect(
          resolveTableRenderer(variant, {
            search: '?renderer=dom',
            envOverride: 'phaser'
          })
        ).toBe('dom');
      }
    );
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
