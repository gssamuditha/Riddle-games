import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, RotateCcw, Star } from 'lucide-react';
import {
  calculateOraclesStars,
  ORACLE_SLOTS,
  ROLE_INFO,
  type OraclesGameState,
} from './engine';

interface OraclesOutcomeModalProps {
  state: OraclesGameState;
  onRestart: () => void;
  onBackToHub: () => void;
}

export const OraclesOutcomeModal: React.FC<OraclesOutcomeModalProps> = ({
  state,
  onRestart,
  onBackToHub,
}) => {
  const [showProof, setShowProof] = useState(false);

  if (state.status === 'asking') return null;

  const isWin = state.status === 'won';
  const stars = calculateOraclesStars(state);

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
          {isWin ? 'Sanctum Conquered' : 'Verdict Rejected'}
        </div>

        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-paper-900 dark:text-ivory-100">
          {isWin ? 'The Three Oracles Unveiled' : 'The Veils Held Secret'}
        </h2>

        <p className="mt-2.5 text-sm leading-relaxed text-paper-700 dark:text-ivory-300">
          {isWin
            ? state.deducedWithCertainty
              ? 'With 100% logical certainty you pierced both falsehood and an unknown tongue. The Astral Key is yours.'
              : 'Your verdict matched the hidden Oracles! Try narrowing the possibilities down to 1 before sealing for 3-star certainty.'
            : 'At least one mantle did not match the truth beneath the marble. A fresh arrangement awaits in your next trial.'}
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

        {/* True Hidden World Reveal */}
        <div className="mt-6 rounded-2xl border border-paper-900/10 bg-paper-900/[0.025] dark:border-white/[0.08] dark:bg-white/[0.02] p-4">
          <div className="grid grid-cols-3 gap-2">
            {ORACLE_SLOTS.map((slot) => {
              const trueRole = state.world.roles[slot];
              const guessed = state.verdict[slot];
              const matched = guessed === trueRole;
              return (
                <div key={slot} className="text-center">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/70 dark:text-ivory-300/65">
                    Oracle {slot}
                  </div>
                  <div className="mt-1 font-display text-lg font-semibold text-paper-900 dark:text-ivory-100">
                    {ROLE_INFO[trueRole].label}
                  </div>
                  <div
                    className={`font-mono text-[10px] ${
                      matched
                        ? 'text-[#2f855a] dark:text-[#6abf94]'
                        : 'text-[#c44536] dark:text-[#e07a6b]'
                    }`}
                  >
                    {matched ? 'Matched' : `You chose ${guessed ? ROLE_INFO[guessed].label : '—'}`}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-paper-900/[0.08] dark:border-white/[0.06] font-mono text-[11px] text-paper-700 dark:text-ivory-300">
            Hidden Tongue: <strong className="text-paper-900 dark:text-ivory-100">DA</strong> ={' '}
            {state.world.daMeansYes ? 'YES' : 'NO'} ·{' '}
            <strong className="text-paper-900 dark:text-ivory-100">JA</strong> ={' '}
            {state.world.daMeansYes ? 'NO' : 'YES'}
          </div>
        </div>

        {/* Expandable Mathematical Proof */}
        <div className="mt-4 text-left">
          <button
            type="button"
            onClick={() => setShowProof((v) => !v)}
            className="flex w-full items-center justify-between py-2 text-xs font-medium text-gold-600 hover:text-gold-500 dark:text-gold-300/90 dark:hover:text-gold-200 transition"
          >
            <span>Why “If I asked you...” beats both lies &amp; DA/JA</span>
            {showProof ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showProof && (
            <div className="mt-2 rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4 text-xs text-paper-700 dark:text-ivory-300 space-y-2.5 leading-relaxed">
              <p>
                Asking a non-Random Oracle{' '}
                <strong className="text-paper-900 dark:text-ivory-100">
                  “If I asked you P, would you say DA?”
                </strong>{' '}
                forces Mendax (False) to lie twice—cancelling the lie—and flips DA/JA twice—cancelling
                the unknown vocabulary! Both Veritas and Mendax ALWAYS reply{' '}
                <strong className="font-mono text-gold-600 dark:text-gold-300">DA</strong> if P is
                true, and{' '}
                <strong className="font-mono text-gold-600 dark:text-gold-300">JA</strong> if P is
                false.
              </p>
              <ol className="space-y-1 font-mono text-[11px] text-paper-900 dark:text-ivory-200 border-t border-paper-900/[0.08] dark:border-white/[0.06] pt-2.5">
                <li>1. Ask A (embedded): “Is B Random?” → DA means C≠Random; JA means B≠Random.</li>
                <li>2. Ask that non-Random Oracle (embedded): “Are you Truth?” → identifies them!</li>
                <li>3. Ask them again (embedded): “Is A Random?” → identifies all three!</li>
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
            New Randomized Trial
          </button>
        </div>
      </motion.div>
    </div>
  );
};

