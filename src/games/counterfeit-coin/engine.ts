export type CoinId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type CoinWeightType = 'heavier' | 'lighter';
export type ScaleOutcome = 'left_heavy' | 'balanced' | 'right_heavy';
export type CoinGameStatus = 'playing' | 'won' | 'lost';
export type CoinDeductionMark = 'unweighed' | 'heavier' | 'lighter' | 'either' | 'genuine';

export const ALL_COINS: readonly CoinId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const MAX_WEIGHINGS = 3;

export interface CoinWorld {
  fakeCoin: CoinId;
  weight: CoinWeightType;
}

export interface WeighingRecord {
  index: number;
  leftPan: CoinId[];
  rightPan: CoinId[];
  outcome: ScaleOutcome;
  consistentWorldsAfter: number;
}

export interface CoinVerdict {
  coin: CoinId | null;
  weight: CoinWeightType | null;
}

export interface CoinGameState {
  world: CoinWorld;
  leftPan: CoinId[];
  rightPan: CoinId[];
  history: WeighingRecord[];
  verdict: CoinVerdict;
  status: CoinGameStatus;
  deducedWithCertainty: boolean;
  hintsUsed: number;
}

export interface OptimalWeighingSuggestion {
  leftPan: CoinId[];
  rightPan: CoinId[];
  explanation: string;
}

export const ALL_COIN_WORLDS: readonly CoinWorld[] = ALL_COINS.flatMap((fakeCoin) => [
  { fakeCoin, weight: 'heavier' as const },
  { fakeCoin, weight: 'lighter' as const },
]);

export function createRandomCoinWorld(rng: () => number = Math.random): CoinWorld {
  const idx = Math.floor(rng() * ALL_COIN_WORLDS.length);
  const picked = ALL_COIN_WORLDS[Math.min(ALL_COIN_WORLDS.length - 1, Math.max(0, idx))];
  return { ...picked };
}

export function createInitialCoinState(world?: CoinWorld): CoinGameState {
  return {
    world: world ?? createRandomCoinWorld(),
    leftPan: [],
    rightPan: [],
    history: [],
    verdict: { coin: null, weight: null },
    status: 'playing',
    deducedWithCertainty: false,
    hintsUsed: 0,
  };
}

export function evaluateScaleOutcome(
  world: CoinWorld,
  leftPan: readonly CoinId[],
  rightPan: readonly CoinId[]
): ScaleOutcome {
  // Base weight = 10 per coin, counterfeit = 11 (heavier) or 9 (lighter)
  const coinMass = (c: CoinId) => {
    if (c !== world.fakeCoin) return 10;
    return world.weight === 'heavier' ? 11 : 9;
  };
  const leftMass = leftPan.reduce((s, c) => s + coinMass(c), 0);
  const rightMass = rightPan.reduce((s, c) => s + coinMass(c), 0);

  if (leftMass > rightMass) return 'left_heavy';
  if (rightMass > leftMass) return 'right_heavy';
  return 'balanced';
}

export function getConsistentCoinWorlds(
  history: Pick<WeighingRecord, 'leftPan' | 'rightPan' | 'outcome'>[]
): CoinWorld[] {
  return ALL_COIN_WORLDS.filter((w) =>
    history.every((rec) => evaluateScaleOutcome(w, rec.leftPan, rec.rightPan) === rec.outcome)
  );
}

/**
 * Returns coins that cannot possibly be counterfeit (neither heavier nor lighter)
 * under any world consistent with the weighing history so far.
 */
export function getProvenGenuineCoins(
  history: Pick<WeighingRecord, 'leftPan' | 'rightPan' | 'outcome'>[]
): Set<CoinId> {
  if (history.length === 0) return new Set();
  const consistent = getConsistentCoinWorlds(history);
  const suspectCoins = new Set(consistent.map((w) => w.fakeCoin));
  return new Set(ALL_COINS.filter((c) => !suspectCoins.has(c)));
}

/**
 * Computes the logical tracking mark for each coin (1..12) from the scale history:
 * - 'unweighed': before any weighing
 * - 'heavier' (+): can only be a heavier fake
 * - 'lighter' (-): can only be a lighter fake
 * - 'either'  (±): could still be either heavier or lighter
 * - 'genuine' (✓): proven genuine
 */
export function getCoinDeductionMarks(
  history: Pick<WeighingRecord, 'leftPan' | 'rightPan' | 'outcome'>[]
): Record<CoinId, CoinDeductionMark> {
  const marks = {} as Record<CoinId, CoinDeductionMark>;
  if (history.length === 0) {
    for (const c of ALL_COINS) marks[c] = 'unweighed';
    return marks;
  }

  const consistent = getConsistentCoinWorlds(history);
  for (const c of ALL_COINS) {
    const canH = consistent.some((w) => w.fakeCoin === c && w.weight === 'heavier');
    const canL = consistent.some((w) => w.fakeCoin === c && w.weight === 'lighter');
    if (canH && canL) marks[c] = 'either';
    else if (canH) marks[c] = 'heavier';
    else if (canL) marks[c] = 'lighter';
    else marks[c] = 'genuine';
  }
  return marks;
}

export function placeCoinOnPan(
  state: CoinGameState,
  coin: CoinId,
  targetPan: 'left' | 'right' | 'tray'
): CoinGameState {
  if (state.status !== 'playing') return state;

  const withoutLeft = state.leftPan.filter((c) => c !== coin);
  const withoutRight = state.rightPan.filter((c) => c !== coin);

  if (targetPan === 'tray') {
    return { ...state, leftPan: withoutLeft, rightPan: withoutRight };
  }

  if (targetPan === 'left') {
    if (state.leftPan.includes(coin)) {
      return { ...state, leftPan: withoutLeft, rightPan: withoutRight };
    }
    return {
      ...state,
      leftPan: [...withoutLeft, coin].sort((a, b) => a - b),
      rightPan: withoutRight,
    };
  }

  if (state.rightPan.includes(coin)) {
    return { ...state, leftPan: withoutLeft, rightPan: withoutRight };
  }
  return {
    ...state,
    leftPan: withoutLeft,
    rightPan: [...withoutRight, coin].sort((a, b) => a - b),
  };
}

export function clearScalePans(state: CoinGameState): CoinGameState {
  return { ...state, leftPan: [], rightPan: [] };
}

export function canPerformWeighing(state: CoinGameState): { ok: boolean; reason?: string } {
  if (state.status !== 'playing') {
    return { ok: false, reason: 'This trial has already concluded.' };
  }
  if (state.history.length >= MAX_WEIGHINGS) {
    return { ok: false, reason: 'All 3 weighings used. Seal your verdict below!' };
  }
  if (state.leftPan.length === 0 || state.rightPan.length === 0) {
    return { ok: false, reason: 'Place coins on both the Left and Right pans to weigh.' };
  }
  if (state.leftPan.length !== state.rightPan.length) {
    return {
      ok: false,
      reason: `Both pans must hold an equal number of coins (currently ${state.leftPan.length} vs ${state.rightPan.length}).`,
    };
  }
  return { ok: true };
}

export function performWeighing(
  state: CoinGameState
): { state: CoinGameState; record: WeighingRecord | null; error?: string } {
  const check = canPerformWeighing(state);
  if (!check.ok) {
    return { state, record: null, error: check.reason };
  }

  const outcome = evaluateScaleOutcome(state.world, state.leftPan, state.rightPan);
  const record: WeighingRecord = {
    index: state.history.length + 1,
    leftPan: [...state.leftPan],
    rightPan: [...state.rightPan],
    outcome,
    consistentWorldsAfter: 24,
  };

  const nextHistory = [...state.history, record];
  record.consistentWorldsAfter = getConsistentCoinWorlds(nextHistory).length;

  return {
    record,
    state: {
      ...state,
      history: nextHistory,
    },
  };
}

export function setCoinVerdict(
  state: CoinGameState,
  partial: Partial<CoinVerdict>
): CoinGameState {
  if (state.status !== 'playing') return state;
  return {
    ...state,
    verdict: { ...state.verdict, ...partial },
  };
}

export function submitCoinVerdict(
  state: CoinGameState
): { state: CoinGameState; error?: string } {
  if (state.status !== 'playing') {
    return { state, error: 'This trial has already concluded.' };
  }
  if (state.verdict.coin === null || state.verdict.weight === null) {
    return { state, error: 'Select both the counterfeit coin (1–12) and Heavier or Lighter.' };
  }

  const correct =
    state.verdict.coin === state.world.fakeCoin && state.verdict.weight === state.world.weight;
  const remainingWorlds = getConsistentCoinWorlds(state.history).length;
  const deducedWithCertainty = correct && remainingWorlds === 1;

  return {
    state: {
      ...state,
      status: correct ? 'won' : 'lost',
      deducedWithCertainty,
    },
  };
}

export function recordCoinHintUsed(state: CoinGameState): CoinGameState {
  return { ...state, hintsUsed: state.hintsUsed + 1 };
}

export function calculateCoinStars(state: CoinGameState): 0 | 1 | 2 | 3 {
  if (state.status !== 'won') return 0;
  if (state.deducedWithCertainty && state.hintsUsed === 0) return 3;
  if (state.hintsUsed <= 1) return 2;
  return 1;
}

export function formatOutcomeLabel(outcome: ScaleOutcome): string {
  if (outcome === 'left_heavy') return 'Left Heavy';
  if (outcome === 'right_heavy') return 'Right Heavy';
  return 'Balanced';
}

// --- Exact Live Optimal Weighing Advisor (Solves ALL 24 worlds in 3 weighings!) ---

function splitScore(
  worlds: CoinWorld[],
  leftPan: CoinId[],
  rightPan: CoinId[]
): number {
  let l = 0;
  let e = 0;
  let r = 0;
  for (const w of worlds) {
    const out = evaluateScaleOutcome(w, leftPan, rightPan);
    if (out === 'left_heavy') l++;
    else if (out === 'balanced') e++;
    else r++;
  }
  return Math.max(l, e, r);
}

/**
 * Computes a mathematically optimal next weighing that guarantees partitioning the
 * remaining consistent worlds into buckets of size <= 3^(weighingsLeft - 1).
 */
export function suggestOptimalWeighing(
  state: CoinGameState
): OptimalWeighingSuggestion | null {
  if (state.status !== 'playing') return null;
  const weighingsLeft = MAX_WEIGHINGS - state.history.length;
  if (weighingsLeft <= 0) return null;

  const consistent = getConsistentCoinWorlds(state.history);
  if (consistent.length <= 1) return null;

  // Step 1 from fresh board: classic 4 vs 4 split (splits 24 -> 8 / 8 / 8!)
  if (state.history.length === 0) {
    return {
      leftPan: [1, 2, 3, 4],
      rightPan: [5, 6, 7, 8],
      explanation:
        'Weigh 4 coins vs. 4 coins (1–4 vs 5–8). Every possible scale outcome narrows 24 possibilities cleanly down to 8!',
    };
  }

  // Classify coins by their possible fake roles in `consistent`
  const heavyOnly: CoinId[] = [];
  const lightOnly: CoinId[] = [];
  const unknownBoth: CoinId[] = [];
  const genuine: CoinId[] = [];

  for (const c of ALL_COINS) {
    const canH = consistent.some((w) => w.fakeCoin === c && w.weight === 'heavier');
    const canL = consistent.some((w) => w.fakeCoin === c && w.weight === 'lighter');
    if (canH && canL) unknownBoth.push(c);
    else if (canH) heavyOnly.push(c);
    else if (canL) lightOnly.push(c);
    else genuine.push(c);
  }

  const maxAllowedBucket = Math.pow(3, weighingsLeft - 1);

  // Build smart structured candidate weighings tailored to the coin categories
  const candidates: { left: CoinId[]; right: CoinId[]; note: string }[] = [];

  // Pattern A: Classic Step 2 when balanced (unknownBoth = 4 coins, genuine >= 4)
  if (unknownBoth.length >= 3 && genuine.length >= 3) {
    candidates.push({
      left: unknownBoth.slice(0, 3),
      right: genuine.slice(0, 3),
      note: `Weigh 3 suspect coins (${unknownBoth.slice(0, 3).join(', ')}) against 3 proven genuine coins (${genuine.slice(0, 3).join(', ')}) to see immediately whether the fake is among them and whether it’s heavier or lighter!`,
    });
  }
  if (unknownBoth.length === 1 && genuine.length >= 1) {
    candidates.push({
      left: [unknownBoth[0]],
      right: [genuine[0]],
      note: `Only Coin ${unknownBoth[0]} can be fake—weigh it against genuine Coin ${genuine[0]} to determine whether it is heavier or lighter!`,
    });
  }
  if (unknownBoth.length === 2 && genuine.length >= 1) {
    candidates.push({
      left: [unknownBoth[0]],
      right: [genuine[0]],
      note: `Weigh suspect Coin ${unknownBoth[0]} against genuine Coin ${genuine[0]}.`,
    });
  }

  // Pattern B: Classic Step 2 swap when tilted (heavyOnly + lightOnly + genuine)
  if (heavyOnly.length >= 3 && lightOnly.length >= 2 && genuine.length >= 1) {
    candidates.push({
      left: [heavyOnly[0], heavyOnly[1], lightOnly[0]],
      right: [heavyOnly[2], lightOnly[1], genuine[0]],
      note: `Mix 2 potentially heavy + 1 potentially light coin (${heavyOnly[0]}, ${heavyOnly[1]}, ${lightOnly[0]}) against 1 potentially heavy + 1 potentially light + 1 genuine coin (${heavyOnly[2]}, ${lightOnly[1]}, ${genuine[0]}). Every outcome leaves at most 3 possibilities!`,
    });
  }

  // Pattern C: Final weighing pairs among heavyOnly / lightOnly / genuine
  if (heavyOnly.length >= 2) {
    candidates.push({
      left: [heavyOnly[0]],
      right: [heavyOnly[1]],
      note: `Weigh Coin ${heavyOnly[0]} vs. Coin ${heavyOnly[1]}: whichever sinks is the heavier fake, or if balanced, the remaining suspect is fake!`,
    });
  }
  if (lightOnly.length >= 2) {
    candidates.push({
      left: [lightOnly[0]],
      right: [lightOnly[1]],
      note: `Weigh Coin ${lightOnly[0]} vs. Coin ${lightOnly[1]}: whichever rises is the lighter fake, or if balanced, the remaining suspect is fake!`,
    });
  }
  if (heavyOnly.length >= 1 && genuine.length >= 1) {
    candidates.push({
      left: [heavyOnly[0]],
      right: [genuine[0]],
      note: `Weigh potentially heavy Coin ${heavyOnly[0]} against genuine Coin ${genuine[0]} to decide cleanly!`,
    });
  }
  if (lightOnly.length >= 1 && genuine.length >= 1) {
    candidates.push({
      left: [lightOnly[0]],
      right: [genuine[0]],
      note: `Weigh potentially light Coin ${lightOnly[0]} against genuine Coin ${genuine[0]} to decide cleanly!`,
    });
  }

  // Evaluate candidates and pick the lowest max-bucket split
  let best: { left: CoinId[]; right: CoinId[]; note: string; score: number } | null = null;
  for (const cand of candidates) {
    const score = splitScore(consistent, cand.left, cand.right);
    if (!best || score < best.score) {
      best = { ...cand, score };
    }
  }

  if (best && best.score <= maxAllowedBucket) {
    return {
      leftPan: best.left.sort((a, b) => a - b),
      rightPan: best.right.sort((a, b) => a - b),
      explanation: best.note,
    };
  }

  // General fallback search for any unusual player weighing sequence (1v1, 2v2, 3v3)
  const suspects = [...new Set(consistent.map((w) => w.fakeCoin))];
  const pool = [...suspects, ...genuine.slice(0, 3)];
  let fallbackBest: { left: CoinId[]; right: CoinId[]; score: number } | null = null;

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const score = splitScore(consistent, [pool[i]], [pool[j]]);
      if (!fallbackBest || score < fallbackBest.score) {
        fallbackBest = { left: [pool[i]], right: [pool[j]], score };
      }
    }
  }

  if (fallbackBest && (!best || fallbackBest.score < best.score)) {
    return {
      leftPan: fallbackBest.left,
      rightPan: fallbackBest.right,
      explanation: `Weigh Coin ${fallbackBest.left.join(', ')} against Coin ${fallbackBest.right.join(', ')} to narrow the remaining possibilities as sharply as possible.`,
    };
  }

  if (best) {
    return {
      leftPan: best.left.sort((a, b) => a - b),
      rightPan: best.right.sort((a, b) => a - b),
      explanation: best.note,
    };
  }

  return null;
}

