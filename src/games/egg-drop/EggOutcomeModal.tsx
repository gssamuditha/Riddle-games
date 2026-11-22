import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, RotateCcw, Star } from 'lucide-react';
import { calculateEggStars, MAX_DROPS, type EggDropState } from './engine';

interface EggOutcomeModalProps {
  state: EggDropState;
  onRestart: () => void;
  onBackToHub: () => void;
}

export const EggOutcomeModal: React.FC<EggOutcomeModalProps> = ({
  state,
  onRestart,
  onBackToHub,
}) => {
  const [showMath, setShowMath] = useState(false);

  if (state.status === 'playing') return null;

  const isWin = state.status === 'won';
  const stars = calculateEggStars(state);

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
          {isWin
            ? 'Threshold Proven'
            : state.status === 'lost_no_eggs'
            ? 'Both Eggs Shattered'
            : 'Drop Limit Reached'}
        </div>

        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-paper-900 dark:text-ivory-100">
          {isWin ? `Floor ${state.lowSafe} Pinpointed` : 'Threshold Still Uncertain'}
        </h2>

        <p className="mt-2.5 text-sm leading-relaxed text-paper-700 dark:text-ivory-300">
          {isWin
            ? `You proved Floor ${state.lowSafe} is the exact highest safe floor in ${state.dropsUsed} of ${MAX_DROPS} allowed drops.`
            : state.status === 'lost_no_eggs'
            ? `Your final crystal egg shattered while floors ${state.lowSafe + 1}–${
                state.highBreak - 1
              } were still untested.`
            : `All ${MAX_DROPS} drops ran out with floors ${state.lowSafe + 1}–${
                state.highBreak - 1
              } still untested.`}
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
              Drops Used
            </div>
            <div className="mt-1 font-mono text-lg text-paper-900 dark:text-ivory-100 tabular-nums">
              {state.dropsUsed} / {MAX_DROPS}
            </div>
          </div>
          <div className="border-x border-paper-900/10 dark:border-white/[0.08]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              Eggs Left
            </div>
            <div className="mt-1 font-mono text-lg text-paper-900 dark:text-ivory-100 tabular-nums">
              {state.eggsLeft} / 2
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              True Floor
            </div>
            <div className="mt-1 font-mono text-lg text-gold-600 dark:text-gold-300 tabular-nums">
              {isWin ? state.lowSafe : state.secretFloor}
            </div>
          </div>
        </div>

        {/* Expandable Triangular Number Proof */}
        <div className="mt-4 text-left">
          <button
            type="button"
            onClick={() => setShowMath((v) => !v)}
            className="flex w-full items-center justify-between py-2 text-xs font-medium text-gold-600 hover:text-gold-500 dark:text-gold-300/90 dark:hover:text-gold-200 transition"
          >
            <span>Why 14 drops is the exact mathematical minimum</span>
            {showMath ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showMath && (
            <div className="mt-2 rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4 text-xs text-paper-700 dark:text-ivory-300 space-y-2.5 leading-relaxed">
              <p>
                To keep total drops capped at <em>k</em> no matter when Egg #1 breaks, shrink each
                jump by 1 floor after every safe drop: <em>k</em> + (<em>k</em>−1) + … + 1 ={' '}
                <em>k</em>(<em>k</em>+1)/2 ≥ 100.
              </p>
              <p className="font-mono text-[11px] text-paper-900 dark:text-ivory-200 border-t border-paper-900/[0.08] dark:border-white/[0.06] pt-2.5">
                k = 13 → 91 floors (too short) · k = 14 → 105 floors!
                <br />
                Optimal Egg #1 floors: 14 → 27 → 39 → 50 → 60 → 69 → 77 → 84 → 90 → 95 → 99 → 100
              </p>
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
            {isWin ? 'New Tower Floor' : 'Try Again'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

