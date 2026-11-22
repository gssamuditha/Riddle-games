import {
  DIRECTION_RULES,
  formatTax,
  type PilgrimGameState,
} from './engine';

export interface PilgrimDialogue {
  speaker: string;
  line: string;
}

export const PILGRIM_PROLOGUE = [
  'You arrive at the walled grid-city of Duonia without a single coin in your pocket, hoping to reach the Golden Temple at the far southeast corner.',
  'The entry road already carried you 2 blocks East from the West Gate, leaving you with a starting tax bill of 4 silver. Every city block you walk changes your tax based on the direction you move.',
  'City guards forbid walking down the same street block twice (though you may cross intersections more than once). Find a path to the Temple where your final tax bill equals exactly 0.',
];

export const PILGRIM_RULES = [
  {
    title: 'East (+2) & West (−2)',
    detail: 'Walking East adds 2 silver to your tax; walking West subtracts 2 silver.',
  },
  {
    title: 'South (×2) & North (÷2)',
    detail: 'Walking South doubles your current tax; walking North halves it.',
  },
  {
    title: 'No Repeat Streets',
    detail: 'You can cross an intersection again, but never walk the same street twice.',
  },
  {
    title: 'Reach the Temple at 0',
    detail: 'Arrive at the Southeast Temple with an exact tax bill of 0 (negative tax is allowed along the way!).',
  },
];

export const PILGRIM_HINTS = {
  tier1: {
    body: 'Don’t be afraid of going below zero! If your tax is small and you walk West (−2), your tax turns negative (the city owes you credit). Even better: walking South (×2) doubles a negative tax—turning −1 into −2, −4, and −8!',
  },
  tier2: {
    body: 'To reach the Temple from the West along the bottom street (4 East steps = +8), you want to arrive at the bottom-left corner with −8 tax—which comes from reaching row 1 on the far left with −1 tax! Start by looping counterclockwise on the right half: 3 South, 2 East, 3 North (giving 4.5), then 1 West, 1 South, and 3 West across row 1.',
  },
};

export function getPilgrimDialogue(state: PilgrimGameState): PilgrimDialogue {
  if (state.status === 'won') {
    return {
      speaker: 'Temple Keeper',
      line: `Zero silver owed! Enter the Golden Temple in peace—completed in ${state.moves.length} steps.`,
    };
  }

  if (state.status === 'temple_rejected') {
    return {
      speaker: 'Temple Guard',
      line: `You reached the Temple gate with a tax of ${formatTax(
        state.tax
      )} silver—not 0! Undo a few steps or reset to find a zero-tax route.`,
    };
  }

  if (state.status === 'stuck') {
    return {
      speaker: 'City Map',
      line: 'Every street leading from this corner has already been walked. Undo your last step to backtrack.',
    };
  }

  if (state.moves.length === 0) {
    return {
      speaker: 'City Map',
      line: 'Tap a glowing corner (or use arrow keys / WASD) to walk. Remember: you must reach the SE Temple at exactly 0 tax.',
    };
  }

  if (state.tax < 0 && state.position.col === 0 && state.position.row === 4 && state.tax === -8) {
    return {
      speaker: 'Pilgrim’s Journal',
      line: 'Tax is −8 at the southwest corner! Four straight blocks East (+2 each) will bring you to the Temple at exactly 0!',
    };
  }

  if (state.tax < 0) {
    return {
      speaker: 'Pilgrim’s Journal',
      line: `Your tax dropped below zero (${formatTax(
        state.tax
      )})! Walking South (×2) will double this negative balance even further.`,
    };
  }

  const last = state.moves[state.moves.length - 1];
  const rule = DIRECTION_RULES[last.dir];
  return {
    speaker: 'Pilgrim’s Journal',
    line: `Walked ${rule.label} (${rule.opText}) → tax is now ${formatTax(
      state.tax
    )}. ${state.moves.length} step${state.moves.length === 1 ? '' : 's'} taken.`,
  };
}

