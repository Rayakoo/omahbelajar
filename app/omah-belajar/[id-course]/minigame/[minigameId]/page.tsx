"use client";

import { useState, useEffect, useRef, useMemo, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getMinigameById, getTtsClues, getFindWords, getTrueFalseItems, getDrawings, getFillBlanks, getMatchPairs, getFlashcards, getFlashcardBackImage, MINIGAME_TYPE_LABELS, type CourseMinigame, type TtsClue, type FindWord, type TrueFalseItem, type Drawing, type FillBlank, type MatchPairs, type MatchPairItem, type FlashcardCard } from "@/services/course-minigames";
import { useLanguage } from "@/contexts/LanguageContext";
import { transformImageUrl } from "@/lib/image";
import { buildRandomFillGrid } from "@/lib/grid-utils";
import TtsPlayer from "@/components/tts-player";

export default function CourseMinigamePage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const courseId = params["id-course"] as string;
  const minigameId = params.minigameId as string;

  const [mg, setMg] = useState<CourseMinigame | null>(null);
  const [loading, setLoading] = useState(true);

  // Data per type
  const [ttsClues, setTtsClues] = useState<TtsClue[]>([]);
  const [findWords, setFindWords] = useState<FindWord[]>([]);
  const [tfItems, setTfItems] = useState<TrueFalseItem[]>([]);
  const [tfUserAnswer, setTfUserAnswer] = useState<Record<number, boolean | null>>({});
  const [tfPopup, setTfPopup] = useState<{ index: number; correct: boolean; item: TrueFalseItem } | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [fillBlanks, setFillBlanks] = useState<FillBlank[]>([]);
  const [matchPairs, setMatchPairs] = useState<MatchPairs[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardCard[]>([]);
  const [fillBlankInputs, setFillBlankInputs] = useState<Record<string, string[]>>({});
  const [fwSel, setFwSel] = useState<{row: number; col: number} | null>(null);
  const [fwFound, setFwFound] = useState<Set<string>>(new Set());
  const [fwDone, setFwDone] = useState(false);
  const [fwWrong, setFwWrong] = useState<string | null>(null);

  useEffect(() => {
    if (!minigameId) return;
    Promise.all([
      getMinigameById(minigameId),
      getTtsClues(minigameId),
      getFindWords(minigameId),
      getTrueFalseItems(minigameId),
      getDrawings(minigameId),
      getFillBlanks(minigameId),
      getMatchPairs(minigameId),
      getFlashcards(minigameId),
    ])
      .then(([mgData, tts, fw, tf, dw, fb, mp, fc]) => {
        setMg(mgData);
        setTtsClues(tts);
        // Find word: load from settings.words first, fallback to table
        {
          const s = (mgData.settings || {}) as Record<string, unknown>;
          const settingsWords = s.words as any[] | undefined;
          if (settingsWords && settingsWords.length > 0) {
            setFindWords(settingsWords.map((w: any, i: number) => ({
              id: `sw_${i}`,
              minigame_id: minigameId,
              question: w.question || "",
              answer: w.answer || "",
              explanation: w.explanation || null,
              row: w.row ?? 0,
              col: w.col ?? 0,
              direction: (w.direction as "across" | "down") || "across",
            })));
          } else if (fw.length > 0) {
            setFindWords(fw.map((w) => ({ ...w, row: 0, col: 0, direction: "across" as const })));
          } else {
            setFindWords([]);
          }
        }
        const parsedTf = tf[0]?.items ? (typeof tf[0].items === "string" ? JSON.parse(tf[0].items) : tf[0].items) : [];
        setTfItems(parsedTf);
        setTfUserAnswer(Object.fromEntries(parsedTf.map((_: unknown, i: number) => [i, null])));
        setDrawings(dw);
        setFillBlanks(fb.map((item) => ({ ...item, answers: typeof item.answers === "string" ? JSON.parse(item.answers) : item.answers })));
        setMatchPairs(mp);
        setFlashcards(fc);
      })
      .catch(() => router.push(`/omah-belajar/${courseId}/materi`))
      .finally(() => setLoading(false));
  }, [minigameId, courseId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF6EA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B387E] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function DrawingCanvas({ drawings }: { drawings: Drawing[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#7C78A8");
  const [brushSize, setBrushSize] = useState(4);
  const [imageLoaded, setImageLoaded] = useState(false);

  function loadAndDrawImage() {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dw = drawings[0];
    const maxW = containerRef.current.clientWidth;
    const maxH = 520;

    if (!dw?.base_image_url) {
      canvas.width = maxW;
      canvas.height = 400;
      canvas.style.width = maxW + "px";
      canvas.style.height = "400px";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setImageLoaded(true);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const cw = Math.round(img.width * scale);
      const ch = Math.round(img.height * scale);
      canvas.width = cw;
      canvas.height = ch;
      canvas.style.width = cw + "px";
      canvas.style.height = ch + "px";
      ctx.drawImage(img, 0, 0, cw, ch);
      setImageLoaded(true);
    };
    img.onerror = () => {
      canvas.width = maxW;
      canvas.height = 400;
      canvas.style.width = maxW + "px";
      canvas.style.height = "400px";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setImageLoaded(true);
    };
    img.src = transformImageUrl(dw.base_image_url);
  }

  // Load on mount and when container resizes
  useEffect(() => {
    loadAndDrawImage();
    function resize() { loadAndDrawImage(); }
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawings]);

  function getPos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const pos = getPos(e);
    if (!pos || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    if (!pos || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function stopDrawing() {
    setIsDrawing(false);
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
  }

  function clearCanvas() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const dw = drawings[0];
    if (dw?.base_image_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
      img.src = transformImageUrl(dw.base_image_url);
    }
  }

  if (drawings.length === 0) return <p className="text-sm text-gray-400 italic">Belum ada gambar.</p>;

  return (
    <div className="space-y-6">
      {drawings.map((dw, i) => (
        <div key={dw.id || i} className="bg-white border-2 border-[#3B387E] rounded-[28px] p-5 md:p-6 shadow-sm">
          <p className="text-base md:text-lg font-extrabold font-poppins text-[#3B387E] mb-4">{dw.question}</p>
          <div ref={containerRef} className="w-full flex justify-center">
              <canvas
              ref={canvasRef}
              className="rounded-2xl border-2 border-[#3B387E] bg-white touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          {imageLoaded && (
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#3B387E]/70 font-bold">Warna:</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-2 border-[#3B387E]" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#3B387E]/70 font-bold">Ukuran:</label>
                <input type="range" min={2} max={20} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20 accent-[#3B387E]" />
                <span className="text-xs text-[#3B387E]/60 w-4">{brushSize}</span>
              </div>
              <button onClick={clearCanvas}
                className="text-xs text-white font-semibold bg-red-500 hover:bg-red-600 transition-colors px-3 py-1.5 rounded-lg shadow-sm"
              >Hapus Gambar</button>
              <button onClick={() => alert("Gambar telah disimpan!")}
                className="ml-auto px-5 py-2.5 rounded-full font-bold text-xs text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md bg-[#3B387E] hover:bg-[#2e2a66]"
              >Selesai</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InteractiveMatchPairs({ mp }: { mp: MatchPairs }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const pairsByCode = useMemo(() => {
    const groups = new Map<string, MatchPairItem[]>();
    for (const item of mp.items) {
      const g = groups.get(item.pair_code) || [];
      g.push(item);
      groups.set(item.pair_code, g);
    }
    return groups;
  }, [mp.items]);

  const leftItems = useMemo(() =>
    Array.from(pairsByCode.values()).map((g) => g[0]),
    [pairsByCode]
  );

  const [rightItems] = useState<MatchPairItem[]>(() => {
    const arr = Array.from(pairsByCode.values()).map((g) => g[1]);
    const s = [...arr];
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
  });

  const [matchedCodes, setMatchedCodes] = useState<Set<string>>(new Set());
  const [wrongFlash, setWrongFlash] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [wrongLine, setWrongLine] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
  const [hoverRightIdx, setHoverRightIdx] = useState<number | null>(null);

  function getContainerPos(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function getRightEdge(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const cr = containerRef.current?.getBoundingClientRect();
    if (!cr) return { x: 0, y: 0 };
    return { x: r.right - cr.left, y: r.top + r.height / 2 - cr.top };
  }

  function getLeftEdge(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const cr = containerRef.current?.getBoundingClientRect();
    if (!cr) return { x: 0, y: 0 };
    return { x: r.left - cr.left, y: r.top + r.height / 2 - cr.top };
  }

  function startDrag(e: React.MouseEvent | React.TouchEvent, idx: number) {
    e.preventDefault();
    if (matchedCodes.has(leftItems[idx].pair_code)) return;
    const pos = "touches" in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
    setDragIdx(idx);
    const cp = getContainerPos(pos.x, pos.y);
    setDragPos(cp);
  }

  useEffect(() => {
    if (dragIdx === null) return;

    function move(e: MouseEvent | TouchEvent) {
      const pos = "touches" in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
      setDragPos(getContainerPos(pos.x, pos.y));
      let found = -1;
      for (let i = 0; i < rightRefs.current.length; i++) {
        const r = rightRefs.current[i]?.getBoundingClientRect();
        if (r && pos.x >= r.left && pos.x <= r.right && pos.y >= r.top && pos.y <= r.bottom && !matchedCodes.has(rightItems[i].pair_code)) {
          found = i;
          break;
        }
      }
      setHoverRightIdx(found >= 0 ? found : null);
    }

    function up(e: MouseEvent | TouchEvent) {
      const pos = "changedTouches" in e
        ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
        : { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };

      const x = pos.x;
      const y = pos.y;

      let targetIdx = -1;
      for (let i = 0; i < rightRefs.current.length; i++) {
        const r = rightRefs.current[i]?.getBoundingClientRect();
        if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          targetIdx = i;
          break;
        }
      }

      if (targetIdx >= 0 && !matchedCodes.has(rightItems[targetIdx].pair_code)) {
        const lEl = leftRefs.current[dragIdx!];
        const rEl = rightRefs.current[targetIdx];
        if (lEl && rEl) {
          const from = getRightEdge(lEl);
          const to = getLeftEdge(rEl);
          if (leftItems[dragIdx!].pair_code === rightItems[targetIdx].pair_code) {
            const next = new Set(matchedCodes);
            next.add(leftItems[dragIdx!].pair_code);
            setMatchedCodes(next);
          } else {
            setWrongLine({ from, to });
            setTimeout(() => setWrongLine(null), 600);
          }
        }
      }

      setDragIdx(null);
      setDragPos(null);
      setHoverRightIdx(null);
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
      setHoverRightIdx(null);
    };
  }, [dragIdx, leftItems, rightItems, matchedCodes]);

  const allMatched = matchedCodes.size === leftItems.length && leftItems.length > 0;

  function cardContent(item: MatchPairItem) {
    const hasImage = !!item.image_url;
    const hasTitle = !!item.card_title;
    if (hasImage && !hasTitle) {
      return (
        <div className="flex items-center justify-center h-full p-1">
          <img src={transformImageUrl(item.image_url!)} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
        </div>
      );
    }
    if (!hasImage && hasTitle) {
      return (
        <div className="flex items-center justify-center h-full p-1">
          <p className="text-base md:text-lg font-bold text-center leading-tight">{item.card_title}</p>
        </div>
      );
    }
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 p-1">
        <img src={transformImageUrl(item.image_url!)} alt="" className="h-16 w-full object-contain rounded-lg" />
        <p className="text-xs md:text-sm font-bold text-center leading-tight">{item.card_title}</p>
      </div>
    );
  }

  function cellCls(item: MatchPairItem, side: "l" | "r", idx: number) {
    const matched = matchedCodes.has(item.pair_code);
    if (matched) return "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300 text-black";
    if (side === "r" && hoverRightIdx === idx) return "border-[#3B387E] bg-[#FED777]/50 ring-2 ring-[#FED777] scale-[1.03] text-[#3B387E]";
    return "border-[#3B387E] bg-white hover:border-[#3B387E] hover:bg-[#FFF6EA] text-[#3B387E]";
  }

  return (
    <div className="bg-[#FFF6EA] border-2 border-[#3B387E] rounded-3xl p-4 shadow-sm">
      <p className="text-sm font-extrabold font-poppins text-[#3B387E] mb-4">{mp.question}</p>
      <div ref={containerRef} className="relative">
        {/* SVG overlay for lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ overflow: "visible" }}
        >
          {/* matched lines */}
          {Array.from(matchedCodes).map((code) => {
            const lIdx = leftItems.findIndex((it) => it.pair_code === code);
            if (lIdx < 0) return null;
            const rIdx = rightItems.findIndex((it) => it.pair_code === code);
            if (rIdx < 0) return null;
            const lEl = leftRefs.current[lIdx];
            const rEl = rightRefs.current[rIdx];
            if (!lEl || !rEl) return null;
            const from = getRightEdge(lEl);
            const to = getLeftEdge(rEl);
            return (
              <line key={code} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="#34d399" strokeWidth={3} strokeLinecap="round" />
            );
          })}
          {/* wrong flash line */}
          {wrongLine && (
            <line x1={wrongLine.from.x} y1={wrongLine.from.y} x2={wrongLine.to.x} y2={wrongLine.to.y}
              stroke="#ef4444" strokeWidth={3} strokeLinecap="round" />
          )}
          {/* active drag line */}
          {dragIdx !== null && dragPos && (() => {
            const el = leftRefs.current[dragIdx];
            if (!el) return null;
            const from = getRightEdge(el);
            return (
                <line x1={from.x} y1={from.y} x2={dragPos.x} y2={dragPos.y}
                stroke="#3B387E" strokeWidth={2} strokeLinecap="round" strokeDasharray="6 3" />
            );
          })()}
        </svg>

        <div className="flex gap-32 md:gap-48 lg:gap-64">
          <div className="flex-1 flex flex-col gap-3">
            {leftItems.map((item, idx) => (
              <div key={`l_${item.id || idx}`} className="relative flex items-center">
                <button
                  ref={(el) => { leftRefs.current[idx] = el; }}
                  className={`flex-1 rounded-2xl border-2 text-left transition-all duration-200 h-28 md:h-32 pr-3 ${cellCls(item, "l", idx)}`}
                >
                  {cardContent(item)}
                </button>
                {/* draggable circle handle */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-6 h-6 rounded-full bg-[#3B387E] border-2 border-white shadow-md cursor-grab active:cursor-grabbing touch-none"
                  onMouseDown={(e) => startDrag(e, idx)}
                  onTouchStart={(e) => startDrag(e, idx)}
                />
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {rightItems.map((item, idx) => (
              <button
                key={`r_${item.id || idx}`}
                ref={(el) => { rightRefs.current[idx] = el; }}
                className={`w-full rounded-2xl border-2 text-left transition-all duration-200 h-28 md:h-32 ${cellCls(item, "r", idx)}`}
              >
                {cardContent(item)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {allMatched && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-emerald-700">Semua pasangan berhasil ditemukan! ✓</p>
        </div>
      )}
    </div>
  );
}

  if (!mg) return null;

  return (
    <div className="min-h-screen bg-[#FFF6EA] text-[#3B387E] font-poppins font-sans">
      <nav className="bg-[#DCD5FE] border-b-2 border-[#3B387E] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
        <Link
          href={`/omah-belajar/${courseId}/materi`}
          className="inline-flex items-center gap-1 bg-[#3B387E] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#2e2a66] transition-all active:scale-95 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali
        </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-white rounded-[28px] p-6 md:p-10 shadow-sm border-2 border-[#3B387E]">
          <h1 className="text-2xl md:text-3xl font-black font-poppins text-[#3B387E] mb-2">{mg.title}</h1>
          <p className="text-sm text-[#3B387E]/60 mb-8 font-bold">{MINIGAME_TYPE_LABELS[mg.type] || mg.type}</p>

          {mg.type === "tts" && (
            <TtsPlayer clues={ttsClues} minigameId={minigameId} courseId={courseId} />
          )}

          {mg.type === "find_the_word" && (
            <InteractiveFindWord
              settings={mg.settings || {}}
              findWords={findWords}
              fwSel={fwSel}
              setFwSel={setFwSel}
              fwFound={fwFound}
              setFwFound={setFwFound}
              fwDone={fwDone}
              setFwDone={setFwDone}
              fwWrong={fwWrong}
              setFwWrong={setFwWrong}
            />
          )}

          {mg.type === "true_or_false" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tfItems.map((item, i) => {
                  const userAns = tfUserAnswer[i];
                  const isAnswered = userAns !== null && userAns !== undefined;
                  const isCorrect = isAnswered && userAns === item.answer;
                  return (
                    <div key={i} className={`rounded-[28px] p-5 md:p-6 flex flex-col border-2 transition-all duration-200 ${
                      isAnswered
                        ? isCorrect
                          ? "bg-emerald-50 border-emerald-400 shadow-md"
                          : "bg-red-50 border-red-400 shadow-md"
                        : "bg-white border-[#3B387E] shadow-sm hover:shadow-md"
                    }`}>
                      {item.image_url && (
                        <img src={transformImageUrl(item.image_url)} alt="" className="w-full h-44 md:h-52 rounded-2xl object-contain bg-[#FFF6EA] border-2 border-[#3B387E] mb-4" />
                      )}
                      <p className="text-base md:text-lg font-extrabold font-poppins text-center text-[#3B387E] mb-4 leading-snug">{item.title}</p>
                      {!isAnswered ? (
                        <div className="flex items-center justify-center gap-3 mt-auto">
                          <button onClick={() => { setTfUserAnswer((p) => ({ ...p, [i]: true })); setTfPopup({ index: i, correct: true === item.answer, item }); }}
                            className="flex items-center gap-2 px-5 py-3 rounded-full text-sm md:text-base font-bold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-sm bg-emerald-500 hover:bg-emerald-600 border-2 border-[#3B387E]"
                          >
                            <CheckCircle2 className="w-5 h-5" /> Benar
                          </button>
                          <button onClick={() => { setTfUserAnswer((p) => ({ ...p, [i]: false })); setTfPopup({ index: i, correct: false === item.answer, item }); }}
                            className="flex items-center gap-2 px-5 py-3 rounded-full text-sm md:text-base font-bold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-sm bg-red-500 hover:bg-red-600 border-2 border-[#3B387E]"
                          >
                            <XCircle className="w-5 h-5" /> Salah
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center mt-auto gap-2">
                          <span className={`inline-flex items-center gap-2 text-base md:text-lg font-bold ${isCorrect ? "text-emerald-600" : "text-red-500"}`}>
                            {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                            {isCorrect ? "Benar!" : "Salah!"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {tfItems.length > 0 && Object.values(tfUserAnswer).every((v) => v !== null) && (
                <div className="bg-[#3B387E] text-white rounded-3xl p-5 text-center shadow-sm border-2 border-[#3B387E]">
                  <p className="text-base md:text-lg font-bold">
                    {Object.entries(tfUserAnswer).filter(([i, v]) => v === tfItems[Number(i)].answer).length} / {tfItems.length} benar
                  </p>
                </div>
              )}
            </div>
          )}

          {tfPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setTfPopup(null)}>
              <div className="bg-white rounded-[28px] border-2 border-[#3B387E] p-6 md:p-8 text-center max-w-md mx-4 shadow-sm w-full" style={{ animation: "fade-in 0.3s ease-out" }} onClick={(e) => e.stopPropagation()}>
                <div className="text-5xl mb-4">{tfPopup.correct ? "🎉" : "😅"}</div>
                <h2 className={`text-xl md:text-2xl font-bold mb-2 ${tfPopup.correct ? "text-emerald-600" : "text-red-500"}`}>
                  {tfPopup.correct ? "Benar!" : "Kurang Tepat"}
                </h2>
                <p className="text-sm text-[#3B387E]/70 mb-4 leading-relaxed">{tfPopup.item.title}</p>
                {tfPopup.item.explanation ? (
                  <div className="bg-[#FFF6EA] rounded-2xl p-4 text-left mb-5 border-2 border-[#FED777]">
                    <p className="text-xs font-bold text-[#3B387E]/60 uppercase tracking-wider mb-1">Penjelasan</p>
                    <p className="text-sm text-[#3B387E]/80 leading-relaxed">{tfPopup.item.explanation}</p>
                  </div>
                ) : (
                  <div className="mb-5" />
                )}
                <button onClick={() => setTfPopup(null)}
                  className="w-full py-3 rounded-full font-bold text-sm text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm bg-[#3B387E] hover:bg-[#2e2a66]"
                >
                  Lanjut
                </button>
              </div>
            </div>
          )}

          {mg.type === "drawing" && (
            <DrawingCanvas drawings={drawings} />
          )}

          {mg.type === "fill_the_blank" && (
            <div className="space-y-6">
              {fillBlanks.map((fb) => {
                const inputKey = fb.id;
                if (!fillBlankInputs[inputKey]) {
                  fillBlankInputs[inputKey] = fb.answers.map(() => "");
                }
                return (
                  <div key={fb.id} className="bg-white border-2 border-[#3B387E] rounded-[28px] p-5 md:p-6 shadow-sm">
                    <p className="text-sm font-extrabold font-poppins text-[#3B387E] mb-3">{fb.question}</p>
                    {fb.image_url && (
                      <img src={transformImageUrl(fb.image_url)} alt="" className="w-full max-w-md rounded-2xl border-2 border-[#3B387E] mb-4" />
                    )}
                    <div className="flex flex-wrap gap-3">
                      {fb.answers.map((_, ai) => (
                        <input
                          key={ai}
                          type="text"
                          value={(fillBlankInputs[inputKey] || [])[ai] || ""}
                          onChange={(e) => {
                            const copy = { ...fillBlankInputs };
                            if (!copy[inputKey]) copy[inputKey] = fb.answers.map(() => "");
                            copy[inputKey][ai] = e.target.value;
                            setFillBlankInputs(copy);
                          }}
                          placeholder={`Jawaban ${ai + 1}`}
                          className="flex-1 min-w-[100px] max-w-[160px] bg-[#FFF6EA] border-2 border-[#3B387E] rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:border-[#3B387E] focus:bg-white"
                        />
                      ))}
                    </div>
                    {fb.explanation && <p className="text-xs text-gray-400 mt-3">{fb.explanation}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {mg.type === "match_pairs" && (
            <div className="space-y-6">
              {matchPairs.map((mp, qi) => (
                <InteractiveMatchPairs key={mp.id || qi} mp={mp} />
              ))}
            </div>
          )}

          {mg.type === "flashcard" && (
            <FlashcardGame backImage={getFlashcardBackImage((mg.settings || {}) as Record<string, unknown>)} cards={flashcards} />
          )}
        </div>
      </main>
    </div>
  );
}

function FlashcardGame({ backImage, cards }: { backImage: string; cards: FlashcardCard[] }) {
  const [phase, setPhase] = useState<"shuffle" | "select" | "reveal" | "question" | "done">("shuffle");
  const [remaining, setRemaining] = useState<number[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(120);

  useEffect(() => {
    setRemaining(cards.map((_, i) => i));
  }, [cards]);

  useEffect(() => {
    if (phase !== "shuffle") return;
    const t = setTimeout(() => setPhase("select"), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "reveal") return;
    setSecondsLeft(120);
    const iv = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(iv);
  }, [phase, currentIdx]);

  useEffect(() => {
    if (phase === "reveal" && secondsLeft <= 0) {
      setPhase("question");
    }
  }, [phase, secondsLeft]);

  if (cards.length === 0) {
    return <p className="text-sm text-gray-400 italic">Belum ada kartu.</p>;
  }

  const current = currentIdx !== null ? cards[currentIdx] : null;
  const answeredCount = cards.length - remaining.length;
  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  function pickCard(i: number) {
    setCurrentIdx(i);
    setSelected(null);
    setPhase("reveal");
  }

  function choose(opt: string) {
    if (selected || !current) return;
    setSelected(opt);
    if (opt === current.correct_answer) setScore((s) => s + 1);
  }

  function nextRound() {
    if (currentIdx === null) return;
    const nextRemaining = remaining.filter((i) => i !== currentIdx);
    if (nextRemaining.length === 0) {
      setPhase("done");
      return;
    }
    setRemaining(nextRemaining);
    setCurrentIdx(null);
    setSelected(null);
    setPhase("shuffle");
  }

  function restart() {
    setRemaining(cards.map((_, i) => i));
    setCurrentIdx(null);
    setSelected(null);
    setScore(0);
    setPhase("shuffle");
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-extrabold font-poppins text-[#3B387E] mb-4">
        Kartu terjawab: {answeredCount} / {cards.length}
      </p>

      {/* 1) Animasi shuffle */}
      {phase === "shuffle" && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-48 h-60 md:w-56 md:h-68">
            {Array.from({ length: Math.min(remaining.length || 1, 6) }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-3xl border-2 border-[#3B387E] shadow-sm overflow-hidden will-change-transform"
                style={{
                  "--fc-rot": `${((i % 5) - 2) * 5}deg`,
                  "--fc-x": `${((i % 4) - 1.5) * 18}px`,
                  "--fc-raise": `${(i % 3) * 12}px`,
                  "--fc-delay": `${i * 0.11}s`,
                  animation: "fc-riffle 1.7s cubic-bezier(0.45, 0, 0.55, 1) var(--fc-delay) infinite alternate",
                } as CSSProperties}
              >
                {backImage ? (
                  <img src={transformImageUrl(backImage)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#3B387E] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">Kartu Flash</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-[#3B387E]/60 font-bold">Mengacak kartu...</p>
        </div>
      )}

      {/* 2) Pilih kartu */}
      {phase === "select" && (
        <div className="w-full max-w-3xl">
          <p className="text-center text-sm text-[#3B387E]/70 font-bold mb-6">Pilih satu kartu untuk dibuka</p>
          <div className="flex flex-wrap justify-center gap-4">
            {remaining.map((idx) => (
              <button
                key={idx}
                onClick={() => pickCard(idx)}
                className="w-28 h-36 md:w-32 md:h-40 rounded-2xl overflow-hidden border-2 border-[#3B387E] hover:border-[#3B387E] shadow-sm hover:scale-105 hover:shadow-lg transition-all relative bg-white"
              >
                {backImage ? (
                  <img src={transformImageUrl(backImage)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#3B387E] flex items-center justify-center">
                    <span className="text-white text-xl font-bold">?</span>
                  </div>
                )}
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  #{idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3) Kartu terpilih + timer 2 menit */}
      {phase === "reveal" && current && (
        <div className="w-full max-w-sm">
          <p className="text-center text-sm font-extrabold font-poppins text-[#3B387E] mb-3">Kartu Terpilih</p>
          <div className="rounded-[28px] overflow-hidden border-2 border-[#3B387E] shadow-sm bg-white">
            <div className="h-72 md:h-80 bg-[#FFF6EA] flex items-center justify-center p-4">
              {current.front_image_url ? (
                <img src={transformImageUrl(current.front_image_url)} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <p className="text-sm text-gray-400 italic">Tanpa gambar</p>
              )}
            </div>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 border-2 ${secondsLeft <= 10 ? "bg-red-50 border-red-400" : "bg-[#FED777] border-[#3B387E]"}`}>
              <Clock className={`w-4 h-4 ${secondsLeft <= 10 ? "text-red-500" : "text-[#3B387E]"}`} />
              <span className={`font-mono font-bold text-base ${secondsLeft <= 10 ? "text-red-500" : "text-[#3B387E]"}`}>{mmss}</span>
            </div>
            <button
              onClick={() => setPhase("question")}
              className="flex-1 py-3 rounded-full font-bold text-sm text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm bg-[#3B387E] hover:bg-[#2e2a66]"
            >
              Sudah Siap Menjawab
            </button>
          </div>
        </div>
      )}

      {/* 4) Pertanyaan */}
      {phase === "question" && current && (
        <div className="w-full max-w-sm space-y-3">
          {current.options.map((opt, oi) => {
            const letter = String.fromCharCode(65 + oi);
            let cls = "bg-white border-[#3B387E] hover:border-[#3B387E] hover:bg-[#FFF6EA] text-[#3B387E]";
            if (selected) {
              if (opt === current.correct_answer) cls = "bg-emerald-50 border-emerald-400 text-emerald-700";
              else if (opt === selected) cls = "bg-red-50 border-red-300 text-red-600";
              else cls = "bg-white border-gray-200 opacity-60";
            }
            return (
              <button
                key={oi}
                onClick={() => choose(opt)}
                disabled={!!selected}
                className={`w-full flex items-center gap-3 border-2 rounded-xl px-4 py-3 text-left transition-all ${cls}`}
              >
                <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold flex items-center justify-center shrink-0">{letter}</span>
                <span className="text-sm font-semibold flex-1">{opt}</span>
                {selected && opt === current.correct_answer && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                {selected && opt === selected && opt !== current.correct_answer && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
              </button>
            );
          })}

          {selected && (
            <div className="mt-4">
              <div className={`rounded-xl p-4 border ${selected === current.correct_answer ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                <p className={`text-sm font-bold ${selected === current.correct_answer ? "text-emerald-700" : "text-red-600"}`}>
                  {selected === current.correct_answer ? "Benar!" : "Kurang tepat"}
                </p>
                <p className="text-xs text-[#3B387E]/70 mt-1">Jawaban benar: <span className="font-bold">{current.correct_answer}</span></p>
                {current.explanation && <p className="text-xs text-gray-500 mt-2">{current.explanation}</p>}
              </div>
              <button
                onClick={nextRound}
                className="mt-4 w-full py-3 rounded-full font-bold text-sm text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm bg-[#3B387E] hover:bg-[#2e2a66]"
              >
                {remaining.length - 1 <= 0 ? "Lihat Hasil" : "Kartu Berikutnya"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5) Hasil */}
      {phase === "done" && (
        <div className="w-full max-w-md bg-white rounded-[28px] border-2 border-[#3B387E] shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">{score === cards.length ? "🏆" : score >= cards.length / 2 ? "🎉" : "💪"}</div>
          <h2 className="text-2xl font-black font-poppins text-[#3B387E] mb-2">Selesai!</h2>
          <p className="text-sm text-[#3B387E]/70 mb-6">
            Kamu menjawab <span className="font-bold text-[#3B387E]">{score}</span> dari <span className="font-bold text-[#3B387E]">{cards.length}</span> kartu dengan benar.
          </p>
          <button
            onClick={restart}
            className="w-full py-3 rounded-full font-bold text-sm text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm bg-[#3B387E] hover:bg-[#2e2a66]"
          >
            Main Lagi
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes fc-riffle {
          0% {
            transform: rotate(0deg) translate(0, 0) scale(1);
            z-index: 1;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.12));
          }
          18% {
            transform: rotate(var(--fc-rot)) translate(var(--fc-x), calc(var(--fc-raise) * -1)) scale(1.06);
            z-index: 3;
            filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.22));
          }
          38% {
            transform: rotate(calc(var(--fc-rot) * -0.9)) translate(calc(var(--fc-x) * -0.8), calc(var(--fc-raise) * 0.9)) scale(0.97);
            z-index: 1;
            filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.1));
          }
          58% {
            transform: rotate(calc(var(--fc-rot) * 0.55)) translate(calc(var(--fc-x) * 0.5), calc(var(--fc-raise) * -0.6)) scale(1.03);
            z-index: 3;
            filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.18));
          }
          78% {
            transform: rotate(calc(var(--fc-rot) * -0.35)) translate(calc(var(--fc-x) * -0.25), calc(var(--fc-raise) * 0.4)) scale(0.98);
            z-index: 2;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.12));
          }
          100% {
            transform: rotate(0deg) translate(0, 0) scale(1);
            z-index: 1;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.12));
          }
        }
      `}</style>
    </div>
  );
}

function InteractiveFindWord({
  settings, findWords, fwSel, setFwSel, fwFound, setFwFound, fwDone, setFwDone, fwWrong, setFwWrong,
}: {
  settings: Record<string, unknown>;
  findWords: FindWord[];
  fwSel: { row: number; col: number } | null;
  setFwSel: (v: { row: number; col: number } | null) => void;
  fwFound: Set<string>;
  setFwFound: (fn: (prev: Set<string>) => Set<string>) => void;
  fwDone: boolean;
  setFwDone: (v: boolean) => void;
  fwWrong: string | null;
  setFwWrong: (v: string | null) => void;
}) {
  const gw = (settings.grid_width as number) || 10;
  const gh = (settings.grid_height as number) || 10;
  const grid = useMemo(() => buildRandomFillGrid(gw, gh, findWords), [gw, gh, findWords]);

  function getWordCells(fw: FindWord): { row: number; col: number }[] {
    const cells: { row: number; col: number }[] = [];
    for (let i = 0; i < fw.answer.length; i++) {
      cells.push({
        row: fw.direction === "across" ? fw.row : fw.row + i,
        col: fw.direction === "across" ? fw.col + i : fw.col,
      });
    }
    return cells;
  }

  function extractWord(start: { row: number; col: number }, end: { row: number; col: number }): string {
    const chars: string[] = [];
    if (start.row === end.row) {
      const minC = Math.min(start.col, end.col);
      const maxC = Math.max(start.col, end.col);
      for (let c = minC; c <= maxC; c++) chars.push(grid[start.row][c].char);
    } else if (start.col === end.col) {
      const minR = Math.min(start.row, end.row);
      const maxR = Math.max(start.row, end.row);
      for (let r = minR; r <= maxR; r++) chars.push(grid[r][start.col].char);
    }
    return chars.join("");
  }

  function checkSelection(start: { row: number; col: number }, end: { row: number; col: number }) {
    const word = extractWord(start, end);
    for (const fw of findWords) {
      if (fwFound.has(fw.id)) continue;
      if (fw.answer.toUpperCase() !== word) continue;
      const cells = getWordCells(fw);
      const first = cells[0];
      const last = cells[cells.length - 1];
      if (
        (start.row === first.row && start.col === first.col && end.row === last.row && end.col === last.col) ||
        (start.row === last.row && start.col === last.col && end.row === first.row && end.col === first.col)
      ) {
        const next = new Set(fwFound);
        next.add(fw.id);
        setFwFound(() => next);
        setFwSel(null);
        if (next.size === findWords.length) setFwDone(true);
        return;
      }
    }
    // Wrong selection
    setFwWrong(word);
    setTimeout(() => setFwWrong(null), 2500);
  }

  function handleCellClick(ri: number, ci: number) {
    if (!fwSel) {
      setFwSel({ row: ri, col: ci });
      return;
    }
    if (fwSel.row === ri && fwSel.col === ci) {
      setFwSel(null);
      return;
    }
    if (fwSel.row === ri || fwSel.col === ci) {
      checkSelection(fwSel, { row: ri, col: ci });
    }
    setFwSel({ row: ri, col: ci });
  }

  const foundCellSet = new Set<string>();
  for (const fw of findWords) {
    if (!fwFound.has(fw.id)) continue;
    for (const c of getWordCells(fw)) {
      if (c.row >= 0 && c.row < gh && c.col >= 0 && c.col < gw) {
        foundCellSet.add(`${c.row},${c.col}`);
      }
    }
  }

  // Example: first word in the list
  const exampleWord = findWords.length > 0 ? findWords[0] : null;
  const exampleCells = exampleWord ? getWordCells(exampleWord) : [];
  const exampleStart = exampleCells.length > 0 ? exampleCells[0] : null;
  const exampleEnd = exampleCells.length > 0 ? exampleCells[exampleCells.length - 1] : null;

  const allFound = findWords.length > 0 && fwFound.size === findWords.length;

  return (
    <div className="space-y-6">
      {/* Tutorial */}
      <div className="bg-[#FFF6EA] border-2 border-[#3B387E] rounded-3xl p-4 text-sm text-[#3B387E]/80 leading-relaxed">
        <p className="font-extrabold font-poppins text-[#3B387E] mb-1">Cara Bermain</p>
        <p>Klik huruf <strong>pertama</strong> dan huruf <strong>terakhir</strong> dari kata jawaban (satu baris / satu kolom). Jika benar, kata akan menyala hijau.</p>
        {exampleWord && exampleStart && exampleEnd && (
          <p className="text-xs text-[#3B387E]/60 mt-2">
            Contoh: klik             huruf <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#FED777] border-2 border-[#3B387E] text-[9px] font-bold text-[#3B387E] mx-0.5">{grid[exampleStart.row]?.[exampleStart.col]?.char || "?"}</span> lalu
            huruf <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#FED777] border-2 border-[#3B387E] text-[9px] font-bold text-[#3B387E] mx-0.5">{grid[exampleEnd.row]?.[exampleEnd.col]?.char || "?"}</span>
            {" "}untuk menjawab &ldquo;{exampleWord.question}&rdquo;
          </p>
        )}
      </div>

      <div className="w-full max-w-full overflow-x-auto">
        <div
          className="inline-grid gap-[2px] bg-[#3B387E] rounded-2xl p-2 shadow-sm border-2 border-[#3B387E]"
          style={{ gridTemplateColumns: `repeat(${gw}, 28px)` }}
        >
          {grid.map((row, ri) =>
            row.map((cell, ci) => {
              const isFound = foundCellSet.has(`${ri},${ci}`);
              const isSel = fwSel?.row === ri && fwSel?.col === ci;
              const isExampleStart = exampleStart?.row === ri && exampleStart?.col === ci && !isFound;
              const isExampleEnd = exampleEnd?.row === ri && exampleEnd?.col === ci && !isFound;
              let cls = "border-[#3B387E]/20 bg-white text-[#3B387E]";
              if (isFound) cls = "border-emerald-500 bg-emerald-100 text-emerald-700 font-bold";
              else if (isSel) cls = "border-[#3B387E] bg-[#FED777] text-[#3B387E] font-bold ring-2 ring-[#FED777]";
              else if (isExampleStart || isExampleEnd) cls = "border-[#3B387E] bg-[#FED777]/40 text-[#3B387E] font-bold ring-2 ring-[#FED777]";
              return (
                <button
                  key={`${ri}_${ci}`}
                  className={`w-7 h-7 border text-[10px] font-bold uppercase flex items-center justify-center transition-colors cursor-pointer ${cls}`}
                  onClick={() => handleCellClick(ri, ci)}
                >
                  {cell.char}
                </button>
              );
            })
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Grid {gw}×{gh}</p>
      </div>
      <p className="text-sm text-[#3B387E]/70 font-bold">
        Kata yang harus ditemukan: {fwFound.size}/{findWords.length}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {findWords.map((fw) => {
          const found = fwFound.has(fw.id);
          return (
            <div key={fw.id} className={`rounded-2xl p-4 border-2 ${found ? "bg-emerald-50 border-emerald-400" : "bg-white border-[#3B387E]"}`}>
              <div className="flex items-start gap-2">
                <span className={`text-xs font-bold w-5 shrink-0 mt-0.5 ${found ? "text-emerald-600" : "text-[#3B387E]/50"}`}>{fw.direction === "across" ? "→" : "↓"}</span>
                <p className={`text-sm font-bold flex-1 ${found ? "text-emerald-700 line-through decoration-emerald-300" : "text-[#3B387E]"}`}>{fw.question}</p>
                {found && <span className="text-emerald-500 text-sm shrink-0 mt-0.5">✓</span>}
              </div>
              {found && (
                <p className="text-xs font-bold text-[#3B387E] mt-1 ml-7">Jawaban: <span className="uppercase">{fw.answer}</span></p>
              )}
              {fw.explanation && <p className="text-xs text-gray-400 mt-1 ml-7">{fw.explanation}</p>}
            </div>
          );
        })}
      </div>
      {fwWrong && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-5 py-3 rounded-full border-2 border-[#3B387E] shadow-sm text-sm font-bold max-w-xs text-center" style={{ animation: "fade-in 0.3s ease-out" }}>
          &ldquo;{fwWrong}&rdquo; bukanlah jawaban yang tepat
        </div>
      )}
      {fwDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] border-2 border-[#3B387E] p-8 text-center max-w-lg mx-4 shadow-sm w-full" style={{ animation: "fade-in 0.4s ease-out" }}>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-black font-poppins text-[#3B387E] mb-2">Semua Kata Ditemukan!</h2>
            <p className="text-sm text-[#3B387E]/70 mb-6">Semua jawaban telah berhasil ditemukan dalam grid.</p>
            <div className="text-left space-y-4 mb-6 max-h-60 overflow-y-auto">
              {findWords.map((fw) => (
                <div key={fw.id} className="bg-[#FFF6EA] rounded-2xl p-3 border-2 border-[#3B387E]">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-[#3B387E]/50 w-4 shrink-0 mt-0.5">{fw.direction === "across" ? "→" : "↓"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#3B387E]">{fw.question}</p>
                      <p className="text-xs font-bold text-emerald-600 uppercase mt-0.5">{fw.answer}</p>
                      {fw.explanation && <p className="text-xs text-gray-400 mt-1">{fw.explanation}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setFwDone(false)}
              className="w-full py-3 rounded-full font-bold text-sm text-white transition-all duration-200 bg-[#3B387E] hover:bg-[#2e2a66]"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
