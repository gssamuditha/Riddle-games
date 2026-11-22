import React from 'react';
import { motion } from 'framer-motion';
import type { CargoId } from './engine';

interface CargoFigureProps {
  id: CargoId;
  height?: number;
  selected?: boolean;
  lit?: boolean;
  danger?: boolean;
  facing?: 'right' | 'left';
  className?: string;
}

/**
 * Artisanal minimalist vector silhouettes for Chapter II (The Midnight Ferry):
 * Ash-Wolf, Highland Goat, Moon-Cabbage, and Ferryman Vael.
 */
export const CargoFigure: React.FC<CargoFigureProps> = ({
  id,
  height = 60,
  selected = false,
  lit = true,
  danger = false,
  facing = 'right',
  className = '',
}) => {
  const width = Math.round(height * 1.12);
  const rim = danger ? '#e07a6b' : selected ? '#f6d79c' : lit ? '#e8a849' : '#53627a';
  const rimOpacity = danger ? 0.95 : selected ? 0.95 : lit ? 0.55 : 0.24;

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox="0 0 72 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ transform: facing === 'left' ? 'scaleX(-1)' : undefined }}
      animate={{ y: [0, -1.2, 0] }}
      transition={{
        duration: id === 'wolf' ? 3.2 : id === 'goat' ? 3.8 : 4.4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    >
      {/* Subtle Ground Shadow */}
      <ellipse
        cx="36"
        cy="60"
        rx={selected ? 21 : 18}
        ry="3"
        fill={danger ? '#d45d4c' : selected ? '#e8a849' : '#000000'}
        fillOpacity={danger ? 0.45 : selected ? 0.35 : 0.4}
      />

      {id === 'wolf' && (
        <g>
          {/* Subtle wagging/tense tail */}
          <motion.path
            d="M17 44 C10 41 6 35 8 28 C12 31 15 36 20 40 Z"
            fill="#273142"
            stroke={rim}
            strokeOpacity={rimOpacity * 0.7}
            strokeWidth="1"
            style={{ originX: '18px', originY: '42px' }}
            animate={{ rotate: danger ? [-8, 10, -8] : [-2, 4, -2] }}
            transition={{ repeat: Infinity, duration: danger ? 0.6 : 3.6, ease: 'easeInOut' }}
          />
          {/* Back & front legs */}
          <path d="M22 45 L19 59 M29 46 L28 59 M43 45 L42 59 M49 44 L52 59" stroke="#1c2330" strokeWidth="3.6" strokeLinecap="round" />
          {/* Sleek wolf torso */}
          <path
            d="M18 44 C19 32 28 28 41 29 C49 29 53 34 52 43 C44 47 26 48 18 44 Z"
            fill="#222b3a"
            stroke={rim}
            strokeOpacity={rimOpacity}
            strokeWidth="1.2"
          />
          {/* Thick ash mane ruff */}
          <path d="M39 27 L47 21 L54 29 L48 39 L39 36 Z" fill="#323f54" />
          {/* Wolf head & sharp snout */}
          <path
            d="M45 23 L50 13 L54 20 L58 14 L58 22 L66 26 L64 30 L54 32 L46 31 Z"
            fill="#2b364a"
            stroke={rim}
            strokeOpacity={rimOpacity}
            strokeWidth="1.1"
          />
          {/* Glowing amber/crimson eye */}
          <circle cx="56" cy="24.5" r="1.5" fill={danger ? '#ff6b5b' : '#efc06e'} />
        </g>
      )}

      {id === 'goat' && (
        <g>
          {/* Slender mountain hooves */}
          <path d="M24 46 L23 59 M30 47 L29 59 M44 46 L44 59 M49 46 L51 59" stroke="#5e5952" strokeWidth="3" strokeLinecap="round" />
          {/* Little upright tail */}
          <path d="M19 37 L14 31 L20 33 Z" fill="#dfd9cd" />
          {/* Woolly ivory highland body */}
          <path
            d="M19 42 C19 31 28 28 40 29 C48 29 52 34 51 44 C43 48 25 48 19 42 Z"
            fill="#e8e2d5"
            stroke={rim}
            strokeOpacity={rimOpacity}
            strokeWidth="1.2"
          />
          {/* Neck & Head */}
          <motion.g
            style={{ originX: '49px', originY: '32px' }}
            animate={danger ? { rotate: [0, 14, 0] } : { rotate: [0, 2.5, 0] }}
            transition={{ repeat: Infinity, duration: danger ? 0.65 : 4.2, ease: 'easeInOut' }}
          >
            <path d="M44 33 L49 18 L57 20 L63 26 L60 30 L52 32 Z" fill="#f3eee4" stroke={rim} strokeOpacity={rimOpacity * 0.8} strokeWidth="1" />
            {/* Goatee tuft */}
            <path d="M56 30 L58 36 L53 32 Z" fill="#cfc7b8" />
            {/* Curved dark mountain horns */}
            <path d="M50 18 C47 10 40 10 38 14" stroke="#3c3730" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M52 17 C50 10 44 10 42 13" stroke="#575046" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            {/* Eye */}
            <circle cx="56" cy="24" r="1.3" fill="#1a1815" />
          </motion.g>
        </g>
      )}

      {id === 'cabbage' && (
        <g>
          {/* Woven dark wicker basket base */}
          <path
            d="M19 45 H53 L48 58 H24 L19 45 Z"
            fill="#5e4329"
            stroke="#a88055"
            strokeOpacity="0.65"
            strokeWidth="1.1"
          />
          <line x1="22" y1="51" x2="50" y2="51" stroke="#3d2a18" strokeWidth="1.2" />
          {/* Soft botanical aura */}
          <circle cx="36" cy="36" r="19" fill="#6abf94" fillOpacity="0.16" className="animate-flame-breathe" />
          {/* Outer silver-sage leaves */}
          <path
            d="M21 44 C17 34 24 22 36 22 C48 22 55 34 51 44 Z"
            fill="#3b7a5e"
            stroke={rim}
            strokeOpacity={rimOpacity}
            strokeWidth="1.2"
          />
          {/* Inner curled luminous petals */}
          <path d="M25 44 C24 34 30 26 36 26 C42 26 48 34 47 44 Z" fill="#6abf94" />
          <path d="M30 43 C30 35 33 30 36 30 C39 30 42 35 42 43 Z" fill="#b7ebd0" />
          <path d="M36 26 C35 32 36 38 36 44" stroke="#e6faef" strokeOpacity="0.6" strokeWidth="1" />
        </g>
      )}
    </motion.svg>
  );
};

interface FerrymanProps {
  isRowing?: boolean;
  facing?: 'right' | 'left';
  height?: number;
}

/** Ferryman Vael seated in the cedar skiff with animated oar stroke */
export const FerrymanFigure: React.FC<FerrymanProps> = ({
  isRowing = false,
  facing = 'right',
  height = 62,
}) => {
  const width = Math.round(height * 0.9);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: facing === 'left' ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      {/* Hooded River Cloak */}
      <path
        d="M18 58 L23 27 C24 22 36 22 38 28 L42 58 Z"
        fill="#161c28"
        stroke="#e8a849"
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />
      {/* Hood */}
      <path
        d="M22 21 C22 11 27 7 32 7 C37 7 40 12 40 20 C40 24 36 26 31 26 C26 26 22 24 22 21 Z"
        fill="#1f2738"
        stroke="#e8a849"
        strokeOpacity="0.5"
        strokeWidth="1.1"
      />
      {/* Warm shadow profile */}
      <path d="M33 12 C37 13 38 17 37 22 C35 23 32 23 31 22 C33 19 34 15 33 12 Z" fill="#e0c7ae" fillOpacity="0.75" />

      {/* Animated Wooden Oar */}
      <motion.g
        style={{ originX: '34px', originY: '42px' }}
        animate={isRowing ? { rotate: [-22, 24, -22] } : { rotate: 4 }}
        transition={{
          repeat: isRowing ? Infinity : 0,
          duration: 0.72,
          ease: 'easeInOut',
        }}
      >
        <line x1="28" y1="34" x2="54" y2="66" stroke="#9e7448" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M51 61 L59 67 L55 70 L48 64 Z" fill="#b88956" />
      </motion.g>
    </svg>
  );
};

