import { describe, expect, it } from 'vitest';
import {
  applyJugAction,
  calculateJugsStars,
  createInitialJugsState,
  recordJugHintUsed,
  solveJugsOptimal,
  undoLastJugMove,
  type JugAction,
  type JugsGameState,
} from './engine';

function runActions(actions: JugAction[]): JugsGameState {
  let state = createInitialJugsState();
  for (const action of actions) {
    const res = applyJugAction(state, action);
    expect(res.error).toBeUndefined();
    state = res.state;
  }
  return state;
}

describe("Alchemist's Jugs Engine (3L & 5L -> 4L)", () => {
  it('starts with both flasks empty', () => {
    const state = createInitialJugsState();
    expect(state.small).toBe(0);
    expect(state.large).toBe(0);
    expect(state.status).toBe('playing');
  });

  it('rejects no-op actions (empty empty, fill full, pour empty/full)', () => {
    let state = createInitialJugsState();
    expect(applyJugAction(state, { type: 'empty', jug: 'small' }).error).toBeTruthy();
    expect(applyJugAction(state, { type: 'pour', from: 'large', to: 'small' }).error).toBeTruthy();

    state = applyJugAction(state, { type: 'fill', jug: 'small' }).state;
    expect(applyJugAction(state, { type: 'fill', jug: 'small' }).error).toBeTruthy();
    expect(applyJugAction(state, { type: 'pour', from: 'large', to: 'small' }).error).toBeTruthy();
  });

  it('wins in optimal 6 steps (5L-first path) with 3 stars', () => {
    const finalState = runActions([
      { type: 'fill', jug: 'large' }, // (0, 5)
      { type: 'pour', from: 'large', to: 'small' }, // (3, 2)
      { type: 'empty', jug: 'small' }, // (0, 2)
      { type: 'pour', from: 'large', to: 'small' }, // (2, 0)
      { type: 'fill', jug: 'large' }, // (2, 5)
      { type: 'pour', from: 'large', to: 'small' }, // (3, 4)
    ]);

    expect(finalState.status).toBe('won');
    expect(finalState.small).toBe(3);
    expect(finalState.large).toBe(4);
    expect(finalState.moves).toHaveLength(6);
    expect(calculateJugsStars(finalState)).toBe(3);
  });

  it('wins in alternative 8 steps (3L-first path) with 2 stars', () => {
    const finalState = runActions([
      { type: 'fill', jug: 'small' }, // (3, 0)
      { type: 'pour', from: 'small', to: 'large' }, // (0, 3)
      { type: 'fill', jug: 'small' }, // (3, 3)
      { type: 'pour', from: 'small', to: 'large' }, // (1, 5)
      { type: 'empty', jug: 'large' }, // (1, 0)
      { type: 'pour', from: 'small', to: 'large' }, // (0, 1)
      { type: 'fill', jug: 'small' }, // (3, 1)
      { type: 'pour', from: 'small', to: 'large' }, // (0, 4)
    ]);

    expect(finalState.status).toBe('won');
    expect(finalState.large).toBe(4);
    expect(finalState.moves).toHaveLength(8);
    expect(calculateJugsStars(finalState)).toBe(2);
  });

  it('supports undo restoring exact volumes and adjusting stars', () => {
    let state = runActions([
      { type: 'fill', jug: 'large' },
      { type: 'pour', from: 'large', to: 'small' },
    ]);
    expect(state.small).toBe(3);
    expect(state.large).toBe(2);

    state = undoLastJugMove(state);
    expect(state.small).toBe(0);
    expect(state.large).toBe(5);
    expect(state.undosUsed).toBe(1);

    // Finish optimally from (0, 5) -> 5 more steps (total 6 steps, 1 undo -> 2 stars)
    const rest: JugAction[] = [
      { type: 'pour', from: 'large', to: 'small' },
      { type: 'empty', jug: 'small' },
      { type: 'pour', from: 'large', to: 'small' },
      { type: 'fill', jug: 'large' },
      { type: 'pour', from: 'large', to: 'small' },
    ];
    for (const a of rest) state = applyJugAction(state, a).state;

    expect(state.status).toBe('won');
    expect(calculateJugsStars(state)).toBe(2);

    state = recordJugHintUsed(recordJugHintUsed(state));
    expect(calculateJugsStars(state)).toBe(1);
  });

  it('BFS solver finds exact 6-step optimal path from (0, 0)', () => {
    const sol = solveJugsOptimal(0, 0);
    expect(sol.minRemainingMoves).toBe(6);
    expect(sol.actions).toHaveLength(6);

    const replay = runActions(sol.actions);
    expect(replay.status).toBe('won');
    expect(replay.large).toBe(4);
  });
});

