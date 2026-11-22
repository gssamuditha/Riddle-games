export type TravelerId = 'lyra' | 'tomas' | 'garrick' | 'orin';
export type Bank = 'left' | 'right';
export type BridgeGameStatus = 'playing' | 'won' | 'lost';

export interface TravelerProfile {
  id: TravelerId;
  name: string;
  role: string;
  time: number;
  accentColor: string;
  badgeClass: string;
  shortDesc: string;
}

export const BRIDGE_TIME_LIMIT = 17;
export const MAX_BRIDGE_CAPACITY = 2;

export const TRAVELERS: readonly TravelerProfile[] = [
  {
    id: 'lyra',
    name: 'Lyra',
    role: 'The Courier',
    time: 1,
    accentColor: '#34d399',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35',
    shortDesc: 'Nimble cliff-runner; crosses the span in a sprint.',
  },
  {
    id: 'tomas',
    name: 'Tomas',
    role: 'The Cartographer',
    time: 2,
    accentColor: '#38bdf8',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/35',
    shortDesc: 'Quick and measured, balancing his brass map case.',
  },
  {
    id: 'garrick',
    name: 'Garrick',
    role: 'The Blacksmith',
    time: 5,
    accentColor: '#fb923c',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-400/35',
    shortDesc: 'Burdened with iron salvage tools and heavy boots.',
  },
  {
    id: 'orin',
    name: 'Master Orin',
    role: 'The Archivist',
    time: 10,
    accentColor: '#c084fc',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/35',
    shortDesc: 'Elderly keeper guarding the Solar Chronometer.',
  },
] as const;

export const TRAVELER_MAP: Record<TravelerId, TravelerProfile> = {
  lyra: TRAVELERS[0],
  tomas: TRAVELERS[1],
  garrick: TRAVELERS[2],
  orin: TRAVELERS[3],
};

export interface BoardSnapshot {
  positions: Record<TravelerId, Bank>;
  lanternSide: Bank;
  elapsedMinutes: number;
}

export interface MoveRecord {
  step: number;
  travelers: TravelerId[];
  from: Bank;
  to: Bank;
  duration: number;
  cumulativeTime: number;
  before: BoardSnapshot;
}

export interface BridgeGameState {
  positions: Record<TravelerId, Bank>;
  lanternSide: Bank;
  elapsedMinutes: number;
  timeLimit: number;
  selected: TravelerId[];
  moves: MoveRecord[];
  status: BridgeGameStatus;
  hintsUsed: number;
  undosUsed: number;
}

export interface CrossingPreview {
  canCross: boolean;
  duration: number;
  projectedTotal: number;
  from: Bank;
  to: Bank;
  reason?: string;
}

export interface OptimalSolution {
  minRemainingTime: number;
  moves: TravelerId[][];
}

export interface StateAnalysis {
  minRemainingTime: number;
  projectedBestTotal: number;
  canStillWin: boolean;
  optimalNextMove: TravelerId[] | null;
  undoCountToWinnable: number | null;
}

export function createInitialBridgeState(): BridgeGameState {
  return {
    positions: {
      lyra: 'left',
      tomas: 'left',
      garrick: 'left',
      orin: 'left',
    },
    lanternSide: 'left',
    elapsedMinutes: 0,
    timeLimit: BRIDGE_TIME_LIMIT,
    selected: [],
    moves: [],
    status: 'playing',
    hintsUsed: 0,
    undosUsed: 0,
  };
}

export function getTravelersOnBank(state: BridgeGameState, bank: Bank): TravelerProfile[] {
  return TRAVELERS.filter((t) => state.positions[t.id] === bank);
}

export function allTravelersSafe(positions: Record<TravelerId, Bank>): boolean {
  return TRAVELERS.every((t) => positions[t.id] === 'right');
}

export function getOppositeBank(bank: Bank): Bank {
  return bank === 'left' ? 'right' : 'left';
}

export function toggleTravelerSelection(
  state: BridgeGameState,
  travelerId: TravelerId
): { state: BridgeGameState; error?: string } {
  if (state.status !== 'playing') {
    return { state, error: 'This attempt has ended. Undo or restart to keep playing.' };
  }

  if (state.positions[travelerId] !== state.lanternSide) {
    return {
      state,
      error: `Only travelers on the lantern's bank (${
        state.lanternSide === 'left' ? 'Observatory Cliff' : 'Safe Ridge'
      }) can cross.`,
    };
  }

  const isSelected = state.selected.includes(travelerId);
  if (isSelected) {
    return {
      state: {
        ...state,
        selected: state.selected.filter((id) => id !== travelerId),
      },
    };
  }

  if (state.selected.length >= MAX_BRIDGE_CAPACITY) {
    return {
      state,
      error: 'The frayed ropes can hold at most 2 travelers at once.',
    };
  }

  return {
    state: {
      ...state,
      selected: [...state.selected, travelerId],
    },
  };
}

export function previewCrossing(state: BridgeGameState): CrossingPreview {
  const from = state.lanternSide;
  const to = getOppositeBank(from);

  if (state.status !== 'playing') {
    return {
      canCross: false,
      duration: 0,
      projectedTotal: state.elapsedMinutes,
      from,
      to,
      reason: 'The attempt has concluded.',
    };
  }

  if (state.selected.length === 0) {
    return {
      canCross: false,
      duration: 0,
      projectedTotal: state.elapsedMinutes,
      from,
      to,
      reason: 'Select 1 or 2 travelers on the lantern side to cross.',
    };
  }

  if (state.selected.length > MAX_BRIDGE_CAPACITY) {
    return {
      canCross: false,
      duration: 0,
      projectedTotal: state.elapsedMinutes,
      from,
      to,
      reason: 'At most 2 travelers can cross together.',
    };
  }

  const allOnLanternBank = state.selected.every((id) => state.positions[id] === from);
  if (!allOnLanternBank) {
    return {
      canCross: false,
      duration: 0,
      projectedTotal: state.elapsedMinutes,
      from,
      to,
      reason: 'All selected travelers must be beside the lantern.',
    };
  }

  const duration = Math.max(...state.selected.map((id) => TRAVELER_MAP[id].time));
  return {
    canCross: true,
    duration,
    projectedTotal: state.elapsedMinutes + duration,
    from,
    to,
  };
}

export function commitCrossing(
  state: BridgeGameState
): { state: BridgeGameState; move: MoveRecord | null; error?: string } {
  const preview = previewCrossing(state);
  if (!preview.canCross) {
    return { state, move: null, error: preview.reason };
  }

  const before: BoardSnapshot = {
    positions: { ...state.positions },
    lanternSide: state.lanternSide,
    elapsedMinutes: state.elapsedMinutes,
  };

  const nextPositions: Record<TravelerId, Bank> = { ...state.positions };
  for (const id of state.selected) {
    nextPositions[id] = preview.to;
  }

  const nextElapsed = state.elapsedMinutes + preview.duration;
  const everyoneSafe = allTravelersSafe(nextPositions);

  let nextStatus: BridgeGameStatus = 'playing';
  if (everyoneSafe && nextElapsed <= state.timeLimit) {
    nextStatus = 'won';
  } else if (nextElapsed > state.timeLimit || (nextElapsed === state.timeLimit && !everyoneSafe)) {
    nextStatus = 'lost';
  }

  const move: MoveRecord = {
    step: state.moves.length + 1,
    travelers: [...state.selected],
    from: preview.from,
    to: preview.to,
    duration: preview.duration,
    cumulativeTime: nextElapsed,
    before,
  };

  return {
    move,
    state: {
      ...state,
      positions: nextPositions,
      lanternSide: preview.to,
      elapsedMinutes: nextElapsed,
      selected: [],
      moves: [...state.moves, move],
      status: nextStatus,
    },
  };
}

export function undoLastCrossing(state: BridgeGameState): BridgeGameState {
  if (state.moves.length === 0) return state;

  const lastMove = state.moves[state.moves.length - 1];
  return {
    ...state,
    positions: { ...lastMove.before.positions },
    lanternSide: lastMove.before.lanternSide,
    elapsedMinutes: lastMove.before.elapsedMinutes,
    selected: [],
    moves: state.moves.slice(0, -1),
    status: 'playing',
    undosUsed: state.undosUsed + 1,
  };
}

export function recordHintUsed(state: BridgeGameState): BridgeGameState {
  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
  };
}

export function calculateStarRating(state: BridgeGameState): 0 | 1 | 2 | 3 {
  if (state.status !== 'won') return 0;
  if (state.hintsUsed === 0 && state.undosUsed === 0) return 3;
  if (state.hintsUsed <= 1) return 2;
  return 1;
}

// --- Exact Dijkstra Solver (32-state graph) ---

const ORDERED_IDS: TravelerId[] = ['lyra', 'tomas', 'garrick', 'orin'];

function encodeState(positions: Record<TravelerId, Bank>, lanternSide: Bank): number {
  let mask = 0;
  for (let i = 0; i < ORDERED_IDS.length; i++) {
    if (positions[ORDERED_IDS[i]] === 'right') {
      mask |= 1 << i;
    }
  }
  if (lanternSide === 'right') {
    mask |= 1 << 4;
  }
  return mask;
}

function decodeState(code: number): { positions: Record<TravelerId, Bank>; lanternSide: Bank } {
  const positions = {} as Record<TravelerId, Bank>;
  for (let i = 0; i < ORDERED_IDS.length; i++) {
    positions[ORDERED_IDS[i]] = (code & (1 << i)) !== 0 ? 'right' : 'left';
  }
  const lanternSide: Bank = (code & (1 << 4)) !== 0 ? 'right' : 'left';
  return { positions, lanternSide };
}

export function solveOptimalFromBoard(
  positions: Record<TravelerId, Bank>,
  lanternSide: Bank
): OptimalSolution {
  const startCode = encodeState(positions, lanternSide);
  const goalMask = 0b1111; // all 4 on right (lantern side will necessarily be right too)
  const goalCode = goalMask | (1 << 4);

  if ((startCode & goalMask) === goalMask) {
    return { minRemainingTime: 0, moves: [] };
  }

  const dist = new Array<number>(32).fill(Infinity);
  const parent = new Array<number>(32).fill(-1);
  const parentMove = new Array<TravelerId[] | null>(32).fill(null);
  const visited = new Array<boolean>(32).fill(false);

  dist[startCode] = 0;

  for (let iter = 0; iter < 32; iter++) {
    let u = -1;
    let bestDist = Infinity;
    for (let i = 0; i < 32; i++) {
      if (!visited[i] && dist[i] < bestDist) {
        bestDist = dist[i];
        u = i;
      }
    }
    if (u === -1 || u === goalCode) break;
    visited[u] = true;

    const decoded = decodeState(u);
    const activeIds = ORDERED_IDS.filter((id) => decoded.positions[id] === decoded.lanternSide);
    const nextLantern = getOppositeBank(decoded.lanternSide);

    // Generate all 1-traveler and 2-traveler candidate crossings
    const groups: TravelerId[][] = [];
    for (let i = 0; i < activeIds.length; i++) {
      groups.push([activeIds[i]]);
      for (let j = i + 1; j < activeIds.length; j++) {
        groups.push([activeIds[i], activeIds[j]]);
      }
    }

    for (const group of groups) {
      const nextPos: Record<TravelerId, Bank> = { ...decoded.positions };
      for (const id of group) {
        nextPos[id] = nextLantern;
      }
      const v = encodeState(nextPos, nextLantern);
      const cost = Math.max(...group.map((id) => TRAVELER_MAP[id].time));

      if (dist[u] + cost < dist[v]) {
        dist[v] = dist[u] + cost;
        parent[v] = u;
        parentMove[v] = group;
      }
    }
  }

  const moves: TravelerId[][] = [];
  let curr = goalCode;
  while (curr !== startCode && parent[curr] !== -1) {
    const stepMove = parentMove[curr];
    if (stepMove) moves.push(stepMove);
    curr = parent[curr];
  }
  moves.reverse();

  return {
    minRemainingTime: dist[goalCode],
    moves,
  };
}

export function analyzeBridgeState(state: BridgeGameState): StateAnalysis {
  const solution = solveOptimalFromBoard(state.positions, state.lanternSide);
  const projectedBestTotal = state.elapsedMinutes + solution.minRemainingTime;
  const canStillWin = projectedBestTotal <= state.timeLimit;

  let undoCountToWinnable: number | null = null;
  if (!canStillWin && state.moves.length > 0) {
    for (let i = state.moves.length - 1; i >= 0; i--) {
      const snap = state.moves[i].before;
      const snapSol = solveOptimalFromBoard(snap.positions, snap.lanternSide);
      if (snap.elapsedMinutes + snapSol.minRemainingTime <= state.timeLimit) {
        undoCountToWinnable = state.moves.length - i;
        break;
      }
    }
  }

  return {
    minRemainingTime: solution.minRemainingTime,
    projectedBestTotal,
    canStillWin,
    optimalNextMove: solution.moves[0] ?? null,
    undoCountToWinnable,
  };
}

