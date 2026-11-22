import React from 'react';
import { motion } from 'framer-motion';
import type { TravelerId } from './engine';

interface FigureProps {
  id: TravelerId;
  height?: number;
  isWalking?: boolean;
  isSelected?: boolean;
  lit?: boolean;
  facing?: 'right' | 'left';
  className?: string;
}

/**
 * Full-body stylized vector figures inspired by atmospheric indie games
 * (Alto's Odyssey / Monument Valley / Limbo). Clean silhouettes with
 * subtle warm rim lighting when near the lantern.
 */
export const TravelerFigure: React.FC<FigureProps> = ({
  id,
  height = 76,
  isWalking = false,
  isSelected = false,
  lit = true,
  facing = 'right',
  className = '',
}) => {
  const width = Math.round(height * 0.68);
  const rim = isSelected ? '#f6d79c' : lit ? '#e8a849' : '#4a5568';
  const rimOpacity = isSelected ? 0.95 : lit ? 0.55 : 0.2;

  const legSwingLeft = isWalking
    ? { rotate: [-18, 18, -18] }
    : { rotate: 0 };
  const legSwingRight = isWalking
    ? { rotate: [18, -18, 18] }
    : { rotate: 0 };
  const walkSpeed = id === 'lyra' ? 0.34 : id === 'tomas' ? 0.42 : id === 'garrick' ? 0.56 : 0.72;

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox="0 0 60 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ transform: facing === 'left' ? 'scaleX(-1)' : undefined }}
      animate={
        isWalking
          ? { y: [0, -2.5, 0] }
          : { y: [0, -1.2, 0] }
      }
      transition={{
        duration: isWalking ? walkSpeed * 0.5 : 3.2 + (id === 'lyra' ? 0 : id === 'tomas' ? 0.4 : id === 'garrick' ? 0.9 : 1.3),
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    >
      {/* Subtle ground shadow */}
      <ellipse
        cx="30"
        cy="83"
        rx={isSelected ? 16 : 13}
        ry="3.2"
        fill={isSelected ? '#e8a849' : '#000000'}
        fillOpacity={isSelected ? 0.35 : 0.45}
      />

      {id === 'lyra' && (
        <g>
          {/* Animated slender legs */}
          <motion.line
            x1="27"
            y1="61"
            x2="24"
            y2="82"
            stroke="#1b262c"
            strokeWidth="3.2"
            strokeLinecap="round"
            style={{ originX: '27px', originY: '61px' }}
            animate={legSwingLeft}
            transition={{ repeat: Infinity, duration: walkSpeed, ease: 'easeInOut' }}
          />
          <motion.line
            x1="33"
            y1="61"
            x2="36"
            y2="82"
            stroke="#24343c"
            strokeWidth="3.2"
            strokeLinecap="round"
            style={{ originX: '33px', originY: '61px' }}
            animate={legSwingRight}
            transition={{ repeat: Infinity, duration: walkSpeed, ease: 'easeInOut' }}
          />
          {/* Trailing wind-swept courier scarf */}
          <motion.path
            d="M24 31 C15 34 11 40 6 43 C12 45 19 42 25 38 Z"
            fill="#4ea88a"
            animate={{ d: [
              'M24 31 C15 34 11 40 6 43 C12 45 19 42 25 38 Z',
              'M24 31 C14 31 9 36 4 38 C11 42 18 40 25 38 Z',
              'M24 31 C15 34 11 40 6 43 C12 45 19 42 25 38 Z',
            ]}}
            transition={{ repeat: Infinity, duration: isWalking ? 0.5 : 3.2, ease: 'easeInOut' }}
          />
          {/* Agile tapered hooded cloak */}
          <path
            d="M21 63 L24 32 C25 27 35 27 36 32 L40 63 C34 65 26 65 21 63 Z"
            fill="#172429"
            stroke={rim}
            strokeOpacity={rimOpacity}
            strokeWidth="1.2"
          />
          {/* Scarf collar */}
          <path d="M23 32 C28 35 34 35 37 32 L36 37 C31 39 27 39 23 36 Z" fill="#63be9f" />
          {/* Hood & Head */}
          <path
            d="M22 25 C22 15 26 11 31 11 C36 11 39 16 39 24 C39 29 35 32 30 32 C25 32 22 29 22 25 Z"
            fill="#1f3138"
            stroke={rim}
            strokeOpacity={rimOpacity}
            strokeWidth="1.1"
          />
          {/* Soft warm profile highlight */}
          <path d="M32 16 C36 17 37 22 36 27 C34 29 31 29 30 28 C32 24 33 20 32 16 Z" fill="#ebd4ba" fillOpacity="0.9" />
        </g>
      )}

      {id === 'tomas' && (
        <g>
          {/* Legs */}
          <motion.line
            x1="27"
            y1="61"
            x2="24"
            y2="82"
            stroke="#1a2230"
            strokeWidth="3.6"
            strokeLinecap="round"
            style={{ originX: '27px', originY: '61px' }}
            animate={legSwingLeft}
            transition={{ repeat: Infinity, duration: walkSpeed, ease: 'easeInOut' }}
          />
          <motion.line
            x1="34"
            y1="61"
            x2="37"
            y2="82"
            stroke="#222d40"
            strokeWidth="3.6"
            strokeLinecap="round"
            style={{ originX: '34px', originY: '61px' }}
            animate={legSwingRight}
            transition={{ repeat: Infinity, duration: walkSpeed, ease: 'easeInOut' }}
          />
          {/* Brass map cylinder across back */}
          <rect
            x="16"
            y="28"
            width="5.5"
            height="27"
            rx="2.5"
            transform="rotate(25 16 28)"
            fill="#b87d32"
            stroke="#f0cc8c"
            strokeOpacity="0.65"
            strokeWidth="0.9"
          />
          {/* Structured trench coat */}
          <path
            d="M20 65 L23 32 C24 28 36 28 38 32 L41 65 C35 67 25 67 20 65 Z"
            fill="#1b2638"
            stroke={rim}
            strokeOpacity={rimOpacity}
            strokeWidth="1.2"
          />
          {/* Crossbody strap */}
          <line x1="25" y1="32" x2="38" y2="54" stroke="#8a5a2b" strokeWidth="2.4" strokeLinecap="round" />
          {/* Head */}
          <circle cx="31" cy="21" r="7.5" fill="#e6cbb0" />
          {/* Cartographer brimmed hat */}
          <path d="M22 18 C23 11 27 9 31 9 C35 9 39 11 40 18 Z" fill="#23324a" stroke={rim} strokeOpacity={rimOpacity} strokeWidth="1" />
          <path d="M18 18.5 H44" stroke="#5c82ad" strokeWidth="2.3" strokeLinecap="round" />
        </g>
      )}

      {id === 'garrick' && (
        <g>
          {/* Heavy booted legs */}
          <motion.line
            x1="25"
            y1="60"
            x2="23"
            y2="82"
            stroke="#1f1a18"
            strokeWidth="5"
            strokeLinecap="round"
            style={{ originX: '25px', originY: '60px' }}
            animate={legSwingLeft}
            transition={{ repeat: Infinity, duration: walkSpeed, ease: 'easeInOut' }}
          />
          <motion.line
            x1="35"
            y1="60"
            x2="37"
            y2="82"
            stroke="#2b2320"
            strokeWidth="5"
            strokeLinecap="round"
            style={{ originX: '35px', originY: '60px' }}
            animate={legSwingRight}
            transition={{ repeat: Infinity, duration: walkSpeed, ease: 'easeInOut' }}
          />
          {/* Heavy salvage pack on back */}
          <rect
            x="11"
            y="29"
            width="13"
            height="25"
            rx="3.5"
            fill="#32251e"
            stroke="#8f6545"
            strokeOpacity="0.65"
            strokeWidth="1.1"
          />
          {/* Broad blacksmith torso & leather apron */}
          <path
            d="M18 63 L19 31 C21 26 40 26 42 31 L43 63 C35 65 25 65 18 63 Z"
            fill="#2d1f1a"
            stroke={rim}
            strokeOpacity={rimOpacity}
            strokeWidth="1.2"
          />
          <path d="M23 34 H38 L39 63 H22 Z" fill="#462b1c" stroke="#c87b48" strokeOpacity="0.45" strokeWidth="0.9" />
          {/* Head & thick beard */}
          <circle cx="31" cy="20" r="8" fill="#dfb998" />
          <path d="M23 19 C23 12 27 10 31 10 C35 10 39 12 39 19 C36 16 26 16 23 19 Z" fill="#231915" />
          <path d="M24 22 C24 28 27 31 31 31 C35 31 38 28 38 22 C35 25 27 25 24 22 Z" fill="#2f2019" />
        </g>
      )}

      {id === 'orin' && (
        <g>
          {/* Slow shuffling boots beneath robe */}
          <motion.circle
            cx="26"
            cy="81"
            r="3"
            fill="#191624"
            animate={isWalking ? { cx: [24, 29, 24] } : { cx: 26 }}
            transition={{ repeat: Infinity, duration: walkSpeed, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="34"
            cy="81"
            r="3"
            fill="#221e30"
            animate={isWalking ? { cx: [36, 31, 36] } : { cx: 34 }}
            transition={{ repeat: Infinity, duration: walkSpeed, ease: 'easeInOut' }}
          />
          {/* Long archivist robe, slightly stooped */}
          <path
            d="M17 80 L22 33 C24 27 36 27 38 33 L42 80 C34 82 24 82 17 80 Z"
            fill="#211b2e"
            stroke={rim}
            strokeOpacity={rimOpacity}
            strokeWidth="1.2"
          />
          {/* Subtle gold stole trim */}
          <path d="M30 33 L32 80" stroke="#e8a849" strokeOpacity="0.45" strokeWidth="1.4" />
          {/* Walking staff with glowing Solar Chronometer */}
          <motion.g
            style={{ originX: '45px', originY: '52px' }}
            animate={isWalking ? { rotate: [-6, 8, -6] } : { rotate: 0 }}
            transition={{ repeat: Infinity, duration: walkSpeed, ease: 'easeInOut' }}
          >
            <line x1="47" y1="24" x2="45" y2="82" stroke="#8f6c43" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="47.2" cy="21" r="6.5" fill="#e8a849" fillOpacity="0.24" className="animate-flame-breathe" />
            <circle cx="47.2" cy="21" r="3" fill="#f8e3b4" stroke="#e8a849" strokeWidth="1" />
          </motion.g>
          {/* Head & flowing silver beard */}
          <circle cx="30" cy="21.5" r="7.2" fill="#e8ccb4" />
          <path d="M22 18.5 C23 12 26.5 10 30 10 C33.5 10 37 12 38 18.5 Z" fill="#2e2442" stroke={rim} strokeOpacity={rimOpacity} strokeWidth="1" />
          <path d="M23.5 23 C23.5 31 27 37 30 39 C33 37 36.5 31 36.5 23 C33.5 26 26.5 26 23.5 23 Z" fill="#dad5ce" />
        </g>
      )}
    </motion.svg>
  );
};

/** Compact avatar export for modals & compact briefings */
export const TravelerAvatar: React.FC<{ id: TravelerId; size?: number; className?: string }> = ({
  id,
  size = 52,
  className = '',
}) => (
  <div
    className={`flex items-end justify-center overflow-hidden rounded-full bg-ink-950/90 border border-white/10 ${className}`}
    style={{ width: size, height: size }}
  >
    <TravelerFigure id={id} height={Math.round(size * 1.1)} lit />
  </div>
);

export const BrassLanternIcon: React.FC<{
  size?: number;
  className?: string;
  glowing?: boolean;
}> = ({ size = 34, className = '', glowing = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {glowing && (
      <circle cx="22" cy="24" r="19" fill="url(#cleanLanternGlow)" className="animate-flame-breathe" />
    )}
    <path d="M18 10 C18 6.8 26 6.8 26 10" stroke="#e8a849" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M15 14 H29 L26.5 10 H17.5 L15 14 Z" fill="#9a6423" stroke="#f6d79c" strokeWidth="0.9" />
    <rect
      x="16"
      y="14"
      width="12"
      height="17"
      rx="1.5"
      fill="#f6d79c"
      fillOpacity="0.16"
      stroke="#e8a849"
      strokeWidth="1.2"
    />
    <path
      d="M22 17.5 C24.4 20.6 25.5 23 25.5 25.4 C25.5 27.6 23.9 29.2 22 29.2 C20.1 29.2 18.5 27.6 18.5 25.4 C18.5 23 19.6 20.6 22 17.5 Z"
      fill="#e8a849"
    />
    <path
      d="M22 21 C23.3 23 23.9 24.4 23.9 25.7 C23.9 26.9 23 27.8 22 27.8 C21 27.8 20.1 26.9 20.1 25.7 C20.1 24.4 20.7 23 22 21 Z"
      fill="#fff6dc"
    />
    <rect x="14" y="31" width="16" height="3.8" rx="1.2" fill="#825219" stroke="#f6d79c" strokeWidth="0.9" />
    <defs>
      <radialGradient
        id="cleanLanternGlow"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(22 24) rotate(90) scale(19)"
      >
        <stop stopColor="#f6d79c" stopOpacity="0.82" />
        <stop offset="0.5" stopColor="#e8a849" stopOpacity="0.28" />
        <stop offset="1" stopColor="#e8a849" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);
