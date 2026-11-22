export type Direction = 'N' | 'S' | 'E' | 'W';
export type PilgrimStatus = 'playing' | 'won' | 'temple_rejected' | 'stuck';

export interface GridCoord {
  row: number; // 0 (North) .. 4 (South)
  col: number; // 0 (West) .. 4 (East)
}

export const GRID_MAX = 4; // 4x4 city blocks -> 5x5 intersections (0..4)
export const GATE_COORD: GridCoord = { row: 0, col: 0 };
export const START_COORD: GridCoord = { row: 0, col: 2 }; // After mandatory 2 blocks East
export const TEMPLE_COORD: GridCoord = { row: 4, col: 4 };
export const START_TAX = 4;
export const PILGRIM_PAR_STEPS = 20;

// Verified mathematical shortest 20-step path from (0,2) tax=4 -> (4,4) tax=0
export const CANONICAL_SOLUTION: readonly Direction[] = [
  'S', 'S', 'S', 'E', 'E', 'N', 'N', 'N', 'W', 'S',
  'W', 'W', 'W', 'S', 'S', 'S', 'E', 'E', 'E', 'E',
] as const;

export interface DirectionRule {
  dir: Direction;
  label: string;
  symbol: string;
  opText: string;
  dr: number;
  dc: number;
  applyTax: (tax: number) => number;
}

export const DIRECTION_RULES: Record<Direction, DirectionRule> = {
  E: {
    dir: 'E',
    label: 'East',
    symbol: '→',
    opText: '+2',
    dr: 0,
    dc: 1,
    applyTax: (t) => t + 2,
  },
  W: {
    dir: 'W',
    label: 'West',
    symbol: '←',
    opText: '−2',
    dr: 0,
    dc: -1,
    applyTax: (t) => t - 2,
  },
  S: {
    dir: 'S',
    label: 'South',
    symbol: '↓',
    opText: '×2',
    dr: 1,
    dc: 0,
    applyTax: (t) => t * 2,
  },
  N: {
    dir: 'N',
    label: 'North',
    symbol: '↑',
    opText: '÷2',
    dr: -1,
    dc: 0,
    applyTax: (t) => t / 2,
  },
};

export const ALL_DIRECTIONS: readonly Direction[] = ['N', 'S', 'E', 'W'] as const;

export function makeEdgeKey(a: GridCoord, b: GridCoord): string {
  const aFirst = a.row < b.row || (a.row === b.row && a.col < b.col);
  return aFirst
    ? `${a.row},${a.col}-${b.row},${b.col}`
    : `${b.row},${b.col}-${a.row},${a.col}`;
}

export const INITIAL_ENTRY_EDGES: readonly string[] = [
  makeEdgeKey({ row: 0, col: 0 }, { row: 0, col: 1 }),
  makeEdgeKey({ row: 0, col: 1 }, { row: 0, col: 2 }),
];

export interface PilgrimMoveRecord {
  step: number;
  dir: Direction;
  from: GridCoord;
  to: GridCoord;
  edgeKey: string;
  taxBefore: number;
  taxAfter: number;
}

export interface PilgrimGameState {
  position: GridCoord;
  tax: number;
  usedEdges: string[];
  moves: PilgrimMoveRecord[];
  status: PilgrimStatus;
  hintsUsed: number;
  undosUsed: number;
}

export interface PilgrimHintGuidance {
  onCanonicalTrack: boolean;
  nextDir: Direction | null;
  undoCountToCanonical: number;
  stepsRemainingOnCanonical: number;
}

export function createInitialPilgrimState(): PilgrimGameState {
  return {
    position: { ...START_COORD },
    tax: START_TAX,
    usedEdges: [...INITIAL_ENTRY_EDGES],
    moves: [],
    status: 'playing',
    hintsUsed: 0,
    undosUsed: 0,
  };
}

export function isSameCoord(a: GridCoord, b: GridCoord): boolean {
  return a.row === b.row && a.col === b.col;
}

export function formatTax(value: number): string {
  if (Math.abs(value) < 1e-9) return '0';
  if (Number.isInteger(value)) return String(value);
  // Trim trailing zeros cleanly up to 4 decimal places
  return Number(value.toFixed(4)).toString();
}

export function getDirectionBetween(from: GridCoord, to: GridCoord): Direction | null {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  if (dr === -1 && dc === 0) return 'N';
  if (dr === 1 && dc === 0) return 'S';
  if (dr === 0 && dc === 1) return 'E';
  if (dr === 0 && dc === -1) return 'W';
  return null;
}

export function getValidMovesFrom(
  position: GridCoord,
  usedEdges: readonly string[]
): { dir: Direction; to: GridCoord; edgeKey: string }[] {
  const used = new Set(usedEdges);
  const valid: { dir: Direction; to: GridCoord; edgeKey: string }[] = [];

  for (const dir of ALL_DIRECTIONS) {
    const rule = DIRECTION_RULES[dir];
    const to = { row: position.row + rule.dr, col: position.col + rule.dc };
    if (to.row < 0 || to.row > GRID_MAX || to.col < 0 || to.col > GRID_MAX) continue;
    const edgeKey = makeEdgeKey(position, to);
    if (used.has(edgeKey)) continue;
    valid.push({ dir, to, edgeKey });
  }

  return valid;
}

export function canStepDirection(
  state: PilgrimGameState,
  dir: Direction
): { ok: boolean; to?: GridCoord; nextTax?: number; edgeKey?: string; reason?: string } {
  if (state.status !== 'playing') {
    return { ok: false, reason: 'Undo a step or reset to continue walking.' };
  }

  const rule = DIRECTION_RULES[dir];
  const to: GridCoord = {
    row: state.position.row + rule.dr,
    col: state.position.col + rule.dc,
  };

  if (to.row < 0 || to.row > GRID_MAX || to.col < 0 || to.col > GRID_MAX) {
    return { ok: false, reason: 'The city wall blocks that direction.' };
  }

  const edgeKey = makeEdgeKey(state.position, to);
  if (state.usedEdges.includes(edgeKey)) {
    return { ok: false, reason: 'You cannot walk down the same street block twice.' };
  }

  return {
    ok: true,
    to,
    edgeKey,
    nextTax: rule.applyTax(state.tax),
  };
}

export function stepPilgrim(
  state: PilgrimGameState,
  dir: Direction
): { state: PilgrimGameState; move: PilgrimMoveRecord | null; error?: string } {
  const check = canStepDirection(state, dir);
  if (!check.ok || !check.to || check.edgeKey === undefined || check.nextTax === undefined) {
    return { state, move: null, error: check.reason };
  }

  const nextUsedEdges = [...state.usedEdges, check.edgeKey];
  const nextTax = Math.abs(check.nextTax) < 1e-9 ? 0 : check.nextTax;

  const move: PilgrimMoveRecord = {
    step: state.moves.length + 1,
    dir,
    from: { ...state.position },
    to: check.to,
    edgeKey: check.edgeKey,
    taxBefore: state.tax,
    taxAfter: nextTax,
  };

  let nextStatus: PilgrimStatus = 'playing';
  if (isSameCoord(check.to, TEMPLE_COORD)) {
    nextStatus = nextTax === 0 ? 'won' : 'temple_rejected';
  } else if (getValidMovesFrom(check.to, nextUsedEdges).length === 0) {
    nextStatus = 'stuck';
  }

  return {
    move,
    state: {
      ...state,
      position: check.to,
      tax: nextTax,
      usedEdges: nextUsedEdges,
      moves: [...state.moves, move],
      status: nextStatus,
    },
  };
}

export function undoPilgrimSteps(state: PilgrimGameState, count = 1): PilgrimGameState {
  if (state.moves.length === 0 || count <= 0) return state;

  const stepsToUndo = Math.min(count, state.moves.length);
  const keptMoves = state.moves.slice(0, state.moves.length - stepsToUndo);

  const position =
    keptMoves.length > 0 ? { ...keptMoves[keptMoves.length - 1].to } : { ...START_COORD };
  const tax = keptMoves.length > 0 ? keptMoves[keptMoves.length - 1].taxAfter : START_TAX;
  const usedEdges = [...INITIAL_ENTRY_EDGES, ...keptMoves.map((m) => m.edgeKey)];

  return {
    ...state,
    position,
    tax,
    usedEdges,
    moves: keptMoves,
    status: 'playing',
    undosUsed: state.undosUsed + 1,
  };
}

export function recordPilgrimHintUsed(state: PilgrimGameState): PilgrimGameState {
  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
  };
}

export function calculatePilgrimStars(state: PilgrimGameState): 0 | 1 | 2 | 3 {
  if (state.status !== 'won') return 0;
  if (state.moves.length <= PILGRIM_PAR_STEPS && state.hintsUsed === 0 && state.undosUsed === 0) {
    return 3;
  }
  if (state.hintsUsed <= 1) return 2;
  return 1;
}

/**
 * Checks how closely the player matches the verified 20-step solution path
 * and computes either the exact next step or how many steps to undo to rejoin it.
 */
export function getPilgrimHintGuidance(state: PilgrimGameState): PilgrimHintGuidance {
  let matchingPrefix = 0;
  for (let i = 0; i < state.moves.length && i < CANONICAL_SOLUTION.length; i++) {
    if (state.moves[i].dir === CANONICAL_SOLUTION[i]) {
      matchingPrefix++;
    } else {
      break;
    }
  }

  const onCanonicalTrack = matchingPrefix === state.moves.length;
  const nextDir =
    onCanonicalTrack && matchingPrefix < CANONICAL_SOLUTION.length
      ? CANONICAL_SOLUTION[matchingPrefix]
      : null;

  return {
    onCanonicalTrack,
    nextDir,
    undoCountToCanonical: state.moves.length - matchingPrefix,
    stepsRemainingOnCanonical: CANONICAL_SOLUTION.length - matchingPrefix,
  };
}

