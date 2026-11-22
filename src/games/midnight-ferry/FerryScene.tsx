import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ThemeMode } from '../../core/types';
import {
  CARGO_MAP,
  getCargoOnShore,
  type CargoId,
  type FerryGameState,
  type Shore,
} from './engine';
import { CargoFigure, FerrymanFigure } from './FerryFigures';
import { BrassLanternIcon } from '../bridge-riddle/TravelerAvatar';

export interface ActiveRowingAnimation {
  passenger: CargoId | null;
  from: Shore;
  to: Shore;
  durationMs: number;
}

interface FerrySceneProps {
  state: FerryGameState;
  rowing: ActiveRowingAnimation | null;
  theme: ThemeMode;
  onToggleCargo: (id: CargoId) => void;
}

const STARS = [
  { x: 86, y: 46, r: 1.0, d: '0.2s' },
  { x: 175, y: 74, r: 0.85, d: '1.8s' },
  { x: 295, y: 38, r: 1.2, d: '0.9s' },
  { x: 392, y: 66, r: 0.9, d: '2.6s' },
  { x: 615, y: 42, r: 1.15, d: '1.3s' },
  { x: 722, y: 72, r: 0.9, d: '2.4s' },
  { x: 840, y: 38, r: 1.1, d: '0.5s' },
  { x: 928, y: 68, r: 0.9, d: '1.9s' },
];

const WEST_SLOTS: Record<CargoId, number> = {
  wolf: 6.2,
  goat: 14.0,
  cabbage: 21.2,
};

const EAST_SLOTS: Record<CargoId, number> = {
  cabbage: 78.8,
  goat: 86.0,
  wolf: 93.8,
};

export const FerryScene: React.FC<FerrySceneProps> = ({
  state,
  rowing,
  theme,
  onToggleCargo,
}) => {
  const isLight = theme === 'light';
  const isWon = state.status === 'won';
  const isLost = state.status === 'lost';

  // Hide cargo currently seated inside the boat (whether docked or rowing)
  const passengerInBoat = rowing ? rowing.passenger : state.boarded;

  const westCargo = getCargoOnShore(state, 'west').filter((c) => c.id !== passengerInBoat);
  const eastCargo = getCargoOnShore(state, 'east').filter((c) => c.id !== passengerInBoat);

  const boatDockPct = state.ferrymanSide === 'west' ? 35 : 65;
  const boatTargetPct = rowing ? (rowing.to === 'east' ? 65 : 35) : boatDockPct;
  const boatFacing: 'right' | 'left' = rowing
    ? rowing.to === 'east'
      ? 'right'
      : 'left'
    : state.ferrymanSide === 'west'
    ? 'right'
    : 'left';

  const conflictPair = new Set<CargoId>(state.conflict?.pair ?? []);

  // Harmonized Dusk Fjord Slate (Light Mode) vs. Deep Moonlit Indigo (Dark Mode)
  const palette = isLight
    ? {
        skyTop: '#243449',
        skyMid: '#374c68',
        skyBot: '#516985',
        peakFar: '#2e4159',
        peakNear: '#354b66',
        waterTop: '#23364d',
        waterBot: '#142030',
        waveFront: '#385270',
        shoreTop: '#283344',
        shoreBot: '#161d28',
        pierWood: '#523b28',
        pierStroke: '#8a684a',
        mist: '#6d84a3',
      }
    : {
        skyTop: '#070a12',
        skyMid: '#0e1524',
        skyBot: '#172338',
        peakFar: '#0c1320',
        peakNear: '#101a2b',
        waterTop: '#0b1526',
        waterBot: '#050912',
        waveFront: '#162742',
        shoreTop: '#181f2c',
        shoreBot: '#0a0d14',
        pierWood: '#3d2a1b',
        pierStroke: '#78593c',
        mist: '#223654',
      };

  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border border-paper-900/12 dark:border-white/[0.07] bg-[#243449] dark:bg-ink-900 shadow-[0_24px_65px_-26px_rgba(26,24,21,0.34)] dark:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95)] select-none transition-shadow duration-300">
      <div className="relative w-full aspect-[1000/440] min-h-[250px]">
        {/* Architectural Moonlit River Canvas */}
        <svg
          viewBox="0 0 1000 440"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ferrySky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.skyTop} />
              <stop offset="56%" stopColor={palette.skyMid} />
              <stop offset="100%" stopColor={palette.skyBot} />
            </linearGradient>
            <linearGradient id="riverWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.waterTop} />
              <stop offset="100%" stopColor={palette.waterBot} />
            </linearGradient>
            <radialGradient id="fullMoonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f5ecda" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#9cb5d9" stopOpacity="0.09" />
              <stop offset="100%" stopColor={palette.skyTop} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ferryAurora" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6abf94" stopOpacity="0.2" />
              <stop offset="65%" stopColor="#e8a849" stopOpacity="0.08" />
              <stop offset="100%" stopColor={palette.skyTop} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="shoreGradL" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={palette.shoreTop} />
              <stop offset="100%" stopColor={palette.shoreBot} />
            </linearGradient>
            <linearGradient id="shoreGradR" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.shoreTop} />
              <stop offset="100%" stopColor={palette.shoreBot} />
            </linearGradient>
          </defs>

          {/* Night / Dusk Sky */}
          <rect width="1000" height="305" fill="url(#ferrySky)" />

          {isWon && (
            <motion.rect
              width="1000"
              height="305"
              fill="url(#ferryAurora)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4 }}
            />
          )}

          {/* Stars */}
          {STARS.map((s, idx) => (
            <circle
              key={idx}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="#f3eee4"
              className="animate-star-pulse"
              style={{ animationDelay: s.d }}
            />
          ))}

          {/* Full Moon */}
          <circle cx="500" cy="94" r="95" fill="url(#fullMoonGlow)" />
          <circle cx="500" cy="94" r="24" fill="#f7eedb" fillOpacity="0.92" />

          {/* Distant Misty Hills & Cypress Silhouettes */}
          <path
            d="M0 288 Q150 200 320 262 Q500 220 680 264 Q850 198 1000 280 L1000 305 L0 305 Z"
            fill={palette.peakFar}
            opacity="0.78"
          />
          <path
            d="M0 296 Q210 242 420 286 Q560 258 760 288 Q900 248 1000 292 L1000 305 L0 305 Z"
            fill={palette.peakNear}
            opacity="0.72"
          />

          {/* Soft Drifting River Fog Above Horizon */}
          <g className="animate-mist-drift-slow" opacity="0.34">
            <ellipse cx="360" cy="295" rx="230" ry="26" fill={palette.mist} />
            <ellipse cx="670" cy="298" rx="240" ry="24" fill={palette.mist} />
          </g>

          {/* River Water Surface (y = 295..440) */}
          <rect y="295" width="1000" height="145" fill="url(#riverWater)" />

          {/* Shimmering Moonlight Reflection Column on Water */}
          <g className="animate-mist-drift-reverse" opacity="0.36">
            <rect x="466" y="308" width="68" height="3" rx="1.5" fill="#f5ecda" />
            <rect x="454" y="322" width="92" height="2.6" rx="1.3" fill="#f5ecda" opacity="0.78" />
            <rect x="472" y="338" width="56" height="2.4" rx="1.2" fill="#f5ecda" opacity="0.62" />
            <rect x="444" y="356" width="112" height="2.2" rx="1.1" fill="#f5ecda" opacity="0.45" />
            <rect x="462" y="376" width="76" height="2" rx="1" fill="#f5ecda" opacity="0.3" />
          </g>

          {/* Subtle Animated Water Ripple Lines (Background) */}
          <motion.path
            d="M240 330 Q370 324 500 330 T760 330"
            stroke="#94b0d6"
            strokeOpacity="0.14"
            strokeWidth="1.4"
            fill="none"
            animate={{ x: [-12, 12, -12] }}
            transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
          />
          <motion.path
            d="M250 368 Q380 374 510 368 T755 368"
            stroke="#94b0d6"
            strokeOpacity="0.12"
            strokeWidth="1.3"
            fill="none"
            animate={{ x: [10, -10, 10] }}
            transition={{ repeat: Infinity, duration: 8.5, ease: 'easeInOut' }}
          />

          {/* West Shore — Mistwater Landing (Walk Deck y = 286) */}
          <g>
            {/* Wooden Dock Pilings */}
            <rect x="234" y="288" width="8" height="58" rx="1.5" fill={palette.pierWood} />
            <rect x="200" y="288" width="8" height="52" rx="1.5" fill={palette.pierWood} />
            {/* Wooden Landing Deck Extension */}
            <rect
              x="185"
              y="282"
              width="70"
              height="9"
              rx="2"
              fill={palette.pierWood}
              stroke={palette.pierStroke}
              strokeWidth="1"
            />
            {/* Mooring Post */}
            <rect x="242" y="256" width="8" height="30" rx="1.5" fill={palette.pierWood} stroke={palette.pierStroke} strokeWidth="0.9" />
            {/* Stone Bank */}
            <path
              d="M0 286 L208 286 L222 316 L196 440 L0 440 Z"
              fill="url(#shoreGradL)"
              stroke="#ffffff"
              strokeOpacity="0.07"
              strokeWidth="1"
            />
            {/* Lit Shore Rim Highlight */}
            <motion.line
              x1="0"
              y1="286.5"
              x2="255"
              y2="286.5"
              stroke="#e8a849"
              strokeWidth="1.5"
              animate={{
                strokeOpacity: state.ferrymanSide === 'west' && !isLost ? 0.5 : 0.07,
              }}
              transition={{ duration: 0.6 }}
            />
          </g>

          {/* East Shore — Sanctuary Pier (Walk Deck y = 286) */}
          <g>
            {/* Sanctuary Stone Shrine */}
            <rect x="916" y="200" width="22" height="86" rx="2" fill={palette.shoreTop} stroke="#ffffff" strokeOpacity="0.08" />
            <path d="M908 200 H946 L939 186 H915 Z" fill={palette.pierStroke} fillOpacity="0.45" />
            {isWon && (
              <motion.g
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                style={{ originX: '927px', originY: '180px' }}
              >
                <circle cx="927" cy="170" r="42" fill="#6abf94" fillOpacity="0.24" className="animate-flame-breathe" />
                <path
                  d="M927 142 C935 154 938 162 938 170 C938 177 933 182 927 182 C921 182 916 177 916 170 C916 162 919 154 927 142 Z"
                  fill="#6abf94"
                />
                <path
                  d="M927 154 C931 161 932 166 932 170 C932 174 930 177 927 177 C924 177 922 174 922 170 C922 166 923 161 927 154 Z"
                  fill="#e6faef"
                />
              </motion.g>
            )}

            {/* Wooden Dock Pilings */}
            <rect x="758" y="288" width="8" height="58" rx="1.5" fill={palette.pierWood} />
            <rect x="792" y="288" width="8" height="52" rx="1.5" fill={palette.pierWood} />
            {/* Wooden Pier Deck */}
            <rect
              x="745"
              y="282"
              width="70"
              height="9"
              rx="2"
              fill={palette.pierWood}
              stroke={palette.pierStroke}
              strokeWidth="1"
            />
            {/* Mooring Post */}
            <rect x="750" y="256" width="8" height="30" rx="1.5" fill={palette.pierWood} stroke={palette.pierStroke} strokeWidth="0.9" />
            {/* Stone Bank */}
            <path
              d="M1000 286 L792 286 L778 316 L804 440 L1000 440 Z"
              fill="url(#shoreGradR)"
              stroke="#ffffff"
              strokeOpacity="0.07"
              strokeWidth="1"
            />
            <motion.line
              x1="745"
              y1="286.5"
              x2="1000"
              y2="286.5"
              stroke={isWon ? '#6abf94' : '#e8a849'}
              strokeWidth="1.5"
              animate={{
                strokeOpacity: isWon
                  ? 0.72
                  : state.ferrymanSide === 'east' && !isLost
                  ? 0.5
                  : 0.07,
              }}
              transition={{ duration: 0.6 }}
            />
          </g>
        </svg>

        {/* Dynamic Volumetric Skiff Lantern Radiance */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute top-[58%] -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] sm:h-[380px] sm:w-[380px] rounded-full"
          style={{
            background: isLight
              ? 'radial-gradient(circle, rgba(246,204,122,0.28) 0%, rgba(232,168,73,0.09) 42%, rgba(232,168,73,0) 72%)'
              : 'radial-gradient(circle, rgba(232,168,73,0.22) 0%, rgba(232,168,73,0.07) 42%, rgba(232,168,73,0) 72%)',
          }}
          animate={{ left: `${boatTargetPct}%` }}
          transition={{
            duration: rowing ? rowing.durationMs / 1000 : 0.6,
            ease: [0.42, 0, 0.2, 1],
          }}
        />

        {/* Whisper-Quiet Etched Shore Labels */}
        <div className="pointer-events-none absolute inset-x-5 sm:inset-x-8 top-5 flex items-center justify-between text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.26em]">
          <span
            className={`transition-opacity duration-500 ${
              state.ferrymanSide === 'west' && !isLost
                ? 'text-gold-200/95'
                : 'text-ivory-100/45'
            }`}
          >
            Mistwater Landing
          </span>
          <span
            className={`transition-opacity duration-500 ${
              isWon
                ? 'text-[#7cd9a8]'
                : state.ferrymanSide === 'east' && !isLost
                ? 'text-gold-200/95'
                : 'text-ivory-100/45'
            }`}
          >
            Sanctuary Pier · {getCargoOnShore(state, 'east').length}/3
          </span>
        </div>

        {/* West Shore Interactive Cargo Figures (feet flush on y=286 -> bottom 35%) */}
        {westCargo.map((item) => {
          const isActiveShore = state.ferrymanSide === 'west' && state.status === 'playing' && !rowing;
          const isDanger = isLost && state.conflict?.shore === 'west' && conflictPair.has(item.id);
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => !rowing && onToggleCargo(item.id)}
              disabled={Boolean(rowing) || state.status !== 'playing'}
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: isActiveShore || isDanger ? 1 : 0.55,
                y: 0,
              }}
              whileHover={isActiveShore ? { y: -5, scale: 1.06 } : undefined}
              whileTap={isActiveShore ? { scale: 0.96 } : undefined}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              style={{
                left: `${WEST_SLOTS[item.id]}%`,
                bottom: '35%',
              }}
              className={`group absolute -translate-x-1/2 z-20 flex flex-col items-center focus:outline-none ${
                isActiveShore ? 'cursor-pointer' : 'cursor-default'
              }`}
              title={`${item.name} — ${item.description}`}
            >
              {isDanger && (
                <span className="pointer-events-none absolute -bottom-1 h-4 w-14 rounded-full bg-[#e07a6b]/55 blur-md animate-pulse" />
              )}

              <CargoFigure
                id={item.id}
                height={56}
                lit={state.ferrymanSide === 'west'}
                danger={isDanger}
                facing="right"
                className="w-auto h-[40px] sm:h-[56px] lg:h-[64px] origin-bottom"
              />

              <div
                className={`pointer-events-none absolute top-full mt-2 flex flex-col items-center leading-tight whitespace-nowrap transition-colors ${
                  isDanger
                    ? 'text-[#f29587] font-semibold'
                    : isActiveShore
                    ? 'text-ivory-100/90 group-hover:text-gold-200'
                    : 'text-ivory-200/50'
                }`}
              >
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">
                  {item.shortName}
                </span>
              </div>
            </motion.button>
          );
        })}

        {/* East Shore Interactive Cargo Figures */}
        {eastCargo.map((item) => {
          const isActiveShore = state.ferrymanSide === 'east' && state.status === 'playing' && !rowing;
          const isDanger = isLost && state.conflict?.shore === 'east' && conflictPair.has(item.id);
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => !rowing && onToggleCargo(item.id)}
              disabled={Boolean(rowing) || state.status !== 'playing'}
              initial={{ opacity: 0, y: 6 }}
              animate={{
                opacity: isActiveShore || isWon || isDanger ? 1 : 0.62,
                y: 0,
              }}
              whileHover={isActiveShore ? { y: -5, scale: 1.06 } : undefined}
              whileTap={isActiveShore ? { scale: 0.96 } : undefined}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              style={{
                left: `${EAST_SLOTS[item.id]}%`,
                bottom: '35%',
              }}
              className={`group absolute -translate-x-1/2 z-20 flex flex-col items-center focus:outline-none ${
                isActiveShore ? 'cursor-pointer' : 'cursor-default'
              }`}
              title={`${item.name} — ${item.description}`}
            >
              {isDanger && (
                <span className="pointer-events-none absolute -bottom-1 h-4 w-14 rounded-full bg-[#e07a6b]/55 blur-md animate-pulse" />
              )}

              <CargoFigure
                id={item.id}
                height={56}
                lit={state.ferrymanSide === 'east' || isWon}
                danger={isDanger}
                facing="left"
                className="w-auto h-[40px] sm:h-[56px] lg:h-[64px] origin-bottom"
              />

              <div
                className={`pointer-events-none absolute top-full mt-2 flex flex-col items-center leading-tight whitespace-nowrap transition-colors ${
                  isDanger
                    ? 'text-[#f29587] font-semibold'
                    : isWon
                    ? 'text-[#8ad4ae]'
                    : isActiveShore
                    ? 'text-ivory-100/90 group-hover:text-gold-200'
                    : 'text-ivory-200/55'
                }`}
              >
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">
                  {item.shortName}
                </span>
              </div>
            </motion.button>
          );
        })}

        {/* Animated Wooden Cedar Skiff + Ferryman Vael + Boarded Passenger */}
        <motion.div
          className="absolute z-[25] -translate-x-1/2 flex flex-col items-center"
          style={{ bottom: '25.5%' }}
          animate={{
            left: `${boatTargetPct}%`,
            y: passengerInBoat ? 3 : 0,
          }}
          transition={{
            left: {
              duration: rowing ? rowing.durationMs / 1000 : 0.65,
              ease: [0.42, 0, 0.25, 1],
            },
            y: { type: 'spring', stiffness: 180, damping: 18 },
          }}
        >
          {/* Gentle Buoyant Water Bob & Pitch */}
          <motion.div
            className="relative flex flex-col items-center"
            animate={
              rowing
                ? { y: [0, -3.5, 1.5, -2.5, 0], rotate: [-1.8, 1.6, -1.2, 0.8, 0] }
                : { y: [0, -2.2, 0], rotate: [-0.8, 0.8, -0.8] }
            }
            transition={{
              repeat: Infinity,
              duration: rowing ? 1.15 : 3.8,
              ease: 'easeInOut',
            }}
          >
            {/* Passengers Seated Above Hull */}
            <div className="relative z-10 flex items-end justify-center gap-1 -mb-3 sm:-mb-3.5 px-2">
              {boatFacing === 'left' && (
                <div className="mb-3">
                  <BrassLanternIcon size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}

              {/* Ferryman Vael */}
              {boatFacing === 'right' && (
                <div className="-mb-1">
                  <FerrymanFigure isRowing={Boolean(rowing)} facing="right" height={54} />
                </div>
              )}

              {/* Boarded Cargo Passenger (click inside boat to unboard!) */}
              <AnimatePresence mode="popLayout">
                {passengerInBoat && (
                  <motion.button
                    key={passengerInBoat}
                    type="button"
                    disabled={Boolean(rowing) || state.status !== 'playing'}
                    onClick={() => !rowing && onToggleCargo(passengerInBoat)}
                    initial={{ opacity: 0, y: -14, scale: 0.82 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.82 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className={`relative focus:outline-none ${
                      !rowing && state.status === 'playing' ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    title={`Click to return ${CARGO_MAP[passengerInBoat].name} to shore`}
                  >
                    <CargoFigure
                      id={passengerInBoat}
                      height={46}
                      selected={!rowing}
                      lit
                      facing={boatFacing}
                      className="w-auto h-[34px] sm:h-[46px] lg:h-[52px]"
                    />
                  </motion.button>
                )}
              </AnimatePresence>

              {boatFacing === 'left' && (
                <div className="-mb-1">
                  <FerrymanFigure isRowing={Boolean(rowing)} facing="left" height={54} />
                </div>
              )}

              {boatFacing === 'right' && (
                <div className="mb-3">
                  <BrassLanternIcon size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}
            </div>

            {/* Cedar Skiff Hull SVG */}
            <svg
              viewBox="0 0 180 38"
              className="relative z-20 w-[122px] sm:w-[158px] lg:w-[176px] h-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)]"
              fill="none"
              aria-hidden="true"
            >
              {/* Hull Body */}
              <path
                d="M6 10 Q28 34 90 34 Q152 34 174 10 L160 12 Q90 19 20 12 Z"
                fill="#4d321d"
                stroke="#b88b5a"
                strokeOpacity="0.72"
                strokeWidth="1.4"
              />
              {/* Wood plank grain highlight */}
              <path
                d="M24 22 Q90 28 156 22"
                stroke="#8c623b"
                strokeOpacity="0.6"
                strokeWidth="1.1"
              />
              {/* Waterline wake ripple */}
              <motion.path
                d="M14 34 Q90 39 166 34"
                stroke="#d2e2f7"
                strokeOpacity={rowing ? 0.45 : 0.22}
                strokeWidth="1.6"
                strokeLinecap="round"
                animate={rowing ? { scaleX: [0.92, 1.08, 0.92] } : { scaleX: [0.97, 1.03, 0.97] }}
                transition={{ repeat: Infinity, duration: rowing ? 0.7 : 3.2, ease: 'easeInOut' }}
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Subtle Foreground Water Shimmer Strip Over Bottom of Scene */}
        <svg
          viewBox="0 0 1000 80"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] w-full z-30 opacity-45"
          aria-hidden="true"
        >
          <motion.path
            d="M0 30 Q180 18 360 30 T720 30 T1000 28 L1000 80 L0 80 Z"
            fill={palette.waveFront}
            fillOpacity="0.35"
            animate={{ x: [-14, 14, -14] }}
            transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
          />
        </svg>
      </div>
    </div>
  );
};
