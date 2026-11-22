import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, RotateCcw, Star } from 'lucide-react';
import {
  calculateJugsStars,
  formatJugActionLabel,
  JUGS_PAR_MOVES,
  type JugsGameState,
} from './engine';

interface JugsOutcomeModalProps {
  state: JugsGameState;
  onRestart: () => void;
  onBackToHub: () => void;
}

export const JugsOutcomeModal: React.FC<JugsOutcomeModalProps> = ({
  state,
  onRestart,
  onBackToHub,
}) => {
  const [showMath, setShowMath] = useState(false);

  if (state.status !== 'won') return null;

  const stars = calculateJugsStars(state);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/75 p-4 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="surface-glass my-auto w-full max-w-lg rounded-3xl p-7 sm:p-9 text-center"
      >
        <div className="text-[11px] font-medium uppercase tracking-[0.26em] text-[#2f855a] dark:text-[#6abf94]">
          Vault Unlocked
        </div>

        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-paper-900 dark:text-ivory-100">
          Four Exact Drams Measured
        </h2>

        <p className="mt-2.5 text-sm leading-relaxed text-paper-700 dark:text-ivory-300">
          {state.moves.length === JUGS_PAR_MOVES
            ? 'Flawless alchemy—you unlocked the Vault of Stillness in the mathematical minimum of 6 steps.'
            : `The counterweight turns smoothly at 4L after ${state.moves.length} steps. Can you distill it in the optimal 6-step sequence?`}
        </p>

        {/* Star Reveal */}
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

        {/* Metrics Strip */}
        <div className="mt-6 grid grid-cols-3 border-y border-paper-900/10 dark:border-white/[0.08] py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              Steps
            </div>
            <div className="mt-1 font-mono text-lg text-paper-900 dark:text-ivory-100 tabular-nums">
              {state.moves.length}
            </div>
          </div>
          <div className="border-x border-paper-900/10 dark:border-white/[0.08]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              Optimal Par
            </div>
            <div className="mt-1 font-mono text-lg text-paper-900 dark:text-ivory-100 tabular-nums">
              {JUGS_PAR_MOVES}
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

        {/* Expandable Number Theory Breakdown */}
        <div className="mt-4 text-left">
          <button
            type="button"
            onClick={() => setShowMath((v) => !v)}
            className="flex w-full items-center justify-between py-2 text-xs font-medium text-gold-600 hover:text-gold-500 dark:text-gold-300/90 dark:hover:text-gold-200 transition"
          >
            <span>The math behind 3L &amp; 5L (Bézout’s Identity)</span>
            {showMath ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showMath && (
            <div className="mt-2 rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4 text-xs text-paper-700 dark:text-ivory-300 space-y-3">
              <p className="leading-relaxed">
                Because 3 and 5 are coprime (gcd(3, 5) = 1), any whole volume from 1L to 5L can be
                measured via repeated subtraction: filling 5L twice and subtracting 3L twice yields
                5 × 2 − 3 × 2 = 4L in just 6 moves!
              </p>
              <ol className="space-y-1 font-mono text-[11px] text-paper-900 dark:text-ivory-200 border-t border-paper-900/[0.08] dark:border-white/[0.06] pt-2.5">
                {state.moves.map((m) => (
                  <li key={m.step} className="flex justify-between">
                    <span>
                      {m.step}. {formatJugActionLabel(m.action)}
                    </span>
                    <span className="text-gold-600 dark:text-gold-300">
                      ({m.resultSmall}L, {m.resultLarge}L)
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="mt-7 flex flex-col-reverse sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onBackToHub}
            className="w-full sm:w-auto rounded-full px-5 py-2.5 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
          >
            Archive Hub
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-full bg-paper-900 px-6 py-2.5 text-xs font-semibold text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 transition shadow-[0_8px_24px_-8px_rgba(26,24,21,0.3)] dark:shadow-[0_8px_24px_-8px_rgba(232,168,73,0.5)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Play Again
          </button>
        </div>
      </motion.div>
    </div>
  );
};

