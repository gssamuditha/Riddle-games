import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, RotateCcw, Star, Undo2 } from 'lucide-react';
import {
  calculateVirusStars,
  TOTAL_VIRUS_ROOMS,
  type VirusGameState,
} from './engine';

interface VirusOutcomeModalProps {
  state: VirusGameState;
  onRestart: () => void;
  onUndoLast: () => void;
  onBackToHub: () => void;
}

export const VirusOutcomeModal: React.FC<VirusOutcomeModalProps> = ({
  state,
  onRestart,
  onUndoLast,
  onBackToHub,
}) => {
  const [showInsight, setShowInsight] = useState(false);

  if (state.status !== 'won' && state.status !== 'exit_early') return null;

  const isWin = state.status === 'won';
  const stars = calculateVirusStars(state);
  const remaining = TOTAL_VIRUS_ROOMS - state.clearedVirusCount;

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
          {isWin ? 'Facility Sterilized' : 'Reached Exit Too Soon'}
        </div>

        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-paper-900 dark:text-ivory-100">
          {isWin ? 'Quarantine Complete' : 'Rooms Still Contaminated'}
        </h2>

        <p className="mt-2.5 text-sm leading-relaxed text-paper-700 dark:text-ivory-300">
          {isWin
            ? `Every contaminated room is sealed and you stepped cleanly out the SE Exit in ${state.moves.length} moves.`
            : `You stepped into the SE Exit with ${remaining} contaminated room${
                remaining === 1 ? '' : 's'
              } still uncleared. Undo and save the Exit for your final move!`}
        </p>

        {/* Star Reveal */}
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

        {/* Metrics Strip */}
        <div className="mt-6 grid grid-cols-3 border-y border-paper-900/10 dark:border-white/[0.08] py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              Cleared
            </div>
            <div className="mt-1 font-mono text-lg text-paper-900 dark:text-ivory-100 tabular-nums">
              {state.clearedVirusCount} / {TOTAL_VIRUS_ROOMS}
            </div>
          </div>
          <div className="border-x border-paper-900/10 dark:border-white/[0.08]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              Moves
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

        {/* Expandable Parity Math Explanation */}
        {isWin && (
          <div className="mt-4 text-left">
            <button
              type="button"
              onClick={() => setShowInsight((v) => !v)}
              className="flex w-full items-center justify-between py-2 text-xs font-medium text-gold-600 hover:text-gold-500 dark:text-gold-300/90 dark:hover:text-gold-200 transition"
            >
              <span>Why revisiting the clean Entrance breaks chessboard parity</span>
              {showInsight ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showInsight && (
              <div className="mt-2 rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4 text-xs text-paper-700 dark:text-ivory-300 space-y-2.5 leading-relaxed">
                <p>
                  Coloring a 4×4 grid like a chessboard puts both the NW Entrance and SE Exit on the
                  exact same color. A standard 15-step path visiting every room once MUST alternate
                  colors and end on the opposite color—so it can never reach the Exit!
                </p>
                <p>
                  Because the NW Entrance starts clean (unsealed), stepping back into it once turns
                  the tour into <strong>16 moves</strong>—an even number of steps—allowing you to
                  start and finish on the same color square!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Row */}
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
              Undo Last Move
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-full bg-paper-900 px-6 py-2.5 text-xs font-semibold text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 transition shadow-[0_8px_24px_-8px_rgba(26,24,21,0.3)] dark:shadow-[0_8px_24px_-8px_rgba(232,168,73,0.5)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {isWin ? 'Play Again' : 'Restart Lab'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

