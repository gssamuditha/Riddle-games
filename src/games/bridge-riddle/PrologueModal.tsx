import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { TRAVELERS } from './engine';
import { BRIDGE_RULES, PROLOGUE_PARAGRAPHS } from './story';
import { TravelerFigure } from './TravelerAvatar';

interface PrologueModalProps {
  onStart: () => void;
  isReplayInfo?: boolean;
}

export const PrologueModal: React.FC<PrologueModalProps> = ({
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
          Chapter I · The Bridge Riddle
        </div>
        <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-semibold text-paper-900 dark:text-ivory-100">
          The Lantern Bridge
        </h2>

        {/* Story */}
        <div className="mt-5 space-y-3 text-sm leading-relaxed text-paper-800 dark:text-ivory-200/85">
          {PROLOGUE_PARAGRAPHS.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {/* Crew Lineup — Minimalist Silhouettes */}
        <div className="mt-7 grid grid-cols-4 gap-2 border-y border-paper-900/10 dark:border-white/[0.08] py-5">
          {TRAVELERS.map((t) => (
            <div key={t.id} className="flex flex-col items-center text-center">
              <TravelerFigure id={t.id} height={58} lit />
              <span className="mt-2 text-xs font-medium text-paper-900 dark:text-ivory-100">
                {t.name.split(' ').pop()}
              </span>
              <span className="font-mono text-[11px] text-gold-600 dark:text-gold-300 tabular-nums">
                {t.time} min
              </span>
            </div>
          ))}
        </div>

        {/* Concise Rules */}
        <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-paper-700 dark:text-ivory-300">
          {BRIDGE_RULES.map((rule, i) => (
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
            {isReplayInfo ? 'Return to the Cliff' : 'Begin Crossing'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
