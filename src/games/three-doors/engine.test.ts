import { describe, expect, it } from 'vitest';
import {
  advanceToNextRound,
  calculateVaultStars,
  createInitialVaultState,
  DOORS,
  finalizeDoorChoice,
  getStrategyStats,
  getSwitchTargetDoor,
  KEYS_TO_WIN,
  MAX_LOSSES,
  pickInitialDoor,
  selectHostRevealDoor,
  simulateMontyHallBatch,
  type DoorIndex,
  type VaultTrialState,
} from './engine';

describe('Three Vault Doors Engine (Monty Hall Paradox)', () => {
  it('Archivist NEVER reveals the prize door or the player’s initial pick', () => {
    for (const prize of DOORS) {
      for (const pick of DOORS) {
        for (const seed of [0.1, 0.9]) {
          const revealed = selectHostRevealDoor(prize, pick, () => seed);
          expect(revealed).not.toBe(prize);
          expect(revealed).not.toBe(pick);
        }
      }
    }
  });

  it('Switching wins if and only if initial pick was wrong (2/3 cases), Staying wins iff initial pick was right (1/3)', () => {
    for (const prize of DOORS) {
      for (const pick of DOORS) {
        // Force prizeDoor deterministically
        const prizeRng = () => (prize + 0.1) / 3;
        const start = createInitialVaultState(prizeRng);
        expect(start.currentRound.prizeDoor).toBe(prize);

        const picked = pickInitialDoor(start, pick).state;
        const switchTarget = getSwitchTargetDoor(picked.currentRound)!;

        // Test Stay
        const stayRes = finalizeDoorChoice(picked, pick);
        expect(stayRes.roundResult?.switched).toBe(false);
        expect(stayRes.roundResult?.won).toBe(pick === prize);

        // Test Switch
        const switchRes = finalizeDoorChoice(picked, switchTarget);
        expect(switchRes.roundResult?.switched).toBe(true);
        expect(switchRes.roundResult?.won).toBe(pick !== prize);
      }
    }
  });

  it('wins the trial upon collecting 6 Astral Keys and awards 3 stars for disciplined switching', () => {
    // Prize always behind Door 2; player picks Door 0 and switches every round -> wins every round!
    const prizeTwoRng = () => 0.85; // floor(0.85 * 3) = 2
    let state: VaultTrialState = createInitialVaultState(prizeTwoRng);

    for (let r = 0; r < KEYS_TO_WIN; r++) {
      state = pickInitialDoor(state, 0, prizeTwoRng).state;
      const target = getSwitchTargetDoor(state.currentRound)!;
      state = finalizeDoorChoice(state, target).state;
      if (state.status === 'playing') {
        state = advanceToNextRound(state, prizeTwoRng);
      }
    }

    expect(state.status).toBe('won');
    expect(state.keysCollected).toBe(KEYS_TO_WIN);
    expect(calculateVaultStars(state)).toBe(3);

    const stats = getStrategyStats(state.history);
    expect(stats.switchTotal).toBe(KEYS_TO_WIN);
    expect(stats.switchRate).toBe(100);
  });

  it('loses the trial immediately upon 5 empty traps (when 6 keys become unreachable)', () => {
    const prizeTwoRng = () => 0.85;
    let state = createInitialVaultState(prizeTwoRng);

    for (let r = 0; r < MAX_LOSSES; r++) {
      // Pick Door 0 and STAY -> always empty
      state = pickInitialDoor(state, 0, prizeTwoRng).state;
      state = finalizeDoorChoice(state, 0).state;
      if (state.status === 'playing') {
        state = advanceToNextRound(state, prizeTwoRng);
      }
    }

    expect(state.status).toBe('lost');
    expect(state.lossesCount).toBe(MAX_LOSSES);
    expect(calculateVaultStars(state)).toBe(0);
  });

  it('rejects choosing the already-revealed empty door', () => {
    const start = createInitialVaultState(() => 0.1); // prize Door 0
    const picked = pickInitialDoor(start, 1).state;
    const revealed = picked.currentRound.hostRevealedDoor as DoorIndex;
    const invalid = finalizeDoorChoice(picked, revealed);
    expect(invalid.error).toBeTruthy();
  });

  it('Monte Carlo proof over 3,000 trials converges to ~66.7% Switch vs ~33.3% Stay', () => {
    // Deterministic LCG PRNG for reproducible tests
    let seed = 42;
    const lcg = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const batch = simulateMontyHallBatch(3000, lcg);
    expect(batch.switchPct).toBeGreaterThan(64);
    expect(batch.switchPct).toBeLessThan(69.5);
    expect(batch.stayPct).toBeGreaterThan(30.5);
    expect(batch.stayPct).toBeLessThan(36);
  });
});

