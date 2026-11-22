import { describe, expect, it } from 'vitest';
import {
  analyzeBridgeState,
  calculateStarRating,
  commitCrossing,
  createInitialBridgeState,
  recordHintUsed,
  solveOptimalFromBoard,
  toggleTravelerSelection,
  undoLastCrossing,
  type BridgeGameState,
  type TravelerId,
} from './engine';

function runSequence(steps: TravelerId[][]): BridgeGameState {
  let state = createInitialBridgeState();
  for (const group of steps) {
    for (const id of group) {
      const toggled = toggleTravelerSelection(state, id);
      expect(toggled.error).toBeUndefined();
      state = toggled.state;
    }
    const result = commitCrossing(state);
    expect(result.error).toBeUndefined();
    state = result.state;
  }
  return state;
}

describe('Bridge Riddle Engine (The Lantern Bridge)', () => {
  it('starts with all travelers and lantern on the left cliff at 0 minutes', () => {
    const state = createInitialBridgeState();
    expect(state.lanternSide).toBe('left');
    expect(state.elapsedMinutes).toBe(0);
    expect(state.timeLimit).toBe(17);
    expect(state.status).toBe('playing');
    expect(Object.values(state.positions)).toEqual(['left', 'left', 'left', 'left']);
  });

  it('enforces max capacity of 2 travelers and lantern-side validation', () => {
    let state = createInitialBridgeState();
    state = toggleTravelerSelection(state, 'lyra').state;
    state = toggleTravelerSelection(state, 'tomas').state;

    // 3rd traveler must be rejected
    const third = toggleTravelerSelection(state, 'garrick');
    expect(third.error).toBeTruthy();
    expect(third.state.selected).toEqual(['lyra', 'tomas']);

    // Cross Lyra & Tomas to right; lantern is now on right
    state = commitCrossing(state).state;
    expect(state.lanternSide).toBe('right');
    expect(state.elapsedMinutes).toBe(2);

    // Selecting Garrick (still on left) must be rejected
    const wrongSide = toggleTravelerSelection(state, 'garrick');
    expect(wrongSide.error).toBeTruthy();
  });

  it('wins in exactly 17 minutes via optimal solution A (Lyra returns first) with 3 stars', () => {
    const finalState = runSequence([
      ['lyra', 'tomas'], // 2m (total 2)
      ['lyra'], // 1m (total 3)
      ['garrick', 'orin'], // 10m (total 13)
      ['tomas'], // 2m (total 15)
      ['lyra', 'tomas'], // 2m (total 17)
    ]);

    expect(finalState.status).toBe('won');
    expect(finalState.elapsedMinutes).toBe(17);
    expect(finalState.moves).toHaveLength(5);
    expect(calculateStarRating(finalState)).toBe(3);
  });

  it('wins in exactly 17 minutes via optimal solution B (Tomas returns first)', () => {
    const finalState = runSequence([
      ['lyra', 'tomas'], // 2m (total 2)
      ['tomas'], // 2m (total 4)
      ['garrick', 'orin'], // 10m (total 14)
      ['lyra'], // 1m (total 15)
      ['lyra', 'tomas'], // 2m (total 17)
    ]);

    expect(finalState.status).toBe('won');
    expect(finalState.elapsedMinutes).toBe(17);
  });

  it('loses when time hits 17m with travelers still stranded on the cliff', () => {
    const finalState = runSequence([
      ['lyra', 'orin'], // 10m
      ['lyra'], // 1m (11)
      ['lyra', 'garrick'], // 5m (16)
      ['lyra'], // 1m (17 — not everyone safe yet -> lost!)
    ]);

    expect(finalState.elapsedMinutes).toBe(17);
    expect(finalState.status).toBe('lost');
  });

  it('loses when a crossing exceeds the 17-minute collapse limit', () => {
    const finalState = runSequence([
      ['garrick', 'orin'], // 10m
      ['orin'], // 10m -> 20m total (> 17)
    ]);

    expect(finalState.elapsedMinutes).toBe(20);
    expect(finalState.status).toBe('lost');
  });

  it('supports undo restoring exact previous board state and adjusting star rating', () => {
    let state = runSequence([
      ['lyra', 'orin'], // 10m
      ['lyra'], // 1m (11)
    ]);

    const analysisBeforeUndo = analyzeBridgeState(state);
    expect(analysisBeforeUndo.canStillWin).toBe(false);
    expect(analysisBeforeUndo.undoCountToWinnable).toBe(2);

    state = undoLastCrossing(state);
    expect(state.elapsedMinutes).toBe(10);
    expect(state.lanternSide).toBe('right');
    expect(state.undosUsed).toBe(1);

    state = undoLastCrossing(state);
    expect(state.elapsedMinutes).toBe(0);
    expect(state.lanternSide).toBe('left');
    expect(state.undosUsed).toBe(2);

    // Finish optimally after undoing
    for (const group of [
      ['lyra', 'tomas'],
      ['lyra'],
      ['garrick', 'orin'],
      ['tomas'],
      ['lyra', 'tomas'],
    ] as TravelerId[][]) {
      for (const id of group) state = toggleTravelerSelection(state, id).state;
      state = commitCrossing(state).state;
    }

    expect(state.status).toBe('won');
    expect(calculateStarRating(state)).toBe(2);

    // Using 2+ hints lowers rating to 1 star
    state = recordHintUsed(recordHintUsed(state));
    expect(calculateStarRating(state)).toBe(1);
  });

  it('Dijkstra solver finds exact 17-minute optimal solution from start', () => {
    const start = createInitialBridgeState();
    const solution = solveOptimalFromBoard(start.positions, start.lanternSide);
    expect(solution.minRemainingTime).toBe(17);
    expect(solution.moves).toHaveLength(5);

    const replay = runSequence(solution.moves);
    expect(replay.status).toBe('won');
    expect(replay.elapsedMinutes).toBe(17);
  });
});
