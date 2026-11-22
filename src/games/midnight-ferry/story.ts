import { CARGO_MAP, type CargoId, type FerryGameState, type FerryMoveRecord } from './engine';

export interface FerryDialogue {
  speaker: string;
  line: string;
}

export const FERRY_PROLOGUE = [
  'At the mouth of Mistwater Crossing, the silent ferryman Vael awaits with his narrow cedar skiff. Before the midnight tide seals the river, three strange tithe offerings must reach the Sanctuary Pier.',
  'The skiff holds Vael and at most one passenger at a time—or Vael rowing alone. Yet the moment he pushes off from a shore, instinct rules whatever remains behind.',
  'Leave the Ash-Wolf alone with the Highland Goat, and the wolf strikes. Leave the Goat alone with the luminous Moon-Cabbage, and the heirloom vanishes. Guide all three across in as few crossings as possible.',
];

export const FERRY_RULES = [
  {
    title: 'One Seat in the Skiff',
    detail: 'Vael can ferry at most one passenger at a time—or row across alone.',
  },
  {
    title: 'Wolf & Goat Peril',
    detail: 'Never leave the Ash-Wolf and Highland Goat alone without Vael.',
  },
  {
    title: 'Goat & Cabbage Peril',
    detail: 'Never leave the Highland Goat and Moon-Cabbage alone without Vael.',
  },
  {
    title: 'Safe Pairing',
    detail: 'The Ash-Wolf has no taste for leaves—Wolf and Cabbage can wait together safely.',
  },
];

export const FERRY_HINTS = {
  tier1: {
    body: 'Look at your very first crossing: only one passenger can leave Mistwater Landing without causing an immediate disaster behind you.',
  },
  tier2: {
    body: 'Cargo does not have to travel strictly one way. Once you deliver a second item to the Sanctuary Pier, bringing the Highland Goat back across with you unlocks the entire puzzle.',
  },
};

export function formatPassengerLabel(passenger: CargoId | null): string {
  return passenger ? CARGO_MAP[passenger].name : 'Ferryman alone';
}

export function getFerryDialogue(
  state: FerryGameState,
  lastMove: FerryMoveRecord | null,
  isRowing: boolean
): FerryDialogue {
  if (state.status === 'won') {
    return {
      speaker: 'Vael',
      line:
        state.moves.length === 7
          ? 'Seven quiet strokes across the mist—not a single trip wasted. The Sanctuary Pier welcomes all three.'
          : `All three offerings stand intact upon the Sanctuary Pier in ${state.moves.length} crossings.`,
    };
  }

  if (state.status === 'lost' && state.conflict) {
    return {
      speaker: 'Mistwater Crossing',
      line: state.conflict.reason,
    };
  }

  if (isRowing) {
    return {
      speaker: 'Vael',
      line: state.boarded
        ? `Easy now, ${CARGO_MAP[state.boarded].shortName}—keep still while the current pulls.`
        : 'The cedar oar parts the dark water in silence...',
    };
  }

  if (!lastMove) {
    if (state.boarded === 'wolf') {
      return {
        speaker: 'Vael',
        line: 'Careful—if we leave the Goat and Moon-Cabbage alone on this bank, the heirloom won’t last a minute.',
      };
    }
    if (state.boarded === 'cabbage') {
      return {
        speaker: 'Vael',
        line: 'Wait—leaving the Ash-Wolf alone with the Highland Goat would end poorly.',
      };
    }
    if (state.boarded === 'goat') {
      return {
        speaker: 'Vael',
        line: 'A wise start. The Ash-Wolf cares nothing for leaves—they will keep the peace while we cross.',
      };
    }
    return {
      speaker: 'Vael',
      line: 'Click a passenger on the lit shore to board the skiff—or push off empty-handed.',
    };
  }

  // Celebrates the classic twist: bringing the Goat back west!
  if (lastMove.passenger === 'goat' && lastMove.to === 'west') {
    return {
      speaker: 'Vael',
      line: 'Brilliant. Bringing the Goat back clears the Sanctuary Pier for the next offering.',
    };
  }

  if (
    state.positions.wolf === 'east' &&
    state.positions.cabbage === 'east' &&
    state.positions.goat === 'west' &&
    state.ferrymanSide === 'west'
  ) {
    return {
      speaker: 'Vael',
      line: 'Wolf and Moon-Cabbage wait peacefully across the water. Only the Highland Goat remains.',
    };
  }

  if (state.boarded) {
    return {
      speaker: 'Vael',
      line: `${CARGO_MAP[state.boarded].name} is aboard. Push off whenever you’re ready.`,
    };
  }

  return {
    speaker: 'Vael',
    line:
      state.ferrymanSide === 'east'
        ? 'You may row back alone—or bring someone back across to keep the peace.'
        : 'Choose who boards the cedar skiff next.',
  };
}

