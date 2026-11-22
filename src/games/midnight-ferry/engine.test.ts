import { describe, expect, it } from 'vitest';
import {
  calculateFerryStars,
  commitRowing,
  createInitialFerryState,
  recordFerryHintUsed,
  solveFerryOptimal,
  toggleBoardCargo,
  undoLastRow,
  type CargoId,
  type FerryGameState,
} from './engine';

function runVoyage(steps: (CargoId | null)[]): FerryGameState {
  let state = createInitialFerryState();
  for (const passenger of steps) {
    if (passenger !== null) {
      const boarded = toggleBoardCargo(state, passenger);
      expect(boarded.error).toBeUndefined();
      state = boarded.state;
    }
    const rowed = commitRowing(state);
    expect(rowed.error).toBeUndefined();
    state = rowed.state;
  }
  return state;
}

describe('Midnight Ferry Engine (Wolf, Goat & Cabbage)', () => {
  it('starts with Ferryman and all three cargo items on the west shore', () => {
    const state = createInitialFerryState();
    expect(state.ferrymanSide).toBe('west');
    expect(state.boarded).toBeNull();
    expect(state.status).toBe('playing');
    expect(Object.values(state.positions)).toEqual(['west', 'west', 'west']);
  });

  it('allows boarding, unboarding, swapping seats, and rejects opposite-shore clicks', () => {
    let state = createInitialFerryState();
    state = toggleBoardCargo(state, 'goat').state;
    expect(state.boarded).toBe('goat');

    // Clicking another item on same shore smoothly swaps seats
    state = toggleBoardCargo(state, 'wolf').state;
    expect(state.boarded).toBe('wolf');

    // Clicking the boarded item unboards it
    state = toggleBoardCargo(state, 'wolf').state;
    expect(state.boarded).toBeNull();

    // Cross goat to east, then try clicking wolf (still on west)
    state = toggleBoardCargo(state, 'goat').state;
    state = commitRowing(state).state;
    expect(state.ferrymanSide).toBe('east');
    const wrongShore = toggleBoardCargo(state, 'wolf');
    expect(wrongShore.error).toBeTruthy();
  });

  it('triggers loss if Ash-Wolf and Highland Goat are left unattended', () => {
    const state = runVoyage(['cabbage']);
    expect(state.status).toBe('lost');
    expect(state.conflict?.pair).toEqual(['wolf', 'goat']);
    expect(state.conflict?.shore).toBe('west');
  });

  it('triggers loss if Highland Goat and Moon-Cabbage are left unattended', () => {
    const state = runVoyage(['wolf']);
    expect(state.status).toBe('lost');
    expect(state.conflict?.pair).toEqual(['goat', 'cabbage']);
    expect(state.conflict?.shore).toBe('west');
  });

  it('wins in optimal 7 trips via Wolf-first solution with 3 stars', () => {
    const finalState = runVoyage([
      'goat', // 1 -> E (W: wolf + cabbage safe)
      null, // 2 -> W
      'wolf', // 3 -> E
      'goat', // 4 -> W (bring goat back!)
      'cabbage', // 5 -> E (E: wolf + cabbage safe)
      null, // 6 -> W
      'goat', // 7 -> E (all safe!)
    ]);

    expect(finalState.status).toBe('won');
    expect(finalState.moves).toHaveLength(7);
    expect(calculateFerryStars(finalState)).toBe(3);
  });

  it('wins in optimal 7 trips via Cabbage-first solution with 3 stars', () => {
    const finalState = runVoyage([
      'goat',
      null,
      'cabbage',
      'goat',
      'wolf',
      null,
      'goat',
    ]);

    expect(finalState.status).toBe('won');
    expect(finalState.moves).toHaveLength(7);
    expect(calculateFerryStars(finalState)).toBe(3);
  });

  it('recovers cleanly from a conflict via undo and adjusts stars', () => {
    let state = runVoyage(['wolf']); // triggers goat+cabbage conflict
    expect(state.status).toBe('lost');

    state = undoLastRow(state);
    expect(state.status).toBe('playing');
    expect(state.conflict).toBeNull();
    expect(state.undosUsed).toBe(1);

    // Finish cleanly in 7 moves -> 2 stars due to undo
    for (const p of ['goat', null, 'wolf', 'goat', 'cabbage', null, 'goat'] as (CargoId | null)[]) {
      if (p) state = toggleBoardCargo(state, p).state;
      state = commitRowing(state).state;
    }

    expect(state.status).toBe('won');
    expect(calculateFerryStars(state)).toBe(2);

    state = recordFerryHintUsed(recordFerryHintUsed(state));
    expect(calculateFerryStars(state)).toBe(1);
  });

  it('BFS solver finds exact 7-move safe shortest path from initial state', () => {
    const start = createInitialFerryState();
    const solution = solveFerryOptimal(start.positions, start.ferrymanSide);
    expect(solution.minRemainingMoves).toBe(7);
    expect(solution.moves).toHaveLength(7);

    const replay = runVoyage(solution.moves);
    expect(replay.status).toBe('won');
    expect(replay.moves).toHaveLength(7);
  });
});

