import { describe, expect, it } from 'vitest';
import {
  calculateVirusStars,
  CANONICAL_VIRUS_PATH,
  createInitialVirusState,
  ENTRANCE_COORD,
  EXIT_COORD,
  getVirusSolverAdvice,
  moveToRoom,
  recordVirusHintUsed,
  TOTAL_VIRUS_ROOMS,
  undoVirusSteps,
  VIRUS_PAR_MOVES,
  type LabCoord,
  type VirusGameState,
} from './engine';

function runLabPath(coords: readonly LabCoord[]): VirusGameState {
  let state = createInitialVirusState();
  for (const c of coords) {
    const res = moveToRoom(state, c);
    expect(res.error).toBeUndefined();
    state = res.state;
  }
  return state;
}

describe('Virus Riddle Engine (4x4 Quarantine Lab)', () => {
  it('starts at clean NW Entrance (0,0) with all 15 other rooms contaminated', () => {
    const state = createInitialVirusState();
    expect(state.position).toEqual(ENTRANCE_COORD);
    expect(state.rooms[0][0]).toBe('clean');
    expect(state.rooms[0][1]).toBe('contaminated');
    expect(state.rooms[3][3]).toBe('contaminated');
    expect(state.clearedVirusCount).toBe(0);
    expect(state.status).toBe('playing');
  });

  it('allows revisiting the clean Entrance ONCE, then seals it permanently upon leaving again', () => {
    let state = createInitialVirusState();

    // Move 1: (0,0) -> (0,1). Entrance stays 'clean' (unsealed!)
    state = moveToRoom(state, { row: 0, col: 1 }).state;
    expect(state.rooms[0][0]).toBe('clean');
    expect(state.clearedVirusCount).toBe(1);

    // Move 2: (0,1) -> (0,0) (revisit!). (0,1) seals permanently; (0,0) becomes active_cleared
    state = moveToRoom(state, { row: 0, col: 0 }).state;
    expect(state.rooms[0][1]).toBe('sealed');
    expect(state.entranceRevisited).toBe(true);

    // Cannot step back into sealed (0,1)
    expect(moveToRoom(state, { row: 0, col: 1 }).error).toBeTruthy();

    // Move 3: (0,0) -> (1,0). Now (0,0) seals permanently too!
    state = moveToRoom(state, { row: 1, col: 0 }).state;
    expect(state.rooms[0][0]).toBe('sealed');
    expect(moveToRoom(state, { row: 0, col: 0 }).error).toBeTruthy();
  });

  it('wins via canonical 16-step path clearing all 15 virus rooms and ending at SE Exit with 3 stars', () => {
    const finalState = runLabPath(CANONICAL_VIRUS_PATH);
    expect(finalState.position).toEqual(EXIT_COORD);
    expect(finalState.clearedVirusCount).toBe(TOTAL_VIRUS_ROOMS);
    expect(finalState.moves).toHaveLength(VIRUS_PAR_MOVES);
    expect(finalState.entranceRevisited).toBe(true);
    expect(finalState.status).toBe('won');
    expect(calculateVirusStars(finalState)).toBe(3);
  });

  it('wins via symmetric South-first path as well', () => {
    const symmetricPath = CANONICAL_VIRUS_PATH.map((c) => ({ row: c.col, col: c.row }));
    const finalState = runLabPath(symmetricPath);
    expect(finalState.status).toBe('won');
    expect(finalState.clearedVirusCount).toBe(TOTAL_VIRUS_ROOMS);
  });

  it('detects entering Exit early before clearing all 15 rooms and recovers cleanly via undo', () => {
    // Walk straight to (3,3) without clearing everything
    let state = runLabPath([
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 3 },
      { row: 2, col: 3 },
      { row: 3, col: 3 },
    ]);
    expect(state.status).toBe('exit_early');
    expect(state.clearedVirusCount).toBe(6);

    state = undoVirusSteps(state, 1);
    expect(state.status).toBe('playing');
    expect(state.position).toEqual({ row: 2, col: 3 });
    expect(state.undosUsed).toBe(1);
  });

  it('live backtracking solver proves unsolvability when bypassing Entrance parity trap and guides undo', () => {
    // Walk away from Entrance without revisiting: (0,0)->(0,1)->(0,2)->(1,2)->(1,1)->(1,0)
    // Now (0,0) is isolated on the north of (1,0), wait—actually from (1,0) you CAN still revisit (0,0)!
    // Let's seal off both neighbors of (0,0): (0,0)->(0,1)->(1,1)->(1,0) -> (0,1) and (1,1) are sealed, leaving (0,0) as a dead end if entered!
    let state = runLabPath([
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ]);
    // Both neighbors of (0,0) are now sealed -> Entrance can NEVER be revisited -> parity trap makes win impossible!
    const advice = getVirusSolverAdvice(state);
    expect(advice.solvableFromHere).toBe(false);
    expect(advice.undoCountToSolvable).toBeGreaterThan(0);

    // From initial state, live solver returns a valid winning continuation!
    const startAdvice = getVirusSolverAdvice(createInitialVirusState());
    expect(startAdvice.solvableFromHere).toBe(true);
    expect(startAdvice.nextRoom).not.toBeNull();

    // Check star downgrade with 2 hints
    let won = runLabPath(CANONICAL_VIRUS_PATH);
    won = recordVirusHintUsed(recordVirusHintUsed(won));
    expect(calculateVirusStars(won)).toBe(1);
  });
});

