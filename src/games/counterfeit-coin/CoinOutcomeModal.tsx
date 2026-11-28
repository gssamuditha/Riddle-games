import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, RotateCcw, Star } from 'lucide-react';
import { calculateCoinStars, type CoinGameState } from './engine';

interface CoinOutcomeModalProps {
  state: CoinGameState;
  onRestart: () => void;
  onBackToHub: () => void;
}

export const CoinOutcomeModal: React.FC<CoinOutcomeModalProps> = ({
  state,
  onRestart,
  onBackToHub,
}) => {
  const [showProof, setShowProof] = useState(false);

  if (state.status === 'playing') return null;

  const isWin = state.status === 'won';
  const stars = calculateCoinStars(state);

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
          {isWin ? 'Counterfeit Exposed' : 'Verdict Incorrect'}
        </div>

        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-paper-900 dark:text-ivory-100">
          {isWin
            ? `Coin #${state.world.fakeCoin} Was ${
                state.world.weight === 'heavier' ? 'Heavier' : 'Lighter'
              }`
            : 'The Fake Slipped Past'}
        </h2>

        <p className="mt-2.5 text-sm leading-relaxed text-paper-700 dark:text-ivory-300">
          {isWin
            ? state.deducedWithCertainty
              ? `Deduced with 100% logical certainty in ${state.history.length} weighings!`
              : `Your verdict matched Coin #${state.world.fakeCoin} (${state.world.weight})! Narrow the possibilities to 1 next time for 3-star certainty.`
            : `The true counterfeit was Coin #${state.world.fakeCoin} (${state.world.weight}), whereas you accused Coin #${state.verdict.coin} (${state.verdict.weight}).`}
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
              Weighings
            </div>
            <div className="mt-1 font-mono text-lg text-paper-900 dark:text-ivory-100 tabular-nums">
              {state.history.length} / 3
            </div>
          </div>
          <div className="border-x border-paper-900/10 dark:border-white/[0.08]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              True Fake
            </div>
            <div className="mt-1 font-mono text-lg text-gold-600 dark:text-gold-300 tabular-nums">
              #{state.world.fakeCoin} ({state.world.weight === 'heavier' ? 'H' : 'L'})
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              Certainty
            </div>
            <div className="mt-1 font-mono text-lg text-paper-900 dark:text-ivory-100">
              {state.deducedWithCertainty ? '100%' : 'Partial'}
            </div>
          </div>
        </div>

        {/* Expandable Information-Theory Proof */}
        <div className="mt-4 text-left">
          <button
            type="button"
            onClick={() => setShowProof((v) => !v)}
            className="flex w-full items-center justify-between py-2 text-xs font-medium text-gold-600 hover:text-gold-500 dark:text-gold-300/90 dark:hover:text-gold-200 transition"
          >
            <span>Why 3 weighings can always distinguish all 24 cases</span>
            {showProof ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showProof && (
            <div className="mt-2 rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4 text-xs text-paper-700 dark:text-ivory-300 space-y-2 leading-relaxed">
              <p>
                There are 12 × 2 = 24 possible counterfeit scenarios, and 3 balance weighings yield
                3³ = 27 possible outcome sequences. To fit 24 cases into 27 leaves, each weighing
                must divide remaining possibilities into 3 balanced groups (≤ 9 after W1, ≤ 3 after
                W2, 1 after W3)!
              </p>
              <p className="font-mono text-[11px] text-paper-900 dark:text-ivory-200 border-t border-paper-900/[0.08] dark:border-white/[0.06] pt-2">
                W1: [1,2,3,4] vs [5,6,7,8] → 8 / 8 / 8 split
                <br />
                W2 (if tilt L): [1,2,5] vs [3,6,9] → 3 / 3 / 2 split
                <br />
                W3: 1 vs 1 among remaining suspects → 1 exact answer!
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
            New Randomized Trial
          </button>
        </div>
      </motion.div>
    </div>
  );
};

