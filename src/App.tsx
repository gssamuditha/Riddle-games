import React, { useEffect, useState } from 'react';
import { AnthologyHub } from './components/AnthologyHub';
import { soundEngine } from './core/sound';
import {
  loadArchiveStorage,
  recordRiddleAttempt,
  recordRiddleVictory,
  setMutedStorage,
  setThemeStorage,
} from './core/storage';
import type { ArchiveStorage, RiddleId, ThemeMode } from './core/types';
import { JugsGame } from './games/alchemist-jugs/JugsGame';
import { BridgeGame } from './games/bridge-riddle/BridgeGame';
import { CoinGame } from './games/counterfeit-coin/CoinGame';
import { EggGame } from './games/egg-drop/EggGame';
import { FerryGame } from './games/midnight-ferry/FerryGame';
import { PilgrimGame } from './games/penniless-pilgrim/PilgrimGame';
import { VaultGame } from './games/three-doors/VaultGame';
import { OraclesGame } from './games/three-oracles/OraclesGame';
import { VirusGame } from './games/virus-riddle/VirusGame';

export const App: React.FC = () => {
  const [storage, setStorage] = useState<ArchiveStorage>(() => loadArchiveStorage());
  const [activeRiddle, setActiveRiddle] = useState<RiddleId | null>(null);

  useEffect(() => {
    soundEngine.setMuted(storage.muted);
  }, [storage.muted]);

  useEffect(() => {
    const root = document.documentElement;
    if (storage.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [storage.theme]);

  const handleToggleMute = () => {
    const nextMuted = !storage.muted;
    soundEngine.setMuted(nextMuted);
    setMutedStorage(nextMuted);
    setStorage((prev) => ({ ...prev, muted: nextMuted }));
  };

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = storage.theme === 'dark' ? 'light' : 'dark';
    setThemeStorage(nextTheme);
    setStorage((prev) => ({ ...prev, theme: nextTheme }));
  };

  const handleLaunchRiddle = (id: RiddleId) => {
    setActiveRiddle(id);
  };

  if (activeRiddle === 'bridge-riddle') {
    return (
      <BridgeGame
        theme={storage.theme}
        onToggleTheme={handleToggleTheme}
        muted={storage.muted}
        onToggleMute={handleToggleMute}
        onBackToHub={() => setActiveRiddle(null)}
        onAttemptStarted={() => {
          setStorage(recordRiddleAttempt('bridge-riddle'));
        }}
        onVictoryRecorded={(result) => {
          setStorage(recordRiddleVictory('bridge-riddle', result));
        }}
      />
    );
  }

  if (activeRiddle === 'midnight-ferry') {
    return (
      <FerryGame
        theme={storage.theme}
        onToggleTheme={handleToggleTheme}
        muted={storage.muted}
        onToggleMute={handleToggleMute}
        onBackToHub={() => setActiveRiddle(null)}
        onAttemptStarted={() => {
          setStorage(recordRiddleAttempt('midnight-ferry'));
        }}
        onVictoryRecorded={(result) => {
          setStorage(recordRiddleVictory('midnight-ferry', result));
        }}
      />
    );
  }

  if (activeRiddle === 'alchemist-jugs') {
    return (
      <JugsGame
        theme={storage.theme}
        onToggleTheme={handleToggleTheme}
        muted={storage.muted}
        onToggleMute={handleToggleMute}
        onBackToHub={() => setActiveRiddle(null)}
        onAttemptStarted={() => {
          setStorage(recordRiddleAttempt('alchemist-jugs'));
        }}
        onVictoryRecorded={(result) => {
          setStorage(recordRiddleVictory('alchemist-jugs', result));
        }}
      />
    );
  }

  if (activeRiddle === 'three-doors') {
    return (
      <VaultGame
        theme={storage.theme}
        onToggleTheme={handleToggleTheme}
        muted={storage.muted}
        onToggleMute={handleToggleMute}
        onBackToHub={() => setActiveRiddle(null)}
        onAttemptStarted={() => {
          setStorage(recordRiddleAttempt('three-doors'));
        }}
        onVictoryRecorded={(result) => {
          setStorage(recordRiddleVictory('three-doors', result));
        }}
      />
    );
  }

  if (activeRiddle === 'penniless-pilgrim') {
    return (
      <PilgrimGame
        theme={storage.theme}
        onToggleTheme={handleToggleTheme}
        muted={storage.muted}
        onToggleMute={handleToggleMute}
        onBackToHub={() => setActiveRiddle(null)}
        onAttemptStarted={() => {
          setStorage(recordRiddleAttempt('penniless-pilgrim'));
        }}
        onVictoryRecorded={(result) => {
          setStorage(recordRiddleVictory('penniless-pilgrim', result));
        }}
      />
    );
  }

  if (activeRiddle === 'egg-drop') {
    return (
      <EggGame
        theme={storage.theme}
        onToggleTheme={handleToggleTheme}
        muted={storage.muted}
        onToggleMute={handleToggleMute}
        onBackToHub={() => setActiveRiddle(null)}
        onAttemptStarted={() => {
          setStorage(recordRiddleAttempt('egg-drop'));
        }}
        onVictoryRecorded={(result) => {
          setStorage(recordRiddleVictory('egg-drop', result));
        }}
      />
    );
  }

  if (activeRiddle === 'virus-riddle') {
    return (
      <VirusGame
        theme={storage.theme}
        onToggleTheme={handleToggleTheme}
        muted={storage.muted}
        onToggleMute={handleToggleMute}
        onBackToHub={() => setActiveRiddle(null)}
        onAttemptStarted={() => {
          setStorage(recordRiddleAttempt('virus-riddle'));
        }}
        onVictoryRecorded={(result) => {
          setStorage(recordRiddleVictory('virus-riddle', result));
        }}
      />
    );
  }

  if (activeRiddle === 'counterfeit-coin') {
    return (
      <CoinGame
        theme={storage.theme}
        onToggleTheme={handleToggleTheme}
        muted={storage.muted}
        onToggleMute={handleToggleMute}
        onBackToHub={() => setActiveRiddle(null)}
        onAttemptStarted={() => {
          setStorage(recordRiddleAttempt('counterfeit-coin'));
        }}
        onVictoryRecorded={(result) => {
          setStorage(recordRiddleVictory('counterfeit-coin', result));
        }}
      />
    );
  }

  if (activeRiddle === 'three-oracles') {
    return (
      <OraclesGame
        theme={storage.theme}
        onToggleTheme={handleToggleTheme}
        muted={storage.muted}
        onToggleMute={handleToggleMute}
        onBackToHub={() => setActiveRiddle(null)}
        onAttemptStarted={() => {
          setStorage(recordRiddleAttempt('three-oracles'));
        }}
        onVictoryRecorded={(result) => {
          setStorage(recordRiddleVictory('three-oracles', result));
        }}
      />
    );
  }

  return (
    <AnthologyHub
      storage={storage}
      theme={storage.theme}
      onToggleTheme={handleToggleTheme}
      muted={storage.muted}
      onToggleMute={handleToggleMute}
      onLaunchRiddle={handleLaunchRiddle}
    />
  );
};

export default App;
