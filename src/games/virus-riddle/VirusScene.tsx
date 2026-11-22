import React from 'react';
import { motion } from 'framer-motion';
import type { ThemeMode } from '../../core/types';
import {
  ENTRANCE_COORD,
  EXIT_COORD,
  isAdjacentLabCoord,
  isSameLabCoord,
  LAB_SIZE,
  TOTAL_VIRUS_ROOMS,
  type LabCoord,
  type VirusGameState,
} from './engine';

interface VirusSceneProps {
  state: VirusGameState;
  showParity: boolean;
  theme: ThemeMode;
  onMove: (coord: LabCoord) => void;
}

// Centered 4x4 room layout inside 1000x440 viewBox:
// Room tile = 74x74 with 16px airlock gap -> pitch = 90px
// Total width = 3*90 + 74 = 344 -> originX = 328, originY = 48
const ORIGIN_X = 328;
const ORIGIN_Y = 48;
const TILE = 74;
const PITCH = 90;

function roomCenter(c: LabCoord): { x: number; y: number } {
  return {
    x: ORIGIN_X + c.col * PITCH + TILE / 2,
    y: ORIGIN_Y + c.row * PITCH + TILE / 2,
  };
}

export const VirusScene: React.FC<VirusSceneProps> = ({
  state,
  showParity,
  theme,
  onMove,
}) => {
  const isLight = theme === 'light';
  const isWon = state.status === 'won';
  const playerPt = roomCenter(state.position);

  const palette = isLight
    ? {
        bgTop: '#222d3d',
        bgBot: '#1a2330',
        corridor: '#4b5f7d',
        brass: '#d4a157',
      }
    : {
        bgTop: '#080b12',
        bgBot: '#0f1624',
        corridor: '#26344a',
        brass: '#c99754',
      };

  // Build SVG polyline string for player's trail through airlocks
  const trailPoints = state.path
    .map((p) => {
      const pt = roomCenter(p);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border border-paper-900/12 dark:border-white/[0.07] bg-[#222d3d] dark:bg-ink-900 shadow-[0_24px_65px_-26px_rgba(26,24,21,0.34)] dark:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95)] select-none transition-shadow duration-300">
      <div className="relative w-full aspect-[1000/440] min-h-[260px]">
        <svg
          viewBox="0 0 1000 440"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="labBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.bgTop} />
              <stop offset="100%" stopColor={palette.bgBot} />
            </linearGradient>
            <radialGradient id="hazmatGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isWon ? '#6abf94' : '#efc06e'} stopOpacity="0.45" />
              <stop offset="100%" stopColor={palette.bgTop} stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="1000" height="440" fill="url(#labBg)" />

          {/* Left Room Legend */}
          <g transform="translate(86, 138)" aria-hidden="true">
            <text x="0" y="0" fill="#f3eee4" fillOpacity="0.5" fontSize="10" letterSpacing="2" fontFamily="Plus Jakarta Sans, sans-serif">
              ROOM STATUS
            </text>

            <rect x="0" y="20" width="14" height="14" rx="3" fill="#173042" stroke="#7dd3fc" strokeWidth="1.2" />
            <text x="24" y="31" fill="#bae6fd" fontSize="12" fontFamily="Plus Jakarta Sans, sans-serif">
              Clean Entrance
            </text>

            <rect x="0" y="50" width="14" height="14" rx="3" fill="#2e1820" stroke="#e07a6b" strokeWidth="1.2" />
            <text x="24" y="61" fill="#f3eee4" fillOpacity="0.82" fontSize="12" fontFamily="Plus Jakarta Sans, sans-serif">
              Virus Room
            </text>

            <rect x="0" y="80" width="14" height="14" rx="3" fill="#132924" stroke="#6abf94" strokeWidth="1.2" />
            <text x="24" y="91" fill="#8be0b5" fontSize="12" fontFamily="Plus Jakarta Sans, sans-serif">
              Cleared &amp; Sealed
            </text>

            {showParity && (
              <text x="0" y="132" fill="#efc06e" fontSize="11" fontFamily="JetBrains Mono, monospace">
                Parity Overlay ON
              </text>
            )}
          </g>

          {/* Right Live Cleared Counter */}
          <g transform="translate(845, 206)" aria-hidden="true">
            <text x="0" y="-36" textAnchor="middle" fill="#f3eee4" fillOpacity="0.5" fontSize="10" letterSpacing="2" fontFamily="Plus Jakarta Sans, sans-serif">
              CLEARED
            </text>
            <text
              x="0"
              y="6"
              textAnchor="middle"
              fill={isWon ? '#6abf94' : '#efc06e'}
              fontSize="40"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              {state.clearedVirusCount}/{TOTAL_VIRUS_ROOMS}
            </text>
            <text x="0" y="30" textAnchor="middle" fill="#f3eee4" fillOpacity="0.55" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">
              {state.entranceRevisited ? 'Entrance revisited' : 'Entrance still clean'}
            </text>
          </g>

          {/* Outer Facility Frame */}
          <rect
            x={ORIGIN_X - 18}
            y={ORIGIN_Y - 18}
            width={PITCH * (LAB_SIZE - 1) + TILE + 36}
            height={PITCH * (LAB_SIZE - 1) + TILE + 36}
            rx="16"
            fill="none"
            stroke={palette.brass}
            strokeOpacity="0.22"
            strokeWidth="1.2"
          />

          {/* Airlock Corridors Between Adjacent Rooms */}
          {Array.from({ length: LAB_SIZE }, (_, r) =>
            Array.from({ length: LAB_SIZE }, (_, c) => {
              const cx = ORIGIN_X + c * PITCH + TILE / 2;
              const cy = ORIGIN_Y + r * PITCH + TILE / 2;
              return (
                <g key={`air-${r}-${c}`}>
                  {c < LAB_SIZE - 1 && (
                    <rect
                      x={ORIGIN_X + c * PITCH + TILE}
                      y={cy - 6}
                      width={PITCH - TILE}
                      height="12"
                      fill={palette.corridor}
                      fillOpacity="0.55"
                    />
                  )}
                  {r < LAB_SIZE - 1 && (
                    <rect
                      x={cx - 6}
                      y={ORIGIN_Y + r * PITCH + TILE}
                      width="12"
                      height={PITCH - TILE}
                      fill={palette.corridor}
                      fillOpacity="0.55"
                    />
                  )}
                </g>
              );
            })
          )}

          {/* 16 Interactive Lab Chambers */}
          {Array.from({ length: LAB_SIZE }, (_, r) =>
            Array.from({ length: LAB_SIZE }, (_, c) => {
              const coord: LabCoord = { row: r, col: c };
              const status = state.rooms[r][c];
              const isCurrent = isSameLabCoord(coord, state.position);
              const isEntrance = isSameLabCoord(coord, ENTRANCE_COORD);
              const isExit = isSameLabCoord(coord, EXIT_COORD);
              const isReachable =
                state.status === 'playing' &&
                isAdjacentLabCoord(state.position, coord) &&
                status !== 'sealed';

              const x = ORIGIN_X + c * PITCH;
              const y = ORIGIN_Y + r * PITCH;
              const isEvenParity = (r + c) % 2 === 0;

              let fill = '#27171f'; // contaminated
              let stroke = '#e07a6b';
              let strokeOpacity = 0.35;

              if (status === 'clean') {
                fill = '#152a3a';
                stroke = '#7dd3fc';
                strokeOpacity = 0.72;
              } else if (status === 'sealed') {
                fill = '#122421';
                stroke = '#6abf94';
                strokeOpacity = 0.4;
              } else if (status === 'active_cleared') {
                fill = '#1d2d29';
                stroke = '#efc06e';
                strokeOpacity = 0.85;
              }

              if (isReachable) {
                stroke = status === 'clean' ? '#7dd3fc' : '#f6d79c';
                strokeOpacity = 0.9;
              }

              return (
                <g
                  key={`room-${r}-${c}`}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => isReachable && onMove(coord)}
                  className={isReachable ? 'cursor-pointer' : 'cursor-default'}
                >
                  {/* Room Chamber Rect */}
                  <rect
                    width={TILE}
                    height={TILE}
                    rx="10"
                    fill={fill}
                    stroke={stroke}
                    strokeOpacity={strokeOpacity}
                    strokeWidth={isCurrent || isReachable ? 2 : 1.3}
                  />

                  {/* Optional Chessboard Parity Overlay */}
                  {showParity && (
                    <rect
                      x="3"
                      y="3"
                      width={TILE - 6}
                      height={TILE - 6}
                      rx="7"
                      fill={isEvenParity ? '#ffffff' : '#000000'}
                      fillOpacity={isEvenParity ? 0.12 : 0.22}
                      className="pointer-events-none"
                    />
                  )}

                  {/* Contaminated Virus Spore Motif */}
                  {status === 'contaminated' && !isCurrent && (
                    <g opacity={isReachable ? 0.95 : 0.65} className="pointer-events-none">
                      <circle cx={TILE / 2} cy={TILE / 2 - (isExit ? 5 : 0)} r="7" fill="#d45d4c" fillOpacity="0.32" />
                      <circle cx={TILE / 2} cy={TILE / 2 - (isExit ? 5 : 0)} r="3.2" fill="#e07a6b" />
                      <circle cx={TILE / 2 - 9} cy={TILE / 2 - 7} r="1.8" fill="#e07a6b" fillOpacity="0.7" />
                      <circle cx={TILE / 2 + 9} cy={TILE / 2 + 5} r="1.8" fill="#e07a6b" fillOpacity="0.7" />
                    </g>
                  )}

                  {/* Sealed Checkmark */}
                  {status === 'sealed' && (
                    <path
                      d={`M${TILE / 2 - 8} ${TILE / 2} L${TILE / 2 - 2} ${TILE / 2 + 6} L${TILE / 2 + 9} ${TILE / 2 - 6}`}
                      stroke="#6abf94"
                      strokeOpacity="0.72"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Subtle Room Labels for Entrance & Exit */}
                  {isEntrance && (
                    <text
                      x={TILE / 2}
                      y={TILE - 9}
                      textAnchor="middle"
                      fill={status === 'clean' ? '#bae6fd' : '#8be0b5'}
                      fontSize="8.5"
                      fontWeight="600"
                      letterSpacing="1.2"
                      fontFamily="JetBrains Mono, monospace"
                      className="pointer-events-none"
                    >
                      {status === 'clean' ? 'CLEAN IN' : 'ENTRANCE'}
                    </text>
                  )}

                  {isExit && (
                    <text
                      x={TILE / 2}
                      y={TILE - 9}
                      textAnchor="middle"
                      fill={isWon ? '#8be0b5' : '#efc06e'}
                      fontSize="9"
                      fontWeight="600"
                      letterSpacing="1.4"
                      fontFamily="JetBrains Mono, monospace"
                      className="pointer-events-none"
                    >
                      EXIT
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Continuous Illuminated Path Trail Through Airlocks */}
          {state.path.length > 1 && (
            <polyline
              points={trailPoints}
              fill="none"
              stroke={isWon ? '#6abf94' : '#efc06e'}
              strokeOpacity="0.58"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            />
          )}

          {/* Animated Player Beacon Gliding Through Airlocks */}
          <motion.g
            animate={{ x: playerPt.x, y: playerPt.y }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="pointer-events-none"
          >
            <circle r="28" fill="url(#hazmatGlow)" />
            <circle
              r="11"
              fill={isWon ? '#163829' : '#261e12'}
              stroke={isWon ? '#7cd9a8' : '#f6d79c'}
              strokeWidth="2.2"
            />
            <circle r="4.2" fill={isWon ? '#d1fae5' : '#fff5dc'} />
          </motion.g>
        </svg>

        {/* Quiet Top Header Labels */}
        <div className="pointer-events-none absolute inset-x-5 sm:inset-x-8 top-4 flex items-center justify-between text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.26em] text-ivory-100/55">
          <span>Quarantine Lab · 4×4 Grid</span>
          <span>Click Adjacent Room or Use Arrow Keys</span>
        </div>
      </div>
    </div>
  );
};

