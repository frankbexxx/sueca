import { generateSeededDeal, normalizeSeed } from './seededRandom';

describe('seededRandom helpers', () => {
  it('normalizeSeed is stable for strings', () => {
    expect(normalizeSeed('lab-42')).toBe(normalizeSeed('lab-42'));
  });

  it('sueca deck has 40 cards', () => {
    const result = generateSeededDeal({ variant: 'sueca', seed: 1 });
    expect(result.cardOrder).toHaveLength(40);
  });

  it('king deck has 52 cards', () => {
    const result = generateSeededDeal({ variant: 'king', seed: 1 });
    expect(result.cardOrder).toHaveLength(52);
  });
});
