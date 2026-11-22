import {
  DOOR_NUMERALS,
  getSwitchTargetDoor,
  KEYS_TO_WIN,
  MAX_ROUNDS,
  type VaultTrialState,
} from './engine';

export interface VaultDialogue {
  speaker: string;
  line: string;
}

export const VAULT_PROLOGUE = [
  'Within the iron Vault Hall stand three towering bronze doors—I, II, and III. Behind one waits a radiant Astral Key; behind the other two lie hollow stone traps.',
  'In each round, choose any sealed door. Before it opens, the Archivist—who knows where the Key hides—will deliberately unseal one of the remaining doors to reveal an empty trap.',
  `You then face a quiet choice: stay with your first door, or switch to the other sealed vault. Collect ${KEYS_TO_WIN} Astral Keys within ${MAX_ROUNDS} rounds—and test whether your intuition matches probability.`,
];

export const VAULT_RULES = [
  {
    title: 'Choose a Sealed Vault',
    detail: 'Each round hides one Astral Key randomly behind Door I, II, or III.',
  },
  {
    title: 'The Archivist’s Reveal',
    detail: 'The Archivist always opens one unchosen door that is guaranteed to be empty.',
  },
  {
    title: 'Stay or Switch',
    detail: 'Keep your original door—or switch to the single other sealed vault before unsealing.',
  },
  {
    title: `Collect ${KEYS_TO_WIN} Keys in ${MAX_ROUNDS} Rounds`,
    detail: 'Discover the optimal strategy to claim 6 Astral Keys and earn 3 golden stars.',
  },
];

export const VAULT_HINTS = {
  tier1: {
    body: 'Most people assume two remaining closed doors mean a 50/50 split. Pause and ask: did the Archivist open a door at random—or did he use hidden knowledge to avoid the Astral Key?',
  },
  tier2: {
    body: 'When you first pick a door, you have a 1-in-3 chance of being right and a 2-in-3 chance that the Key sits behind the OTHER two doors combined. When the Archivist removes the empty door from that 2/3 group, the entire 2/3 probability concentrates onto the single remaining switch door!',
  },
  tier3: {
    body: 'Always Switch! Switching doubles your odds on every single round—from 33.3% (1/3) to 66.7% (2/3). Over 10 rounds, always switching averages 6.7 keys, while staying averages only 3.3.',
  },
};

export function getVaultDialogue(state: VaultTrialState, isAnimating: boolean): VaultDialogue {
  const round = state.currentRound;

  if (state.status === 'won') {
    return {
      speaker: 'The Archivist',
      line: `Six Astral Keys claimed in ${state.history.length} rounds! You saw past the 50/50 illusion and mastered conditional probability.`,
    };
  }

  if (state.status === 'lost') {
    return {
      speaker: 'The Archivist',
      line: 'Too many hollow stone vaults sealed the hall. Compare your Stay vs. Switch rates—and trust the math on your next attempt.',
    };
  }

  if (isAnimating) {
    return {
      speaker: 'The Vault Hall',
      line: 'Heavy bronze tumblers grind open across the stone floor...',
    };
  }

  if (round.phase === 'pick') {
    return {
      speaker: 'The Archivist',
      line:
        round.roundNumber === 1
          ? 'One Astral Key rests behind these three bronze vaults. Tap a door to stake your first claim.'
          : `Round ${round.roundNumber} of ${MAX_ROUNDS} — the Astral Key has been hidden anew. Choose a sealed door.`,
    };
  }

  if (round.phase === 'decide' && round.hostRevealedDoor !== null && round.initialPick !== null) {
    const switchDoor = getSwitchTargetDoor(round);
    return {
      speaker: 'The Archivist',
      line: `Door ${DOOR_NUMERALS[round.hostRevealedDoor]} holds only empty stone. Will you stay with Door ${
        DOOR_NUMERALS[round.initialPick]
      }—or switch to Door ${switchDoor !== null ? DOOR_NUMERALS[switchDoor] : ''}?`,
    };
  }

  if (round.phase === 'revealed') {
    if (round.wonRound) {
      return {
        speaker: 'The Archivist',
        line: round.switched
          ? `Switching to Door ${DOOR_NUMERALS[round.finalPick!]} uncovered an Astral Key! (${state.keysCollected}/${KEYS_TO_WIN})`
          : `Door ${DOOR_NUMERALS[round.finalPick!]} held an Astral Key! (${state.keysCollected}/${KEYS_TO_WIN})`,
      };
    }
    return {
      speaker: 'The Archivist',
      line: `Empty stone behind Door ${DOOR_NUMERALS[round.finalPick!]}. The Astral Key lay behind Door ${
        DOOR_NUMERALS[round.prizeDoor]
      }.`,
    };
  }

  return {
    speaker: 'The Archivist',
    line: 'Choose wisely.',
  };
}

