import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Eraser,
  History,
  Moon,
  RotateCcw,
  Scale,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { soundEngine } from '../../core/sound';
import type { ThemeMode } from '../../core/types';
import {
  ALL_COINS,
  calculateCoinStars,
  canPerformWeighing,
  clearScalePans,
  createInitialCoinState,
  formatOutcomeLabel,
  getCoinDeductionMarks,
  getConsistentCoinWorlds,
  MAX_WEIGHINGS,
  performWeighing,
  placeCoinOnPan,
  recordCoinHintUsed,
  setCoinVerdict,
  submitCoinVerdict,
  type CoinDeductionMark,
  type CoinGameState,
  type CoinId,
  type ScaleOutcome,
} from './engine';
import { getCoinDialogue } from './story';
import { CoinScene } from './CoinScene';
import { CoinHintPanel } from './CoinHintPanel';
import { CoinOutcomeModal } from './CoinOutcomeModal';
import { CoinPrologueModal } from './CoinPrologueModal';

interface CoinGameProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onBackToHub: () => void;
  onVictoryRecorded: (result: { timeMinutes: number; moves: number; stars: 1 | 2 | 3 }) => void;
  onAttemptStarted: () => void;
  skipInitialPrologue?: boolean;
}

export const CoinGame: React.FC<CoinGameProps> = ({
  theme,
  onToggleTheme,
  muted,
  onToggleMute,
  onBackToHub,
  onVictoryRecorded,
  onAttemptStarted,
  skipInitialPrologue = false,
}) => {
  const [state, setState] = useState<CoinGameState>(() => createInitialCoinState());
  const [mode, setMode] = useState<'weigh' | 'verdict'>('weigh');
  const [activePanTarget, setActivePanTarget] = useState<'left' | 'right'>('left');
  const [activeTilt, setActiveTilt] = useState<ScaleOutcome | 'idle'>('idle');
  const [isWeighing, setIsWeighing] = useState<boolean>(false);
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
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 2400);
  };

  const handleCoinTap = (coin: CoinId) => {
    if (isWeighing || state.status !== 'playing') return;
    soundEngine.playCoinClink();
    setActiveTilt('idle');
    setState((prev) => placeCoinOnPan(prev, coin, activePanTarget));
  };

  const handleRemoveFromPan = (coin: CoinId) => {
    if (isWeighing || state.status !== 'playing') return;
    soundEngine.playDeselect();
    setActiveTilt('idle');
    setState((prev) => placeCoinOnPan(prev, coin, 'tray'));
  };

  const handleWeigh = () => {
    if (isWeighing || state.status !== 'playing') return;
    const check = canPerformWeighing(state);
    if (!check.ok) {
      soundEngine.playError();
      if (check.reason) showNotice(check.reason);
      return;
    }

    setActiveDrawer('none');
    const result = performWeighing(state);
    if (!result.record) return;

    const outcome = result.record.outcome;
    setIsWeighing(true);
    setActiveTilt(outcome);
    soundEngine.playScaleWeigh(outcome !== 'balanced');

    timerRef.current = window.setTimeout(() => {
      setIsWeighing(false);
      setState(result.state);
      if (result.state.history.length >= MAX_WEIGHINGS) {
        setMode('verdict');
      }
    }, 850);
  };

  const handleSealVerdict = () => {
    if (isWeighing || state.status !== 'playing') return;
    const judged = submitCoinVerdict(state);
    if (judged.error) {
      soundEngine.playError();
      showNotice(judged.error);
      return;
    }

    setActiveDrawer('none');
    if (judged.state.status === 'won') {
      soundEngine.playVictory();
      if (!victoryLoggedRef.current) {
        victoryLoggedRef.current = true;
        const stars = calculateCoinStars(judged.state);
        onVictoryRecorded({
          timeMinutes: judged.state.history.length,
          moves: judged.state.history.length,
          stars: (stars || 1) as 1 | 2 | 3,
        });
      }
    } else {
      soundEngine.playCollapse();
    }
    setState(judged.state);
  };

  const handleLoadSuggestedWeighing = (left: CoinId[], right: CoinId[]) => {
    soundEngine.playSelect();
    setActiveTilt('idle');
    setMode('weigh');
    setState((prev) => {
      let next = clearScalePans(prev);
      for (const c of left) next = placeCoinOnPan(next, c, 'left');
      for (const c of right) next = placeCoinOnPan(next, c, 'right');
      return next;
    });
  };

  const handleRestart = () => {
    clearTimers();
    setIsWeighing(false);
    setActiveTilt('idle');
    setNotice(null);
    setMode('weigh');
    setActivePanTarget('left');
    setUnlockedHintTier(0);
    setActiveDrawer('none');
    victoryLoggedRef.current = false;
    soundEngine.playUndo();
    setState(createInitialCoinState());
    onAttemptStarted();
  };

  const handleUnlockHint = (tier: 1 | 2 | 3) => {
    if (tier <= unlockedHintTier) return;
    soundEngine.playHint();
    setUnlockedHintTier(tier);
    setState((prev) => recordCoinHintUsed(prev));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDrawer('none');
        if (hasSeenPrologue) setShowPrologue(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const weighingsUsed = state.history.length;
  const remainingWeighings = MAX_WEIGHINGS - weighingsUsed;
  const remainingWorlds = getConsistentCoinWorlds(state.history).length;
  const coinMarks = getCoinDeductionMarks(state.history);
  const lastRecord = state.history.length > 0 ? state.history[state.history.length - 1] : null;
  const dialogue = getCoinDialogue(state, lastRecord, isWeighing);
  const weighCheck = canPerformWeighing(state);
  const verdictReady = state.verdict.coin !== null && state.verdict.weight !== null;

  const renderMarkPill = (mark: CoinDeductionMark) => {
    if (mark === 'unweighed') return null;
    if (mark === 'heavier') {
      return (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c44536] text-[10px] font-bold leading-none text-white shadow-sm ring-1 ring-paper-50 dark:ring-ink-900">
          +
        </span>
      );
    }
    if (mark === 'lighter') {
      return (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0284c7] text-[10px] font-bold leading-none text-white shadow-sm ring-1 ring-paper-50 dark:ring-ink-900">
          −
        </span>
      );
    }
    if (mark === 'genuine') {
      return (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2f855a] text-[9px] font-bold leading-none text-white shadow-sm ring-1 ring-paper-50 dark:ring-ink-900">
          ✓
        </span>
      );
    }
    return (
      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-[9px] font-bold leading-none text-white shadow-sm ring-1 ring-paper-50 dark:ring-ink-900">
        ±
      </span>
    );
  };

  const describeMark = (mark: CoinDeductionMark) => {
    if (mark === 'heavier') return 'Possible Heavier (+)';
    if (mark === 'lighter') return 'Possible Lighter (−)';
    if (mark === 'genuine') return 'Proven Genuine (✓)';
    if (mark === 'either') return 'Heavier or Lighter (±)';
    return 'Not yet weighed';
  };

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

        {/* Center: 3-Weighing Pips & Possibilities Counter */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl sm:text-3xl font-medium tracking-tight tabular-nums ${state.status === 'won'
                  ? 'text-[#2f855a] dark:text-[#6abf94]'
                  : state.status === 'lost'
                    ? 'text-[#c44536] dark:text-[#d45d4c]'
                    : 'text-paper-900 dark:text-ivory-100'
                }`}
            >
              {weighingsUsed}
            </span>
            <span className="font-mono text-xs text-paper-700/75 dark:text-ivory-300/70 tabular-nums">
              / {MAX_WEIGHINGS} weighings
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`h-[3px] w-12 sm:w-16 rounded-full transition-colors duration-300 ${idx < weighingsUsed
                    ? state.status === 'won'
                      ? 'bg-[#2f855a] dark:bg-[#6abf94]'
                      : 'bg-gold-500 dark:bg-gold-400'
                    : 'bg-paper-900/12 dark:bg-white/12'
                  }`}
              />
            ))}
          </div>
          <span className="mt-1 font-mono text-[10px] tracking-wider text-paper-700/70 dark:text-ivory-300/60">
            {remainingWorlds === 1
              ? '1 unique counterfeit proven · certain'
              : `${remainingWorlds} of 24 possibilities remain`}
          </span>
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
            className={`relative rounded-full p-2 transition ${activeDrawer === 'log'
                ? 'bg-paper-900/10 text-paper-900 dark:bg-white/10 dark:text-ivory-100'
                : 'text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100'
              }`}
            title="Weighing Ledger"
            aria-label="Weighing Ledger"
          >
            <History className="h-4 w-4" />
            {weighingsUsed > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-paper-900 text-paper-50 dark:bg-ink-700 dark:text-ivory-100 px-1 font-mono text-[9px] border border-paper-50 dark:border-white/15">
                {weighingsUsed}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer((d) => (d === 'hints' ? 'none' : 'hints'))}
            className={`rounded-full p-2 transition ${activeDrawer === 'hints'
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
          <div className="mb-3 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 rounded-2xl border border-paper-900/10 bg-paper-50/85 dark:border-white/[0.07] dark:bg-ink-900/75 px-4 py-2.5 text-[11px] sm:text-xs text-paper-700 dark:text-ivory-300">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-600 dark:text-gold-300">
              Instructions
            </span>
            <span>
              <strong className="text-paper-900 dark:text-ivory-100">12 Coins</strong> (1 fake)
            </span>
            <span className="hidden sm:inline text-paper-900/20 dark:text-white/20">|</span>
            <span>
              <strong className="text-paper-900 dark:text-ivory-100">3 Weighings Max</strong> (equal pans)
            </span>
            <span className="hidden sm:inline text-paper-900/20 dark:text-white/20">|</span>
            <span className="inline-flex flex-wrap items-center justify-center gap-2.5">
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#c44536] font-mono text-[10px] font-bold text-white">
                  +
                </span>
                <span>Heavier</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#0284c7] font-mono text-[10px] font-bold text-white">
                  −
                </span>
                <span>Lighter</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#2f855a] font-mono text-[9px] font-bold text-white">
                  ✓
                </span>
                <span>Genuine</span>
              </span>
            </span>
          </div>

          {/* Hero Animated Balance Scale Stage */}
          <CoinScene
            state={state}
            coinMarks={coinMarks}
            activeTilt={activeTilt}
            isWeighing={isWeighing}
            theme={theme}
            onRemoveCoinFromPan={handleRemoveFromPan}
          />

          {/* Quiet Single-Line Status Whisper */}
          <div className="mt-3 min-h-[26px] flex items-center justify-center px-2 text-center">
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

          {/* Clean Interactive Coin Tray (Weigh Mode) OR Final Accusation (Verdict Mode) */}
          <div className="mt-3.5 mx-auto w-full max-w-3xl">
            <AnimatePresence mode="wait">
              {mode === 'weigh' && remainingWeighings > 0 ? (
                <motion.div
                  key="weigh-console"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-2xl border border-paper-900/10 bg-paper-50/80 dark:border-white/[0.08] dark:bg-ink-900/75 px-4 sm:px-6 py-4"
                >
                  {/* Pan Target Toggle + Clear */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                    <div className="inline-flex items-center gap-1 rounded-full border border-paper-900/10 dark:border-white/10 p-0.5 bg-paper-100 dark:bg-ink-950/70 text-xs">
                      <button
                        type="button"
                        onClick={() => setActivePanTarget('left')}
                        className={`rounded-full px-3.5 py-1 font-medium transition ${activePanTarget === 'left'
                            ? 'bg-paper-900 text-paper-50 dark:bg-gold-400 dark:text-ink-950 font-semibold'
                            : 'text-paper-700 hover:text-paper-900 dark:text-ivory-300 dark:hover:text-ivory-100'
                          }`}
                      >
                        Load Left Pan ({state.leftPan.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePanTarget('right')}
                        className={`rounded-full px-3.5 py-1 font-medium transition ${activePanTarget === 'right'
                            ? 'bg-paper-900 text-paper-50 dark:bg-gold-400 dark:text-ink-950 font-semibold'
                            : 'text-paper-700 hover:text-paper-900 dark:text-ivory-300 dark:hover:text-ivory-100'
                          }`}
                      >
                        Load Right Pan ({state.rightPan.length})
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={
                        isWeighing || (state.leftPan.length === 0 && state.rightPan.length === 0)
                      }
                      onClick={() => {
                        soundEngine.playDeselect();
                        setActiveTilt('idle');
                        setState((prev) => clearScalePans(prev));
                      }}
                      className="inline-flex items-center gap-1 text-xs text-paper-700 hover:text-paper-900 dark:text-ivory-300 dark:hover:text-ivory-100 disabled:opacity-30 transition"
                    >
                      <Eraser className="h-3.5 w-3.5" />
                      Clear Pans
                    </button>
                  </div>

                  {/* 12 Interactive Numbered Gold Coins */}
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                      {ALL_COINS.map((coin) => {
                        const onLeft = state.leftPan.includes(coin);
                        const onRight = state.rightPan.includes(coin);
                        const mark = coinMarks[coin];
                        const isGenuine = mark === 'genuine';

                        return (
                          <button
                            key={coin}
                            type="button"
                            disabled={isWeighing || state.status !== 'playing'}
                            onClick={() => handleCoinTap(coin)}
                            className={`relative flex flex-col items-center justify-center rounded-xl py-2 font-mono text-xs font-semibold transition ${onLeft
                                ? 'bg-gold-500 text-paper-50 dark:bg-gold-400 dark:text-ink-950 shadow-sm'
                                : onRight
                                  ? 'bg-paper-900 text-paper-50 dark:bg-sky-400/25 dark:text-sky-200 dark:border dark:border-sky-300/40'
                            : isGenuine
                      ? 'border border-paper-900/10 bg-paper-100/50 text-paper-700/65 hover:border-gold-500/50 dark:border-white/[0.07] dark:bg-ink-950/40 dark:text-ivory-300/60 dark:hover:border-gold-400/50'
                      : 'border border-paper-900/15 bg-paper-100/80 text-paper-900 hover:border-gold-500/70 dark:border-white/15 dark:bg-ink-950/70 dark:text-ivory-100 dark:hover:border-gold-400/70'
                        }`}
                      title={`Coin ${coin} · ${onLeft ? 'Left Pan' : onRight ? 'Right Pan' : 'Tray'
                        } · ${describeMark(mark)}`}
                      >
                      <span>{coin}</span>
                      <span className="text-[9px] font-normal opacity-80 leading-none mt-0.5">
                        {onLeft ? 'L' : onRight ? 'R' : '·'}
                      </span>
                      {renderMarkPill(mark)}
                    </button>
                    );
                  })}
                  </div>

                  {/* Bottom Action Row */}
                  <div className="mt-4 pt-3 border-t border-paper-900/[0.07] dark:border-white/[0.06] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playSelect();
                        setMode('verdict');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Seal Verdict</span>
                    </button>

                    <motion.button
                      type="button"
                      whileTap={weighCheck.ok && !isWeighing ? { scale: 0.97 } : undefined}
                      disabled={!weighCheck.ok || isWeighing}
                      onClick={handleWeigh}
                      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all ${weighCheck.ok && !isWeighing
                          ? 'bg-paper-900 text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 shadow-[0_8px_24px_-8px_rgba(26,24,21,0.35)] dark:shadow-[0_8px_28px_-8px_rgba(232,168,73,0.5)]'
                          : 'bg-paper-900/[0.04] text-paper-700/50 border border-paper-900/10 dark:bg-white/[0.05] dark:text-ivory-300/50 dark:border-white/[0.08] cursor-default'
                        }`}
                    >
                      <Scale className="h-4 w-4" />
                      <span>
                        {isWeighing
                          ? 'Weighing...'
                          : `Weigh Scale (${weighingsUsed + 1}/${MAX_WEIGHINGS})`}
                      </span>
                    </motion.button>

                    <button
                      type="button"
                      onClick={handleRestart}
                      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">New Trial</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="verdict-console"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-2xl border border-paper-900/10 bg-paper-50/80 dark:border-white/[0.08] dark:bg-ink-900/75 px-4 sm:px-6 py-4"
                >
                  <div className="text-center text-xs text-paper-700 dark:text-ivory-300 mb-3">
                    Select the <strong className="text-paper-900 dark:text-ivory-100">counterfeit coin</strong> and whether it is{' '}
                    <strong className="text-paper-900 dark:text-ivory-100">Heavier</strong> or{' '}
                    <strong className="text-paper-900 dark:text-ivory-100">Lighter</strong>:
                  </div>

                  {/* Pick Coin 1..12 */}
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                      {ALL_COINS.map((coin) => {
                        const selected = state.verdict.coin === coin;
                        const mark = coinMarks[coin];
                        const isGenuine = mark === 'genuine';
                        return (
                          <button
                            key={coin}
                            type="button"
                            disabled={state.status !== 'playing'}
                            onClick={() => {
                              soundEngine.playSelect();
                              setState((prev) => setCoinVerdict(prev, { coin }));
                            }}
                            title={`Coin ${coin} · ${describeMark(mark)}`}
                            className={`relative rounded-xl py-2 font-mono text-xs font-semibold transition ${selected
                                ? 'bg-paper-900 text-paper-50 dark:bg-gold-400 dark:text-ink-950'
                                : isGenuine
                                  ? 'border border-paper-900/10 text-paper-700/45 dark:border-white/[0.06] dark:text-ivory-300/40'
                                  : 'border border-paper-900/15 text-paper-900 hover:border-gold-500 dark:border-white/15 dark:text-ivory-100 dark:hover:border-gold-400'
                              }`}
                          >
                            {coin}
                            {renderMarkPill(mark)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Pick Heavier / Lighter */}
                    <div className="mt-3 flex items-center justify-center gap-2.5">
                      {(['heavier', 'lighter'] as const).map((w) => {
                        const active = state.verdict.weight === w;
                        return (
                          <button
                            key={w}
                            type="button"
                            disabled={state.status !== 'playing'}
                            onClick={() => {
                              soundEngine.playSelect();
                              setState((prev) => setCoinVerdict(prev, { weight: w }));
                            }}
                            className={`rounded-full px-5 py-1.5 text-xs font-semibold capitalize transition ${active
                                ? 'bg-paper-900 text-paper-50 dark:bg-gold-400 dark:text-ink-950'
                                : 'border border-paper-900/15 text-paper-800 hover:border-paper-900/35 dark:border-white/15 dark:text-ivory-200 dark:hover:border-white/35'
                              }`}
                          >
                            {w}
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom Verdict Row */}
                    <div className="mt-4 pt-3 border-t border-paper-900/[0.07] dark:border-white/[0.06] flex items-center justify-between gap-2">
                      {remainingWeighings > 0 && state.status === 'playing' ? (
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playSelect();
                            setMode('weigh');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          <span>Weigh ({remainingWeighings} left)</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-paper-700/65 dark:text-ivory-300/55 px-2">
                          Final Verdict
                        </span>
                      )}

                      <motion.button
                        type="button"
                        whileTap={verdictReady ? { scale: 0.97 } : undefined}
                        disabled={!verdictReady || state.status !== 'playing'}
                        onClick={handleSealVerdict}
                        className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all ${verdictReady && state.status === 'playing'
                            ? 'bg-paper-900 text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 shadow-[0_8px_28px_-8px_rgba(232,168,73,0.5)]'
                            : 'bg-paper-900/[0.04] text-paper-700/50 border border-paper-900/10 dark:bg-white/[0.05] dark:text-ivory-300/50 dark:border-white/[0.08] cursor-default'
                          }`}
                      >
                        <Check className="h-4 w-4" />
                        <span>Confirm Verdict</span>
                      </motion.button>

                      <button
                        type="button"
                        onClick={handleRestart}
                        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">New Trial</span>
                      </button>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      </main>

      {/* Popovers: Hints & Weighing Ledger */}
      <AnimatePresence>
        {activeDrawer === 'hints' && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/45 dark:bg-black/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl">
              <CoinHintPanel
                state={state}
                unlockedTier={unlockedHintTier}
                onUnlockTier={handleUnlockHint}
                onLoadWeighing={handleLoadSuggestedWeighing}
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
              className="surface-glass w-full max-w-lg rounded-2xl p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-paper-900/10 dark:border-white/[0.08]">
                <h3 className="font-display text-xl font-semibold text-paper-900 dark:text-ivory-100">
                  Weighing Ledger
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  className="rounded-full p-1.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100"
                  aria-label="Close weighing ledger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {state.history.length === 0 ? (
                <p className="py-10 text-center text-sm text-paper-700 dark:text-ivory-300/75">
                  No weighings recorded yet.
                </p>
              ) : (
                <ol className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1 text-xs font-mono">
                  {state.history.map((rec) => (
                    <li
                      key={rec.index}
                      className="flex items-center justify-between gap-3 py-2 border-b border-paper-900/[0.06] dark:border-white/[0.05] last:border-0"
                    >
                      <div>
                        <div className="text-paper-900 dark:text-ivory-100">
                          W{rec.index}: [{rec.leftPan.join(',')}]
                          {rec.outcome === 'left_heavy' ? (
                            <span className="text-[#c44536] dark:text-[#f08b7d] font-bold">+</span>
                          ) : rec.outcome === 'right_heavy' ? (
                            <span className="text-[#0284c7] dark:text-[#7dd3fc] font-bold">−</span>
                          ) : null}{' '}
                          vs [{rec.rightPan.join(',')}]
                          {rec.outcome === 'right_heavy' ? (
                            <span className="text-[#c44536] dark:text-[#f08b7d] font-bold">+</span>
                          ) : rec.outcome === 'left_heavy' ? (
                            <span className="text-[#0284c7] dark:text-[#7dd3fc] font-bold">−</span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-paper-700/70 dark:text-ivory-300/60 mt-0.5">
                          {rec.consistentWorldsAfter} possibilit
                          {rec.consistentWorldsAfter === 1 ? 'y' : 'ies'} left
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${rec.outcome === 'balanced'
                            ? 'bg-[#2f855a]/15 text-[#2f855a] dark:text-[#6abf94]'
                            : 'bg-gold-500/15 text-gold-600 dark:text-gold-300'
                          }`}
                      >
                        {formatOutcomeLabel(rec.outcome)}
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
          <CoinPrologueModal
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
        {state.status !== 'playing' && !isWeighing && (
          <CoinOutcomeModal
            state={state}
            onRestart={handleRestart}
            onBackToHub={onBackToHub}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

