import React from 'react';
import { motion } from 'framer-motion';
import { Lock, X } from 'lucide-react';
import { VAULT_HINTS } from './story';

interface VaultHintPanelProps {
  unlockedTier: 0 | 1 | 2 | 3;
  onUnlockTier: (tier: 1 | 2 | 3) => void;
  onClose: () => void;
}

export const VaultHintPanel: React.FC<VaultHintPanelProps> = ({
  unlockedTier,
  onUnlockTier,
  onClose,
}) => {
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
            Reveal one insight at a time. Winning with disciplined strategy and 0 hints earns 3 stars.
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
              I · The 50/50 Illusion
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
              {VAULT_HINTS.tier1.body}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-paper-700/70 dark:text-ivory-300/60">
              Why the Archivist’s choice of which door to open isn’t neutral.
            </p>
          )}
        </div>

        {/* Tier 2 */}
        <div className="rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold-600 dark:text-gold-300/85">
              II · Concentrating the Odds
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
              {VAULT_HINTS.tier2.body}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-paper-700/70 dark:text-ivory-300/60">
              Follow where the initial 1/3 vs 2/3 split goes after the reveal.
            </p>
          )}
        </div>

        {/* Tier 3 */}
        <div className="rounded-2xl border border-paper-900/[0.08] bg-paper-900/[0.025] dark:border-white/[0.07] dark:bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-gold-600 dark:text-gold-300/85">
              III · Optimal Strategy
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
            <p className="mt-2.5 text-sm leading-relaxed text-paper-800 dark:text-ivory-200/90">
              {VAULT_HINTS.tier3.body}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-paper-700/70 dark:text-ivory-300/60">
              The exact winning rule and mathematical odds.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

