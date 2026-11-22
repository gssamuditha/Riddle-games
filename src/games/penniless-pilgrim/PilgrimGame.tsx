import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
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
  calculatePilgrimStars,
  canStepDirection,
  createInitialPilgrimState,
  DIRECTION_RULES,
  formatTax,
  PILGRIM_PAR_STEPS,
  recordPilgrimHintUsed,
  stepPilgrim,
  undoPilgrimSteps,
  type Direction,
  type PilgrimGameState,
} from './engine';
import { getPilgrimDialogue } from './story';
import { PilgrimScene } from './PilgrimScene';
import { PilgrimHintPanel } from './PilgrimHintPanel';
import { PilgrimOutcomeModal } from './PilgrimOutcomeModal';
import { PilgrimPrologueModal } from './PilgrimPrologueModal';

interface PilgrimGameProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onBackToHub: () => void;
  onVictoryRecorded: (result: { timeMinutes: number; moves: number; stars: 1 | 2 | 3 }) => void;
  onAttemptStarted: () => void;
  skipInitialPrologue?: boolean;
}

export const PilgrimGame: React.FC<PilgrimGameProps> = ({
  theme,
  onToggleTheme,
  muted,
  onToggleMute,
  onBackToHub,
  onVictoryRecorded,
  onAttemptStarted,
  skipInitialPrologue = false,
}) => {
  const [state, setState] = useState<PilgrimGameState>(() => createInitialPilgrimState());
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

  const handleStep = (dir: Direction) => {
    if (state.status !== 'playing') return;
    setActiveDrawer('none');

    const res = stepPilgrim(state, dir);
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
        const stars = calculatePilgrimStars(next);
        onVictoryRecorded({
          timeMinutes: next.moves.length,
          moves: next.moves.length,
          stars: (stars || 1) as 1 | 2 | 3,
        });
      }
    } else if (next.status === 'temple_rejected' || next.status === 'stuck') {
      soundEngine.playEmptyTrap();
    } else {
      soundEngine.playStreetStep(next.tax < 0);
    }

    setState(next);
  };

  const handleUndoSteps = (count = 1) => {
    if (state.moves.length === 0) return;
    soundEngine.playUndo();
    setState((prev) => undoPilgrimSteps(prev, count));
  };

  const handleRestart = () => {
    setNotice(null);
    setUnlockedHintTier(0);
    setActiveDrawer('none');
    victoryLoggedRef.current = false;
    soundEngine.playUndo();
    setState(createInitialPilgrimState());
    onAttemptStarted();
  };

  const handleUnlockHint = (tier: 1 | 2 | 3) => {
    if (tier <= unlockedHintTier) return;
    soundEngine.playHint();
    setUnlockedHintTier(tier);
    setState((prev) => recordPilgrimHintUsed(prev));
  };

  // Keyboard navigation: Arrow keys / WASD + Ctrl+Z / Backspace undo + Esc close drawers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDrawer('none');
        if (hasSeenPrologue) setShowPrologue(false);
        return;
      }
      if (showPrologue) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndoSteps(1);
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleUndoSteps(1);
        return;
      }

      if (state.status !== 'playing') return;
      const k = e.key.toLowerCase();
      if (e.key === 'ArrowUp' || k === 'w') {
        e.preventDefault();
        handleStep('N');
      } else if (e.key === 'ArrowDown' || k === 's') {
        e.preventDefault();
        handleStep('S');
      } else if (e.key === 'ArrowRight' || k === 'd') {
        e.preventDefault();
        handleStep('E');
      } else if (e.key === 'ArrowLeft' || k === 'a') {
        e.preventDefault();
        handleStep('W');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const dialogue = getPilgrimDialogue(state);
  const canN = canStepDirection(state, 'N').ok;
  const canS = canStepDirection(state, 'S').ok;
  const canE = canStepDirection(state, 'E').ok;
  const canW = canStepDirection(state, 'W').ok;

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

        {/* Center: Live Tax Balance & Step Counter */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-paper-700/70 dark:text-ivory-300/60">
              Tax
            </span>
            <span
              className={`font-mono text-2xl sm:text-3xl font-medium tracking-tight tabular-nums transition-colors ${
                state.status === 'won'
                  ? 'text-[#2f855a] dark:text-[#6abf94]'
                  : state.tax < 0
                  ? 'text-sky-600 dark:text-sky-300'
                  : state.status === 'temple_rejected'
                  ? 'text-[#c44536] dark:text-[#e07a6b]'
                  : 'text-paper-900 dark:text-ivory-100'
              }`}
            >
              {formatTax(state.tax)}
            </span>
            <span className="font-mono text-xs text-paper-700/70 dark:text-ivory-300/65 tabular-nums">
              · {state.moves.length}/{PILGRIM_PAR_STEPS} steps
            </span>
          </div>
          <span className="mt-0.5 font-mono text-[10px] tracking-wider text-paper-700/70 dark:text-ivory-300/55">
            Goal: Arrive at SE Temple with 0 tax
          </span>
        </div>

        {/* Right: Utility Icons */}
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
            title="Route Log"
            aria-label="Route Log"
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
        {/* Clean On-Page Rules Summary Strip (Always Visible on Solving Page!) */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-2xl border border-paper-900/10 bg-paper-50/85 dark:border-white/[0.07] dark:bg-ink-900/75 px-4 py-2.5 text-[11px] sm:text-xs text-paper-700 dark:text-ivory-300">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-600 dark:text-gold-300">
            Rules
          </span>
          <span className="font-mono">
            <strong className="text-paper-900 dark:text-ivory-100">→ East</strong> +2
          </span>
          <span className="font-mono">
            <strong className="text-paper-900 dark:text-ivory-100">← West</strong> −2
          </span>
          <span className="font-mono">
            <strong className="text-paper-900 dark:text-ivory-100">↓ South</strong> ×2
          </span>
          <span className="font-mono">
            <strong className="text-paper-900 dark:text-ivory-100">↑ North</strong> ÷2
          </span>
          <span className="hidden sm:inline text-paper-900/20 dark:text-white/20">|</span>
          <span>No repeat streets · Reach SE Temple at <strong className="text-paper-900 dark:text-ivory-100">0 tax</strong></span>
        </div>

        {/* Hero Interactive 4x4 City Grid */}
        <PilgrimScene state={state} theme={theme} onStep={handleStep} />

        {/* Quiet Single-Line Dialogue / Status Whisper */}
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

        {/* Minimal Bottom Action Dock: Undo | Quick Compass Step Buttons | Reset */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 max-w-2xl w-full mx-auto">
          <button
            type="button"
            onClick={() => handleUndoSteps(1)}
            disabled={state.moves.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 disabled:opacity-25 disabled:pointer-events-none transition"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>

          {/* Compact Directional Step Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {(
              [
                { dir: 'W' as Direction, ok: canW, Icon: ArrowLeft, op: '−2' },
                { dir: 'N' as Direction, ok: canN, Icon: ArrowUp, op: '÷2' },
                { dir: 'S' as Direction, ok: canS, Icon: ArrowDown, op: '×2' },
                { dir: 'E' as Direction, ok: canE, Icon: ArrowRight, op: '+2' },
              ] as const
            ).map(({ dir, ok, Icon, op }) => (
              <motion.button
                key={dir}
                type="button"
                whileTap={ok ? { scale: 0.95 } : undefined}
                disabled={!ok}
                onClick={() => handleStep(dir)}
                className={`inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-xs font-mono font-medium transition ${
                  ok
                    ? 'bg-paper-900 text-paper-50 hover:bg-paper-800 dark:bg-white/10 dark:text-ivory-100 dark:hover:bg-gold-400 dark:hover:text-ink-950'
                    : 'border border-paper-900/10 text-paper-700/35 dark:border-white/[0.06] dark:text-ivory-300/30 cursor-default'
                }`}
                title={`Walk ${DIRECTION_RULES[dir].label} (${op})`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{op}</span>
              </motion.button>
            ))}
          </div>

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

      {/* Popovers: Hints & Route Log */}
      <AnimatePresence>
        {activeDrawer === 'hints' && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/45 dark:bg-black/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl">
              <PilgrimHintPanel
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
                  Route Ledger
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  className="rounded-full p-1.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100"
                  aria-label="Close route ledger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {state.moves.length === 0 ? (
                <p className="py-10 text-center text-sm text-paper-700 dark:text-ivory-300/75">
                  Started at Market Square with 4 silver owed.
                </p>
              ) : (
                <ol className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                  {state.moves.map((m) => {
                    const rule = DIRECTION_RULES[m.dir];
                    return (
                      <li
                        key={m.step}
                        className="flex items-center justify-between py-1.5 border-b border-paper-900/[0.06] dark:border-white/[0.05] last:border-0 font-mono"
                      >
                        <span className="text-paper-800 dark:text-ivory-200">
                          {m.step}. {rule.symbol} {rule.label} ({rule.opText})
                        </span>
                        <span
                          className={
                            m.taxAfter === 0
                              ? 'text-[#2f855a] dark:text-[#6abf94] font-semibold'
                              : m.taxAfter < 0
                              ? 'text-sky-600 dark:text-sky-300'
                              : 'text-gold-600 dark:text-gold-300'
                          }
                        >
                          {formatTax(m.taxBefore)} → {formatTax(m.taxAfter)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prologue Modal */}
      <AnimatePresence>
        {showPrologue && (
          <PilgrimPrologueModal
            isReplayInfo={hasSeenPrologue}
            onStart={() => {
              soundEngine.playSelect();
              setShowPrologue(false);
              setHasSeenPrologue(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Outcome Modal (Victory or Temple Rejected at Non-Zero Tax) */}
      <AnimatePresence>
        {(state.status === 'won' || state.status === 'temple_rejected') && (
          <PilgrimOutcomeModal
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

