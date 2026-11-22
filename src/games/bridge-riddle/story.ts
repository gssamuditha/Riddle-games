import { TRAVELER_MAP, type BridgeGameState, type MoveRecord, type TravelerId } from './engine';

export interface StoryDialogue {
  speaker: string;
  accentColor: string;
  line: string;
}

export const PROLOGUE_PARAGRAPHS = [
  'High above the fog-choked Obsidian Ravine, your midnight expedition has just pried the Solar Chronometer from the crumbling Glass Observatory.',
  'The instant the relic lifts from its pedestal, a deep seismic crack fractures the cliff face. The suspension bridge anchors will shear into the abyss in exactly 17 minutes.',
  'Night fog hides rotted planks across the chasm—no one dares step onto the span without the single Brass Sun-Lantern. Worse, the frayed hemp ropes hold at most two people at once, and any pair must walk at the pace of the slower traveler.',
];

export const BRIDGE_RULES = [
  {
    title: 'One Brass Lantern',
    detail: 'Every crossing—forward or back—must carry the glowing lantern.',
  },
  {
    title: 'Two Travelers Maximum',
    detail: 'The frayed suspension ropes support at most 2 people at once.',
  },
  {
    title: 'Pace of the Slower',
    detail: 'A pair crosses together at the slower traveler’s speed to stay in the light.',
  },
  {
    title: '17 Minutes to Collapse',
    detail: 'All four expedition members must reach the Safe Ridge within 17 minutes.',
  },
];

export const PROGRESSIVE_HINTS = {
  tier1: {
    title: 'Whisper I — The Common Trap',
    body: 'Using Lyra (1 min) as a courier to escort everyone one by one feels fast—but count the trips: 10 + 1 + 5 + 1 + 2 equals 19 minutes. Two minutes too late.',
  },
  tier2: {
    title: 'Whisper II — Hide the Heavy Walk',
    body: 'Every minute Garrick (5m) and Master Orin (10m) walk separately costs you dearly. Send them across together so Garrick’s 5-minute trek happens inside Orin’s 10-minute crossing—just make sure someone swift is already waiting on the Safe Ridge to carry the lantern back!',
  },
};

export function formatTravelerNames(ids: TravelerId[]): string {
  return ids.map((id) => TRAVELER_MAP[id].name).join(' & ');
}

export function getDynamicDialogue(
  state: BridgeGameState,
  lastMove: MoveRecord | null,
  isCrossing: boolean
): StoryDialogue {
  const remaining = Math.max(0, state.timeLimit - state.elapsedMinutes);

  if (state.status === 'won') {
    return {
      speaker: 'Master Orin',
      accentColor: '#34d399',
      line: 'The last anchor snapped behind our heels—we made it with the Chronometer intact! Brilliant strategy.',
    };
  }

  if (state.status === 'lost') {
    const over = state.elapsedMinutes - state.timeLimit;
    if (over === 2 && state.moves.length === 5) {
      return {
        speaker: 'Master Orin',
        accentColor: '#f87171',
        line: 'Nineteen minutes! Having Lyra escort everyone separately cost us two precious minutes. Pair the slowest together!',
      };
    }
    return {
      speaker: 'Garrick',
      accentColor: '#f87171',
      line: 'The iron anchors gave way! Undo your last move or regroup at the cliff edge and try another relay.',
    };
  }

  if (isCrossing) {
    return {
      speaker: 'The Ravine',
      accentColor: '#fbbf24',
      line: 'Ropes groan above the mist as the brass lantern carves a narrow tunnel through the dark...',
    };
  }

  if (!lastMove) {
    if (state.selected.includes('garrick') && state.selected.includes('orin')) {
      return {
        speaker: 'Tomas',
        accentColor: '#38bdf8',
        line: 'Wait—if Garrick and Master Orin cross first, one of them would have to trudge all the way back with the lantern!',
      };
    }
    if (state.selected.includes('lyra') && state.selected.includes('tomas')) {
      return {
        speaker: 'Lyra',
        accentColor: '#34d399',
        line: 'Tomas and I can sprint ahead in 2 minutes and set up a swift relay on the far ridge.',
      };
    }
    return {
      speaker: 'Master Orin',
      accentColor: '#c084fc',
      line: 'Seventeen minutes before the anchors shear. Pick 1 or 2 of us on this cliff to carry the lantern across.',
    };
  }

  if (remaining <= 4) {
    return {
      speaker: 'Tomas',
      accentColor: '#fbbf24',
      line: `Only ${remaining} minute${remaining === 1 ? '' : 's'} left! The cliffstone is fracturing beneath our boots!`,
    };
  }

  if (
    lastMove.travelers.includes('garrick') &&
    lastMove.travelers.includes('orin') &&
    lastMove.to === 'right'
  ) {
    return {
      speaker: 'Garrick',
      accentColor: '#fb923c',
      line: 'Both heavyweights across in one trip! That saved us five full minutes—now send the lantern back swiftly.',
    };
  }

  if (lastMove.to === 'left' && lastMove.travelers.length === 1) {
    const runner = TRAVELER_MAP[lastMove.travelers[0]];
    return {
      speaker: runner.name,
      accentColor: runner.accentColor,
      line:
        runner.time <= 2
          ? 'Lantern’s back on the cliff! Who steps onto the bridge next?'
          : 'Whew... bringing the lantern back took precious minutes. Let’s plan carefully.',
    };
  }

  return {
    speaker: 'Lyra',
    accentColor: '#34d399',
    line:
      state.lanternSide === 'right'
        ? 'Someone on the Safe Ridge must carry the lantern back for the others.'
        : `${remaining} minutes remain on the Chronometer. Choose the next crossing wisely.`,
  };
}

