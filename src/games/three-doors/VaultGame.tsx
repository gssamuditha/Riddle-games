import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Moon,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { soundEngine } from '../../core/sound';
import type { ThemeMode } from '../../core/types';
import {
  advanceToNextRound,
  calculateVaultStars,
  createInitialVaultState,
  DOOR_NUMERALS,
  finalizeDoorChoice,
  getStrategyStats,
  getSwitchTargetDoor,
  KEYS_TO_WIN,
  MAX_ROUNDS,
  pickInitialDoor,
  recordVaultHintUsed,
  type DoorIndex,
  type VaultTrialState,
} from './engine';
import { getVaultDialogue } from './story';
import { VaultScene } from './VaultScene';
import { VaultHintPanel } from './VaultHintPanel';
import { VaultOutcomeModal } from './VaultOutcomeModal';
import { VaultPrologueModal } from './VaultPrologueModal';

interface VaultGameProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onBackToHub: () => void;
  onVictoryRecorded: (result: { timeMinutes: number; moves: number; stars: 1 | 2 | 3 }) => void;
  onAttemptStarted: () => void;
  skipInitialPrologue?: boolean;
}

export const VaultGame: React.FC<VaultGameProps> = ({
  theme,
  onToggleTheme,
  muted,
  onToggleMute,
  onBackToHub,
  onVictoryRecorded,
  onAttemptStarted,
  skipInitialPrologue = false,
}) => {
  const [state, setState] = useState<VaultTrialState>(() => createInitialVaultState());
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPrologue, setShowPrologue] = useState<boolean>(!skipInitialPrologue);
  const [hasSeenPrologue, setHasSeenPrologue] = useState<boolean>(skipInitialPrologue);
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'hints' | 'ledger'>('none');
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

  const handleDoorClick = (door: DoorIndex) => {
    if (isAnimating || state.status !== 'playing') return;
    setActiveDrawer('none');

    if (state.currentRound.phase === 'pick') {
      soundEngine.playSelect();
      setIsAnimating(true);
      const next = pickInitialDoor(state, door);
      if (next.error) {
        setIsAnimating(false);
        showNotice(next.error);
        return;
      }

      // Brief dramatic beat before the Archivist swings open an empty trap door
      timerRef.current = window.setTimeout(() => {
        soundEngine.playDoorUnseal();
        setState(next.state);
        setIsAnimating(false);
      }, 360);
      return;
    }

    if (state.currentRound.phase === 'decide') {
      handleFinalDecision(door);
    }
  };

  const handleFinalDecision = (finalDoor: DoorIndex) => {
    if (isAnimating || state.status !== 'playing' || state.currentRound.phase !== 'decide') return;

    const result = finalizeDoorChoice(state, finalDoor);
    if (!result.roundResult) {
      soundEngine.playError();
      if (result.error) showNotice(result.error);
      return;
    }

    setIsAnimating(true);
    soundEngine.playDoorUnseal();
    setState(result.state);

    timerRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      if (result.state.status === 'won') {
        soundEngine.playVictory();
        if (!victoryLoggedRef.current) {
          victoryLoggedRef.current = true;
          const stars = calculateVaultStars(result.state);
          onVictoryRecorded({
            timeMinutes: result.state.keysCollected,
            moves: result.state.history.length,
            stars: (stars || 1) as 1 | 2 | 3,
          });
        }
      } else if (result.state.status === 'lost') {
        soundEngine.playCollapse();
      } else if (result.roundResult?.won) {
        soundEngine.playVaultKey();
      } else {
        soundEngine.playEmptyTrap();
      }
    }, 520);
  };

  const handleNextRound = () => {
    if (isAnimating || state.status !== 'playing' || state.currentRound.phase !== 'revealed') {
      return;
    }
    soundEngine.playSelect();
    setState((prev) => advanceToNextRound(prev));
  };

  const handleRestart = () => {
    clearTimers();
    setIsAnimating(false);
    setNotice(null);
    setUnlockedHintTier(0);
    setActiveDrawer('none');
    victoryLoggedRef.current = false;
    soundEngine.playUndo();
    setState(createInitialVaultState());
    onAttemptStarted();
  };

  const handleUnlockHint = (tier: 1 | 2 | 3) => {
    if (tier <= unlockedHintTier) return;
    soundEngine.playHint();
    setUnlockedHintTier(tier);
    setState((prev) => recordVaultHintUsed(prev));
  };

  // Keyboard shortcuts: 1/2/3 pick door, Enter advance round, Esc close drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDrawer('none');
        if (hasSeenPrologue) setShowPrologue(false);
        return;
      }
      if (showPrologue || isAnimating || state.status !== 'playing') return;

      if (state.currentRound.phase === 'pick') {
        if (e.key === '1') handleDoorClick(0);
        else if (e.key === '2') handleDoorClick(1);
        else if (e.key === '3') handleDoorClick(2);
      } else if (state.currentRound.phase === 'revealed' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleNextRound();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const round = state.currentRound;
  const switchDoor = getSwitchTargetDoor(round);
  const dialogue = getVaultDialogue(state, isAnimating);
  const stats = getStrategyStats(state.history);

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

        {/* Minimalist Astral Key Progress Track */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl sm:text-3xl font-medium tracking-tight tabular-nums transition-colors ${
                state.status === 'won'
                  ? 'text-[#2f855a] dark:text-[#6abf94]'
                  : state.status === 'lost'
                  ? 'text-[#c44536] dark:text-[#d45d4c]'
                  : 'text-paper-900 dark:text-ivory-100'
              }`}
            >
              {state.keysCollected}
            </span>
            <span className="font-mono text-xs text-paper-700/75 dark:text-ivory-300/70 tabular-nums">
              / {KEYS_TO_WIN} keys
            </span>
          </div>

          {/* 6 Crisp Astral Key Pips */}
          <div className="mt-1.5 flex items-center gap-1.5">
            {Array.from({ length: KEYS_TO_WIN }, (_, idx) => (
              <span
                key={idx}
                className={`h-[3px] w-7 sm:w-8 rounded-full transition-colors duration-300 ${
                  idx < state.keysCollected
                    ? state.status === 'won'
                      ? 'bg-[#2f855a] dark:bg-[#6abf94]'
                      : 'bg-gold-500 dark:bg-gold-400'
                    : 'bg-paper-900/12 dark:bg-white/12'
                }`}
              />
            ))}
          </div>

          <span className="mt-1 font-mono text-[10px] tracking-wider text-paper-700/70 dark:text-ivory-300/60">
            Round {round.roundNumber} of {MAX_ROUNDS}
          </span>
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
            onClick={() => setActiveDrawer((d) => (d === 'ledger' ? 'none' : 'ledger'))}
            className={`relative rounded-full p-2 transition ${
              activeDrawer === 'ledger'
                ? 'bg-paper-900/10 text-paper-900 dark:bg-white/10 dark:text-ivory-100'
                : 'text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100'
            }`}
            title="Odds Ledger"
            aria-label="Odds Ledger"
          >
            <BarChart3 className="h-4 w-4" />
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
        <VaultScene
          state={state}
          isAnimating={isAnimating}
          theme={theme}
          onDoorClick={handleDoorClick}
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

        {/* Clean Single Action Dock */}
        <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-between gap-3 max-w-2xl w-full mx-auto">
          {/* Subtle Live Empirical Tally on Left (once rounds exist) */}
          <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-paper-700/80 dark:text-ivory-300/70 min-w-[130px]">
            {state.history.length > 0 ? (
              <>
                <span>
                  Stay: <strong>{stats.stayRate !== null ? `${stats.stayRate}%` : '—'}</strong>
                </span>
                <span className="text-paper-900/20 dark:text-white/20">·</span>
                <span className="text-gold-600 dark:text-gold-300">
                  Switch: <strong>{stats.switchRate !== null ? `${stats.switchRate}%` : '—'}</strong>
                </span>
              </>
            ) : (
              <span className="opacity-65">Keys 1 · 2 · 3</span>
            )}
          </div>

          {/* Center Phase-Specific Controls */}
          <div className="flex items-center justify-center gap-2.5">
            {round.phase === 'pick' && (
              <span className="rounded-full border border-paper-900/10 bg-paper-900/[0.04] dark:border-white/[0.08] dark:bg-white/[0.04] px-5 py-2.5 text-xs text-paper-700 dark:text-ivory-300/75">
                Choose a sealed bronze door above
              </span>
            )}

            {round.phase === 'decide' && round.initialPick !== null && switchDoor !== null && (
              <>
                <motion.button
                  type="button"
                  whileTap={!isAnimating ? { scale: 0.97 } : undefined}
                  disabled={isAnimating}
                  onClick={() => handleFinalDecision(round.initialPick!)}
                  className="inline-flex items-center gap-2 rounded-full border border-paper-900/20 px-5 py-2.5 text-xs sm:text-sm font-medium text-paper-900 hover:bg-paper-900/[0.06] dark:border-white/20 dark:text-ivory-100 dark:hover:bg-white/[0.08] transition"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Stay · Door {DOOR_NUMERALS[round.initialPick]}</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={!isAnimating ? { scale: 0.97 } : undefined}
                  disabled={isAnimating}
                  onClick={() => handleFinalDecision(switchDoor)}
                  className="inline-flex items-center gap-2 rounded-full bg-paper-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 transition shadow-[0_8px_28px_-8px_rgba(26,24,21,0.35)] dark:shadow-[0_8px_28px_-8px_rgba(232,168,73,0.5)]"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Switch · Door {DOOR_NUMERALS[switchDoor]}</span>
                </motion.button>
              </>
            )}

            {round.phase === 'revealed' && state.status === 'playing' && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNextRound}
                className="inline-flex items-center gap-2 rounded-full bg-paper-900 px-7 py-2.5 text-xs sm:text-sm font-semibold text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 transition shadow-[0_8px_28px_-8px_rgba(232,168,73,0.45)]"
              >
                <span>Next Round ({round.roundNumber + 1}/{MAX_ROUNDS})</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            )}
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </main>

      {/* Popovers: Hints & Odds Ledger */}
      <AnimatePresence>
        {activeDrawer === 'hints' && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/45 dark:bg-black/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl">
              <VaultHintPanel
                unlockedTier={unlockedHintTier}
                onUnlockTier={handleUnlockHint}
                onClose={() => setActiveDrawer('none')}
              />
            </div>
          </div>
        )}

        {activeDrawer === 'ledger' && (
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
                  Vault Odds Ledger
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  className="rounded-full p-1.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100"
                  aria-label="Close ledger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl border border-paper-900/10 dark:border-white/[0.07] p-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-paper-700/75 dark:text-ivory-300/65">
                    Stay Win Rate
                  </div>
                  <div className="mt-1 font-mono text-lg font-semibold text-paper-900 dark:text-ivory-100">
                    {stats.stayRate !== null ? `${stats.stayRate}%` : '—'}
                  </div>
                  <div className="text-[11px] text-paper-700/70 dark:text-ivory-300/60">
                    {stats.stayWins} / {stats.stayTotal}
                  </div>
                </div>
                <div className="rounded-xl border border-paper-900/10 dark:border-white/[0.07] p-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-gold-600 dark:text-gold-300">
                    Switch Win Rate
                  </div>
                  <div className="mt-1 font-mono text-lg font-semibold text-[#2f855a] dark:text-[#6abf94]">
                    {stats.switchRate !== null ? `${stats.switchRate}%` : '—'}
                  </div>
                  <div className="text-[11px] text-paper-700/70 dark:text-ivory-300/60">
                    {stats.switchWins} / {stats.switchTotal}
                  </div>
                </div>
              </div>

              {state.history.length === 0 ? (
                <p className="py-8 text-center text-sm text-paper-700 dark:text-ivory-300/75">
                  No vaults unsealed yet.
                </p>
              ) : (
                <ol className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                  {state.history.map((r) => (
                    <li
                      key={r.roundNumber}
                      className="flex items-center justify-between py-1.5 border-b border-paper-900/[0.06] dark:border-white/[0.05] last:border-0"
                    >
                      <span className="font-mono text-paper-700 dark:text-ivory-300">
                        R{r.roundNumber} · {r.switched ? 'Switched' : 'Stayed'} (Door{' '}
                        {DOOR_NUMERALS[r.finalPick]})
                      </span>
                      <span
                        className={`font-mono font-semibold ${
                          r.won
                            ? 'text-[#2f855a] dark:text-[#6abf94]'
                            : 'text-[#c44536] dark:text-[#e07a6b]'
                        }`}
                      >
                        {r.won ? 'Key' : 'Trap'}
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
          <VaultPrologueModal
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
        {state.status !== 'playing' && !isAnimating && (
          <VaultOutcomeModal
            state={state}
            onRestart={handleRestart}
            onBackToHub={onBackToHub}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

