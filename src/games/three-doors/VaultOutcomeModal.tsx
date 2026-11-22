import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, FlaskConical, RotateCcw, Star } from 'lucide-react';
import { soundEngine } from '../../core/sound';
import {
  calculateVaultStars,
  getStrategyStats,
  KEYS_TO_WIN,
  simulateMontyHallBatch,
  type SimulationBatchResult,
  type VaultTrialState,
} from './engine';

interface VaultOutcomeModalProps {
  state: VaultTrialState;
  onRestart: () => void;
  onBackToHub: () => void;
}

export const VaultOutcomeModal: React.FC<VaultOutcomeModalProps> = ({
  state,
  onRestart,
  onBackToHub,
}) => {
  const [showProof, setShowProof] = useState(true);
  const [simResult, setSimResult] = useState<SimulationBatchResult | null>(null);

  if (state.status === 'playing') return null;

  const isWin = state.status === 'won';
  const stars = calculateVaultStars(state);
  const stats = getStrategyStats(state.history);

  const handleRunSim = () => {
    soundEngine.playSelect();
    setSimResult(simulateMontyHallBatch(100));
  };

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
          {isWin ? 'Vault Hall Conquered' : 'Vault Hall Sealed'}
        </div>

        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-paper-900 dark:text-ivory-100">
          {isWin ? 'Six Astral Keys Claimed' : 'Outsmarted by Intuition'}
        </h2>

        <p className="mt-2.5 text-sm leading-relaxed text-paper-700 dark:text-ivory-300">
          {isWin
            ? `You unlocked ${KEYS_TO_WIN} Astral Keys across ${state.history.length} rounds.`
            : `You found ${state.keysCollected} of ${KEYS_TO_WIN} required keys before hitting ${state.lossesCount} hollow traps.`}
        </p>

        {/* Star Reveal */}
        {isWin && (
          <div className="mt-4 flex items-center justify-center gap-2.5">
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

        {/* Run Strategy Breakdown (Stay vs Switch) */}
        <div className="mt-5 grid grid-cols-2 border-y border-paper-900/10 dark:border-white/[0.08] py-4">
          <div className="pr-3 border-r border-paper-900/10 dark:border-white/[0.08]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-paper-700/75 dark:text-ivory-300/70">
              When You Stayed
            </div>
            <div className="mt-1 font-mono text-lg text-paper-900 dark:text-ivory-100 tabular-nums">
              {stats.stayTotal > 0 ? `${stats.stayRate}%` : '—'}
            </div>
            <div className="text-[11px] text-paper-700/75 dark:text-ivory-300/60">
              {stats.stayWins} / {stats.stayTotal} wins
            </div>
          </div>
          <div className="pl-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold-600 dark:text-gold-300">
              When You Switched
            </div>
            <div className="mt-1 font-mono text-lg text-[#2f855a] dark:text-[#6abf94] tabular-nums">
              {stats.switchTotal > 0 ? `${stats.switchRate}%` : '—'}
            </div>
            <div className="text-[11px] text-paper-700/75 dark:text-ivory-300/60">
              {stats.switchWins} / {stats.switchTotal} wins
            </div>
          </div>
        </div>

        {/* Expandable Paradox Proof & Live 100-Trial Simulator */}
        <div className="mt-4 text-left">
          <button
            type="button"
            onClick={() => setShowProof((v) => !v)}
            className="flex w-full items-center justify-between py-2 text-xs font-medium text-gold-600 hover:text-gold-500 dark:text-gold-300/90 dark:hover:text-gold-200 transition"
          >
            <span>Why switching doubles your odds (2/3 vs 1/3)</span>
            {showProof ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showProof && (
            <div className="mt-2 rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4 text-xs text-paper-700 dark:text-ivory-300 space-y-3 leading-relaxed">
              <p>
                Your initial pick catches the Astral Key only <strong className="text-paper-900 dark:text-ivory-100">1/3</strong> of the time. The other <strong className="text-paper-900 dark:text-ivory-100">2/3</strong> of the time, the Key lies behind the two unpicked doors—and because the Archivist purposefully opens the empty one, switching wins every time your first guess was wrong!
              </p>

              {/* Interactive 100-Trial Proof Simulator */}
              <div className="border-t border-paper-900/[0.08] dark:border-white/[0.06] pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-paper-700/80 dark:text-ivory-300/70">
                    Live Empirical Proof
                  </span>
                  <button
                    type="button"
                    onClick={handleRunSim}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold-600/35 px-3 py-1 text-[11px] font-medium text-gold-600 hover:bg-gold-500/10 dark:border-gold-400/35 dark:text-gold-200 dark:hover:bg-gold-400/10 transition"
                  >
                    <FlaskConical className="h-3 w-3" />
                    {simResult ? 'Run Another 100 Trials' : 'Simulate 100 Trials'}
                  </button>
                </div>

                {simResult && (
                  <div className="mt-3 space-y-2 font-mono text-[11px]">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Always Stay</span>
                        <span>{simResult.stayWins}/100 ({simResult.stayPct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-paper-900/10 dark:bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${simResult.stayPct}%` }}
                          transition={{ duration: 0.55 }}
                          className="h-full bg-paper-700/60 dark:bg-ivory-300/60 rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[#2f855a] dark:text-[#6abf94]">
                        <span>Always Switch</span>
                        <span>{simResult.switchWins}/100 ({simResult.switchPct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-paper-900/10 dark:bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${simResult.switchPct}%` }}
                          transition={{ duration: 0.55 }}
                          className="h-full bg-[#2f855a] dark:bg-[#6abf94] rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
            {isWin ? 'Play Again' : 'Try Again'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

