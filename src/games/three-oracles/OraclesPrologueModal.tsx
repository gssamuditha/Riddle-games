import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ORACLE_ROLES, ROLE_INFO } from './engine';
import { ORACLES_PROLOGUE, ORACLES_RULES } from './story';
import { OracleStatue } from './OracleFigures';

interface OraclesPrologueModalProps {
  onStart: () => void;
  isReplayInfo?: boolean;
}

export const OraclesPrologueModal: React.FC<OraclesPrologueModalProps> = ({
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
          Chapter VII · The Three Gods Riddle
        </div>
        <h2 className="mt-1.5 font-display text-3xl sm:text-4xl font-semibold text-paper-900 dark:text-ivory-100">
          The Three Oracles
        </h2>

        <div className="mt-5 space-y-3 text-sm leading-relaxed text-paper-800 dark:text-ivory-200/85">
          {ORACLES_PROLOGUE.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {/* Three Mantles Preview */}
        <div className="mt-7 grid grid-cols-3 gap-3 border-y border-paper-900/10 dark:border-white/[0.08] py-5">
          {ORACLE_ROLES.map((role) => {
            const info = ROLE_INFO[role];
            return (
              <div key={role} className="flex flex-col items-center text-center">
                <OracleStatue revealedRole={role} height={64} />
                <span className="mt-2 text-xs font-semibold text-paper-900 dark:text-ivory-100">
                  {info.title} ({info.label})
                </span>
                <span className="mt-0.5 text-[11px] text-paper-700 dark:text-ivory-300/75 leading-snug">
                  {info.summary}
                </span>
              </div>
            );
          })}
        </div>

        <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-paper-700 dark:text-ivory-300">
          {ORACLES_RULES.map((rule, i) => (
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
            {isReplayInfo ? 'Return to Sanctum' : 'Enter the Sanctum'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

