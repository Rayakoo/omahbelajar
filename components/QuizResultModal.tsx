"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { id, en } from "@/data/translations";

interface QuizResultModalProps {
  isOpen: boolean;
  status: "correct" | "wrong";
  onNext: () => void;
  isLast: boolean;
  question?: string;
  selectedAnswer?: string;
  correctAnswer?: string;
  explanation?: string | null;
}

export default function QuizResultModal({ isOpen, status, onNext, isLast, question, selectedAnswer, correctAnswer, explanation }: QuizResultModalProps) {
  const { locale } = useLanguage();
  const t = locale === "id" ? id.omahBelajar : en.omahBelajar;
  const common = locale === "id" ? id.common : en.common;

  if (!isOpen) return null;

  const isCorrect = status === "correct";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
        className={`w-full max-w-md rounded-[28px] p-6 md:p-8 flex flex-col items-center text-center shadow-sm border-2 border-[#3B387E] font-poppins ${
          isCorrect
            ? "bg-white"
            : "bg-white"
        }`}
      >
        <div className={`mb-4 w-20 h-20 rounded-full flex items-center justify-center border-2 ${
          isCorrect ? "bg-[#83F3BA] border-[#3B387E]" : "bg-rose-100 border-[#3B387E]"
        }`}>
          {isCorrect ? (
            <CheckCircle2 className="w-10 h-10 text-[#3B387E] stroke-[2]" />
          ) : (
            <XCircle className="w-10 h-10 text-rose-500 stroke-[2]" />
          )}
        </div>

        <h3 className={`text-xl font-black tracking-wide mb-3 ${
          isCorrect ? "text-emerald-600" : "text-rose-500"
        }`}>
          {isCorrect ? t.kamuBenar : t.kurangTepat}
        </h3>

        {question && (
          <div className="w-full bg-[#FFF6EA] rounded-2xl p-3 mb-4 text-left border-2 border-[#3B387E]/15">
            <p className="text-xs font-semibold text-[#3B387E]/60 mb-1">{t.soalCounter.replace("{current}", "").replace("{total}", "").trim()}</p>
            <p className="text-sm font-bold text-black leading-snug">{question}</p>
          </div>
        )}

        <div className="w-full flex flex-col gap-2 mb-5">
          {selectedAnswer && (
            <div className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium border-2 ${
              isCorrect
                ? "bg-emerald-100/80 text-emerald-800 border-emerald-200"
                : "bg-rose-100/80 text-rose-800 border-rose-200"
            }`}>
              <span>{t.jawabanMu || "Jawabanmu"}:</span>
              <span className="font-bold">{selectedAnswer}</span>
            </div>
          )}
          {!isCorrect && correctAnswer && (
            <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium bg-emerald-100/80 text-emerald-800 border-2 border-emerald-200">
              <span>{t.jawabanBenar}:</span>
              <span className="font-bold">{correctAnswer}</span>
            </div>
          )}
        </div>

        {explanation && (
          <div className={`w-full rounded-2xl p-4 mb-5 text-left border-2 ${
            isCorrect ? "bg-[#FFF6EA] border-emerald-200" : "bg-[#FFF6EA] border-[#3B387E]/15"
          }`}>
            <p className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 mb-1.5 ${
              isCorrect ? "text-emerald-600" : "text-[#3B387E]"
            }`}>
              <Lightbulb className="w-3.5 h-3.5" /> {t.penjelasanJawaban}
            </p>
            <p className="text-sm font-medium text-black/80 leading-relaxed whitespace-pre-line">{explanation}</p>
          </div>
        )}

        <button
          onClick={onNext}
          className={`text-xs font-bold px-8 py-3 rounded-full transition-all active:scale-95 shadow-sm ${
            isLast
              ? "bg-emerald-600 text-white hover:bg-emerald-500"
              : "bg-[#3B387E] text-white hover:bg-[#2e2a66]"
          }`}
        >
          {isLast ? t.selesaiBtn : t.selanjutnya}
        </button>
      </motion.div>
    </div>
  );
}
