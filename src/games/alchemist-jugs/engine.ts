export type JugId = 'small' | 'large';
export type JugsGameStatus = 'playing' | 'won';

export const SMALL_CAPACITY = 3;
export const LARGE_CAPACITY = 5;
export const TARGET_VOLUME = 4;
export const JUGS_PAR_MOVES = 6;

export interface JugProfile {
  id: JugId;
  name: string;
  shortName: string;
  capacity: number;
}

export const JUG_PROFILES: Record<JugId, JugProfile> = {
  small: {
    id: 'small',
    name: 'Small Flask',
    shortName: '3L Flask',
    capacity: SMALL_CAPACITY,
  },
  large: {
    id: 'large',
    name: 'Tall Flask',
    shortName: '5L Flask',
    capacity: LARGE_CAPACITY,
  },
};

export type JugAction =
  | { type: 'fill'; jug: JugId }
  | { type: 'empty'; jug: JugId }
  | { type: 'pour'; from: JugId; to: JugId };

export interface JugsSnapshot {
  small: number;
  large: number;
}

export interface JugMoveRecord {
  step: number;
  action: JugAction;
  transferred: number;
  resultSmall: number;
  resultLarge: number;
  before: JugsSnapshot;
}

export interface JugsGameState {
  small: number;
  large: number;
  moves: JugMoveRecord[];
  status: JugsGameStatus;
  hintsUsed: number;
  undosUsed: number;
}

export interface JugsOptimalSolution {
  minRemainingMoves: number;
  actions: JugAction[];
}

export function createInitialJugsState(): JugsGameState {
  return {
    small: 0,
    large: 0,
    moves: [],
    status: 'playing',
    hintsUsed: 0,
    undosUsed: 0,
  };
}

export function getOtherJug(jug: JugId): JugId {
  return jug === 'small' ? 'large' : 'small';
}

export function getJugAmount(state: Pick<JugsGameState, 'small' | 'large'>, jug: JugId): number {
  return jug === 'small' ? state.small : state.large;
}

export function canApplyJugAction(
  state: JugsGameState,
  action: JugAction
): { ok: boolean; reason?: string; transferred?: number } {
  if (state.status !== 'playing') {
    return { ok: false, reason: 'The vault is already unlocked.' };
  }

  if (action.type === 'fill') {
    const cap = JUG_PROFILES[action.jug].capacity;
    const cur = getJugAmount(state, action.jug);
    if (cur >= cap) {
      return { ok: false, reason: `${JUG_PROFILES[action.jug].shortName} is already brimming.` };
    }
    return { ok: true, transferred: cap - cur };
  }

  if (action.type === 'empty') {
    const cur = getJugAmount(state, action.jug);
    if (cur <= 0) {
      return { ok: false, reason: `${JUG_PROFILES[action.jug].shortName} is already empty.` };
    }
    return { ok: true, transferred: cur };
  }

  // Pour
  if (action.from === action.to) {
    return { ok: false, reason: 'Choose the other flask to pour into.' };
  }
  const sourceAmt = getJugAmount(state, action.from);
  const destAmt = getJugAmount(state, action.to);
  const destCap = JUG_PROFILES[action.to].capacity;

  if (sourceAmt <= 0) {
    return { ok: false, reason: `${JUG_PROFILES[action.from].shortName} has no elixir to pour.` };
  }
  if (destAmt >= destCap) {
    return { ok: false, reason: `${JUG_PROFILES[action.to].shortName} is already full.` };
  }

  const transferred = Math.min(sourceAmt, destCap - destAmt);
  return { ok: true, transferred };
}

export function applyJugAction(
  state: JugsGameState,
  action: JugAction
): { state: JugsGameState; move: JugMoveRecord | null; error?: string } {
  const check = canApplyJugAction(state, action);
  if (!check.ok) {
    return { state, move: null, error: check.reason };
  }

  const before: JugsSnapshot = { small: state.small, large: state.large };
  let nextSmall = state.small;
  let nextLarge = state.large;
  const transferred = check.transferred ?? 0;

  if (action.type === 'fill') {
    if (action.jug === 'small') nextSmall = SMALL_CAPACITY;
    else nextLarge = LARGE_CAPACITY;
  } else if (action.type === 'empty') {
    if (action.jug === 'small') nextSmall = 0;
    else nextLarge = 0;
  } else {
    if (action.from === 'small') {
      nextSmall -= transferred;
      nextLarge += transferred;
    } else {
      nextLarge -= transferred;
      nextSmall += transferred;
    }
  }

  const won = nextSmall === TARGET_VOLUME || nextLarge === TARGET_VOLUME;

  const move: JugMoveRecord = {
    step: state.moves.length + 1,
    action,
    transferred,
    resultSmall: nextSmall,
    resultLarge: nextLarge,
    before,
  };

  return {
    move,
    state: {
      ...state,
      small: nextSmall,
      large: nextLarge,
      moves: [...state.moves, move],
      status: won ? 'won' : 'playing',
    },
  };
}

export function undoLastJugMove(state: JugsGameState): JugsGameState {
  if (state.moves.length === 0) return state;
  const last = state.moves[state.moves.length - 1];
  return {
    ...state,
    small: last.before.small,
    large: last.before.large,
    moves: state.moves.slice(0, -1),
    status: 'playing',
    undosUsed: state.undosUsed + 1,
  };
}

export function recordJugHintUsed(state: JugsGameState): JugsGameState {
  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
  };
}

export function calculateJugsStars(state: JugsGameState): 0 | 1 | 2 | 3 {
  if (state.status !== 'won') return 0;
  if (state.moves.length <= JUGS_PAR_MOVES && state.hintsUsed === 0 && state.undosUsed === 0) {
    return 3;
  }
  if (state.moves.length <= JUGS_PAR_MOVES + 2 && state.hintsUsed <= 1) {
    return 2;
  }
  return 1;
}

export function formatJugActionLabel(action: JugAction): string {
  if (action.type === 'fill') {
    return `Fill ${JUG_PROFILES[action.jug].shortName}`;
  }
  if (action.type === 'empty') {
    return `Empty ${JUG_PROFILES[action.jug].shortName}`;
  }
  return `Pour ${JUG_PROFILES[action.from].shortName} → ${JUG_PROFILES[action.to].shortName}`;
}

// --- Exact BFS Shortest-Path Solver (24-state vessel graph) ---

function encodeJugs(small: number, large: number): number {
  return small * (LARGE_CAPACITY + 1) + large;
}

function decodeJugs(code: number): { small: number; large: number } {
  return {
    small: Math.floor(code / (LARGE_CAPACITY + 1)),
    large: code % (LARGE_CAPACITY + 1),
  };
}

const ALL_ACTIONS: JugAction[] = [
  { type: 'fill', jug: 'large' },
  { type: 'fill', jug: 'small' },
  { type: 'pour', from: 'large', to: 'small' },
  { type: 'pour', from: 'small', to: 'large' },
  { type: 'empty', jug: 'small' },
  { type: 'empty', jug: 'large' },
];

export function solveJugsOptimal(small: number, large: number): JugsOptimalSolution {
  if (small === TARGET_VOLUME || large === TARGET_VOLUME) {
    return { minRemainingMoves: 0, actions: [] };
  }

  const totalStates = (SMALL_CAPACITY + 1) * (LARGE_CAPACITY + 1);
  const startCode = encodeJugs(small, large);
  const visited = new Array<boolean>(totalStates).fill(false);
  const parent = new Array<number>(totalStates).fill(-1);
  const parentAction = new Array<JugAction | null>(totalStates).fill(null);

  const queue: number[] = [startCode];
  visited[startCode] = true;
  let goalCode = -1;

  while (queue.length > 0) {
    const u = queue.shift()!;
    const cur = decodeJugs(u);
    if (cur.small === TARGET_VOLUME || cur.large === TARGET_VOLUME) {
      goalCode = u;
      break;
    }

    const tempState: JugsGameState = {
      small: cur.small,
      large: cur.large,
      moves: [],
      status: 'playing',
      hintsUsed: 0,
      undosUsed: 0,
    };

    for (const action of ALL_ACTIONS) {
      const res = applyJugAction(tempState, action);
      if (!res.move) continue;
      const v = encodeJugs(res.state.small, res.state.large);
      if (!visited[v]) {
        visited[v] = true;
        parent[v] = u;
        parentAction[v] = action;
        queue.push(v);
      }
    }
  }

  if (goalCode === -1) {
    return { minRemainingMoves: Infinity, actions: [] };
  }

  const actions: JugAction[] = [];
  let curr = goalCode;
  while (curr !== startCode && parent[curr] !== -1) {
    const act = parentAction[curr];
    if (act) actions.push(act);
    curr = parent[curr];
  }
  actions.reverse();

  return {
    minRemainingMoves: actions.length,
    actions,
  };
}

