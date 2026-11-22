import React from 'react';
import { motion } from 'framer-motion';
import type { ThemeMode } from '../../core/types';
import {
  DOOR_NUMERALS,
  DOORS,
  KEYS_TO_WIN,
  MAX_LOSSES,
  type DoorIndex,
  type VaultTrialState,
} from './engine';

interface VaultSceneProps {
  state: VaultTrialState;
  isAnimating: boolean;
  theme: ThemeMode;
  onDoorClick: (door: DoorIndex) => void;
}

const DOOR_POS_PCT: Record<DoorIndex, number> = {
  0: 22,
  1: 50,
  2: 78,
};

const AstralKeySvg: React.FC = () => (
  <motion.svg
    viewBox="0 0 64 96"
    className="w-10 sm:w-12 lg:w-14 h-auto drop-shadow-[0_0_22px_rgba(232,168,73,0.75)]"
    fill="none"
    initial={{ opacity: 0, scale: 0.6, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
    transition={{
      opacity: { duration: 0.35 },
      scale: { type: 'spring', stiffness: 260, damping: 20 },
      y: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
    }}
    aria-hidden="true"
  >
    {/* Radiant Halo */}
    <circle cx="32" cy="28" r="24" fill="#efc06e" fillOpacity="0.22" className="animate-flame-breathe" />
    {/* Ornate Key Bow */}
    <circle cx="32" cy="28" r="14" stroke="#f6d79c" strokeWidth="3.5" fill="#d48d2a" fillOpacity="0.22" />
    <circle cx="32" cy="28" r="6" fill="#fff3d1" />
    {/* Key Shaft */}
    <rect x="29.5" y="42" width="5" height="42" rx="2.5" fill="#efc06e" />
    {/* Key Teeth */}
    <rect x="34" y="64" width="11" height="4.5" rx="1.5" fill="#f6d79c" />
    <rect x="34" y="74" width="8" height="4.5" rx="1.5" fill="#efc06e" />
  </motion.svg>
);

const HollowTrapSvg: React.FC = () => (
  <motion.svg
    viewBox="0 0 64 64"
    className="w-8 sm:w-10 h-auto opacity-55"
    fill="none"
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.6 }}
    transition={{ duration: 0.35 }}
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="20" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />
    <path d="M23 23 L41 41 M41 23 L23 41" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
  </motion.svg>
);

export const VaultScene: React.FC<VaultSceneProps> = ({
  state,
  isAnimating,
  theme,
  onDoorClick,
}) => {
  const isLight = theme === 'light';
  const round = state.currentRound;

  const palette = isLight
    ? {
        bgTop: '#242d3e',
        bgMid: '#333f55',
        bgBot: '#1c2331',
        floorTop: '#2d3748',
        floorBot: '#19202c',
        frameStroke: '#6b7b96',
        brass: '#c99754',
      }
    : {
        bgTop: '#080a10',
        bgMid: '#111623',
        bgBot: '#090c14',
        floorTop: '#161c29',
        floorBot: '#0a0d14',
        frameStroke: '#2b364d',
        brass: '#b88848',
      };

  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border border-paper-900/12 dark:border-white/[0.07] bg-[#242d3e] dark:bg-ink-900 shadow-[0_24px_65px_-26px_rgba(26,24,21,0.34)] dark:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95)] select-none transition-shadow duration-300">
      <div className="relative w-full aspect-[1000/440] min-h-[260px]">
        {/* Architectural Iron Vault Hall Backdrop */}
        <svg
          viewBox="0 0 1000 440"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="vaultBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.bgTop} />
              <stop offset="70%" stopColor={palette.bgMid} />
              <stop offset="100%" stopColor={palette.bgBot} />
            </linearGradient>
            <linearGradient id="vaultFloor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.floorTop} />
              <stop offset="100%" stopColor={palette.floorBot} />
            </linearGradient>
            <linearGradient id="overheadShaft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6d79c" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#f6d79c" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="1000" height="440" fill="url(#vaultBg)" />

          {/* Overhead Light Shafts Falling on Each Vault */}
          {[220, 500, 780].map((cx) => (
            <polygon
              key={cx}
              points={`${cx - 32},0 ${cx + 32},0 ${cx + 92},358 ${cx - 92},358`}
              fill="url(#overheadShaft)"
            />
          ))}

          {/* Architectural Wall Pilasters */}
          <line x1="360" y1="0" x2="360" y2="358" stroke={palette.frameStroke} strokeOpacity="0.28" strokeWidth="1.5" />
          <line x1="640" y1="0" x2="640" y2="358" stroke={palette.frameStroke} strokeOpacity="0.28" strokeWidth="1.5" />

          {/* Stone Vault Floor (y = 358 -> bottom 18.6%) */}
          <rect x="0" y="358" width="1000" height="82" fill="url(#vaultFloor)" />
          <line x1="0" y1="358.5" x2="1000" y2="358.5" stroke={palette.brass} strokeOpacity="0.28" strokeWidth="1.4" />
        </svg>

        {/* Quiet Top Etched Vault Progress Strip */}
        <div className="pointer-events-none absolute inset-x-5 sm:inset-x-8 top-4 sm:top-5 flex items-center justify-between text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.24em] text-ivory-100/60">
          <span>
            Vault Hall · Round {round.roundNumber}
          </span>
          <span className="font-mono">
            <span className="text-gold-200">{state.keysCollected}/{KEYS_TO_WIN} Keys</span>
            <span className="mx-2 text-white/25">·</span>
            <span className={state.lossesCount >= MAX_LOSSES - 1 ? 'text-[#f29587]' : 'text-ivory-200/60'}>
              {state.lossesCount}/{MAX_LOSSES} Traps
            </span>
          </span>
        </div>

        {/* Three Towering Interactive Bronze Vault Doors */}
        {DOORS.map((door) => {
          const isInitialPick = round.initialPick === door;
          const isHostOpened = round.hostRevealedDoor === door;
          const isFinalPick = round.finalPick === door;
          const isPrize = round.prizeDoor === door;

          // A door swings open if:
          // - Host revealed it in 'decide' or 'revealed'
          // - Player finalized it in 'revealed'
          // - Round ended and this door hid the prize (so player sees where it was!)
          const isOpen =
            isHostOpened ||
            (round.phase === 'revealed' && (isFinalPick || isPrize));

          const isClickable =
            !isAnimating &&
            state.status === 'playing' &&
            ((round.phase === 'pick') ||
              (round.phase === 'decide' && !isHostOpened));

          const showGlowWin = round.phase === 'revealed' && isPrize && isFinalPick;
          const isSwitchCandidate =
            round.phase === 'decide' && !isHostOpened && !isInitialPick;

          return (
            <div
              key={door}
              style={{
                left: `${DOOR_POS_PCT[door]}%`,
                bottom: '18.6%',
                perspective: '900px',
              }}
              className="absolute -translate-x-1/2 z-20 flex flex-col items-center"
            >
              {/* Door Archway Frame + Interior Reveal Recess */}
              <motion.button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onDoorClick(door)}
                whileHover={isClickable ? { y: -3 } : undefined}
                whileTap={isClickable ? { scale: 0.99 } : undefined}
                className={`group relative w-[92px] h-[142px] sm:w-[138px] sm:h-[214px] lg:w-[158px] lg:h-[244px] rounded-t-full border-2 overflow-visible focus:outline-none transition-colors ${
                  showGlowWin
                    ? 'border-[#6abf94] shadow-[0_0_40px_rgba(106,191,148,0.4)]'
                    : isInitialPick && !isOpen
                    ? 'border-gold-300 shadow-[0_0_32px_rgba(232,168,73,0.32)]'
                    : isSwitchCandidate
                    ? 'border-gold-400/55 hover:border-gold-300'
                    : 'border-white/15 hover:border-gold-300/60'
                } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                title={`Vault Door ${DOOR_NUMERALS[door]}`}
              >
                {/* Interior Vault Chamber (visible when door swings open!) */}
                <div
                  className={`absolute inset-0 rounded-t-full flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 ${
                    isPrize && isOpen
                      ? 'bg-gradient-to-b from-[#2b2618] via-[#1b1a14] to-[#111319]'
                      : 'bg-[#0b0e16]'
                  }`}
                >
                  {isOpen && (isPrize ? <AstralKeySvg /> : <HollowTrapSvg />)}
                  {isOpen && (
                    <span
                      className={`mt-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] ${
                        isPrize ? 'text-gold-200 font-semibold' : 'text-ivory-200/45'
                      }`}
                    >
                      {isPrize ? 'Astral Key' : 'Empty Trap'}
                    </span>
                  )}
                </div>

                {/* Swinging Sculpted Bronze Vault Door Leaf (3D hinge on left!) */}
                <motion.div
                  style={{
                    transformOrigin: 'left center',
                    transformStyle: 'preserve-3d',
                  }}
                  animate={{
                    rotateY: isOpen ? -82 : 0,
                  }}
                  transition={{
                    duration: 0.68,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 rounded-t-full bg-gradient-to-b from-[#2c3445] via-[#1f2634] to-[#151a24] border border-white/10 shadow-inner flex flex-col items-center justify-center overflow-hidden"
                >
                  {/* Decorative Inner Arch Line */}
                  <div className="pointer-events-none absolute inset-2.5 rounded-t-full border border-gold-400/25" />

                  {/* Roman Numeral Plate */}
                  <span className="font-display text-xl sm:text-3xl font-semibold text-ivory-100/90 tracking-widest -mt-4">
                    {DOOR_NUMERALS[door]}
                  </span>

                  {/* Rotating Concentric Bronze Lock Ring */}
                  <motion.svg
                    viewBox="0 0 64 64"
                    className="mt-2 sm:mt-3 w-10 h-10 sm:w-14 sm:h-14"
                    fill="none"
                    animate={{ rotate: isOpen ? 120 : isInitialPick ? 45 : 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    aria-hidden="true"
                  >
                    <circle
                      cx="32"
                      cy="32"
                      r="22"
                      stroke={isInitialPick ? '#efc06e' : '#b88848'}
                      strokeOpacity={isInitialPick ? 0.9 : 0.45}
                      strokeWidth="1.8"
                      strokeDasharray="6 5"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="11"
                      stroke={isInitialPick ? '#f6d79c' : '#94a3b8'}
                      strokeOpacity="0.55"
                      strokeWidth="1.4"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="3.5"
                      fill={isInitialPick ? '#efc06e' : '#b88848'}
                    />
                  </motion.svg>
                </motion.div>
              </motion.button>

              {/* Quiet Etched Status Tag on Stone Floor Directly Below Door */}
              <div className="pointer-events-none absolute top-full mt-2.5 whitespace-nowrap text-center">
                {round.phase === 'decide' ? (
                  isHostOpened ? (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ivory-200/40">
                      Unsealed Empty
                    </span>
                  ) : isInitialPick ? (
                    <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-gold-200">
                      Your Pick · Stay
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-ivory-100/85">
                      Sealed · Switch?
                    </span>
                  )
                ) : round.phase === 'revealed' ? (
                  isFinalPick ? (
                    <span
                      className={`font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider ${
                        round.wonRound ? 'text-[#7cd9a8]' : 'text-[#f29587]'
                      }`}
                    >
                      {round.wonRound ? 'Key Found' : 'Your Choice'}
                    </span>
                  ) : isPrize ? (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-gold-300/85">
                      Key Was Here
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ivory-200/40">
                      Empty
                    </span>
                  )
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ivory-200/55">
                    Door {DOOR_NUMERALS[door]}
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

