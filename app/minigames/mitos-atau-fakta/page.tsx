"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Sparkles, Clock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { MITOS_FAKTA_QUESTIONS, type MitosFaktaQuestion } from "@/data/mitosFaktaQuestions";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";
import PlayerNamePrompt from "@/components/PlayerNamePrompt";
import { usePlayerName } from "@/contexts/PlayerNameContext";
import { saveMinigameResult } from "@/services/minigames";

type AnswerType = "MITOS" | "FAKTA";
type GamePhase = "welcome" | "playing" | "finished";

const TIME_LIMIT = 20;

const CATEGORY_ICONS: Record<string, string> = {
  "Stigma & Victim Blaming": "\u{1F6E1}\uFE0F",
  "Kerahasiaan & Keamanan Data": "\u{1F510}",
  "Hak Korban & Akses Layanan": "\u{2696}\uFE0F",
  "Peran Pendamping & Komunitas": "\u{1F91D}",
  "Sistem Digital & Fitur Tracking": "\u{1F4BB}",
  "Bentuk Kekerasan Seksual": "\u{1F4D6}",
};

function getScoreMessage(pct: number, t: any) {
  if (pct === 100) return { emoji: "\u{1F31F}", title: t.sempurna, sub: "Kamu memahami semua topik dengan sangat baik." };
  if (pct >= 80) return { emoji: "\u{1F389}", title: t.luarBiasa, sub: "Pemahaman kamu tentang pelaporan digital sangat baik." };
  if (pct >= 60) return { emoji: "\u{1F44D}", title: t.bagus, sub: "Terus tingkatkan pemahamanmu tentang hak korban." };
  if (pct >= 40) return { emoji: "\u{1F4DA}", title: t.terusBelajar, sub: "Baca kembali penjelasan untuk memperdalam pemahaman." };
  return { emoji: "\u{1F4AA}", title: t.janganMenyerah, sub: "Setiap langkah belajar adalah kemajuan yang berarti." };
}

export default function MitosAtauFaktaPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = locale === "id" ? id.mitosFakta : en.mitosFakta;
  const common = locale === "id" ? id.common : en.common;
  const min = locale === "id" ? id.minigames : en.minigames;
  const { playerName } = usePlayerName();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [phase, setPhase] = useState<GamePhase>("welcome");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownKey, setCountdownKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerType[]>([]);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<AnswerType | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [animClass, setAnimClass] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isTimeout, setIsTimeout] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  const questions = MITOS_FAKTA_QUESTIONS;
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

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
      setCurrentIndex(0);
      setAnswers(new Array(totalQuestions).fill(null));
      setScore(0);
      setSelected(null);
      setRevealed(false);
      setTimeLeft(TIME_LIMIT);
      setIsTimeout(false);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 800);
    return () => clearTimeout(t);
  }, [countdown, totalQuestions]);

  const handleAnswer = useCallback((choice: AnswerType | null) => {
    if (revealed) return;
    const isTimeoutAnswer = choice === null;
    const correct = !isTimeoutAnswer && choice === currentQuestion.answer;
    setSelected(choice);
    setIsCorrect(correct);
    setIsTimeout(isTimeoutAnswer);
    if (isTimeoutAnswer) {
      setAnimClass("animate-[pulse_0.5s_ease-in-out]");
      setTimeout(() => {
        setRevealed(true);
        setTimeout(() => setShowExplanation(true), 200);
      }, 300);
    } else {
      setAnimClass(correct ? "scale-[1.03]" : "animate-[wiggle_0.4s_ease-in-out]");
      setTimeout(() => setAnimClass(""), 500);
      setTimeout(() => {
        setRevealed(true);
        if (correct) setScore((s) => s + 1);
        setTimeout(() => setShowExplanation(true), 200);
      }, 350);
    }
  }, [revealed, currentQuestion]);

  const handleNext = useCallback(() => {
    if (selected === null) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = selected;
    const correctCount = newAnswers.reduce((acc, a, i) => {
      if (a === questions[i]?.answer) return acc + 1;
      return acc;
    }, 0);

    if (currentIndex >= totalQuestions - 1) {
      const wrong = totalQuestions - correctCount;
      const timeMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      saveMinigameResult({
        player_name: playerName || "Unknown",
        minigame: "mitos-atau-fakta",
        score: correctCount,
        total: totalQuestions,
        time_ms: timeMs,
        wrong,
      });
      setPhase("finished");
      if (correctCount / totalQuestions >= 0.6) {
        setTimeout(() => setShowConfetti(true), 500);
      }
      return;
    }

    setScore(correctCount);
    setAnswers(newAnswers);
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
    setShowExplanation(false);
    setTimeLeft(TIME_LIMIT);
    setIsTimeout(false);
  }, [currentIndex, totalQuestions, answers, selected, questions, playerName]);

  // Timer
  useEffect(() => {
    if (phase !== "playing" || revealed) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, revealed, currentIndex]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  // Timer color
  const timerPct = timeLeft / TIME_LIMIT;
  const timerColor =
    timerPct > 0.5
      ? "#3B387E"
      : timerPct > 0.25
        ? "#FFA756"
        : "#FB7185";
  const timerBg = timerPct > 0.5 ? "#DCD5FE" : timerPct > 0.25 ? "#FED777" : "rgba(251,113,133,0.2)";
  const timerPulse = timerPct <= 0.25 ? "animate-[timer-pulse_1s_ease-in-out_infinite]" : "";
  const circumference = 188;
  const offset = circumference - timerPct * circumference;

  if (showNamePrompt) {
    return <PlayerNamePrompt onStart={handleNameConfirm} />;
  }

  if (countdown !== null) {
    return <CountdownOverlay value={countdown} key={countdownKey} />;
  }

  if (phase === "welcome") {
    return <WelcomeScreen questions={questions} onStart={handleStart} onBack={() => router.back()} />;
  }

  if (phase === "finished") {
    const allAnswers = [...answers];
    if (selected !== null) allAnswers[currentIndex] = selected;
    const finalScore = allAnswers.reduce((acc, a, i) => {
      if (a === questions[i]?.answer) return acc + 1;
      return acc;
    }, 0);
    return (
      <ResultScreen
        questions={questions}
        answers={allAnswers}
        score={finalScore}
        showConfetti={showConfetti}
        onRestart={handleStart}
        onBack={() => router.push("/minigames")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF6EA] font-sans antialiased text-[#3B387E] flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#DCD5FE]/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#FED777]/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-[#DCD5FE]/20 blur-3xl" />
      </div>

      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-2 h-2 rounded-full bg-[#3B387E]/20 animate-[float_6s_ease-in-out_infinite]" style={{ top: "15%", left: "10%" }} />
        <div className="absolute w-3 h-3 rounded-full bg-[#FED777]/20 animate-[float_8s_ease-in-out_infinite_1s]" style={{ top: "25%", right: "15%" }} />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-[#3B387E]/15 animate-[float_7s_ease-in-out_infinite_2s]" style={{ bottom: "30%", left: "20%" }} />
        <div className="absolute w-2.5 h-2.5 rounded-full bg-rose-300/20 animate-[float_9s_ease-in-out_infinite_0.5s]" style={{ bottom: "20%", right: "10%" }} />
      </div>

      {/* Header */}
      <div className="bg-white border-b-2 border-[#3B387E] relative">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-[#3B387E] hover:text-[#3B387E] transition-colors">
              <ArrowLeft className="w-4 h-4" /> {common.back}
            </button>
            <span className="text-xs text-[#3B387E]/60 font-medium">
              {t.soal} {currentIndex + 1} / {totalQuestions}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-[#DCD5FE] border border-[#3B387E]/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out bg-[#3B387E]"
              style={{
                width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
              }}
            />
          </div>

          {/* Dots */}
          <div className="flex gap-1 mt-1.5 justify-center">
            {Array.from({ length: totalQuestions }, (_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-500"
                style={{
                  width: i <= currentIndex ? "14px" : "5px",
                  height: "5px",
                  background: i <= currentIndex
                    ? "#3B387E"
                    : "#DCD5FE",
                }}
              />
            ))}
          </div>

          {/* Timer & Category row */}
          <div className="flex items-center justify-between mt-3">
            {/* Category */}
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border-2 border-[#3B387E] transition-all duration-500"
                style={{
                  background: timerBg,
                  color: "#3B387E",
                }}
              >
                <span>{CATEGORY_ICONS[currentQuestion.category] || "\u{1F4CC}"}</span>
                {currentQuestion.category}
              </span>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 transition-all duration-500 ${timerPulse}`}>
              <svg width="36" height="36" viewBox="0 0 64 64" className="transform -rotate-90">
                <circle cx="32" cy="32" r="30" fill="none" stroke={timerBg} strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="30" fill="none"
                  stroke={timerColor} strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: offset,
                    transition: "stroke-dashoffset 1s linear, stroke 0.5s ease",
                  }}
                />
              </svg>
              <span
                className="text-sm font-bold tabular-nums transition-colors duration-500"
                style={{ color: timerColor }}
              >
                {timeLeft}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8 relative z-10">
        <div className="w-full max-w-2xl mx-auto mt-16">
          {/* Question card */}
          <div
            className="bg-white rounded-[28px] border-2 border-[#3B387E] shadow-sm p-6 md:p-8 mb-4 relative overflow-hidden transition-all duration-500"
          >
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.06] pointer-events-none">
              <Sparkles className="w-full h-full text-[#3B387E]" />
            </div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-[#FED777]/50 pointer-events-none" />

            {/* Question number badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#3B387E] text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-4">
              <span className="text-[#FED777]">#{currentIndex + 1}</span>
            </div>

            <p className="text-lg md:text-xl font-extrabold font-poppins text-[#3B387E] leading-relaxed relative z-10">
              &ldquo;{currentQuestion.statement}&rdquo;
            </p>

            {/* Timer urgency indicator */}
            {timerPct <= 0.25 && !revealed && (
              <div className="absolute top-3 right-3 flex items-center gap-1 text-rose-500 text-[10px] font-bold animate-[pulse_1s_ease-in-out_infinite]">
                <AlertTriangle className="w-3 h-3" /> {t.cepat}
              </div>
            )}
          </div>

          {/* Answer buttons */}
          <div className={`grid grid-cols-2 transition-all duration-300 ${revealed ? "gap-2 mb-0" : "gap-6 mb-6"}`}>
            {(["MITOS", "FAKTA"] as const).map((choice) => {
              const isMitos = choice === "MITOS";
              const isSelected = selected === choice;
              const isRevealedCorrect = revealed && choice === currentQuestion.answer;

              let btnStyle = "";
              if (isTimeout && !isSelected) {
                btnStyle = isMitos
                  ? "border-2 border-[#3B387E] bg-white/50 text-[#3B387E]/40"
                  : "border-2 border-[#3B387E] bg-white/50 text-[#3B387E]/40";
              } else if (!revealed) {
                btnStyle = isMitos
                  ? "border-2 border-[#3B387E] bg-[#FFA756]/30 text-[#3B387E] hover:bg-[#FFA756]/60 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                  : "border-2 border-[#3B387E] bg-[#83F3BA]/30 text-[#3B387E] hover:bg-[#83F3BA]/60 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer";
              } else if (isRevealedCorrect) {
                btnStyle = isMitos
                  ? "border-2 border-[#3B387E] bg-[#FFA756] text-[#3B387E]"
                  : "border-2 border-[#3B387E] bg-[#83F3BA] text-[#3B387E]";
              } else if (isSelected && !isCorrect) {
                btnStyle = "border-2 border-[#3B387E] bg-rose-200 text-[#3B387E]";
              } else {
                btnStyle = "border-2 border-[#3B387E]/30 bg-white/50 text-[#3B387E]/40 opacity-60";
              }

              const disableClick = revealed || (timeLeft === 0 && !revealed);

              return (
                <button
                  key={choice}
                  onClick={() => handleAnswer(choice)}
                  disabled={disableClick}
                  className={`relative rounded-3xl border-2 text-center font-bold transition-all duration-300 ${btnStyle} ${animClass} disabled:cursor-default select-none ${
                    revealed ? "p-3" : "py-20 px-4"
                  }`}
                >
                  {/* Hover shimmer */}
                  {!revealed && (
                    <div className="absolute inset-0 rounded-3xl pointer-events-none" />
                  )}

                  <div className={`relative z-10 transition-all duration-300 ${revealed ? "text-base" : "text-5xl mb-2"}`}>
                    {revealed
                      ? isRevealedCorrect
                        ? "\u2705"
                        : isSelected
                          ? "\u274C"
                          : isMitos
                            ? "\u26A0\uFE0F"
                            : "\u{1F4A1}"
                      : isTimeout
                        ? "\u23F3"
                        : isMitos
                          ? "\u{1F6AB}"
                          : "\u2714\uFE0F"}
                  </div>
                  <span className={`relative z-10 transition-all duration-300 ${
                    revealed ? "text-xs" : "text-3xl font-extrabold"
                  }`}>
                    {revealed && isRevealedCorrect ? "\u2714\uFE0F " + t.benar : choice}
                  </span>
                  {isTimeout && !revealed && (
                    <div className="absolute inset-0 flex items-center justify-center text-rose-500/20">
                      <Clock className="w-16 h-16" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Timer warning bar */}
          {timerPct <= 0.25 && !revealed && (
            <div className="flex items-center justify-center gap-2 mb-3 animate-[fade-in_0.3s_ease-out]">
              <div className="h-1 flex-1 max-w-xs rounded-full bg-rose-200 overflow-hidden">
                <div className="h-full rounded-full bg-rose-500 animate-[timer-shrink_1s_linear_infinite]" style={{ width: `${timerPct * 100}%` }} />
              </div>
            </div>
          )}

          {/* Explanation */}
          <div
            className="mt-3"
            style={{
              maxHeight: showExplanation ? "600px" : "0",
              overflow: "hidden",
              transition: "max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div
              className="bg-white rounded-[28px] border-2 border-[#3B387E] shadow-sm p-5 mb-4"
              style={{
                opacity: showExplanation ? 1 : 0,
                transform: showExplanation ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.4s ease 0.1s",
              }}
            >
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-[#3B387E] text-xs font-bold mb-3 ${
                isTimeout
                  ? "bg-[#FED777] text-[#3B387E]"
                  : isCorrect
                    ? "bg-[#83F3BA] text-[#3B387E]"
                    : "bg-[#FFA756] text-[#3B387E]"
              }`}>
                {isTimeout
                  ? "\u23F3 " + t.waktuHabis
                  : isCorrect
                    ? "\u{1F389} " + t.benar
                    : "\u{1F4CC} " + t.jawabannya + " " + currentQuestion.answer}
              </div>

              <p className="text-sm text-[#3B387E]/80 leading-relaxed mb-4">
                {currentQuestion.explanation}
              </p>

              <div className="bg-[#FFF6EA] rounded-2xl p-4 border-2 border-[#3B387E]">
                <div className="flex items-start gap-2">
                  <span className="text-[#3B387E] text-sm flex-shrink-0 mt-0.5">💡</span>
                  <div>
                    <div className="text-[#3B387E] text-xs font-bold uppercase tracking-wider mb-1">
                      {t.pesanKunci}
                    </div>
                    <p className="text-sm text-[#3B387E]/80 leading-relaxed">
                      {currentQuestion.keyMessage}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-full font-bold text-sm text-white bg-[#3B387E] hover:bg-[#2e2a66] transition-colors shadow-sm"
              style={{
                opacity: showExplanation ? 1 : 0,
                transform: showExplanation ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.4s ease 0.3s",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                {currentIndex === totalQuestions - 1 ? "\u{1F3C6} " + t.lihatHasil : t.lanjut + " \u2192"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({
  questions,
  onStart,
  onBack,
}: {
  questions: MitosFaktaQuestion[];
  onStart: () => void;
  onBack: () => void;
}) {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.mitosFakta : en.mitosFakta;
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
            <span className="text-[#E0BA24]">{t.mitos}</span>{" "}
            <span className="text-black">atau</span>{" "}
            <span className="text-[#E0BA24]">{t.fakta}</span>
            <span className="text-black">?</span>
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
                { icon: "📋", label: `${questions.length} ${t.soal}`, sub: t.pertanyaan },
                { icon: "🎯", label: t.tipeJawaban, sub: t.tipeJawabanSub },
                { icon: "📚", label: t.edukatif, sub: t.penjelasanLengkap },
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
                {t.notice}
              </p>
            </div>

            {/* Info timer */}
            <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
              <Clock className="w-3.5 h-3.5" />
              <span>{t.timerInfo} <strong className="text-black">{TIME_LIMIT} {t.detik}</strong></span>
            </div>

            {/* Tombol mulai */}
            <div>
              <button
                onClick={onStart}
                className="w-full inline-flex items-center justify-center space-x-3 bg-[#3B387E] hover:bg-[#2c2960] text-white font-black text-lg py-4 px-8 rounded-2xl transition shadow-md"
              >
                <span>{t.mulaiKuis}</span>
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
  questions,
  answers,
  score,
  showConfetti,
  onRestart,
  onBack,
}: {
  questions: MitosFaktaQuestion[];
  answers: (AnswerType | null)[];
  score: number;
  showConfetti: boolean;
  onRestart: () => void;
  onBack: () => void;
}) {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.mitosFakta : en.mitosFakta;
  const common = locale === "id" ? id.common : en.common;
  const min = locale === "id" ? id.minigames : en.minigames;
  const [animScore, setAnimScore] = useState(0);
  const [showItems, setShowItems] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const total = questions.length;
  const pct = Math.round((score / total) * 100);
  const msg = getScoreMessage(pct, t);

  useEffect(() => {
    const t1 = setTimeout(() => {
      let n = 0;
      const step = Math.max(1, score / 30);
      const interval = setInterval(() => {
        n = Math.min(n + step, score);
        setAnimScore(Math.round(n));
        if (n >= score) clearInterval(interval);
      }, 40);
    }, 300);
    const t2 = setTimeout(() => setShowItems(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [score]);

  const categoryStats = questions.reduce((acc, q, i) => {
    const cat = q.category;
    if (!acc[cat]) acc[cat] = { correct: 0, total: 0 };
    acc[cat].total++;
    if (answers[i] === q.answer) acc[cat].correct++;
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  return (
    <div className="min-h-screen bg-[#FFF6EA] font-sans antialiased text-[#3B387E] flex flex-col relative overflow-hidden">
      {showConfetti && <Confetti />}

      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#DCD5FE]/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#FED777]/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="bg-white border-b-2 border-[#3B387E] sticky top-16 z-30 relative">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#3B387E] hover:text-[#3B387E] transition-colors">
            <ArrowLeft className="w-4 h-4" /> {common.back} ke {min.badge}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-8 relative z-10">
        {/* Score hero */}
        <div className="text-center mb-8 animate-[fade-in_0.6s_ease-out]">
          <div className="inline-flex items-center justify-center relative mb-4">
            <svg width="140" height="140" viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#DCD5FE" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke="#3B387E" strokeWidth="6"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 283,
                  strokeDashoffset: 283 - (score / total) * 283,
                  transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl">{msg.emoji}</span>
              <span className="font-bold text-3xl text-[#3B387E] leading-none">{animScore}</span>
              <span className="text-[#3B387E]/60 text-xs">dari {total}</span>
            </div>
          </div>
          <h2 className="text-2xl font-black font-poppins text-[#3B387E] mb-1">{msg.title}</h2>
          <p className="text-sm text-[#3B387E]/60 max-w-xs mx-auto">{msg.sub}</p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-[#FED777] border-2 border-[#3B387E]">
            <span className="font-bold text-[#3B387E] text-lg">{pct}%</span>
            <span className="text-[#3B387E]/60 text-sm">{t.jawabanBenar}</span>
          </div>
        </div>

        {/* Category breakdown */}
        <div
          className="bg-white rounded-3xl border-2 border-[#3B387E] shadow-sm p-5 mb-6"
          style={{
            opacity: showItems ? 1 : 0,
            transform: showItems ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease",
          }}
        >
          <h3 className="font-semibold text-[#3B387E] mb-4 text-sm uppercase tracking-wider">
            {"\u{1F4CA}"} {t.performaKategori}
          </h3>
          <div className="space-y-3">
            {Object.entries(categoryStats).map(([cat, stat]) => {
              const catPct = (stat.correct / stat.total) * 100;
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#3B387E]/70 text-xs">{cat}</span>
                    <span className={`text-xs font-semibold ${
                      catPct === 100 ? "text-emerald-600" : catPct >= 50 ? "text-[#3B387E]" : "text-rose-600"
                    }`}>
                      {stat.correct}/{stat.total}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#DCD5FE] border border-[#3B387E]/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 bg-[#3B387E]"
                      style={{ width: showItems ? `${catPct}%` : "0%", transitionDelay: "0.3s" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review */}
        <div
          style={{
            opacity: showItems ? 1 : 0,
            transform: showItems ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease 0.2s",
          }}
        >
          <h3 className="font-semibold text-[#3B387E] mb-3 text-sm uppercase tracking-wider px-1">
            {"\u{1F4CB}"} {t.reviewSemua}
          </h3>
          <div className="space-y-2 mb-8">
            {questions.map((q, i) => {
              const userAns = answers[i];
              const correct = userAns === q.answer;
              const isOpen = expandedId === q.id;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border-2 border-[#3B387E] overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : q.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#FFF6EA] transition-colors"
                  >
                    <span className="font-bold text-sm text-[#3B387E]/40 w-6 flex-shrink-0">{i + 1}</span>
                    <span className="text-base flex-shrink-0">{correct ? "\u2705" : "\u274C"}</span>
                    <span className="text-sm text-[#3B387E]/80 flex-1 truncate">{q.statement}</span>
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border-2 border-[#3B387E] ${
                      q.answer === "FAKTA"
                        ? "bg-[#83F3BA] text-[#3B387E]"
                        : "bg-[#FFA756] text-[#3B387E]"
                    }`}>
                      {q.answer}
                    </span>
                    <svg
                      width="16" height="16" viewBox="0 0 20 20" fill="currentColor"
                      className="text-[#3B387E]/30 flex-shrink-0 transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div style={{
                    maxHeight: isOpen ? "300px" : "0",
                    overflow: "hidden",
                    transition: "max-height 0.35s ease",
                  }}>
                    <div className="px-4 pb-4 border-t-2 border-[#3B387E]/10">
                      <p className="text-sm text-[#3B387E]/70 leading-relaxed mt-3">{q.explanation}</p>
                      <div className="bg-[#FFF6EA] rounded-2xl p-3 mt-3 border-2 border-[#3B387E]">
                        <p className="text-sm text-[#3B387E]/70 leading-relaxed">
                          <span className="text-[#3B387E] font-semibold">💡 </span>
                          {q.keyMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <button
            onClick={onRestart}
            className="w-full py-4 rounded-full font-bold text-sm text-white bg-[#3B387E] hover:bg-[#2e2a66] transition-colors shadow-sm"
          >
            <span className="flex items-center justify-center gap-2">
              {"\u{1F504}"} {t.ulangiKuis}
            </span>
          </button>
          <p className="text-center text-[#3B387E]/40 text-xs mt-4">
            {t.bagikan}
          </p>
        </div>
      </div>
    </div>
  );
}

function CountdownOverlay({ value }: { value: number }) {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.mitosFakta : en.mitosFakta;
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
