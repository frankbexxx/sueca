import { partialTeamBids } from './spadesRules';

describe('spadesRules', () => {
  it('partialTeamBids ignores pending and nil bids', () => {
    expect(
      partialTeamBids([3, null, null, 2], ['normal', 'normal', 'nil', 'normal'])
    ).toEqual({ team1: 3, team2: 2 });
  });
});
