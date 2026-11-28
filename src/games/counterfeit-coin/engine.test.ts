import { describe, expect, it } from 'vitest';
import {
  ALL_COIN_WORLDS,
  calculateCoinStars,
  clearScalePans,
  createInitialCoinState,
  getCoinDeductionMarks,
  getConsistentCoinWorlds,
  getProvenGenuineCoins,
  performWeighing,
  placeCoinOnPan,
  setCoinVerdict,
  submitCoinVerdict,
  suggestOptimalWeighing,
} from './engine';

describe('Counterfeit Coin Engine (12 Coins, 3 Weighings)', () => {
  it('starts with 24 consistent worlds and enforces equal non-empty pans', () => {
    let state = createInitialCoinState({ fakeCoin: 7, weight: 'lighter' });
    expect(getConsistentCoinWorlds(state.history)).toHaveLength(24);

    // Empty pans rejected
    expect(performWeighing(state).error).toBeTruthy();

    // Unequal pans (2 vs 1) rejected
    state = placeCoinOnPan(state, 1, 'left');
    state = placeCoinOnPan(state, 2, 'left');
    state = placeCoinOnPan(state, 3, 'right');
    expect(performWeighing(state).error).toBeTruthy();
  });

  it('optimal advisor solves ALL 24 hidden worlds (12 coins × Heavier/Lighter) with 100% certainty in <= 3 weighings', () => {
    for (const world of ALL_COIN_WORLDS) {
      let state = createInitialCoinState(world);

      for (let step = 0; step < 3; step++) {
        const consistent = getConsistentCoinWorlds(state.history);
        if (consistent.length === 1) break;

        const advice = suggestOptimalWeighing(state);
        expect(advice).not.toBeNull();

        state = clearScalePans(state);
        for (const c of advice!.leftPan) state = placeCoinOnPan(state, c, 'left');
        for (const c of advice!.rightPan) state = placeCoinOnPan(state, c, 'right');

        const res = performWeighing(state);
        expect(res.error).toBeUndefined();
        state = res.state;
      }

      // After <= 3 weighings, there MUST be EXACTLY 1 consistent world matching the hidden world!
      const remaining = getConsistentCoinWorlds(state.history);
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toEqual(world);

      // Submit verdict and confirm 3 stars with 100% certainty
      state = setCoinVerdict(state, {
        coin: remaining[0].fakeCoin,
        weight: remaining[0].weight,
      });
      const judged = submitCoinVerdict(state);
      expect(judged.error).toBeUndefined();
      expect(judged.state.status).toBe('won');
      expect(judged.state.deducedWithCertainty).toBe(true);
      expect(calculateCoinStars(judged.state)).toBe(3);
    }
  });

  it('tracks proven genuine coins accurately after balanced 4v4 weighing', () => {
    let state = createInitialCoinState({ fakeCoin: 12, weight: 'heavier' });
    for (const c of [1, 2, 3, 4] as const) state = placeCoinOnPan(state, c, 'left');
    for (const c of [5, 6, 7, 8] as const) state = placeCoinOnPan(state, c, 'right');

    const res = performWeighing(state);
    expect(res.record?.outcome).toBe('balanced');
    expect(res.record?.consistentWorldsAfter).toBe(8);

    const genuine = getProvenGenuineCoins(res.state.history);
    expect(genuine.size).toBe(8);
    for (const c of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
      expect(genuine.has(c)).toBe(true);
    }
    expect(genuine.has(12)).toBe(false);
  });

  it('enforces the 3-weighing limit and handles wrong verdicts cleanly', () => {
    let state = createInitialCoinState({ fakeCoin: 1, weight: 'heavier' });
    state = placeCoinOnPan(state, 1, 'left');
    state = placeCoinOnPan(state, 2, 'right');

    state = performWeighing(state).state;
    state = performWeighing(state).state;
    state = performWeighing(state).state;

    // 4th weighing rejected
    expect(performWeighing(state).error).toBeTruthy();

    // Wrong weight verdict loses
    state = setCoinVerdict(state, { coin: 1, weight: 'lighter' });
    const lost = submitCoinVerdict(state);
    expect(lost.state.status).toBe('lost');
    expect(calculateCoinStars(lost.state)).toBe(0);
  });

  it('tracks + (heavier), - (lighter), ± (either), and genuine marks accurately across weighings', () => {
    let state = createInitialCoinState({ fakeCoin: 6, weight: 'lighter' });
    expect(getCoinDeductionMarks(state.history)[1]).toBe('unweighed');

    // Weighing 1: 1-4 vs 5-8 -> Left Heavy (1-4 are +, 5-8 are -, 9-12 are genuine)
    for (const c of [1, 2, 3, 4] as const) state = placeCoinOnPan(state, c, 'left');
    for (const c of [5, 6, 7, 8] as const) state = placeCoinOnPan(state, c, 'right');
    state = performWeighing(state).state;

    const marks1 = getCoinDeductionMarks(state.history);
    for (const c of [1, 2, 3, 4] as const) expect(marks1[c]).toBe('heavier');
    for (const c of [5, 6, 7, 8] as const) expect(marks1[c]).toBe('lighter');
    for (const c of [9, 10, 11, 12] as const) expect(marks1[c]).toBe('genuine');

    // Weighing 2: (1+, 2+, 5-) vs (3+, 6-, 9✓) -> Left Heavy (1,2 remain +, 6 remains -, rest genuine)
    state = clearScalePans(state);
    for (const c of [1, 2, 5] as const) state = placeCoinOnPan(state, c, 'left');
    for (const c of [3, 6, 9] as const) state = placeCoinOnPan(state, c, 'right');
    state = performWeighing(state).state;

    const marks2 = getCoinDeductionMarks(state.history);
    expect(marks2[1]).toBe('heavier');
    expect(marks2[2]).toBe('heavier');
    expect(marks2[6]).toBe('lighter');
    for (const c of [3, 4, 5, 7, 8, 9, 10, 11, 12] as const) {
      expect(marks2[c]).toBe('genuine');
    }

    // Balanced first weighing marks 9-12 as 'either' (±)
    let balState = createInitialCoinState({ fakeCoin: 10, weight: 'heavier' });
    for (const c of [1, 2, 3, 4] as const) balState = placeCoinOnPan(balState, c, 'left');
    for (const c of [5, 6, 7, 8] as const) balState = placeCoinOnPan(balState, c, 'right');
    balState = performWeighing(balState).state;
    const balMarks = getCoinDeductionMarks(balState.history);
    expect(balMarks[1]).toBe('genuine');
    expect(balMarks[10]).toBe('either');
  });
});

