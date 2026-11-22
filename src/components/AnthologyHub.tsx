import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Moon, Star, Sun, Volume2, VolumeX, X } from 'lucide-react';
import { RIDDLE_CATALOG } from '../core/catalog';
import { soundEngine } from '../core/sound';
import type { ArchiveStorage, RiddleId, RiddleMeta, ThemeMode } from '../core/types';
import { BrassLanternIcon } from '../games/bridge-riddle/TravelerAvatar';

interface AnthologyHubProps {
  storage: ArchiveStorage;
  theme: ThemeMode;
  onToggleTheme: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onLaunchRiddle: (id: RiddleId) => void;
}

const ChapterMiniArt: React.FC<{ id: RiddleId; isLight: boolean }> = ({ id, isLight }) => {
  if (id === 'penniless-pilgrim') {
    return (
      <svg
        viewBox="0 0 500 260"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hubPilgrimBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isLight ? '#243042' : '#090c14'} />
            <stop offset="100%" stopColor={isLight ? '#304057' : '#111828'} />
          </linearGradient>
        </defs>
        <rect width="500" height="260" fill="url(#hubPilgrimBg)" />
        {/* Stylized 4x4 City Grid */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1="130"
              y1={46 + i * 42}
              x2="370"
              y2={46 + i * 42}
              stroke={isLight ? '#516684' : '#26344d'}
              strokeWidth="2.5"
            />
            <line
              x1={130 + i * 60}
              y1="46"
              x2={130 + i * 60}
              y2="214"
              stroke={isLight ? '#516684' : '#26344d'}
              strokeWidth="2.5"
            />
          </g>
        ))}
        {/* Illuminated Golden Route Hint */}
        <path
          d="M130 46 H250 V172 H370 V46 H310 V88 H130 V214 H370"
          stroke="#efc06e"
          strokeOpacity="0.65"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Animated Pilgrim Glow */}
        <motion.circle
          cx="250"
          cy="46"
          r="6.5"
          fill="#fff5dc"
          stroke="#efc06e"
          strokeWidth="2"
          animate={{ cx: [250, 250, 370, 250], cy: [46, 172, 172, 46] }}
          transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        />
        {/* SE Golden Temple */}
        <circle cx="370" cy="214" r="10" fill="#202a24" stroke="#6abf94" strokeWidth="1.8" />
        <circle cx="370" cy="214" r="4" fill="#8be0b5" />
      </svg>
    );
  }

  if (id === 'three-doors') {
    return (
      <svg
        viewBox="0 0 500 260"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hubDoorsBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isLight ? '#242d3e' : '#080a10'} />
            <stop offset="100%" stopColor={isLight ? '#36435a' : '#121826'} />
          </linearGradient>
          <radialGradient id="hubDoorsGlow" cx="50%" cy="56%" r="48%">
            <stop offset="0%" stopColor="#efc06e" stopOpacity={isLight ? '0.32' : '0.26'} />
            <stop offset="100%" stopColor={isLight ? '#242d3e' : '#080a10'} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="500" height="260" fill="url(#hubDoorsBg)" />
        <rect width="500" height="260" fill="url(#hubDoorsGlow)" />
        {/* Vault Floor */}
        <rect y="206" width="500" height="54" fill={isLight ? '#1c2433' : '#0b0e16'} />
        <line x1="0" y1="206" x2="500" y2="206" stroke="#c99754" strokeOpacity="0.3" />
        {/* Three Arched Vault Doors */}
        {[128, 250, 372].map((cx, idx) => (
          <g key={cx}>
            <path
              d={`M${cx - 38} 206 V108 C${cx - 38} 82 ${cx - 21} 68 ${cx} 68 C${cx + 21} 68 ${cx + 38} 82 ${cx + 38} 108 V206 Z`}
              fill={idx === 1 ? '#292418' : isLight ? '#222b3d' : '#141a26'}
              stroke={idx === 1 ? '#efc06e' : '#94a3b8'}
              strokeOpacity={idx === 1 ? 0.8 : 0.35}
              strokeWidth={idx === 1 ? 1.6 : 1.2}
            />
            {idx === 1 ? (
              <motion.g
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                <circle cx={cx} cy="126" r="10" stroke="#f6d79c" strokeWidth="2.2" fill="none" />
                <rect x={cx - 1.5} y="136" width="3" height="24" rx="1.5" fill="#efc06e" />
                <rect x={cx + 1.5} y="148" width="6" height="2.6" rx="1" fill="#f6d79c" />
              </motion.g>
            ) : (
              <circle
                cx={cx}
                cy="142"
                r="13"
                stroke="#b88848"
                strokeOpacity="0.45"
                strokeWidth="1.3"
                strokeDasharray="4 4"
                fill="none"
              />
            )}
          </g>
        ))}
      </svg>
    );
  }

  if (id === 'three-oracles') {
    return (
      <svg
        viewBox="0 0 500 260"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hubOraclesBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isLight ? '#242c40' : '#070911'} />
            <stop offset="100%" stopColor={isLight ? '#34415e' : '#11172a'} />
          </linearGradient>
          <radialGradient id="hubOraclesAura" cx="50%" cy="46%" r="50%">
            <stop offset="0%" stopColor="#b794f4" stopOpacity={isLight ? '0.28' : '0.22'} />
            <stop offset="100%" stopColor={isLight ? '#242c40' : '#070911'} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="500" height="260" fill="url(#hubOraclesBg)" />
        <rect width="500" height="260" fill="url(#hubOraclesAura)" />
        {/* Rotating Astrolabe Ring */}
        <motion.circle
          cx="250"
          cy="118"
          r="76"
          stroke="#c99754"
          strokeOpacity="0.24"
          strokeWidth="1.2"
          strokeDasharray="5 6"
          fill="none"
          style={{ originX: '250px', originY: '118px' }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
        />
        {/* Marble Floor */}
        <rect y="204" width="500" height="56" fill={isLight ? '#1e2536' : '#0b0e17'} />
        {/* Three Veiled Oracles Silhouettes */}
        {[140, 250, 360].map((cx, idx) => (
          <g key={cx}>
            <rect x={cx - 28} y="196" width="56" height="24" rx="1.5" fill={isLight ? '#333f57' : '#1a2234'} />
            <path
              d={`M${cx - 18} 196 L${cx - 13} 142 C${cx - 11} 135 ${cx + 11} 135 ${cx + 13} 142 L${cx + 18} 196 Z`}
              fill={isLight ? '#20283b' : '#141a29'}
              stroke={idx === 1 ? '#efc06e' : '#94a3b8'}
              strokeOpacity={idx === 1 ? 0.7 : 0.35}
              strokeWidth="1.2"
            />
            <circle
              cx={cx}
              cy="126"
              r="11"
              fill={isLight ? '#20283b' : '#141a29'}
              stroke={idx === 1 ? '#efc06e' : '#94a3b8'}
              strokeOpacity={idx === 1 ? 0.75 : 0.35}
              strokeWidth="1.2"
            />
            <circle cx={cx} cy="126" r="2.2" fill={idx === 1 ? '#efc06e' : '#cbd5e1'} opacity="0.85" />
          </g>
        ))}
        <text
          x="250"
          y="74"
          textAnchor="middle"
          fill="#efc06e"
          fontSize="12"
          letterSpacing="3"
          fontFamily="JetBrains Mono, monospace"
        >
          DA · JA
        </text>
      </svg>
    );
  }

  if (id === 'alchemist-jugs') {
    return (
      <svg
        viewBox="0 0 500 260"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hubJugsBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isLight ? '#232f42' : '#080b12'} />
            <stop offset="100%" stopColor={isLight ? '#34465e' : '#111827'} />
          </linearGradient>
          <radialGradient id="hubJugsAura" cx="50%" cy="55%" r="48%">
            <stop offset="0%" stopColor="#52b788" stopOpacity={isLight ? '0.32' : '0.26'} />
            <stop offset="100%" stopColor={isLight ? '#232f42' : '#080b12'} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="500" height="260" fill="url(#hubJugsBg)" />
        <rect width="500" height="260" fill="url(#hubJugsAura)" />
        {/* Brass Vault Ring */}
        <circle
          cx="250"
          cy="108"
          r="56"
          stroke="#c99754"
          strokeOpacity="0.3"
          strokeWidth="1.4"
          strokeDasharray="5 5"
          fill="none"
        />
        {/* Workbench */}
        <rect y="202" width="500" height="58" fill={isLight ? '#1f2836' : '#0e131d'} />
        <line x1="0" y1="202" x2="500" y2="202" stroke="#c99754" strokeOpacity="0.32" />
        {/* Small 3L Flask Silhouette */}
        <path
          d="M174 128 H200 L202 140 C212 146 216 154 216 168 V192 C216 198 210 202 202 202 H172 C164 202 158 198 158 192 V168 C158 154 162 146 172 140 Z"
          fill="#111d2c"
          stroke="#d8e3f0"
          strokeOpacity="0.45"
          strokeWidth="1.4"
        />
        <motion.rect
          x="161"
          y="168"
          width="52"
          height="32"
          rx="6"
          fill="#46c298"
          fillOpacity="0.82"
          animate={{ y: [168, 163, 168] }}
          transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}
        />
        {/* Tall 5L Flask Silhouette */}
        <path
          d="M286 98 H318 L320 112 C332 120 338 130 338 148 V190 C338 197 331 202 322 202 H282 C273 202 266 197 266 190 V148 C266 130 272 120 284 112 Z"
          fill="#111d2c"
          stroke="#f6d79c"
          strokeOpacity="0.65"
          strokeWidth="1.6"
        />
        <motion.rect
          x="269"
          y="134"
          width="66"
          height="66"
          rx="7"
          fill="#5dd4a1"
          fillOpacity="0.85"
          animate={{ y: [134, 128, 134] }}
          transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut' }}
        />
        <text
          x="250"
          y="88"
          textAnchor="middle"
          fill="#efc06e"
          fontSize="14"
          fontWeight="600"
          fontFamily="JetBrains Mono, monospace"
        >
          4L
        </text>
      </svg>
    );
  }

  if (id === 'midnight-ferry') {
    return (
      <svg
        viewBox="0 0 500 260"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hubFerrySky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isLight ? '#243449' : '#070a12'} />
            <stop offset="100%" stopColor={isLight ? '#4b637f' : '#162236'} />
          </linearGradient>
          <radialGradient id="hubFerryGlow" cx="50%" cy="68%" r="44%">
            <stop offset="0%" stopColor="#e8a849" stopOpacity={isLight ? '0.38' : '0.3'} />
            <stop offset="100%" stopColor={isLight ? '#243449' : '#070a12'} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="500" height="260" fill="url(#hubFerrySky)" />
        {/* Full Moon */}
        <circle cx="250" cy="68" r="20" fill="#f7eedb" fillOpacity="0.92" />
        {/* Hills */}
        <path
          d="M0 176 Q140 124 275 162 Q400 126 500 168 L500 185 L0 185 Z"
          fill={isLight ? '#2c3e55' : '#0c1320'}
        />
        {/* Water */}
        <rect y="176" width="500" height="84" fill={isLight ? '#1e3045' : '#0a1322'} />
        {/* Moon reflection */}
        <rect x="228" y="188" width="44" height="2.4" rx="1" fill="#f5ecda" opacity="0.45" />
        <rect x="218" y="200" width="64" height="2" rx="1" fill="#f5ecda" opacity="0.28" />
        {/* Lantern radiance */}
        <rect width="500" height="260" fill="url(#hubFerryGlow)" />
        {/* West & East Docks */}
        <path d="M0 170 L108 170 L118 260 L0 260 Z" fill={isLight ? '#212b3a' : '#141a26'} />
        <path d="M500 170 L392 170 L382 260 L500 260 Z" fill={isLight ? '#212b3a' : '#141a26'} />
        {/* Gently Bobbing Skiff */}
        <motion.g
          animate={{ x: [-14, 14, -14], y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 7.5, ease: 'easeInOut' }}
        >
          <path
            d="M206 184 Q250 202 294 184 L284 186 Q250 192 216 186 Z"
            fill="#573a22"
            stroke="#c99b68"
            strokeWidth="1.2"
          />
          <circle cx="275" cy="176" r="4" fill="#fff5d6" className="animate-flame-breathe" />
          <circle cx="275" cy="176" r="13" fill="#e8a849" fillOpacity="0.28" />
        </motion.g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 500 260"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hubBridgeSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isLight ? '#232f45' : '#07090f'} />
          <stop offset="100%" stopColor={isLight ? '#435370' : '#141c2c'} />
        </linearGradient>
        <radialGradient id="hubBridgeGlow" cx="50%" cy="62%" r="48%">
          <stop offset="0%" stopColor="#e8a849" stopOpacity={isLight ? '0.42' : '0.34'} />
          <stop offset="55%" stopColor="#e8a849" stopOpacity="0.1" />
          <stop offset="100%" stopColor={isLight ? '#232f45' : '#07090f'} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="500" height="260" fill="url(#hubBridgeSky)" />
      {/* Crescent Moon */}
      <circle cx="250" cy="66" r="19" fill="#f7ebd4" fillOpacity="0.92" />
      <circle cx="256" cy="62" r="17" fill={isLight ? '#2a374f' : '#0b0f18'} />
      {/* Distant peaks */}
      <path
        d="M0 196 L120 132 L240 174 L375 124 L500 176 L500 260 L0 260 Z"
        fill={isLight ? '#2b384f' : '#0d1320'}
      />
      <motion.rect
        width="500"
        height="260"
        fill="url(#hubBridgeGlow)"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      />
      <path d="M0 170 L132 170 L146 188 L120 260 L0 260 Z" fill={isLight ? '#202838' : '#151b27'} />
      <path d="M500 170 L368 170 L354 188 L380 260 L500 260 Z" fill={isLight ? '#202838' : '#151b27'} />
      <motion.g
        animate={{ y: [0, 2, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      >
        <path d="M130 156 Q250 186 370 156" stroke="#b39268" strokeOpacity="0.78" strokeWidth="1.6" fill="none" />
        <path d="M130 174 Q250 208 370 174" stroke="#cca87a" strokeWidth="2.2" fill="none" />
        <circle cx="250" cy="174" r="4.5" fill="#fff5d6" className="animate-flame-breathe" />
        <circle cx="250" cy="174" r="14" fill="#e8a849" fillOpacity="0.32" />
      </motion.g>
    </svg>
  );
};

export const AnthologyHub: React.FC<AnthologyHubProps> = ({
  storage,
  theme,
  onToggleTheme,
  muted,
  onToggleMute,
  onLaunchRiddle,
}) => {
  const [previewChapter, setPreviewChapter] = useState<RiddleMeta | null>(null);

  const playableChapters = RIDDLE_CATALOG.filter((c) => c.status === 'playable');
  const upcomingChapters = RIDDLE_CATALOG.filter((c) => c.status !== 'playable');
  const isLight = theme === 'light';

  return (
    <div className="relative min-h-screen bg-paper-100 text-paper-900 dark:bg-ink-950 dark:text-ivory-100 transition-colors duration-300">
      {/* Subtle Top Ambience */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] opacity-40 dark:opacity-30"
        style={{
          background: isLight
            ? 'radial-gradient(ellipse 65% 55% at 50% 0%, rgba(199,131,34,0.14), transparent 75%)'
            : 'radial-gradient(ellipse 60% 55% at 50% 0%, rgba(232,168,73,0.18), transparent 75%)',
        }}
      />

      {/* Minimal Header */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-5 sm:px-8 pt-7 pb-4">
        <div className="flex items-center gap-3">
          <BrassLanternIcon size={26} />
          <span className="font-display text-lg sm:text-xl font-semibold tracking-wide text-paper-900 dark:text-ivory-100">
            The Archive
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              onToggleTheme();
            }}
            className="rounded-full p-2.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            title={isLight ? 'Dark Mode' : 'Light Mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ opacity: 0, rotate: -35, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 35, scale: 0.8 }}
                transition={{ duration: 0.18 }}
                className="block"
              >
                {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </motion.span>
            </AnimatePresence>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="rounded-full p-2.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            title={muted ? 'Sound Off' : 'Sound On'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-5xl px-5 sm:px-8 pt-8 sm:pt-12 pb-20">
        {/* Editorial Intro */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-600 dark:text-gold-300/80">
            Famous Riddles · Interactive Chronicles
          </p>
          <h1 className="mt-3 font-display text-4xl sm:text-6xl font-medium tracking-tight text-paper-900 dark:text-ivory-100 leading-[1.08]">
            Timeless paradoxes, reimagined as quiet escapes.
          </h1>
        </motion.div>

        {/* Playable Chapters Gallery (Symmetrical 2x3 Grid for all 6 Chapters) */}
        <section className="mt-10 sm:mt-14 grid gap-6 md:grid-cols-2">
          {playableChapters.map((chapter, idx) => {
            const progress = storage.riddles[chapter.id];

            const bestLabel =
              chapter.id === 'bridge-riddle'
                ? `${progress?.bestTimeMinutes} min`
                : chapter.id === 'midnight-ferry'
                ? `${progress?.bestMoves} trips`
                : chapter.id === 'alchemist-jugs'
                ? `${progress?.bestMoves} steps`
                : chapter.id === 'three-doors'
                ? `${progress?.bestMoves} rds`
                : chapter.id === 'penniless-pilgrim'
                ? `${progress?.bestMoves} steps`
                : `${progress?.bestMoves} Qs`;

            const badgeText =
              chapter.id === 'bridge-riddle'
                ? '17 MIN LIMIT'
                : chapter.id === 'midnight-ferry'
                ? 'PAR 7 TRIPS'
                : chapter.id === 'alchemist-jugs'
                ? 'PAR 6 STEPS'
                : chapter.id === 'three-doors'
                ? '6 KEYS · 10 RDS'
                : chapter.id === 'penniless-pilgrim'
                ? '0 TAX · 4×4 GRID'
                : 'MASTER · 3 QUESTIONS';

            return (
              <motion.article
                key={chapter.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.06 * idx, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col overflow-hidden rounded-[24px] border border-paper-900/10 bg-paper-50 shadow-[0_24px_60px_-24px_rgba(26,24,21,0.14)] dark:border-white/[0.08] dark:bg-ink-900/90 dark:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95)] transition-colors duration-300"
              >
                {/* Live Miniature Artwork Header */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden border-b border-paper-900/10 dark:border-white/[0.07] bg-ink-950">
                  <ChapterMiniArt id={chapter.id} isLight={isLight} />
                  <div className="pointer-events-none absolute bottom-3 right-4 font-mono text-[10px] tracking-[0.18em] uppercase text-ivory-100/75">
                    {badgeText}
                  </div>
                </div>

                {/* Editorial Card Body */}
                <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                  <div>
                    <div className="flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.22em] text-paper-700 dark:text-ivory-300">
                      <span className="text-gold-600 dark:text-gold-300">
                        {chapter.chapterNumber}
                      </span>
                      <span className="text-paper-900/20 dark:text-white/20">·</span>
                      <span>{chapter.classicName}</span>
                    </div>

                    <h2 className="mt-2.5 font-display text-3xl font-semibold text-paper-900 dark:text-ivory-100">
                      {chapter.title}
                    </h2>

                    <p className="mt-2.5 text-sm leading-relaxed text-paper-700 dark:text-ivory-300">
                      {chapter.lorePreview}
                    </p>
                  </div>

                  <div className="mt-7 flex items-center justify-between gap-4 pt-4 border-t border-paper-900/[0.07] dark:border-white/[0.06]">
                    {progress?.solved ? (
                      <div className="flex items-center gap-2 text-xs text-paper-700 dark:text-ivory-300">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((n) => (
                            <Star
                              key={n}
                              className={`h-3.5 w-3.5 ${
                                n <= (progress.stars ?? 0)
                                  ? 'fill-gold-500 text-gold-500 dark:fill-gold-400 dark:text-gold-300'
                                  : 'text-paper-900/15 dark:text-white/15'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-mono text-[11px] text-paper-700/80 dark:text-ivory-300/80">
                          {bestLabel}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-paper-700/70 dark:text-ivory-300/60">
                        {chapter.estimatedTime}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playSelect();
                        onLaunchRiddle(chapter.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-paper-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 transition shadow-[0_8px_24px_-8px_rgba(26,24,21,0.3)] dark:shadow-[0_8px_24px_-8px_rgba(232,168,73,0.45)]"
                    >
                      <span>{progress?.solved ? 'Replay' : 'Play'}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>

        {/* Quiet Upcoming Chapters Index */}
        {upcomingChapters.length > 0 && (
          <section className="mt-14">
            <div className="text-[11px] font-medium uppercase tracking-[0.26em] text-paper-700/75 dark:text-ivory-300/65 mb-4">
              Forthcoming Chapters
            </div>

            <div className="divide-y divide-paper-900/10 border-y border-paper-900/10 dark:divide-white/[0.07] dark:border-white/[0.07]">
              {upcomingChapters.map((chapter) => (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playSelect();
                    setPreviewChapter(chapter);
                  }}
                  className="group flex w-full items-center justify-between gap-4 py-5 text-left hover:bg-paper-900/[0.03] dark:hover:bg-white/[0.02] px-2 -mx-2 rounded-xl transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-5">
                    <span className="font-mono text-xs text-paper-700/70 dark:text-ivory-300/55 w-24 shrink-0">
                      {chapter.chapterNumber}
                    </span>
                    <div>
                      <span className="font-display text-xl sm:text-2xl font-medium text-paper-900/85 group-hover:text-paper-900 dark:text-ivory-100/85 dark:group-hover:text-ivory-100 transition">
                        {chapter.title}
                      </span>
                      <span className="ml-3 text-xs text-paper-700/70 dark:text-ivory-300/55 hidden sm:inline">
                        {chapter.classicName}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-paper-700/65 group-hover:text-gold-600 dark:text-ivory-300/50 dark:group-hover:text-gold-300 transition shrink-0">
                    Preview
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Quiet Lore Preview Modal for Upcoming Chapters */}
      <AnimatePresence>
        {previewChapter && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 dark:bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setPreviewChapter(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="surface-glass relative w-full max-w-md rounded-3xl p-7"
            >
              <button
                type="button"
                onClick={() => setPreviewChapter(null)}
                className="absolute right-5 top-5 rounded-full p-1.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold-600 dark:text-gold-300/80">
                {previewChapter.chapterNumber} · Forthcoming
              </div>
              <h3 className="mt-1.5 font-display text-3xl font-semibold text-paper-900 dark:text-ivory-100">
                {previewChapter.title}
              </h3>
              <p className="text-xs text-paper-700 dark:text-ivory-300/70">
                {previewChapter.classicName}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-paper-800 dark:text-ivory-200/85">
                {previewChapter.lorePreview}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
