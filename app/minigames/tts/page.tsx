"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ArrowLeft, ChevronRight, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { CROSSWORD_CLUES, GRID_ROWS, GRID_COLS, buildGrid, type Clue } from "@/data/crosswordData";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";
import PlayerNamePrompt from "@/components/PlayerNamePrompt";
import { usePlayerName } from "@/contexts/PlayerNameContext";
import { saveMinigameResult } from "@/services/minigames";

type GamePhase = "welcome" | "playing" | "finished";

const STORAGE_KEY = "omahnalar-tts-progress";

interface CrosswordCell {
  answer: string;
  number: number | null;
  active: boolean;
}

function getCellsForClue(clue: Clue): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  let r = clue.row;
  let c = clue.col;
  for (let i = 0; i < clue.answer.length; i++) {
    if (r < GRID_ROWS && c < GRID_COLS) {
      cells.push({ row: r, col: c });
      if (clue.direction === "across") c++;
      else r++;
    }
  }
  return cells;
}

function mergeLockedCells(answers: string[][] | null): string[][] {
  const grid = buildGrid();
  const merged = grid.map((row) => row.map(() => ""));
  if (answers) {
    for (let r = 0; r < Math.min(answers.length, merged.length); r++) {
      for (let c = 0; c < Math.min(answers[r].length, merged[r].length); c++) {
        merged[r][c] = answers[r][c];
      }
    }
  }
  for (const clue of CROSSWORD_CLUES) {
    const cells = getCellsForClue(clue);
    if (cells.length > 0) merged[cells[0].row][cells[0].col] = clue.answer[0];
  }
  return merged;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function loadProgress(): string[][] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveProgress(grid: string[][]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grid));
  } catch {}
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function TTSPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.tts : en.tts;
  const common = locale === "id" ? id.common : en.common;
  const { playerName } = usePlayerName();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [phase, setPhase] = useState<GamePhase>("welcome");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownKey, setCountdownKey] = useState(0);
  const [grid] = useState<CrosswordCell[][]>(buildGrid);
  const initAnswers = useCallback(() => {
    return mergeLockedCells(loadProgress());
  }, []);
  const [userAnswers, setUserAnswers] = useState<string[][]>(initAnswers);
  const [activeClue, setActiveClue] = useState<Clue | null>(null);
  const [focusCell, setFocusCell] = useState<{ row: number; col: number } | null>(null);
  const [completedClues, setCompletedClues] = useState<Set<number>>(new Set());
  const [showCompletion, setShowCompletion] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalTimeMs, setFinalTimeMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const activeClueRef = useRef(activeClue);

  useEffect(() => { activeClueRef.current = activeClue; }, [activeClue]);

  const acrossClues = CROSSWORD_CLUES.filter((c) => c.direction === "across");
  const downClues = CROSSWORD_CLUES.filter((c) => c.direction === "down");
  const totalClues = CROSSWORD_CLUES.length;

  const lockedCells = useMemo(() => {
    const locked = new Set<string>();
    for (const clue of CROSSWORD_CLUES) {
      const cells = getCellsForClue(clue);
      if (cells.length > 0) locked.add(`${cells[0].row},${cells[0].col}`);
    }
    return locked;
  }, []);

  useEffect(() => {
    inputRefs.current = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => null)
    );
  }, []);

  useEffect(() => {
    if (focusCell && inputRefs.current[focusCell.row]?.[focusCell.col]) {
      inputRefs.current[focusCell.row][focusCell.col]?.focus();
    }
  }, [focusCell]);

  const focusFirstCell = useCallback((clue: Clue) => {
    const cells = getCellsForClue(clue);
    if (cells.length > 0) {
      setFocusCell(cells[0]);
    }
  }, []);

  const getNextCell = useCallback(
    (row: number, col: number, clue: Clue): { row: number; col: number } | null => {
      const cells = getCellsForClue(clue);
      const idx = cells.findIndex((c) => c.row === row && c.col === col);
      if (idx >= 0 && idx < cells.length - 1) {
        return cells[idx + 1];
      }
      return null;
    },
    []
  );

  const getPrevCell = useCallback(
    (row: number, col: number, clue: Clue): { row: number; col: number } | null => {
      const cells = getCellsForClue(clue);
      const idx = cells.findIndex((c) => c.row === row && c.col === col);
      if (idx > 0) {
        return cells[idx - 1];
      }
      return null;
    },
    []
  );

  const checkClueComplete = useCallback(
    (clue: Clue, answers: string[][]): boolean => {
      const cells = getCellsForClue(clue);
      for (const cell of cells) {
        const userChar = answers[cell.row]?.[cell.col]?.toUpperCase() || "";
        const answerChar = grid[cell.row][cell.col].answer;
        if (userChar !== answerChar) return false;
      }
      return true;
    },
    [grid]
  );

  const checkAllClues = useCallback(
    (answers: string[][]): Set<number> => {
      const completed = new Set<number>();
      for (const clue of CROSSWORD_CLUES) {
        if (checkClueComplete(clue, answers)) {
          completed.add(clue.id);
        }
      }
      return completed;
    },
    [checkClueComplete]
  );

  const handleCellChange = useCallback(
    (row: number, col: number, value: string, clue: Clue) => {
      const char = value.slice(-1).toUpperCase();
      const newAnswers = userAnswers.map((r) => [...r]);
      newAnswers[row][col] = char;
      setUserAnswers(newAnswers);
      saveProgress(newAnswers);

      const completed = checkAllClues(newAnswers);
      setCompletedClues(completed);

      if (completed.size === totalClues) {
        clearProgress();
        if (startTimeRef.current !== null) {
          setFinalTimeMs(Date.now() - startTimeRef.current);
        }
        saveMinigameResult({
          player_name: playerName || "Unknown",
          minigame: "tts",
          score: completed.size,
          total: totalClues,
          time_ms: startTimeRef.current ? Date.now() - startTimeRef.current : 0,
          wrong: totalClues - completed.size,
        });
        setTimeout(() => setShowCompletion(true), 600);
        return;
      }

      if (char) {
        const next = getNextCell(row, col, clue);
        if (next) {
          setFocusCell(next);
        } else {
          const nextClueIdx = CROSSWORD_CLUES.findIndex((c) => c.id === clue.id) + 1;
          if (nextClueIdx < CROSSWORD_CLUES.length) {
            const nextClue = CROSSWORD_CLUES[nextClueIdx];
            setActiveClue(nextClue);
            focusFirstCell(nextClue);
          }
        }
      } else {
        const prev = getPrevCell(row, col, clue);
        if (prev) setFocusCell(prev);
      }
    },
    [userAnswers, grid, checkAllClues, getNextCell, getPrevCell, focusFirstCell, totalClues]
  );

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number, clue: Clue) => {
      if (e.key === "Backspace") {
        if (!userAnswers[row][col]) {
          const cells = getCellsForClue(clue);
          const idx = cells.findIndex((c) => c.row === row && c.col === col);
          let prevIdx = idx - 1;
          while (prevIdx >= 0 && lockedCells.has(`${cells[prevIdx].row},${cells[prevIdx].col}`)) {
            prevIdx--;
          }
          if (prevIdx >= 0) {
            const prev = cells[prevIdx];
            const newAnswers = userAnswers.map((r) => [...r]);
            newAnswers[prev.row][prev.col] = "";
            setUserAnswers(newAnswers);
            saveProgress(newAnswers);
            setCompletedClues(checkAllClues(newAnswers));
            setFocusCell(prev);
          }
        }
        return;
      }

      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        let tr = row, tc = col;
        if (e.key === "ArrowUp") tr = Math.max(0, row - 1);
        if (e.key === "ArrowDown") tr = Math.min(GRID_ROWS - 1, row + 1);
        if (e.key === "ArrowLeft") tc = Math.max(0, col - 1);
        if (e.key === "ArrowRight") tc = Math.min(GRID_COLS - 1, col + 1);
        if ((tr !== row || tc !== col) && grid[tr][tc].active) {
          setFocusCell({ row: tr, col: tc });
        }
      }
    },
    [userAnswers, getCellsForClue, lockedCells, checkAllClues, grid]
  );

  const handleCellFocus = useCallback((row: number, col: number) => {
    setFocusCell({ row, col });

    const containingClues = CROSSWORD_CLUES.filter((c) =>
      getCellsForClue(c).some((cc) => cc.row === row && cc.col === col)
    );
    if (containingClues.length === 0) return;

    const current = activeClueRef.current;
    if (current && containingClues.some((c) => c.id === current.id)) return;

    const across = containingClues.find((c) => c.direction === "across");
    setActiveClue(across || containingClues[0]);
  }, []);

  const handleClueClick = useCallback(
    (clue: Clue) => {
      setActiveClue(clue);
      focusFirstCell(clue);
    },
    [focusFirstCell]
  );

  const handleStart = useCallback(() => {
    setShowNamePrompt(true);
  }, []);

  const handleNameConfirm = useCallback(() => {
    setShowNamePrompt(false);
    setCountdown(3);
    setCountdownKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown < 0) {
      setCountdown(null);
      setPhase("playing");
      startTimeRef.current = Date.now();
      setElapsedMs(0);
      setFinalTimeMs(0);
      const saved = loadProgress();
      if (saved) {
        setUserAnswers(mergeLockedCells(saved));
        const completed = checkAllClues(mergeLockedCells(saved));
        setCompletedClues(completed);
      }
      setTimeout(() => {
        if (CROSSWORD_CLUES.length > 0) {
          setActiveClue(CROSSWORD_CLUES[0]);
          focusFirstCell(CROSSWORD_CLUES[0]);
        }
      }, 100);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 800);
    return () => clearTimeout(t);
  }, [countdown, checkAllClues, focusFirstCell]);

  useEffect(() => {
    const saved = loadProgress();
    if (saved) {
      setUserAnswers(mergeLockedCells(saved));
      const completed = checkAllClues(mergeLockedCells(saved));
      setCompletedClues(completed);
    }
  }, [checkAllClues]);

  useEffect(() => {
    if (phase !== "playing" || startTimeRef.current === null) return;
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current!);
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  const handleReset = useCallback(() => {
    const empty = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => "")
    );
    for (const clue of CROSSWORD_CLUES) {
      const cells = getCellsForClue(clue);
      if (cells.length > 0) empty[cells[0].row][cells[0].col] = clue.answer[0];
    }
    setUserAnswers(empty);
    setCompletedClues(new Set());
    setActiveClue(CROSSWORD_CLUES[0]);
    clearProgress();
    if (CROSSWORD_CLUES.length > 0) {
      focusFirstCell(CROSSWORD_CLUES[0]);
    }
  }, [focusFirstCell]);

  if (showNamePrompt) {
    return <PlayerNamePrompt onStart={handleNameConfirm} />;
  }

  if (countdown !== null) {
    return <CountdownOverlay value={countdown} key={countdownKey} />;
  }

  if (phase === "welcome") {
    return <WelcomeScreen onStart={handleStart} onBack={() => router.back()} />;
  }

  if (!activeClue) return null;

  const activeCells = getCellsForClue(activeClue);

  const completedCells = new Set<string>();
  for (const clue of CROSSWORD_CLUES) {
    if (!completedClues.has(clue.id)) continue;
    for (const cell of getCellsForClue(clue)) {
      completedCells.add(`${cell.row},${cell.col}`);
    }
  }

  let finishLetterCorrect = 0;
  let finishLetterTotal = 0;
  if (phase === "finished") {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (grid[r][c].active) {
          finishLetterTotal++;
          if ((userAnswers[r]?.[c] || "").toUpperCase() === grid[r][c].answer) {
            finishLetterCorrect++;
          }
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF6EA] font-sans antialiased text-[#3B387E] flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#DCD5FE]/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#FED777]/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="bg-white border-b-2 border-[#3B387E] relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/minigames")}
              className="flex items-center gap-1 text-sm text-[#3B387E] hover:text-[#3B387E] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {common.back}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#3B387E]/60 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(elapsedMs)}
              </span>
              <span className="text-xs text-[#3B387E]/60 font-medium">
                {completedClues.size}/{totalClues} {t.soalTerjawab}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Grid panel */}
          <div className="flex-shrink-0 flex flex-col items-center w-full lg:w-auto">
            <div className="w-full max-w-full overflow-x-auto pb-2 scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div
                className="inline-grid gap-[2px] bg-[#3B387E] rounded-2xl p-2 shadow-sm border-2 border-[#3B387E]"
                style={{
                  gridTemplateColumns: `repeat(${GRID_COLS}, 32px)`,
                }}
              >
                {Array.from({ length: GRID_ROWS }, (_, r) =>
                  Array.from({ length: GRID_COLS }, (_, c) => {
                    const cell = grid[r][c];
                    const isActive = cell.active;
                    const isFocused = focusCell?.row === r && focusCell?.col === c;
                    const isInActiveClue = activeCells.some((ac) => ac.row === r && ac.col === c);
                    const userChar = userAnswers[r]?.[c] || "";
                    const isCorrectLetter = isActive && userChar.toUpperCase() === cell.answer;
                    const isInCompletedClue = completedCells.has(`${r},${c}`);
                    const isLocked = lockedCells.has(`${r},${c}`);

                    const hasGreen = isInCompletedClue || (userChar && isCorrectLetter);

                    let cellBg = "bg-white";
                    let cellBorder = "border border-slate-300";
                    let cellRing = "";
                    let cellText = "text-[#3B387E]";

                    if (isLocked) {
                      cellBg = "bg-[#FED777]";
                      cellBorder = "border border-[#3B387E]";
                      cellText = "text-[#3B387E]";
                    } else if (isFocused) {
                      cellBg = "bg-[#FFE577]";
                      cellBorder = "border border-[#3B387E]";
                      cellRing = "ring-2 ring-[#FED777]";
                    } else if (hasGreen) {
                      cellBg = "bg-[#83F3BA]";
                      cellBorder = "border border-[#3B387E]";
                      cellText = "text-[#3B387E]";
                    } else if (isInActiveClue) {
                      cellBg = "bg-[#DCD5FE]/60";
                    }

                    return (
                      <div
                        key={`${r}-${c}`}
                        className="relative"
                        style={{ width: 32, height: 32 }}
                      >
                        {isActive ? (
                          <input
                            ref={(el) => {
                              if (!inputRefs.current[r]) inputRefs.current[r] = [];
                              inputRefs.current[r][c] = el;
                            }}
                            type="text"
                            maxLength={1}
                            value={userChar}
                            readOnly={isLocked}
                            onChange={(e) => handleCellChange(r, c, e.target.value, activeClue)}
                            onKeyDown={(e) => handleCellKeyDown(e, r, c, activeClue)}
                            onFocus={() => handleCellFocus(r, c)}
                            className={`w-full h-full text-center font-bold text-xs uppercase outline-none transition-colors duration-100 ${cellBg} ${cellBorder} ${cellRing} ${cellText}`}
                            autoComplete="off"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#3B387E]" />
                        )}
                        {cell.number && (
                          <span className="absolute top-[1px] left-[2px] text-[7px] font-bold text-slate-500 pointer-events-none select-none leading-none">
                            {cell.number}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
            </div>
          </div>
          </div>

          {/* Clues panel */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Active clue card */}
            <div className="bg-white rounded-3xl border-2 border-[#3B387E] shadow-sm p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#3B387E] text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {activeClue.number}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B387E]/60">
                    {activeClue.direction === "across" ? t.mendatar : t.menurun}
                  </span>
                  <p className="text-sm font-semibold text-[#3B387E] mt-0.5 leading-relaxed">
                    {activeClue.question}
                  </p>
                  <p className="text-xs text-[#3B387E]/50 mt-0.5">
                    {activeClue.answer.length} {t.huruf}
                  </p>
                </div>
              </div>
            </div>

            {/* Clue lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#3B387E]/80 mb-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                  {t.mendatar}
                </h3>
                <div className="space-y-0.5">
                  {acrossClues.map((clue) => {
                    const isCompleted = completedClues.has(clue.id);
                    const isActive = activeClue?.id === clue.id;
                    return (
                      <button
                        key={clue.id}
                        onClick={() => handleClueClick(clue)}
                        className={`w-full text-left flex items-start gap-2 p-2 rounded-2xl border-2 transition-all duration-150 ${
                          isActive
                            ? "bg-[#FFE577] border-[#3B387E]"
                            : isCompleted
                              ? "bg-[#83F3BA]/30 border-[#3B387E]/20"
                              : "border-transparent hover:bg-[#DCD5FE]/50"
                        }`}
                      >
                        <span className={`text-xs font-bold w-5 flex-shrink-0 mt-0.5 ${
                          isCompleted ? "text-[#3B387E]" : isActive ? "text-[#3B387E]" : "text-[#3B387E]/50"
                        }`}>
                          {clue.number}.
                        </span>
                        <span className={`text-xs leading-relaxed flex-1 ${
                          isCompleted ? "text-[#3B387E] line-through decoration-[#3B387E]/30" : isActive ? "text-[#3B387E] font-semibold" : "text-[#3B387E]/70"
                        }`}>
                          {clue.question}
                        </span>
                        {isCompleted && (
                          <span className="text-[#3B387E] text-xs flex-shrink-0 mt-0.5">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#3B387E]/80 mb-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  {t.menurun}
                </h3>
                <div className="space-y-0.5">
                  {downClues.map((clue) => {
                    const isCompleted = completedClues.has(clue.id);
                    const isActive = activeClue?.id === clue.id;
                    return (
                      <button
                        key={clue.id}
                        onClick={() => handleClueClick(clue)}
                        className={`w-full text-left flex items-start gap-2 p-2 rounded-2xl border-2 transition-all duration-150 ${
                          isActive
                            ? "bg-[#FFE577] border-[#3B387E]"
                            : isCompleted
                              ? "bg-[#83F3BA]/30 border-[#3B387E]/20"
                              : "border-transparent hover:bg-[#DCD5FE]/50"
                        }`}
                      >
                        <span className={`text-xs font-bold w-5 flex-shrink-0 mt-0.5 ${
                          isCompleted ? "text-[#3B387E]" : isActive ? "text-[#3B387E]" : "text-[#3B387E]/50"
                        }`}>
                          {clue.number}.
                        </span>
                        <span className={`text-xs leading-relaxed flex-1 ${
                          isCompleted ? "text-[#3B387E] line-through decoration-[#3B387E]/30" : isActive ? "text-[#3B387E] font-semibold" : "text-[#3B387E]/70"
                        }`}>
                          {clue.question}
                        </span>
                        {isCompleted && (
                          <span className="text-[#3B387E] text-xs flex-shrink-0 mt-0.5">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleReset}
                className="text-xs text-[#3B387E]/50 hover:text-[#3B387E] transition-colors px-3 py-1.5 rounded-full border-2 border-transparent hover:border-[#3B387E] hover:bg-[#DCD5FE]/50"
              >
                {t.resetJawaban}
              </button>
              <button
                onClick={() => {
                  if (startTimeRef.current !== null) {
                    setFinalTimeMs(Date.now() - startTimeRef.current);
                  }
                  const timeMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
                  saveMinigameResult({
                    player_name: playerName || "Unknown",
                    minigame: "tts",
                    score: completedClues.size,
                    total: totalClues,
                    time_ms: timeMs,
                    wrong: totalClues - completedClues.size,
                  });
                  setPhase("finished");
                  setTimeout(() => setShowCompletion(false), 100);
                }}
                className="px-5 py-2 rounded-full font-bold text-xs text-white bg-[#3B387E] hover:bg-[#2e2a66] transition-all duration-200 shadow-sm"
              >
                <span className="flex items-center gap-1.5">
                  {t.selesai} <ChevronRight className="w-3 h-3" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Completion overlay */}
      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Confetti />
          <div
            className="bg-white rounded-[28px] border-2 border-[#3B387E] p-8 text-center max-w-sm mx-4 shadow-sm"
            style={{ animation: "fade-in 0.4s ease-out" }}
          >
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-black font-poppins text-[#3B387E] mb-2">{t.selamat}</h2>
            <p className="text-sm text-[#3B387E]/70 mb-2 leading-relaxed">
              {t.allComplete}<br />{t.completed}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FED777] border-2 border-[#3B387E] text-[#3B387E] text-xs font-bold mb-6">
              <Clock className="w-3 h-3" />
              {t.waktuPengerjaan}: {formatTime(finalTimeMs)}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowCompletion(false);
                  setPhase("finished");
                }}
                className="w-full py-3 rounded-full font-bold text-sm text-white bg-[#3B387E] hover:bg-[#2e2a66] transition-colors"
              >
                {t.lihatHasil}
              </button>
              <button
                onClick={() => setShowCompletion(false)}
                className="w-full py-2.5 rounded-full text-sm font-bold text-[#3B387E]/70 hover:text-[#3B387E] hover:bg-[#DCD5FE]/50 transition-colors"
              >
                {t.lanjutkan}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finished result screen */}
      {phase === "finished" && (
        <ResultScreen
          totalClues={totalClues}
          completedClues={completedClues.size}
          finalTimeMs={finalTimeMs}
          onRestart={() => { clearProgress(); router.refresh(); }}
          onBack={() => router.push("/minigames")}
        />
      )}
    </div>
  );
}

function CountdownOverlay({ value }: { value: number }) {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.tts : en.tts;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B387E]">
      <div className="text-center">
        {value > 0 ? (
          <span
            key={value}
            className="text-9xl md:text-[12rem] font-extrabold text-white drop-shadow-xl inline-block"
            style={{ animation: "countdown-pop 0.6s ease-out forwards" }}
          >
            {value}
          </span>
        ) : (
          <span
            className="text-8xl md:text-9xl font-extrabold text-[#FED777] drop-shadow-lg inline-block"
            style={{ animation: "fade-in 0.4s ease-out" }}
          >
            {t.go}
          </span>
        )}
      </div>
    </div>
  );
}

function WelcomeScreen({
  onStart,
  onBack,
}: {
  onStart: () => void;
  onBack: () => void;
}) {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.tts : en.tts;
  const common = locale === "id" ? id.common : en.common;
  const min = locale === "id" ? id.minigames : en.minigames;
  return (
    <section className="font-sans min-h-screen flex flex-col">
      {/* Bagian atas (background krem) */}
      <div className="bg-[#FFF6EA] pt-6 pb-24 px-6 text-center">
        {/* Tombol kembali */}
        <div className="max-w-5xl mx-auto flex items-center justify-start mb-6">
          <button onClick={onBack} className="inline-flex items-center space-x-2 text-gray-500 hover:text-black text-sm font-semibold transition">
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{common.back}</span>
          </button>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {/* Badge Minigames */}
          <span className="inline-block bg-[#B9A6FF] text-white text-xs font-black px-5 py-1.5 rounded-full uppercase tracking-wider">
            {min.badge}
          </span>

          {/* Judul utama */}
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            <span className="text-[#E0BA24]">Teka Teki</span> <span className="text-black">Silang</span>
          </h1>

          {/* Deskripsi */}
          <p className="text-gray-700 text-xs md:text-sm font-medium max-w-lg mx-auto leading-relaxed">
            {locale === "id" ? "Isi kotak-kotak kosong dengan jawaban yang tepat berdasarkan petunjuk yang diberikan" : "Fill in the blanks with the correct answers based on the clues provided"}
          </p>
        </div>
      </div>

      {/* Bagian bawah (background navy + kartu utama) */}
      <div className="bg-[#3B387E] flex-1 px-4 md:px-8 pb-16">
        <div className="max-w-4xl mx-auto -mt-16">
          {/* Kartu utama */}
          <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-xl space-y-6">

            {/* Grid 3 info box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: "📋", label: `${CROSSWORD_CLUES.length} ${locale === "id" ? "Soal" : "Questions"}`, sub: t.tekaTeki },
                { icon: "✏️", label: t.ketikJawaban, sub: t.inputHuruf },
                { icon: "📖", label: t.edukatif, sub: t.penjelasanLengkap },
              ].map((item, i) => (
                <div key={i} className="bg-[#E2E6FA] rounded-2xl p-5 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-black text-black text-base">{item.label}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Banner petunjuk */}
            <div className="bg-[#FFF8D6] rounded-2xl p-4 md:p-5 flex items-start space-x-3 text-left border border-[#F2E5A3]/50">
              <span className="text-xl leading-none shrink-0">💡</span>
              <p className="text-xs md:text-sm font-medium text-[#B58210] leading-relaxed">
                {t.tooltip}
              </p>
            </div>

            {/* Tombol mulai */}
            <div>
              <button
                onClick={onStart}
                className="w-full inline-flex items-center justify-center space-x-3 bg-[#3B387E] hover:bg-[#2c2960] text-white font-black text-lg py-4 px-8 rounded-2xl transition shadow-md"
              >
                <span>{t.mulai}</span>
                <svg className="w-5 h-5 fill-current ml-1" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

function ResultScreen({
  totalClues,
  completedClues,
  finalTimeMs,
  onRestart,
  onBack,
}: {
  totalClues: number;
  completedClues: number;
  finalTimeMs: number;
  onRestart: () => void;
  onBack: () => void;
}) {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.tts : en.tts;
  const common = locale === "id" ? id.common : en.common;
  const [animScore, setAnimScore] = useState(0);
  const [showItems, setShowItems] = useState(false);

  const allComplete = completedClues === totalClues;
  const pct = totalClues > 0 ? Math.round((completedClues / totalClues) * 100) : 0;

  useEffect(() => {
    const t1 = setTimeout(() => {
      let n = 0;
      const step = Math.max(1, completedClues / 30);
      const interval = setInterval(() => {
        n = Math.min(n + step, completedClues);
        setAnimScore(Math.round(n));
        if (n >= completedClues) clearInterval(interval);
      }, 40);
    }, 300);
    const t2 = setTimeout(() => setShowItems(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [completedClues]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-[28px] border-2 border-[#3B387E] p-8 text-center max-w-sm mx-4 shadow-sm w-full"
        style={{ animation: "fade-in 0.4s ease-out" }}
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center relative mb-4">
            <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#DCD5FE" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke="#3B387E" strokeWidth="6"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 283,
                  strokeDashoffset: 283 - (completedClues / totalClues) * 283,
                  transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl">{allComplete ? "🎉" : pct >= 60 ? "👍" : "💪"}</span>
              <span className="font-bold text-3xl text-[#3B387E] leading-none">{animScore}</span>
              <span className="text-[#3B387E]/60 text-xs">{t.dari} {totalClues}</span>
            </div>
          </div>
          <h2 className="text-2xl font-black font-poppins text-[#3B387E] mb-1">
            {allComplete ? t.lengkap : pct >= 60 ? t.bagus : t.terusBelajar}
          </h2>
          <p className="text-sm text-[#3B387E]/60">
            {allComplete
              ? t.allComplete
              : `${completedClues} ${t.dari} ${totalClues} ${t.soalBenar}`}
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-[#FED777] border-2 border-[#3B387E]">
            <span className="font-bold text-[#3B387E] text-lg">{pct}%</span>
            <span className="text-[#3B387E]/70 text-sm font-medium">{t.persenBenar}</span>
          </div>
          {finalTimeMs > 0 && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-full bg-[#DCD5FE] border-2 border-[#3B387E]">
              <Clock className="w-3.5 h-3.5 text-[#3B387E]/60" />
              <span className="text-[#3B387E]/60 text-sm">{t.waktuPengerjaan}:</span>
              <span className="font-bold text-[#3B387E] text-sm">{formatTime(finalTimeMs)}</span>
            </div>
          )}
        </div>

        <div
          style={{
            opacity: showItems ? 1 : 0,
            transform: showItems ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease",
          }}
        >
          <button
            onClick={onRestart}
            className="w-full py-3 rounded-full font-bold text-sm text-white bg-[#3B387E] hover:bg-[#2e2a66] transition-colors shadow-sm"
          >
            <span className="flex items-center justify-center gap-2">
              🔄 {t.ulangi}
            </span>
          </button>
          <button
            onClick={onBack}
            className="w-full py-2.5 mt-2 rounded-full text-sm font-bold text-[#3B387E]/70 hover:text-[#3B387E] hover:bg-[#DCD5FE]/50 transition-colors"
          >
            {t.kembaliMinigames}
          </button>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!particlesRef.current) return;
    const container = particlesRef.current;
    const colors = ["#3B387E", "#FED777", "#FFA756", "#83F3BA", "#A4C4FF"];
    const elements: HTMLDivElement[] = [];

    for (let i = 0; i < 40; i++) {
      const el = document.createElement("div");
      const size = 5 + Math.random() * 8;
      el.style.cssText = `
        position: absolute;
        left: ${Math.random() * 100}%;
        top: -10px;
        width: ${Math.random() > 0.5 ? size : size * 2}px;
        height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        animation: confetti-fall ${2 + Math.random() * 3}s ease-in ${Math.random() * 2}s forwards;
        pointer-events: none;
      `;
      container.appendChild(el);
      elements.push(el);
    }

    return () => elements.forEach((el) => el.remove());
  }, []);

  return <div ref={particlesRef} className="fixed inset-0 pointer-events-none z-50 overflow-hidden" />;
}
