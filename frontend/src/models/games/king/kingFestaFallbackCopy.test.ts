import {
  kingFallbackBody,
  kingFallbackOptionsHint,
  kingFallbackReasonMessage,
  resolveKingFallbackReason
} from './kingFestaFallbackCopy';

describe('kingFestaFallbackCopy', () => {
  it('resolves explicit reasons without inventing', () => {
    expect(resolveKingFallbackReason('no_bids', false)).toBe('no_bids');
    expect(resolveKingFallbackReason('negotiation_failed', true)).toBe('negotiation_failed');
    expect(resolveKingFallbackReason('eight_or_nulls_declined', true)).toBe(
      'eight_or_nulls_declined'
    );
  });

  it('infers legacy null reason from bid presence only', () => {
    expect(resolveKingFallbackReason(null, false)).toBe('no_bids');
    expect(resolveKingFallbackReason(null, true)).toBe('negotiation_failed');
  });

  it('distinguishes no-bids vs negotiation vs eight-or-nulls copy', () => {
    expect(kingFallbackReasonMessage('no_bids')).toBe('Ninguém apresentou uma oferta.');
    expect(kingFallbackReasonMessage('negotiation_failed')).toBe(
      'A negociação terminou sem acordo.'
    );
    expect(kingFallbackReasonMessage('eight_or_nulls_declined')).toContain('não ofereceu 8');
    expect(kingFallbackReasonMessage('eight_or_nulls_declined')).toContain('Manténs a festa');
  });

  it('options hint omits 4×3×3 when unavailable', () => {
    expect(kingFallbackOptionsHint(true)).toContain('4×3×3');
    expect(kingFallbackOptionsHint(false)).not.toContain('4×3×3');
  });

  it('body never claims nobody bid after a failed negotiation', () => {
    const body = kingFallbackBody('negotiation_failed', true, true);
    expect(body).toContain('negociação terminou sem acordo');
    expect(body.toLowerCase()).not.toContain('ninguém');
  });
});
