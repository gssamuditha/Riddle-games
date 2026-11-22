import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, RotateCcw, Star, Undo2 } from 'lucide-react';
import { calculateStarRating, type BridgeGameState } from './engine';
import { formatTravelerNames } from './story';

interface OutcomeModalProps {
  state: BridgeGameState;
  onRestart: () => void;
  onUndoLast: () => void;
  onBackToHub: () => void;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  state,
  onRestart,
  onUndoLast,
  onBackToHub,
}) => {
  const [showMath, setShowMath] = useState(false);

  if (state.status === 'playing') return null;

  const isWin = state.status === 'won';
  const stars = calculateStarRating(state);
  const minutesOver = Math.max(0, state.elapsedMinutes - state.timeLimit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/75 p-4 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="surface-glass my-auto w-full max-w-lg rounded-3xl p-7 sm:p-9 text-center"
      >
        <div
          className={`text-[11px] font-medium uppercase tracking-[0.26em] ${
            isWin
              ? 'text-[#2f855a] dark:text-[#6abf94]'
              : 'text-[#c44536] dark:text-[#e07a6b]'
          }`}
        >
          {isWin ? 'Trial Complete' : 'Bridge Collapsed'}
        </div>

        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-paper-900 dark:text-ivory-100">
          {isWin ? 'All Four Reached Safety' : 'The Anchors Gave Way'}
        </h2>

        <p className="mt-2.5 text-sm leading-relaxed text-paper-700 dark:text-ivory-300">
          {isWin
            ? 'The suspension cables sheared moments behind your final step—the Solar Chronometer is safe.'
            : minutesOver > 0
            ? `Your crossing took ${state.elapsedMinutes} minutes—${minutesOver} minute${
                minutesOver === 1 ? '' : 's'
              } beyond the 17-minute limit.`
            : 'All 17 minutes ran dry while travelers remained stranded on the far cliff.'}
        </p>

        {/* Refined Star Reveal */}
        {isWin && (
          <div className="mt-5 flex items-center justify-center gap-2.5">
            {[1, 2, 3].map((idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.14 * idx, type: 'spring', stiffness: 260, damping: 18 }}
              >
                <Star
                  className={`h-6 w-6 ${
                    idx <= stars
                      ? 'fill-gold-500 text-gold-500 dark:fill-gold-400 dark:text-gold-300'
                      : 'text-paper-900/15 dark:text-white/15'
                  }`}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Clean Metrics Strip */}
        <div className="mt-6 grid grid-cols-3 border-y border-paper-900/10 dark:border-white/[0.08] py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              Time
            </div>
            <div className="mt-1 font-mono text-lg text-paper-900 dark:text-ivory-100 tabular-nums">
              {state.elapsedMinutes} / {state.timeLimit}m
            </div>
          </div>
          <div className="border-x border-paper-900/10 dark:border-white/[0.08]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              Trips
            </div>
            <div className="mt-1 font-mono text-lg text-paper-900 dark:text-ivory-100 tabular-nums">
              {state.moves.length}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              Hints / Undo
            </div>
            <div className="mt-1 font-mono text-lg text-paper-900 dark:text-ivory-100 tabular-nums">
              {state.hintsUsed} / {state.undosUsed}
            </div>
          </div>
        </div>

        {/* Expandable Solution Insight (Win Only) */}
        {isWin && (
          <div className="mt-4 text-left">
            <button
              type="button"
              onClick={() => setShowMath((v) => !v)}
              className="flex w-full items-center justify-between py-2 text-xs font-medium text-gold-600 hover:text-gold-500 dark:text-gold-300/90 dark:hover:text-gold-200 transition"
            >
              <span>Why 17 minutes beats the 19-minute trap</span>
              {showMath ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showMath && (
              <div className="mt-2 rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4 text-xs text-paper-700 dark:text-ivory-300 space-y-3">
                <p className="leading-relaxed">
                  Pairing Garrick (5m) and Master Orin (10m) together absorbs Garrick’s walk inside
                  Orin’s crossing—saving 2 crucial minutes compared to escorting everyone with Lyra
                  (10 + 1 + 5 + 1 + 2 = 19m).
                </p>
                <ol className="space-y-1 font-mono text-[11px] text-paper-900 dark:text-ivory-200 border-t border-paper-900/[0.08] dark:border-white/[0.06] pt-2.5">
                  {state.moves.map((m) => (
                    <li key={m.step} className="flex justify-between">
                      <span>
                        {m.step}. {formatTravelerNames(m.travelers)}{' '}
                        {m.to === 'right' ? '→' : '←'}
                      </span>
                      <span className="text-gold-600 dark:text-gold-300">+{m.duration}m</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Clean Action Row */}
        <div className="mt-7 flex flex-col-reverse sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onBackToHub}
            className="w-full sm:w-auto rounded-full px-5 py-2.5 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
          >
            Archive Hub
          </button>

          {!isWin && state.moves.length > 0 && (
            <button
              type="button"
              onClick={onUndoLast}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-full border border-paper-900/15 px-5 py-2.5 text-xs font-medium text-paper-900 hover:bg-paper-900/[0.06] dark:border-white/15 dark:text-ivory-100 dark:hover:bg-white/[0.06] transition"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo Last Crossing
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-full bg-paper-900 px-6 py-2.5 text-xs font-semibold text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 transition shadow-[0_8px_24px_-8px_rgba(26,24,21,0.3)] dark:shadow-[0_8px_24px_-8px_rgba(232,168,73,0.5)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {isWin ? 'Play Again' : 'Try Again'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
