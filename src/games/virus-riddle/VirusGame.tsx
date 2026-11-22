import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Grid2X2,
  History,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Undo2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { soundEngine } from '../../core/sound';
import type { ThemeMode } from '../../core/types';
import {
  calculateVirusStars,
  createInitialVirusState,
  moveToRoom,
  recordVirusHintUsed,
  TOTAL_VIRUS_ROOMS,
  undoVirusSteps,
  type LabCoord,
  type VirusGameState,
} from './engine';
import { getVirusDialogue } from './story';
import { VirusScene } from './VirusScene';
import { VirusHintPanel } from './VirusHintPanel';
import { VirusOutcomeModal } from './VirusOutcomeModal';
import { VirusPrologueModal } from './VirusPrologueModal';

interface VirusGameProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onBackToHub: () => void;
  onVictoryRecorded: (result: { timeMinutes: number; moves: number; stars: 1 | 2 | 3 }) => void;
  onAttemptStarted: () => void;
  skipInitialPrologue?: boolean;
}

export const VirusGame: React.FC<VirusGameProps> = ({
  theme,
  onToggleTheme,
  muted,
  onToggleMute,
  onBackToHub,
  onVictoryRecorded,
  onAttemptStarted,
  skipInitialPrologue = false,
}) => {
  const [state, setState] = useState<VirusGameState>(() => createInitialVirusState());
  const [showParity, setShowParity] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPrologue, setShowPrologue] = useState<boolean>(!skipInitialPrologue);
  const [hasSeenPrologue, setHasSeenPrologue] = useState<boolean>(skipInitialPrologue);
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'hints' | 'log'>('none');
  const [unlockedHintTier, setUnlockedHintTier] = useState<0 | 1 | 2 | 3>(0);

  const noticeTimerRef = useRef<number | null>(null);
  const victoryLoggedRef = useRef<boolean>(false);
  const isLight = theme === 'light';

  useEffect(() => {
    onAttemptStarted();
    return () => {
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 2200);
  };

  const handleMove = (target: LabCoord) => {
    if (state.status !== 'playing') return;
    setActiveDrawer('none');

    const res = moveToRoom(state, target);
    if (!res.move) {
      soundEngine.playError();
      if (res.error) showNotice(res.error);
      return;
    }

    const next = res.state;
    if (next.status === 'won') {
      soundEngine.playVictory();
      if (!victoryLoggedRef.current) {
        victoryLoggedRef.current = true;
        const stars = calculateVirusStars(next);
        onVictoryRecorded({
          timeMinutes: next.moves.length,
          moves: next.moves.length,
          stars: (stars || 1) as 1 | 2 | 3,
        });
      }
    } else if (next.status === 'exit_early' || next.status === 'stuck') {
      soundEngine.playEmptyTrap();
    } else {
      soundEngine.playAirlockStep(!res.move.revisitedCleanEntrance);
    }

    setState(next);
  };

  const handleUndoSteps = (count = 1) => {
    if (state.moves.length === 0) return;
    soundEngine.playUndo();
    setState((prev) => undoVirusSteps(prev, count));
  };

  const handleRestart = () => {
    setNotice(null);
    setUnlockedHintTier(0);
    setActiveDrawer('none');
    victoryLoggedRef.current = false;
    soundEngine.playUndo();
    setState(createInitialVirusState());
    onAttemptStarted();
  };

  const handleUnlockHint = (tier: 1 | 2 | 3) => {
    if (tier <= unlockedHintTier) return;
    soundEngine.playHint();
    setUnlockedHintTier(tier);
    setState((prev) => recordVirusHintUsed(prev));
  };

  // Keyboard: Arrow keys / WASD to walk rooms, Ctrl+Z / Backspace undo, Esc close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDrawer('none');
        if (hasSeenPrologue) setShowPrologue(false);
        return;
      }
      if (showPrologue) return;

      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') || e.key === 'Backspace') {
        e.preventDefault();
        handleUndoSteps(1);
        return;
      }

      if (state.status !== 'playing') return;
      const k = e.key.toLowerCase();
      const { row, col } = state.position;
      if (e.key === 'ArrowUp' || k === 'w') {
        e.preventDefault();
        handleMove({ row: row - 1, col });
      } else if (e.key === 'ArrowDown' || k === 's') {
        e.preventDefault();
        handleMove({ row: row + 1, col });
      } else if (e.key === 'ArrowRight' || k === 'd') {
        e.preventDefault();
        handleMove({ row, col: col + 1 });
      } else if (e.key === 'ArrowLeft' || k === 'a') {
        e.preventDefault();
        handleMove({ row, col: col - 1 });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const dialogue = getVirusDialogue(state);
  const progressPct = Math.min(100, (state.clearedVirusCount / TOTAL_VIRUS_ROOMS) * 100);

  return (
    <div className="relative flex min-h-screen flex-col bg-paper-100 text-paper-900 dark:bg-ink-950 dark:text-ivory-100 transition-colors duration-300">
      {/* Ultra-Clean Single-Row Top Bar */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 sm:px-6 pt-5 pb-3">
        <button
          type="button"
          onClick={onBackToHub}
          className="inline-flex items-center gap-2 text-xs font-medium text-paper-700 hover:text-paper-900 dark:text-ivory-300 dark:hover:text-ivory-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Archive</span>
        </button>

        {/* Center: Rooms Cleared Progress */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl sm:text-3xl font-medium tracking-tight tabular-nums ${
                state.status === 'won'
                  ? 'text-[#2f855a] dark:text-[#6abf94]'
                  : state.status === 'exit_early' || state.status === 'stuck'
                  ? 'text-[#c44536] dark:text-[#d45d4c]'
                  : 'text-paper-900 dark:text-ivory-100'
              }`}
            >
              {String(state.clearedVirusCount).padStart(2, '0')}
            </span>
            <span className="font-mono text-xs text-paper-700/75 dark:text-ivory-300/70 tabular-nums">
              / {TOTAL_VIRUS_ROOMS} rooms cleared
            </span>
          </div>

          <div className="relative mt-1.5 h-[2px] w-44 sm:w-56 overflow-hidden rounded-full bg-paper-900/12 dark:bg-white/10">
            <motion.div
              className={`h-full ${
                state.status === 'won'
                  ? 'bg-[#2f855a] dark:bg-[#6abf94]'
                  : state.status === 'exit_early' || state.status === 'stuck'
                  ? 'bg-[#c44536] dark:bg-[#d45d4c]'
                  : 'bg-gold-500 dark:bg-gold-400'
              }`}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Right Utility Icons */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => setShowPrologue(true)}
            className="rounded-full p-2 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
            title="Story & Rules"
            aria-label="Story & Rules"
          >
            <BookOpen className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer((d) => (d === 'log' ? 'none' : 'log'))}
            className={`relative rounded-full p-2 transition ${
              activeDrawer === 'log'
                ? 'bg-paper-900/10 text-paper-900 dark:bg-white/10 dark:text-ivory-100'
                : 'text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100'
            }`}
            title="Path Log"
            aria-label="Path Log"
          >
            <History className="h-4 w-4" />
            {state.moves.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-paper-900 text-paper-50 dark:bg-ink-700 dark:text-ivory-100 px-1 font-mono text-[9px] border border-paper-50 dark:border-white/15">
                {state.moves.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer((d) => (d === 'hints' ? 'none' : 'hints'))}
            className={`rounded-full p-2 transition ${
              activeDrawer === 'hints'
                ? 'bg-gold-500/15 text-gold-600 dark:bg-gold-400/15 dark:text-gold-300'
                : 'text-paper-700 hover:bg-paper-900/[0.06] hover:text-gold-600 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-gold-300'
            }`}
            title="Hints"
            aria-label="Hints"
          >
            <Sparkles className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              onToggleTheme();
            }}
            className="rounded-full p-2 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
            title={isLight ? 'Dark Mode' : 'Light Mode'}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
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
            className="rounded-full p-2 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Centered Play Canvas */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 sm:px-6 pb-8 pt-1">
        {/* Always-Visible, Easy-to-Understand Instructions Strip on Solving Page */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-2xl border border-paper-900/10 bg-paper-50/85 dark:border-white/[0.07] dark:bg-ink-900/75 px-4 py-2.5 text-[11px] sm:text-xs text-paper-700 dark:text-ivory-300">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-600 dark:text-gold-300">
            Instructions
          </span>
          <span>
            Clear all <strong className="text-paper-900 dark:text-ivory-100">15 virus rooms</strong>
          </span>
          <span className="hidden sm:inline text-paper-900/20 dark:text-white/20">|</span>
          <span>
            End at <strong className="text-paper-900 dark:text-ivory-100">SE Exit</strong>
          </span>
          <span className="hidden sm:inline text-paper-900/20 dark:text-white/20">|</span>
          <span>Leaving a cleared room seals it forever · NW Entrance starts clean</span>
        </div>

        {/* Hero 4x4 Quarantine Grid Blueprint */}
        <VirusScene
          state={state}
          showParity={showParity}
          theme={theme}
          onMove={handleMove}
        />

        {/* Quiet Single-Line Status Whisper */}
        <div className="mt-3.5 min-h-[26px] flex items-center justify-center px-2 text-center">
          <AnimatePresence mode="wait">
            {notice ? (
              <motion.p
                key={`notice-${notice}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs sm:text-sm font-medium text-[#c44536] dark:text-[#e07a6b]"
              >
                {notice}
              </motion.p>
            ) : (
              <motion.p
                key={`line-${dialogue.line}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
                className="text-xs sm:text-sm text-paper-700 dark:text-ivory-300/90 max-w-2xl"
              >
                <span className="text-paper-900 dark:text-ivory-100/90 font-medium">
                  {dialogue.speaker}
                </span>
                <span className="mx-2 text-paper-900/20 dark:text-white/20">—</span>
                <span className="italic">{dialogue.line}</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Minimal Bottom Action Dock */}
        <div className="mt-4 flex items-center justify-between gap-3 max-w-xl w-full mx-auto">
          <button
            type="button"
            onClick={() => handleUndoSteps(1)}
            disabled={state.moves.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 disabled:opacity-25 disabled:pointer-events-none transition"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>

          {/* Optional Subtle Chessboard Parity Overlay Toggle */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playSelect();
              setShowParity((v) => !v);
            }}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
              showParity
                ? 'bg-paper-900 text-paper-50 dark:bg-gold-400/20 dark:text-gold-200 border border-gold-400/35'
                : 'border border-paper-900/12 text-paper-700 hover:bg-paper-900/[0.05] dark:border-white/12 dark:text-ivory-300 dark:hover:bg-white/[0.06]'
            }`}
          >
            <Grid2X2 className="h-3.5 w-3.5" />
            <span>{showParity ? 'Parity Grid: On' : 'Parity Grid'}</span>
          </button>

          <button
            type="button"
            onClick={handleRestart}
            disabled={state.moves.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 disabled:opacity-25 disabled:pointer-events-none transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </main>

      {/* Popovers: Hints & Path Log */}
      <AnimatePresence>
        {activeDrawer === 'hints' && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/45 dark:bg-black/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl">
              <VirusHintPanel
                state={state}
                unlockedTier={unlockedHintTier}
                showParity={showParity}
                onToggleParity={() => setShowParity((v) => !v)}
                onUnlockTier={handleUnlockHint}
                onUndoSteps={(count) => {
                  handleUndoSteps(count);
                  setActiveDrawer('none');
                }}
                onClose={() => setActiveDrawer('none')}
              />
            </div>
          </div>
        )}

        {activeDrawer === 'log' && (
          <div
            className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/45 dark:bg-black/55 p-4 backdrop-blur-sm"
            onClick={() => setActiveDrawer('none')}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="surface-glass w-full max-w-md rounded-2xl p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-paper-900/10 dark:border-white/[0.08]">
                <h3 className="font-display text-xl font-semibold text-paper-900 dark:text-ivory-100">
                  Sterilization Log
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  className="rounded-full p-1.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100"
                  aria-label="Close log"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {state.moves.length === 0 ? (
                <p className="py-10 text-center text-sm text-paper-700 dark:text-ivory-300/75">
                  Standing in the clean NW Entrance (Row 1, Col 1).
                </p>
              ) : (
                <ol className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1 text-xs font-mono">
                  {state.moves.map((m) => (
                    <li
                      key={m.step}
                      className="flex items-center justify-between py-1.5 border-b border-paper-900/[0.06] dark:border-white/[0.05] last:border-0"
                    >
                      <span className="text-paper-900 dark:text-ivory-100">
                        #{m.step} · Row {m.to.row + 1}, Col {m.to.col + 1}
                      </span>
                      <span
                        className={
                          m.revisitedCleanEntrance
                            ? 'text-sky-600 dark:text-sky-300 font-semibold'
                            : 'text-[#2f855a] dark:text-[#6abf94]'
                        }
                      >
                        {m.revisitedCleanEntrance ? 'Revisited Entrance' : 'Sterilized'}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prologue Modal */}
      <AnimatePresence>
        {showPrologue && (
          <VirusPrologueModal
            isReplayInfo={hasSeenPrologue}
            onStart={() => {
              soundEngine.playSelect();
              setShowPrologue(false);
              setHasSeenPrologue(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Outcome Modal (Victory or Exit Entered Early) */}
      <AnimatePresence>
        {(state.status === 'won' || state.status === 'exit_early') && (
          <VirusOutcomeModal
            state={state}
            onRestart={handleRestart}
            onUndoLast={() => handleUndoSteps(1)}
            onBackToHub={onBackToHub}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

