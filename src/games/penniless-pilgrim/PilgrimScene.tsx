import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ThemeMode } from '../../core/types';
import {
  DIRECTION_RULES,
  formatTax,
  GATE_COORD,
  getDirectionBetween,
  getValidMovesFrom,
  GRID_MAX,
  INITIAL_ENTRY_EDGES,
  isSameCoord,
  makeEdgeKey,
  TEMPLE_COORD,
  type Direction,
  type GridCoord,
  type PilgrimGameState,
} from './engine';

interface PilgrimSceneProps {
  state: PilgrimGameState;
  theme: ThemeMode;
  onStep: (dir: Direction) => void;
}

// Grid geometry inside viewBox 1000x440:
// Centered spacious 4x4 city blocks (5x5 intersections)
const GRID_ORIGIN_X = 280;
const GRID_ORIGIN_Y = 58;
const CELL_W = 110;
const CELL_H = 82;

function toSvgPoint(coord: GridCoord): { x: number; y: number } {
  return {
    x: GRID_ORIGIN_X + coord.col * CELL_W,
    y: GRID_ORIGIN_Y + coord.row * CELL_H,
  };
}

// Precompute all 40 city street edges (20 horizontal + 20 vertical)
const ALL_GRID_EDGES: { a: GridCoord; b: GridCoord; key: string }[] = [];
for (let r = 0; r <= GRID_MAX; r++) {
  for (let c = 0; c <= GRID_MAX; c++) {
    if (c < GRID_MAX) {
      const a = { row: r, col: c };
      const b = { row: r, col: c + 1 };
      ALL_GRID_EDGES.push({ a, b, key: makeEdgeKey(a, b) });
    }
    if (r < GRID_MAX) {
      const a = { row: r, col: c };
      const b = { row: r + 1, col: c };
      ALL_GRID_EDGES.push({ a, b, key: makeEdgeKey(a, b) });
    }
  }
}

const ALL_NODES: GridCoord[] = [];
for (let r = 0; r <= GRID_MAX; r++) {
  for (let c = 0; c <= GRID_MAX; c++) {
    ALL_NODES.push({ row: r, col: c });
  }
}

export const PilgrimScene: React.FC<PilgrimSceneProps> = ({ state, theme, onStep }) => {
  const [hoveredDir, setHoveredDir] = useState<Direction | null>(null);
  const isLight = theme === 'light';
  const isWon = state.status === 'won';

  const validMoves = state.status === 'playing' ? getValidMovesFrom(state.position, state.usedEdges) : [];
  const validByCoord = new Map<string, Direction>();
  for (const m of validMoves) {
    validByCoord.set(`${m.to.row},${m.to.col}`, m.dir);
  }

  const entryEdgeSet = new Set(INITIAL_ENTRY_EDGES);
  const walkedEdgeSet = new Set(state.moves.map((m) => m.edgeKey));
  const pilgrimPt = toSvgPoint(state.position);
  const gatePt = toSvgPoint(GATE_COORD);
  const templePt = toSvgPoint(TEMPLE_COORD);

  const palette = isLight
    ? {
        bgTop: '#243042',
        bgBot: '#1b2433',
        blockFill: '#2c3a4f',
        streetIdle: '#4a5c78',
        nodeIdle: '#5a6e8c',
        brass: '#d4a157',
      }
    : {
        bgTop: '#090c14',
        bgBot: '#0f1522',
        blockFill: '#121929',
        streetIdle: '#26334a',
        nodeIdle: '#344563',
        brass: '#c99754',
      };

  const previewTax =
    hoveredDir && state.status === 'playing'
      ? DIRECTION_RULES[hoveredDir].applyTax(state.tax)
      : null;

  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border border-paper-900/12 dark:border-white/[0.07] bg-[#243042] dark:bg-ink-900 shadow-[0_24px_65px_-26px_rgba(26,24,21,0.34)] dark:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95)] select-none transition-shadow duration-300">
      <div className="relative w-full aspect-[1000/440] min-h-[260px]">
        <svg
          viewBox="0 0 1000 440"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="duoniaMapBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.bgTop} />
              <stop offset="100%" stopColor={palette.bgBot} />
            </linearGradient>
            <radialGradient id="pilgrimGlow" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor={state.tax < 0 ? '#56ccf2' : '#efc06e'}
                stopOpacity="0.45"
              />
              <stop offset="100%" stopColor={palette.bgTop} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="templeWinGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6abf94" stopOpacity="0.48" />
              <stop offset="100%" stopColor={palette.bgTop} stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="1000" height="440" fill="url(#duoniaMapBg)" />

          {/* Subtle Decorative City Wall Border Around the 4x4 Grid */}
          <rect
            x={GRID_ORIGIN_X - 28}
            y={GRID_ORIGIN_Y - 24}
            width={CELL_W * GRID_MAX + 56}
            height={CELL_H * GRID_MAX + 48}
            rx="16"
            fill="none"
            stroke={palette.brass}
            strokeOpacity="0.22"
            strokeWidth="1.2"
          />

          {/* 16 Subtle Architectural City Blocks Inside the Streets */}
          {Array.from({ length: GRID_MAX }, (_, r) =>
            Array.from({ length: GRID_MAX }, (_, c) => (
              <rect
                key={`blk-${r}-${c}`}
                x={GRID_ORIGIN_X + c * CELL_W + 14}
                y={GRID_ORIGIN_Y + r * CELL_H + 12}
                width={CELL_W - 28}
                height={CELL_H - 24}
                rx="6"
                fill={palette.blockFill}
                fillOpacity="0.52"
                stroke="#ffffff"
                strokeOpacity="0.04"
                strokeWidth="1"
              />
            ))
          )}

          {/* Left Compass Rose Legend Etched Directly on the Map */}
          <g transform="translate(115, 220)" aria-hidden="true">
            <circle cx="0" cy="0" r="54" stroke={palette.brass} strokeOpacity="0.22" strokeWidth="1" fill="none" />
            <circle cx="0" cy="0" r="3" fill={palette.brass} fillOpacity="0.65" />
            <line x1="0" y1="-34" x2="0" y2="34" stroke={palette.brass} strokeOpacity="0.3" strokeWidth="1" />
            <line x1="-34" y1="0" x2="34" y2="0" stroke={palette.brass} strokeOpacity="0.3" strokeWidth="1" />
            <text x="0" y="-42" textAnchor="middle" fill="#f3eee4" fillOpacity="0.82" fontSize="11" fontFamily="JetBrains Mono, monospace">
              N ÷2
            </text>
            <text x="0" y="50" textAnchor="middle" fill="#f3eee4" fillOpacity="0.82" fontSize="11" fontFamily="JetBrains Mono, monospace">
              S ×2
            </text>
            <text x="58" y="4" textAnchor="start" fill="#efc06e" fontSize="11" fontFamily="JetBrains Mono, monospace">
              E +2
            </text>
            <text x="-58" y="4" textAnchor="end" fill="#7dd3fc" fontSize="11" fontFamily="JetBrains Mono, monospace">
              W −2
            </text>
          </g>

          {/* Right Live Tax Preview / Landmark Key */}
          <g transform="translate(888, 215)" aria-hidden="true">
            <text x="0" y="-34" textAnchor="middle" fill="#f3eee4" fillOpacity="0.5" fontSize="10" letterSpacing="2" fontFamily="Plus Jakarta Sans, sans-serif">
              {previewTax !== null ? 'NEXT TAX' : 'CURRENT TAX'}
            </text>
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill={
                (previewTax ?? state.tax) === 0
                  ? '#6abf94'
                  : (previewTax ?? state.tax) < 0
                  ? '#7dd3fc'
                  : '#efc06e'
              }
              fontSize="28"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              {formatTax(previewTax ?? state.tax)}
            </text>
            <text x="0" y="22" textAnchor="middle" fill="#f3eee4" fillOpacity="0.5" fontSize="10" fontFamily="Plus Jakarta Sans, sans-serif">
              {previewTax !== null
                ? `(${DIRECTION_RULES[hoveredDir!].label} ${DIRECTION_RULES[hoveredDir!].opText})`
                : state.tax < 0
                ? 'credit below zero'
                : 'silver owed'}
            </text>
          </g>

          {/* All 40 Street Segments */}
          {ALL_GRID_EDGES.map(({ a, b, key }) => {
            const p1 = toSvgPoint(a);
            const p2 = toSvgPoint(b);
            const isEntry = entryEdgeSet.has(key);
            const isWalked = walkedEdgeSet.has(key);

            return (
              <g key={key}>
                {/* Base street bed */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={palette.streetIdle}
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Mandatory initial entry road (0,0)->(0,1)->(0,2) */}
                {isEntry && (
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#b88848"
                    strokeOpacity="0.72"
                    strokeWidth="4.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                  />
                )}

                {/* Player's Illuminated Walked Street Trail */}
                {isWalked && (
                  <motion.line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isWon ? '#6abf94' : '#efc06e'}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.92 }}
                    transition={{ duration: 0.25 }}
                  />
                )}
              </g>
            );
          })}

          {/* Hover Preview Line to Adjacent Reachable Intersection */}
          {hoveredDir && state.status === 'playing' && (() => {
            const r = DIRECTION_RULES[hoveredDir];
            const nextPt = toSvgPoint({
              row: state.position.row + r.dr,
              col: state.position.col + r.dc,
            });
            return (
              <line
                x1={pilgrimPt.x}
                y1={pilgrimPt.y}
                x2={nextPt.x}
                y2={nextPt.y}
                stroke="#f6d79c"
                strokeOpacity="0.75"
                strokeWidth="3.5"
                strokeDasharray="5 5"
                strokeLinecap="round"
              />
            );
          })()}

          {/* NW Entry Gate Marker (0, 0) */}
          <g transform={`translate(${gatePt.x}, ${gatePt.y})`}>
            <circle r="8" fill="#182030" stroke="#b88848" strokeWidth="1.5" />
            <text x="0" y="-15" textAnchor="middle" fill="#efc06e" fillOpacity="0.7" fontSize="9.5" letterSpacing="1.6" fontFamily="JetBrains Mono, monospace">
              GATE
            </text>
          </g>

          {/* SE Golden Temple Destination Marker (4, 4) */}
          <g transform={`translate(${templePt.x}, ${templePt.y})`}>
            {isWon && <circle r="38" fill="url(#templeWinGlow)" className="animate-flame-breathe" />}
            <circle
              r="16"
              fill={isWon ? '#17382b' : '#252118'}
              stroke={isWon ? '#6abf94' : '#efc06e'}
              strokeWidth="2"
            />
            {/* Minimalist Temple Dome Silhouette */}
            <path
              d="M-8 5 H8 V1 C8 -4 4 -8 0 -9 C-4 -8 -8 -4 -8 1 Z"
              fill={isWon ? '#8be0b5' : '#efc06e'}
            />
            <text
              x="0"
              y="30"
              textAnchor="middle"
              fill={isWon ? '#7cd9a8' : '#efc06e'}
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.8"
              fontFamily="JetBrains Mono, monospace"
            >
              TEMPLE (0)
            </text>
          </g>

          {/* All 25 Street Intersections (Valid Neighbors are Interactive!) */}
          {ALL_NODES.map((node) => {
            const pt = toSvgPoint(node);
            const dir = validByCoord.get(`${node.row},${node.col}`) ?? null;
            const isCurrent = isSameCoord(node, state.position);
            const isTemple = isSameCoord(node, TEMPLE_COORD);
            const isGate = isSameCoord(node, GATE_COORD);

            if (dir) {
              const rule = DIRECTION_RULES[dir];
              const isHov = hoveredDir === dir;
              return (
                <g
                  key={`node-${node.row}-${node.col}`}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onMouseEnter={() => setHoveredDir(dir)}
                  onMouseLeave={() => setHoveredDir(null)}
                  onClick={() => {
                    setHoveredDir(null);
                    onStep(dir);
                  }}
                  className="cursor-pointer"
                >
                  {/* Generous invisible hit area */}
                  <circle r="24" fill="transparent" />
                  {/* Soft pulsing reachable ring */}
                  <motion.circle
                    r={isHov ? 16 : 13}
                    fill={isHov ? '#efc06e' : '#f6d79c'}
                    fillOpacity={isHov ? 0.28 : 0.14}
                    stroke="#efc06e"
                    strokeOpacity={isHov ? 0.95 : 0.65}
                    strokeWidth="1.5"
                    animate={{ scale: isHov ? 1.08 : [1, 1.1, 1] }}
                    transition={{ repeat: isHov ? 0 : Infinity, duration: 2.2 }}
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill="#fff5dc"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="JetBrains Mono, monospace"
                    className="pointer-events-none"
                  >
                    {rule.opText}
                  </text>
                </g>
              );
            }

            if (isCurrent || isTemple || isGate) return null;

            return (
              <circle
                key={`node-${node.row}-${node.col}`}
                cx={pt.x}
                cy={pt.y}
                r="4.2"
                fill={palette.nodeIdle}
                onClick={() => {
                  const adjacent = getDirectionBetween(state.position, node);
                  if (adjacent) onStep(adjacent);
                }}
              />
            );
          })}

          {/* Animated Pilgrim Lantern Token Gliding Smoothly Along Streets */}
          <motion.g
            animate={{ x: pilgrimPt.x, y: pilgrimPt.y }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="pointer-events-none"
          >
            <circle r="30" fill="url(#pilgrimGlow)" />
            <circle
              r="11.5"
              fill={state.tax < 0 ? '#0e2c3d' : '#241c12'}
              stroke={state.tax < 0 ? '#7dd3fc' : '#f6d79c'}
              strokeWidth="2.2"
            />
            <circle
              r="4.5"
              fill={state.tax < 0 ? '#bae6fd' : '#fff5d6'}
            />
          </motion.g>
        </svg>

        {/* Quiet Top Etched Header Labels */}
        <div className="pointer-events-none absolute inset-x-5 sm:inset-x-8 top-4 flex items-center justify-between text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.26em] text-ivory-100/55">
          <span>City of Duonia · 4×4 Grid</span>
          <span>Click Glowing Corner or Use Arrow Keys</span>
        </div>
      </div>
    </div>
  );
};

