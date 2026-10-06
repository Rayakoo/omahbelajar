"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import { type TtsClue } from "@/services/course-minigames";

// ── Grid helpers ──────────────────────────────────────────

function gridBounds(clues: TtsClue[]) {
  if (clues.length === 0) return { minR: 0, maxR: 0, minC: 0, maxC: 0, rows: 0, cols: 0 };
  const endR = (c: TtsClue) => (c.direction === "down" ? c.row + c.answer.length - 1 : c.row);
  const endC = (c: TtsClue) => (c.direction === "across" ? c.col + c.answer.length - 1 : c.col);
  const minR = Math.min(...clues.map((c) => c.row));
  const maxR = Math.max(...clues.map(endR));
  const minC = Math.min(...clues.map((c) => c.col));
  const maxC = Math.max(...clues.map(endC));
  return { minR, maxR, minC, maxC, rows: maxR - minR + 1, cols: maxC - minC + 1 };
}

interface CellInfo {
  answer: string;
  number: number | null;
  active: boolean;
}

function buildCellGrid(clues: TtsClue[]): { grid: CellInfo[][]; bounds: ReturnType<typeof gridBounds> } {
  const bounds = gridBounds(clues);
  if (bounds.rows === 0 || bounds.cols === 0) return { grid: [], bounds };
  const grid: CellInfo[][] = Array.from({ length: bounds.rows }, () =>
    Array.from({ length: bounds.cols }, () => ({ answer: "", number: null, active: false }))
  );
  for (const clue of clues) {
    for (let i = 0; i < clue.answer.length; i++) {
      const r = clue.direction === "across" ? clue.row : clue.row + i;
      const c = clue.direction === "across" ? clue.col + i : clue.col;
      const ri = r - bounds.minR;
      const ci = c - bounds.minC;
      if (ri >= 0 && ri < bounds.rows && ci >= 0 && ci < bounds.cols) {
        grid[ri][ci] = { answer: clue.answer[i], number: grid[ri][ci].number, active: true };
      }
    }
    const startRi = clue.row - bounds.minR;
    const startCi = clue.col - bounds.minC;
    if (startRi >= 0 && startRi < bounds.rows && startCi >= 0 && startCi < bounds.cols) {
      grid[startRi][startCi].number = clue.number;
    }
  }
  return { grid, bounds };
}

function clueCells(clue: TtsClue, bounds: ReturnType<typeof gridBounds>): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = [];
  let r = clue.row;
  let c = clue.col;
  for (let i = 0; i < clue.answer.length; i++) {
    const ri = r - bounds.minR;
    const ci = c - bounds.minC;
    if (ri >= 0 && ri < bounds.rows && ci >= 0 && ci < bounds.cols) {
      cells.push({ row: ri, col: ci });
    }
    if (clue.direction === "across") c++;
    else r++;
  }
  return cells;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ── Component ─────────────────────────────────────────────

interface TtsPlayerProps {
  clues: TtsClue[];
  minigameId: string;
  courseId: string;
}

export default function TtsPlayer({ clues, minigameId, courseId }: TtsPlayerProps) {
  const router = useRouter();
  const storageKey = useMemo(() => `omahnalar-course-tts-${minigameId}`, [minigameId]);

  const { grid, bounds } = useMemo(() => buildCellGrid(clues), [clues]);
  const { rows, cols } = bounds;

  // Locked cells = first cell of each clue
  const lockedCells = useMemo(() => {
    const s = new Set<string>();
    for (const c of clues) {
      const cells = clueCells(c, bounds);
      if (cells.length > 0) s.add(`${cells[0].row},${cells[0].col}`);
    }
    return s;
  }, [clues, bounds]);

  // Build empty answers grid (first cells pre-filled)
  const emptyGrid = useCallback(() => {
    const a = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
    for (const clue of clues) {
      const cells = clueCells(clue, bounds);
      if (cells.length > 0) {
        a[cells[0].row][cells[0].col] = clue.answer[0];
      }
    }
    return a;
  }, [rows, cols, clues, bounds]);

  const [phase, setPhase] = useState<"playing" | "finished">("playing");
  const [userAnswers, setUserAnswers] = useState<string[][]>(emptyGrid);
  const [activeClue, setActiveClue] = useState<TtsClue | null>(null);
  const [focusCell, setFocusCell] = useState<{ row: number; col: number } | null>(null);
  const [completedClues, setCompletedClues] = useState<Set<number>>(new Set());
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalTimeMs, setFinalTimeMs] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const activeClueRef = useRef(activeClue);
  const focusCellRef = useRef(focusCell);

  useEffect(() => { activeClueRef.current = activeClue; }, [activeClue]);
  useEffect(() => { focusCellRef.current = focusCell; }, [focusCell]);

  // Sync userAnswers when clues change (e.g. loaded from API)
  useEffect(() => {
    if (rows === 0 || cols === 0) return;
    setUserAnswers(emptyGrid());
  }, [rows, cols, emptyGrid]);

  // Init refs array
  useEffect(() => {
    inputRefs.current = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  }, [rows, cols]);

  // Focus active cell
  useEffect(() => {
    if (focusCell && inputRefs.current[focusCell.row]?.[focusCell.col]) {
      inputRefs.current[focusCell.row][focusCell.col]?.focus();
    }
  }, [focusCell]);

  // Load saved progress
  useEffect(() => {
    if (rows === 0) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: string[][] = JSON.parse(saved);
        if (parsed.length === rows && parsed[0]?.length === cols) {
          setUserAnswers(parsed);
          // Recalc completed
          const completed = new Set<number>();
          for (const clue of clues) {
            const cells = clueCells(clue, bounds);
            let ok = true;
            for (const cell of cells) {
              if ((parsed[cell.row]?.[cell.col] || "").toUpperCase() !== (grid[cell.row]?.[cell.col]?.answer || "")) {
                ok = false;
                break;
              }
            }
            if (ok) completed.add(clue.number);
          }
          setCompletedClues(completed);
          return;
        }
      }
    } catch {}
    // No saved data or mismatch: ensure locked cells are filled
    setUserAnswers(emptyGrid());
  }, [storageKey, rows, cols, clues, bounds, grid, emptyGrid]);

  // Save on change
  useEffect(() => {
    if (rows === 0) return;
    try { localStorage.setItem(storageKey, JSON.stringify(userAnswers)); } catch {}
  }, [userAnswers, storageKey, rows]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 200);
    return () => clearInterval(id);
  }, [phase]);

  // Auto-select first clue
  useEffect(() => {
    if (clues.length > 0 && !activeClue) {
      setActiveClue(clues[0]);
      const cells = clueCells(clues[0], bounds);
      if (cells.length > 0) setFocusCell(cells[0]);
    }
  }, [clues, bounds, activeClue]);

  // Check completion on every answer change
  useEffect(() => {
    if (rows === 0 || clues.length === 0) return;
    const completed = new Set<number>();
    for (const clue of clues) {
      const cells = clueCells(clue, bounds);
      let ok = true;
      for (const cell of cells) {
        if ((userAnswers[cell.row]?.[cell.col] || "").toUpperCase() !== (grid[cell.row]?.[cell.col]?.answer || "")) {
          ok = false;
          break;
        }
      }
      if (ok) completed.add(clue.number);
    }
    setCompletedClues(completed);
    if (completed.size === clues.length) {
      try { localStorage.removeItem(storageKey); } catch {}
      setFinalTimeMs(Date.now() - startTimeRef.current);
      setPhase("finished");
    }
  }, [userAnswers, clues, bounds, grid, rows, storageKey]);

  // ── Handlers ────────────────────────────────────────────

  const getNextCell = useCallback(
    (r: number, c: number, clue: TtsClue) => {
      const cells = clueCells(clue, bounds);
      const idx = cells.findIndex((x) => x.row === r && x.col === c);
      return idx >= 0 && idx < cells.length - 1 ? cells[idx + 1] : null;
    },
    [bounds]
  );

  const handleCellFocus = useCallback(
    (r: number, c: number) => {
      setFocusCell({ row: r, col: c });
      const containing = clues.filter((cl) => clueCells(cl, bounds).some((x) => x.row === r && x.col === c));
      if (containing.length === 0) return;
      const cur = activeClueRef.current;
      if (cur && containing.some((x) => x.number === cur.number)) return;
      const across = containing.find((x) => x.direction === "across");
      setActiveClue(across || containing[0]);
    },
    [clues, bounds]
  );

  const handleClueClick = useCallback(
    (clue: TtsClue) => {
      setActiveClue(clue);
      const cells = clueCells(clue, bounds);
      if (cells.length > 0) setFocusCell(cells[0]);
    },
    [bounds]
  );

  const handleReset = useCallback(() => {
    setUserAnswers(emptyGrid());
    setCompletedClues(new Set());
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    if (clues.length > 0) {
      setActiveClue(clues[0]);
      const cells = clueCells(clues[0], bounds);
      if (cells.length > 0) setFocusCell(cells[0]);
    }
  }, [emptyGrid, clues, bounds]);

  function findPrevNonLocked(r: number, c: number, clue: TtsClue): { row: number; col: number } | null {
    const cells = clueCells(clue, bounds);
    const idx = cells.findIndex((x) => x.row === r && x.col === c);
    for (let i = idx - 1; i >= 0; i--) {
      if (!lockedCells.has(`${cells[i].row},${cells[i].col}`)) {
        return cells[i];
      }
    }
    return null;
  }

  // ── Render ──────────────────────────────────────────────

  if (rows === 0) {
    return <p className="text-sm text-gray-400 italic">Belum ada clue TTS.</p>;
  }

  if (phase === "finished") {
    return (
      <ResultScreen
        totalClues={clues.length}
        completedClues={completedClues.size}
        finalTimeMs={finalTimeMs}
        onRestart={handleReset}
        onBack={() => router.push(`/omah-belajar/${courseId}/materi`)}
      />
    );
  }

  const activeCells = activeClue ? clueCells(activeClue, bounds) : [];

  const completedCellSet = new Set<string>();
  for (const clue of clues) {
    if (!completedClues.has(clue.number)) continue;
    for (const cell of clueCells(clue, bounds)) {
      completedCellSet.add(`${cell.row},${cell.col}`);
    }
  }

  const acrossClues = clues.filter((c) => c.direction === "across");
  const downClues = clues.filter((c) => c.direction === "down");

  return (
    <div className="space-y-4">
      {/* Timer & progress */}
      <div className="flex items-center justify-between bg-brand-100/50 rounded-xl px-4 py-2.5 border border-brand-200">
        <span className="text-xs text-brand-700/60 font-medium flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {formatTime(elapsedMs)}
        </span>
        <span className="text-xs text-brand-700/60 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 inline-block mr-1 text-emerald-500" />
          {completedClues.size}/{clues.length} terjawab
        </span>
      </div>

      {/* Grid + Clues */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* ─── Grid ─── */}
        <div className="flex-shrink-0 flex flex-col items-center w-full lg:w-auto">
          <div className="w-full max-w-full overflow-x-auto pb-2 scrollbar-thin" style={{ WebkitOverflowScrolling: "touch" }}>
            <div
              className="inline-grid gap-[2px] bg-slate-900 rounded-md p-[2px] shadow-lg"
              style={{ gridTemplateColumns: `repeat(${cols}, 32px)` }}
            >
              {Array.from({ length: rows }, (_, ri) =>
                Array.from({ length: cols }, (_, ci) => {
                  const cell = grid[ri]?.[ci];
                  if (!cell || !cell.active) {
                    return <div key={`${ri}-${ci}`} className="w-8 h-8 bg-slate-900" />;
                  }
                  const isFocused = focusCell?.row === ri && focusCell?.col === ci;
                  const isInActive = activeCells.some((ac) => ac.row === ri && ac.col === ci);
                  const userChar = userAnswers[ri]?.[ci] || "";
                  const isLocked = lockedCells.has(`${ri},${ci}`);
                  const inCompletedClue = completedCellSet.has(`${ri},${ci}`);

                  let bg = "bg-white";
                  let border = "border border-slate-300";
                  let ring = "";
                  let text = "text-brand-900";

                  if (isLocked) {
                    bg = "bg-amber-100";
                    border = "border border-amber-300";
                    text = "text-amber-800";
                  } else if (isFocused) {
                    bg = "bg-amber-200";
                    border = "border border-amber-400";
                    ring = "ring-2 ring-amber-400/60";
                  } else if (inCompletedClue) {
                    bg = "bg-emerald-100";
                    border = "border border-emerald-300";
                    text = "text-emerald-700";
                  } else if (isInActive) {
                    bg = "bg-brand-100/60";
                  }

                  return (
                    <div key={`${ri}-${ci}`} className="relative" style={{ width: 32, height: 32 }}>
                      <input
                        ref={(el) => {
                          if (!inputRefs.current[ri]) inputRefs.current[ri] = [];
                          inputRefs.current[ri][ci] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={userChar}
                        readOnly={isLocked}
                        onChange={(e) => {
                          if (!activeClue) return;
                          const char = e.target.value.slice(-1).toUpperCase();
                          setUserAnswers((prev) => {
                            const next = prev.map((r) => [...r]);
                            next[ri][ci] = char;
                            return next;
                          });
                          if (char) {
                            const next = getNextCell(ri, ci, activeClue);
                            if (next) setFocusCell(next);
                          } else {
                            // Go back to immediate previous cell (even locked, matching static TTS)
                            const cells = clueCells(activeClue, bounds);
                            const idx = cells.findIndex((x) => x.row === ri && x.col === ci);
                            if (idx > 0) setFocusCell(cells[idx - 1]);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!activeClue) return;
                          if (e.key === "Backspace") {
                            if (!userAnswers[ri]?.[ci]) {
                              // Empty cell: go back, clear previous non-locked cell
                              const prev = findPrevNonLocked(ri, ci, activeClue);
                              if (prev) {
                                setUserAnswers((prevAnswers) => {
                                  const next = prevAnswers.map((r) => [...r]);
                                  next[prev.row][prev.col] = "";
                                  return next;
                                });
                                setFocusCell(prev);
                              }
                            }
                            return;
                          }
                          if (e.key.startsWith("Arrow")) {
                            e.preventDefault();
                            let tr = ri, tc = ci;
                            if (e.key === "ArrowUp") tr = Math.max(0, ri - 1);
                            else if (e.key === "ArrowDown") tr = Math.min(rows - 1, ri + 1);
                            else if (e.key === "ArrowLeft") tc = Math.max(0, ci - 1);
                            else if (e.key === "ArrowRight") tc = Math.min(cols - 1, ci + 1);
                            if ((tr !== ri || tc !== ci) && grid[tr]?.[tc]?.active) {
                              setFocusCell({ row: tr, col: tc });
                            }
                            return;
                          }
                        }}
                        onFocus={() => handleCellFocus(ri, ci)}
                        className={`w-full h-full text-center font-bold text-xs uppercase outline-none transition-colors duration-100 ${bg} ${border} ${ring} ${text}`}
                        autoComplete="off"
                        spellCheck={false}
                      />
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

        {/* ─── Clues ─── */}
        <div className="flex-1 min-w-0 space-y-4">
          {activeClue && (
            <div className="bg-white rounded-xl border border-brand-100 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-900 text-white text-xs font-bold shrink-0 mt-0.5">
                  {activeClue.number}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700/60">
                    {activeClue.direction === "across" ? "Mendatar" : "Menurun"}
                  </span>
                  <p className="text-sm font-semibold text-brand-900 mt-0.5 leading-relaxed">{activeClue.question}</p>
                  <p className="text-xs text-brand-700/50 mt-0.5">{activeClue.answer.length} huruf</p>
                  {activeClue.explanation && <p className="text-xs text-gray-400 mt-1">{activeClue.explanation}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-700/80 mb-2">Mendatar</h3>
              <div className="space-y-0.5">
                {acrossClues.map((cl) => {
                  const done = completedClues.has(cl.number);
                  const act = activeClue?.number === cl.number;
                  return (
                    <button key={cl.number} onClick={() => handleClueClick(cl)}
                      className={`w-full text-left flex items-start gap-2 p-2 rounded-lg transition-all duration-150 ${
                        act ? "bg-amber-100 ring-1 ring-amber-400" : done ? "bg-emerald-50" : "hover:bg-brand-100/30"
                      }`}
                    >
                      <span className={`text-xs font-bold w-5 shrink-0 mt-0.5 ${done ? "text-emerald-600" : act ? "text-amber-700" : "text-brand-700/50"}`}>
                        {cl.number}.
                      </span>
                      <span className={`text-xs leading-relaxed flex-1 ${done ? "text-emerald-700 line-through decoration-emerald-300" : act ? "text-brand-900 font-semibold" : "text-brand-700/70"}`}>
                        {cl.question}
                      </span>
                      {done && <span className="text-emerald-500 text-xs shrink-0 mt-0.5">✓</span>}
                    </button>
                  );
                })}
                {acrossClues.length === 0 && <p className="text-xs text-gray-400 italic">Tidak ada clue mendatar.</p>}
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-700/80 mb-2">Menurun</h3>
              <div className="space-y-0.5">
                {downClues.map((cl) => {
                  const done = completedClues.has(cl.number);
                  const act = activeClue?.number === cl.number;
                  return (
                    <button key={cl.number} onClick={() => handleClueClick(cl)}
                      className={`w-full text-left flex items-start gap-2 p-2 rounded-lg transition-all duration-150 ${
                        act ? "bg-amber-100 ring-1 ring-amber-400" : done ? "bg-emerald-50" : "hover:bg-brand-100/30"
                      }`}
                    >
                      <span className={`text-xs font-bold w-5 shrink-0 mt-0.5 ${done ? "text-emerald-600" : act ? "text-amber-700" : "text-brand-700/50"}`}>
                        {cl.number}.
                      </span>
                      <span className={`text-xs leading-relaxed flex-1 ${done ? "text-emerald-700 line-through decoration-emerald-300" : act ? "text-brand-900 font-semibold" : "text-brand-700/70"}`}>
                        {cl.question}
                      </span>
                      {done && <span className="text-emerald-500 text-xs shrink-0 mt-0.5">✓</span>}
                    </button>
                  );
                })}
                {downClues.length === 0 && <p className="text-xs text-gray-400 italic">Tidak ada clue menurun.</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={handleReset}
              className="text-xs text-brand-700/50 hover:text-brand-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-100/30"
            >Reset Jawaban</button>
            <button onClick={() => {
              setFinalTimeMs(Date.now() - startTimeRef.current);
              setPhase("finished");
            }}
              className="px-5 py-2 rounded-xl font-bold text-xs text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
              style={{ background: "linear-gradient(135deg, #7C78A8, #4A4763)" }}
            >
              <span className="flex items-center gap-1.5">Selesai <ChevronRight className="w-3 h-3" /></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Result screen ─────────────────────────────────────────

function ResultScreen({
  totalClues, completedClues, finalTimeMs, onRestart, onBack,
}: {
  totalClues: number; completedClues: number; finalTimeMs: number; onRestart: () => void; onBack: () => void;
}) {
  const [animScore, setAnimScore] = useState(0);
  const [showItems, setShowItems] = useState(false);
  const pct = totalClues > 0 ? Math.round((completedClues / totalClues) * 100) : 0;
  const allDone = completedClues === totalClues;

  useEffect(() => {
    const t1 = setTimeout(() => {
      let n = 0;
      const step = Math.max(1, Math.floor(completedClues / 25));
      const id = setInterval(() => {
        n = Math.min(n + step, completedClues);
        setAnimScore(Math.round(n));
        if (n >= completedClues) clearInterval(id);
      }, 35);
    }, 300);
    const t2 = setTimeout(() => setShowItems(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [completedClues]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl w-full" style={{ animation: "fade-in 0.4s ease-out" }}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center relative mb-4">
            <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(124,120,168,0.15)" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#7C78A8" strokeWidth="6" strokeLinecap="round"
                style={{ strokeDasharray: 283, strokeDashoffset: 283 - (completedClues / totalClues) * 283, transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl">{allDone ? "🎉" : pct >= 60 ? "👍" : "💪"}</span>
              <span className="font-bold text-3xl text-brand-900 leading-none">{animScore}</span>
              <span className="text-brand-700/60 text-xs">dari {totalClues}</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-brand-900 mb-1">{allDone ? "Lengkap!" : pct >= 60 ? "Bagus!" : "Terus belajar!"}</h2>
          <p className="text-sm text-brand-700/60">{allDone ? "Semua soal telah dijawab dengan benar!" : `${completedClues} dari ${totalClues} soal benar`}</p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-brand-100 border border-brand-200">
            <span className="font-bold text-brand-700 text-lg">{pct}%</span>
            <span className="text-brand-700/60 text-sm">persentase benar</span>
          </div>
          {finalTimeMs > 0 && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-full bg-brand-100 border border-brand-200">
              <Clock className="w-3.5 h-3.5 text-brand-700/60" />
              <span className="text-brand-700/60 text-sm">Waktu pengerjaan:</span>
              <span className="font-bold text-brand-700 text-sm">{formatTime(finalTimeMs)}</span>
            </div>
          )}
        </div>
        <div style={{ opacity: showItems ? 1 : 0, transform: showItems ? "translateY(0)" : "translateY(20px)", transition: "all 0.5s ease" }}>
          <button onClick={onRestart}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-md"
            style={{ background: "linear-gradient(135deg, #7C78A8, #4A4763)" }}
          ><span className="flex items-center justify-center gap-2">🔄 Ulangi</span></button>
          <button onClick={onBack}
            className="w-full py-2.5 mt-2 rounded-xl text-sm font-medium text-brand-700/70 hover:text-brand-900 hover:bg-brand-100/50 transition-colors"
          >Kembali ke Materi</button>
        </div>
      </div>
    </div>
  );
}
