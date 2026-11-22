export type EggDropOutcome = 'survived' | 'shattered';
export type EggGameStatus = 'playing' | 'won' | 'lost_no_eggs' | 'lost_out_of_drops';

export const TOTAL_FLOORS = 100;
export const STARTING_EGGS = 2;
export const MAX_DROPS = 14;

export interface EggDropRecord {
  dropNumber: number;
  floor: number;
  outcome: EggDropOutcome;
  eggsAfter: number;
  lowSafeAfter: number;
  highBreakAfter: number;
  wasForcedByStrategy: boolean;
}

export interface EggDropState {
  lowSafe: number; // Highest floor proven safe (starts at 0 = ground)
  highBreak: number; // Lowest floor proven to shatter (starts at 101 = above roof)
  eggsLeft: number;
  dropsUsed: number;
  maxDrops: number;
  secretFloor: number; // Dynamic hidden threshold used on mathematically valid optimal moves
  history: EggDropRecord[];
  status: EggGameStatus;
  hintsUsed: number;
}

export interface OptimalDropAdvice {
  recommendedFloor: number;
  minWorstCaseDropsFromHere: number;
  canStillGuaranteeWin: boolean;
  reason: string;
}

/**
 * Exact minimum worst-case drops needed to pinpoint the threshold across `untestedCount`
 * untested floors using `eggs` remaining eggs.
 */
export function minWorstCaseDrops(untestedCount: number, eggs: number): number {
  if (untestedCount <= 0) return 0;
  if (eggs <= 0) return Infinity;
  if (eggs === 1) return untestedCount;
  // For 2 eggs: smallest k such that k*(k+1)/2 >= untestedCount
  let k = 0;
  while ((k * (k + 1)) / 2 < untestedCount) {
    k++;
  }
  return k;
}

/**
 * Computes the mathematically optimal next floor to drop from given current state.
 */
export function getOptimalDropAdvice(state: EggDropState): OptimalDropAdvice {
  const untested = Math.max(0, state.highBreak - state.lowSafe - 1);
  const dropsLeft = Math.max(0, state.maxDrops - state.dropsUsed);

  if (untested === 0) {
    return {
      recommendedFloor: state.lowSafe,
      minWorstCaseDropsFromHere: 0,
      canStillGuaranteeWin: true,
      reason: `Floor ${state.lowSafe} is already proven as the exact highest safe floor.`,
    };
  }

  const needed = minWorstCaseDrops(untested, state.eggsLeft);
  const canStillGuaranteeWin = needed <= dropsLeft;

  if (state.eggsLeft === 1) {
    const nextFloor = state.lowSafe + 1;
    return {
      recommendedFloor: nextFloor,
      minWorstCaseDropsFromHere: needed,
      canStillGuaranteeWin,
      reason: `With only 1 egg remaining, you must test floor-by-floor starting at Floor ${nextFloor} so you never skip the true threshold.`,
    };
  }

  // With 2 eggs: step up by `needed` (or clamp to highBreak - 1)
  // Using `Math.min(needed, dropsLeft)` if winnable, or `needed` to minimize total drops
  const step = Math.min(needed, untested);
  const recommendedFloor = Math.min(state.highBreak - 1, state.lowSafe + step);

  return {
    recommendedFloor,
    minWorstCaseDropsFromHere: needed,
    canStillGuaranteeWin,
    reason: `Jump up ${step} floor${step === 1 ? '' : 's'} to Floor ${recommendedFloor}: if it breaks, ${
      step - 1
    } linear drops remain; if it survives, you still have ${
      needed - 1
    } drops to cover the remaining floors.`,
  };
}

function pickInitialSecretFloor(rng: () => number = Math.random): number {
  // Choose an interesting threshold across 1..100
  return Math.min(TOTAL_FLOORS, Math.max(1, Math.floor(rng() * TOTAL_FLOORS) + 1));
}

export function createInitialEggState(
  secretFloor?: number,
  rng: () => number = Math.random
): EggDropState {
  const chosen =
    secretFloor !== undefined
      ? Math.max(0, Math.min(TOTAL_FLOORS, Math.floor(secretFloor)))
      : pickInitialSecretFloor(rng);

  return {
    lowSafe: 0,
    highBreak: TOTAL_FLOORS + 1,
    eggsLeft: STARTING_EGGS,
    dropsUsed: 0,
    maxDrops: MAX_DROPS,
    secretFloor: chosen,
    history: [],
    status: 'playing',
    hintsUsed: 0,
  };
}

export function getUntestedFloorRange(state: EggDropState): { min: number; max: number; count: number } {
  const min = state.lowSafe + 1;
  const max = state.highBreak - 1;
  return { min, max, count: Math.max(0, max - min + 1) };
}

/**
 * Drops an egg from `floor` using the Hybrid Adversarial + Secret-Floor Engine:
 * - If the player's drop is mathematically safe/optimal (both break & survive remain
 *   solvable within the remaining 14-drop budget), the tower responds truthfully according
 *   to `secretFloor`.
 * - If the player makes an unsafe leap (e.g., Floor 50 on Drop 1, or skipping a floor
 *   with 1 egg left), the tower enforces the mathematically harder branch so luck can't
 *   bypass the 14-drop worst-case puzzle!
 */
export function dropEggFromFloor(
  state: EggDropState,
  floor: number
): { state: EggDropState; record: EggDropRecord | null; error?: string } {
  if (state.status !== 'playing') {
    return { state, record: null, error: 'This trial has ended. Restart to try again.' };
  }

  if (!Number.isInteger(floor) || floor < 1 || floor > TOTAL_FLOORS) {
    return { state, record: null, error: `Choose a floor between 1 and ${TOTAL_FLOORS}.` };
  }

  if (floor <= state.lowSafe) {
    return {
      state,
      record: null,
      error: `Floor ${floor} is already proven safe (≤ Floor ${state.lowSafe}). Test higher!`,
    };
  }

  if (floor >= state.highBreak) {
    return {
      state,
      record: null,
      error: `Floor ${floor} is already known to break (≥ Floor ${state.highBreak}). Test lower!`,
    };
  }

  const dropsLeftAfter = state.maxDrops - (state.dropsUsed + 1);
  const untestedIfBreak = floor - state.lowSafe - 1;
  const untestedIfSurvive = state.highBreak - floor - 1;

  const costIfBreak = minWorstCaseDrops(untestedIfBreak, state.eggsLeft - 1);
  const costIfSurvive = minWorstCaseDrops(untestedIfSurvive, state.eggsLeft);

  let outcome: EggDropOutcome;
  let wasForcedByStrategy = false;

  // Adversarial guard: if player made a suboptimal jump whose worst branch exceeds remaining drops
  const breakExceedsBudget = costIfBreak > dropsLeftAfter;
  const surviveExceedsBudget = costIfSurvive > dropsLeftAfter;

  if (breakExceedsBudget && !surviveExceedsBudget) {
    outcome = 'shattered';
    wasForcedByStrategy = true;
  } else if (surviveExceedsBudget && !breakExceedsBudget) {
    outcome = 'survived';
    wasForcedByStrategy = true;
  } else if (breakExceedsBudget && surviveExceedsBudget) {
    // Both exceed remaining budget -> pick the harsher one (break if 1 egg & skipped, else higher cost)
    outcome = costIfBreak >= costIfSurvive ? 'shattered' : 'survived';
    wasForcedByStrategy = true;
  } else {
    // Mathematically sound move! Answer naturally from secretFloor (keeping it consistent)
    outcome = floor <= state.secretFloor ? 'survived' : 'shattered';
  }

  const nextLowSafe = outcome === 'survived' ? floor : state.lowSafe;
  const nextHighBreak = outcome === 'shattered' ? floor : state.highBreak;
  const nextEggsLeft = outcome === 'shattered' ? state.eggsLeft - 1 : state.eggsLeft;
  const nextDropsUsed = state.dropsUsed + 1;

  // Keep secretFloor clamped inside valid [nextLowSafe, nextHighBreak - 1]
  const nextSecret = Math.max(nextLowSafe, Math.min(nextHighBreak - 1, state.secretFloor));

  const remainingUntested = nextHighBreak - nextLowSafe - 1;
  let nextStatus: EggGameStatus = 'playing';

  if (remainingUntested === 0) {
    // Exact highest safe floor pinpointed!
    nextStatus = nextDropsUsed <= state.maxDrops ? 'won' : 'lost_out_of_drops';
  } else if (nextEggsLeft <= 0) {
    nextStatus = 'lost_no_eggs';
  } else if (nextDropsUsed >= state.maxDrops) {
    nextStatus = 'lost_out_of_drops';
  }

  const record: EggDropRecord = {
    dropNumber: nextDropsUsed,
    floor,
    outcome,
    eggsAfter: nextEggsLeft,
    lowSafeAfter: nextLowSafe,
    highBreakAfter: nextHighBreak,
    wasForcedByStrategy,
  };

  return {
    record,
    state: {
      ...state,
      lowSafe: nextLowSafe,
      highBreak: nextHighBreak,
      eggsLeft: nextEggsLeft,
      dropsUsed: nextDropsUsed,
      secretFloor: nextSecret,
      history: [...state.history, record],
      status: nextStatus,
    },
  };
}

export function recordEggHintUsed(state: EggDropState): EggDropState {
  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
  };
}

export function calculateEggStars(state: EggDropState): 0 | 1 | 2 | 3 {
  if (state.status !== 'won') return 0;
  if (state.hintsUsed === 0) return 3;
  if (state.hintsUsed === 1) return 2;
  return 1;
}

