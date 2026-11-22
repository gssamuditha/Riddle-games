import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ThemeMode } from '../../core/types';
import {
  STARTING_EGGS,
  TOTAL_FLOORS,
  type EggDropOutcome,
  type EggDropState,
} from './engine';

export interface ActiveDropAnimation {
  floor: number;
  outcome: EggDropOutcome;
  durationMs: number;
}

interface EggSceneProps {
  state: EggDropState;
  selectedFloor: number;
  dropping: ActiveDropAnimation | null;
  theme: ThemeMode;
  onSelectFloor: (floor: number) => void;
}

// Tower SVG vertical span inside 1000x440 viewBox:
// Floor 100 = y 64, Floor 0 (Ground) = y 374 -> height = 310px (3.1px per floor)
const TOWER_TOP_Y = 64;
const TOWER_GROUND_Y = 374;
const TOWER_SPAN = TOWER_GROUND_Y - TOWER_TOP_Y;

function floorToY(floor: number): number {
  const clamped = Math.max(0, Math.min(TOTAL_FLOORS, floor));
  return TOWER_GROUND_Y - (clamped / TOTAL_FLOORS) * TOWER_SPAN;
}

const SHARDS = [
  { dx: -26, dy: -22, rot: -55 },
  { dx: -12, dy: -32, rot: -25 },
  { dx: 8, dy: -34, rot: 22 },
  { dx: 26, dy: -20, rot: 58 },
  { dx: -18, dy: -10, rot: -80 },
  { dx: 20, dy: -8, rot: 75 },
];

export const CrystalEggIcon: React.FC<{ intact: boolean; size?: number }> = ({
  intact,
  size = 26,
}) => (
  <svg
    width={size}
    height={Math.round(size * 1.25)}
    viewBox="0 0 28 36"
    fill="none"
    aria-hidden="true"
  >
    {intact ? (
      <>
        <path
          d="M14 3 C21 3 25 14 25 22 C25 29.5 20.5 33 14 33 C7.5 33 3 29.5 3 22 C3 14 7 3 14 3 Z"
          fill="url(#eggPearl)"
          stroke="#f6d79c"
          strokeWidth="1.4"
        />
        <path d="M9.5 11 C8.5 15 8.5 19 9.5 23" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ) : (
      <path
        d="M14 3 C21 3 25 14 25 22 C25 29.5 20.5 33 14 33 C7.5 33 3 29.5 3 22 C3 14 7 3 14 3 Z M9 14 L14 19 L11 23 L17 28"
        stroke="#94a3b8"
        strokeOpacity="0.4"
        strokeWidth="1.3"
        strokeDasharray="3 2"
      />
    )}
    <defs>
      <radialGradient id="eggPearl" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fffaf0" />
        <stop offset="55%" stopColor="#f3d9a4" />
        <stop offset="100%" stopColor="#b88440" />
      </radialGradient>
    </defs>
  </svg>
);

export const EggScene: React.FC<EggSceneProps> = ({
  state,
  selectedFloor,
  dropping,
  theme,
  onSelectFloor,
}) => {
  const isLight = theme === 'light';
  const isWon = state.status === 'won';

  const lowSafeY = floorToY(state.lowSafe);
  const highBreakY = floorToY(Math.min(TOTAL_FLOORS, state.highBreak));
  const selectedY = floorToY(selectedFloor);

  const dropStartY = dropping ? floorToY(dropping.floor) : selectedY;

  const palette = isLight
    ? {
        skyTop: '#232e42',
        skyBot: '#3b4d6b',
        groundTop: '#2b3547',
        groundBot: '#181f2b',
        towerBody: '#2b3446',
        towerStroke: '#667896',
        brass: '#d4a157',
      }
    : {
        skyTop: '#070a12',
        skyBot: '#131c2e',
        groundTop: '#161c2a',
        groundBot: '#090c14',
        towerBody: '#141a27',
        towerStroke: '#2f3d57',
        brass: '#c99754',
      };

  // Click anywhere along the vertical belltower shaft to aim directly at that floor!
  const handleTowerPointer = (e: React.MouseEvent<SVGRectElement>) => {
    if (dropping || state.status !== 'playing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const floor = Math.round((1 - relY) * TOTAL_FLOORS);
    const clamped = Math.max(
      state.lowSafe + 1,
      Math.min(state.highBreak - 1, Math.max(1, Math.min(TOTAL_FLOORS, floor)))
    );
    onSelectFloor(clamped);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border border-paper-900/12 dark:border-white/[0.07] bg-[#232e42] dark:bg-ink-900 shadow-[0_24px_65px_-26px_rgba(26,24,21,0.34)] dark:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95)] select-none transition-shadow duration-300">
      <div className="relative w-full aspect-[1000/440] min-h-[260px]">
        <svg
          viewBox="0 0 1000 440"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="towerSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.skyTop} />
              <stop offset="100%" stopColor={palette.skyBot} />
            </linearGradient>
            <linearGradient id="towerGround" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.groundTop} />
              <stop offset="100%" stopColor={palette.groundBot} />
            </linearGradient>
          </defs>

          {/* Sky */}
          <rect width="1000" height="374" fill="url(#towerSky)" />

          {/* Subtle Distant Horizon Silhouettes */}
          <path
            d="M0 356 L140 302 L270 340 L410 318 L660 326 L820 296 L1000 344 L1000 374 L0 374 Z"
            fill={palette.towerBody}
            opacity="0.55"
          />

          {/* Courtyard Ground (y = 374) */}
          <rect x="0" y="374" width="1000" height="66" fill="url(#towerGround)" />
          <line x1="0" y1="374.5" x2="1000" y2="374.5" stroke={palette.brass} strokeOpacity="0.3" />

          {/* Left Info Panel: Visual Safe / Unknown / Break Legend */}
          <g transform="translate(88, 126)" aria-hidden="true">
            <text x="0" y="0" fill="#f3eee4" fillOpacity="0.5" fontSize="10" letterSpacing="2" fontFamily="Plus Jakarta Sans, sans-serif">
              KNOWN RANGE
            </text>
            <text x="0" y="28" fill="#6abf94" fontSize="14" fontWeight="600" fontFamily="JetBrains Mono, monospace">
              Safe: 0 – {state.lowSafe}
            </text>
            <text x="0" y="54" fill="#efc06e" fontSize="14" fontWeight="600" fontFamily="JetBrains Mono, monospace">
              {state.highBreak - state.lowSafe - 1 > 0
                ? `Unknown: ${state.lowSafe + 1} – ${state.highBreak - 1}`
                : `Exact Floor: ${state.lowSafe}`}
            </text>
            <text x="0" y="80" fill="#e07a6b" fontSize="14" fontWeight="600" fontFamily="JetBrains Mono, monospace">
              Breaks: {state.highBreak <= TOTAL_FLOORS ? `${state.highBreak} – 100` : 'None yet'}
            </text>

            {/* Crystal Eggs Remaining Visual */}
            <text x="0" y="132" fill="#f3eee4" fillOpacity="0.5" fontSize="10" letterSpacing="2" fontFamily="Plus Jakarta Sans, sans-serif">
              CRYSTAL EGGS
            </text>
            <text x="0" y="156" fill="#f6d79c" fontSize="13" fontFamily="JetBrains Mono, monospace">
              {state.eggsLeft} / {STARTING_EGGS} intact
            </text>
          </g>

          {/* Center Architectural 100-Story Stone Belltower (x = 400..550) */}
          <g>
            {/* Belfry Spire Top */}
            <path
              d="M412 64 L475 24 L538 64 Z"
              fill={palette.towerBody}
              stroke={palette.towerStroke}
              strokeWidth="1.2"
            />
            <circle cx="475" cy="48" r="5" fill={isWon ? '#6abf94' : palette.brass} fillOpacity="0.7" />

            {/* Main Tower Shaft */}
            <rect
              x="408"
              y={TOWER_TOP_Y}
              width="134"
              height={TOWER_SPAN}
              fill={palette.towerBody}
              stroke={palette.towerStroke}
              strokeWidth="1.4"
            />

            {/* Color-Coded Knowledge Zones Inside Tower Shaft */}
            {/* 1. Proven Break Zone (top down to highBreak) */}
            {state.highBreak <= TOTAL_FLOORS && (
              <rect
                x="410"
                y={TOWER_TOP_Y}
                width="130"
                height={Math.max(0, highBreakY - TOWER_TOP_Y)}
                fill="#d45d4c"
                fillOpacity="0.22"
              />
            )}

            {/* 2. Active Unknown Search Window (amber glow) */}
            {state.highBreak - state.lowSafe - 1 > 0 && (
              <rect
                x="410"
                y={state.highBreak <= TOTAL_FLOORS ? highBreakY : TOWER_TOP_Y}
                width="130"
                height={Math.max(
                  0,
                  lowSafeY - (state.highBreak <= TOTAL_FLOORS ? highBreakY : TOWER_TOP_Y)
                )}
                fill="#efc06e"
                fillOpacity="0.14"
              />
            )}

            {/* 3. Proven Safe Zone (lowSafe down to ground) */}
            {state.lowSafe > 0 && (
              <rect
                x="410"
                y={lowSafeY}
                width="130"
                height={Math.max(0, TOWER_GROUND_Y - lowSafeY)}
                fill="#6abf94"
                fillOpacity="0.22"
              />
            )}

            {/* Subtle 10-Floor Ruler Ticks & Numbers along Left Edge of Tower */}
            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((fl) => {
              const y = floorToY(fl);
              return (
                <g key={fl}>
                  <line
                    x1="408"
                    y1={y}
                    x2="420"
                    y2={y}
                    stroke="#ffffff"
                    strokeOpacity="0.22"
                    strokeWidth="1"
                  />
                  <line
                    x1="420"
                    y1={y}
                    x2="542"
                    y2={y}
                    stroke="#ffffff"
                    strokeOpacity="0.06"
                    strokeWidth="1"
                  />
                  <text
                    x="398"
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#f3eee4"
                    fillOpacity="0.48"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {fl}
                  </text>
                </g>
              );
            })}

            {/* Clickable Tower Overlay to Pick Floor Directly by Clicking */}
            <rect
              x="404"
              y={TOWER_TOP_Y}
              width="142"
              height={TOWER_SPAN}
              fill="transparent"
              className={state.status === 'playing' && !dropping ? 'cursor-ns-resize' : 'cursor-default'}
              onClick={handleTowerPointer}
            />

            {/* Previous Drop Markers Etched on Right Edge of Tower */}
            {state.history.map((rec) => {
              const y = floorToY(rec.floor);
              const isSafe = rec.outcome === 'survived';
              return (
                <g key={rec.dropNumber} transform={`translate(542, ${y})`}>
                  <line x1="-10" y1="0" x2="6" y2="0" stroke={isSafe ? '#6abf94' : '#e07a6b'} strokeWidth="1.6" />
                  <circle cx="9" cy="0" r="3" fill={isSafe ? '#6abf94' : '#e07a6b'} />
                  <text
                    x="17"
                    y="3"
                    fill={isSafe ? '#8be0b5' : '#f29587'}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    F{rec.floor}
                  </text>
                </g>
              );
            })}

            {/* Active Balcony Aim Indicator Line */}
            {state.status === 'playing' && (
              <motion.g
                animate={{ y: selectedY }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="pointer-events-none"
              >
                <line
                  x1="408"
                  y1="0"
                  x2="585"
                  y2="0"
                  stroke="#f6d79c"
                  strokeWidth="1.8"
                  strokeDasharray="4 3"
                />
                {/* Balcony Ledge */}
                <rect x="542" y="-3" width="38" height="6" rx="1.5" fill={palette.brass} />
                {/* Waiting Crystal Egg on Balcony when not mid-drop */}
                {!dropping && state.eggsLeft > 0 && (
                  <g transform="translate(566, -15)">
                    <ellipse cx="0" cy="0" rx="6.5" ry="9" fill="#fff5dc" stroke="#e8a849" strokeWidth="1.2" />
                  </g>
                )}
              </motion.g>
            )}
          </g>

          {/* Animated Falling Crystal Egg + Bounce / Shatter Impact at Courtyard (x = 566) */}
          <AnimatePresence>
            {dropping && (
              <g key={`drop-${dropping.floor}-${state.dropsUsed}`}>
                {/* Falling Egg */}
                <motion.g
                  initial={{ x: 566, y: dropStartY - 12, opacity: 1 }}
                  animate={{
                    x: 566,
                    y:
                      dropping.outcome === 'survived'
                        ? [dropStartY - 12, TOWER_GROUND_Y - 9, TOWER_GROUND_Y - 24, TOWER_GROUND_Y - 9]
                        : [dropStartY - 12, TOWER_GROUND_Y - 9],
                    opacity: dropping.outcome === 'shattered' ? [1, 1, 0] : 1,
                  }}
                  transition={{
                    duration: dropping.durationMs / 1000,
                    times: dropping.outcome === 'survived' ? [0, 0.62, 0.82, 1] : [0, 0.72, 0.8],
                    ease: 'easeIn',
                  }}
                >
                  <ellipse cx="0" cy="0" rx="7" ry="9.5" fill="#fff5dc" stroke="#e8a849" strokeWidth="1.3" />
                </motion.g>

                {/* Survive Emerald Ripple Ring */}
                {dropping.outcome === 'survived' && (
                  <motion.ellipse
                    cx="566"
                    cy={TOWER_GROUND_Y}
                    rx="12"
                    ry="4"
                    stroke="#6abf94"
                    strokeWidth="2"
                    fill="none"
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: [0.3, 2.2], opacity: [0, 0.9, 0] }}
                    transition={{ delay: (dropping.durationMs / 1000) * 0.6, duration: 0.45 }}
                    style={{ originX: '566px', originY: `${TOWER_GROUND_Y}px` }}
                  />
                )}

                {/* Shatter Crystal Shards Burst */}
                {dropping.outcome === 'shattered' &&
                  SHARDS.map((s, i) => (
                    <motion.polygon
                      key={i}
                      points="0,-5 4,2 -4,3"
                      fill="#f6d79c"
                      initial={{ x: 566, y: TOWER_GROUND_Y - 6, opacity: 0, rotate: 0 }}
                      animate={{
                        x: 566 + s.dx,
                        y: TOWER_GROUND_Y + s.dy,
                        opacity: [0, 1, 0],
                        rotate: s.rot,
                      }}
                      transition={{ delay: (dropping.durationMs / 1000) * 0.68, duration: 0.35 }}
                    />
                  ))}
              </g>
            )}
          </AnimatePresence>

          {/* Right Live Aimed Floor Callout */}
          <g transform="translate(835, 200)" aria-hidden="true">
            <text x="0" y="-42" textAnchor="middle" fill="#f3eee4" fillOpacity="0.5" fontSize="10" letterSpacing="2" fontFamily="Plus Jakarta Sans, sans-serif">
              {isWon ? 'EXACT SAFE FLOOR' : 'AIMED FLOOR'}
            </text>
            <text
              x="0"
              y="2"
              textAnchor="middle"
              fill={isWon ? '#6abf94' : '#efc06e'}
              fontSize="44"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              {isWon ? state.lowSafe : selectedFloor}
            </text>
            <text x="0" y="28" textAnchor="middle" fill="#f3eee4" fillOpacity="0.55" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">
              {isWon
                ? `Proven in ${state.dropsUsed} drops`
                : `Jump: +${Math.max(0, selectedFloor - state.lowSafe)} above safe`}
            </text>
          </g>
        </svg>

        {/* Visual Egg Icons Overlaid Cleanly Beneath Left Crystal Eggs Text */}
        <div className="pointer-events-none absolute left-[8.8%] bottom-[17%] hidden sm:flex items-center gap-2.5">
          {Array.from({ length: STARTING_EGGS }, (_, idx) => (
            <CrystalEggIcon key={idx} intact={idx < state.eggsLeft} size={22} />
          ))}
        </div>

        {/* Quiet Top Header Labels */}
        <div className="pointer-events-none absolute inset-x-5 sm:inset-x-8 top-4 flex items-center justify-between text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.26em] text-ivory-100/55">
          <span>100-Floor Belltower</span>
          <span>Click Tower or Slide Floor Below</span>
        </div>
      </div>
    </div>
  );
};

