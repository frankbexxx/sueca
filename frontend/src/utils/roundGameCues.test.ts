import { resolveHumanGameAudioResult, shouldPlayRoundEndCue } from './roundGameCues';

describe('shouldPlayRoundEndCue', () => {
  it('plays once on rising edge when not game over', () => {
    expect(
      shouldPlayRoundEndCue({
        prevWaitingForRoundEnd: false,
        waitingForRoundEnd: true,
        isGameOver: false
      })
    ).toBe(true);
  });

  it('does not play on game over even if waitingForRoundEnd', () => {
    expect(
      shouldPlayRoundEndCue({
        prevWaitingForRoundEnd: false,
        waitingForRoundEnd: true,
        isGameOver: true
      })
    ).toBe(false);
  });

  it('does not play on resume/hydration (prev null) or while already waiting', () => {
    expect(
      shouldPlayRoundEndCue({
        prevWaitingForRoundEnd: null,
        waitingForRoundEnd: true,
        isGameOver: false
      })
    ).toBe(false);
    expect(
      shouldPlayRoundEndCue({
        prevWaitingForRoundEnd: true,
        waitingForRoundEnd: true,
        isGameOver: false
      })
    ).toBe(false);
  });

  it('does not play when waiting clears', () => {
    expect(
      shouldPlayRoundEndCue({
        prevWaitingForRoundEnd: true,
        waitingForRoundEnd: false,
        isGameOver: false
      })
    ).toBe(false);
  });
});

describe('resolveHumanGameAudioResult', () => {
  const players = [{ team: 1 as const }, { team: 2 as const }, { team: 1 as const }, { team: 2 as const }];

  it('sueca/spades win and lose from team winner', () => {
    expect(
      resolveHumanGameAudioResult({
        variant: 'sueca',
        winner: 1,
        localPlayerIndex: 0,
        players
      })
    ).toBe('win');
    expect(
      resolveHumanGameAudioResult({
        variant: 'spades',
        winner: 2,
        localPlayerIndex: 0,
        players
      })
    ).toBe('lose');
  });

  it('hearts: lowest score wins; tied best is draw', () => {
    expect(
      resolveHumanGameAudioResult({
        variant: 'hearts',
        winner: 1,
        localPlayerIndex: 0,
        players,
        individualScores: [50, 80, 90, 100]
      })
    ).toBe('win');
    expect(
      resolveHumanGameAudioResult({
        variant: 'hearts',
        winner: 1,
        localPlayerIndex: 0,
        players,
        individualScores: [50, 50, 90, 100]
      })
    ).toBe('draw');
  });

  it('king: highest score wins; tied best is draw', () => {
    expect(
      resolveHumanGameAudioResult({
        variant: 'king',
        winner: 1,
        localPlayerIndex: 1,
        players,
        individualScores: [10, 40, 20, 5]
      })
    ).toBe('win');
    expect(
      resolveHumanGameAudioResult({
        variant: 'king',
        winner: 1,
        localPlayerIndex: 0,
        players,
        individualScores: [40, 40, 10, 5]
      })
    ).toBe('draw');
  });
});
