import {
  countDistinctRolePermutations,
  getConsistentWorlds,
  MAX_QUESTIONS,
  type OraclesGameState,
  type QuestionRecord,
} from './engine';

export interface OracleDialogue {
  speaker: string;
  line: string;
}

export const ORACLES_PROLOGUE = [
  'At the highest dome of the Archive stand three veiled marble Oracles—A, B, and C. Hidden beneath their stone mantles are Veritas (Truth), Mendax (False), and Fortuna (Random).',
  'They understand every word you ask, yet answer solely in the forgotten Archive tongue: “DA” or “JA”. One means Yes and the other means No—but no scholar remembers which is which.',
  'You are granted only three Yes/No questions to identify all three Oracles with logical certainty. Beware: Fortuna answers purely by chance, and direct questions alone cannot pierce the unknown language.',
];

export const ORACLES_RULES = [
  {
    title: 'Three Hidden Mantles',
    detail: 'Veritas always tells the truth, Mendax always lies, and Fortuna answers at random.',
  },
  {
    title: 'Unknown Tongue (DA / JA)',
    detail: 'One word means Yes and the other means No, randomized fresh each trial.',
  },
  {
    title: 'Three Questions Total',
    detail: 'Ask any Oracle a direct or embedded (“If I asked you...”) Yes/No question.',
  },
  {
    title: 'Deduce & Seal Verdict',
    detail: 'Identify all three Oracles. 100% logical certainty with 0 hints earns 3 stars.',
  },
];

export const ORACLES_HINTS = {
  tier1: {
    body: 'A direct question fails because you don’t know whether “DA” means Yes or No—nor whether you’re talking to Truth or False. Switch to the “If I asked you...” embedded question form: asking a non-Random Oracle “If I asked you whether P, would you say DA?” ALWAYS returns “DA” when P is true, and “JA” when P is false—even from Mendax and regardless of what DA means!',
  },
  tier2: {
    body: 'First, find one Oracle who is guaranteed NOT to be Random. Ask Oracle A (embedded): “If I asked you whether B is Random, would you say DA?” If A says DA, then C cannot be Random. If A says JA, then B cannot be Random! Now direct your final two questions to that guaranteed non-Random Oracle.',
  },
};

export function getOraclesDialogue(
  state: OraclesGameState,
  lastRecord: QuestionRecord | null,
  isSpeaking: boolean
): OracleDialogue {
  if (state.status === 'won') {
    return {
      speaker: 'The Astral Sanctum',
      line: state.deducedWithCertainty
        ? 'Every marble veil parts before pure logic. You conquered the hardest logic puzzle ever devised.'
        : 'Your verdict stands true! Try eliminating every other arrangement for 100% logical mastery.',
    };
  }

  if (state.status === 'lost') {
    return {
      speaker: 'The Astral Sanctum',
      line: 'The Astral Seal holds fast—at least one Oracle wore a different mantle. Begin a fresh trial to test your deduction.',
    };
  }

  if (isSpeaking) {
    return {
      speaker: 'The Sanctum',
      line: 'The marble veil shimmers as an ancient syllable echoes beneath the dome...',
    };
  }

  const remaining = MAX_QUESTIONS - state.history.length;
  const perms = countDistinctRolePermutations(getConsistentWorlds(state.history));

  if (!lastRecord) {
    return {
      speaker: 'Archivist’s Margin',
      line: 'Select an Oracle on the plinths above, compose a Direct or “If I asked...” question, and observe their reply.',
    };
  }

  if (perms === 1) {
    return {
      speaker: 'Archivist’s Margin',
      line: 'Only one possible identity arrangement remains! Assign Truth, False, and Random below and seal your verdict.',
    };
  }

  if (remaining === 0) {
    return {
      speaker: 'Archivist’s Margin',
      line: `All three questions have been spoken (${perms} arrangements still fit). Assign each Oracle’s mantle below and seal your verdict.`,
    };
  }

  if (lastRecord.question.form === 'direct' && perms === 6) {
    return {
      speaker: 'Archivist’s Margin',
      line: `Oracle ${lastRecord.question.target} replied “${lastRecord.answer}”—yet because DA/JA is unknown, all 6 arrangements remain possible. Try an “If I asked...” question!`,
    };
  }

  return {
    speaker: `Oracle ${lastRecord.question.target}`,
    line: `“${lastRecord.answer}.” — ${perms} of 6 identity arrangements remain consistent. ${remaining} question${
      remaining === 1 ? '' : 's'
    } left.`,
  };
}

