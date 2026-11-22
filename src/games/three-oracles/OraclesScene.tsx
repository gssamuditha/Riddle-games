import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ThemeMode } from '../../core/types';
import {
  ORACLE_SLOTS,
  ROLE_INFO,
  type OracleSlot,
  type OraclesGameState,
  type OracleWord,
} from './engine';
import { OracleStatue } from './OracleFigures';

export interface ActiveSpeechAnimation {
  target: OracleSlot;
  word: OracleWord;
}

interface OraclesSceneProps {
  state: OraclesGameState;
  selectedTarget: OracleSlot;
  speaking: ActiveSpeechAnimation | null;
  theme: ThemeMode;
  onSelectOracle: (slot: OracleSlot) => void;
}

const STARS = [
  { x: 95, y: 54, r: 1.1, d: '0.2s' },
  { x: 184, y: 38, r: 0.9, d: '1.5s' },
  { x: 312, y: 66, r: 1.2, d: '0.8s' },
  { x: 432, y: 40, r: 0.85, d: '2.3s' },
  { x: 568, y: 40, r: 0.85, d: '1.9s' },
  { x: 688, y: 66, r: 1.2, d: '0.4s' },
  { x: 816, y: 38, r: 0.9, d: '2.6s' },
  { x: 905, y: 54, r: 1.1, d: '1.1s' },
];

const PLINTH_POS: Record<OracleSlot, number> = {
  A: 24,
  B: 50,
  C: 76,
};

export const OraclesScene: React.FC<OraclesSceneProps> = ({
  state,
  selectedTarget,
  speaking,
  theme,
  onSelectOracle,
}) => {
  const isLight = theme === 'light';
  const isRevealed = state.status !== 'asking';
  const isWon = state.status === 'won';

  // Harmonized Twilight Alabaster-Indigo (Light Mode) vs. Deep Astral Sanctum (Dark Mode)
  const palette = isLight
    ? {
        bgTop: '#242c40',
        bgMid: '#333f5a',
        bgBot: '#1d2436',
        arch: '#6b7c9e',
        floorTop: '#2e374c',
        floorBot: '#1a202e',
        plinthFace: '#374259',
        plinthTop: '#495673',
        gold: '#d6a45c',
      }
    : {
        bgTop: '#070911',
        bgMid: '#101526',
        bgBot: '#090b13',
        arch: '#2a3552',
        floorTop: '#161c2b',
        floorBot: '#090c14',
        plinthFace: '#1c2335',
        plinthTop: '#29334d',
        gold: '#c99754',
      };

  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border border-paper-900/12 dark:border-white/[0.07] bg-[#242c40] dark:bg-ink-900 shadow-[0_24px_65px_-26px_rgba(26,24,21,0.34)] dark:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95)] select-none transition-shadow duration-300">
      <div className="relative w-full aspect-[1000/440] min-h-[260px]">
        {/* Architectural Astral Sanctum SVG */}
        <svg
          viewBox="0 0 1000 440"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sanctumSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.bgTop} />
              <stop offset="68%" stopColor={palette.bgMid} />
              <stop offset="100%" stopColor={palette.bgBot} />
            </linearGradient>
            <radialGradient id="sanctumAura" cx="50%" cy="44%" r="48%">
              <stop
                offset="0%"
                stopColor={isWon ? '#6abf94' : '#b794f4'}
                stopOpacity={isWon ? '0.24' : '0.13'}
              />
              <stop offset="100%" stopColor={palette.bgTop} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sanctumFloor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.floorTop} />
              <stop offset="100%" stopColor={palette.floorBot} />
            </linearGradient>
            <linearGradient id="speechBeam" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#efc06e" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#efc06e" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="1000" height="440" fill="url(#sanctumSky)" />
          <rect width="1000" height="440" fill="url(#sanctumAura)" />

          {/* Stars */}
          {STARS.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="#f3eee4"
              className="animate-star-pulse"
              style={{ animationDelay: s.d }}
            />
          ))}

          {/* Celestial Rotating Astrolabe Rings Behind Center Sanctum */}
          <motion.g
            style={{ originX: '500px', originY: '205px' }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 90, ease: 'linear' }}
          >
            <circle
              cx="500"
              cy="205"
              r="158"
              stroke={palette.gold}
              strokeOpacity="0.16"
              strokeWidth="1.2"
              strokeDasharray="6 8"
              fill="none"
            />
            <circle
              cx="500"
              cy="205"
              r="120"
              stroke={palette.arch}
              strokeOpacity="0.35"
              strokeWidth="1"
              fill="none"
            />
          </motion.g>

          {/* Three Tall Architectural Sanctum Arches */}
          {[240, 500, 760].map((cx) => (
            <path
              key={cx}
              d={`M${cx - 88} 348 V176 C${cx - 88} 120 ${cx - 42} 86 ${cx} 86 C${cx + 42} 86 ${cx + 88} 120 ${cx + 88} 176 V348`}
              fill="none"
              stroke={palette.arch}
              strokeOpacity="0.32"
              strokeWidth="1.3"
            />
          ))}

          {/* Starlight Speech Column When Active Oracle Speaks */}
          <AnimatePresence>
            {speaking && (
              <motion.rect
                key={`beam-${speaking.target}`}
                x={PLINTH_POS[speaking.target] * 10 - 52}
                y="60"
                width="104"
                height="270"
                fill="url(#speechBeam)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0.4] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
              />
            )}
          </AnimatePresence>

          {/* Sanctum Marble Floor (y = 348) */}
          <rect x="0" y="348" width="1000" height="92" fill="url(#sanctumFloor)" />
          <line x1="0" y1="348.5" x2="1000" y2="348.5" stroke={palette.gold} strokeOpacity="0.25" />

          {/* Three Fluted Marble Plinths (Top walk surface at y = 322 -> bottom 26.8%) */}
          {ORACLE_SLOTS.map((slot) => {
            const cx = PLINTH_POS[slot] * 10;
            const isSel = !isRevealed && selectedTarget === slot;
            return (
              <g key={slot}>
                {/* Plinth Body */}
                <rect
                  x={cx - 64}
                  y="326"
                  width="128"
                  height="64"
                  rx="2"
                  fill={palette.plinthFace}
                  stroke="#ffffff"
                  strokeOpacity="0.08"
                  strokeWidth="1"
                />
                {/* Plinth Cap Slab */}
                <rect
                  x={cx - 72}
                  y="318"
                  width="144"
                  height="10"
                  rx="2"
                  fill={palette.plinthTop}
                  stroke={isSel ? '#efc06e' : '#ffffff'}
                  strokeOpacity={isSel ? 0.85 : 0.14}
                  strokeWidth={isSel ? 1.5 : 1}
                />
                {/* Subtle Fluting Lines */}
                <line x1={cx - 38} y1="332" x2={cx - 38} y2="384" stroke="#ffffff" strokeOpacity="0.05" />
                <line x1={cx + 38} y1="332" x2={cx + 38} y2="384" stroke="#ffffff" strokeOpacity="0.05" />
              </g>
            );
          })}
        </svg>

        {/* Quiet Top Etched Header Labels */}
        <div className="pointer-events-none absolute inset-x-5 sm:inset-x-8 top-5 flex items-center justify-between text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.26em] text-ivory-100/55">
          <span>Astral Sanctum</span>
          <span>
            {isRevealed
              ? `DA = ${state.world.daMeansYes ? 'YES' : 'NO'} · JA = ${
                  state.world.daMeansYes ? 'NO' : 'YES'
                }`
              : 'DA / JA · Unknown Tongue'}
          </span>
        </div>

        {/* Three Interactive Marble Oracles Standing Flush on Plinths */}
        {ORACLE_SLOTS.map((slot) => {
          const isSelected = !isRevealed && selectedTarget === slot;
          const isSpeakingNow = speaking?.target === slot;
          const revealedRole = isRevealed ? state.world.roles[slot] : null;
          const assignedDraft = state.verdict[slot];

          // Recent answers spoken by this Oracle
          const answersForSlot = state.history.filter((h) => h.question.target === slot);
          const latestForSlot =
            answersForSlot.length > 0 ? answersForSlot[answersForSlot.length - 1] : null;

          return (
            <div
              key={slot}
              style={{ left: `${PLINTH_POS[slot]}%`, bottom: '27.7%' }}
              className="absolute -translate-x-1/2 z-20 flex flex-col items-center"
            >
              {/* Floating Spoken Ancient Rune (DA / JA) Above Oracle Crown */}
              <div className="mb-1.5 min-h-[28px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isSpeakingNow ? (
                    <motion.div
                      key={`speaking-${slot}-${speaking.word}`}
                      initial={{ opacity: 0, y: 10, scale: 0.78 }}
                      animate={{ opacity: 1, y: 0, scale: 1.06 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                      className="rounded-full border border-gold-300/70 bg-ink-950/85 px-3.5 py-1 font-mono text-xs sm:text-sm font-semibold tracking-[0.2em] text-gold-200 shadow-[0_0_24px_rgba(232,168,73,0.45)]"
                    >
                      “{speaking.word}”
                    </motion.div>
                  ) : latestForSlot && !isRevealed ? (
                    <motion.div
                      key={`last-${slot}-${latestForSlot.index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-full border border-white/15 bg-ink-950/65 px-2.5 py-0.5 font-mono text-[10px] sm:text-[11px] tracking-wider text-ivory-200/90"
                    >
                      Q{latestForSlot.index}: <span className="text-gold-300 font-semibold">{latestForSlot.answer}</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Clickable Statue */}
              <motion.button
                type="button"
                onClick={() => !speaking && !isRevealed && onSelectOracle(slot)}
                disabled={Boolean(speaking) || isRevealed}
                whileHover={!speaking && !isRevealed ? { y: -4, scale: 1.03 } : undefined}
                whileTap={!speaking && !isRevealed ? { scale: 0.98 } : undefined}
                className={`relative flex flex-col items-center focus:outline-none ${
                  !speaking && !isRevealed ? 'cursor-pointer' : 'cursor-default'
                }`}
                title={`Select Oracle ${slot}`}
              >
                <OracleStatue
                  revealedRole={revealedRole}
                  selected={isSelected}
                  speaking={isSpeakingNow}
                  height={128}
                  className="w-auto h-[84px] sm:h-[118px] lg:h-[132px] origin-bottom"
                />
              </motion.button>

              {/* Carved Plinth Label Directly Below Feet */}
              <div className="pointer-events-none absolute top-full mt-3 flex flex-col items-center whitespace-nowrap leading-tight">
                <span
                  className={`font-display text-sm sm:text-base font-semibold tracking-wide transition-colors ${
                    isSelected ? 'text-gold-200' : 'text-ivory-100/90'
                  }`}
                >
                  Oracle {slot}
                </span>

                {isRevealed && revealedRole ? (
                  <span
                    className={`mt-0.5 text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-wider ${
                      revealedRole === 'truth'
                        ? 'text-[#7cd9a8]'
                        : revealedRole === 'false'
                        ? 'text-[#f29587]'
                        : 'text-[#cbb2ff]'
                    }`}
                  >
                    {ROLE_INFO[revealedRole].title} · {ROLE_INFO[revealedRole].label}
                  </span>
                ) : assignedDraft ? (
                  <span className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-gold-300/90">
                    Marked: {ROLE_INFO[assignedDraft].label}
                  </span>
                ) : (
                  <span className="mt-0.5 text-[10px] text-ivory-200/45">
                    {isSelected ? 'Targeted' : 'Veiled'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

