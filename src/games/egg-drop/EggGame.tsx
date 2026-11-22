import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowLeft,
  BookOpen,
  History,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { soundEngine } from '../../core/sound';
import type { ThemeMode } from '../../core/types';
import {
  calculateEggStars,
  createInitialEggState,
  dropEggFromFloor,
  getUntestedFloorRange,
  MAX_DROPS,
  recordEggHintUsed,
  TOTAL_FLOORS,
  type EggDropState,
} from './engine';
import { getEggDialogue } from './story';
import { CrystalEggIcon, EggScene, type ActiveDropAnimation } from './EggScene';
import { EggHintPanel } from './EggHintPanel';
import { EggOutcomeModal } from './EggOutcomeModal';
import { EggPrologueModal } from './EggPrologueModal';

interface EggGameProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onBackToHub: () => void;
  onVictoryRecorded: (result: { timeMinutes: number; moves: number; stars: 1 | 2 | 3 }) => void;
  onAttemptStarted: () => void;
  skipInitialPrologue?: boolean;
}

export const EggGame: React.FC<EggGameProps> = ({
  theme,
  onToggleTheme,
  muted,
  onToggleMute,
  onBackToHub,
  onVictoryRecorded,
  onAttemptStarted,
  skipInitialPrologue = false,
}) => {
  const [state, setState] = useState<EggDropState>(() => createInitialEggState());
  const [selectedFloor, setSelectedFloor] = useState<number>(14);
  const [dropping, setDropping] = useState<ActiveDropAnimation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPrologue, setShowPrologue] = useState<boolean>(!skipInitialPrologue);
  const [hasSeenPrologue, setHasSeenPrologue] = useState<boolean>(skipInitialPrologue);
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'hints' | 'log'>('none');
  const [unlockedHintTier, setUnlockedHintTier] = useState<0 | 1 | 2 | 3>(0);

  const timerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const victoryLoggedRef = useRef<boolean>(false);
  const isLight = theme === 'light';

  const clearTimers = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    onAttemptStarted();
    return () => {
      clearTimers();
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 2200);
  };

  const range = getUntestedFloorRange(state);
  const clampFloor = (f: number, st: EggDropState = state) => {
    const r = getUntestedFloorRange(st);
    if (r.count === 0) return st.lowSafe;
    return Math.max(r.min, Math.min(r.max, f));
  };

  const handleDrop = () => {
    if (dropping || state.status !== 'playing') return;

    const result = dropEggFromFloor(state, selectedFloor);
    if (!result.record) {
      soundEngine.playError();
      if (result.error) showNotice(result.error);
      return;
    }

    setActiveDrawer('none');
    const durationMs = Math.round(540 + (selectedFloor / TOTAL_FLOORS) * 320);
    setDropping({
      floor: selectedFloor,
      outcome: result.record.outcome,
      durationMs,
    });

    // Play bounce or shatter synced to courtyard impact (~65% through animation)
    const impactDelay = Math.round(durationMs * 0.65);
    const impactTimer = window.setTimeout(() => {
      if (result.record?.outcome === 'survived') {
        soundEngine.playEggBounce();
      } else {
        soundEngine.playEggShatter();
      }
    }, impactDelay);

    timerRef.current = window.setTimeout(() => {
      window.clearTimeout(impactTimer);
      setDropping(null);
      setState(result.state);

      const nextRange = getUntestedFloorRange(result.state);
      if (nextRange.count > 0) {
        // When down to 1 egg, position cursor cleanly at lowSafe + 1; otherwise step upward cleanly
        if (result.state.eggsLeft === 1) {
          setSelectedFloor(nextRange.min);
        } else {
          setSelectedFloor(clampFloor(selectedFloor + 10, result.state));
        }
      }

      if (result.state.status === 'won') {
        soundEngine.playVictory();
        if (!victoryLoggedRef.current) {
          victoryLoggedRef.current = true;
          const stars = calculateEggStars(result.state);
          onVictoryRecorded({
            timeMinutes: result.state.dropsUsed,
            moves: result.state.dropsUsed,
            stars: (stars || 1) as 1 | 2 | 3,
          });
        }
      } else if (result.state.status !== 'playing') {
        soundEngine.playCollapse();
      }
    }, durationMs);
  };

  const handleRestart = () => {
    clearTimers();
    setDropping(null);
    setNotice(null);
    setUnlockedHintTier(0);
    setActiveDrawer('none');
    victoryLoggedRef.current = false;
    soundEngine.playUndo();
    setState(createInitialEggState());
    setSelectedFloor(14);
    onAttemptStarted();
  };

  const handleUnlockHint = (tier: 1 | 2 | 3) => {
    if (tier <= unlockedHintTier) return;
    soundEngine.playHint();
    setUnlockedHintTier(tier);
    setState((prev) => recordEggHintUsed(prev));
  };

  // Keyboard: ArrowUp/Down adjust floor, Enter drops, Esc closes popovers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDrawer('none');
        if (hasSeenPrologue) setShowPrologue(false);
        return;
      }
      if (showPrologue || state.status !== 'playing' || dropping) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedFloor((f) => clampFloor(f + (e.shiftKey ? 10 : 1)));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedFloor((f) => clampFloor(f - (e.shiftKey ? 10 : 1)));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleDrop();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const dialogue = getEggDialogue(state, Boolean(dropping));
  const progressPct = Math.min(100, (state.dropsUsed / MAX_DROPS) * 100);

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

        {/* Center: Drops Counter & Intact Eggs */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`font-mono text-2xl sm:text-3xl font-medium tracking-tight tabular-nums ${
                  state.status === 'won'
                    ? 'text-[#2f855a] dark:text-[#6abf94]'
                    : state.status !== 'playing'
                    ? 'text-[#c44536] dark:text-[#d45d4c]'
                    : 'text-paper-900 dark:text-ivory-100'
                }`}
              >
                {String(state.dropsUsed).padStart(2, '0')}
              </span>
              <span className="font-mono text-xs text-paper-700/75 dark:text-ivory-300/70 tabular-nums">
                / {MAX_DROPS} drops
              </span>
            </div>

            <div className="flex items-center gap-1 pl-2 border-l border-paper-900/15 dark:border-white/15">
              <CrystalEggIcon intact={state.eggsLeft >= 1} size={15} />
              <CrystalEggIcon intact={state.eggsLeft >= 2} size={15} />
            </div>
          </div>

          <div className="relative mt-1.5 h-[2px] w-44 sm:w-56 overflow-hidden rounded-full bg-paper-900/12 dark:bg-white/10">
            <motion.div
              className={`h-full ${
                state.status === 'won'
                  ? 'bg-[#2f855a] dark:bg-[#6abf94]'
                  : state.status !== 'playing'
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
            title="Drop Log"
            aria-label="Drop Log"
          >
            <History className="h-4 w-4" />
            {state.history.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-paper-900 text-paper-50 dark:bg-ink-700 dark:text-ivory-100 px-1 font-mono text-[9px] border border-paper-50 dark:border-white/15">
                {state.history.length}
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
        {/* Always-Visible, Easy-to-Understand Rules Summary Strip */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-2xl border border-paper-900/10 bg-paper-50/85 dark:border-white/[0.07] dark:bg-ink-900/75 px-4 py-2.5 text-[11px] sm:text-xs text-paper-700 dark:text-ivory-300">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-600 dark:text-gold-300">
            Instructions
          </span>
          <span>
            <strong className="text-paper-900 dark:text-ivory-100">2 Eggs</strong> ·{' '}
            <strong className="text-paper-900 dark:text-ivory-100">14 Drops Max</strong>
          </span>
          <span className="hidden sm:inline text-paper-900/20 dark:text-white/20">|</span>
          <span>Survives = Reuse egg · Breaks = Lose 1 egg</span>
          <span className="hidden sm:inline text-paper-900/20 dark:text-white/20">|</span>
          <span>
            Goal: Prove the exact <strong className="text-paper-900 dark:text-ivory-100">highest safe floor</strong>
          </span>
        </div>

        {/* Hero 100-Floor Belltower Stage */}
        <EggScene
          state={state}
          selectedFloor={selectedFloor}
          dropping={dropping}
          theme={theme}
          onSelectFloor={(fl) => {
            soundEngine.playSelect();
            setSelectedFloor(clampFloor(fl));
          }}
        />

        {/* Whisper-Quiet Single-Line Status */}
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

        {/* Clean Floor Selector & Drop Action Dock */}
        <div className="mt-4 mx-auto w-full max-w-2xl rounded-2xl border border-paper-900/10 bg-paper-50/80 dark:border-white/[0.08] dark:bg-ink-900/75 px-4 sm:px-5 py-3.5">
          {/* Precision Floor Slider + Stepper Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={Boolean(dropping) || state.status !== 'playing' || selectedFloor <= range.min}
              onClick={() => setSelectedFloor((f) => clampFloor(f - 1))}
              className="rounded-full p-1.5 border border-paper-900/15 text-paper-800 hover:bg-paper-900/[0.06] dark:border-white/15 dark:text-ivory-200 dark:hover:bg-white/[0.08] disabled:opacity-30 transition"
              aria-label="Lower floor by 1"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <div className="flex-1 flex flex-col">
              <input
                type="range"
                min={Math.max(1, range.min)}
                max={Math.max(range.min, range.max)}
                value={clampFloor(selectedFloor)}
                disabled={Boolean(dropping) || state.status !== 'playing' || range.count === 0}
                onChange={(e) => setSelectedFloor(Number(e.target.value))}
                className="w-full accent-gold-500 dark:accent-gold-400 cursor-pointer"
                aria-label="Choose floor to drop from"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-paper-700/75 dark:text-ivory-300/60">
                <span>Min: F{range.min}</span>
                <span>Selected: Floor {selectedFloor}</span>
                <span>Max: F{range.max}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={Boolean(dropping) || state.status !== 'playing' || selectedFloor >= range.max}
              onClick={() => setSelectedFloor((f) => clampFloor(f + 1))}
              className="rounded-full p-1.5 border border-paper-900/15 text-paper-800 hover:bg-paper-900/[0.06] dark:border-white/15 dark:text-ivory-200 dark:hover:bg-white/[0.08] disabled:opacity-30 transition"
              aria-label="Raise floor by 1"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action Row */}
          <div className="mt-3.5 pt-3 border-t border-paper-900/[0.07] dark:border-white/[0.06] flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-paper-700/70 dark:text-ivory-300/60 hidden sm:inline">
              {range.count} untested floor{range.count === 1 ? '' : 's'}
            </span>

            <motion.button
              type="button"
              whileTap={!dropping && state.status === 'playing' ? { scale: 0.97 } : undefined}
              disabled={Boolean(dropping) || state.status !== 'playing'}
              onClick={handleDrop}
              className="inline-flex flex-1 sm:flex-initial min-w-[210px] items-center justify-center gap-2 rounded-full bg-paper-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 disabled:opacity-45 transition shadow-[0_8px_24px_-8px_rgba(26,24,21,0.35)] dark:shadow-[0_8px_28px_-8px_rgba(232,168,73,0.5)]"
            >
              <ArrowDown className="h-4 w-4" />
              <span>
                {dropping
                  ? `Dropping from Floor ${dropping.floor}...`
                  : `Drop Egg from Floor ${selectedFloor}`}
              </span>
            </motion.button>

            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </main>

      {/* Popovers: Hints & Drop Log */}
      <AnimatePresence>
        {activeDrawer === 'hints' && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/45 dark:bg-black/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl">
              <EggHintPanel
                state={state}
                unlockedTier={unlockedHintTier}
                onUnlockTier={handleUnlockHint}
                onAimFloor={(fl) => {
                  soundEngine.playSelect();
                  setSelectedFloor(clampFloor(fl));
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
                  Drop Log
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  className="rounded-full p-1.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100"
                  aria-label="Close drop log"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {state.history.length === 0 ? (
                <p className="py-10 text-center text-sm text-paper-700 dark:text-ivory-300/75">
                  No eggs dropped yet.
                </p>
              ) : (
                <ol className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1 text-xs font-mono">
                  {state.history.map((rec) => (
                    <li
                      key={rec.dropNumber}
                      className="flex items-center justify-between py-1.5 border-b border-paper-900/[0.06] dark:border-white/[0.05] last:border-0"
                    >
                      <span className="text-paper-900 dark:text-ivory-100">
                        #{rec.dropNumber} · Floor {rec.floor}
                      </span>
                      <span
                        className={
                          rec.outcome === 'survived'
                            ? 'text-[#2f855a] dark:text-[#6abf94]'
                            : 'text-[#c44536] dark:text-[#e07a6b] font-semibold'
                        }
                      >
                        {rec.outcome === 'survived' ? 'Survived' : 'Shattered'}
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
          <EggPrologueModal
            isReplayInfo={hasSeenPrologue}
            onStart={() => {
              soundEngine.playSelect();
              setShowPrologue(false);
              setHasSeenPrologue(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Outcome Modal */}
      <AnimatePresence>
        {state.status !== 'playing' && !dropping && (
          <EggOutcomeModal
            state={state}
            onRestart={handleRestart}
            onBackToHub={onBackToHub}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

