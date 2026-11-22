import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Check,
  History,
  MessageCircleQuestion,
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
  askOracleQuestion,
  assignVerdictRole,
  calculateOraclesStars,
  countDistinctRolePermutations,
  createInitialOraclesState,
  formatQuestionText,
  getConsistentWorlds,
  isVerdictComplete,
  MAX_QUESTIONS,
  ORACLE_ROLES,
  ORACLE_SLOTS,
  recordOracleHintUsed,
  ROLE_INFO,
  submitVerdict,
  type OracleQuestion,
  type OracleRole,
  type OracleSlot,
  type OraclesGameState,
  type QuestionForm,
} from './engine';
import { getOraclesDialogue } from './story';
import { OraclesScene, type ActiveSpeechAnimation } from './OraclesScene';
import { OraclesHintPanel } from './OraclesHintPanel';
import { OraclesOutcomeModal } from './OraclesOutcomeModal';
import { OraclesPrologueModal } from './OraclesPrologueModal';

interface OraclesGameProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onBackToHub: () => void;
  onVictoryRecorded: (result: { timeMinutes: number; moves: number; stars: 1 | 2 | 3 }) => void;
  onAttemptStarted: () => void;
  skipInitialPrologue?: boolean;
}

export const OraclesGame: React.FC<OraclesGameProps> = ({
  theme,
  onToggleTheme,
  muted,
  onToggleMute,
  onBackToHub,
  onVictoryRecorded,
  onAttemptStarted,
  skipInitialPrologue = false,
}) => {
  const [state, setState] = useState<OraclesGameState>(() => createInitialOraclesState());
  const [mode, setMode] = useState<'ask' | 'verdict'>('ask');
  const [target, setTarget] = useState<OracleSlot>('A');
  const [form, setForm] = useState<QuestionForm>('embedded');
  const [subject, setSubject] = useState<OracleSlot>('B');
  const [claimedRole, setClaimedRole] = useState<OracleRole>('random');

  const [speaking, setSpeaking] = useState<ActiveSpeechAnimation | null>(null);
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

  const currentQuestion: OracleQuestion = {
    target,
    form,
    subject,
    claimedRole,
    embeddedWord: 'DA',
  };

  const handleAsk = () => {
    if (speaking || state.status !== 'asking') return;
    if (state.history.length >= MAX_QUESTIONS) {
      setMode('verdict');
      return;
    }

    setActiveDrawer('none');
    const result = askOracleQuestion(state, currentQuestion);
    if (!result.record) {
      soundEngine.playError();
      if (result.error) showNotice(result.error);
      return;
    }

    const spokenWord = result.record.answer;
    soundEngine.playOracleSpeak(spokenWord);
    setSpeaking({ target: currentQuestion.target, word: spokenWord });

    timerRef.current = window.setTimeout(() => {
      setSpeaking(null);
      setState(result.state);
      if (result.state.history.length >= MAX_QUESTIONS) {
        setMode('verdict');
      }
    }, 900);
  };

  const handleSealVerdict = () => {
    if (speaking || state.status !== 'asking') return;
    const judged = submitVerdict(state);
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
        const stars = calculateOraclesStars(judged.state);
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

  const handleRestart = () => {
    clearTimers();
    setSpeaking(null);
    setNotice(null);
    setMode('ask');
    setTarget('A');
    setForm('embedded');
    setSubject('B');
    setClaimedRole('random');
    setUnlockedHintTier(0);
    setActiveDrawer('none');
    victoryLoggedRef.current = false;
    soundEngine.playUndo();
    setState(createInitialOraclesState());
    onAttemptStarted();
  };

  const handleUnlockHint = (tier: 1 | 2 | 3) => {
    if (tier <= unlockedHintTier) return;
    soundEngine.playHint();
    setUnlockedHintTier(tier);
    setState((prev) => recordOracleHintUsed(prev));
  };

  const handleLoadSuggestedQuestion = (q: OracleQuestion) => {
    setTarget(q.target);
    setForm(q.form);
    setSubject(q.subject);
    setClaimedRole(q.claimedRole);
    setMode('ask');
    soundEngine.playSelect();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDrawer('none');
        if (hasSeenPrologue) setShowPrologue(false);
        return;
      }
      if (showPrologue || state.status !== 'asking' || speaking) return;
      if (mode === 'ask') {
        const k = e.key.toLowerCase();
        if (k === 'a') setTarget('A');
        else if (k === 'b') setTarget('B');
        else if (k === 'c') setTarget('C');
        else if (e.key === 'Enter' && state.history.length < MAX_QUESTIONS) {
          e.preventDefault();
          handleAsk();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const questionsUsed = state.history.length;
  const remainingQuestions = MAX_QUESTIONS - questionsUsed;
  const remainingPerms = countDistinctRolePermutations(getConsistentWorlds(state.history));
  const lastRecord = state.history.length > 0 ? state.history[state.history.length - 1] : null;
  const dialogue = getOraclesDialogue(state, lastRecord, Boolean(speaking));
  const verdictReady = isVerdictComplete(state.verdict);

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

        {/* Minimalist 3-Question Counter & Certainty Readout */}
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
              {questionsUsed}
            </span>
            <span className="font-mono text-xs text-paper-700/75 dark:text-ivory-300/70 tabular-nums">
              / {MAX_QUESTIONS} questions
            </span>
          </div>

          {/* 3 Celestial Question Pips */}
          <div className="mt-1.5 flex items-center gap-2">
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`h-[3px] w-12 sm:w-16 rounded-full transition-colors duration-300 ${
                  idx < questionsUsed
                    ? state.status === 'won'
                      ? 'bg-[#2f855a] dark:bg-[#6abf94]'
                      : 'bg-gold-500 dark:bg-gold-400'
                    : 'bg-paper-900/12 dark:bg-white/12'
                }`}
              />
            ))}
          </div>
          <span className="mt-1 font-mono text-[10px] tracking-wider text-paper-700/70 dark:text-ivory-300/60">
            {remainingPerms === 1
              ? '1 unique arrangement · certain'
              : `${remainingPerms} of 6 arrangements possible`}
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
            onClick={() => setActiveDrawer((d) => (d === 'log' ? 'none' : 'log'))}
            className={`relative rounded-full p-2 transition ${
              activeDrawer === 'log'
                ? 'bg-paper-900/10 text-paper-900 dark:bg-white/10 dark:text-ivory-100'
                : 'text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100'
            }`}
            title="Question Transcript"
            aria-label="Question Transcript"
          >
            <History className="h-4 w-4" />
            {questionsUsed > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-paper-900 text-paper-50 dark:bg-ink-700 dark:text-ivory-100 px-1 font-mono text-[9px] border border-paper-50 dark:border-white/15">
                {questionsUsed}
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
        <OraclesScene
          state={state}
          selectedTarget={target}
          speaking={speaking}
          theme={theme}
          onSelectOracle={(slot) => {
            soundEngine.playSelect();
            setTarget(slot);
          }}
        />

        {/* Whisper-Quiet Single-Line Narrative */}
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

        {/* Clean Interactive Console: Question Composer OR Verdict Assignment */}
        <div className="mt-4 mx-auto w-full max-w-3xl">
          <AnimatePresence mode="wait">
            {mode === 'ask' && remainingQuestions > 0 ? (
              <motion.div
                key="ask-panel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-2xl border border-paper-900/10 bg-paper-50/80 dark:border-white/[0.08] dark:bg-ink-900/75 px-4 sm:px-6 py-4 transition-colors"
              >
                {/* Compact Composer Controls */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs">
                  {/* Question Style Toggle */}
                  <div className="inline-flex rounded-full border border-paper-900/10 dark:border-white/10 p-0.5 bg-paper-100 dark:bg-ink-950/70">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playSelect();
                        setForm('direct');
                      }}
                      className={`rounded-full px-3 py-1 font-medium transition ${
                        form === 'direct'
                          ? 'bg-paper-900 text-paper-50 dark:bg-white/15 dark:text-ivory-100'
                          : 'text-paper-700 hover:text-paper-900 dark:text-ivory-300/75 dark:hover:text-ivory-100'
                      }`}
                    >
                      Direct
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playSelect();
                        setForm('embedded');
                      }}
                      className={`rounded-full px-3 py-1 font-medium transition ${
                        form === 'embedded'
                          ? 'bg-paper-900 text-paper-50 dark:bg-gold-400/20 dark:text-gold-200'
                          : 'text-paper-700 hover:text-paper-900 dark:text-ivory-300/75 dark:hover:text-ivory-100'
                      }`}
                    >
                      If I asked...
                    </button>
                  </div>

                  <span className="text-paper-700/50 dark:text-white/25 hidden sm:inline">·</span>

                  {/* Subject Oracle */}
                  <div className="inline-flex items-center gap-1 rounded-full border border-paper-900/10 dark:border-white/10 p-0.5 bg-paper-100 dark:bg-ink-950/70">
                    {ORACLE_SLOTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          soundEngine.playSelect();
                          setSubject(s);
                        }}
                        className={`rounded-full px-2.5 py-1 font-mono font-medium transition ${
                          subject === s
                            ? 'bg-paper-900 text-paper-50 dark:bg-white/15 dark:text-ivory-100'
                            : 'text-paper-700 hover:text-paper-900 dark:text-ivory-300/75 dark:hover:text-ivory-100'
                        }`}
                      >
                        {s === target ? `${s} (self)` : s}
                      </button>
                    ))}
                  </div>

                  <span className="text-paper-700/70 dark:text-ivory-300/60">is</span>

                  {/* Claimed Role */}
                  <div className="inline-flex items-center gap-1 rounded-full border border-paper-900/10 dark:border-white/10 p-0.5 bg-paper-100 dark:bg-ink-950/70">
                    {ORACLE_ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          soundEngine.playSelect();
                          setClaimedRole(r);
                        }}
                        className={`rounded-full px-3 py-1 font-medium transition ${
                          claimedRole === r
                            ? 'bg-paper-900 text-paper-50 dark:bg-white/15 dark:text-ivory-100'
                            : 'text-paper-700 hover:text-paper-900 dark:text-ivory-300/75 dark:hover:text-ivory-100'
                        }`}
                      >
                        {ROLE_INFO[r].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Natural-Language Question Preview */}
                <p className="mt-3 text-center text-xs sm:text-sm text-paper-800 dark:text-ivory-200/90">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-gold-600 dark:text-gold-300 mr-2">
                    To Oracle {target}:
                  </span>
                  <span className="italic">“{formatQuestionText(currentQuestion)}”</span>
                </p>

                {/* Primary Dock Row */}
                <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-paper-900/[0.07] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSelect();
                      setMode('verdict');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
                  >
                    <Scale className="h-3.5 w-3.5" />
                    <span>Declare Verdict</span>
                  </button>

                  <motion.button
                    type="button"
                    whileTap={!speaking ? { scale: 0.97 } : undefined}
                    disabled={Boolean(speaking) || state.status !== 'asking'}
                    onClick={handleAsk}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-paper-900 px-6 py-2.5 text-xs sm:text-sm font-semibold text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 disabled:opacity-45 transition shadow-[0_8px_24px_-8px_rgba(26,24,21,0.35)] dark:shadow-[0_8px_28px_-8px_rgba(232,168,73,0.5)]"
                  >
                    <MessageCircleQuestion className="h-4 w-4" />
                    <span>
                      {speaking
                        ? `Oracle ${target} responds...`
                        : `Ask Oracle ${target} (${questionsUsed + 1}/${MAX_QUESTIONS})`}
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
                key="verdict-panel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-2xl border border-paper-900/10 bg-paper-50/80 dark:border-white/[0.08] dark:bg-ink-900/75 px-4 sm:px-6 py-4 transition-colors"
              >
                {/* 3-Column Clean Verdict Selector */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {ORACLE_SLOTS.map((slot) => (
                    <div key={slot} className="flex flex-col items-center">
                      <span className="font-display text-sm font-semibold text-paper-900 dark:text-ivory-100 mb-2">
                        Oracle {slot}
                      </span>
                      <div className="flex flex-wrap justify-center gap-1">
                        {ORACLE_ROLES.map((r) => {
                          const active = state.verdict[slot] === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              disabled={state.status !== 'asking'}
                              onClick={() => {
                                soundEngine.playSelect();
                                setState((prev) => assignVerdictRole(prev, slot, r));
                              }}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                                active
                                  ? 'bg-paper-900 text-paper-50 dark:bg-gold-400 dark:text-ink-950 font-semibold'
                                  : 'border border-paper-900/12 text-paper-700 hover:border-paper-900/30 dark:border-white/12 dark:text-ivory-300 dark:hover:border-white/30'
                              }`}
                            >
                              {ROLE_INFO[r].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Verdict Action Row */}
                <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-paper-900/[0.07] dark:border-white/[0.06]">
                  {remainingQuestions > 0 && state.status === 'asking' ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playSelect();
                        setMode('ask');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100 transition"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Ask ({remainingQuestions} left)</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-paper-700/65 dark:text-ivory-300/55 px-2">
                      Final Verdict
                    </span>
                  )}

                  <motion.button
                    type="button"
                    whileTap={verdictReady ? { scale: 0.97 } : undefined}
                    disabled={!verdictReady || state.status !== 'asking'}
                    onClick={handleSealVerdict}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                      verdictReady && state.status === 'asking'
                        ? 'bg-paper-900 text-paper-50 hover:bg-paper-800 dark:bg-gold-400 dark:text-ink-950 dark:hover:bg-gold-300 shadow-[0_8px_28px_-8px_rgba(232,168,73,0.5)]'
                        : 'bg-paper-900/[0.04] text-paper-700/50 border border-paper-900/10 dark:bg-white/[0.05] dark:text-ivory-300/50 dark:border-white/[0.08] cursor-default'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    <span>Seal Verdict</span>
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

      {/* Popovers: Hints & Question Transcript */}
      <AnimatePresence>
        {activeDrawer === 'hints' && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/45 dark:bg-black/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl">
              <OraclesHintPanel
                state={state}
                unlockedTier={unlockedHintTier}
                onUnlockTier={handleUnlockHint}
                onLoadQuestion={handleLoadSuggestedQuestion}
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
                  Sanctum Transcript
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  className="rounded-full p-1.5 text-paper-700 hover:bg-paper-900/[0.06] hover:text-paper-900 dark:text-ivory-300 dark:hover:bg-white/[0.06] dark:hover:text-ivory-100"
                  aria-label="Close transcript"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {state.history.length === 0 ? (
                <p className="py-10 text-center text-sm text-paper-700 dark:text-ivory-300/75">
                  No questions spoken yet.
                </p>
              ) : (
                <ol className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
                  {state.history.map((rec) => (
                    <li
                      key={rec.index}
                      className="flex items-start justify-between gap-3 py-2.5 border-b border-paper-900/[0.06] dark:border-white/[0.05] last:border-0 text-sm"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-mono text-gold-600 dark:text-gold-300">
                          Q{rec.index} → Oracle {rec.question.target}
                        </div>
                        <div className="text-xs sm:text-sm text-paper-900 dark:text-ivory-100">
                          “{formatQuestionText(rec.question)}”
                        </div>
                        <div className="text-[11px] text-paper-700/75 dark:text-ivory-300/65">
                          {rec.consistentPermutationsAfter} arrangement
                          {rec.consistentPermutationsAfter === 1 ? '' : 's'} remaining
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-gold-600/30 bg-gold-500/10 px-3 py-1 font-mono text-xs font-semibold text-gold-600 dark:border-gold-400/35 dark:text-gold-200">
                        {rec.answer}
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
          <OraclesPrologueModal
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
        {state.status !== 'asking' && !speaking && (
          <OraclesOutcomeModal
            state={state}
            onRestart={handleRestart}
            onBackToHub={onBackToHub}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

