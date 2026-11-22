import React from 'react';
import { motion } from 'framer-motion';
import type { OracleRole } from './engine';

interface OracleStatueProps {
  revealedRole: OracleRole | null;
  selected?: boolean;
  speaking?: boolean;
  height?: number;
  className?: string;
}

/**
 * Minimalist hooded marble Oracle automaton figure.
 * Unrevealed: veiled alabaster/slate monolith with breathing golden eye-slit.
 * Revealed: Veritas (Sun Crown), Mendax (Inverted Crescent), or Fortuna (Astral Prism).
 */
export const OracleStatue: React.FC<OracleStatueProps> = ({
  revealedRole,
  selected = false,
  speaking = false,
  height = 128,
  className = '',
}) => {
  const width = Math.round(height * 0.68);

  const accent =
    revealedRole === 'truth'
      ? '#6abf94'
      : revealedRole === 'false'
      ? '#e07a6b'
      : revealedRole === 'random'
      ? '#b794f4'
      : selected || speaking
      ? '#efc06e'
      : '#94a3b8';

  const robeFill =
    revealedRole === 'truth'
      ? '#162724'
      : revealedRole === 'false'
      ? '#2b191c'
      : revealedRole === 'random'
      ? '#201930'
      : '#1a202e';

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox="0 0 88 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={speaking ? { y: [0, -4, 0] } : { y: [0, -1.5, 0] }}
      transition={{
        repeat: Infinity,
        duration: speaking ? 0.65 : 4.2,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    >
      {/* Celestial Halo Ring behind crown */}
      <motion.circle
        cx="44"
        cy="34"
        r={selected || speaking || revealedRole ? 24 : 18}
        stroke={accent}
        strokeOpacity={selected || speaking || revealedRole ? 0.6 : 0.16}
        strokeWidth="1.2"
        strokeDasharray={revealedRole === 'random' ? '4 4' : undefined}
        animate={
          speaking
            ? { scale: [1, 1.15, 1], opacity: [0.5, 0.95, 0.5] }
            : revealedRole === 'random'
            ? { rotate: 360 }
            : { scale: 1 }
        }
        style={{ originX: '44px', originY: '34px' }}
        transition={{
          repeat: Infinity,
          duration: speaking ? 0.8 : 14,
          ease: 'linear',
        }}
      />

      {/* Base plinth shadow */}
      <ellipse
        cx="44"
        cy="122"
        rx={selected ? 26 : 22}
        ry="4"
        fill={selected || revealedRole ? accent : '#000000'}
        fillOpacity={selected || revealedRole ? 0.3 : 0.45}
      />

      {/* Sculpted Hooded Marble Mantle */}
      <path
        d="M19 120 L25 56 C27 46 61 46 63 56 L69 120 C56 123 32 123 19 120 Z"
        fill={robeFill}
        stroke={accent}
        strokeOpacity={selected || revealedRole ? 0.8 : 0.28}
        strokeWidth="1.4"
      />

      {/* Vertical ceremonial stole */}
      <path
        d="M44 50 V120"
        stroke={accent}
        strokeOpacity={selected || revealedRole ? 0.45 : 0.16}
        strokeWidth="1.6"
      />
      <path
        d="M32 54 L44 68 L56 54"
        stroke={accent}
        strokeOpacity={selected || revealedRole ? 0.6 : 0.22}
        strokeWidth="1.2"
        fill="none"
      />

      {/* Hood & Masked Visage */}
      <path
        d="M27 40 C27 20 34 12 44 12 C54 12 61 20 61 40 C61 48 54 52 44 52 C34 52 27 48 27 40 Z"
        fill={robeFill}
        stroke={accent}
        strokeOpacity={selected || revealedRole ? 0.85 : 0.35}
        strokeWidth="1.4"
      />
      {/* Shadowed Inner Hood */}
      <ellipse cx="44" cy="36" rx="11" ry="13" fill="#090c14" />

      {/* Visage Emblem — Changes When Revealed! */}
      {!revealedRole && (
        <motion.g
          animate={{ opacity: speaking ? [0.5, 1, 0.5] : [0.45, 0.85, 0.45] }}
          transition={{ repeat: Infinity, duration: speaking ? 0.45 : 3.2 }}
        >
          {/* Minimalist veiled oracle eyes */}
          <line x1="38" y1="35" x2="42" y2="35" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="46" y1="35" x2="50" y2="35" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
        </motion.g>
      )}

      {revealedRole === 'truth' && (
        /* Veritas: Radiant Golden Sun Emblem */
        <g>
          <circle cx="44" cy="35" r="4.5" fill="#6abf94" />
          <circle cx="44" cy="35" r="9" stroke="#9ae6be" strokeWidth="1" strokeOpacity="0.7" />
          {/* Crown ray above hood */}
          <path d="M44 4 V10 M35 7 L38 12 M53 7 L50 12" stroke="#6abf94" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {revealedRole === 'false' && (
        /* Mendax: Inverted Crimson Crescent */
        <g>
          <path d="M38 33 Q44 41 50 33 Q44 37 38 33 Z" fill="#e07a6b" />
          <path d="M36 9 L44 14 L52 9" stroke="#e07a6b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
      )}

      {revealedRole === 'random' && (
        /* Fortuna: Tilted Astral Diamond / Die */
        <g>
          <rect
            x="40"
            y="31"
            width="8"
            height="8"
            rx="1.5"
            transform="rotate(45 44 35)"
            fill="#b794f4"
          />
          <circle cx="44" cy="7" r="2.2" fill="#b794f4" />
        </g>
      )}

      {/* Held Relic Orb at Chest */}
      <circle
        cx="44"
        cy="82"
        r="5.5"
        fill={accent}
        fillOpacity={selected || speaking || revealedRole ? 0.85 : 0.25}
      />
      <circle
        cx="44"
        cy="82"
        r="10"
        fill={accent}
        fillOpacity={selected || speaking || revealedRole ? 0.18 : 0}
      />
    </motion.svg>
  );
};

