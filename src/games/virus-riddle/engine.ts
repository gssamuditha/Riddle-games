export type RoomStatus = 'clean' | 'contaminated' | 'active_cleared' | 'sealed';
export type VirusGameStatus = 'playing' | 'won' | 'stuck' | 'exit_early';

export interface LabCoord {
  row: number; // 0..3
  col: number; // 0..3
}

export const LAB_SIZE = 4; // 4x4 = 16 rooms
export const TOTAL_VIRUS_ROOMS = 15; // All rooms except NW Entrance (0,0)
export const VIRUS_PAR_MOVES = 16; // 15 virus rooms + 1 revisit to clean NW Entrance
export const ENTRANCE_COORD: LabCoord = { row: 0, col: 0 };
export const EXIT_COORD: LabCoord = { row: 3, col: 3 };

export interface VirusMoveRecord {
  step: number;
  from: LabCoord;
  to: LabCoord;
  revisitedCleanEntrance: boolean;
  snapshotRooms: RoomStatus[][];
  snapshotClearedCount: number;
}

export interface VirusGameState {
  rooms: RoomStatus[][];
  position: LabCoord;
  path: LabCoord[];
  clearedVirusCount: number; // 0..15
  entranceRevisited: boolean;
  moves: VirusMoveRecord[];
  status: VirusGameStatus;
  hintsUsed: number;
  undosUsed: number;
}

export interface VirusSolverAdvice {
  solvableFromHere: boolean;
  nextRoom: LabCoord | null;
  undoCountToSolvable: number;
}

// Verified canonical 16-step solution exploiting the clean NW Entrance loophole
export const CANONICAL_VIRUS_PATH: readonly LabCoord[] = [
  { row: 0, col: 1 },
  { row: 0, col: 0 }, // Re-enter clean Entrance to flip parity!
  { row: 1, col: 0 },
  { row: 2, col: 0 },
  { row: 3, col: 0 },
  { row: 3, col: 1 },
  { row: 2, col: 1 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 0, col: 2 },
  { row: 0, col: 3 },
  { row: 1, col: 3 },
  { row: 2, col: 3 },
  { row: 2, col: 2 },
  { row: 3, col: 2 },
  { row: 3, col: 3 },
] as const;

export function isSameLabCoord(a: LabCoord, b: LabCoord): boolean {
  return a.row === b.row && a.col === b.col;
}

export function isAdjacentLabCoord(a: LabCoord, b: LabCoord): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

function cloneRooms(rooms: RoomStatus[][]): RoomStatus[][] {
  return rooms.map((row) => [...row]);
}

export function createInitialVirusState(): VirusGameState {
  const rooms: RoomStatus[][] = Array.from({ length: LAB_SIZE }, (_, r) =>
    Array.from({ length: LAB_SIZE }, (_, c) =>
      r === 0 && c === 0 ? 'clean' : 'contaminated'
    )
  );

  return {
    rooms,
    position: { ...ENTRANCE_COORD },
    path: [{ ...ENTRANCE_COORD }],
    clearedVirusCount: 0,
    entranceRevisited: false,
    moves: [],
    status: 'playing',
    hintsUsed: 0,
    undosUsed: 0,
  };
}

export function getAccessibleNeighbors(
  rooms: RoomStatus[][],
  pos: LabCoord
): LabCoord[] {
  const dirs = [
    { row: pos.row - 1, col: pos.col },
    { row: pos.row + 1, col: pos.col },
    { row: pos.row, col: pos.col - 1 },
    { row: pos.row, col: pos.col + 1 },
  ];
  return dirs.filter(
    (n) =>
      n.row >= 0 &&
      n.row < LAB_SIZE &&
      n.col >= 0 &&
      n.col < LAB_SIZE &&
      rooms[n.row][n.col] !== 'sealed'
  );
}

export function canMoveToRoom(
  state: VirusGameState,
  target: LabCoord
): { ok: boolean; reason?: string } {
  if (state.status !== 'playing') {
    return { ok: false, reason: 'Undo a step or reset to keep exploring.' };
  }
  if (
    target.row < 0 ||
    target.row >= LAB_SIZE ||
    target.col < 0 ||
    target.col >= LAB_SIZE
  ) {
    return { ok: false, reason: 'Lab outer wall blocks that way.' };
  }
  if (!isAdjacentLabCoord(state.position, target)) {
    return { ok: false, reason: 'Move through an adjacent horizontal or vertical airlock.' };
  }
  if (state.rooms[target.row][target.col] === 'sealed') {
    return { ok: false, reason: 'That room is already sealed—you cannot re-enter it.' };
  }
  return { ok: true };
}

export function moveToRoom(
  state: VirusGameState,
  target: LabCoord
): { state: VirusGameState; move: VirusMoveRecord | null; error?: string } {
  const check = canMoveToRoom(state, target);
  if (!check.ok) {
    return { state, move: null, error: check.reason };
  }

  const snapshotRooms = cloneRooms(state.rooms);
  const nextRooms = cloneRooms(state.rooms);
  const from = state.position;

  // Leaving current room:
  // - If leaving the CLEAN entrance on the very first step, it stays 'clean' (unsealed!)
  // - If leaving any contaminated/cleared room (including entrance after revisit), it SEALS forever!
  if (nextRooms[from.row][from.col] === 'active_cleared') {
    nextRooms[from.row][from.col] = 'sealed';
  }

  const targetPrevStatus = nextRooms[target.row][target.col];
  let nextClearedCount = state.clearedVirusCount;
  let nextEntranceRevisited = state.entranceRevisited;
  let revisitedNow = false;

  if (targetPrevStatus === 'contaminated') {
    // Enter contaminated room -> pull its sterilizer switch immediately!
    nextRooms[target.row][target.col] = 'active_cleared';
    nextClearedCount += 1;
  } else if (targetPrevStatus === 'clean' && isSameLabCoord(target, ENTRANCE_COORD)) {
    // Loophole! Re-entering the clean NW entrance from a contaminated room -> now it becomes active & will seal when left!
    nextRooms[target.row][target.col] = 'active_cleared';
    nextEntranceRevisited = true;
    revisitedNow = true;
  }

  const move: VirusMoveRecord = {
    step: state.moves.length + 1,
    from: { ...from },
    to: { ...target },
    revisitedCleanEntrance: revisitedNow,
    snapshotRooms,
    snapshotClearedCount: state.clearedVirusCount,
  };

  let nextStatus: VirusGameStatus = 'playing';
  if (isSameLabCoord(target, EXIT_COORD)) {
    if (nextClearedCount === TOTAL_VIRUS_ROOMS) {
      nextStatus = 'won';
    } else {
      // Stepping onto Exit before all 15 virus rooms are cleared still lets you keep moving ONLY if neighbors exist,
      // EXCEPT wait: once you leave Exit, Exit gets SEALED forever so you could NEVER return to Exit!
      nextStatus = 'exit_early';
    }
  } else if (getAccessibleNeighbors(nextRooms, target).length === 0) {
    nextStatus = 'stuck';
  }

  return {
    move,
    state: {
      ...state,
      rooms: nextRooms,
      position: { ...target },
      path: [...state.path, { ...target }],
      clearedVirusCount: nextClearedCount,
      entranceRevisited: nextEntranceRevisited,
      moves: [...state.moves, move],
      status: nextStatus,
    },
  };
}

export function undoVirusSteps(state: VirusGameState, count = 1): VirusGameState {
  if (state.moves.length === 0 || count <= 0) return state;

  const steps = Math.min(count, state.moves.length);
  const revertToIndex = state.moves.length - steps;
  const targetMove = state.moves[revertToIndex];
  const keptMoves = state.moves.slice(0, revertToIndex);

  return {
    ...state,
    rooms: cloneRooms(targetMove.snapshotRooms),
    position: { ...targetMove.from },
    path: state.path.slice(0, state.path.length - steps),
    clearedVirusCount: targetMove.snapshotClearedCount,
    entranceRevisited: keptMoves.some((m) => m.revisitedCleanEntrance),
    moves: keptMoves,
    status: 'playing',
    undosUsed: state.undosUsed + 1,
  };
}

export function recordVirusHintUsed(state: VirusGameState): VirusGameState {
  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
  };
}

export function calculateVirusStars(state: VirusGameState): 0 | 1 | 2 | 3 {
  if (state.status !== 'won') return 0;
  if (state.hintsUsed === 0 && state.undosUsed === 0) return 3;
  if (state.hintsUsed <= 1) return 2;
  return 1;
}

// --- Exact Live Backtracking Solver (4x4 = tiny 16-node graph, runs in < 2ms!) ---

function solveFromBoard(
  rooms: RoomStatus[][],
  pos: LabCoord,
  clearedCount: number
): LabCoord[] | null {
  if (isSameLabCoord(pos, EXIT_COORD)) {
    return clearedCount === TOTAL_VIRUS_ROOMS ? [] : null;
  }

  // Fast parity prune once Entrance is no longer 'clean' (no clean revisit left):
  // Remaining unvisited virus rooms = TOTAL_VIRUS_ROOMS - clearedCount.
  // Each step flips chessboard parity; reaching (3,3) requires parity match!
  const remainingVirus = TOTAL_VIRUS_ROOMS - clearedCount;
  const entranceCanStillBeRevisited = rooms[0][0] === 'clean';
  if (!entranceCanStillBeRevisited) {
    const startParity = (pos.row + pos.col) % 2;
    const exitParity = (EXIT_COORD.row + EXIT_COORD.col) % 2;
    const neededParity = (startParity + remainingVirus) % 2;
    if (neededParity !== exitParity) {
      return null;
    }
  }

  const neighbors = getAccessibleNeighbors(rooms, pos);
  // Prefer revisiting clean entrance early or low-degree neighbors (Warnsdorff heuristic for instant speed)
  neighbors.sort((a, b) => {
    const aClean = rooms[a.row][a.col] === 'clean' ? -10 : 0;
    const bClean = rooms[b.row][b.col] === 'clean' ? -10 : 0;
    if (aClean !== bClean) return aClean - bClean;
    const aExit = isSameLabCoord(a, EXIT_COORD) ? 5 : 0;
    const bExit = isSameLabCoord(b, EXIT_COORD) ? 5 : 0;
    return aExit - bExit;
  });

  for (const next of neighbors) {
    // Do not enter EXIT unless it is the very last contaminated room
    if (isSameLabCoord(next, EXIT_COORD) && clearedCount + 1 < TOTAL_VIRUS_ROOMS) {
      continue;
    }

    const prevFrom = rooms[pos.row][pos.col];
    const prevTo = rooms[next.row][next.col];

    if (prevFrom === 'active_cleared') rooms[pos.row][pos.col] = 'sealed';
    const nextCleared = prevTo === 'contaminated' ? clearedCount + 1 : clearedCount;
    rooms[next.row][next.col] = 'active_cleared';

    const sub = solveFromBoard(rooms, next, nextCleared);

    rooms[pos.row][pos.col] = prevFrom;
    rooms[next.row][next.col] = prevTo;

    if (sub !== null) {
      return [next, ...sub];
    }
  }

  return null;
}

export function getVirusSolverAdvice(state: VirusGameState): VirusSolverAdvice {
  if (state.status === 'won') {
    return { solvableFromHere: true, nextRoom: null, undoCountToSolvable: 0 };
  }

  if (state.status === 'playing') {
    const sol = solveFromBoard(cloneRooms(state.rooms), state.position, state.clearedVirusCount);
    if (sol && sol.length > 0) {
      return { solvableFromHere: true, nextRoom: sol[0], undoCountToSolvable: 0 };
    }
  }

  // Scan backward through undo history to find fewest steps to undo to a solvable board
  for (let steps = 1; steps <= state.moves.length; steps++) {
    const rewound = undoVirusSteps(state, steps);
    const sol = solveFromBoard(
      cloneRooms(rewound.rooms),
      rewound.position,
      rewound.clearedVirusCount
    );
    if (sol !== null) {
      return { solvableFromHere: false, nextRoom: null, undoCountToSolvable: steps };
    }
  }

  return { solvableFromHere: false, nextRoom: null, undoCountToSolvable: state.moves.length };
}
