import { formatJugActionLabel, type JugMoveRecord, type JugsGameState } from './engine';

export interface JugsDialogue {
  speaker: string;
  line: string;
}

export const JUGS_PROLOGUE = [
  'Deep within the Archive’s brass distillery stands the Vault of Stillness. Its bronze counterweight seal will only turn when presented with exactly 4 drams (4L) of luminous Starlight Elixir.',
  'Time has erased every gradation mark from the chamber’s only two crystal vessels: a Small Flask holding exactly 3L, and a Tall Flask holding exactly 5L.',
  'Draw freely from the endless overhead cistern, drain into the stone basin, or transfer elixir between flasks—pouring until the first runs dry or the second fills to the rim.',
];

export const JUGS_RULES = [
  {
    title: 'Exact Measure of 4L',
    detail: 'Stop with exactly 4L of Starlight Elixir in the Tall Flask to unlock the vault.',
  },
  {
    title: 'Fill to the Brim',
    detail: 'Draw from the overhead cistern to fill either unmarked flask completely.',
  },
  {
    title: 'Transfer Between Flasks',
    detail: 'Pour from one vessel into the other until the giver empties or the receiver brims.',
  },
  {
    title: 'Optimal Par: 6 Steps',
    detail: 'Two paths exist—the cleanest solution unlocks the vault in just 6 pours.',
  },
];

export const JUGS_HINTS = {
  tier1: {
    body: 'Think in remainders rather than direct measurements. Filling the 5L flask and pouring it into the 3L flask leaves an exact 2L remainder—a number you couldn’t measure directly.',
  },
  tier2: {
    body: 'If you move that 2L remainder into the empty 3L flask, only 1L of empty space remains inside it. Filling the 5L flask once more and topping off that 1L gap leaves exactly 4L behind!',
  },
};

export function getJugsDialogue(
  state: JugsGameState,
  lastMove: JugMoveRecord | null,
  isAnimating: boolean
): JugsDialogue {
  if (state.status === 'won') {
    return {
      speaker: 'The Distillery',
      line:
        state.moves.length === 6
          ? 'Six crisp measures—not a single drop wasted. The bronze counterweight clicks and the Vault of Stillness parts open.'
          : `Exactly four drams of starlight rest in the Tall Flask (${state.moves.length} steps). The Vault of Stillness unlocks.`,
    };
  }

  if (isAnimating) {
    return {
      speaker: 'The Distillery',
      line: 'Luminous Starlight Elixir glimmers as it flows between crystal and brass...',
    };
  }

  if (!lastMove) {
    return {
      speaker: 'Alchemist’s Note',
      line: 'Select a flask on the bench to fill or empty it—or click one flask then the other to pour directly between them.',
    };
  }

  if (state.small === 2 && state.large === 0) {
    return {
      speaker: 'Alchemist’s Note',
      line: 'Notice the 3L flask now holds 2L—leaving exactly 1L of empty headroom at its rim.',
    };
  }

  if (state.small === 2 && state.large === 5) {
    return {
      speaker: 'Alchemist’s Note',
      line: 'A brimming 5L flask beside a 1L gap in the 3L flask—one final pour will leave exactly 4L!',
    };
  }

  if (state.small === 3 && state.large === 2) {
    return {
      speaker: 'Alchemist’s Note',
      line: 'Two drams remain in the Tall Flask. Empty the Small Flask to preserve that remainder.',
    };
  }

  if (state.small === 1 && state.large === 5) {
    return {
      speaker: 'Alchemist’s Note',
      line: 'You isolated a single dram (1L) in the Small Flask! Clear the Tall Flask to build 1 + 3 = 4.',
    };
  }

  return {
    speaker: 'Alchemist’s Note',
    line: `${formatJugActionLabel(lastMove.action)} — flasks now hold ${state.small}L and ${state.large}L. Aim for 4L.`,
  };
}

