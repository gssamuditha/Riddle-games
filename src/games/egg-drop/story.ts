import {
  getOptimalDropAdvice,
  MAX_DROPS,
  STARTING_EGGS,
  TOTAL_FLOORS,
  type EggDropState,
} from './engine';

export interface EggDialogue {
  speaker: string;
  line: string;
}

export const EGG_PROLOGUE = [
  `You stand beside a ${TOTAL_FLOORS}-floor stone belltower holding ${STARTING_EGGS} identical Crystal Eggs.`,
  'Somewhere in the tower is an exact highest safe floor: drop an egg at or below it and the egg survives to be dropped again; drop it any higher and it shatters.',
  `Your goal is to prove the exact highest safe floor in ${MAX_DROPS} drops or fewer. Think ahead: risky shortcuts that cannot guarantee a ${MAX_DROPS}-drop solution will backfire!`,
];

export const EGG_RULES = [
  {
    title: '2 Crystal Eggs',
    detail: 'An egg that survives can be reused; an egg that shatters is gone for good.',
  },
  {
    title: 'Find the Exact Floor',
    detail: 'Prove the highest safe floor (safe at Floor F, breaks at Floor F+1) in at most 14 drops.',
  },
  {
    title: '1 Egg Left = Go Floor-by-Floor',
    detail: 'Once your first egg breaks, test one floor at a time upward so you never skip the answer.',
  },
  {
    title: 'Worst-Case Guarantee',
    detail: 'The belltower tests your logic—any drop that cannot guarantee 14 drops triggers the harder outcome.',
  },
];

export const EGG_HINTS = {
  tier1: {
    body: 'Splitting in half (Floor 50) fails because if Egg #1 shatters, your last egg must climb 49 floors one-by-one! Fixed jumps of 10 (10, 20, 30...) can still take up to 19 drops (10 jumps + 9 linear checks).',
  },
  tier2: {
    body: 'Every time Egg #1 survives, you have 1 fewer drop left in your 14-drop budget—so shrink your jump size by 1 each time! Start at Floor 14 (+14), then 27 (+13), 39 (+12), 50 (+11), 60 (+10), 69 (+9)... Notice 14 + 13 + 12 + ... + 1 = 105 ≥ 100!',
  },
};

export function getEggDialogue(state: EggDropState, isDropping: boolean): EggDialogue {
  if (state.status === 'won') {
    return {
      speaker: 'Belltower Keeper',
      line: `Floor ${state.lowSafe} is proven to be the exact highest safe floor—solved in ${state.dropsUsed} drop${
        state.dropsUsed === 1 ? '' : 's'
      }!`,
    };
  }

  if (state.status === 'lost_no_eggs') {
    return {
      speaker: 'Belltower Keeper',
      line: `Both crystal eggs shattered while floors ${state.lowSafe + 1}–${
        state.highBreak - 1
      } remained untested. With 1 egg left, never skip a floor!`,
    };
  }

  if (state.status === 'lost_out_of_drops') {
    return {
      speaker: 'Belltower Keeper',
      line: `All ${MAX_DROPS} drops are spent and floors ${state.lowSafe + 1}–${
        state.highBreak - 1
      } are still uncertain. Try shrinking your jump size by 1 after each safe drop!`,
    };
  }

  if (isDropping) {
    return {
      speaker: 'The Belltower',
      line: 'The crystal egg falls past the stone arches toward the courtyard...',
    };
  }

  const last = state.history.length > 0 ? state.history[state.history.length - 1] : null;
  if (!last) {
    return {
      speaker: 'Belltower Keeper',
      line: 'Choose your first drop floor below. Hint: how high can you start if Egg #1 shatters on Drop 1?',
    };
  }

  const advice = getOptimalDropAdvice(state);
  if (last.wasForcedByStrategy && last.outcome === 'shattered') {
    return {
      speaker: 'Belltower Keeper',
      line: `Shattered at Floor ${last.floor}! Jumping that far couldn’t guarantee a 14-drop finish if Egg #1 broke—now only 1 egg remains.`,
    };
  }

  if (last.outcome === 'shattered') {
    return {
      speaker: 'Belltower Keeper',
      line: `Egg #1 shattered at Floor ${last.floor}! With 1 egg left, test upward one floor at a time starting from Floor ${
        state.lowSafe + 1
      }.`,
    };
  }

  if (!advice.canStillGuaranteeWin) {
    return {
      speaker: 'Belltower Keeper',
      line: `Survived Floor ${last.floor}—but ${
        state.highBreak - state.lowSafe - 1
      } untested floors remain with only ${
        state.maxDrops - state.dropsUsed
      } drops left. Too small a step!`,
    };
  }

  return {
    speaker: 'Belltower Keeper',
    line: `Survived Floor ${last.floor}! Safe up to ${state.lowSafe}. ${
      state.maxDrops - state.dropsUsed
    } drops remaining.`,
  };
}

