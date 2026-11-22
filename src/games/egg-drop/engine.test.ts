import { describe, expect, it } from 'vitest';
import {
  calculateEggStars,
  createInitialEggState,
  dropEggFromFloor,
  getOptimalDropAdvice,
  MAX_DROPS,
  minWorstCaseDrops,
  TOTAL_FLOORS,
} from './engine';

describe('Egg Drop Engine (2 Eggs, 100 Floors -> 14 Drops)', () => {
  it('computes exact worst-case drops via triangular numbers (100 floors = 14 drops, 91 = 13)', () => {
    expect(minWorstCaseDrops(0, 2)).toBe(0);
    expect(minWorstCaseDrops(1, 2)).toBe(1);
    expect(minWorstCaseDrops(91, 2)).toBe(13);
    expect(minWorstCaseDrops(92, 2)).toBe(14);
    expect(minWorstCaseDrops(100, 2)).toBe(14);
    expect(minWorstCaseDrops(105, 2)).toBe(14);
    expect(minWorstCaseDrops(15, 1)).toBe(15);
  });

  it('optimal triangular-step strategy ALWAYS wins in <= 14 drops for EVERY possible secret floor 0..100', () => {
    for (let secret = 0; secret <= TOTAL_FLOORS; secret++) {
      let state = createInitialEggState(secret);

      while (state.status === 'playing') {
        const advice = getOptimalDropAdvice(state);
        expect(advice.canStillGuaranteeWin).toBe(true);
        const res = dropEggFromFloor(state, advice.recommendedFloor);
        expect(res.error).toBeUndefined();
        state = res.state;
      }

      expect(state.status).toBe('won');
      expect(state.lowSafe).toBe(secret);
      expect(state.dropsUsed).toBeLessThanOrEqual(MAX_DROPS);
      expect(calculateEggStars(state)).toBe(3);
    }
  });

  it('adversarial guard punishes greedy binary-search drop at Floor 50 on Drop 1', () => {
    // Even if secretFloor was 90, dropping at 50 cannot guarantee <= 14 drops if it breaks (needs 49!)
    const start = createInitialEggState(90);
    const res = dropEggFromFloor(start, 50);

    expect(res.record?.outcome).toBe('shattered');
    expect(res.record?.wasForcedByStrategy).toBe(true);
    expect(res.state.eggsLeft).toBe(1);
    expect(getOptimalDropAdvice(res.state).canStillGuaranteeWin).toBe(false);
  });

  it('skipping a floor when only 1 egg remains immediately shatters and ends in lost_no_eggs', () => {
    // Break first egg at 14 (valid optimal step when secret = 5)
    let state = createInitialEggState(5);
    state = dropEggFromFloor(state, 14).state;
    expect(state.eggsLeft).toBe(1);
    expect(state.lowSafe).toBe(0);
    expect(state.highBreak).toBe(14);

    // Now drop last egg at Floor 2 (skipping Floor 1!) -> adversarial guard shatters -> lost_no_eggs!
    const badDrop = dropEggFromFloor(state, 2);
    expect(badDrop.record?.outcome).toBe('shattered');
    expect(badDrop.state.status).toBe('lost_no_eggs');
  });

  it('rejects already-tested floors outside the active unknown window', () => {
    let state = createInitialEggState(45);
    state = dropEggFromFloor(state, 14).state; // survives -> lowSafe = 14
    expect(dropEggFromFloor(state, 10).error).toBeTruthy();
    expect(dropEggFromFloor(state, 14).error).toBeTruthy();

    state = dropEggFromFloor(state, 27).state; // survives
    state = dropEggFromFloor(state, 39).state; // survives
    state = dropEggFromFloor(state, 50).state; // shatters -> highBreak = 50
    expect(dropEggFromFloor(state, 50).error).toBeTruthy();
    expect(dropEggFromFloor(state, 60).error).toBeTruthy();
  });
});

