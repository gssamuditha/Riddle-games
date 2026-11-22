import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
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
  calculateStarRating,
  commitCrossing,
  createInitialBridgeState,
  previewCrossing,
  recordHintUsed,
  toggleTravelerSelection,
  undoLastCrossing,
  type BridgeGameState,
  type TravelerId,
} from './engine';
import { formatTravelerNames, getDynamicDialogue } from './story';
import { BridgeScene, type ActiveCrossingAnimation } from './BridgeScene';
import { HintPanel } from './HintPanel';
import { OutcomeModal } from './OutcomeModal';
import { PrologueModal } from './PrologueModal';

interface BridgeGameProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onBackToHub: () => void;
  onVictoryRecorded: (result: { timeMinutes: number; moves: number; stars: 1 | 2 | 3 }) => void;
  onAttemptStarted: () => void;
  skipInitialPrologue?: boolean;
}

function getAnimationMs(crossingMinutes: number): number {
  if (crossingMinutes <= 1) return 950;
  if (crossingMinutes <= 2) return 1150;
  if (crossingMinutes <= 5) return 1500;
  return 1900;
}

export const BridgeGame: React.FC<BridgeGameProps> = ({
  theme,
  onToggleTheme,
  muted,
  onToggleMute,
  onBackToHub,
  onVictoryRecorded,
  onAttemptStarted,
  skipInitialPrologue = false,
}) => {
  const [state, setState] = useState<BridgeGameState>(() => createInitialBridgeState());
  const [displayMinutes, setDisplayMinutes] = useState<number>(0);
  const [crossing, setCrossing] = useState<ActiveCrossingAnimation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPrologue, setShowPrologue] = useState<boolean>(!skipInitialPrologue);
  const [hasSeenPrologue, setHasSeenPrologue] = useState<boolean>(skipInitialPrologue);
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'hints' | 'log'>('none');
  const [unlockedHintTier, setUnlockedHintTier] = useState<0 | 1 | 2 | 3>(0);

  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const victoryLoggedRef = useRef<boolean>(false);
  const isLight = theme === 'light';

  const clearAnimations = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    onAttemptStarted();
    return () => {
      clearAnimations();
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!crossing) {
      setDisplayMinutes(state.elapsedMinutes);
    }
  }, [state.elapsedMinutes, crossing]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 2400);
  };

  const handleToggleTraveler = (id: TravelerId) => {
    if (crossing || state.status !== 'playing') return;
    const wasSelected = state.selected.includes(id);
    const result = toggleTravelerSelection(state, id);

    if (result.error) {
      soundEngine.playError();
      showNotice(result.error);
      return;
    }

    if (wasSelected) {
      soundEngine.playDeselect();
    } else {
      soundEngine.playSelect();
    }
    setState(result.state);
  };

  const handleCross = () => {
    if (crossing) return;
    const preview = previewCrossing(state);
    if (!preview.canCross) {
      soundEngine.playError();
      if (preview.reason) showNotice(preview.reason);
      return;
    }

    setActiveDrawer('none');
    const durationMs = getAnimationMs(preview.duration);
    const startMinutes = state.elapsedMinutes;
    const targetMinutes = preview.projectedTotal;
    const travelingIds = [...state.selected];

    setCrossing({
      travelers: travelingIds,
      from: preview.from,
      to: preview.to,
      durationMs,
    });

    const startTime = performance.now();
    const tickClock = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const currentVal = Math.round(startMinutes + (targetMinutes - startMinutes) * progress);
      setDisplayMinutes(currentVal);
      if (progress < 1) {
        rafRef.current = window.requestAnimationFrame(tickClock);
      }
    };
    rafRef.current = window.requestAnimationFrame(tickClock);

    soundEngine.playBridgeCreak();
    const stepCount = Math.max(2, Math.floor(durationMs / 320));
    for (let i = 0; i < stepCount; i++) {
      const stepTimer = window.setTimeout(() => {
        soundEngine.playFootstep(i);
      }, 170 + i * 290);
      timersRef.current.push(stepTimer);
    }

    const finishTimer = window.setTimeout(() => {
      setCrossing(null);
      setState((prev) => {
        const committed = commitCrossing(prev);
        if (!committed.move) return prev;
        const next = committed.state;

        if (next.status === 'won') {
          soundEngine.playVictory();
          if (!victoryLoggedRef.current) {
            victoryLoggedRef.current = true;
            const stars = calculateStarRating(next);
            onVictoryRecorded({
              timeMinutes: next.elapsedMinutes,
              moves: next.moves.length,
              stars: (stars || 1) as 1 | 2 | 3,
            });
          }
        } else if (next.status === 'lost') {
          soundEngine.playCollapse();
        } else {
          soundEngine.playLanternArrive();
          if (next.timeLimit - next.elapsedMinutes <= 5) {
            const tickTimer = window.setTimeout(() => soundEngine.playTensionTick(), 240);
            timersRef.current.push(tickTimer);
          }
        }
        return next;
      });
    }, durationMs);

    timersRef.current.push(finishTimer);
  };

  const handleUndoSteps = (count = 1) => {
    if (crossing || state.moves.length === 0) return;
    soundEngine.playUndo();
    setState((prev) => {
      let updated = prev;
      for (let i = 0; i < count; i++) {
        if (updated.moves.length === 0) break;
        updated = undoLastCrossing(updated);
      }
      return updated;
    });
  };

  const handleRestart = () => {
    clearAnimations();
    setCrossing(null);
    setNotice(null);
    setUnlockedHintTier(0);
    setActiveDrawer('none');
    victoryLoggedRef.current = false;
    soundEngine.playUndo();
    setState(createInitialBridgeState());
    setDisplayMinutes(0);
    onAttemptStarted();
  };

  const handleUnlockHint = (tier: 1 | 2 | 3) => {
    if (tier <= unlockedHintTier) return;
    soundEngine.playHint();
    setUnlockedHintTier(tier);
    setState((prev) => recordHintUsed(prev));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDrawer('none');
        if (hasSeenPrologue) setShowPrologue(false);
        return;
      }
      if (showPrologue || state.status !== 'playing' || crossing) return;
      if (e.key === 'Enter') {
        const previewCheck = previewCrossing(state);
        if (previewCheck.canCross) {
          e.preventDefault();
          handleCross();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndoSteps(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const preview = previewCrossing(state);
  const lastMove = state.moves.length > 0 ? state.moves[state.moves.length - 1] : null;
  const dialogue = getDynamicDialogue(state, lastMove, Boolean(crossing));

  const remaining = Math.max(0, state.timeLimit - displayMinutes);
  const progressPct = Math.min(100, (displayMinutes / state.timeLimit) * 100);
  const projectedPct =
    preview.canCross && !crossing
      ? Math.min(100, (preview.projectedTotal / state.timeLimit) * 100)
      : progressPct;

  const isCritical = state.status === 'playing' && remaining <= 5;
  const isOver = state.status === 'lost' || displayMinutes > state.timeLimit;

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

        {/* Minimalist Precision Chronometer */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl sm:text-3xl font-medium tracking-tight tabular-nums transition-colors ${
                state.status === 'won'
                  ? 'text-[#2f855a] dark:text-[#6abf94]'
                  : isOver
                  ? 'text-[#c44536] dark:text-[#d45d4c]'
                  : isCritical
                  ? 'text-gold-600 dark:text-gold-300'
                  : 'text-paper-900 dark:text-ivory-100'
              }`}
            >
              {String(displayMinutes).padStart(2, '0')}
            </span>
            <span className="font-mono text-xs text-paper-700/75 dark:text-ivory-300/70 tabular-nums">
              / {state.timeLimit} min
            </span>
          </div>

          {/* Razor-thin timeline hairline with move preview */}
          <div className="relative mt-1.5 h-[2px] w-44 sm:w-56 overflow-hidden rounded-full bg-paper-900/12 dark:bg-white/10">
            {preview.canCross && !crossing && (
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                  preview.projectedTotal > state.timeLimit
                    ? 'bg-[#c44536]/45 dark:bg-[#d45d4c]/45'
                    : 'bg-gold-500/40 dark:bg-gold-300/35'
                }`}
                style={{ width: `${projectedPct}%` }}
              />
            )}
            <motion.div
              className={`relative h-full ${
                state.status === 'won'
                  ? 'bg-[#2f855a] dark:bg-[#6abf94]'
                  : isOver
                  ? 'bg-[#c44536] dark:bg-[#d45d4c]'
                  : 'bg-gold-500 dark:bg-gold-400'
              }`}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: crossing ? 0.12 : 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Minimal Utility Icons */}
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
            title="Crossing History"
            aria-label="Crossing History"
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
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 sm:px-6 pb-8 pt-2">
        <BridgeScene
          state={state}
          crossing={crossing}
          theme={theme}
          onToggleTraveler={handleToggleTraveler}
        />

        {/* Whisper-Quiet Single-Line Narrative / Notice */}
        <div className="mt-4 min-h-[28px] flex items-center justify-center px-2 text-center">
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
                transition={{ duration: 0.25 }}
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

        {/* Minimal Single Action Dock */}
        <div className="mt-5 flex items-center justify-between gap-3 max-w-xl w-full mx-auto">
          <button
            type="button"
            onClick={() => handleUndoSteps(1)}
            disabled={Boolean(crossing) || state.moves.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 disabled:opacity-25 disabled:pointer-events-none transition"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>

          {/* Center Primary Pill Action */}
          <motion.button
            type="button"
            onClick={handleCross}
            disabled={!preview.canCross || Boolean(crossing)}
            whileTap={preview.canCross && !crossing ? { scale: 0.97 } : undefined}
            className={`inline-flex min-w-[210px] sm:min-w-[260px] items-center justify-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
              preview.canCross && !crossing
                ? preview.projectedTotal > state.timeLimit
                  ? 'bg-[#c44536] text-paper-50 dark:bg-[#d45d4c] dark:text-ivory-100 hover:brightness-110'
                  : 'bg-paper-900 text-paper-50 hover:bg-paper-800 shadow-[0_8px_28px_-8px_rgba(26,24,21,0.38)] dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 dark:shadow-[0_8px_30px_-8px_rgba(232,168,73,0.55)]'
                : 'bg-paper-900/[0.04] text-paper-700/70 border border-paper-900/10 dark:bg-white/[0.05] dark:text-ivory-300/60 dark:border-white/[0.08] cursor-default'
            }`}
          >
            {crossing ? (
              <span className="font-normal tracking-wide">Crossing the gorge...</span>
            ) : preview.canCross ? (
              state.lanternSide === 'left' ? (
                <>
                  <span>Cross · {formatTravelerNames(state.selected)}</span>
                  <span className="font-mono text-xs opacity-80">+{preview.duration}m</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return · {formatTravelerNames(state.selected)}</span>
                  <span className="font-mono text-xs opacity-80">+{preview.duration}m</span>
                </>
              )
            ) : (
              <span className="text-xs font-normal">Select 1–2 travelers on the lit cliff</span>
            )}
          </motion.button>

          <button
            type="button"
            onClick={handleRestart}
            disabled={Boolean(crossing) && state.moves.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 disabled:opacity-25 disabled:pointer-events-none transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </main>

      {/* Overlay Popovers: Hints or Crossing Log */}
      <AnimatePresence>
        {activeDrawer === 'hints' && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/45 dark:bg-black/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl">
              <HintPanel
                state={state}
                unlockedTier={unlockedHintTier}
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
                  Crossing Log
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  className="rounded-full p-1.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100"
                  aria-label="Close crossing log"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {state.moves.length === 0 ? (
                <p className="py-10 text-center text-sm text-paper-700 dark:text-ivory-300/75">
                  No crossings recorded yet.
                </p>
              ) : (
                <ol className="mt-4 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {state.moves.map((m) => (
                    <li
                      key={m.step}
                      className="flex items-center justify-between py-2 border-b border-paper-900/[0.06] dark:border-white/[0.05] last:border-0 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-paper-700/60 dark:text-ivory-300/60 w-4">
                          {m.step}.
                        </span>
                        <div>
                          <div className="text-paper-900 dark:text-ivory-100 font-medium">
                            {formatTravelerNames(m.travelers)}
                          </div>
                          <div className="text-[11px] text-paper-700 dark:text-ivory-300/70">
                            {m.to === 'right' ? 'Cliff → Safe Ridge' : 'Safe Ridge → Cliff'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <div className="text-xs text-gold-600 dark:text-gold-300">
                          +{m.duration}m
                        </div>
                        <div className="text-[11px] text-paper-700/70 dark:text-ivory-300/60">
                          {m.cumulativeTime}m
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prologue / Rules Modal */}
      <AnimatePresence>
        {showPrologue && (
          <PrologueModal
            isReplayInfo={hasSeenPrologue}
            onStart={() => {
              soundEngine.playSelect();
              setShowPrologue(false);
              setHasSeenPrologue(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Victory / Defeat Modal */}
      <AnimatePresence>
        {state.status !== 'playing' && !crossing && (
          <OutcomeModal
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
