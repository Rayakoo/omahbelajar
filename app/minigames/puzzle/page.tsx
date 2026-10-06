"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Clock, GripHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { PUZZLES, type PuzzleData } from "@/data/puzzleData";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";
import PlayerNamePrompt from "@/components/PlayerNamePrompt";
import { usePlayerName } from "@/contexts/PlayerNameContext";
import { saveMinigameResult } from "@/services/minigames";

type GamePhase = "welcome" | "playing" | "finished";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function PuzzlePage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.puzzle : en.puzzle;
  const common = locale === "id" ? id.common : en.common;
  const min = locale === "id" ? id.minigames : en.minigames;
  const { playerName } = usePlayerName();

  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [phase, setPhase] = useState<GamePhase>("welcome");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownKey, setCountdownKey] = useState(0);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [placedPieces, setPlacedPieces] = useState<(number | null)[]>([null, null, null, null, null]);
  const [remainingPieces, setRemainingPieces] = useState<number[]>([]);
  const [completedPuzzle, setCompletedPuzzle] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showFact, setShowFact] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalTimeMs, setFinalTimeMs] = useState(0);
  const [draggingPiece, setDraggingPiece] = useState<number | null>(null);
  const [allPuzzleTimes, setAllPuzzleTimes] = useState<number[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const puzzleStartRef = useRef<number | null>(null);

  const currentPuzzle = PUZZLES[currentPuzzleIndex];
  const totalPuzzles = PUZZLES.length;

  const initPuzzle = useCallback((puzzle: PuzzleData) => {
    setPlacedPieces(new Array(puzzle.pieces.length).fill(null));
    const indices = puzzle.pieces.map((_, i) => i);
    const shuffled = shuffleArray(indices);
    setRemainingPieces(shuffled);
    setCompletedPuzzle(false);
    setShowFact(false);
  }, []);

  const handleStart = useCallback(() => {
    setShowNamePrompt(true);
  }, []);

  const handleNameConfirm = useCallback(() => {
    setShowNamePrompt(false);
    setCountdown(3);
    setCountdownKey((k) => k + 1);
  }, []);

  const handlePieceDragStart = useCallback((pieceIndex: number) => {
    setDraggingPiece(pieceIndex);
  }, []);

  const handlePieceDragEnd = useCallback(() => {
    setDraggingPiece(null);
  }, []);

  const handleSlotDrop = useCallback(
    (slotIndex: number) => {
      if (draggingPiece === null) return;
      if (placedPieces[slotIndex] !== null) return;

      const newPlaced = [...placedPieces];
      newPlaced[slotIndex] = draggingPiece;
      setPlacedPieces(newPlaced);

      const newRemaining = remainingPieces.filter((p) => p !== draggingPiece);
      setRemainingPieces(newRemaining);
      setDraggingPiece(null);

      const allCorrect = currentPuzzle.correctOrder.every((correctIdx, i) => newPlaced[i] === correctIdx);
      if (allCorrect || newRemaining.length === 0) {
        setCompletedPuzzle(true);
        if (puzzleStartRef.current !== null) {
          const puzzleTime = Date.now() - puzzleStartRef.current;
          setAllPuzzleTimes((prev) => [...prev, puzzleTime]);
        }
        setTimeout(() => {
          setShowCompletion(true);
          setTimeout(() => setShowFact(true), 600);
        }, 400);
      }
    },
    [draggingPiece, placedPieces, remainingPieces, currentPuzzle]
  );

  const handleRemoveFromSlot = useCallback(
    (slotIndex: number) => {
      if (completedPuzzle) return;
      const piece = placedPieces[slotIndex];
      if (piece === null) return;

      const newPlaced = [...placedPieces];
      newPlaced[slotIndex] = null;
      setPlacedPieces(newPlaced);
      setRemainingPieces((prev) => [...prev, piece]);
    },
    [placedPieces, completedPuzzle]
  );

  const handleNextPuzzle = useCallback(() => {
    setShowCompletion(false);
    if (currentPuzzleIndex >= totalPuzzles - 1) {
      const timeMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      if (startTimeRef.current !== null) {
        setFinalTimeMs(timeMs);
      }
      const totalCompleted = allPuzzleTimes.length + 1;
      saveMinigameResult({
        player_name: playerName || "Unknown",
        minigame: "puzzle",
        score: totalCompleted,
        total: totalPuzzles,
        time_ms: timeMs,
        wrong: totalPuzzles - totalCompleted,
      });
      setPhase("finished");
      return;
    }
    const next = currentPuzzleIndex + 1;
    setCurrentPuzzleIndex(next);
    initPuzzle(PUZZLES[next]);
    puzzleStartRef.current = Date.now();
  }, [currentPuzzleIndex, totalPuzzles, initPuzzle, playerName, allPuzzleTimes]);

  const handleSkip = useCallback(() => {
    handleNextPuzzle();
  }, [handleNextPuzzle]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown < 0) {
      setCountdown(null);
      setPhase("playing");
      setCurrentPuzzleIndex(0);
      initPuzzle(PUZZLES[0]);
      startTimeRef.current = Date.now();
      puzzleStartRef.current = Date.now();
      setElapsedMs(0);
      setFinalTimeMs(0);
      setAllPuzzleTimes([]);
      return;
    }
    const tm = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 800);
    return () => clearTimeout(tm);
  }, [countdown, initPuzzle]);

  useEffect(() => {
    if (phase !== "playing" || startTimeRef.current === null) return;
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current!);
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  if (showNamePrompt) {
    return <PlayerNamePrompt onStart={handleNameConfirm} />;
  }

  if (countdown !== null) {
    return <CountdownOverlay value={countdown} key={countdownKey} />;
  }

  if (phase === "welcome") {
    return <WelcomeScreen onStart={handleStart} onBack={() => router.back()} />;
  }

  if (phase === "finished") {
    const totalPlaced = allPuzzleTimes.length;
    const allComplete = totalPlaced === totalPuzzles;
    return (
      <ResultScreen
        totalPuzzles={totalPuzzles}
        completedCount={totalPlaced}
        finalTimeMs={finalTimeMs}
        allComplete={allComplete}
        onRestart={() => { router.refresh(); }}
        onBack={() => router.push("/minigames")}
      />
    );
  }

  const slotCount = currentPuzzle.pieces.length;

  return (
    <div className="min-h-screen bg-[#FFF6EA] font-sans antialiased text-[#3B387E] flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#DCD5FE]/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#FED777]/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-[#DCD5FE]/20 blur-3xl" />
      </div>

      <div className="bg-white border-b-2 border-[#3B387E] relative z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push("/minigames")}
              className="flex items-center gap-1 text-sm text-[#3B387E] hover:text-[#3B387E] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {common.back}
            </button>
            <span className="text-xs text-[#3B387E]/60 font-medium">
              {t.soal} {currentPuzzleIndex + 1} / {totalPuzzles}
            </span>
          </div>

          <div className="h-2 bg-[#DCD5FE] border border-[#3B387E]/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out bg-[#3B387E]"
              style={{
                width: `${((currentPuzzleIndex + 1) / totalPuzzles) * 100}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#83F3BA] border-2 border-[#3B387E] text-[#3B387E]"
            >
              {currentPuzzle.category}
            </span>
            <span className="text-xs text-[#3B387E]/60 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(elapsedMs)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-lg mx-auto">
          {!showCompletion ? (
            <>
              <p className="text-center text-sm text-[#3B387E]/60 mb-6">
                {locale === "id"
                  ? "Seret potongan kata ke slot yang tepat untuk menyusun kalimat yang benar"
                  : "Drag word pieces to the correct slots to form the correct sentence"}
              </p>

              {/* Drop target slots */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {Array.from({ length: slotCount }, (_, i) => {
                  const placedPiece = placedPieces[i];
                  const isCorrect = placedPiece !== null && currentPuzzle.correctOrder[i] === placedPiece;
                  return (
                    <DropSlot
                      key={i}
                      index={i}
                      pieceText={placedPiece !== null ? currentPuzzle.pieces[placedPiece] : null}
                      isCorrect={isCorrect}
                      isLocked={completedPuzzle}
                      onDrop={() => handleSlotDrop(i)}
                      onRemove={() => handleRemoveFromSlot(i)}
                    />
                  );
                })}
              </div>

              {/* Draggable pieces */}
              <div className="flex flex-wrap justify-center gap-3">
                {remainingPieces.map((pieceIdx) => (
                  <DraggablePiece
                    key={pieceIdx}
                    pieceIndex={pieceIdx}
                    text={currentPuzzle.pieces[pieceIdx]}
                    onDragStart={() => handlePieceDragStart(pieceIdx)}
                    onDragEnd={handlePieceDragEnd}
                  />
                ))}
              </div>

              {remainingPieces.length === 0 && !completedPuzzle && (
                <button
                  onClick={() => {
                    setCompletedPuzzle(true);
                    const startTime = puzzleStartRef.current;
                    if (startTime !== null) {
                      setAllPuzzleTimes((prev) => [...prev, Date.now() - startTime]);
                    }
                    setTimeout(() => setShowCompletion(true), 300);
                  }}
                  className="mt-8 w-full py-4 rounded-full font-bold text-sm text-white bg-[#3B387E] hover:bg-[#2e2a66] transition-colors shadow-sm"
                >
                  <span>{t.selesai}</span>
                </button>
              )}
            </>
          ) : (
            /* Completion overlay */
            <div
              className="bg-white rounded-[28px] border-2 border-[#3B387E] shadow-sm p-6 md:p-8 text-center"
              style={{ animation: "fade-in 0.4s ease-out" }}
            >
              <div className="text-4xl mb-3">{completedPuzzle ? "🎉" : "💪"}</div>
              <h3 className="text-xl font-black font-poppins text-[#3B387E] mb-2">
                {completedPuzzle
                  ? locale === "id" ? "Puzzle Terselesaikan!" : "Puzzle Completed!"
                  : locale === "id" ? "Semua Potongan Terpasang" : "All Pieces Placed"}
              </h3>
              <p className="text-sm text-[#3B387E]/60 mb-4">
                {currentPuzzleIndex + 1} / {totalPuzzles} {locale === "id" ? "puzzle selesai" : "puzzles done"}
              </p>

              {/* Fact display */}
              <div
                style={{
                  maxHeight: showFact ? "300px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.5s ease",
                  marginBottom: showFact ? "1rem" : "0",
                }}
              >
                <div
                  className="bg-[#FFE577]/40 rounded-2xl p-4 border-2 border-[#3B387E] text-left"
                  style={{
                    opacity: showFact ? 1 : 0,
                    transform: showFact ? "translateY(0)" : "translateY(10px)",
                    transition: "all 0.4s ease 0.1s",
                  }}
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-[#3B387E] mb-2">
                    💡 {t.faktanya}
                  </div>
                  <p className="text-sm text-[#3B387E] leading-relaxed">
                    {locale === "id" ? currentPuzzle.fact : currentPuzzle.factEn}
                  </p>
                </div>
              </div>

              <button
                onClick={handleNextPuzzle}
                className="w-full py-3 rounded-full font-bold text-sm text-white bg-[#3B387E] hover:bg-[#2e2a66] transition-colors shadow-sm"
                style={{
                  opacity: showFact ? 1 : 0.5,
                }}
                disabled={!showFact}
              >
                <span className="flex items-center justify-center gap-2">
                  {currentPuzzleIndex === totalPuzzles - 1 ? "🏆 " + t.lihatHasil : t.lanjutkan + " →"}
                </span>
              </button>

              <button
                onClick={handleSkip}
                className="w-full py-2 mt-2 rounded-full text-sm font-bold text-[#3B387E]/50 hover:text-[#3B387E] hover:bg-[#DCD5FE]/50 transition-colors"
              >
                {currentPuzzleIndex === totalPuzzles - 1
                  ? locale === "id" ? "Lewati ke hasil" : "Skip to results"
                  : locale === "id" ? "Lewati" : "Skip"}
              </button>
            </div>
          )}
        </div>
      </div>

      {showCompletion && <Confetti />}
    </div>
  );
}

function DropSlot({
  index,
  pieceText,
  isCorrect,
  isLocked,
  onDrop,
  onRemove,
}: {
  index: number;
  pieceText: string | null;
  isCorrect: boolean;
  isLocked: boolean;
  onDrop: () => void;
  onRemove: () => void;
}) {
  const [isOver, setIsOver] = useState(false);

  let bg = "bg-white border-dashed border-2 border-[#3B387E]";
  let textColor = "text-[#3B387E]/40";
  if (pieceText !== null) {
    if (isLocked) {
      bg = isCorrect
        ? "bg-[#83F3BA] border-2 border-[#3B387E]"
        : "bg-[#FED777] border-2 border-[#3B387E]";
      textColor = "text-[#3B387E]";
    } else {
      bg = "bg-[#DCD5FE] border-2 border-[#3B387E]";
      textColor = "text-[#3B387E]";
    }
  }
  if (isOver && !pieceText) {
    bg = "bg-[#DCD5FE] border-2 border-[#3B387E] border-dashed";
  }

  return (
    <div
      className={`relative rounded-2xl border-2 px-4 py-3 min-w-[80px] min-h-[44px] flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer select-none ${bg} ${textColor}`}
      style={{ boxShadow: pieceText ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        onDrop();
      }}
      onClick={() => {
        if (pieceText && !isLocked) onRemove();
      }}
    >
      {pieceText ? (
        <span>{pieceText}</span>
      ) : (
        <span className="text-xs">
          {index + 1}
        </span>
      )}
      {isLocked && isCorrect && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#3B387E] text-white flex items-center justify-center text-[10px] font-bold">
          ✓
        </span>
      )}
    </div>
  );
}

function DraggablePiece({
  pieceIndex,
  text,
  onDragStart,
  onDragEnd,
}: {
  pieceIndex: number;
  text: string;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        onDragStart();
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      className="relative rounded-2xl px-4 py-3 bg-[#FED777] border-2 border-[#3B387E] text-sm font-bold text-[#3B387E] cursor-grab active:cursor-grabbing select-none transition-all duration-200 hover:bg-[#FFE577] hover:shadow-md hover:-translate-y-0.5"
      style={{
        opacity: isDragging ? 0.5 : 1,
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
      }}
    >
      <GripHorizontal className="w-3.5 h-3.5 text-[#3B387E] absolute top-1.5 left-1/2 -translate-x-1/2" />
      <span className="mt-2 block">{text}</span>
    </div>
  );
}

function CountdownOverlay({ value }: { value: number }) {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.puzzle : en.puzzle;
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
  const t = locale === "id" ? id.puzzle : en.puzzle;
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
            <span className="text-[#E0BA24]">Puzzle</span> <span className="text-black">Edukasi</span>
          </h1>

          {/* Deskripsi */}
          <p className="text-gray-700 text-xs md:text-sm font-medium max-w-lg mx-auto leading-relaxed">
            {t.desc}
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
                { icon: "🧩", label: `${PUZZLES.length} ${t.soal}`, sub: t.pieces },
                { icon: "👆", label: t.dragDrop, sub: t.seretSusun },
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
              <p className="text-xs md:text-sm font-medium text-[#B58210] leading-relaxed">{t.tooltip}</p>
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
  totalPuzzles,
  completedCount,
  finalTimeMs,
  allComplete,
  onRestart,
  onBack,
}: {
  totalPuzzles: number;
  completedCount: number;
  finalTimeMs: number;
  allComplete: boolean;
  onRestart: () => void;
  onBack: () => void;
}) {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.puzzle : en.puzzle;
  const common = locale === "id" ? id.common : en.common;
  const min = locale === "id" ? id.minigames : en.minigames;
  const [animScore, setAnimScore] = useState(0);
  const [showItems, setShowItems] = useState(false);

  const pct = totalPuzzles > 0 ? Math.round((completedCount / totalPuzzles) * 100) : 0;

  let message = { emoji: "💪", title: t.terusBelajar };
  if (allComplete) message = { emoji: "🎉", title: t.lengkap };
  else if (pct >= 60) message = { emoji: "👍", title: t.bagus };

  useEffect(() => {
    const t1 = setTimeout(() => {
      let n = 0;
      const step = Math.max(1, completedCount / 30);
      const interval = setInterval(() => {
        n = Math.min(n + step, completedCount);
        setAnimScore(Math.round(n));
        if (n >= completedCount) clearInterval(interval);
      }, 40);
    }, 300);
    const t2 = setTimeout(() => setShowItems(true), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [completedCount]);

  return (
    <div className="min-h-screen bg-[#FFF6EA] font-sans antialiased text-[#3B387E] flex flex-col relative overflow-hidden">
      <div className="bg-white border-b-2 border-[#3B387E] sticky top-16 z-30 relative">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-[#3B387E] hover:text-[#3B387E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {common.back} ke {min.badge}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-8 relative z-10">
        <div className="text-center mb-8" style={{ animation: "fade-in 0.6s ease-out" }}>
          <div className="inline-flex items-center justify-center relative mb-4">
            <svg width="140" height="140" viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#DCD5FE" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke="#3B387E" strokeWidth="6"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 283,
                  strokeDashoffset: 283 - (completedCount / totalPuzzles) * 283,
                  transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl">{message.emoji}</span>
              <span className="font-bold text-3xl text-[#3B387E] leading-none">{animScore}</span>
              <span className="text-[#3B387E]/60 text-xs">{t.dari} {totalPuzzles}</span>
            </div>
          </div>
          <h2 className="text-2xl font-black font-poppins text-[#3B387E] mb-1">{message.title}</h2>
          <p className="text-sm text-[#3B387E]/60">
            {allComplete
              ? t.semuaBenar
              : `${completedCount} ${t.dari} ${totalPuzzles} ${t.potonganTersusun}`}
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
