import {
  formatOutcomeLabel,
  getConsistentCoinWorlds,
  MAX_WEIGHINGS,
  type CoinGameState,
  type WeighingRecord,
} from './engine';

export interface CoinDialogue {
  speaker: string;
  line: string;
}

export const COIN_PROLOGUE = [
  'Twelve identical gold coins sit on the Royal Mint’s velvet bench. Eleven are genuine and share the exact same weight—but one coin is counterfeit, making it either heavier or lighter than the rest.',
  'You do not know which coin is fake, nor whether it is heavier or lighter. Before you stands a classic two-pan brass balance scale.',
  'You may use the balance scale at most 3 times (always placing an equal number of coins on both pans). Identify both the exact counterfeit coin and whether it is heavier or lighter.',
];

export const COIN_RULES = [
  {
    title: '12 Coins, 1 Counterfeit',
    detail: 'One coin among 1–12 is either slightly heavier or slightly lighter than the other 11.',
  },
  {
    title: '3 Weighings Maximum',
    detail: 'Each weighing shows Left Heavy, Right Heavy, or Balanced. Pans must hold equal counts.',
  },
  {
    title: 'Find Both Coin & Weight',
    detail: 'Your final verdict must name the counterfeit coin number AND whether it is Heavier or Lighter.',
  },
  {
    title: 'Scale Tracking Marks (+ / − / ✓)',
    detail: 'After each weighing, coins automatically carry + (possible heavier), − (possible lighter), or ✓ (proven genuine) on the scale and tray.',
  },
];

export const COIN_HINTS = {
  tier1: {
    body: 'Never start with 6 vs. 6! A 6 vs. 6 weighing can never balance, so it only gives you 2 outcomes (leaving 12 possibilities—too many for 2 weighings). Instead, split the coins into THREE equal groups of 4: weigh 1, 2, 3, 4 vs. 5, 6, 7, 8 and leave 9, 10, 11, 12 off the scale. Every outcome leaves just 8 possibilities!',
  },
  tier2: {
    body: 'If 1–4 vs 5–8 balances, weigh 9, 10, 11 against 3 genuine coins (1, 2, 3). If 1–4 vs 5–8 tilts (say Left Heavy, so 1–4 could be heavy and 5–8 could be light), mix and swap! Weigh (1, 2, 5) on the Left against (3, 6, 9-genuine) on the Right—every outcome leaves at most 3 possibilities for your final weighing!',
  },
};

export function getCoinDialogue(
  state: CoinGameState,
  lastRecord: WeighingRecord | null,
  isWeighing: boolean
): CoinDialogue {
  if (state.status === 'won') {
    return {
      speaker: 'Master of the Mint',
      line: state.deducedWithCertainty
        ? `Coin #${state.world.fakeCoin} (${state.world.weight}) proven with 100% logical certainty! Pure information theory at work.`
        : `Coin #${state.world.fakeCoin} (${state.world.weight}) matched! Narrow the board down to 1 possibility next time for 3-star certainty.`,
    };
  }

  if (state.status === 'lost') {
    return {
      speaker: 'Master of the Mint',
      line: `The true counterfeit was Coin #${state.world.fakeCoin} (${state.world.weight}). Start a fresh trial and test the 4 vs. 4 split!`,
    };
  }

  if (isWeighing) {
    return {
      speaker: 'The Balance Scale',
      line: 'The brass beam rocks gently on its fulcrum before settling...',
    };
  }

  const remainingWeighings = MAX_WEIGHINGS - state.history.length;
  const remainingWorlds = getConsistentCoinWorlds(state.history).length;

  if (!lastRecord) {
    return {
      speaker: 'Mint Ledger',
      line: 'Choose Left or Right Pan below, tap coins to load the scale evenly, and weigh (3 weighings max).',
    };
  }

  if (remainingWorlds === 1) {
    return {
      speaker: 'Mint Ledger',
      line: 'Only 1 possibility remains! Switch to “Seal Verdict” below to name the counterfeit coin and its weight.',
    };
  }

  if (remainingWeighings === 0) {
    return {
      speaker: 'Mint Ledger',
      line: `All 3 weighings used (${remainingWorlds} possibilities remain). Select the counterfeit coin and Heavier/Lighter below.`,
    };
  }

  return {
    speaker: `Weighing #${lastRecord.index}`,
    line: `${formatOutcomeLabel(lastRecord.outcome)} — ${remainingWorlds} of 24 possibilities remain (${remainingWeighings} weighing${remainingWeighings === 1 ? '' : 's'
      } left).`,
  };
}

