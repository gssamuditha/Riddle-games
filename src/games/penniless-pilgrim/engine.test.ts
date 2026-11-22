import { describe, expect, it } from 'vitest';
import {
  calculatePilgrimStars,
  CANONICAL_SOLUTION,
  createInitialPilgrimState,
  formatTax,
  getPilgrimHintGuidance,
  PILGRIM_PAR_STEPS,
  recordPilgrimHintUsed,
  START_COORD,
  START_TAX,
  stepPilgrim,
  TEMPLE_COORD,
  undoPilgrimSteps,
  type Direction,
  type PilgrimGameState,
} from './engine';

function walkPath(dirs: readonly Direction[]): PilgrimGameState {
  let state = createInitialPilgrimState();
  for (const d of dirs) {
    const res = stepPilgrim(state, d);
    expect(res.error).toBeUndefined();
    state = res.state;
  }
  return state;
}

describe('Penniless Pilgrim Engine (Duonia 4x4 City Grid)', () => {
  it('starts at (0, 2) with tax = 4 and the 2-block entry road already marked used', () => {
    const state = createInitialPilgrimState();
    expect(state.position).toEqual(START_COORD);
    expect(state.tax).toBe(START_TAX);
    expect(state.usedEdges).toHaveLength(2);
    expect(state.status).toBe('playing');
  });

  it('prevents walking back down a previously used street or outside the city walls', () => {
    const start = createInitialPilgrimState();

    // North is outside wall (row 0)
    expect(stepPilgrim(start, 'N').error).toBeTruthy();

    // West is the already-walked entry street (0,1)-(0,2)
    expect(stepPilgrim(start, 'W').error).toBeTruthy();

    // Walk South then try walking North right back along the same street -> rejected
    const afterS = stepPilgrim(start, 'S').state;
    expect(afterS.tax).toBe(8);
    expect(stepPilgrim(afterS, 'N').error).toBeTruthy();
  });

  it('allows crossing an intersection more than once while forbidding repeating any street edge', () => {
    // Walk S -> E -> N -> W back onto (0,2), then check (0,2) was revisited via fresh streets
    const state = walkPath(['S', 'E', 'N', 'W']);
    expect(state.position).toEqual({ row: 0, col: 2 });
    // Tax: 4 -> *2=8 -> +2=10 -> /2=5 -> -2=3
    expect(state.tax).toBe(3);
    // All 4 edges touching (0,2) are now used? (0,1)-(0,2), (0,2)-(1,2), (0,2)-(0,3) -> 3 edges, row 0 has no N!
    expect(state.status).toBe('stuck');
  });

  it('wins in exactly 20 steps via canonical solution arriving at Temple (4,4) with tax = 0 and 3 stars', () => {
    const finalState = walkPath(CANONICAL_SOLUTION);
    expect(finalState.position).toEqual(TEMPLE_COORD);
    expect(finalState.tax).toBe(0);
    expect(finalState.moves).toHaveLength(PILGRIM_PAR_STEPS);
    expect(finalState.status).toBe('won');
    expect(calculatePilgrimStars(finalState)).toBe(3);
  });

  it('rejects arriving at Temple (4,4) with non-zero tax and recovers cleanly via undo', () => {
    // Direct walk E -> E -> S -> S -> S -> S reaches (4,4) with huge tax: 4->6->8->16->32->64->128
    let state = walkPath(['E', 'E', 'S', 'S', 'S', 'S']);
    expect(state.position).toEqual(TEMPLE_COORD);
    expect(state.tax).toBe(128);
    expect(state.status).toBe('temple_rejected');

    // Undo 1 step restores (3,4) tax=64 and status='playing'
    state = undoPilgrimSteps(state, 1);
    expect(state.position).toEqual({ row: 3, col: 4 });
    expect(state.tax).toBe(64);
    expect(state.status).toBe('playing');
    expect(state.undosUsed).toBe(1);
  });

  it('provides accurate live hint guidance and formats fractional/negative taxes cleanly', () => {
    expect(formatTax(0)).toBe('0');
    expect(formatTax(4.5)).toBe('4.5');
    expect(formatTax(-8)).toBe('-8');

    let state = createInitialPilgrimState();
    const g0 = getPilgrimHintGuidance(state);
    expect(g0.onCanonicalTrack).toBe(true);
    expect(g0.nextDir).toBe('S');

    // Step off canonical path by going East first
    state = stepPilgrim(state, 'E').state;
    const gOff = getPilgrimHintGuidance(state);
    expect(gOff.onCanonicalTrack).toBe(false);
    expect(gOff.undoCountToCanonical).toBe(1);

    // Undo back and finish with 2 hints -> 1 star
    state = undoPilgrimSteps(state, gOff.undoCountToCanonical);
    for (const d of CANONICAL_SOLUTION) {
      state = stepPilgrim(state, d).state;
    }
    state = recordPilgrimHintUsed(recordPilgrimHintUsed(state));
    expect(state.status).toBe('won');
    expect(calculatePilgrimStars(state)).toBe(1);
  });
});

