"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface PlayerNameContextValue {
  playerName: string | null;
  setPlayerName: (name: string) => void;
  clearPlayerName: () => void;
}

const PlayerNameContext = createContext<PlayerNameContextValue>({
  playerName: null,
  setPlayerName: () => {},
  clearPlayerName: () => {},
});

export function PlayerNameProvider({ children }: { children: ReactNode }) {
  const [playerName, setPlayerName] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("omahnalar-player-name");
    }
    return null;
  });

  const setName = useCallback((name: string) => {
    setPlayerName(name);
    localStorage.setItem("omahnalar-player-name", name);
  }, []);

  const clearName = useCallback(() => {
    setPlayerName(null);
    localStorage.removeItem("omahnalar-player-name");
  }, []);

  return (
    <PlayerNameContext.Provider value={{ playerName, setPlayerName: setName, clearPlayerName: clearName }}>
      {children}
    </PlayerNameContext.Provider>
  );
}

export function usePlayerName() {
  return useContext(PlayerNameContext);
}
