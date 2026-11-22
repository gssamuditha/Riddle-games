export type CargoId = 'wolf' | 'goat' | 'cabbage';
export type Shore = 'west' | 'east';
export type FerryGameStatus = 'playing' | 'won' | 'lost';

export interface CargoProfile {
  id: CargoId;
  name: string;
  shortName: string;
  role: string;
  description: string;
}

export const FERRY_PAR_MOVES = 7;

export const CARGO_ITEMS: readonly CargoProfile[] = [
  {
    id: 'wolf',
    name: 'Ash-Wolf',
    shortName: 'Wolf',
    role: 'Predator',
    description: 'Restless predator. Will devour the Goat if left unattended.',
  },
  {
    id: 'goat',
    name: 'Highland Goat',
    shortName: 'Goat',
    role: 'Grazer',
    description: 'Always hungry. Will devour the Moon-Cabbage if left unattended.',
  },
  {
    id: 'cabbage',
    name: 'Moon-Cabbage',
    shortName: 'Cabbage',
    role: 'Heirloom',
    description: 'Luminous silver-leafed relic prized by the Archive alchemists.',
  },
] as const;

export const CARGO_MAP: Record<CargoId, CargoProfile> = {
  wolf: CARGO_ITEMS[0],
  goat: CARGO_ITEMS[1],
  cabbage: CARGO_ITEMS[2],
};

export interface FerryConflict {
  shore: Shore;
  pair: ['wolf', 'goat'] | ['goat', 'cabbage'];
  headline: string;
  reason: string;
}

export interface FerrySnapshot {
  positions: Record<CargoId, Shore>;
  ferrymanSide: Shore;
}

export interface FerryMoveRecord {
  step: number;
  passenger: CargoId | null;
  from: Shore;
  to: Shore;
  before: FerrySnapshot;
}

export interface FerryGameState {
  positions: Record<CargoId, Shore>;
  ferrymanSide: Shore;
  boarded: CargoId | null;
  moves: FerryMoveRecord[];
  status: FerryGameStatus;
  conflict: FerryConflict | null;
  hintsUsed: number;
  undosUsed: number;
}

export interface FerryOptimalSolution {
  minRemainingMoves: number;
  moves: (CargoId | null)[];
}

export function createInitialFerryState(): FerryGameState {
  return {
    positions: {
      wolf: 'west',
      goat: 'west',
      cabbage: 'west',
    },
    ferrymanSide: 'west',
    boarded: null,
    moves: [],
    status: 'playing',
    conflict: null,
    hintsUsed: 0,
    undosUsed: 0,
  };
}

export function getOppositeShore(shore: Shore): Shore {
  return shore === 'west' ? 'east' : 'west';
}

export function getCargoOnShore(state: FerryGameState, shore: Shore): CargoProfile[] {
  return CARGO_ITEMS.filter((item) => state.positions[item.id] === shore);
}

export function allCargoDelivered(positions: Record<CargoId, Shore>): boolean {
  return CARGO_ITEMS.every((item) => positions[item.id] === 'east');
}

export function checkShoreConflict(
  positions: Record<CargoId, Shore>,
  ferrymanSide: Shore
): FerryConflict | null {
  const unattended = getOppositeShore(ferrymanSide);
  const shoreLabel = unattended === 'west' ? 'Mistwater Landing' : 'Sanctuary Pier';

  const wolfUnattended = positions.wolf === unattended;
  const goatUnattended = positions.goat === unattended;
  const cabbageUnattended = positions.cabbage === unattended;

  if (wolfUnattended && goatUnattended) {
    return {
      shore: unattended,
      pair: ['wolf', 'goat'],
      headline: 'The Ash-Wolf Struck',
      reason: `Left unattended on ${shoreLabel}, the Ash-Wolf devoured the Highland Goat.`,
    };
  }

  if (goatUnattended && cabbageUnattended) {
    return {
      shore: unattended,
      pair: ['goat', 'cabbage'],
      headline: 'The Relic Was Devoured',
      reason: `Left unattended on ${shoreLabel}, the Highland Goat ate the Moon-Cabbage.`,
    };
  }

  return null;
}

/**
 * Click a passenger on the Ferryman's shore to board the skiff.
 * Clicking the already-boarded passenger returns them to shore.
 * Clicking a different passenger on the same shore smoothly swaps seats.
 */
export function toggleBoardCargo(
  state: FerryGameState,
  cargoId: CargoId
): { state: FerryGameState; error?: string } {
  if (state.status !== 'playing') {
    return { state, error: 'This voyage has ended. Undo or reset to try again.' };
  }

  if (state.positions[cargoId] !== state.ferrymanSide) {
    return {
      state,
      error: `The skiff is docked at ${
        state.ferrymanSide === 'west' ? 'Mistwater Landing' : 'Sanctuary Pier'
      }.`,
    };
  }

  if (state.boarded === cargoId) {
    return { state: { ...state, boarded: null } };
  }

  return { state: { ...state, boarded: cargoId } };
}

export function commitRowing(
  state: FerryGameState
): { state: FerryGameState; move: FerryMoveRecord | null; error?: string } {
  if (state.status !== 'playing') {
    return { state, move: null, error: 'This voyage has ended.' };
  }

  const from = state.ferrymanSide;
  const to = getOppositeShore(from);
  const passenger = state.boarded;

  if (passenger && state.positions[passenger] !== from) {
    return { state, move: null, error: 'The boarded passenger must be on the skiff’s shore.' };
  }

  const before: FerrySnapshot = {
    positions: { ...state.positions },
    ferrymanSide: from,
  };

  const nextPositions: Record<CargoId, Shore> = { ...state.positions };
  if (passenger) {
    nextPositions[passenger] = to;
  }

  const move: FerryMoveRecord = {
    step: state.moves.length + 1,
    passenger,
    from,
    to,
    before,
  };

  const conflict = checkShoreConflict(nextPositions, to);
  let nextStatus: FerryGameStatus = 'playing';

  if (conflict) {
    nextStatus = 'lost';
  } else if (allCargoDelivered(nextPositions)) {
    nextStatus = 'won';
  }

  return {
    move,
    state: {
      ...state,
      positions: nextPositions,
      ferrymanSide: to,
      boarded: null,
      moves: [...state.moves, move],
      status: nextStatus,
      conflict,
    },
  };
}

export function undoLastRow(state: FerryGameState): FerryGameState {
  if (state.moves.length === 0) return state;

  const lastMove = state.moves[state.moves.length - 1];
  return {
    ...state,
    positions: { ...lastMove.before.positions },
    ferrymanSide: lastMove.before.ferrymanSide,
    boarded: null,
    moves: state.moves.slice(0, -1),
    status: 'playing',
    conflict: null,
    undosUsed: state.undosUsed + 1,
  };
}

export function recordFerryHintUsed(state: FerryGameState): FerryGameState {
  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
  };
}

export function calculateFerryStars(state: FerryGameState): 0 | 1 | 2 | 3 {
  if (state.status !== 'won') return 0;
  if (state.moves.length <= FERRY_PAR_MOVES && state.hintsUsed === 0 && state.undosUsed === 0) {
    return 3;
  }
  if (state.moves.length <= FERRY_PAR_MOVES + 2 && state.hintsUsed <= 1) {
    return 2;
  }
  return 1;
}

// --- Exact BFS Shortest-Path Solver (16-state safe river graph) ---

const ORDERED_CARGO: CargoId[] = ['wolf', 'goat', 'cabbage'];

function encodeFerryState(positions: Record<CargoId, Shore>, ferrymanSide: Shore): number {
  let code = 0;
  for (let i = 0; i < ORDERED_CARGO.length; i++) {
    if (positions[ORDERED_CARGO[i]] === 'east') code |= 1 << i;
  }
  if (ferrymanSide === 'east') code |= 1 << 3;
  return code;
}

function decodeFerryState(code: number): {
  positions: Record<CargoId, Shore>;
  ferrymanSide: Shore;
} {
  return {
    positions: {
      wolf: (code & 1) !== 0 ? 'east' : 'west',
      goat: (code & 2) !== 0 ? 'east' : 'west',
      cabbage: (code & 4) !== 0 ? 'east' : 'west',
    },
    ferrymanSide: (code & 8) !== 0 ? 'east' : 'west',
  };
}

export function solveFerryOptimal(
  positions: Record<CargoId, Shore>,
  ferrymanSide: Shore
): FerryOptimalSolution {
  const startCode = encodeFerryState(positions, ferrymanSide);
  const goalCode = 0b1111; // all 3 cargo + ferryman on east

  if (startCode === goalCode) {
    return { minRemainingMoves: 0, moves: [] };
  }

  const visited = new Array<boolean>(16).fill(false);
  const parent = new Array<number>(16).fill(-1);
  const parentMove = new Array<CargoId | null>(16).fill(null);

  const queue: number[] = [startCode];
  visited[startCode] = true;

  while (queue.length > 0) {
    const u = queue.shift()!;
    if (u === goalCode) break;

    const decoded = decodeFerryState(u);
    const nextSide = getOppositeShore(decoded.ferrymanSide);

    // Candidate passengers: null (row alone) or any cargo on ferrymanSide
    const candidates: (CargoId | null)[] = [null];
    for (const id of ORDERED_CARGO) {
      if (decoded.positions[id] === decoded.ferrymanSide) {
        candidates.push(id);
      }
    }

    for (const passenger of candidates) {
      const nextPos: Record<CargoId, Shore> = { ...decoded.positions };
      if (passenger) nextPos[passenger] = nextSide;

      // Skip unsafe states that trigger an unattended conflict
      if (checkShoreConflict(nextPos, nextSide) !== null) continue;

      const v = encodeFerryState(nextPos, nextSide);
      if (!visited[v]) {
        visited[v] = true;
        parent[v] = u;
        parentMove[v] = passenger;
        queue.push(v);
      }
    }
  }

  if (!visited[goalCode]) {
    return { minRemainingMoves: Infinity, moves: [] };
  }

  const moves: (CargoId | null)[] = [];
  let curr = goalCode;
  while (curr !== startCode && parent[curr] !== -1) {
    moves.push(parentMove[curr]);
    curr = parent[curr];
  }
  moves.reverse();

  return {
    minRemainingMoves: moves.length,
    moves,
  };
}

