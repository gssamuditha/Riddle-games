import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ThemeMode } from '../../core/types';
import {
  LARGE_CAPACITY,
  SMALL_CAPACITY,
  TARGET_VOLUME,
  type JugAction,
  type JugId,
  type JugsGameState,
} from './engine';

export interface ActiveJugAnimation {
  action: JugAction;
  targetSmall: number;
  targetLarge: number;
  durationMs: number;
}

interface JugsSceneProps {
  state: JugsGameState;
  selectedJug: JugId;
  animating: ActiveJugAnimation | null;
  theme: ThemeMode;
  onFlaskClick: (jug: JugId) => void;
}

const BUBBLES = [
  { cx: 34, r: 2.2, delay: '0s', dur: '3.2s' },
  { cx: 52, r: 1.7, delay: '1.1s', dur: '2.8s' },
  { cx: 68, r: 2.4, delay: '2.0s', dur: '3.6s' },
  { cx: 44, r: 1.5, delay: '0.6s', dur: '3.0s' },
];

export const JugsScene: React.FC<JugsSceneProps> = ({
  state,
  selectedJug,
  animating,
  theme,
  onFlaskClick,
}) => {
  const isLight = theme === 'light';
  const isWon = state.status === 'won';

  // Display levels smoothly transition directly toward the animation's target volumes!
  const smallLevel = animating ? animating.targetSmall : state.small;
  const largeLevel = animating ? animating.targetLarge : state.large;

  const smallRatio = smallLevel / SMALL_CAPACITY;
  const largeRatio = largeLevel / LARGE_CAPACITY;

  const isFillingSmall = animating?.action.type === 'fill' && animating.action.jug === 'small';
  const isFillingLarge = animating?.action.type === 'fill' && animating.action.jug === 'large';
  const isEmptyingSmall = animating?.action.type === 'empty' && animating.action.jug === 'small';
  const isEmptyingLarge = animating?.action.type === 'empty' && animating.action.jug === 'large';
  const isPouringSmallToLarge =
    animating?.action.type === 'pour' && animating.action.from === 'small';
  const isPouringLargeToSmall =
    animating?.action.type === 'pour' && animating.action.from === 'large';

  // Harmonized Dusk Atelier Slate (Light Mode) vs. Deep Alchemy Vault (Dark Mode)
  const palette = isLight
    ? {
        bgTop: '#232f42',
        bgMid: '#314057',
        bgBot: '#1d2636',
        archStroke: '#667b99',
        benchTop: '#333d4f',
        benchFront: '#1b222e',
        brass: '#c99754',
        brassDark: '#7a592d',
        sealBg: '#273447',
      }
    : {
        bgTop: '#080b12',
        bgMid: '#101624',
        bgBot: '#090c14',
        archStroke: '#2b3952',
        benchTop: '#1c2331',
        benchFront: '#0c1018',
        brass: '#b88848',
        brassDark: '#634621',
        sealBg: '#0d1320',
      };

  // Liquid Y coordinates inside each flask's internal SVG coordinate system
  // Small flask chamber: y from 142 (bottom) up to 44 (top brim) -> height = 98
  const smallFillY = 142 - smallRatio * 96;
  // Large flask chamber: y from 178 (bottom) up to 44 (top brim) -> height = 134
  const largeFillY = 178 - largeRatio * 132;

  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border border-paper-900/12 dark:border-white/[0.07] bg-[#232f42] dark:bg-ink-900 shadow-[0_24px_65px_-26px_rgba(26,24,21,0.34)] dark:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95)] select-none transition-shadow duration-300">
      <div className="relative w-full aspect-[1000/440] min-h-[260px]">
        {/* Architectural Alchemy Distillery Backdrop */}
        <svg
          viewBox="0 0 1000 440"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="distilleryBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.bgTop} />
              <stop offset="65%" stopColor={palette.bgMid} />
              <stop offset="100%" stopColor={palette.bgBot} />
            </linearGradient>
            <radialGradient id="vaultAura" cx="50%" cy="40%" r="45%">
              <stop
                offset="0%"
                stopColor={isWon ? '#6abf94' : '#e8a849'}
                stopOpacity={isWon ? '0.28' : '0.12'}
              />
              <stop offset="100%" stopColor={palette.bgTop} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="elixirStream" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d8fff0" />
              <stop offset="45%" stopColor="#5ed4a8" />
              <stop offset="100%" stopColor="#2ca684" />
            </linearGradient>
            <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.benchTop} />
              <stop offset="100%" stopColor={palette.benchFront} />
            </linearGradient>
          </defs>

          {/* Chamber Backdrop */}
          <rect width="1000" height="440" fill="url(#distilleryBg)" />
          <rect width="1000" height="440" fill="url(#vaultAura)" />

          {/* Tall Arched Distillery Alcove & Brass Vault Ring */}
          <path
            d="M270 336 V165 C270 68 370 26 500 26 C630 26 730 68 730 165 V336"
            fill={palette.sealBg}
            fillOpacity="0.65"
            stroke={palette.archStroke}
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />

          {/* Celestial Counterweight Vault Seal (Rotates Open on Victory!) */}
          <motion.g
            style={{ originX: '500px', originY: '142px' }}
            animate={{ rotate: isWon ? 90 : 0 }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <circle
              cx="500"
              cy="142"
              r="62"
              stroke={isWon ? '#6abf94' : palette.brass}
              strokeOpacity={isWon ? 0.7 : 0.28}
              strokeWidth="1.5"
              strokeDasharray="6 6"
              fill="none"
            />
            <circle
              cx="500"
              cy="142"
              r="44"
              stroke={isWon ? '#8be0b5' : palette.brass}
              strokeOpacity={isWon ? 0.85 : 0.35}
              strokeWidth="1.2"
              fill="none"
            />
            {/* 4 cardinal brass ticks */}
            <line x1="500" y1="74" x2="500" y2="88" stroke={palette.brass} strokeOpacity="0.55" strokeWidth="1.6" />
            <line x1="500" y1="196" x2="500" y2="210" stroke={palette.brass} strokeOpacity="0.55" strokeWidth="1.6" />
            <line x1="432" y1="142" x2="446" y2="142" stroke={palette.brass} strokeOpacity="0.55" strokeWidth="1.6" />
            <line x1="554" y1="142" x2="568" y2="142" stroke={palette.brass} strokeOpacity="0.55" strokeWidth="1.6" />
          </motion.g>

          {/* Center Vault Target Readout */}
          <text
            x="500"
            y="136"
            textAnchor="middle"
            fill={isWon ? '#a7f3d0' : '#f3eee4'}
            fillOpacity={isWon ? 0.95 : 0.72}
            fontSize="10"
            letterSpacing="3"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            {isWon ? 'UNLOCKED' : 'TARGET'}
          </text>
          <text
            x="500"
            y="160"
            textAnchor="middle"
            fill={isWon ? '#6abf94' : '#efc06e'}
            fontSize="24"
            fontWeight="600"
            fontFamily="JetBrains Mono, monospace"
          >
            {TARGET_VOLUME}L
          </text>

          {/* Overhead Brass Cistern Pipes & Dual Spouts */}
          <path
            d="M170 40 H830 M375 40 V92 M625 40 V78"
            stroke={palette.brass}
            strokeOpacity="0.48"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Left Spout Nozzle (over 3L Flask) */}
          <rect x="369" y="88" width="12" height="10" rx="2" fill={palette.brass} />
          {/* Right Spout Nozzle (over 5L Flask) */}
          <rect x="619" y="74" width="12" height="10" rx="2" fill={palette.brass} />

          {/* Animated Vertical Starlight Stream when Filling Small 3L Flask */}
          <AnimatePresence>
            {isFillingSmall && (
              <motion.rect
                key="fill-small-stream"
                x="372"
                y="98"
                width="6"
                rx="3"
                fill="url(#elixirStream)"
                initial={{ height: 0, opacity: 0.9 }}
                animate={{ height: 222, opacity: [0.95, 1, 0.75] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            )}
            {isFillingLarge && (
              <motion.rect
                key="fill-large-stream"
                x="622"
                y="84"
                width="6"
                rx="3"
                fill="url(#elixirStream)"
                initial={{ height: 0, opacity: 0.9 }}
                animate={{ height: 236, opacity: [0.95, 1, 0.75] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          {/* Animated Curved Pour Arc Between Flasks */}
          <AnimatePresence>
            {isPouringSmallToLarge && (
              <motion.path
                key="pour-s-to-l"
                d="M525 148 Q585 138 625 205"
                stroke="url(#elixirStream)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="160"
                fill="none"
                initial={{ strokeDashoffset: 160, opacity: 0 }}
                animate={{ strokeDashoffset: 0, opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: (animating?.durationMs ?? 800) / 1000, ease: 'easeInOut' }}
              />
            )}
            {isPouringLargeToSmall && (
              <motion.path
                key="pour-l-to-s"
                d="M476 144 Q416 138 375 224"
                stroke="url(#elixirStream)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="160"
                fill="none"
                initial={{ strokeDashoffset: 160, opacity: 0 }}
                animate={{ strokeDashoffset: 0, opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: (animating?.durationMs ?? 800) / 1000, ease: 'easeInOut' }}
              />
            )}
          </AnimatePresence>

          {/* Animated Drain Stream into Basin */}
          <AnimatePresence>
            {isEmptyingSmall && (
              <motion.path
                key="drain-small"
                d="M320 264 Q295 292 288 340"
                stroke="url(#elixirStream)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: (animating?.durationMs ?? 650) / 1000 }}
              />
            )}
            {isEmptyingLarge && (
              <motion.path
                key="drain-large"
                d="M680 260 Q705 290 712 340"
                stroke="url(#elixirStream)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: (animating?.durationMs ?? 650) / 1000 }}
              />
            )}
          </AnimatePresence>

          {/* Stone Alchemy Workbench Surface (y = 336) */}
          <rect x="0" y="336" width="1000" height="104" fill="url(#benchGrad)" />
          <line x1="0" y1="336.5" x2="1000" y2="336.5" stroke={palette.brass} strokeOpacity="0.32" strokeWidth="1.4" />

          {/* Subtle Recessed Brass Coasters Under Each Flask */}
          <ellipse cx="375" cy="340" rx="58" ry="8" fill="#000000" fillOpacity="0.32" />
          <ellipse
            cx="375"
            cy="338"
            rx="54"
            ry="6.5"
            fill="none"
            stroke={selectedJug === 'small' ? '#efc06e' : palette.brass}
            strokeOpacity={selectedJug === 'small' ? 0.85 : 0.25}
            strokeWidth="1.4"
          />

          <ellipse cx="625" cy="340" rx="68" ry="8.5" fill="#000000" fillOpacity="0.32" />
          <ellipse
            cx="625"
            cy="338"
            rx="64"
            ry="7"
            fill="none"
            stroke={
              isWon && largeLevel === TARGET_VOLUME
                ? '#6abf94'
                : selectedJug === 'large'
                ? '#efc06e'
                : palette.brass
            }
            strokeOpacity={
              isWon && largeLevel === TARGET_VOLUME
                ? 0.95
                : selectedJug === 'large'
                ? 0.85
                : 0.25
            }
            strokeWidth="1.5"
          />
        </svg>

        {/* Subtle Top Etched Hint Labels */}
        <div className="pointer-events-none absolute inset-x-5 sm:inset-x-8 top-5 flex items-center justify-between text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.26em] text-ivory-100/55">
          <span>Starlight Cistern</span>
          <span>Brass Distillery · Unmarked Vessels</span>
        </div>

        {/* Interactive Small Flask (3L) Seated Flush on Bench (y = 338 -> bottom 23.2%) */}
        <motion.button
          type="button"
          onClick={() => !animating && onFlaskClick('small')}
          disabled={Boolean(animating) || isWon}
          animate={
            isPouringSmallToLarge
              ? { x: 112, y: -110, rotate: 52 }
              : isEmptyingSmall
              ? { x: -24, y: -36, rotate: -64 }
              : {
                  x: 0,
                  y: selectedJug === 'small' ? -5 : 0,
                  rotate: 0,
                }
          }
          whileHover={!animating && !isWon ? { y: -7 } : undefined}
          transition={{
            duration: animating ? (animating.durationMs / 1000) * 0.65 : 0.32,
            ease: [0.34, 1.15, 0.64, 1],
          }}
          style={{ left: '37.5%', bottom: '23.2%' }}
          className={`group absolute -translate-x-1/2 z-20 flex flex-col items-center focus:outline-none ${
            !animating && !isWon ? 'cursor-pointer' : 'cursor-default'
          }`}
          title="Small Flask (3L capacity)"
        >
          {/* Selection Base Halo */}
          {selectedJug === 'small' && !animating && (
            <span className="pointer-events-none absolute -bottom-1 h-4 w-20 rounded-full bg-gold-400/35 blur-md" />
          )}

          <svg
            viewBox="0 0 110 154"
            className="w-[74px] sm:w-[98px] lg:w-[110px] h-auto overflow-visible"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <clipPath id="smallFlaskClip">
                <path d="M36 28 H74 L76 44 C88 52 94 64 94 84 V126 C94 137 85 144 74 144 H36 C25 144 16 137 16 126 V84 C16 64 22 52 34 44 Z" />
              </clipPath>
              <linearGradient id="elixirSmall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8ef0c7" />
                <stop offset="35%" stopColor="#46c298" />
                <stop offset="100%" stopColor="#1b6e58" />
              </linearGradient>
            </defs>

            {/* Crystal Glass Interior Tint */}
            <path
              d="M36 28 H74 L76 44 C88 52 94 64 94 84 V126 C94 137 85 144 74 144 H36 C25 144 16 137 16 126 V84 C16 64 22 52 34 44 Z"
              fill="#0d1726"
              fillOpacity="0.45"
            />

            {/* Animated Starlight Liquid Fill */}
            <g clipPath="url(#smallFlaskClip)">
              <motion.g
                animate={{ y: smallFillY }}
                transition={{
                  duration: animating ? (animating.durationMs / 1000) * 0.85 : 0.45,
                  ease: [0.42, 0, 0.25, 1],
                }}
              >
                {/* Undulating liquid wave crest */}
                <motion.path
                  d="M-30 4 Q0 -2 30 4 T90 4 T150 4 V160 H-30 Z"
                  fill="url(#elixirSmall)"
                  animate={{ x: [-16, 14, -16] }}
                  transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut' }}
                />
                {/* Shimmering top meniscus line */}
                <motion.path
                  d="M-30 4 Q0 -2 30 4 T90 4 T150 4"
                  stroke="#d9fff0"
                  strokeOpacity="0.78"
                  strokeWidth="1.6"
                  fill="none"
                  animate={{ x: [-16, 14, -16] }}
                  transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut' }}
                />
                {/* Subtle rising bubbles when liquid present */}
                {smallLevel > 0 &&
                  BUBBLES.slice(0, 3).map((b, i) => (
                    <circle
                      key={i}
                      cx={b.cx}
                      cy={36 + i * 14}
                      r={b.r}
                      fill="#e4fff5"
                      fillOpacity="0.5"
                      className="animate-ember-rise"
                      style={{ animationDelay: b.delay, animationDuration: b.dur }}
                    />
                  ))}
              </motion.g>
            </g>

            {/* Crystal Glass Outer Wall */}
            <path
              d="M36 28 H74 L76 44 C88 52 94 64 94 84 V126 C94 137 85 144 74 144 H36 C25 144 16 137 16 126 V84 C16 64 22 52 34 44 Z"
              stroke={selectedJug === 'small' ? '#f6d79c' : '#d8e3f0'}
              strokeOpacity={selectedJug === 'small' ? 0.92 : 0.42}
              strokeWidth={selectedJug === 'small' ? 2.2 : 1.5}
            />
            {/* Brass Rim & Neck Collar */}
            <rect x="31" y="21" width="48" height="7" rx="3" fill="#b88848" stroke="#f6d79c" strokeOpacity="0.5" strokeWidth="0.9" />
            <rect x="33" y="42" width="44" height="4.5" rx="2" fill="#8f6632" />
            {/* Specular Glass Highlight */}
            <path d="M26 68 V124" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="2.4" strokeLinecap="round" />
          </svg>

          {/* Clean Etched Volume Label Below Bench Edge */}
          <div className="pointer-events-none absolute top-full mt-2.5 flex flex-col items-center whitespace-nowrap">
            <span
              className={`font-mono text-xs sm:text-sm font-semibold tabular-nums transition-colors ${
                selectedJug === 'small' ? 'text-gold-200' : 'text-ivory-100/90'
              }`}
            >
              {smallLevel} / {SMALL_CAPACITY}L
            </span>
            <span className="text-[10px] tracking-wide text-ivory-200/60">Small Flask</span>
          </div>
        </motion.button>

        {/* Interactive Tall Flask (5L) Seated Flush on Bench (y = 338 -> bottom 23.2%) */}
        <motion.button
          type="button"
          onClick={() => !animating && onFlaskClick('large')}
          disabled={Boolean(animating) || isWon}
          animate={
            isPouringLargeToSmall
              ? { x: -112, y: -96, rotate: -52 }
              : isEmptyingLarge
              ? { x: 24, y: -36, rotate: 64 }
              : {
                  x: 0,
                  y: selectedJug === 'large' ? -5 : 0,
                  rotate: 0,
                }
          }
          whileHover={!animating && !isWon ? { y: -7 } : undefined}
          transition={{
            duration: animating ? (animating.durationMs / 1000) * 0.65 : 0.32,
            ease: [0.34, 1.15, 0.64, 1],
          }}
          style={{ left: '62.5%', bottom: '23.2%' }}
          className={`group absolute -translate-x-1/2 z-20 flex flex-col items-center focus:outline-none ${
            !animating && !isWon ? 'cursor-pointer' : 'cursor-default'
          }`}
          title="Tall Flask (5L capacity)"
        >
          {/* Selection or Victory Base Halo */}
          {(selectedJug === 'large' || (isWon && largeLevel === TARGET_VOLUME)) && !animating && (
            <span
              className={`pointer-events-none absolute -bottom-1 h-4 w-24 rounded-full blur-md ${
                isWon && largeLevel === TARGET_VOLUME ? 'bg-[#6abf94]/50' : 'bg-gold-400/35'
              }`}
            />
          )}

          <svg
            viewBox="0 0 124 190"
            className="w-[84px] sm:w-[110px] lg:w-[124px] h-auto overflow-visible"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <clipPath id="largeFlaskClip">
                <path d="M40 28 H84 L86 45 C101 55 108 68 108 92 V160 C108 172 98 180 86 180 H38 C26 180 16 172 16 160 V92 C16 68 23 55 38 45 Z" />
              </clipPath>
              <linearGradient id="elixirLarge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isWon ? '#b7f7d8' : '#8ef0c7'} />
                <stop offset="35%" stopColor={isWon ? '#5dd4a1' : '#46c298'} />
                <stop offset="100%" stopColor="#1b6e58" />
              </linearGradient>
            </defs>

            {/* Crystal Glass Interior Tint */}
            <path
              d="M40 28 H84 L86 45 C101 55 108 68 108 92 V160 C108 172 98 180 86 180 H38 C26 180 16 172 16 160 V92 C16 68 23 55 38 45 Z"
              fill="#0d1726"
              fillOpacity="0.45"
            />

            {/* Animated Starlight Liquid Fill */}
            <g clipPath="url(#largeFlaskClip)">
              <motion.g
                animate={{ y: largeFillY }}
                transition={{
                  duration: animating ? (animating.durationMs / 1000) * 0.85 : 0.45,
                  ease: [0.42, 0, 0.25, 1],
                }}
              >
                <motion.path
                  d="M-30 4 Q0 -2.5 32 4 T96 4 T160 4 V196 H-30 Z"
                  fill="url(#elixirLarge)"
                  animate={{ x: [14, -16, 14] }}
                  transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M-30 4 Q0 -2.5 32 4 T96 4 T160 4"
                  stroke="#e0fff3"
                  strokeOpacity="0.82"
                  strokeWidth="1.7"
                  fill="none"
                  animate={{ x: [14, -16, 14] }}
                  transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
                />
                {largeLevel > 0 &&
                  BUBBLES.map((b, i) => (
                    <circle
                      key={i}
                      cx={b.cx + 12}
                      cy={32 + i * 16}
                      r={b.r}
                      fill="#e4fff5"
                      fillOpacity="0.52"
                      className="animate-ember-rise"
                      style={{ animationDelay: b.delay, animationDuration: b.dur }}
                    />
                  ))}
              </motion.g>
            </g>

            {/* Crystal Glass Outer Wall */}
            <path
              d="M40 28 H84 L86 45 C101 55 108 68 108 92 V160 C108 172 98 180 86 180 H38 C26 180 16 172 16 160 V92 C16 68 23 55 38 45 Z"
              stroke={
                isWon && largeLevel === TARGET_VOLUME
                  ? '#7cd9a8'
                  : selectedJug === 'large'
                  ? '#f6d79c'
                  : '#d8e3f0'
              }
              strokeOpacity={
                isWon && largeLevel === TARGET_VOLUME || selectedJug === 'large' ? 0.94 : 0.42
              }
              strokeWidth={selectedJug === 'large' || isWon ? 2.2 : 1.5}
            />
            {/* Brass Rim & Neck Collar */}
            <rect x="35" y="21" width="54" height="7" rx="3" fill="#b88848" stroke="#f6d79c" strokeOpacity="0.5" strokeWidth="0.9" />
            <rect x="37" y="42" width="50" height="4.5" rx="2" fill="#8f6632" />
            {/* Specular Glass Highlight */}
            <path d="M27 72 V158" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="2.6" strokeLinecap="round" />
          </svg>

          {/* Clean Etched Volume Label Below Bench Edge */}
          <div className="pointer-events-none absolute top-full mt-2.5 flex flex-col items-center whitespace-nowrap">
            <span
              className={`font-mono text-xs sm:text-sm font-semibold tabular-nums transition-colors ${
                isWon && largeLevel === TARGET_VOLUME
                  ? 'text-[#7cd9a8]'
                  : selectedJug === 'large'
                  ? 'text-gold-200'
                  : 'text-ivory-100/90'
              }`}
            >
              {largeLevel} / {LARGE_CAPACITY}L
            </span>
            <span className="text-[10px] tracking-wide text-ivory-200/60">Tall Flask</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};
