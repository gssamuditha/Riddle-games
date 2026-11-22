import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ThemeMode } from '../../core/types';
import {
  TRAVELER_MAP,
  getTravelersOnBank,
  type Bank,
  type BridgeGameState,
  type TravelerId,
} from './engine';
import { BrassLanternIcon, TravelerFigure } from './TravelerAvatar';

export interface ActiveCrossingAnimation {
  travelers: TravelerId[];
  from: Bank;
  to: Bank;
  durationMs: number;
}

interface BridgeSceneProps {
  state: BridgeGameState;
  crossing: ActiveCrossingAnimation | null;
  theme: ThemeMode;
  onToggleTraveler: (id: TravelerId) => void;
}

const STARS = [
  { x: 95, y: 42, r: 1.1, d: '0s' },
  { x: 188, y: 68, r: 0.85, d: '1.6s' },
  { x: 282, y: 36, r: 1.25, d: '0.7s' },
  { x: 374, y: 64, r: 0.9, d: '2.4s' },
  { x: 635, y: 44, r: 1.15, d: '1.1s' },
  { x: 742, y: 74, r: 0.95, d: '2.9s' },
  { x: 836, y: 40, r: 1.2, d: '0.4s' },
  { x: 924, y: 72, r: 0.9, d: '2.1s' },
];

const EMBERS = [
  { x: '34%', delay: '0s', duration: '7.5s', size: 2.5 },
  { x: '45%', delay: '2.1s', duration: '6.8s', size: 2 },
  { x: '53%', delay: '3.8s', duration: '8.2s', size: 3 },
  { x: '62%', delay: '1.3s', duration: '7.2s', size: 2 },
  { x: '70%', delay: '4.6s', duration: '9s', size: 2.5 },
];

const LEFT_SLOTS: Record<TravelerId, { leftPct: number; scale: number }> = {
  orin: { leftPct: 4.5, scale: 1.0 },
  garrick: { leftPct: 10.5, scale: 1.0 },
  tomas: { leftPct: 16.2, scale: 0.96 },
  lyra: { leftPct: 21.5, scale: 0.94 },
};

const RIGHT_SLOTS: Record<TravelerId, { leftPct: number; scale: number }> = {
  lyra: { leftPct: 77.5, scale: 0.94 },
  tomas: { leftPct: 82.8, scale: 0.96 },
  garrick: { leftPct: 88.2, scale: 1.0 },
  orin: { leftPct: 93.8, scale: 1.0 },
};

export const BridgeScene: React.FC<BridgeSceneProps> = ({
  state,
  crossing,
  theme,
  onToggleTraveler,
}) => {
  const isLight = theme === 'light';
  const remaining = Math.max(0, state.timeLimit - state.elapsedMinutes);
  const isCritical = state.status === 'playing' && remaining <= 5;
  const isCollapsed = state.status === 'lost';
  const isWon = state.status === 'won';

  const crossingSet = new Set(crossing?.travelers ?? []);
  const leftTravelers = getTravelersOnBank(state, 'left').filter((t) => !crossingSet.has(t.id));
  const rightTravelers = getTravelersOnBank(state, 'right').filter((t) => !crossingSet.has(t.id));

  const crossingWeight = crossing
    ? crossing.travelers.reduce((acc, id) => acc + (TRAVELER_MAP[id].time >= 5 ? 8 : 4), 0)
    : 0;
  const bridgeMidSag = 26 + crossingWeight;

  const planks = Array.from({ length: 16 }, (_, idx) => {
    const t = idx / 15;
    const x = 266 + t * 468;
    const y = 276 + Math.sin(t * Math.PI) * bridgeMidSag;
    return { x, y, idx };
  });

  const lanternTargetPct = crossing
    ? crossing.to === 'right'
      ? 75
      : 25
    : state.lanternSide === 'left'
    ? 22
    : 78;

  // Harmonized Twilight Dusk Slate (Light Mode) vs. Deep Nocturne Midnight (Dark Mode)
  const palette = isLight
    ? {
        skyTop: '#243045',
        skyMid: '#364663',
        skyBottom: '#4e5f7d',
        moonMask: '#2e3c54',
        peakFar: '#2e3b52',
        peakNear: '#36445d',
        mistA: '#5c6e8e',
        mistB: '#6a7c9c',
        fogMid: '#34425a',
        fogBottom: '#1c2434',
        cliffTopL: '#2b3445',
        cliffBotL: '#181e29',
        cliffTopR: '#2e384a',
        cliffBotR: '#181e29',
        ruins: '#232c3d',
        anchor: '#3b465c',
      }
    : {
        skyTop: '#07090f',
        skyMid: '#101521',
        skyBottom: '#192131',
        moonMask: '#0c101a',
        peakFar: '#0d121d',
        peakNear: '#111725',
        mistA: '#1e2a3f',
        mistB: '#24324a',
        fogMid: '#141c2b',
        fogBottom: '#07090f',
        cliffTopL: '#1a202c',
        cliffBotL: '#0c0f15',
        cliffTopR: '#1c2330',
        cliffBotR: '#0c0f15',
        ruins: '#111621',
        anchor: '#232b3b',
      };

  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border border-paper-900/12 dark:border-white/[0.07] bg-[#243045] dark:bg-ink-900 shadow-[0_24px_65px_-26px_rgba(26,24,21,0.34)] dark:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95)] select-none transition-shadow duration-300">
      {/* Main Theatrical Stage (exact 1000:440 aspect lock so feet align flush with cliff rock) */}
      <motion.div
        className="relative w-full aspect-[1000/440] min-h-[250px]"
        animate={
          isCollapsed
            ? { x: [0, -6, 5, -4, 3, 0], y: [0, 3, -2, 2, 0] }
            : isCritical
            ? { x: [0, -1, 1, -0.5, 0] }
            : { x: 0, y: 0 }
        }
        transition={
          isCollapsed
            ? { duration: 0.55, ease: 'easeOut' }
            : isCritical
            ? { repeat: Infinity, duration: 2.2, repeatDelay: 1.8 }
            : { duration: 0.3 }
        }
      >
        {/* Architectural Atmospheric Night / Twilight Canvas */}
        <svg
          viewBox="0 0 1000 440"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="nocturneSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.skyTop} />
              <stop offset="55%" stopColor={palette.skyMid} />
              <stop offset="100%" stopColor={palette.skyBottom} />
            </linearGradient>
            <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f6ead3" stopOpacity="0.28" />
              <stop offset="50%" stopColor="#94a9c9" stopOpacity="0.08" />
              <stop offset="100%" stopColor={palette.skyTop} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="winAurora" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6abf94" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#e8a849" stopOpacity="0.1" />
              <stop offset="100%" stopColor={palette.skyTop} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gorgeFog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.fogMid} stopOpacity="0" />
              <stop offset="58%" stopColor={palette.fogMid} stopOpacity="0.72" />
              <stop offset="100%" stopColor={palette.fogBottom} stopOpacity="0.98" />
            </linearGradient>
            <linearGradient id="cliffStoneL" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={palette.cliffTopL} />
              <stop offset="100%" stopColor={palette.cliffBotL} />
            </linearGradient>
            <linearGradient id="cliffStoneR" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.cliffTopR} />
              <stop offset="100%" stopColor={palette.cliffBotR} />
            </linearGradient>
          </defs>

          <rect width="1000" height="440" fill="url(#nocturneSky)" />

          {isWon && (
            <motion.rect
              width="1000"
              height="440"
              fill="url(#winAurora)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4 }}
            />
          )}

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

          {/* Crescent Moon */}
          <circle cx="500" cy="96" r="88" fill="url(#moonHalo)" />
          <circle cx="500" cy="96" r="24" fill="#f7ebd4" fillOpacity="0.92" />
          <circle cx="508" cy="91" r="21.5" fill={palette.moonMask} />

          {/* Distant Mountain Ridges */}
          <path
            d="M0 280 L145 190 L268 238 L412 162 L548 228 L690 168 L838 225 L1000 185 L1000 440 L0 440 Z"
            fill={palette.peakFar}
            opacity="0.72"
          />
          <path
            d="M0 310 L185 245 L335 285 L500 225 L665 280 L820 240 L1000 290 L1000 440 L0 440 Z"
            fill={palette.peakNear}
            opacity="0.68"
          />

          {/* Drifting Gorge Mist */}
          <g className="animate-mist-drift-slow" opacity="0.45">
            <ellipse cx="330" cy="378" rx="260" ry="44" fill={palette.mistA} />
            <ellipse cx="690" cy="392" rx="270" ry="48" fill={palette.mistA} />
          </g>
          <g className="animate-mist-drift-reverse" opacity="0.32">
            <ellipse cx="500" cy="358" rx="310" ry="38" fill={palette.mistB} />
          </g>

          {/* Left Cliff — Observatory Ruins */}
          <g>
            <path
              d="M38 192 C38 152 74 134 108 152 L112 192 Z"
              fill={palette.ruins}
              stroke="#ffffff"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
            <rect x="28" y="192" width="96" height="82" fill={palette.ruins} />
            <path
              d="M62 232 C62 216 78 216 78 232 V250 H62 Z"
              fill="#e8a849"
              fillOpacity="0.18"
            />

            <path
              d="M0 272 L262 272 L276 288 L244 352 L258 440 L0 440 Z"
              fill="url(#cliffStoneL)"
              stroke="#ffffff"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
            <motion.line
              x1="0"
              y1="272.5"
              x2="262"
              y2="272.5"
              stroke="#e8a849"
              strokeWidth="1.5"
              animate={{
                strokeOpacity: state.lanternSide === 'left' && !isCollapsed ? 0.52 : 0.08,
              }}
              transition={{ duration: 0.6 }}
            />
            <rect
              x="248"
              y="236"
              width="14"
              height="38"
              rx="2"
              fill={palette.anchor}
              stroke="#ffffff"
              strokeOpacity="0.12"
            />
            {(isCritical || isCollapsed) && (
              <motion.path
                initial={{ strokeDashoffset: 120, opacity: 0 }}
                animate={{ strokeDashoffset: 0, opacity: 0.85 }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
                d="M242 273 L230 302 L244 326 L226 364"
                stroke="#d45d4c"
                strokeWidth="2"
                strokeDasharray="120"
                fill="none"
              />
            )}
          </g>

          {/* Right Cliff — Sanctuary Ridge */}
          <g>
            <rect
              x="908"
              y="182"
              width="24"
              height="90"
              rx="2"
              fill={palette.ruins}
              stroke="#ffffff"
              strokeOpacity="0.08"
            />
            <path d="M902 182 H938 L932 169 H908 Z" fill={palette.anchor} />
            {isWon && (
              <motion.g
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ originX: '920px', originY: '165px' }}
              >
                <circle
                  cx="920"
                  cy="154"
                  r="44"
                  fill="#6abf94"
                  fillOpacity="0.24"
                  className="animate-flame-breathe"
                />
                <path
                  d="M920 124 C929 138 932 146 932 155 C932 162 926.5 167 920 167 C913.5 167 908 162 908 155 C908 146 911 138 920 124 Z"
                  fill="#6abf94"
                />
                <path
                  d="M920 138 C924 145 925.5 150 925.5 155 C925.5 159 923 162 920 162 C917 162 914.5 159 914.5 155 C914.5 150 916 145 920 138 Z"
                  fill="#e6faef"
                />
              </motion.g>
            )}

            <path
              d="M1000 272 L738 272 L724 288 L754 352 L742 440 L1000 440 Z"
              fill="url(#cliffStoneR)"
              stroke="#ffffff"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
            <motion.line
              x1="738"
              y1="272.5"
              x2="1000"
              y2="272.5"
              stroke={isWon ? '#6abf94' : '#e8a849'}
              strokeWidth="1.5"
              animate={{
                strokeOpacity: isWon
                  ? 0.7
                  : state.lanternSide === 'right' && !isCollapsed
                  ? 0.52
                  : 0.08,
              }}
              transition={{ duration: 0.6 }}
            />
            <rect
              x="738"
              y="236"
              width="14"
              height="38"
              rx="2"
              fill={palette.anchor}
              stroke="#ffffff"
              strokeOpacity="0.12"
            />
          </g>

          {/* Dynamic Physics Suspension Bridge */}
          {!isCollapsed ? (
            <motion.g
              animate={{ y: crossing ? [0, 3.5, 1.5, 0] : [0, 1.4, 0] }}
              transition={{
                duration: crossing ? crossing.durationMs / 1000 : 5.5,
                repeat: crossing ? 0 : Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.path
                animate={{ d: `M262 242 Q500 ${266 + bridgeMidSag * 0.72} 738 242` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                stroke="#9a8060"
                strokeOpacity="0.55"
                strokeWidth="2"
                fill="none"
              />
              <motion.path
                animate={{ d: `M260 276 Q500 ${276 + bridgeMidSag * 2} 740 276` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                stroke="#b59469"
                strokeWidth="2.8"
                fill="none"
              />
              {planks.map((p) => {
                const railY = 242 + Math.sin((p.idx / 15) * Math.PI) * (12 + bridgeMidSag * 0.4);
                return (
                  <g key={p.idx}>
                    <line
                      x1={p.x}
                      y1={railY}
                      x2={p.x}
                      y2={p.y}
                      stroke="#917756"
                      strokeOpacity="0.48"
                      strokeWidth="1.2"
                    />
                    <rect
                      x={p.x - 11}
                      y={p.y - 2.5}
                      width="22"
                      height="5.2"
                      rx="1.2"
                      fill="#69472a"
                      stroke="#a67c52"
                      strokeOpacity="0.72"
                      strokeWidth="0.8"
                    />
                  </g>
                );
              })}
              <motion.path
                animate={{ d: `M262 248 Q500 ${274 + bridgeMidSag * 0.75} 738 248` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                stroke="#caa575"
                strokeWidth="2.4"
                fill="none"
              />
            </motion.g>
          ) : (
            <g>
              <motion.path
                initial={{ d: 'M262 246 Q380 285 495 285' }}
                animate={{ d: 'M262 246 Q295 340 316 436' }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                stroke="#b08e64"
                strokeWidth="2.4"
                fill="none"
              />
              <motion.path
                initial={{ d: 'M738 246 Q620 285 505 285' }}
                animate={{ d: 'M738 246 Q705 340 684 436' }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                stroke="#b08e64"
                strokeWidth="2.4"
                fill="none"
              />
            </g>
          )}

          {/* Deep Gorge Foreground Mist */}
          <rect y="335" width="1000" height="105" fill="url(#gorgeFog)" />
        </svg>

        {/* Subtle Drifting Ambient Embers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {EMBERS.map((e, idx) => (
            <span
              key={idx}
              className="absolute bottom-8 rounded-full bg-gold-300 animate-ember-rise"
              style={{
                left: e.x,
                width: e.size,
                height: e.size,
                animationDelay: e.delay,
                animationDuration: e.duration,
              }}
            />
          ))}
        </div>

        {/* Dynamic Volumetric Lantern Radiance */}
        {!isCollapsed && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute top-[54%] -translate-x-1/2 -translate-y-1/2 h-[320px] w-[320px] sm:h-[400px] sm:w-[400px] rounded-full"
            style={{
              background: isLight
                ? 'radial-gradient(circle, rgba(246,204,122,0.3) 0%, rgba(232,168,73,0.11) 42%, rgba(232,168,73,0) 72%)'
                : 'radial-gradient(circle, rgba(232,168,73,0.24) 0%, rgba(232,168,73,0.08) 42%, rgba(232,168,73,0) 72%)',
            }}
            animate={{ left: `${lanternTargetPct}%` }}
            transition={{
              duration: crossing ? crossing.durationMs / 1000 : 0.65,
              ease: [0.42, 0, 0.2, 1],
            }}
          />
        )}

        {/* Whisper-Quiet Etched Cliff Labels */}
        <div className="pointer-events-none absolute inset-x-5 sm:inset-x-8 top-5 flex items-center justify-between text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.26em]">
          <span
            className={`transition-opacity duration-500 ${
              state.lanternSide === 'left' && !isCollapsed
                ? 'text-gold-200/95'
                : 'text-ivory-100/45'
            }`}
          >
            Observatory Cliff
          </span>
          <span
            className={`transition-opacity duration-500 ${
              isWon
                ? 'text-[#7cd9a8]'
                : state.lanternSide === 'right' && !isCollapsed
                ? 'text-gold-200/95'
                : 'text-ivory-100/45'
            }`}
          >
            Safe Ridge · {getTravelersOnBank(state, 'right').length}/4
          </span>
        </div>

        {/* Standing Full-Body Figures on Left Cliff */}
        {leftTravelers.map((t) => {
          const slot = LEFT_SLOTS[t.id];
          const isActiveBank =
            state.lanternSide === 'left' && state.status === 'playing' && !crossing;
          const isSelected = state.selected.includes(t.id);

          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => !crossing && onToggleTraveler(t.id)}
              disabled={Boolean(crossing) || state.status !== 'playing'}
              initial={{ opacity: 0 }}
              animate={{
                opacity: isActiveBank ? 1 : 0.48,
                x: isSelected ? 10 : 0,
                y: isSelected ? -4 : 0,
                scale: isSelected ? 1.06 : 1,
              }}
              whileHover={isActiveBank ? { y: isSelected ? -6 : -3, scale: 1.05 } : undefined}
              whileTap={isActiveBank ? { scale: 0.97 } : undefined}
              transition={{ type: 'spring', stiffness: 290, damping: 24 }}
              style={{
                left: `${slot.leftPct}%`,
                bottom: '38.2%',
              }}
              className={`group absolute -translate-x-1/2 z-20 flex flex-col items-center focus:outline-none ${
                isActiveBank ? 'cursor-pointer' : 'cursor-default'
              }`}
              title={`${t.name} — ${t.time} min`}
            >
              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    className="pointer-events-none absolute -bottom-1 h-3.5 w-12 rounded-full bg-gold-400/40 blur-md"
                  />
                )}
              </AnimatePresence>

              <TravelerFigure
                id={t.id}
                height={Math.round(74 * slot.scale)}
                isSelected={isSelected}
                lit={state.lanternSide === 'left' && !isCollapsed}
                facing="right"
                className="w-auto h-[50px] sm:h-[74px] lg:h-[82px] origin-bottom"
              />

              <div
                className={`pointer-events-none absolute top-full mt-2 flex flex-col items-center leading-tight whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'text-gold-200'
                    : isActiveBank
                    ? 'text-ivory-100/90 group-hover:text-gold-200'
                    : 'text-ivory-200/50'
                }`}
              >
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">
                  {t.name.split(' ').pop()}
                </span>
                <span
                  className={`font-mono text-[9px] sm:text-[10px] tabular-nums ${
                    isSelected ? 'text-gold-300 font-semibold' : 'text-ivory-200/75'
                  }`}
                >
                  {t.time}m
                </span>
              </div>
            </motion.button>
          );
        })}

        {/* Standing Full-Body Figures on Right Cliff */}
        {rightTravelers.map((t) => {
          const slot = RIGHT_SLOTS[t.id];
          const isActiveBank =
            state.lanternSide === 'right' && state.status === 'playing' && !crossing;
          const isSelected = state.selected.includes(t.id);

          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => !crossing && onToggleTraveler(t.id)}
              disabled={Boolean(crossing) || state.status !== 'playing'}
              initial={{ opacity: 0 }}
              animate={{
                opacity: isActiveBank || isWon ? 1 : 0.65,
                x: isSelected ? -10 : 0,
                y: isSelected ? -4 : 0,
                scale: isSelected ? 1.06 : 1,
              }}
              whileHover={isActiveBank ? { y: isSelected ? -6 : -3, scale: 1.05 } : undefined}
              whileTap={isActiveBank ? { scale: 0.97 } : undefined}
              transition={{ type: 'spring', stiffness: 290, damping: 24 }}
              style={{
                left: `${slot.leftPct}%`,
                bottom: '38.2%',
              }}
              className={`group absolute -translate-x-1/2 z-20 flex flex-col items-center focus:outline-none ${
                isActiveBank ? 'cursor-pointer' : 'cursor-default'
              }`}
              title={`${t.name} — ${t.time} min`}
            >
              <AnimatePresence>
                {isSelected && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    className="pointer-events-none absolute -bottom-1 h-3.5 w-12 rounded-full bg-gold-400/40 blur-md"
                  />
                )}
              </AnimatePresence>

              <TravelerFigure
                id={t.id}
                height={Math.round(74 * slot.scale)}
                isSelected={isSelected}
                lit={state.lanternSide === 'right' || isWon}
                facing="left"
                className="w-auto h-[50px] sm:h-[74px] lg:h-[82px] origin-bottom"
              />

              <div
                className={`pointer-events-none absolute top-full mt-2 flex flex-col items-center leading-tight whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'text-gold-200'
                    : isActiveBank
                    ? 'text-ivory-100/90 group-hover:text-gold-200'
                    : isWon
                    ? 'text-[#8ad4ae]'
                    : 'text-ivory-200/60'
                }`}
              >
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">
                  {t.name.split(' ').pop()}
                </span>
                <span
                  className={`font-mono text-[9px] sm:text-[10px] tabular-nums ${
                    isSelected ? 'text-gold-300 font-semibold' : 'text-ivory-200/75'
                  }`}
                >
                  {t.time}m
                </span>
              </div>
            </motion.button>
          );
        })}

        {/* Resting Brass Lantern */}
        {!crossing && !isCollapsed && (
          <motion.div
            layoutId="sun-lantern-prop"
            className="pointer-events-none absolute z-20 -translate-x-1/2"
            style={{
              left: state.lanternSide === 'left' ? '25.5%' : '74.5%',
              bottom: '37.8%',
            }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
          >
            <BrassLanternIcon size={32} className="w-6 h-6 sm:w-8 sm:h-8" />
          </motion.div>
        )}

        {/* Choreographed Walking Animation Across the Curved Bridge */}
        <AnimatePresence>
          {crossing && (
            <motion.div
              key={`${crossing.from}-${crossing.to}-${crossing.travelers.join('-')}`}
              className="pointer-events-none absolute z-30 -translate-x-1/2 flex items-end gap-0.5"
              style={{ bottom: '37.3%' }}
              initial={{
                left: crossing.from === 'left' ? '26%' : '74%',
                y: 0,
              }}
              animate={{
                left: crossing.to === 'right' ? '74%' : '26%',
                y: [0, 14, 28, 14, 0],
              }}
              transition={{
                left: { duration: crossing.durationMs / 1000, ease: [0.42, 0, 0.25, 1] },
                y: { duration: crossing.durationMs / 1000, ease: 'easeInOut' },
              }}
            >
              {crossing.to === 'left' && (
                <div className="mb-4 -mr-1">
                  <BrassLanternIcon size={28} className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              )}

              {crossing.travelers.map((id) => (
                <TravelerFigure
                  key={id}
                  id={id}
                  height={72}
                  isWalking
                  lit
                  facing={crossing.to === 'right' ? 'right' : 'left'}
                  className="w-auto h-[50px] sm:h-[74px] lg:h-[82px] origin-bottom"
                />
              ))}

              {crossing.to === 'right' && (
                <div className="mb-4 -ml-1">
                  <BrassLanternIcon size={28} className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
