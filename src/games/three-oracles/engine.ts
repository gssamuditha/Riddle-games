export type OracleSlot = 'A' | 'B' | 'C';
export type OracleRole = 'truth' | 'false' | 'random';
export type OracleWord = 'DA' | 'JA';
export type QuestionForm = 'direct' | 'embedded';
export type OraclesGameStatus = 'asking' | 'won' | 'lost';

export const ORACLE_SLOTS: readonly OracleSlot[] = ['A', 'B', 'C'] as const;
export const ORACLE_ROLES: readonly OracleRole[] = ['truth', 'false', 'random'] as const;
export const MAX_QUESTIONS = 3;

export interface OracleRoleInfo {
  id: OracleRole;
  title: string;
  label: string;
  summary: string;
}

export const ROLE_INFO: Record<OracleRole, OracleRoleInfo> = {
  truth: {
    id: 'truth',
    title: 'Veritas',
    label: 'Truth',
    summary: 'Always answers truthfully.',
  },
  false: {
    id: 'false',
    title: 'Mendax',
    label: 'False',
    summary: 'Always answers with a lie.',
  },
  random: {
    id: 'random',
    title: 'Fortuna',
    label: 'Random',
    summary: 'Answers DA or JA purely by chance.',
  },
};

export interface HiddenWorld {
  roles: Record<OracleSlot, OracleRole>;
  daMeansYes: boolean; // true -> DA=Yes, JA=No; false -> DA=No, JA=Yes
}

export interface OracleQuestion {
  target: OracleSlot;
  form: QuestionForm;
  subject: OracleSlot;
  claimedRole: OracleRole;
  embeddedWord: OracleWord; // used when form === 'embedded': "...would you say DA?"
}

export interface QuestionRecord {
  index: number;
  question: OracleQuestion;
  answer: OracleWord;
  consistentPermutationsAfter: number;
}

export interface OraclesGameState {
  world: HiddenWorld;
  history: QuestionRecord[];
  verdict: Record<OracleSlot, OracleRole | null>;
  status: OraclesGameStatus;
  deducedWithCertainty: boolean;
  hintsUsed: number;
}

const ROLE_PERMUTATIONS: Record<OracleSlot, OracleRole>[] = [
  { A: 'truth', B: 'false', C: 'random' },
  { A: 'truth', B: 'random', C: 'false' },
  { A: 'false', B: 'truth', C: 'random' },
  { A: 'false', B: 'random', C: 'truth' },
  { A: 'random', B: 'truth', C: 'false' },
  { A: 'random', B: 'false', C: 'truth' },
];

export const ALL_POSSIBLE_WORLDS: readonly HiddenWorld[] = ROLE_PERMUTATIONS.flatMap((roles) => [
  { roles, daMeansYes: true },
  { roles, daMeansYes: false },
]);

export function createRandomWorld(rng: () => number = Math.random): HiddenWorld {
  const idx = Math.floor(rng() * ALL_POSSIBLE_WORLDS.length);
  const picked = ALL_POSSIBLE_WORLDS[Math.min(ALL_POSSIBLE_WORLDS.length - 1, Math.max(0, idx))];
  return {
    roles: { ...picked.roles },
    daMeansYes: picked.daMeansYes,
  };
}

export function createInitialOraclesState(world?: HiddenWorld): OraclesGameState {
  return {
    world: world ?? createRandomWorld(),
    history: [],
    verdict: { A: null, B: null, C: null },
    status: 'asking',
    deducedWithCertainty: false,
    hintsUsed: 0,
  };
}

function truthValueToWord(answerIsYes: boolean, daMeansYes: boolean): OracleWord {
  if (daMeansYes) return answerIsYes ? 'DA' : 'JA';
  return answerIsYes ? 'JA' : 'DA';
}

/**
 * Deterministically evaluates what a non-Random Oracle (Truth or False) would answer
 * in a specific HiddenWorld. Returns null if the target Oracle is Random (either word possible).
 */
export function evaluateDeterministicAnswer(
  world: HiddenWorld,
  question: OracleQuestion
): OracleWord | null {
  const targetRole = world.roles[question.target];
  if (targetRole === 'random') return null;

  const propositionIsTrue = world.roles[question.subject] === question.claimedRole;

  if (question.form === 'direct') {
    // Truth says Yes iff P is true; False says Yes iff P is false.
    const innerYes = targetRole === 'truth' ? propositionIsTrue : !propositionIsTrue;
    return truthValueToWord(innerYes, world.daMeansYes);
  }

  // Embedded Boolos / Smullyan form:
  // "If I asked you whether [subject is claimedRole], would you answer [embeddedWord]?"
  // Step 1: What word WOULD this Oracle say to the inner direct question?
  const innerYes = targetRole === 'truth' ? propositionIsTrue : !propositionIsTrue;
  const innerSpokenWord = truthValueToWord(innerYes, world.daMeansYes);

  // Step 2: Is the outer claim ("you would say embeddedWord") actually true?
  const outerClaimIsTrue = innerSpokenWord === question.embeddedWord;

  // Step 3: Truth answers outer claim truthfully; False lies about the outer claim.
  const outerYes = targetRole === 'truth' ? outerClaimIsTrue : !outerClaimIsTrue;
  return truthValueToWord(outerYes, world.daMeansYes);
}

export function evaluateOracleAnswer(
  world: HiddenWorld,
  question: OracleQuestion,
  rng: () => number = Math.random
): OracleWord {
  const deterministic = evaluateDeterministicAnswer(world, question);
  if (deterministic !== null) return deterministic;
  return rng() < 0.5 ? 'DA' : 'JA';
}

export function isWorldConsistentWithRecord(
  world: HiddenWorld,
  record: Pick<QuestionRecord, 'question' | 'answer'>
): boolean {
  const expected = evaluateDeterministicAnswer(world, record.question);
  // Random can answer either DA or JA, so it is always consistent with any response.
  if (expected === null) return true;
  return expected === record.answer;
}

export function getConsistentWorlds(
  history: Pick<QuestionRecord, 'question' | 'answer'>[]
): HiddenWorld[] {
  return ALL_POSSIBLE_WORLDS.filter((world) =>
    history.every((rec) => isWorldConsistentWithRecord(world, rec))
  );
}

export function countDistinctRolePermutations(worlds: HiddenWorld[]): number {
  const unique = new Set(worlds.map((w) => `${w.roles.A}-${w.roles.B}-${w.roles.C}`));
  return unique.size;
}

export function getPossibleRolesPerSlot(
  history: Pick<QuestionRecord, 'question' | 'answer'>[]
): Record<OracleSlot, OracleRole[]> {
  const worlds = getConsistentWorlds(history);
  const result: Record<OracleSlot, Set<OracleRole>> = {
    A: new Set(),
    B: new Set(),
    C: new Set(),
  };
  for (const w of worlds) {
    result.A.add(w.roles.A);
    result.B.add(w.roles.B);
    result.C.add(w.roles.C);
  }
  return {
    A: ORACLE_ROLES.filter((r) => result.A.has(r)),
    B: ORACLE_ROLES.filter((r) => result.B.has(r)),
    C: ORACLE_ROLES.filter((r) => result.C.has(r)),
  };
}

export function askOracleQuestion(
  state: OraclesGameState,
  question: OracleQuestion,
  rng: () => number = Math.random
): { state: OraclesGameState; record: QuestionRecord | null; error?: string } {
  if (state.status !== 'asking') {
    return { state, record: null, error: 'This trial has already concluded.' };
  }
  if (state.history.length >= MAX_QUESTIONS) {
    return {
      state,
      record: null,
      error: 'All 3 questions have been spoken. Seal your verdict below.',
    };
  }

  const answer = evaluateOracleAnswer(state.world, question, rng);
  const tentativeRecord: QuestionRecord = {
    index: state.history.length + 1,
    question,
    answer,
    consistentPermutationsAfter: 6,
  };

  const nextHistory = [...state.history, tentativeRecord];
  const consistent = getConsistentWorlds(nextHistory);
  tentativeRecord.consistentPermutationsAfter = countDistinctRolePermutations(consistent);

  return {
    record: tentativeRecord,
    state: {
      ...state,
      history: nextHistory,
    },
  };
}

/**
 * Assigns a role to an Oracle in the player's verdict.
 * If another Oracle already holds that role, smoothly swaps them.
 */
export function assignVerdictRole(
  state: OraclesGameState,
  slot: OracleSlot,
  role: OracleRole
): OraclesGameState {
  if (state.status !== 'asking') return state;

  const nextVerdict: Record<OracleSlot, OracleRole | null> = { ...state.verdict };

  // Clicking the same role again clears it
  if (nextVerdict[slot] === role) {
    nextVerdict[slot] = null;
    return { ...state, verdict: nextVerdict };
  }

  // If another slot currently holds `role`, swap it cleanly
  const previousOwner = ORACLE_SLOTS.find((s) => s !== slot && nextVerdict[s] === role);
  if (previousOwner) {
    nextVerdict[previousOwner] = nextVerdict[slot];
  }
  nextVerdict[slot] = role;

  return { ...state, verdict: nextVerdict };
}

export function isVerdictComplete(verdict: Record<OracleSlot, OracleRole | null>): boolean {
  return ORACLE_SLOTS.every((s) => verdict[s] !== null);
}

export function submitVerdict(
  state: OraclesGameState
): { state: OraclesGameState; error?: string } {
  if (state.status !== 'asking') {
    return { state, error: 'This trial has already concluded.' };
  }
  if (!isVerdictComplete(state.verdict)) {
    return { state, error: 'Assign Truth, False, and Random to all three Oracles first.' };
  }

  const allCorrect = ORACLE_SLOTS.every((slot) => state.verdict[slot] === state.world.roles[slot]);
  const remainingPermutations = countDistinctRolePermutations(getConsistentWorlds(state.history));
  const deducedWithCertainty = allCorrect && remainingPermutations === 1;

  return {
    state: {
      ...state,
      status: allCorrect ? 'won' : 'lost',
      deducedWithCertainty,
    },
  };
}

export function recordOracleHintUsed(state: OraclesGameState): OraclesGameState {
  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
  };
}

export function calculateOraclesStars(state: OraclesGameState): 0 | 1 | 2 | 3 {
  if (state.status !== 'won') return 0;
  if (state.deducedWithCertainty && state.hintsUsed === 0) return 3;
  if (state.hintsUsed <= 1) return 2;
  return 1;
}

export function formatQuestionText(q: OracleQuestion): string {
  const subjectText = q.subject === q.target ? 'you are' : `Oracle ${q.subject} is`;
  const roleLabel = ROLE_INFO[q.claimedRole].label;
  if (q.form === 'direct') {
    const directSubject = q.subject === q.target ? 'Are you' : `Is Oracle ${q.subject}`;
    return `${directSubject} ${roleLabel}?`;
  }
  return `If I asked you whether ${subjectText} ${roleLabel}, would you say "${q.embeddedWord}"?`;
}

// --- Optimal Live Question Advisor (Minimax over remaining consistent worlds) ---

export interface QuestionSuggestion {
  question: OracleQuestion;
  explanation: string;
}

export function suggestOptimalQuestion(state: OraclesGameState): QuestionSuggestion | null {
  if (state.status !== 'asking' || state.history.length >= MAX_QUESTIONS) return null;

  const consistentWorlds = getConsistentWorlds(state.history);
  const currentPerms = countDistinctRolePermutations(consistentWorlds);
  if (currentPerms <= 1) return null;

  // Check if we already have a guaranteed non-Random Oracle!
  const possible = getPossibleRolesPerSlot(state.history);
  const guaranteedNonRandom = ORACLE_SLOTS.find((slot) => !possible[slot].includes('random'));

  // Step 1: No guaranteed non-Random Oracle yet -> ask classic Boolos opener to A about B being Random
  if (!guaranteedNonRandom) {
    return {
      question: {
        target: 'A',
        form: 'embedded',
        subject: 'B',
        claimedRole: 'random',
        embeddedWord: 'DA',
      },
      explanation:
        'If A answers DA, Oracle C is guaranteed not Random. If A answers JA, Oracle B is guaranteed not Random!',
    };
  }

  // Step 2: We have a guaranteed non-Random Oracle! Do we know if they are Truth or False yet?
  if (possible[guaranteedNonRandom].length > 1) {
    return {
      question: {
        target: guaranteedNonRandom,
        form: 'embedded',
        subject: guaranteedNonRandom,
        claimedRole: 'truth',
        embeddedWord: 'DA',
      },
      explanation: `Oracle ${guaranteedNonRandom} cannot be Random—so DA guarantees they are Truth, and JA guarantees they are False.`,
    };
  }

  // Step 3: We know guaranteedNonRandom's exact role! Ask them which of the other two is Random.
  const otherSlots = ORACLE_SLOTS.filter((s) => s !== guaranteedNonRandom);
  const probeSlot = otherSlots[0];
  return {
    question: {
      target: guaranteedNonRandom,
      form: 'embedded',
      subject: probeSlot,
      claimedRole: 'random',
      embeddedWord: 'DA',
    },
    explanation: `Oracle ${guaranteedNonRandom} is not Random—so DA confirms Oracle ${probeSlot} is Random, while JA proves Oracle ${otherSlots[1]} is Random.`,
  };
}

