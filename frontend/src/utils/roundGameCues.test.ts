import { resolveHumanGameAudioResult, shouldPlayRoundEndCue } from './roundGameCues';
import { individualMatchResult, teamMatchResult } from '../models/matchResult';

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
  it('sueca/spades win and lose from the team result', () => {
    expect(
      resolveHumanGameAudioResult({
        matchResult: teamMatchResult(1),
        localPlayerIndex: 0,
        localTeam: 1
      })
    ).toBe('win');
    expect(
      resolveHumanGameAudioResult({
        matchResult: teamMatchResult(2),
        localPlayerIndex: 0,
        localTeam: 1
      })
    ).toBe('lose');
  });

  it('hearts and king: unique seat wins; any shared winning score is a draw', () => {
    expect(
      resolveHumanGameAudioResult({
        matchResult: individualMatchResult([0]),
        localPlayerIndex: 0,
        localTeam: 1
      })
    ).toBe('win');
    expect(
      resolveHumanGameAudioResult({
        matchResult: individualMatchResult([0, 1]),
        localPlayerIndex: 0,
        localTeam: 1
      })
    ).toBe('draw');
    expect(
      resolveHumanGameAudioResult({
        matchResult: individualMatchResult([1]),
        localPlayerIndex: 1,
        localTeam: 2
      })
    ).toBe('win');
    expect(
      resolveHumanGameAudioResult({
        matchResult: individualMatchResult([1, 2]),
        localPlayerIndex: 0,
        localTeam: 1
      })
    ).toBe('draw');
  });
});
