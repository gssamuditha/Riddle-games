import { describe, expect, it } from 'vitest';
import {
  ALL_POSSIBLE_WORLDS,
  askOracleQuestion,
  assignVerdictRole,
  calculateOraclesStars,
  countDistinctRolePermutations,
  createInitialOraclesState,
  evaluateDeterministicAnswer,
  getConsistentWorlds,
  getPossibleRolesPerSlot,
  ORACLE_SLOTS,
  submitVerdict,
  suggestOptimalQuestion,
  type HiddenWorld,
  type OracleQuestion,
  type OracleWord,
} from './engine';

describe('Three Oracles Engine (The Hardest Logic Puzzle Ever)', () => {
  it('Embedded Question Lemma: always returns DA iff P is true for Truth & False regardless of DA/JA meaning', () => {
    for (const world of ALL_POSSIBLE_WORLDS) {
      for (const target of ORACLE_SLOTS) {
        if (world.roles[target] === 'random') continue;

        for (const subject of ORACLE_SLOTS) {
          for (const claimedRole of ['truth', 'false', 'random'] as const) {
            const q: OracleQuestion = {
              target,
              form: 'embedded',
              subject,
              claimedRole,
              embeddedWord: 'DA',
            };
            const expectedTrue = world.roles[subject] === claimedRole;
            const spoken = evaluateDeterministicAnswer(world, q);
            expect(spoken).toBe(expectedTrue ? 'DA' : 'JA');
          }
        }
      }
    }
  });

  it('Classic 3-question Boolos strategy solves ALL 12 worlds under EVERY possible Random coin flip', () => {
    const coinFlipPairs: [OracleWord, OracleWord][] = [
      ['DA', 'DA'],
      ['DA', 'JA'],
      ['JA', 'DA'],
      ['JA', 'JA'],
    ];

    for (const world of ALL_POSSIBLE_WORLDS) {
      for (const [flip1, flip2] of coinFlipPairs) {
        let flips = [flip1, flip2];
        const deterministicRng = () => {
          const next = flips.shift() ?? 'DA';
          return next === 'DA' ? 0.1 : 0.9;
        };

        let state = createInitialOraclesState(world);

        // Execute 3 guided Boolos questions via our live advisor!
        for (let step = 0; step < 3; step++) {
          const suggestion = suggestOptimalQuestion(state);
          expect(suggestion).not.toBeNull();
          const res = askOracleQuestion(state, suggestion!.question, deterministicRng);
          expect(res.error).toBeUndefined();
          state = res.state;
        }

        // After 3 questions, there must be EXACTLY 1 remaining valid identity permutation!
        const consistent = getConsistentWorlds(state.history);
        expect(countDistinctRolePermutations(consistent)).toBe(1);

        // The unique deduced identity must match the true hidden world!
        const deduced = consistent[0].roles;
        expect(deduced).toEqual(world.roles);

        // Assigning and submitting verdict yields 3 stars with 100% certainty
        state = assignVerdictRole(state, 'A', deduced.A);
        state = assignVerdictRole(state, 'B', deduced.B);
        state = assignVerdictRole(state, 'C', deduced.C);

        const judged = submitVerdict(state);
        expect(judged.error).toBeUndefined();
        expect(judged.state.status).toBe('won');
        expect(judged.state.deducedWithCertainty).toBe(true);
        expect(calculateOraclesStars(judged.state)).toBe(3);
      }
    }
  });

  it('Direct questions leave DA/JA meaning ambiguous compared to embedded questions', () => {
    const world: HiddenWorld = {
      roles: { A: 'truth', B: 'false', C: 'random' },
      daMeansYes: true,
    };
    let state = createInitialOraclesState(world);

    // Asking A directly "Is A Truth?" returns DA — but could also be Mendax when DA=No, or Random!
    const res = askOracleQuestion(state, {
      target: 'A',
      form: 'direct',
      subject: 'A',
      claimedRole: 'truth',
      embeddedWord: 'DA',
    });
    state = res.state;
    expect(res.record?.answer).toBe('DA');
    // Still all 6 identity permutations remain possible because DA's meaning is unknown!
    expect(countDistinctRolePermutations(getConsistentWorlds(state.history))).toBe(6);
  });

  it('enforces the 3-question limit and smooth verdict role swapping', () => {
    const world: HiddenWorld = {
      roles: { A: 'truth', B: 'random', C: 'false' },
      daMeansYes: false,
    };
    let state = createInitialOraclesState(world);

    const q: OracleQuestion = {
      target: 'A',
      form: 'embedded',
      subject: 'B',
      claimedRole: 'random',
      embeddedWord: 'DA',
    };
    state = askOracleQuestion(state, q).state;
    state = askOracleQuestion(state, q).state;
    state = askOracleQuestion(state, q).state;

    // 4th question must be rejected
    const fourth = askOracleQuestion(state, q);
    expect(fourth.error).toBeTruthy();

    // Verdict swapping test
    state = assignVerdictRole(state, 'A', 'truth');
    state = assignVerdictRole(state, 'B', 'truth'); // swaps A <-> B
    expect(state.verdict.B).toBe('truth');
    expect(state.verdict.A).toBeNull();

    // Incorrect verdict triggers loss cleanly
    state = assignVerdictRole(state, 'A', 'false');
    state = assignVerdictRole(state, 'C', 'random');
    const lost = submitVerdict(state);
    expect(lost.state.status).toBe('lost');
    expect(calculateOraclesStars(lost.state)).toBe(0);
  });

  it('tracks guaranteed non-Random slot accurately after Q1', () => {
    const world: HiddenWorld = {
      roles: { A: 'false', B: 'truth', C: 'random' },
      daMeansYes: false,
    };
    let state = createInitialOraclesState(world);

    // Ask A (False) embedded: "If I asked whether B is Random, would you say DA?"
    // B is Truth (not Random), so embedded returns JA!
    const q1 = askOracleQuestion(state, {
      target: 'A',
      form: 'embedded',
      subject: 'B',
      claimedRole: 'random',
      embeddedWord: 'DA',
    });
    expect(q1.record?.answer).toBe('JA');
    state = q1.state;

    // Because A answered JA, B is guaranteed NOT Random!
    const possible = getPossibleRolesPerSlot(state.history);
    expect(possible.B).not.toContain('random');
  });
});

