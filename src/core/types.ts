export type RiddleId =
  | 'bridge-riddle'
  | 'midnight-ferry'
  | 'alchemist-jugs'
  | 'three-doors'
  | 'penniless-pilgrim'
  | 'egg-drop'
  | 'virus-riddle'
  | 'counterfeit-coin'
  | 'three-oracles';

export type RiddleAvailability = 'playable' | 'coming-soon';
export type ThemeMode = 'dark' | 'light';

export interface RiddleMeta {
  id: RiddleId;
  chapterNumber: string;
  title: string;
  classicName: string;
  tagline: string;
  lorePreview: string;
  difficulty: 'Classic' | 'Intermediate' | 'Master';
  estimatedTime: string;
  status: RiddleAvailability;
  accentFrom: string;
  accentTo: string;
}

export interface RiddleProgress {
  solved: boolean;
  bestTimeMinutes: number | null;
  bestMoves: number | null;
  stars: 0 | 1 | 2 | 3;
  attempts: number;
  lastPlayedAt: string | null;
}

export interface ArchiveStorage {
  riddles: Partial<Record<RiddleId, RiddleProgress>>;
  muted: boolean;
  theme: ThemeMode;
}
