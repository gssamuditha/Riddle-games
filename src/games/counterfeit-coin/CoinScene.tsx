import React from 'react';
import { motion } from 'framer-motion';
import type { ThemeMode } from '../../core/types';
import {
  formatOutcomeLabel,
  type CoinDeductionMark,
  type CoinGameState,
  type CoinId,
  type ScaleOutcome,
} from './engine';

interface CoinSceneProps {
  state: CoinGameState;
  coinMarks: Record<CoinId, CoinDeductionMark>;
  activeTilt: ScaleOutcome | 'idle';
  isWeighing: boolean;
  theme: ThemeMode;
  onRemoveCoinFromPan: (coin: CoinId) => void;
}

const MARK_BADGE_STYLE: Record<
  Exclude<CoinDeductionMark, 'unweighed'>,
  { symbol: string; fill: string; text: string }
> = {
  heavier: { symbol: '+', fill: '#c44536', text: '#fff8ee' },
  lighter: { symbol: '−', fill: '#0284c7', text: '#f0f9ff' },
  genuine: { symbol: '✓', fill: '#2f855a', text: '#ecfdf5' },
  either: { symbol: '±', fill: '#475569', text: '#f8fafc' },
};

export const CoinScene: React.FC<CoinSceneProps> = ({
  state,
  coinMarks,
  activeTilt,
  isWeighing,
  theme,
  onRemoveCoinFromPan,
}) => {
  const isLight = theme === 'light';
  const isRevealed = state.status !== 'playing';

  // Beam rotation angle (degrees): Left Heavy tilts counter-clockwise (-12), Right Heavy (+12)
  const beamAngle =
    activeTilt === 'left_heavy' ? -12 : activeTilt === 'right_heavy' ? 12 : 0;

  // Vertical displacement of hanging pans matching sin(12 deg) * halfBeam(185px) ~= 38px
  const leftPanDy = activeTilt === 'left_heavy' ? 36 : activeTilt === 'right_heavy' ? -36 : 0;
  const rightPanDy = -leftPanDy;

  const leftPanRole: 'heavier' | 'lighter' | 'equal' | null =
    activeTilt === 'left_heavy'
      ? 'heavier'
      : activeTilt === 'right_heavy'
        ? 'lighter'
        : activeTilt === 'balanced'
          ? 'equal'
          : null;

  const rightPanRole: 'heavier' | 'lighter' | 'equal' | null =
    activeTilt === 'right_heavy'
      ? 'heavier'
      : activeTilt === 'left_heavy'
        ? 'lighter'
        : activeTilt === 'balanced'
          ? 'equal'
          : null;

  const palette = isLight
    ? {
      bgTop: '#232c3d',
      bgBot: '#192130',
      deskTop: '#2f3747',
      deskBot: '#181e29',
      brass: '#d4a157',
      brassDark: '#8c6530',
    }
    : {
      bgTop: '#080b12',
      bgBot: '#101624',
      deskTop: '#1a202e',
      deskBot: '#0a0d14',
      brass: '#c99754',
      brassDark: '#755324',
    };

  const renderPanCoins = (coins: CoinId[], centerX: number, panTopY: number) => {
    const count = coins.length;
    if (count === 0) return null;
    // Arrange coins cleanly in stacked rows of up to 4 on the brass pan
    const maxPerRow = 4;
    return coins.map((coin, idx) => {
      const row = Math.floor(idx / maxPerRow);
      const col = idx % maxPerRow;
      const rowCount = Math.min(maxPerRow, count - row * maxPerRow);
      const spacing = 30;
      const x = centerX + (col - (rowCount - 1) / 2) * spacing;
      const y = panTopY - 13 - row * 27;
      const mark = coinMarks[coin];
      const badge = mark !== 'unweighed' ? MARK_BADGE_STYLE[mark] : null;

      return (
        <g
          key={coin}
          transform={`translate(${x}, ${y})`}
          onClick={() => !isWeighing && !isRevealed && onRemoveCoinFromPan(coin)}
          className={!isWeighing && !isRevealed ? 'cursor-pointer' : 'cursor-default'}
        >
          <circle r="12" fill="#d48d2a" stroke="#fff0c4" strokeWidth="1.3" />
          <circle r="9.2" fill="none" stroke="#9e6216" strokeWidth="0.8" />
          <text
            x="0"
            y="3.6"
            textAnchor="middle"
            fill="#14110b"
            fontSize="10.5"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            {coin}
          </text>
          {badge && (
            <g transform="translate(10, -10)">
              <circle r="6.2" fill={badge.fill} stroke="#fff5dc" strokeWidth="0.9" />
              <text
                x="0"
                y="3.2"
                textAnchor="middle"
                fill={badge.text}
                fontSize="9.5"
                fontWeight="800"
                fontFamily="JetBrains Mono, monospace"
              >
                {badge.symbol}
              </text>
            </g>
          )}
        </g>
      );
    });
  };

  const renderPanStatus = (
    centerX: number,
    sideLabel: string,
    coinCount: number,
    role: 'heavier' | 'lighter' | 'equal' | null
  ) => {
    if (!role) {
      return (
        <text
          x={centerX}
          y="287"
          textAnchor="middle"
          fill="#f3eee4"
          fillOpacity="0.62"
          fontSize="10.5"
          letterSpacing="1.8"
          fontFamily="JetBrains Mono, monospace"
        >
          {sideLabel} ({coinCount})
        </text>
      );
    }

    const cfg =
      role === 'heavier'
        ? {
          emblem: '+',
          label: '+ HEAVIER',
          fill: '#c44536',
          stroke: '#f8b4ab',
          text: '#fff8ee',
        }
        : role === 'lighter'
          ? {
            emblem: '−',
            label: '− LIGHTER',
            fill: '#0369a1',
            stroke: '#7dd3fc',
            text: '#f0f9ff',
          }
          : {
            emblem: '=',
            label: '= EQUAL',
            fill: '#1f6b47',
            stroke: '#6abf94',
            text: '#ecfdf5',
          };

    return (
      <g>
        {/* Crisp +/-/= emblem engraved on the brass pan dish */}
        <text
          x={centerX}
          y="263"
          textAnchor="middle"
          fill={cfg.text}
          fontSize="12"
          fontWeight="800"
          fontFamily="JetBrains Mono, monospace"
        >
          {cfg.emblem}
        </text>
        {/* Clear pill badge beneath pan */}
        <rect
          x={centerX - 52}
          y="274"
          width="104"
          height="21"
          rx="10.5"
          fill={cfg.fill}
          stroke={cfg.stroke}
          strokeWidth="1"
        />
        <text
          x={centerX}
          y="288"
          textAnchor="middle"
          fill={cfg.text}
          fontSize="10.5"
          fontWeight="700"
          letterSpacing="1.4"
          fontFamily="JetBrains Mono, monospace"
        >
          {cfg.label}
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border border-paper-900/12 dark:border-white/[0.07] bg-[#232c3d] dark:bg-ink-900 shadow-[0_24px_65px_-26px_rgba(26,24,21,0.34)] dark:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95)] select-none transition-shadow duration-300">
      <div className="relative w-full aspect-[1000/410] min-h-[240px]">
        <svg
          viewBox="0 0 1000 410"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="mintBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.bgTop} />
              <stop offset="100%" stopColor={palette.bgBot} />
            </linearGradient>
            <radialGradient id="scaleAura" cx="50%" cy="46%" r="48%">
              <stop offset="0%" stopColor="#e8a849" stopOpacity="0.16" />
              <stop offset="100%" stopColor={palette.bgTop} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="mintDesk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.deskTop} />
              <stop offset="100%" stopColor={palette.deskBot} />
            </linearGradient>
          </defs>

          <rect width="1000" height="410" fill="url(#mintBg)" />
          <rect width="1000" height="410" fill="url(#scaleAura)" />

          {/* Apothecary Mint Bench Surface (y = 342) */}
          <rect x="0" y="342" width="1000" height="68" fill="url(#mintDesk)" />
          <line x1="0" y1="342.5" x2="1000" y2="342.5" stroke={palette.brass} strokeOpacity="0.3" strokeWidth="1.4" />

          {/* Central Brass Scale Pedestal & Fulcrum Pillar */}
          <g aria-hidden="true">
            {/* Heavy Weighted Base */}
            <path d="M430 344 H570 L554 326 H446 Z" fill={palette.brassDark} stroke={palette.brass} strokeWidth="1.2" />
            <rect x="466" y="314" width="68" height="12" rx="2" fill={palette.brass} fillOpacity="0.85" />
            {/* Vertical Pillar */}
            <rect x="493" y="102" width="14" height="214" rx="4" fill={palette.brassDark} stroke={palette.brass} strokeWidth="1.2" />
            {/* Top Ornamental Finial */}
            <circle cx="500" cy="96" r="10" fill={palette.brass} />
            <circle cx="500" cy="96" r="4" fill="#fff5dc" />
          </g>

          {/* Animated Tilting Brass Crossbeam (Pivot at 500, 124) */}
          <motion.g
            style={{ originX: '500px', originY: '124px' }}
            animate={{ rotate: beamAngle }}
            transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          >
            <path
              d="M312 124 Q500 112 688 124 Q500 132 312 124 Z"
              fill={palette.brass}
              stroke="#f6d79c"
              strokeOpacity="0.65"
              strokeWidth="1.1"
            />
            {/* Fulcrum Needle Pointer */}
            <polygon points="500,126 496,158 504,158" fill="#f6d79c" />
            {/* End Rings */}
            <circle cx="315" cy="124" r="5" fill="#fff5dc" />
            <circle cx="685" cy="124" r="5" fill="#fff5dc" />
          </motion.g>

          {/* Hanging Left Pan Assembly (Translates smoothly vertically while staying level!) */}
          <motion.g
            animate={{ y: leftPanDy }}
            transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          >
            {/* Three brass suspension chains */}
            <line x1="315" y1="126" x2="255" y2="250" stroke={palette.brass} strokeOpacity="0.6" strokeWidth="1.3" />
            <line x1="315" y1="126" x2="315" y2="250" stroke={palette.brass} strokeOpacity="0.45" strokeWidth="1.1" />
            <line x1="315" y1="126" x2="375" y2="250" stroke={palette.brass} strokeOpacity="0.6" strokeWidth="1.3" />
            {/* Pan Dish */}
            <path
              d="M244 250 H386 Q372 268 315 268 Q258 268 244 250 Z"
              fill={palette.brassDark}
              stroke="#f6d79c"
              strokeOpacity="0.7"
              strokeWidth="1.4"
            />
            {/* Coins placed on Left Pan */}
            {renderPanCoins(state.leftPan, 315, 250)}
            {renderPanStatus(315, 'LEFT', state.leftPan.length, leftPanRole)}
          </motion.g>

          {/* Hanging Right Pan Assembly */}
          <motion.g
            animate={{ y: rightPanDy }}
            transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          >
            <line x1="685" y1="126" x2="625" y2="250" stroke={palette.brass} strokeOpacity="0.6" strokeWidth="1.3" />
            <line x1="685" y1="126" x2="685" y2="250" stroke={palette.brass} strokeOpacity="0.45" strokeWidth="1.1" />
            <line x1="685" y1="126" x2="745" y2="250" stroke={palette.brass} strokeOpacity="0.6" strokeWidth="1.3" />
            <path
              d="M614 250 H756 Q742 268 685 268 Q628 268 614 250 Z"
              fill={palette.brassDark}
              stroke="#f6d79c"
              strokeOpacity="0.7"
              strokeWidth="1.4"
            />
            {renderPanCoins(state.rightPan, 685, 250)}
            {renderPanStatus(685, 'RIGHT', state.rightPan.length, rightPanRole)}
          </motion.g>

          {/* Subtle Scale Mark Key on the Bench Surface */}
          <g transform="translate(500, 380)" aria-hidden="true">
            <g transform="translate(-210, 0)">
              <circle cx="0" cy="-3.5" r="7" fill="#c44536" />
              <text x="0" y="0" textAnchor="middle" fill="#fff8ee" fontSize="10" fontWeight="800" fontFamily="JetBrains Mono, monospace">+</text>
              <text x="13" y="0" fill="#f3eee4" fillOpacity="0.72" fontSize="10.5" fontFamily="Plus Jakarta Sans, sans-serif">Possible Heavier</text>
            </g>
            <g transform="translate(-62, 0)">
              <circle cx="0" cy="-3.5" r="7" fill="#0284c7" />
              <text x="0" y="0" textAnchor="middle" fill="#f0f9ff" fontSize="10" fontWeight="800" fontFamily="JetBrains Mono, monospace">−</text>
              <text x="13" y="0" fill="#f3eee4" fillOpacity="0.72" fontSize="10.5" fontFamily="Plus Jakarta Sans, sans-serif">Possible Lighter</text>
            </g>
            <g transform="translate(82, 0)">
              <circle cx="0" cy="-3.5" r="7" fill="#2f855a" />
              <text x="0" y="0" textAnchor="middle" fill="#ecfdf5" fontSize="9.5" fontWeight="800" fontFamily="JetBrains Mono, monospace">✓</text>
              <text x="13" y="0" fill="#f3eee4" fillOpacity="0.72" fontSize="10.5" fontFamily="Plus Jakarta Sans, sans-serif">Genuine</text>
            </g>
            <g transform="translate(174, 0)">
              <circle cx="0" cy="-3.5" r="7" fill="#475569" />
              <text x="0" y="0" textAnchor="middle" fill="#f8fafc" fontSize="9.5" fontWeight="800" fontFamily="JetBrains Mono, monospace">±</text>
              <text x="13" y="0" fill="#f3eee4" fillOpacity="0.72" fontSize="10.5" fontFamily="Plus Jakarta Sans, sans-serif">Either</text>
            </g>
          </g>

          {/* Scale Outcome Readout Etched Above Fulcrum */}
          <text
            x="500"
            y="60"
            textAnchor="middle"
            fill={
              activeTilt === 'balanced'
                ? '#6abf94'
                : activeTilt === 'idle'
                  ? '#f3eee4'
                  : '#efc06e'
            }
            fillOpacity={activeTilt === 'idle' ? 0.45 : 0.95}
            fontSize="12"
            fontWeight="600"
            letterSpacing="3"
            fontFamily="JetBrains Mono, monospace"
          >
            {activeTilt === 'idle' ? 'READY TO WEIGH' : formatOutcomeLabel(activeTilt).toUpperCase()}
          </text>
        </svg>

        {/* Quiet Top Labels */}
        <div className="pointer-events-none absolute inset-x-5 sm:inset-x-8 top-4 flex items-center justify-between text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.26em] text-ivory-100/55">
          <span>Royal Mint Balance</span>
          <span>Tap Coin on Pan to Remove</span>
        </div>
      </div>
    </div>
  );
};

