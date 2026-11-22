import { TOTAL_VIRUS_ROOMS, type VirusGameState } from './engine';

export interface VirusDialogue {
  speaker: string;
  line: string;
}

export const VIRUS_PROLOGUE = [
  'A spill has contaminated an underground 4×4 research lab (16 connected rooms). Every single room contains the virus—except the Entrance room (top-left) where you start.',
  'To sterilize the facility, walk into every contaminated room to pull its sterilizer switch, and finish in the Exit room (bottom-right) so you can step safely outside.',
  'Once you leave a contaminated room, its blast door seals forever—you can never walk back into a sealed room. Can you clear all 15 rooms and escape out the Exit?',
];

export const VIRUS_RULES = [
  {
    title: 'Clear All 15 Virus Rooms',
    detail: 'Stepping into a contaminated room automatically pulls its switch and sterilizes it.',
  },
  {
    title: 'Blast Doors Seal Behind You',
    detail: 'Once you leave any cleared room, it locks permanently and cannot be entered again.',
  },
  {
    title: 'Entrance Starts Clean',
    detail: 'The top-left Entrance room has no virus at the start, so it does not lock when you first leave it.',
  },
  {
    title: 'Finish at the SE Exit',
    detail: 'Step into the bottom-right Exit room as your very last move after all other rooms are cleared.',
  },
];

export const VIRUS_HINTS = {
  tier1: {
    body: 'Try toggling the Chessboard Parity view! Notice that the top-left Entrance and bottom-right Exit sit on the SAME color square. Visiting all 16 rooms once each takes 15 steps—which MUST end on the opposite color, making a simple single-pass path mathematically impossible!',
  },
  tier2: {
    body: 'Look closely at the Entrance room (top-left): because it started clean, it did NOT seal when you left it! Step out into one neighbor (right or down) to clear it, then step RIGHT BACK into the clean Entrance room. That single revisit flips your chessboard parity so you can snake through all remaining rooms and finish cleanly on the Exit!',
  },
};

export function getVirusDialogue(state: VirusGameState): VirusDialogue {
  if (state.status === 'won') {
    return {
      speaker: 'Quarantine Control',
      line: `All ${TOTAL_VIRUS_ROOMS} contaminated rooms sterilized and the Exit airlock is open! You broke the parity trap in ${state.moves.length} moves.`,
    };
  }

  if (state.status === 'exit_early') {
    const left = TOTAL_VIRUS_ROOMS - state.clearedVirusCount;
    return {
      speaker: 'Quarantine Control',
      line: `You reached the Exit with ${left} contaminated room${
        left === 1 ? '' : 's'
      } still active! Leaving the Exit seals it forever—undo and save the Exit for last.`,
    };
  }

  if (state.status === 'stuck') {
    return {
      speaker: 'Quarantine Control',
      line: 'Every adjacent airlock is sealed shut! Undo a step or two to try another loop.',
    };
  }

  if (state.moves.length === 0) {
    return {
      speaker: 'Lab Blueprint',
      line: 'Click an adjacent room (or use Arrow keys / WASD) to step out of the clean Entrance.',
    };
  }

  const last = state.moves[state.moves.length - 1];
  if (last.revisitedCleanEntrance) {
    return {
      speaker: 'Lab Blueprint',
      line: 'Smart move! Stepping back into the clean Entrance flips your parity—now snake through the remaining 14 rooms to the SE Exit.',
    };
  }

  const remaining = TOTAL_VIRUS_ROOMS - state.clearedVirusCount;
  return {
    speaker: 'Lab Blueprint',
    line: `${state.clearedVirusCount} of ${TOTAL_VIRUS_ROOMS} virus rooms cleared (${remaining} remaining). Save the bottom-right Exit for your final step.`,
  };
}

