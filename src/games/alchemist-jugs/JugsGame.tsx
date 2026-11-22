import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  Droplet,
  Droplets,
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
  applyJugAction,
  calculateJugsStars,
  canApplyJugAction,
  createInitialJugsState,
  formatJugActionLabel,
  getOtherJug,
  JUG_PROFILES,
  JUGS_PAR_MOVES,
  recordJugHintUsed,
  undoLastJugMove,
  type JugAction,
  type JugId,
  type JugsGameState,
} from './engine';
import { getJugsDialogue } from './story';
import { JugsScene, type ActiveJugAnimation } from './JugsScene';
import { JugsHintPanel } from './JugsHintPanel';
import { JugsOutcomeModal } from './JugsOutcomeModal';
import { JugsPrologueModal } from './JugsPrologueModal';

interface JugsGameProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onBackToHub: () => void;
  onVictoryRecorded: (result: { timeMinutes: number; moves: number; stars: 1 | 2 | 3 }) => void;
  onAttemptStarted: () => void;
  skipInitialPrologue?: boolean;
}

export const JugsGame: React.FC<JugsGameProps> = ({
  theme,
  onToggleTheme,
  muted,
  onToggleMute,
  onBackToHub,
  onVictoryRecorded,
  onAttemptStarted,
  skipInitialPrologue = false,
}) => {
  const [state, setState] = useState<JugsGameState>(() => createInitialJugsState());
  const [selectedJug, setSelectedJug] = useState<JugId>('large');
  const [animating, setAnimating] = useState<ActiveJugAnimation | null>(null);
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

  const triggerAction = (action: JugAction) => {
    if (animating || state.status !== 'playing') return;

    const preview = applyJugAction(state, action);
    if (!preview.move) {
      soundEngine.playError();
      if (preview.error) showNotice(preview.error);
      return;
    }

    setActiveDrawer('none');
    const durationMs = action.type === 'pour' ? 860 : 680;

    if (action.type === 'fill') soundEngine.playLiquidFill();
    else if (action.type === 'pour') soundEngine.playLiquidPour();
    else soundEngine.playLiquidDrain();

    setAnimating({
      action,
      targetSmall: preview.state.small,
      targetLarge: preview.state.large,
      durationMs,
    });

    timerRef.current = window.setTimeout(() => {
      setAnimating(null);
      setState((prev) => {
        const res = applyJugAction(prev, action);
        if (!res.move) return prev;
        const next = res.state;
        if (next.status === 'won') {
          soundEngine.playVictory();
          if (!victoryLoggedRef.current) {
            victoryLoggedRef.current = true;
            const stars = calculateJugsStars(next);
            onVictoryRecorded({
              timeMinutes: next.moves.length,
              moves: next.moves.length,
              stars: (stars || 1) as 1 | 2 | 3,
            });
          }
        }
        return next;
      });
    }, durationMs);
  };

  const handleFlaskClick = (jug: JugId) => {
    if (animating || state.status !== 'playing') return;
    if (jug === selectedJug) return;
    soundEngine.playSelect();
    setSelectedJug(jug);
  };

  const handleUndo = () => {
    if (animating || state.moves.length === 0) return;
    soundEngine.playUndo();
    setState((prev) => undoLastJugMove(prev));
  };

  const handleRestart = () => {
    clearTimers();
    setAnimating(null);
    setNotice(null);
    setUnlockedHintTier(0);
    setActiveDrawer('none');
    victoryLoggedRef.current = false;
    soundEngine.playUndo();
    setState(createInitialJugsState());
    setSelectedJug('large');
    onAttemptStarted();
  };

  const handleUnlockHint = (tier: 1 | 2 | 3) => {
    if (tier <= unlockedHintTier) return;
    soundEngine.playHint();
    setUnlockedHintTier(tier);
    setState((prev) => recordJugHintUsed(prev));
  };

  // Keyboard shortcuts: 1/2 switch flask, F fill, P pour, E empty, Ctrl+Z undo, Esc close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDrawer('none');
        if (hasSeenPrologue) setShowPrologue(false);
        return;
      }
      if (showPrologue || state.status !== 'playing' || animating) return;
      const key = e.key.toLowerCase();
      if (key === '1') {
        soundEngine.playSelect();
        setSelectedJug('small');
      } else if (key === '2') {
        soundEngine.playSelect();
        setSelectedJug('large');
      } else if (key === 'f') {
        triggerAction({ type: 'fill', jug: selectedJug });
      } else if (key === 'p') {
        triggerAction({ type: 'pour', from: selectedJug, to: getOtherJug(selectedJug) });
      } else if (key === 'e') {
        triggerAction({ type: 'empty', jug: selectedJug });
      } else if ((e.metaKey || e.ctrlKey) && key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const otherJug = getOtherJug(selectedJug);
  const fillCheck = canApplyJugAction(state, { type: 'fill', jug: selectedJug });
  const pourCheck = canApplyJugAction(state, { type: 'pour', from: selectedJug, to: otherJug });
  const emptyCheck = canApplyJugAction(state, { type: 'empty', jug: selectedJug });

  const lastMove = state.moves.length > 0 ? state.moves[state.moves.length - 1] : null;
  const dialogue = getJugsDialogue(state, lastMove, Boolean(animating));
  const stepCount = state.moves.length;
  const progressPct = Math.min(100, (stepCount / JUGS_PAR_MOVES) * 100);

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

        {/* Minimalist Step Par Gauge */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl sm:text-3xl font-medium tracking-tight tabular-nums transition-colors ${
                state.status === 'won'
                  ? 'text-[#2f855a] dark:text-[#6abf94]'
                  : 'text-paper-900 dark:text-ivory-100'
              }`}
            >
              {String(stepCount).padStart(2, '0')}
            </span>
            <span className="font-mono text-xs text-paper-700/75 dark:text-ivory-300/70 tabular-nums">
              / {JUGS_PAR_MOVES} par steps
            </span>
          </div>

          <div className="relative mt-1.5 h-[2px] w-44 sm:w-56 overflow-hidden rounded-full bg-paper-900/12 dark:bg-white/10">
            <motion.div
              className={`h-full ${
                state.status === 'won'
                  ? 'bg-[#2f855a] dark:bg-[#6abf94]'
                  : 'bg-gold-500 dark:bg-gold-400'
              }`}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
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
            title="Measure Log"
            aria-label="Measure Log"
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
        <JugsScene
          state={state}
          selectedJug={selectedJug}
          animating={animating}
          theme={theme}
          onFlaskClick={handleFlaskClick}
        />

        {/* Whisper-Quiet Single-Line Narrative */}
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

        {/* Clean Single Action Dock for the Selected Flask */}
        <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-between gap-3 max-w-2xl w-full mx-auto">
          <button
            type="button"
            onClick={handleUndo}
            disabled={Boolean(animating) || state.moves.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 disabled:opacity-25 disabled:pointer-events-none transition"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>

          {/* Center 3 Clean Alchemy Actions for the Active Flask */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <motion.button
              type="button"
              whileTap={fillCheck.ok && !animating ? { scale: 0.97 } : undefined}
              disabled={!fillCheck.ok || Boolean(animating)}
              onClick={() => triggerAction({ type: 'fill', jug: selectedJug })}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                fillCheck.ok && !animating
                  ? 'bg-paper-900 text-paper-50 hover:bg-paper-800 shadow-[0_8px_24px_-8px_rgba(26,24,21,0.35)] dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 dark:shadow-[0_8px_24px_-8px_rgba(232,168,73,0.45)]'
                  : 'bg-paper-900/[0.04] text-paper-700/50 border border-paper-900/10 dark:bg-white/[0.04] dark:text-ivory-300/45 dark:border-white/[0.07] cursor-default'
              }`}
            >
              <Droplets className="h-3.5 w-3.5" />
              <span>Fill {JUG_PROFILES[selectedJug].capacity}L</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={pourCheck.ok && !animating ? { scale: 0.97 } : undefined}
              disabled={!pourCheck.ok || Boolean(animating)}
              onClick={() =>
                triggerAction({ type: 'pour', from: selectedJug, to: otherJug })
              }
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                pourCheck.ok && !animating
                  ? 'bg-[#2f855a] text-paper-50 hover:brightness-110 shadow-[0_8px_24px_-8px_rgba(47,133,90,0.45)] dark:bg-[#52b788] dark:text-ink-950'
                  : 'bg-paper-900/[0.04] text-paper-700/50 border border-paper-900/10 dark:bg-white/[0.04] dark:text-ivory-300/45 dark:border-white/[0.07] cursor-default'
              }`}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>
                Pour {JUG_PROFILES[selectedJug].capacity}L → {JUG_PROFILES[otherJug].capacity}L
              </span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={emptyCheck.ok && !animating ? { scale: 0.97 } : undefined}
              disabled={!emptyCheck.ok || Boolean(animating)}
              onClick={() => triggerAction({ type: 'empty', jug: selectedJug })}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs sm:text-sm font-medium transition-all ${
                emptyCheck.ok && !animating
                  ? 'border border-paper-900/20 text-paper-900 hover:bg-paper-900/[0.06] dark:border-white/20 dark:text-ivory-100 dark:hover:bg-white/[0.07]'
                  : 'bg-paper-900/[0.03] text-paper-700/45 border border-paper-900/10 dark:bg-white/[0.03] dark:text-ivory-300/40 dark:border-white/[0.06] cursor-default'
              }`}
            >
              <Droplet className="h-3.5 w-3.5" />
              <span>Empty {JUG_PROFILES[selectedJug].capacity}L</span>
            </motion.button>
          </div>

          <button
            type="button"
            onClick={handleRestart}
            disabled={Boolean(animating) && state.moves.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 disabled:opacity-25 disabled:pointer-events-none transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </main>

      {/* Popovers: Hints & Measure Log */}
      <AnimatePresence>
        {activeDrawer === 'hints' && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/45 dark:bg-black/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl">
              <JugsHintPanel
                state={state}
                unlockedTier={unlockedHintTier}
                onUnlockTier={handleUnlockHint}
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
                  Measure Log
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  className="rounded-full p-1.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100"
                  aria-label="Close measure log"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {state.moves.length === 0 ? (
                <p className="py-10 text-center text-sm text-paper-700 dark:text-ivory-300/75">
                  No pours recorded yet.
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
                        <span className="text-paper-900 dark:text-ivory-100 font-medium">
                          {formatJugActionLabel(m.action)}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-gold-600 dark:text-gold-300 tabular-nums">
                        {m.resultSmall}L · {m.resultLarge}L
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
          <JugsPrologueModal
            isReplayInfo={hasSeenPrologue}
            onStart={() => {
              soundEngine.playSelect();
              setShowPrologue(false);
              setHasSeenPrologue(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Victory Modal */}
      <AnimatePresence>
        {state.status === 'won' && !animating && (
          <JugsOutcomeModal
            state={state}
            onRestart={handleRestart}
            onBackToHub={onBackToHub}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

