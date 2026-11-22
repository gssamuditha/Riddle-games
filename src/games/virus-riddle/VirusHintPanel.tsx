import React from 'react';
import { motion } from 'framer-motion';
import { Grid2X2, Lock, RotateCcw, X } from 'lucide-react';
import {
  getVirusSolverAdvice,
  type LabCoord,
  type VirusGameState,
} from './engine';
import { VIRUS_HINTS } from './story';

interface VirusHintPanelProps {
  state: VirusGameState;
  unlockedTier: 0 | 1 | 2 | 3;
  showParity: boolean;
  onToggleParity: () => void;
  onUnlockTier: (tier: 1 | 2 | 3) => void;
  onUndoSteps: (count: number) => void;
  onClose: () => void;
}

function directionWord(from: LabCoord, to: LabCoord): string {
  if (to.row < from.row) return 'Up (North)';
  if (to.row > from.row) return 'Down (South)';
  if (to.col > from.col) return 'Right (East)';
  return 'Left (West)';
}

export const VirusHintPanel: React.FC<VirusHintPanelProps> = ({
  state,
  unlockedTier,
  showParity,
  onToggleParity,
  onUnlockTier,
  onUndoSteps,
  onClose,
}) => {
  const advice = getVirusSolverAdvice(state);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="surface-glass rounded-3xl p-6 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-paper-900/10 dark:border-white/[0.08]">
        <div>
          <h3 className="font-display text-2xl font-semibold text-paper-900 dark:text-ivory-100">
            Progressive Hints
          </h3>
          <p className="mt-0.5 text-xs text-paper-700 dark:text-ivory-300">
            Reveal one insight at a time. Clearing the facility without hints or undos earns 3 stars.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
          aria-label="Close hints"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {/* Tier 1 */}
        <div className="rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold-600 dark:text-gold-300/85">
              I · The Chessboard Parity Trap
            </span>
            {unlockedTier < 1 && (
              <button
                type="button"
                onClick={() => onUnlockTier(1)}
                className="rounded-full border border-gold-600/35 px-3.5 py-1 text-xs font-medium text-gold-600 hover:bg-gold-500/10 dark:border-gold-400/35 dark:text-gold-200 dark:hover:bg-gold-400/10 transition"
              >
                Reveal
              </button>
            )}
          </div>
          {unlockedTier >= 1 ? (
            <div className="mt-2.5 space-y-2.5">
              <p className="text-sm leading-relaxed text-paper-800 dark:text-ivory-200/90">
                {VIRUS_HINTS.tier1.body}
              </p>
              <button
                type="button"
                onClick={onToggleParity}
                className="inline-flex items-center gap-1.5 rounded-full border border-paper-900/15 px-3 py-1 text-xs font-medium text-paper-800 hover:bg-paper-900/[0.05] dark:border-white/15 dark:text-ivory-200 dark:hover:bg-white/[0.06] transition"
              >
                <Grid2X2 className="h-3.5 w-3.5" />
                {showParity ? 'Hide Chessboard Parity Tint' : 'Show Chessboard Parity Tint'}
              </button>
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-paper-700/70 dark:text-ivory-300/60">
              Why a direct single-visit tour from NW to SE is mathematically impossible.
            </p>
          )}
        </div>

        {/* Tier 2 */}
        <div className="rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold-600 dark:text-gold-300/85">
              II · The Clean Entrance Loophole
            </span>
            {unlockedTier < 2 && (
              <button
                type="button"
                onClick={() => onUnlockTier(2)}
                disabled={unlockedTier < 1}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold-600/35 px-3.5 py-1 text-xs font-medium text-gold-600 hover:bg-gold-500/10 dark:border-gold-400/35 dark:text-gold-200 dark:hover:bg-gold-400/10 disabled:opacity-35 disabled:pointer-events-none transition"
              >
                {unlockedTier < 1 && <Lock className="h-3 w-3" />}
                Reveal
              </button>
            )}
          </div>
          {unlockedTier >= 2 ? (
            <p className="mt-2.5 text-sm leading-relaxed text-paper-800 dark:text-ivory-200/90">
              {VIRUS_HINTS.tier2.body}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-paper-700/70 dark:text-ivory-300/60">
              How one room’s special starting state breaks the parity lock.
            </p>
          )}
        </div>

        {/* Tier 3 — Live Exact Backtracking Solver */}
        <div className="rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold-600 dark:text-gold-300/85">
              III · Live Next Airlock
            </span>
            {unlockedTier < 3 && (
              <button
                type="button"
                onClick={() => onUnlockTier(3)}
                disabled={unlockedTier < 2}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold-600/35 px-3.5 py-1 text-xs font-medium text-gold-600 hover:bg-gold-500/10 dark:border-gold-400/35 dark:text-gold-200 dark:hover:bg-gold-400/10 disabled:opacity-35 disabled:pointer-events-none transition"
              >
                {unlockedTier < 2 && <Lock className="h-3 w-3" />}
                Reveal
              </button>
            )}
          </div>
          {unlockedTier >= 3 ? (
            <div className="mt-2.5 text-sm leading-relaxed text-paper-800 dark:text-ivory-200/90">
              {state.status === 'won' ? (
                <p className="text-[#2f855a] dark:text-[#6abf94]">
                  The lab is already sterilized!
                </p>
              ) : advice.solvableFromHere && advice.nextRoom ? (
                <p>
                  A winning escape still exists from right here! Next step:{' '}
                  <strong className="text-paper-900 dark:text-ivory-100">
                    Move {directionWord(state.position, advice.nextRoom)}
                  </strong>{' '}
                  <span className="font-mono text-xs text-gold-600 dark:text-gold-300">
                    (Row {advice.nextRoom.row + 1}, Col {advice.nextRoom.col + 1})
                  </span>
                  .
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-[#c44536] dark:text-[#e07a6b]">
                    From this board state, no valid path can reach the SE Exit after clearing all
                    15 rooms.
                  </p>
                  {advice.undoCountToSolvable > 0 && (
                    <button
                      type="button"
                      onClick={() => onUndoSteps(advice.undoCountToSolvable)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 border border-gold-600/30 px-4 py-1.5 text-xs font-medium text-gold-600 hover:bg-gold-500/25 dark:bg-gold-400/15 dark:border-gold-400/35 dark:text-gold-200 dark:hover:bg-gold-400/25 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Undo {advice.undoCountToSolvable} step
                      {advice.undoCountToSolvable === 1 ? '' : 's'} back to solvable state
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-paper-700/70 dark:text-ivory-300/60">
              Checks mathematically whether your current board is solvable and gives the exact next move.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

