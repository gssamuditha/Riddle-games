import React from 'react';
import { motion } from 'framer-motion';
import { Lock, RotateCcw, X } from 'lucide-react';
import { analyzeBridgeState, TRAVELER_MAP, type BridgeGameState } from './engine';
import { formatTravelerNames, PROGRESSIVE_HINTS } from './story';

interface HintPanelProps {
  state: BridgeGameState;
  unlockedTier: 0 | 1 | 2 | 3;
  onUnlockTier: (tier: 1 | 2 | 3) => void;
  onUndoSteps: (count: number) => void;
  onClose: () => void;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  state,
  unlockedTier,
  onUnlockTier,
  onUndoSteps,
  onClose,
}) => {
  const analysis = analyzeBridgeState(state);

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
            Reveal one whisper at a time. Solving without hints earns 3 stars.
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
              I · The Common Trap
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
            <p className="mt-2.5 text-sm leading-relaxed text-paper-800 dark:text-ivory-200/90">
              {PROGRESSIVE_HINTS.tier1.body}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-paper-700/70 dark:text-ivory-300/60">
              A nudge on why the fastest-escort strategy falls 2 minutes short.
            </p>
          )}
        </div>

        {/* Tier 2 */}
        <div className="rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold-600 dark:text-gold-300/85">
              II · The Key Insight
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
              {PROGRESSIVE_HINTS.tier2.body}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-paper-700/70 dark:text-ivory-300/60">
              The core pairing breakthrough—without spoiling your exact next move.
            </p>
          )}
        </div>

        {/* Tier 3 — Live Optimal Solver */}
        <div className="rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold-600 dark:text-gold-300/85">
              III · Live Next Move
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
                  You have already solved this trial.
                </p>
              ) : analysis.canStillWin && analysis.optimalNextMove ? (
                <p>
                  Send{' '}
                  <strong className="text-paper-900 dark:text-ivory-100">
                    {formatTravelerNames(analysis.optimalNextMove)}
                  </strong>{' '}
                  {state.lanternSide === 'left'
                    ? 'across to the Safe Ridge'
                    : 'back to the Cliff'}{' '}
                  <span className="font-mono text-xs text-gold-600 dark:text-gold-300">
                    ({Math.max(...analysis.optimalNextMove.map((id) => TRAVELER_MAP[id].time))}m)
                  </span>
                  .
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-[#c44536] dark:text-[#e07a6b]">
                    From here, the fastest mathematical finish reaches{' '}
                    <strong>{analysis.projectedBestTotal} min</strong> (past 17).
                  </p>
                  {analysis.undoCountToWinnable !== null && (
                    <button
                      type="button"
                      onClick={() => onUndoSteps(analysis.undoCountToWinnable!)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 border border-gold-600/30 px-4 py-1.5 text-xs font-medium text-gold-600 hover:bg-gold-500/25 dark:bg-gold-400/15 dark:border-gold-400/35 dark:text-gold-200 dark:hover:bg-gold-400/25 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Undo {analysis.undoCountToWinnable} step
                      {analysis.undoCountToWinnable > 1 ? 's' : ''} back to winnable state
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-paper-700/70 dark:text-ivory-300/60">
              Computes the optimal move live from your current cliff positions.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
