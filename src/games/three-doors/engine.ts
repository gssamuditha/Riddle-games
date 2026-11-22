export type DoorIndex = 0 | 1 | 2;
export type VaultRoundPhase = 'pick' | 'decide' | 'revealed';
export type VaultTrialStatus = 'playing' | 'won' | 'lost';

export const DOORS: readonly DoorIndex[] = [0, 1, 2] as const;
export const DOOR_NUMERALS: Record<DoorIndex, string> = {
  0: 'I',
  1: 'II',
  2: 'III',
};

export const KEYS_TO_WIN = 6;
export const MAX_ROUNDS = 10;
export const MAX_LOSSES = MAX_ROUNDS - KEYS_TO_WIN + 1; // 5 empty traps makes 6 keys unreachable

export interface VaultRoundState {
  roundNumber: number;
  prizeDoor: DoorIndex;
  initialPick: DoorIndex | null;
  hostRevealedDoor: DoorIndex | null;
  finalPick: DoorIndex | null;
  switched: boolean | null;
  wonRound: boolean | null;
  phase: VaultRoundPhase;
}

export interface CompletedVaultRound {
  roundNumber: number;
  prizeDoor: DoorIndex;
  initialPick: DoorIndex;
  hostRevealedDoor: DoorIndex;
  finalPick: DoorIndex;
  switched: boolean;
  won: boolean;
}

export interface VaultTrialState {
  currentRound: VaultRoundState;
  history: CompletedVaultRound[];
  keysCollected: number;
  lossesCount: number;
  status: VaultTrialStatus;
  hintsUsed: number;
}

export interface StrategyStats {
  stayTotal: number;
  stayWins: number;
  stayRate: number | null;
  switchTotal: number;
  switchWins: number;
  switchRate: number | null;
}

export interface SimulationBatchResult {
  trials: number;
  stayWins: number;
  switchWins: number;
  stayPct: number;
  switchPct: number;
}

function randomDoor(rng: () => number = Math.random): DoorIndex {
  const n = Math.floor(rng() * 3);
  return (n <= 0 ? 0 : n === 1 ? 1 : 2) as DoorIndex;
}

export function createRound(
  roundNumber: number,
  rng: () => number = Math.random
): VaultRoundState {
  return {
    roundNumber,
    prizeDoor: randomDoor(rng),
    initialPick: null,
    hostRevealedDoor: null,
    finalPick: null,
    switched: null,
    wonRound: null,
    phase: 'pick',
  };
}

export function createInitialVaultState(rng: () => number = Math.random): VaultTrialState {
  return {
    currentRound: createRound(1, rng),
    history: [],
    keysCollected: 0,
    lossesCount: 0,
    status: 'playing',
    hintsUsed: 0,
  };
}

/**
 * Given the hidden prize door and the player's initial pick, the Archivist ALWAYS reveals
 * one of the other two doors that does NOT hide the Astral Key.
 */
export function selectHostRevealDoor(
  prizeDoor: DoorIndex,
  initialPick: DoorIndex,
  rng: () => number = Math.random
): DoorIndex {
  const candidates = DOORS.filter((d) => d !== prizeDoor && d !== initialPick);
  if (candidates.length === 1) return candidates[0];
  return rng() < 0.5 ? candidates[0] : candidates[1];
}

export function getSwitchTargetDoor(round: VaultRoundState): DoorIndex | null {
  if (round.initialPick === null || round.hostRevealedDoor === null) return null;
  const remaining = DOORS.find(
    (d) => d !== round.initialPick && d !== round.hostRevealedDoor
  );
  return remaining ?? null;
}

export function pickInitialDoor(
  state: VaultTrialState,
  door: DoorIndex,
  rng: () => number = Math.random
): { state: VaultTrialState; error?: string } {
  if (state.status !== 'playing') {
    return { state, error: 'This trial has already concluded.' };
  }
  if (state.currentRound.phase !== 'pick') {
    return { state, error: 'You have already chosen an initial door for this round.' };
  }

  const hostRevealedDoor = selectHostRevealDoor(state.currentRound.prizeDoor, door, rng);

  return {
    state: {
      ...state,
      currentRound: {
        ...state.currentRound,
        initialPick: door,
        hostRevealedDoor,
        phase: 'decide',
      },
    },
  };
}

export function finalizeDoorChoice(
  state: VaultTrialState,
  finalDoor: DoorIndex
): { state: VaultTrialState; roundResult: CompletedVaultRound | null; error?: string } {
  if (state.status !== 'playing') {
    return { state, roundResult: null, error: 'This trial has already concluded.' };
  }
  const round = state.currentRound;
  if (round.phase !== 'decide' || round.initialPick === null || round.hostRevealedDoor === null) {
    return { state, roundResult: null, error: 'Choose an initial door first.' };
  }
  if (finalDoor === round.hostRevealedDoor) {
    return { state, roundResult: null, error: 'That vault has already been unsealed as empty.' };
  }

  const switched = finalDoor !== round.initialPick;
  const won = finalDoor === round.prizeDoor;

  const roundResult: CompletedVaultRound = {
    roundNumber: round.roundNumber,
    prizeDoor: round.prizeDoor,
    initialPick: round.initialPick,
    hostRevealedDoor: round.hostRevealedDoor,
    finalPick: finalDoor,
    switched,
    won,
  };

  const keysCollected = state.keysCollected + (won ? 1 : 0);
  const lossesCount = state.lossesCount + (won ? 0 : 1);

  let nextStatus: VaultTrialStatus = 'playing';
  if (keysCollected >= KEYS_TO_WIN) {
    nextStatus = 'won';
  } else if (lossesCount >= MAX_LOSSES || round.roundNumber >= MAX_ROUNDS) {
    nextStatus = 'lost';
  }

  return {
    roundResult,
    state: {
      ...state,
      currentRound: {
        ...round,
        finalPick: finalDoor,
        switched,
        wonRound: won,
        phase: 'revealed',
      },
      history: [...state.history, roundResult],
      keysCollected,
      lossesCount,
      status: nextStatus,
    },
  };
}

export function advanceToNextRound(
  state: VaultTrialState,
  rng: () => number = Math.random
): VaultTrialState {
  if (state.status !== 'playing' || state.currentRound.phase !== 'revealed') {
    return state;
  }
  return {
    ...state,
    currentRound: createRound(state.currentRound.roundNumber + 1, rng),
  };
}

export function recordVaultHintUsed(state: VaultTrialState): VaultTrialState {
  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
  };
}

export function getStrategyStats(history: CompletedVaultRound[]): StrategyStats {
  let stayTotal = 0;
  let stayWins = 0;
  let switchTotal = 0;
  let switchWins = 0;

  for (const r of history) {
    if (r.switched) {
      switchTotal++;
      if (r.won) switchWins++;
    } else {
      stayTotal++;
      if (r.won) stayWins++;
    }
  }

  return {
    stayTotal,
    stayWins,
    stayRate: stayTotal > 0 ? Math.round((stayWins / stayTotal) * 100) : null,
    switchTotal,
    switchWins,
    switchRate: switchTotal > 0 ? Math.round((switchWins / switchTotal) * 100) : null,
  };
}

export function calculateVaultStars(state: VaultTrialState): 0 | 1 | 2 | 3 {
  if (state.status !== 'won') return 0;
  const stats = getStrategyStats(state.history);
  const total = state.history.length;
  const switchShare = total > 0 ? stats.switchTotal / total : 0;

  // 3 Stars: Won the trial with disciplined switching (>= 75%) and 0 hints
  if (state.hintsUsed === 0 && switchShare >= 0.75) return 3;
  if (state.hintsUsed <= 1) return 2;
  return 1;
}

/**
 * Runs an independent N-trial Monte Carlo proof comparing Always-Stay vs Always-Switch.
 */
export function simulateMontyHallBatch(
  trials = 100,
  rng: () => number = Math.random
): SimulationBatchResult {
  let stayWins = 0;
  let switchWins = 0;

  for (let i = 0; i < trials; i++) {
    const prize = randomDoor(rng);
    const pick = randomDoor(rng);
    const revealed = selectHostRevealDoor(prize, pick, rng);
    const switchedDoor = DOORS.find((d) => d !== pick && d !== revealed)!;

    if (pick === prize) stayWins++;
    if (switchedDoor === prize) switchWins++;
  }

  return {
    trials,
    stayWins,
    switchWins,
    stayPct: Math.round((stayWins / trials) * 1000) / 10,
    switchPct: Math.round((switchWins / trials) * 1000) / 10,
  };
}

