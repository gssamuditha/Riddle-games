import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { PILGRIM_PROLOGUE, PILGRIM_RULES } from './story';

interface PilgrimPrologueModalProps {
  onStart: () => void;
  isReplayInfo?: boolean;
}

export const PilgrimPrologueModal: React.FC<PilgrimPrologueModalProps> = ({
  onStart,
  isReplayInfo = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/75 p-4 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="surface-glass relative my-auto w-full max-w-xl rounded-3xl p-6 sm:p-9"
      >
        {isReplayInfo && (
          <button
            type="button"
            onClick={onStart}
            className="absolute right-5 top-5 rounded-full p-2 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
            aria-label="Close briefing"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="text-[11px] font-medium uppercase tracking-[0.26em] text-gold-600 dark:text-gold-300/80">
          Chapter V · The City of Duonia
        </div>
        <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-semibold text-paper-900 dark:text-ivory-100">
          The Penniless Pilgrim
        </h2>

        <div className="mt-5 space-y-3 text-sm leading-relaxed text-paper-800 dark:text-ivory-200/85">
          {PILGRIM_PROLOGUE.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {/* 4 Compass Operations At-a-Glance */}
        <div className="mt-6 grid grid-cols-4 gap-2 border-y border-paper-900/10 dark:border-white/[0.08] py-4 text-center font-mono">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-paper-700/75 dark:text-ivory-300/65">
              East →
            </div>
            <div className="mt-0.5 text-base font-semibold text-gold-600 dark:text-gold-300">+2</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-paper-700/75 dark:text-ivory-300/65">
              West ←
            </div>
            <div className="mt-0.5 text-base font-semibold text-sky-600 dark:text-sky-300">−2</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-paper-700/75 dark:text-ivory-300/65">
              South ↓
            </div>
            <div className="mt-0.5 text-base font-semibold text-paper-900 dark:text-ivory-100">×2</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-paper-700/75 dark:text-ivory-300/65">
              North ↑
            </div>
            <div className="mt-0.5 text-base font-semibold text-paper-900 dark:text-ivory-100">÷2</div>
          </div>
        </div>

        <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-paper-700 dark:text-ivory-300">
          {PILGRIM_RULES.map((rule, i) => (
            <li key={i} className="leading-relaxed">
              <span className="text-paper-900 dark:text-ivory-100 font-medium">{rule.title}.</span>{' '}
              {rule.detail}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex justify-end">
          <button
            type="button"
            onClick={onStart}
            className="w-full sm:w-auto rounded-full bg-paper-900 px-7 py-3 text-sm font-semibold text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 transition shadow-[0_8px_24px_-8px_rgba(26,24,21,0.35)] dark:shadow-[0_8px_28px_-8px_rgba(232,168,73,0.5)]"
          >
            {isReplayInfo ? 'Return to City Map' : 'Begin the Walk'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

