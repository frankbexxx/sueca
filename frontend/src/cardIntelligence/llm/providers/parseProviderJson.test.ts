import { parseProviderJson } from './parseProviderJson';

describe('parseProviderJson', () => {
  it('parses direct JSON', () => {
    const parsed = parseProviderJson(
      JSON.stringify({
        selectedCardIndex: 1,
        confidence: 'high',
        reasonShort: 'Play low heart',
        consideredMetricIds: ['H10'],
        fallbackRecommended: false,
      })
    );
    expect(parsed).toEqual({
      selectedCardIndex: 1,
      selectedCard: null,
      confidence: 'high',
      reasonShort: 'Play low heart',
      consideredMetricIds: ['H10'],
      fallbackRecommended: false,
    });
  });

  it('extracts JSON from prose wrapper', () => {
    const parsed = parseProviderJson(
      'Here is my answer:\n{"selectedCardIndex":0,"confidence":"medium","reasonShort":"Safe lead","consideredMetricIds":[],"fallbackRecommended":false}\nThanks.'
    );
    expect(parsed?.selectedCardIndex).toBe(0);
    expect(parsed?.reasonShort).toBe('Safe lead');
  });

  it('returns null for invalid JSON', () => {
    expect(parseProviderJson('not json')).toBeNull();
  });

  it('returns null when reasonShort missing', () => {
    expect(
      parseProviderJson(JSON.stringify({ selectedCardIndex: 0, confidence: 'low' }))
    ).toBeNull();
  });

  it('truncates reasonShort', () => {
    const parsed = parseProviderJson(
      JSON.stringify({
        selectedCardIndex: 0,
        confidence: 'low',
        reasonShort: 'x'.repeat(200),
        consideredMetricIds: [],
      }),
      20
    );
    expect(parsed?.reasonShort.length).toBeLessThanOrEqual(20);
  });
});
