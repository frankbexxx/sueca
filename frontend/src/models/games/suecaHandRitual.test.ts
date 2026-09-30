/**
 * UX-SUECA-01/03/04/06 — hand ritual + post-deal presentation helpers.
 */
import { describe, expect, it } from 'vitest';
import {
  alignmentFromPhysicalDealChoice,
  isSuecaDealerAi,
  nextSuecaPostDealPhase,
  physicalDealFromAlignment,
  pickAiPhysicalDealDirection,
  postDealDurationMs,
  postDealFocusForPhase,
  postDealHandsHidden,
  postDealPlayLocked,
  postDealTrumpHudHidden,
  resolvePostDealTimings,
  resolveRitualTimings,
  ritualDelayMs,
  ritualFocusForPhase,
  ritualSeatsForDealer,
  shouldMountSuecaDealRitual,
  suecaPresentationPlayReady,
  SUECA_POST_DEAL_REDUCED_TIMING,
  SUECA_POST_DEAL_TIMING,
  SUECA_RITUAL_REDUCED_TIMING,
  SUECA_RITUAL_TIMING
} from './suecaHandRitual';
import {
  cutterForDealer,
  shufflerForDealer,
  allSeats,
  type PlayDirection
} from './suecaRules';

const SEATS = allSeats();
const PLAYS: PlayDirection[] = ['right', 'left'];

describe('UX-SUECA-01/03/06 suecaHandRitual', () => {
  it('ritual seats match shufflerForDealer / cutterForDealer for all dealers', () => {
    for (const dealer of SEATS) {
      const seats = ritualSeatsForDealer(dealer);
      expect(seats.shuffler).toBe(shufflerForDealer(dealer));
      expect(seats.cutter).toBe(cutterForDealer(dealer));
      expect(seats.cutter).toBe(((seats.shuffler + 2) % 4) as 0 | 1 | 2 | 3);
    }
  });

  it('shuffler/cutter ritual seats ignore playDirection and deal choice', () => {
    for (const dealer of SEATS) {
      const base = ritualSeatsForDealer(dealer);
      for (const _play of PLAYS) {
        expect(ritualSeatsForDealer(dealer)).toEqual(base);
      }
    }
  });

  it('ritualFocusForPhase maps shuffle→shuffler, cut→cutter, dealer phases→dealer', () => {
    expect(ritualFocusForPhase('shuffle', 0).role).toBe('shuffler');
    expect(ritualFocusForPhase('cut', 0).role).toBe('cutter');
    expect(ritualFocusForPhase('dealer-decision', 0).role).toBe('dealer');
    expect(ritualFocusForPhase('dealer-decision-result', 0).role).toBe('dealer');
  });

  it('isSuecaDealerAi treats only ai type as AI', () => {
    expect(isSuecaDealerAi('ai')).toBe(true);
    expect(isSuecaDealerAi('human')).toBe(false);
    expect(isSuecaDealerAi('remote')).toBe(false);
    expect(isSuecaDealerAi(undefined)).toBe(false);
  });

  it('alignmentFromPhysicalDealChoice is consistent with physicalDealFromAlignment', () => {
    for (const play of PLAYS) {
      for (const physical of PLAYS) {
        const alignment = alignmentFromPhysicalDealChoice(play, physical);
        expect(physicalDealFromAlignment(play, alignment)).toBe(physical);
      }
    }
  });

  it('pickAiPhysicalDealDirection is deterministic with injected RNG', () => {
    expect(pickAiPhysicalDealDirection(() => 0)).toBe('right');
    expect(pickAiPhysicalDealDirection(() => 0.49)).toBe('right');
    expect(pickAiPhysicalDealDirection(() => 0.5)).toBe('left');
    expect(pickAiPhysicalDealDirection(() => 0.99)).toBe('left');
  });

  it('UX-SUECA-06 ritual timings are exact smoke values', () => {
    expect(SUECA_RITUAL_TIMING.shuffleMs).toEqual({ min: 1400, max: 1400 });
    expect(SUECA_RITUAL_TIMING.cutMs).toEqual({ min: 1200, max: 1200 });
    expect(SUECA_RITUAL_TIMING.aiDecisionMs).toEqual({ min: 1400, max: 1400 });
    expect(SUECA_RITUAL_TIMING.decisionResultMs).toEqual({ min: 800, max: 800 });
    expect(ritualDelayMs(SUECA_RITUAL_TIMING.shuffleMs, () => 0)).toBe(1400);
    expect(ritualDelayMs(SUECA_RITUAL_TIMING.shuffleMs, () => 1)).toBe(1400);
    const fixed = resolveRitualTimings(undefined, () => 0.5, false);
    expect(fixed).toEqual({
      shuffleMs: 1400,
      cutMs: 1200,
      aiDecisionMs: 1400,
      decisionResultMs: 800
    });
  });

  it('resolveRitualTimings uses shorter reduced-motion values without skipping phases', () => {
    const t = resolveRitualTimings(undefined, () => 1, true);
    expect(t).toEqual(SUECA_RITUAL_REDUCED_TIMING);
    expect(t.shuffleMs).toBe(700);
    expect(t.cutMs).toBe(600);
    expect(t.aiDecisionMs).toBe(700);
    expect(t.decisionResultMs).toBe(400);
  });

  it('resolveRitualTimings accepts fixed overrides', () => {
    const t = resolveRitualTimings(
      { shuffleMs: 10, cutMs: 20, aiDecisionMs: 30, decisionResultMs: 40 },
      () => 0.5,
      false
    );
    expect(t).toEqual({
      shuffleMs: 10,
      cutMs: 20,
      aiDecisionMs: 30,
      decisionResultMs: 40
    });
  });
});

describe('UX-SUECA-04/06 post-deal presentation', () => {
  it('UX-SUECA-06 post-deal timings are exact smoke values', () => {
    expect(SUECA_POST_DEAL_TIMING.dealConfirmedMs).toEqual({ min: 500, max: 500 });
    expect(SUECA_POST_DEAL_TIMING.distributingMs).toEqual({ min: 900, max: 900 });
    expect(SUECA_POST_DEAL_TIMING.trumpRevealMs).toEqual({ min: 1000, max: 1000 });
    expect(SUECA_POST_DEAL_TIMING.firstPlayerMs).toEqual({ min: 1000, max: 1000 });
    const t = resolvePostDealTimings(undefined, () => 0.5, false);
    expect(t.dealConfirmedMs).toBe(500);
    expect(t.distributingMs).toBe(900);
    expect(t.trumpRevealMs).toBe(1000);
    expect(t.firstPlayerMs).toBe(1000);
  });

  it('resolvePostDealTimings uses shorter reduced-motion values', () => {
    const t = resolvePostDealTimings(undefined, () => 1, true);
    expect(t).toEqual(SUECA_POST_DEAL_REDUCED_TIMING);
    expect(t.dealConfirmedMs).toBe(250);
    expect(t.distributingMs).toBe(450);
    expect(t.trumpRevealMs).toBe(500);
    expect(t.firstPlayerMs).toBe(500);
  });

  it('focus: dealer during deal-confirmed/distributing; first-player on announce; none on trump', () => {
    expect(postDealFocusForPhase('deal-confirmed', 2, 0)).toEqual({
      seat: 2,
      role: 'dealer'
    });
    expect(postDealFocusForPhase('distributing', 2, 0)).toEqual({
      seat: 2,
      role: 'dealer'
    });
    expect(postDealFocusForPhase('trump-reveal', 2, 0)).toBeNull();
    expect(postDealFocusForPhase('first-player', 2, 1)).toEqual({
      seat: 1,
      role: 'first-player'
    });
  });

  it('hands hidden only through distributing; trump HUD hidden through trump-reveal', () => {
    expect(postDealHandsHidden(null)).toBe(false);
    expect(postDealHandsHidden('deal-confirmed')).toBe(true);
    expect(postDealHandsHidden('distributing')).toBe(true);
    expect(postDealHandsHidden('trump-reveal')).toBe(false);
    expect(postDealHandsHidden('first-player')).toBe(false);

    expect(postDealTrumpHudHidden('deal-confirmed')).toBe(true);
    expect(postDealTrumpHudHidden('distributing')).toBe(true);
    expect(postDealTrumpHudHidden('trump-reveal')).toBe(true);
    expect(postDealTrumpHudHidden('first-player')).toBe(false);
    expect(postDealTrumpHudHidden(null)).toBe(false);
  });

  it('play locked for any active post-deal phase; unlocked at play-ready (null)', () => {
    expect(postDealPlayLocked('deal-confirmed')).toBe(true);
    expect(postDealPlayLocked('distributing')).toBe(true);
    expect(postDealPlayLocked('trump-reveal')).toBe(true);
    expect(postDealPlayLocked('first-player')).toBe(true);
    expect(postDealPlayLocked(null)).toBe(false);
  });

  it('UX-SUECA-06 first-player is a distinct phase lasting configured 1000 ms', () => {
    const timings = resolvePostDealTimings(undefined, () => 0, false);
    expect(nextSuecaPostDealPhase('trump-reveal')).toBe('first-player');
    expect(nextSuecaPostDealPhase('first-player')).toBeNull();
    expect(postDealDurationMs('first-player', timings)).toBe(1000);
    expect(postDealPlayLocked('first-player')).toBe(true);
    expect(postDealTrumpHudHidden('first-player')).toBe(false);
    expect(
      suecaPresentationPlayReady({
        waitingForRoundStart: false,
        postDealPhase: 'first-player',
        tableReadyForRitual: true
      })
    ).toBe(false);
  });

  it('UX-SUECA-06 phase machine order: confirmed→distribute→trump→first→play-ready', () => {
    const timings = resolvePostDealTimings();
    expect(nextSuecaPostDealPhase('deal-confirmed')).toBe('distributing');
    expect(postDealDurationMs('deal-confirmed', timings)).toBe(500);
    expect(nextSuecaPostDealPhase('distributing')).toBe('trump-reveal');
    expect(postDealDurationMs('distributing', timings)).toBe(900);
    expect(nextSuecaPostDealPhase('trump-reveal')).toBe('first-player');
    expect(postDealDurationMs('trump-reveal', timings)).toBe(1000);
    expect(nextSuecaPostDealPhase('first-player')).toBeNull();
    expect(postDealDurationMs('first-player', timings)).toBe(1000);
  });

  it('UX-SUECA-08 debug includeHandsReveal inserts inspectable hands-reveal', () => {
    expect(nextSuecaPostDealPhase('distributing', { includeHandsReveal: true })).toBe(
      'hands-reveal'
    );
    expect(nextSuecaPostDealPhase('hands-reveal')).toBe('trump-reveal');
    expect(postDealHandsHidden('hands-reveal')).toBe(false);
    expect(postDealTrumpHudHidden('hands-reveal')).toBe(true);
    expect(postDealPlayLocked('hands-reveal')).toBe(true);
    expect(postDealDurationMs('hands-reveal', resolvePostDealTimings())).toBe(0);
  });

  it('suecaPresentationPlayReady unlocks only after table-ready + post-deal clearance', () => {
    expect(
      suecaPresentationPlayReady({
        waitingForRoundStart: true,
        postDealPhase: null,
        tableReadyForRitual: true
      })
    ).toBe(false);
    expect(
      suecaPresentationPlayReady({
        waitingForRoundStart: false,
        postDealPhase: 'distributing',
        tableReadyForRitual: true
      })
    ).toBe(false);
    expect(
      suecaPresentationPlayReady({
        waitingForRoundStart: false,
        postDealPhase: null,
        tableReadyForRitual: false
      })
    ).toBe(false);
    expect(
      suecaPresentationPlayReady({
        waitingForRoundStart: false,
        postDealPhase: null,
        tableReadyForRitual: true
      })
    ).toBe(true);
    expect(
      suecaPresentationPlayReady({
        waitingForRoundStart: false,
        postDealPhase: null,
        tableReadyForRitual: true,
        ritualDebugPlayReadyHold: true
      })
    ).toBe(false);
  });

  it('shouldMountSuecaDealRitual requires waiting + latched tableReady (deadlock regression)', () => {
    expect(
      shouldMountSuecaDealRitual({
        waitingForRoundStart: true,
        tableReadyForRitual: false,
        isGameOver: false,
        isJoiner: false
      })
    ).toBe(false);
    expect(
      shouldMountSuecaDealRitual({
        waitingForRoundStart: true,
        tableReadyForRitual: true,
        isGameOver: false,
        isJoiner: false
      })
    ).toBe(true);
    expect(
      shouldMountSuecaDealRitual({
        waitingForRoundStart: true,
        tableReadyForRitual: true,
        isGameOver: false,
        isJoiner: true
      })
    ).toBe(false);
    expect(
      shouldMountSuecaDealRitual({
        waitingForRoundStart: true,
        tableReadyForRitual: true,
        isGameOver: false,
        isJoiner: false,
        ritualDebugPreDealReleased: false
      })
    ).toBe(false);
    expect(
      shouldMountSuecaDealRitual({
        waitingForRoundStart: true,
        tableReadyForRitual: true,
        isGameOver: false,
        isJoiner: false,
        ritualDebugPreDealReleased: true
      })
    ).toBe(true);
  });
});
